import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Platform, KeyboardAvoidingView, Keyboard, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../src/lib/api';
import { useChildStore } from '../../src/stores/childStore';

const GENDERS = [
  { value: 'M', label: '남자아이', emoji: '👦' },
  { value: 'F', label: '여자아이', emoji: '👧' },
  { value: 'N', label: '선택 안함', emoji: '🧒' },
];

export default function NewChildScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const isOnboarding = params.from === 'onboarding';
  const setChildren = useChildStore((s) => s.setChildren);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('N');
  const [loading, setLoading] = useState(false);

  function formatDateInput(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  }

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert('이름을 입력해주세요');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      Alert.alert('생일 형식이 올바르지 않아요', 'YYYY-MM-DD 형식으로 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      await api.children.create({ name: name.trim(), birth_date: birthDate, gender });
      const children = await api.children.list();
      setChildren(children);

      if (isOnboarding) {
        Alert.alert(
          `${name.trim()}의 프로필이 만들어졌어요! 🎉`,
          '첫 번째 사진을 올려서 AI 일기를 시작해볼까요?',
          [
            { text: '나중에', style: 'cancel', onPress: () => router.replace('/(tabs)/timeline') },
            { text: '지금 찍기', onPress: () => router.replace('/upload') },
          ],
        );
      } else {
        router.back();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('실패', msg || '다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        {!isOnboarding ? (
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancel}>취소</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <Text style={styles.title}>{isOnboarding ? '아이 소개' : '아이 추가'}</Text>
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
          <TextInput
            style={styles.input}
            value={birthDate}
            onChangeText={(t) => setBirthDate(formatDateInput(t))}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#CCC"
            keyboardType="numeric"
            maxLength={10}
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
          />

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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0EDE6',
  },
  cancel: { fontSize: 16, color: '#888' },
  title: { fontSize: 17, fontWeight: '600', color: '#1A1A1A' },

  form: { padding: 24, flexGrow: 1 },
  onboardingHint: { alignItems: 'center', paddingVertical: 24, marginBottom: 8 },
  hintEmoji: { fontSize: 40, marginBottom: 10 },
  hintText: { fontSize: 16, color: '#555', textAlign: 'center', lineHeight: 24 },

  label: { fontSize: 14, fontWeight: '600', color: '#555', marginTop: 20, marginBottom: 8 },
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
