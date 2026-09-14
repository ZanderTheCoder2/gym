import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function MoreScreen() {
  const router = useRouter();
  return <View style={styles.container}><SafeAreaView style={styles.safeArea}><Text style={styles.eyebrow}>FORGED FITNESS / MORE</Text><Text style={styles.title}>More.</Text><Text style={styles.subtitle}>Tools and settings for your training setup.</Text><Pressable onPress={() => router.push('/explore')} style={styles.action}><Text style={styles.actionTitle}>Program builder</Text><Text style={styles.actionText}>Create and edit your saved workout programs.</Text></Pressable></SafeAreaView></View>;
}

const styles = StyleSheet.create({ container: { backgroundColor: '#F5F1EA', flex: 1 }, safeArea: { alignSelf: 'center', maxWidth: MaxContentWidth, padding: 20, paddingBottom: BottomTabInset, width: '100%' }, eyebrow: { color: '#71826F', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 }, title: { color: '#1C2A22', fontSize: 30, fontWeight: '900', marginTop: 18 }, subtitle: { color: '#847D72', fontSize: 14, lineHeight: 21, marginTop: 6 }, action: { backgroundColor: '#FFFDFA', borderColor: '#E2DBD0', borderRadius: 12, borderWidth: 1, marginTop: 24, padding: 16 }, actionTitle: { color: '#1C2A22', fontSize: 16, fontWeight: '900' }, actionText: { color: '#847D72', fontSize: 13, marginTop: 5 } });
