export const exerciseCategories = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Calves', 'Glutes', 'Traps', 'Forearms', 'Core', 'Abs', 'Cardio', 'Full Body'] as const;
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
  seed('Weighted Dip', 'Dip Bars', 'Chest', 'Chest', ['Triceps', 'Front Deltoids'], 'Vertical Push', 'Compound', 'Intermediate'),
  seed('Smith Machine Bench Press', 'Smith Machine', 'Chest', 'Chest', ['Triceps', 'Front Deltoids'], 'Horizontal Push', 'Compound', 'Beginner'),
  seed('Cable Press', 'Cable Machine', 'Chest', 'Chest', ['Triceps', 'Front Deltoids'], 'Horizontal Push', 'Compound', 'Beginner'),
  seed('Wide Grip Bench Press', 'Barbell', 'Chest', 'Chest', ['Triceps', 'Front Deltoids'], 'Horizontal Push', 'Compound', 'Intermediate'),
  seed('Iso-Lateral Chest Press', 'Chest Press Machine', 'Chest', 'Chest', ['Triceps', 'Front Deltoids'], 'Horizontal Push', 'Compound', 'Beginner'),

  seed('Barbell Deadlift', 'Barbell', 'Back', 'Lower Back', ['Glutes', 'Hamstrings', 'Traps', 'Forearms'], 'Hinge', 'Compound', 'Advanced'),
  seed('Romanian Deadlift', 'Barbell', 'Back', 'Hamstrings', ['Glutes', 'Lower Back'], 'Hinge', 'Compound', 'Intermediate'),
  seed('Barbell Bent Over Row', 'Barbell', 'Back', 'Upper Back', ['Lats', 'Biceps', 'Rear Deltoids'], 'Horizontal Pull', 'Compound', 'Intermediate'),
  seed('Pendlay Row', 'Barbell', 'Back', 'Upper Back', ['Lats', 'Biceps'], 'Horizontal Pull', 'Compound', 'Advanced'),
  seed('One Arm Dumbbell Row', 'Dumbbell', 'Back', 'Lats', ['Biceps', 'Upper Back'], 'Horizontal Pull', 'Compound', 'Beginner'),
  seed('Dumbbell Bent Over Row', 'Dumbbells', 'Back', 'Upper Back', ['Lats', 'Biceps'], 'Horizontal Pull', 'Compound', 'Beginner'),
  seed('Lat Pulldown', 'Cable Machine', 'Back', 'Lats', ['Biceps', 'Upper Back'], 'Vertical Pull', 'Compound', 'Beginner'),
  seed('Neutral Grip Lat Pulldown', 'Cable Machine', 'Back', 'Lats', ['Biceps', 'Upper Back'], 'Vertical Pull', 'Compound', 'Beginner'),
  seed('Seated Cable Row', 'Cable Machine', 'Back', 'Upper Back', ['Lats', 'Biceps'], 'Horizontal Pull', 'Compound', 'Beginner'),
  seed('Straight Arm Pulldown', 'Cable Machine', 'Back', 'Lats', ['Core'], 'Shoulder Extension', 'Isolation', 'Beginner'),
  seed('Face Pull', 'Cable Machine', 'Back', 'Rear Deltoids', ['Traps', 'Upper Back'], 'Horizontal Pull', 'Isolation', 'Beginner'),
  seed('Machine Row', 'Row Machine', 'Back', 'Upper Back', ['Lats', 'Biceps'], 'Horizontal Pull', 'Compound', 'Beginner'),
  seed('Chest Supported Row Machine', 'Row Machine', 'Back', 'Upper Back', ['Lats', 'Biceps', 'Rear Deltoids'], 'Horizontal Pull', 'Compound', 'Beginner'),
  seed('T-Bar Row', 'T-Bar Row Machine', 'Back', 'Upper Back', ['Lats', 'Biceps'], 'Horizontal Pull', 'Compound', 'Intermediate'),
  seed('Pull Up', 'Pull Up Bar', 'Back', 'Lats', ['Biceps', 'Upper Back'], 'Vertical Pull', 'Compound', 'Intermediate'),
  seed('Chin Up', 'Pull Up Bar', 'Back', 'Lats', ['Biceps', 'Upper Back'], 'Vertical Pull', 'Compound', 'Intermediate'),
  seed('Assisted Pull Up', 'Assisted Pull Up Machine', 'Back', 'Lats', ['Biceps', 'Upper Back'], 'Vertical Pull', 'Compound', 'Beginner'),
  seed('Single Arm Cable Row', 'Cable Machine', 'Back', 'Lats', ['Biceps', 'Upper Back'], 'Horizontal Pull', 'Compound', 'Beginner'),
  seed('Inverted Row', 'Bar', 'Back', 'Upper Back', ['Lats', 'Biceps'], 'Horizontal Pull', 'Compound', 'Beginner'),
  seed('Good Morning', 'Barbell', 'Back', 'Hamstrings', ['Glutes', 'Lower Back'], 'Hip Hinge', 'Compound', 'Intermediate'),

  seed('Barbell Overhead Press', 'Barbell', 'Shoulders', 'Shoulders', ['Triceps', 'Upper Chest'], 'Vertical Push', 'Compound', 'Intermediate'),
  seed('Seated Dumbbell Shoulder Press', 'Dumbbells', 'Shoulders', 'Shoulders', ['Triceps'], 'Vertical Push', 'Compound', 'Beginner'),
  seed('Arnold Press', 'Dumbbells', 'Shoulders', 'Shoulders', ['Triceps', 'Upper Chest'], 'Vertical Push', 'Compound', 'Intermediate'),
  seed('Dumbbell Lateral Raise', 'Dumbbells', 'Shoulders', 'Side Deltoids', [], 'Shoulder Abduction', 'Isolation', 'Beginner'),
  seed('Cable Lateral Raise', 'Cable Machine', 'Shoulders', 'Side Deltoids', [], 'Shoulder Abduction', 'Isolation', 'Beginner'),
  seed('Dumbbell Rear Delt Fly', 'Dumbbells', 'Shoulders', 'Rear Deltoids', ['Upper Back'], 'Horizontal Abduction', 'Isolation', 'Beginner'),
  seed('Cable Rear Delt Fly', 'Cable Machine', 'Shoulders', 'Rear Deltoids', ['Upper Back'], 'Horizontal Abduction', 'Isolation', 'Beginner'),
  seed('Dumbbell Front Raise', 'Dumbbells', 'Shoulders', 'Front Deltoids', ['Upper Chest'], 'Shoulder Flexion', 'Isolation', 'Beginner'),
  seed('Machine Shoulder Press', 'Shoulder Press Machine', 'Shoulders', 'Shoulders', ['Triceps'], 'Vertical Push', 'Compound', 'Beginner'),
  seed('Landmine Press', 'Landmine', 'Shoulders', 'Shoulders', ['Triceps', 'Upper Chest'], 'Press', 'Compound', 'Beginner'),
  seed('Upright Row', 'Barbell', 'Shoulders', 'Traps', ['Side Deltoids', 'Biceps'], 'Scapular Elevation', 'Compound', 'Intermediate'),
  seed('High Pull', 'Barbell', 'Shoulders', 'Traps', ['Glutes', 'Core', 'Deltoids'], 'Explosive Pull', 'Compound', 'Advanced'),
  seed('Smith Machine Overhead Press', 'Smith Machine', 'Shoulders', 'Shoulders', ['Triceps', 'Upper Chest'], 'Vertical Push', 'Compound', 'Intermediate'),
  seed('Scaption Raise', 'Dumbbells', 'Shoulders', 'Side Deltoids', ['Rear Deltoids'], 'Scapular Plane Raise', 'Isolation', 'Beginner'),

  seed('Barbell Curl', 'Barbell', 'Biceps', 'Biceps', ['Forearms'], 'Elbow Flexion', 'Isolation', 'Beginner'),
  seed('EZ Bar Curl', 'EZ Bar', 'Biceps', 'Biceps', ['Forearms'], 'Elbow Flexion', 'Isolation', 'Beginner'),
  seed('Dumbbell Curl', 'Dumbbells', 'Biceps', 'Biceps', ['Forearms'], 'Elbow Flexion', 'Isolation', 'Beginner'),
  seed('Hammer Curl', 'Dumbbells', 'Biceps', 'Brachialis', ['Biceps', 'Forearms'], 'Elbow Flexion', 'Isolation', 'Beginner'),
  seed('Incline Dumbbell Curl', 'Dumbbells', 'Biceps', 'Biceps', ['Forearms'], 'Elbow Flexion', 'Isolation', 'Intermediate'),
  seed('Cable Biceps Curl', 'Cable Machine', 'Biceps', 'Biceps', ['Forearms'], 'Elbow Flexion', 'Isolation', 'Beginner'),
  seed('Preacher Curl', 'Preacher Bench', 'Biceps', 'Biceps', ['Forearms'], 'Elbow Flexion', 'Isolation', 'Intermediate'),
  seed('Concentration Curl', 'Dumbbell', 'Biceps', 'Biceps', ['Forearms'], 'Elbow Flexion', 'Isolation', 'Intermediate'),
  seed('Machine Curl', 'Curl Machine', 'Biceps', 'Biceps', ['Forearms'], 'Elbow Flexion', 'Isolation', 'Beginner'),
  seed('Reverse Curl', 'Barbell', 'Biceps', 'Forearms', ['Biceps'], 'Elbow Flexion', 'Isolation', 'Beginner'),
  seed('Spider Curl', 'EZ Bar', 'Biceps', 'Biceps', ['Forearms'], 'Elbow Flexion', 'Isolation', 'Intermediate'),

  seed('Close Grip Bench Press', 'Barbell', 'Triceps', 'Triceps', ['Chest', 'Front Deltoids'], 'Elbow Extension', 'Compound', 'Intermediate'),
  seed('EZ Bar Skull Crusher', 'EZ Bar', 'Triceps', 'Triceps', [], 'Elbow Extension', 'Isolation', 'Intermediate'),
  seed('Dumbbell Overhead Triceps Extension', 'Dumbbell', 'Triceps', 'Triceps', [], 'Elbow Extension', 'Isolation', 'Beginner'),
  seed('Cable Triceps Pushdown', 'Cable Machine', 'Triceps', 'Triceps', [], 'Elbow Extension', 'Isolation', 'Beginner'),
  seed('Rope Triceps Pushdown', 'Cable Machine', 'Triceps', 'Triceps', [], 'Elbow Extension', 'Isolation', 'Beginner'),
  seed('Overhead Cable Extension', 'Cable Machine', 'Triceps', 'Triceps', [], 'Elbow Extension', 'Isolation', 'Beginner'),
  seed('Single Arm Cable Extension', 'Cable Machine', 'Triceps', 'Triceps', [], 'Elbow Extension', 'Isolation', 'Beginner'),
  seed('Weighted Dip', 'Dip Bars', 'Triceps', 'Triceps', ['Chest', 'Front Deltoids'], 'Vertical Push', 'Compound', 'Intermediate'),
  seed('Diamond Push Up', 'Bodyweight', 'Triceps', 'Triceps', ['Chest'], 'Elbow Extension', 'Compound', 'Intermediate'),
  seed('Machine Dip', 'Dip Machine', 'Triceps', 'Triceps', ['Chest', 'Front Deltoids'], 'Vertical Push', 'Compound', 'Beginner'),

  seed('Bodyweight Squat', 'Bodyweight', 'Legs', 'Quadriceps', ['Glutes', 'Core'], 'Squat', 'Compound', 'Beginner'),
  seed('Barbell Back Squat', 'Barbell', 'Legs', 'Quadriceps', ['Glutes', 'Hamstrings', 'Core'], 'Squat', 'Compound', 'Intermediate'),
  seed('Front Squat', 'Barbell', 'Legs', 'Quadriceps', ['Glutes', 'Core'], 'Squat', 'Compound', 'Advanced'),
  seed('Dumbbell Goblet Squat', 'Dumbbell', 'Legs', 'Quadriceps', ['Glutes', 'Core'], 'Squat', 'Compound', 'Beginner'),
  seed('Dumbbell Bulgarian Split Squat', 'Dumbbells', 'Legs', 'Quadriceps', ['Glutes', 'Hamstrings'], 'Single Leg Squat', 'Compound', 'Intermediate'),
  seed('Dumbbell Walking Lunge', 'Dumbbells', 'Legs', 'Quadriceps', ['Glutes', 'Hamstrings'], 'Lunge', 'Compound', 'Beginner'),
  seed('Reverse Lunge', 'Bodyweight', 'Legs', 'Quadriceps', ['Glutes', 'Hamstrings'], 'Single Leg Squat', 'Compound', 'Beginner'),
  seed('Step Up', 'Bench', 'Legs', 'Quadriceps', ['Glutes', 'Hamstrings'], 'Single Leg Squat', 'Compound', 'Beginner'),
  seed('Leg Press', 'Leg Press Machine', 'Legs', 'Quadriceps', ['Glutes', 'Hamstrings'], 'Squat', 'Compound', 'Beginner'),
  seed('Hack Squat', 'Hack Squat Machine', 'Legs', 'Quadriceps', ['Glutes'], 'Squat', 'Compound', 'Beginner'),
  seed('Smith Machine Squat', 'Smith Machine', 'Legs', 'Quadriceps', ['Glutes', 'Core'], 'Squat', 'Compound', 'Intermediate'),
  seed('Sumo Squat', 'Barbell', 'Legs', 'Quadriceps', ['Glutes', 'Adductors', 'Core'], 'Squat', 'Compound', 'Intermediate'),
  seed('Box Squat', 'Barbell', 'Legs', 'Quadriceps', ['Glutes', 'Hamstrings'], 'Squat', 'Compound', 'Intermediate'),
  seed('Sissy Squat', 'Bodyweight', 'Legs', 'Quadriceps', ['Glutes'], 'Knee Flexion', 'Isolation', 'Intermediate'),
  seed('Single Leg Romanian Deadlift', 'Dumbbell', 'Legs', 'Hamstrings', ['Glutes', 'Core'], 'Hinge', 'Compound', 'Intermediate'),
  seed('Seated Leg Curl', 'Leg Curl Machine', 'Legs', 'Hamstrings', ['Calves'], 'Knee Flexion', 'Isolation', 'Beginner'),
  seed('Lying Leg Curl', 'Leg Curl Machine', 'Legs', 'Hamstrings', ['Glutes'], 'Knee Flexion', 'Isolation', 'Beginner'),
  seed('Single Leg Leg Curl', 'Leg Curl Machine', 'Legs', 'Hamstrings', ['Glutes'], 'Knee Flexion', 'Isolation', 'Intermediate'),
  seed('Leg Extension', 'Leg Extension Machine', 'Legs', 'Quadriceps', [], 'Knee Extension', 'Isolation', 'Beginner'),

  seed('Glute Bridge', 'Bodyweight', 'Glutes', 'Glutes', ['Hamstrings', 'Core'], 'Hip Extension', 'Compound', 'Beginner'),
  seed('Barbell Hip Thrust', 'Barbell', 'Glutes', 'Glutes', ['Hamstrings'], 'Hip Extension', 'Compound', 'Intermediate'),
  seed('Cable Pull Through', 'Cable Machine', 'Glutes', 'Glutes', ['Hamstrings'], 'Hip Extension', 'Isolation', 'Beginner'),
  seed('Hip Abduction Machine', 'Hip Abductor Machine', 'Glutes', 'Glutes', ['Core'], 'Hip Abduction', 'Isolation', 'Beginner'),
  seed('Donkey Kick', 'Bodyweight', 'Glutes', 'Glutes', ['Hamstrings'], 'Hip Extension', 'Isolation', 'Beginner'),
  seed('Fire Hydrant', 'Bodyweight', 'Glutes', 'Glutes', ['Core'], 'Hip Abduction', 'Isolation', 'Beginner'),
  seed('Frog Pump', 'Bodyweight', 'Glutes', 'Glutes', ['Adductors'], 'Hip Adduction', 'Isolation', 'Beginner'),
  seed('Seated Hip Abduction', 'Hip Abductor Machine', 'Glutes', 'Glutes', ['Core'], 'Hip Abduction', 'Isolation', 'Beginner'),

  seed('Standing Calf Raise', 'Calf Raise Machine', 'Calves', 'Gastrocnemius', ['Soleus'], 'Plantar Flexion', 'Isolation', 'Beginner'),
  seed('Seated Calf Raise', 'Calf Raise Machine', 'Calves', 'Soleus', ['Gastrocnemius'], 'Plantar Flexion', 'Isolation', 'Beginner'),
  seed('Dumbbell Calf Raise', 'Dumbbells', 'Calves', 'Gastrocnemius', ['Soleus'], 'Plantar Flexion', 'Isolation', 'Beginner'),
  seed('Single Leg Calf Raise', 'Dumbbell', 'Calves', 'Gastrocnemius', ['Soleus'], 'Plantar Flexion', 'Isolation', 'Intermediate'),
  seed('Donkey Calf Raise', 'Bodyweight', 'Calves', 'Gastrocnemius', ['Soleus'], 'Plantar Flexion', 'Isolation', 'Beginner'),
  seed('Leg Press Calf Raise', 'Leg Press Machine', 'Calves', 'Gastrocnemius', ['Soleus'], 'Plantar Flexion', 'Isolation', 'Beginner'),
  seed('Standing Calf Press', 'Calf Press Machine', 'Calves', 'Gastrocnemius', ['Soleus'], 'Plantar Flexion', 'Isolation', 'Beginner'),

  seed('Barbell Shrug', 'Barbell', 'Traps', 'Traps', ['Forearms'], 'Scapular Elevation', 'Isolation', 'Beginner'),
  seed('Dumbbell Shrug', 'Dumbbells', 'Traps', 'Traps', ['Forearms'], 'Scapular Elevation', 'Isolation', 'Beginner'),
  seed('Cable Shrug', 'Cable Machine', 'Traps', 'Traps', ['Forearms'], 'Scapular Elevation', 'Isolation', 'Beginner'),
  seed('Farmer\'s Carry', 'Dumbbells', 'Forearms', 'Forearms', ['Traps', 'Core'], 'Loaded Carry', 'Compound', 'Beginner'),
  seed('Wrist Curl', 'Barbell', 'Forearms', 'Forearms', ['Biceps'], 'Wrist Flexion', 'Isolation', 'Beginner'),
  seed('Reverse Wrist Curl', 'Barbell', 'Forearms', 'Forearms', ['Biceps'], 'Wrist Extension', 'Isolation', 'Beginner'),
  seed('Plate Pinch', 'Weight Plate', 'Forearms', 'Forearms', ['Grip'], 'Grip Hold', 'Isolation', 'Beginner'),
  seed('Dead Hang', 'Pull Up Bar', 'Forearms', 'Forearms', ['Lats'], 'Grip Hold', 'Isolation', 'Beginner'),
  seed('Wrist Roller', 'Wrist Roller', 'Forearms', 'Forearms', ['Grip'], 'Wrist Flexion', 'Isolation', 'Beginner'),
  seed('Reverse Curl', 'Barbell', 'Forearms', 'Forearms', ['Biceps'], 'Elbow Flexion', 'Isolation', 'Beginner'),

  seed('Cable Crunch', 'Cable Machine', 'Core', 'Abdominals', [], 'Spinal Flexion', 'Isolation', 'Beginner'),
  seed('Hanging Leg Raise', 'Pull Up Bar', 'Core', 'Abdominals', ['Hip Flexors'], 'Hip Flexion', 'Isolation', 'Intermediate'),
  seed('Ab Wheel Rollout', 'Ab Wheel', 'Core', 'Abdominals', ['Shoulders', 'Lats'], 'Anti-Extension', 'Compound', 'Intermediate'),
  seed('Pallof Press', 'Cable Machine', 'Core', 'Core', ['Obliques'], 'Anti-Rotation', 'Isolation', 'Beginner'),
  seed('Plank', 'Bodyweight', 'Core', 'Core', ['Shoulders', 'Glutes'], 'Anti-Extension', 'Isolation', 'Beginner'),
  seed('Side Plank', 'Bodyweight', 'Core', 'Obliques', ['Core', 'Shoulders'], 'Anti-Lateral Flexion', 'Isolation', 'Beginner'),
  seed('Dead Bug', 'Bodyweight', 'Core', 'Core', ['Hip Flexors'], 'Anti-Extension', 'Isolation', 'Beginner'),
  seed('Bird Dog', 'Bodyweight', 'Core', 'Core', ['Glutes', 'Lower Back'], 'Anti-Rotation', 'Isolation', 'Beginner'),
  seed('Suitcase Carry', 'Kettlebell', 'Core', 'Obliques', ['Core', 'Grip'], 'Loaded Carry', 'Compound', 'Beginner'),
  seed('Russian Twist', 'Dumbbell', 'Core', 'Obliques', ['Core'], 'Spinal Rotation', 'Isolation', 'Beginner'),
  seed('Bicycle Crunch', 'Bodyweight', 'Core', 'Abdominals', ['Obliques'], 'Spinal Rotation', 'Isolation', 'Beginner'),
  seed('Mountain Climber', 'Bodyweight', 'Core', 'Core', ['Shoulders', 'Glutes'], 'Dynamic Core', 'Compound', 'Beginner'),
  seed('Hollow Hold', 'Bodyweight', 'Abs', 'Abdominals', ['Hip Flexors'], 'Spinal Flexion', 'Isolation', 'Intermediate'),
  seed('V-Up', 'Bodyweight', 'Abs', 'Abdominals', ['Hip Flexors'], 'Hip Flexion', 'Isolation', 'Intermediate'),
  seed('Knee Raise', 'Pull Up Bar', 'Abs', 'Abdominals', ['Hip Flexors'], 'Hip Flexion', 'Isolation', 'Beginner'),
  seed('Cable Wood Chop', 'Cable Machine', 'Abs', 'Obliques', ['Core'], 'Rotational Pull', 'Compound', 'Beginner'),

  seed('Treadmill Incline Walk', 'Treadmill', 'Cardio', 'Cardiovascular System', ['Legs', 'Glutes'], 'Steady State', 'Compound', 'Beginner'),
  seed('Stationary Bike', 'Stationary Bike', 'Cardio', 'Cardiovascular System', ['Legs'], 'Cycling', 'Compound', 'Beginner'),
  seed('Rowing Machine', 'Rowing Machine', 'Cardio', 'Cardiovascular System', ['Legs', 'Back', 'Core'], 'Rowing', 'Compound', 'Beginner'),
  seed('Assault Bike', 'Assault Bike', 'Cardio', 'Cardiovascular System', ['Legs', 'Core'], 'Cycling', 'Compound', 'Intermediate'),
  seed('Elliptical', 'Elliptical', 'Cardio', 'Cardiovascular System', ['Legs', 'Glutes'], 'Low Impact Cardio', 'Compound', 'Beginner'),
  seed('Jump Rope', 'Jump Rope', 'Cardio', 'Cardiovascular System', ['Calves', 'Shoulders'], 'Plyometric Cardio', 'Compound', 'Beginner'),
  seed('Battle Ropes', 'Battle Ropes', 'Cardio', 'Cardiovascular System', ['Shoulders', 'Core', 'Legs'], 'Wave Pattern', 'Compound', 'Intermediate'),
  seed('Stair Climber', 'Stair Climber', 'Cardio', 'Cardiovascular System', ['Legs', 'Glutes'], 'Climbing', 'Compound', 'Beginner'),
  seed('Ski Erg', 'Ski Erg', 'Cardio', 'Cardiovascular System', ['Shoulders', 'Core', 'Legs'], 'Upper Lower Pull', 'Compound', 'Intermediate'),
  seed('Beach Sled Push', 'Sled', 'Cardio', 'Legs', ['Glutes', 'Core', 'Shoulders'], 'Acceleration', 'Compound', 'Intermediate'),
  seed('Air Bike', 'Air Bike', 'Cardio', 'Cardiovascular System', ['Legs', 'Core'], 'Cycling', 'Compound', 'Intermediate'),
  seed('Burpee', 'Bodyweight', 'Full Body', 'Full Body', ['Chest', 'Legs', 'Core'], 'Plyometric Press', 'Compound', 'Intermediate'),
  seed('Kettlebell Swing', 'Kettlebell', 'Full Body', 'Glutes', ['Hamstrings', 'Core', 'Shoulders'], 'Hinge', 'Compound', 'Intermediate'),
  seed('Barbell Clean', 'Barbell', 'Full Body', 'Glutes', ['Hamstrings', 'Traps', 'Shoulders'], 'Olympic Pull', 'Compound', 'Advanced'),
  seed('Kettlebell Snatch', 'Kettlebell', 'Full Body', 'Shoulders', ['Glutes', 'Core', 'Traps'], 'Olympic Pull', 'Compound', 'Advanced'),
  seed('Dumbbell Thruster', 'Dumbbells', 'Full Body', 'Quadriceps', ['Glutes', 'Shoulders', 'Triceps'], 'Squat to Press', 'Compound', 'Intermediate'),
  seed('Med Ball Slam', 'Medicine Ball', 'Full Body', 'Core', ['Shoulders', 'Legs'], 'Explosive Rotation', 'Compound', 'Intermediate'),
  seed('Sandbag Carry', 'Sandbag', 'Full Body', 'Full Body', ['Core', 'Shoulders', 'Legs'], 'Loaded Carry', 'Compound', 'Beginner'),
  seed('Box Jump', 'Box', 'Full Body', 'Glutes', ['Quadriceps', 'Core'], 'Plyometric Squat', 'Compound', 'Intermediate'),
  seed('Shuttle Run', 'Cones', 'Full Body', 'Cardiovascular System', ['Legs', 'Core'], 'Sprint', 'Compound', 'Beginner'),
  seed('Turkish Get Up', 'Kettlebell', 'Full Body', 'Shoulders', ['Core', 'Glutes', 'Grip'], 'Complex Movement', 'Compound', 'Advanced'),
  seed('Deadlift to Press', 'Barbell', 'Full Body', 'Legs', ['Glutes', 'Shoulders', 'Core'], 'Hinge to Press', 'Compound', 'Advanced'),
  seed('Sled Push', 'Sled', 'Full Body', 'Legs', ['Glutes', 'Core', 'Shoulders'], 'Acceleration', 'Compound', 'Intermediate'),
  seed('Power Clean', 'Barbell', 'Full Body', 'Glutes', ['Hamstrings', 'Traps', 'Shoulders'], 'Olympic Pull', 'Compound', 'Advanced'),
  seed('Snatch Grip Deadlift', 'Barbell', 'Full Body', 'Hamstrings', ['Glutes', 'Lower Back', 'Traps'], 'Hinge', 'Compound', 'Advanced'),
  seed('Bear Crawl', 'Bodyweight', 'Full Body', 'Core', ['Shoulders', 'Glutes', 'Legs'], 'Quadruped Crawl', 'Compound', 'Intermediate'),
  seed('Pike Push Up', 'Bodyweight', 'Shoulders', 'Shoulders', ['Triceps', 'Upper Chest'], 'Vertical Push', 'Compound', 'Beginner'),
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
