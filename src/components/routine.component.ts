import { Component, ChangeDetectionStrategy, input, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeeklyRoutine, Exercise } from '../models';
import { UnsplashService } from '../services/unsplash.service';

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

  activeDayIndex = signal(0);
  completedExercises = signal<Set<string>>(new Set());
  expandedExercise = signal<string | null>(null);
  imageUrls = signal<Map<string, string>>(new Map());

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

  constructor(private unsplash: UnsplashService) {}

  toggleExerciseDetails(exercise: Exercise): void {
    const isExpanding = this.expandedExercise() !== exercise.name;
    
    if (isExpanding) {
      this.expandedExercise.set(exercise.name);
      // Only generate the placeholder URL once
      if (!this.imageUrls().has(exercise.name)) {
        // Use UnsplashService to get a relevant image based on the exercise name
        this.unsplash.getImageUrlForQuery(`${exercise.name} gym fitness`).then(result => {
          this.imageUrls.update(map => new Map(map).set(exercise.name, result.url));
        }).catch(() => {
          // fallback placeholder
          this.imageUrls.update(map => new Map(map).set(exercise.name, 'https://via.placeholder.com/400?text=No+image'));
        });
      }
    } else {
      this.expandedExercise.set(null);
    }
  }

  startNewRoutine() {
    this.reset.emit();
  }
}
