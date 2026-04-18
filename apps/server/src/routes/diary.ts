import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = Router();
router.use(requireAuth);

router.get('/:id', async (req: AuthRequest, res) => {
  const { data, error } = await supabase
    .from('diary_entries')
    .select('*, photos(*)')
    .eq('id', req.params.id)
    .single();
  if (error) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(data);
});

router.patch('/:id', async (req: AuthRequest, res) => {
  const { content } = req.body;
  const { data, error } = await supabase
    .from('diary_entries')
    .update({ content, is_edited: true, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json(data);
});

router.get('/timeline/:childId', async (req: AuthRequest, res) => {
  const { cursor, limit = '20' } = req.query;
  let query = supabase
    .from('diary_entries')
    .select('*, photos(id, s3_key, taken_at, location_name)')
    .eq('child_id', req.params.childId)
    .eq('status', 'done')
    .order('created_at', { ascending: false })
    .limit(Number(limit));

  if (cursor) query = query.lt('created_at', cursor as string);

  const { data, error } = await query;
  if (error) { res.status(500).json({ error: error.message }); return; }

  const nextCursor = data && data.length === Number(limit)
    ? data[data.length - 1].created_at
    : null;

  res.json({ entries: data, next_cursor: nextCursor });
});

export default router;
