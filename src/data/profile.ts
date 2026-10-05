export type Profile = {
  name: string;
  ageRange: string;
  goal: string;
  level: string;
  trainingDays: number;
  availableDays: number[];
  sessionLength: string;
  equipment: string[];
  limitations: string;
};

export const profileStorageKey = '@gym/profile';
export const setupCompleteStorageKey = '@gym/setup-complete';

export const defaultProfile: Profile = {
  name: '',
  ageRange: 'Prefer not to say',
  goal: 'Build strength',
  level: 'Beginner',
  trainingDays: 3,
  availableDays: [0, 2, 4],
  sessionLength: '45 minutes',
  equipment: ['Full gym'],
  limitations: '',
};

export function normalizeProfile(value: unknown): Profile {
  if (!value || typeof value !== 'object') return defaultProfile;
  const candidate = value as Partial<Profile> & { equipment?: unknown };
  const equipment = Array.isArray(candidate.equipment)
    ? candidate.equipment.filter((item): item is string => typeof item === 'string')
    : typeof candidate.equipment === 'string' && candidate.equipment
      ? [candidate.equipment]
      : defaultProfile.equipment;
  const availableDays = Array.isArray(candidate.availableDays)
    ? candidate.availableDays.filter((day): day is number => Number.isInteger(day) && day >= 0 && day <= 6)
    : defaultProfile.availableDays;

  return {
    name: typeof candidate.name === 'string' ? candidate.name : defaultProfile.name,
    ageRange: typeof candidate.ageRange === 'string' ? candidate.ageRange : defaultProfile.ageRange,
    goal: typeof candidate.goal === 'string' ? candidate.goal : defaultProfile.goal,
    level: typeof candidate.level === 'string' ? candidate.level : defaultProfile.level,
    trainingDays: typeof candidate.trainingDays === 'number' && candidate.trainingDays >= 1 && candidate.trainingDays <= 7
      ? Math.floor(candidate.trainingDays)
      : defaultProfile.trainingDays,
    availableDays: availableDays.length ? availableDays : defaultProfile.availableDays,
    sessionLength: typeof candidate.sessionLength === 'string' ? candidate.sessionLength : defaultProfile.sessionLength,
    equipment: equipment.length ? equipment : defaultProfile.equipment,
    limitations: typeof candidate.limitations === 'string' ? candidate.limitations : defaultProfile.limitations,
  };
}
