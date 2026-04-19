import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';
import { getUploadUrl, buildS3Key } from '../services/s3Service';
import { diaryQueue } from '../workers/diaryWorker';

const router = Router();
router.use(requireAuth);

// S3 presigned URL 발급 + DB 레코드 생성
router.post('/upload-url', async (req: AuthRequest, res) => {
  const { child_id, filename, taken_at, gps_lat, gps_lng } = req.body;
  const photoId = uuid();
  const s3Key = buildS3Key(req.userId!, photoId, filename);
  const uploadUrl = await getUploadUrl(s3Key, 'image/jpeg');

  const { error } = await supabase.from('photos').insert({
    id: photoId,
    child_id,
    user_id: req.userId,
    s3_key: s3Key,
    taken_at: taken_at ?? null,
    gps_lat: gps_lat ?? null,
    gps_lng: gps_lng ?? null,
  });

  if (error) { res.status(400).json({ error: error.message }); return; }

  await supabase.from('diary_entries').insert({
    photo_id: photoId,
    child_id,
    status: 'pending',
  });

  res.json({ upload_url: uploadUrl, photo_id: photoId });
});

// S3 업로드 완료 후 AI 처리 큐 등록
router.post('/:id/process', async (req: AuthRequest, res) => {
  const { data: photo, error } = await supabase
    .from('photos')
    .select('id, child_id, s3_key, taken_at, gps_lat, gps_lng')
    .eq('id', req.params.id)
    .eq('user_id', req.userId)
    .single();

  if (error || !photo) { res.status(404).json({ error: 'Photo not found' }); return; }

  await diaryQueue.add({
    photoId: photo.id,
    childId: photo.child_id,
    s3Key: photo.s3_key,
    takenAt: photo.taken_at,
    gpsLat: photo.gps_lat,
    gpsLng: photo.gps_lng,
    diaryStyle: req.body.diary_style ?? 'emotional',
  }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });

  res.json({ status: 'queued' });
});

// 일기 생성 상태 확인 (polling)
router.get('/:id/diary', async (req: AuthRequest, res) => {
  const { data, error } = await supabase
    .from('diary_entries')
    .select('*')
    .eq('photo_id', req.params.id)
    .single();

  if (error) { res.status(404).json({ error: 'Diary not found' }); return; }
  res.json(data);
});

export default router;
