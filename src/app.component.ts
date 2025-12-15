
import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from './services/gemini.service';
import { HistoryService } from './services/history.service';
import { Routine, Exercise, HistoricRoutine } from './models/routine.model';

type AppView = 'form' | 'routine' | 'history' | 'history-routine';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class AppComponent {
  private geminiService = inject(GeminiService);
  historyService = inject(HistoryService);

  // --- State Signals ---
  view = signal<AppView>('form');
  formState = signal({ days: '3', experience: 'principiante', goal: 'ganar masa muscular' });
  loading = signal(false);
  error = signal<string | null>(null);
  currentRoutine = signal<HistoricRoutine | null>(null);
  viewedHistoricRoutine = signal<HistoricRoutine | null>(null);

  // Exercise Detail Modal State
  selectedExercise = signal<Exercise | null>(null);
  selectedExerciseImages = signal<{start: string; end: string} | null>(null);
  imageLoading = signal(false);
  
  // --- Form Options ---
  trainingDays = ['3', '4', '5', '6'];
  experienceLevels = [
    { value: 'principiante', label: 'Principiante' },
    { value: 'intermedio', label: 'Intermedio' },
    { value: 'avanzado', label: 'Avanzado' }
  ];
  goals = [
    { value: 'ganar masa muscular', label: 'Ganar Masa Muscular' },
    { value: 'definicion', label: 'Definición Muscular' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'fuerza', label: 'Ganar Fuerza' }
  ];

  updateField(field: 'days' | 'experience' | 'goal', event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.formState.update(current => ({ ...current, [field]: value }));
  }

  async generateRoutine() {
    this.loading.set(true);
    this.error.set(null);
    this.currentRoutine.set(null);

    try {
      const { days, experience, goal } = this.formState();
      const routineData = await this.geminiService.generateRoutine(days, experience, goal);
      const newHistoricRoutine = this.historyService.addRoutineToHistory(routineData);
      this.currentRoutine.set(newHistoricRoutine);
      this.view.set('routine');
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
      this.view.set('form');
    } finally {
      this.loading.set(false);
    }
  }

  async showExerciseDetails(exercise: Exercise) {
    this.selectedExercise.set(exercise);
    this.imageLoading.set(true);
    this.selectedExerciseImages.set(null);

    try {
      const images = await this.geminiService.generateExerciseImages(exercise.name);
      this.selectedExerciseImages.set(images);
    } catch (err) {
      console.error(err);
      // We can show a placeholder or error in the modal
    } finally {
      this.imageLoading.set(false);
    }
  }

  closeExerciseDetails() {
    this.selectedExercise.set(null);
  }

  startOver() {
    this.currentRoutine.set(null);
    this.error.set(null);
    this.loading.set(false);
    this.view.set('form');
  }

  showHistory() {
    this.view.set('history');
  }

  viewRoutineFromHistory(historicRoutine: HistoricRoutine) {
    this.viewedHistoricRoutine.set(historicRoutine);
    this.view.set('history-routine');
  }
  
  toggleExerciseCompletion(routineId: number, dayFocus: string, exerciseName: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.historyService.updateExerciseCompletion(routineId, dayFocus, exerciseName, isChecked);
  }

  formatHistoryDate(dateString: string): string {
    return new Date(dateString).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' });
  }

  formatHistoryTitleDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', { dateStyle: 'long' });
  }
}
