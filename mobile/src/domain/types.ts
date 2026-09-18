/**
 * Fachliches Datenmodell der App.
 * Abgeleitet aus dem X2-Datenbankschema (../datenbank-schema/), aber in
 * sauberen, sprechenden Feldern. Die Zuordnung zu den Rohfeldern der
 * Alt-Datenbank passiert ausschließlich in `mapping.ts`.
 */

export type ProjektStatus = 'bearbeitung' | 'abgeschlossen' | 'auftrag' | 'muster' | 'angebot';
export type LvStatus =
  | 'angebot'
  | 'auftragsbestaetigung'
  | 'rechnung'
  | 'gutschrift'
  | 'mahnung'
  | 'kalkulation'
  | 'unbekannt';

export interface Projekt {
  id: string;
  status: ProjektStatus;
  nummer: string;
  kurzbez: string;
  bezeichnung: string;
  prioritaet: string | null;
  kundenName: string | null;
  auftraggeberId: string | null;
  summeAngebot: number | null;
  summeAuftrag: number | null;
  summeRechnung: number | null;
}

export interface LvListe {
  id: string;
  projektId: string;
  status: LvStatus;
  nummer: string;
  kurzbez: string;
  bezeichnung: string;
  arbeitsbereich: string | null;
  mwst: number | null;
  zahlungskondition: string | null;
  summe: number | null;
}

export interface LvPosition {
  id: string;
  parentId: string | null;
  lvId: string;
  hke: string | null;
  oz: string | null;
  ke: string | null;
  menge: number | null;
  preis: number | null;
  gesamtpreis: number | null;
  mwst: number | null;
  kurztext: string;
  sortierung: number;
}

export interface Adresse {
  id: string;
  anzeigename: string;
  firma: string | null;
  briefanrede: string | null;
  telefon: string | null;
  fax: string | null;
  email: string | null;
  internet: string | null;
  strasse: string | null;
  plz: string | null;
  ort: string | null;
  steuernummer: string | null;
  istFirma: boolean;
}

export interface Mitarbeiter {
  id: string;
  bezeichnung: string;
  personalnummer: string | null;
  matchcode: string | null;
  stundenlohn: number | null;
  stundensatzTaglohn: number | null;
}

export interface Einheit {
  id: string;
  kuerzel: string;
  beschreibung: string | null;
}

export interface MwstSatz {
  id: string;
  wert: number;
  bezeichnung: string;
  aktiv: boolean;
}

export interface Lohnart {
  id: string;
  nummer: string | null;
  bezeichnung: string;
}

/** Rapport, wie er vom Server / aus der Alt-DB kommt */
export interface Rapport {
  id: string;
  projektId: string;
  nummer: string;
  name: string;
  geprueft: boolean;
}

/** Zeiteintrag in einem mobil erfassten Rapport */
export interface RapportZeit {
  /** Lokaler Schlüssel für die Oberfläche (stabil beim Löschen anderer Zeilen) */
  key: string;
  mitarbeiterId: string;
  stunden: number;
  lohnartId: string | null;
}

/** Materialeintrag in einem mobil erfassten Rapport */
export interface RapportMaterial {
  key: string;
  bezeichnung: string;
  menge: number;
  einheit: string;
}

export type SyncStatus = 'entwurf' | 'wartet' | 'synchronisiert' | 'fehler';

/** Mobil erfasster Rapport (Tagesbericht / Regiebericht) */
export interface MobilerRapport {
  /** Lokale ID (uuid), bleibt auch nach Sync erhalten */
  id: string;
  /** Server-ID nach erfolgreicher Übertragung */
  serverId: string | null;
  projektId: string;
  /** ISO-Datum YYYY-MM-DD */
  datum: string;
  name: string;
  taetigkeit: string;
  zeiten: RapportZeit[];
  material: RapportMaterial[];
  /** Lokale Datei-URIs der Fotos */
  fotos: string[];
  standort: { lat: number; lng: number } | null;
  notizen: string;
  sync: SyncStatus;
  syncFehler: string | null;
  erstelltAm: string;
  geaendertAm: string;
}

/** Gesamter Datenbestand, den die App lokal vorhält */
export interface Datenbestand {
  projekte: Projekt[];
  lvListen: LvListe[];
  lvPositionen: LvPosition[];
  adressen: Adresse[];
  mitarbeiter: Mitarbeiter[];
  einheiten: Einheit[];
  mwst: MwstSatz[];
  lohnarten: Lohnart[];
  rapporte: Rapport[];
  /** Zeitpunkt des letzten erfolgreichen Ladens (ISO) */
  standVom: string;
}
