import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { httpError, wrap, requireAuth } from '../middleware/auth.js';

const router = Router();
const sign = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, resumeName: u.resumeName, hasResume: !!u.resumeText });

router.post('/register', wrap(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name?.trim() || !email?.includes('@') || !password || password.length < 6)
    throw httpError(400, 'Enter your name, a valid email, and a password of at least 6 characters.');
  if (await User.findOne({ email: email.toLowerCase() })) throw httpError(409, 'An account with this email already exists.');
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: sign(user), user: publicUser(user) });
}));

router.post('/login', wrap(async (req, res) => {
  const { email, password } = req.body || {};
  const user = email && (await User.findOne({ email: String(email).toLowerCase() }));
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) throw httpError(401, 'Incorrect email or password.');
  res.json({ token: sign(user), user: publicUser(user) });
}));

router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

export default router;
