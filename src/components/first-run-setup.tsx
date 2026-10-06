import { BottomTabInset, MaxContentWidth, Palette } from '@/constants/theme';
import { emptyMeasurements, localMeasurementDateKey, measurementFields, measurementsStorageKey, normalizeMeasurementEntries, type MeasurementEntry, type MeasurementValues } from '@/data/measurements';
import { defaultProfile, normalizeProfile, profileStorageKey, setupCompleteStorageKey, type Profile } from '@/data/profile';
import { cancelDailyWorkoutReminders, workoutReminderStorageKey } from '@/data/workout-reminders';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const dayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const goalOptions = ['Build strength', 'Build muscle', 'Improve fitness', 'Lose fat', 'General health'];
const equipmentOptions = ['Full gym', 'Dumbbells', 'Barbell', 'Bodyweight', 'Resistance bands', 'Kettlebell'];
const ageOptions = ['Under 18', '18–64', '65+', 'Prefer not to say'];
const developmentStorageKeys = [
  profileStorageKey,
  setupCompleteStorageKey,
  measurementsStorageKey,
  '@gym/programs',
  '@gym/training-sessions',
  '@gym/training-history',
  '@gym/workout-history',
  workoutReminderStorageKey,
];
const DevelopmentResetContext = createContext<(() => Promise<void>) | null>(null);

export function useDevelopmentReset() {
  return useContext(DevelopmentResetContext);
}

export function AppBootstrap({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'setup' | 'ready' | 'error'>('loading');
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [error, setError] = useState('');

  const resetDevelopmentData = useCallback(async () => {
    await cancelDailyWorkoutReminders();
    await AsyncStorage.multiRemove(developmentStorageKeys);
    setProfile(defaultProfile);
    setError('');
    setStatus('setup');
  }, []);

  const load = useCallback(() => {
    Promise.all([AsyncStorage.getItem(profileStorageKey), AsyncStorage.getItem(setupCompleteStorageKey)])
      .then(([profileValue, setupComplete]) => {
        if (profileValue) {
          const savedProfile: unknown = JSON.parse(profileValue);
          setProfile(normalizeProfile(savedProfile));
        }
        setStatus(setupComplete === 'true' ? 'ready' : 'setup');
        setError('');
      })
      .catch(() => {
        setError('We could not load your setup. Check available storage and try again.');
        setStatus('error');
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const completeSetup = async (nextProfile: Profile, measurements: MeasurementValues) => {
    setError('');
    try {
      await AsyncStorage.setItem(profileStorageKey, JSON.stringify(nextProfile));
      if (measurementFields.some(([key]) => measurements[key].trim() !== '')) {
        const storedValue = await AsyncStorage.getItem(measurementsStorageKey);
        const previousEntries = normalizeMeasurementEntries(storedValue ? JSON.parse(storedValue) : []);
        const entry: MeasurementEntry = {
          id: `measurement-${Date.now()}`,
          dateKey: localMeasurementDateKey(new Date()),
          values: measurements,
        };
        await AsyncStorage.setItem(measurementsStorageKey, JSON.stringify([entry, ...previousEntries]));
      }
      await AsyncStorage.setItem(setupCompleteStorageKey, 'true');
      setProfile(nextProfile);
      setStatus('ready');
    } catch {
      setError('We could not save your setup. Please try again.');
    }
  };

  if (status === 'ready') return <DevelopmentResetContext.Provider value={resetDevelopmentData}>{children}</DevelopmentResetContext.Provider>;
  if (status === 'loading') return <View style={styles.loading}><ActivityIndicator color={Palette.accent} /><Text style={styles.copy}>Preparing your training space…</Text></View>;
  if (status === 'error') return <View style={styles.loading}><Text style={styles.error}>{error}</Text><Pressable onPress={() => { setStatus('loading'); load(); }} style={styles.primaryButton}><Text style={styles.primaryButtonText}>TRY AGAIN</Text></Pressable></View>;
  return <FirstRunSetup initialProfile={profile} error={error} onComplete={completeSetup} />;
}

function FirstRunSetup({ initialProfile, error, onComplete }: { initialProfile: Profile; error: string; onComplete: (profile: Profile, measurements: MeasurementValues) => Promise<void> }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState(initialProfile);
  const [measurements, setMeasurements] = useState<MeasurementValues>(emptyMeasurements);
  const [measurementError, setMeasurementError] = useState('');
  const [saving, setSaving] = useState(false);
  const steps = [
    { title: 'Let’s set up your training', description: 'A few quick choices help us shape programs around your goals, schedule, and equipment.' },
    { title: 'A little about you', description: 'Your name and age range are optional. An age range helps keep recommendations appropriately framed.' },
    { title: 'What is your main goal?', description: 'Choose the outcome you want your training to focus on.' },
    { title: 'How experienced are you?', description: 'This helps choose a comfortable starting level and progression.' },
    { title: 'What fits your week?', description: 'Choose a realistic number of training days, then pick the days that usually work.' },
    { title: 'What equipment can you use?', description: 'Select all that are available. Choose Full gym for broad machine and free-weight access.' },
    { title: 'Anything to work around?', description: 'Optionally note movements or areas you want to avoid. This stays on this device; it is not medical screening.' },
    { title: 'Record a starting point (optional)', description: 'Add any measurements you would like to track. You can skip this and log them later in More → Measurements.' },
  ];
  const current = steps[step];
  const selectedDays = profile.availableDays;
  const canContinue = step !== 4 || selectedDays.length >= profile.trainingDays;

  const toggleEquipment = (option: string) => setProfile(currentProfile => {
    if (option === 'Full gym') return { ...currentProfile, equipment: ['Full gym'] };
    const equipment = currentProfile.equipment.filter(item => item !== 'Full gym');
    return {
      ...currentProfile,
      equipment: equipment.includes(option) ? equipment.filter(item => item !== option) : [...equipment, option],
    };
  });

  const toggleDay = (day: number) => setProfile(currentProfile => {
    const availableDays = currentProfile.availableDays.includes(day)
      ? currentProfile.availableDays.filter(item => item !== day)
      : [...currentProfile.availableDays, day].sort((left, right) => left - right);
    return { ...currentProfile, availableDays };
  });

  const finish = async (includeMeasurements: boolean) => {
    if (includeMeasurements) {
      const invalidField = measurementFields.find(([key]) => {
        const value = measurements[key].trim();
        return value !== '' && (!Number.isFinite(Number(value.replace(',', '.'))) || Number(value.replace(',', '.')) < 0);
      });
      if (invalidField) {
        setMeasurementError(`${invalidField[1]} must be a valid positive number.`);
        return;
      }
    }
    setSaving(true);
    await onComplete(profile, includeMeasurements ? measurements : emptyMeasurements());
    setSaving(false);
  };

  return <View style={styles.root}><SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.topline}><Text style={styles.eyebrow}>FORGED / PERSONAL SETUP</Text><Text style={styles.stepCount}>{step === 0 ? 'WELCOME' : `${step} OF ${steps.length - 1}`}</Text></View>
    <View style={styles.progressTrack}><View style={[styles.progressValue, { width: `${step === 0 ? 8 : (step / (steps.length - 1)) * 100}%` }]} /></View>
    <Text style={styles.title}>{current.title}</Text><Text style={styles.copy}>{current.description}</Text>

    {step === 0 && <View style={styles.noteCard}><Text style={styles.noteTitle}>Built around what works for you</Text><Text style={styles.noteCopy}>You can update these answers any time in More → Profile. We save them on this device so the program builder can use your preferences.</Text></View>}

    {step === 1 && <View style={styles.fieldGroup}><Text style={styles.label}>Name (optional)</Text><TextInput accessibilityLabel="Your name" value={profile.name} onChangeText={name => setProfile(currentProfile => ({ ...currentProfile, name }))} placeholder="What should we call you?" placeholderTextColor={Palette.textSecondary} style={styles.input} /><Text style={[styles.label, { marginTop: 18 }]}>Age range (optional)</Text><View style={styles.options}>{ageOptions.map(option => <Choice key={option} label={option} selected={profile.ageRange === option} onPress={() => setProfile(currentProfile => ({ ...currentProfile, ageRange: option }))} />)}</View>{profile.ageRange === 'Under 18' && <Text style={styles.noteCopy}>These workouts are general fitness suggestions. Get support from a parent/guardian and a qualified professional when appropriate.</Text>}</View>}

    {step === 2 && <View style={styles.options}>{goalOptions.map(option => <Choice key={option} label={option} selected={profile.goal === option} onPress={() => setProfile(currentProfile => ({ ...currentProfile, goal: option }))} />)}</View>}

    {step === 3 && <View style={styles.options}>{['Beginner', 'Intermediate', 'Advanced'].map(option => <Choice key={option} label={option} selected={profile.level === option} onPress={() => setProfile(currentProfile => ({ ...currentProfile, level: option }))} />)}</View>}

    {step === 4 && <View style={styles.fieldGroup}><Text style={styles.label}>Training days per week</Text><View style={styles.options}>{[1, 2, 3, 4, 5, 6].map(days => <Choice key={days} label={`${days} ${days === 1 ? 'day' : 'days'}`} selected={profile.trainingDays === days} onPress={() => setProfile(currentProfile => ({ ...currentProfile, trainingDays: days }))} compact />)}</View><Text style={[styles.label, { marginTop: 20 }]}>Days that usually work</Text><View style={styles.options}>{dayOptions.map((label, index) => <Choice key={label} label={label} selected={selectedDays.includes(index)} onPress={() => toggleDay(index)} compact />)}</View><Text style={styles.hint}>Select at least {profile.trainingDays} day{profile.trainingDays === 1 ? '' : 's'} so the plan can fit your week.</Text><Text style={[styles.label, { marginTop: 18 }]}>Time per session</Text><View style={styles.options}>{['30 minutes', '45 minutes', '60 minutes', '75 minutes'].map(option => <Choice key={option} label={option} selected={profile.sessionLength === option} onPress={() => setProfile(currentProfile => ({ ...currentProfile, sessionLength: option }))} compact />)}</View>{!canContinue && <Text style={styles.error}>Choose at least {profile.trainingDays} available training day{profile.trainingDays === 1 ? '' : 's'}.</Text>}</View>}

    {step === 5 && <View style={styles.options}>{equipmentOptions.map(option => <Choice key={option} label={option} selected={profile.equipment.includes(option)} onPress={() => toggleEquipment(option)} multi />)}</View>}

    {step === 6 && <View style={styles.fieldGroup}><Text style={styles.noteCopy}>If you have an injury, health condition, pain, or other concern that could affect exercise, consider checking with a qualified health professional before starting. You can leave this blank.</Text><Text style={[styles.label, { marginTop: 16 }]}>Movements or areas to avoid (optional)</Text><TextInput accessibilityLabel="Training limitations" value={profile.limitations} onChangeText={limitations => setProfile(currentProfile => ({ ...currentProfile, limitations }))} placeholder="For example: avoid overhead pressing" placeholderTextColor={Palette.textSecondary} multiline style={[styles.input, styles.multiline]} /></View>}

    {step === 7 && <View style={styles.fieldGroup}><Text style={styles.noteCopy}>Weight in kg · body measurements in cm · body fat in %. Every field is optional and saved only on this device.</Text><View style={styles.measurementGrid}>{measurementFields.map(([key, label, unit]) => <View key={key} style={styles.measurementField}><Text style={styles.label}>{label}</Text><View style={styles.measurementInputWrap}><TextInput accessibilityLabel={label} value={measurements[key]} onChangeText={value => { setMeasurements(current => ({ ...current, [key]: value })); setMeasurementError(''); }} placeholder="—" placeholderTextColor={Palette.textSecondary} keyboardType="decimal-pad" style={styles.measurementInput} /><Text style={styles.measurementUnit}>{unit}</Text></View></View>)}</View>{measurementError ? <Text accessibilityRole="alert" style={styles.error}>{measurementError}</Text> : null}</View>}

    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <View style={styles.actions}>{step > 0 && <Pressable accessibilityRole="button" disabled={saving} onPress={() => setStep(current => current - 1)} style={styles.backButton}><Text style={styles.backText}>BACK</Text></Pressable>}<Pressable accessibilityRole="button" disabled={!canContinue || saving || (step === 5 && profile.equipment.length === 0)} onPress={() => step === steps.length - 1 ? void finish(true) : setStep(current => current + 1)} style={[styles.primaryButton, (!canContinue || saving || (step === 5 && profile.equipment.length === 0)) && styles.buttonDisabled]}><Text style={styles.primaryButtonText}>{saving ? 'SAVING…' : step === steps.length - 1 ? 'SAVE & FINISH' : 'CONTINUE'}</Text><Text style={styles.primaryButtonText}>→</Text></Pressable></View>
    {step === steps.length - 1 && <Pressable accessibilityRole="button" disabled={saving} onPress={() => void finish(false)} style={styles.skipButton}><Text style={styles.skipButtonText}>{saving ? 'SAVING…' : 'SKIP MEASUREMENTS & FINISH SETUP'}</Text></Pressable>}
    <Text style={styles.privacyNote}>Your setup is stored locally on this device. It is for general fitness planning, not medical advice.</Text>
  </ScrollView></SafeAreaView></View>;
}

function Choice({ label, selected, onPress, compact = false, multi = false }: { label: string; selected: boolean; onPress: () => void; compact?: boolean; multi?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.choice, compact && styles.choiceCompact, selected && styles.choiceSelected]}>
    <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    {selected && <Text style={styles.check}>{multi ? '✓' : 'SELECTED'}</Text>}
  </Pressable>;
}

const styles = StyleSheet.create({
  root: { backgroundColor: Palette.background, flex: 1 },
  safeArea: { alignSelf: 'center', flex: 1, maxWidth: MaxContentWidth, width: '100%' },
  content: { padding: 22, paddingBottom: BottomTabInset + 28 },
  loading: { alignItems: 'center', backgroundColor: Palette.background, flex: 1, justifyContent: 'center', padding: 24 },
  topline: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  eyebrow: { color: Palette.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  stepCount: { color: Palette.textSecondary, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  progressTrack: { backgroundColor: Palette.border, borderRadius: 4, height: 5, marginTop: 18, overflow: 'hidden' },
  progressValue: { backgroundColor: Palette.accent, height: 5 },
  title: { color: Palette.text, fontSize: 29, fontWeight: '900', lineHeight: 35, marginTop: 28 },
  copy: { color: Palette.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 8 },
  noteCard: { backgroundColor: Palette.surface, borderColor: Palette.border, borderRadius: 12, borderWidth: 1, marginTop: 24, padding: 16 },
  noteTitle: { color: Palette.text, fontSize: 15, fontWeight: '900' },
  noteCopy: { color: Palette.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 7 },
  fieldGroup: { marginTop: 22 },
  label: { color: Palette.text, fontSize: 12, fontWeight: '800', marginBottom: 9 },
  input: { backgroundColor: Palette.surface, borderColor: Palette.border, borderRadius: 9, borderWidth: 1, color: Palette.text, paddingHorizontal: 13, paddingVertical: 12 },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 18 },
  measurementGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  measurementField: { width: '47%' },
  measurementInputWrap: { alignItems: 'center', backgroundColor: Palette.surface, borderColor: Palette.border, borderRadius: 9, borderWidth: 1, flexDirection: 'row', paddingHorizontal: 10 },
  measurementInput: { color: Palette.text, flex: 1, paddingVertical: 12 },
  measurementUnit: { color: Palette.textSecondary, fontSize: 10 },
  choice: { alignItems: 'center', backgroundColor: Palette.surface, borderColor: Palette.border, borderRadius: 11, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 54, paddingHorizontal: 14, width: '100%' },
  choiceCompact: { justifyContent: 'center', minHeight: 42, paddingHorizontal: 12, width: 'auto' },
  choiceSelected: { backgroundColor: Palette.accentSoft, borderColor: Palette.accent },
  choiceText: { color: Palette.text, fontSize: 13, fontWeight: '700' },
  choiceTextSelected: { color: Palette.accent },
  check: { color: Palette.accent, fontSize: 9, fontWeight: '900', marginLeft: 12 },
  hint: { color: Palette.textSecondary, fontSize: 10, marginTop: 8 },
  error: { color: Palette.coral, fontSize: 12, lineHeight: 18, marginTop: 14 },
  actions: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 28 },
  backButton: { borderColor: Palette.border, borderRadius: 9, borderWidth: 1, paddingHorizontal: 15, paddingVertical: 14 },
  backText: { color: Palette.textSecondary, fontSize: 10, fontWeight: '900' },
  primaryButton: { alignItems: 'center', backgroundColor: Palette.accent, borderRadius: 9, flex: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  buttonDisabled: { opacity: 0.45 },
  primaryButtonText: { color: Palette.background, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  skipButton: { alignSelf: 'center', marginTop: 16, padding: 10 },
  skipButtonText: { color: Palette.textSecondary, fontSize: 10, fontWeight: '900', letterSpacing: 0.4, textAlign: 'center' },
  privacyNote: { color: Palette.textSecondary, fontSize: 9, lineHeight: 14, marginTop: 20, textAlign: 'center' },
});
