'use strict';
// Daily backup (Vercel Cron): every account, profile, study-progress row, activity row and review event, saved as one gzipped JSON
// file in a Google Drive folder. Keeps the newest 30 files. Works on Supabase's free plan (reads with the service key).
// Google access, either:
//   A) a Google Workspace Shared Drive + service account: GOOGLE_SERVICE_ACCOUNT_JSON
//   B) your own Drive (any Google account): GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
// Plus: BACKUP_FOLDER_ID (the Drive folder), CRON_SECRET, SUPABASE_SERVICE_ROLE_KEY.
const zlib = require('zlib'), crypto = require('crypto');
const E = require('./_encourage');
const KEEP = 30;
const log = (outcome, extra = {}) => console.log(JSON.stringify({ backup: outcome, ...extra }));   // counts only, never data

async function sbGet(path){
  const r = await fetch(E.SB_URL + path, { headers: { ...E.admin(), Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
  if(!r.ok) throw new Error(`supabase ${r.status} ${path.split('?')[0]}`);
  return r.json();
}
async function table(name, optional){   // all rows, 1000 at a time
  const out = [];
  for(let from = 0; ; from += 1000){
    const r = await fetch(`${E.SB_URL}/rest/v1/${name}?select=*${name === 'review_events' ? '&order=id' : ''}`, { headers: { ...E.admin(), Range: `${from}-${from + 999}`, 'Range-Unit': 'items' }, signal: AbortSignal.timeout(20000) });
    if(optional && r.status === 404) return out;   // table not created yet
    if(!r.ok && r.status !== 206) throw new Error(`supabase ${r.status} ${name}`);
    const rows = await r.json(); out.push(...rows);
    if(rows.length < 1000) return out;
  }
}
async function users(){
  const out = [];
  for(let page = 1; page <= 50; page++){
    const d = await sbGet(`/auth/v1/admin/users?page=${page}&per_page=200`);
    const u = d.users || []; out.push(...u.map(x => ({ id: x.id, email: x.email, created_at: x.created_at, last_sign_in_at: x.last_sign_in_at, email_confirmed_at: x.email_confirmed_at, user_metadata: x.user_metadata, app_metadata: x.app_metadata })));
    if(u.length < 200) return out;
  }
  return out;
}

// ---- Google access token ----
const b64url = b => Buffer.from(b).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
async function token(){
  let body;
  if(process.env.GOOGLE_SERVICE_ACCOUNT_JSON){
    const sa = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON), now = Math.floor(Date.now() / 1000);
    const unsigned = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' })) + '.' + b64url(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/drive', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
    const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key);
    body = new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: unsigned + '.' + b64url(sig) });
  } else {
    body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: process.env.GOOGLE_REFRESH_TOKEN, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET });
  }
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body, signal: AbortSignal.timeout(10000) });
  const d = await r.json().catch(() => ({}));
  if(!r.ok || !d.access_token) throw new Error(`google token ${r.status} ${d.error || ''}`);
  return d.access_token;
}
async function upload(access, name, data){
  const boundary = 'tabiprep' + crypto.randomBytes(8).toString('hex');
  const meta = JSON.stringify({ name, parents: [process.env.BACKUP_FOLDER_ID], mimeType: 'application/gzip' });
  const body = Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: application/gzip\r\n\r\n`), data, Buffer.from(`\r\n--${boundary}--`)]);
  const r = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name', { method: 'POST', body,
    headers: { Authorization: `Bearer ${access}`, 'Content-Type': `multipart/related; boundary=${boundary}` }, signal: AbortSignal.timeout(30000) });
  const d = await r.json().catch(() => ({}));
  if(!r.ok) throw new Error(`drive upload ${r.status} ${(d.error && d.error.message || '').slice(0, 80)}`);
  return d;
}
async function prune(access){
  const q = encodeURIComponent(`'${process.env.BACKUP_FOLDER_ID}' in parents and name contains 'tabiprep-backup-' and trashed = false`);
  const r = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=name desc&pageSize=200&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true`, { headers: { Authorization: `Bearer ${access}` }, signal: AbortSignal.timeout(15000) });
  if(!r.ok) return 0;
  const old = ((await r.json()).files || []).slice(KEEP);
  for(const f of old) await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}?supportsAllDrives=true`, { method: 'DELETE', headers: { Authorization: `Bearer ${access}` }, signal: AbortSignal.timeout(15000) });
  return old.length;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if(!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).json({ error: 'Unauthorized' });
  const google = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || (process.env.GOOGLE_REFRESH_TOKEN && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const missing = [!process.env.SUPABASE_SERVICE_ROLE_KEY && 'SUPABASE_SERVICE_ROLE_KEY', !process.env.BACKUP_FOLDER_ID && 'BACKUP_FOLDER_ID', !google && 'GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN'].filter(Boolean);
  if(missing.length){ log('not_configured', { missing }); return res.status(503).json({ error: 'Not configured', missing }); }
  try {
    const [u, profiles, progress, activity, review_events] = await Promise.all([users(), table('profiles'), table('progress'), table('activity'), table('review_events', true)]);
    const snapshot = { app: 'TabiPrep', kind: 'daily-backup', version: 1, created: new Date().toISOString(), counts: { users: u.length, profiles: profiles.length, progress: progress.length, activity: activity.length, review_events: review_events.length }, users: u, profiles, progress, activity, review_events };
    const gz = zlib.gzipSync(Buffer.from(JSON.stringify(snapshot)));
    const name = `tabiprep-backup-${snapshot.created.slice(0, 10)}.json.gz`;
    const access = await token();
    await upload(access, name, gz);
    const removed = await prune(access);
    log('ok', { ...snapshot.counts, bytes: gz.length, removed });
    return res.status(200).json({ ok: true, name, ...snapshot.counts, bytes: gz.length, removed });
  } catch(e){
    log('failed', { error: String(e.message).slice(0, 120) });
    return res.status(502).json({ error: 'Backup failed', detail: String(e.message).slice(0, 120) });
  }
};
