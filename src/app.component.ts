import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from './services/gemini.service';
import { UserProfile, WeeklyRoutine } from './models';
import { SetupComponent } from './components/setup.component';
import { RoutineComponent } from './components/routine.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SetupComponent, RoutineComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private geminiService = inject(GeminiService);

  appState = signal<'setup' | 'generating' | 'display' | 'error'>('setup');
  routine = signal<WeeklyRoutine | null>(null);
  error = signal<string | null>(null);

  async onProfileSubmit(profile: UserProfile): Promise<void> {
    this.appState.set('generating');
    this.error.set(null);
    this.routine.set(null);

    try {
      const result = await this.geminiService.generateRoutine(profile);
      this.routine.set(result);
      this.appState.set('display');
    } catch (e: any) {
      console.error('Failed to generate routine:', e);
      this.error.set(e.message || 'An unknown error occurred. Please check your API key and try again.');
      this.appState.set('error');
    }
  }

  resetApp(): void {
    this.appState.set('setup');
    this.routine.set(null);
    this.error.set(null);
  }
}
