import { supabase } from './supabase';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

async function authFetch(path: string, init?: RequestInit) {
  const { data: { session } } = await supabase.auth.getSession();
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token ?? ''}`,
        ...init?.headers,
      },
    });
  } catch {
    throw new Error('인터넷 연결을 확인해주세요');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Request failed');
  }
  return res.json();
}

export const api = {
  children: {
    list: () => authFetch('/children'),
    create: (body: { name: string; birth_date: string; gender: string }) =>
      authFetch('/children', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<{ name: string; birth_date: string; gender: string; avatar_url: string }>) =>
      authFetch(`/children/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    getAvatarUploadUrl: (id: string) =>
      authFetch(`/children/${id}/avatar-url`, { method: 'POST' }),
    delete: (id: string) =>
      authFetch(`/children/${id}`, { method: 'DELETE' }),
  },
  photos: {
    getUploadUrl: (body: { child_id: string; filename: string; taken_at?: string; gps_lat?: number; gps_lng?: number }) =>
      authFetch('/photos/upload-url', { method: 'POST', body: JSON.stringify(body) }),
    process: (id: string, body?: { diary_style?: 'emotional' | 'factual' }) =>
      authFetch(`/photos/${id}/process`, { method: 'POST', body: JSON.stringify(body ?? {}) }),
    getDiary: (id: string) => authFetch(`/photos/${id}/diary`),
  },
  diary: {
    create: (body: { child_id: string; content: string; date?: string }) =>
      authFetch('/diary', { method: 'POST', body: JSON.stringify(body) }),
    get: (id: string) => authFetch(`/diary/${id}`),
    update: (id: string, content: string) =>
      authFetch(`/diary/${id}`, { method: 'PATCH', body: JSON.stringify({ content }) }),
    delete: (id: string) =>
      authFetch(`/diary/${id}`, { method: 'DELETE' }),
    stats: (childId: string) => authFetch(`/diary/stats/${childId}`),
    timeline: (childId: string, cursor?: string, limit = 20) => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (cursor) params.set('cursor', cursor);
      return authFetch(`/diary/timeline/${childId}?${params}`);
    },
  },
  milestones: {
    list: (childId: string) => authFetch(`/milestones/${childId}`),
    create: (body: { child_id: string; type: string; date: string }) =>
      authFetch('/milestones', { method: 'POST', body: JSON.stringify(body) }),
  },
  invites: {
    create: (childId: string) =>
      authFetch('/invites', { method: 'POST', body: JSON.stringify({ child_id: childId }) }),
    join: (code: string) =>
      authFetch(`/invites/${code}/join`, { method: 'POST' }),
  },
  monthlyLetters: {
    latest: (childId: string) => authFetch(`/monthly-letters/latest/${childId}`),
    list: (childId: string) => authFetch(`/monthly-letters/${childId}`),
  },
  users: {
    savePushToken: (token: string) =>
      authFetch('/users/push-token', { method: 'PATCH', body: JSON.stringify({ token }) }),
    deleteAccount: () =>
      authFetch('/users/me', { method: 'DELETE' }),
  },
};

export async function uploadToS3(uploadUrl: string, fileUri: string) {
  const response = await fetch(fileUri);
  const blob = await response.blob();
  await fetch(uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': 'image/jpeg' },
  });
}
