import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Platform, KeyboardAvoidingView, Keyboard, ScrollView, Modal, Pressable,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../src/lib/api';
import { useChildStore } from '../../src/stores/childStore';
import { useToast } from '../../src/components/Toast';

const GENDERS = [
  { value: 'M', label: '남자아이', emoji: '👦' },
  { value: 'F', label: '여자아이', emoji: '👧' },
  { value: 'N', label: '선택 안함', emoji: '🧒' },
];

function formatDateKorean(date: Date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}년 ${m}월 ${d}일`;
}

function dateToString(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function NewChildScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const isOnboarding = params.from === 'onboarding';
  const setChildren = useChildStore((s) => s.setChildren);
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [gender, setGender] = useState('N');
  const [loading, setLoading] = useState(false);

  const maxDate = new Date();
  const minDate = new Date(maxDate.getFullYear() - 10, maxDate.getMonth(), maxDate.getDate());

  async function handleCreate() {
    if (!name.trim()) {
      showToast('이름을 입력해주세요');
      return;
    }
    if (!birthDate) {
      showToast('생일을 선택해주세요');
      return;
    }
    setLoading(true);
    try {
      await api.children.create({ name: name.trim(), birth_date: dateToString(birthDate!), gender });
      const children = await api.children.list();
      setChildren(children);

      if (isOnboarding) {
        showToast(`${name.trim()}의 프로필이 만들어졌어요 🎉`, 'success');
        router.replace('/upload');
      } else {
        router.back();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast(msg || '다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 온보딩 진행률 */}
      {isOnboarding && (
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
      )}

      {/* 헤더 */}
      <View style={styles.header}>
        {!isOnboarding ? (
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancel}>취소</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{isOnboarding ? '아이 소개' : '아이 추가'}</Text>
          {isOnboarding && <Text style={styles.stepLabel}>2 / 2단계</Text>}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isOnboarding && (
            <View style={styles.onboardingHint}>
              <Text style={styles.hintEmoji}>✨</Text>
              <Text style={styles.hintText}>소중한 아이를 소개해주세요{'\n'}이음이 함께 기억할게요</Text>
            </View>
          )}

          <Text style={styles.label}>이름</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="아이 이름"
            placeholderTextColor="#CCC"
            returnKeyType="next"
            autoFocus={isOnboarding}
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

          {/* iOS: 모달 시트 / Android: 인라인 */}
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

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.createBtn, loading ? styles.btnDisabled : null]}
              onPress={handleCreate}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.createBtnText}>
                {loading ? '저장 중...' : isOnboarding ? '다음 →' : '추가하기'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF8' },
  progressBar: { height: 3, backgroundColor: '#F0EDE6' },
  progressFill: { height: 3, width: '100%', backgroundColor: '#E8735A' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0EDE6',
  },
  headerCenter: { alignItems: 'center', gap: 2 },
  cancel: { fontSize: 16, color: '#888' },
  title: { fontSize: 17, fontWeight: '600', color: '#1A1A1A' },
  stepLabel: { fontSize: 11, color: '#BBB', fontWeight: '500' },

  form: { padding: 24, flexGrow: 1 },
  onboardingHint: { alignItems: 'center', paddingVertical: 24, marginBottom: 8 },
  hintEmoji: { fontSize: 40, marginBottom: 10 },
  hintText: { fontSize: 16, color: '#555', textAlign: 'center', lineHeight: 24 },

  label: { fontSize: 14, fontWeight: '600', color: '#555', marginTop: 20, marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#E8E4DC', borderRadius: 14,
    padding: 15, fontSize: 16, backgroundColor: '#fff', color: '#1A1A1A',
  },
  dateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateBtnText: { fontSize: 16, color: '#1A1A1A' },
  dateBtnPlaceholder: { fontSize: 16, color: '#CCC' },
  dateBtnIcon: { fontSize: 18 },
  pickerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  pickerSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 32,
  },
  pickerHeader: {
    flexDirection: 'row', justifyContent: 'flex-end',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  pickerDone: { fontSize: 16, color: '#E8735A', fontWeight: '700' },

  genderRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  genderBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#E8E4DC', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', backgroundColor: '#fff', gap: 4,
  },
  genderBtnActive: { borderColor: '#E8735A', backgroundColor: '#FFF0ED' },
  genderEmoji: { fontSize: 22 },
  genderText: { fontSize: 12, color: '#888', fontWeight: '500' },
  genderTextActive: { color: '#E8735A', fontWeight: '700' },

  footer: { paddingTop: 36, paddingBottom: 8 },
  createBtn: {
    backgroundColor: '#E8735A', borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
    shadowColor: '#E8735A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  createBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
