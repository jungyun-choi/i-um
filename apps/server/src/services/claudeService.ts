import Anthropic from '@anthropic-ai/sdk';
import { differenceInDays, format } from 'date-fns';
import { ko } from 'date-fns/locale';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MILESTONES: Record<string, string> = {
  baekil: '백일 (생후 100일)',
  dol: '첫 돌잔치 (생후 365일)',
  '2nd_year': '두 돌 (생후 730일)',
};

interface DiaryContext {
  childName: string;
  birthDate: string;
  photoDate: string;
  locationName: string | null;
  milestone: string | null;
  imageBase64: string;
}

export async function generateDiary(ctx: DiaryContext): Promise<string> {
  const days = differenceInDays(new Date(ctx.photoDate), new Date(ctx.birthDate));
  const ageText = formatAge(days);
  const dateText = format(new Date(ctx.photoDate), 'yyyy년 M월 d일 (E)', { locale: ko });
  const milestoneText = ctx.milestone ? MILESTONES[ctx.milestone] : null;

  const systemPrompt = `당신은 한국 부모를 위해 육아 일기를 써주는 AI입니다.
따뜻하고 감성적인 한국어로, 마치 부모가 직접 쓴 것처럼 자연스럽게 작성하세요.
존댓말을 사용하고, 아이의 이름을 자연스럽게 넣어주세요.`;

  const userPrompt = `[아이 정보]
- 이름: ${ctx.childName}
- 현재 나이: ${ageText} (생후 ${days}일)${milestoneText ? `\n- 오늘의 특별한 날: ${milestoneText}` : ''}

[사진 촬영 정보]
- 날짜: ${dateText}
- 장소: ${ctx.locationName ?? '알 수 없음'}

첨부 사진을 보고, 이 날의 육아 일기를 2~3문단으로 써주세요.
- 사진 속 상황을 구체적으로 묘사하세요
- ${ctx.childName}의 표정과 행동에서 느껴지는 감정을 담아주세요
- 150~250자 내외로 작성해주세요`;

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: ctx.imageBase64,
            },
          },
          { type: 'text', text: userPrompt },
        ],
      },
    ],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  return textBlock?.type === 'text' ? textBlock.text : '';
}

function formatAge(days: number): string {
  if (days < 30) return `${days}일`;
  if (days < 365) return `${Math.floor(days / 30)}개월 ${days % 30}일`;
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  return months > 0 ? `${years}살 ${months}개월` : `${years}살`;
}
