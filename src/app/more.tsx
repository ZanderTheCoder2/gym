import { BottomTabInset, MaxContentWidth, Palette } from '@/constants/theme';
import { emptyMeasurements, localMeasurementDateKey, measurementFields, measurementsStorageKey, normalizeMeasurementEntries, type MeasurementEntry, type MeasurementValues } from '@/data/measurements';
import { getCompletedSetMetrics, getWeeklyTrainingMetrics, normalizeTrainingSessions, trainingSessionsStorageKey, type TrainingSession } from '@/data/training-history';
import { defaultProfile, normalizeProfile, profileStorageKey, type Profile } from '@/data/profile';
import { useDevelopmentReset } from '@/components/first-run-setup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';

const profileDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MoreScreen() {
  const router = useRouter();
  const resetDevelopmentData = useDevelopmentReset();
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementEntry[]>([]);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [metric, setMetric] = useState<'volumeLoad' | 'sets' | 'sessions'>('volumeLoad');
  const [loaded, setLoaded] = useState(false);
  const [confirmDevelopmentReset, setConfirmDevelopmentReset] = useState(false);
  const [resettingDevelopmentData, setResettingDevelopmentData] = useState(false);
  const [developmentResetError, setDevelopmentResetError] = useState('');

  useFocusEffect(useCallback(() => {
    let active = true;
    Promise.all([AsyncStorage.getItem(profileStorageKey), AsyncStorage.getItem(trainingSessionsStorageKey), AsyncStorage.getItem(measurementsStorageKey)])
      .then(([profileValue, sessionsValue, measurementsValue]) => {
        if (!active) return;
        if (profileValue) setProfile(normalizeProfile(JSON.parse(profileValue)));
        setSessions(normalizeTrainingSessions(sessionsValue ? JSON.parse(sessionsValue) : []));
        setMeasurements(normalizeMeasurementEntries(measurementsValue ? JSON.parse(measurementsValue) : []));
      })
      .catch(() => undefined)
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []));
  useEffect(() => { if (loaded) AsyncStorage.setItem(profileStorageKey, JSON.stringify(profile)).catch(() => undefined); }, [profile, loaded]);
  useEffect(() => { if (loaded) AsyncStorage.setItem(measurementsStorageKey, JSON.stringify(measurements)).catch(() => undefined); }, [measurements, loaded]);

  const weeks = getWeeklyTrainingMetrics(sessions);
  const thisWeek = weeks[weeks.length - 1];
  const recentSessions = sessions.slice().sort((left, right) => right.dateKey.localeCompare(left.dateKey)).slice(0, 5);

  const resetEverythingForDevelopment = async () => {
    if (!resetDevelopmentData) {
      setDevelopmentResetError('The development reset is unavailable on this screen.');
      return;
    }
    setResettingDevelopmentData(true);
    setDevelopmentResetError('');
    try {
      await resetDevelopmentData();
    } catch {
      setDevelopmentResetError('Could not reset app data. Please try again.');
      setResettingDevelopmentData(false);
    }
  };

  if (showMeasurements) return <MeasurementsScreen entries={measurements} onEntriesChange={setMeasurements} onBack={() => setShowMeasurements(false)} />;

  return <View style={[styles.container, polished.screen]}><SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={styles.eyebrow}>FORGED / TRAINING LOG</Text><Text style={styles.title}>Progress.</Text><Text style={styles.subtitle}>A clear record of the work you have put in.</Text>
    <View style={[styles.weekSummary, polished.summary]}><Text style={[styles.summaryLabel, polished.summaryLabel]}>THIS WEEK</Text><Text style={[styles.summaryValue, polished.summaryValue]}>{formatNumber(thisWeek.volumeLoad)} <Text style={styles.summaryUnit}>kg</Text></Text><Text style={[styles.summaryCaption, polished.summaryCaption]}>weighted volume</Text><View style={[styles.summaryRule, polished.summaryRule]} /><View style={styles.summaryStats}><SummaryStat value={String(thisWeek.sessions)} label="SESSIONS" /><SummaryStat value={String(thisWeek.sets)} label="SETS" /><SummaryStat value={String(thisWeek.reps)} label="REPS" /></View></View>
    <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Training trend</Text><Text style={styles.sectionHint}>Last 6 weeks</Text></View>
    <View style={[styles.chartPanel, polished.panel]}>
      <View style={[styles.metricTabs, polished.metricTabs]}>{([['volumeLoad', 'Load'], ['sets', 'Sets'], ['sessions', 'Sessions']] as const).map(([value, label]) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: metric === value }} onPress={() => setMetric(value)} style={[styles.metricTab, polished.metricTab, metric === value && styles.metricTabActive, metric === value && polished.metricTabActive]}><Text style={[styles.metricTabText, polished.metricTabText, metric === value && styles.metricTabTextActive]}>{label}</Text></Pressable>)}</View>
      <WeeklyChart weeks={weeks} metric={metric} />
      <Text style={styles.chartNote}>{metric === 'volumeLoad' ? 'Volume load = weight x reps. Unweighted sets are not included.' : metric === 'sets' ? 'Counts sets marked complete during logged workouts.' : 'Counts workouts ended in the app.'}</Text>
    </View>
    <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Recent sessions</Text><Text style={styles.sectionHint}>{sessions.length} logged</Text></View>
    {recentSessions.length ? <View style={[styles.listPanel, polished.panel]}>{recentSessions.map((session, index) => <SessionRow key={session.id} session={session} isLast={index === recentSessions.length - 1} />)}</View> : <View style={[styles.emptyPanel, polished.panel]}><Text style={styles.emptyTitle}>Your first session is waiting.</Text><Text style={styles.emptyCopy}>Start a workout and mark sets complete to build your training history.</Text><Pressable accessibilityRole="button" onPress={() => router.push('/')} style={styles.startButton}><Text style={styles.startButtonText}>GO TO TRAINING</Text></Pressable></View>}
    <Text style={styles.sectionTitle}>Body tracking</Text><Pressable accessibilityRole="button" onPress={() => setShowMeasurements(true)} style={[styles.action, polished.panel]}><Text style={styles.actionTitle}>Measurements</Text><Text style={styles.actionText}>Log weight, body measurements, and track changes over time.</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={() => router.push('/progress')} style={[styles.action, polished.panel]}><Text style={styles.actionTitle}>Training plans</Text><Text style={styles.actionText}>View, edit, and create your saved training plans.</Text></Pressable>
    <Text style={styles.sectionTitle}>Profile</Text><View style={[styles.formCard, polished.panel]}><ProfileField label="Name" value={profile.name} placeholder="Your name" onChangeText={value => setProfile(current => ({ ...current, name: value }))} /><ProfileField label="Age range" value={profile.ageRange} placeholder="Prefer not to say" onChangeText={value => setProfile(current => ({ ...current, ageRange: value }))} /><ProfileField label="Main goal" value={profile.goal} placeholder="Build strength" onChangeText={value => setProfile(current => ({ ...current, goal: value }))} /><ProfileField label="Experience" value={profile.level} placeholder="Beginner" onChangeText={value => setProfile(current => ({ ...current, level: value }))} /><ProfileField label="Training days per week" value={String(profile.trainingDays)} placeholder="3" onChangeText={value => setProfile(current => ({ ...current, trainingDays: Number(value) }))} /><ProfileField label="Preferred days" value={profile.availableDays.map(day => profileDays[day]).join(', ')} placeholder="Mon, Wed, Fri" onChangeText={value => setProfile(current => ({ ...current, availableDays: value.split(',').map(day => profileDays.indexOf(day.trim().slice(0, 3))).filter(day => day >= 0) }))} /><ProfileField label="Session length" value={profile.sessionLength} placeholder="45 minutes" onChangeText={value => setProfile(current => ({ ...current, sessionLength: value }))} /><ProfileField label="Equipment access" value={profile.equipment.join(', ')} placeholder="Full gym" onChangeText={value => setProfile(current => ({ ...current, equipment: value.split(',').map(item => item.trim()).filter(Boolean) }))} /><ProfileField label="Movements or areas to avoid" value={profile.limitations} placeholder="Optional" onChangeText={value => setProfile(current => ({ ...current, limitations: value }))} /></View>
    {__DEV__ && <View style={[styles.developmentPanel, polished.panel]}><Text style={styles.developmentLabel}>DEVELOPMENT ONLY</Text><Text style={styles.actionTitle}>Reset app data</Text><Text style={styles.actionText}>Clear setup, profile, programs, workout history, and measurements, then return to first-run setup.</Text>{confirmDevelopmentReset ? <><Text style={styles.developmentWarning}>This permanently removes all saved app data on this device.</Text><View style={styles.developmentActions}><Pressable accessibilityRole="button" disabled={resettingDevelopmentData} onPress={() => { setConfirmDevelopmentReset(false); setDevelopmentResetError(''); }} style={styles.developmentCancel}><Text style={styles.developmentCancelText}>CANCEL</Text></Pressable><Pressable accessibilityRole="button" disabled={resettingDevelopmentData || !resetDevelopmentData} onPress={() => void resetEverythingForDevelopment()} style={[styles.developmentConfirm, (resettingDevelopmentData || !resetDevelopmentData) && { opacity: 0.5 }]}><Text style={styles.developmentConfirmText}>{resettingDevelopmentData ? 'RESETTING…' : 'CONFIRM RESET'}</Text></Pressable></View></> : <Pressable accessibilityRole="button" onPress={() => setConfirmDevelopmentReset(true)} style={styles.developmentButton}><Text style={styles.developmentConfirmText}>RESET ALL APP DATA</Text></Pressable>}{developmentResetError ? <Text accessibilityRole="alert" style={styles.developmentResetError}>{developmentResetError}</Text> : null}</View>}
  </ScrollView></SafeAreaView></View>;
}

function MeasurementsScreen({ entries, onEntriesChange, onBack }: { entries: MeasurementEntry[]; onEntriesChange: (entries: MeasurementEntry[]) => void; onBack: () => void }) {
  const [values, setValues] = useState<MeasurementValues>(emptyMeasurements);
  const [error, setError] = useState('');
  const latest = entries.slice().sort((left, right) => right.dateKey.localeCompare(left.dateKey))[0];
  const saveMeasurements = () => {
    const hasValue = measurementFields.some(([key]) => values[key].trim() !== '');
    const invalidField = measurementFields.find(([key]) => {
      const value = values[key].trim();
      return value !== '' && (!Number.isFinite(Number(value.replace(',', '.'))) || Number(value.replace(',', '.')) < 0);
    });
    if (!hasValue) { setError('Add at least one measurement before saving.'); return; }
    if (invalidField) { setError(`${invalidField[1]} must be a valid positive number.`); return; }
    const entry: MeasurementEntry = { id: `measurement-${Date.now()}`, dateKey: localMeasurementDateKey(new Date()), values };
    onEntriesChange([entry, ...entries]);
    setValues(emptyMeasurements());
    setError('');
    Alert.alert('Measurements saved', 'Your body measurements have been added to your history.');
  };

  return <View style={[styles.container, polished.screen]}><SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}><Text style={styles.backText}>BACK TO MORE</Text></Pressable>
    <Text style={styles.eyebrow}>FORGED / BODY TRACKING</Text><Text style={styles.title}>Measurements.</Text><Text style={styles.subtitle}>Log a snapshot when you like. Trends matter more than any one reading.</Text>
    {latest && <View style={[styles.measurementLatest, polished.panel]}><Text style={styles.measurementSectionTitle}>Latest check-in</Text><Text style={styles.measurementDate}>{formatDateKey(latest.dateKey)}</Text><View style={styles.measurementLatestGrid}>{measurementFields.filter(([key]) => latest.values[key]).map(([key, label, unit]) => <View key={key} style={styles.measurementLatestItem}><Text style={styles.measurementLatestValue}>{latest.values[key]} <Text style={styles.measurementUnit}>{unit}</Text></Text><Text style={styles.measurementLatestLabel}>{label.toUpperCase()}</Text></View>)}</View></View>}
    <View style={[styles.measurementForm, polished.panel]}><Text style={styles.measurementSectionTitle}>New check-in</Text><Text style={styles.measurementHelp}>Weight in kg · body measurements in cm · all fields optional</Text>
      <View style={styles.measurementGrid}>{measurementFields.map(([key, label, unit]) => <View key={key} style={styles.measurementField}><Text style={styles.fieldLabel}>{label}</Text><View style={styles.measurementInputWrap}><TextInput accessibilityLabel={label} value={values[key]} onChangeText={value => { setValues(current => ({ ...current, [key]: value })); setError(''); }} placeholder="—" placeholderTextColor="#747A74" keyboardType="decimal-pad" style={styles.measurementInput} /><Text style={styles.measurementInputUnit}>{unit}</Text></View></View>)}</View>
      {error ? <Text accessibilityRole="alert" style={styles.measurementError}>{error}</Text> : null}
      <Pressable accessibilityRole="button" onPress={saveMeasurements} style={styles.saveMeasurementButton}><Text style={styles.saveMeasurementText}>SAVE CHECK-IN</Text></Pressable>
    </View>
    <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>History</Text><Text style={styles.sectionHint}>{entries.length} check-ins</Text></View>
    {entries.length ? entries.slice().sort((left, right) => right.dateKey.localeCompare(left.dateKey)).map(entry => {
      const logged = measurementFields.filter(([key]) => entry.values[key]);
      return <View key={entry.id} style={[styles.measurementHistoryCard, polished.panel]}><Text style={styles.measurementHistoryDate}>{formatDateKey(entry.dateKey)}</Text><View style={styles.measurementHistoryValues}>{logged.map(([key, label, unit]) => <Text key={key} style={styles.measurementHistoryValue}>{label}: {entry.values[key]} {unit}</Text>)}</View></View>;
    }) : <View style={[styles.emptyPanel, polished.panel]}><Text style={styles.emptyTitle}>No check-ins yet</Text><Text style={styles.emptyCopy}>Your saved weight and body measurements will show here so you can compare progress over time.</Text></View>}
  </ScrollView></SafeAreaView></View>;
}

function formatDateKey(dateKey: string) { return new Date(`${dateKey}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); }

function SummaryStat({ value, label }: { value: string; label: string }) { return <View style={styles.summaryStat}><Text style={[styles.summaryStatValue, polished.summaryStatValue]}>{value}</Text><Text style={[styles.summaryStatLabel, polished.summaryStatLabel]}>{label}</Text></View>; }

function WeeklyChart({ weeks, metric }: { weeks: ReturnType<typeof getWeeklyTrainingMetrics>; metric: 'volumeLoad' | 'sets' | 'sessions' }) {
  const chartValues = weeks.map(week => week[metric]);
  const maxValue = Math.max(...chartValues, 1);
  const step = Math.ceil(maxValue / 3);
  const chartTop = 16;
  const chartBottom = 120;
  const chartHeight = chartBottom - chartTop;
  const barWidth = 25;
  const positions = weeks.map((_, index) => 48 + index * 48);
  const formatTick = (value: number) => metric === 'volumeLoad' && value >= 1000 ? `${Math.round(value / 100) / 10}k` : String(value);

  return <Svg width="100%" height={164} viewBox="0 0 340 164" accessibilityLabel={`${metric} by week chart`}>
    {[0, 1, 2, 3].map(index => { const value = step * (3 - index); const y = chartTop + (chartHeight / 3) * index; return <Fragment key={index}><Line x1={35} y1={y} x2={330} y2={y} stroke="#343434" strokeWidth={1} /><SvgText x={29} y={y + 3} fill="#969696" fontSize={8} textAnchor="end">{formatTick(value)}</SvgText></Fragment>; })}
    {weeks.map((week, index) => {
      const value = week[metric];
      const height = value ? Math.max(3, (value / (step * 3)) * chartHeight) : 2;
      const x = positions[index];
      const date = new Date(`${week.weekStart}T12:00:00`);
      const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return <Fragment key={week.weekStart}><Rect x={x} y={chartBottom - height} width={barWidth} height={height} fill={index === weeks.length - 1 ? Palette.accent : '#6C7E70'} rx={2} /><SvgText x={x + barWidth / 2} y={143} fill={Palette.textSecondary} fontSize={8} textAnchor="middle">{label}</SvgText></Fragment>;
    })}
  </Svg>;
}

function SessionRow({ session, isLast }: { session: TrainingSession; isLast: boolean }) {
  const metrics = getCompletedSetMetrics(session.sets);
  const [year, month, day] = session.dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return <View style={[styles.sessionRow, !isLast && styles.sessionRowBorder]}><View style={styles.sessionDate}><Text style={styles.sessionDay}>{date.toLocaleDateString(undefined, { day: '2-digit' })}</Text><Text style={styles.sessionMonth}>{date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}</Text></View><View style={styles.sessionInfo}><Text style={styles.sessionTitle}>{date.toLocaleDateString(undefined, { weekday: 'long' })} training</Text><Text style={styles.sessionDetails}>{metrics.sets} sets · {Math.round(session.durationSeconds / 60)} min</Text></View><Text style={styles.sessionLoad}>{formatNumber(metrics.volumeLoad)} kg</Text></View>;
}

function formatNumber(value: number) { return Math.round(value).toLocaleString(); }

function ProfileField({ label, value, placeholder, onChangeText }: { label: string; value: string; placeholder: string; onChangeText: (value: string) => void }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#8E8E8E" style={[styles.input, polished.input]} /></View>;
}

const polished = StyleSheet.create({
  screen: { backgroundColor: Palette.background },
  panel: { backgroundColor: Palette.surface, borderColor: Palette.border, borderRadius: 10 },
  input: { backgroundColor: Palette.background, borderColor: Palette.border, color: Palette.text },
  summary: { backgroundColor: Palette.surfaceRaised, borderColor: Palette.border, borderRadius: 12, borderWidth: 1 },
  summaryLabel: { color: Palette.accent },
  summaryValue: { color: Palette.text, fontSize: 40 },
  summaryCaption: { color: Palette.textSecondary },
  summaryRule: { backgroundColor: Palette.border },
  summaryStatValue: { color: Palette.text },
  summaryStatLabel: { color: Palette.accent },
  metricTabs: { backgroundColor: Palette.background },
  metricTab: { borderRadius: 5 },
  metricTabActive: { backgroundColor: Palette.accent },
  metricTabText: { color: Palette.textSecondary },
});

const styles = StyleSheet.create({
  container: { backgroundColor: '#0B0B0B', flex: 1 }, safeArea: { alignSelf: 'center', flex: 1, maxWidth: MaxContentWidth, paddingBottom: BottomTabInset, width: '100%' }, content: { padding: 20, paddingBottom: 100 },
  backButton: { alignSelf: 'flex-start', marginBottom: 8 }, backText: { color: Palette.accent, fontSize: 11, fontWeight: '900' },
  eyebrow: { color: '#D4AF37', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 }, title: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', marginTop: 18 }, subtitle: { color: '#B8B8B8', fontSize: 14, lineHeight: 21, marginTop: 6 },
  weekSummary: { backgroundColor: '#D4AF37', borderRadius: 10, marginTop: 24, padding: 18 }, summaryLabel: { color: '#211B08', fontSize: 10, fontWeight: '900', letterSpacing: 1 }, summaryValue: { color: '#0B0B0B', fontSize: 32, fontWeight: '900', marginTop: 10 }, summaryUnit: { fontSize: 15 }, summaryCaption: { color: '#342A0D', fontSize: 12, marginTop: 2 }, summaryRule: { backgroundColor: '#9D8024', height: 1, marginVertical: 16 }, summaryStats: { flexDirection: 'row', justifyContent: 'space-between' }, summaryStat: { flex: 1 }, summaryStatValue: { color: '#0B0B0B', fontSize: 20, fontWeight: '900' }, summaryStatLabel: { color: '#342A0D', fontSize: 9, fontWeight: '900', marginTop: 3 },
  sectionHeading: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between', marginTop: 26 }, sectionTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '900' }, sectionHint: { color: '#B8B8B8', fontSize: 11 }, chartPanel: { backgroundColor: '#171717', borderColor: '#343434', borderRadius: 8, borderWidth: 1, marginTop: 12, padding: 14 },
  measurementLatest: { marginTop: 22, padding: 16 }, measurementForm: { marginTop: 14, padding: 16 }, measurementSectionTitle: { color: Palette.text, fontSize: 16, fontWeight: '900' }, measurementDate: { color: Palette.textSecondary, fontSize: 11, marginTop: 4 }, measurementHelp: { color: Palette.textSecondary, fontSize: 10, lineHeight: 15, marginTop: 5 }, measurementLatestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 }, measurementLatestItem: { backgroundColor: Palette.background, borderRadius: 8, minWidth: '28%', padding: 10 }, measurementLatestValue: { color: Palette.text, fontSize: 15, fontWeight: '900' }, measurementUnit: { color: Palette.textSecondary, fontSize: 9, fontWeight: '700' }, measurementLatestLabel: { color: Palette.textSecondary, fontSize: 8, fontWeight: '900', marginTop: 4 }, measurementGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 }, measurementField: { width: '47%' }, measurementInputWrap: { alignItems: 'center', backgroundColor: Palette.background, borderColor: Palette.border, borderRadius: 7, borderWidth: 1, flexDirection: 'row', paddingHorizontal: 10 }, measurementInput: { color: Palette.text, flex: 1, paddingVertical: 10 }, measurementInputUnit: { color: Palette.textSecondary, fontSize: 10 }, measurementError: { color: Palette.coral, fontSize: 11, marginTop: 10 }, saveMeasurementButton: { alignItems: 'center', backgroundColor: Palette.accent, borderRadius: 8, marginTop: 16, paddingVertical: 13 }, saveMeasurementText: { color: Palette.background, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 }, measurementHistoryCard: { marginTop: 9, padding: 14 }, measurementHistoryDate: { color: Palette.text, fontSize: 12, fontWeight: '900' }, measurementHistoryValues: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }, measurementHistoryValue: { backgroundColor: Palette.background, borderRadius: 6, color: Palette.textSecondary, fontSize: 10, paddingHorizontal: 8, paddingVertical: 6 },
  metricTabs: { backgroundColor: '#0B0B0B', borderRadius: 6, flexDirection: 'row', padding: 3 }, metricTab: { alignItems: 'center', borderRadius: 4, flex: 1, paddingVertical: 8 }, metricTabActive: { backgroundColor: '#D4AF37' }, metricTabText: { color: '#B8B8B8', fontSize: 10, fontWeight: '800' }, metricTabTextActive: { color: '#0B0B0B' }, chartNote: { color: '#AFAFAF', fontSize: 10, lineHeight: 15, marginTop: 4 },
  listPanel: { backgroundColor: '#171717', borderColor: '#343434', borderRadius: 8, borderWidth: 1, marginTop: 12, paddingHorizontal: 14 }, sessionRow: { alignItems: 'center', flexDirection: 'row', minHeight: 68 }, sessionRowBorder: { borderBottomColor: '#343434', borderBottomWidth: 1 }, sessionDate: { alignItems: 'center', backgroundColor: '#242424', borderRadius: 5, justifyContent: 'center', height: 42, width: 42 }, sessionDay: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' }, sessionMonth: { color: '#D4AF37', fontSize: 8, fontWeight: '900' }, sessionInfo: { flex: 1, marginLeft: 12 }, sessionTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' }, sessionDetails: { color: '#B8B8B8', fontSize: 10, marginTop: 4 }, sessionLoad: { color: '#D4AF37', fontSize: 11, fontWeight: '900', marginLeft: 8 },
  emptyPanel: { backgroundColor: '#171717', borderColor: '#343434', borderRadius: 8, borderWidth: 1, marginTop: 12, padding: 16 }, emptyTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' }, emptyCopy: { color: '#B8B8B8', fontSize: 12, lineHeight: 18, marginTop: 6 }, startButton: { alignSelf: 'flex-start', backgroundColor: '#D4AF37', borderRadius: 6, marginTop: 14, paddingHorizontal: 13, paddingVertical: 10 }, startButtonText: { color: '#0B0B0B', fontSize: 10, fontWeight: '900' },
  action: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 8, borderWidth: 1, marginTop: 24, padding: 16 }, actionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' }, actionText: { color: '#B8B8B8', fontSize: 13, marginTop: 5 }, formCard: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 8, borderWidth: 1, padding: 16 }, field: { marginBottom: 13 }, fieldLabel: { color: '#CFCFCF', fontSize: 11, fontWeight: '800', marginBottom: 6 }, input: { backgroundColor: '#0B0B0B', borderColor: '#3A3A3A', borderRadius: 6, borderWidth: 1, color: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 11 },
  developmentPanel: { backgroundColor: '#171717', borderColor: Palette.coral, borderRadius: 8, borderWidth: 1, marginTop: 28, padding: 16 }, developmentLabel: { color: Palette.coral, fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginBottom: 8 }, developmentWarning: { color: Palette.coral, fontSize: 11, lineHeight: 16, marginTop: 12 }, developmentActions: { flexDirection: 'row', gap: 8, marginTop: 14 }, developmentButton: { alignItems: 'center', backgroundColor: Palette.coral, borderRadius: 6, marginTop: 14, paddingVertical: 12 }, developmentCancel: { alignItems: 'center', borderColor: Palette.border, borderRadius: 6, borderWidth: 1, flex: 1, justifyContent: 'center', paddingVertical: 12 }, developmentCancelText: { color: Palette.text, fontSize: 10, fontWeight: '900' }, developmentConfirm: { alignItems: 'center', backgroundColor: Palette.coral, borderRadius: 6, flex: 1, justifyContent: 'center', paddingVertical: 12 }, developmentConfirmText: { color: Palette.background, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }, developmentResetError: { color: Palette.coral, fontSize: 11, marginTop: 10 },
});
