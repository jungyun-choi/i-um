import { Component, type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>😔</Text>
          <Text style={styles.title}>잠시 문제가 생겼어요</Text>
          <Text style={styles.desc}>앱을 다시 시작하거나{'\n'}아래 버튼을 눌러주세요</Text>
          <TouchableOpacity style={styles.btn} onPress={this.reset} activeOpacity={0.85}>
            <Text style={styles.btnText}>다시 시도하기</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#FFFDF8',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  emoji: { fontSize: 56, marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 10 },
  desc: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  btn: {
    backgroundColor: '#E8735A', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 40,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
