import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Keyboard, ActivityIndicator, Alert,
  Modal, Pressable,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import { api, uploadToS3 } from '../../../src/lib/api';
import { useChildStore } from '../../../src/stores/childStore';
import { useToast } from '../../../src/components/Toast';

const GENDERS = [
  { value: 'M', label: '남자아이', emoji: '👦' },
  { value: 'F', label: '여자아이', emoji: '👧' },
  { value: 'N', label: '선택 안함', emoji: '🧒' },
];

export default function EditChildScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const children = useChildStore((s) => s.children);
  const setChildren = useChildStore((s) => s.setChildren);
  const { showToast } = useToast();

  const child = children.find((c) => c.id === id);

  function parseBirthDate(s?: string): Date | null {
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  const [name, setName] = useState(child?.name ?? '');
  const [birthDate, setBirthDate] = useState<Date | null>(parseBirthDate(child?.birth_date));
  const [showPicker, setShowPicker] = useState(false);
  const [gender, setGender] = useState(child?.gender ?? 'N');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(child?.avatar_url ?? null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(false);

  const maxDate = new Date();
  const minDate = new Date(maxDate.getFullYear() - 10, maxDate.getMonth(), maxDate.getDate());

  function formatDateKorean(d: Date) {
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  }

  function dateToString(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  useEffect(() => {
    if (!child) router.back();
  }, [child]);

  async function handlePickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { showToast('사진 라이브러리 접근 권한이 필요해요'); return; }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setUploadingAvatar(true);
    try {
      const compressed = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 400 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      const { upload_url, public_url } = await api.children.getAvatarUploadUrl(id);
      await uploadToS3(upload_url, compressed.uri);
      setAvatarUri(compressed.uri);
      setAvatarUrl(public_url);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : '사진 업로드에 실패했어요');
    } finally {
      setUploadingAvatar(false);
    }
  }

  function handleDelete() {
    Alert.alert(
      `${child?.name} 삭제`,
      '아이의 모든 일기, 사진, 마일스톤이 삭제됩니다. 되돌릴 수 없어요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제', style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await api.children.delete(id);
              const updated = await api.children.list();
              setChildren(updated);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.replace('/(tabs)/timeline');
            } catch (e: unknown) {
              showToast(e instanceof Error ? e.message : '삭제에 실패했어요');
              setLoading(false);
            }
          },
        },
      ],
    );
  }

  async function handleSave() {
    if (!name.trim()) { showToast('이름을 입력해주세요'); return; }
    if (!birthDate) { showToast('생일을 선택해주세요'); return; }
    setLoading(true);
    try {
      const body: Parameters<typeof api.children.update>[1] = {
        name: name.trim(), birth_date: dateToString(birthDate), gender,
      };
      if (avatarUrl) body.avatar_url = avatarUrl;
      await api.children.update(id, body);
      const updated = await api.children.list();
      setChildren(updated);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('저장됐어요', 'success');
      router.back();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : '저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  const displayAvatar = avatarUri ?? avatarUrl;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>취소</Text>
        </TouchableOpacity>
        <Text style={styles.title}>프로필 편집</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={[styles.save, loading ? styles.saveDisabled : null]}>
            {loading ? '저장 중' : '저장'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 아바타 선택 */}
          <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickAvatar} disabled={uploadingAvatar}>
            {displayAvatar ? (
              <Image source={displayAvatar} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{name[0] ?? '?'}</Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              {uploadingAvatar
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.avatarEditIcon}>📷</Text>}
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>탭해서 사진 변경</Text>

          <Text style={styles.label}>이름</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="아이 이름"
            placeholderTextColor="#CCC"
            returnKeyType="next"
          />

          <Text style={styles.label}>생일</Text>
          <TouchableOpacity
            style={[styles.input, styles.dateBtn]}
            onPress={() => { Keyboard.dismiss(); setShowPicker(true); }}
            activeOpacity={0.75}
          >
            <Text style={birthDate ? styles.dateBtnText : styles.dateBtnPlaceholder}>
              {birthDate ? formatDateKorean(birthDate) : '날짜를 선택해주세요'}
            </Text>
            <Text style={styles.dateBtnIcon}>📅</Text>
          </TouchableOpacity>

          {Platform.OS === 'ios' ? (
            <Modal visible={showPicker} transparent animationType="slide">
              <Pressable style={styles.pickerBackdrop} onPress={() => setShowPicker(false)} />
              <View style={styles.pickerSheet}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={() => setShowPicker(false)}>
                    <Text style={styles.pickerDone}>완료</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={birthDate ?? new Date()}
                  mode="date"
                  display="spinner"
                  onChange={(_, date) => { if (date) setBirthDate(date); }}
                  maximumDate={maxDate}
                  minimumDate={minDate}
                  locale="ko"
                />
              </View>
            </Modal>
          ) : showPicker && (
            <DateTimePicker
              value={birthDate ?? new Date()}
              mode="date"
              display="default"
              onChange={(_, date) => { setShowPicker(false); if (date) setBirthDate(date); }}
              maximumDate={maxDate}
              minimumDate={minDate}
            />
          )}

          <Text style={styles.label}>성별</Text>
          <View style={styles.genderRow}>
            {GENDERS.map((g) => (
              <TouchableOpacity
                key={g.value}
                style={[styles.genderBtn, gender === g.value ? styles.genderBtnActive : null]}
                onPress={() => { Keyboard.dismiss(); setGender(g.value); }}
                activeOpacity={0.75}
              >
                <Text style={styles.genderEmoji}>{g.emoji}</Text>
                <Text style={[styles.genderText, gender === g.value ? styles.genderTextActive : null]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={loading}>
            <Text style={styles.deleteBtnText}>이 아이 프로필 삭제</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF8' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0EDE6',
  },
  cancel: { fontSize: 16, color: '#888' },
  title: { fontSize: 17, fontWeight: '600', color: '#1A1A1A' },
  save: { fontSize: 16, color: '#E8735A', fontWeight: '600' },
  saveDisabled: { opacity: 0.5 },
  form: { padding: 24, gap: 8, alignItems: 'stretch' },

  // 아바타
  avatarWrapper: { alignSelf: 'center', marginTop: 8, marginBottom: 4 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#FFE0D9', alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 40, color: '#E8735A', fontWeight: '600' },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#E8735A', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFFDF8',
  },
  avatarEditIcon: { fontSize: 14 },
  avatarHint: { textAlign: 'center', fontSize: 12, color: '#BBB', marginBottom: 12 },

  label: { fontSize: 14, fontWeight: '600', color: '#555', marginTop: 16 },
  input: {
    borderWidth: 1.5, borderColor: '#E8E4DC', borderRadius: 14,
    padding: 15, fontSize: 16, backgroundColor: '#fff', color: '#1A1A1A',
  },
  genderRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  genderBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#E8E4DC', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', backgroundColor: '#fff', gap: 4,
  },
  genderBtnActive: { borderColor: '#E8735A', backgroundColor: '#FFF0ED' },
  genderEmoji: { fontSize: 22 },
  genderText: { fontSize: 12, color: '#888', fontWeight: '500' },
  genderTextActive: { color: '#E8735A', fontWeight: '700' },

  deleteBtn: { marginTop: 32, marginBottom: 8, alignItems: 'center', paddingVertical: 12 },
  deleteBtnText: { fontSize: 14, color: '#C0392B', textDecorationLine: 'underline' },
  dateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateBtnText: { fontSize: 16, color: '#1A1A1A' },
  dateBtnPlaceholder: { fontSize: 16, color: '#CCC' },
  dateBtnIcon: { fontSize: 18 },
  pickerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  pickerSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  pickerDone: { fontSize: 16, color: '#E8735A', fontWeight: '700' },
});
