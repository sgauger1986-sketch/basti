/**
 * App-Sperre und Sichtschutz.
 *
 * - Beim Start und nach einer Zeit im Hintergrund muss die App per
 *   Face ID / Touch ID / Fingerabdruck oder Gerätecode entsperrt werden.
 * - Sobald die App in den Hintergrund geht, legt sich ein Sichtschutz über
 *   den Inhalt, damit im App-Switcher keine Kundendaten zu sehen sind.
 * - Optional werden Screenshots und Bildschirmaufnahmen blockiert
 *   (Android: FLAG_SECURE, iOS: Aufnahme wird geschwärzt).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, StyleSheet, Text, View, type AppStateStatus } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as ScreenCapture from 'expo-screen-capture';
import { brand } from '@/brand';
import { useTheme } from '@/theme/useTheme';
import { ABSTAND, RADIUS, SCHRIFT } from '@/theme/farben';
import { Knopf } from '@/ui';

export interface AppSperreProps {
  aktiv: boolean;
  /** Sekunden im Hintergrund, nach denen erneut entsperrt werden muss (0 = immer) */
  sperrNachSekunden: number;
  screenshotSchutz: boolean;
  children: React.ReactNode;
}

/** Ergebnis einer Entsperr-Anfrage – auch außerhalb der Komponente nutzbar */
export async function geraetEntsperren(): Promise<{ ok: boolean; meldung: string | null }> {
  if (Platform.OS === 'web') return { ok: true, meldung: null };
  try {
    const stufe = await LocalAuthentication.getEnrolledLevelAsync();
    if (stufe === LocalAuthentication.SecurityLevel.NONE) {
      return {
        ok: true,
        meldung: 'Auf diesem Gerät ist kein Gerätecode eingerichtet. Bitte in den Systemeinstellungen eine Bildschirmsperre aktivieren.',
      };
    }
    const ergebnis = await LocalAuthentication.authenticateAsync({
      promptMessage: `${brand.name} entsperren`,
      cancelLabel: 'Abbrechen',
      disableDeviceFallback: false,
    });
    if (ergebnis.success) return { ok: true, meldung: null };
    return { ok: false, meldung: ergebnis.error === 'user_cancel' ? null : 'Entsperren fehlgeschlagen.' };
  } catch (e) {
    return { ok: false, meldung: e instanceof Error ? e.message : String(e) };
  }
}

export function AppSperre({ aktiv, sperrNachSekunden, screenshotSchutz, children }: AppSperreProps) {
  const { farben } = useTheme();
  const [gesperrt, setGesperrt] = useState(aktiv);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [meldung, setMeldung] = useState<string | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const hintergrundSeit = useRef<number | null>(null);

  // Sperre ein-/ausschalten
  useEffect(() => {
    if (!aktiv) setGesperrt(false);
  }, [aktiv]);

  // Hintergrund-Erkennung
  useEffect(() => {
    const sub = AppState.addEventListener('change', (naechster) => {
      if (naechster === 'background' || naechster === 'inactive') {
        if (hintergrundSeit.current == null) hintergrundSeit.current = Date.now();
      } else if (naechster === 'active') {
        const seit = hintergrundSeit.current;
        hintergrundSeit.current = null;
        if (aktiv && seit != null && (Date.now() - seit) / 1000 >= sperrNachSekunden) setGesperrt(true);
      }
      setAppState(naechster);
    });
    return () => sub.remove();
  }, [aktiv, sperrNachSekunden]);

  // Screenshot-/Aufnahmeschutz
  useEffect(() => {
    if (Platform.OS === 'web') return;
    (async () => {
      try {
        if (screenshotSchutz) {
          await ScreenCapture.preventScreenCaptureAsync('app');
          if (Platform.OS === 'ios') await ScreenCapture.enableAppSwitcherProtectionAsync();
        } else {
          await ScreenCapture.allowScreenCaptureAsync('app');
          if (Platform.OS === 'ios') await ScreenCapture.disableAppSwitcherProtectionAsync();
        }
      } catch {
        /* nicht verfügbar (z. B. Simulator) */
      }
    })();
  }, [screenshotSchutz]);

  const entsperren = useCallback(async () => {
    if (laeuft) return;
    setLaeuft(true);
    setMeldung(null);
    try {
      const r = await geraetEntsperren();
      if (r.ok) setGesperrt(false);
      setMeldung(r.meldung);
    } finally {
      setLaeuft(false);
    }
  }, [laeuft]);

  // Beim Sperren sofort den System-Dialog anbieten
  useEffect(() => {
    if (gesperrt && appState === 'active') void entsperren();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gesperrt]);

  const sichtschutz = appState !== 'active';

  return (
    <View style={{ flex: 1 }}>
      {children}
      {gesperrt || sichtschutz ? (
        <View style={[StyleSheet.absoluteFill, s.deckel, { backgroundColor: farben.hintergrund }]}>
          <View style={[s.logo, { backgroundColor: farben.akzent }]}>
            <Ionicons name={gesperrt ? 'lock-closed' : 'construct'} size={30} color={farben.akzentText} />
          </View>
          <Text style={[s.name, { color: farben.text }]}>{brand.name}</Text>
          {gesperrt ? (
            <View style={{ width: '100%', maxWidth: 360, gap: ABSTAND.m, marginTop: ABSTAND.xl }}>
              <Text style={{ color: farben.text2, textAlign: 'center' }}>
                Zum Schutz der Kundendaten ist die App gesperrt.
              </Text>
              {meldung ? <Text style={{ color: farben.fehler, textAlign: 'center' }}>{meldung}</Text> : null}
              <Knopf titel="Entsperren" icon="finger-print-outline" onPress={() => void entsperren()} laedt={laeuft} />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  deckel: { alignItems: 'center', justifyContent: 'center', padding: ABSTAND.xl, zIndex: 1000 },
  logo: { width: 64, height: 64, borderRadius: RADIUS.l, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 22, fontFamily: SCHRIFT.extrabold, marginTop: ABSTAND.m },
});
