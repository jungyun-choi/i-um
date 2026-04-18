import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/lib/api';
import { useChildStore } from '../../src/stores/childStore';
import { MilestoneCard } from '../../src/components/MilestoneCard';
import { getExpectedDate, MILESTONE_META } from '../../src/lib/utils/milestone';

const EXPECTED_MILESTONES = Object.keys(MILESTONE_META);

export default function MilestonesScreen() {
  const activeChild = useChildStore((s) => s.activeChild);
  const { data: achieved = [], isLoading } = useQuery({
    queryKey: ['milestones', activeChild?.id],
    queryFn: () => api.milestones.list(activeChild!.id),
    enabled: !!activeChild,
  });

  if (!activeChild) {
    return (
      <SafeAreaView style={styles.empty}>
        <Text style={styles.emptyText}>아이 프로필이 없어요</Text>
      </SafeAreaView>
    );
  }

  const achievedTypes = new Set(achieved.map((m: { type: string }) => m.type));
  const pending = EXPECTED_MILESTONES
    .filter((type) => !achievedTypes.has(type))
    .map((type) => ({
      type,
      expectedDate: getExpectedDate(activeChild.birth_date, type),
    }));

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{activeChild.name}의 특별한 순간</Text>
      {isLoading ? (
        <ActivityIndicator color="#E8735A" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {achieved.map((m: { id: string; type: string }) => (
            <MilestoneCard key={m.id} milestone={m} />
          ))}
          {pending.map((m) => (
            <MilestoneCard key={m.type} milestone={m} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF8' },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', padding: 20, paddingBottom: 12 },
  list: { padding: 16, paddingTop: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFDF8' },
  emptyText: { fontSize: 16, color: '#888' },
});
