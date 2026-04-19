import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

const W = Dimensions.get('window').width;
const S3_BASE = process.env.EXPO_PUBLIC_S3_BASE_URL ?? '';

interface Entry {
  id: string;
  content: string;
  created_at: string;
  photos?: { s3_key: string; taken_at: string | null; location_name?: string | null } | null;
}

interface Props {
  entry: Entry;
  yearsAgo: number;
}

export function MemoryCard({ entry, yearsAgo }: Props) {
  const router = useRouter();
  const photo = entry.photos;
  const date = new Date(photo?.taken_at ?? entry.created_at);
  const label = `${yearsAgo}년 전 오늘`;

  return (
    <TouchableOpacity
      style={styles.wrapper}
      onPress={() => router.push(`/diary/${entry.id}`)}
      activeOpacity={0.85}
    >
      <View style={styles.labelRow}>
        <Text style={styles.labelIcon}>✨</Text>
        <Text style={styles.label}>{label}</Text>
      </View>

      <View style={styles.card}>
        {photo?.s3_key && (
          <Image
            source={{ uri: `${S3_BASE}/${photo.s3_key}` }}
            style={styles.image}
            resizeMode="cover"
          />
        )}
        <View style={styles.overlay} />
        <View style={styles.textBox}>
          <Text style={styles.dateText}>
            {date.getFullYear()}년 {date.getMonth() + 1}월 {date.getDate()}일
          </Text>
          {entry.content ? (
            <Text style={styles.excerpt} numberOfLines={2}>{entry.content}</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 24, marginTop: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, paddingHorizontal: 2 },
  labelIcon: { fontSize: 15 },
  label: { fontSize: 13, fontWeight: '700', color: '#E8735A', letterSpacing: 0.3 },
  card: {
    borderRadius: 20, overflow: 'hidden',
    height: W * 0.52,
    shadowColor: '#1A1A1A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 5,
  },
  image: { ...StyleSheet.absoluteFillObject },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  textBox: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 20, paddingBottom: 22,
  },
  dateText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.75)', marginBottom: 6, letterSpacing: 0.3 },
  excerpt: { fontSize: 15, color: '#fff', lineHeight: 22, fontWeight: '500' },
});
