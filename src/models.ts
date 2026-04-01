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
}

export interface DailyWorkout {
  day: string;
  focus: string;
  exercises: Exercise[];
}

export interface WeeklyRoutine {
  workouts: DailyWorkout[];
}
