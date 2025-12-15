
export interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest?: string;
  description: string;
}

export interface DailyRoutine {
  day: string;
  focus: string;
  exercises: Exercise[];
}

export interface Routine {
  weeklyRoutine: DailyRoutine[];
}

export interface HistoricRoutine {
  id: number;
  date: string;
  routine: Routine;
  completedExercises: { [dayFocus: string]: { [exerciseName: string]: boolean } };
}
