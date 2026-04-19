import cron from 'node-cron';
import { differenceInDays } from 'date-fns';
import { supabase } from '../lib/supabase';
import { sendPushNotification } from '../services/pushService';

const MILESTONE_ALERTS: { type: string; days: number; title: string; body: (name: string) => string }[] = [
  {
    type: 'baekil',
    days: 100,
    title: '🎂 백일이에요!',
    body: (name) => `${name}이(가) 태어난 지 100일이 됐어요. 오늘의 특별한 순간을 기록해보세요.`,
  },
  {
    type: 'dol',
    days: 365,
    title: '🎉 첫 돌이에요!',
    body: (name) => `${name}이(가) 태어난 지 1년이 됐어요. 지난 1년의 소중한 추억을 돌아보세요.`,
  },
  {
    type: '2nd_year',
    days: 730,
    title: '🎈 두 돌이에요!',
    body: (name) => `${name}이(가) 두 살이 됐어요. 무럭무럭 자라고 있는 ${name}의 이야기를 기록해보세요.`,
  },
];

async function checkMilestoneAlerts() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 모든 아이 + 부모 push_token 조회
  const { data: children, error } = await supabase
    .from('children')
    .select('id, name, birth_date, user_id');

  if (error || !children?.length) return;

  const userIds = [...new Set(children.map((c) => c.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, push_token')
    .in('id', userIds)
    .not('push_token', 'is', null);

  if (!profiles?.length) return;

  const tokenByUser = Object.fromEntries(profiles.map((p) => [p.id, p.push_token]));

  for (const child of children) {
    const token = tokenByUser[child.user_id];
    if (!token) continue;

    const days = differenceInDays(today, new Date(child.birth_date));

    for (const milestone of MILESTONE_ALERTS) {
      if (days !== milestone.days) continue;

      // 이미 해당 마일스톤이 기록됐으면 알림 스킵
      const { data: existing } = await supabase
        .from('milestones')
        .select('id')
        .eq('child_id', child.id)
        .eq('type', milestone.type)
        .single();

      if (existing) continue;

      await sendPushNotification(token, {
        title: milestone.title,
        body: milestone.body(child.name),
        data: { type: 'milestone', childId: child.id, milestoneType: milestone.type },
      });

      console.log(`Milestone alert sent: ${child.name} - ${milestone.type}`);
    }
  }
}

export function startMilestoneScheduler() {
  // 매일 오전 9시 실행
  cron.schedule('0 9 * * *', () => {
    checkMilestoneAlerts().catch((e) => console.error('Milestone scheduler error:', e));
  });
  console.log('Milestone scheduler started (daily 9am)');
}
