import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import type { AdminUser } from '../../types';
import logo from '../../assets/images.jfif';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    api.me()
      .then((data) => setUser(data.user))
      .catch(() => navigate('/admin/login'));
  }, [navigate]);

  async function logout() {
    await api.logout();
    navigate('/admin/login');
  }

  if (!user) {
    return <div className="login-page">Checking session…</div>;
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <img src={logo} alt="Logo" className="admin-logo" />
        <strong>Admin</strong>
        <p style={{ marginTop: '0.5rem', opacity: 0.8 }}>{user.display_name}</p>
        <nav>
          <NavLink to="/admin" end>Dashboard</NavLink>
          <NavLink to="/admin/notices">Notices</NavLink>
          <NavLink to="/admin/settings">Settings</NavLink>
          <NavLink to="/admin/users">Admin users</NavLink>
          <NavLink to="/admin/sync">Sync</NavLink>
        </nav>
        <button className="btn btn-secondary" style={{ marginTop: '2rem' }} type="button" onClick={logout}>
          Log out
        </button>
        <a href="/" style={{ display: 'block', marginTop: '1rem' }}>View kiosk</a>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
