import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = Router();
router.use(requireAuth);

router.patch('/push-token', async (req: AuthRequest, res) => {
  const { token } = req.body;
  if (!token) { res.status(400).json({ error: 'token required' }); return; }

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: req.userId, push_token: token }, { onConflict: 'id' });

  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ ok: true });
});

// 계정 삭제 — auth user 삭제 시 DB FK cascade가 모든 관련 데이터 제거
// R2 파일 orphan은 별도 cron으로 정리 (best-effort)
router.delete('/me', async (req: AuthRequest, res) => {
  const { error } = await supabase.auth.admin.deleteUser(req.userId!);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true });
});

export default router;
