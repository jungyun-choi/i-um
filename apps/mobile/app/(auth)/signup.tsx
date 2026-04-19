import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useToast } from '../../src/components/Toast';
import * as Haptics from 'expo-haptics';

export default function SignupScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const pwRef = useRef<TextInput>(null);

  async function handleSignup() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      showToast('이메일과 비밀번호를 입력해주세요');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      showToast('올바른 이메일 주소를 입력해주세요');
      return;
    }
    if (password.length < 6) {
      showToast('비밀번호는 6자 이상이어야 해요');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email: trimmedEmail, password });
    setLoading(false);
    if (error) {
      showToast(error.message ?? '가입에 실패했어요. 다시 시도해주세요.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/child/new?from=onboarding');
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
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          {/* 온보딩 진행률 */}
          <View style={styles.progressRow}>
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={styles.progressLine} />
            <View style={styles.progressDot} />
          </View>

          <View style={styles.hero}>
            <Text style={styles.appName}>이음</Text>
            <Text style={styles.title}>함께 기억해요</Text>
            <Text style={styles.sub}>아이의 모든 순간을 AI가 일기로 담아드려요</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>이메일</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="email@example.com"
                placeholderTextColor="#C8C4BC"
                returnKeyType="next"
                onSubmitEditing={() => pwRef.current?.focus()}
                autoFocus
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>비밀번호</Text>
              <View style={styles.pwRow}>
                <TextInput
                  ref={pwRef}
                  style={[styles.input, styles.pwInput]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                  placeholder="6자 이상"
                  placeholderTextColor="#C8C4BC"
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw((v) => !v)}>
                  <Text style={styles.eyeIcon}>{showPw ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.hint}>6자 이상 입력해주세요</Text>
            </View>

            <TouchableOpacity
              style={[styles.btn, loading ? styles.btnDisabled : null]}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>{loading ? '가입 중...' : '무료로 시작하기'}</Text>
            </TouchableOpacity>

            <Text style={styles.terms}>
              가입하면{' '}
              <Text style={styles.termsLink} onPress={() => router.push('/privacy')}>개인정보처리방침</Text>
              에 동의하는 것으로 간주합니다
            </Text>
          </View>

          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.switchRow}>
            <Text style={styles.switchText}>이미 계정이 있으신가요? </Text>
            <Text style={styles.switchLink}>로그인</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FEF7F0' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  back: { paddingTop: 8, paddingBottom: 16, alignSelf: 'flex-start' },
  backText: { fontSize: 24, color: '#1A1A1A' },

  progressRow: {
    flexDirection: 'row', alignItems: 'center', paddingTop: 20, paddingBottom: 4,
  },
  progressDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#E0DDD5',
  },
  progressDotActive: { backgroundColor: '#E8735A', width: 24, borderRadius: 4 },
  progressLine: { flex: 1, height: 2, backgroundColor: '#E0DDD5', marginHorizontal: 6 },

  hero: { paddingTop: 16, paddingBottom: 36 },
  appName: { fontSize: 15, fontWeight: '700', color: '#E8735A', letterSpacing: 2, marginBottom: 10 },
  title: { fontSize: 26, fontWeight: '800', color: '#1A1A1A', lineHeight: 34, marginBottom: 6 },
  sub: { fontSize: 15, color: '#888', lineHeight: 22 },

  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 16, elevation: 4,
    marginBottom: 24, gap: 16,
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
  hint: { fontSize: 12, color: '#BBBBBB' },

  btn: {
    backgroundColor: '#E8735A', borderRadius: 16,
    paddingVertical: 17, alignItems: 'center', marginTop: 4,
    shadowColor: '#E8735A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
  },
  btnDisabled: { opacity: 0.6, shadowOpacity: 0 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  terms: { fontSize: 11, color: '#BBBBBB', textAlign: 'center', lineHeight: 16 },
  termsLink: { color: '#E8735A' },

  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  switchText: { fontSize: 15, color: '#888' },
  switchLink: { fontSize: 15, color: '#E8735A', fontWeight: '600' },
});
