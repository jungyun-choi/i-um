import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res) => {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('user_id', req.userId)
    .order('created_at');
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
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
