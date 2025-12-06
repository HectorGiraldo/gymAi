import { Component, ChangeDetectionStrategy, signal, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserProfile } from '../models';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './setup.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetupComponent {
  @Output() profileSubmit = new EventEmitter<UserProfile>();

  experience = signal<UserProfile['experience']>('beginner');
  daysPerWeek = signal<number>(3);
  goal = signal<UserProfile['goal']>('ganar_musculo');

  readonly experienceLevels: UserProfile['experience'][] = ['beginner', 'intermediate', 'advanced'];
  readonly experienceLabels: Record<UserProfile['experience'], string> = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
  };
  readonly trainingDays: number[] = [2, 3, 4, 5, 6];
  readonly goals: { key: UserProfile['goal'], label: string }[] = [
    { key: 'ganar_musculo', label: 'Ganar Músculo' },
    { key: 'perder_grasa', label: 'Definir' },
    { key: 'mantenimiento', label: 'Mantener' },
  ];

  submitForm() {
    this.profileSubmit.emit({
      experience: this.experience(),
      daysPerWeek: this.daysPerWeek(),
      goal: this.goal(),
    });
  }
}
