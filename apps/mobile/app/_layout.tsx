import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '../src/lib/supabase';
import { useRouter, useSegments } from 'expo-router';
import { Session } from '@supabase/supabase-js';

const queryClient = new QueryClient();

function AuthGate({ session }: { session: Session | null }) {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const inAuth = segments[0] === '(auth)';
    if (!session && !inAuth) {
      router.replace('/(auth)/welcome');
    } else if (session && inAuth) {
      router.replace('/(tabs)/timeline');
    }
  }, [session, segments]);

  return null;
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate session={session} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="upload" options={{ presentation: 'modal' }} />
        <Stack.Screen name="diary/[id]" />
        <Stack.Screen name="child/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="child/[id]/edit" options={{ presentation: 'modal' }} />
      </Stack>
    </QueryClientProvider>
  );
}
