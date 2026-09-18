import type { LvStatus, ProjektStatus, SyncStatus } from './types';

export const PROJEKT_STATUS_LABEL: Record<ProjektStatus, string> = {
  bearbeitung: 'In Bearbeitung',
  abgeschlossen: 'Abgeschlossen',
  auftrag: 'Auftrag',
  muster: 'Muster',
  angebot: 'Angebot',
};

export const LV_STATUS_LABEL: Record<LvStatus, string> = {
  angebot: 'Angebot',
  auftragsbestaetigung: 'Auftragsbestätigung',
  rechnung: 'Rechnung',
  gutschrift: 'Gutschrift',
  mahnung: 'Mahnung',
  kalkulation: 'Kalkulation',
  unbekannt: 'Unbekannt',
};

export const SYNC_STATUS_LABEL: Record<SyncStatus, string> = {
  entwurf: 'Entwurf',
  wartet: 'Wartet auf Übertragung',
  synchronisiert: 'Übertragen',
  fehler: 'Übertragung fehlgeschlagen',
};

/** Farbton, mit dem ein Status in der Oberfläche markiert wird */
export type StatusTon = 'angebot' | 'auftrag' | 'rechnung' | 'neutral' | 'fehler';

export function projektStatusTon(s: ProjektStatus): StatusTon {
  switch (s) {
    case 'angebot':
      return 'angebot';
    case 'auftrag':
      return 'rechnung';
    case 'muster':
      return 'neutral';
    default:
      return 'auftrag';
  }
}

export function lvStatusTon(s: LvStatus): StatusTon {
  switch (s) {
    case 'angebot':
      return 'angebot';
    case 'auftragsbestaetigung':
      return 'auftrag';
    case 'rechnung':
      return 'rechnung';
    case 'mahnung':
      return 'fehler';
    default:
      return 'neutral';
  }
}

export function syncStatusTon(s: SyncStatus): StatusTon {
  switch (s) {
    case 'synchronisiert':
      return 'auftrag';
    case 'wartet':
      return 'angebot';
    case 'fehler':
      return 'fehler';
    default:
      return 'neutral';
  }
}
