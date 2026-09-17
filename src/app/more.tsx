import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type Profile = { name: string; goal: string; level: string; equipment: string };
const profileStorageKey = '@gym/profile';
const defaultProfile: Profile = { name: '', goal: 'Build strength', level: 'Intermediate', equipment: 'Full gym' };

export default function MoreScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { AsyncStorage.getItem(profileStorageKey).then(value => { if (value) setProfile(JSON.parse(value)); }).catch(() => undefined).finally(() => setLoaded(true)); }, []);
  useEffect(() => { if (loaded) AsyncStorage.setItem(profileStorageKey, JSON.stringify(profile)).catch(() => undefined); }, [profile, loaded]);

  return <View style={styles.container}><SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><Text style={styles.eyebrow}>SLATER GYM / MORE</Text><Text style={styles.title}>More.</Text><Text style={styles.subtitle}>Tools and settings for your training setup.</Text><Pressable onPress={() => router.push('/workouts')} style={styles.action}><Text style={styles.actionTitle}>Program builder</Text><Text style={styles.actionText}>Create and edit your saved workout programs.</Text></Pressable><Text style={styles.sectionTitle}>Profile</Text><View style={styles.formCard}><ProfileField label="Name" value={profile.name} placeholder="Your name" onChangeText={value => setProfile(current => ({ ...current, name: value }))} /><ProfileField label="Main goal" value={profile.goal} placeholder="Build strength" onChangeText={value => setProfile(current => ({ ...current, goal: value }))} /><ProfileField label="Experience" value={profile.level} placeholder="Intermediate" onChangeText={value => setProfile(current => ({ ...current, level: value }))} /><ProfileField label="Equipment access" value={profile.equipment} placeholder="Full gym" onChangeText={value => setProfile(current => ({ ...current, equipment: value }))} /></View></ScrollView></SafeAreaView></View>;
}

function ProfileField({ label, value, placeholder, onChangeText }: { label: string; value: string; placeholder: string; onChangeText: (value: string) => void }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#8E8E8E" style={styles.input} /></View>;
}

const styles = StyleSheet.create({ container: { backgroundColor: '#0B0B0B', flex: 1 }, safeArea: { alignSelf: 'center', maxWidth: MaxContentWidth, paddingBottom: BottomTabInset, width: '100%' }, content: { padding: 20, paddingBottom: 100 }, eyebrow: { color: '#D4AF37', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 }, title: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', marginTop: 18 }, subtitle: { color: '#B8B8B8', fontSize: 14, lineHeight: 21, marginTop: 6 }, action: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 12, borderWidth: 1, marginTop: 24, padding: 16 }, actionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' }, actionText: { color: '#B8B8B8', fontSize: 13, marginTop: 5 }, sectionTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '900', marginBottom: 12, marginTop: 28 }, formCard: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 12, borderWidth: 1, padding: 16 }, field: { marginBottom: 13 }, fieldLabel: { color: '#CFCFCF', fontSize: 11, fontWeight: '800', marginBottom: 6 }, input: { backgroundColor: '#0B0B0B', borderColor: '#3A3A3A', borderRadius: 8, borderWidth: 1, color: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 11 } });
