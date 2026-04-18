import { Router } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }
  res.json({ user: data.user });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    res.status(401).json({ error: error.message });
    return;
  }
  res.json({ user: data.user, session: data.session });
});

export default router;
