'use strict';
const fs=require('node:fs/promises');
async function prune(store,now=Date.now()){
 // Failed jobs and their source files are retained until a successful retry.
 // Delivery retention starts when delivery completed, not when a draft began.
 // A delayed or uncertain intake can still need its ready artwork after a day.
 // Older volumes and standalone store users may not have the test table yet.
 const hasTestSubmissions=!!store.db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='test_submissions'").get();
 const pendingIntake=hasTestSubmissions?` AND NOT EXISTS (
  SELECT 1 FROM test_submissions s WHERE s.reference_id=jobs.id
  AND s.state IN ('queued','dispatching','processing','unknown','manual_review')
 )`:'';
 const expired=store.db.prepare(`SELECT id FROM jobs WHERE
  ((state='draft' OR state='ready') AND created<?${pendingIntake})
  OR (state='delivered' AND coalesce(completed_at,created)<?)`).all(now-86400000,now-7*86400000);
 for(const {id} of expired){await fs.rm(store.dir(id),{recursive:true,force:true});store.db.prepare('DELETE FROM jobs WHERE id=?').run(id);}
 return expired.length;
}
module.exports={prune};
