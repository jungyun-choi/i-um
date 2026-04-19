import express from 'express';
import request from 'supertest';

// supabase mock
const mockUpsert = jest.fn().mockResolvedValue({ error: null });
const mockFrom = jest.fn().mockReturnValue({ upsert: mockUpsert });

jest.mock('../lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

// auth mock — userId를 주입
jest.mock('../middleware/auth', () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.userId = 'user-test-001';
    next();
  },
}));

import usersRouter from '../routes/users';

const app = express();
app.use(express.json());
app.use('/users', usersRouter);

describe('PATCH /users/push-token', () => {
  beforeEach(() => {
    mockFrom.mockClear();
    mockUpsert.mockClear();
    mockUpsert.mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });
  });

  it('유효한 토큰을 저장하면 200 ok 반환', async () => {
    const res = await request(app)
      .patch('/users/push-token')
      .send({ token: 'ExponentPushToken[abc123]' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('token 없이 요청하면 400 반환', async () => {
    const res = await request(app)
      .patch('/users/push-token')
      .send({});

    expect(res.status).toBe(400);
  });

  it('supabase 오류 시 400 반환', async () => {
    mockUpsert.mockResolvedValue({ error: { message: 'DB error' } });

    const res = await request(app)
      .patch('/users/push-token')
      .send({ token: 'ExponentPushToken[abc123]' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('DB error');
  });
});
