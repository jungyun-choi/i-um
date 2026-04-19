import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, type ViewStyle } from 'react-native';

interface SkeletonBoxProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

// Shared shimmer animation value — all skeletons on screen sync to the same pulse
let sharedAnim: Animated.Value | null = null;
let animationRef: Animated.CompositeAnimation | null = null;
let listenerCount = 0;

function getSharedAnim() {
  if (!sharedAnim) {
    sharedAnim = new Animated.Value(0);
  }
  return sharedAnim;
}

function startSharedAnimation() {
  if (animationRef) return;
  animationRef = Animated.loop(
    Animated.sequence([
      Animated.timing(getSharedAnim(), {
        toValue: 1,
        duration: 900,
        useNativeDriver: false,
      }),
      Animated.timing(getSharedAnim(), {
        toValue: 0,
        duration: 900,
        useNativeDriver: false,
      }),
    ]),
  );
  animationRef.start();
}

function stopSharedAnimation() {
  animationRef?.stop();
  animationRef = null;
  sharedAnim = null;
}

export function SkeletonBox({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonBoxProps) {
  const anim = getSharedAnim();

  useEffect(() => {
    listenerCount++;
    startSharedAnimation();
    return () => {
      listenerCount--;
      if (listenerCount === 0) stopSharedAnimation();
    };
  }, []);

  const bg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F0EDE6', '#E4E0D8'],
  });

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius, backgroundColor: bg },
        style,
      ]}
    />
  );
}

// Pre-composed skeletons for each screen

export function DiaryCardSkeleton() {
  return (
    <View style={styles.diaryCard}>
      <SkeletonBox height={180} borderRadius={16} style={styles.mb12} />
      <SkeletonBox width="60%" height={14} borderRadius={7} style={styles.mb8} />
      <SkeletonBox width="90%" height={12} borderRadius={6} style={styles.mb6} />
      <SkeletonBox width="75%" height={12} borderRadius={6} />
    </View>
  );
}

export function TimelineSkeletonList() {
  return (
    <View style={styles.container}>
      <SkeletonBox width="30%" height={13} borderRadius={6} style={styles.sectionLabel} />
      <DiaryCardSkeleton />
      <DiaryCardSkeleton />
      <SkeletonBox width="25%" height={13} borderRadius={6} style={styles.sectionLabel} />
      <DiaryCardSkeleton />
    </View>
  );
}

export function MilestoneSkeletonList() {
  return (
    <View style={styles.container}>
      <SkeletonBox width="40%" height={14} borderRadius={7} style={styles.sectionLabel} />
      <SkeletonBox height={SCREEN_CARD_H} borderRadius={20} style={styles.mb16} />
      <SkeletonBox width="40%" height={14} borderRadius={7} style={styles.sectionLabel} />
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.pendingRow}>
          <SkeletonBox width={48} height={48} borderRadius={24} />
          <View style={styles.pendingText}>
            <SkeletonBox width="50%" height={14} borderRadius={7} style={styles.mb6} />
            <SkeletonBox width="35%" height={11} borderRadius={5} />
          </View>
          <SkeletonBox width={60} height={28} borderRadius={10} />
        </View>
      ))}
    </View>
  );
}

export function ProfileSkeletonCard() {
  return (
    <View style={styles.container}>
      {/* 아이 카드 */}
      <View style={styles.profileCard}>
        <SkeletonBox width={64} height={64} borderRadius={32} />
        <View style={{ flex: 1 }}>
          <SkeletonBox width="40%" height={18} borderRadius={9} style={styles.mb8} />
          <SkeletonBox width="55%" height={13} borderRadius={6} />
        </View>
      </View>
      {/* 통계 */}
      <View style={styles.statsRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.statBox}>
            <SkeletonBox width={36} height={22} borderRadius={11} style={styles.mb6} />
            <SkeletonBox width={48} height={11} borderRadius={5} />
          </View>
        ))}
      </View>
    </View>
  );
}

const SCREEN_CARD_H = 180;

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 8 },
  mb6: { marginBottom: 6 },
  mb8: { marginBottom: 8 },
  mb12: { marginBottom: 12 },
  mb16: { marginBottom: 16 },
  sectionLabel: { marginBottom: 12, marginTop: 8 },
  diaryCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  pendingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10,
  },
  pendingText: { flex: 1 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderRadius: 20, padding: 20, marginBottom: 12,
  },
  statBox: { flex: 1, alignItems: 'center' },
});
