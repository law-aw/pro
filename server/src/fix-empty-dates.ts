import { db } from './db.js';

// Fix empty string publish_at to now (can't be NULL due to constraint)
const result = db.prepare(`
  UPDATE notices 
  SET publish_at = datetime('now') WHERE publish_at = ''
`).run();

console.log(`Fixed ${result.changes} notices with empty publish_at`);

// Fix empty string expires_at to NULL
const result2 = db.prepare(`
  UPDATE notices 
  SET expires_at = NULL WHERE expires_at = ''
`).run();

console.log(`Fixed ${result2.changes} notices with empty expires_at`);

// Verify
const publishedNotices = db.prepare(`
  SELECT id, title, status, publish_at, expires_at, deleted FROM notices
  WHERE status = 'published' AND deleted = 0
`).all();

console.log('\nPublished notices after fix:');
console.table(publishedNotices);
