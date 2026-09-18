import { lvBaumBauen, lvBaumFlach, lvPositionenZaehlen } from '@/domain/lvTree';
import type { LvPosition } from '@/domain/types';

const pos = (id: string, parentId: string | null, sortierung: number): LvPosition => ({
  id,
  parentId,
  lvId: 'LV1',
  hke: null,
  oz: id,
  ke: null,
  menge: 1,
  preis: 10,
  gesamtpreis: 10,
  mwst: null,
  kurztext: `Position ${id}`,
  sortierung,
});

describe('LV-Positionsbaum', () => {
  const liste = [
    pos('B', null, 2),
    pos('A', null, 1),
    pos('A2', 'A', 2),
    pos('A1', 'A', 1),
    pos('A1a', 'A1', 1),
    pos('X', 'nicht-vorhanden', 9), // Parent fehlt → Wurzel
  ];

  test('baut Hierarchie und sortiert nach Sortierung', () => {
    const baum = lvBaumBauen(liste);
    expect(baum.map((k) => k.position.id)).toEqual(['A', 'B', 'X']);
    const a = baum[0];
    expect(a.istGruppe).toBe(true);
    expect(a.kinder.map((k) => k.position.id)).toEqual(['A1', 'A2']);
    expect(a.kinder[0].kinder[0].position.id).toBe('A1a');
    expect(a.kinder[0].kinder[0].tiefe).toBe(2);
  });

  test('flache Liste respektiert eingeklappte Gruppen', () => {
    const baum = lvBaumBauen(liste);
    expect(lvBaumFlach(baum, new Set()).map((k) => k.position.id)).toEqual(['A', 'A1', 'A1a', 'A2', 'B', 'X']);
    expect(lvBaumFlach(baum, new Set(['A'])).map((k) => k.position.id)).toEqual(['A', 'B', 'X']);
    expect(lvBaumFlach(baum, new Set(['A1'])).map((k) => k.position.id)).toEqual(['A', 'A1', 'A2', 'B', 'X']);
  });

  test('zählt nur Blätter als Positionen', () => {
    expect(lvPositionenZaehlen(lvBaumBauen(liste))).toBe(4); // A1a, A2, B, X
  });
});
