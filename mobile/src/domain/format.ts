/**
 * Formatierung für die deutsche Oberfläche. Bewusst ohne `Intl`-Abhängigkeit
 * umgesetzt, weil die Hermes-Engine auf Android nicht alle Locale-Daten liefert.
 */

function gruppieren(ganzzahl: string): string {
  return ganzzahl.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function zahl(n: number | null | undefined, nachkommastellen = 2): string {
  if (n == null || Number.isNaN(n)) return '—';
  const negativ = n < 0;
  const fest = Math.abs(n).toFixed(nachkommastellen);
  const [ganz, rest] = fest.split('.');
  const text = rest != null ? `${gruppieren(ganz)},${rest}` : gruppieren(ganz);
  return negativ ? `-${text}` : text;
}

export function euro(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return `${zahl(n, 2)} €`;
}

export function prozent(n: number | null | undefined, nachkommastellen = 0): string {
  if (n == null || Number.isNaN(n)) return '—';
  return `${zahl(n, nachkommastellen)} %`;
}

export function stunden(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return `${zahl(n, 2)} h`;
}

/** ISO-Datum (YYYY-MM-DD) → 18.09.2026 */
export function datum(iso: string | null | undefined): string {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}.${m[2]}.${m[1]}`;
}

/** Heutiges Datum als ISO (YYYY-MM-DD) in lokaler Zeit */
export function heuteIso(jetzt: Date = new Date()): string {
  const y = jetzt.getFullYear();
  const m = String(jetzt.getMonth() + 1).padStart(2, '0');
  const d = String(jetzt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** "12,5" oder "12.5" → 12.5; ungültig → null */
export function dezimalParsen(text: string): number | null {
  const bereinigt = text.trim().replace(/\./g, '').replace(',', '.');
  if (bereinigt === '' || bereinigt === '-') return null;
  const n = Number(bereinigt);
  return Number.isFinite(n) ? n : null;
}

/** "18.09.2026" oder "18.9.26" → "2026-09-18"; ungültig → null */
export function datumParsen(text: string): string | null {
  const m = /^\s*(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})\s*$/.exec(text);
  if (!m) return null;
  const tag = Number(m[1]);
  const monat = Number(m[2]);
  const jahr = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  const d = new Date(jahr, monat - 1, tag);
  if (d.getFullYear() !== jahr || d.getMonth() !== monat - 1 || d.getDate() !== tag) return null;
  return `${jahr}-${String(monat).padStart(2, '0')}-${String(tag).padStart(2, '0')}`;
}

/** Kompakte Euro-Darstellung für Kennzahl-Kacheln: 1.257.865,30 → "1,26 Mio. €" */
export function euroKompakt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  const betrag = Math.abs(n);
  if (betrag >= 1_000_000) return `${zahl(n / 1_000_000, 2)} Mio. €`;
  if (betrag >= 10_000) return `${zahl(n, 0)} €`;
  return euro(n);
}
