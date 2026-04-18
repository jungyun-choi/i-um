import 'dotenv/config';
import Bull from 'bull';
import { supabase } from '../lib/supabase';
import { getImageBuffer } from '../services/s3Service';
import { reverseGeocode } from '../services/geocodingService';
import { generateDiary } from '../services/claudeService';
import { detectMilestone } from '../lib/milestoneUtils';

export const diaryQueue = new Bull('diary', process.env.REDIS_URL!);

interface DiaryJob {
  photoId: string;
  childId: string;
  s3Key: string;
  takenAt: string;
  gpsLat: number | null;
  gpsLng: number | null;
}

diaryQueue.process(async (job) => {
  const { photoId, childId, s3Key, takenAt, gpsLat, gpsLng }: DiaryJob = job.data;

  await supabase
    .from('diary_entries')
    .update({ status: 'generating' })
    .eq('photo_id', photoId);

  const { data: child } = await supabase
    .from('children')
    .select('name, birth_date')
    .eq('id', childId)
    .single();

  if (!child) throw new Error('Child not found');

  const [imageBuffer, locationName] = await Promise.all([
    getImageBuffer(s3Key),
    gpsLat && gpsLng ? reverseGeocode(gpsLat, gpsLng) : Promise.resolve(null),
  ]);

  const milestone = detectMilestone(child.birth_date, takenAt);
  const imageBase64 = imageBuffer.toString('base64');

  const content = await generateDiary({
    childName: child.name,
    birthDate: child.birth_date,
    photoDate: takenAt,
    locationName,
    milestone,
    imageBase64,
  });

  const { data: diary } = await supabase
    .from('diary_entries')
    .update({ content, status: 'done', milestone })
    .eq('photo_id', photoId)
    .select()
    .single();

  if (milestone && diary) {
    await supabase.from('milestones').upsert({
      child_id: childId,
      type: milestone,
      date: takenAt.split('T')[0],
      photo_id: photoId,
      diary_id: diary.id,
    }, { onConflict: 'child_id,type' });
  }

  await supabase
    .from('photos')
    .update({ location_name: locationName })
    .eq('id', photoId);
});

diaryQueue.on('failed', async (job, err) => {
  console.error(`Diary job failed for photo ${job.data.photoId}:`, err.message);
  await supabase
    .from('diary_entries')
    .update({ status: 'failed' })
    .eq('photo_id', job.data.photoId);
});

console.log('Diary worker started');
