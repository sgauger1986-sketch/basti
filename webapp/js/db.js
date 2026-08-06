/* mexXsoft X2 Cloud — lokale Datenschicht (IndexedDB)
 *
 * Alle Daten liegen dauerhaft im Browser (IndexedDB) → die App funktioniert
 * komplett offline. Jede Änderung wird zusätzlich in eine "Outbox" geschrieben
 * und bei nächster Gelegenheit vom Sync-Modul zum Server übertragen.
 */
const X2DB = (() => {
  // Tabelle → Primärschlüssel (entspricht dem X2-Datenbankschema)
  const TABLES = {
    adressen:     'ID_ADRESSE',
    projekte:     'ID_PROJEKTE',
    lvlisten:     'ID_PROJEKTE_LVLIST',
    lvpositionen: 'ID_LV_POS',
    mitarbeiter:  'ID_ADR_MITARBEITER',
    material:     'ID_MAT_KATALOG',
    einheiten:    'ID_EINHEIT',
    mwst:         'ID_MWST',
    lohnarten:    'ID_LOHNART',
    rapporte:     'ID_RAPPORT'
  };

  let idb = null;
  const DB = {};            // In-Memory-Spiegel für schnelles Rendern
  const changeHooks = [];   // wird nach lokalen/entfernten Änderungen gerufen

  function open() {
    return new Promise((res, rej) => {
      const rq = indexedDB.open('x2cloud', 1);
      rq.onupgradeneeded = e => {
        const d = e.target.result;
        for (const t of Object.keys(TABLES)) d.createObjectStore(t, { keyPath: TABLES[t] });
        d.createObjectStore('outbox', { keyPath: 'obid', autoIncrement: true });
        d.createObjectStore('meta', { keyPath: 'k' });
      };
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => rej(rq.error);
    });
  }

  const tx = (stores, mode) => idb.transaction(stores, mode || 'readonly');
  const reqP = rq => new Promise((res, rej) => { rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); });
  const txP = t => new Promise((res, rej) => { t.oncomplete = res; t.onerror = t.onabort = () => rej(t.error); });

  const getAll = store => reqP(tx([store]).objectStore(store).getAll());

  async function metaGet(k) { const r = await reqP(tx(['meta']).objectStore('meta').get(k)); return r ? r.v : undefined; }
  async function metaSet(k, v) { const t = tx(['meta'], 'readwrite'); t.objectStore('meta').put({ k, v }); return txP(t); }

  async function init() {
    idb = await open();
    if (!(await metaGet('seeded'))) {
      const seed = await fetch('data/seed.json').then(r => r.json());
      const t = tx([...Object.keys(TABLES), 'meta'], 'readwrite');
      for (const [tab, rows] of Object.entries(seed)) {
        if (!TABLES[tab]) continue;
        const os = t.objectStore(tab);
        rows.forEach(r => { if (r[TABLES[tab]] != null) os.put(r); });
      }
      t.objectStore('meta').put({ k: 'seeded', v: 1 });
      await txP(t);
    }
    for (const tab of Object.keys(TABLES)) DB[tab] = await getAll(tab);
    return DB;
  }

  function memUpsert(table, rec) {
    const pk = TABLES[table];
    const arr = DB[table] || (DB[table] = []);
    const i = arr.findIndex(r => r[pk] === rec[pk]);
    if (i >= 0) arr[i] = rec; else arr.push(rec);
  }
  function memRemove(table, id) {
    const pk = TABLES[table];
    const arr = DB[table] || [];
    const i = arr.findIndex(r => r[pk] === id);
    if (i >= 0) arr.splice(i, 1);
  }

  // Lokale Änderung: speichern + in Outbox stellen (wird später synchronisiert)
  async function upsert(table, rec) {
    const pk = TABLES[table];
    rec._mod = Date.now();
    const t = tx([table, 'outbox'], 'readwrite');
    t.objectStore(table).put(rec);
    t.objectStore('outbox').put({ table, pk: rec[pk], op: 'upsert', data: rec, ts: rec._mod });
    await txP(t);
    memUpsert(table, rec);
    changeHooks.forEach(f => f('local'));
  }

  async function remove(table, id) {
    const t = tx([table, 'outbox'], 'readwrite');
    t.objectStore(table).delete(id);
    t.objectStore('outbox').put({ table, pk: id, op: 'delete', ts: Date.now() });
    await txP(t);
    memRemove(table, id);
    changeHooks.forEach(f => f('local'));
  }

  // Vom Server empfangene Änderung übernehmen (ohne Outbox-Eintrag)
  async function applyRemote(ch) {
    if (!TABLES[ch.table]) return;
    const t = tx([ch.table], 'readwrite');
    if (ch.op === 'delete') t.objectStore(ch.table).delete(ch.pk);
    else t.objectStore(ch.table).put(ch.data);
    await txP(t);
    if (ch.op === 'delete') memRemove(ch.table, ch.pk); else memUpsert(ch.table, ch.data);
  }

  const outboxAll = () => getAll('outbox');
  async function outboxCount() { return reqP(tx(['outbox']).objectStore('outbox').count()); }
  async function outboxClear(ids) {
    const t = tx(['outbox'], 'readwrite');
    ids.forEach(id => t.objectStore('outbox').delete(id));
    return txP(t);
  }

  // Neue Datensatz-IDs: 'W' + Zufall — kollisionsfrei über Geräte hinweg
  function newId() {
    const a = crypto.getRandomValues(new Uint8Array(6));
    return 'W' + Array.from(a, b => b.toString(16).padStart(2, '0')).join('').toUpperCase().slice(0, 9);
  }

  const onChange = f => changeHooks.push(f);
  const notifyRemote = () => changeHooks.forEach(f => f('remote'));

  return { TABLES, DB, init, upsert, remove, applyRemote, outboxAll, outboxCount, outboxClear, metaGet, metaSet, newId, onChange, notifyRemote };
})();
