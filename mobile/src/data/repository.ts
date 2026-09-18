/**
 * Datenzugriff der App. Zwei Implementierungen:
 *  - DemoRepository:   eingebettete Demo-Daten, komplett offline
 *  - ServerRepository: REST-Anbindung an das (künftige) Backend, siehe docs/API.md
 */
import type { Datenbestand, MobilerRapport } from '@/domain/types';
import type { FotoAnhang } from '@/security/fotoTresor';
import { datenbestandAusRoh, type RohBundle } from './mapping';
import demoRoh from './demo-daten.json';

export interface Anmeldung {
  serverUrl: string;
  benutzer: string;
  passwort: string;
}

export interface Sitzung {
  serverUrl: string;
  token: string;
  benutzer: string;
  mandant: string;
}

export interface Repository {
  readonly modus: 'demo' | 'server';
  datenLaden(): Promise<Datenbestand>;
  rapportSenden(r: MobilerRapport, fotos: FotoAnhang[]): Promise<{ serverId: string }>;
}

export class DemoRepository implements Repository {
  readonly modus = 'demo' as const;

  async datenLaden(): Promise<Datenbestand> {
    return datenbestandAusRoh(demoRoh as RohBundle);
  }

  async rapportSenden(r: MobilerRapport): Promise<{ serverId: string }> {
    // Im Demo-Modus gibt es keinen Server: Rapport gilt als "lokal gespeichert".
    return { serverId: `demo-${r.id}` };
  }
}

export class ServerFehler extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'ServerFehler';
  }
}

export function serverUrlNormalisieren(url: string): string {
  let u = url.trim();
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  return u.replace(/\/+$/, '');
}

/**
 * Erzwingt verschlüsselte Verbindungen. Unverschlüsseltes HTTP ist nur in
 * Entwicklungs-Builds und nur zu lokalen Adressen erlaubt.
 */
export function serverUrlPruefen(url: string, entwicklung: boolean = typeof __DEV__ !== 'undefined' && __DEV__): string {
  const u = serverUrlNormalisieren(url);
  if (!u) throw new Error('Bitte eine Server-Adresse angeben.');
  if (/^http:\/\//i.test(u)) {
    const host = u.replace(/^http:\/\//i, '').split(/[/:]/)[0];
    const lokal = /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)$/.test(host);
    if (!(entwicklung && lokal)) throw new Error('Nur verschlüsselte Verbindungen (https://) sind erlaubt.');
  }
  return u;
}

async function json<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    let meldung = `Server antwortete mit Status ${res.status}`;
    try {
      const parsed = JSON.parse(text) as { message?: string; fehler?: string };
      meldung = parsed.message ?? parsed.fehler ?? meldung;
    } catch {
      /* Text war kein JSON */
    }
    throw new ServerFehler(meldung, res.status);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

export async function anmelden(a: Anmeldung, fetchFn: typeof fetch = fetch): Promise<Sitzung> {
  const serverUrl = serverUrlPruefen(a.serverUrl);
  const res = await fetchFn(`${serverUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ benutzer: a.benutzer, passwort: a.passwort }),
  });
  const body = await json<{ token: string; benutzer: string; mandant: string }>(res);
  return { serverUrl, token: body.token, benutzer: body.benutzer, mandant: body.mandant };
}

export class ServerRepository implements Repository {
  readonly modus = 'server' as const;

  constructor(
    private readonly sitzung: Sitzung,
    private readonly fetchFn: typeof fetch = fetch
  ) {}

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.sitzung.token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
  }

  async datenLaden(): Promise<Datenbestand> {
    const res = await this.fetchFn(`${this.sitzung.serverUrl}/api/v1/mobile/bundle`, {
      headers: this.headers(),
    });
    const bundle = await json<RohBundle>(res);
    return datenbestandAusRoh(bundle);
  }

  async rapportSenden(r: MobilerRapport, fotos: FotoAnhang[]): Promise<{ serverId: string }> {
    // Fotos werden aus dem Tresor entschlüsselt und direkt im JSON übertragen –
    // so entsteht zu keinem Zeitpunkt eine unverschlüsselte Datei auf dem Gerät.
    const res = await this.fetchFn(`${this.sitzung.serverUrl}/api/v1/rapporte`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        lokaleId: r.id,
        projektId: r.projektId,
        datum: r.datum,
        name: r.name,
        taetigkeit: r.taetigkeit,
        zeiten: r.zeiten.map(({ mitarbeiterId, stunden, lohnartId }) => ({ mitarbeiterId, stunden, lohnartId })),
        material: r.material.map(({ bezeichnung, menge, einheit }) => ({ bezeichnung, menge, einheit })),
        standort: r.standort,
        notizen: r.notizen,
        fotos,
      }),
    });
    const body = await json<{ id: string }>(res);
    return { serverId: body.id };
  }
}
