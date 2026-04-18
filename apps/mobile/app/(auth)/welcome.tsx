import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo}>이음</Text>
        <Text style={styles.tagline}>
          사진만 찍으면{'\n'}AI가 일기를 써드려요
        </Text>
        <Text style={styles.sub}>소중한 순간, 이음이 기억합니다</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.primaryBtnText}>시작하기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.secondaryBtnText}>이미 계정이 있어요</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF8' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logo: { fontSize: 48, fontWeight: '700', color: '#E8735A', marginBottom: 24 },
  tagline: { fontSize: 28, fontWeight: '600', color: '#1A1A1A', textAlign: 'center', lineHeight: 40, marginBottom: 16 },
  sub: { fontSize: 16, color: '#888', textAlign: 'center' },
  buttons: { padding: 24, gap: 12 },
  primaryBtn: {
    backgroundColor: '#E8735A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryBtnText: { color: '#E8735A', fontSize: 17, fontWeight: '500' },
});
