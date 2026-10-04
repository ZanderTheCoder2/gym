import { BottomTabInset, MaxContentWidth, Palette } from '@/constants/theme';
import { getCompletedSetMetrics, getWeeklyTrainingMetrics, normalizeTrainingSessions, trainingSessionsStorageKey, type TrainingSession } from '@/data/training-history';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';

type Profile = { name: string; goal: string; level: string; equipment: string };
const profileStorageKey = '@gym/profile';
const defaultProfile: Profile = { name: '', goal: 'Build strength', level: 'Intermediate', equipment: 'Full gym' };

export default function MoreScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [metric, setMetric] = useState<'volumeLoad' | 'sets' | 'sessions'>('volumeLoad');
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    Promise.all([AsyncStorage.getItem(profileStorageKey), AsyncStorage.getItem(trainingSessionsStorageKey)])
      .then(([profileValue, sessionsValue]) => {
        if (!active) return;
        if (profileValue) setProfile(JSON.parse(profileValue));
        setSessions(normalizeTrainingSessions(sessionsValue ? JSON.parse(sessionsValue) : []));
      })
      .catch(() => undefined)
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []));
  useEffect(() => { if (loaded) AsyncStorage.setItem(profileStorageKey, JSON.stringify(profile)).catch(() => undefined); }, [profile, loaded]);

  const weeks = getWeeklyTrainingMetrics(sessions);
  const thisWeek = weeks[weeks.length - 1];
  const recentSessions = sessions.slice().sort((left, right) => right.dateKey.localeCompare(left.dateKey)).slice(0, 5);

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
    <Pressable accessibilityRole="button" onPress={() => router.push('/workouts')} style={[styles.action, polished.panel]}><Text style={styles.actionTitle}>Program builder</Text><Text style={styles.actionText}>Create or adjust your saved training plan.</Text></Pressable>
    <Text style={styles.sectionTitle}>Profile</Text><View style={[styles.formCard, polished.panel]}><ProfileField label="Name" value={profile.name} placeholder="Your name" onChangeText={value => setProfile(current => ({ ...current, name: value }))} /><ProfileField label="Main goal" value={profile.goal} placeholder="Build strength" onChangeText={value => setProfile(current => ({ ...current, goal: value }))} /><ProfileField label="Experience" value={profile.level} placeholder="Intermediate" onChangeText={value => setProfile(current => ({ ...current, level: value }))} /><ProfileField label="Equipment access" value={profile.equipment} placeholder="Full gym" onChangeText={value => setProfile(current => ({ ...current, equipment: value }))} /></View>
  </ScrollView></SafeAreaView></View>;
}

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
  eyebrow: { color: '#D4AF37', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 }, title: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', marginTop: 18 }, subtitle: { color: '#B8B8B8', fontSize: 14, lineHeight: 21, marginTop: 6 },
  weekSummary: { backgroundColor: '#D4AF37', borderRadius: 10, marginTop: 24, padding: 18 }, summaryLabel: { color: '#211B08', fontSize: 10, fontWeight: '900', letterSpacing: 1 }, summaryValue: { color: '#0B0B0B', fontSize: 32, fontWeight: '900', marginTop: 10 }, summaryUnit: { fontSize: 15 }, summaryCaption: { color: '#342A0D', fontSize: 12, marginTop: 2 }, summaryRule: { backgroundColor: '#9D8024', height: 1, marginVertical: 16 }, summaryStats: { flexDirection: 'row', justifyContent: 'space-between' }, summaryStat: { flex: 1 }, summaryStatValue: { color: '#0B0B0B', fontSize: 20, fontWeight: '900' }, summaryStatLabel: { color: '#342A0D', fontSize: 9, fontWeight: '900', marginTop: 3 },
  sectionHeading: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between', marginTop: 26 }, sectionTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '900' }, sectionHint: { color: '#B8B8B8', fontSize: 11 }, chartPanel: { backgroundColor: '#171717', borderColor: '#343434', borderRadius: 8, borderWidth: 1, marginTop: 12, padding: 14 },
  metricTabs: { backgroundColor: '#0B0B0B', borderRadius: 6, flexDirection: 'row', padding: 3 }, metricTab: { alignItems: 'center', borderRadius: 4, flex: 1, paddingVertical: 8 }, metricTabActive: { backgroundColor: '#D4AF37' }, metricTabText: { color: '#B8B8B8', fontSize: 10, fontWeight: '800' }, metricTabTextActive: { color: '#0B0B0B' }, chartNote: { color: '#AFAFAF', fontSize: 10, lineHeight: 15, marginTop: 4 },
  listPanel: { backgroundColor: '#171717', borderColor: '#343434', borderRadius: 8, borderWidth: 1, marginTop: 12, paddingHorizontal: 14 }, sessionRow: { alignItems: 'center', flexDirection: 'row', minHeight: 68 }, sessionRowBorder: { borderBottomColor: '#343434', borderBottomWidth: 1 }, sessionDate: { alignItems: 'center', backgroundColor: '#242424', borderRadius: 5, justifyContent: 'center', height: 42, width: 42 }, sessionDay: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' }, sessionMonth: { color: '#D4AF37', fontSize: 8, fontWeight: '900' }, sessionInfo: { flex: 1, marginLeft: 12 }, sessionTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' }, sessionDetails: { color: '#B8B8B8', fontSize: 10, marginTop: 4 }, sessionLoad: { color: '#D4AF37', fontSize: 11, fontWeight: '900', marginLeft: 8 },
  emptyPanel: { backgroundColor: '#171717', borderColor: '#343434', borderRadius: 8, borderWidth: 1, marginTop: 12, padding: 16 }, emptyTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' }, emptyCopy: { color: '#B8B8B8', fontSize: 12, lineHeight: 18, marginTop: 6 }, startButton: { alignSelf: 'flex-start', backgroundColor: '#D4AF37', borderRadius: 6, marginTop: 14, paddingHorizontal: 13, paddingVertical: 10 }, startButtonText: { color: '#0B0B0B', fontSize: 10, fontWeight: '900' },
  action: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 8, borderWidth: 1, marginTop: 24, padding: 16 }, actionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' }, actionText: { color: '#B8B8B8', fontSize: 13, marginTop: 5 }, formCard: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 8, borderWidth: 1, padding: 16 }, field: { marginBottom: 13 }, fieldLabel: { color: '#CFCFCF', fontSize: 11, fontWeight: '800', marginBottom: 6 }, input: { backgroundColor: '#0B0B0B', borderColor: '#3A3A3A', borderRadius: 6, borderWidth: 1, color: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 11 },
});
