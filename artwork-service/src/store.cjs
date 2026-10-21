'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {DatabaseSync}=require('node:sqlite');
const {digest}=require('./project.cjs');
function openStore(root){
 fs.mkdirSync(root,{recursive:true,mode:0o700});
 const db=new DatabaseSync(path.join(root,'jobs.sqlite'));
 db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY,token_hash TEXT NOT NULL,created INTEGER NOT NULL,state TEXT NOT NULL,project TEXT,digest TEXT,binding TEXT,attempts INTEGER NOT NULL DEFAULT 0,next_attempt INTEGER NOT NULL DEFAULT 0,error TEXT);
 CREATE TABLE IF NOT EXISTS assets(job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,hash TEXT NOT NULL,bytes INTEGER NOT NULL,mime TEXT NOT NULL,PRIMARY KEY(job_id,hash));`);
 // One process/one worker per persistent volume. A crash resumes queued delivery.
 db.prepare("UPDATE jobs SET state='queued' WHERE state='processing'").run();
 function get(id){return db.prepare('SELECT * FROM jobs WHERE id=?').get(id);}
 function dir(id){if(!/^[a-f0-9]{32}$/.test(id))throw Error('Invalid ID');return path.join(root,id);}
 return {root,db,get,dir,
 create(){const id=crypto.randomBytes(16).toString('hex'),token=crypto.randomBytes(32).toString('base64url');db.prepare("INSERT INTO jobs(id,token_hash,created,state) VALUES(?,?,?,'draft')").run(id,digest(token),Date.now());fs.mkdirSync(dir(id),{mode:0o700});fs.mkdirSync(path.join(dir(id),'assets'),{mode:0o700});return{id,token};},
 authorize(id,token){const j=get(id);return j&&typeof token==='string'&&digest(token)===j.token_hash?j:null;},
 assets(id){return db.prepare('SELECT hash,bytes,mime FROM assets WHERE job_id=?').all(id);},
 close(){db.close();}
 };
}
module.exports={openStore};
