import { sendPushNotification } from '../services/pushService';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockClear();
  mockFetch.mockResolvedValue({ ok: true });
});

describe('sendPushNotification', () => {
  it('유효한 Expo 토큰으로 Expo API를 호출한다', async () => {
    await sendPushNotification('ExponentPushToken[abc123]', {
      title: '일기 완성',
      body: '민준이의 일기가 완성됐어요',
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://exp.host/--/api/v2/push/send',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('ExponentPushToken[abc123]'),
      })
    );
  });

  it('payload에 title과 body가 포함된다', async () => {
    await sendPushNotification('ExponentPushToken[abc123]', {
      title: '✨ 테스트 제목',
      body: '테스트 본문',
      data: { diaryId: 'diary-001' },
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.title).toBe('✨ 테스트 제목');
    expect(body.body).toBe('테스트 본문');
    expect(body.data).toEqual({ diaryId: 'diary-001' });
    expect(body.sound).toBe('default');
  });

  it('유효하지 않은 토큰(ExponentPushToken으로 시작 안 함)은 API를 호출하지 않는다', async () => {
    await sendPushNotification('invalid-token', {
      title: '제목',
      body: '본문',
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('빈 토큰은 API를 호출하지 않는다', async () => {
    await sendPushNotification('', {
      title: '제목',
      body: '본문',
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
