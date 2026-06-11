import type { Notice } from '../types';

interface Props {
  notice: Notice;
  onClick: () => void;
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function NoticeCard({ notice, onClick }: Props) {
  return (
    <button
      type="button"
      className={`notice-card ${notice.priority}`}
      onClick={onClick}
    >
      <div className="chip-row">
        <span className="badge category">{notice.category}</span>
        {notice.priority === 'urgent' && <span className="badge urgent">Urgent</span>}
        {notice.priority === 'pinned' && <span className="badge pinned">Pinned</span>}
      </div>
      <h3>{notice.title}</h3>
      <p>{notice.body.slice(0, 120)}{notice.body.length > 120 ? '…' : ''}</p>
      {notice.location && <p className="meta-line">📍 {notice.location}</p>}
      {notice.event_start && <p className="meta-line">🗓 {formatDate(notice.event_start)}</p>}
    </button>
  );
}
