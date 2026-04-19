import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const MESSAGES = [
  '사진 속 표정을 읽고 있어요',
  '오늘의 감정을 느끼는 중이에요',
  '소중한 순간을 글로 담는 중이에요',
  '아이의 하루를 기억하고 있어요',
  '따뜻한 문장을 고르는 중이에요',
];

export function DiaryGenerating() {
  const [msgIndex, setMsgIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const cycle = () => {
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        setMsgIndex((i) => (i + 1) % MESSAGES.length);
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      });
    };
    const timer = setInterval(cycle, 2200);
    return () => clearInterval(timer);
  }, []);

  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      );
    const a1 = bounce(dot1, 0);
    const a2 = bounce(dot2, 150);
    const a3 = bounce(dot3, 300);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.dotsRow}>
        {([dot1, dot2, dot3] as Animated.Value[]).map((d, i) => (
          <Animated.View
            key={i}
            style={[styles.dot, { transform: [{ translateY: d }] }]}
          />
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, padding: 32 },
  dotsRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E8735A' },
  text: { fontSize: 17, fontWeight: '600', color: '#333', textAlign: 'center', lineHeight: 24 },
  sub: { fontSize: 14, color: '#BBBBBB', textAlign: 'center' },
});
