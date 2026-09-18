/**
 * Globaler App-Zustand: Einstellungen, Sitzung, Datenbestand und lokale Rapporte.
 * Beim Start werden zuerst die lokal zwischengespeicherten Daten angezeigt,
 * danach im Hintergrund neu geladen (offline-first).
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Datenbestand, MobilerRapport } from '@/domain/types';
import {
  DemoRepository,
  ServerRepository,
  anmelden,
  type Anmeldung,
  type Repository,
  type Sitzung,
} from '@/data/repository';
import { STANDARD_EINSTELLUNGEN, storage, type Einstellungen } from '@/data/storage';
import { rapportPruefen, wartendeUebertragen } from '@/data/rapportSync';
import { tresorOeffnen } from '@/security/tresor';
import { fotoAnhang, fotoLoeschen } from '@/security/fotoTresor';

interface AppZustand {
  bereit: boolean;
  /** Fehler beim Öffnen des verschlüsselten Speichers (z. B. Schlüsselbund nicht verfügbar) */
  tresorFehler: string | null;
  einstellungen: Einstellungen;
  sitzung: Sitzung | null;
  daten: Datenbestand | null;
  laedt: boolean;
  ladeFehler: string | null;
  rapporte: MobilerRapport[];
  repository: Repository | null;

  demoStarten(): Promise<void>;
  serverAnmelden(a: Anmeldung): Promise<void>;
  /** Meldet ab und löscht alle Daten, Fotos und den Geräteschlüssel */
  abmelden(): Promise<void>;
  datenAktualisieren(): Promise<void>;
  einstellungenAendern(patch: Partial<Einstellungen>): Promise<void>;

  rapportSpeichern(r: MobilerRapport): Promise<void>;
  rapportLoeschen(id: string): Promise<void>;
  rapportEinreichen(id: string): Promise<string[]>;
  rapporteSynchronisieren(): Promise<void>;
}

const Ctx = createContext<AppZustand | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [bereit, setBereit] = useState(false);
  const [tresorFehler, setTresorFehler] = useState<string | null>(null);
  const [einstellungen, setEinstellungen] = useState<Einstellungen>(STANDARD_EINSTELLUNGEN);
  const [sitzung, setSitzung] = useState<Sitzung | null>(null);
  const [daten, setDaten] = useState<Datenbestand | null>(null);
  const [laedt, setLaedt] = useState(false);
  const [ladeFehler, setLadeFehler] = useState<string | null>(null);
  const [rapporte, setRapporte] = useState<MobilerRapport[]>([]);
  const rapporteRef = useRef(rapporte);
  rapporteRef.current = rapporte;

  const repository = useMemo<Repository | null>(() => {
    if (einstellungen.modus === 'demo') return new DemoRepository();
    if (einstellungen.modus === 'server' && sitzung) return new ServerRepository(sitzung);
    return null;
  }, [einstellungen.modus, sitzung]);

  const laden = useCallback(async (repo: Repository) => {
    setLaedt(true);
    setLadeFehler(null);
    try {
      const d = await repo.datenLaden();
      setDaten(d);
      await storage.datenSchreiben(d);
    } catch (e) {
      setLadeFehler(e instanceof Error ? e.message : String(e));
    } finally {
      setLaedt(false);
    }
  }, []);

  // Start: gespeicherten Zustand wiederherstellen
  useEffect(() => {
    (async () => {
      try {
        await tresorOeffnen();
      } catch (e) {
        setTresorFehler(e instanceof Error ? e.message : String(e));
      }
      const [e, s, d, r] = await Promise.all([
        storage.einstellungenLesen(),
        storage.sitzungLesen(),
        storage.datenLesen(),
        storage.rapporteLesen(),
      ]);
      setEinstellungen(e);
      setSitzung(s);
      setDaten(d);
      setRapporte(r);
      setBereit(true);
    })();
  }, []);

  // Sobald ein Repository verfügbar ist: Daten (neu) laden
  useEffect(() => {
    if (bereit && repository) void laden(repository);
  }, [bereit, repository, laden]);

  const einstellungenAendern = useCallback(
    async (patch: Partial<Einstellungen>) => {
      const neu = { ...einstellungen, ...patch };
      setEinstellungen(neu);
      await storage.einstellungenSchreiben(neu);
    },
    [einstellungen]
  );

  const demoStarten = useCallback(async () => {
    await storage.sitzungSchreiben(null);
    setSitzung(null);
    await einstellungenAendern({ modus: 'demo' });
  }, [einstellungenAendern]);

  const serverAnmelden = useCallback(
    async (a: Anmeldung) => {
      const s = await anmelden(a);
      await storage.sitzungSchreiben(s);
      setSitzung(s);
      await einstellungenAendern({ modus: 'server', serverUrl: s.serverUrl });
    },
    [einstellungenAendern]
  );

  const abmelden = useCallback(async () => {
    // Vollständige Bereinigung: Daten, Rapporte, Fotos, Sitzung und Schlüssel
    await storage.allesLoeschen();
    setSitzung(null);
    setDaten(null);
    setRapporte([]);
    // Neuer Schlüssel für die nächste Nutzung; Darstellungs-/Sicherheitseinstellungen bleiben
    try {
      await tresorOeffnen();
    } catch (e) {
      setTresorFehler(e instanceof Error ? e.message : String(e));
    }
    const neu: Einstellungen = { ...einstellungen, modus: null, serverUrl: '', eigeneMitarbeiterId: null };
    setEinstellungen(neu);
    await storage.einstellungenSchreiben(neu);
  }, [einstellungen]);

  const datenAktualisieren = useCallback(async () => {
    if (repository) await laden(repository);
  }, [repository, laden]);

  const rapporteSetzen = useCallback(async (liste: MobilerRapport[]) => {
    setRapporte(liste);
    await storage.rapporteSchreiben(liste);
  }, []);

  const rapportSpeichern = useCallback(
    async (r: MobilerRapport) => {
      const aktuell = rapporteRef.current;
      const idx = aktuell.findIndex((x) => x.id === r.id);
      const neu = idx >= 0 ? aktuell.map((x) => (x.id === r.id ? r : x)) : [r, ...aktuell];
      await rapporteSetzen(neu);
    },
    [rapporteSetzen]
  );

  const rapportLoeschen = useCallback(
    async (id: string) => {
      const r = rapporteRef.current.find((x) => x.id === id);
      r?.fotos.forEach(fotoLoeschen);
      await rapporteSetzen(rapporteRef.current.filter((x) => x.id !== id));
    },
    [rapporteSetzen]
  );

  const rapporteSynchronisieren = useCallback(async () => {
    if (!repository) return;
    const neu = await wartendeUebertragen(rapporteRef.current, repository, { fotoLaden: fotoAnhang });
    await rapporteSetzen(neu);
  }, [repository, rapporteSetzen]);

  const rapportEinreichen = useCallback(
    async (id: string): Promise<string[]> => {
      const r = rapporteRef.current.find((x) => x.id === id);
      if (!r) return ['Rapport nicht gefunden.'];
      const fehler = rapportPruefen(r);
      if (fehler.length) return fehler;
      await rapportSpeichern({ ...r, sync: 'wartet', syncFehler: null, geaendertAm: new Date().toISOString() });
      await rapporteSynchronisieren();
      return [];
    },
    [rapportSpeichern, rapporteSynchronisieren]
  );

  const wert = useMemo<AppZustand>(
    () => ({
      bereit,
      tresorFehler,
      einstellungen,
      sitzung,
      daten,
      laedt,
      ladeFehler,
      rapporte,
      repository,
      demoStarten,
      serverAnmelden,
      abmelden,
      datenAktualisieren,
      einstellungenAendern,
      rapportSpeichern,
      rapportLoeschen,
      rapportEinreichen,
      rapporteSynchronisieren,
    }),
    [
      bereit,
      tresorFehler,
      einstellungen,
      sitzung,
      daten,
      laedt,
      ladeFehler,
      rapporte,
      repository,
      demoStarten,
      serverAnmelden,
      abmelden,
      datenAktualisieren,
      einstellungenAendern,
      rapportSpeichern,
      rapportLoeschen,
      rapportEinreichen,
      rapporteSynchronisieren,
    ]
  );

  return <Ctx.Provider value={wert}>{children}</Ctx.Provider>;
}

export function useApp(): AppZustand {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp muss innerhalb von <AppProvider> verwendet werden');
  return ctx;
}

/** Bequemer Zugriff auf den Datenbestand mit leeren Listen als Fallback */
export function useDaten(): Datenbestand {
  const { daten } = useApp();
  return (
    daten ?? {
      projekte: [],
      lvListen: [],
      lvPositionen: [],
      adressen: [],
      mitarbeiter: [],
      einheiten: [],
      mwst: [],
      lohnarten: [],
      rapporte: [],
      standVom: '',
    }
  );
}
