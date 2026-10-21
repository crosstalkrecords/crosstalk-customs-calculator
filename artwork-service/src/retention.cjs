'use strict';
const fs=require('node:fs/promises');
async function prune(store,now=Date.now()){
 const expired=store.db.prepare("SELECT id FROM jobs WHERE ((state='draft' OR state='ready') AND created<?) OR ((state='delivered' OR state='failed') AND created<?)").all(now-86400000,now-7*86400000);
 for(const {id} of expired){await fs.rm(store.dir(id),{recursive:true,force:true});store.db.prepare('DELETE FROM jobs WHERE id=?').run(id);}
 return expired.length;
}
module.exports={prune};
