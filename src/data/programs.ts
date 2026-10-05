export type SetEntry = { weight: string; reps: string };
export type WorkoutExercise = { name: string; sets: SetEntry[] };
export type WorkoutDay = { name: string; exercises: WorkoutExercise[] };
export type Program = { id: string; name: string; days: WorkoutDay[]; startDate?: string; trainingWeekdays?: number[] };

export const programsStorageKey = '@gym/programs';
export const setNumbers = [1, 2, 3, 4, 5];
const weeklyTrainingDays: Record<number, number[]> = {
  1: [2],
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 5],
  5: [0, 1, 2, 3, 4],
  6: [0, 1, 2, 4, 5, 6],
  7: [0, 1, 2, 3, 4, 5, 6],
};

export function getProgramDayIndexForWeekday(programDayCount: number, weekdayIndex: number): number | undefined {
  const days = weeklyTrainingDays[Math.min(7, Math.max(1, programDayCount))];
  const dayIndex = days.indexOf(weekdayIndex);
  return dayIndex < 0 || dayIndex >= programDayCount ? undefined : dayIndex;
}

export function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function getProgramDayIndexForDate(programDayCount: number, date: Date, startDate?: string, trainingWeekdays?: number[]): number | undefined {
  const weekday = (date.getDay() + 6) % 7;
  if (!startDate) {
    const selectedWeekdays = trainingWeekdays?.filter(value => Number.isInteger(value) && value >= 0 && value <= 6).sort((left, right) => left - right);
    const selectedDayIndex = selectedWeekdays?.indexOf(weekday) ?? -1;
    return selectedDayIndex >= 0 ? selectedDayIndex % programDayCount : selectedWeekdays?.length ? undefined : getProgramDayIndexForWeekday(programDayCount, weekday);
  }
  if (!isValidDateKey(startDate)) return undefined;
  const [year, month, day] = startDate.split('-').map(Number);
  const startTime = Date.UTC(year, month - 1, day);
  const dateTime = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOffset = Math.floor((dateTime - startTime) / 86400000);
  if (dayOffset < 0) return undefined;
  const scheduledWeekdays = trainingWeekdays?.filter(value => Number.isInteger(value) && value >= 0 && value <= 6).sort((left, right) => left - right);
  if (!scheduledWeekdays?.length) return getProgramDayIndexForWeekday(programDayCount, weekday);
  let sessionNumber = -1;
  for (let offset = 0; offset <= dayOffset; offset += 1) {
    const offsetDate = new Date(startTime + offset * 86400000);
    const offsetWeekday = (offsetDate.getUTCDay() + 6) % 7;
    const isFirstSession = offset === 0;
    const isAvailableDay = scheduledWeekdays.includes(offsetWeekday);
    if (isFirstSession || isAvailableDay) sessionNumber += 1;
    if (offset === dayOffset) return isFirstSession || isAvailableDay ? sessionNumber % programDayCount : undefined;
  }
  return undefined;
}

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
    ...(typeof candidate.startDate === 'string' && isValidDateKey(candidate.startDate) ? { startDate: candidate.startDate } : {}),
    ...(Array.isArray(candidate.trainingWeekdays) ? { trainingWeekdays: candidate.trainingWeekdays.filter((day): day is number => Number.isInteger(day) && day >= 0 && day <= 6) } : {}),
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
