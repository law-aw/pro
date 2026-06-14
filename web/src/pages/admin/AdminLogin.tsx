import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import logo from '../../assets/images.jfif';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await api.login(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <img src={logo} alt="Logo" className="login-logo" />
        <h1>Staff login</h1>
        <p className="meta-line">Southern Delta University — Electrical Engineering</p>
        <label>
          Email
          <input className="text-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input
            className="text-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button className="btn" type="submit">Sign in</button>
        <a href="/">Back to notice board</a>
      </form>
    </div>
  );
}
