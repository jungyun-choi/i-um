import { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { api } from '../lib/api';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function PaywallModal({ visible, onClose }: Props) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleIntent() {
    if (sending || sent) return;
    setSending(true);
    try {
      await api.users.paywallIntent();
      setSent(true);
    } catch {
      // 조용히 실패 허용 — UX 우선, 데이터는 best-effort
    } finally {
      setSending(false);
    }
  }

  function handleClose() {
    setSent(false);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.emoji}>🌟</Text>
          <Text style={styles.title}>이번 달 기록 한도에{'\n'}도달했어요</Text>
          <Text style={styles.desc}>
            베타 기간 동안 매달 30개의 AI 일기를 무료로 제공해요.{'\n'}
            더 많은 기록이 필요하시면 다음 달에 다시 이용해주세요.
          </Text>

          <View style={styles.featureList}>
            {[
              '📸 무제한 AI 일기 — Pro 출시 예정',
              '💌 월간 하이라이트 레터',
              '🎉 발자국 자동 알림',
              '👨‍👩‍👧 가족 공유',
            ].map((f) => (
              <View key={f} style={styles.featureRow}>
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>

          {sent ? (
            <View style={styles.thanksBadge}>
              <Text style={styles.thanksText}>고마워요 💛{'\n'}정식 출시 소식 빠르게 알려드릴게요</Text>
            </View>
          ) : (
            <View style={styles.betaBadge}>
              <Text style={styles.betaText}>베타 서비스 — 소중한 피드백을 기다려요 💛</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, sent ? styles.primaryBtnDisabled : null]}
            onPress={sent ? handleClose : handleIntent}
            activeOpacity={0.8}
            disabled={sending}
          >
            <Text style={styles.primaryBtnText}>
              {sent ? '확인' : sending ? '보내는 중...' : 'Pro 출시 소식 받기 💛'}
            </Text>
          </TouchableOpacity>
          {!sent && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleClose} activeOpacity={0.6}>
              <Text style={styles.secondaryBtnText}>다음에</Text>
            </TouchableOpacity>
          )}
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
  betaBadge: {
    backgroundColor: '#FFF8E6', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 20, marginBottom: 16,
  },
  betaText: { fontSize: 13, color: '#C9922A', fontWeight: '600', textAlign: 'center' },
  thanksBadge: {
    backgroundColor: '#FFF0EC', borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 20, marginBottom: 16,
  },
  thanksText: {
    fontSize: 13, color: '#E8735A', fontWeight: '600',
    textAlign: 'center', lineHeight: 20,
  },
  primaryBtn: {
    width: '100%', paddingVertical: 16, borderRadius: 16,
    backgroundColor: '#E8735A', alignItems: 'center',
  },
  primaryBtnDisabled: { backgroundColor: '#B8A898' },
  primaryBtnText: { fontSize: 15, color: '#fff', fontWeight: '600' },
  secondaryBtn: {
    width: '100%', paddingVertical: 12, alignItems: 'center', marginTop: 4,
  },
  secondaryBtnText: { fontSize: 14, color: '#888', fontWeight: '500' },
});
