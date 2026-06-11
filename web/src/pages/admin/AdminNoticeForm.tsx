import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import type { Notice } from '../../types';

const CATEGORIES = ['Announcements', 'Events', 'Student notices', 'Staff notices', 'Research'];

export default function AdminNoticeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api.getNotices().then((data) => {
      const found = data.notices.find((item) => item.id === id) ?? null;
      setNotice(found);
    });
  }, [id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      if (editing && id) {
        await api.updateNotice(id, formData);
      } else {
        await api.createNotice(formData);
      }
      navigate('/admin/notices');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  return (
    <div>
      <h1>{editing ? 'Edit notice' : 'Create notice'}</h1>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Title
          <input className="text-input" name="title" defaultValue={notice?.title ?? ''} required />
        </label>
        <label>
          Body
          <textarea className="textarea-input" name="body" defaultValue={notice?.body ?? ''} required />
        </label>
        <label>
          Category
          <select className="select-input" name="category" defaultValue={notice?.category ?? CATEGORIES[0]}>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>
        <label>
          Priority
          <select className="select-input" name="priority" defaultValue={notice?.priority ?? 'normal'}>
            <option value="normal">Normal</option>
            <option value="pinned">Pinned</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
        <label>
          Status
          <select className="select-input" name="status" defaultValue={notice?.status ?? 'published'}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label>
          Audience
          <select className="select-input" name="audience" defaultValue={notice?.audience ?? 'all'}>
            <option value="all">All</option>
            <option value="staff">Staff</option>
            <option value="students">Students</option>
            <option value="postgraduate">Postgraduate</option>
          </select>
        </label>
        <label>
          Location
          <input className="text-input" name="location" defaultValue={notice?.location ?? ''} />
        </label>
        <label>
          Event start
          <input
            className="text-input"
            name="event_start"
            type="datetime-local"
            defaultValue={notice?.event_start?.slice(0, 16) ?? ''}
          />
        </label>
        <label>
          Event end
          <input
            className="text-input"
            name="event_end"
            type="datetime-local"
            defaultValue={notice?.event_end?.slice(0, 16) ?? ''}
          />
        </label>
        <label>
          Publish at
          <input
            className="text-input"
            name="publish_at"
            type="datetime-local"
            defaultValue={notice?.publish_at?.slice(0, 16) ?? ''}
          />
        </label>
        <label>
          Expires at
          <input
            className="text-input"
            name="expires_at"
            type="datetime-local"
            defaultValue={notice?.expires_at?.slice(0, 16) ?? ''}
          />
        </label>
        <label>
          Image
          <input className="text-input" name="image" type="file" accept="image/*" />
        </label>
        <label>
          Attachment (PDF)
          <input className="text-input" name="attachment" type="file" accept=".pdf,application/pdf" />
        </label>
        {error && <p className="error-text">{error}</p>}
        <div className="chip-row">
          <button className="btn" type="submit">Save notice</button>
          <button className="btn btn-secondary" type="button" onClick={() => navigate('/admin/notices')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
