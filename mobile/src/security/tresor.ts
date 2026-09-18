/**
 * Tresor: Verschlüsselung aller lokal gespeicherten Daten.
 *
 * - Ein zufälliger 256-Bit-Geräteschlüssel wird einmalig erzeugt und
 *   ausschließlich im Schlüsselbund des Betriebssystems abgelegt
 *   (iOS Keychain / Android Keystore-gesichert, nur auf diesem Gerät,
 *   nur bei entsperrtem Gerät lesbar, nicht in Backups enthalten).
 * - Jeder Datensatz wird mit AES-256-GCM und frischer 96-Bit-Nonce
 *   verschlüsselt; GCM erkennt jede Manipulation der Daten.
 * - Der Schlüssel liegt nur im Arbeitsspeicher, nie in AsyncStorage,
 *   nie in Logs, nie im Datenbestand.
 *
 * Format eines Chiffrats (Text):  "v1:" + base64(nonce ‖ ciphertext ‖ tag)
 * Format eines Chiffrats (Bytes): nonce ‖ ciphertext ‖ tag
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { gcm } from '@noble/ciphers/aes.js';
import { base64ZuBytes, bytesZuBase64, bytesZuUtf8, utf8ZuBytes, zufallsBytes } from './bytes';

const SCHLUESSEL_NAME = 'geraeteschluessel.v1';
const PRAEFIX = 'v1:';
const NONCE_LAENGE = 12;

let schluessel: Uint8Array | null = null;

async function schluesselLesen(): Promise<string | null> {
  if (Platform.OS === 'web') return AsyncStorage.getItem(SCHLUESSEL_NAME); // nur für Entwicklung
  const wert = await SecureStore.getItemAsync(SCHLUESSEL_NAME, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return typeof wert === 'string' && wert.length > 0 ? wert : null;
}

async function schluesselSchreiben(b64: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(SCHLUESSEL_NAME, b64);
    return;
  }
  await SecureStore.setItemAsync(SCHLUESSEL_NAME, b64, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

/** Öffnet den Tresor; legt beim allerersten Start den Geräteschlüssel an. */
export async function tresorOeffnen(): Promise<void> {
  if (schluessel) return;
  let b64 = await schluesselLesen();
  if (!b64) {
    b64 = bytesZuBase64(zufallsBytes(32));
    await schluesselSchreiben(b64);
  }
  const bytes = base64ZuBytes(b64);
  if (bytes.length !== 32) throw new Error('Geräteschlüssel ist beschädigt.');
  schluessel = bytes;
}

export function tresorOffen(): boolean {
  return schluessel != null;
}

/**
 * Vernichtet den Geräteschlüssel. Alle damit verschlüsselten Daten sind
 * danach unwiederbringlich unlesbar (kryptografisches Löschen).
 */
export async function tresorVernichten(): Promise<void> {
  schluessel = null;
  if (Platform.OS === 'web') await AsyncStorage.removeItem(SCHLUESSEL_NAME);
  else await SecureStore.deleteItemAsync(SCHLUESSEL_NAME);
}

/** Nur für Tests: festen Schlüssel setzen, ohne Schlüsselbund. */
export function _tresorSchluesselSetzen(bytes: Uint8Array | null): void {
  schluessel = bytes;
}

function key(): Uint8Array {
  if (!schluessel) throw new Error('Tresor ist nicht geöffnet.');
  return schluessel;
}

export function bytesVerschluesseln(klar: Uint8Array): Uint8Array {
  const nonce = zufallsBytes(NONCE_LAENGE);
  const chiffrat = gcm(key(), nonce).encrypt(klar);
  const out = new Uint8Array(nonce.length + chiffrat.length);
  out.set(nonce, 0);
  out.set(chiffrat, nonce.length);
  return out;
}

export function bytesEntschluesseln(daten: Uint8Array): Uint8Array {
  if (daten.length < NONCE_LAENGE + 16) throw new Error('Chiffrat ist zu kurz.');
  const nonce = daten.subarray(0, NONCE_LAENGE);
  const chiffrat = daten.subarray(NONCE_LAENGE);
  return gcm(key(), nonce).decrypt(chiffrat);
}

export function textVerschluesseln(text: string): string {
  return PRAEFIX + bytesZuBase64(bytesVerschluesseln(utf8ZuBytes(text)));
}

export function istVerschluesselt(text: string): boolean {
  return text.startsWith(PRAEFIX);
}

export function textEntschluesseln(text: string): string {
  if (!istVerschluesselt(text)) throw new Error('Unbekanntes Datenformat.');
  return bytesZuUtf8(bytesEntschluesseln(base64ZuBytes(text.slice(PRAEFIX.length))));
}
