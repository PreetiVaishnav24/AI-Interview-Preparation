import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api.js';
import { useAuth } from '../auth.js';

const INK = '#141A2E';
const BLUE = '#3A4CE0';

const Stat = ({ value, label }) => (
  <div className="stat"><strong>{value ?? '–'}</strong><span>{label}</span></div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [d, setD] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.dashboard().then(setD).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!d) return <p className="muted">Loading your progress…</p>;

  if (d.completed === 0) {
    return (
      <div className="stack">
        <h1>Welcome, {user.name.split(' ')[0]}</h1>
        <section className="panel stack">
          <h2>Your progress will show up here</h2>
          <p>Finish your first mock interview to see your score trend, strongest topics, and the areas to practice next.</p>
          {d.inProgress > 0 && <p className="notice">You have {d.inProgress} interview{d.inProgress > 1 ? 's' : ''} in progress. <Link to="/history">Continue</Link></p>}
          <div><Link className="btn" to="/new">Start an interview</Link></div>
        </section>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="session-head">
        <h1>Your progress</h1>
        <Link className="btn" to="/new">New interview</Link>
      </div>

      <section className="stats">
        <Stat value={`${d.averageScore}%`} label="average score" />
        <Stat value={`${d.bestScore}%`} label="best interview" />
        <Stat value={d.completed} label="interviews finished" />
        <Stat value={d.totalAnswers} label="answers scored" />
      </section>

      <section className="panel">
        <h2>Score over time</h2>
        <div className="chart">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={d.trend} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="#D9DCE6" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: INK, fontSize: 12 }} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: INK, fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => [`${v}%`, 'Score']} labelFormatter={(l, p) => `${p?.[0]?.payload?.role ?? ''} · ${l}`} />
              <Line type="monotone" dataKey="score" stroke={BLUE} strokeWidth={2.5} dot={{ r: 4, fill: BLUE }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid2">
        <div className="panel">
          <h2>Average by role</h2>
          <div className="chart">
            <ResponsiveContainer width="100%" height={Math.max(120, d.byRole.length * 44)}>
              <BarChart data={d.byRole} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis type="category" dataKey="role" width={120} tick={{ fill: INK, fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v) => [`${v}%`, 'Average']} />
                <Bar dataKey="avg" fill={BLUE} radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel stack">
          <div>
            <h2>Practice next</h2>
            {d.weakTopics.length ? <ul className="topics">{d.weakTopics.map((t) => <li key={t.topic}><span>{t.topic}</span><b className="low">{t.avg}/10</b></li>)}</ul> : <p className="muted">No weak spots yet. Every topic averages 7 or higher.</p>}
          </div>
          <div>
            <h2>Strongest topics</h2>
            {d.strongTopics.length ? <ul className="topics">{d.strongTopics.map((t) => <li key={t.topic}><span>{t.topic}</span><b className="high">{t.avg}/10</b></li>)}</ul> : <p className="muted">Topics you score 7 or higher on will appear here.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
