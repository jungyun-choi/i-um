import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions, Modal,
  Platform, Pressable, Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { api } from '../../src/lib/api';
import { useChildStore } from '../../src/stores/childStore';
import { MilestoneSkeletonList } from '../../src/components/Skeleton';
import { getDday } from '../../src/lib/utils/age';
import {
  FOOTSTEP_RANGES, getFootstepRange, getRangeEndDate,
  MILESTONE_META, isDatePast, formatMilestoneDate,
} from '../../src/lib/utils/milestone';

const SCREEN_W = Dimensions.get('window').width;
const S3_BASE = process.env.EXPO_PUBLIC_S3_BASE_URL ?? '';
const EVENT_TYPES = ['first_word', 'first_step'] as const;

interface TimelinePhoto {
  id: string;
  s3_key: string;
  taken_at?: string | null;
}

interface TimelineEntry {
  id: string;
  child_id: string;
  content: string;
  created_at: string;
  photos?: TimelinePhoto | null;
}

interface TimelineResp {
  entries: TimelineEntry[];
  next_cursor: string | null;
}

interface RangeGroup {
  key: string;
  label: string;
  emoji: string;
  entries: TimelineEntry[];
  coverKey?: string;
}

interface EventMilestone {
  id?: string;
  type: string;
  date?: string;
  diary_id?: string;
}

// ─── 앨범 카드 (범위에 일기가 있는 경우) ────────────────────────────────
function AlbumCard({ group }: { group: RangeGroup }) {
  const router = useRouter();
  const count = group.entries.length;
  const ids = group.entries.map((e) => e.id).join(',');
  const firstId = group.entries[0].id;

  return (
    <TouchableOpacity
      style={styles.albumCard}
      activeOpacity={0.85}
      onPress={() => router.push(`/diary/${firstId}?ids=${ids}`)}
    >
      {group.coverKey ? (
        <Image
          source={`${S3_BASE}/${group.coverKey}`}
          style={styles.albumImage}
          contentFit="cover"
          cachePolicy="disk"
          transition={200}
        />
      ) : (
        <View style={styles.albumImagePlaceholder}>
          <Text style={styles.albumEmoji}>{group.emoji}</Text>
        </View>
      )}
      <View style={styles.albumOverlay} />
      <View style={styles.albumBody}>
        <View style={styles.albumBadge}>
          <Text style={styles.albumBadgeText}>{group.emoji} {group.label}</Text>
        </View>
        <Text style={styles.albumCount}>{count}장의 추억</Text>
      </View>
      <View style={styles.albumArrow}>
        <Text style={styles.albumArrowText}>앨범 보기 →</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── 예정 카드 (아직 사진이 없는 범위) ───────────────────────────────────
function PendingRangeCard({ range, birthDate }: { range: typeof FOOTSTEP_RANGES[number]; birthDate: string }) {
  const endDate = getRangeEndDate(birthDate, range.key);
  const dday = endDate ? getDday(endDate) : null;
  const isPast = endDate ? isDatePast(endDate) : false;

  return (
    <View style={styles.pendingCard}>
      <View style={styles.pendingLeft}>
        <Text style={styles.pendingEmoji}>{range.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.pendingLabel}>{range.label}</Text>
          {endDate ? (
            <Text style={styles.pendingDate}>~ {formatMilestoneDate(endDate)}</Text>
          ) : (
            <Text style={styles.pendingDate}>사진을 올려보세요</Text>
          )}
        </View>
      </View>
      {dday ? (
        <View style={[styles.ddayBadge, isPast ? styles.ddayBadgePast : null]}>
          <Text style={[styles.ddayText, isPast ? styles.ddayTextPast : null]}>{dday}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── 이벤트 카드 (first_word, first_step) ────────────────────────────────
function EventCard({
  type, milestone, onRecord,
}: {
  type: string;
  milestone?: EventMilestone;
  onRecord: (type: string) => void;
}) {
  const router = useRouter();
  const meta = MILESTONE_META[type] ?? { emoji: '⭐', label: type };
  const achieved = !!milestone;

  return (
    <TouchableOpacity
      style={styles.pendingCard}
      activeOpacity={achieved ? 0.85 : 1}
      disabled={!achieved}
      onPress={() => achieved && milestone?.diary_id && router.push(`/diary/${milestone.diary_id}`)}
    >
      <View style={styles.pendingLeft}>
        <Text style={styles.pendingEmoji}>{meta.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.pendingLabel}>{meta.label}</Text>
          {achieved && milestone?.date ? (
            <Text style={[styles.pendingDate, styles.pendingDateDone]}>
              {formatMilestoneDate(milestone.date)}
            </Text>
          ) : (
            <Text style={styles.pendingDate}>그 특별한 순간을 기록하세요</Text>
          )}
        </View>
      </View>
      {achieved ? (
        <View style={styles.doneBadge}>
          <Text style={styles.doneBadgeText}>✓</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.recordBtn}
          onPress={() => onRecord(type)}
          activeOpacity={0.75}
        >
          <Text style={styles.recordBtnText}>기록하기</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// ─── 기록 모달 (first_word / first_step 전용) ─────────────────────────────
interface RecordModalProps {
  visible: boolean;
  type: string | null;
  childId: string;
  onClose: () => void;
  onSaved: () => void;
}

function RecordModal({ visible, type, childId, onClose, onSaved }: RecordModalProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const meta = type ? (MILESTONE_META[type] ?? { emoji: '⭐', label: type }) : null;

  const maxDate = new Date();
  const minDate = new Date(maxDate.getFullYear() - 10, maxDate.getMonth(), maxDate.getDate());

  function dateToString(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function formatDateKorean(d: Date) {
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  }

  async function handleSave() {
    if (!type) return;
    setSaving(true);
    try {
      await api.milestones.create({ child_id: childId, type, date: dateToString(selectedDate) });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSaved();
      onClose();
    } catch (e: any) {
      const msg = e?.message ?? '저장에 실패했어요';
      Alert.alert('오류', msg === 'Milestone already recorded' ? '이미 기록된 발자국이에요.' : msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.modalWrapper}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          {meta && <Text style={styles.modalEmoji}>{meta.emoji}</Text>}
          <Text style={styles.modalTitle}>{meta?.label}한 날을 알려주세요</Text>
          <Text style={styles.modalSub}>정확하지 않아도 괜찮아요</Text>

          {Platform.OS === 'ios' ? (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              onChange={(_, date) => { if (date) setSelectedDate(date); }}
              maximumDate={maxDate}
              minimumDate={minDate}
              locale="ko"
              style={styles.datePicker}
            />
          ) : (
            <>
              <TouchableOpacity
                style={styles.dateDisplayBtn}
                onPress={() => setShowAndroidPicker(true)}
                activeOpacity={0.75}
              >
                <Text style={styles.dateDisplayText}>{formatDateKorean(selectedDate)}</Text>
                <Text style={styles.dateDisplayIcon}>📅</Text>
              </TouchableOpacity>
              {showAndroidPicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="default"
                  onChange={(_, date) => { setShowAndroidPicker(false); if (date) setSelectedDate(date); }}
                  maximumDate={maxDate}
                  minimumDate={minDate}
                />
              )}
            </>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, saving ? styles.saveBtnDisabled : null]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>{saving ? '저장 중...' : '기록하기'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.6}>
            <Text style={styles.cancelBtnText}>취소</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── 메인 스크린 ─────────────────────────────────────────────────────────
export default function MilestonesScreen() {
  const activeChild = useChildStore((s) => s.activeChild);
  const queryClient = useQueryClient();
  const [recordingType, setRecordingType] = useState<string | null>(null);

  // 타임라인 (앨범용 — 한 번에 많이 가져와서 런타임 그룹핑)
  const { data: timeline, isLoading: tLoading } = useQuery<TimelineResp>({
    queryKey: ['timeline-album', activeChild?.id],
    queryFn: () => api.diary.timeline(activeChild!.id, undefined, 1000),
    enabled: !!activeChild,
  });

  // 이벤트 마일스톤 (first_word, first_step)
  const { data: eventMilestones = [], isLoading: mLoading } = useQuery<EventMilestone[]>({
    queryKey: ['milestones', activeChild?.id],
    queryFn: () => api.milestones.list(activeChild!.id),
    enabled: !!activeChild,
  });

  const isLoading = tLoading || mLoading;

  // 일기를 범위별로 그룹핑 (최신순 유지, 커버는 가장 최근 사진)
  const groups = useMemo<RangeGroup[]>(() => {
    if (!activeChild || !timeline?.entries) return [];
    const byKey = new Map<string, TimelineEntry[]>();
    for (const entry of timeline.entries) {
      if (!entry.photos?.s3_key) continue;
      const dateStr = entry.photos.taken_at ?? entry.created_at;
      const key = getFootstepRange(activeChild.birth_date, dateStr);
      if (!key) continue;
      const arr = byKey.get(key) ?? [];
      arr.push(entry);
      byKey.set(key, arr);
    }
    return FOOTSTEP_RANGES
      .filter((r) => byKey.has(r.key))
      .map((r) => {
        const entries = byKey.get(r.key)!;
        return { key: r.key, label: r.label, emoji: r.emoji, entries, coverKey: entries[0].photos?.s3_key };
      });
  }, [activeChild, timeline]);

  const achievedKeys = new Set(groups.map((g) => g.key));
  const pendingRanges = FOOTSTEP_RANGES.filter((r) => !achievedKeys.has(r.key));

  const eventByType = new Map(eventMilestones.filter((m) => EVENT_TYPES.includes(m.type as any)).map((m) => [m.type, m]));

  if (!activeChild) {
    return (
      <SafeAreaView style={styles.empty}>
        <Text style={styles.emptyIcon}>🌱</Text>
        <Text style={styles.emptyTitle}>아직 아이 프로필이 없어요</Text>
        <Text style={styles.emptySubtext}>프로필 탭에서 아이를 등록하면{'\n'}특별한 순간들을 기록할 수 있어요</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{activeChild.name}의 발자국</Text>
      {isLoading ? (
        <MilestoneSkeletonList />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {groups.length > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>남긴 발자국</Text>
                <Text style={styles.sectionCount}>{groups.length}개</Text>
              </View>
              {groups.map((g) => <AlbumCard key={g.key} group={g} />)}
            </>
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionIcon}>🌱</Text>
              <Text style={styles.emptySectionText}>아직 남긴 발자국이 없어요</Text>
              <Text style={styles.emptySectionSub}>사진을 올리면 자동으로 기록돼요</Text>
            </View>
          )}

          {pendingRanges.length > 0 && (
            <>
              <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                <Text style={styles.sectionTitle}>앞으로의 발자국</Text>
              </View>
              {pendingRanges.map((r) => (
                <PendingRangeCard key={r.key} range={r} birthDate={activeChild.birth_date} />
              ))}
            </>
          )}

          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>특별한 순간</Text>
          </View>
          {EVENT_TYPES.map((type) => (
            <EventCard
              key={type}
              type={type}
              milestone={eventByType.get(type)}
              onRecord={setRecordingType}
            />
          ))}
        </ScrollView>
      )}

      <RecordModal
        visible={!!recordingType}
        type={recordingType}
        childId={activeChild.id}
        onClose={() => setRecordingType(null)}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['milestones', activeChild.id] });
          queryClient.invalidateQueries({ queryKey: ['timeline-album', activeChild.id] });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF8' },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', padding: 20, paddingBottom: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFDF8', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 10, textAlign: 'center' },
  emptySubtext: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 22 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#AAA', letterSpacing: 0.5 },
  sectionCount: {
    fontSize: 12, fontWeight: '600', color: '#E8735A',
    backgroundColor: '#FFF0ED', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },

  // 앨범 카드
  albumCard: {
    borderRadius: 20, overflow: 'hidden', marginBottom: 16,
    backgroundColor: '#1A1A1A',
    shadowColor: '#1A1A1A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 5,
  },
  albumImage: { width: '100%', height: SCREEN_W * 0.55 },
  albumImagePlaceholder: {
    width: '100%', height: SCREEN_W * 0.4,
    backgroundColor: '#FFF0ED', alignItems: 'center', justifyContent: 'center',
  },
  albumEmoji: { fontSize: 56 },
  albumOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  albumBody: {
    position: 'absolute', bottom: 52, left: 20, right: 20,
  },
  albumBadge: {
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 14, alignSelf: 'flex-start', marginBottom: 8,
  },
  albumBadgeText: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  albumCount: { fontSize: 15, fontWeight: '600', color: '#fff' },
  albumArrow: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingVertical: 12, alignItems: 'center',
  },
  albumArrowText: { fontSize: 13, color: '#fff', fontWeight: '600' },

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
  pendingDate: { fontSize: 13, color: '#BBBBBB', marginTop: 2 },
  pendingDateDone: { color: '#E8735A', fontWeight: '600' },
  ddayBadge: {
    backgroundColor: '#FFF0ED', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  ddayBadgePast: { backgroundColor: '#F5F2EC' },
  ddayText: { fontSize: 14, fontWeight: '700', color: '#E8735A' },
  ddayTextPast: { color: '#BBBBBB' },

  recordBtn: {
    backgroundColor: '#E8735A', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  recordBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  doneBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#E8735A', alignItems: 'center', justifyContent: 'center',
  },
  doneBadgeText: { fontSize: 16, color: '#fff', fontWeight: '700' },

  emptySection: { alignItems: 'center', paddingVertical: 40 },
  emptySectionIcon: { fontSize: 48, marginBottom: 12 },
  emptySectionText: { fontSize: 17, fontWeight: '600', color: '#555', marginBottom: 6 },
  emptySectionSub: { fontSize: 14, color: '#AAA' },

  // 모달
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16,
    alignItems: 'center',
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: '#E0DDD5', borderRadius: 2, marginBottom: 20,
  },
  modalEmoji: { fontSize: 48, marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 6, textAlign: 'center' },
  modalSub: { fontSize: 14, color: '#888', marginBottom: 8, textAlign: 'center' },
  datePicker: { width: '100%', marginBottom: 8 },
  dateDisplayBtn: {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: '#E8E4DC', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 15, marginBottom: 16, backgroundColor: '#FAFAF8',
  },
  dateDisplayText: { fontSize: 16, color: '#1A1A1A', fontWeight: '500' },
  dateDisplayIcon: { fontSize: 18 },
  saveBtn: {
    width: '100%', height: 52, backgroundColor: '#E8735A',
    borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  saveBtnDisabled: { backgroundColor: '#F0B9AD' },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cancelBtn: { paddingVertical: 8 },
  cancelBtnText: { fontSize: 15, color: '#BBBBBB' },
});
