import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.js';

const ROLES = ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Software Engineer', 'Data Analyst', 'Data Scientist', 'ML Engineer', 'DevOps Engineer', 'Mobile Developer', 'QA Engineer', 'Product Manager', 'UI/UX Designer'];

export default function NewInterview() {
  const { user, refreshUser } = useAuth();
  const nav = useNavigate();
  const fileRef = useRef(null);
  const [role, setRole] = useState('Full Stack Developer');
  const [custom, setCustom] = useState('');
  const [level, setLevel] = useState('Fresher');
  const [focus, setFocus] = useState('Mixed');
  const [count, setCount] = useState(5);
  const [useResume, setUseResume] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const chosenRole = custom.trim() || role;

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      await api.uploadResume(file);
      await refreshUser();
      setUseResume(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeResume = async () => {
    await api.deleteResume();
    await refreshUser();
    setUseResume(false);
  };

  const start = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const interview = await api.createInterview({ role: chosenRole, level, focus, count, useResume });
      nav(`/interview/${interview._id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="stack" onSubmit={start}>
      <h1>New interview</h1>

      <section className="panel stack">
        <h2>Job role</h2>
        <div className="chips" role="radiogroup" aria-label="Job role">
          {ROLES.map((r) => (
            <button type="button" key={r} role="radio" aria-checked={!custom.trim() && role === r}
              className={`chip ${!custom.trim() && role === r ? 'on' : ''}`} onClick={() => { setRole(r); setCustom(''); }}>
              {r}
            </button>
          ))}
        </div>
        <label>Or type another role<input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. Cloud Support Engineer" maxLength={80} /></label>
      </section>

      <section className="panel grid3">
        <label>Experience level
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            {['Fresher', 'Junior', 'Mid-level', 'Senior'].map((l) => <option key={l}>{l}</option>)}
          </select>
        </label>
        <label>Question type
          <select value={focus} onChange={(e) => setFocus(e.target.value)}>
            {['Mixed', 'Technical', 'Behavioral'].map((f) => <option key={f}>{f}</option>)}
          </select>
        </label>
        <label>Number of questions
          <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
            {[3, 5, 8, 10].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </section>

      <section className="panel stack">
        <h2>Resume-based questions</h2>
        {user.hasResume ? (
          <>
            <p className="muted">Using <strong>{user.resumeName}</strong>. Questions will draw on your projects, skills and experience.</p>
            <label className="check">
              <input type="checkbox" checked={useResume} onChange={(e) => setUseResume(e.target.checked)} />
              Base this interview on my resume
            </label>
            <div className="row">
              <button type="button" className="btn ghost" onClick={() => fileRef.current?.click()} disabled={uploading}>Replace resume</button>
              <button type="button" className="link" onClick={removeResume}>Remove</button>
            </div>
          </>
        ) : (
          <>
            <p className="muted">Upload your resume (PDF or text) and the AI will ask about what you actually built.</p>
            <div><button type="button" className="btn ghost" onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? 'Reading resume…' : 'Upload resume'}</button></div>
          </>
        )}
        <input ref={fileRef} type="file" accept="application/pdf,text/plain" hidden onChange={(e) => upload(e.target.files?.[0])} />
      </section>

      {error && <p className="error" role="alert">{error}</p>}
      <div>
        <button className="btn big" disabled={busy || !chosenRole}>{busy ? 'Writing your questions…' : `Start ${chosenRole} interview`}</button>
      </div>
    </form>
  );
}
