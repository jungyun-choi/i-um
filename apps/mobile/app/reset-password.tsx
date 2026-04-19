import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { useToast } from '../src/components/Toast';
import * as Haptics from 'expo-haptics';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const confirmRef = useRef<TextInput>(null);

  async function handleReset() {
    if (password.length < 8) {
      showToast('비밀번호는 8자 이상이어야 해요');
      return;
    }
    if (password !== confirm) {
      showToast('비밀번호가 일치하지 않아요');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      showToast('비밀번호 변경에 실패했어요. 다시 시도해주세요.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      showToast('비밀번호가 변경됐어요', 'success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/timeline');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Text style={styles.appName}>이음</Text>
            <Text style={styles.title}>새 비밀번호 설정</Text>
            <Text style={styles.sub}>안전한 새 비밀번호를 입력해주세요</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>새 비밀번호</Text>
              <View style={styles.pwRow}>
                <TextInput
                  style={[styles.input, styles.pwInput]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                  placeholder="8자 이상"
                  placeholderTextColor="#C8C4BC"
                  returnKeyType="next"
                  onSubmitEditing={() => confirmRef.current?.focus()}
                  autoFocus
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw((v) => !v)}>
                  <Text style={styles.eyeIcon}>{showPw ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>비밀번호 확인</Text>
              <TextInput
                ref={confirmRef}
                style={styles.input}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showPw}
                placeholder="비밀번호 재입력"
                placeholderTextColor="#C8C4BC"
                returnKeyType="done"
                onSubmitEditing={handleReset}
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, (loading || password.length < 8 || !confirm) ? styles.btnDisabled : null]}
              onPress={handleReset}
              disabled={loading || password.length < 8 || !confirm}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>{loading ? '변경 중...' : '비밀번호 변경'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FEF7F0' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 40 },

  hero: { paddingBottom: 36 },
  appName: { fontSize: 15, fontWeight: '700', color: '#E8735A', letterSpacing: 2, marginBottom: 10 },
  title: { fontSize: 26, fontWeight: '800', color: '#1A1A1A', lineHeight: 34, marginBottom: 6 },
  sub: { fontSize: 15, color: '#888' },

  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 16, elevation: 4,
    gap: 16,
  },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#888', letterSpacing: 0.3 },
  input: {
    borderWidth: 1.5, borderColor: '#EDE9E0', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, backgroundColor: '#FAFAF8', color: '#1A1A1A',
    flex: 1,
  },
  pwRow: { flexDirection: 'row', alignItems: 'center' },
  pwInput: { borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRightWidth: 0 },
  eyeBtn: {
    borderWidth: 1.5, borderColor: '#EDE9E0', borderLeftWidth: 0,
    borderTopRightRadius: 14, borderBottomRightRadius: 14,
    paddingHorizontal: 14, paddingVertical: 14, backgroundColor: '#FAFAF8',
  },
  eyeIcon: { fontSize: 16 },

  btn: {
    backgroundColor: '#E8735A', borderRadius: 16,
    paddingVertical: 17, alignItems: 'center', marginTop: 4,
    shadowColor: '#E8735A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
  },
  btnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
