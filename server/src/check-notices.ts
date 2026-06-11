import { db } from './db.js';

// Check all notices
const allNotices = db.prepare(`
  SELECT id, title, status, publish_at, expires_at, deleted FROM notices
`).all();

console.log('All notices in database:');
console.table(allNotices);

// Check specifically for published notices
const publishedNotices = db.prepare(`
  SELECT id, title, status, publish_at, expires_at, deleted FROM notices
  WHERE status = 'published' AND deleted = 0
`).all();

console.log('\nPublished notices:');
console.table(publishedNotices);

// Check what getPublishedNotices would return
const now = new Date().toISOString();
const filteredNotices = db.prepare(`
  SELECT * FROM notices
  WHERE deleted = 0
    AND status = 'published'
    AND publish_at <= ?
    AND (expires_at IS NULL OR expires_at > ?)
  ORDER BY
    CASE priority WHEN 'urgent' THEN 0 WHEN 'pinned' THEN 1 ELSE 2 END,
    publish_at DESC
`).all(now, now);

console.log('\nFiltered published notices (what student side sees):');
console.table(filteredNotices);

console.log('\nCurrent time:', now);
