import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { normalizeProgram, programsStorageKey, type Program } from '@/data/programs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Profile = { name: string; goal: string; level: string; equipment: string };
const profileStorageKey = '@gym/profile';
const historyStorageKey = '@gym/training-history';
const defaultProfile: Profile = { name: '', goal: 'Build strength', level: 'Intermediate', equipment: 'Full gym' };

export default function GymHomeScreen() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeProgramId, setActiveProgramId] = useState<string | null>(null);
  const [trainingDates, setTrainingDates] = useState<Record<string, number>>({});

  const loadDashboard = useCallback(() => {
    Promise.all([AsyncStorage.getItem(profileStorageKey), AsyncStorage.getItem(programsStorageKey), AsyncStorage.getItem(historyStorageKey)])
      .then(([profileValue, programsValue, historyValue]) => {
        if (profileValue) setProfile(JSON.parse(profileValue));
        if (programsValue) setPrograms(JSON.parse(programsValue).flatMap((item: unknown) => { const normalized = normalizeProgram(item); return normalized ? [normalized] : []; }));
        if (historyValue) { const parsedHistory: unknown = JSON.parse(historyValue); setTrainingDates(normalizeTrainingHistory(parsedHistory)); }
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  useFocusEffect(useCallback(() => { loadDashboard(); }, [loadDashboard]));
  useEffect(() => { if (loaded) AsyncStorage.setItem(profileStorageKey, JSON.stringify(profile)).catch(() => undefined); }, [profile, loaded]);
  useEffect(() => { if (loaded) AsyncStorage.setItem(programsStorageKey, JSON.stringify(programs)).catch(() => undefined); }, [programs, loaded]);
  useEffect(() => { if (loaded) AsyncStorage.setItem(historyStorageKey, JSON.stringify(trainingDates)).catch(() => undefined); }, [trainingDates, loaded]);

  const totalDays = programs.reduce((count, program) => count + program.days.length, 0);
  const totalExercises = programs.reduce((count, program) => count + program.days.reduce((dayCount, day) => dayCount + day.exercises.length, 0), 0);
  const activeProgram = programs.find(program => program.id === activeProgramId);
  const updateProgram = (updatedProgram: Program) => setPrograms(current => current.map(program => program.id === updatedProgram.id ? updatedProgram : program));
  const deleteProgram = (program: Program) => Alert.alert('Delete this plan?', `Remove ${program.name} from your saved workouts?`, [{ text: 'Keep plan', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => setPrograms(current => current.filter(item => item.id !== program.id)) }]);
  const markTrainingDay = () => undefined;
  const saveTrainingDuration = (seconds: number) => { const today = localDateKey(new Date()); setTrainingDates(current => { const history = current && typeof current === 'object' && !Array.isArray(current) ? current : {}; return { ...history, [today]: Math.max(history[today] ?? 0, seconds) }; }); };

  if (activeProgram) return <TrainingScreen program={activeProgram} onChange={updateProgram} onBack={() => setActiveProgramId(null)} onSessionStart={markTrainingDay} onSessionEnd={saveTrainingDuration} />;

  return <View style={styles.container}><SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.topline}><Text style={styles.eyebrow}>SLATER GYM / PROFILE</Text><View style={styles.statusDot} /></View>
    <Text style={styles.title}>{profile.name ? `Good to see you, ${profile.name}.` : 'Make this gym yours.'}</Text>
    <Text style={styles.subtitle}>Your training identity, goals, and programs in one place.</Text>

    <View style={styles.identityCard}><View style={styles.avatar}><Text style={styles.avatarText}>{profile.name ? profile.name.slice(0, 1).toUpperCase() : '?'}</Text></View><View style={styles.identityCopy}><Text style={styles.identityName}>{profile.name || 'Your profile'}</Text><Text style={styles.identityMeta}>{profile.level} · {profile.goal}</Text></View></View>

    <Text style={styles.sectionTitle}>Profile details</Text>
    <View style={styles.formCard}><ProfileField label="Name" value={profile.name} placeholder="Your name" onChangeText={value => setProfile(current => ({ ...current, name: value }))} /><ProfileField label="Main goal" value={profile.goal} placeholder="Build strength" onChangeText={value => setProfile(current => ({ ...current, goal: value }))} /><ProfileField label="Experience" value={profile.level} placeholder="Intermediate" onChangeText={value => setProfile(current => ({ ...current, level: value }))} /><ProfileField label="Equipment access" value={profile.equipment} placeholder="Full gym" onChangeText={value => setProfile(current => ({ ...current, equipment: value }))} /></View>

    <View style={styles.statsRow}><Stat value={String(programs.length)} label="programs" /><Stat value={String(totalDays)} label="training days" /><Stat value={String(totalExercises)} label="exercises" /></View>

    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Your workouts</Text><Text style={styles.sectionHint}>{programs.length ? 'Saved locally' : 'Start in Explore'}</Text></View>
    {programs.length ? programs.map(program => <ProgramCard key={program.id} program={program} onOpen={() => setActiveProgramId(program.id)} onDelete={() => deleteProgram(program)} />) : <View style={styles.emptyCard}><Text style={styles.emptyTitle}>No programs yet</Text><Text style={styles.emptyCopy}>Build your first week in Explore. It will appear here automatically after you save it.</Text></View>}
  </ScrollView></SafeAreaView></View>;
}

function ProfileField({ label, value, placeholder, onChangeText }: { label: string; value: string; placeholder: string; onChangeText: (value: string) => void }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#9A948B" style={styles.input} /></View>;
}

function Stat({ value, label }: { value: string; label: string }) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }

function ProgramCard({ program, onOpen, onDelete }: { program: Program; onOpen: () => void; onDelete: () => void }) {
  const exerciseCount = program.days.reduce((count, day) => count + day.exercises.length, 0);
  return <View style={styles.programCard}><View style={styles.programHeader}><View><Text style={styles.programName}>{program.name}</Text><Text style={styles.programMeta}>{program.days.length} days · {exerciseCount} exercises</Text></View><Text style={styles.programMark}>PLAN</Text></View>{program.days.map(day => <View key={`${program.id}-${day.name}`} style={styles.dayRow}><Text style={styles.dayName}>{day.name}</Text><Text style={styles.dayExercises}>{day.exercises.length ? day.exercises.map(exercise => exercise.name).join(' · ') : 'No exercises added yet'}</Text></View>)}<View style={styles.programActions}><Pressable onPress={onOpen} style={styles.openButton}><Text style={styles.openButtonText}>OPEN PLAN</Text></Pressable><Pressable onPress={onDelete} style={styles.deleteButton}><Text style={styles.deleteButtonText}>DELETE PLAN</Text></Pressable></View></View>;
}

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

function TrainingScreen({ program, onChange, onBack, onSessionStart, onSessionEnd }: { program: Program; onChange: (program: Program) => void; onBack: () => void; onSessionStart: () => void; onSessionEnd: (seconds: number) => void }) {
  const [dayIndex, setDayIndex] = useState(0);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [rest, setRest] = useState(0);
  const [restInput, setRestInput] = useState('60');
  const day = program.days[dayIndex];
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { if (!rest) return undefined; const timer = setInterval(() => setRest(value => Math.max(0, value - 1)), 1000); return () => clearInterval(timer); }, [rest]);
  const format = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const updateSet = (exerciseName: string, setIndex: number, field: 'weight' | 'reps', value: string) => onChange({ ...program, days: program.days.map((currentDay, index) => index !== dayIndex ? currentDay : { ...currentDay, exercises: currentDay.exercises.map(exercise => exercise.name !== exerciseName ? exercise : { ...exercise, sets: exercise.sets.map((set, index) => index === setIndex ? { ...set, [field]: value } : set) }) }) });
  const startRest = () => setRest(Number.parseInt(restInput, 10) || 60);
  const toggleSession = () => setSessionStartedAt(current => { if (current) { onSessionEnd(Math.floor((Date.now() - current) / 1000)); return null; } onSessionStart(); return Date.now(); });
  return <View style={styles.container}><SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><Pressable onPress={onBack} style={styles.backButton}><Text style={styles.backText}>BACK TO PROFILE</Text></Pressable><Text style={styles.eyebrow}>ACTIVE WORKOUT</Text><Text style={styles.title}>{program.name}</Text><Text style={styles.subtitle}>Start the session before your first set. Stop it when training is complete.</Text><View style={styles.timerCard}><View><Text style={styles.timerLabel}>SESSION</Text><Text style={styles.timerValue}>{format(sessionStartedAt ? Math.floor((now - sessionStartedAt) / 1000) : 0)}</Text></View><Pressable onPress={toggleSession} style={styles.timerButton}><Text style={styles.timerButtonText}>{sessionStartedAt ? 'END SESSION' : 'START SESSION'}</Text></Pressable></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayTabs}>{program.days.map((currentDay, index) => <Pressable key={`${currentDay.name}-${index}`} onPress={() => setDayIndex(index)} style={[styles.dayTab, dayIndex === index && styles.dayTabActive]}><Text style={[styles.dayTabText, dayIndex === index && styles.dayTabTextActive]}>{currentDay.name}</Text></Pressable>)}</ScrollView><Text style={styles.sectionTitle}>{day.name}</Text>{day.exercises.map(exercise => <View key={exercise.name} style={styles.trainingCard}><View style={styles.trainingHeader}><Text style={styles.trainingName}>{exercise.name}</Text><Text style={styles.muted}>5 sets</Text></View><View style={styles.setHeader}><Text style={styles.setHeaderText}>SET</Text><Text style={styles.setHeaderText}>WEIGHT</Text><Text style={styles.setHeaderText}>REPS</Text></View>{exercise.sets.map((set, index) => <View key={`${exercise.name}-${index}`} style={styles.setRow}><Text style={styles.setNumber}>{index + 1}</Text><TextInput value={set.weight} onChangeText={value => updateSet(exercise.name, index, 'weight', value)} placeholder="kg" placeholderTextColor="#9A948B" keyboardType="decimal-pad" style={styles.setInput} /><TextInput value={set.reps} onChangeText={value => updateSet(exercise.name, index, 'reps', value)} placeholder="reps" placeholderTextColor="#9A948B" keyboardType="number-pad" style={styles.setInput} /></View>)}</View>)}<View style={styles.restCard}><View><Text style={styles.timerLabel}>REST TIMER</Text><Text style={styles.timerValue}>{rest ? format(rest) : 'READY'}</Text></View><View style={styles.restActions}><TextInput value={restInput} onChangeText={setRestInput} keyboardType="number-pad" placeholder="sec" placeholderTextColor="#9A948B" style={styles.restInput} /><Pressable onPress={startRest} style={styles.timerButton}><Text style={styles.timerButtonText}>START REST</Text></Pressable></View></View></ScrollView></SafeAreaView></View>;
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F5F1EA', flex: 1 },
  safeArea: { alignSelf: 'center', maxWidth: MaxContentWidth, paddingBottom: BottomTabInset, width: '100%' },
  content: { padding: 20, paddingBottom: 100 },
  topline: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  eyebrow: { color: '#71826F', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  statusDot: { backgroundColor: '#C76D3B', borderRadius: 5, height: 10, width: 10 },
  title: { color: '#1C2A22', fontSize: 30, fontWeight: '900', marginTop: 18 },
  subtitle: { color: '#847D72', fontSize: 14, lineHeight: 21, marginTop: 6 },
  identityCard: { alignItems: 'center', backgroundColor: '#1D2D24', borderRadius: 14, flexDirection: 'row', marginTop: 24, padding: 18 },
  avatar: { alignItems: 'center', backgroundColor: '#C76D3B', borderRadius: 28, height: 56, justifyContent: 'center', width: 56 },
  avatarText: { color: '#FFF', fontSize: 25, fontWeight: '900' },
  identityCopy: { marginLeft: 14 },
  identityName: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  identityMeta: { color: '#AFC2AE', fontSize: 12, marginTop: 5 },
  sectionHeader: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between', marginTop: 28 },
  sectionTitle: { color: '#1C2A22', fontSize: 19, fontWeight: '900', marginBottom: 12, marginTop: 24 },
  sectionHint: { color: '#847D72', fontSize: 11 },
  formCard: { backgroundColor: '#FFFDFA', borderColor: '#E2DBD0', borderRadius: 12, borderWidth: 1, padding: 16 },
  field: { marginBottom: 13 },
  fieldLabel: { color: '#716C63', fontSize: 11, fontWeight: '800', marginBottom: 6 },
  input: { backgroundColor: '#F5F1EA', borderColor: '#E2DBD0', borderRadius: 8, borderWidth: 1, color: '#1C2A22', paddingHorizontal: 12, paddingVertical: 11 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  stat: { backgroundColor: '#E4EDE2', borderRadius: 10, flex: 1, padding: 13 },
  statValue: { color: '#1C2A22', fontSize: 21, fontWeight: '900' },
  statLabel: { color: '#48654C', fontSize: 10, fontWeight: '800', marginTop: 3 },
  emptyCard: { backgroundColor: '#FFFDFA', borderColor: '#E2DBD0', borderRadius: 12, borderWidth: 1, padding: 18 },
  emptyTitle: { color: '#1C2A22', fontSize: 16, fontWeight: '900' },
  emptyCopy: { color: '#847D72', fontSize: 13, lineHeight: 19, marginTop: 6 },
  programCard: { backgroundColor: '#FFFDFA', borderColor: '#E2DBD0', borderRadius: 12, borderWidth: 1, marginBottom: 12, padding: 16 },
  programHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  programName: { color: '#1C2A22', fontSize: 17, fontWeight: '900' },
  programMeta: { color: '#847D72', fontSize: 11, marginTop: 4 },
  muted: { color: '#847D72', fontSize: 11 },
  programMark: { color: '#C76D3B', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  dayRow: { borderTopColor: '#E2DBD0', borderTopWidth: 1, paddingVertical: 10 },
  dayName: { color: '#48654C', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  dayExercises: { color: '#716C63', fontSize: 12, lineHeight: 18, marginTop: 3 },
  historySection: { marginTop: 8 },
  historyCard: { backgroundColor: '#FFFDFA', borderColor: '#E2DBD0', borderRadius: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', padding: 14 },
  historyDay: { alignItems: 'center', flex: 1 },
  historyLabel: { color: '#847D72', fontSize: 9, fontWeight: '900' },
  historyDot: { alignItems: 'center', backgroundColor: '#F5F1EA', borderColor: '#E2DBD0', borderRadius: 15, borderWidth: 1, height: 30, justifyContent: 'center', marginVertical: 7, width: 30 },
  historyDotActive: { backgroundColor: '#719174', borderColor: '#719174' },
  historyCheck: { color: '#B8B0A5', fontSize: 14, fontWeight: '900' },
  historyCheckActive: { color: '#FFF' },
  historyDate: { color: '#1C2A22', fontSize: 11, fontWeight: '800' },
  historyDuration: { color: '#48654C', fontSize: 9, fontWeight: '900', marginTop: 3 },
  openButton: { alignItems: 'center', backgroundColor: '#C76D3B', borderRadius: 8, flex: 1, marginTop: 12, paddingVertical: 12 },
  openButtonText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  programActions: { flexDirection: 'row', gap: 8 },
  deleteButton: { alignItems: 'center', borderColor: '#C76D3B', borderRadius: 8, borderWidth: 1, flex: 1, marginTop: 12, paddingVertical: 11 },
  deleteButtonText: { color: '#C76D3B', fontSize: 10, fontWeight: '900' },
  backButton: { alignSelf: 'flex-start', marginBottom: 24 },
  backText: { color: '#48654C', fontSize: 11, fontWeight: '900' },
  timerCard: { alignItems: 'center', backgroundColor: '#1D2D24', borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', marginTop: 22, padding: 18 },
  timerLabel: { color: '#AFC2AE', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  timerValue: { color: '#FFF', fontSize: 28, fontWeight: '900', marginTop: 5 },
  timerButton: { backgroundColor: '#C76D3B', borderRadius: 8, paddingHorizontal: 13, paddingVertical: 11 },
  timerButtonText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  dayTabs: { gap: 8, paddingVertical: 20 },
  dayTab: { backgroundColor: '#FFFDFA', borderColor: '#E2DBD0', borderRadius: 8, borderWidth: 1, paddingHorizontal: 15, paddingVertical: 10 },
  dayTabActive: { backgroundColor: '#719174' },
  dayTabText: { color: '#716C63', fontSize: 11, fontWeight: '900' },
  dayTabTextActive: { color: '#FFF' },
  trainingCard: { backgroundColor: '#FFFDFA', borderColor: '#E2DBD0', borderRadius: 12, borderWidth: 1, marginBottom: 12, padding: 15 },
  trainingHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 13 },
  trainingName: { color: '#1C2A22', fontSize: 16, fontWeight: '900' },
  setHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  setHeaderText: { color: '#847D72', flex: 1, fontSize: 9, fontWeight: '900', textAlign: 'center' },
  setRow: { alignItems: 'center', flexDirection: 'row', gap: 7, marginTop: 7 },
  setNumber: { color: '#C76D3B', fontSize: 11, fontWeight: '900', textAlign: 'center', width: 28 },
  setInput: { backgroundColor: '#F5F1EA', borderColor: '#E2DBD0', borderRadius: 6, borderWidth: 1, color: '#1C2A22', flex: 1, paddingHorizontal: 8, paddingVertical: 9, textAlign: 'center' },
  restCard: { alignItems: 'center', backgroundColor: '#E4EDE2', borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, padding: 16 },
  restActions: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  restInput: { backgroundColor: '#FFFDFA', borderColor: '#D2DDD0', borderRadius: 6, borderWidth: 1, color: '#1C2A22', paddingHorizontal: 8, paddingVertical: 9, textAlign: 'center', width: 58 },
});
