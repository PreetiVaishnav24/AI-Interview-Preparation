// Provider: Gemini (free tier) when GEMINI_API_KEY is set, otherwise Anthropic.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
let anthropic;

export class AIError extends Error {
  constructor(message) {
    super(message);
    this.status = 502;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callGemini(system, user, maxTokens) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    // Extra headroom: some Gemini models spend output tokens on internal thinking
    generationConfig: { responseMimeType: 'application/json', maxOutputTokens: maxTokens + 4000, temperature: 0.7 },
  });
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body,
    });
    // Free tier is rate limited: wait and retry once on 429/503
    if ((res.status === 429 || res.status === 503) && attempt < 1) {
      await sleep(4000);
      continue;
    }
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    return (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
  }
}

async function callAnthropic(system, user, maxTokens) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  anthropic ??= new Anthropic(); // reads ANTHROPIC_API_KEY
  const msg = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  });
  return msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
}

async function askJSON(system, user, maxTokens = 2000) {
  const sys = `${system}\n\nRespond with a single valid JSON object only. No markdown fences, no commentary.`;
  let text;
  try {
    text = process.env.GEMINI_API_KEY ? await callGemini(sys, user, maxTokens) : await callAnthropic(sys, user, maxTokens);
  } catch (err) {
    console.error('AI request failed:', err.message);
    const limited = /429/.test(err.message);
    throw new AIError(
      limited
        ? 'The free AI limit was reached. Wait a minute and try again.'
        : 'The AI service is unavailable right now. Check your API key and try again.'
    );
  }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new AIError('The AI returned an unreadable response. Please try again.');
  }
}

const clip = (s, n) => String(s || '').slice(0, n);
const list = (v, max = 4) => (Array.isArray(v) ? v.map((x) => clip(x, 220)).filter(Boolean).slice(0, max) : []);

export async function generateQuestions({ role, level, focus, count, resumeText }) {
  const resumePart = resumeText
    ? `\n\nCandidate resume (base most questions on the projects, skills and experience in it):\n"""\n${clip(resumeText, 6000)}\n"""`
    : '';
  const data = await askJSON(
    'You are an experienced interviewer preparing a realistic mock interview. Ask one clear question at a time, escalating gently in difficulty, with no multi-part questions.',
    `Write exactly ${count} interview questions for a ${level} ${role} candidate.
Focus: ${focus} (Technical = role skills and problem solving, Behavioral = past situations and soft skills, Mixed = both).${resumePart}

Return JSON: {"questions":[{"text":"...","topic":"2-3 word skill area"}]}`,
    2500
  );
  const questions = (data.questions || [])
    .map((q) => ({ text: clip(q.text, 600), topic: clip(q.topic, 40) || 'General' }))
    .filter((q) => q.text)
    .slice(0, count);
  if (!questions.length) throw new AIError('The AI did not return any questions. Please try again.');
  return questions;
}

export async function evaluateAnswer({ role, level, question, answer, canFollowUp }) {
  const data = await askJSON(
    'You are a fair but rigorous interview coach. Score the answer against what a strong candidate at that level would say. Be specific and constructive.',
    `Role: ${level} ${role}
Question: ${question}
Candidate answer: """${clip(answer, 4000)}"""

Score from 0 to 10 (0-3 weak or off-topic, 4-6 partial, 7-8 good, 9-10 excellent). Very short or empty answers score low.
${canFollowUp ? 'Also write one natural follow-up question that probes a gap or goes deeper on something the candidate said.' : 'Set followUp to null.'}

Return JSON: {"score":number,"feedback":"2-3 sentences","strengths":["..."],"improvements":["..."],"idealHint":"one or two sentences on what a strong answer includes","followUp":${canFollowUp ? '"question text"' : 'null'}}`,
    1500
  );
  const score = Math.max(0, Math.min(10, Math.round(Number(data.score) * 10) / 10));
  return {
    score: Number.isFinite(score) ? score : 0,
    feedback: clip(data.feedback, 800),
    strengths: list(data.strengths),
    improvements: list(data.improvements),
    idealHint: clip(data.idealHint, 500),
    followUp: canFollowUp && data.followUp ? clip(data.followUp, 600) : null,
  };
}

export async function summarizeInterview({ role, level, items }) {
  const transcript = items
    .map((q, i) => `Q${i + 1} [${q.topic}] (score ${q.score}/10): ${q.text}\nAnswer: ${clip(q.answer, 600)}`)
    .join('\n\n');
  const data = await askJSON(
    'You are an interview coach writing a short end-of-session report for the candidate.',
    `Role: ${level} ${role}\n\n${transcript}\n\nReturn JSON: {"summary":"3-4 sentences addressed to the candidate","strengths":["up to 3 short items"],"weakAreas":["up to 3 short skill areas to practice"]}`,
    1200
  );
  return {
    summary: clip(data.summary, 1000),
    strengths: list(data.strengths, 3),
    weakAreas: list(data.weakAreas, 3),
  };
}
