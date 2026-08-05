/* mexXsoft X2 Cloud — Oberfläche
 * Views entsprechen dem X2-Prototyp; neu sind Bearbeiten-Funktionen
 * (Adressen, Rapporte) und die Cloud-Synchronisation.
 */
let DB = null;

const eur = n => (n == null || isNaN(n)) ? '—' : n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
const num = (n, d = 2) => (n == null || isNaN(n)) ? '—' : n.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
const esc = s => (s == null ? '' : String(s)).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const PSTATUS = { SV00000001: 'In Bearbeitung', SV00000002: 'Abgeschlossen', SV00000004: 'Muster', SV00000005: 'Angebot', SV00000003: 'Auftrag' };
const pstatusCls = id => ({ SV00000002: 'p-auftrag', SV00000004: 'p-muster', SV00000005: 'p-angebot', SV00000003: 'p-rechnung' }[id] || 'p-auftrag');
const LVSTATUS = { '1': 'Angebot', '2': 'Auftragsbestätigung', '3': 'Rechnung', '4': 'Gutschrift', '5': 'Mahnung', '6': 'Kalkulation' };
const lvstatusCls = id => ({ '1': 'p-angebot', '2': 'p-auftrag', '3': 'p-rechnung', '6': 'p-muster' }[id] || 'p-muster');

const adr = id => DB.adressen.find(a => a.ID_ADRESSE === id);
const MODULES = [
  { grp: 'Übersicht' },
  { id: 'dash', ic: '▦', t: 'Dashboard' },
  { grp: 'Vertrieb & Projekte' },
  { id: 'projekte', ic: '▢', t: 'Projekte', cnt: () => DB.projekte.length },
  { id: 'lv', ic: '≣', t: 'Leistungsverzeichnisse', cnt: () => DB.lvlisten.length },
  { id: 'rapporte', ic: '✎', t: 'Rapporte', cnt: () => DB.rapporte.length },
  { grp: 'Stammdaten' },
  { id: 'adressen', ic: '☏', t: 'Adressen', cnt: () => DB.adressen.filter(a => a.AD_ANZEIGENAME).length },
  { id: 'mitarbeiter', ic: '☺', t: 'Mitarbeiter', cnt: () => DB.mitarbeiter.length },
  { id: 'stamm', ic: '⚙', t: 'Einheiten & Sätze' },
];
let state = { mod: 'dash', sub: null };

function renderNav() {
  const nav = document.getElementById('nav');
  nav.innerHTML = MODULES.map(m => {
    if (m.grp) return `<div class="grp">${m.grp}</div>`;
    const cnt = m.cnt ? `<span class="badge">${m.cnt()}</span>` : '';
    return `<button data-mod="${m.id}" class="${state.mod === m.id ? 'on' : ''}"><span class="ic">${m.ic}</span>${m.t}${cnt}</button>`;
  }).join('');
  nav.querySelectorAll('button').forEach(b => b.onclick = () => { state = { mod: b.dataset.mod, sub: null }; render(); document.getElementById('side').classList.remove('open'); });
}

// ---- Views ----
function vDash() {
  const P = DB.projekte;
  const sAng = P.reduce((s, p) => s + (p.LV_SUMME_ANGEBOT || 0), 0);
  const sAuf = P.reduce((s, p) => s + (p.LV_SUMME_AUFTRAG || 0), 0);
  const sRech = P.reduce((s, p) => s + (p.LV_SUMME_RECHNUNG || 0), 0);
  const offen = sAuf - sRech;
  const kpi = (l, v, m) => `<div class="kpi"><div class="lbl">${l}</div><div class="val">${v}</div><div class="meta">${m || ''}</div></div>`;
  const rows = P.map(p => projRow(p)).join('');
  return `<h1 class="page">Dashboard</h1><div class="sub">Live-Kennzahlen · ${P.length} Projekte, ${DB.lvpositionen.length} LV-Positionen · Daten liegen lokal auf diesem Gerät</div>
  <div class="kpis">
    ${kpi('Projekte', P.length, `${DB.lvlisten.length} Leistungsverzeichnisse`)}
    ${kpi('Angebotsvolumen', eur(sAng), 'Summe aller Angebote')}
    ${kpi('Auftragsvolumen', eur(sAuf), 'Beauftragte Summe')}
    ${kpi('Offen', eur(offen), `${eur(sRech)} bereits fakturiert`)}
  </div>
  <div class="card"><h2>Projekte <span class="cnt">${P.length}</span></h2>
  <div class="tblwrap"><table><thead><tr><th>Nummer</th><th>Bezeichnung</th><th>Kunde</th><th>Status</th><th class="num">Angebot</th><th class="num">Auftrag</th><th class="num">Rechnung</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
function projRow(p) {
  return `<tr data-proj="${esc(p.ID_PROJEKTE)}"><td class="mono">${esc(p.NUMMER)}</td><td class="strong">${esc(p.BEZEICHNUNG || p.KURZBEZ)}</td><td>${esc(p.KUNDEN_NAME || '—')}</td><td><span class="pill ${pstatusCls(p.ID_PROJEKTE_STATUS)}">${esc(PSTATUS[p.ID_PROJEKTE_STATUS] || '—')}</span></td><td class="num">${eur(p.LV_SUMME_ANGEBOT)}</td><td class="num">${eur(p.LV_SUMME_AUFTRAG)}</td><td class="num">${eur(p.LV_SUMME_RECHNUNG)}</td></tr>`;
}
function vProjekte() {
  const rows = DB.projekte.map(projRow).join('');
  return `<h1 class="page">Projekte</h1><div class="sub">Zeile anklicken für Details und Leistungsverzeichnisse</div>
  <div class="card"><h2>Alle Projekte <span class="cnt">${DB.projekte.length}</span></h2><div class="tblwrap"><table><thead><tr><th>Nummer</th><th>Bezeichnung</th><th>Kunde</th><th>Status</th><th class="num">Angebot</th><th class="num">Auftrag</th><th class="num">Rechnung</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
function vProjekt(id) {
  const p = DB.projekte.find(x => x.ID_PROJEKTE === id); if (!p) return vProjekte();
  const lvs = DB.lvlisten.filter(l => l.ID_PROJEKTE === id);
  const kunde = adr(p.ID_AUFTRAGGEBER);
  const f = (k, v) => `<div class="f"><div class="k">${k}</div><div class="v">${v}</div></div>`;
  const lvrows = lvs.map(l => `<tr data-lv="${esc(l.ID_PROJEKTE_LVLIST)}"><td class="mono">${esc(l.NUMMER)}</td><td class="strong">${esc(l.BEZEICHNUNG || l.KURZBEZ)}</td><td>${esc(l.ARBEITSBEREICH || '—')}</td><td><span class="pill ${lvstatusCls(l.ID_LV_STATUS)}">${esc(LVSTATUS[l.ID_LV_STATUS] || l.ID_LV_STATUS)}</span></td><td class="num">${num(l.MWST, 0)} %</td><td class="num">${eur(l.LV_SUMME)}</td></tr>`).join('') || `<tr><td colspan="6" class="empty">Keine Leistungsverzeichnisse</td></tr>`;
  return `<button class="back" data-back="projekte">← Projekte</button>
  <h1 class="page">${esc(p.BEZEICHNUNG || p.KURZBEZ)}</h1><div class="sub">Projekt ${esc(p.NUMMER)} · <span class="pill ${pstatusCls(p.ID_PROJEKTE_STATUS)}">${esc(PSTATUS[p.ID_PROJEKTE_STATUS] || '—')}</span></div>
  <div class="dgrid">
    ${f('Projektnummer', `<span class="mono">${esc(p.NUMMER)}</span>`)}
    ${f('Auftraggeber', esc(p.KUNDEN_NAME || (kunde && kunde.AD_ANZEIGENAME) || '—'))}
    ${f('Angebotssumme', eur(p.LV_SUMME_ANGEBOT))}
    ${f('Auftragssumme', eur(p.LV_SUMME_AUFTRAG))}
    ${f('Fakturiert', eur(p.LV_SUMME_RECHNUNG))}
    ${f('Priorität', esc(p.PRIORITAET || '—'))}
  </div>
  <div class="card"><h2>Leistungsverzeichnisse <span class="cnt">${lvs.length}</span></h2><div class="tblwrap"><table><thead><tr><th>Nummer</th><th>Bezeichnung</th><th>Arbeitsbereich</th><th>Status</th><th class="num">MwSt</th><th class="num">Summe</th></tr></thead><tbody>${lvrows}</tbody></table></div></div>`;
}
function vLVListe() {
  const rows = DB.lvlisten.map(l => {
    const p = DB.projekte.find(x => x.ID_PROJEKTE === l.ID_PROJEKTE);
    return `<tr data-lv="${esc(l.ID_PROJEKTE_LVLIST)}"><td class="mono">${esc(l.NUMMER)}</td><td class="strong">${esc(l.BEZEICHNUNG || l.KURZBEZ)}</td><td>${esc(p ? (p.BEZEICHNUNG || p.KURZBEZ) : '—')}</td><td><span class="pill ${lvstatusCls(l.ID_LV_STATUS)}">${esc(LVSTATUS[l.ID_LV_STATUS] || l.ID_LV_STATUS)}</span></td><td class="num">${eur(l.LV_SUMME)}</td></tr>`;
  }).join('');
  return `<h1 class="page">Leistungsverzeichnisse</h1><div class="sub">Zeile anklicken für den vollständigen LV-Positionsbaum</div>
  <div class="card"><h2>Alle LVs <span class="cnt">${DB.lvlisten.length}</span></h2><div class="tblwrap"><table><thead><tr><th>Nummer</th><th>Bezeichnung</th><th>Projekt</th><th>Status</th><th class="num">Summe</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
function vLV(id) {
  const l = DB.lvlisten.find(x => x.ID_PROJEKTE_LVLIST === id); if (!l) return vLVListe();
  const pos = DB.lvpositionen.filter(x => x.ID_PROJEKTE_LVLIST === id);
  const byId = {}, kids = {};
  pos.forEach(p => { byId[p.ID_LV_POS] = p; (kids[p.ID_PARENT] = kids[p.ID_PARENT] || []).push(p); });
  Object.values(kids).forEach(a => a.sort((x, y) => (x.SORTIEREN || 0) - (y.SORTIEREN || 0)));
  const roots = pos.filter(p => !byId[p.ID_PARENT]);
  roots.sort((x, y) => (x.SORTIEREN || 0) - (y.SORTIEREN || 0));
  let rows = '';
  function walk(node, depth) {
    const children = kids[node.ID_LV_POS] || [];
    const heading = children.length > 0;
    const ind = `padding-left:${depth * 18 + 14}px`;
    if (heading) {
      rows += `<tr class="lvrow lv-h ${depth === 0 ? 'lv-h0' : ''}"><td>${esc(node.OZ || '')}</td><td class="txt" style="${ind}" colspan="4"><span class="chip">${esc(node.KE || 'GR')}</span>${esc(node.KURZTEXT_TEXT || '—')}</td><td class="num">${eur(node.G_PREIS)}</td></tr>`;
      children.forEach(c => walk(c, depth + 1));
    } else {
      rows += `<tr class="lvrow lv-pos"><td>${esc(node.OZ || '')}</td><td class="txt" style="${ind}">${esc(node.KURZTEXT_TEXT || '—')}</td><td class="num">${node.MENGE != null ? num(node.MENGE, 2) : '—'}</td><td class="num">${eur(node.PREIS)}</td><td></td><td class="num">${eur(node.G_PREIS)}</td></tr>`;
    }
  }
  roots.forEach(r => walk(r, 0));
  const p = DB.projekte.find(x => x.ID_PROJEKTE === l.ID_PROJEKTE);
  return `<button class="back" data-back="${p ? ('proj:' + p.ID_PROJEKTE) : 'lv'}">← ${p ? esc(p.KURZBEZ) : 'Leistungsverzeichnisse'}</button>
  <h1 class="page">${esc(l.BEZEICHNUNG || l.KURZBEZ)}</h1>
  <div class="sub">LV ${esc(l.NUMMER)} · <span class="pill ${lvstatusCls(l.ID_LV_STATUS)}">${esc(LVSTATUS[l.ID_LV_STATUS] || l.ID_LV_STATUS)}</span> · ${pos.length} Positionen</div>
  <div class="dgrid">
    <div class="f"><div class="k">Arbeitsbereich</div><div class="v">${esc(l.ARBEITSBEREICH || '—')}</div></div>
    <div class="f"><div class="k">Zahlungskondition</div><div class="v">${esc(l.ZAKO || '—')}</div></div>
    <div class="f"><div class="k">MwSt</div><div class="v">${num(l.MWST, 0)} %</div></div>
    <div class="f"><div class="k">LV-Summe (netto)</div><div class="v strong">${eur(l.LV_SUMME)}</div></div>
  </div>
  <div class="card"><h2>Positionsbaum <span class="cnt">${pos.length} Positionen</span></h2><div class="tblwrap"><table><thead><tr><th style="width:90px">OZ</th><th>Kurztext</th><th class="num">Menge</th><th class="num">EP</th><th></th><th class="num">Gesamt</th></tr></thead><tbody>${rows || '<tr><td colspan=6 class=empty>Keine Positionen</td></tr>'}</tbody></table></div></div>`;
}
function vAdressen() {
  const rows = DB.adressen.filter(a => a.AD_ANZEIGENAME).map(a => `<tr data-adr="${esc(a.ID_ADRESSE)}"><td class="strong">${esc(a.AD_ANZEIGENAME)}</td><td>${esc(a.AN_ORT_GESCHAEFTLICH || '—')}</td><td>${esc(a.TEL_GESCHAEFTLICH || '—')}</td><td>${esc(a.TEL_EMAIL1 || '—')}</td><td>${a.FLAG_FIRMA ? '<span class="chip">Firma</span>' : '<span class="chip">Person</span>'}</td></tr>`).join('');
  return `<h1 class="page">Adressen</h1><div class="sub">Kunden, Lieferanten und Kontakte — Änderungen werden automatisch synchronisiert</div>
  <div class="actions"><button class="btn primary" data-new-adr>+ Neue Adresse</button></div>
  <div class="card"><h2>Adressbuch <span class="cnt">${DB.adressen.filter(a => a.AD_ANZEIGENAME).length}</span></h2><div class="tblwrap"><table><thead><tr><th>Name</th><th>Ort</th><th>Telefon</th><th>E-Mail</th><th>Typ</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
function vAdresse(id) {
  const a = adr(id); if (!a) return vAdressen();
  const f = (k, v) => v ? `<div class="f"><div class="k">${k}</div><div class="v">${v}</div></div>` : '';
  return `<button class="back" data-back="adressen">← Adressen</button>
  <h1 class="page">${esc(a.AD_ANZEIGENAME)}</h1><div class="sub">${a.FLAG_FIRMA ? 'Firma' : 'Person'} · ${esc(a.ID_ADRESSE)}</div>
  <div class="actions"><button class="btn" data-edit-adr="${esc(a.ID_ADRESSE)}">✎ Bearbeiten</button><button class="btn danger" data-del-adr="${esc(a.ID_ADRESSE)}">Löschen</button></div>
  <div class="dgrid">
    ${f('Firma', esc(a.AD_FIRMA))}${f('Briefanrede', esc(a.AD_BRIEFANREDE))}
    ${f('Straße', esc(a.AN_STRASSE_GESCHAEFTLICH))}${f('PLZ / Ort', esc([a.AN_PLZ_GESCHAEFTLICH, a.AN_ORT_GESCHAEFTLICH].filter(Boolean).join(' ')))}
    ${f('Telefon', esc(a.TEL_GESCHAEFTLICH))}${f('Fax', esc(a.TEL_FAXGESCHAEFTLICH))}
    ${f('E-Mail', esc(a.TEL_EMAIL1))}${f('Internet', esc(a.TEL_INTERNET))}${f('Steuernummer', esc(a.STEUER_NUMMER))}
  </div>`;
}
function vMitarbeiter() {
  const rows = DB.mitarbeiter.map(m => `<tr><td class="mono">${esc(m.PERSONALNUMMER || '—')}</td><td class="strong">${esc(m.BEZEICHNUNG || '—')}</td><td>${esc(m.MATCHCODE || '—')}</td><td class="num">${m.STUNDENLOHN ? eur(m.STUNDENLOHN) : '—'}</td><td class="num">${m.STUNDENSATZ_TAGLOHN ? eur(m.STUNDENSATZ_TAGLOHN) : '—'}</td></tr>`).join('');
  return `<h1 class="page">Mitarbeiter</h1><div class="sub">Kalkulationslöhne und Verrechnungssätze</div>
  <div class="card"><h2>Mitarbeiter & Kalkulationssätze <span class="cnt">${DB.mitarbeiter.length}</span></h2><div class="tblwrap"><table><thead><tr><th>Pers.-Nr.</th><th>Bezeichnung</th><th>Matchcode</th><th class="num">Stundenlohn</th><th class="num">Verrechnungssatz</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
function vStamm() {
  const eh = DB.einheiten.filter(e => e.EINHEIT).slice(0, 40).map(e => `<tr><td class="mono">${esc(e.EINHEIT)}</td><td>${esc(e.BESCHREIBUNG || '—')}</td></tr>`).join('');
  const mw = DB.mwst.map(m => `<tr><td class="strong">${esc(m.BEZEICHNUNG)}</td><td class="num">${num(m.WERT, 1)} %</td><td>${m.AKTIV ? '<span class="chip">aktiv</span>' : ''}</td></tr>`).join('');
  const la = DB.lohnarten.map(l => `<tr><td class="mono">${esc(l.NUMMER)}</td><td>${esc(l.BEZEICHNUNG)}</td></tr>`).join('');
  return `<h1 class="page">Einheiten & Sätze</h1><div class="sub">Stammdaten aus der Demo-Datenbank</div>
  <div class="tabs"><button class="on" data-tab="mw">MwSt-Sätze</button><button data-tab="eh">Einheiten</button><button data-tab="la">Lohnarten</button></div>
  <div id="tab-mw" class="tabc"><div class="card"><h2>MwSt-Sätze <span class="cnt">${DB.mwst.length}</span></h2><div class="tblwrap"><table><thead><tr><th>Bezeichnung</th><th class="num">Satz</th><th></th></tr></thead><tbody>${mw}</tbody></table></div></div></div>
  <div id="tab-eh" class="tabc" hidden><div class="card"><h2>Einheiten <span class="cnt">${DB.einheiten.filter(e => e.EINHEIT).length}</span></h2><div class="tblwrap"><table><thead><tr><th>Einheit</th><th>Beschreibung</th></tr></thead><tbody>${eh}</tbody></table></div></div></div>
  <div id="tab-la" class="tabc" hidden><div class="card"><h2>Lohnarten <span class="cnt">${DB.lohnarten.length}</span></h2><div class="tblwrap"><table><thead><tr><th>Nr.</th><th>Bezeichnung</th></tr></thead><tbody>${la}</tbody></table></div></div></div>`;
}
function vRapporte() {
  const rows = DB.rapporte.map(r => {
    const p = DB.projekte.find(x => x.ID_PROJEKTE === r.ID_PROJEKTE);
    return `<tr data-rap="${esc(r.ID_RAPPORT)}"><td class="mono">${esc(r.NUMMER)}</td><td class="strong">${esc(r.NAME || '—')}</td><td>${esc(p ? (p.BEZEICHNUNG || p.KURZBEZ) : '—')}</td><td>${r.GEPRUEFT ? '<span class="pill p-auftrag">geprüft</span>' : '<span class="pill p-angebot">offen</span>'}</td></tr>`;
  }).join('');
  return `<h1 class="page">Rapporte</h1><div class="sub">Tagesrapporte / Regieberichte — auch offline auf der Baustelle erfassbar</div>
  <div class="actions"><button class="btn primary" data-new-rap>+ Neuer Rapport</button></div>
  <div class="card"><h2>Rapporte <span class="cnt">${DB.rapporte.length}</span></h2><div class="tblwrap"><table><thead><tr><th>Nummer</th><th>Bezeichnung</th><th>Projekt</th><th>Status</th></tr></thead><tbody>${rows || '<tr><td colspan=4 class=empty>Noch keine Rapporte</td></tr>'}</tbody></table></div></div>`;
}

// ---- Modale Formulare ----
function openModal(title, bodyHtml, onSave, opts = {}) {
  const back = document.getElementById('modal-back');
  back.innerHTML = `<div class="modal" role="dialog" aria-modal="true">
    <div class="mhead"><h3>${esc(title)}</h3><button class="mclose" aria-label="Schließen">✕</button></div>
    <form class="mbody" id="mform">${bodyHtml}
      <div class="mfoot">
        <button type="button" class="btn" id="mcancel">Abbrechen</button>
        <button type="submit" class="btn primary">${esc(opts.saveLabel || 'Speichern')}</button>
      </div>
    </form>
  </div>`;
  back.hidden = false;
  const close = () => { back.hidden = true; back.innerHTML = ''; };
  back.querySelector('.mclose').onclick = close;
  back.querySelector('#mcancel').onclick = close;
  back.onclick = e => { if (e.target === back) close(); };
  back.querySelector('#mform').onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await onSave(Object.fromEntries(fd.entries()), e.target);
    close();
  };
}
const fi = (name, label, value, opts = {}) =>
  `<label class="fi"><span>${esc(label)}</span><input name="${name}" value="${esc(value ?? '')}" ${opts.required ? 'required' : ''} ${opts.type ? `type="${opts.type}"` : ''} ${opts.ph ? `placeholder="${esc(opts.ph)}"` : ''}></label>`;

function adresseForm(a = {}) {
  return `
    <div class="frow">${fi('AD_ANZEIGENAME', 'Anzeigename *', a.AD_ANZEIGENAME, { required: true })}${fi('AD_FIRMA', 'Firma', a.AD_FIRMA)}</div>
    <label class="fi check"><input type="checkbox" name="FLAG_FIRMA" ${a.FLAG_FIRMA ? 'checked' : ''}><span>Als Firma führen</span></label>
    <div class="frow">${fi('AN_STRASSE_GESCHAEFTLICH', 'Straße', a.AN_STRASSE_GESCHAEFTLICH)}${fi('AN_PLZ_GESCHAEFTLICH', 'PLZ', a.AN_PLZ_GESCHAEFTLICH)}${fi('AN_ORT_GESCHAEFTLICH', 'Ort', a.AN_ORT_GESCHAEFTLICH)}</div>
    <div class="frow">${fi('TEL_GESCHAEFTLICH', 'Telefon', a.TEL_GESCHAEFTLICH)}${fi('TEL_FAXGESCHAEFTLICH', 'Fax', a.TEL_FAXGESCHAEFTLICH)}</div>
    <div class="frow">${fi('TEL_EMAIL1', 'E-Mail', a.TEL_EMAIL1, { type: 'email' })}${fi('TEL_INTERNET', 'Internet', a.TEL_INTERNET)}</div>
    <div class="frow">${fi('AD_BRIEFANREDE', 'Briefanrede', a.AD_BRIEFANREDE, { ph: 'Sehr geehrte Damen und Herren,' })}${fi('STEUER_NUMMER', 'Steuernummer', a.STEUER_NUMMER)}</div>`;
}
function editAdresse(id) {
  const a = id ? { ...adr(id) } : { ID_ADRESSE: X2DB.newId(), TYP: 1 };
  openModal(id ? 'Adresse bearbeiten' : 'Neue Adresse', adresseForm(a), async vals => {
    for (const k of ['AD_ANZEIGENAME', 'AD_FIRMA', 'AN_STRASSE_GESCHAEFTLICH', 'AN_PLZ_GESCHAEFTLICH', 'AN_ORT_GESCHAEFTLICH', 'TEL_GESCHAEFTLICH', 'TEL_FAXGESCHAEFTLICH', 'TEL_EMAIL1', 'TEL_INTERNET', 'AD_BRIEFANREDE', 'STEUER_NUMMER'])
      a[k] = vals[k]?.trim() || null;
    a.FLAG_FIRMA = !!vals.FLAG_FIRMA;
    await X2DB.upsert('adressen', a);
    toast(id ? 'Adresse gespeichert' : 'Adresse angelegt');
    state = { mod: 'adressen', sub: a.ID_ADRESSE }; render();
  });
}
function editRapport(id) {
  const r = id ? { ...DB.rapporte.find(x => x.ID_RAPPORT === id) } : { ID_RAPPORT: X2DB.newId(), NUMMER: nextRapportNr(), GEPRUEFT: false };
  const projOpts = DB.projekte.map(p => `<option value="${esc(p.ID_PROJEKTE)}" ${r.ID_PROJEKTE === p.ID_PROJEKTE ? 'selected' : ''}>${esc(p.BEZEICHNUNG || p.KURZBEZ)}</option>`).join('');
  openModal(id ? 'Rapport bearbeiten' : 'Neuer Rapport', `
    <div class="frow">${fi('NUMMER', 'Nummer *', r.NUMMER, { required: true })}${fi('NAME', 'Bezeichnung *', r.NAME, { required: true, ph: 'z. B. Regiebericht KW 32' })}</div>
    <label class="fi"><span>Projekt</span><select name="ID_PROJEKTE"><option value="">— kein Projekt —</option>${projOpts}</select></label>
    <label class="fi check"><input type="checkbox" name="GEPRUEFT" ${r.GEPRUEFT ? 'checked' : ''}><span>Geprüft</span></label>`,
    async vals => {
      r.NUMMER = vals.NUMMER.trim(); r.NAME = vals.NAME.trim();
      r.ID_PROJEKTE = vals.ID_PROJEKTE || null; r.GEPRUEFT = !!vals.GEPRUEFT;
      await X2DB.upsert('rapporte', r);
      toast(id ? 'Rapport gespeichert' : 'Rapport angelegt');
      render();
    });
}
function nextRapportNr() {
  const n = DB.rapporte.map(r => parseInt(String(r.NUMMER).replace(/\D/g, ''), 10) || 0);
  return String(Math.max(0, ...n) + 1).padStart(5, '0');
}

// ---- Cloud / Sync UI ----
function toast(msg, isErr) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'show' + (isErr ? ' err' : '');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.className = '', 3200);
}
function fmtTime(d) { return d ? d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '—'; }

function renderSyncUI(s) {
  const pill = document.getElementById('syncpill');
  const dot = s.online ? (s.configured ? 'ok' : 'idle') : 'off';
  const label = !s.online ? 'Offline' : s.syncing ? 'Synchronisiere…' : s.configured ? 'Online · synchron' : 'Online · lokal';
  const pend = s.pending > 0 ? ` · ${s.pending} ausstehend` : '';
  pill.innerHTML = `<span class="dot ${dot}"></span>${label}${pend}`;
  pill.title = s.error ? s.error : (s.lastSync ? 'Letzte Synchronisation: ' + fmtTime(s.lastSync) : 'Noch nicht synchronisiert');

  const cs = document.getElementById('cloudstate');
  if (s.configured) {
    cs.innerHTML = `<div class="cst"><b>${esc(s.tenant)}</b> · ${esc(s.user)}</div>
      <div class="cst2">${s.pending > 0 ? s.pending + ' Änderung(en) ausstehend' : 'Alles synchron'} · ${fmtTime(s.lastSync)}</div>
      ${s.error ? `<div class="cst2 err">${esc(s.error)}</div>` : ''}
      <div class="cbtns"><button class="btn small" id="btn-sync">↻ Jetzt synchronisieren</button><button class="btn small" id="btn-logout">Trennen</button></div>`;
    document.getElementById('btn-sync').onclick = () => X2Sync.syncNow().then(() => toast('Synchronisation abgeschlossen')).catch(e => toast(e.message, true));
    document.getElementById('btn-logout').onclick = () => X2Sync.logout().then(() => toast('Cloud getrennt — App arbeitet lokal weiter'));
  } else {
    cs.innerHTML = `<div class="cst2">Nicht mit der Cloud verbunden.<br>Die App arbeitet lokal auf diesem Gerät.</div>
      <div class="cbtns"><button class="btn small primary" id="btn-connect">☁ Mit Cloud verbinden</button></div>`;
    document.getElementById('btn-connect').onclick = openLogin;
  }
}
function openLogin() {
  const origin = location.origin.startsWith('http') ? location.origin : '';
  openModal('Mit Cloud verbinden', `
    <p class="hint">Zugangsdaten erhalten Sie von Ihrem mexXsoft-Administrator. Nach der Anmeldung werden alle Änderungen automatisch zwischen Ihren Geräten synchronisiert.</p>
    ${fi('server', 'Server-Adresse', origin, { required: true, ph: 'https://cloud.mexxsoft.de' })}
    <div class="frow">${fi('tenant', 'Mandant', 'demo', { required: true })}${fi('user', 'Benutzer', 'demo', { required: true })}</div>
    ${fi('pass', 'Passwort', '', { required: true, type: 'password' })}`,
    async vals => {
      try {
        await X2Sync.login(vals.server.trim(), vals.tenant.trim(), vals.user.trim(), vals.pass);
        toast('Mit Cloud verbunden — Daten werden synchronisiert');
      } catch (e) { toast(e.message, true); throw e; }
    }, { saveLabel: 'Verbinden' });
}

// ---- Rendering / Wiring ----
const CRUMB = { dash: 'Dashboard', projekte: 'Projekte', lv: 'Leistungsverzeichnisse', adressen: 'Adressen', mitarbeiter: 'Mitarbeiter', stamm: 'Stammdaten', rapporte: 'Rapporte' };
function render() {
  renderNav();
  const v = document.getElementById('view');
  let html, crumb = CRUMB[state.mod] || '';
  if (state.mod === 'projekte' && state.sub) { html = vProjekt(state.sub); crumb = 'Projekte › Detail'; }
  else if (state.mod === 'lv' && state.sub) { html = vLV(state.sub); crumb = 'Leistungsverzeichnisse › Positionen'; }
  else if (state.mod === 'adressen' && state.sub) { html = vAdresse(state.sub); crumb = 'Adressen › Detail'; }
  else html = ({ dash: vDash, projekte: vProjekte, lv: vLVListe, adressen: vAdressen, mitarbeiter: vMitarbeiter, stamm: vStamm, rapporte: vRapporte }[state.mod] || vDash)();
  document.getElementById('crumb').innerHTML = `<b>${crumb}</b>`;
  v.innerHTML = html;
  v.querySelectorAll('[data-proj]').forEach(r => r.onclick = () => { state = { mod: 'projekte', sub: r.dataset.proj }; render(); });
  v.querySelectorAll('[data-lv]').forEach(r => r.onclick = () => { state = { mod: 'lv', sub: r.dataset.lv }; render(); });
  v.querySelectorAll('[data-adr]').forEach(r => r.onclick = () => { state = { mod: 'adressen', sub: r.dataset.adr }; render(); });
  v.querySelectorAll('[data-rap]').forEach(r => r.onclick = () => editRapport(r.dataset.rap));
  v.querySelectorAll('[data-back]').forEach(b => b.onclick = () => { const t = b.dataset.back; if (t.startsWith('proj:')) { state = { mod: 'projekte', sub: t.slice(5) }; } else { state = { mod: t, sub: null }; } render(); });
  v.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { v.querySelectorAll('.tabs button').forEach(x => x.classList.remove('on')); b.classList.add('on'); v.querySelectorAll('.tabc').forEach(c => c.hidden = true); v.querySelector('#tab-' + b.dataset.tab).hidden = false; });
  const na = v.querySelector('[data-new-adr]'); if (na) na.onclick = () => editAdresse(null);
  const nr = v.querySelector('[data-new-rap]'); if (nr) nr.onclick = () => editRapport(null);
  const ea = v.querySelector('[data-edit-adr]'); if (ea) ea.onclick = () => editAdresse(ea.dataset.editAdr);
  const da = v.querySelector('[data-del-adr]'); if (da) da.onclick = async () => {
    if (!confirm('Diese Adresse wirklich löschen?')) return;
    await X2DB.remove('adressen', da.dataset.delAdr);
    toast('Adresse gelöscht');
    state = { mod: 'adressen', sub: null }; render();
  };
  window.scrollTo(0, 0);
}

// ---- Start ----
(async function start() {
  DB = await X2DB.init();
  await X2Sync.init();
  X2Sync.onStatus(renderSyncUI);
  X2DB.onChange(kind => { if (kind === 'remote') render(); });

  const root = document.documentElement;
  document.getElementById('theme').onclick = () => { const cur = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light'); root.setAttribute('data-theme', cur === 'dark' ? 'light' : 'dark'); };
  document.getElementById('menu').onclick = () => document.getElementById('side').classList.toggle('open');
  document.getElementById('q').addEventListener('input', e => {
    const t = e.target.value.trim().toLowerCase();
    document.querySelectorAll('#view tbody tr').forEach(r => { r.style.display = (!t || r.textContent.toLowerCase().includes(t)) ? '' : 'none'; });
  });

  render();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
