import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = Router();
router.use(requireAuth);

// 최신 월간 레터 조회 (타임라인 상단 카드용)
router.get('/latest/:childId', async (req: AuthRequest, res) => {
  const { data, error } = await supabase
    .from('monthly_letters')
    .select('id, year_month, content, created_at')
    .eq('child_id', req.params.childId)
    .order('year_month', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

// 월간 레터 목록 (아카이브)
router.get('/:childId', async (req: AuthRequest, res) => {
  const { data, error } = await supabase
    .from('monthly_letters')
    .select('id, year_month, content, created_at')
    .eq('child_id', req.params.childId)
    .order('year_month', { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data ?? []);
});

export default router;
