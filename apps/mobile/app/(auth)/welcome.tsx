import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const FEATURES = [
  { icon: '📸', title: '사진 한 장으로 충분해요', desc: '직접 쓸 필요 없어요. 사진만 찍으면 AI가 일기를 써드려요.' },
  { icon: '✨', title: 'AI가 감동적으로 담아요', desc: '아이의 표정, 배경, 분위기를 읽어 따뜻한 문장으로 남겨요.' },
  { icon: '🎉', title: '특별한 순간을 잊지 않아요', desc: '첫걸음마, 첫말 — 평생 기억할 마일스톤을 자동으로 기록해요.' },
];

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo}>이음</Text>
        <Text style={styles.tagline}>사진만 찍으면{'\n'}AI가 일기를 써드려요</Text>
      </View>

      <View style={styles.features}>
        {FEATURES.map((f) => (
          <View key={f.title} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.primaryBtnText}>무료로 시작하기</Text>
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
  hero: { alignItems: 'center', paddingTop: 56, paddingHorizontal: 32, paddingBottom: 32 },
  logo: { fontSize: 40, fontWeight: '700', color: '#E8735A', marginBottom: 18 },
  tagline: { fontSize: 26, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', lineHeight: 38 },
  features: { flex: 1, paddingHorizontal: 28, justifyContent: 'center', gap: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  featureIcon: { fontSize: 28, marginTop: 2 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 3 },
  featureDesc: { fontSize: 13, color: '#888', lineHeight: 19 },
  buttons: { padding: 24, gap: 12 },
  primaryBtn: {
    backgroundColor: '#E8735A', borderRadius: 16,
    paddingVertical: 17, alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  secondaryBtn: { paddingVertical: 14, alignItems: 'center' },
  secondaryBtnText: { color: '#E8735A', fontSize: 16, fontWeight: '500' },
});
