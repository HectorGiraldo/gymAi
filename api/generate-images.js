export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // dynamic import to support ESM-only packages
    // Basic invocation log for debugging (do NOT log secret contents)
    console.log("generate-images invoked", {
      hasApiKey: !!process.env.API_KEY,
      nodeVersion: process.version,
    });

    // dynamic import to support ESM-only packages
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

    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { exerciseName } = body;

    if (!process.env.API_KEY) {
      return res
        .status(500)
        .json({ error: "API_KEY environment variable not set on server" });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const commonConfig = {
      numberOfImages: 1,
      outputMimeType: "image/jpeg",
      aspectRatio: "1:1",
    };

    const startPrompt = `Ilustración profesional de fitness, estilo vector limpio, mostrando la posición inicial de "${exerciseName}". Fondo blanco, enfoque anatómico.`;
    const endPrompt = `Ilustración profesional de fitness, estilo vector limpio, mostrando la posición final o el punto de máxima contracción de "${exerciseName}". Fondo blanco, enfoque anatómico.`;

    let startImageResponse, endImageResponse;
    try {
      [startImageResponse, endImageResponse] = await Promise.all([
        ai.models.generateImages({
          model: "imagen-4.0-generate-001",
          prompt: startPrompt,
          config: commonConfig,
        }),
        ai.models.generateImages({
          model: "imagen-4.0-generate-001",
          prompt: endPrompt,
          config: commonConfig,
        }),
      ]);
    } catch (sdkErr) {
      console.error("SDK generateImages error:", sdkErr);
      return res
        .status(500)
        .json({ error: "AI SDK error: " + (sdkErr && sdkErr.message) });
    }

    const startBase64 = startImageResponse.generatedImages[0].image.imageBytes;
    const endBase64 = endImageResponse.generatedImages[0].image.imageBytes;

    return res.status(200).json({
      start: `data:image/jpeg;base64,${startBase64}`,
      end: `data:image/jpeg;base64,${endBase64}`,
    });
  } catch (error) {
    console.error("Error in generate-images:", error);
    const message =
      (error && error.message) || String(error) || "Internal server error";
    return res.status(500).json({ error: message });
  }
}
