import cron from 'node-cron';
import { differenceInDays } from 'date-fns';
import { supabase } from '../lib/supabase';
import { sendPushNotification } from '../services/pushService';

const MILESTONE_ALERTS: { type: string; days: number; title: string; body: (name: string) => string }[] = [
  {
    type: 'week_1',
    days: 7,
    title: '🌱 생후 7일이에요!',
    body: (name) => `${name}이(가) 태어난 지 일주일이 됐어요. 오늘의 순간을 기록해보세요.`,
  },
  {
    type: 'week_2',
    days: 14,
    title: '🌿 생후 2주예요!',
    body: (name) => `${name}이(가) 두 주를 함께했어요. 소중한 이 순간을 담아보세요.`,
  },
  {
    type: 'month_1',
    days: 30,
    title: '🎀 생후 한 달이에요!',
    body: (name) => `${name}이(가) 태어난 지 한 달이 됐어요. 첫 달의 특별한 순간을 기록해보세요.`,
  },
  {
    type: 'day_50',
    days: 50,
    title: '🌸 생후 50일이에요!',
    body: (name) => `${name}이(가) 50일을 맞이했어요. 무럭무럭 자라고 있어요!`,
  },
  {
    type: 'day_100',
    days: 100,
    title: '🎂 백일이에요!',
    body: (name) => `${name}이(가) 태어난 지 100일이 됐어요. 오늘의 특별한 순간을 기록해보세요.`,
  },
  {
    type: 'month_6',
    days: 180,
    title: '🌻 생후 6개월이에요!',
    body: (name) => `${name}이(가) 반 돌을 맞이했어요. 6개월의 성장을 기록해보세요.`,
  },
  {
    type: 'dol',
    days: 365,
    title: '🎉 첫 돌이에요!',
    body: (name) => `${name}이(가) 태어난 지 1년이 됐어요. 지난 1년의 소중한 추억을 돌아보세요.`,
  },
  {
    type: 'month_18',
    days: 545,
    title: '🚀 생후 18개월이에요!',
    body: (name) => `${name}이(가) 18개월을 맞이했어요. 점점 커가는 ${name}을 기록해보세요.`,
  },
  {
    type: 'year_2',
    days: 730,
    title: '🎈 두 돌이에요!',
    body: (name) => `${name}이(가) 두 살이 됐어요. 무럭무럭 자라고 있는 ${name}의 이야기를 기록해보세요.`,
  },
  {
    type: 'year_3',
    days: 1095,
    title: '🌟 세 돌이에요!',
    body: (name) => `${name}이(가) 세 살이 됐어요. 세 돌을 축하하며 오늘을 기록해보세요.`,
  },
];

async function checkMilestoneAlerts() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: children, error } = await supabase
    .from('children')
    .select('id, name, birth_date, user_id');

  if (error || !children?.length) return;

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
    // Use local date parsing to avoid UTC offset issues
    const [by, bm, bd] = child.birth_date.split('-').map(Number);
    const birthDate = new Date(by, bm - 1, bd);
    const days = differenceInDays(today, birthDate);

    for (const milestone of MILESTONE_ALERTS) {
      if (days !== milestone.days) continue;

      const { data: existing } = await supabase
        .from('milestones')
        .select('id')
        .eq('child_id', child.id)
        .eq('type', milestone.type)
        .single();

      if (existing) continue;

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
  // Run daily at 9am KST
  cron.schedule('0 9 * * *', () => {
    checkMilestoneAlerts().catch((e) => console.error('Milestone scheduler error:', e));
  });
  console.log('Milestone scheduler started (daily 9am)');
}
