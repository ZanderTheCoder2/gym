import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset, MaxContentWidth } from '@/constants/theme';

type Exercise = { name: string; target?: string };
type MuscleGroup = { name: string; exercises: Exercise[] };
type WorkoutDay = { id: number; title: string; groups: MuscleGroup[] };

const standardTarget = '20 - 15 - 12 reps';
const makeExercises = (names: string[]) => names.map((name) => ({ name }));
const makeAbExercises = (names: string[]) => names.map((name) => ({ name, target: name === 'Plank 2 min' ? '2 minutes' : standardTarget }));

const workoutDays: WorkoutDay[] = [
  { id: 1, title: 'Shoulder / Tricep / Chest', groups: [
    { name: 'Shoulders', exercises: makeExercises(['Front Raises', 'Face Pulls', 'Shoulder Press', 'Side Raises']) },
    { name: 'Triceps', exercises: makeExercises(['Tricep Push Down', 'Rope Pushdown']) },
    { name: 'Chest', exercises: makeExercises(['Chest Press', 'Chest Fly', 'Push Ups', 'Incl D/B Press']) },
  ] },
  { id: 2, title: 'Back + Biceps', groups: [
    { name: 'Back', exercises: makeExercises(['Lat Pulldown', 'Iso Lateral Low Row', 'Iso Lateral High Row', 'Rear Delt Fly', 'Straight Arm Push', 'Back Extension']) },
    { name: 'Biceps', exercises: makeExercises(['Bicep Curl M.C', 'Hammer Curls', 'Cable Curls', 'Concentration Curls']) },
  ] },
  { id: 3, title: 'Legs / ABS', groups: [
    { name: 'Legs', exercises: makeExercises(['Leg Extension', 'Hamstring Curl', 'Sissy Squat', 'Step Downs', 'Squats', 'Leg Press', 'Calf Raises', 'Lunges', 'Exercise']) },
    { name: 'ABS', exercises: makeAbExercises(['Sit Ups', 'Crunches', 'Leg Raises', 'Crunch M.C', 'Side Raise', 'Plank 2 min']) },
  ] },
  { id: 4, title: 'Shoulder / Tricep / Chest', groups: [
    { name: 'Shoulders', exercises: makeExercises(['Front Raises', 'Face Pulls', 'Shoulder Press', 'Side Raises']) },
    { name: 'Triceps', exercises: makeExercises(['Tricep Push Down', 'Rope Pushdown']) },
    { name: 'Chest', exercises: makeExercises(['Chest Press', 'Chest Fly', 'Push Ups', 'Incl D/B Press']) },
  ] },
  { id: 5, title: 'Back + Biceps', groups: [
    { name: 'Back', exercises: makeExercises(['Lat Pulldown', 'Iso Lateral Low Row', 'Iso Lateral High Row', 'Rear Delt Fly', 'Straight Arm Push', 'Back Extension']) },
    { name: 'Biceps', exercises: makeExercises(['Bicep Curl M.C', 'Hammer Curls', 'Cable Curls', 'Concentration Curls']) },
  ] },
  { id: 6, title: 'Legs / ABS', groups: [
    { name: 'Legs', exercises: makeExercises(['Step Downs', 'Squats', 'Leg Press', 'Leg Extension', 'Hamstring Curl', 'Sissy Squat', 'Calf Raises', 'Lunges']) },
    { name: 'ABS', exercises: makeAbExercises(['Crunch M.C', 'Side Raise', 'Plank 2 min', 'Sit Ups', 'Crunches', 'Leg Raises']) },
  ] },
];

const setNumbers = [1, 2, 3, 4, 5];

export default function TrainingScreen() {
  const [selectedDay, setSelectedDay] = useState(1);
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const day = workoutDays[selectedDay - 1];

  function updateWeight(key: string, value: string) {
    setSaved(false);
    setWeights((current) => ({ ...current, [key]: value }));
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.brandRow}><View><Text style={styles.eyebrow}>SLATER GYM</Text><Text style={styles.title}>Training</Text></View><Text style={styles.pin}>PIN: 0000</Text></View>
          <Text style={styles.subtitle}>Complete your sets and save your progress.</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayTabs}>
            {workoutDays.map((workoutDay) => <Pressable key={workoutDay.id} accessibilityRole="tab" accessibilityState={{ selected: selectedDay === workoutDay.id }} onPress={() => { setSelectedDay(workoutDay.id); setSaved(false); }} style={[styles.dayTab, selectedDay === workoutDay.id && styles.dayTabActive]}><Text style={[styles.dayTabText, selectedDay === workoutDay.id && styles.dayTabTextActive]}>Day {workoutDay.id}</Text></Pressable>)}
          </ScrollView>
          <View style={styles.dayHeading}><Text style={styles.dayTitle}>Day {day.id} - {day.title}</Text><Text style={styles.target}>Target: {standardTarget}</Text></View>
          {day.groups.map((group) => <View key={group.name} style={styles.group}><Text style={styles.groupTitle}>{group.name}</Text>{group.exercises.map((exercise) => <View key={exercise.name} style={styles.exercise}><View style={styles.exerciseHeader}><Text style={styles.exerciseName}>{exercise.name}</Text><Text style={styles.exerciseTarget}>{exercise.target ?? standardTarget}</Text></View><View style={styles.sets}>{setNumbers.map((setNumber) => { const key = `${day.id}-${group.name}-${exercise.name}-${setNumber}`; return <View key={key} style={styles.set}><Text style={styles.setLabel}>Set {setNumber}</Text><TextInput accessibilityLabel={`${exercise.name}, set ${setNumber}, kilograms`} keyboardType="decimal-pad" onChangeText={(value) => updateWeight(key, value)} placeholder="kg" placeholderTextColor="#9A948B" style={styles.input} value={weights[key] ?? ''} /></View>; })}</View></View>)}</View>)}
          <Pressable onPress={() => setSaved(true)} style={styles.saveButton}><Text style={styles.saveText}>{saved ? 'PROGRESS SAVED' : 'SAVE MY PROGRESS'}</Text></Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F3EC' },
  safeArea: { flex: 1, paddingBottom: BottomTabInset, maxWidth: MaxContentWidth, width: '100%', alignSelf: 'center' },
  content: { padding: 20, paddingBottom: 48 },
  brandRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  eyebrow: { color: '#71826F', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 6 },
  title: { color: '#1C2A22', fontSize: 32, fontWeight: '900' },
  pin: { color: '#847D72', fontSize: 12, fontWeight: '700' },
  subtitle: { color: '#847D72', fontSize: 14, marginBottom: 24 },
  dayTabs: { gap: 8, paddingBottom: 20 },
  dayTab: { alignItems: 'center', borderColor: '#D6D0C5', borderRadius: 8, borderWidth: 1, minWidth: 68, paddingHorizontal: 14, paddingVertical: 11 },
  dayTabActive: { backgroundColor: '#1D2D24', borderColor: '#1D2D24' },
  dayTabText: { color: '#716C63', fontSize: 13, fontWeight: '800' },
  dayTabTextActive: { color: '#FFFFFF' },
  dayHeading: { borderBottomColor: '#DDD6CA', borderBottomWidth: 1, marginBottom: 24, paddingBottom: 18 },
  dayTitle: { color: '#1C2A22', fontSize: 22, fontWeight: '900', marginBottom: 7 },
  target: { color: '#71826F', fontSize: 13, fontWeight: '700' },
  group: { marginBottom: 24 },
  groupTitle: { color: '#71826F', fontSize: 13, fontWeight: '900', letterSpacing: 1.1, marginBottom: 9, textTransform: 'uppercase' },
  exercise: { backgroundColor: '#FFFDFA', borderColor: '#E2DBD0', borderRadius: 10, borderWidth: 1, marginBottom: 10, padding: 14 },
  exerciseHeader: { marginBottom: 13 },
  exerciseName: { color: '#27352C', fontSize: 16, fontWeight: '900', marginBottom: 4 },
  exerciseTarget: { color: '#948C80', fontSize: 12, fontWeight: '600' },
  sets: { flexDirection: 'row', gap: 7 },
  set: { flex: 1, minWidth: 0 },
  setLabel: { color: '#8A847A', fontSize: 10, fontWeight: '800', marginBottom: 5, textAlign: 'center' },
  input: { backgroundColor: '#F1EDE5', borderColor: '#E1D9CD', borderRadius: 6, borderWidth: 1, color: '#1C2A22', fontSize: 14, fontWeight: '800', height: 38, textAlign: 'center', width: '100%' },
  saveButton: { alignItems: 'center', backgroundColor: '#D88945', borderRadius: 8, marginTop: 2, paddingVertical: 15 },
  saveText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', letterSpacing: 0.8 },
});
