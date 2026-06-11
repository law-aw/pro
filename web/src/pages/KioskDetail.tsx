import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, mediaUrl } from '../api';
import KioskHeader from '../components/KioskHeader';
import type { Notice } from '../types';

export default function KioskDetail() {
  const { id } = useParams();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!id) return;
    api.getPublicNotice(id).then((data) => setNotice(data.notice));
  }, [id]);

  if (!notice) {
    return (
      <div className="app-shell">
        <KioskHeader search={search} onSearchChange={setSearch} />
        <main className="content">
          <div className="empty-state">Loading notice…</div>
        </main>
      </div>
    );
  }

  const image = mediaUrl(notice.image_path);
  const attachment = mediaUrl(notice.attachment_path);

  return (
    <div className="app-shell">
      <KioskHeader search={search} onSearchChange={setSearch} />
      <main className="content">
        <article className="detail-panel">
          <div className="chip-row">
            <span className="badge category">{notice.category}</span>
            {notice.priority === 'urgent' && <span className="badge urgent">Urgent</span>}
            {notice.priority === 'pinned' && <span className="badge pinned">Pinned</span>}
          </div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}>{notice.title}</h2>
          {image && <img src={image} alt="" />}
          <p style={{ fontSize: 'clamp(1rem, 1.8vw, 1.2rem)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {notice.body}
          </p>
          {notice.location && <p className="meta-line">Location: {notice.location}</p>}
          {notice.event_start && (
            <p className="meta-line">
              Event: {new Date(notice.event_start).toLocaleString()}
            </p>
          )}
          {attachment && (
            <p>
              <a href={attachment} target="_blank" rel="noreferrer">
                Open attachment
              </a>
            </p>
          )}
          <Link className="btn btn-secondary" to="/" style={{ display: 'inline-block', marginTop: '1rem' }}>
            Back to board
          </Link>
        </article>
      </main>
    </div>
  );
}
