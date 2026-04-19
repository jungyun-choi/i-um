import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Image } from 'expo-image';

const SCREEN_W = Dimensions.get('window').width;

const MESSAGES = [
  '사진 속 표정을 읽고 있어요',
  '오늘의 감정을 느끼는 중이에요',
  '소중한 순간을 글로 담는 중이에요',
  '아이의 하루를 기억하고 있어요',
  '따뜻한 문장을 고르는 중이에요',
  '이 순간을 오래 기억할 수 있도록',
];

interface Props {
  photoUri?: string;
}

export function DiaryGenerating({ photoUri }: Props) {
  const [msgIndex, setMsgIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;
  const bgScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const cycle = () => {
      Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
        setMsgIndex((i) => (i + 1) % MESSAGES.length);
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      });
    };
    const timer = setInterval(cycle, 2500);
    return () => clearInterval(timer);
  }, []);

  // Ken Burns effect — slow cinematic zoom on background photo
  useEffect(() => {
    if (!photoUri) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgScale, { toValue: 1.08, duration: 8000, useNativeDriver: true }),
        Animated.timing(bgScale, { toValue: 1.0, duration: 8000, useNativeDriver: true }),
      ])
    ).start();
  }, [photoUri]);

  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: -7, duration: 350, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 350, useNativeDriver: true }),
          Animated.delay(700),
        ])
      );
    const a1 = bounce(dot1, 0);
    const a2 = bounce(dot2, 150);
    const a3 = bounce(dot3, 300);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  if (photoUri) {
    return (
      <View style={styles.photoContainer}>
        <Animated.View style={[styles.photoBg, { transform: [{ scale: bgScale }] }]}>
          <Image
            source={photoUri}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            blurRadius={3}
          />
        </Animated.View>
        <View style={styles.photoOverlay} />
        <View style={styles.photoContent}>
          <View style={styles.dotsRow}>
            {([dot1, dot2, dot3] as Animated.Value[]).map((d, i) => (
              <Animated.View key={i} style={[styles.dotLight, { transform: [{ translateY: d }] }]} />
            ))}
          </View>
          <Animated.Text style={[styles.textLight, { opacity }]}>
            {MESSAGES[msgIndex]}
          </Animated.Text>
          <Text style={styles.subLight}>잠깐이면 돼요 ☕️</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconBubble}>
        <Text style={styles.iconEmoji}>✨</Text>
      </View>
      <View style={styles.dotsRow}>
        {([dot1, dot2, dot3] as Animated.Value[]).map((d, i) => (
          <Animated.View key={i} style={[styles.dot, { transform: [{ translateY: d }] }]} />
        ))}
      </View>
      <Animated.Text style={[styles.text, { opacity }]}>
        {MESSAGES[msgIndex]}
      </Animated.Text>
      <Text style={styles.sub}>잠깐이면 돼요 ☕️</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 16, padding: 32, backgroundColor: '#FFFDF8',
  },
  iconBubble: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FFF0ED', alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  iconEmoji: { fontSize: 34 },
  dotsRow: { flexDirection: 'row', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E8735A' },
  text: { fontSize: 18, fontWeight: '600', color: '#333', textAlign: 'center', lineHeight: 26 },
  sub: { fontSize: 14, color: '#BBBBBB', textAlign: 'center' },

  // Photo background variant
  photoContainer: { flex: 1, width: SCREEN_W },
  photoBg: { ...StyleSheet.absoluteFillObject },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26,10,5,0.60)',
  },
  photoContent: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 20, paddingHorizontal: 36,
  },
  dotLight: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.75)' },
  textLight: {
    fontSize: 19, fontWeight: '600', color: '#fff',
    textAlign: 'center', lineHeight: 28,
  },
  subLight: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
});
