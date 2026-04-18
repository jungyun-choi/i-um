import { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, ActivityIndicator, RefreshControl, Modal, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTimeline } from '../../src/hooks/useTimeline';
import { useChildStore } from '../../src/stores/childStore';
import { DiaryCard } from '../../src/components/DiaryCard';

export default function TimelineScreen() {
  const router = useRouter();
  const activeChild = useChildStore((s) => s.activeChild);
  const children = useChildStore((s) => s.children);
  const setActiveChild = useChildStore((s) => s.setActiveChild);
  const [showPicker, setShowPicker] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } =
    useTimeline(activeChild?.id);

  const entries = data?.pages.flatMap((p) => p.entries) ?? [];

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>이음</Text>
        <View style={styles.headerRight}>
          {children.length > 1 ? (
            <TouchableOpacity onPress={() => setShowPicker(true)}>
              <Text style={styles.childName}>{activeChild?.name} ▼</Text>
            </TouchableOpacity>
          ) : activeChild ? (
            <Text style={styles.childName}>{activeChild.name}</Text>
          ) : null}
          {activeChild && (
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={() => router.push('/upload')}
            >
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
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <DiaryCard entry={item} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator color="#E8735A" style={{ marginVertical: 16 }} /> : null
          }
        />
      )}

      <Modal visible={showPicker} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setShowPicker(false)}>
          <View style={styles.picker}>
            <Text style={styles.pickerTitle}>아이 선택</Text>
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={[styles.pickerItem, activeChild?.id === child.id && styles.pickerItemActive]}
                onPress={() => { setActiveChild(child); setShowPicker(false); }}
              >
                <Text style={[styles.pickerItemText, activeChild?.id === child.id && styles.pickerItemTextActive]}>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  appName: { fontSize: 24, fontWeight: '700', color: '#E8735A' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  childName: { fontSize: 15, color: '#555', fontWeight: '500' },
  uploadBtn: {
    backgroundColor: '#E8735A', width: 36, height: 36,
    borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  uploadBtnText: { color: '#fff', fontSize: 22, fontWeight: '400', lineHeight: 28 },
  list: { padding: 16 },
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
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  picker: {
    backgroundColor: '#FFFDF8', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40,
  },
  pickerTitle: { fontSize: 15, fontWeight: '600', color: '#888', marginBottom: 12, textAlign: 'center' },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F0EDE6',
  },
  pickerItemActive: {},
  pickerItemText: { fontSize: 17, color: '#333', flex: 1 },
  pickerItemTextActive: { color: '#E8735A', fontWeight: '600' },
  check: { fontSize: 18, color: '#E8735A' },
});
