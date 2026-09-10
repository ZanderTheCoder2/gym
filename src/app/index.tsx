import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset, MaxContentWidth } from '@/constants/theme';

const goals = ['Build muscle', 'Lose fat', 'Get stronger', 'Stay active'];
const activityLevels = ['Beginner', 'Intermediate', 'Advanced'];

export default function ProfileScreen() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState(goals[0]);
  const [activity, setActivity] = useState(activityLevels[0]);
  const [saved, setSaved] = useState(false);

  function update(setter: (value: string) => void, value: string) {
    setSaved(false);
    setter(value);
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>SLATER GYM</Text>
              <Text style={styles.title}>Your profile</Text>
              <Text style={styles.subtitle}>Set up your details so every workout fits you.</Text>
            </View>
            <View style={styles.avatar}><Text style={styles.avatarText}>{name.trim() ? name.trim()[0].toUpperCase() : 'S'}</Text></View>
          </View>

          <View style={styles.progressRow}>
            <View><Text style={styles.progressLabel}>PROFILE SETUP</Text><Text style={styles.progressTitle}>Make your training personal</Text></View>
            <Text style={styles.progressValue}>{[name, age, height, weight].filter(Boolean).length}/4</Text>
          </View>

          <Text style={styles.sectionTitle}>Basic details</Text>
          <View style={styles.card}>
            <Field label="Name" value={name} placeholder="What should we call you?" onChangeText={(value) => update(setName, value)} />
            <View style={styles.twoColumns}>
              <Field label="Age" value={age} placeholder="Years" keyboardType="number-pad" onChangeText={(value) => update(setAge, value)} />
              <Field label="Height" value={height} placeholder="cm" keyboardType="decimal-pad" onChangeText={(value) => update(setHeight, value)} />
            </View>
            <Field label="Weight" value={weight} placeholder="kg" keyboardType="decimal-pad" onChangeText={(value) => update(setWeight, value)} />
          </View>

          <Text style={styles.sectionTitle}>Your goal</Text>
          <View style={styles.optionsGrid}>
            {goals.map((option) => <Option key={option} label={option} selected={goal === option} onPress={() => { setGoal(option); setSaved(false); }} />)}
          </View>

          <Text style={styles.sectionTitle}>Experience level</Text>
          <View style={styles.segmented}>{activityLevels.map((option) => <Pressable key={option} onPress={() => { setActivity(option); setSaved(false); }} style={[styles.segment, activity === option && styles.segmentSelected]}><Text style={[styles.segmentText, activity === option && styles.segmentTextSelected]}>{option}</Text></Pressable>)}</View>

          <Pressable onPress={() => setSaved(true)} style={styles.saveButton}><Text style={styles.saveText}>{saved ? 'PROFILE SAVED' : 'SAVE PROFILE'}</Text></Pressable>
          <Text style={styles.summary}>{saved ? `${activity} plan focused on ${goal.toLowerCase()}.` : 'Your profile stays on this device for now.'}</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Field({ label, value, placeholder, keyboardType, onChangeText }: { label: string; value: string; placeholder: string; keyboardType?: 'number-pad' | 'decimal-pad'; onChangeText: (value: string) => void }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput keyboardType={keyboardType} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#9A948B" style={styles.input} value={value} /></View>;
}

function Option({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.option, selected && styles.optionSelected]}>
      <View style={[styles.radio, selected && styles.radioSelected]} />
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F3EC' },
  safeArea: { flex: 1, maxWidth: MaxContentWidth, width: '100%', alignSelf: 'center', paddingBottom: BottomTabInset },
  content: { padding: 20, paddingBottom: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  eyebrow: { color: '#71826F', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 },
  title: { color: '#1C2A22', fontSize: 32, fontWeight: '900' },
  subtitle: { color: '#847D72', fontSize: 14, marginTop: 6, maxWidth: 270 },
  avatar: { alignItems: 'center', backgroundColor: '#1D2D24', borderRadius: 30, height: 58, justifyContent: 'center', width: 58 },
  avatarText: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  progressRow: { alignItems: 'center', backgroundColor: '#1D2D24', borderRadius: 14, flexDirection: 'row', justifyContent: 'space-between', padding: 18, marginBottom: 28 },
  progressLabel: { color: '#AFC2AE', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  progressTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginTop: 5 },
  progressValue: { color: '#E5A15C', fontSize: 25, fontWeight: '900' },
  sectionTitle: { color: '#1C2A22', fontSize: 19, fontWeight: '900', marginBottom: 11, marginTop: 4 },
  card: { backgroundColor: '#FFFDFA', borderColor: '#E2DBD0', borderRadius: 12, borderWidth: 1, padding: 15, marginBottom: 22 },
  field: { marginBottom: 14 },
  twoColumns: { flexDirection: 'row', gap: 10 },
  twoColumnsField: { flex: 1 },
  fieldLabel: { color: '#716C63', fontSize: 11, fontWeight: '900', marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: '#F1EDE5', borderColor: '#E1D9CD', borderRadius: 7, borderWidth: 1, color: '#1C2A22', fontSize: 15, height: 44, paddingHorizontal: 12 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 22 },
  option: { alignItems: 'center', backgroundColor: '#FFFDFA', borderColor: '#E2DBD0', borderRadius: 8, borderWidth: 1, flexDirection: 'row', minWidth: '47%', padding: 13 },
  optionSelected: { backgroundColor: '#E4EDE2', borderColor: '#719174' },
  radio: { borderColor: '#B4B0A8', borderRadius: 8, borderWidth: 1, height: 15, marginRight: 8, width: 15 },
  radioSelected: { backgroundColor: '#58755C', borderColor: '#58755C' },
  optionText: { color: '#716C63', fontSize: 13, fontWeight: '700' },
  optionTextSelected: { color: '#1C2A22' },
  segmented: { backgroundColor: '#EDE8DE', borderRadius: 9, flexDirection: 'row', marginBottom: 28, padding: 4 },
  segment: { alignItems: 'center', borderRadius: 6, flex: 1, paddingVertical: 11 },
  segmentSelected: { backgroundColor: '#FFFFFF' },
  segmentText: { color: '#847D72', fontSize: 12, fontWeight: '800' },
  segmentTextSelected: { color: '#1C2A22' },
  saveButton: { alignItems: 'center', backgroundColor: '#D88945', borderRadius: 8, paddingVertical: 15 },
  saveText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', letterSpacing: 0.8 },
  summary: { color: '#847D72', fontSize: 12, marginTop: 14, textAlign: 'center' },
});
