import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const SECTIONS = [
  {
    title: '수집하는 정보',
    body: '이음은 서비스 제공을 위해 이메일 주소, 아이 이름·생년월일·성별, 업로드하신 사진 및 영상, 기기 푸시 알림 토큰을 수집합니다.',
  },
  {
    title: '정보 이용 목적',
    body: '수집된 정보는 AI 육아 일기 생성, 마일스톤 알림 발송, 가족 공유 기능 제공에만 사용됩니다. 제3자에게 판매하거나 광고 목적으로 사용하지 않습니다.',
  },
  {
    title: '정보 보관 기간',
    body: '회원 탈퇴 시 모든 개인정보 및 콘텐츠는 즉시 삭제됩니다. 법령에 따라 보관이 필요한 경우는 예외입니다.',
  },
  {
    title: '제3자 서비스',
    body: 'Supabase(인증·데이터베이스), Cloudflare R2(이미지 저장), Anthropic Claude(AI 일기 생성), Expo(푸시 알림) 서비스를 이용합니다. 각 서비스의 개인정보처리방침이 적용됩니다.',
  },
  {
    title: '사용자 권리',
    body: '프로필 탭 → 계정 및 데이터 삭제를 통해 언제든 모든 데이터를 삭제할 수 있습니다. 문의: chil9199@gmail.com',
  },
  {
    title: '어린이 개인정보',
    body: '이 앱은 부모/보호자가 자녀의 성장을 기록하기 위한 서비스입니다. 아이의 데이터는 계정 소유자만 관리합니다.',
  },
];

export default function PrivacyScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>개인정보처리방침</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>최종 업데이트: 2026년 4월 20일</Text>
        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}
        <Text style={styles.contact}>문의: chil9199@gmail.com</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF8' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0EDE6',
  },
  back: { fontSize: 24, color: '#1A1A1A', width: 32 },
  title: { fontSize: 17, fontWeight: '600', color: '#1A1A1A' },
  content: { padding: 20, paddingBottom: 48 },
  updated: { fontSize: 13, color: '#AAAAAA', marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  sectionBody: { fontSize: 14, color: '#555', lineHeight: 22 },
  contact: { fontSize: 13, color: '#AAAAAA', textAlign: 'center', marginTop: 8 },
});
