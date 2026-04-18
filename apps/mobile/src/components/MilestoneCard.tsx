import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { getDday } from '../lib/utils/age';
import { MILESTONE_META } from '../lib/utils/milestone';

const S3_BASE = process.env.EXPO_PUBLIC_S3_BASE_URL ?? '';

interface Milestone {
  id?: string;
  type: string;
  date?: string;
  photo_id?: string;
  diary_id?: string;
  photos?: { s3_key: string };
  expectedDate?: string;
}

interface Props { milestone: Milestone }

export function MilestoneCard({ milestone }: Props) {
  const router = useRouter();
  const meta = MILESTONE_META[milestone.type] ?? { emoji: '⭐', label: milestone.type };
  const achieved = !!milestone.date;

  return (
    <TouchableOpacity
      style={[styles.card, !achieved && styles.cardPending]}
      onPress={() => achieved && milestone.diary_id && router.push(`/diary/${milestone.diary_id}`)}
      activeOpacity={achieved ? 0.8 : 1}
    >
      <Text style={styles.emoji}>{meta.emoji}</Text>
      <View style={styles.info}>
        <Text style={styles.label}>{meta.label}</Text>
        {achieved ? (
          <Text style={styles.date}>{milestone.date}</Text>
        ) : milestone.expectedDate ? (
          <Text style={styles.pending}>{getDday(milestone.expectedDate)} · {milestone.expectedDate}</Text>
        ) : (
          <Text style={styles.pending}>아직 기록되지 않음</Text>
        )}
      </View>
      {achieved && milestone.photos?.s3_key && (
        <Image
          source={{ uri: `${S3_BASE}/${milestone.photos.s3_key}` }}
          style={styles.thumb}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  cardPending: { opacity: 0.6 },
  emoji: { fontSize: 32, marginRight: 14 },
  info: { flex: 1 },
  label: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  date: { fontSize: 13, color: '#888' },
  pending: { fontSize: 13, color: '#AAA', fontStyle: 'italic' },
  thumb: { width: 52, height: 52, borderRadius: 8 },
});
