/* mexXsoft X2 Cloud — Synchronisation mit dem Server
 *
 * Prinzip "Offline-First":
 *  - Die App arbeitet immer gegen die lokale Datenbank (sofort, auch ohne Netz).
 *  - Ist ein Server verbunden, werden Änderungen aus der Outbox gepusht und
 *    fremde Änderungen (andere Geräte/Benutzer) gepullt — automatisch bei
 *    Netzwiederkehr, nach jeder lokalen Änderung und alle 60 Sekunden.
 *  - Konflikte löst der Server nach "letzte Änderung gewinnt" (Zeitstempel).
 */
const X2Sync = (() => {
  const listeners = [];
  const status = {
    online: navigator.onLine,
    configured: false,   // Zugangsdaten vorhanden?
    syncing: false,
    pending: 0,
    lastSync: null,
    error: null,
    tenant: null,
    user: null
  };

  let deviceId = null;
  let timer = null;
  let debounce = null;

  const emit = () => listeners.forEach(f => f(status));
  const onStatus = f => { listeners.push(f); f(status); };

  async function refreshPending() { status.pending = await X2DB.outboxCount(); }

  async function init() {
    deviceId = await X2DB.metaGet('deviceId');
    if (!deviceId) { deviceId = X2DB.newId() + '-' + X2DB.newId(); await X2DB.metaSet('deviceId', deviceId); }
    status.tenant = await X2DB.metaGet('tenant') || null;
    status.user = await X2DB.metaGet('user') || null;
    status.configured = !!(await X2DB.metaGet('token'));
    await refreshPending();

    window.addEventListener('online', () => { status.online = true; emit(); syncNow(); });
    window.addEventListener('offline', () => { status.online = false; emit(); });
    X2DB.onChange(kind => { if (kind === 'local') { refreshPending().then(emit); requestSync(); } });
    timer = setInterval(() => syncNow().catch(() => {}), 60000);
    emit();
    if (status.configured && status.online) syncNow().catch(() => {});
  }

  function requestSync() {
    clearTimeout(debounce);
    debounce = setTimeout(() => syncNow().catch(() => {}), 2500);
  }

  async function serverUrl() { return (await X2DB.metaGet('serverUrl')) || ''; }

  async function login(server, tenant, user, pass) {
    server = (server || '').replace(/\/+$/, '');
    const res = await fetch(server + '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant, user, pass })
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.error || ('Anmeldung fehlgeschlagen (' + res.status + ')'));
    }
    const { token } = await res.json();
    await X2DB.metaSet('serverUrl', server);
    await X2DB.metaSet('token', token);
    await X2DB.metaSet('tenant', tenant);
    await X2DB.metaSet('user', user);
    status.configured = true; status.tenant = tenant; status.user = user; status.error = null;
    emit();
    return syncNow();
  }

  async function logout() {
    await X2DB.metaSet('token', '');
    status.configured = false; status.error = null;
    emit();
  }

  async function syncNow() {
    if (status.syncing || !navigator.onLine) return;
    const token = await X2DB.metaGet('token');
    if (!token) return;
    status.syncing = true; status.error = null; emit();
    try {
      const outbox = await X2DB.outboxAll();
      const since = (await X2DB.metaGet('lastRev')) || 0;
      const res = await fetch((await serverUrl()) + '/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({
          since,
          device: deviceId,
          changes: outbox.map(o => ({ table: o.table, pk: o.pk, op: o.op, data: o.data, ts: o.ts, device: deviceId }))
        })
      });
      if (res.status === 401) {
        status.configured = false;
        throw new Error('Sitzung abgelaufen — bitte neu anmelden.');
      }
      if (!res.ok) throw new Error('Server-Fehler (' + res.status + ')');
      const { rev, changes } = await res.json();
      let applied = 0;
      for (const ch of changes) {
        if (ch.device === deviceId) continue;   // eigene Änderungen nicht doppelt anwenden
        await X2DB.applyRemote(ch);
        applied++;
      }
      await X2DB.outboxClear(outbox.map(o => o.obid));
      await X2DB.metaSet('lastRev', rev);
      status.lastSync = new Date();
      await refreshPending();
      if (applied > 0) X2DB.notifyRemote();
    } catch (err) {
      status.error = err.message || String(err);
    } finally {
      status.syncing = false;
      emit();
    }
  }

  return { init, login, logout, syncNow, onStatus, status };
})();
