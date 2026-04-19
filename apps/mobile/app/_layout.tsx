import { useEffect, useState } from 'react';
import { Slot } from 'expo-router';
import { Text, TextInput } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '../src/lib/supabase';
import { useRouter, useSegments } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { usePushNotification } from '../src/hooks/usePushNotification';
import { ToastProvider } from '../src/components/Toast';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync();

// Global Pretendard — Android requires explicit fontFamily (fontWeight alone insufficient)
const _defaultTextStyle = { fontFamily: 'Pretendard-Regular' };
Text.defaultProps = { ...(Text.defaultProps ?? {}), style: _defaultTextStyle };
TextInput.defaultProps = { ...(TextInput.defaultProps ?? {}), style: _defaultTextStyle };

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: {
        onError: () => {},
      },
    },
  });
}

const queryClient = makeQueryClient();

function AuthGate({ session, isRecovery }: { session: Session | null; isRecovery: boolean }) {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isRecovery) {
      router.replace('/reset-password');
      return;
    }
    const inAuth = segments[0] === '(auth)';
    const inReset = segments[0] === 'reset-password';
    if (!session && !inAuth) {
      router.replace('/(auth)/welcome');
    } else if (session && (inAuth || inReset)) {
      router.replace('/(tabs)/timeline');
    }
  }, [session, segments, isRecovery]);

  return null;
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  usePushNotification();

  const [fontsLoaded] = useFonts({
    'Pretendard-Regular': require('../assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('../assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('../assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('../assets/fonts/Pretendard-Bold.otf'),
  });

  useEffect(() => {
    if (fontsLoaded && ready) SplashScreen.hideAsync();
  }, [fontsLoaded, ready]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      } else {
        setIsRecovery(false);
      }
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!ready || !fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthGate session={session} isRecovery={isRecovery} />
          <Slot />
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
