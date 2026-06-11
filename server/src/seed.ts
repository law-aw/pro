import { createAdmin } from './auth.js';
import { db, initializeDefaultAdmin } from './db.js';
import { randomUUID } from 'node:crypto';

await initializeDefaultAdmin();

const noticeCount = db.prepare('SELECT COUNT(*) as count FROM notices').get() as { count: number };

if (noticeCount.count === 0) {
  const now = new Date().toISOString();
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const samples = [
    {
      id: randomUUID(),
      title: 'Welcome to Electrical Engineering',
      body: 'This digital notice board keeps students and staff up to date with department announcements, events, and opportunities.',
      category: 'Announcements',
      priority: 'pinned',
      event_start: null,
      event_end: null,
      location: 'Department foyer',
    },
    {
      id: randomUUID(),
      title: 'Power Systems Seminar',
      body: 'Guest lecture on modern grid integration. All postgraduate students are encouraged to attend.',
      category: 'Events',
      priority: 'normal',
      event_start: nextWeek,
      event_end: nextWeek,
      location: 'LT-204',
    },
    {
      id: randomUUID(),
      title: 'Lab Safety Reminder',
      body: 'Safety goggles and closed shoes are required in all undergraduate teaching laboratories.',
      category: 'Student notices',
      priority: 'urgent',
      event_start: null,
      event_end: null,
      location: 'All labs',
    },
  ];

  const insert = db.prepare(`
    INSERT INTO notices (
      id, title, body, category, priority, status, audience, location,
      event_start, event_end, publish_at, created_at, updated_at, version, deleted
    ) VALUES (?, ?, ?, ?, ?, 'published', 'all', ?, ?, ?, ?, ?, ?, 1, 0)
  `);

  for (const sample of samples) {
    insert.run(
      sample.id,
      sample.title,
      sample.body,
      sample.category,
      sample.priority,
      sample.location,
      sample.event_start,
      sample.event_end,
      now,
      now,
      now,
    );
  }

  console.log('Added sample notices for the kiosk display.');
}

console.log('Seed complete.');
