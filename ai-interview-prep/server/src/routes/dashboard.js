import { Router } from 'express';
import Interview from '../models/Interview.js';
import { wrap, requireAuth } from '../middleware/auth.js';

const router = Router();
const round1 = (n) => Math.round(n * 10) / 10;

router.get('/', requireAuth, wrap(async (req, res) => {
  const interviews = await Interview.find({ user: req.user._id, status: 'completed' }).sort({ completedAt: 1 }).lean();
  const inProgress = await Interview.countDocuments({ user: req.user._id, status: 'in_progress' });

  const scores = interviews.map((i) => i.overallScore);
  const answers = interviews.flatMap((i) => i.questions.filter((q) => q.answer));

  const byRoleMap = new Map();
  for (const i of interviews) {
    const r = byRoleMap.get(i.role) || { role: i.role, total: 0, count: 0 };
    r.total += i.overallScore;
    r.count += 1;
    byRoleMap.set(i.role, r);
  }

  const topicMap = new Map();
  for (const q of answers) {
    const t = topicMap.get(q.topic) || { topic: q.topic, total: 0, count: 0 };
    t.total += q.score;
    t.count += 1;
    topicMap.set(q.topic, t);
  }
  const topics = [...topicMap.values()].map((t) => ({ topic: t.topic, avg: round1(t.total / t.count), count: t.count }));
  topics.sort((a, b) => a.avg - b.avg);

  res.json({
    completed: interviews.length,
    inProgress,
    totalAnswers: answers.length,
    averageScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    bestScore: scores.length ? Math.max(...scores) : null,
    trend: interviews.slice(-12).map((i) => ({
      id: i._id,
      date: new Date(i.completedAt || i.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      score: i.overallScore,
      role: i.role,
    })),
    byRole: [...byRoleMap.values()].map((r) => ({ role: r.role, avg: Math.round(r.total / r.count), count: r.count })),
    weakTopics: topics.filter((t) => t.avg < 7).slice(0, 5),
    strongTopics: [...topics].reverse().filter((t) => t.avg >= 7).slice(0, 5),
  });
}));

export default router;
