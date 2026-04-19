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

export default router;
