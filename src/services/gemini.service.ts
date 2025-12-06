import { Injectable, signal } from '@angular/core';
import { GoogleGenAI, Type, GenerateContentResponse } from '@google/genai';
import { UserProfile, WeeklyRoutine } from '../models';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI;
  private imageCache = new Map<string, string>();

  constructor() {
    // IMPORTANT: This relies on the environment variable being set.
    // In a real Applet environment, this should be securely provided.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error('API_KEY environment variable not set.');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateRoutine(profile: UserProfile): Promise<WeeklyRoutine> {
    const schema = {
      type: Type.OBJECT,
      properties: {
        workouts: {
          type: Type.ARRAY,
          description: 'List of daily workouts for the week.',
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.STRING, description: 'Day of the week, e.g., Lunes.' },
              focus: { type: Type.STRING, description: 'Main muscle group for the day, e.g., Tren Superior.' },
              exercises: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: 'Name of the exercise.' },
                    description: { type: Type.STRING, description: 'Brief, clear instructions on how to perform the exercise.' },
                    sets: { type: Type.INTEGER, description: 'Number of sets.' },
                    reps: { type: Type.STRING, description: 'Repetition range, e.g., "8-12".' },
                    image_prompt: { type: Type.STRING, description: "A concise, descriptive prompt in ENGLISH for an AI image generator. The prompt should request a minimalist 2D vector illustration of an exercise, like a fitness diagram. It should depict a person with a yellow shirt and blue shorts on a plain white background, showing both the start and end position of the movement to clearly demonstrate the exercise." }
                  },
                  required: ['name', 'description', 'sets', 'reps', 'image_prompt']
                }
              }
            },
            required: ['day', 'focus', 'exercises']
          }
        }
      },
      required: ['workouts']
    };

    const goalMap: Record<UserProfile['goal'], string> = {
      ganar_musculo: 'ganar masa muscular (hipertrofia)',
      perder_grasa: 'pérdida de grasa y definición muscular',
      mantenimiento: 'mantenimiento de la condición física y fuerza'
    };
    const userGoal = goalMap[profile.goal];

    const prompt = `Eres un entrenador personal de élite. Crea una rutina de gimnasio semanal personalizada para un usuario con nivel de experiencia '${profile.experience}', que puede entrenar ${profile.daysPerWeek} días a la semana. El objetivo principal del usuario es: ${userGoal}. Genera un plan de entrenamiento equilibrado y efectivo. Responde estrictamente con un objeto JSON que se adhiera al esquema proporcionado. El idioma para los nombres y descripciones de los ejercicios debe ser español. Los 'image_prompt' generados deben estar en inglés para el generador de imágenes.`;


    const response: GenerateContentResponse = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    try {
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as WeeklyRoutine;
    } catch(e) {
        console.error("Failed to parse Gemini response as JSON", e, response.text);
        throw new Error("The AI returned an invalid response. Please try again.");
    }
  }
  
  async generateExerciseImage(prompt: string): Promise<string> {
    if (this.imageCache.has(prompt)) {
      return this.imageCache.get(prompt)!;
    }

    const response = await this.ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    this.imageCache.set(prompt, base64ImageBytes);
    return base64ImageBytes;
  }
}
