import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import ScoreRing from '../components/ScoreRing.jsx';

export default function Session() {
  const { id } = useParams();
  const nav = useNavigate();
  const [iv, setIv] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { q, followUpAdded } shown after each answer

  useEffect(() => {
    api.getInterview(id)
      .then((data) => (data.status === 'completed' ? nav(`/report/${id}`, { replace: true }) : setIv(data)))
      .catch((err) => setError(err.message));
  }, [id, nav]);

  if (error && !iv) return <p className="error">{error}</p>;
  if (!iv) return <p className="muted">Loading interview…</p>;

  const current = iv.questions.find((q) => !q.answer);
  const answered = iv.questions.filter((q) => q.answer).length;
  const total = iv.questions.length;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await api.answer(id, { questionId: current._id, answer: text });
      setIv(res.interview);
      setResult({ q: res.interview.questions.find((q) => q._id === res.answeredId), followUpAdded: res.followUpAdded });
      setText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    setBusy(true);
    setError('');
    try {
      await api.complete(id);
      nav(`/report/${id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="stack session">
      <div className="session-head">
        <div>
          <h1>{iv.level} {iv.role}</h1>
          <p className="muted">{iv.focus} questions{iv.usesResume ? ' from your resume' : ''}</p>
        </div>
        <button className="btn ghost" onClick={finish} disabled={busy || answered === 0}>End and see report</button>
      </div>

      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={answered} aria-label="Interview progress">
        <span style={{ width: `${(answered / total) * 100}%` }} />
      </div>

      {result ? (
        <section className="panel stack feedback">
          <div className="fb-top">
            <ScoreRing value={result.q.score} caption="of 10" />
            <div>
              <h2>Feedback</h2>
              <p>{result.q.feedback}</p>
            </div>
          </div>
          <div className="grid2">
            <div><h3>What worked</h3><ul>{result.q.strengths.map((s) => <li key={s}>{s}</li>)}</ul></div>
            <div><h3>To improve</h3><ul>{result.q.improvements.map((s) => <li key={s}>{s}</li>)}</ul></div>
          </div>
          {result.q.idealHint && <p className="hint"><strong>A strong answer includes:</strong> {result.q.idealHint}</p>}
          {result.followUpAdded && <p className="notice">A follow-up question was added based on your answer.</p>}
          {error && <p className="error" role="alert">{error}</p>}
          <div>
            {current
              ? <button className="btn" onClick={() => setResult(null)}>Next question</button>
              : <button className="btn" onClick={finish} disabled={busy}>{busy ? 'Building your report…' : 'Finish and see report'}</button>}
          </div>
        </section>
      ) : current ? (
        <form className="panel stack" onSubmit={submit}>
          <p className="muted">
            Question {answered + 1} of {total}
            {current.isFollowUp ? ' · follow-up' : ''}
            {' · '}{current.topic}
          </p>
          <p className="question">{current.text}</p>
          <label className="sr">Your answer</label>
          <textarea rows={9} value={text} onChange={(e) => setText(e.target.value)} placeholder="Answer as you would in the room. Aim for a clear structure and a concrete example." maxLength={4000} disabled={busy} />
          <div className="row between">
            <span className="muted small">{text.length}/4000</span>
            <button className="btn" disabled={busy || text.trim().length < 2}>{busy ? 'Scoring your answer…' : 'Submit answer'}</button>
          </div>
          {busy && <p className="pending" role="status">Scoring with AI — usually takes a few seconds…</p>}
          {error && <p className="error" role="alert">{error}</p>}
        </form>
      ) : (
        <section className="panel stack">
          <h2>All questions answered</h2>
          <div><button className="btn" onClick={finish} disabled={busy}>{busy ? 'Building your report…' : 'Finish and see report'}</button></div>
          {error && <p className="error" role="alert">{error}</p>}
        </section>
      )}
    </div>
  );
}
