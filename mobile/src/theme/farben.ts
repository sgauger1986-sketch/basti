import { brand } from '@/brand';
import type { StatusTon } from '@/domain/status';

export interface Farben {
  hintergrund: string;
  flaeche: string;
  flaeche2: string;
  rand: string;
  text: string;
  text2: string;
  text3: string;
  akzent: string;
  akzentText: string;
  akzentWeich: string;
  fehler: string;
  fehlerWeich: string;
  status: Record<StatusTon, { text: string; hintergrund: string }>;
}

export const HELL: Farben = {
  hintergrund: '#f4f6f3',
  flaeche: '#ffffff',
  flaeche2: '#eef1ec',
  rand: '#dde2da',
  text: '#1b1f1a',
  text2: '#59614f',
  text3: '#87907c',
  akzent: brand.colors.primary,
  akzentText: '#ffffff',
  akzentWeich: '#e4efe8',
  fehler: '#b3261e',
  fehlerWeich: '#f9dedc',
  status: {
    angebot: { text: '#b7791f', hintergrund: '#faf0dc' },
    auftrag: { text: '#2f6b4f', hintergrund: '#e4efe8' },
    rechnung: { text: '#2b5f87', hintergrund: '#e2ecf4' },
    neutral: { text: '#6b6470', hintergrund: '#ecebee' },
    fehler: { text: '#b3261e', hintergrund: '#f9dedc' },
  },
};

export const DUNKEL: Farben = {
  hintergrund: '#13160f',
  flaeche: '#1c2018',
  flaeche2: '#232819',
  rand: '#333a29',
  text: '#e8ece2',
  text2: '#a3ab97',
  text3: '#767e6b',
  akzent: brand.colors.primaryDark,
  akzentText: '#0e1409',
  akzentWeich: '#1e2b22',
  fehler: '#f2b8b5',
  fehlerWeich: '#4a1f1c',
  status: {
    angebot: { text: '#e0b061', hintergrund: '#2c2413' },
    auftrag: { text: '#6bbd8f', hintergrund: '#16271d' },
    rechnung: { text: '#78b1de', hintergrund: '#152534' },
    neutral: { text: '#b0a8ba', hintergrund: '#242130' },
    fehler: { text: '#f2b8b5', hintergrund: '#4a1f1c' },
  },
};

export const ABSTAND = { xs: 4, s: 8, m: 12, l: 16, xl: 24 } as const;
export const RADIUS = { s: 7, m: 10, l: 14 } as const;

/** Schriftfamilie Inter (wird in app/_layout.tsx geladen) */
export const SCHRIFT = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

/** Weiche Kartenschatten (iOS) bzw. Elevation (Android) */
export const SCHATTEN = {
  karte: {
    shadowColor: '#14200f',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  hervorgehoben: {
    shadowColor: '#14200f',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
} as const;
