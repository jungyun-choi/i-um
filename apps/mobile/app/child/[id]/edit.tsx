import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../../src/lib/api';
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

  const [name, setName] = useState(child?.name ?? '');
  const [birthDate, setBirthDate] = useState(child?.birth_date ?? '');
  const [gender, setGender] = useState(child?.gender ?? 'N');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!child) router.back();
  }, [child]);

  function formatDateInput(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  }

  async function handleSave() {
    if (!name.trim()) { showToast('이름을 입력해주세요'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      showToast('생일을 YYYY-MM-DD 형식으로 입력해주세요');
      return;
    }
    setLoading(true);
    try {
      await api.children.update(id, { name: name.trim(), birth_date: birthDate, gender });
      const updated = await api.children.list();
      setChildren(updated);
      showToast('저장됐어요', 'success');
      router.back();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : '저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

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
  form: { padding: 24, gap: 8 },
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
});
