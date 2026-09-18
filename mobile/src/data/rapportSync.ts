/**
 * Übertragungswarteschlange für mobil erfasste Rapporte.
 * Reine Logik ohne React, damit sie testbar bleibt.
 */
import type { MobilerRapport } from '@/domain/types';
import type { Repository } from './repository';

export function neueId(): string {
  const zeit = Date.now().toString(36);
  const zufall = Math.random().toString(36).slice(2, 10);
  return `${zeit}-${zufall}`;
}

export function leererRapport(projektId: string, datum: string, jetzt = new Date()): MobilerRapport {
  const iso = jetzt.toISOString();
  return {
    id: neueId(),
    serverId: null,
    projektId,
    datum,
    name: '',
    taetigkeit: '',
    zeiten: [],
    material: [],
    fotos: [],
    standort: null,
    notizen: '',
    sync: 'entwurf',
    syncFehler: null,
    erstelltAm: iso,
    geaendertAm: iso,
  };
}

/** Prüft, ob ein Rapport vollständig genug ist, um übertragen zu werden */
export function rapportPruefen(r: MobilerRapport): string[] {
  const fehler: string[] = [];
  if (!r.projektId) fehler.push('Projekt fehlt.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.datum)) fehler.push('Datum ist ungültig.');
  if (!r.name.trim()) fehler.push('Bezeichnung fehlt.');
  if (r.zeiten.length === 0 && !r.taetigkeit.trim())
    fehler.push('Mindestens eine Zeit oder eine Tätigkeitsbeschreibung angeben.');
  for (const z of r.zeiten) {
    if (!(z.stunden > 0)) fehler.push('Stunden müssen größer als 0 sein.');
    if (!z.mitarbeiterId) fehler.push('Mitarbeiter bei Zeiteintrag fehlt.');
  }
  for (const m of r.material) {
    if (!m.bezeichnung.trim()) fehler.push('Materialbezeichnung fehlt.');
    if (!(m.menge > 0)) fehler.push('Materialmenge muss größer als 0 sein.');
  }
  return Array.from(new Set(fehler));
}

/**
 * Überträgt alle wartenden Rapporte. Gibt die aktualisierte Liste zurück;
 * fehlgeschlagene Rapporte behalten ihre Daten und bekommen den Fehlertext.
 */
export async function wartendeUebertragen(
  rapporte: MobilerRapport[],
  repo: Repository,
  jetzt: () => string = () => new Date().toISOString()
): Promise<MobilerRapport[]> {
  const out: MobilerRapport[] = [];
  for (const r of rapporte) {
    if (r.sync !== 'wartet' && r.sync !== 'fehler') {
      out.push(r);
      continue;
    }
    try {
      const { serverId } = await repo.rapportSenden(r);
      out.push({ ...r, serverId, sync: 'synchronisiert', syncFehler: null, geaendertAm: jetzt() });
    } catch (e) {
      const meldung = e instanceof Error ? e.message : String(e);
      out.push({ ...r, sync: 'fehler', syncFehler: meldung, geaendertAm: jetzt() });
    }
  }
  return out;
}
