import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/lib/supabase';
import { useChildStore } from '../../src/stores/childStore';
import { getAgeText } from '../../src/lib/utils/age';
import { ChildAvatar } from '../../src/components/ChildAvatar';
import { api } from '../../src/lib/api';

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

export default function ProfileScreen() {
  const router = useRouter();
  const activeChild = useChildStore((s) => s.activeChild);

  const { data: stats } = useQuery({
    queryKey: ['diary-stats', activeChild?.id],
    queryFn: () => api.diary.stats(activeChild!.id),
    enabled: !!activeChild,
  });

  async function handleLogout() {
    Alert.alert('로그아웃', '정말 로그아웃하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>프로필</Text>

        {activeChild ? (
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
          </>
        ) : (
          <TouchableOpacity style={styles.addChildBtn} onPress={() => router.push('/child/new')}>
            <Text style={styles.addChildBtnText}>+ 아이 프로필 추가</Text>
          </TouchableOpacity>
        )}

        {/* 메뉴 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>설정</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/child/new')}>
            <Text style={styles.menuIcon}>👶</Text>
            <Text style={styles.menuText}>아이 추가</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]}>
            <Text style={styles.menuIcon}>🔔</Text>
            <Text style={styles.menuText}>알림 설정</Text>
            <View style={styles.menuComingSoon}>
              <Text style={styles.menuComingSoonText}>준비 중</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={handleLogout}>
            <Text style={styles.menuIcon}>🚪</Text>
            <Text style={[styles.menuText, styles.menuTextDanger]}>로그아웃</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>이음 v1.0.0</Text>
      </ScrollView>
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
  childBirth: { fontSize: 13, color: '#BBB', marginTop: 1 },
  editHint: { fontSize: 14, color: '#CCC' },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 24,
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

  section: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '600', color: '#BBB',
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
  menuTextDanger: { color: '#D44' },
  menuArrow: { fontSize: 18, color: '#CCC' },
  menuComingSoon: {
    backgroundColor: '#F5F2EC', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3, marginRight: 8,
  },
  menuComingSoonText: { fontSize: 11, color: '#AAA', fontWeight: '500' },

  version: { textAlign: 'center', fontSize: 12, color: '#CCC', marginTop: 8 },
});
