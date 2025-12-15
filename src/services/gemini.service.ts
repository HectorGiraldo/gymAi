import { Injectable } from "@angular/core";
import { GoogleGenAI, Type } from "@google/genai";
import { Routine } from "../models/routine.model";

@Injectable({
  providedIn: "root",
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateRoutine(
    days: string,
    experience: string,
    goal: string
  ): Promise<Routine> {
    const prompt = `Crea una rutina de gimnasio para una persona con las siguientes características:
    - Días de entrenamiento por semana: ${days}
    - Nivel de experiencia: ${experience}
    - Objetivo principal: ${goal}
    
    La rutina debe estar bien balanceada. Para cada ejercicio, incluye nombre, series, repeticiones, descanso y una descripción detallada de la técnica correcta.
    IMPORTANTE: La respuesta debe contener exactamente ${days} días de entrenamiento. El array 'weeklyRoutine' debe tener una longitud de ${days}. Cada día de entrenamiento debe tener al menos un ejercicio. No generes días de descanso o días vacíos en la respuesta.`;

    const routineSchema = {
      type: Type.OBJECT,
      properties: {
        weeklyRoutine: {
          type: Type.ARRAY,
          description: "Array de rutinas diarias para la semana.",
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
                    description: {
                      type: Type.STRING,
                      description:
                        "Descripción detallada de la técnica del ejercicio.",
                    },
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

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction:
            "Eres un entrenador personal experto. Tu tarea es crear rutinas de gimnasio detalladas y efectivas. Responde ÚNICAMENTE con un objeto JSON válido que siga el esquema proporcionado. No incluyas texto introductorio, explicaciones o formato markdown como ```json.",
          responseMimeType: "application/json",
          responseSchema: routineSchema,
          temperature: 0.7,
        },
      });

      const jsonText = response.text.trim();
      const parsedResponse = JSON.parse(jsonText);

      if (
        !parsedResponse.weeklyRoutine ||
        !Array.isArray(parsedResponse.weeklyRoutine)
      ) {
        throw new Error("Invalid response structure from API.");
      }

      return parsedResponse as Routine;
    } catch (error) {
      console.error("Error generating routine:", error);
      throw new Error(
        "No se pudo generar la rutina. Por favor, inténtalo de nuevo."
      );
    }
  }

  async generateExerciseImages(
    exerciseName: string
  ): Promise<{ start: string; end: string }> {
    const commonConfig = {
      numberOfImages: 1,
      outputMimeType: "image/jpeg",
      aspectRatio: "1:1" as const,
    };

    const startPrompt = `Ilustración profesional de fitness, estilo vector limpio, mostrando la posición inicial de "${exerciseName}". Fondo blanco, enfoque anatómico.`;
    const endPrompt = `Ilustración profesional de fitness, estilo vector limpio, mostrando la posición final o el punto de máxima contracción de "${exerciseName}". Fondo blanco, enfoque anatómico.`;

    try {
      const [startImageResponse, endImageResponse] = await Promise.all([
        this.ai.models.generateImages({
          model: "imagen-4.0-generate-001",
          prompt: startPrompt,
          config: commonConfig,
        }),
        this.ai.models.generateImages({
          model: "imagen-4.0-generate-001",
          prompt: endPrompt,
          config: commonConfig,
        }),
      ]);

      const startBase64 =
        startImageResponse.generatedImages[0].image.imageBytes;
      const endBase64 = endImageResponse.generatedImages[0].image.imageBytes;

      return {
        start: `data:image/jpeg;base64,${startBase64}`,
        end: `data:image/jpeg;base64,${endBase64}`,
      };
    } catch (error) {
      console.error("Error generating exercise images:", error);
      throw new Error("No se pudieron generar las imágenes del ejercicio.");
    }
  }
}
