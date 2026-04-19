import { useEffect, useState } from 'react';
import { Slot } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '../src/lib/supabase';
import { useRouter, useSegments } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { usePushNotification } from '../src/hooks/usePushNotification';
import { ToastProvider } from '../src/components/Toast';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

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

  if (!ready) return null;

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
