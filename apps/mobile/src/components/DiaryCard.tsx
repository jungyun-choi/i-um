import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

const CARD_IMAGE_H = Dimensions.get('window').width * 0.62;

interface Props {
  entry: {
    id: string;
    content: string;
    milestone?: string | null;
    created_at: string;
    photos?: { id: string; s3_key: string; taken_at: string | null; location_name?: string | null } | null;
    status?: string;
  };
}

const S3_BASE = process.env.EXPO_PUBLIC_S3_BASE_URL ?? '';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function DiaryCard({ entry }: Props) {
  const router = useRouter();
  const photo = entry.photos;
  const date = new Date(photo?.taken_at ?? entry.created_at);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = WEEKDAYS[date.getDay()];
  const dateStr = `${month}월 ${day}일 ${weekday}요일`;

  const isPending = entry.status === 'generating' || entry.status === 'pending';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/diary/${entry.id}`)}
      activeOpacity={0.85}
    >
      {photo?.s3_key ? (
        <Image
          source={{ uri: `${S3_BASE}/${photo.s3_key}` }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder} />
      )}

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.date}>{dateStr}</Text>
          {entry.milestone && (
            <View style={styles.milestoneBadge}>
              <Text style={styles.milestoneText}>🎉 {entry.milestone}</Text>
            </View>
          )}
        </View>

        {photo?.location_name && (
          <Text style={styles.location}>📍 {photo.location_name}</Text>
        )}

        {isPending ? (
          <Text style={styles.generating}>AI가 일기를 쓰고 있어요...</Text>
        ) : entry.content ? (
          <Text style={styles.content} numberOfLines={2}>{entry.content}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  image: { width: '100%', height: CARD_IMAGE_H },
  imagePlaceholder: { width: '100%', height: 120, backgroundColor: '#F5F2EC' },
  body: { padding: 16, paddingTop: 14, paddingBottom: 18 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  date: { fontSize: 13, fontWeight: '600', color: '#999', letterSpacing: 0.2 },
  milestoneBadge: {
    backgroundColor: '#FFF0ED', borderRadius: 12,
    paddingVertical: 3, paddingHorizontal: 10,
  },
  milestoneText: { fontSize: 11, fontWeight: '700', color: '#E8735A' },
  location: { fontSize: 12, color: '#BBB', marginBottom: 8 },
  content: { fontSize: 15, color: '#444', lineHeight: 23, letterSpacing: 0.1 },
  generating: { fontSize: 14, color: '#C5C0B8', fontStyle: 'italic' },
});
