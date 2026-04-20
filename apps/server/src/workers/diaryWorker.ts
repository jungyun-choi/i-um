import 'dotenv/config';
import Bull from 'bull';
import { supabase } from '../lib/supabase';
import { getImageBuffer } from '../services/s3Service';
import { reverseGeocode } from '../services/geocodingService';
import { generateDiary } from '../services/claudeService';
import { detectMilestone, getMilestoneLabel } from '../lib/milestoneUtils';
import { sendPushNotification } from '../services/pushService';

export const diaryQueue = new Bull('diary', process.env.REDIS_URL!);

interface DiaryJob {
  photoId: string;
  childId: string;
  s3Key: string;
  takenAt: string | null;
  gpsLat: number | null;
  gpsLng: number | null;
  diaryStyle: 'emotional' | 'factual' | 'brief' | 'dramatic';
}

diaryQueue.process(async (job) => {
  const { photoId, childId, s3Key, takenAt, gpsLat, gpsLng, diaryStyle }: DiaryJob = job.data;

  await supabase
    .from('diary_entries')
    .update({ status: 'generating' })
    .eq('photo_id', photoId);

  const { data: child } = await supabase
    .from('children')
    .select('name, birth_date, user_id')
    .eq('id', childId)
    .single();

  if (!child) throw new Error('Child not found');

  const [imageBuffer, locationName] = await Promise.all([
    getImageBuffer(s3Key),
    gpsLat && gpsLng ? reverseGeocode(gpsLat, gpsLng) : Promise.resolve(null),
  ]);

  const effectiveDate = takenAt ?? new Date().toISOString();
  const milestone = detectMilestone(child.birth_date, effectiveDate);
  const imageBase64 = imageBuffer.toString('base64');

  const content = await generateDiary({
    childName: child.name,
    birthDate: child.birth_date,
    photoDate: takenAt ?? null,
    locationName,
    milestone,
    imageBase64,
    style: diaryStyle ?? 'emotional',
  });

  const { data: diary } = await supabase
    .from('diary_entries')
    .update({ content, status: 'done', milestone })
    .eq('photo_id', photoId)
    .select()
    .single();

  if (milestone && diary) {
    const milestoneDate = (takenAt ?? effectiveDate).split('T')[0];
    await supabase.from('milestones').upsert({
      child_id: childId,
      type: milestone,
      date: milestoneDate,
      photo_id: photoId,
      diary_id: diary.id,
    }, { onConflict: 'child_id,type' });
  }

  await supabase
    .from('photos')
    .update({ location_name: locationName })
    .eq('id', photoId);

  // 푸시 알림 발송 (owner + 초대받은 가족 모두에게)
  const { data: familyMembers } = await supabase
    .from('family_members')
    .select('user_id')
    .eq('child_id', childId);

  const recipientIds = [...new Set([
    child.user_id,
    ...(familyMembers ?? []).map((fm) => fm.user_id),
  ].filter((id): id is string => Boolean(id)))];

  if (recipientIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('push_token')
      .in('id', recipientIds)
      .not('push_token', 'is', null);

    if (profiles?.length) {
      const title = milestone
        ? `🎉 ${child.name}의 특별한 기억이 기록됐어요!`
        : `✨ ${child.name}의 일기가 완성됐어요`;
      const body = milestone
        ? `${getMilestoneLabel(milestone)} 마일스톤을 달성했어요`
        : '지금 확인해보세요';

      for (const p of profiles) {
        if (p.push_token) {
          await sendPushNotification(p.push_token, { title, body, data: { diaryId: diary?.id } });
        }
      }
    }
  }
});

diaryQueue.on('failed', async (job, err) => {
  console.error(`Diary job failed for photo ${job.data.photoId}:`, err.message);
  await supabase
    .from('diary_entries')
    .update({ status: 'failed' })
    .eq('photo_id', job.data.photoId);
});

console.log('Diary worker started');
