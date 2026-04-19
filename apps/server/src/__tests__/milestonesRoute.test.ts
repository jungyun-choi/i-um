import express from 'express';
import request from 'supertest';

const mockFrom = jest.fn();

jest.mock('../lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

jest.mock('../middleware/auth', () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.userId = 'user-test-001';
    next();
  },
}));

import milestonesRouter from '../routes/milestones';

const app = express();
app.use(express.json());
app.use('/milestones', milestonesRouter);

function buildChain(overrides: Record<string, any> = {}) {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    single: jest.fn().mockResolvedValue({
      data: { id: 'ms-1', child_id: 'child-1', type: 'first_word', date: '2026-04-01' },
      error: null,
    }),
    insert: jest.fn().mockReturnThis(),
    ...overrides,
  };
  chain.insert.mockReturnValue(chain);
  return chain;
}

// Returns a chain that simulates the user owning 'child-1'
function buildOwnerChain(overrides: Record<string, any> = {}) {
  return buildChain({
    maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'child-1' }, error: null }),
    ...overrides,
  });
}

describe('POST /milestones', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('first_word 마일스톤을 정상 저장하면 201 반환', async () => {
    // Call order: children (ownership), family_members (shared), milestones (duplicate check), milestones (insert)
    const ownerChain = buildOwnerChain();
    const noShareChain = buildChain();
    const noDupChain = buildChain();
    const insertChain = buildChain();

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return ownerChain;   // assertChildAccess → children
      if (callCount === 2) return noShareChain; // assertChildAccess → family_members
      if (callCount === 3) return noDupChain;   // duplicate check
      return insertChain;                        // insert
    });

    const res = await request(app)
      .post('/milestones')
      .send({ child_id: 'child-1', type: 'first_word', date: '2026-04-01' });

    expect(res.status).toBe(201);
    expect(res.body.type).toBe('first_word');
  });

  it('first_step 마일스톤도 정상 저장', async () => {
    const ownerChain = buildOwnerChain();
    const noShareChain = buildChain();
    const noDupChain = buildChain();
    const insertChain = buildChain({
      single: jest.fn().mockResolvedValue({
        data: { id: 'ms-2', child_id: 'child-1', type: 'first_step', date: '2026-05-01' },
        error: null,
      }),
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return ownerChain;
      if (callCount === 2) return noShareChain;
      if (callCount === 3) return noDupChain;
      return insertChain;
    });

    const res = await request(app)
      .post('/milestones')
      .send({ child_id: 'child-1', type: 'first_step', date: '2026-05-01' });

    expect(res.status).toBe(201);
  });

  it('필수 필드 누락 시 400 반환', async () => {
    const res = await request(app)
      .post('/milestones')
      .send({ child_id: 'child-1', type: 'first_word' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/);
  });

  it('date 없으면 400 반환', async () => {
    const res = await request(app)
      .post('/milestones')
      .send({ child_id: 'child-1', type: 'first_word' });

    expect(res.status).toBe(400);
  });

  it('날짜 기반 마일스톤(baekil)은 수동 생성 불가 — 400 반환', async () => {
    const res = await request(app)
      .post('/milestones')
      .send({ child_id: 'child-1', type: 'baekil', date: '2026-04-01' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/event-based/);
  });

  it('소유하지 않은 child_id에 403 반환', async () => {
    const noOwnerChain = buildChain(); // both ownership checks return null
    mockFrom.mockReturnValue(noOwnerChain);

    const res = await request(app)
      .post('/milestones')
      .send({ child_id: 'other-child', type: 'first_word', date: '2026-04-01' });

    expect(res.status).toBe(403);
  });

  it('이미 기록된 마일스톤이면 409 반환', async () => {
    const ownerChain = buildOwnerChain();
    const noShareChain = buildChain();
    const dupChain = buildChain({
      maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'existing' }, error: null }),
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return ownerChain;
      if (callCount === 2) return noShareChain;
      return dupChain;
    });

    const res = await request(app)
      .post('/milestones')
      .send({ child_id: 'child-1', type: 'first_word', date: '2026-04-01' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already recorded/);
  });
});
