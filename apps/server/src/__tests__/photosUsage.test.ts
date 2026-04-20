import express from 'express';
import request from 'supertest';

// supabase mock — count 반환용 체이닝 구조
const mockGte = jest.fn();
const mockEq = jest.fn(() => ({ gte: mockGte }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock('../lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

jest.mock('../middleware/auth', () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.userId = 'user-test-001';
    next();
  },
}));

// diaryWorker는 Bull/Redis 의존 — 테스트에서 연결 방지
jest.mock('../workers/diaryWorker', () => ({
  diaryQueue: { add: jest.fn() },
}));

// s3Service 의존성 제거
jest.mock('../services/s3Service', () => ({
  getUploadUrl: jest.fn(),
  buildS3Key: jest.fn(),
}));

import photosRouter from '../routes/photos';

const app = express();
app.use(express.json());
app.use('/photos', photosRouter);

describe('GET /photos/usage', () => {
  beforeEach(() => {
    mockFrom.mockClear();
    mockSelect.mockClear();
    mockEq.mockClear();
    mockGte.mockClear();
  });

  it('이번 달 사용량과 한도를 반환한다', async () => {
    mockGte.mockResolvedValue({ count: 7, error: null });

    const res = await request(app).get('/photos/usage');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ used: 7, limit: 30 });
  });

  it('count가 null이면 used=0 반환', async () => {
    mockGte.mockResolvedValue({ count: null, error: null });

    const res = await request(app).get('/photos/usage');

    expect(res.status).toBe(200);
    expect(res.body.used).toBe(0);
    expect(res.body.limit).toBe(30);
  });

  it('현재 userId 기준으로 photos를 조회한다', async () => {
    mockGte.mockResolvedValue({ count: 3, error: null });

    await request(app).get('/photos/usage');

    expect(mockFrom).toHaveBeenCalledWith('photos');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-test-001');
  });

  it('이번 달 1일 00:00(로컬) 이후만 집계한다', async () => {
    mockGte.mockResolvedValue({ count: 3, error: null });

    await request(app).get('/photos/usage');

    const gteArgs = mockGte.mock.calls[0];
    expect(gteArgs[0]).toBe('created_at');
    const isoStart = gteArgs[1] as string;
    const d = new Date(isoStart);
    expect(d.getDate()).toBe(1);
    expect(d.getHours()).toBe(0);
  });
});
