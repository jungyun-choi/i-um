import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

type DiaryStatus = 'pending' | 'generating' | 'done' | 'failed';

interface DiaryEntry {
  id: string;
  content: string;
  status: DiaryStatus;
  milestone?: string;
}

export function useDiaryGeneration(photoId: string) {
  const [diary, setDiary] = useState<DiaryEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!photoId) return;

    const poll = async () => {
      try {
        const data = await api.photos.getDiary(photoId);
        setDiary(data);
        if (data.status === 'done' || data.status === 'failed') {
          clearInterval(intervalRef.current!);
        }
      } catch (e) {
        setError('일기를 불러오지 못했습니다.');
        clearInterval(intervalRef.current!);
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 3000);
    return () => clearInterval(intervalRef.current!);
  }, [photoId]);

  return { diary, error };
}
