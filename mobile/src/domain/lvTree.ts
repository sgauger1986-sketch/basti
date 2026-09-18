import type { LvPosition } from './types';

/** Knoten des hierarchischen Positionsbaums eines Leistungsverzeichnisses */
export interface LvKnoten {
  position: LvPosition;
  kinder: LvKnoten[];
  /** Gruppe (hat Kinder) oder echte Position (Blatt) */
  istGruppe: boolean;
  tiefe: number;
}

/**
 * Baut aus der flachen Positionsliste eines LVs den Baum nach `parentId`.
 * Wurzeln sind Positionen, deren Parent nicht in der Liste vorkommt
 * (in der Alt-DB steht dort meist "ROOT").
 */
export function lvBaumBauen(positionen: LvPosition[]): LvKnoten[] {
  const nachId = new Map<string, LvPosition>();
  const kinderVon = new Map<string, LvPosition[]>();
  for (const p of positionen) {
    nachId.set(p.id, p);
    const key = p.parentId ?? '';
    const liste = kinderVon.get(key) ?? [];
    liste.push(p);
    kinderVon.set(key, liste);
  }
  const sortieren = (a: LvPosition, b: LvPosition) => a.sortierung - b.sortierung;

  function knoten(p: LvPosition, tiefe: number): LvKnoten {
    const kinderPos = (kinderVon.get(p.id) ?? []).slice().sort(sortieren);
    const kinder = kinderPos.map((k) => knoten(k, tiefe + 1));
    return { position: p, kinder, istGruppe: kinder.length > 0, tiefe };
  }

  const wurzeln = positionen
    .filter((p) => p.parentId == null || !nachId.has(p.parentId))
    .sort(sortieren);
  return wurzeln.map((w) => knoten(w, 0));
}

/** Flache Liste in Anzeigereihenfolge; eingeklappte Gruppen werden übersprungen */
export function lvBaumFlach(wurzeln: LvKnoten[], eingeklappt: ReadonlySet<string>): LvKnoten[] {
  const out: LvKnoten[] = [];
  const gehe = (k: LvKnoten) => {
    out.push(k);
    if (k.istGruppe && !eingeklappt.has(k.position.id)) k.kinder.forEach(gehe);
  };
  wurzeln.forEach(gehe);
  return out;
}

/** Anzahl echter Positionen (Blätter) im Baum */
export function lvPositionenZaehlen(wurzeln: LvKnoten[]): number {
  let n = 0;
  const gehe = (k: LvKnoten) => {
    if (k.istGruppe) k.kinder.forEach(gehe);
    else n += 1;
  };
  wurzeln.forEach(gehe);
  return n;
}
