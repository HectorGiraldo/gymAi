
import { Injectable, signal } from '@angular/core';
import { Routine, HistoricRoutine } from '../models/routine.model';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private readonly STORAGE_KEY = 'gym-routine-history';
  history = signal<HistoricRoutine[]>(this.loadHistoryFromStorage());

  constructor() {
    // Persist history whenever it changes
    // effect(() => {
    //   localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.history()));
    // });
    // effect is not available in constructor. Let's save manually.
  }

  private loadHistoryFromStorage(): HistoricRoutine[] {
    try {
      const storedHistory = localStorage.getItem(this.STORAGE_KEY);
      return storedHistory ? JSON.parse(storedHistory) : [];
    } catch (e) {
      console.error("Error loading history from localStorage", e);
      return [];
    }
  }

  private saveHistoryToStorage(): void {
    try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.history()));
    } catch(e) {
        console.error("Error saving history to localStorage", e);
    }
  }

  addRoutineToHistory(routine: Routine): HistoricRoutine {
    const completedExercises: HistoricRoutine['completedExercises'] = {};
    routine.weeklyRoutine.forEach(day => {
      completedExercises[day.focus] = {};
      day.exercises.forEach(exercise => {
        completedExercises[day.focus][exercise.name] = false;
      });
    });

    const newHistoricRoutine: HistoricRoutine = {
      id: Date.now(),
      date: new Date().toISOString(),
      routine: routine,
      completedExercises: completedExercises
    };

    this.history.update(currentHistory => [newHistoricRoutine, ...currentHistory]);
    this.saveHistoryToStorage();
    return newHistoricRoutine;
  }

  updateExerciseCompletion(routineId: number, dayFocus: string, exerciseName: string, completed: boolean): void {
    this.history.update(currentHistory => {
      return currentHistory.map(hr => {
        if (hr.id === routineId) {
          const updatedHr = { ...hr };
          if (updatedHr.completedExercises[dayFocus]) {
            updatedHr.completedExercises[dayFocus][exerciseName] = completed;
          }
          return updatedHr;
        }
        return hr;
      });
    });
    this.saveHistoryToStorage();
  }
}
