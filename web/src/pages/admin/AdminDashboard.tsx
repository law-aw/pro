import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import type { Notice } from '../../types';

export default function AdminDashboard() {
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    api.getNotices().then((data) => setNotices(data.notices));
  }, []);

  const published = notices.filter((n) => n.status === 'published').length;
  const drafts = notices.filter((n) => n.status === 'draft').length;
  const urgent = notices.filter((n) => n.priority === 'urgent').length;

  return (
    <div>
      <h1>Dashboard</h1>
      <p className="meta-line">Manage the Electrical Engineering notice board.</p>
      <div className="notice-grid" style={{ marginTop: '1.5rem' }}>
        <div className="notice-card" style={{ cursor: 'default' }}>
          <h3>{published}</h3>
          <p>Published notices</p>
        </div>
        <div className="notice-card" style={{ cursor: 'default' }}>
          <h3>{drafts}</h3>
          <p>Drafts</p>
        </div>
        <div className="notice-card" style={{ cursor: 'default' }}>
          <h3>{urgent}</h3>
          <p>Urgent notices</p>
        </div>
      </div>
      <div className="chip-row" style={{ marginTop: '1.5rem' }}>
        <Link className="btn" to="/admin/notices/new">Create notice</Link>
        <Link className="btn btn-secondary" to="/admin/sync">Sync settings</Link>
      </div>
    </div>
  );
}
