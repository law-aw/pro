import { db } from './db.js';

// Update all draft notices to published
const result = db.prepare(`
  UPDATE notices 
  SET status = 'published', publish_at = datetime('now')
  WHERE status = 'draft' AND deleted = 0
`).run();

console.log(`Updated ${result.changes} notices from draft to published`);

// Verify the update
const publishedCount = db.prepare(`
  SELECT COUNT(*) as count FROM notices WHERE status = 'published' AND deleted = 0
`).get() as { count: number };

console.log(`Total published notices: ${publishedCount.count}`);
