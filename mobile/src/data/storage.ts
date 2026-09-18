/**
 * Lokale Persistenz. Unkritische Daten in AsyncStorage, Zugangsdaten
 * (Token) verschlüsselt im SecureStore des Betriebssystems.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Datenbestand, MobilerRapport } from '@/domain/types';
import type { Sitzung } from './repository';

const KEY_DATEN = 'daten.v1';
const KEY_RAPPORTE = 'rapporte.lokal.v1';
const KEY_EINSTELLUNGEN = 'einstellungen.v1';
const KEY_SITZUNG = 'sitzung.v1';

export type Farbschema = 'system' | 'hell' | 'dunkel';

export interface Einstellungen {
  modus: 'demo' | 'server' | null;
  serverUrl: string;
  farbschema: Farbschema;
  /** Standard-Mitarbeiter für neue Rapporte */
  eigeneMitarbeiterId: string | null;
}

export const STANDARD_EINSTELLUNGEN: Einstellungen = {
  modus: null,
  serverUrl: '',
  farbschema: 'system',
  eigeneMitarbeiterId: null,
};

async function lesen<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? ({ ...fallback, ...(JSON.parse(raw) as object) } as T) : fallback;
  } catch {
    return fallback;
  }
}

async function schreiben(key: string, wert: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(wert));
}

export const storage = {
  einstellungenLesen: () => lesen<Einstellungen>(KEY_EINSTELLUNGEN, STANDARD_EINSTELLUNGEN),
  einstellungenSchreiben: (e: Einstellungen) => schreiben(KEY_EINSTELLUNGEN, e),

  datenLesen: async (): Promise<Datenbestand | null> => {
    try {
      const raw = await AsyncStorage.getItem(KEY_DATEN);
      return raw ? (JSON.parse(raw) as Datenbestand) : null;
    } catch {
      return null;
    }
  },
  datenSchreiben: (d: Datenbestand) => schreiben(KEY_DATEN, d),
  datenLoeschen: () => AsyncStorage.removeItem(KEY_DATEN),

  rapporteLesen: async (): Promise<MobilerRapport[]> => {
    try {
      const raw = await AsyncStorage.getItem(KEY_RAPPORTE);
      return raw ? (JSON.parse(raw) as MobilerRapport[]) : [];
    } catch {
      return [];
    }
  },
  rapporteSchreiben: (r: MobilerRapport[]) => schreiben(KEY_RAPPORTE, r),

  sitzungLesen: async (): Promise<Sitzung | null> => {
    try {
      const raw =
        Platform.OS === 'web'
          ? await AsyncStorage.getItem(KEY_SITZUNG)
          : await SecureStore.getItemAsync(KEY_SITZUNG);
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
    if (raw) await SecureStore.setItemAsync(KEY_SITZUNG, raw);
    else await SecureStore.deleteItemAsync(KEY_SITZUNG);
  },

  allesLoeschen: async () => {
    await AsyncStorage.multiRemove([KEY_DATEN, KEY_RAPPORTE, KEY_EINSTELLUNGEN]);
    await storage.sitzungSchreiben(null);
  },
};
