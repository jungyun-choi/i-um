import { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Modal, ScrollView,
  ActivityIndicator, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../src/lib/api';
import { useChildStore } from '../src/stores/childStore';

interface Letter {
  id: string;
  year_month: string;
  content: string;
  created_at: string;
}

function formatYearMonth(yearMonth: string) {
  const [y, m] = yearMonth.split('-');
  return `${y}년 ${parseInt(m, 10)}월`;
}

function LetterModal({ letter, onClose }: { letter: Letter; onClose: () => void }) {
  async function handleShare() {
    await Share.share({
      message: `💌 ${formatYearMonth(letter.year_month)} 월간 레터\n\n${letter.content}\n\n📲 이음 앱으로 아이의 성장을 함께 기록해요`,
      title: `${formatYearMonth(letter.year_month)} 이음 월간 레터`,
    });
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.modalBack}>←</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{formatYearMonth(letter.year_month)} 레터</Text>
          <TouchableOpacity onPress={handleShare} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.modalShare}>공유</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalIcon}>💌</Text>
          <Text style={styles.modalYearMonth}>{formatYearMonth(letter.year_month)}</Text>
          <Text style={styles.modalText}>{letter.content}</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function LettersScreen() {
  const router = useRouter();
  const activeChild = useChildStore((s) => s.activeChild);
  const [selected, setSelected] = useState<Letter | null>(null);

  const { data: letters = [], isLoading } = useQuery<Letter[]>({
    queryKey: ['monthly-letters-all', activeChild?.id],
    queryFn: () => api.monthlyLetters.list(activeChild!.id),
    enabled: !!activeChild,
    staleTime: 1000 * 60 * 10,
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>월간 레터</Text>
        <View style={{ width: 32 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator color="#E8735A" style={{ marginTop: 60 }} />
      ) : letters.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💌</Text>
          <Text style={styles.emptyTitle}>아직 레터가 없어요</Text>
          <Text style={styles.emptyDesc}>매달 초 AI가 지난 달의 특별한 순간을{'\n'}편지로 써드려요</Text>
        </View>
      ) : (
        <FlatList
          data={letters}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => setSelected(item)}
              activeOpacity={0.85}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.cardIcon}>💌</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardMonth}>{formatYearMonth(item.year_month)}</Text>
                <Text style={styles.cardPreview} numberOfLines={2}>
                  {item.content}
                </Text>
              </View>
              <Text style={styles.cardChevron}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {selected && (
        <LetterModal letter={selected} onClose={() => setSelected(null)} />
      )}
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
  title: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },

  list: { padding: 16, gap: 12 },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 18, padding: 16,
    shadowColor: '#E8735A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  cardLeft: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#FEF3EC', alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  cardIcon: { fontSize: 22 },
  cardBody: { flex: 1 },
  cardMonth: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  cardPreview: { fontSize: 13, color: '#888', lineHeight: 18 },
  cardChevron: { fontSize: 20, color: '#CCC', marginLeft: 8 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 10 },
  emptyDesc: { fontSize: 14, color: '#AAA', textAlign: 'center', lineHeight: 22 },

  // modal
  modalContainer: { flex: 1, backgroundColor: '#FFFDF8' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0EDE6',
  },
  modalBack: { fontSize: 24, color: '#1A1A1A', width: 32 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  modalShare: { fontSize: 15, color: '#E8735A', fontWeight: '600', width: 32, textAlign: 'right' },
  modalContent: { padding: 28, alignItems: 'center' },
  modalIcon: { fontSize: 52, marginBottom: 12 },
  modalYearMonth: { fontSize: 16, fontWeight: '700', color: '#E8735A', marginBottom: 20 },
  modalText: { fontSize: 17, color: '#3A2E28', lineHeight: 30, width: '100%' },
});
