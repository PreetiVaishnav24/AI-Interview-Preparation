# AI Interview Preparation Platform

MERN app (React, Node.js, Express.js, MongoDB) that uses an AI API to run mock interviews.

## Features
- Pick a job role, level and question type; the AI writes the interview questions
- AI scores each answer (0-10) with feedback, strengths, improvements and what a strong answer includes
- AI-generated follow-up questions (up to 3 per interview), inserted right after the answer that prompted them
- Resume-based questions: upload a PDF or text resume and questions draw on your projects and skills
- Interview history with saved answers, scores and reports
- Dashboard: score trend, average by role, strongest and weakest topics
- JWT auth (bcrypt-hashed passwords)

## Setup
Requires Node 18+ and a running MongoDB (local or Atlas).

```bash
# 1. API
cd server
cp .env.example .env      # set MONGODB_URI, JWT_SECRET, GEMINI_API_KEY (free)
npm install
npm run dev               # http://localhost:5000

# 2. Web app (new terminal)
cd client
npm install
npm run dev               # http://localhost:5173 (proxies /api to :5000)
```

AI calls live in `server/src/services/ai.js`. They use Google Gemini's free tier when `GEMINI_API_KEY` is set (get a key at https://aistudio.google.com/apikey, no card needed), and fall back to the Anthropic API if only `ANTHROPIC_API_KEY` is set. Free-tier limits apply, so wait a minute if you hit the rate limit. Note that Google may use free-tier prompts to improve its products, so avoid sensitive details in your resume.

## API
| Method | Route | Purpose |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | Create account, sign in |
| GET | /api/auth/me | Current user |
| POST / DELETE | /api/resume | Upload (PDF or text) or remove resume |
| POST | /api/interviews | Generate questions for a role |
| GET | /api/interviews | History |
| GET / DELETE | /api/interviews/:id | One interview |
| POST | /api/interviews/:id/answer | Score an answer, maybe add a follow-up |
| POST | /api/interviews/:id/complete | Overall score and AI summary |
| GET | /api/dashboard | Progress stats |

## Structure
```
server/src  app.js, index.js, models/, routes/, middleware/auth.js, services/ai.js
client/src  App.jsx, api.js, auth.js, pages/, components/ScoreRing.jsx, styles.css
```
