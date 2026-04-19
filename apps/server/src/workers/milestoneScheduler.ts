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

  const { data: children, error } = await supabase
    .from('children')
    .select('id, name, birth_date, user_id');

  if (error || !children?.length) return;

  // Collect owner IDs + family member IDs for all children
  const { data: familyMembers } = await supabase
    .from('family_members')
    .select('child_id, user_id');

  const familyByChild = new Map<string, string[]>();
  for (const fm of familyMembers ?? []) {
    const arr = familyByChild.get(fm.child_id) ?? [];
    arr.push(fm.user_id);
    familyByChild.set(fm.child_id, arr);
  }

  const allUserIds = [...new Set([
    ...children.map((c) => c.user_id),
    ...(familyMembers ?? []).map((fm) => fm.user_id),
  ])];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, push_token')
    .in('id', allUserIds)
    .not('push_token', 'is', null);

  if (!profiles?.length) return;

  const tokenByUser = Object.fromEntries(profiles.map((p) => [p.id, p.push_token]));

  for (const child of children) {
    const days = differenceInDays(today, new Date(child.birth_date));

    for (const milestone of MILESTONE_ALERTS) {
      if (days !== milestone.days) continue;

      const { data: existing } = await supabase
        .from('milestones')
        .select('id')
        .eq('child_id', child.id)
        .eq('type', milestone.type)
        .single();

      if (existing) continue;

      // Notify owner + all family members
      const recipients = [child.user_id, ...(familyByChild.get(child.id) ?? [])];
      const uniqueRecipients = [...new Set(recipients)];

      for (const userId of uniqueRecipients) {
        const token = tokenByUser[userId];
        if (!token) continue;
        await sendPushNotification(token, {
          title: milestone.title,
          body: milestone.body(child.name),
          data: { type: 'milestone', childId: child.id, milestoneType: milestone.type },
        });
      }

      console.log(`Milestone alert sent: ${child.name} - ${milestone.type} (${uniqueRecipients.length} recipients)`);
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
