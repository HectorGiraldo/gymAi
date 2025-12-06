import { Component, ChangeDetectionStrategy, input, signal, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeeklyRoutine, Exercise, ImageState } from '../models';
import { GeminiService } from '../services/gemini.service';

@Component({
  selector: 'app-routine',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './routine.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoutineComponent {
  routine = input.required<WeeklyRoutine>();
  @Output() reset = new EventEmitter<void>();

  private geminiService = inject(GeminiService);

  activeDayIndex = signal(0);
  completedExercises = signal<Set<string>>(new Set());
  expandedExercise = signal<string | null>(null);
  imageStates = signal<Map<string, ImageState>>(new Map());

  toggleExerciseCompletion(exerciseName: string, event: Event): void {
    event.stopPropagation();
    this.completedExercises.update(currentSet => {
      const newSet = new Set(currentSet);
      if (newSet.has(exerciseName)) {
        newSet.delete(exerciseName);
      } else {
        newSet.add(exerciseName);
      }
      return newSet;
    });
  }

  async toggleExerciseDetails(exercise: Exercise): Promise<void> {
    const isExpanding = this.expandedExercise() !== exercise.name;
    
    if (isExpanding) {
      this.expandedExercise.set(exercise.name);
      const currentImageState = this.imageStates().get(exercise.name);

      if (!currentImageState || currentImageState.state === 'idle') {
        this.imageStates.update(map => new Map(map).set(exercise.name, { state: 'loading' }));
        try {
          const base64Image = await this.geminiService.generateExerciseImage(exercise.image_prompt);
          const imageUrl = `data:image/jpeg;base64,${base64Image}`;
          this.imageStates.update(map => new Map(map).set(exercise.name, { state: 'loaded', url: imageUrl }));
        } catch (e) {
          console.error('Image generation failed', e);
          this.imageStates.update(map => new Map(map).set(exercise.name, { state: 'error' }));
        }
      }
    } else {
      this.expandedExercise.set(null);
    }
  }

  startNewRoutine() {
    this.reset.emit();
  }
}
