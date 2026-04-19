import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../lib/api';

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  // Expo Go에서 지원 안 될 수 있음
}

export function usePushNotification() {
  const router = useRouter();

  useEffect(() => {
    // 앱 시작 시: 이미 허용된 경우에만 조용히 토큰 등록 (권한 다이얼로그 표시 안 함)
    setupIfAlreadyGranted();
  }, []);

  // 알림 탭 → 해당 일기 화면으로 이동
  const lastResponse = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!lastResponse) return;
    const diaryId = lastResponse.notification.request.content.data?.diaryId as string | undefined;
    if (diaryId) {
      router.push(`/diary/${diaryId}`);
    }
  }, [lastResponse, router]);
}

// 이미 권한이 있을 때만 토큰 등록 (앱 시작 시 호출)
async function setupIfAlreadyGranted() {
  if (!Device.isDevice) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') {
    await registerToken();
  }
}

// 첫 일기 생성 완료 시점에 호출 — 감동 순간에 권한 요청으로 전환율 극대화
export async function requestPushPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') {
    await registerToken();
    return true;
  }
  if (existing === 'denied') return false; // 이미 거절한 경우 재요청 안 함

  const { status } = await Notifications.requestPermissionsAsync();
  if (status === 'granted') {
    await registerToken();
    return true;
  }
  return false;
}

async function registerToken() {
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
    });
    await api.users.savePushToken(tokenData.data);
  } catch {
    // Expo Go 환경이거나 projectId 미설정 시 정상 skip
  }
}
