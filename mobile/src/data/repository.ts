/**
 * Datenzugriff der App. Zwei Implementierungen:
 *  - DemoRepository:   eingebettete Demo-Daten, komplett offline
 *  - ServerRepository: REST-Anbindung an das (künftige) Backend, siehe docs/API.md
 */
import type { Datenbestand, MobilerRapport } from '@/domain/types';
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
  rapportSenden(r: MobilerRapport): Promise<{ serverId: string }>;
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
  const serverUrl = serverUrlNormalisieren(a.serverUrl);
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

  async rapportSenden(r: MobilerRapport): Promise<{ serverId: string }> {
    const form = new FormData();
    form.append(
      'rapport',
      JSON.stringify({
        lokaleId: r.id,
        projektId: r.projektId,
        datum: r.datum,
        name: r.name,
        taetigkeit: r.taetigkeit,
        zeiten: r.zeiten.map(({ mitarbeiterId, stunden, lohnartId }) => ({ mitarbeiterId, stunden, lohnartId })),
        material: r.material.map(({ bezeichnung, menge, einheit }) => ({ bezeichnung, menge, einheit })),
        standort: r.standort,
        notizen: r.notizen,
      })
    );
    r.fotos.forEach((uri, i) => {
      // React Native akzeptiert {uri,name,type} als Datei in FormData
      form.append('fotos', { uri, name: `foto-${i + 1}.jpg`, type: 'image/jpeg' } as unknown as Blob);
    });
    const res = await this.fetchFn(`${this.sitzung.serverUrl}/api/v1/rapporte`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.sitzung.token}`, Accept: 'application/json' },
      body: form,
    });
    const body = await json<{ id: string }>(res);
    return { serverId: body.id };
  }
}
