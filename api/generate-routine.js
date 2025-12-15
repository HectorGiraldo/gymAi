export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // dynamic import to support ESM-only packages and avoid require issues
    // Basic invocation log for debugging (do NOT log secret contents)
    console.log("generate-routine invoked", {
      hasApiKey: !!process.env.API_KEY,
      nodeVersion: process.version,
    });

    // dynamic import to support ESM-only packages and avoid require issues
    let genai;
    try {
      genai = await import("@google/genai");
    } catch (impErr) {
      console.error("Failed to import @google/genai", impErr);
      return res.status(500).json({
        error: "Failed to import @google/genai: " + (impErr && impErr.message),
      });
    }
    const GoogleGenAI =
      genai.GoogleGenAI || genai.default?.GoogleGenAI || genai.default;
    const Type = genai.Type || genai.default?.Type;

    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { days, experience, goal } = body;

    if (!process.env.API_KEY) {
      return res
        .status(500)
        .json({ error: "API_KEY environment variable not set on server" });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `Crea una rutina de gimnasio para una persona con las siguientes características:\n- Días de entrenamiento por semana: ${days}\n- Nivel de experiencia: ${experience}\n- Objetivo principal: ${goal}\n\nLa rutina debe estar bien balanceada. Para cada ejercicio, incluye nombre, series, repeticiones, descanso y una descripción detallada de la técnica correcta. IMPORTANTE: La respuesta debe contener exactamente ${days} días de entrenamiento. El array 'weeklyRoutine' debe tener una longitud de ${days}. Cada día de entrenamiento debe tener al menos un ejercicio. No generes días de descanso o días vacíos en la respuesta.`;

    const routineSchema = {
      type: Type.OBJECT,
      properties: {
        weeklyRoutine: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.STRING },
              focus: { type: Type.STRING },
              exercises: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    sets: { type: Type.STRING },
                    reps: { type: Type.STRING },
                    rest: { type: Type.STRING },
                    description: { type: Type.STRING },
                  },
                  required: ["name", "sets", "reps", "rest", "description"],
                },
              },
            },
            required: ["day", "focus", "exercises"],
          },
        },
      },
      required: ["weeklyRoutine"],
    };

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction:
            "Eres un entrenador personal experto. Responde ÚNICAMENTE con un objeto JSON válido que siga el esquema proporcionado.",
          responseMimeType: "application/json",
          responseSchema: routineSchema,
          temperature: 0.7,
        },
      });
    } catch (sdkErr) {
      console.error("SDK generateContent error:", sdkErr);
      return res
        .status(500)
        .json({ error: "AI SDK error: " + (sdkErr && sdkErr.message) });
    }

    const jsonText =
      response.text && response.text.trim
        ? response.text.trim()
        : JSON.stringify(response);
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err) {
      console.error("Failed to parse AI response as JSON:", jsonText, err);
      return res.status(500).json({ error: "Invalid response from AI" });
    }

    return res.status(200).json(parsed);
  } catch (error) {
    // Log full error server-side for Vercel logs
    console.error("Error in generate-routine:", error);
    // Return a helpful message to client for debugging (avoid leaking secrets)
    const message =
      (error && error.message) || String(error) || "Internal server error";
    return res.status(500).json({ error: message });
  }
}
