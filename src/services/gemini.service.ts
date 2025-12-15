import { Injectable } from "@angular/core";
import { Routine } from "../models/routine.model";

@Injectable({
  providedIn: "root",
})
export class GeminiService {
  constructor() {}

  async generateRoutine(
    days: string,
    experience: string,
    goal: string
  ): Promise<Routine> {
    // Call serverless endpoint that uses the private API key on the server
    try {
      const res = await fetch("/api/generate-routine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days, experience, goal }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Server error generating routine:", err);
        throw new Error("No se pudo generar la rutina. Inténtalo más tarde.");
      }

      const parsedResponse = (await res.json()) as Routine;

      if (
        !parsedResponse.weeklyRoutine ||
        !Array.isArray(parsedResponse.weeklyRoutine)
      ) {
        throw new Error("Invalid response structure from server.");
      }

      return parsedResponse as Routine;
    } catch (error) {
      console.error("Error generating routine (client):", error);
      throw new Error(
        "No se pudo generar la rutina. Por favor, inténtalo de nuevo."
      );
    }
  }

  async generateExerciseImages(
    exerciseName: string
  ): Promise<{ start: string; end: string }> {
    // Proxy image generation through serverless endpoint (keeps API key secret)
    try {
      const res = await fetch("/api/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseName }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Server error generating images:", err);
        throw new Error("No se pudieron generar las imágenes del ejercicio.");
      }

      const data = await res.json();
      return { start: data.start, end: data.end };
    } catch (error) {
      console.error("Error generating exercise images (client):", error);
      throw new Error("No se pudieron generar las imágenes del ejercicio.");
    }
  }
}
