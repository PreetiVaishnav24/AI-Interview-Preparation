import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function History() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listInterviews().then(setItems).catch((e) => setError(e.message));
  }, []);

  const remove = async (id) => {
    if (!window.confirm('Delete this interview? This cannot be undone.')) return;
    await api.deleteInterview(id);
    setItems((list) => list.filter((i) => i._id !== id));
  };

  if (error) return <p className="error">{error}</p>;
  if (!items) return <p className="muted">Loading history…</p>;

  return (
    <div className="stack">
      <h1>Interview history</h1>
      {items.length === 0 ? (
        <section className="panel stack">
          <p>You have not practiced yet.</p>
          <div><Link className="btn" to="/new">Start your first interview</Link></div>
        </section>
      ) : (
        <div className="panel list">
          {items.map((i) => (
            <div className="list-row" key={i._id}>
              <div>
                <strong>{i.level} {i.role}</strong>
                <p className="muted small">
                  {new Date(i.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })} · {i.focus}{i.usesResume ? ' · from resume' : ''} · {i.answered}/{i.totalQuestions} answered
                </p>
              </div>
              <div className="row">
                {i.status === 'completed'
                  ? <><span className="pill">{i.overallScore}%</span><Link className="btn ghost" to={`/report/${i._id}`}>Report</Link></>
                  : <Link className="btn ghost" to={`/interview/${i._id}`}>Continue</Link>}
                <button className="link" onClick={() => remove(i._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
