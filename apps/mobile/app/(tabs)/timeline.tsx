import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal,
  Pressable, ScrollView, type NativeScrollEvent, type NativeSyntheticEvent,
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

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } =
    useTimeline(activeChild?.id);

  const { data: latestLetter } = useQuery<MonthlyLetter | null>({
    queryKey: ['monthly-letter', activeChild?.id],
    queryFn: () => api.monthlyLetters.latest(activeChild!.id),
    enabled: !!activeChild,
    staleTime: 1000 * 60 * 60,
  });

  const entries = data?.pages.flatMap((p) => p.entries) ?? [];
  const sections = groupEntriesByMonth(entries);
  const allIds = entries.map((e) => e.id).join(',');

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
      <SafeAreaView style={styles.empty}>
        <Text style={styles.emptyTitle}>아직 아이가 없어요</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/child/new')}>
          <Text style={styles.addBtnText}>아이 프로필 만들기</Text>
        </TouchableOpacity>
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
            <Text style={styles.childName}>{activeChild.name}</Text>
          ) : null}
          {activeChild && (
            <TouchableOpacity style={styles.uploadBtn} onPress={() => router.push('/upload')}>
              <Text style={styles.uploadBtnText}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color="#E8735A" />
      ) : entries.length === 0 ? (
        <View style={styles.emptyFeed}>
          <Text style={styles.emptyTitle}>아직 기록이 없어요</Text>
          <Text style={styles.emptyText}>첫 사진을 업로드해보세요</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/upload')}>
            <Text style={styles.addBtnText}>사진 추가하기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
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
  uploadBtn: {
    backgroundColor: '#E8735A', width: 36, height: 36,
    borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  uploadBtnText: { color: '#fff', fontSize: 22, fontWeight: '400', lineHeight: 28 },

  sectionHeader: {
    backgroundColor: '#FFFDF8',
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: '#F0EDE6',
  },
  sectionHeaderText: { fontSize: 13, fontWeight: '600', color: '#AAA', letterSpacing: 0.5 },
  scrollView: { flex: 1 },
  list: { paddingBottom: 32, paddingHorizontal: 16, paddingTop: 8 },
  loader: { marginTop: 60 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFDF8', padding: 32 },
  emptyFeed: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#333', marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#888', marginBottom: 24 },
  addBtn: {
    backgroundColor: '#E8735A', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 28, alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

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
