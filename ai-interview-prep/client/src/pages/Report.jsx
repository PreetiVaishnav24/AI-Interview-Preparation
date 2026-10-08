import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import ScoreRing from '../components/ScoreRing.jsx';

export default function Report() {
  const { id } = useParams();
  const [iv, setIv] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getInterview(id).then(setIv).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!iv) return <p className="muted">Loading report…</p>;
  if (iv.status !== 'completed') return <p>This interview is still in progress. <Link to={`/interview/${id}`}>Continue it</Link>.</p>;

  return (
    <div className="stack">
      <section className="panel report-top">
        <ScoreRing value={iv.overallScore} max={100} size={120} caption="overall" />
        <div className="stack">
          <h1>{iv.level} {iv.role}</h1>
          <p className="muted">{new Date(iv.completedAt).toLocaleDateString('en-IN', { dateStyle: 'long' })} · {iv.questions.length} questions · {iv.focus}{iv.usesResume ? ' · from resume' : ''}</p>
          <p>{iv.summary}</p>
        </div>
      </section>

      <section className="grid2">
        <div className="panel"><h2>Strengths</h2><ul>{iv.strengths.map((s) => <li key={s}>{s}</li>)}</ul></div>
        <div className="panel"><h2>Practice next</h2><ul>{iv.weakAreas.map((s) => <li key={s}>{s}</li>)}</ul></div>
      </section>

      <section className="stack">
        <h2>Your answers</h2>
        {iv.questions.map((q, i) => (
          <details key={q._id} className="panel qa">
            <summary>
              <span className="qa-score">{q.score}/10</span>
              <span>{q.isFollowUp && <em>Follow-up: </em>}{q.text}</span>
            </summary>
            <div className="stack qa-body">
              <div><h3>Your answer</h3><p className="pre">{q.answer}</p></div>
              <div><h3>Feedback</h3><p>{q.feedback}</p></div>
              {q.idealHint && <p className="hint"><strong>A strong answer includes:</strong> {q.idealHint}</p>}
            </div>
          </details>
        ))}
      </section>

      <div className="row">
        <Link className="btn" to="/new">Practice again</Link>
        <Link className="btn ghost" to="/">Back to dashboard</Link>
      </div>
    </div>
  );
}
