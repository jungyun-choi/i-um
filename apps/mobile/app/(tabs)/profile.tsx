import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView,
  Share, Modal, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/lib/supabase';
import { useChildStore } from '../../src/stores/childStore';
import { getAgeText } from '../../src/lib/utils/age';
import { ChildAvatar } from '../../src/components/ChildAvatar';
import { api } from '../../src/lib/api';
import { ProfileSkeletonCard } from '../../src/components/Skeleton';

function StatBox({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function formatRecordPeriod(firstDate: string | null): string {
  if (!firstDate) return '아직 없음';
  const days = Math.floor((Date.now() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return '오늘 시작';
  if (days < 30) return `${days}일째`;
  if (days < 365) return `${Math.floor(days / 30)}개월째`;
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  return months > 0 ? `${years}년 ${months}개월째` : `${years}년째`;
}

interface JoinModalProps {
  visible: boolean;
  onClose: () => void;
  onJoined: () => void;
}

function JoinModal({ visible, onClose, onJoined }: JoinModalProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const setChildren = useChildStore((s) => s.setChildren);

  async function handleJoin() {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      Alert.alert('코드 확인', '6자리 초대 코드를 입력해주세요');
      return;
    }
    setLoading(true);
    try {
      await api.invites.join(trimmed);
      const children = await api.children.list();
      setChildren(children);
      onJoined();
      onClose();
      Alert.alert('완료!', '가족 앨범에 참여했어요 🎉');
    } catch (e: any) {
      Alert.alert('오류', e?.message ?? '코드를 다시 확인해주세요');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrapper}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>초대 코드 입력</Text>
          <Text style={styles.modalSub}>파트너에게 받은 6자리 코드를 입력하세요</Text>
          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={(t) => setCode(t.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6))}
            placeholder="XXXXXX"
            placeholderTextColor="#CCC"
            autoCapitalize="characters"
            keyboardType="default"
            maxLength={6}
            autoFocus
          />
          <TouchableOpacity
            style={[styles.joinBtn, (loading || code.trim().length !== 6) ? styles.joinBtnDisabled : null]}
            onPress={handleJoin}
            disabled={loading || code.trim().length !== 6}
            activeOpacity={0.8}
          >
            <Text style={styles.joinBtnText}>{loading ? '참여 중...' : '참여하기'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>취소</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const activeChild = useChildStore((s) => s.activeChild);
  const setChildren = useChildStore((s) => s.setChildren);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['diary-stats', activeChild?.id],
    queryFn: () => api.diary.stats(activeChild!.id),
    enabled: !!activeChild,
  });

  async function handleInvite() {
    if (!activeChild) return;
    setInviting(true);
    try {
      const { code } = await api.invites.create(activeChild.id);
      await Share.share({
        message: `이음 앱에서 ${activeChild.name}의 성장 앨범을 함께 보세요!\n\n초대 코드: ${code}\n\n앱 설치 후 프로필 → "코드로 참여하기"에 입력하세요.`,
        title: `${activeChild.name} 가족 초대`,
      });
    } catch (e: any) {
      if (e?.message !== 'User did not share') {
        Alert.alert('오류', '초대 코드 생성에 실패했어요');
      }
    } finally {
      setInviting(false);
    }
  }

  async function handleLogout() {
    Alert.alert('로그아웃', '정말 로그아웃하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      '계정 삭제',
      '정말요? 모든 일기, 사진, 마일스톤이 영구적으로 삭제됩니다.\n되돌릴 수 없어요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제 진행',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '마지막 확인',
              '아이의 모든 기록이 삭제됩니다. 계속하시겠어요?',
              [
                { text: '아니요, 돌아가기', style: 'cancel' },
                {
                  text: '네, 삭제합니다',
                  style: 'destructive',
                  onPress: async () => {
                    setDeletingAccount(true);
                    try {
                      await api.users.deleteAccount();
                      await supabase.auth.signOut();
                    } catch {
                      setDeletingAccount(false);
                      Alert.alert('오류', '계정 삭제에 실패했어요. 다시 시도해주세요.');
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>프로필</Text>

        {!activeChild || statsLoading ? (
          <ProfileSkeletonCard />
        ) : activeChild ? (
          <>
            {/* 아이 프로필 카드 */}
            <TouchableOpacity
              style={styles.childCard}
              onPress={() => router.push(`/child/${activeChild.id}/edit`)}
            >
              <ChildAvatar name={activeChild.name} avatarUrl={activeChild.avatar_url} size={64} />
              <View style={styles.childInfo}>
                <Text style={styles.childName}>{activeChild.name}</Text>
                <Text style={styles.childAge}>{getAgeText(activeChild.birth_date)}</Text>
                <Text style={styles.childBirth}>{activeChild.birth_date}</Text>
              </View>
              <Text style={styles.editHint}>편집 ›</Text>
            </TouchableOpacity>

            {/* 기록 통계 */}
            {stats && (
              <View style={styles.statsRow}>
                <StatBox value={stats.diary_count} label="일기" />
                <View style={styles.statDivider} />
                <StatBox value={stats.milestone_count} label="마일스톤" />
                <View style={styles.statDivider} />
                <StatBox value={formatRecordPeriod(stats.first_entry_date)} label="기록 중" />
              </View>
            )}

            {/* 가족 공유 섹션 */}
            <View style={styles.shareSection}>
              <Text style={styles.shareSectionTitle}>가족과 함께 보기</Text>
              <Text style={styles.shareSectionDesc}>파트너나 조부모님도 함께 볼 수 있어요</Text>
              <View style={styles.shareButtons}>
                <TouchableOpacity
                  style={[styles.shareBtn, inviting ? styles.shareBtnDisabled : null]}
                  onPress={handleInvite}
                  disabled={inviting}
                  activeOpacity={0.85}
                >
                  <Text style={styles.shareBtnIcon}>🔗</Text>
                  <Text style={styles.shareBtnText}>{inviting ? '생성 중...' : '초대 보내기'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.shareBtn, styles.shareBtnSecondary]}
                  onPress={() => setShowJoinModal(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.shareBtnIcon}>🎟</Text>
                  <Text style={[styles.shareBtnText, styles.shareBtnTextSecondary]}>코드로 참여하기</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <TouchableOpacity style={styles.addChildBtn} onPress={() => router.push('/child/new')}>
            <Text style={styles.addChildBtnText}>+ 아이 프로필 추가</Text>
          </TouchableOpacity>
        )}

        {/* 설정 메뉴 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>설정</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/child/new')}>
            <Text style={styles.menuIcon}>👶</Text>
            <Text style={styles.menuText}>아이 추가</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={() => router.push('/notification-settings')}>
            <Text style={styles.menuIcon}>🔔</Text>
            <Text style={styles.menuText}>알림 설정</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Text style={styles.menuIcon}>🚪</Text>
            <Text style={[styles.menuText, styles.menuTextDanger]}>로그아웃</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemLast]}
            onPress={handleDeleteAccount}
            disabled={deletingAccount}
          >
            {deletingAccount ? (
              <ActivityIndicator size="small" color="#C0392B" style={{ marginRight: 12 }} />
            ) : (
              <Text style={[styles.menuIcon, { opacity: 0.7 }]}>🗑</Text>
            )}
            <Text style={[styles.menuText, styles.menuTextDelete]}>
              {deletingAccount ? '삭제 중...' : '계정 및 데이터 삭제'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push('/privacy')}>
          <Text style={styles.privacyLink}>개인정보처리방침</Text>
        </TouchableOpacity>
        <Text style={styles.version}>이음 v1.0.0</Text>
      </ScrollView>

      <JoinModal
        visible={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoined={() => {}}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF8' },
  scroll: { paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', padding: 20, paddingBottom: 12 },

  childCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 16, marginBottom: 12, borderRadius: 20, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  childInfo: { flex: 1, marginLeft: 16 },
  childName: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  childAge: { fontSize: 15, color: '#E8735A', fontWeight: '600', marginTop: 2 },
  childBirth: { fontSize: 13, color: '#BBBBBB', marginTop: 1 },
  editHint: { fontSize: 14, color: '#CCC' },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16,
    borderRadius: 16, paddingVertical: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#1A1A1A' },
  statLabel: { fontSize: 12, color: '#AAA', marginTop: 3, fontWeight: '500' },
  statDivider: { width: 1, height: 32, backgroundColor: '#F0EDE6' },

  addChildBtn: {
    marginHorizontal: 16, marginBottom: 24, backgroundColor: '#FFF0ED',
    borderRadius: 14, padding: 16, alignItems: 'center',
  },
  addChildBtnText: { color: '#E8735A', fontSize: 16, fontWeight: '500' },

  // 가족 공유
  shareSection: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16,
    borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  shareSectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  shareSectionDesc: { fontSize: 13, color: '#888', marginBottom: 16 },
  shareButtons: { flexDirection: 'row', gap: 10 },
  shareBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#E8735A', borderRadius: 12,
    paddingVertical: 12,
  },
  shareBtnSecondary: { backgroundColor: '#F5F2EC' },
  shareBtnDisabled: { opacity: 0.6 },
  shareBtnIcon: { fontSize: 16 },
  shareBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  shareBtnTextSecondary: { color: '#555' },

  section: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '600', color: '#BBBBBB',
    paddingHorizontal: 18, paddingTop: 14, paddingBottom: 4,
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 18,
    borderBottomWidth: 1, borderBottomColor: '#F5F2EC',
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuIcon: { fontSize: 18, marginRight: 12 },
  menuText: { flex: 1, fontSize: 16, color: '#333' },
  menuTextDanger: { color: '#D44444' },
  menuTextDelete: { color: '#C0392B', fontSize: 15 },
  menuArrow: { fontSize: 18, color: '#CCC' },
  menuComingSoon: {
    backgroundColor: '#F5F2EC', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3, marginRight: 8,
  },
  menuComingSoonText: { fontSize: 11, color: '#AAA', fontWeight: '500' },

  privacyLink: { textAlign: 'center', fontSize: 12, color: '#BBBBBB', marginTop: 16, textDecorationLine: 'underline' },
  version: { textAlign: 'center', fontSize: 12, color: '#CCC', marginTop: 4, marginBottom: 8 },

  // JoinModal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16,
    alignItems: 'center',
  },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E0DDD5', borderRadius: 2, marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 6 },
  modalSub: { fontSize: 14, color: '#888', marginBottom: 24, textAlign: 'center' },
  codeInput: {
    width: '100%', height: 60, borderWidth: 2, borderColor: '#E8E4DC',
    borderRadius: 16, fontSize: 28, fontWeight: '700', color: '#1A1A1A',
    textAlign: 'center', letterSpacing: 8, marginBottom: 16, backgroundColor: '#FAFAF8',
  },
  joinBtn: {
    width: '100%', height: 52, backgroundColor: '#E8735A',
    borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  joinBtnDisabled: { backgroundColor: '#F0B9AD' },
  joinBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cancelBtn: { paddingVertical: 8 },
  cancelBtnText: { fontSize: 15, color: '#BBBBBB' },
});
