import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export function DiaryGenerating() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#E8735A" />
      <Text style={styles.text}>AI가 일기를 쓰고 있어요...</Text>
      <Text style={styles.sub}>잠시만 기다려주세요</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  text: { fontSize: 18, fontWeight: '600', color: '#333', textAlign: 'center' },
  sub: { fontSize: 14, color: '#AAA', textAlign: 'center' },
});
