import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, Linking, Platform, AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';

type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<PermissionStatus>('undetermined');

  const checkPermission = useCallback(async () => {
    try {
      const { status: s } = await Notifications.getPermissionsAsync();
      setStatus(s as PermissionStatus);
    } catch {
      // Expo Go에서 미지원
    }
  }, []);

  useEffect(() => {
    checkPermission();
    // Re-check when user returns from OS settings
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkPermission();
    });
    return () => sub.remove();
  }, [checkPermission]);

  async function handleToggle(value: boolean) {
    if (value && status !== 'granted') {
      if (status === 'undetermined') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        setStatus(newStatus as PermissionStatus);
      } else {
        // denied → go to OS settings
        Linking.openSettings();
      }
    } else if (!value && status === 'granted') {
      Linking.openSettings();
    }
  }

  const isEnabled = status === 'granted';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>알림 설정</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* 권한 상태 카드 */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View>
            <Text style={styles.statusTitle}>이음 알림</Text>
            <Text style={styles.statusSub}>
              {isEnabled ? '알림이 켜져 있어요' : '알림이 꺼져 있어요'}
            </Text>
          </View>
          <Switch
            value={isEnabled}
            onValueChange={handleToggle}
            trackColor={{ false: '#E0DDD5', true: '#E8735A' }}
            thumbColor="#fff"
            ios_backgroundColor="#E0DDD5"
          />
        </View>
        {status === 'denied' && (
          <View style={styles.deniedNotice}>
            <Text style={styles.deniedText}>
              알림이 차단되어 있어요. 스위치를 켜면 기기 설정으로 이동해요.
            </Text>
          </View>
        )}
      </View>

      {/* 알림 종류 안내 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>받을 수 있는 알림</Text>
        {[
          { icon: '🎂', label: '백일 · 돌 · 생일 알림', desc: '아이의 특별한 날을 미리 알려드려요' },
          { icon: '✅', label: 'AI 일기 완성 알림', desc: '사진 분석이 끝나면 알려드려요' },
          { icon: '💌', label: '월간 레터 알림', desc: '매달 AI가 쓴 편지가 도착하면 알려드려요' },
        ].map((item) => (
          <View key={item.label} style={styles.notifRow}>
            <Text style={styles.notifIcon}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.notifLabel}>{item.label}</Text>
              <Text style={styles.notifDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {Platform.OS === 'ios' && status !== 'undetermined' && (
        <TouchableOpacity style={styles.settingsLink} onPress={() => Linking.openSettings()}>
          <Text style={styles.settingsLinkText}>iPhone 설정에서 더 세밀하게 관리하기 →</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF8' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0EDE6',
  },
  back: { fontSize: 24, color: '#1A1A1A' },
  title: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },

  statusCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 20,
    borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  statusSub: { fontSize: 13, color: '#888', marginTop: 2 },
  deniedNotice: {
    backgroundColor: '#FFF5F5', borderRadius: 10, padding: 12, marginTop: 14,
  },
  deniedText: { fontSize: 13, color: '#C0392B', lineHeight: 19 },

  section: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12,
    borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '600', color: '#BBBBBB',
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 14,
  },
  notifRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F2EC',
  },
  notifIcon: { fontSize: 22, width: 28, textAlign: 'center', marginTop: 1 },
  notifLabel: { fontSize: 15, fontWeight: '600', color: '#2A2220' },
  notifDesc: { fontSize: 12, color: '#AAA', marginTop: 2, lineHeight: 17 },

  settingsLink: { marginTop: 16, alignItems: 'center' },
  settingsLinkText: { fontSize: 13, color: '#E8735A', textDecorationLine: 'underline' },
});
