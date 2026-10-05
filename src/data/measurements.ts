export const measurementsStorageKey = '@gym/measurements';

export const measurementFields = [
  ['weight', 'Weight', 'kg'],
  ['bodyFat', 'Body fat', '%'],
  ['chest', 'Chest', 'cm'],
  ['waist', 'Waist', 'cm'],
  ['hips', 'Hips', 'cm'],
  ['leftArm', 'Left arm', 'cm'],
  ['rightArm', 'Right arm', 'cm'],
  ['leftThigh', 'Left thigh', 'cm'],
  ['rightThigh', 'Right thigh', 'cm'],
  ['neck', 'Neck', 'cm'],
] as const;

export type MeasurementKey = typeof measurementFields[number][0];
export type MeasurementValues = Record<MeasurementKey, string>;
export type MeasurementEntry = { id: string; dateKey: string; values: MeasurementValues };

export const emptyMeasurements = (): MeasurementValues =>
  Object.fromEntries(measurementFields.map(([key]) => [key, ''])) as MeasurementValues;

export function normalizeMeasurementEntries(value: unknown): MeasurementEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    const entry = item as Partial<MeasurementEntry>;
    if (typeof entry.id !== 'string' || typeof entry.dateKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(entry.dateKey) || !entry.values || typeof entry.values !== 'object') return [];
    const values = Object.fromEntries(measurementFields.map(([key]) => {
      const value = entry.values?.[key];
      return [key, typeof value === 'string' ? value : ''];
    })) as MeasurementValues;
    return [{ id: entry.id, dateKey: entry.dateKey, values }];
  });
}

export function localMeasurementDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
