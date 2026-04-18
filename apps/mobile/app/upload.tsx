import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  SafeAreaView, Image, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { api, uploadToS3 } from '../src/lib/api';
import { useChildStore } from '../src/stores/childStore';
import { useQueryClient } from '@tanstack/react-query';

interface SelectedPhoto {
  uri: string;
  fileName: string;
  takenAt?: string;
}

export default function UploadScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const activeChild = useChildStore((s) => s.activeChild);
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);

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
    if (!result.canceled) {
      const selected = result.assets.map((a) => ({
        uri: a.uri,
        fileName: a.fileName ?? `photo_${Date.now()}.jpg`,
        takenAt: a.exif?.DateTimeOriginal
          ? new Date(a.exif.DateTimeOriginal.replace(/(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')).toISOString()
          : undefined,
      }));
      setPhotos(selected);
    }
  }

  async function handleUpload() {
    if (!activeChild || photos.length === 0) return;
    setUploading(true);
    try {
      for (const photo of photos) {
        const { upload_url, photo_id } = await api.photos.getUploadUrl({
          child_id: activeChild.id,
          filename: photo.fileName,
          taken_at: photo.takenAt,
        });
        await uploadToS3(upload_url, photo.uri);
        await api.photos.process(photo_id);
      }
      queryClient.invalidateQueries({ queryKey: ['timeline', activeChild.id] });
      router.back();
    } catch (e: unknown) {
      Alert.alert('업로드 실패', e instanceof Error ? e.message : '다시 시도해주세요.');
    } finally {
      setUploading(false);
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
          <Text style={styles.emptyText}>사진을 선택하세요</Text>
          <TouchableOpacity style={styles.pickBtn} onPress={pickPhotos}>
            <Text style={styles.pickBtnText}>사진 라이브러리 열기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={photos}
            keyExtractor={(_, i) => String(i)}
            numColumns={3}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => (
              <Image source={{ uri: item.uri }} style={styles.thumb} />
            )}
          />
          <View style={styles.footer}>
            <TouchableOpacity style={styles.addMoreBtn} onPress={pickPhotos}>
              <Text style={styles.addMoreText}>+ 더 추가</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.uploadBtn, uploading && styles.btnDisabled]}
              onPress={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.uploadBtnText}>AI 일기 생성하기 ({photos.length}장)</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
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
  grid: { padding: 2 },
  thumb: { width: '33.33%', aspectRatio: 1, padding: 2, borderRadius: 4 },
  footer: { padding: 16, gap: 12 },
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
});
