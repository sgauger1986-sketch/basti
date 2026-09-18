import { leererRapport, rapportPruefen, wartendeUebertragen } from '@/data/rapportSync';
import type { Repository } from '@/data/repository';
import type { MobilerRapport } from '@/domain/types';
import type { FotoAnhang } from '@/security/fotoTresor';

function repoMock(senden: Repository['rapportSenden']): Repository {
  return { modus: 'server', datenLaden: jest.fn(), rapportSenden: senden };
}

describe('Rapport-Prüfung', () => {
  test('leerer Rapport hat Fehler', () => {
    const r = leererRapport('P1', '2026-09-18');
    const fehler = rapportPruefen(r);
    expect(fehler).toContain('Bezeichnung fehlt.');
    expect(fehler.some((f) => f.startsWith('Mindestens eine Zeit'))).toBe(true);
  });
  test('vollständiger Rapport ist gültig', () => {
    const r: MobilerRapport = {
      ...leererRapport('P1', '2026-09-18'),
      name: 'Pflaster Hof',
      zeiten: [{ key: 'z1', mitarbeiterId: 'M1', stunden: 8, lohnartId: null }],
      material: [{ key: 'm1', bezeichnung: 'Pflaster', menge: 12.5, einheit: 'm²' }],
    };
    expect(rapportPruefen(r)).toEqual([]);
  });
  test('ungültige Mengen und Datum werden gemeldet', () => {
    const r: MobilerRapport = {
      ...leererRapport('P1', '18.09.2026'),
      name: 'x',
      zeiten: [{ key: 'z1', mitarbeiterId: '', stunden: 0, lohnartId: null }],
      material: [{ key: 'm1', bezeichnung: '', menge: 0, einheit: 'Stk' }],
    };
    const f = rapportPruefen(r);
    expect(f).toEqual(
      expect.arrayContaining([
        'Datum ist ungültig.',
        'Stunden müssen größer als 0 sein.',
        'Mitarbeiter bei Zeiteintrag fehlt.',
        'Materialbezeichnung fehlt.',
        'Materialmenge muss größer als 0 sein.',
      ])
    );
  });
});

describe('Übertragungswarteschlange', () => {
  test('überträgt nur wartende und fehlgeschlagene Rapporte', async () => {
    const a = { ...leererRapport('P1', '2026-09-18'), id: 'a', sync: 'wartet' as const };
    const b = { ...leererRapport('P1', '2026-09-18'), id: 'b', sync: 'entwurf' as const };
    const c = { ...leererRapport('P1', '2026-09-18'), id: 'c', sync: 'fehler' as const };
    const d = { ...leererRapport('P1', '2026-09-18'), id: 'd', sync: 'synchronisiert' as const, serverId: 'S-d' };
    const senden = jest.fn(async (r: MobilerRapport) => ({ serverId: `S-${r.id}` }));
    const out = await wartendeUebertragen([a, b, c, d], repoMock(senden), { jetzt: () => 'T' });
    expect(senden).toHaveBeenCalledTimes(2);
    expect(out.map((r) => [r.id, r.sync, r.serverId])).toEqual([
      ['a', 'synchronisiert', 'S-a'],
      ['b', 'entwurf', null],
      ['c', 'synchronisiert', 'S-c'],
      ['d', 'synchronisiert', 'S-d'],
    ]);
  });
  test('Fotos werden entschlüsselt mitgeschickt', async () => {
    const a = { ...leererRapport('P1', '2026-09-18'), id: 'a', sync: 'wartet' as const, fotos: ['f1', 'f2'] };
    const senden = jest.fn(async (_r: MobilerRapport, _fotos: FotoAnhang[]) => ({ serverId: 'S' }));
    const fotoLaden = jest.fn(async (id: string, i: number) => ({ name: `foto-${i + 1}.jpg`, mimeType: 'image/jpeg', base64: `b64-${id}` }));
    await wartendeUebertragen([a], repoMock(senden), { fotoLaden });
    expect(fotoLaden).toHaveBeenCalledTimes(2);
    expect(senden.mock.calls[0][1]).toEqual([
      { name: 'foto-1.jpg', mimeType: 'image/jpeg', base64: 'b64-f1' },
      { name: 'foto-2.jpg', mimeType: 'image/jpeg', base64: 'b64-f2' },
    ]);
  });

  test('Fehler beim Senden bleiben lokal erhalten', async () => {
    const a = { ...leererRapport('P1', '2026-09-18'), id: 'a', sync: 'wartet' as const, name: 'Bleibt' };
    const senden = jest.fn(async () => {
      throw new Error('Server nicht erreichbar');
    });
    const [out] = await wartendeUebertragen([a], repoMock(senden));
    expect(out.sync).toBe('fehler');
    expect(out.syncFehler).toBe('Server nicht erreichbar');
    expect(out.name).toBe('Bleibt');
  });
});
