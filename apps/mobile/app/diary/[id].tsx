import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, Image, Alert, TextInput, Dimensions,
} from 'react-native';

const SCREEN_W = Dimensions.get('window').width;
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../src/lib/api';
import { useDiaryGeneration } from '../../src/hooks/useDiaryGeneration';
import { DiaryGenerating } from '../../src/components/DiaryGenerating';

const S3_BASE = process.env.EXPO_PUBLIC_S3_BASE_URL ?? '';

export default function DiaryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const { data: diary, isLoading } = useQuery({
    queryKey: ['diary', id],
    queryFn: () => api.diary.get(id),
    enabled: !!id,
  });

  const { diary: polledDiary } = useDiaryGeneration(
    diary?.status !== 'done' && diary?.status !== 'failed' ? diary?.photos?.id ?? '' : ''
  );

  const current = polledDiary?.status === 'done' ? polledDiary : diary;

  const updateMutation = useMutation({
    mutationFn: (content: string) => api.diary.update(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diary', id] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      setEditing(false);
    },
    onError: () => Alert.alert('저장 실패', '다시 시도해주세요.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.diary.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      router.back();
    },
    onError: () => Alert.alert('삭제 실패', '다시 시도해주세요.'),
  });

  function confirmDelete() {
    Alert.alert('일기 삭제', '이 일기를 삭제할까요? 사진도 함께 삭제됩니다.', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  }

  function showOptions() {
    Alert.alert('', '', [
      { text: '편집', onPress: startEdit },
      { text: '삭제', style: 'destructive', onPress: confirmDelete },
      { text: '취소', style: 'cancel' },
    ]);
  }

  if (isLoading || !current) {
    return <DiaryGenerating />;
  }

  if (current.status === 'generating' || current.status === 'pending') {
    return <DiaryGenerating />;
  }

  const photo = current.photos;
  const date = photo?.taken_at ? new Date(photo.taken_at) : new Date(current.created_at);
  const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

  function startEdit() {
    setDraft(current?.content ?? '');
    setEditing(true);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.date}>{dateStr}</Text>
        {!editing && (
          <TouchableOpacity onPress={showOptions} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.editBtn}>···</Text>
          </TouchableOpacity>
        )}
        {editing && (
          <TouchableOpacity onPress={() => updateMutation.mutate(draft)} disabled={updateMutation.isPending}>
            <Text style={styles.saveBtn}>{updateMutation.isPending ? '저장 중' : '저장'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView>
        {photo?.s3_key && (
          <Image
            source={{ uri: `${S3_BASE}/${photo.s3_key}` }}
            style={styles.photo}
            resizeMode="contain"
            onLoad={(e) => {
              const { width, height } = e.nativeEvent.source;
              if (width && height) {
                const ratio = height / width;
                e.target.setNativeProps({ style: { height: SCREEN_W * ratio } });
              }
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
            <TextInput
              style={styles.editor}
              value={draft}
              onChangeText={setDraft}
              multiline
              autoFocus
              placeholder="일기 내용을 입력하세요"
            />
          ) : current.status === 'failed' ? (
            <Text style={styles.failed}>일기 생성에 실패했습니다.</Text>
          ) : (
            <Text style={styles.content}>{current.content}</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF8' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0EDE6',
  },
  back: { fontSize: 24, color: '#1A1A1A' },
  date: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  editBtn: { fontSize: 16, color: '#E8735A' },
  saveBtn: { fontSize: 16, color: '#E8735A', fontWeight: '600' },
  photo: { width: SCREEN_W, height: SCREEN_W, backgroundColor: '#F5F2EC' },
  body: { padding: 20 },
  milestoneBadge: {
    fontSize: 16, fontWeight: '600', color: '#E8735A',
    backgroundColor: '#FFF0ED', borderRadius: 10, padding: 8,
    alignSelf: 'flex-start', marginBottom: 12,
  },
  location: { fontSize: 14, color: '#888', marginBottom: 16 },
  content: { fontSize: 17, color: '#333', lineHeight: 28 },
  editor: {
    fontSize: 17, color: '#333', lineHeight: 28,
    borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 12,
    padding: 14, minHeight: 200, textAlignVertical: 'top',
  },
  failed: { fontSize: 16, color: '#999', fontStyle: 'italic' },
});
