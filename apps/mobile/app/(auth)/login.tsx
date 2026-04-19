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

export default function LoginScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const pwRef = useRef<TextInput>(null);

  async function handleLogin() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      showToast('이메일과 비밀번호를 입력해주세요');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
    setLoading(false);
    if (error) {
      showToast('이메일 또는 비밀번호를 확인해주세요');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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

          <View style={styles.hero}>
            <Text style={styles.appName}>이음</Text>
            <Text style={styles.title}>다시 만나서 반가워요</Text>
            <Text style={styles.sub}>소중한 기록이 기다리고 있어요</Text>
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
                  placeholder="비밀번호"
                  placeholderTextColor="#C8C4BC"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw((v) => !v)}>
                  <Text style={styles.eyeIcon}>{showPw ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.btn, loading ? styles.btnDisabled : null]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>{loading ? '로그인 중...' : '로그인'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => router.push('/(auth)/forgot-password')}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>비밀번호를 잊으셨나요?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push('/(auth)/signup')} style={styles.switchRow}>
            <Text style={styles.switchText}>계정이 없으신가요? </Text>
            <Text style={styles.switchLink}>회원가입</Text>
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

  hero: { paddingTop: 16, paddingBottom: 36 },
  appName: { fontSize: 15, fontWeight: '700', color: '#E8735A', letterSpacing: 2, marginBottom: 10 },
  title: { fontSize: 26, fontWeight: '800', color: '#1A1A1A', lineHeight: 34, marginBottom: 6 },
  sub: { fontSize: 15, color: '#888' },

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

  btn: {
    backgroundColor: '#E8735A', borderRadius: 16,
    paddingVertical: 17, alignItems: 'center', marginTop: 4,
    shadowColor: '#E8735A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
  },
  btnDisabled: { opacity: 0.6, shadowOpacity: 0 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  forgotBtn: { alignItems: 'center', paddingVertical: 4 },
  forgotText: { fontSize: 14, color: '#AAA' },

  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  switchText: { fontSize: 15, color: '#888' },
  switchLink: { fontSize: 15, color: '#E8735A', fontWeight: '600' },
});
