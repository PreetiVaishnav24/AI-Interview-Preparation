import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.js';

export default function Auth({ mode }) {
  const { signIn } = useAuth();
  const isRegister = mode === 'register';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      signIn(await (isRegister ? api.register(form) : api.login(form)));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-intro">
        <h1>Practice the interview before it counts.</h1>
        <p>Pick a role, answer AI-written questions, and get a score with specific feedback after every answer.</p>
      </div>
      <form className="panel auth-form" onSubmit={submit}>
        <h2>{isRegister ? 'Create your account' : 'Sign in'}</h2>
        {isRegister && (
          <label>Name<input value={form.name} onChange={set('name')} autoComplete="name" required /></label>
        )}
        <label>Email<input type="email" value={form.email} onChange={set('email')} autoComplete="email" required /></label>
        <label>Password<input type="password" value={form.password} onChange={set('password')} autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={6} required /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}</button>
        <p className="muted small">
          {isRegister ? <>Already have an account? <Link to="/login">Sign in</Link></> : <>New here? <Link to="/register">Create an account</Link></>}
        </p>
      </form>
    </div>
  );
}
