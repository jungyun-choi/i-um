import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Modal, Animated, Dimensions, Pressable,
} from 'react-native';
import { PaywallModal } from '../src/components/PaywallModal';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, uploadToS3 } from '../src/lib/api';
import { useChildStore } from '../src/stores/childStore';
import { useQueryClient } from '@tanstack/react-query';
import { PhotoGrid } from '../src/components/PhotoGrid';
import { DiaryGenerating } from '../src/components/DiaryGenerating';
import { useToast } from '../src/components/Toast';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_H } = Dimensions.get('window');

interface SelectedPhoto {
  uri: string;
  fileName: string;
  takenAt?: string;
  gpsLat?: number;
  gpsLng?: number;
}

type DiaryStyle = 'emotional' | 'factual';

interface DiaryResultBase {
  id: string;
  content: string;
  milestone: string | null;
}

interface DiaryResult extends DiaryResultBase {
  totalCount: number;
}

export default function UploadScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const activeChild = useChildStore((s) => s.activeChild);
  const { showToast } = useToast();
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [style, setStyle] = useState<DiaryStyle>('emotional');
  const [generatingText, setGeneratingText] = useState('');
  const [diaryResult, setDiaryResult] = useState<DiaryResult | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;

  // Auto-launch picker on mount for zero-friction entry
  useEffect(() => {
    pickPhotos();
  }, []);

  async function pickPhotos() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.85,
      exif: true,
    });
    if (result.canceled) {
      if (photos.length === 0) router.back();
      return;
    }
    const selected = await Promise.all(result.assets.map(async (a) => {
        const compressed = await ImageManipulator.manipulateAsync(
          a.uri,
          [{ resize: { width: 1024 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        const baseName = (a.fileName ?? `photo_${Date.now()}`).replace(/\.[^.]+$/, '');
        // GPS: iOS EXIF는 decimal degrees로 옴
        const rawLat = a.exif?.GPSLatitude as number | undefined;
        const rawLng = a.exif?.GPSLongitude as number | undefined;
        const latRef = a.exif?.GPSLatitudeRef as string | undefined;
        const lngRef = a.exif?.GPSLongitudeRef as string | undefined;
        const gpsLat = rawLat != null ? (latRef === 'S' ? -rawLat : rawLat) : undefined;
        const gpsLng = rawLng != null ? (lngRef === 'W' ? -rawLng : rawLng) : undefined;

        return {
          uri: compressed.uri,
          fileName: `${baseName}.jpg`,
          takenAt: (() => {
            const raw = a.exif?.DateTimeOriginal ?? a.exif?.DateTime;
            if (!raw) return undefined;
            try {
              return new Date(String(raw).replace(/(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')).toISOString();
            } catch { return undefined; }
          })(),
          gpsLat,
          gpsLng,
        };
      }));
      setPhotos(selected);
  }

  function pollDiary(photoId: string): Promise<DiaryResultBase> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const timer = setInterval(async () => {
        attempts++;
        try {
          const data = await api.photos.getDiary(photoId);
          if (data.status === 'done') {
            clearInterval(timer);
            resolve({ id: data.id, content: data.content, milestone: data.milestone ?? null });
          } else if (data.status === 'failed' || attempts > 60) {
            clearInterval(timer);
            reject(new Error('일기 생성에 실패했어요'));
          }
        } catch {
          clearInterval(timer);
          reject(new Error('일기 상태 확인 실패'));
        }
      }, 2000);
    });
  }

  function showDiaryModal(result: DiaryResult) {
    setDiaryResult(result);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }

  function closeDiaryModal() {
    Animated.timing(slideAnim, {
      toValue: SCREEN_H,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setDiaryResult(null);
      queryClient.invalidateQueries({ queryKey: ['timeline', activeChild?.id] });
      router.back();
    });
  }

  async function handleUpload() {
    if (!activeChild) { showToast('기록할 아이를 먼저 선택해주세요'); return; }
    if (photos.length === 0) { showToast('사진을 선택해주세요'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setUploading(true);
    setGeneratingText('사진 업로드 중...');
    try {
      const photoIds: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        setGeneratingText(photos.length > 1
          ? `사진 업로드 중... (${i + 1}/${photos.length})`
          : '사진 업로드 중...');
        const { upload_url, photo_id } = await api.photos.getUploadUrl({
          child_id: activeChild.id,
          filename: photo.fileName,
          taken_at: photo.takenAt,
          gps_lat: photo.gpsLat,
          gps_lng: photo.gpsLng,
        });
        await uploadToS3(upload_url, photo.uri);
        await api.photos.process(photo_id, { diary_style: style });
        photoIds.push(photo_id);
      }

      setGeneratingText('AI가 일기를 쓰는 중...');

      // Poll last photo's diary; others process in background
      const lastPhotoId = photoIds[photoIds.length - 1];
      const result = await pollDiary(lastPhotoId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showDiaryModal({ ...result, totalCount: photoIds.length });
      // First-diary push prompt — ask once, at the highest-motivation moment
      const asked = await AsyncStorage.getItem('push_prompt_shown');
      if (!asked) {
        await AsyncStorage.setItem('push_prompt_shown', '1');
        const { status } = await Notifications.getPermissionsAsync();
        if (status === 'undetermined') {
          await Notifications.requestPermissionsAsync();
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('monthly_limit_reached')) {
        setShowPaywall(true);
      } else {
        showToast(e instanceof Error ? e.message : '다시 시도해주세요.');
      }
    } finally {
      setUploading(false);
      setGeneratingText('');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>취소</Text>
        </TouchableOpacity>
        <Text style={styles.title}>사진 추가</Text>
        <View style={{ width: 40 }} />
      </View>

      {photos.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📷</Text>
          <Text style={styles.emptyText}>기록할 사진을 선택해주세요</Text>
          <TouchableOpacity style={styles.pickBtn} onPress={pickPhotos}>
            <Text style={styles.pickBtnText}>사진 선택하기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView>
            <PhotoGrid
              photos={photos}
              onRemove={(i) => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
            />
          </ScrollView>
          <View style={styles.footer}>
            {/* 일기 스타일 토글 */}
            <View style={styles.styleContainer}>
              <Text style={styles.styleLabel}>일기 스타일</Text>
              <View style={styles.stylePills}>
                <TouchableOpacity
                  style={[styles.pill, style === 'emotional' && styles.pillActive]}
                  onPress={() => setStyle('emotional')}
                >
                  <Text style={[styles.pillText, style === 'emotional' && styles.pillTextActive]}>
                    감성적
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pill, style === 'factual' && styles.pillActive]}
                  onPress={() => setStyle('factual')}
                >
                  <Text style={[styles.pillText, style === 'factual' && styles.pillTextActive]}>
                    사실 위주
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.addMoreBtn} onPress={pickPhotos}>
              <Text style={styles.addMoreText}>+ 더 추가</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.uploadBtn, uploading && styles.btnDisabled]}
              onPress={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <View style={styles.uploadingRow}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.uploadingText}>{generatingText}</Text>
                </View>
              ) : (
                <Text style={styles.uploadBtnText}>AI 일기 생성하기 ({photos.length}장)</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* AI 생성 풀스크린 오버레이 */}
      {uploading && generatingText.includes('AI가') && photos.length > 0 && (
        <View style={StyleSheet.absoluteFillObject}>
          <DiaryGenerating photoUri={photos[photos.length - 1].uri} />
        </View>
      )}

      {/* 일기 완성 모달 */}
      {diaryResult && (
        <Modal transparent animationType="none">
          <Pressable style={styles.backdrop} onPress={closeDiaryModal} />
          <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetEmoji}>✨</Text>
              <Text style={styles.sheetTitle}>
                {diaryResult.totalCount > 1
                  ? `${diaryResult.totalCount}개 일기가 생성됐어요!`
                  : '일기가 완성됐어요!'}
              </Text>
              {diaryResult.totalCount > 1 && (
                <Text style={styles.sheetSubtitle}>마지막 일기 미리보기예요</Text>
              )}
              {diaryResult.milestone && (
                <View style={styles.milestoneBadge}>
                  <Text style={styles.milestoneText}>🎉 {diaryResult.milestone}</Text>
                </View>
              )}
            </View>
            <ScrollView style={styles.diaryScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.diaryContent}>{diaryResult.content}</Text>
            </ScrollView>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.confirmBtnSecondary} onPress={closeDiaryModal}>
                <Text style={styles.confirmBtnSecondaryText}>타임라인</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => {
                  closeDiaryModal();
                  if (diaryResult.totalCount > 1) {
                    // Multiple diaries — go to timeline to see all
                  } else if (diaryResult?.id) {
                    router.push(`/diary/${diaryResult.id}`);
                  }
                }}
              >
                <Text style={styles.confirmBtnText}>
                  {diaryResult.totalCount > 1 ? '타임라인에서 모두 보기 →' : '일기 바로 보기 →'}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.addMoreBtn}
              onPress={() => {
                setDiaryResult(null);
                setPhotos([]);
                slideAnim.setValue(SCREEN_H);
                queryClient.invalidateQueries({ queryKey: ['timeline', activeChild?.id] });
                pickPhotos();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.addMoreBtnText}>📸 또 다른 순간 기록하기</Text>
            </TouchableOpacity>
          </Animated.View>
        </Modal>
      )}

      <PaywallModal visible={showPaywall} onClose={() => { setShowPaywall(false); router.back(); }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF8' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0EDE6',
  },
  cancel: { fontSize: 16, color: '#888' },
  title: { fontSize: 17, fontWeight: '600', color: '#1A1A1A' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyIcon: { fontSize: 64 },
  emptyText: { fontSize: 18, color: '#888' },
  pickBtn: {
    backgroundColor: '#E8735A', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 28,
  },
  pickBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { padding: 16, gap: 12 },
  styleContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 4,
  },
  styleLabel: { fontSize: 14, color: '#555', fontWeight: '500' },
  stylePills: { flexDirection: 'row', gap: 8 },
  pill: {
    paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20,
    backgroundColor: '#F0EDE6', borderWidth: 1, borderColor: 'transparent',
  },
  pillActive: { backgroundColor: '#FFF0EC', borderColor: '#E8735A' },
  pillText: { fontSize: 14, color: '#888', fontWeight: '500' },
  pillTextActive: { color: '#E8735A' },
  addMoreBtn: {
    backgroundColor: '#F5F2EC', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  addMoreText: { fontSize: 15, color: '#888' },
  uploadBtn: {
    backgroundColor: '#E8735A', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  uploadBtnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  uploadingText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  // Modal
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFDF8', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 40, maxHeight: SCREEN_H * 0.75,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDD',
    alignSelf: 'center', marginTop: 12, marginBottom: 20,
  },
  sheetHeader: { alignItems: 'center', gap: 6, marginBottom: 20 },
  sheetEmoji: { fontSize: 40 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  sheetSubtitle: { fontSize: 13, color: '#AAA', marginTop: 2 },
  milestoneBadge: {
    backgroundColor: '#FFF0EC', borderRadius: 20,
    paddingVertical: 4, paddingHorizontal: 14, marginTop: 4,
  },
  milestoneText: { fontSize: 13, color: '#E8735A', fontWeight: '600' },
  diaryScroll: { marginBottom: 20 },
  diaryContent: {
    fontSize: 16, lineHeight: 26, color: '#333',
    backgroundColor: '#F9F6F0', borderRadius: 16, padding: 20,
  },
  modalBtnRow: { flexDirection: 'row', gap: 10 },
  confirmBtnSecondary: {
    flex: 1, backgroundColor: '#F0EDE6', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  confirmBtnSecondaryText: { color: '#888', fontSize: 15, fontWeight: '600' },
  addMoreBtnText: { fontSize: 14, color: '#E8735A', fontWeight: '500' },
  confirmBtn: {
    flex: 2, backgroundColor: '#E8735A', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
