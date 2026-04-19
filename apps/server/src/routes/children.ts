import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res) => {
  // 직접 소유한 아이 + 공유받은 아이 모두 반환
  const [ownedResult, sharedResult] = await Promise.all([
    supabase.from('children').select('*').eq('user_id', req.userId).order('created_at'),
    supabase.from('family_members').select('child_id, children(*)').eq('user_id', req.userId),
  ]);
  if (ownedResult.error) { res.status(500).json({ error: ownedResult.error.message }); return; }
  const sharedChildren = (sharedResult.data ?? [])
    .map((m: any) => m.children)
    .filter(Boolean)
    .map((c: any) => ({ ...c, _shared: true }));
  const ownedIds = new Set((ownedResult.data ?? []).map((c: any) => c.id));
  const deduplicated = [...(ownedResult.data ?? []), ...sharedChildren.filter((c: any) => !ownedIds.has(c.id))];
  res.json(deduplicated);
});

router.post('/', async (req: AuthRequest, res) => {
  const { name, birth_date, gender } = req.body;
  const { data, error } = await supabase
    .from('children')
    .insert({ user_id: req.userId, name, birth_date, gender })
    .select()
    .single();
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.status(201).json(data);
});

router.patch('/:id', async (req: AuthRequest, res) => {
  const { name, birth_date, gender, avatar_url } = req.body;
  const { data, error } = await supabase
    .from('children')
    .update({ name, birth_date, gender, avatar_url })
    .eq('id', req.params.id)
    .eq('user_id', req.userId)
    .select()
    .single();
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json(data);
});

export default router;
