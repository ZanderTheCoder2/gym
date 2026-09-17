import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { normalizeProgram, programsStorageKey, type Program, type WorkoutExercise } from '@/data/programs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const historyStorageKey = '@gym/training-history';
const workoutHistoryStorageKey = '@gym/workout-history';
type PreviousSet = { weight: string; reps: string };

export default function GymHomeScreen() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeProgramId, setActiveProgramId] = useState<string | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [trainingDates, setTrainingDates] = useState<Record<string, number>>({});

  const loadDashboard = useCallback(() => {
    setLoaded(false);
    Promise.all([AsyncStorage.getItem(programsStorageKey), AsyncStorage.getItem(historyStorageKey)])
      .then(([programsValue, historyValue]) => {
        setPrograms(programsValue ? JSON.parse(programsValue).flatMap((item: unknown) => { const normalized = normalizeProgram(item); return normalized ? [normalized] : []; }) : []);
        setTrainingDates(historyValue ? normalizeTrainingHistory(JSON.parse(historyValue)) : {});
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  useFocusEffect(useCallback(() => { loadDashboard(); }, [loadDashboard]));
  useEffect(() => { if (loaded) AsyncStorage.setItem(programsStorageKey, JSON.stringify(programs)).catch(() => undefined); }, [programs, loaded]);
  useEffect(() => { if (loaded) AsyncStorage.setItem(historyStorageKey, JSON.stringify(trainingDates)).catch(() => undefined); }, [trainingDates, loaded]);

  const totalDays = programs.reduce((count, program) => count + program.days.length, 0);
  const totalExercises = programs.reduce((count, program) => count + program.days.reduce((dayCount, day) => dayCount + day.exercises.length, 0), 0);
  const activeProgram = programs.find(program => program.id === activeProgramId);
  const updateProgram = (updatedProgram: Program) => setPrograms(current => current.map(program => program.id === updatedProgram.id ? updatedProgram : program));
  const markTrainingDay = () => { const today = localDateKey(new Date()); setTrainingDates(current => ({ ...current, [today]: current[today] ?? 0 })); };
  const saveTrainingDuration = (seconds: number) => { const today = localDateKey(new Date()); setTrainingDates(current => { const history = current && typeof current === 'object' && !Array.isArray(current) ? current : {}; return { ...history, [today]: Math.max(history[today] ?? 0, seconds) }; }); };

  if (activeProgram) return <TrainingScreen program={activeProgram} initialDayIndex={activeDayIndex} onChange={updateProgram} onBack={() => setActiveProgramId(null)} onSessionStart={markTrainingDay} onSessionEnd={saveTrainingDuration} />;

  const primaryProgram = programs[0];
  return <View style={styles.container}><SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.topline}><Text style={styles.eyebrow}>SLATER GYM / TRAINING</Text><View style={styles.statusDot} /></View>
    <Text style={styles.title}>Your training calendar.</Text>
    <Text style={styles.subtitle}>See the work ahead, then start today's session in one tap.</Text>

    {primaryProgram ? <>
      <TodayWorkout program={primaryProgram} onOpen={dayIndex => { setActiveDayIndex(dayIndex); setActiveProgramId(primaryProgram.id); }} />
      <FourWeekCalendar program={primaryProgram} trainingDates={trainingDates} onOpen={dayIndex => { setActiveDayIndex(dayIndex); setActiveProgramId(primaryProgram.id); }} />
    </> : <View style={styles.emptyCard}><Text style={styles.emptyTitle}>Build your first week</Text><Text style={styles.emptyCopy}>Create a tailored or manual program in Workouts. Your four-week calendar will appear here as soon as you save it.</Text></View>}

    <View style={styles.statsRow}><Stat value={String(programs.length)} label="programs" /><Stat value={String(totalDays)} label="training days" /><Stat value={String(totalExercises)} label="exercises" /></View>

  </ScrollView></SafeAreaView></View>;
}

function Stat({ value, label }: { value: string; label: string }) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }

const weekLabels = ['WEEK ONE', 'WEEK TWO', 'WEEK THREE', 'WEEK FOUR'];
const weekdayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function TodayWorkout({ program, onOpen }: { program: Program; onOpen: (dayIndex: number) => void }) {
  const today = new Date();
  const todayIndex = (today.getDay() + 6) % 7;
  const workout = program.days[todayIndex];
  const isRestDay = !workout;
  return <View style={styles.todayCard}>
    <View style={styles.todayHeader}><View><Text style={styles.todayKicker}>TODAY'S WORKOUT</Text><Text style={styles.todayDate}>{today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text></View><View style={styles.todayBadge}><Text style={styles.todayBadgeText}>{isRestDay ? 'REST' : 'TODAY'}</Text></View></View>
    <Text style={styles.todayTitle}>{workout?.name ?? 'Recovery day'}</Text>
    <Text style={styles.todayCopy}>{isRestDay ? 'Recover today. Your next training day is already mapped below.' : `${workout.exercises.length} exercises planned. Show up, log your sets, and keep moving.`}</Text>
    {!isRestDay && <Pressable accessibilityLabel={`Start today's ${workout.name} workout`} onPress={() => onOpen(todayIndex)} style={styles.todayButton}><Text style={styles.todayButtonText}>START TODAY'S WORKOUT</Text></Pressable>}
  </View>;
}

function FourWeekCalendar({ program, trainingDates, onOpen }: { program: Program; trainingDates: Record<string, number>; onOpen: (dayIndex: number) => void }) {
  const today = new Date();
  const monday = startOfWeek(today);
  return <View style={styles.calendarSection}><View style={styles.calendarHeading}><View><Text style={styles.sectionTitle}>Four-week plan</Text><Text style={styles.calendarSubheading}>Your weekly schedule, mapped from today</Text></View><Text style={styles.calendarLegend}>GOLD = TODAY</Text></View>{weekLabels.map((label, weekIndex) => <View key={label} style={styles.weekCard}><View style={styles.weekHeader}><Text style={styles.weekTitle}>{label}</Text><Text style={styles.weekRange}>{formatWeekRange(monday, weekIndex)}</Text></View>{weekdayLabels.map((weekday, dayIndex) => { const date = addDays(monday, weekIndex * 7 + dayIndex); const workout = program.days[dayIndex]; const dateKey = localDateKey(date); const isToday = dateKey === localDateKey(today); const isCompleted = Object.prototype.hasOwnProperty.call(trainingDates, dateKey); return <Pressable key={dateKey} accessibilityRole="button" accessibilityLabel={`${weekday}, ${workout?.name ?? 'Recovery day'}, ${date.toLocaleDateString()}`} onPress={workout ? () => onOpen(dayIndex) : undefined} style={[styles.calendarRow, isToday && styles.calendarRowToday]}><View style={styles.calendarDate}><Text style={[styles.calendarWeekday, isToday && styles.calendarTextToday]}>{weekday}</Text><Text style={[styles.calendarDayNumber, isToday && styles.calendarTextToday]}>{date.getDate()}</Text></View><View style={styles.calendarWorkout}><Text style={[styles.calendarWorkoutName, isToday && styles.calendarTextToday]}>{workout?.name ?? 'Recovery day'}</Text><Text style={styles.calendarExerciseCount}>{workout ? `${workout.exercises.length} exercises` : 'Rest and recover'}</Text></View><View style={[styles.calendarStatus, isToday && styles.calendarStatusToday, isCompleted && styles.calendarStatusComplete]}><Text style={[styles.calendarStatusText, isToday && styles.calendarStatusTextToday]}>{isCompleted ? 'DONE' : isToday ? 'NOW' : workout ? 'PLAN' : '-'}</Text></View></Pressable>; })}</View>)}</View>;
}

function startOfWeek(date: Date) { const mondayOffset = (date.getDay() + 6) % 7; return new Date(date.getFullYear(), date.getMonth(), date.getDate() - mondayOffset); }
function addDays(date: Date, days: number) { return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days); }
function formatWeekRange(monday: Date, weekIndex: number) { const start = addDays(monday, weekIndex * 7); const end = addDays(start, 6); return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`; }

function localDateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function normalizeTrainingHistory(value: unknown): Record<string, number> {
  if (Array.isArray(value)) return Object.fromEntries(value.filter((date): date is string => typeof date === 'string').map(date => [date, 0]));
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(Object.entries(value).filter(([date, seconds]) => /^\d{4}-\d{2}-\d{2}$/.test(date) && typeof seconds === 'number' && Number.isFinite(seconds)).map(([date, seconds]) => [date, Math.max(0, Math.floor(seconds as number))]));
}

function WeeklyHistory({ trainingDates }: { trainingDates: Record<string, number> }) {
  const today = new Date();
  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset);
  const days = Array.from({ length: 7 }, (_, index) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index));
  return <View style={styles.historySection}><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Weekly history</Text><Text style={styles.sectionHint}>This week</Text></View><View style={styles.historyCard}>{days.map(day => { const duration = trainingDates[localDateKey(day)] ?? 0; const trained = duration > 0 || Object.prototype.hasOwnProperty.call(trainingDates, localDateKey(day)); return <View key={localDateKey(day)} style={styles.historyDay}><Text style={styles.historyLabel}>{day.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2).toUpperCase()}</Text><View style={[styles.historyDot, trained && styles.historyDotActive]}><Text style={[styles.historyCheck, trained && styles.historyCheckActive]}>{trained ? '✓' : ''}</Text></View><Text style={styles.historyDate}>{day.getDate()}</Text><Text style={styles.historyDuration}>{formatDuration(duration)}</Text></View>; })}</View></View>;
}

function formatDuration(seconds: number) { return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m`; }
function normalizePreviousSets(value: unknown): Record<string, PreviousSet[]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, sets]) => Array.isArray(sets)).map(([name, sets]) => [name, (sets as unknown[]).map(set => {
    const entry = set && typeof set === 'object' ? set as Partial<PreviousSet> : {};
    return { weight: typeof entry.weight === 'string' ? entry.weight : '', reps: typeof entry.reps === 'string' ? entry.reps : '' };
  })]));
}

function WorkoutExerciseCard({ exercise, completedSetIndexes = [], previousSets, onUpdateSet }: { exercise: WorkoutExercise; completedSetIndexes?: number[]; previousSets: Record<string, PreviousSet[]>; onUpdateSet: (exerciseName: string, setIndex: number, field: 'weight' | 'reps', value: string) => void }) {
  return <View style={styles.trainingCard}><View style={styles.trainingHeader}><Text style={styles.trainingName}>{exercise.name}</Text><Text style={styles.muted}>{exercise.sets.length} sets</Text></View><View style={styles.setHeader}><Text style={styles.setHeaderSet}>SET</Text><Text style={styles.setHeaderText}>WEIGHT</Text><Text style={styles.setHeaderText}>REPS</Text></View>{exercise.sets.map((set, index) => { const previous = previousSets[exercise.name]?.[index]; const completed = completedSetIndexes.includes(index); return <View key={`${exercise.name}-${index}`} style={[styles.setRow, completed && styles.setRowComplete]}><Text style={[styles.setNumber, completed && styles.setNumberComplete]}>{completed ? '✓' : index + 1}</Text><View style={styles.setField}><TextInput value={set.weight} onChangeText={value => onUpdateSet(exercise.name, index, 'weight', value)} placeholder="kg" placeholderTextColor="#8E8E8E" keyboardType="decimal-pad" style={[styles.setInput, completed && styles.setInputComplete]} /><Text style={[styles.previousValue, completed && styles.previousValueComplete]}>{previous?.weight || previous?.reps ? `Last: ${previous.weight || '-'} kg` : 'No previous weight'}</Text></View><View style={styles.setField}><TextInput value={set.reps} onChangeText={value => onUpdateSet(exercise.name, index, 'reps', value)} placeholder="reps" placeholderTextColor="#8E8E8E" keyboardType="number-pad" style={[styles.setInput, completed && styles.setInputComplete]} /><Text style={[styles.previousValue, completed && styles.previousValueComplete]}>{previous?.weight || previous?.reps ? `Last: ${previous.reps || '-'} reps` : 'No previous reps'}</Text></View></View>; })}</View>;
}

function FocusedSetCard({ exercise, setIndex, previousSets, onUpdateSet }: { exercise: WorkoutExercise; setIndex: number; previousSets: Record<string, PreviousSet[]>; onUpdateSet: (exerciseName: string, setIndex: number, field: 'weight' | 'reps', value: string) => void }) {
  const set = exercise.sets[setIndex];
  const previous = previousSets[exercise.name]?.[setIndex];
  if (!set) return null;
  return <View style={styles.trainingCard}><View style={styles.trainingHeader}><Text style={styles.trainingName}>{exercise.name}</Text><Text style={styles.muted}>Set {setIndex + 1} of {exercise.sets.length}</Text></View><View style={styles.setHeader}><Text style={styles.setHeaderSet}>SET</Text><Text style={styles.setHeaderText}>WEIGHT</Text><Text style={styles.setHeaderText}>REPS</Text></View><View style={styles.setRow}><Text style={styles.setNumber}>{setIndex + 1}</Text><View style={styles.setField}><TextInput value={set.weight} onChangeText={value => onUpdateSet(exercise.name, setIndex, 'weight', value)} placeholder="kg" placeholderTextColor="#8E8E8E" keyboardType="decimal-pad" style={styles.setInput} /><Text style={styles.previousValue}>{previous?.weight || previous?.reps ? `Last: ${previous.weight || '-'} kg` : 'No previous weight'}</Text></View><View style={styles.setField}><TextInput value={set.reps} onChangeText={value => onUpdateSet(exercise.name, setIndex, 'reps', value)} placeholder="reps" placeholderTextColor="#8E8E8E" keyboardType="number-pad" style={styles.setInput} /><Text style={styles.previousValue}>{previous?.weight || previous?.reps ? `Last: ${previous.reps || '-'} reps` : 'No previous reps'}</Text></View></View></View>;
}

function TrainingScreen({ program, initialDayIndex, onChange, onBack, onSessionStart, onSessionEnd }: { program: Program; initialDayIndex: number; onChange: (program: Program) => void; onBack: () => void; onSessionStart: () => void; onSessionEnd: (seconds: number) => void }) {
  const dayIndex = Math.min(initialDayIndex, Math.max(program.days.length - 1, 0));
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [rest, setRest] = useState(0);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [completedSetIndexes, setCompletedSetIndexes] = useState<number[]>([]);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  const [choosingNext, setChoosingNext] = useState(false);
  const [previousSets, setPreviousSets] = useState<Record<string, PreviousSet[]>>({});
  const day = program.days[dayIndex];
  const historyKey = `${program.id}:${dayIndex}`;
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { if (!rest) return undefined; const timer = setInterval(() => setRest(value => Math.max(0, value - 1)), 1000); return () => clearInterval(timer); }, [rest]);
  useEffect(() => { AsyncStorage.getItem(workoutHistoryStorageKey).then(value => { const parsed: unknown = value ? JSON.parse(value) : {}; const history = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {}; setPreviousSets(normalizePreviousSets(history[historyKey])); }).catch(() => setPreviousSets({})); }, [historyKey]);
  const format = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const updateSet = (exerciseName: string, setIndex: number, field: 'weight' | 'reps', value: string) => onChange({ ...program, days: program.days.map((currentDay, index) => index !== dayIndex ? currentDay : { ...currentDay, exercises: currentDay.exercises.map(exercise => exercise.name !== exerciseName ? exercise : { ...exercise, sets: exercise.sets.map((set, index) => index === setIndex ? { ...set, [field]: value } : set) }) }) });
  const exercise = day?.exercises[exerciseIndex];
  const remainingExercises = day?.exercises.filter((_, index) => !completedExercises.includes(index) && (completedExercises.length === 0 || index !== exerciseIndex)) ?? [];
  const allExercisesComplete = Boolean(day) && completedExercises.length >= day.exercises.length;
  const savePreviousSets = () => { const snapshot = Object.fromEntries(day.exercises.map(exercise => [exercise.name, exercise.sets.map(set => ({ weight: set.weight, reps: set.reps }))])); AsyncStorage.getItem(workoutHistoryStorageKey).then(value => { const parsed: unknown = value ? JSON.parse(value) : {}; const history = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}; return AsyncStorage.setItem(workoutHistoryStorageKey, JSON.stringify({ ...history, [historyKey]: snapshot })); }).catch(() => undefined); };
  const finishExercise = () => { setCompletedExercises(current => current.includes(exerciseIndex) ? current : [...current, exerciseIndex]); setCompletedSetIndexes([]); setChoosingNext(true); };
  const nextSetIndex = exercise?.sets.findIndex((_, index) => !completedSetIndexes.includes(index)) ?? -1;
  const markSetDone = () => { if (nextSetIndex < 0) { finishExercise(); return; } setCompletedSetIndexes(current => [...current, nextSetIndex]); setRest(60); };
  const skipSet = () => { if (nextSetIndex < 0) { finishExercise(); return; } setCompletedSetIndexes(current => [...current, nextSetIndex]); };
  const chooseNextExercise = (nextIndex: number) => { setExerciseIndex(nextIndex); setCompletedSetIndexes([]); setChoosingNext(false); };
  const toggleSession = () => { if (sessionStartedAt) { savePreviousSets(); onSessionEnd(Math.floor((Date.now() - sessionStartedAt) / 1000)); setSessionStartedAt(null); return; } setCompletedExercises([]); setExerciseIndex(0); setCompletedSetIndexes([]); setChoosingNext(true); onSessionStart(); setSessionStartedAt(Date.now()); };
  return <View style={styles.container}><SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><Pressable onPress={onBack} style={styles.backButton}><Text style={styles.backText}>BACK TO PROGRAMS</Text></Pressable><Text style={styles.eyebrow}>ACTIVE WORKOUT</Text><Text style={styles.title}>{day.name}</Text><Text style={styles.subtitle}>{sessionStartedAt ? `${program.name} - choose an exercise, then complete its sets.` : `${program.name} - review the full plan before you start.`}</Text><View style={styles.timerCard}><View><Text style={styles.timerLabel}>SESSION</Text><Text style={styles.timerValue}>{format(sessionStartedAt ? Math.floor((now - sessionStartedAt) / 1000) : 0)}</Text></View><Pressable onPress={toggleSession} style={styles.timerButton}><Text style={styles.timerButtonText}>{sessionStartedAt ? 'END SESSION' : 'START SESSION'}</Text></Pressable></View>{!sessionStartedAt && <><Text style={styles.sectionTitle}>Today's exercises</Text>{day.exercises.map(currentExercise => <WorkoutExerciseCard key={currentExercise.name} exercise={currentExercise} previousSets={previousSets} onUpdateSet={updateSet} />)}</>}{sessionStartedAt && choosingNext && <View style={styles.nextExerciseCard}>{allExercisesComplete ? <><Text style={styles.nextExerciseTitle}>Workout exercises complete</Text><Text style={styles.nextExerciseCopy}>End your session when you are ready.</Text></> : <><Text style={styles.nextExerciseTitle}>{completedExercises.length === 0 ? 'Choose your first exercise' : "What's next?"}</Text><Text style={styles.nextExerciseCopy}>Choose from the exercises in today's plan.</Text>{remainingExercises.map(nextExercise => { const nextIndex = day.exercises.indexOf(nextExercise); return <Pressable key={nextExercise.name} onPress={() => chooseNextExercise(nextIndex)} style={styles.nextExerciseOption}><Text style={styles.nextExerciseOptionText}>{nextExercise.name}</Text><Text style={styles.nextExerciseOptionMeta}>{nextExercise.sets.length} sets</Text></Pressable>; })}</>}</View>}{sessionStartedAt && !choosingNext && exercise && <><View style={styles.exerciseProgress}><Text style={styles.exerciseProgressLabel}>EXERCISE {completedExercises.length + 1} OF {day.exercises.length}</Text><Text style={styles.exerciseProgressHint}>Mark each set done below</Text></View><WorkoutExerciseCard exercise={exercise} completedSetIndexes={completedSetIndexes} previousSets={previousSets} onUpdateSet={updateSet} /></>}{sessionStartedAt && <View style={styles.restCard}><View><Text style={styles.timerLabel}>REST TIMER</Text><Text style={styles.timerValue}>{rest ? format(rest) : 'READY'}</Text></View>{!choosingNext && <View style={styles.restButtonStack}><Pressable onPress={markSetDone} style={styles.timerButton}><Text style={styles.timerButtonText}>{nextSetIndex < 0 ? 'CHOOSE NEXT EXERCISE' : `DONE SET ${nextSetIndex + 1} - START REST`}</Text></Pressable><Pressable onPress={skipSet} style={styles.skipButton}><Text style={styles.skipButtonText}>{nextSetIndex < 0 ? 'FINISH EXERCISE' : `SKIP SET ${nextSetIndex + 1}`}</Text></Pressable></View>}</View>}</ScrollView></SafeAreaView></View>;
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#0B0B0B', flex: 1 },
  safeArea: { alignSelf: 'center', maxWidth: MaxContentWidth, paddingBottom: BottomTabInset, width: '100%' },
  content: { padding: 20, paddingBottom: 100 },
  topline: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  eyebrow: { color: '#D4AF37', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  statusDot: { backgroundColor: '#D4AF37', borderRadius: 5, height: 10, width: 10 },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', marginTop: 18 },
  subtitle: { color: '#B8B8B8', fontSize: 14, lineHeight: 21, marginTop: 6 },
  todayCard: { backgroundColor: '#D4AF37', borderRadius: 16, marginTop: 24, padding: 18 },
  todayHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  todayKicker: { color: '#000000', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  todayDate: { color: '#2A2107', fontSize: 12, fontWeight: '700', marginTop: 5 },
  todayBadge: { backgroundColor: '#000000', borderRadius: 6, paddingHorizontal: 9, paddingVertical: 6 },
  todayBadgeText: { color: '#D4AF37', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  todayTitle: { color: '#000000', fontSize: 25, fontWeight: '900', marginTop: 24 },
  todayCopy: { color: '#2A2107', fontSize: 13, lineHeight: 19, marginTop: 5 },
  todayButton: { alignItems: 'center', backgroundColor: '#000000', borderRadius: 8, marginTop: 16, paddingVertical: 13 },
  todayButtonText: { color: '#D4AF37', fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },
  calendarSection: { marginTop: 12 },
  calendarHeading: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between' },
  calendarSubheading: { color: '#B8B8B8', fontSize: 11, marginTop: -7 },
  calendarLegend: { color: '#D4AF37', fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  weekCard: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 12, borderWidth: 1, marginTop: 12, overflow: 'hidden' },
  weekHeader: { alignItems: 'center', backgroundColor: '#242424', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 },
  weekTitle: { color: '#D4AF37', fontSize: 13, fontWeight: '900', letterSpacing: 0.8 },
  weekRange: { color: '#B8B8B8', fontSize: 10 },
  calendarRow: { alignItems: 'center', borderTopColor: '#3A3A3A', borderTopWidth: 1, flexDirection: 'row', minHeight: 57, paddingHorizontal: 12, paddingVertical: 8 },
  calendarRowToday: { backgroundColor: '#2A2412', borderLeftColor: '#D4AF37', borderLeftWidth: 3 },
  calendarDate: { alignItems: 'center', width: 43 },
  calendarWeekday: { color: '#B8B8B8', fontSize: 9, fontWeight: '900' },
  calendarDayNumber: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginTop: 3 },
  calendarTextToday: { color: '#D4AF37' },
  calendarWorkout: { flex: 1, marginLeft: 11 },
  calendarWorkoutName: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  calendarExerciseCount: { color: '#B8B8B8', fontSize: 10, marginTop: 3 },
  calendarStatus: { alignItems: 'center', borderColor: '#4A4A4A', borderRadius: 5, borderWidth: 1, minWidth: 38, paddingHorizontal: 5, paddingVertical: 5 },
  calendarStatusToday: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  calendarStatusComplete: { backgroundColor: '#2A2412', borderColor: '#D4AF37' },
  calendarStatusText: { color: '#B8B8B8', fontSize: 8, fontWeight: '900' },
  calendarStatusTextToday: { color: '#000000' },
  identityCard: { alignItems: 'center', backgroundColor: '#242424', borderRadius: 14, flexDirection: 'row', marginTop: 24, padding: 18 },
  avatar: { alignItems: 'center', backgroundColor: '#D4AF37', borderRadius: 28, height: 56, justifyContent: 'center', width: 56 },
  avatarText: { color: '#FFF', fontSize: 25, fontWeight: '900' },
  identityCopy: { marginLeft: 14 },
  identityName: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  identityMeta: { color: '#E6C85C', fontSize: 12, marginTop: 5 },
  sectionHeader: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between', marginTop: 28 },
  sectionTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '900', marginBottom: 12, marginTop: 24 },
  sectionHint: { color: '#B8B8B8', fontSize: 11 },
  formCard: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 12, borderWidth: 1, padding: 16 },
  field: { marginBottom: 13 },
  fieldLabel: { color: '#CFCFCF', fontSize: 11, fontWeight: '800', marginBottom: 6 },
  input: { backgroundColor: '#0B0B0B', borderColor: '#3A3A3A', borderRadius: 8, borderWidth: 1, color: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 11 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  stat: { backgroundColor: '#2A2412', borderRadius: 10, flex: 1, padding: 13 },
  statValue: { color: '#FFFFFF', fontSize: 21, fontWeight: '900' },
  statLabel: { color: '#D4AF37', fontSize: 10, fontWeight: '800', marginTop: 3 },
  emptyCard: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 12, borderWidth: 1, padding: 18 },
  emptyTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  emptyCopy: { color: '#B8B8B8', fontSize: 13, lineHeight: 19, marginTop: 6 },
  programCard: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 12, borderWidth: 1, marginBottom: 12, padding: 16 },
  programHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  programName: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  programMeta: { color: '#B8B8B8', fontSize: 11, marginTop: 4 },
  muted: { color: '#B8B8B8', fontSize: 11 },
  programMark: { color: '#D4AF37', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  dayRow: { borderTopColor: '#3A3A3A', borderTopWidth: 1, paddingVertical: 10 },
  dayName: { color: '#D4AF37', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  dayExercises: { color: '#CFCFCF', fontSize: 12, lineHeight: 18, marginTop: 3 },
  historySection: { marginTop: 8 },
  historyCard: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', padding: 14 },
  historyDay: { alignItems: 'center', flex: 1 },
  historyLabel: { color: '#B8B8B8', fontSize: 9, fontWeight: '900' },
  historyDot: { alignItems: 'center', backgroundColor: '#0B0B0B', borderColor: '#3A3A3A', borderRadius: 15, borderWidth: 1, height: 30, justifyContent: 'center', marginVertical: 7, width: 30 },
  historyDotActive: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  historyCheck: { color: '#777777', fontSize: 14, fontWeight: '900' },
  historyCheckActive: { color: '#000000' },
  historyDate: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  historyDuration: { color: '#D4AF37', fontSize: 9, fontWeight: '900', marginTop: 3 },
  openButton: { alignItems: 'center', backgroundColor: '#D4AF37', borderRadius: 8, flex: 1, marginTop: 12, paddingVertical: 12 },
  openButtonText: { color: '#000000', fontSize: 11, fontWeight: '900' },
  programActions: { flexDirection: 'row', gap: 8 },
  deleteButton: { alignItems: 'center', borderColor: '#D4AF37', borderRadius: 8, borderWidth: 1, flex: 1, marginTop: 12, paddingVertical: 11 },
  deleteButtonText: { color: '#D4AF37', fontSize: 10, fontWeight: '900' },
  backButton: { alignSelf: 'flex-start', marginBottom: 24 },
  backText: { color: '#D4AF37', fontSize: 11, fontWeight: '900' },
  timerCard: { alignItems: 'center', backgroundColor: '#242424', borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', marginTop: 22, padding: 18 },
  timerLabel: { color: '#E6C85C', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  timerValue: { color: '#FFF', fontSize: 28, fontWeight: '900', marginTop: 5 },
  timerButton: { backgroundColor: '#D4AF37', borderRadius: 8, paddingHorizontal: 13, paddingVertical: 11 },
  timerButtonText: { color: '#000000', fontSize: 10, fontWeight: '900' },
  dayTabs: { gap: 8, paddingVertical: 20 },
  dayTab: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 8, borderWidth: 1, paddingHorizontal: 15, paddingVertical: 10 },
  dayTabActive: { backgroundColor: '#D4AF37' },
  dayTabText: { color: '#CFCFCF', fontSize: 11, fontWeight: '900' },
  dayTabTextActive: { color: '#000000' },
  trainingCard: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 12, borderWidth: 1, marginBottom: 12, padding: 15 },
  exerciseProgress: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  exerciseProgressLabel: { color: '#D4AF37', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  exerciseProgressHint: { color: '#B8B8B8', fontSize: 10 },
  trainingHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 13 },
  trainingName: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  setHeader: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  setHeaderSet: { color: '#B8B8B8', fontSize: 9, fontWeight: '900', textAlign: 'center', width: 28 },
  setHeaderText: { color: '#B8B8B8', flex: 1, fontSize: 9, fontWeight: '900', minWidth: 0, textAlign: 'center' },
  setHeaderAction: { width: 92 },
  setRow: { alignItems: 'center', flexDirection: 'row', gap: 7, marginTop: 7 },
  setRowComplete: { opacity: 0.65 },
  setNumber: { color: '#D4AF37', fontSize: 11, fontWeight: '900', textAlign: 'center', width: 28 },
  setNumberComplete: { color: '#FFFFFF' },
  setField: { flex: 1, minWidth: 0 },
  setInput: { backgroundColor: '#0B0B0B', borderColor: '#3A3A3A', borderRadius: 6, borderWidth: 1, color: '#FFFFFF', paddingHorizontal: 8, paddingVertical: 9, textAlign: 'center', width: '100%' },
  setInputComplete: { textDecorationLine: 'line-through' },
  previousValue: { color: '#8E8E8E', fontSize: 9, marginTop: 3, textAlign: 'center' },
  previousValueComplete: { textDecorationLine: 'line-through' },
  setDoneButton: { alignItems: 'center', borderColor: '#D4AF37', borderRadius: 6, borderWidth: 1, paddingHorizontal: 4, paddingVertical: 8, width: 92 },
  setDoneButtonComplete: { backgroundColor: '#2A2412' },
  setDoneButtonText: { color: '#D4AF37', fontSize: 9, fontWeight: '900' },
  doneButton: { alignItems: 'center', backgroundColor: '#D4AF37', borderRadius: 8, marginBottom: 12, paddingVertical: 14 },
  doneButtonText: { color: '#000000', fontSize: 11, fontWeight: '900' },
  nextExerciseCard: { backgroundColor: '#2A2412', borderColor: '#D4AF37', borderRadius: 12, borderWidth: 1, marginBottom: 12, padding: 16 },
  nextExerciseTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  nextExerciseCopy: { color: '#E6C85C', fontSize: 12, lineHeight: 18, marginTop: 5 },
  nextExerciseOption: { alignItems: 'center', backgroundColor: '#171717', borderColor: '#4A3D14', borderRadius: 8, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 9, padding: 12 },
  nextExerciseOptionText: { color: '#FFFFFF', flex: 1, fontSize: 13, fontWeight: '900' },
  nextExerciseOptionMeta: { color: '#D4AF37', fontSize: 10, fontWeight: '900' },
  restCard: { alignItems: 'center', backgroundColor: '#2A2412', borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, padding: 16 },
  restActions: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  restButtonStack: { alignItems: 'stretch', gap: 7, marginLeft: 12 },
  skipButton: { alignItems: 'center', borderColor: '#D4AF37', borderRadius: 8, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 10 },
  skipButtonText: { color: '#D4AF37', fontSize: 10, fontWeight: '900' },
  restInput: { backgroundColor: '#171717', borderColor: '#4A4A4A', borderRadius: 6, borderWidth: 1, color: '#FFFFFF', paddingHorizontal: 8, paddingVertical: 9, textAlign: 'center', width: 58 },
});
