import { datum, dezimalParsen, euro, heuteIso, prozent, zahl } from '@/domain/format';

describe('Formatierung', () => {
  test('Zahlen mit deutschem Tausenderpunkt und Komma', () => {
    expect(zahl(1234567.891)).toBe('1.234.567,89');
    expect(zahl(0)).toBe('0,00');
    expect(zahl(-42.5, 1)).toBe('-42,5');
    expect(zahl(null)).toBe('—');
  });
  test('Euro und Prozent', () => {
    expect(euro(199113.2)).toBe('199.113,20 €');
    expect(prozent(19)).toBe('19 %');
    expect(euro(undefined)).toBe('—');
  });
  test('Datum ISO → deutsch', () => {
    expect(datum('2026-09-18')).toBe('18.09.2026');
    expect(datum('2026-09-18T10:00:00Z')).toBe('18.09.2026');
    expect(datum(null)).toBe('—');
  });
  test('heuteIso liefert lokales Datum', () => {
    expect(heuteIso(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
  test('Dezimalzahlen aus Eingaben', () => {
    expect(dezimalParsen('12,5')).toBe(12.5);
    expect(dezimalParsen('1.250,75')).toBe(1250.75);
    expect(dezimalParsen('8')).toBe(8);
    expect(dezimalParsen('abc')).toBeNull();
    expect(dezimalParsen('')).toBeNull();
  });
});

describe('Datum parsen', () => {
  const { datumParsen } = require('@/domain/format') as typeof import('@/domain/format');
  test('gültige Eingaben', () => {
    expect(datumParsen('18.09.2026')).toBe('2026-09-18');
    expect(datumParsen('1.2.26')).toBe('2026-02-01');
  });
  test('ungültige Eingaben', () => {
    expect(datumParsen('31.02.2026')).toBeNull();
    expect(datumParsen('2026-09-18')).toBeNull();
    expect(datumParsen('')).toBeNull();
  });
});

describe('Kompakte Euro-Beträge', () => {
  const { euroKompakt } = require('@/domain/format') as typeof import('@/domain/format');
  test('Millionen, Zehntausender, kleine Beträge', () => {
    expect(euroKompakt(1257865.3)).toBe('1,26 Mio. €');
    expect(euroKompakt(577940.41)).toBe('577.940 €');
    expect(euroKompakt(9999.5)).toBe('9.999,50 €');
    expect(euroKompakt(-2500000)).toBe('-2,50 Mio. €');
    expect(euroKompakt(null)).toBe('—');
  });
});
