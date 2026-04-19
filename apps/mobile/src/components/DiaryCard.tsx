import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { toKSTDateStr } from '../lib/utils/date';

const CARD_IMAGE_H = Dimensions.get('window').width * 0.78;

interface Props {
  entry: {
    id: string;
    content: string;
    milestone?: string | null;
    created_at: string;
    photos?: { id: string; s3_key: string; taken_at: string | null; location_name?: string | null } | null;
    status?: string;
  };
  allIds?: string;
}

const S3_BASE = process.env.EXPO_PUBLIC_S3_BASE_URL ?? '';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function DiaryCard({ entry, allIds }: Props) {
  const router = useRouter();
  const photo = entry.photos;
  const kstStr = toKSTDateStr(photo?.taken_at ?? entry.created_at);
  const date = new Date(kstStr + 'T00:00:00');
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = WEEKDAYS[date.getDay()];
  const dateStr = `${month}월 ${day}일 ${weekday}요일`;

  const isPending = entry.status === 'generating' || entry.status === 'pending';
  const isFailed = entry.status === 'failed';
  const isTextOnly = !photo?.s3_key;

  if (isTextOnly) {
    return (
      <TouchableOpacity
        style={styles.textCard}
        onPress={() => router.push(allIds ? `/diary/${entry.id}?ids=${allIds}` : `/diary/${entry.id}`)}
        activeOpacity={0.85}
      >
        <View style={styles.textCardInner}>
          <Text style={styles.quoteGlyph}>"</Text>
          {isPending ? (
            <Text style={styles.generating}>AI가 일기를 쓰고 있어요...</Text>
          ) : isFailed ? (
            <Text style={styles.failedText}>일기 생성에 실패했어요. 탭해서 다시 시도해보세요.</Text>
          ) : entry.content ? (
            <Text style={styles.textCardContent} numberOfLines={4}>{entry.content}</Text>
          ) : null}
          <View style={styles.textCardFooter}>
            <Text style={styles.textCardDate}>{dateStr}</Text>
            {entry.milestone && (
              <View style={styles.milestoneBadge}>
                <Text style={styles.milestoneText}>🎉 {entry.milestone}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(allIds ? `/diary/${entry.id}?ids=${allIds}` : `/diary/${entry.id}`)}
      activeOpacity={0.85}
    >
      <Image
        source={`${S3_BASE}/${photo!.s3_key}`}
        style={styles.image}
        contentFit="cover"
        cachePolicy="disk"
        transition={200}
      />

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
        ) : isFailed ? (
          <Text style={styles.failedHint}>일기 생성 실패 — 탭해서 재시도</Text>
        ) : entry.content ? (
          <Text style={styles.content} numberOfLines={2}>{entry.content}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Photo diary card
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
  body: { padding: 16, paddingTop: 14, paddingBottom: 18 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  date: { fontSize: 13, fontWeight: '600', color: '#999', letterSpacing: 0.2 },
  location: { fontSize: 12, color: '#BBB', marginBottom: 8 },
  content: { fontSize: 15, color: '#444', lineHeight: 23, letterSpacing: 0.1 },
  generating: { fontSize: 14, color: '#C5C0B8', fontStyle: 'italic' },
  failedHint: { fontSize: 13, color: '#E8735A', fontStyle: 'italic', opacity: 0.8 },

  // Text-only diary card — journal entry style
  textCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  textCardInner: {
    backgroundColor: '#2C2420',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    minHeight: 140,
  },
  quoteGlyph: {
    fontSize: 52,
    color: 'rgba(232,115,90,0.35)',
    fontWeight: '700',
    lineHeight: 44,
    marginBottom: 4,
  },
  textCardContent: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 26,
    letterSpacing: 0.1,
    fontStyle: 'italic',
    flex: 1,
    marginBottom: 16,
  },
  textCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
    marginTop: 4,
  },
  textCardDate: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.45)', letterSpacing: 0.3 },
  failedText: { fontSize: 14, color: '#E8735A', fontStyle: 'italic', opacity: 0.85, marginBottom: 16 },

  // Shared
  milestoneBadge: {
    backgroundColor: '#FFF0ED', borderRadius: 12,
    paddingVertical: 3, paddingHorizontal: 10,
  },
  milestoneText: { fontSize: 11, fontWeight: '700', color: '#E8735A' },
});
