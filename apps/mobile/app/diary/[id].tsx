import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, Image, Alert, TextInput,
} from 'react-native';
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
          <TouchableOpacity onPress={startEdit}>
            <Text style={styles.editBtn}>편집</Text>
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
            resizeMode="cover"
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
  photo: { width: '100%', height: 320 },
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
