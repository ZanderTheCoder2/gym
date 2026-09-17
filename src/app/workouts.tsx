import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { exercises, type Difficulty, type Exercise } from '@/data/exercises';
import { createWorkoutExercise, normalizeProgram, programsStorageKey, setNumbers, type Program, type SetEntry } from '@/data/programs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WorkoutsScreen() {
  const [mode, setMode] = useState<'chooser' | 'builder' | 'tailored'>('chooser');

  if (mode === 'builder') return <ProgramBuilder onBack={() => setMode('chooser')} />;
  if (mode === 'tailored') return <TailoredBuilder onBack={() => setMode('chooser')} />;
  return <ProgramChoice onTailored={() => setMode('tailored')} onManual={() => setMode('builder')} />;
}

function ProgramChoice({ onTailored, onManual }: { onTailored: () => void; onManual: () => void }) {
  return <View style={[styles.container, { backgroundColor: '#000000' }]}><SafeAreaView style={[styles.safeArea, { backgroundColor: '#000000' }]}><ScrollView contentContainerStyle={styles.content}><Text style={[styles.eyebrow, { color: '#FFFFFF' }]}>FORGED FITNESS / WORKOUTS</Text><Text style={[styles.title, { color: '#FFFFFF' }]}>Build your next week.</Text><Text style={[styles.subtitle, { color: '#B8B8B8' }]}>Choose how much help you want. Your saved programs will appear on Home.</Text><Pressable onPress={onTailored} style={[styles.optionCard, { backgroundColor: '#171717', borderColor: '#FFFFFF' }]}><Text style={[styles.optionKicker, { color: '#FFFFFF' }]}>OPTION ONE</Text><Text style={[styles.optionTitle, { color: '#FFFFFF' }]}>Create me a tailored workout</Text><Text style={[styles.optionText, { color: '#B8B8B8' }]}>Answer a few questions and get a plan matched to your goal, experience, days, equipment, and time.</Text><Text style={[styles.optionText, { color: '#FFFFFF', fontWeight: '900', marginTop: 14 }]}>START SETUP  →</Text></Pressable><Pressable onPress={onManual} style={[styles.optionCardLight, { backgroundColor: '#090909', borderColor: '#4A4A4A' }]}><Text style={[styles.optionKicker, { color: '#FFFFFF' }]}>OPTION TWO</Text><Text style={[styles.optionTitle, { color: '#FFFFFF' }]}>Create your program</Text><Text style={[styles.optionText, { color: '#B8B8B8' }]}>Build each training day yourself, choose exercises, and enter your sets and reps.</Text><Text style={[styles.optionText, { color: '#FFFFFF', fontWeight: '900', marginTop: 14 }]}>BUILD MANUALLY  →</Text></Pressable></ScrollView></SafeAreaView></View>;
}

function TailoredBuilder({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ goal: 'Build strength', level: 'Intermediate', days: '3', equipment: 'Full gym', sessionLength: '60 minutes' });
  const [generated, setGenerated] = useState<Program | null>(null);
  const [saved, setSaved] = useState(false);
  const steps = [
    { key: 'goal', label: 'What are you training for?', description: 'This sets the main emphasis of your plan.', options: ['Build strength', 'Build muscle', 'Improve fitness', 'Lose fat'] },
    { key: 'level', label: 'How much training experience do you have?', description: 'We will match exercise difficulty and training volume to you.', options: ['Beginner', 'Intermediate', 'Advanced'] },
    { key: 'days', label: 'How many days can you train?', description: 'Your answer determines the weekly muscle-group split.', options: ['1', '2', '3', '4', '5'] },
    { key: 'equipment', label: 'What equipment do you have?', description: 'Only movements you can actually perform will be included.', options: ['Full gym', 'Dumbbells', 'Barbell', 'Bodyweight'] },
    { key: 'sessionLength', label: 'How long is each session?', description: 'Longer sessions add more accessory and muscle-group work.', options: ['30 minutes', '45 minutes', '60 minutes'] },
  ] as const;
  const currentStep = steps[step];
  const currentValue = answers[currentStep.key];
  const choose = (value: string) => setAnswers(current => ({ ...current, [currentStep.key]: value }));
  const next = () => { if (step < steps.length - 1) setStep(current => current + 1); else { setGenerated(buildTailoredProgram({ ...answers, days: Number(answers.days) })); setSaved(false); } };
  const save = async () => { if (!generated) return; const stored = await AsyncStorage.getItem(programsStorageKey); const existing = stored ? JSON.parse(stored) : []; await AsyncStorage.setItem(programsStorageKey, JSON.stringify([...existing.filter((item: Program) => item.id !== generated.id), generated])); setSaved(true); };
  return <View style={styles.container}><SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.content}><Pressable onPress={() => step === 0 ? onBack() : setStep(current => current - 1)} style={styles.backButton}><Text style={styles.backText}>{step === 0 ? 'BACK TO OPTIONS' : 'BACK'}</Text></Pressable><Text style={styles.eyebrow}>FORGED FITNESS / SETUP {step + 1} OF {steps.length}</Text><View style={{ backgroundColor: '#3A3A3A', borderRadius: 4, height: 6, marginTop: 18, overflow: 'hidden' }}><View style={{ backgroundColor: '#D4AF37', borderRadius: 4, height: 6, width: `${((step + 1) / steps.length) * 100}%` }} /></View><Text style={styles.title}>{currentStep.label}</Text><Text style={styles.subtitle}>{currentStep.description}</Text><View style={{ marginTop: 18 }}>{currentStep.options.map(option => <Pressable key={option} onPress={() => choose(option)} style={option === currentValue ? styles.optionCard : styles.optionCardLight}><Text style={styles.optionTitle}>{option}</Text>{option === currentValue && <Text style={styles.optionText}>Selected</Text>}</Pressable>)}</View><Pressable onPress={next} style={styles.generateButton}><Text style={styles.saveText}>{step === steps.length - 1 ? 'GENERATE MY WORKOUT' : 'CONTINUE'}</Text></Pressable>{generated && <View style={styles.generatedCard}><Text style={styles.optionKicker}>RECOMMENDED PROGRAM</Text><Text style={styles.optionTitle}>{generated.name}</Text>{generated.days.map(day => <View key={day.name} style={styles.generatedDay}><Text style={styles.dayName}>{day.name}</Text><Text style={styles.dayExercises}>{day.exercises.map(exercise => exercise.name).join(' · ')}</Text></View>)}<Pressable onPress={save} style={styles.saveButton}><Text style={styles.saveText}>{saved ? 'SAVED TO HOME' : 'SAVE PROGRAM'}</Text></Pressable></View>}</ScrollView></SafeAreaView></View>;
}

function TailoredBuilderLegacy({ onBack }: { onBack: () => void }) {
  const [goal, setGoal] = useState('Build strength');
  const [level, setLevel] = useState('Intermediate');
  const [days, setDays] = useState('3');
  const [equipment, setEquipment] = useState('Full gym');
  const [sessionLength, setSessionLength] = useState('60 minutes');
  const [generated, setGenerated] = useState<Program | null>(null);
  const [saved, setSaved] = useState(false);
  const cycle = (value: string, values: string[], setter: (next: string) => void) => setter(values[(values.indexOf(value) + 1) % values.length]);
  const generate = () => { setGenerated(buildTailoredProgram({ goal, level, days: Number(days), equipment, sessionLength })); setSaved(false); };
  const save = async () => { if (!generated) return; const stored = await AsyncStorage.getItem(programsStorageKey); const existing = stored ? JSON.parse(stored) : []; await AsyncStorage.setItem(programsStorageKey, JSON.stringify([...existing.filter((item: Program) => item.id !== generated.id), generated])); setSaved(true); };
  return <View style={styles.container}><SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.content}><Pressable onPress={onBack} style={styles.backButton}><Text style={styles.backText}>BACK TO OPTIONS</Text></Pressable><Text style={styles.eyebrow}>FORGED FITNESS / TAILORED PLAN</Text><Text style={styles.title}>Tell us how you train.</Text><Text style={styles.subtitle}>Your level, equipment, goal, days, and session length all shape the plan.</Text><Question label="Goal" value={goal} onPress={() => cycle(goal, ['Build strength', 'Build muscle', 'Improve fitness', 'Lose fat'], setGoal)} /><Question label="Experience" value={level} onPress={() => cycle(level, ['Beginner', 'Intermediate', 'Advanced'], setLevel)} /><Question label="Days per week" value={days} onPress={() => cycle(days, ['1', '2', '3', '4', '5'], setDays)} /><Question label="Equipment" value={equipment} onPress={() => cycle(equipment, ['Full gym', 'Dumbbells', 'Barbell', 'Bodyweight'], setEquipment)} /><Question label="Session length" value={sessionLength} onPress={() => cycle(sessionLength, ['30 minutes', '45 minutes', '60 minutes'], setSessionLength)} /><Pressable onPress={generate} style={styles.generateButton}><Text style={styles.saveText}>GENERATE WORKOUT</Text></Pressable>{generated && <View style={styles.generatedCard}><Text style={styles.optionKicker}>RECOMMENDED PROGRAM</Text><Text style={styles.optionTitle}>{generated.name}</Text>{generated.days.map(day => <View key={day.name} style={styles.generatedDay}><Text style={styles.dayName}>{day.name}</Text><Text style={styles.dayExercises}>{day.exercises.map(exercise => exercise.name).join(' · ')}</Text></View>)}<Pressable onPress={save} style={styles.saveButton}><Text style={styles.saveText}>{saved ? 'SAVED TO HOME' : 'SAVE PROGRAM'}</Text></Pressable></View>}</ScrollView></SafeAreaView></View>;
}

function Question({ label, value, onPress }: { label: string; value: string; onPress: () => void }) { return <Pressable onPress={onPress} style={styles.question}><Text style={styles.questionLabel}>{label}</Text><Text style={styles.questionValue}>{value}  ›</Text></Pressable>; }

function buildTailoredProgram({ goal, level, days, equipment, sessionLength }: { goal: string; level: string; days: number; equipment: string; sessionLength: string }): Program {
  const allowedEquipment: Record<string, string[]> = {
    'Full gym': [...new Set(exercises.map(exercise => exercise.equipment))],
    Dumbbells: ['Bodyweight', 'Dumbbells', 'Dumbbell'],
    Barbell: ['Bodyweight', 'Barbell'],
    Bodyweight: ['Bodyweight'],
  };
  const difficultyRank: Record<Difficulty, number> = { Beginner: 1, Intermediate: 2, Advanced: 3 };
  const maxDifficulty = difficultyRank[level as Difficulty] ?? difficultyRank.Intermediate;
  const eligible = exercises.filter(exercise => allowedEquipment[equipment]?.includes(exercise.equipment) && (level === 'Beginner' ? exercise.difficulty === 'Beginner' : difficultyRank[exercise.difficulty] <= maxDifficulty));
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
  return { id: `tailored-${Date.now()}`, name: `${goal} · ${days} day plan · ${sessionLength.replace(' minutes', ' min')}`, days: workoutDays };
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

function ProgramBuilder({ onBack }: { onBack: () => void }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [program, setProgram] = useState<Program>({ id: '', name: '', days: [{ name: 'Day 1', exercises: [] }] });
  const [selectedDay, setSelectedDay] = useState(0);
  const [query, setQuery] = useState('');
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { AsyncStorage.getItem(programsStorageKey).then(value => { if (value) setPrograms(JSON.parse(value).flatMap((item: unknown) => { const normalized = normalizeProgram(item); return normalized ? [normalized] : []; })); }).catch(() => undefined).finally(() => setLoaded(true)); }, []);
  useEffect(() => { if (loaded) AsyncStorage.setItem(programsStorageKey, JSON.stringify(programs)).catch(() => undefined); }, [programs, loaded]);
  const currentDay = program.days[selectedDay] ?? program.days[0];
  const filteredExercises = useMemo(() => exercises.filter(exercise => exercise.name.toLowerCase().includes(query.toLowerCase())), [query]);
  const updateDay = (update: (day: Program['days'][number]) => Program['days'][number]) => setProgram(current => ({ ...current, days: current.days.map((day, index) => index === selectedDay ? update(day) : day) }));
  const addExercise = (name: string) => updateDay(day => day.exercises.some(exercise => exercise.name === name) ? day : { ...day, exercises: [...day.exercises, createWorkoutExercise(name)] });
  const saveProgram = () => { if (!program.name.trim()) { Alert.alert('Name your program', 'Add a name before saving.'); return; } const saved = { ...program, id: program.id || `program-${Date.now()}`, name: program.name.trim() }; setPrograms(current => [...current.filter(item => item.id !== saved.id), saved]); setProgram(saved); Alert.alert('Saved locally', 'Your program is ready on Home.'); };
  const updateSet = (exerciseName: string, setIndex: number, field: keyof SetEntry, value: string) => updateDay(day => ({ ...day, exercises: day.exercises.map(exercise => exercise.name !== exerciseName ? exercise : { ...exercise, sets: exercise.sets.map((set, index) => index === setIndex ? { ...set, [field]: value } : set) }) }));
  return <View style={styles.container}><SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.content}><Pressable onPress={onBack} style={styles.backButton}><Text style={styles.backText}>BACK TO WORKOUTS</Text></Pressable><Text style={styles.eyebrow}>FORGED FITNESS / PROGRAM BUILDER</Text><Text style={styles.title}>Build your week.</Text><Text style={styles.subtitle}>Create and save a program without leaving Workouts.</Text><View style={styles.builderActions}><TextInput value={program.name} onChangeText={name => setProgram(current => ({ ...current, name }))} placeholder="Program name" placeholderTextColor="#8E8E8E" style={styles.programInput} /><Pressable onPress={saveProgram} style={styles.saveButton}><Text style={styles.saveText}>SAVE</Text></Pressable></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayTabs}>{program.days.map((day, index) => <Pressable key={`${day.name}-${index}`} onPress={() => setSelectedDay(index)} style={[styles.dayTab, selectedDay === index && styles.dayTabActive]}><Text style={[styles.dayTabText, selectedDay === index && styles.dayTabTextActive]}>{day.name}</Text></Pressable>)}<Pressable onPress={() => { setProgram(current => ({ ...current, days: [...current.days, { name: `Day ${current.days.length + 1}`, exercises: [] }] })); setSelectedDay(program.days.length); }} style={styles.addDay}><Text style={styles.addDayText}>+ DAY</Text></Pressable></ScrollView>{currentDay && <View style={styles.builderCard}><TextInput value={currentDay.name} onChangeText={name => updateDay(() => ({ ...currentDay, name }))} style={styles.dayNameInput} /><Text style={styles.muted}>{currentDay.exercises.length} exercises · 5 sets each</Text>{currentDay.exercises.map(exercise => <View key={exercise.name} style={styles.selectedExercise}><View style={styles.exerciseHeader}><Text style={styles.selectedName}>{exercise.name}</Text><Pressable onPress={() => updateDay(day => ({ ...day, exercises: day.exercises.filter(item => item.name !== exercise.name) }))}><Text style={styles.removeText}>REMOVE</Text></Pressable></View>{exercise.sets.map((set, index) => <View key={`${exercise.name}-${index}`} style={styles.setRow}><Text style={styles.setNumber}>{setNumbers[index]}</Text><TextInput value={set.weight} onChangeText={value => updateSet(exercise.name, index, 'weight', value)} placeholder="kg" placeholderTextColor="#8E8E8E" style={styles.setInput} /><TextInput value={set.reps} onChangeText={value => updateSet(exercise.name, index, 'reps', value)} placeholder="reps" placeholderTextColor="#8E8E8E" style={styles.setInput} /></View>)}</View>)}</View>}<Text style={styles.libraryTitle}>Add exercises</Text><TextInput value={query} onChangeText={setQuery} placeholder="Search the canonical library" placeholderTextColor="#8E8E8E" style={styles.search} />{filteredExercises.map(exercise => <Pressable key={exercise.id} onPress={() => addExercise(exercise.name)} style={styles.exerciseRow}><View><Text style={styles.name}>{exercise.name}</Text><Text style={styles.muted}>{exercise.primaryMuscle} · {exercise.equipment}</Text></View><Text style={styles.addText}>{currentDay?.exercises.some(item => item.name === exercise.name) ? 'ADDED' : '+ ADD'}</Text></Pressable>)}</ScrollView></SafeAreaView></View>;
}

const styles = StyleSheet.create({ container: { backgroundColor: '#0B0B0B', flex: 1 }, safeArea: { alignSelf: 'center', maxWidth: MaxContentWidth, paddingBottom: BottomTabInset, width: '100%' }, content: { padding: 20, paddingBottom: 100 }, eyebrow: { color: '#D4AF37', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 }, title: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', marginTop: 18 }, subtitle: { color: '#B8B8B8', fontSize: 14, lineHeight: 21, marginTop: 6 }, createButton: { backgroundColor: '#242424', borderRadius: 12, marginTop: 22, padding: 16 }, createButtonText: { color: '#FFF', fontSize: 13, fontWeight: '900' }, createButtonHint: { color: '#E6C85C', fontSize: 12, lineHeight: 18, marginTop: 5 }, libraryTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '900', marginTop: 28 }, search: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 8, borderWidth: 1, color: '#FFFFFF', marginTop: 12, padding: 13 }, filters: { gap: 8, paddingVertical: 14 }, filter: { backgroundColor: '#2A2A2A', borderRadius: 8, paddingHorizontal: 11, paddingVertical: 9 }, filterText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' }, resultCount: { color: '#B8B8B8', fontSize: 11, fontWeight: '900', marginBottom: 8 }, card: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 10, borderWidth: 1, marginBottom: 9, padding: 14 }, cardTop: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' }, name: { color: '#FFFFFF', flex: 1, fontSize: 15, fontWeight: '900' }, type: { color: '#D4AF37', fontSize: 9, fontWeight: '900', letterSpacing: 1 }, meta: { color: '#D4AF37', fontSize: 11, fontWeight: '800', marginTop: 6 }, muscles: { color: '#CFCFCF', fontSize: 12, marginTop: 8 }, movement: { color: '#B8B8B8', fontSize: 11, marginTop: 4 }, backButton: { alignSelf: 'flex-start', marginBottom: 24 }, backText: { color: '#D4AF37', fontSize: 11, fontWeight: '900' }, optionCard: { backgroundColor: '#242424', borderRadius: 12, marginTop: 22, padding: 17 }, optionCardLight: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 12, borderWidth: 1, marginTop: 12, padding: 17 }, optionKicker: { color: '#D4AF37', fontSize: 10, fontWeight: '900', letterSpacing: 1 }, optionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginTop: 8 }, optionText: { color: '#B8B8B8', fontSize: 13, lineHeight: 20, marginTop: 6 },
  question: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 10, borderWidth: 1, marginTop: 10, padding: 15 }, questionLabel: { color: '#B8B8B8', fontSize: 11, fontWeight: '800' }, questionValue: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginTop: 5 }, generateButton: { backgroundColor: '#D4AF37', borderRadius: 8, marginTop: 18, padding: 14, alignItems: 'center' }, generatedCard: { backgroundColor: '#2A2412', borderRadius: 12, marginTop: 20, padding: 16 }, generatedDay: { borderTopColor: '#4A3D14', borderTopWidth: 1, marginTop: 12, paddingTop: 10 }, dayName: { color: '#D4AF37', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' }, dayExercises: { color: '#FFFFFF', fontSize: 12, lineHeight: 19, marginTop: 4 }, builderActions: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 22 }, programInput: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 8, borderWidth: 1, color: '#FFFFFF', flex: 1, padding: 13 }, saveButton: { backgroundColor: '#D4AF37', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 13 }, saveText: { color: '#000000', fontSize: 11, fontWeight: '900' }, dayTabs: { gap: 8, paddingVertical: 16 }, dayTab: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 8, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 }, dayTabActive: { backgroundColor: '#D4AF37' }, dayTabText: { color: '#CFCFCF', fontSize: 11, fontWeight: '900' }, dayTabTextActive: { color: '#000000' }, addDay: { borderColor: '#D4AF37', borderRadius: 8, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 10 }, addDayText: { color: '#D4AF37', fontSize: 11, fontWeight: '900' }, builderCard: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 10, borderWidth: 1, padding: 14 }, dayNameInput: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', marginBottom: 4 }, muted: { color: '#B8B8B8', fontSize: 11, marginTop: 4 }, selectedExercise: { borderTopColor: '#3A3A3A', borderTopWidth: 1, marginTop: 12, paddingTop: 12 }, exerciseHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, selectedName: { color: '#FFFFFF', flex: 1, fontSize: 14, fontWeight: '900' }, removeText: { color: '#D4AF37', fontSize: 10, fontWeight: '900' }, setRow: { alignItems: 'center', flexDirection: 'row', gap: 7, marginTop: 7 }, setNumber: { color: '#D4AF37', fontSize: 11, fontWeight: '900', textAlign: 'center', width: 25 }, setInput: { backgroundColor: '#0B0B0B', borderColor: '#3A3A3A', borderRadius: 6, borderWidth: 1, color: '#FFFFFF', flex: 1, padding: 8, textAlign: 'center' }, exerciseRow: { alignItems: 'center', backgroundColor: '#171717', borderBottomColor: '#3A3A3A', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', padding: 13 }, addText: { color: '#D4AF37', fontSize: 10, fontWeight: '900' } });
