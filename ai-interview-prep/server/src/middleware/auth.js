import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const httpError = (status, message) => Object.assign(new Error(message), { status });

// Wraps async route handlers so rejected promises reach the error middleware.
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const requireAuth = wrap(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw httpError(401, 'Please sign in to continue.');
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw httpError(401, 'Your session expired. Please sign in again.');
  }
  const user = await User.findById(payload.id);
  if (!user) throw httpError(401, 'Account not found. Please sign in again.');
  req.user = user;
  next();
});
