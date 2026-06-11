import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import KioskHeader from '../components/KioskHeader';
import NoticeCard from '../components/NoticeCard';
import type { Notice } from '../types';

const CATEGORIES = [
  'All',
  'Announcements',
  'Events',
  'Student notices',
  'Staff notices',
  'Research',
];

export default function KioskHome() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    const load = () => api.getPublicNotices().then((data) => setNotices(data.notices));
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timer = window.setTimeout(() => setIdle(true), 60_000);
    const reset = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), 60_000);
    };
    window.addEventListener('pointerdown', reset);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', reset);
    };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notices.filter((notice) => {
      const matchesCategory = category === 'All' || notice.category === category;
      const matchesSearch =
        !query ||
        notice.title.toLowerCase().includes(query) ||
        notice.body.toLowerCase().includes(query) ||
        notice.category.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [notices, search, category]);

  const heroNotices = filtered.filter((n) => n.priority !== 'normal').slice(0, 3);
  const slideshowNotices = heroNotices.length > 0 ? heroNotices : filtered.slice(0, 5);

  useEffect(() => {
    if (!idle || slideshowNotices.length === 0) return;
    const timer = setInterval(() => {
      setSlideshowIndex((index) => (index + 1) % slideshowNotices.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [idle, slideshowNotices.length]);

  const hero = slideshowNotices[slideshowIndex];

  return (
    <div className="app-shell">
      <KioskHeader search={search} onSearchChange={setSearch} />

      <main className="content">
        {idle && hero ? (
          <section className="slideshow">
            <div className="slideshow-hero">
              <span className="badge category">{hero.category}</span>
              <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)', margin: '1rem 0 0' }}>{hero.title}</h2>
              <p style={{ fontSize: 'clamp(1rem, 2vw, 1.4rem)', maxWidth: '50ch' }}>{hero.body}</p>
            </div>
          </section>
        ) : (
          <>
            <div className="chip-row" style={{ marginBottom: '1rem' }}>
              {CATEGORIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`chip ${category === item ? 'active' : ''}`}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state">No notices to display right now.</div>
            ) : (
              <div className="notice-grid">
                {filtered.map((notice) => (
                  <NoticeCard
                    key={notice.id}
                    notice={notice}
                    onClick={() => navigate(`/notice/${notice.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <nav className="bottom-nav">
        <button type="button" className="btn btn-secondary" onClick={() => setCategory('All')}>
          Home
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setSearch('')}>
          Clear search
        </button>
        <button type="button" className="btn" onClick={() => window.location.href = '/admin/login'}>
          Staff login
        </button>
      </nav>
    </div>
  );
}
