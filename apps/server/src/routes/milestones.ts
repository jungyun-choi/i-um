import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = Router();
router.use(requireAuth);

router.get('/:childId', async (req: AuthRequest, res) => {
  const { data, error } = await supabase
    .from('milestones')
    .select('*, photos(id, s3_key), diary_entries(id, content)')
    .eq('child_id', req.params.childId)
    .order('date');
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

export default router;
