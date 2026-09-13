export const exerciseCategories = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Calves', 'Glutes', 'Traps', 'Forearms', 'Core', 'Full Body'] as const;
export type ExerciseCategory = typeof exerciseCategories[number];
export type ExerciseType = 'Compound' | 'Isolation';
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export type Exercise = {
  id: string;
  name: string;
  equipment: string;
  category: ExerciseCategory;
  primaryMuscle: string;
  secondaryMuscles: string[];
  movementPattern: string;
  type: ExerciseType;
  difficulty: Difficulty;
};

type ExerciseSeed = Omit<Exercise, 'id'>;
const seed = (name: string, equipment: string, category: ExerciseCategory, primaryMuscle: string, secondaryMuscles: string[], movementPattern: string, type: ExerciseType, difficulty: Difficulty): ExerciseSeed => ({ name, equipment, category, primaryMuscle, secondaryMuscles, movementPattern, type, difficulty });

const exerciseSeeds: ExerciseSeed[] = [
  seed('Barbell Bench Press', 'Barbell', 'Chest', 'Chest', ['Triceps', 'Front Deltoids'], 'Horizontal Push', 'Compound', 'Intermediate'),
  seed('Incline Barbell Bench Press', 'Barbell', 'Chest', 'Upper Chest', ['Triceps', 'Front Deltoids'], 'Incline Push', 'Compound', 'Intermediate'),
  seed('Decline Barbell Bench Press', 'Barbell', 'Chest', 'Lower Chest', ['Triceps', 'Front Deltoids'], 'Decline Push', 'Compound', 'Intermediate'),
  seed('Close Grip Bench Press', 'Barbell', 'Triceps', 'Triceps', ['Chest', 'Front Deltoids'], 'Elbow Extension', 'Compound', 'Intermediate'),
  seed('Dumbbell Bench Press', 'Dumbbells', 'Chest', 'Chest', ['Triceps', 'Front Deltoids'], 'Horizontal Push', 'Compound', 'Beginner'),
  seed('Incline Dumbbell Press', 'Dumbbells', 'Chest', 'Upper Chest', ['Triceps', 'Front Deltoids'], 'Incline Push', 'Compound', 'Beginner'),
  seed('Dumbbell Fly', 'Dumbbells', 'Chest', 'Chest', ['Front Deltoids'], 'Horizontal Adduction', 'Isolation', 'Beginner'),
  seed('Cable Chest Fly', 'Cable Machine', 'Chest', 'Chest', ['Front Deltoids'], 'Horizontal Adduction', 'Isolation', 'Beginner'),
  seed('Machine Chest Press', 'Chest Press Machine', 'Chest', 'Chest', ['Triceps', 'Front Deltoids'], 'Horizontal Push', 'Compound', 'Beginner'),
  seed('Pec Deck', 'Pec Deck Machine', 'Chest', 'Chest', [], 'Horizontal Adduction', 'Isolation', 'Beginner'),
  seed('Push Up', 'Bodyweight', 'Chest', 'Chest', ['Triceps', 'Front Deltoids'], 'Horizontal Push', 'Compound', 'Beginner'),
  seed('Barbell Deadlift', 'Barbell', 'Back', 'Lower Back', ['Glutes', 'Hamstrings', 'Traps', 'Forearms'], 'Hinge', 'Compound', 'Advanced'),
  seed('Barbell Bent Over Row', 'Barbell', 'Back', 'Upper Back', ['Lats', 'Biceps', 'Rear Deltoids'], 'Horizontal Pull', 'Compound', 'Intermediate'),
  seed('Pendlay Row', 'Barbell', 'Back', 'Upper Back', ['Lats', 'Biceps'], 'Horizontal Pull', 'Compound', 'Advanced'),
  seed('One Arm Dumbbell Row', 'Dumbbell', 'Back', 'Lats', ['Biceps', 'Upper Back'], 'Horizontal Pull', 'Compound', 'Beginner'),
  seed('Dumbbell Bent Over Row', 'Dumbbells', 'Back', 'Upper Back', ['Lats', 'Biceps'], 'Horizontal Pull', 'Compound', 'Beginner'),
  seed('Lat Pulldown', 'Cable Machine', 'Back', 'Lats', ['Biceps', 'Upper Back'], 'Vertical Pull', 'Compound', 'Beginner'),
  seed('Seated Cable Row', 'Cable Machine', 'Back', 'Upper Back', ['Lats', 'Biceps'], 'Horizontal Pull', 'Compound', 'Beginner'),
  seed('Straight Arm Pulldown', 'Cable Machine', 'Back', 'Lats', ['Core'], 'Shoulder Extension', 'Isolation', 'Beginner'),
  seed('Face Pull', 'Cable Machine', 'Back', 'Rear Deltoids', ['Traps', 'Upper Back'], 'Horizontal Pull', 'Isolation', 'Beginner'),
  seed('Machine Row', 'Row Machine', 'Back', 'Upper Back', ['Lats', 'Biceps'], 'Horizontal Pull', 'Compound', 'Beginner'),
  seed('Chest Supported Row Machine', 'Row Machine', 'Back', 'Upper Back', ['Lats', 'Biceps', 'Rear Deltoids'], 'Horizontal Pull', 'Compound', 'Beginner'),
  seed('Pull Up', 'Pull Up Bar', 'Back', 'Lats', ['Biceps', 'Upper Back'], 'Vertical Pull', 'Compound', 'Intermediate'),
  seed('Barbell Overhead Press', 'Barbell', 'Shoulders', 'Shoulders', ['Triceps', 'Upper Chest'], 'Vertical Push', 'Compound', 'Intermediate'),
  seed('Dumbbell Shoulder Press', 'Dumbbells', 'Shoulders', 'Shoulders', ['Triceps'], 'Vertical Push', 'Compound', 'Beginner'),
  seed('Arnold Press', 'Dumbbells', 'Shoulders', 'Shoulders', ['Triceps', 'Upper Chest'], 'Vertical Push', 'Compound', 'Intermediate'),
  seed('Dumbbell Lateral Raise', 'Dumbbells', 'Shoulders', 'Side Deltoids', [], 'Shoulder Abduction', 'Isolation', 'Beginner'),
  seed('Dumbbell Rear Delt Fly', 'Dumbbells', 'Shoulders', 'Rear Deltoids', ['Upper Back'], 'Horizontal Abduction', 'Isolation', 'Beginner'),
  seed('Machine Shoulder Press', 'Shoulder Press Machine', 'Shoulders', 'Shoulders', ['Triceps'], 'Vertical Push', 'Compound', 'Beginner'),
  seed('Barbell Curl', 'Barbell', 'Biceps', 'Biceps', ['Forearms'], 'Elbow Flexion', 'Isolation', 'Beginner'),
  seed('EZ Bar Curl', 'EZ Bar', 'Biceps', 'Biceps', ['Forearms'], 'Elbow Flexion', 'Isolation', 'Beginner'),
  seed('Dumbbell Curl', 'Dumbbells', 'Biceps', 'Biceps', ['Forearms'], 'Elbow Flexion', 'Isolation', 'Beginner'),
  seed('Hammer Curl', 'Dumbbells', 'Biceps', 'Brachialis', ['Biceps', 'Forearms'], 'Elbow Flexion', 'Isolation', 'Beginner'),
  seed('Incline Dumbbell Curl', 'Dumbbells', 'Biceps', 'Biceps', ['Forearms'], 'Elbow Flexion', 'Isolation', 'Intermediate'),
  seed('Cable Biceps Curl', 'Cable Machine', 'Biceps', 'Biceps', ['Forearms'], 'Elbow Flexion', 'Isolation', 'Beginner'),
  seed('EZ Bar Skull Crusher', 'EZ Bar', 'Triceps', 'Triceps', [], 'Elbow Extension', 'Isolation', 'Intermediate'),
  seed('Dumbbell Overhead Triceps Extension', 'Dumbbell', 'Triceps', 'Triceps', [], 'Elbow Extension', 'Isolation', 'Beginner'),
  seed('Cable Triceps Pushdown', 'Cable Machine', 'Triceps', 'Triceps', [], 'Elbow Extension', 'Isolation', 'Beginner'),
  seed('Rope Triceps Pushdown', 'Cable Machine', 'Triceps', 'Triceps', [], 'Elbow Extension', 'Isolation', 'Beginner'),
  seed('Barbell Back Squat', 'Barbell', 'Legs', 'Quadriceps', ['Glutes', 'Hamstrings', 'Core'], 'Squat', 'Compound', 'Intermediate'),
  seed('Front Squat', 'Barbell', 'Legs', 'Quadriceps', ['Glutes', 'Core'], 'Squat', 'Compound', 'Advanced'),
  seed('Dumbbell Goblet Squat', 'Dumbbell', 'Legs', 'Quadriceps', ['Glutes', 'Core'], 'Squat', 'Compound', 'Beginner'),
  seed('Dumbbell Bulgarian Split Squat', 'Dumbbells', 'Legs', 'Quadriceps', ['Glutes', 'Hamstrings'], 'Single Leg Squat', 'Compound', 'Intermediate'),
  seed('Dumbbell Walking Lunge', 'Dumbbells', 'Legs', 'Quadriceps', ['Glutes', 'Hamstrings'], 'Lunge', 'Compound', 'Beginner'),
  seed('Romanian Deadlift', 'Barbell', 'Legs', 'Hamstrings', ['Glutes', 'Lower Back'], 'Hinge', 'Compound', 'Intermediate'),
  seed('Barbell Hip Thrust', 'Barbell', 'Glutes', 'Glutes', ['Hamstrings'], 'Hip Extension', 'Compound', 'Intermediate'),
  seed('Leg Press', 'Leg Press Machine', 'Legs', 'Quadriceps', ['Glutes', 'Hamstrings'], 'Squat', 'Compound', 'Beginner'),
  seed('Hack Squat', 'Hack Squat Machine', 'Legs', 'Quadriceps', ['Glutes'], 'Squat', 'Compound', 'Beginner'),
  seed('Leg Extension', 'Leg Extension Machine', 'Legs', 'Quadriceps', [], 'Knee Extension', 'Isolation', 'Beginner'),
  seed('Seated Leg Curl', 'Leg Curl Machine', 'Legs', 'Hamstrings', ['Calves'], 'Knee Flexion', 'Isolation', 'Beginner'),
  seed('Standing Calf Raise', 'Calf Raise Machine', 'Calves', 'Gastrocnemius', ['Soleus'], 'Plantar Flexion', 'Isolation', 'Beginner'),
  seed('Dumbbell Calf Raise', 'Dumbbells', 'Calves', 'Gastrocnemius', ['Soleus'], 'Plantar Flexion', 'Isolation', 'Beginner'),
  seed('Barbell Shrug', 'Barbell', 'Traps', 'Traps', ['Forearms'], 'Scapular Elevation', 'Isolation', 'Beginner'),
  seed("Farmer's Carry", 'Dumbbells', 'Forearms', 'Forearms', ['Traps', 'Core'], 'Loaded Carry', 'Compound', 'Beginner'),
  seed('Cable Crunch', 'Cable Machine', 'Core', 'Abdominals', [], 'Spinal Flexion', 'Isolation', 'Beginner'),
  seed('Hanging Leg Raise', 'Pull Up Bar', 'Core', 'Abdominals', ['Hip Flexors'], 'Hip Flexion', 'Isolation', 'Intermediate'),
  seed('Ab Wheel Rollout', 'Ab Wheel', 'Core', 'Abdominals', ['Shoulders', 'Lats'], 'Anti-Extension', 'Compound', 'Intermediate'),
  seed('Pallof Press', 'Cable Machine', 'Core', 'Core', ['Obliques'], 'Anti-Rotation', 'Isolation', 'Beginner'),
  seed('Plank', 'Bodyweight', 'Core', 'Core', ['Shoulders', 'Glutes'], 'Anti-Extension', 'Isolation', 'Beginner'),
  seed('Kettlebell Swing', 'Kettlebell', 'Full Body', 'Glutes', ['Hamstrings', 'Core', 'Shoulders'], 'Hinge', 'Compound', 'Intermediate'),
  seed('Barbell Clean', 'Barbell', 'Full Body', 'Glutes', ['Hamstrings', 'Traps', 'Shoulders'], 'Olympic Pull', 'Compound', 'Advanced'),
  seed('Dumbbell Thruster', 'Dumbbells', 'Full Body', 'Quadriceps', ['Glutes', 'Shoulders', 'Triceps'], 'Squat to Press', 'Compound', 'Intermediate'),
  seed('Landmine Press', 'Landmine', 'Shoulders', 'Shoulders', ['Triceps', 'Upper Chest'], 'Press', 'Compound', 'Beginner'),
];

export const exercises: Exercise[] = exerciseSeeds.map((exercise, index) => ({ ...exercise, id: `exercise-${index + 1}` }));
export type ExerciseFilters = Partial<Pick<Exercise, 'category' | 'equipment' | 'type' | 'difficulty' | 'movementPattern'>>;

export function filterExercises(filters: ExerciseFilters = {}): Exercise[] {
  return exercises.filter(exercise => Object.entries(filters).every(([key, value]) => !value || exercise[key as keyof Exercise] === value));
}

const difficultyRank: Record<Difficulty, number> = { Beginner: 1, Intermediate: 2, Advanced: 3 };
export function findExerciseAlternatives(exercise: Exercise, options: { unavailableEquipment?: string[]; preferredEquipment?: string; difficulty?: 'easier' | 'harder' | Difficulty; limit?: number } = {}): Exercise[] {
  const unavailable = new Set(options.unavailableEquipment ?? []);
  return exercises
    .filter(candidate => candidate.id !== exercise.id && !unavailable.has(candidate.equipment))
    .filter(candidate => !options.preferredEquipment || candidate.equipment === options.preferredEquipment)
    .filter(candidate => !options.difficulty || (options.difficulty === 'easier' ? difficultyRank[candidate.difficulty] < difficultyRank[exercise.difficulty] : options.difficulty === 'harder' ? difficultyRank[candidate.difficulty] > difficultyRank[exercise.difficulty] : candidate.difficulty === options.difficulty))
    .map(candidate => ({ candidate, score: (candidate.primaryMuscle === exercise.primaryMuscle ? 4 : 0) + (candidate.movementPattern === exercise.movementPattern ? 2 : 0) + (candidate.category === exercise.category ? 1 : 0) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, options.limit ?? 5)
    .map(item => item.candidate);
}

export function selectRecommendedExercise(name: string, options: Parameters<typeof findExerciseAlternatives>[1] = {}): Exercise | undefined {
  const exercise = exercises.find(item => item.name === name || item.id === name);
  return exercise ? findExerciseAlternatives(exercise, options)[0] : undefined;
}
