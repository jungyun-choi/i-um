import { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, TextInput, Dimensions, ActivityIndicator,
  FlatList, type ViewToken,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/lib/api';
import { useDiaryGeneration } from '../../src/hooks/useDiaryGeneration';
import { DiaryGenerating } from '../../src/components/DiaryGenerating';

const SCREEN_W = Dimensions.get('window').width;
const S3_BASE = process.env.EXPO_PUBLIC_S3_BASE_URL ?? '';

interface PageActions { startEdit: () => void; confirmDelete: () => void; }

// ─── 단일 페이지 ──────────────────────────────────────────────────────────────

function DiaryPage({
  diaryId,
  isActive,
  onDateChange,
  onEditingChange,
  onActionsReady,
}: {
  diaryId: string;
  isActive: boolean;
  onDateChange: (d: string) => void;
  onEditingChange: (v: boolean) => void;
  onActionsReady: (actions: PageActions) => void;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [imgRatio, setImgRatio] = useState(1);
  const [retrying, setRetrying] = useState(false);

  const { data: diary, isLoading } = useQuery({
    queryKey: ['diary', diaryId],
    queryFn: () => api.diary.get(diaryId),
    enabled: !!diaryId,
  });

  const { diary: polledDiary } = useDiaryGeneration(
    (diary?.status !== 'done' && diary?.status !== 'failed') || retrying
      ? diary?.photos?.id ?? '' : ''
  );

  const current = polledDiary?.status === 'done' ? polledDiary : diary;
  const photo = current?.photos;
  const date = photo?.taken_at ? new Date(photo.taken_at) : current ? new Date(current.created_at) : new Date();
  const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

  const updateMutation = useMutation({
    mutationFn: (content: string) => api.diary.update(diaryId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diary', diaryId] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      setEditing(false);
      onEditingChange(false);
    },
    onError: () => Alert.alert('저장 실패', '다시 시도해주세요.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.diary.delete(diaryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      router.back();
    },
    onError: () => Alert.alert('삭제 실패', '다시 시도해주세요.'),
  });

  function startEdit() {
    setDraft(current?.content ?? '');
    setEditing(true);
    onEditingChange(true);
  }

  function confirmDelete() {
    Alert.alert('일기 삭제', '이 일기를 삭제할까요? 사진도 함께 삭제됩니다.', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  }

  async function retryGeneration() {
    const photoId = current?.photos?.id;
    if (!photoId) return;
    try {
      setRetrying(true);
      await api.photos.process(photoId);
    } catch {
      setRetrying(false);
      Alert.alert('재시도 실패', '잠시 후 다시 시도해주세요.');
    }
  }

  // 활성 페이지가 되면 날짜·액션을 부모에 등록
  if (isActive) {
    if (current) onDateChange(dateStr);
    onActionsReady({ startEdit, confirmDelete });
  }

  if (isLoading || !current) {
    return <View style={{ width: SCREEN_W }}><DiaryGenerating /></View>;
  }
  if (current.status === 'generating' || current.status === 'pending' || retrying) {
    return <View style={{ width: SCREEN_W }}><DiaryGenerating /></View>;
  }

  return (
    <ScrollView style={{ width: SCREEN_W }} contentContainerStyle={styles.pageContent}>
      {photo?.s3_key && (
        <Image
          source={`${S3_BASE}/${photo.s3_key}`}
          style={{ width: SCREEN_W, height: SCREEN_W * imgRatio, backgroundColor: '#F5F2EC' }}
          contentFit="cover"
          cachePolicy="disk"
          transition={200}
          onLoad={(e) => {
            const { width, height } = e.source;
            if (width && height) setImgRatio(height / width);
          }}
        />
      )}

      <View style={styles.body}>
        {current.milestone && (
          <Text style={styles.milestoneBadge}>🎉 {current.milestone}</Text>
        )}
        {photo?.location_name && (
          <Text style={styles.location}>📍 {photo.location_name}</Text>
        )}

        {editing ? (
          <>
            <TextInput
              style={styles.editor}
              value={draft}
              onChangeText={setDraft}
              multiline
              autoFocus
              placeholder="일기 내용을 입력하세요"
            />
            <TouchableOpacity
              style={styles.saveFloatBtn}
              onPress={() => updateMutation.mutate(draft)}
              disabled={updateMutation.isPending}
            >
              <Text style={styles.saveFloatBtnText}>
                {updateMutation.isPending ? '저장 중...' : '저장'}
              </Text>
            </TouchableOpacity>
          </>
        ) : current.status === 'failed' ? (
          <View style={styles.failedBox}>
            <Text style={styles.failedIcon}>😔</Text>
            <Text style={styles.failedTitle}>일기 생성에 실패했어요</Text>
            <Text style={styles.failedDesc}>AI가 사진을 분석하는 중 문제가 생겼어요.{'\n'}다시 시도해볼까요?</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={retryGeneration} disabled={retrying}>
              {retrying ? <ActivityIndicator color="#fff" /> : <Text style={styles.retryBtnText}>다시 생성하기</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.content}>{current.content}</Text>
        )}
      </View>
    </ScrollView>
  );
}

// ─── 메인 화면 ────────────────────────────────────────────────────────────────

export default function DiaryDetailScreen() {
  const { id, ids } = useLocalSearchParams<{ id: string; ids?: string }>();
  const router = useRouter();

  const idList = ids ? ids.split(',') : [id];
  const initialIndex = Math.max(0, idList.indexOf(id));

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [currentDate, setCurrentDate] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const activeActionsRef = useRef<PageActions | null>(null);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) {
      setCurrentIndex(viewableItems[0].index);
      setIsEditing(false);
    }
  }, []);

  function showOptions() {
    const actions = activeActionsRef.current;
    if (!actions) return;
    Alert.alert('', '', [
      { text: '편집', onPress: actions.startEdit },
      { text: '삭제', style: 'destructive', onPress: actions.confirmDelete },
      { text: '취소', style: 'cancel' },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.date}>{currentDate}</Text>
          {idList.length > 1 && (
            <Text style={styles.pageIndicator}>{currentIndex + 1} / {idList.length}</Text>
          )}
        </View>
        {!isEditing ? (
          <TouchableOpacity onPress={showOptions} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.editBtn}>···</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 32 }} />
        )}
      </View>

      <FlatList
        data={idList}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({ length: SCREEN_W, offset: SCREEN_W * index, index })}
        scrollEnabled={!isEditing}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        keyExtractor={(item) => item}
        renderItem={({ item: diaryId, index }) => (
          <DiaryPage
            diaryId={diaryId}
            isActive={index === currentIndex}
            onDateChange={(d) => { if (index === currentIndex) setCurrentDate(d); }}
            onEditingChange={setIsEditing}
            onActionsReady={(actions) => { if (index === currentIndex) activeActionsRef.current = actions; }}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF8' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0EDE6',
  },
  back: { fontSize: 24, color: '#1A1A1A', width: 32 },
  headerCenter: { flex: 1, alignItems: 'center' },
  date: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  pageIndicator: { fontSize: 11, color: '#CCC', marginTop: 2 },
  editBtn: { fontSize: 18, color: '#E8735A', width: 32, textAlign: 'right' },
  pageContent: { paddingBottom: 60 },
  body: { padding: 20 },
  milestoneBadge: {
    fontSize: 15, fontWeight: '600', color: '#E8735A',
    backgroundColor: '#FFF0ED', borderRadius: 10, padding: 8,
    alignSelf: 'flex-start', marginBottom: 12,
  },
  location: { fontSize: 13, color: '#AAA', marginBottom: 16 },
  content: { fontSize: 17, color: '#333', lineHeight: 28 },
  editor: {
    fontSize: 17, color: '#333', lineHeight: 28,
    borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 12,
    padding: 14, minHeight: 200, textAlignVertical: 'top',
  },
  saveFloatBtn: {
    marginTop: 16, backgroundColor: '#E8735A',
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  saveFloatBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  failedBox: { alignItems: 'center', paddingVertical: 32 },
  failedIcon: { fontSize: 40, marginBottom: 12 },
  failedTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  failedDesc: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  retryBtn: {
    backgroundColor: '#E8735A', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 32, minWidth: 160, alignItems: 'center',
  },
  retryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
