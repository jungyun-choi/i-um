import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal,
  Pressable, ScrollView, Animated,
  type NativeScrollEvent, type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTimeline } from '../../src/hooks/useTimeline';
import { useChildStore } from '../../src/stores/childStore';
import { DiaryCard } from '../../src/components/DiaryCard';
import { MemoryCard } from '../../src/components/MemoryCard';
import { groupEntriesByMonth, formatMonthLabel } from '../../src/utils/groupByMonth';
import { api } from '../../src/lib/api';
import { TimelineSkeletonList } from '../../src/components/Skeleton';

interface MonthlyLetter {
  id: string;
  year_month: string;
  content: string;
  created_at: string;
}

function LetterCard({ letter, onPress }: { letter: MonthlyLetter; onPress: () => void }) {
  const [y, m] = letter.year_month.split('-');
  const label = `${y}년 ${parseInt(m, 10)}월 월간 레터`;
  const preview = letter.content.length > 60
    ? letter.content.slice(0, 60) + '…'
    : letter.content;

  return (
    <TouchableOpacity style={styles.letterCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.letterAccent} />
      <View style={styles.letterBody}>
        <View style={styles.letterTop}>
          <Text style={styles.letterIcon}>💌</Text>
          <Text style={styles.letterLabel}>{label}</Text>
        </View>
        <Text style={styles.letterPreview}>{preview}</Text>
        <Text style={styles.letterReadMore}>전체 읽기 →</Text>
      </View>
    </TouchableOpacity>
  );
}

function LetterModal({ letter, onClose }: { letter: MonthlyLetter; onClose: () => void }) {
  const [y, m] = letter.year_month.split('-');
  const label = `${y}년 ${parseInt(m, 10)}월 월간 레터`;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.letterModalContainer}>
        <View style={styles.letterModalHeader}>
          <Text style={styles.letterModalTitle}>{label}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.letterModalClose}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.letterModalContent}>
          <Text style={styles.letterModalIcon}>💌</Text>
          <Text style={styles.letterModalText}>{letter.content}</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function TimelineScreen() {
  const router = useRouter();
  const activeChild = useChildStore((s) => s.activeChild);
  const children = useChildStore((s) => s.children);
  const setActiveChild = useChildStore((s) => s.setActiveChild);
  const [showChildPicker, setShowChildPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerYear, setPickerYear] = useState('');
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const sectionViewRefs = useRef<Record<string, View | null>>({});

  const [showLetter, setShowLetter] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const fabAnim = useRef(new Animated.Value(0)).current;

  const [refreshing, setRefreshing] = useState(false);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } =
    useTimeline(activeChild?.id);

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  const { data: latestLetter } = useQuery<MonthlyLetter | null>({
    queryKey: ['monthly-letter', activeChild?.id],
    queryFn: () => api.monthlyLetters.latest(activeChild!.id),
    enabled: !!activeChild,
    staleTime: 1000 * 60 * 60,
  });

  const entries = data?.pages.flatMap((p) => p.entries) ?? [];
  const sections = groupEntriesByMonth(entries);
  const allIds = entries.map((e) => e.id).join(',');

  // 최근 7일 활동 — 리텐션 핵심 지표
  const weekActivity = (() => {
    const KST_OFFSET = 9 * 60 * 60 * 1000;
    const todayKST = new Date(Date.now() + KST_OFFSET);
    const days: { label: string; active: boolean; isToday: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayKST.getTime() - i * 24 * 60 * 60 * 1000);
      const ymd = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      const labels = ['일', '월', '화', '수', '목', '금', '토'];
      const label = i === 0 ? '오늘' : labels[d.getUTCDay()];
      const active = entries.some((e) => {
        const raw = e.photos?.taken_at ?? e.created_at;
        const entryKST = new Date(new Date(raw).getTime() + KST_OFFSET);
        const eymd = `${entryKST.getUTCFullYear()}-${String(entryKST.getUTCMonth() + 1).padStart(2, '0')}-${String(entryKST.getUTCDate()).padStart(2, '0')}`;
        return eymd === ymd;
      });
      days.push({ label, active, isToday: i === 0 });
    }
    return days;
  })();

  // "1년 전 오늘" 메모리 카드 계산
  const memoryEntry = (() => {
    const today = new Date();
    for (let yearsAgo = 1; yearsAgo <= 5; yearsAgo++) {
      const target = new Date(today.getFullYear() - yearsAgo, today.getMonth(), today.getDate());
      const found = entries.find((e) => {
        const d = new Date(e.photos?.taken_at ?? e.created_at);
        return (
          d.getFullYear() === target.getFullYear() &&
          d.getMonth() === target.getMonth() &&
          Math.abs(d.getDate() - target.getDate()) <= 2
        );
      });
      if (found) return { entry: found, yearsAgo };
    }
    return null;
  })();

  const monthsWithData = new Set(sections.map((s) => s.monthKey));
  const yearsAvailable = [...new Set(sections.map((s) => s.monthKey.slice(0, 4)))].sort();

  const currentMonth = activeMonth ?? sections[0]?.monthKey ?? '';
  const currentYear = currentMonth.slice(0, 4);

  function toggleFab() {
    const toValue = fabOpen ? 0 : 1;
    Animated.spring(fabAnim, { toValue, useNativeDriver: true, friction: 6, tension: 80 }).start();
    setFabOpen(!fabOpen);
  }

  function closeFab() {
    Animated.spring(fabAnim, { toValue: 0, useNativeDriver: true, friction: 6, tension: 80 }).start();
    setFabOpen(false);
  }

  function openDatePicker() {
    setPickerYear(currentYear || new Date().getFullYear().toString());
    setShowDatePicker(true);
  }

  function jumpToMonth(monthKey: string) {
    setActiveMonth(monthKey);
    setShowDatePicker(false);
    setTimeout(() => {
      const sectionView = sectionViewRefs.current[monthKey];
      if (sectionView && scrollRef.current) {
        sectionView.measureLayout(
          scrollRef.current as any,
          (_x, y) => scrollRef.current?.scrollTo({ y, animated: true }),
          () => {},
        );
      }
    }, 350);
  }

  // 스크롤 중 현재 보이는 월 추적
  const sectionYCache = useRef<Record<string, number>>({});

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const scrollY = e.nativeEvent.contentOffset.y;
    // infinite scroll
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 600) {
      if (hasNextPage && !isFetchingNextPage) fetchNextPage();
    }
    // 현재 섹션 추적
    let current = sections[0]?.monthKey ?? null;
    for (const section of sections) {
      const y = sectionYCache.current[section.monthKey];
      if (y != null && scrollY >= y - 60) current = section.monthKey;
    }
    if (current && current !== activeMonth) setActiveMonth(current);
  }

  if (!activeChild && children.length === 0) {
    return (
      <SafeAreaView style={styles.onboarding}>
        <View style={styles.onboardingHero}>
          <Text style={styles.onboardingLogo}>이음</Text>
          <Text style={styles.onboardingEmoji}>👶</Text>
          <Text style={styles.onboardingHeadline}>아이의 특별한 순간을{'\n'}기록할 준비가 됐어요</Text>
          <Text style={styles.onboardingSubtitle}>사진 한 장만 있으면 충분해요{'\n'}AI가 감동적인 일기로 남겨드려요</Text>
        </View>
        <View style={styles.onboardingFeatures}>
          {[
            { icon: '📸', text: '사진만 찍으면 일기가 완성돼요' },
            { icon: '🎉', text: '백일·돌·첫걸음 자동 알림' },
            { icon: '💌', text: '매달 AI가 편지를 써드려요' },
          ].map((f) => (
            <View key={f.text} style={styles.onboardingFeatureRow}>
              <Text style={styles.onboardingFeatureIcon}>{f.icon}</Text>
              <Text style={styles.onboardingFeatureText}>{f.text}</Text>
            </View>
          ))}
        </View>
        <View style={styles.onboardingFooter}>
          <TouchableOpacity style={styles.onboardingCTA} onPress={() => router.push('/child/new?from=onboarding')} activeOpacity={0.85}>
            <Text style={styles.onboardingCTAText}>시작하기</Text>
          </TouchableOpacity>
          <Text style={styles.onboardingHint}>1분이면 충분해요</Text>
        </View>
      </SafeAreaView>
    );
  }

  const yearIndex = yearsAvailable.indexOf(pickerYear);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>이음</Text>

        {/* 현재 달 표시 — 탭하면 피커 오픈 */}
        {sections.length > 0 ? (
          <TouchableOpacity style={styles.datePill} onPress={openDatePicker}>
            <Text style={styles.datePillText}>{formatMonthLabel(currentMonth)}</Text>
            <Text style={styles.datePillChevron}>▾</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.datePillPlaceholder} />
        )}

        <View style={styles.headerRight}>
          {children.length > 1 ? (
            <TouchableOpacity onPress={() => setShowChildPicker(true)}>
              <Text style={styles.childName}>{activeChild?.name} ▼</Text>
            </TouchableOpacity>
          ) : activeChild ? (
            <TouchableOpacity onPress={() => router.push(`/child/${activeChild.id}/edit`)}>
              <Text style={styles.childName}>{activeChild.name}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* 7일 활동 스트립 */}
      {entries.length > 0 && (
        <View style={styles.weekStrip}>
          {weekActivity.map((day, i) => (
            <View key={i} style={styles.weekDay}>
              <View style={[
                styles.weekDot,
                day.active ? styles.weekDotActive : null,
                day.isToday && !day.active ? styles.weekDotToday : null,
              ]} />
              <Text style={[styles.weekLabel, day.isToday ? styles.weekLabelToday : null]}>
                {day.label}
              </Text>
            </View>
          ))}
        </View>
      )}

      {isLoading ? (
        <TimelineSkeletonList />
      ) : entries.length === 0 ? (
        <View style={styles.emptyFeed}>
          <Text style={styles.emptyFeedEmoji}>📷</Text>
          <Text style={styles.emptyTitle}>{activeChild?.name}의 첫 기록을{'\n'}남겨볼까요?</Text>
          <Text style={styles.emptyText}>사진 한 장이면 AI가{'\n'}멋진 일기를 써드려요</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/upload')} activeOpacity={0.85}>
            <Text style={styles.addBtnText}>첫 사진 추가하기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#E8735A" />}
          onScroll={handleScroll}
          scrollEventThrottle={200}
        >
          {latestLetter && (
            <LetterCard letter={latestLetter} onPress={() => setShowLetter(true)} />
          )}
          {memoryEntry && (
            <MemoryCard entry={memoryEntry.entry} yearsAgo={memoryEntry.yearsAgo} />
          )}
          {sections.map((section) => (
            <View key={section.monthKey}>
              <View
                ref={(ref) => { sectionViewRefs.current[section.monthKey] = ref; }}
                onLayout={(e) => { sectionYCache.current[section.monthKey] = e.nativeEvent.layout.y; }}
                style={styles.sectionHeader}
              >
                <Text style={styles.sectionHeaderText}>{formatMonthLabel(section.monthKey)}</Text>
              </View>
              {section.data.map((item) => (
                <DiaryCard key={item.id} entry={item} allIds={allIds} />
              ))}
            </View>
          ))}
          {isFetchingNextPage && (
            <ActivityIndicator color="#E8735A" style={{ marginVertical: 16 }} />
          )}
        </ScrollView>
      )}

      {showLetter && latestLetter && (
        <LetterModal letter={latestLetter} onClose={() => setShowLetter(false)} />
      )}

      {/* 연/월 피커 시트 */}
      <Modal visible={showDatePicker} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowDatePicker(false)}>
          <Pressable style={styles.pickerSheet} onPress={() => {}}>
            {/* 연도 스위처 */}
            <View style={styles.yearRow}>
              <TouchableOpacity
                onPress={() => { if (yearIndex > 0) setPickerYear(yearsAvailable[yearIndex - 1]); }}
                style={styles.yearArrow}
                disabled={yearIndex <= 0}
              >
                <Text style={[styles.yearArrowText, yearIndex <= 0 ? styles.yearArrowDisabled : null]}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.yearLabel}>{pickerYear}년</Text>
              <TouchableOpacity
                onPress={() => { if (yearIndex < yearsAvailable.length - 1) setPickerYear(yearsAvailable[yearIndex + 1]); }}
                style={styles.yearArrow}
                disabled={yearIndex >= yearsAvailable.length - 1}
              >
                <Text style={[styles.yearArrowText, yearIndex >= yearsAvailable.length - 1 ? styles.yearArrowDisabled : null]}>›</Text>
              </TouchableOpacity>
            </View>

            {/* 월 그리드 */}
            <View style={styles.monthGrid}>
              {Array.from({ length: 12 }, (_, i) => {
                const monthNum = String(i + 1).padStart(2, '0');
                const monthKey = `${pickerYear}-${monthNum}`;
                const hasData = monthsWithData.has(monthKey);
                const isActive = currentMonth === monthKey;
                return (
                  <TouchableOpacity
                    key={monthKey}
                    style={styles.monthCell}
                    onPress={() => { if (hasData) jumpToMonth(monthKey); }}
                    disabled={!hasData}
                    activeOpacity={hasData ? 0.7 : 1}
                  >
                    <View style={[styles.monthCellInner, isActive ? styles.monthCellActive : null]}>
                      <Text style={[
                        styles.monthCellText,
                        isActive ? styles.monthCellTextActive : null,
                        !hasData ? styles.monthCellTextDisabled : null,
                      ]}>
                        {i + 1}월
                      </Text>
                    </View>
                    {hasData && !isActive && <View style={styles.monthDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* FAB — 콘텐츠 추가 (사진 일기 / 텍스트 일기) */}
      {activeChild && (
        <View style={styles.fabContainer} pointerEvents="box-none">
          {fabOpen && (
            <Pressable style={styles.fabBackdrop} onPress={closeFab} />
          )}
          {/* 서브 버튼: 텍스트 일기 */}
          <Animated.View style={[
            styles.fabSub,
            {
              opacity: fabAnim,
              transform: [{ translateY: fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -72] }) }],
            },
          ]} pointerEvents={fabOpen ? 'auto' : 'none'}>
            <TouchableOpacity
              style={styles.fabSubBtn}
              onPress={() => { closeFab(); router.push('/write'); }}
              activeOpacity={0.85}
            >
              <Text style={styles.fabSubIcon}>✏️</Text>
            </TouchableOpacity>
            <Text style={styles.fabSubLabel}>직접 쓰기</Text>
          </Animated.View>
          {/* 서브 버튼: 사진 일기 */}
          <Animated.View style={[
            styles.fabSub,
            {
              opacity: fabAnim,
              transform: [{ translateY: fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -136] }) }],
            },
          ]} pointerEvents={fabOpen ? 'auto' : 'none'}>
            <TouchableOpacity
              style={styles.fabSubBtn}
              onPress={() => { closeFab(); router.push('/upload'); }}
              activeOpacity={0.85}
            >
              <Text style={styles.fabSubIcon}>📸</Text>
            </TouchableOpacity>
            <Text style={styles.fabSubLabel}>사진으로</Text>
          </Animated.View>
          {/* 메인 FAB */}
          <TouchableOpacity style={styles.fab} onPress={toggleFab} activeOpacity={0.85}>
            <Animated.Text style={[
              styles.fabIcon,
              { transform: [{ rotate: fabAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] },
            ]}>+</Animated.Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 아이 선택 시트 */}
      <Modal visible={showChildPicker} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setShowChildPicker(false)}>
          <View style={styles.childSheet}>
            <Text style={styles.childSheetTitle}>아이 선택</Text>
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={[styles.childItem, activeChild?.id === child.id && styles.childItemActive]}
                onPress={() => { setActiveChild(child); setShowChildPicker(false); }}
              >
                <Text style={[styles.childItemText, activeChild?.id === child.id && styles.childItemTextActive]}>
                  {child.name}
                </Text>
                {activeChild?.id === child.id && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF8' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  appName: { fontSize: 24, fontWeight: '700', color: '#E8735A', flex: 1 },
  datePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingHorizontal: 12,
    backgroundColor: '#F5F2EC', borderRadius: 20,
  },
  datePillText: { fontSize: 14, fontWeight: '600', color: '#555' },
  datePillChevron: { fontSize: 11, color: '#AAA', marginTop: 1 },
  datePillPlaceholder: { width: 80 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, justifyContent: 'flex-end' },
  childName: { fontSize: 15, color: '#555', fontWeight: '500' },

  // 7일 활동 스트립
  weekStrip: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F0EDE6',
  },
  weekDay: { alignItems: 'center', gap: 4 },
  weekDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#EDE9E0',
  },
  weekDotActive: { backgroundColor: '#E8735A' },
  weekDotToday: { borderWidth: 1.5, borderColor: '#E8735A', backgroundColor: 'transparent' },
  weekLabel: { fontSize: 10, color: '#C8C4BC', fontWeight: '500' },
  weekLabelToday: { color: '#E8735A', fontWeight: '700' },

  // FAB
  fabContainer: {
    position: 'absolute', bottom: 24, right: 20,
    alignItems: 'center',
  },
  fabBackdrop: {
    position: 'absolute',
    top: -800, left: -400, right: -400, bottom: -80,
  },
  fab: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#E8735A',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#E8735A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  fabIcon: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
  fabSub: {
    position: 'absolute', bottom: 0, right: 0,
    alignItems: 'center', gap: 4,
  },
  fabSubBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1A1A1A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  fabSubIcon: { fontSize: 22 },
  fabSubLabel: { fontSize: 10, fontWeight: '600', color: '#888' },

  sectionHeader: {
    backgroundColor: '#FFFDF8',
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: '#F0EDE6',
  },
  sectionHeaderText: { fontSize: 13, fontWeight: '600', color: '#AAA', letterSpacing: 0.5 },
  scrollView: { flex: 1 },
  list: { paddingBottom: 32, paddingHorizontal: 16, paddingTop: 8 },
  loader: { marginTop: 60 },
  // 온보딩 (아이 없을 때)
  onboarding: { flex: 1, backgroundColor: '#FFFDF8' },
  onboardingHero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  onboardingLogo: { fontSize: 28, fontWeight: '700', color: '#E8735A', marginBottom: 16 },
  onboardingEmoji: { fontSize: 72, marginBottom: 20 },
  onboardingHeadline: {
    fontSize: 24, fontWeight: '700', color: '#1A1A1A',
    textAlign: 'center', lineHeight: 34, marginBottom: 12,
  },
  onboardingSubtitle: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 22 },
  onboardingFeatures: {
    paddingHorizontal: 32, paddingVertical: 20, gap: 12,
    borderTopWidth: 1, borderTopColor: '#F0EDE6',
  },
  onboardingFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  onboardingFeatureIcon: { fontSize: 22, width: 32, textAlign: 'center' },
  onboardingFeatureText: { fontSize: 14, color: '#555', flex: 1 },
  onboardingFooter: { padding: 24, gap: 10, alignItems: 'center' },
  onboardingCTA: {
    backgroundColor: '#E8735A', borderRadius: 16, width: '100%',
    paddingVertical: 18, alignItems: 'center',
    shadowColor: '#E8735A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 4,
  },
  onboardingCTAText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  onboardingHint: { fontSize: 13, color: '#BBB' },

  emptyFeed: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyFeedEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', lineHeight: 32, marginBottom: 10 },
  emptyText: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  addBtn: {
    backgroundColor: '#E8735A', borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 32, alignItems: 'center',
    shadowColor: '#E8735A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 4,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },

  // 연/월 피커
  pickerSheet: {
    backgroundColor: '#FFFDF8', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 8, paddingBottom: 40,
  },
  yearRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: 32,
  },
  yearArrow: { padding: 8 },
  yearArrowText: { fontSize: 28, color: '#333', fontWeight: '300' },
  yearArrowDisabled: { color: '#DDD' },
  yearLabel: { fontSize: 18, fontWeight: '700', color: '#222', minWidth: 72, textAlign: 'center' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingBottom: 8 },
  monthCell: { width: '25%', alignItems: 'center', paddingVertical: 10 },
  monthCellInner: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14 },
  monthCellActive: { backgroundColor: '#E8735A' },
  monthCellText: { fontSize: 15, fontWeight: '500', color: '#333' },
  monthCellTextActive: { color: '#fff' },
  monthCellTextDisabled: { color: '#D0CFC9' },
  monthDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#E8735A', marginTop: 2 },

  // 월간 레터 카드
  letterCard: {
    backgroundColor: '#FEF3EC',
    borderRadius: 16, marginBottom: 16,
    flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#E8735A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 2,
  },
  letterAccent: { width: 4, backgroundColor: '#E8735A' },
  letterBody: { flex: 1, padding: 16 },
  letterTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  letterIcon: { fontSize: 18 },
  letterLabel: { fontSize: 13, fontWeight: '700', color: '#C05A42', letterSpacing: 0.3 },
  letterPreview: { fontSize: 14, color: '#5A4A3A', lineHeight: 20, marginBottom: 8 },
  letterReadMore: { fontSize: 13, color: '#E8735A', fontWeight: '600' },

  // 월간 레터 모달
  letterModalContainer: { flex: 1, backgroundColor: '#FFFDF8' },
  letterModalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F0EDE6',
  },
  letterModalTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  letterModalClose: { fontSize: 18, color: '#AAA', fontWeight: '400' },
  letterModalContent: { padding: 24, alignItems: 'center' },
  letterModalIcon: { fontSize: 48, marginBottom: 20 },
  letterModalText: {
    fontSize: 16, color: '#3A2E28', lineHeight: 28,
    width: '100%',
  },

  // 아이 선택
  childSheet: {
    backgroundColor: '#FFFDF8', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40,
  },
  childSheetTitle: { fontSize: 15, fontWeight: '600', color: '#888', marginBottom: 12, textAlign: 'center' },
  childItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F0EDE6',
  },
  childItemActive: {},
  childItemText: { fontSize: 17, color: '#333', flex: 1 },
  childItemTextActive: { color: '#E8735A', fontWeight: '600' },
  check: { fontSize: 18, color: '#E8735A' },
});
