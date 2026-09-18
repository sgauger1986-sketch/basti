/**
 * Übersetzt die Rohdaten der X2-Datenbank (Feldnamen wie in
 * ../datenbank-schema/SCHEMA.md) in das fachliche Modell der App.
 * Dieselbe Struktur liefert auch der Server-Endpunkt /mobile/bundle,
 * sodass Demo-Daten und Live-Daten denselben Weg nehmen.
 */
import type {
  Adresse,
  Datenbestand,
  Einheit,
  Lohnart,
  LvListe,
  LvPosition,
  LvStatus,
  Mitarbeiter,
  MwstSatz,
  Projekt,
  ProjektStatus,
  Rapport,
} from '@/domain/types';

type Roh = Record<string, unknown>;

export interface RohBundle {
  adressen?: Roh[];
  projekte?: Roh[];
  lvlisten?: Roh[];
  lvpositionen?: Roh[];
  mitarbeiter?: Roh[];
  einheiten?: Roh[];
  mwst?: Roh[];
  lohnarten?: Roh[];
  rapporte?: Roh[];
}

const s = (v: unknown): string | null => {
  if (v == null) return null;
  const t = String(v).trim();
  return t === '' ? null : t;
};
const n = (v: unknown): number | null => {
  if (v == null || v === '') return null;
  const x = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(x) ? x : null;
};
const b = (v: unknown): boolean => v === true || v === 1 || v === 'T' || v === 'true';

const PROJEKT_STATUS: Record<string, ProjektStatus> = {
  SV00000001: 'bearbeitung',
  SV00000002: 'abgeschlossen',
  SV00000003: 'auftrag',
  SV00000004: 'muster',
  SV00000005: 'angebot',
};

const LV_STATUS: Record<string, LvStatus> = {
  '1': 'angebot',
  '2': 'auftragsbestaetigung',
  '3': 'rechnung',
  '4': 'gutschrift',
  '5': 'mahnung',
  '6': 'kalkulation',
};

export function projektAusRoh(r: Roh): Projekt | null {
  const id = s(r.ID_PROJEKTE);
  if (!id) return null;
  const bezeichnung = s(r.BEZEICHNUNG) ?? s(r.KURZBEZ) ?? id;
  return {
    id,
    status: PROJEKT_STATUS[String(r.ID_PROJEKTE_STATUS ?? '')] ?? 'bearbeitung',
    nummer: s(r.NUMMER) ?? '',
    kurzbez: s(r.KURZBEZ) ?? bezeichnung,
    bezeichnung,
    prioritaet: s(r.PRIORITAET),
    kundenName: s(r.KUNDEN_NAME),
    auftraggeberId: s(r.ID_AUFTRAGGEBER),
    summeAngebot: n(r.LV_SUMME_ANGEBOT),
    summeAuftrag: n(r.LV_SUMME_AUFTRAG),
    summeRechnung: n(r.LV_SUMME_RECHNUNG),
  };
}

export function lvListeAusRoh(r: Roh): LvListe | null {
  const id = s(r.ID_PROJEKTE_LVLIST);
  const projektId = s(r.ID_PROJEKTE);
  if (!id || !projektId) return null;
  const bezeichnung = s(r.BEZEICHNUNG) ?? s(r.KURZBEZ) ?? id;
  return {
    id,
    projektId,
    status: LV_STATUS[String(r.ID_LV_STATUS ?? '')] ?? 'unbekannt',
    nummer: s(r.NUMMER) ?? '',
    kurzbez: s(r.KURZBEZ) ?? bezeichnung,
    bezeichnung,
    arbeitsbereich: s(r.ARBEITSBEREICH),
    mwst: n(r.MWST),
    zahlungskondition: s(r.ZAKO),
    summe: n(r.LV_SUMME),
  };
}

export function lvPositionAusRoh(r: Roh): LvPosition | null {
  const id = s(r.ID_LV_POS);
  const lvId = s(r.ID_PROJEKTE_LVLIST);
  if (!id || !lvId) return null;
  const parent = s(r.ID_PARENT);
  return {
    id,
    parentId: parent === 'ROOT' ? null : parent,
    lvId,
    hke: s(r.HKE),
    oz: s(r.OZ),
    ke: s(r.KE),
    menge: n(r.MENGE),
    preis: n(r.PREIS),
    gesamtpreis: n(r.G_PREIS),
    mwst: n(r.MWST),
    kurztext: s(r.KURZTEXT_TEXT) ?? '—',
    sortierung: n(r.SORTIEREN) ?? 0,
  };
}

export function adresseAusRoh(r: Roh): Adresse | null {
  const id = s(r.ID_ADRESSE);
  const anzeigename = s(r.AD_ANZEIGENAME);
  if (!id || !anzeigename) return null;
  return {
    id,
    anzeigename,
    firma: s(r.AD_FIRMA),
    briefanrede: s(r.AD_BRIEFANREDE),
    telefon: s(r.TEL_GESCHAEFTLICH),
    fax: s(r.TEL_FAXGESCHAEFTLICH),
    email: s(r.TEL_EMAIL1),
    internet: s(r.TEL_INTERNET),
    strasse: s(r.AN_STRASSE_GESCHAEFTLICH),
    plz: s(r.AN_PLZ_GESCHAEFTLICH),
    ort: s(r.AN_ORT_GESCHAEFTLICH),
    steuernummer: s(r.STEUER_NUMMER),
    // FLAG_FIRMA ist in der Alt-DB oft nicht gepflegt: Trägt der Anzeigename den
    // Firmennamen, handelt es sich ebenfalls um eine Firma.
    istFirma: b(r.FLAG_FIRMA) || (s(r.AD_FIRMA) != null && s(r.AD_FIRMA) === anzeigename),
  };
}

export function mitarbeiterAusRoh(r: Roh): Mitarbeiter | null {
  const id = s(r.ID_ADR_MITARBEITER);
  if (!id) return null;
  return {
    id,
    bezeichnung: s(r.BEZEICHNUNG) ?? s(r.MATCHCODE) ?? id,
    personalnummer: s(r.PERSONALNUMMER),
    matchcode: s(r.MATCHCODE),
    stundenlohn: n(r.STUNDENLOHN),
    stundensatzTaglohn: n(r.STUNDENSATZ_TAGLOHN),
  };
}

export function einheitAusRoh(r: Roh): Einheit | null {
  const id = s(r.ID_EINHEIT);
  const kuerzel = s(r.EINHEIT);
  if (!id || !kuerzel) return null;
  return { id, kuerzel, beschreibung: s(r.BESCHREIBUNG) };
}

export function mwstAusRoh(r: Roh): MwstSatz | null {
  const id = s(r.ID_MWST);
  const wert = n(r.WERT);
  if (!id || wert == null) return null;
  return { id, wert, bezeichnung: s(r.BEZEICHNUNG) ?? `${wert} %`, aktiv: b(r.AKTIV) };
}

export function lohnartAusRoh(r: Roh): Lohnart | null {
  const id = s(r.ID_LOHNART);
  if (!id) return null;
  return { id, nummer: s(r.NUMMER), bezeichnung: s(r.BEZEICHNUNG) ?? id };
}

export function rapportAusRoh(r: Roh): Rapport | null {
  const id = s(r.ID_RAPPORT);
  const projektId = s(r.ID_PROJEKTE);
  if (!id || !projektId) return null;
  return {
    id,
    projektId,
    nummer: s(r.NUMMER) ?? '',
    name: s(r.NAME) ?? `Rapport ${s(r.NUMMER) ?? id}`,
    geprueft: b(r.GEPRUEFT),
  };
}

function alle<T>(rows: Roh[] | undefined, f: (r: Roh) => T | null): T[] {
  const out: T[] = [];
  for (const r of rows ?? []) {
    const v = f(r);
    if (v) out.push(v);
  }
  return out;
}

export function datenbestandAusRoh(bundle: RohBundle, standVom = new Date().toISOString()): Datenbestand {
  return {
    projekte: alle(bundle.projekte, projektAusRoh),
    lvListen: alle(bundle.lvlisten, lvListeAusRoh),
    lvPositionen: alle(bundle.lvpositionen, lvPositionAusRoh),
    adressen: alle(bundle.adressen, adresseAusRoh),
    mitarbeiter: alle(bundle.mitarbeiter, mitarbeiterAusRoh),
    einheiten: alle(bundle.einheiten, einheitAusRoh),
    mwst: alle(bundle.mwst, mwstAusRoh),
    lohnarten: alle(bundle.lohnarten, lohnartAusRoh),
    rapporte: alle(bundle.rapporte, rapportAusRoh),
    standVom,
  };
}
