import { ServerFehler, ServerRepository, anmelden, serverUrlNormalisieren, serverUrlPruefen } from '@/data/repository';
import { leererRapport } from '@/data/rapportSync';

const antwort = (status: number, body: unknown) =>
  ({ ok: status < 400, status, text: async () => JSON.stringify(body) }) as unknown as Response;

describe('Server-Anbindung', () => {
  test('URL wird normalisiert', () => {
    expect(serverUrlNormalisieren('cloud.beispiel.de/')).toBe('https://cloud.beispiel.de');
    expect(serverUrlNormalisieren('http://localhost:8080///')).toBe('http://localhost:8080');
    expect(serverUrlNormalisieren('  ')).toBe('');
  });

  test('Unverschlüsseltes HTTP wird abgelehnt', () => {
    expect(() => serverUrlPruefen('http://cloud.beispiel.de', false)).toThrow(/https/);
    expect(() => serverUrlPruefen('http://cloud.beispiel.de', true)).toThrow(/https/);
    expect(serverUrlPruefen('http://localhost:8080', true)).toBe('http://localhost:8080'); // nur Entwicklung, nur lokal
    expect(() => serverUrlPruefen('http://localhost:8080', false)).toThrow(/https/);
    expect(serverUrlPruefen('cloud.beispiel.de', false)).toBe('https://cloud.beispiel.de');
    expect(() => serverUrlPruefen('   ', false)).toThrow(/Server-Adresse/);
  });

  test('Anmeldung sendet Zugangsdaten und liefert Sitzung', async () => {
    const fetchMock = jest.fn(async () => antwort(200, { token: 't', benutzer: 'max', mandant: 'Muster GmbH' }));
    const s = await anmelden({ serverUrl: 'cloud.beispiel.de', benutzer: 'max', passwort: 'pw' }, fetchMock as unknown as typeof fetch);
    expect(s).toEqual({ serverUrl: 'https://cloud.beispiel.de', token: 't', benutzer: 'max', mandant: 'Muster GmbH' });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://cloud.beispiel.de/api/v1/auth/login');
    expect(JSON.parse(String(init.body))).toEqual({ benutzer: 'max', passwort: 'pw' });
  });

  test('Fehlermeldung des Servers wird durchgereicht', async () => {
    const fetchMock = jest.fn(async () => antwort(401, { message: 'Passwort falsch' }));
    await expect(
      anmelden({ serverUrl: 'x.de', benutzer: 'a', passwort: 'b' }, fetchMock as unknown as typeof fetch)
    ).rejects.toThrow(new ServerFehler('Passwort falsch', 401));
  });

  test('Bundle wird mit Token geladen und gemappt', async () => {
    const fetchMock = jest.fn(async () =>
      antwort(200, { projekte: [{ ID_PROJEKTE: 'P1', NUMMER: '1', KURZBEZ: 'Test', ID_PROJEKTE_STATUS: 'SV00000001' }] })
    );
    const repo = new ServerRepository({ serverUrl: 'https://s', token: 'tok', benutzer: 'u', mandant: 'm' }, fetchMock as unknown as typeof fetch);
    const d = await repo.datenLaden();
    expect(d.projekte[0]).toMatchObject({ id: 'P1', status: 'bearbeitung' });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
  });

  test('Rapport wird als JSON mit Fotos gesendet, ohne lokale Schlüssel', async () => {
    const fetchMock = jest.fn(async () => antwort(201, { id: 'R-99' }));
    const repo = new ServerRepository({ serverUrl: 'https://s', token: 'tok', benutzer: 'u', mandant: 'm' }, fetchMock as unknown as typeof fetch);
    const r = {
      ...leererRapport('P1', '2026-09-18'),
      name: 'Test',
      fotos: ['id-1'],
      zeiten: [{ key: 'k', mitarbeiterId: 'M1', stunden: 2, lohnartId: null }],
    };
    const fotos = [{ name: 'foto-1.jpg', mimeType: 'image/jpeg', base64: 'QUJD' }];
    await expect(repo.rapportSenden(r, fotos)).resolves.toEqual({ serverId: 'R-99' });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://s/api/v1/rapporte');
    expect(init.method).toBe('POST');
    const body = JSON.parse(String(init.body));
    expect(body.fotos).toEqual(fotos);
    expect(body.zeiten).toEqual([{ mitarbeiterId: 'M1', stunden: 2, lohnartId: null }]);
    expect(body.zeiten[0].key).toBeUndefined();
    expect(body.lokaleId).toBe(r.id);
  });
});
