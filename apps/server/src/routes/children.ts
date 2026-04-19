import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';
import { getUploadUrl } from '../services/s3Service';
import { v4 as uuidv4 } from 'uuid';

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
  if (!name?.trim()) { res.status(400).json({ error: 'name required' }); return; }
  if (!birth_date || !/^\d{4}-\d{2}-\d{2}$/.test(birth_date)) {
    res.status(400).json({ error: 'birth_date must be YYYY-MM-DD' }); return;
  }
  if (gender && !['M', 'F', 'N'].includes(gender)) {
    res.status(400).json({ error: 'gender must be M, F, or N' }); return;
  }
  const { data, error } = await supabase
    .from('children')
    .insert({ user_id: req.userId, name: name.trim(), birth_date, gender: gender ?? 'N' })
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

router.delete('/:id', async (req: AuthRequest, res) => {
  const { data: child } = await supabase
    .from('children')
    .select('id')
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .maybeSingle();
  if (!child) { res.status(403).json({ error: 'Not authorized' }); return; }

  const { error } = await supabase
    .from('children')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.userId!);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true });
});

// 아바타 업로드용 presigned URL 발급
router.post('/:id/avatar-url', async (req: AuthRequest, res) => {
  const { data: child } = await supabase
    .from('children')
    .select('id')
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .maybeSingle();
  if (!child) { res.status(403).json({ error: 'Not authorized' }); return; }

  const key = `i-um/avatars/${req.params.id}/${uuidv4()}.jpg`;
  const uploadUrl = await getUploadUrl(key, 'image/jpeg');
  const publicUrl = `${process.env.S3_PUBLIC_BASE_URL}/${key}`;
  res.json({ upload_url: uploadUrl, public_url: publicUrl, key });
});

export default router;
