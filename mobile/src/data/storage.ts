/**
 * Lokale Persistenz. Alle Inhalte (Datenbestand, Rapporte, Einstellungen)
 * werden vor dem Speichern mit dem Geräteschlüssel verschlüsselt
 * (siehe security/tresor.ts). Die Sitzung (Token) liegt direkt im
 * Schlüsselbund des Betriebssystems.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Datenbestand, MobilerRapport } from '@/domain/types';
import { istVerschluesselt, textEntschluesseln, textVerschluesseln, tresorVernichten } from '@/security/tresor';
import { alleFotosLoeschen } from '@/security/fotoTresor';
import type { Sitzung } from './repository';

const KEY_DATEN = 'daten.v2';
const KEY_RAPPORTE = 'rapporte.lokal.v2';
const KEY_EINSTELLUNGEN = 'einstellungen.v2';
const KEY_SITZUNG = 'sitzung.v1';
const ALLE_KEYS = [KEY_DATEN, KEY_RAPPORTE, KEY_EINSTELLUNGEN];

export type Farbschema = 'system' | 'hell' | 'dunkel';

export interface Einstellungen {
  modus: 'demo' | 'server' | null;
  serverUrl: string;
  farbschema: Farbschema;
  /** Standard-Mitarbeiter für neue Rapporte */
  eigeneMitarbeiterId: string | null;
  /** App-Sperre per Biometrie/Gerätecode */
  appSperre: boolean;
  /** Sekunden im Hintergrund bis zur erneuten Sperre */
  sperrNachSekunden: number;
  /** Screenshots und Bildschirmaufnahmen blockieren */
  screenshotSchutz: boolean;
}

export const STANDARD_EINSTELLUNGEN: Einstellungen = {
  modus: null,
  serverUrl: '',
  farbschema: 'system',
  eigeneMitarbeiterId: null,
  appSperre: true,
  sperrNachSekunden: 60,
  screenshotSchutz: true,
};

async function verschluesseltLesen<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    // Unverschlüsselte Altbestände werden nicht akzeptiert
    if (!istVerschluesselt(raw)) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return JSON.parse(textEntschluesseln(raw)) as T;
  } catch {
    return null;
  }
}

async function verschluesseltSchreiben(key: string, wert: unknown): Promise<void> {
  await AsyncStorage.setItem(key, textVerschluesseln(JSON.stringify(wert)));
}

export const storage = {
  einstellungenLesen: async (): Promise<Einstellungen> => ({
    ...STANDARD_EINSTELLUNGEN,
    ...((await verschluesseltLesen<Partial<Einstellungen>>(KEY_EINSTELLUNGEN)) ?? {}),
  }),
  einstellungenSchreiben: (e: Einstellungen) => verschluesseltSchreiben(KEY_EINSTELLUNGEN, e),

  datenLesen: () => verschluesseltLesen<Datenbestand>(KEY_DATEN),
  datenSchreiben: (d: Datenbestand) => verschluesseltSchreiben(KEY_DATEN, d),
  datenLoeschen: () => AsyncStorage.removeItem(KEY_DATEN),

  rapporteLesen: async (): Promise<MobilerRapport[]> =>
    (await verschluesseltLesen<MobilerRapport[]>(KEY_RAPPORTE)) ?? [],
  rapporteSchreiben: (r: MobilerRapport[]) => verschluesseltSchreiben(KEY_RAPPORTE, r),

  sitzungLesen: async (): Promise<Sitzung | null> => {
    try {
      const raw =
        Platform.OS === 'web'
          ? await AsyncStorage.getItem(KEY_SITZUNG)
          : await SecureStore.getItemAsync(KEY_SITZUNG, {
              keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            });
      return raw ? (JSON.parse(raw) as Sitzung) : null;
    } catch {
      return null;
    }
  },
  sitzungSchreiben: async (s: Sitzung | null) => {
    const raw = s ? JSON.stringify(s) : null;
    if (Platform.OS === 'web') {
      if (raw) await AsyncStorage.setItem(KEY_SITZUNG, raw);
      else await AsyncStorage.removeItem(KEY_SITZUNG);
      return;
    }
    if (raw)
      await SecureStore.setItemAsync(KEY_SITZUNG, raw, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    else await SecureStore.deleteItemAsync(KEY_SITZUNG);
  },

  /**
   * Gerät bereinigen: alle Daten, Fotos, die Sitzung und der Geräteschlüssel
   * werden gelöscht. Selbst forensisch wiederhergestellte Reste sind ohne
   * den vernichteten Schlüssel wertlos.
   */
  allesLoeschen: async () => {
    await AsyncStorage.multiRemove(ALLE_KEYS);
    alleFotosLoeschen();
    await storage.sitzungSchreiben(null);
    await tresorVernichten();
  },
};
