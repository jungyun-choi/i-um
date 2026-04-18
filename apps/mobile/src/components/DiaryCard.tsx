import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';

interface Props {
  entry: {
    id: string;
    content: string;
    milestone?: string;
    created_at: string;
    photos?: { id: string; s3_key: string; taken_at: string; location_name?: string };
  };
}

const S3_BASE = process.env.EXPO_PUBLIC_S3_BASE_URL ?? '';

export function DiaryCard({ entry }: Props) {
  const router = useRouter();
  const photo = entry.photos;
  const date = new Date(photo?.taken_at ?? entry.created_at);
  const dateStr = `${date.getMonth() + 1}월 ${date.getDate()}일`;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/diary/${entry.id}`)}
      activeOpacity={0.8}
    >
      {photo && (
        <Image
          source={{ uri: `${S3_BASE}/${photo.s3_key}` }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      <View style={styles.body}>
        <View style={styles.meta}>
          <Text style={styles.date}>{dateStr}</Text>
          {photo?.location_name && (
            <Text style={styles.location}> · {photo.location_name}</Text>
          )}
          {entry.milestone && <Text style={styles.badge}>🎉</Text>}
        </View>
        {entry.content ? (
          <Text style={styles.content} numberOfLines={3}>{entry.content}</Text>
        ) : (
          <Text style={styles.generating}>일기 생성 중...</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  image: { width: '100%', height: 220 },
  body: { padding: 16 },
  meta: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  date: { fontSize: 13, fontWeight: '600', color: '#888' },
  location: { fontSize: 13, color: '#AAA' },
  badge: { marginLeft: 'auto', fontSize: 16 },
  content: { fontSize: 15, color: '#333', lineHeight: 22 },
  generating: { fontSize: 14, color: '#AAA', fontStyle: 'italic' },
});
