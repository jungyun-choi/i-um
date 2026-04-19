import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity, Dimensions, Modal,
  TextInput, KeyboardAvoidingView, Platform, Pressable, Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { api } from '../../src/lib/api';
import { useChildStore } from '../../src/stores/childStore';
import { MilestoneSkeletonList } from '../../src/components/Skeleton';
import { getDday, getAgeText } from '../../src/lib/utils/age';
import { getExpectedDate, MILESTONE_META } from '../../src/lib/utils/milestone';

const SCREEN_W = Dimensions.get('window').width;
const S3_BASE = process.env.EXPO_PUBLIC_S3_BASE_URL ?? '';
const EXPECTED_MILESTONES = Object.keys(MILESTONE_META);
const EVENT_TYPES = new Set(['first_word', 'first_step']);

function todayString() {
  return new Date().toISOString().split('T')[0];
}

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

interface PendingCardProps {
  milestone: MilestoneData;
  onRecord?: (type: string) => void;
}

function PendingCard({ milestone, onRecord }: PendingCardProps) {
  const meta = MILESTONE_META[milestone.type] ?? { emoji: '⭐', label: milestone.type };
  const dday = milestone.expectedDate ? getDday(milestone.expectedDate) : null;
  const isPast = milestone.expectedDate
    ? new Date(milestone.expectedDate) < new Date()
    : false;
  const isEvent = EVENT_TYPES.has(milestone.type);

  return (
    <View style={styles.pendingCard}>
      <View style={styles.pendingLeft}>
        <Text style={styles.pendingEmoji}>{meta.emoji}</Text>
        <View>
          <Text style={styles.pendingLabel}>{meta.label}</Text>
          {milestone.expectedDate ? (
            <Text style={styles.pendingDate}>{milestone.expectedDate}</Text>
          ) : (
            <Text style={styles.pendingDate}>언제 일어날지 몰라요</Text>
          )}
        </View>
      </View>
      {isEvent && onRecord ? (
        <TouchableOpacity style={styles.recordBtn} onPress={() => onRecord(milestone.type)} activeOpacity={0.75}>
          <Text style={styles.recordBtnText}>기록하기</Text>
        </TouchableOpacity>
      ) : dday ? (
        <View style={[styles.ddayBadge, isPast ? styles.ddayBadgePast : null]}>
          <Text style={[styles.ddayText, isPast ? styles.ddayTextPast : null]}>{dday}</Text>
        </View>
      ) : null}
    </View>
  );
}

interface RecordModalProps {
  visible: boolean;
  type: string | null;
  childId: string;
  onClose: () => void;
  onSaved: () => void;
}

function RecordModal({ visible, type, childId, onClose, onSaved }: RecordModalProps) {
  const [date, setDate] = useState(todayString());
  const [saving, setSaving] = useState(false);
  const meta = type ? (MILESTONE_META[type] ?? { emoji: '⭐', label: type }) : null;

  async function handleSave() {
    if (!type) return;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      Alert.alert('날짜 형식 오류', 'YYYY-MM-DD 형식으로 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      await api.milestones.create({ child_id: childId, type, date });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSaved();
      onClose();
    } catch (e: any) {
      const msg = e?.message ?? '저장에 실패했어요';
      Alert.alert('오류', msg === 'Milestone already recorded' ? '이미 기록된 마일스톤이에요.' : msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrapper}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          {meta && (
            <Text style={styles.modalEmoji}>{meta.emoji}</Text>
          )}
          <Text style={styles.modalTitle}>{meta?.label} 날짜를 입력해주세요</Text>
          <Text style={styles.modalSub}>아이가 처음으로 {meta?.label}을(를) 한 날이에요</Text>

          <TextInput
            style={styles.dateInput}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#CCC"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />

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
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function MilestonesScreen() {
  const activeChild = useChildStore((s) => s.activeChild);
  const queryClient = useQueryClient();
  const [recordingType, setRecordingType] = useState<string | null>(null);

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
        <MilestoneSkeletonList />
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
                <PendingCard
                  key={m.type}
                  milestone={m}
                  onRecord={setRecordingType}
                />
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

      <RecordModal
        visible={!!recordingType}
        type={recordingType}
        childId={activeChild.id}
        onClose={() => setRecordingType(null)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['milestones', activeChild.id] })}
      />
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
  pendingDate: { fontSize: 13, color: '#BBBBBB', marginTop: 2 },
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

  emptySection: { alignItems: 'center', paddingVertical: 40 },
  emptySectionIcon: { fontSize: 48, marginBottom: 12 },
  emptySectionText: { fontSize: 17, fontWeight: '600', color: '#555', marginBottom: 6 },
  emptySectionSub: { fontSize: 14, color: '#AAA' },

  // 기록 모달
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
  modalSub: { fontSize: 14, color: '#888', marginBottom: 24, textAlign: 'center' },
  dateInput: {
    width: '100%', height: 52, borderWidth: 1.5, borderColor: '#E8E4DC',
    borderRadius: 14, paddingHorizontal: 16, fontSize: 17, color: '#1A1A1A',
    textAlign: 'center', letterSpacing: 2, marginBottom: 16,
    backgroundColor: '#FAFAF8',
  },
  saveBtn: {
    width: '100%', height: 52, backgroundColor: '#E8735A',
    borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  saveBtnDisabled: { backgroundColor: '#F0B9AD' },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cancelBtn: { paddingVertical: 8 },
  cancelBtnText: { fontSize: 15, color: '#BBBBBB' },
});
