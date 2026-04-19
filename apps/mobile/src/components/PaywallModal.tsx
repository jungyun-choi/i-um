import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function PaywallModal({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.emoji}>🌟</Text>
          <Text style={styles.title}>이번 달 무료 기록을{'\n'}모두 사용했어요</Text>
          <Text style={styles.desc}>
            무료 플랜은 매달 10개의 AI 일기를 제공해요.{'\n'}
            Pro 플랜으로 업그레이드하면 무제한으로 기록할 수 있어요.
          </Text>

          <View style={styles.featureList}>
            {[
              '📸 무제한 AI 일기 생성',
              '💌 월간 하이라이트 레터',
              '🎉 마일스톤 자동 알림',
              '🔒 프리미엄 프라이버시 보호',
            ].map((f) => (
              <View key={f} style={styles.featureRow}>
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>

          <View style={styles.comingSoon}>
            <Text style={styles.comingSoonText}>🚀 Pro 플랜 — 곧 출시 예정</Text>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.closeBtnText}>다음 달에 다시 시도할게요</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFDF8',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40,
    width: '100%', alignItems: 'center',
  },
  emoji: { fontSize: 52, marginBottom: 12 },
  title: {
    fontSize: 22, fontWeight: '700', color: '#1A1A1A',
    textAlign: 'center', lineHeight: 32, marginBottom: 12,
  },
  desc: {
    fontSize: 14, color: '#888', textAlign: 'center',
    lineHeight: 22, marginBottom: 24,
  },
  featureList: {
    width: '100%', backgroundColor: '#F9F6F0',
    borderRadius: 16, padding: 16, gap: 10, marginBottom: 20,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center' },
  featureText: { fontSize: 14, color: '#444' },
  comingSoon: {
    backgroundColor: '#FFF0ED', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 20, marginBottom: 20,
  },
  comingSoonText: { fontSize: 13, color: '#E8735A', fontWeight: '600' },
  closeBtn: {
    width: '100%', paddingVertical: 16, borderRadius: 16,
    backgroundColor: '#F5F2EC', alignItems: 'center',
  },
  closeBtnText: { fontSize: 15, color: '#888', fontWeight: '500' },
});
