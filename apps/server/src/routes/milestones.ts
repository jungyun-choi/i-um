import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = Router();
router.use(requireAuth);

const EVENT_MILESTONE_TYPES = ['first_word', 'first_step'];

async function assertChildAccess(childId: string, userId: string): Promise<boolean> {
  const [owned, shared] = await Promise.all([
    supabase.from('children').select('id').eq('id', childId).eq('user_id', userId).maybeSingle(),
    supabase.from('family_members').select('id').eq('child_id', childId).eq('user_id', userId).maybeSingle(),
  ]);
  return !!(owned.data || shared.data);
}

router.get('/:childId', async (req: AuthRequest, res) => {
  const ok = await assertChildAccess(req.params.childId, req.userId!);
  if (!ok) { res.status(403).json({ error: 'Not authorized' }); return; }

  const { data, error } = await supabase
    .from('milestones')
    .select('*, photos(id, s3_key), diary_entries(id, content)')
    .eq('child_id', req.params.childId)
    .order('date');
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

router.post('/', async (req: AuthRequest, res) => {
  const { child_id, type, date } = req.body;
  if (!child_id || !type || !date) {
    res.status(400).json({ error: 'child_id, type, date are required' });
    return;
  }
  if (!EVENT_MILESTONE_TYPES.includes(type)) {
    res.status(400).json({ error: 'Only event-based milestones (first_word, first_step) can be manually recorded' });
    return;
  }

  const ok = await assertChildAccess(child_id, req.userId!);
  if (!ok) { res.status(403).json({ error: 'Not authorized' }); return; }

  const { data: existing } = await supabase
    .from('milestones')
    .select('id')
    .eq('child_id', child_id)
    .eq('type', type)
    .maybeSingle();

  if (existing) {
    res.status(409).json({ error: 'Milestone already recorded' });
    return;
  }

  const { data, error } = await supabase
    .from('milestones')
    .insert({ child_id, type, date })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

export default router;
