#!/usr/bin/env node
/* mexXsoft X2 Cloud — Sync-Server
 *
 * Reines Node.js (>= 18), KEINE Abhängigkeiten. Aufgaben:
 *   1. Liefert die Web-App (../webapp) aus.
 *   2. /api/login  — Anmeldung (PBKDF2-gehashte Passwörter, Bearer-Token).
 *   3. /api/sync   — Push/Pull-Synchronisation über ein mandantengetrenntes,
 *                    revisioniertes Änderungsprotokoll (Konflikte: letzte
 *                    Änderung gewinnt, entschieden per Zeitstempel).
 *
 * Start:            node server.js                (Port 8080)
 * Benutzer anlegen: node server.js adduser <mandant> <benutzer> <passwort>
 * Produktion:       hinter HTTPS-Reverse-Proxy betreiben (Caddy/nginx),
 *                   siehe server/README.md.
 */
'use strict';
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = parseInt(process.env.PORT || '8080', 10);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const WEBAPP_DIR = process.env.WEBAPP_DIR || path.join(__dirname, '..', 'webapp');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json');
const TOKEN_TTL_MS = 30 * 24 * 3600 * 1000;   // 30 Tage
const MAX_BODY = 8 * 1024 * 1024;             // 8 MB
const PBKDF2_ITER = 210000;

fs.mkdirSync(DATA_DIR, { recursive: true });

// ---------- Benutzer & Passwörter ----------
function loadJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function saveJson(file, obj) {
  fs.writeFileSync(file + '.tmp', JSON.stringify(obj, null, 2));
  fs.renameSync(file + '.tmp', file);
}
let users = loadJson(USERS_FILE, { tenants: {} });

function hashPass(pass, salt) {
  return crypto.pbkdf2Sync(pass, salt, PBKDF2_ITER, 32, 'sha256').toString('hex');
}
function addUser(tenant, user, pass) {
  const t = (users.tenants[tenant] = users.tenants[tenant] || { users: {} });
  const salt = crypto.randomBytes(16).toString('hex');
  t.users[user] = { salt, hash: hashPass(pass, salt), iter: PBKDF2_ITER };
  saveJson(USERS_FILE, users);
}
function checkPass(tenant, user, pass) {
  const u = users.tenants[tenant] && users.tenants[tenant].users[user];
  if (!u) return false;
  const h = Buffer.from(hashPass(pass, u.salt), 'hex');
  return crypto.timingSafeEqual(h, Buffer.from(u.hash, 'hex'));
}

// CLI: Benutzer anlegen
if (process.argv[2] === 'adduser') {
  const [, , , tenant, user, pass] = process.argv;
  if (!tenant || !user || !pass) { console.error('Aufruf: node server.js adduser <mandant> <benutzer> <passwort>'); process.exit(1); }
  addUser(tenant, user, pass);
  console.log(`Benutzer angelegt: Mandant "${tenant}", Benutzer "${user}"`);
  process.exit(0);
}

// Demo-Zugang beim allerersten Start (Passwort bitte ändern!)
if (Object.keys(users.tenants).length === 0) {
  addUser('demo', 'demo', 'demo');
  console.log('⚠ Erststart: Demo-Zugang angelegt — Mandant "demo", Benutzer "demo", Passwort "demo".');
  console.log('  Für den Echtbetrieb eigene Zugänge anlegen: node server.js adduser <mandant> <benutzer> <passwort>');
}

// ---------- Tokens ----------
let tokens = loadJson(TOKENS_FILE, {});   // token -> {tenant,user,exp}
function pruneTokens() {
  const now = Date.now();
  let changed = false;
  for (const [t, v] of Object.entries(tokens)) if (v.exp < now) { delete tokens[t]; changed = true; }
  if (changed) saveJson(TOKENS_FILE, tokens);
}
function issueToken(tenant, user) {
  pruneTokens();
  const tok = crypto.randomBytes(24).toString('hex');
  tokens[tok] = { tenant, user, exp: Date.now() + TOKEN_TTL_MS };
  saveJson(TOKENS_FILE, tokens);
  return tok;
}
function auth(req) {
  const h = req.headers.authorization || '';
  const tok = h.startsWith('Bearer ') ? h.slice(7) : null;
  const v = tok && tokens[tok];
  if (!v || v.exp < Date.now()) return null;
  v.exp = Date.now() + TOKEN_TTL_MS;   // gleitende Verlängerung
  return v;
}

// ---------- Mandanten-Datenhaltung (Änderungsprotokoll) ----------
// Pro Mandant: changelog.jsonl (append-only) + In-Memory-Zustand für LWW-Prüfung.
const tenantsMem = {};   // tenant -> {log:[], state:Map('table|pk' -> ts), rev}

function tenantDir(tenant) { return path.join(DATA_DIR, 'tenants', tenant.replace(/[^\w.-]/g, '_')); }

function loadTenant(tenant) {
  if (tenantsMem[tenant]) return tenantsMem[tenant];
  const dir = tenantDir(tenant);
  fs.mkdirSync(dir, { recursive: true });
  const logFile = path.join(dir, 'changelog.jsonl');
  const mem = { log: [], state: new Map(), rev: 0, logFile };
  if (fs.existsSync(logFile)) {
    for (const line of fs.readFileSync(logFile, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try {
        const e = JSON.parse(line);
        mem.log.push(e);
        mem.rev = Math.max(mem.rev, e.rev);
        mem.state.set(e.table + '|' + e.pk, e.ts || 0);
      } catch { /* defekte Zeile überspringen */ }
    }
  } else {
    // Mandant neu → mit Demo-Daten aus der Web-App vorbefüllen
    try {
      const seed = JSON.parse(fs.readFileSync(path.join(WEBAPP_DIR, 'data', 'seed.json'), 'utf8'));
      const PKS = {
        adressen: 'ID_ADRESSE', projekte: 'ID_PROJEKTE', lvlisten: 'ID_PROJEKTE_LVLIST',
        lvpositionen: 'ID_LV_POS', mitarbeiter: 'ID_ADR_MITARBEITER', material: 'ID_MAT_KATALOG',
        einheiten: 'ID_EINHEIT', mwst: 'ID_MWST', lohnarten: 'ID_LOHNART', rapporte: 'ID_RAPPORT'
      };
      const lines = [];
      for (const [table, rows] of Object.entries(seed)) {
        const pk = PKS[table]; if (!pk) continue;
        for (const row of rows) {
          if (row[pk] == null) continue;
          const e = { rev: ++mem.rev, table, pk: row[pk], op: 'upsert', data: row, ts: 0, device: 'seed', at: new Date().toISOString() };
          mem.log.push(e);
          mem.state.set(table + '|' + e.pk, 0);
          lines.push(JSON.stringify(e));
        }
      }
      fs.writeFileSync(logFile, lines.join('\n') + '\n');
      console.log(`Mandant "${tenant}": mit ${mem.log.length} Demo-Datensätzen initialisiert.`);
    } catch (err) {
      fs.writeFileSync(logFile, '');
    }
  }
  tenantsMem[tenant] = mem;
  return mem;
}

function applyChanges(tenant, changes, user) {
  const mem = loadTenant(tenant);
  const accepted = [];
  const out = [];
  for (const ch of changes || []) {
    if (!ch || typeof ch.table !== 'string' || ch.pk == null) continue;
    if (!['upsert', 'delete'].includes(ch.op)) continue;
    const key = ch.table + '|' + ch.pk;
    const known = mem.state.get(key);
    // Letzte Änderung gewinnt: ältere Änderung als der aktuelle Stand wird verworfen
    if (known != null && (ch.ts || 0) < known) continue;
    const e = {
      rev: ++mem.rev, table: ch.table, pk: ch.pk, op: ch.op,
      data: ch.op === 'upsert' ? ch.data : undefined,
      ts: ch.ts || Date.now(), device: String(ch.device || ''), user,
      at: new Date().toISOString()
    };
    mem.log.push(e);
    mem.state.set(key, e.ts);
    out.push(JSON.stringify(e));
    accepted.push(e.rev);
  }
  if (out.length) fs.appendFileSync(mem.logFile, out.join('\n') + '\n');
  return accepted;
}

// ---------- HTTP ----------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css; charset=utf-8',
  '.ico': 'image/x-icon', '.md': 'text/markdown; charset=utf-8'
};

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function readBody(req) {
  return new Promise((res, rej) => {
    let size = 0; const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY) { rej(new Error('body too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => res(Buffer.concat(chunks).toString('utf8')));
    req.on('error', rej);
  });
}

// simple Rate-Limit für /api/login (Brute-Force-Bremse)
const loginHits = new Map();   // ip -> {n, t}
function loginAllowed(ip) {
  const now = Date.now();
  const h = loginHits.get(ip) || { n: 0, t: now };
  if (now - h.t > 15 * 60 * 1000) { h.n = 0; h.t = now; }
  h.n++;
  loginHits.set(ip, h);
  return h.n <= 30;
}

async function handle(req, res) {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;

  // ---- API ----
  if (p === '/api/health') return sendJson(res, 200, { ok: true, name: 'mexXsoft X2 Cloud Sync', time: new Date().toISOString() });

  if (p === '/api/login' && req.method === 'POST') {
    const ip = req.socket.remoteAddress || '?';
    if (!loginAllowed(ip)) return sendJson(res, 429, { error: 'Zu viele Anmeldeversuche — bitte später erneut versuchen.' });
    let body;
    try { body = JSON.parse(await readBody(req)); } catch { return sendJson(res, 400, { error: 'Ungültige Anfrage.' }); }
    const { tenant, user, pass } = body || {};
    if (!tenant || !user || !pass || !checkPass(tenant, user, pass)) {
      return sendJson(res, 401, { error: 'Mandant, Benutzer oder Passwort falsch.' });
    }
    return sendJson(res, 200, { token: issueToken(tenant, user), tenant, user });
  }

  if (p === '/api/sync' && req.method === 'POST') {
    const session = auth(req);
    if (!session) return sendJson(res, 401, { error: 'Nicht angemeldet.' });
    let body;
    try { body = JSON.parse(await readBody(req)); } catch { return sendJson(res, 400, { error: 'Ungültige Anfrage.' }); }
    const since = Math.max(0, parseInt(body.since || 0, 10) || 0);
    const accepted = applyChanges(session.tenant, body.changes, session.user);
    const mem = loadTenant(session.tenant);
    const changes = mem.log.filter(e => e.rev > since);
    return sendJson(res, 200, { rev: mem.rev, accepted: accepted.length, changes });
  }

  if (p.startsWith('/api/')) return sendJson(res, 404, { error: 'Unbekannter Endpunkt.' });

  // ---- Statische Web-App ----
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  let rel = decodeURIComponent(p);
  if (rel === '/' || rel === '') rel = '/index.html';
  const file = path.normalize(path.join(WEBAPP_DIR, rel));
  if (!file.startsWith(path.normalize(WEBAPP_DIR))) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Nicht gefunden'); }
    const mime = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}

function onRequest(req, res) {
  handle(req, res).catch(err => {
    console.error(err);
    try { sendJson(res, 500, { error: 'Interner Fehler.' }); } catch { }
  });
}

// HTTPS direkt (optional, sonst Reverse-Proxy): TLS_CERT / TLS_KEY setzen
let server;
if (process.env.TLS_CERT && process.env.TLS_KEY) {
  server = https.createServer({ cert: fs.readFileSync(process.env.TLS_CERT), key: fs.readFileSync(process.env.TLS_KEY) }, onRequest);
} else {
  server = http.createServer(onRequest);
}
server.listen(PORT, () => {
  console.log(`mexXsoft X2 Cloud Sync-Server läuft auf Port ${PORT} (${process.env.TLS_CERT ? 'HTTPS' : 'HTTP — für Produktion hinter HTTPS-Proxy betreiben'})`);
  console.log(`Web-App: http://localhost:${PORT}/`);
});
