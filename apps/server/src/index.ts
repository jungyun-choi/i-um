import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import childrenRoutes from './routes/children';
import photosRoutes from './routes/photos';
import diaryRoutes from './routes/diary';
import milestonesRoutes from './routes/milestones';
import usersRoutes from './routes/users';
import monthlyLettersRoutes from './routes/monthlyLetters';
import invitesRoutes from './routes/invites';
import { startMilestoneScheduler } from './workers/milestoneScheduler';
import { startMonthlyLetterScheduler } from './workers/monthlyLetterScheduler';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Global: 300 req/15min per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Tighter limit for photo uploads (costs money per AI call)
const uploadLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { error: '업로드 한도를 초과했어요. 1시간 후 다시 시도해주세요.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/children', childrenRoutes);
app.use('/photos', uploadLimit, photosRoutes);
app.use('/diary', diaryRoutes);
app.use('/milestones', milestonesRoutes);
app.use('/users', usersRoutes);
app.use('/monthly-letters', monthlyLettersRoutes);
app.use('/invites', invitesRoutes);

app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`Server running on :${PORT}`);
  startMilestoneScheduler();
  startMonthlyLetterScheduler();
});
