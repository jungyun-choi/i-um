import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = Router();
router.use(requireAuth);

function randomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// 초대 코드 생성
router.post('/', async (req: AuthRequest, res) => {
  const { child_id } = req.body;
  if (!child_id) { res.status(400).json({ error: 'child_id required' }); return; }

  // 소유권 확인
  const { data: child } = await supabase
    .from('children').select('id').eq('id', child_id).eq('user_id', req.userId).maybeSingle();
  if (!child) { res.status(403).json({ error: 'Not authorized' }); return; }

  const code = randomCode();
  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('invite_codes')
    .insert({ code, child_id, created_by: req.userId, expires_at })
    .select('code, expires_at').single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

// 초대 코드로 참여
router.post('/:code/join', async (req: AuthRequest, res) => {
  const { code } = req.params;

  const { data: invite } = await supabase
    .from('invite_codes')
    .select('id, child_id, used_by, expires_at')
    .eq('code', code.toUpperCase())
    .maybeSingle();

  if (!invite) { res.status(404).json({ error: '유효하지 않은 코드예요' }); return; }
  if (invite.used_by) { res.status(409).json({ error: '이미 사용된 코드예요' }); return; }
  if (new Date(invite.expires_at) < new Date()) {
    res.status(410).json({ error: '만료된 코드예요' }); return;
  }

  // 이미 멤버인지 확인
  const { data: existing } = await supabase
    .from('family_members')
    .select('id').eq('child_id', invite.child_id).eq('user_id', req.userId).maybeSingle();
  if (existing) { res.status(409).json({ error: '이미 공유된 아이예요' }); return; }

  await Promise.all([
    supabase.from('family_members').insert({ child_id: invite.child_id, user_id: req.userId }),
    supabase.from('invite_codes').update({ used_by: req.userId }).eq('id', invite.id),
  ]);

  res.json({ ok: true, child_id: invite.child_id });
});

export default router;
