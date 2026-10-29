'use strict';
// /api/backup: daily Drive backup. Cron-only; reads every table with the service key; uploads one gzip; keeps 30.
const assert = require('node:assert/strict'), zlib = require('zlib'), crypto = require('crypto'), handler = require('../api/backup');
let count = 0; const ok = (n, v) => { assert.ok(v, n); count++; console.log('PASS', n); };
const res = () => ({ statusCode: 200, body: null, setHeader(){}, status(n){ this.statusCode = n; return this; }, json(x){ this.body = x; return this; } });
(async () => {
  const realFetch = global.fetch, realLog = console.log, logs = [];
  process.env.CRON_SECRET = 'cron';
  let r = res(); await handler({ headers: {} }, r); ok('Only Vercel Cron can run it', r.statusCode === 401);
  r = res(); await handler({ headers: { authorization: 'Bearer cron' } }, r); ok('Missing settings are named', r.statusCode === 503 && r.body.missing.length === 3);
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_x'; process.env.BACKUP_FOLDER_ID = 'folder123';
  const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({ client_email: 'backup@proj.iam.gserviceaccount.com', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }) });
  let tokenBody = null, uploaded = null, deleted = [];
  const files = Array.from({ length: 32 }, (_, i) => ({ id: 'f' + i, name: `tabiprep-backup-2026-09-${String(i + 1).padStart(2, '0')}.json.gz` })).reverse();
  global.fetch = async (url, o = {}) => {
    const J = (x, s = 200) => ({ ok: s < 300, status: s, json: async () => x });
    if(url.includes('/auth/v1/admin/users')) return J({ users: [{ id: 'u1', email: 'a@example.invalid', user_metadata: { journey_why: 'x' } }] });
    if(url.includes('/rest/v1/progress')) return J([{ user_id: 'u1', data: { cards: { '1A-001': { history: [{ r: 'good' }] } } } }]);
    if(url.includes('/rest/v1/')) return J([{ user_id: 'u1' }]);
    if(url.includes('oauth2.googleapis.com/token')){ tokenBody = String(o.body); return J({ access_token: 'ya29.x' }); }
    if(url.includes('/upload/drive/v3/files')){ uploaded = { headers: o.headers, body: o.body }; return J({ id: 'new', name: 'x' }); }
    if(url.includes('/drive/v3/files?q=')) return J({ files });
    if(o.method === 'DELETE'){ deleted.push(url.split('/files/')[1].split('?')[0]); return J({}); }
    throw new Error('unexpected ' + url);
  };
  console.log = (...a) => logs.push(a.join(' '));
  r = res(); await handler({ headers: { authorization: 'Bearer cron' } }, r);
  console.log = realLog; global.fetch = realFetch;
  ok('Backup runs and reports counts', r.statusCode === 200 && r.body.users === 1 && r.body.progress === 1 && /^tabiprep-backup-\d{4}-\d{2}-\d{2}\.json\.gz$/.test(r.body.name));
  ok('Service account signs in with a signed token (no password stored)', /grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer/.test(tokenBody));
  const text = uploaded.body.toString('latin1'), gzStart = uploaded.body.indexOf(Buffer.from([0x1f, 0x8b]));
  ok('Uploaded into the chosen folder', text.includes('"parents":["folder123"]') && uploaded.headers.Authorization === 'Bearer ya29.x');
  const json = JSON.parse(zlib.gunzipSync(uploaded.body.slice(gzStart, uploaded.body.lastIndexOf(Buffer.from('\r\n--')))).toString());
  ok('The file holds accounts, progress and activity', json.users[0].id === 'u1' && json.progress[0].data.cards['1A-001'] && Array.isArray(json.activity) && json.app === 'TabiPrep');
  ok('Keeps the newest 30, deletes the rest', deleted.length === 2 && deleted.every(id => ['f0', 'f1'].includes(id)));
  ok('Logs hold counts only', logs.every(l => !l.includes('@') && !l.includes('journey')));
  console.log(`${count} backup checks passed.`);
})().catch(e => { console.error(e); process.exitCode = 1; });
