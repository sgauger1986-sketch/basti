import type { MobilerRapport, Projekt } from './types';

export interface Kennzahlen {
  projekte: number;
  angebotsvolumen: number;
  auftragsvolumen: number;
  fakturiert: number;
  offen: number;
}

export function kennzahlen(projekte: Projekt[]): Kennzahlen {
  const summe = (f: (p: Projekt) => number | null) =>
    projekte.reduce((s, p) => s + (f(p) ?? 0), 0);
  const angebotsvolumen = summe((p) => p.summeAngebot);
  const auftragsvolumen = summe((p) => p.summeAuftrag);
  const fakturiert = summe((p) => p.summeRechnung);
  return {
    projekte: projekte.length,
    angebotsvolumen,
    auftragsvolumen,
    fakturiert,
    offen: auftragsvolumen - fakturiert,
  };
}

/** Summe der erfassten Stunden eines Rapports */
export function rapportStunden(r: MobilerRapport): number {
  return r.zeiten.reduce((s, z) => s + (Number.isFinite(z.stunden) ? z.stunden : 0), 0);
}

/** Projekt-Fortschritt (fakturiert / Auftrag) zwischen 0 und 1, null wenn nicht berechenbar */
export function projektFortschritt(p: Projekt): number | null {
  if (!p.summeAuftrag || p.summeAuftrag <= 0) return null;
  const q = (p.summeRechnung ?? 0) / p.summeAuftrag;
  return Math.max(0, Math.min(1, q));
}

/** Volltextsuche über beliebige Felder eines Objekts (Kleinschreibung, Teilstring) */
export function passtZurSuche(begriff: string, ...felder: (string | number | null | undefined)[]) {
  const t = begriff.trim().toLowerCase();
  if (!t) return true;
  return felder.some((f) => f != null && String(f).toLowerCase().includes(t));
}
