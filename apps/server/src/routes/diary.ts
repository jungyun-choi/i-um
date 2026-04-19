import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = Router();
router.use(requireAuth);

// 텍스트 전용 일기 생성 (사진 없음)
router.post('/', async (req: AuthRequest, res) => {
  const { child_id, content, date } = req.body;
  if (!child_id || !content?.trim()) {
    res.status(400).json({ error: 'child_id and content required' });
    return;
  }

  // 소유권 확인 (직접 소유 또는 family_member)
  const [ownedRes, memberRes] = await Promise.all([
    supabase.from('children').select('id').eq('id', child_id).eq('user_id', req.userId!).maybeSingle(),
    supabase.from('family_members').select('id').eq('child_id', child_id).eq('user_id', req.userId!).maybeSingle(),
  ]);
  if (!ownedRes.data && !memberRes.data) {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }

  const created_at = date ? new Date(date).toISOString() : new Date().toISOString();
  const { data, error } = await supabase
    .from('diary_entries')
    .insert({ child_id, content: content.trim(), status: 'done', created_at })
    .select()
    .single();

  if (error) { res.status(400).json({ error: error.message }); return; }
  res.status(201).json(data);
});

async function assertDiaryAccess(entryId: string, userId: string) {
  const { data } = await supabase
    .from('diary_entries')
    .select('photo_id, child_id, children!inner(user_id), family_members!left(user_id)')
    .eq('id', entryId)
    .single();
  if (!data) return null;
  const owned = (data.children as any)?.user_id === userId;
  const shared = Array.isArray(data.family_members)
    ? data.family_members.some((m: any) => m.user_id === userId)
    : (data.family_members as any)?.user_id === userId;
  if (!owned && !shared) return null;
  return data as { photo_id: string | null; child_id: string };
}

router.get('/:id', async (req: AuthRequest, res) => {
  const entry = await assertDiaryAccess(req.params.id, req.userId!);
  if (!entry) { res.status(403).json({ error: 'Not authorized' }); return; }
  const { data, error } = await supabase
    .from('diary_entries')
    .select('*, photos(*)')
    .eq('id', req.params.id)
    .single();
  if (error) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(data);
});

router.patch('/:id', async (req: AuthRequest, res) => {
  const entry = await assertDiaryAccess(req.params.id, req.userId!);
  if (!entry) { res.status(403).json({ error: 'Not authorized' }); return; }
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

router.delete('/:id', async (req: AuthRequest, res) => {
  const entry = await assertDiaryAccess(req.params.id, req.userId!);
  if (!entry) { res.status(403).json({ error: 'Not authorized' }); return; }

  const { error } = await supabase
    .from('diary_entries')
    .delete()
    .eq('id', req.params.id);

  if (error) { res.status(400).json({ error: error.message }); return; }

  if (entry.photo_id) {
    await supabase.from('photos').delete().eq('id', entry.photo_id);
  }

  res.json({ ok: true });
});

router.get('/stats/:childId', async (req: AuthRequest, res) => {
  const childId = req.params.childId;

  const [countResult, firstResult, milestoneResult] = await Promise.all([
    supabase
      .from('diary_entries')
      .select('id', { count: 'exact', head: true })
      .eq('child_id', childId)
      .eq('status', 'done'),
    supabase
      .from('diary_entries')
      .select('created_at')
      .eq('child_id', childId)
      .eq('status', 'done')
      .order('created_at', { ascending: true })
      .limit(1),
    supabase
      .from('milestones')
      .select('id', { count: 'exact', head: true })
      .eq('child_id', childId),
  ]);

  res.json({
    diary_count: countResult.count ?? 0,
    first_entry_date: firstResult.data?.[0]?.created_at ?? null,
    milestone_count: milestoneResult.count ?? 0,
  });
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
