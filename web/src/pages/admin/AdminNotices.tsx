import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import type { Notice } from '../../types';

export default function AdminNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    api.getNotices().then((data) => setNotices(data.notices));
  }, []);

  async function remove(id: string) {
    if (!window.confirm('Delete this notice?')) return;
    await api.deleteNotice(id);
    setNotices((current) => current.filter((notice) => notice.id !== id));
  }

  return (
    <div>
      <div className="chip-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Notices</h1>
        <Link className="btn" to="/admin/notices/new">New notice</Link>
      </div>
      <table className="table" style={{ marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {notices.map((notice) => (
            <tr key={notice.id}>
              <td>{notice.title}</td>
              <td>{notice.category}</td>
              <td>{notice.status}</td>
              <td>{notice.priority}</td>
              <td>
                <div className="chip-row">
                  <Link className="btn btn-secondary" to={`/admin/notices/${notice.id}/edit`}>Edit</Link>
                  <button className="btn btn-danger" type="button" onClick={() => remove(notice.id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
