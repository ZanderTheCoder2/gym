export type CompletedSet = { exerciseName: string; weight: string; reps: string };
export type TrainingSession = { id: string; dateKey: string; durationSeconds: number; sets: CompletedSet[]; programId?: string; programName?: string; dayName?: string };
export type TrainingMetrics = { volumeLoad: number; sets: number; reps: number; sessions: number };
export type WeeklyTrainingMetrics = TrainingMetrics & { weekStart: string };

export const trainingSessionsStorageKey = '@gym/training-sessions';

export function normalizeTrainingSessions(value: unknown): TrainingSession[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    const session = item as Partial<TrainingSession>;
    if (typeof session.id !== 'string' || typeof session.dateKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(session.dateKey) || !Array.isArray(session.sets)) return [];
    const sets = session.sets.flatMap(set => {
      if (!set || typeof set !== 'object' || typeof set.exerciseName !== 'string') return [];
      return [{ exerciseName: set.exerciseName, weight: typeof set.weight === 'string' ? set.weight : '', reps: typeof set.reps === 'string' ? set.reps : '' }];
    });
    return [{
      id: session.id,
      dateKey: session.dateKey,
      durationSeconds: typeof session.durationSeconds === 'number' ? session.durationSeconds : 0,
      sets,
      ...(typeof session.programId === 'string' ? { programId: session.programId } : {}),
      ...(typeof session.programName === 'string' ? { programName: session.programName } : {}),
      ...(typeof session.dayName === 'string' ? { dayName: session.dayName } : {}),
    }];
  });
}

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCompletedSetMetrics(sets: CompletedSet[]): Omit<TrainingMetrics, 'sessions'> {
  return sets.reduce((metrics, set) => {
    const weight = Number(set.weight);
    const reps = Number(set.reps);
    const validReps = Number.isFinite(reps) && reps > 0 ? reps : 0;
    return {
      volumeLoad: metrics.volumeLoad + (Number.isFinite(weight) && weight > 0 && validReps ? weight * validReps : 0),
      sets: metrics.sets + 1,
      reps: metrics.reps + validReps,
    };
  }, { volumeLoad: 0, sets: 0, reps: 0 });
}

function mondayOf(date: Date): Date {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getWeeklyTrainingMetrics(sessions: TrainingSession[], now = new Date()): WeeklyTrainingMetrics[] {
  const currentMonday = mondayOf(now);
  const weeks = Array.from({ length: 6 }, (_, index) => {
    const start = new Date(currentMonday);
    start.setDate(start.getDate() - (5 - index) * 7);
    return { weekStart: localDateKey(start), volumeLoad: 0, sets: 0, reps: 0, sessions: 0 };
  });
  const weekByStart = new Map(weeks.map(week => [week.weekStart, week]));

  sessions.forEach(session => {
    const week = weekByStart.get(localDateKey(mondayOf(parseDateKey(session.dateKey))));
    if (!week) return;
    const metrics = getCompletedSetMetrics(session.sets);
    week.volumeLoad += metrics.volumeLoad;
    week.sets += metrics.sets;
    week.reps += metrics.reps;
    week.sessions += 1;
  });

  return weeks;
}