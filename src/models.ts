export interface UserProfile {
  experience: 'beginner' | 'intermediate' | 'advanced';
  daysPerWeek: number;
  goal: 'ganar_musculo' | 'perder_grasa' | 'mantenimiento';
}

export interface Exercise {
  name: string;
  description: string;
  sets: number;
  reps: string;
  image_prompt: string;
}

export interface DailyWorkout {
  day: string;
  focus: string;
  exercises: Exercise[];
}

export interface WeeklyRoutine {
  workouts: DailyWorkout[];
}

export type ImageState = {
  state: 'idle' | 'loading' | 'loaded' | 'error';
  url?: string;
}
