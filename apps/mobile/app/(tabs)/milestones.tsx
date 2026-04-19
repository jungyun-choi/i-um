import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  ActivityIndicator, TouchableOpacity, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { api } from '../../src/lib/api';
import { useChildStore } from '../../src/stores/childStore';
import { getDday, getAgeText } from '../../src/lib/utils/age';
import { getExpectedDate, MILESTONE_META } from '../../src/lib/utils/milestone';

const SCREEN_W = Dimensions.get('window').width;
const S3_BASE = process.env.EXPO_PUBLIC_S3_BASE_URL ?? '';
const EXPECTED_MILESTONES = Object.keys(MILESTONE_META);

interface MilestoneData {
  id?: string;
  type: string;
  date?: string;
  diary_id?: string;
  photos?: { s3_key: string };
  expectedDate?: string;
}

function AchievedCard({ milestone }: { milestone: MilestoneData }) {
  const router = useRouter();
  const meta = MILESTONE_META[milestone.type] ?? { emoji: '⭐', label: milestone.type };
  const activeChild = useChildStore((s) => s.activeChild);
  const ageAtMilestone = activeChild && milestone.date
    ? getAgeText(activeChild.birth_date, milestone.date)
    : null;

  return (
    <TouchableOpacity
      style={styles.achievedCard}
      onPress={() => milestone.diary_id && router.push(`/diary/${milestone.diary_id}`)}
      activeOpacity={0.85}
    >
      {milestone.photos?.s3_key ? (
        <Image
          source={`${S3_BASE}/${milestone.photos.s3_key}`}
          style={styles.achievedImage}
          contentFit="cover"
          cachePolicy="disk"
          transition={200}
        />
      ) : (
        <View style={styles.achievedImagePlaceholder}>
          <Text style={styles.achievedEmoji}>{meta.emoji}</Text>
        </View>
      )}
      <View style={styles.achievedOverlay} />
      <View style={styles.achievedBody}>
        <View style={styles.achievedBadge}>
          <Text style={styles.achievedBadgeText}>{meta.emoji} {meta.label}</Text>
        </View>
        {ageAtMilestone && (
          <Text style={styles.achievedAge}>{ageAtMilestone}</Text>
        )}
        {milestone.date && (
          <Text style={styles.achievedDate}>{milestone.date}</Text>
        )}
      </View>
      {milestone.diary_id && (
        <View style={styles.readMoreBtn}>
          <Text style={styles.readMoreText}>일기 보기 →</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function PendingCard({ milestone }: { milestone: MilestoneData }) {
  const meta = MILESTONE_META[milestone.type] ?? { emoji: '⭐', label: milestone.type };
  const dday = milestone.expectedDate ? getDday(milestone.expectedDate) : null;
  const isPast = milestone.expectedDate
    ? new Date(milestone.expectedDate) < new Date()
    : false;

  return (
    <View style={styles.pendingCard}>
      <View style={styles.pendingLeft}>
        <Text style={styles.pendingEmoji}>{meta.emoji}</Text>
        <View>
          <Text style={styles.pendingLabel}>{meta.label}</Text>
          {milestone.expectedDate && (
            <Text style={styles.pendingDate}>{milestone.expectedDate}</Text>
          )}
        </View>
      </View>
      {dday && (
        <View style={[styles.ddayBadge, isPast && styles.ddayBadgePast]}>
          <Text style={[styles.ddayText, isPast && styles.ddayTextPast]}>{dday}</Text>
        </View>
      )}
    </View>
  );
}

export default function MilestonesScreen() {
  const activeChild = useChildStore((s) => s.activeChild);
  const { data: achieved = [], isLoading } = useQuery({
    queryKey: ['milestones', activeChild?.id],
    queryFn: () => api.milestones.list(activeChild!.id),
    enabled: !!activeChild,
  });

  if (!activeChild) {
    return (
      <SafeAreaView style={styles.empty}>
        <Text style={styles.emptyText}>아이 프로필이 없어요</Text>
      </SafeAreaView>
    );
  }

  const achievedTypes = new Set((achieved as MilestoneData[]).map((m) => m.type));
  const pending: MilestoneData[] = EXPECTED_MILESTONES
    .filter((type) => !achievedTypes.has(type))
    .map((type) => ({ type, expectedDate: getExpectedDate(activeChild.birth_date, type) }));

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{activeChild.name}의 특별한 순간</Text>
      {isLoading ? (
        <ActivityIndicator color="#E8735A" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {(achieved as MilestoneData[]).length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>달성한 마일스톤</Text>
                <Text style={styles.sectionCount}>{(achieved as MilestoneData[]).length}개</Text>
              </View>
              {(achieved as MilestoneData[]).map((m) => (
                <AchievedCard key={m.id} milestone={m} />
              ))}
            </>
          )}

          {pending.length > 0 && (
            <>
              <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                <Text style={styles.sectionTitle}>앞으로의 마일스톤</Text>
              </View>
              {pending.map((m) => (
                <PendingCard key={m.type} milestone={m} />
              ))}
            </>
          )}

          {(achieved as MilestoneData[]).length === 0 && (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionIcon}>🌱</Text>
              <Text style={styles.emptySectionText}>아직 달성한 마일스톤이 없어요</Text>
              <Text style={styles.emptySectionSub}>사진을 올리면 자동으로 기록돼요</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF8' },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', padding: 20, paddingBottom: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFDF8' },
  emptyText: { fontSize: 16, color: '#888' },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#AAA', letterSpacing: 0.5 },
  sectionCount: {
    fontSize: 12, fontWeight: '600', color: '#E8735A',
    backgroundColor: '#FFF0ED', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },

  // 달성 카드
  achievedCard: {
    borderRadius: 20, overflow: 'hidden', marginBottom: 16,
    backgroundColor: '#1A1A1A',
    shadowColor: '#1A1A1A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 5,
  },
  achievedImage: { width: '100%', height: SCREEN_W * 0.55 },
  achievedImagePlaceholder: {
    width: '100%', height: SCREEN_W * 0.4,
    backgroundColor: '#FFF0ED', alignItems: 'center', justifyContent: 'center',
  },
  achievedEmoji: { fontSize: 56 },
  achievedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  achievedBody: {
    position: 'absolute', bottom: 52, left: 20, right: 20,
  },
  achievedBadge: {
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 14, alignSelf: 'flex-start', marginBottom: 8,
  },
  achievedBadgeText: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  achievedAge: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 2 },
  achievedDate: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  readMoreBtn: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingVertical: 12, alignItems: 'center',
  },
  readMoreText: { fontSize: 13, color: '#fff', fontWeight: '600' },

  // 예정 카드
  pendingCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  pendingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  pendingEmoji: { fontSize: 28 },
  pendingLabel: { fontSize: 16, fontWeight: '600', color: '#333' },
  pendingDate: { fontSize: 13, color: '#BBB', marginTop: 2 },
  ddayBadge: {
    backgroundColor: '#FFF0ED', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  ddayBadgePast: { backgroundColor: '#F5F2EC' },
  ddayText: { fontSize: 14, fontWeight: '700', color: '#E8735A' },
  ddayTextPast: { color: '#BBB' },

  emptySection: { alignItems: 'center', paddingVertical: 40 },
  emptySectionIcon: { fontSize: 48, marginBottom: 12 },
  emptySectionText: { fontSize: 17, fontWeight: '600', color: '#555', marginBottom: 6 },
  emptySectionSub: { fontSize: 14, color: '#AAA' },
});
