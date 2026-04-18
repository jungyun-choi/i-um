import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import childrenRoutes from './routes/children';
import photosRoutes from './routes/photos';
import diaryRoutes from './routes/diary';
import milestonesRoutes from './routes/milestones';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/children', childrenRoutes);
app.use('/photos', photosRoutes);
app.use('/diary', diaryRoutes);
app.use('/milestones', milestonesRoutes);

app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log(`Server running on :${PORT}`));
