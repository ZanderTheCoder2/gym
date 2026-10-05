import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { exercises, type Difficulty, type Exercise } from '@/data/exercises';
import { createWorkoutExercise, isValidDateKey, normalizeProgram, programsStorageKey, setNumbers, type Program, type SetEntry } from '@/data/programs';
import { normalizeProfile, profileStorageKey } from '@/data/profile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView as BaseSafeAreaView } from 'react-native-safe-area-context';

const polished = StyleSheet.create({
  screen: { backgroundColor: '#111411' },
  choiceCard: { backgroundColor: '#1A1F1B', borderColor: '#E3B967', borderRadius: 12 },
  choiceCardAlt: { backgroundColor: '#1A1F1B', borderColor: '#343C35', borderRadius: 12 },
  choiceKicker: { color: '#E3B967' },
  choiceTitle: { color: '#F4F2EA' },
  choiceCopy: { color: '#A7AFA5' },
  choiceAction: { color: '#E3B967', fontWeight: '900' as const },
});

const SafeAreaView = ({ style, ...props }: ComponentProps<typeof BaseSafeAreaView>) => <BaseSafeAreaView {...props} style={[style, { flex: 1 }]} />;

export default function WorkoutsScreen({ onExit }: { onExit?: () => void } = {}) {
  const [mode, setMode] = useState<'chooser' | 'builder' | 'tailored'>('chooser');

  if (mode === 'builder') return <ProgramBuilder onBack={() => setMode('chooser')} />;
  if (mode === 'tailored') return <TailoredBuilder onBack={() => setMode('chooser')} />;
  return <ProgramChoice onTailored={() => setMode('tailored')} onManual={() => setMode('builder')} onBack={onExit} />;
}

function ProgramChoice({ onTailored, onManual, onBack }: { onTailored: () => void; onManual: () => void; onBack?: () => void }) {
  return <View style={[styles.container, polished.screen]}><SafeAreaView style={[styles.safeArea, polished.screen]}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    {onBack && <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}><Text style={styles.backText}>BACK TO TRAIN</Text></Pressable>}
    <Text style={styles.eyebrow}>FORGED / WORKOUT PLANS</Text>
    <Text style={styles.title}>Build your next week.</Text>
    <Text style={styles.subtitle}>Start with a guided plan or build every session your way.</Text>
    <Pressable accessibilityRole="button" onPress={onTailored} style={[styles.optionCard, polished.choiceCard]}>
      <Text style={[styles.optionKicker, polished.choiceKicker]}>GUIDED SETUP</Text>
      <Text style={[styles.optionTitle, polished.choiceTitle]}>Create a tailored plan</Text>
      <Text style={[styles.optionText, polished.choiceCopy]}>Choose your goal, experience, schedule, equipment, and session length.</Text>
      <Text style={[styles.optionText, polished.choiceAction, { marginTop: 16 }]}>START SETUP  →</Text>
    </Pressable>
    <Pressable accessibilityRole="button" onPress={onManual} style={[styles.optionCardLight, polished.choiceCardAlt]}>
      <Text style={[styles.optionKicker, polished.choiceKicker]}>MANUAL BUILDER</Text>
      <Text style={[styles.optionTitle, polished.choiceTitle]}>Build your own plan</Text>
      <Text style={[styles.optionText, polished.choiceCopy]}>Set up training days, choose movements, and tune every set.</Text>
      <Text style={[styles.optionText, polished.choiceAction, { marginTop: 16 }]}>BUILD MANUALLY  →</Text>
    </Pressable>
  </ScrollView></SafeAreaView></View>;
}

function TailoredBuilder({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ goal: 'Build strength', level: 'Intermediate', days: '3', equipment: 'Full gym', sessionLength: '60 minutes' });
  const [preferredWeekdays, setPreferredWeekdays] = useState([0, 2, 4]);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [generated, setGenerated] = useState<Program | null>(null);
  const [saved, setSaved] = useState(false);
  const [startDate, setStartDate] = useState(() => localDateKey(new Date()));
  useEffect(() => {
    AsyncStorage.getItem(profileStorageKey)
      .then(value => {
        if (!value) return;
        const profile = normalizeProfile(JSON.parse(value));
        setPreferredWeekdays(profile.availableDays);
        setAnswers(current => ({
          goal: ['Build strength', 'Build muscle', 'Improve fitness', 'Lose fat', 'General health'].includes(profile.goal) ? profile.goal : current.goal,
          level: ['Beginner', 'Intermediate', 'Advanced'].includes(profile.level) ? profile.level : current.level,
          days: String(profile.trainingDays),
          equipment: profile.equipment.join(', '),
          sessionLength: profile.sessionLength,
        }));
      })
      .catch(() => setProfileError('Saved profile preferences could not be loaded. You can still choose your preferences here.'))
      .finally(() => setProfileLoaded(true));
  }, []);
  const steps = [
    { key: 'goal', label: 'What are you training for?', description: 'This sets the main emphasis of your plan.', options: ['Build strength', 'Build muscle', 'Improve fitness', 'Lose fat', 'General health'] },
    { key: 'level', label: 'How much training experience do you have?', description: 'We will match exercise difficulty and training volume to you.', options: ['Beginner', 'Intermediate', 'Advanced'] },
    { key: 'days', label: 'How many days can you train?', description: 'Your answer determines the weekly muscle-group split.', options: ['1', '2', '3', '4', '5'] },
    { key: 'equipment', label: 'What equipment do you have?', description: 'Select all the equipment you can access.', options: ['Full gym', 'Dumbbells', 'Barbell', 'Bodyweight', 'Resistance bands', 'Kettlebell'] },
    { key: 'sessionLength', label: 'How long is each session?', description: 'Longer sessions add more accessory and muscle-group work.', options: ['30 minutes', '45 minutes', '60 minutes'] },
  ] as const;
  const currentStep = steps[step];
  const currentValue = answers[currentStep.key];
  const choose = (value: string) => setAnswers(current => {
    if (currentStep.key !== 'equipment') return { ...current, [currentStep.key]: value };
    const selectedEquipment = current.equipment.split(', ').filter(Boolean);
    if (value === 'Full gym') return { ...current, equipment: selectedEquipment.includes(value) ? '' : value };
    const withoutFullGym = selectedEquipment.filter(item => item !== 'Full gym');
    const nextEquipment = withoutFullGym.includes(value) ? withoutFullGym.filter(item => item !== value) : [...withoutFullGym, value];
    return { ...current, equipment: nextEquipment.join(', ') };
  });
  const next = () => { if (!profileLoaded) return; if (step < steps.length - 1) setStep(current => current + 1); else { setGenerated({ ...buildTailoredProgram({ ...answers, days: Number(answers.days), trainingWeekdays: preferredWeekdays.slice(0, Number(answers.days)) }), trainingWeekdays: preferredWeekdays.slice(0, Number(answers.days)) }); setSaved(false); } };
  const canSave = isValidDateKey(startDate) && startDate >= localDateKey(new Date());
  const save = async () => { if (!generated || !canSave) return; const stored = await AsyncStorage.getItem(programsStorageKey); const existing = stored ? JSON.parse(stored) : []; const scheduledProgram = { ...generated, startDate }; await AsyncStorage.setItem(programsStorageKey, JSON.stringify([...existing.filter((item: Program) => item.id !== generated.id), scheduledProgram])); setGenerated(scheduledProgram); setSaved(true); };
  const chooseStartDate = (offset: number) => setStartDate(localDateKey(addCalendarDays(new Date(), offset)));
  return <View style={styles.container}><SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.content}><Pressable accessibilityRole="button" onPress={() => step === 0 ? onBack() : setStep(current => current - 1)} style={styles.backButton}><Text style={styles.backText}>{step === 0 ? 'BACK TO OPTIONS' : 'BACK'}</Text></Pressable><Text style={styles.eyebrow}>FORGED FITNESS / SETUP {step + 1} OF {steps.length}</Text><View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: steps.length, now: step + 1 }} style={{ backgroundColor: '#3A3A3A', borderRadius: 4, height: 6, marginTop: 18, overflow: 'hidden' }}><View style={{ backgroundColor: '#D4AF37', borderRadius: 4, height: 6, width: `${((step + 1) / steps.length) * 100}%` }} /></View><Text style={styles.title}>{currentStep.label}</Text><Text style={styles.subtitle}>{currentStep.description}</Text>{profileError ? <Text style={[styles.optionText, { color: '#E3B967' }]}>{profileError}</Text> : null}<View style={{ marginTop: 18 }}>{currentStep.options.map(option => { const selected = currentStep.key === 'equipment' ? answers.equipment.split(', ').includes(option) : option === currentValue; return <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => choose(option)} style={selected ? styles.optionCard : styles.optionCardLight}><Text style={styles.optionTitle}>{option}</Text>{selected && <Text style={styles.optionText}>Selected</Text>}</Pressable>; })}</View><Pressable accessibilityRole="button" disabled={!profileLoaded || (currentStep.key === 'equipment' && !answers.equipment)} onPress={next} style={[styles.generateButton, (!profileLoaded || (currentStep.key === 'equipment' && !answers.equipment)) && { opacity: 0.5 }]}><Text style={styles.saveText}>{!profileLoaded ? 'LOADING PREFERENCES…' : step === steps.length - 1 ? 'GENERATE MY WORKOUT' : 'CONTINUE'}</Text></Pressable>{generated && <View style={styles.generatedCard}><Text style={styles.optionKicker}>RECOMMENDED PROGRAM</Text><Text style={styles.optionTitle}>{generated.name}</Text><Text style={[styles.optionText, { marginTop: 18 }]}>When would you like to start?</Text><StartDateCalendar key={startDate} startDate={startDate} onChange={date => { setStartDate(date); setSaved(false); }} /><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>{[['Today', 0], ['Tomorrow', 1], ['Next week', 7]].map(([label, offset]) => <Pressable key={label} accessibilityRole="button" onPress={() => { chooseStartDate(Number(offset)); setSaved(false); }} style={styles.filter}><Text style={styles.filterText}>{label}</Text></Pressable>)}</View>{generated.days.map(day => <View key={day.name} style={styles.generatedDay}><Text style={styles.dayName}>{day.name}</Text><Text style={styles.dayExercises}>{day.exercises.map(exercise => exercise.name).join(' · ')}</Text></View>)}<Pressable accessibilityRole="button" disabled={!canSave} onPress={save} style={[styles.saveButton, !canSave && { opacity: 0.5 }]}><Text style={styles.saveText}>{saved ? 'SAVED TO HOME' : 'SAVE PROGRAM'}</Text></Pressable></View>}</ScrollView></SafeAreaView></View>;
}

function localDateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function addCalendarDays(date: Date, days: number) { return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days); }

function StartDateCalendar({ startDate, onChange }: { startDate: string; onChange: (date: string) => void }) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const [year, month] = startDate.split('-').map(Number);
    return new Date(year, month - 1, 1);
  });
  const todayKey = localDateKey(new Date());
  const [selectedYear, selectedMonth, selectedDay] = startDate.split('-').map(Number);
  const selectedDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
  const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const leadingDays = (monthStart.getDay() + 6) % 7;
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const calendarCells = Array.from({ length: Math.ceil((leadingDays + daysInMonth) / 7) * 7 }, (_, index) => {
    const day = index - leadingDays + 1;
    return day < 1 || day > daysInMonth ? undefined : new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
  });
  const changeMonth = (offset: number) => setVisibleMonth(current => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  const canShowPreviousMonth = localDateKey(monthStart) > `${todayKey.slice(0, 7)}-01`;

  return <View style={calendarStyles.container}>
    <View style={calendarStyles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Previous month" disabled={!canShowPreviousMonth} onPress={() => changeMonth(-1)} style={[calendarStyles.monthButton, !canShowPreviousMonth && calendarStyles.disabledButton]}><Text style={calendarStyles.monthArrow}>‹</Text></Pressable>
      <Text style={calendarStyles.monthTitle}>{visibleMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => changeMonth(1)} style={calendarStyles.monthButton}><Text style={calendarStyles.monthArrow}>›</Text></Pressable>
    </View>
    <View style={calendarStyles.grid}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => <Text key={`${label}-${index}`} style={calendarStyles.weekday}>{label}</Text>)}</View>
    <View style={calendarStyles.grid}>{calendarCells.map((date, index) => {
      if (!date) return <View key={`empty-${index}`} style={calendarStyles.dayCell} />;
      const dateKey = localDateKey(date);
      const disabled = dateKey < todayKey;
      const selected = dateKey === startDate;
      return <Pressable key={dateKey} accessibilityRole="button" accessibilityLabel={date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} accessibilityState={{ selected, disabled }} disabled={disabled} onPress={() => onChange(dateKey)} style={calendarStyles.dayCell}>
        <View style={[calendarStyles.dayCircle, selected && calendarStyles.selectedDay, disabled && calendarStyles.pastDay]}><Text style={[calendarStyles.dayText, selected && calendarStyles.selectedDayText, disabled && calendarStyles.pastDayText]}>{date.getDate()}</Text></View>
      </Pressable>;
    })}</View>
    <Text style={calendarStyles.selectedLabel}>Selected: {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</Text>
  </View>;
}

const calendarStyles = StyleSheet.create({
  container: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 10, borderWidth: 1, marginTop: 12, padding: 12 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  monthButton: { alignItems: 'center', borderColor: '#3A3A3A', borderRadius: 7, borderWidth: 1, height: 34, justifyContent: 'center', width: 38 },
  disabledButton: { opacity: 0.35 },
  monthArrow: { color: '#E3B967', fontSize: 24, lineHeight: 28 },
  monthTitle: { color: '#F4F2EA', fontSize: 14, fontWeight: '900' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { color: '#A7AFA5', fontSize: 10, fontWeight: '900', paddingVertical: 7, textAlign: 'center', width: '14.2857%' },
  dayCell: { alignItems: 'center', height: 42, justifyContent: 'center', width: '14.2857%' },
  dayCircle: { alignItems: 'center', borderRadius: 18, height: 34, justifyContent: 'center', width: 34 },
  selectedDay: { backgroundColor: '#E3B967' },
  pastDay: { opacity: 0.4 },
  dayText: { color: '#F4F2EA', fontSize: 12, fontWeight: '700' },
  selectedDayText: { color: '#111411', fontWeight: '900' },
  pastDayText: { color: '#747A74' },
  selectedLabel: { color: '#A7AFA5', fontSize: 11, marginTop: 9, textAlign: 'center' },
});

function buildTailoredProgram({ goal, level, days, equipment, sessionLength, trainingWeekdays }: { goal: string; level: string; days: number; equipment: string; sessionLength: string; trainingWeekdays: number[] }): Program {
  const equipmentGroups: Record<string, string[]> = {
    'Full gym': [...new Set(exercises.map(exercise => exercise.equipment))],
    Dumbbells: ['Bodyweight', 'Dumbbells', 'Dumbbell'],
    Barbell: ['Bodyweight', 'Barbell'],
    Bodyweight: ['Bodyweight'],
    'Resistance bands': ['Resistance Bands', 'Resistance Band', 'Bodyweight'],
    Kettlebell: ['Kettlebell', 'Bodyweight'],
  };
  const allowedEquipment = new Set(equipment.split(', ').flatMap(option => equipmentGroups[option] ?? []));
  const difficultyRank: Record<Difficulty, number> = { Beginner: 1, Intermediate: 2, Advanced: 3 };
  const maxDifficulty = difficultyRank[level as Difficulty] ?? difficultyRank.Intermediate;
  const eligible = exercises.filter(exercise => allowedEquipment.has(exercise.equipment) && (level === 'Beginner' ? exercise.difficulty === 'Beginner' : difficultyRank[exercise.difficulty] <= maxDifficulty));
  const exerciseCount = sessionLength === '30 minutes' ? 4 : sessionLength === '45 minutes' ? 5 : 6;
  const dayTemplates = createDayTemplates(Math.min(5, Math.max(1, days)));
  const coveredCategories = new Set<string>();
  const usedExerciseIds = new Set<string>();
  const workoutDays = Array.from({ length: Math.min(5, Math.max(1, days)) }, (_, dayIndex) => {
    const template = dayTemplates[dayIndex];
    const chosen: Exercise[] = [];
    template.roles.forEach(role => {
      const candidates = eligible.filter(exercise => template.categories.includes(exercise.category) && !chosen.some(item => item.id === exercise.id) && exerciseRole(exercise) === role);
      const ranked = candidates.sort((left, right) => scoreExercise(right, goal, template.categories, coveredCategories, usedExerciseIds) - scoreExercise(left, goal, template.categories, coveredCategories, usedExerciseIds));
      if (ranked[0] && chosen.length < exerciseCount) chosen.push(ranked[0]);
    });
    eligible.filter(exercise => template.categories.includes(exercise.category) && !chosen.some(item => item.id === exercise.id)).sort((left, right) => scoreExercise(right, goal, template.categories, coveredCategories, usedExerciseIds) - scoreExercise(left, goal, template.categories, coveredCategories, usedExerciseIds)).some(exercise => {
      if (chosen.length >= exerciseCount) return true;
      chosen.push(exercise);
      return false;
    });
    chosen.forEach(exercise => { coveredCategories.add(exercise.category); usedExerciseIds.add(exercise.id); });
    return { name: `Day ${dayIndex + 1} · ${template.name}`, exercises: chosen.slice(0, exerciseCount).map(exercise => prescribedExercise(exercise, level, goal)) };
  });
  return { id: `tailored-${Date.now()}`, name: `${goal} · ${days} day plan · ${sessionLength.replace(' minutes', ' min')}`, days: workoutDays, trainingWeekdays };
}

function createDayTemplates(days: number) {
  const fullBody = { name: 'Full Body', categories: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Calves', 'Glutes', 'Traps', 'Forearms', 'Core', 'Full Body'], roles: ['squat', 'hinge', 'push', 'pull', 'core', 'accessory'] };
  const lower = { name: 'Lower Body', categories: ['Legs', 'Glutes', 'Calves', 'Core'], roles: ['squat', 'hinge', 'accessory', 'core', 'accessory'] };
  const push = { name: 'Upper Push', categories: ['Chest', 'Shoulders', 'Triceps', 'Core'], roles: ['push', 'accessory', 'core', 'accessory'] };
  const pull = { name: 'Upper Pull', categories: ['Back', 'Biceps', 'Traps', 'Forearms', 'Core'], roles: ['pull', 'accessory', 'core', 'accessory'] };
  if (days === 1) return [fullBody];
  if (days === 2) return [lower, { name: 'Upper Body', categories: [...push.categories, ...pull.categories], roles: ['push', 'pull', 'accessory', 'core', 'accessory'] }];
  if (days === 3) return [lower, push, pull];
  if (days === 4) return [lower, push, { ...lower, name: 'Lower Body B' }, pull];
  return [lower, push, { ...lower, name: 'Lower Body B' }, pull, fullBody];
}

function exerciseRole(exercise: Exercise) {
  if (['Squat', 'Single Leg Squat'].includes(exercise.movementPattern)) return 'squat';
  if (['Hinge', 'Hip Extension'].includes(exercise.movementPattern)) return 'hinge';
  if (['Horizontal Push', 'Incline Push', 'Decline Push', 'Vertical Push', 'Press', 'Squat to Press'].includes(exercise.movementPattern)) return 'push';
  if (['Horizontal Pull', 'Vertical Pull', 'Olympic Pull'].includes(exercise.movementPattern)) return 'pull';
  if (['Anti-Extension', 'Anti-Rotation', 'Spinal Flexion', 'Hip Flexion'].includes(exercise.movementPattern)) return 'core';
  if (exercise.movementPattern === 'Loaded Carry') return 'carry';
  return 'accessory';
}

function scoreExercise(exercise: Exercise, goal: string, categories: string[], coveredCategories: Set<string>, usedExerciseIds: Set<string>) {
  const targetScore = categories.includes(exercise.category) ? 10 : 0;
  const coverageScore = coveredCategories.has(exercise.category) ? 0 : 6;
  const compoundScore = exercise.type === 'Compound' ? 3 : 0;
  const fitnessScore = goal === 'Improve fitness' || goal === 'Lose fat' ? compoundScore * 2 : compoundScore;
  const repeatPenalty = usedExerciseIds.has(exercise.id) ? 7 : 0;
  return targetScore + coverageScore + fitnessScore - repeatPenalty;
}

function prescribedExercise(exercise: Exercise, level: string, goal: string) {
  const setCount = level === 'Beginner' ? 2 : level === 'Intermediate' ? 3 : 4;
  const reps = goal === 'Build strength' ? (level === 'Beginner' ? '8-10' : '5-8') : goal === 'Lose fat' ? '10-15' : '8-12';
  return { ...createWorkoutExercise(exercise.name), sets: Array.from({ length: setCount }, () => ({ weight: '', reps })) };
}

export function ProgramBuilder({ onBack }: { onBack: () => void }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [program, setProgram] = useState<Program>({ id: '', name: '', days: [{ name: 'Day 1', exercises: [] }] });
  const [selectedDay, setSelectedDay] = useState(0);
  const [query, setQuery] = useState('');
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { AsyncStorage.getItem(programsStorageKey).then(value => { if (value) setPrograms(JSON.parse(value).flatMap((item: unknown) => { const normalized = normalizeProgram(item); return normalized ? [normalized] : []; })); }).catch(() => undefined).finally(() => setLoaded(true)); }, []);
  useEffect(() => { if (loaded) AsyncStorage.setItem(programsStorageKey, JSON.stringify(programs)).catch(() => undefined); }, [programs, loaded]);
  const currentDay = program.days[selectedDay] ?? program.days[0];
  const filteredExercises = useMemo(() => exercises
    .filter(exercise => exercise.name.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((left, right) => left.name.localeCompare(right.name)), [query]);
  const updateDay = (update: (day: Program['days'][number]) => Program['days'][number]) => setProgram(current => ({ ...current, days: current.days.map((day, index) => index === selectedDay ? update(day) : day) }));
  const addExercise = (name: string) => updateDay(day => day.exercises.some(exercise => exercise.name === name) ? day : { ...day, exercises: [...day.exercises, createWorkoutExercise(name)] });
  const saveProgram = () => { if (!program.name.trim()) { Alert.alert('Name your program', 'Add a name before saving.'); return; } const saved = { ...program, id: program.id || `program-${Date.now()}`, name: program.name.trim() }; setPrograms(current => [...current.filter(item => item.id !== saved.id), saved]); setProgram(saved); Alert.alert('Saved locally', 'Your program is ready on Home.'); };
  const updateSet = (exerciseName: string, setIndex: number, field: keyof SetEntry, value: string) => updateDay(day => ({ ...day, exercises: day.exercises.map(exercise => exercise.name !== exerciseName ? exercise : { ...exercise, sets: exercise.sets.map((set, index) => index === setIndex ? { ...set, [field]: value } : set) }) }));
  return <View style={styles.container}><SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.content}><Pressable onPress={onBack} style={styles.backButton}><Text style={styles.backText}>BACK TO WORKOUTS</Text></Pressable><Text style={styles.eyebrow}>FORGED FITNESS / PROGRAM BUILDER</Text><Text style={styles.title}>Build your week.</Text><Text style={styles.subtitle}>Create and save a program without leaving Workouts.</Text><View style={styles.builderActions}><TextInput value={program.name} onChangeText={name => setProgram(current => ({ ...current, name }))} placeholder="Program name" placeholderTextColor="#8E8E8E" style={styles.programInput} /><Pressable onPress={saveProgram} style={styles.saveButton}><Text style={styles.saveText}>SAVE</Text></Pressable></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayTabs}>{program.days.map((day, index) => <Pressable key={`${day.name}-${index}`} onPress={() => setSelectedDay(index)} style={[styles.dayTab, selectedDay === index && styles.dayTabActive]}><Text style={[styles.dayTabText, selectedDay === index && styles.dayTabTextActive]}>{day.name}</Text></Pressable>)}<Pressable onPress={() => { setProgram(current => ({ ...current, days: [...current.days, { name: `Day ${current.days.length + 1}`, exercises: [] }] })); setSelectedDay(program.days.length); }} style={styles.addDay}><Text style={styles.addDayText}>+ DAY</Text></Pressable></ScrollView>{currentDay && <View style={styles.builderCard}><TextInput value={currentDay.name} onChangeText={name => updateDay(() => ({ ...currentDay, name }))} style={styles.dayNameInput} /><Text style={styles.muted}>{currentDay.exercises.length} exercises · 5 sets each</Text>{currentDay.exercises.map(exercise => <View key={exercise.name} style={styles.selectedExercise}><View style={styles.exerciseHeader}><Text style={styles.selectedName}>{exercise.name}</Text><Pressable onPress={() => updateDay(day => ({ ...day, exercises: day.exercises.filter(item => item.name !== exercise.name) }))}><Text style={styles.removeText}>REMOVE</Text></Pressable></View>{exercise.sets.map((set, index) => <View key={`${exercise.name}-${index}`} style={styles.setRow}><Text style={styles.setNumber}>{setNumbers[index]}</Text><TextInput value={set.weight} onChangeText={value => updateSet(exercise.name, index, 'weight', value)} placeholder="kg" placeholderTextColor="#8E8E8E" style={styles.setInput} /><TextInput value={set.reps} onChangeText={value => updateSet(exercise.name, index, 'reps', value)} placeholder="reps" placeholderTextColor="#8E8E8E" style={styles.setInput} /></View>)}</View>)}</View>}<Text style={styles.libraryTitle}>Add exercises</Text><TextInput value={query} onChangeText={setQuery} placeholder="Search the canonical library" placeholderTextColor="#8E8E8E" style={styles.search} /><Text style={styles.resultCount}>{filteredExercises.length} exercise{filteredExercises.length === 1 ? '' : 's'} available</Text>{filteredExercises.map(exercise => <Pressable key={exercise.id} onPress={() => addExercise(exercise.name)} style={styles.exerciseRow}><View><Text style={styles.name}>{exercise.name}</Text><Text style={styles.muted}>{exercise.primaryMuscle} · {exercise.equipment}</Text></View><Text style={styles.addText}>{currentDay?.exercises.some(item => item.name === exercise.name) ? 'ADDED' : '+ ADD'}</Text></Pressable>)}</ScrollView></SafeAreaView></View>;
}

const styles = StyleSheet.create({ container: { backgroundColor: '#0B0B0B', flex: 1 }, safeArea: { alignSelf: 'center', maxWidth: MaxContentWidth, paddingBottom: BottomTabInset, width: '100%' }, content: { padding: 20, paddingBottom: 100 }, eyebrow: { color: '#D4AF37', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 }, title: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', marginTop: 18 }, subtitle: { color: '#B8B8B8', fontSize: 14, lineHeight: 21, marginTop: 6 }, createButton: { backgroundColor: '#242424', borderRadius: 12, marginTop: 22, padding: 16 }, createButtonText: { color: '#FFF', fontSize: 13, fontWeight: '900' }, createButtonHint: { color: '#E6C85C', fontSize: 12, lineHeight: 18, marginTop: 5 }, libraryTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '900', marginTop: 28 }, search: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 8, borderWidth: 1, color: '#FFFFFF', marginTop: 12, padding: 13 }, filters: { gap: 8, paddingVertical: 14 }, filter: { backgroundColor: '#2A2A2A', borderRadius: 8, paddingHorizontal: 11, paddingVertical: 9 }, filterText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' }, resultCount: { color: '#B8B8B8', fontSize: 11, fontWeight: '900', marginBottom: 8 }, card: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 10, borderWidth: 1, marginBottom: 9, padding: 14 }, cardTop: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' }, name: { color: '#FFFFFF', flex: 1, fontSize: 15, fontWeight: '900' }, type: { color: '#D4AF37', fontSize: 9, fontWeight: '900', letterSpacing: 1 }, meta: { color: '#D4AF37', fontSize: 11, fontWeight: '800', marginTop: 6 }, muscles: { color: '#CFCFCF', fontSize: 12, marginTop: 8 }, movement: { color: '#B8B8B8', fontSize: 11, marginTop: 4 }, backButton: { alignSelf: 'flex-start', marginBottom: 24 }, backText: { color: '#D4AF37', fontSize: 11, fontWeight: '900' }, optionCard: { backgroundColor: '#242424', borderRadius: 12, marginTop: 22, padding: 17 }, optionCardLight: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 12, borderWidth: 1, marginTop: 12, padding: 17 }, optionKicker: { color: '#D4AF37', fontSize: 10, fontWeight: '900', letterSpacing: 1 }, optionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginTop: 8 }, optionText: { color: '#B8B8B8', fontSize: 13, lineHeight: 20, marginTop: 6 },
  question: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 10, borderWidth: 1, marginTop: 10, padding: 15 }, questionLabel: { color: '#B8B8B8', fontSize: 11, fontWeight: '800' }, questionValue: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginTop: 5 }, generateButton: { backgroundColor: '#D4AF37', borderRadius: 8, marginTop: 18, padding: 14, alignItems: 'center' }, generatedCard: { backgroundColor: '#2A2412', borderRadius: 12, marginTop: 20, padding: 16 }, generatedDay: { borderTopColor: '#4A3D14', borderTopWidth: 1, marginTop: 12, paddingTop: 10 }, dayName: { color: '#D4AF37', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' }, dayExercises: { color: '#FFFFFF', fontSize: 12, lineHeight: 19, marginTop: 4 }, builderActions: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 22 }, programInput: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 8, borderWidth: 1, color: '#FFFFFF', flex: 1, padding: 13 }, saveButton: { backgroundColor: '#D4AF37', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 13 }, saveText: { color: '#000000', fontSize: 11, fontWeight: '900' }, dayTabs: { gap: 8, paddingVertical: 16 }, dayTab: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 8, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 }, dayTabActive: { backgroundColor: '#D4AF37' }, dayTabText: { color: '#CFCFCF', fontSize: 11, fontWeight: '900' }, dayTabTextActive: { color: '#000000' }, addDay: { borderColor: '#D4AF37', borderRadius: 8, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 10 }, addDayText: { color: '#D4AF37', fontSize: 11, fontWeight: '900' }, builderCard: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 10, borderWidth: 1, padding: 14 }, dayNameInput: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', marginBottom: 4 }, muted: { color: '#B8B8B8', fontSize: 11, marginTop: 4 }, selectedExercise: { borderTopColor: '#3A3A3A', borderTopWidth: 1, marginTop: 12, paddingTop: 12 }, exerciseHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, selectedName: { color: '#FFFFFF', flex: 1, fontSize: 14, fontWeight: '900' }, removeText: { color: '#D4AF37', fontSize: 10, fontWeight: '900' }, setRow: { alignItems: 'center', flexDirection: 'row', gap: 7, marginTop: 7 }, setNumber: { color: '#D4AF37', fontSize: 11, fontWeight: '900', textAlign: 'center', width: 25 }, setInput: { backgroundColor: '#0B0B0B', borderColor: '#3A3A3A', borderRadius: 6, borderWidth: 1, color: '#FFFFFF', flex: 1, padding: 8, textAlign: 'center' }, exerciseRow: { alignItems: 'center', backgroundColor: '#171717', borderBottomColor: '#3A3A3A', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', padding: 13 }, addText: { color: '#D4AF37', fontSize: 10, fontWeight: '900' } });
