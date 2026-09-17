import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { exercises, type Exercise } from '@/data/exercises';
import { createWorkoutExercise, normalizeProgram, programsStorageKey, type Program, type SetEntry, type WorkoutDay, type WorkoutExercise } from '@/data/programs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useFocusEffect } from 'expo-router';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProgramsScreen() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [swapTarget, setSwapTarget] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shareProgramId, setShareProgramId] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const loadPrograms = useCallback(() => {
    AsyncStorage.getItem(programsStorageKey)
      .then(value => {
        const next = value ? JSON.parse(value).flatMap((item: unknown) => { const normalized = normalizeProgram(item); return normalized ? [normalized] : []; }) : [];
        setPrograms(next);
        setSelectedProgramId(current => current && next.some((program: Program) => program.id === current) ? current : next[0]?.id ?? null);
      })
      .catch(() => setPrograms([]))
      .finally(() => setLoaded(true));
  }, []);

  useFocusEffect(useCallback(() => { loadPrograms(); }, [loadPrograms]));
  useEffect(() => { if (loaded) AsyncStorage.setItem(programsStorageKey, JSON.stringify(programs)).catch(() => undefined); }, [programs, loaded]);

  const selectedProgram = programs.find(program => program.id === selectedProgramId);
  const selectedDay = selectedDayIndex === null ? undefined : selectedProgram?.days[selectedDayIndex];
  const filteredExercises = useMemo(() => exercises.filter(exercise => exercise.name.toLowerCase().includes(query.toLowerCase())).slice(0, 12), [query]);

  const updateProgram = (update: (program: Program) => Program) => {
    if (!selectedProgram) return;
    setSaved(false);
    setPrograms(current => current.map(program => program.id === selectedProgram.id ? update(program) : program));
  };
  const updateDay = (update: (day: WorkoutDay) => WorkoutDay) => { if (selectedDayIndex === null) return; updateProgram(program => ({ ...program, days: program.days.map((day, index) => index === selectedDayIndex ? update(day) : day) })); };
  const updateExercise = (exerciseName: string, update: (exercise: WorkoutExercise) => WorkoutExercise) => updateDay(day => ({ ...day, exercises: day.exercises.map(exercise => exercise.name === exerciseName ? update(exercise) : exercise) }));
  const addExercise = (name: string) => updateDay(day => day.exercises.some(exercise => exercise.name === name) ? day : { ...day, exercises: [...day.exercises, createWorkoutExercise(name)] });
  const removeExercise = (exerciseName: string) => updateDay(day => ({ ...day, exercises: day.exercises.filter(exercise => exercise.name !== exerciseName) }));
  const swapExercise = (oldName: string, replacement: Exercise) => { updateDay(day => ({ ...day, exercises: day.exercises.map(exercise => exercise.name === oldName ? { ...createWorkoutExercise(replacement.name), sets: exercise.sets } : exercise) })); setSwapTarget(null); };
  const updateSet = (exerciseName: string, setIndex: number, field: keyof SetEntry, value: string) => updateExercise(exerciseName, exercise => ({ ...exercise, sets: exercise.sets.map((set, index) => index === setIndex ? { ...set, [field]: value } : set) }));
  const addSet = (exerciseName: string) => updateExercise(exerciseName, exercise => ({ ...exercise, sets: [...exercise.sets, { weight: '', reps: '' }] }));
  const removeSet = (exerciseName: string, setIndex: number) => updateExercise(exerciseName, exercise => ({ ...exercise, sets: exercise.sets.filter((_, index) => index !== setIndex) }));
  const deleteProgram = (program: Program) => Alert.alert('Delete this plan?', `Remove ${program.name} from your saved workouts?`, [{ text: 'Keep plan', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => setPrograms(current => current.filter(item => item.id !== program.id)) }]);
  const savePrograms = () => {
    if (!selectedProgram) return;
    const orderedPrograms = [selectedProgram, ...programs.filter(program => program.id !== selectedProgram.id)];
    setPrograms(orderedPrograms);
    AsyncStorage.setItem(programsStorageKey, JSON.stringify(orderedPrograms)).then(() => setSaved(true)).catch(() => setSaved(false));
  };
  const programToShare = programs.find(program => program.id === shareProgramId);
  const shareValue = programToShare ? `FG1:${compressToEncodedURIComponent(JSON.stringify({ type: 'forged-fitness-program', version: 1, program: programToShare }))}` : '';
  const openScanner = async () => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) return;
    }
    setScanMode(true);
  };
  const handleScan = ({ data }: BarcodeScanningResult) => {
    setScanMode(false);
    try {
      const decoded = data.startsWith('FG1:') ? decompressFromEncodedURIComponent(data.slice(4)) : data;
      if (!decoded) throw new Error('Invalid compressed program');
      const payload: unknown = JSON.parse(decoded);
      if (!payload || typeof payload !== 'object' || (payload as { type?: unknown }).type !== 'forged-fitness-program') throw new Error('Invalid program');
      const imported = normalizeProgram((payload as { program?: unknown }).program);
      if (!imported) throw new Error('Invalid program');
      const importedProgram = { ...imported, id: `imported-${Date.now()}` };
      setPrograms(current => [...current, importedProgram]);
      Alert.alert('Program imported', `${importedProgram.name} was added to your programs.`);
    } catch {
      Alert.alert('Invalid QR code', 'That code does not contain a Forged Fitness program.');
    }
  };

  if (scanMode) return <View style={styles.scannerScreen}><CameraView style={styles.camera} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={handleScan} /><View style={styles.scannerOverlay}><Text style={styles.scannerTitle}>Scan a program</Text><Text style={styles.scannerCopy}>Point the camera at a Forged Fitness QR code.</Text><Pressable onPress={() => setScanMode(false)} style={styles.scannerClose}><Text style={styles.scannerCloseText}>CANCEL</Text></Pressable></View></View>;

  return <View style={styles.container}><SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    {!editingProgramId && <><Text style={styles.eyebrow}>SLATER GYM / PROGRAM EDITOR</Text><Text style={styles.title}>Shape your plan.</Text><Text style={styles.subtitle}>Swap movements, tune your sets, and keep every program ready for the next session.</Text>{programs.length > 0 && <Pressable onPress={openScanner} style={styles.scanButton}><Text style={styles.scanButtonText}>SCAN A PROGRAM</Text></Pressable>}</>}
    {!programs.length ? <View style={styles.empty}><Text style={styles.emptyTitle}>No saved programs</Text><Text style={styles.emptyText}>Create a tailored or manual plan in Workouts and edit it here.</Text></View> : !editingProgramId ? <ProgramChooser programs={programs} onSelect={program => { setSelectedProgramId(program.id); setSelectedDayIndex(null); setSwapTarget(null); setEditingProgramId(program.id); }} /> : <>
      <Pressable onPress={() => { if (selectedDayIndex === null) { setEditingProgramId(null); } else { setSelectedDayIndex(null); } setSwapTarget(null); }} style={styles.backButton}><Text style={styles.backText}>{selectedDayIndex === null ? 'BACK TO PROGRAMS' : 'BACK TO DAYS'}</Text></Pressable>
      {selectedProgram && <View style={styles.editorHeader}><TextInput value={selectedProgram.name} onChangeText={name => updateProgram(program => ({ ...program, name }))} style={styles.programNameInput} /><Pressable onPress={() => setShareProgramId(selectedProgram.id)} style={styles.shareButton}><Text style={styles.shareButtonText}>SHARE</Text></Pressable><Pressable onPress={savePrograms} style={styles.saveButton}><Text style={styles.saveText}>{saved ? 'SAVED' : 'SAVE'}</Text></Pressable><Pressable onPress={() => deleteProgram(selectedProgram)} style={styles.deleteSmall}><Text style={styles.deleteSmallText}>DELETE</Text></Pressable></View>}
      {selectedProgram && selectedDayIndex === null && <DayChooser program={selectedProgram} onSelect={index => setSelectedDayIndex(index)} />}
      {selectedProgram && selectedDayIndex !== null && selectedDay && <>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayTabs}>{selectedProgram.days.map((day, index) => <Pressable key={`${day.name}-${index}`} onPress={() => { setSelectedDayIndex(index); setSwapTarget(null); }} style={[styles.dayTab, selectedDayIndex === index && styles.dayTabActive]}><Text style={[styles.dayTabText, selectedDayIndex === index && styles.dayTabTextActive]}>{day.name}</Text></Pressable>)}<Pressable onPress={() => { updateProgram(program => ({ ...program, days: [...program.days, { name: `Day ${program.days.length + 1}`, exercises: [] }] })); setSelectedDayIndex(selectedProgram.days.length); }} style={styles.addDay}><Text style={styles.addDayText}>+ DAY</Text></Pressable></ScrollView>
        <View style={styles.dayEditor}><TextInput value={selectedDay.name} onChangeText={name => updateDay(() => ({ ...selectedDay, name }))} style={styles.dayNameInput} /><Text style={styles.muted}>{selectedDay.exercises.length} exercises</Text></View>
        {selectedDay.exercises.map(exercise => <ExerciseEditor key={exercise.name} exercise={exercise} swapTarget={swapTarget} onSetSwapTarget={setSwapTarget} onRemove={() => removeExercise(exercise.name)} onUpdateSet={updateSet} onAddSet={() => addSet(exercise.name)} onRemoveSet={index => removeSet(exercise.name, index)} />)}
        <Text style={styles.sectionTitle}>Add or swap exercises</Text><TextInput value={query} onChangeText={setQuery} placeholder="Search exercise library" placeholderTextColor="#8E8E8E" style={styles.search} />
        {filteredExercises.map(exercise => <View key={exercise.id} style={styles.libraryRow}><View style={styles.libraryCopy}><Text style={styles.libraryName}>{exercise.name}</Text><Text style={styles.libraryMeta}>{exercise.category} - {exercise.equipment}</Text></View><Pressable onPress={() => swapTarget ? swapExercise(swapTarget, exercise) : addExercise(exercise.name)} style={styles.libraryAction}><Text style={styles.libraryActionText}>{swapTarget ? 'SWAP' : 'ADD'}</Text></Pressable></View>)}
      </>}
    </>}
    {programToShare && <View style={styles.shareCard}><Text style={styles.shareTitle}>Share {programToShare.name}</Text><Text style={styles.shareCopy}>Have someone scan this code from their Forged Fitness app.</Text><View style={styles.qrFrame}><QRCode value={shareValue} size={220} color="#000000" backgroundColor="#FFFFFF" /></View><Pressable onPress={() => setShareProgramId(null)} style={styles.closeShare}><Text style={styles.closeShareText}>CLOSE</Text></Pressable></View>}
  </ScrollView></SafeAreaView></View>;
}

function ProgramChooser({ programs, onSelect }: { programs: Program[]; onSelect: (program: Program) => void }) {
  return <><Text style={styles.sectionTitle}>Choose a program to edit</Text>{programs.map((program, index) => { const exerciseCount = program.days.reduce((count, day) => count + day.exercises.length, 0); return <Pressable key={program.id} onPress={() => onSelect(program)} style={styles.programCard}><View style={styles.programHeader}><View style={styles.programCopy}><Text style={styles.programName}>{program.name}</Text><Text style={styles.programMeta}>{program.days.length} days - {exerciseCount} exercises</Text></View><Text style={styles.programMark}>{index === 0 ? 'ACTIVE' : 'PLAN'}</Text></View><Text style={styles.programPreview}>{program.days.slice(0, 3).map(day => day.name).join(' - ')}</Text><Text style={styles.editPrompt}>TAP TO EDIT</Text></Pressable>; })}</>;
}

function DayChooser({ program, onSelect }: { program: Program; onSelect: (index: number) => void }) {
  return <><Text style={styles.sectionTitle}>Choose a training day</Text>{program.days.map((day, index) => <Pressable key={`${day.name}-${index}`} onPress={() => onSelect(index)} style={styles.dayChoice}><View style={styles.dayChoiceNumber}><Text style={styles.dayChoiceNumberText}>{index + 1}</Text></View><View style={styles.dayChoiceCopy}><Text style={styles.dayChoiceName}>{day.name}</Text><Text style={styles.dayChoiceMeta}>{day.exercises.length} exercises</Text></View><Text style={styles.dayChoiceArrow}>EDIT</Text></Pressable>)}</>;
}

function ExerciseEditor({ exercise, swapTarget, onSetSwapTarget, onRemove, onUpdateSet, onAddSet, onRemoveSet }: { exercise: WorkoutExercise; swapTarget: string | null; onSetSwapTarget: (name: string | null) => void; onRemove: () => void; onUpdateSet: (exerciseName: string, setIndex: number, field: keyof SetEntry, value: string) => void; onAddSet: () => void; onRemoveSet: (index: number) => void }) {
  return <View style={styles.exerciseCard}><View style={styles.exerciseHeader}><TextInput value={exercise.name} style={styles.exerciseNameInput} editable={false} /><Pressable onPress={() => onSetSwapTarget(swapTarget === exercise.name ? null : exercise.name)} style={[styles.swapButton, swapTarget === exercise.name && styles.swapButtonActive]}><Text style={[styles.swapButtonText, swapTarget === exercise.name && styles.swapButtonTextActive]}>{swapTarget === exercise.name ? 'SELECT BELOW' : 'SWAP'}</Text></Pressable><Pressable onPress={onRemove} style={styles.removeButton}><Text style={styles.removeButtonText}>REMOVE</Text></Pressable></View>{exercise.sets.map((set, index) => <View key={`${exercise.name}-${index}`} style={styles.editSetRow}><Text style={styles.editSetNumber}>{index + 1}</Text><TextInput value={set.weight} onChangeText={value => onUpdateSet(exercise.name, index, 'weight', value)} placeholder="kg" placeholderTextColor="#8E8E8E" keyboardType="decimal-pad" style={styles.editInput} /><TextInput value={set.reps} onChangeText={value => onUpdateSet(exercise.name, index, 'reps', value)} placeholder="reps" placeholderTextColor="#8E8E8E" keyboardType="number-pad" style={styles.editInput} /><Pressable onPress={() => onRemoveSet(index)} style={styles.removeSet}><Text style={styles.removeSetText}>X</Text></Pressable></View>)}<Pressable onPress={onAddSet} style={styles.addSet}><Text style={styles.addSetText}>+ ADD SET</Text></Pressable></View>;
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#0B0B0B', flex: 1 }, safeArea: { alignSelf: 'center', maxWidth: MaxContentWidth, paddingBottom: BottomTabInset, width: '100%' }, content: { padding: 20, paddingBottom: 100 },
  eyebrow: { color: '#D4AF37', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 }, title: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', marginTop: 18 }, subtitle: { color: '#B8B8B8', fontSize: 14, lineHeight: 21, marginTop: 6 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 24 }, stat: { backgroundColor: '#2A2412', borderRadius: 10, flex: 1, padding: 13 }, statValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' }, statLabel: { color: '#D4AF37', fontSize: 10, fontWeight: '800', marginTop: 3 },
  sectionTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '900', marginBottom: 12, marginTop: 28 }, programTabs: { gap: 8, paddingBottom: 4 }, programTab: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 8, borderWidth: 1, maxWidth: 220, paddingHorizontal: 14, paddingVertical: 11 }, programTabActive: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' }, programTabText: { color: '#CFCFCF', fontSize: 11, fontWeight: '900' }, programTabTextActive: { color: '#000000' },
  scanButton: { alignItems: 'center', borderColor: '#D4AF37', borderRadius: 8, borderWidth: 1, marginTop: 18, paddingVertical: 12 }, scanButtonText: { color: '#D4AF37', fontSize: 10, fontWeight: '900' },
  backButton: { alignSelf: 'flex-start', marginBottom: 8 }, backText: { color: '#D4AF37', fontSize: 11, fontWeight: '900' }, programCard: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 12, borderWidth: 1, marginBottom: 12, padding: 16 }, programHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' }, programCopy: { flex: 1 }, programName: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' }, programMeta: { color: '#B8B8B8', fontSize: 11, marginTop: 5 }, programMark: { color: '#D4AF37', fontSize: 10, fontWeight: '900', letterSpacing: 1 }, programPreview: { borderTopColor: '#3A3A3A', borderTopWidth: 1, color: '#CFCFCF', fontSize: 12, marginTop: 13, paddingTop: 11 }, editPrompt: { color: '#D4AF37', fontSize: 10, fontWeight: '900', marginTop: 15 },
  dayChoice: { alignItems: 'center', backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 10, borderWidth: 1, flexDirection: 'row', marginBottom: 10, padding: 14 }, dayChoiceNumber: { alignItems: 'center', backgroundColor: '#2A2412', borderRadius: 16, height: 32, justifyContent: 'center', width: 32 }, dayChoiceNumberText: { color: '#D4AF37', fontSize: 12, fontWeight: '900' }, dayChoiceCopy: { flex: 1, marginLeft: 12 }, dayChoiceName: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' }, dayChoiceMeta: { color: '#B8B8B8', fontSize: 11, marginTop: 4 }, dayChoiceArrow: { color: '#D4AF37', fontSize: 10, fontWeight: '900' },
  editorHeader: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 12 }, programNameInput: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 8, borderWidth: 1, color: '#FFFFFF', flex: 1, fontSize: 18, fontWeight: '900', padding: 12 }, shareButton: { borderColor: '#D4AF37', borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 12 }, shareButtonText: { color: '#D4AF37', fontSize: 9, fontWeight: '900' }, saveButton: { backgroundColor: '#D4AF37', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 13 }, saveText: { color: '#000000', fontSize: 10, fontWeight: '900' }, deleteSmall: { borderColor: '#D4AF37', borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 12 }, deleteSmallText: { color: '#D4AF37', fontSize: 9, fontWeight: '900' },
  shareCard: { alignItems: 'center', backgroundColor: '#171717', borderColor: '#D4AF37', borderRadius: 12, borderWidth: 1, marginTop: 20, padding: 18 }, shareTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', textAlign: 'center' }, shareCopy: { color: '#B8B8B8', fontSize: 12, lineHeight: 18, marginTop: 5, textAlign: 'center' }, qrFrame: { backgroundColor: '#FFFFFF', marginTop: 16, padding: 12 }, closeShare: { borderColor: '#D4AF37', borderRadius: 8, borderWidth: 1, marginTop: 16, paddingHorizontal: 18, paddingVertical: 10 }, closeShareText: { color: '#D4AF37', fontSize: 10, fontWeight: '900' },
  scannerScreen: { backgroundColor: '#0B0B0B', flex: 1 }, camera: { flex: 1 }, scannerOverlay: { alignItems: 'center', backgroundColor: '#0B0B0B', padding: 22 }, scannerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' }, scannerCopy: { color: '#B8B8B8', fontSize: 13, marginTop: 5, textAlign: 'center' }, scannerClose: { borderColor: '#D4AF37', borderRadius: 8, borderWidth: 1, marginTop: 16, paddingHorizontal: 24, paddingVertical: 11 }, scannerCloseText: { color: '#D4AF37', fontSize: 10, fontWeight: '900' },
  dayTabs: { gap: 8, paddingVertical: 16 }, dayTab: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 8, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 }, dayTabActive: { backgroundColor: '#D4AF37' }, dayTabText: { color: '#CFCFCF', fontSize: 11, fontWeight: '900' }, dayTabTextActive: { color: '#000000' }, addDay: { borderColor: '#D4AF37', borderRadius: 8, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 10 }, addDayText: { color: '#D4AF37', fontSize: 11, fontWeight: '900' },
  dayEditor: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 10, borderWidth: 1, padding: 14 }, dayNameInput: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' }, muted: { color: '#B8B8B8', fontSize: 11, marginTop: 4 },
  exerciseCard: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 10, borderWidth: 1, marginTop: 10, padding: 14 }, exerciseHeader: { alignItems: 'center', flexDirection: 'row', gap: 6, marginBottom: 10 }, exerciseNameInput: { color: '#FFFFFF', flex: 1, fontSize: 14, fontWeight: '900', paddingVertical: 4 }, swapButton: { borderColor: '#D4AF37', borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 7 }, swapButtonActive: { backgroundColor: '#D4AF37' }, swapButtonText: { color: '#D4AF37', fontSize: 9, fontWeight: '900' }, swapButtonTextActive: { color: '#000000' }, removeButton: { paddingHorizontal: 4, paddingVertical: 7 }, removeButtonText: { color: '#D4AF37', fontSize: 9, fontWeight: '900' },
  editSetRow: { alignItems: 'center', borderTopColor: '#3A3A3A', borderTopWidth: 1, flexDirection: 'row', gap: 7, paddingVertical: 8 }, editSetNumber: { color: '#D4AF37', fontSize: 11, fontWeight: '900', textAlign: 'center', width: 22 }, editInput: { backgroundColor: '#0B0B0B', borderColor: '#3A3A3A', borderRadius: 6, borderWidth: 1, color: '#FFFFFF', flex: 1, paddingHorizontal: 8, paddingVertical: 9, textAlign: 'center' }, removeSet: { alignItems: 'center', height: 30, justifyContent: 'center', width: 24 }, removeSetText: { color: '#B8B8B8', fontSize: 12, fontWeight: '900' }, addSet: { alignItems: 'center', borderColor: '#D4AF37', borderRadius: 6, borderWidth: 1, marginTop: 8, paddingVertical: 9 }, addSetText: { color: '#D4AF37', fontSize: 10, fontWeight: '900' },
  search: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 8, borderWidth: 1, color: '#FFFFFF', marginBottom: 9, padding: 12 }, libraryRow: { alignItems: 'center', backgroundColor: '#171717', borderBottomColor: '#3A3A3A', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', padding: 12 }, libraryCopy: { flex: 1 }, libraryName: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' }, libraryMeta: { color: '#B8B8B8', fontSize: 10, marginTop: 3 }, libraryAction: { borderColor: '#D4AF37', borderRadius: 6, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 }, libraryActionText: { color: '#D4AF37', fontSize: 9, fontWeight: '900' },
  empty: { backgroundColor: '#171717', borderColor: '#3A3A3A', borderRadius: 10, borderWidth: 1, marginTop: 24, padding: 16 }, emptyTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' }, emptyText: { color: '#B8B8B8', fontSize: 13, lineHeight: 19, marginTop: 5 },
});
