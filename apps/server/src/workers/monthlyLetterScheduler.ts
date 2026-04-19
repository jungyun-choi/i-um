import cron from 'node-cron';
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../lib/supabase';
import { sendPushNotification } from '../services/pushService';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generateLetter(childName: string, diaries: { content: string; created_at: string }[]): Promise<string> {
  const entries = diaries
    .map((d) => `[${d.created_at.slice(0, 10)}] ${d.content}`)
    .join('\n\n');

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [
      {
        role: 'user',
        content: `다음은 ${childName}이(가) 지난 한 달 동안 찍은 사진들로 기록된 육아 일기입니다.

${entries}

이 일기들을 바탕으로 ${childName}에게 보내는 따뜻한 월간 편지를 한국어로 써주세요.
- 아이가 훗날 읽을 것을 상상하며 엄마/아빠의 시선으로 쓰세요
- 이달의 특별한 순간과 성장을 구체적으로 언급하세요
- 400자 내외로 간결하게 써주세요
- "사랑하는 ${childName}에게"로 시작하세요
- 편지 형식으로만 작성하고 다른 설명은 붙이지 마세요`,
      },
    ],
  });

  const block = msg.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type');
  return block.text;
}

async function generateMonthlyLetters() {
  const now = new Date();
  // 지난달 year_month (예: 2026-03)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const yearMonth = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
  const monthStart = `${yearMonth}-01`;
  const monthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 1).toISOString().split('T')[0];

  const { data: children, error } = await supabase
    .from('children')
    .select('id, name, user_id');

  if (error || !children?.length) return;

  const userIds = [...new Set(children.map((c) => c.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, push_token')
    .in('id', userIds);

  const tokenByUser = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.push_token]));

  for (const child of children) {
    // 이미 이달 편지가 있으면 스킵
    const { data: existing } = await supabase
      .from('monthly_letters')
      .select('id')
      .eq('child_id', child.id)
      .eq('year_month', yearMonth)
      .maybeSingle();

    if (existing) continue;

    // 지난달 일기 조회
    const { data: diaries } = await supabase
      .from('diary_entries')
      .select('content, created_at')
      .eq('child_id', child.id)
      .eq('status', 'done')
      .gte('created_at', monthStart)
      .lt('created_at', monthEnd)
      .order('created_at');

    if (!diaries?.length) continue;

    try {
      const content = await generateLetter(child.name, diaries);

      await supabase
        .from('monthly_letters')
        .insert({ child_id: child.id, year_month: yearMonth, content });

      const token = tokenByUser[child.user_id];
      if (token) {
        await sendPushNotification(token, {
          title: `💌 ${child.name}의 ${yearMonth} 월간 레터가 도착했어요`,
          body: '지난 한 달의 소중한 순간들을 담은 편지를 읽어보세요.',
          data: { type: 'monthly_letter', childId: child.id, yearMonth },
        });
      }

      console.log(`Monthly letter generated: ${child.name} ${yearMonth}`);
    } catch (e) {
      console.error(`Monthly letter error for ${child.name}:`, e);
    }
  }
}

export function startMonthlyLetterScheduler() {
  // 매달 1일 새벽 2시
  cron.schedule('0 2 1 * *', () => {
    generateMonthlyLetters().catch((e) => console.error('Monthly letter scheduler error:', e));
  });
  console.log('Monthly letter scheduler started (1st of each month, 2am)');
}
