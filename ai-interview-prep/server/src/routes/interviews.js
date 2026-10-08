import { Router } from 'express';
import mongoose from 'mongoose';
import Interview from '../models/Interview.js';
import { httpError, wrap, requireAuth } from '../middleware/auth.js';
import { generateQuestions, evaluateAnswer, summarizeInterview } from '../services/ai.js';

const router = Router();
router.use(requireAuth);

const MAX_FOLLOW_UPS = 3;
const FOCUS = ['Mixed', 'Technical', 'Behavioral'];
const LEVELS = ['Fresher', 'Junior', 'Mid-level', 'Senior'];

const loadOwned = async (req) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Interview not found.');
  const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
  if (!interview) throw httpError(404, 'Interview not found.');
  return interview;
};

// Create an interview: role -> AI-generated questions (optionally from the saved resume)
router.post('/', wrap(async (req, res) => {
  const role = String(req.body.role || '').trim().slice(0, 80);
  const level = LEVELS.includes(req.body.level) ? req.body.level : 'Fresher';
  const focus = FOCUS.includes(req.body.focus) ? req.body.focus : 'Mixed';
  const count = Math.max(3, Math.min(10, parseInt(req.body.count, 10) || 5));
  const usesResume = !!req.body.useResume;
  if (!role) throw httpError(400, 'Choose or enter a job role.');
  if (usesResume && !req.user.resumeText) throw httpError(400, 'Upload your resume first to get resume-based questions.');

  const questions = await generateQuestions({ role, level, focus, count, resumeText: usesResume ? req.user.resumeText : '' });
  const interview = await Interview.create({ user: req.user._id, role, level, focus, usesResume, questions });
  res.status(201).json(interview);
}));

router.get('/', wrap(async (req, res) => {
  const list = await Interview.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .select('role level focus usesResume status overallScore createdAt completedAt questions.answer')
    .lean();
  res.json(list.map(({ questions, ...i }) => ({
    ...i,
    totalQuestions: questions.length,
    answered: questions.filter((q) => q.answer).length,
  })));
}));

router.get('/:id', wrap(async (req, res) => res.json(await loadOwned(req))));

// Submit an answer: AI scores it, gives feedback, and may add a follow-up question right after it
router.post('/:id/answer', wrap(async (req, res) => {
  const interview = await loadOwned(req);
  if (interview.status === 'completed') throw httpError(409, 'This interview is already finished.');
  const answer = String(req.body.answer || '').trim();
  if (answer.length < 2) throw httpError(400, 'Write an answer before submitting.');
  if (answer.length > 4000) throw httpError(400, 'Keep your answer under 4000 characters.');

  const idx = interview.questions.findIndex((q) => String(q._id) === String(req.body.questionId));
  if (idx === -1) throw httpError(404, 'Question not found.');
  const q = interview.questions[idx];
  if (q.answer) throw httpError(409, 'You already answered this question.');

  const followUps = interview.questions.filter((x) => x.isFollowUp).length;
  const canFollowUp = !q.isFollowUp && followUps < MAX_FOLLOW_UPS;
  const result = await evaluateAnswer({ role: interview.role, level: interview.level, question: q.text, answer, canFollowUp });

  Object.assign(q, {
    answer,
    score: result.score,
    feedback: result.feedback,
    strengths: result.strengths,
    improvements: result.improvements,
    idealHint: result.idealHint,
    answeredAt: new Date(),
  });
  let followUpAdded = false;
  if (result.followUp) {
    interview.questions.splice(idx + 1, 0, { text: result.followUp, topic: q.topic, isFollowUp: true, parentId: q._id });
    followUpAdded = true;
  }
  await interview.save();
  res.json({ interview, answeredId: q._id, followUpAdded });
}));

// Finish the interview: overall score plus an AI-written summary
router.post('/:id/complete', wrap(async (req, res) => {
  const interview = await loadOwned(req);
  if (interview.status === 'completed') return res.json(interview);
  const answered = interview.questions.filter((q) => q.answer);
  if (!answered.length) throw httpError(400, 'Answer at least one question before finishing.');

  const avg = answered.reduce((sum, q) => sum + q.score, 0) / answered.length;
  const report = await summarizeInterview({ role: interview.role, level: interview.level, items: answered });
  Object.assign(interview, {
    status: 'completed',
    overallScore: Math.round(avg * 10),
    summary: report.summary,
    strengths: report.strengths,
    weakAreas: report.weakAreas,
    completedAt: new Date(),
  });
  // Drop unanswered questions so the history only reflects what was practiced
  interview.questions = interview.questions.filter((q) => q.answer);
  await interview.save();
  res.json(interview);
}));

router.delete('/:id', wrap(async (req, res) => {
  const interview = await loadOwned(req);
  await interview.deleteOne();
  res.json({ ok: true });
}));

export default router;
