/**
 * Byte-Hilfsfunktionen ohne Abhängigkeit von Node- oder Browser-APIs,
 * damit sie auf Hermes (iOS/Android), im Web und in Jest identisch laufen.
 */
import * as Crypto from 'expo-crypto';

/** Kryptografisch sichere Zufallsbytes (expo-crypto, Fallback: Web Crypto) */
export function zufallsBytes(anzahl: number): Uint8Array {
  try {
    const b = Crypto.getRandomBytes(anzahl);
    if (b instanceof Uint8Array && b.length === anzahl) return b;
  } catch {
    /* expo-crypto nicht verfügbar (z. B. Jest) */
  }
  const g = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
  if (g?.getRandomValues) {
    const b = new Uint8Array(anzahl);
    g.getRandomValues(b);
    return b;
  }
  throw new Error('Kein sicherer Zufallsgenerator verfügbar.');
}

export function utf8ZuBytes(text: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(text);
  const bin = unescape(encodeURIComponent(text));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function bytesZuUtf8(bytes: Uint8Array): string {
  if (typeof TextDecoder !== 'undefined') return new TextDecoder().decode(bytes);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return decodeURIComponent(escape(bin));
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64_INDEX: Record<string, number> = {};
for (let i = 0; i < B64.length; i++) B64_INDEX[B64[i]] = i;

export function bytesZuBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const n = (a << 16) | (b << 8) | c;
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
    out += i + 1 < bytes.length ? B64[(n >> 6) & 63] : '=';
    out += i + 2 < bytes.length ? B64[n & 63] : '=';
  }
  return out;
}

export function base64ZuBytes(text: string): Uint8Array {
  const sauber = text.replace(/[^A-Za-z0-9+/]/g, '');
  const laenge = Math.floor((sauber.length * 3) / 4);
  const out = new Uint8Array(laenge);
  let j = 0;
  for (let i = 0; i < sauber.length; i += 4) {
    const n =
      (B64_INDEX[sauber[i]] << 18) |
      ((B64_INDEX[sauber[i + 1]] ?? 0) << 12) |
      ((B64_INDEX[sauber[i + 2]] ?? 0) << 6) |
      (B64_INDEX[sauber[i + 3]] ?? 0);
    if (j < laenge) out[j++] = (n >> 16) & 255;
    if (j < laenge) out[j++] = (n >> 8) & 255;
    if (j < laenge) out[j++] = n & 255;
  }
  return out;
}
