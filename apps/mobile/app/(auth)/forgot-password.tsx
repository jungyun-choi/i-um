import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useToast } from '../../src/components/Toast';
import * as Haptics from 'expo-haptics';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    const trimmed = email.trim();
    if (!trimmed) { showToast('이메일을 입력해주세요'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: 'ium://reset-password',
    });
    setLoading(false);
    if (error) {
      showToast('메일 발송에 실패했어요. 이메일을 확인해주세요.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      setSent(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

          {sent ? (
            <View style={styles.sentBox}>
              <Text style={styles.sentIcon}>📬</Text>
              <Text style={styles.sentTitle}>메일을 보냈어요</Text>
              <Text style={styles.sentDesc}>
                {email} 로{'\n'}비밀번호 재설정 링크를 보냈어요.{'\n'}메일함을 확인해주세요.
              </Text>
              <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.85}>
                <Text style={styles.backBtnText}>로그인으로 돌아가기</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.hero}>
                <Text style={styles.appName}>이음</Text>
                <Text style={styles.title}>비밀번호를 잊으셨나요?</Text>
                <Text style={styles.sub}>가입한 이메일로 재설정 링크를 보내드려요</Text>
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
                    returnKeyType="done"
                    onSubmitEditing={handleReset}
                    autoFocus
                  />
                </View>

                <TouchableOpacity
                  style={[styles.btn, (loading || !email.trim()) ? styles.btnDisabled : null]}
                  onPress={handleReset}
                  disabled={loading || !email.trim()}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnText}>{loading ? '전송 중...' : '재설정 메일 보내기'}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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
  },
  btn: {
    backgroundColor: '#E8735A', borderRadius: 16,
    paddingVertical: 17, alignItems: 'center', marginTop: 4,
    shadowColor: '#E8735A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
  },
  btnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  sentBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  sentIcon: { fontSize: 64, marginBottom: 20 },
  sentTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
  sentDesc: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  backBtn: {
    backgroundColor: '#E8735A', borderRadius: 16, width: '100%',
    paddingVertical: 17, alignItems: 'center',
  },
  backBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
