import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { api } from '../src/lib/api';
import { useChildStore } from '../src/stores/childStore';
import { useToast } from '../src/components/Toast';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const KST_OFFSET = 9 * 60 * 60 * 1000;

function todayKST(): Date {
  return new Date(Date.now() + KST_OFFSET);
}

function formatDateLabel(d: Date): string {
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const wd = WEEKDAYS[d.getUTCDay()];
  return `${year}년 ${month}월 ${day}일 ${wd}요일`;
}

function shiftDate(d: Date, delta: number): Date {
  return new Date(d.getTime() + delta * 24 * 60 * 60 * 1000);
}

export default function WriteScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const activeChild = useChildStore((s) => s.activeChild);
  const inputRef = useRef<TextInput>(null);

  const [date, setDate] = useState(todayKST());
  const [showPicker, setShowPicker] = useState(false);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const DRAFT_KEY = `diary_draft_${activeChild?.id ?? 'unknown'}`;

  // Load draft on mount
  useEffect(() => {
    AsyncStorage.getItem(DRAFT_KEY).then((saved) => {
      if (saved) setContent(saved);
    });
  }, [DRAFT_KEY]);

  // Autosave draft on content change
  useEffect(() => {
    if (!content) {
      AsyncStorage.removeItem(DRAFT_KEY);
    } else {
      AsyncStorage.setItem(DRAFT_KEY, content);
    }
  }, [content, DRAFT_KEY]);

  const today = todayKST();
  const isToday =
    date.getUTCFullYear() === today.getUTCFullYear() &&
    date.getUTCMonth() === today.getUTCMonth() &&
    date.getUTCDate() === today.getUTCDate();

  async function handleSave() {
    if (!activeChild) { showToast('아이를 먼저 선택해주세요'); return; }
    const trimmed = content.trim();
    if (!trimmed) { showToast('일기 내용을 입력해주세요'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      const dateStr = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
      await api.diary.create({
        child_id: activeChild.id,
        content: trimmed,
        date: dateStr,
      });
      await AsyncStorage.removeItem(DRAFT_KEY);
      queryClient.invalidateQueries({ queryKey: ['timeline', activeChild.id] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('일기를 저장했어요', 'success');
      router.back();
    } catch (e: any) {
      showToast(e?.message ?? '저장에 실패했어요');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    if (!content.trim()) { router.back(); return; }
    Alert.alert('작성 중인 일기가 있어요', '저장하지 않고 나갈까요?', [
      { text: '계속 쓰기', style: 'cancel' },
      { text: '나가기', style: 'destructive', onPress: () => router.back() },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={handleDiscard} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>일기 쓰기</Text>
        <TouchableOpacity
          style={[styles.saveBtn, (!content.trim() || saving) ? styles.saveBtnDisabled : null]}
          onPress={handleSave}
          disabled={!content.trim() || saving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>{saving ? '저장 중' : '저장'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 날짜 선택 */}
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateArrow}
              onPress={() => setDate(shiftDate(date, -1))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.dateArrowText}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateCenter} onPress={() => setShowPicker(true)} activeOpacity={0.7}>
              <Text style={styles.dateLabel}>{formatDateLabel(date)}</Text>
              {isToday
                ? <View style={styles.todayBadge}><Text style={styles.todayBadgeText}>오늘</Text></View>
                : <Text style={styles.dateTapHint}>탭해서 날짜 변경</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateArrow}
              onPress={() => { if (!isToday) setDate(shiftDate(date, 1)); }}
              disabled={isToday}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.dateArrowText, isToday ? styles.dateArrowTextDisabled : null]}>›</Text>
            </TouchableOpacity>
          </View>

          {/* iOS: 인라인 피커, Android: 탭 시 표시 */}
          {showPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={today}
              locale="ko"
              onChange={(_, selected) => {
                if (Platform.OS === 'android') setShowPicker(false);
                if (selected) setDate(selected);
              }}
              style={Platform.OS === 'ios' ? styles.iosPicker : undefined}
            />
          )}
          {showPicker && Platform.OS === 'ios' && (
            <TouchableOpacity style={styles.pickerDone} onPress={() => setShowPicker(false)}>
              <Text style={styles.pickerDoneText}>완료</Text>
            </TouchableOpacity>
          )}

          {/* 아이 이름 */}
          {activeChild && (
            <Text style={styles.childLabel}>{activeChild.name}의 하루</Text>
          )}

          {/* 텍스트 입력 영역 */}
          <TouchableOpacity
            style={styles.inputArea}
            activeOpacity={1}
            onPress={() => inputRef.current?.focus()}
          >
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={content}
              onChangeText={setContent}
              placeholder="오늘 기억하고 싶은 순간을 적어보세요..."
              placeholderTextColor="#C8C4BC"
              multiline
              textAlignVertical="top"
              autoFocus
              scrollEnabled={false}
            />
          </TouchableOpacity>

          {/* 글자 수 */}
          <Text style={[styles.charCount, content.length > 9000 ? styles.charCountWarn : null]}>
            {content.length}자{content.length > 9000 ? ` / 10,000` : ''}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF8' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0EDE6',
  },
  closeBtn: { padding: 4 },
  closeBtnText: { fontSize: 18, color: '#AAA', fontWeight: '400' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  saveBtn: {
    backgroundColor: '#E8735A', borderRadius: 20,
    paddingVertical: 8, paddingHorizontal: 18,
  },
  saveBtnDisabled: { backgroundColor: '#E8E4DC' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 },

  dateRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 20,
  },
  dateArrow: { padding: 8 },
  dateArrowText: { fontSize: 28, color: '#555', fontWeight: '300', lineHeight: 32 },
  dateArrowTextDisabled: { color: '#DDD' },
  dateCenter: { flex: 1, alignItems: 'center', gap: 6 },
  dateLabel: { fontSize: 16, fontWeight: '600', color: '#333' },
  dateTapHint: { fontSize: 11, color: '#BFBAB3' },
  todayBadge: {
    backgroundColor: '#FEF0EA', borderRadius: 10,
    paddingVertical: 3, paddingHorizontal: 10,
  },
  todayBadgeText: { fontSize: 11, fontWeight: '700', color: '#E8735A' },
  iosPicker: { height: 160 },
  pickerDone: {
    alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 16,
    marginBottom: 4,
  },
  pickerDoneText: { fontSize: 15, fontWeight: '600', color: '#E8735A' },

  childLabel: {
    fontSize: 13, fontWeight: '600', color: '#C0B8AE',
    marginBottom: 12, letterSpacing: 0.3,
  },

  inputArea: { flex: 1, minHeight: 320 },
  input: {
    fontSize: 16, color: '#2A2220', lineHeight: 28,
    minHeight: 320,
  },

  charCount: { fontSize: 12, color: '#C8C4BC', textAlign: 'right', marginTop: 8 },
  charCountWarn: { color: '#E8735A', fontWeight: '600' },
});
