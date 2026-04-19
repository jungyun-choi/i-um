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
  style?: 'emotional' | 'factual';
}

export async function generateDiary(ctx: DiaryContext): Promise<string> {
  const days = differenceInDays(new Date(ctx.photoDate), new Date(ctx.birthDate));
  const ageText = formatAge(days);
  const dateText = format(new Date(ctx.photoDate), 'yyyy년 M월 d일 (E)', { locale: ko });
  const milestoneText = ctx.milestone ? MILESTONES[ctx.milestone] : null;

  const isEmotional = (ctx.style ?? 'emotional') === 'emotional';
  const systemPrompt = isEmotional
    ? `당신은 부모가 아이에게 남기는 육아 일기를 써주는 AI입니다. 훗날 아이가 읽었을 때 감동받을 수 있도록, 부모의 따뜻한 마음과 그날의 감정을 담아 한국어로 작성하세요. "너는", "${ctx.childName}은" 같이 아이에게 말을 건네는 문체로 쓰고, 마크다운 기호(**,##,- 등)는 절대 사용하지 마세요.`
    : `당신은 부모가 아이에게 남기는 육아 일지를 써주는 AI입니다. 훗날 아이가 읽었을 때 그날을 생생히 알 수 있도록, 있었던 일을 간결하고 명확하게 기록하세요. "너는", "${ctx.childName}은" 같이 아이에게 말을 건네는 문체로 쓰되 감정보다 사실에 집중하고, 마크다운 기호(**,##,- 등)는 절대 사용하지 마세요.`;

  const ageDescription = days < 0
    ? `임신 중 (출산 ${Math.abs(days)}일 전)`
    : `${ageText} (생후 ${days}일)`;

  const userPrompt = `[아이 정보]
- 이름: ${ctx.childName}
- 현재 나이: ${ageDescription}${milestoneText ? `\n- 오늘의 특별한 날: ${milestoneText}` : ''}

[사진 촬영 정보]
- 날짜: ${dateText}
- 장소: ${ctx.locationName ?? '알 수 없음'}

첨부 사진을 보고, 이 날의 육아 일기를 2~3문단으로 써주세요.
- 사진 속 상황을 구체적으로 묘사하세요
- ${ctx.childName}의 표정과 행동에서 느껴지는 감정을 담아주세요
- 150~250자 내외로 작성해주세요`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
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
