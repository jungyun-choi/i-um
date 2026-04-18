import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, Alert, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../src/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useChildStore } from '../../src/stores/childStore';

const GENDERS = [
  { value: 'M', label: '남자아이' },
  { value: 'F', label: '여자아이' },
  { value: 'N', label: '선택 안함' },
];

export default function NewChildScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
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
      router.replace('/(tabs)/timeline');
    } catch (e: unknown) {
      Alert.alert('실패', e instanceof Error ? e.message : '다시 시도해주세요.');
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
        <Text style={styles.title}>아이 프로필</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>이름</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="아이 이름"
          placeholderTextColor="#CCC"
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
        />

        <Text style={styles.label}>성별</Text>
        <View style={styles.genderRow}>
          {GENDERS.map((g) => (
            <TouchableOpacity
              key={g.value}
              style={[styles.genderBtn, gender === g.value && styles.genderBtnActive]}
              onPress={() => setGender(g.value)}
            >
              <Text style={[styles.genderText, gender === g.value && styles.genderTextActive]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createBtn, loading && styles.btnDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          <Text style={styles.createBtnText}>{loading ? '생성 중...' : '시작하기'}</Text>
        </TouchableOpacity>
      </View>
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
  form: { flex: 1, padding: 24, gap: 8 },
  label: { fontSize: 14, fontWeight: '500', color: '#555', marginTop: 16 },
  input: {
    borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 12,
    padding: 14, fontSize: 16, backgroundColor: '#fff',
  },
  genderRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  genderBtn: {
    flex: 1, borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff',
  },
  genderBtnActive: { borderColor: '#E8735A', backgroundColor: '#FFF0ED' },
  genderText: { fontSize: 14, color: '#888' },
  genderTextActive: { color: '#E8735A', fontWeight: '600' },
  footer: { padding: 24 },
  createBtn: {
    backgroundColor: '#E8735A', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  createBtnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
