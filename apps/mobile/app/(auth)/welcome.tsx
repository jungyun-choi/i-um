import { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, ScrollView, type NativeScrollEvent, type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const SCREEN_W = Dimensions.get('window').width;

const SLIDES = [
  {
    emoji: '📸',
    bg: '#FEF4EE',
    title: '사진 한 장으로\n충분해요',
    desc: '직접 쓸 필요 없어요\nAI가 감동적인 일기를 써드려요',
  },
  {
    emoji: '🎉',
    bg: '#F0F7FF',
    title: '특별한 순간을\n절대 잊지 않아요',
    desc: '백일, 첫걸음, 첫 대화\n자동으로 알려드려요',
  },
  {
    emoji: '💌',
    bg: '#F3FBEF',
    title: '매달 AI가\n편지를 써드려요',
    desc: '아이가 크면 함께 읽을\n소중한 타임캡슐이 돼요',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setActiveSlide(idx);
  }

  function goNext() {
    if (activeSlide < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (activeSlide + 1) * SCREEN_W, animated: true });
    } else {
      router.push('/(auth)/signup');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 로고 */}
      <View style={styles.logoRow}>
        <Text style={styles.logo}>이음</Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginLink}>로그인</Text>
        </TouchableOpacity>
      </View>

      {/* 슬라이드 */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.slider}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, { backgroundColor: slide.bg }]}>
            <Text style={styles.slideEmoji}>{slide.emoji}</Text>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideDesc}>{slide.desc}</Text>
          </View>
        ))}
      </ScrollView>

      {/* 도트 인디케이터 */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, activeSlide === i ? styles.dotActive : null]} />
        ))}
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.ctaBtn} onPress={goNext} activeOpacity={0.85}>
          <Text style={styles.ctaBtnText}>
            {activeSlide < SLIDES.length - 1 ? '다음' : '무료로 시작하기'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF8' },

  logoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4,
  },
  logo: { fontSize: 26, fontWeight: '700', color: '#E8735A' },
  loginLink: { fontSize: 15, color: '#888', fontWeight: '500' },

  slider: { flex: 1 },
  slide: {
    width: SCREEN_W, flex: 1,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40,
  },
  slideEmoji: { fontSize: 80, marginBottom: 28 },
  slideTitle: {
    fontSize: 28, fontWeight: '700', color: '#1A1A1A',
    textAlign: 'center', lineHeight: 40, marginBottom: 16,
  },
  slideDesc: {
    fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 26,
  },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#E0DDD5' },
  dotActive: { backgroundColor: '#E8735A', width: 20 },

  footer: { paddingHorizontal: 24, paddingBottom: 20 },
  ctaBtn: {
    backgroundColor: '#E8735A', borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
    shadowColor: '#E8735A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 4,
  },
  ctaBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
