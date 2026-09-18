import { base64ZuBytes, bytesZuBase64, bytesZuUtf8, utf8ZuBytes, zufallsBytes } from '@/security/bytes';
import {
  _tresorSchluesselSetzen,
  bytesEntschluesseln,
  bytesVerschluesseln,
  istVerschluesselt,
  textEntschluesseln,
  textVerschluesseln,
  tresorOffen,
} from '@/security/tresor';

describe('Byte-Hilfen', () => {
  test('Base64 hin und zurück, inkl. Padding', () => {
    for (const n of [0, 1, 2, 3, 4, 31, 32, 33, 100]) {
      const b = zufallsBytes(n);
      expect(base64ZuBytes(bytesZuBase64(b))).toEqual(b);
    }
    expect(bytesZuBase64(utf8ZuBytes('Hallo'))).toBe('SGFsbG8=');
  });
  test('UTF-8 mit Umlauten und Symbolen', () => {
    const s = 'Pflaster 12,5 m² – Müller & Söhne 🌳';
    expect(bytesZuUtf8(utf8ZuBytes(s))).toBe(s);
  });
  test('Zufallsbytes sind nicht konstant', () => {
    expect(bytesZuBase64(zufallsBytes(16))).not.toBe(bytesZuBase64(zufallsBytes(16)));
  });
});

describe('Tresor (AES-256-GCM)', () => {
  const schluessel = new Uint8Array(32).map((_, i) => (i * 7 + 3) & 255);
  beforeEach(() => _tresorSchluesselSetzen(schluessel));
  afterAll(() => _tresorSchluesselSetzen(null));

  test('Text hin und zurück, jedes Mal anderes Chiffrat', () => {
    const klar = JSON.stringify({ kunde: 'Müller, Franz', summe: 199113.2 });
    const c1 = textVerschluesseln(klar);
    const c2 = textVerschluesseln(klar);
    expect(istVerschluesselt(c1)).toBe(true);
    expect(c1).not.toBe(c2); // frische Nonce
    expect(c1).not.toContain('Müller');
    expect(textEntschluesseln(c1)).toBe(klar);
    expect(textEntschluesseln(c2)).toBe(klar);
  });

  test('Manipulation wird erkannt', () => {
    const c = textVerschluesseln('geheim');
    const bytes = base64ZuBytes(c.slice(3));
    bytes[bytes.length - 1] ^= 1;
    expect(() => textEntschluesseln('v1:' + bytesZuBase64(bytes))).toThrow();
    expect(() => textEntschluesseln('klartext')).toThrow(/Datenformat/);
  });

  test('Falscher Schlüssel kann nicht entschlüsseln', () => {
    const c = textVerschluesseln('geheim');
    _tresorSchluesselSetzen(new Uint8Array(32));
    expect(() => textEntschluesseln(c)).toThrow();
  });

  test('Binärdaten (Fotos) hin und zurück', () => {
    const foto = zufallsBytes(5000);
    const c = bytesVerschluesseln(foto);
    expect(c.length).toBe(foto.length + 12 + 16);
    expect(bytesEntschluesseln(c)).toEqual(foto);
  });

  test('Ohne Schlüssel verweigert der Tresor', () => {
    _tresorSchluesselSetzen(null);
    expect(tresorOffen()).toBe(false);
    expect(() => textVerschluesseln('x')).toThrow(/nicht geöffnet/);
  });
});
