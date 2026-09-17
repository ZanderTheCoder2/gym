export type SetEntry = { weight: string; reps: string };
export type WorkoutExercise = { name: string; sets: SetEntry[] };
export type WorkoutDay = { name: string; exercises: WorkoutExercise[] };
export type Program = { id: string; name: string; days: WorkoutDay[] };

export const programsStorageKey = '@gym/programs';
export const setNumbers = [1, 2, 3, 4, 5];

export function emptySets(): SetEntry[] {
  return setNumbers.map(() => ({ weight: '', reps: '' }));
}

export function createWorkoutExercise(name: string): WorkoutExercise {
  return { name, sets: emptySets() };
}

export function normalizeProgram(value: unknown): Program | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as Partial<Program>;
  if (typeof candidate.id !== 'string' || typeof candidate.name !== 'string' || !Array.isArray(candidate.days)) return undefined;
  return {
    id: candidate.id,
    name: candidate.name,
    days: candidate.days.map(day => ({
      name: typeof day?.name === 'string' ? day.name : 'Training day',
      exercises: Array.isArray(day?.exercises) ? day.exercises.flatMap(exercise => {
        if (typeof exercise === 'string') return [createWorkoutExercise(exercise)];
        if (!exercise || typeof exercise !== 'object' || typeof exercise.name !== 'string') return [];
        const sets = Array.isArray(exercise.sets) ? exercise.sets.slice(0, setNumbers.length).map(set => ({ weight: typeof set?.weight === 'string' ? set.weight : '', reps: typeof set?.reps === 'string' ? set.reps : '' })) : emptySets();
        return [{ name: exercise.name, sets }];
      }) : [],
    })),
  };
}
