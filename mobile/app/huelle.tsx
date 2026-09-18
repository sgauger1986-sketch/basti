/**
 * Web-Hülle: lädt die bestehende heywerki-Oberfläche in einer nativen
 * Ansicht und ergänzt sie um App-Funktionen (Brücke, Push, Sperre).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Linking, Platform, Share, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import { useNetInfo } from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { brand } from '@/brand';
import { useTheme } from '@/theme/useTheme';
import { ABSTAND, SCHRIFT } from '@/theme/farben';
import { Knopf } from '@/ui';
import { brueckenSkript, nachrichtParsen, navigationEntscheiden } from '@/huelle/navigation';
import { pushTokenHolen, pushVerhaltenSetzen } from '@/huelle/push';

// react-native-webview hat keine Web-Implementierung; im Browser (nur Entwicklung) nutzen wir ein iframe.
type WebViewModul = typeof import('react-native-webview');
const WebView: WebViewModul['WebView'] | null =
  Platform.OS === 'web' ? null : (require('react-native-webview') as WebViewModul).WebView;

export default function Huelle() {
  const { farben, dunkel } = useTheme();
  const netz = useNetInfo();
  const webRef = useRef<React.ElementRef<NonNullable<typeof WebView>> | null>(null);
  const [laedt, setLaedt] = useState(WebView != null); // im Browser (iframe) gibt es kein Ladeereignis
  const [fehler, setFehler] = useState<string | null>(null);
  const [kannZurueck, setKannZurueck] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [neuLadeSchluessel, setNeuLadeSchluessel] = useState(0);

  useEffect(() => {
    pushVerhaltenSetzen();
    void pushTokenHolen().then(setPushToken);
  }, []);

  // Android: Zurück-Taste navigiert innerhalb der Web-Oberfläche
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (kannZurueck && webRef.current) {
        webRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [kannZurueck]);

  const skript = useMemo(
    () =>
      brueckenSkript(
        {
          plattform: Platform.OS,
          version: Constants.expoConfig?.version ?? '1.0.0',
          appName: brand.name,
          pushToken,
        },
        dunkel,
        farben.akzent,
        farben.hintergrund
      ),
    [pushToken, dunkel, farben.akzent, farben.hintergrund]
  );

  // Token nachreichen, sobald er da ist (Seite ist evtl. schon geladen)
  useEffect(() => {
    if (pushToken && webRef.current) {
      webRef.current.injectJavaScript(
        `window.heywerkiApp && (window.heywerkiApp.pushToken = ${JSON.stringify(pushToken)}); window.dispatchEvent(new CustomEvent('heywerki:pushToken', { detail: ${JSON.stringify(pushToken)} })); true;`
      );
    }
  }, [pushToken]);

  const nachricht = useCallback(
    async (roh: string) => {
      const n = nachrichtParsen(roh);
      if (!n) return;
      switch (n.typ) {
        case 'extern-oeffnen':
          await Linking.openURL(n.url).catch(() => {});
          break;
        case 'teilen':
          await Share.share({ message: n.url ? `${n.text}\n${n.url}` : n.text }).catch(() => {});
          break;
        case 'haptik':
          if (n.art === 'erfolg') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          else if (n.art === 'fehler') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          else void Haptics.impactAsync(n.art === 'mittel' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'push-token-anfordern':
          void pushTokenHolen().then(setPushToken);
          break;
        case 'titel':
        case 'schliessen':
          // Kein Stack, nichts zu schließen; Titel zeigt die Web-Oberfläche selbst
          break;
      }
    },
    []
  );

  const offline = netz.isConnected === false;

  return (
    <View style={{ flex: 1, backgroundColor: farben.hintergrund }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={dunkel ? 'light' : 'dark'} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {WebView ? (
          <WebView
            key={neuLadeSchluessel}
            ref={webRef}
            source={{ uri: brand.webAppUrl }}
            style={{ flex: 1, backgroundColor: farben.hintergrund }}
            injectedJavaScriptBeforeContentLoaded={skript}
            onMessage={(e) => void nachricht(e.nativeEvent.data)}
            onShouldStartLoadWithRequest={(req) => {
              const entscheidung = navigationEntscheiden(req.url, brand.webAppUrl, brand.webErlaubteHosts);
              if (entscheidung === 'intern') return true;
              if (entscheidung === 'extern') void Linking.openURL(req.url).catch(() => {});
              return false;
            }}
            onLoadStart={() => {
              setLaedt(true);
              setFehler(null);
            }}
            onLoadEnd={() => setLaedt(false)}
            onError={(e) => {
              setLaedt(false);
              setFehler(e.nativeEvent.description || 'Seite konnte nicht geladen werden.');
            }}
            onHttpError={(e) => {
              if (e.nativeEvent.statusCode >= 500) setFehler(`Server antwortet mit Fehler ${e.nativeEvent.statusCode}.`);
            }}
            onNavigationStateChange={(s) => setKannZurueck(s.canGoBack)}
            // Sicherheit
            mixedContentMode="never"
            allowFileAccess={false}
            allowFileAccessFromFileURLs={false}
            allowUniversalAccessFromFileURLs={false}
            setSupportMultipleWindows={false}
            allowsLinkPreview={false}
            incognito={false}
            sharedCookiesEnabled
            thirdPartyCookiesEnabled={false}
            // Komfort
            pullToRefreshEnabled
            allowsBackForwardNavigationGestures
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            geolocationEnabled
            textZoom={100}
            bounces={false}
            overScrollMode="never"
            applicationNameForUserAgent={`${brand.name}App/${Constants.expoConfig?.version ?? '1.0.0'}`}
            startInLoadingState={false}
          />
        ) : (
          <WebIframe url={brand.webAppUrl} />
        )}

        {laedt && !fehler ? (
          <View style={[StyleSheet.absoluteFill, s.mitte, { backgroundColor: farben.hintergrund }]} pointerEvents="none">
            <ActivityIndicator color={farben.akzent} size="large" />
            <Text style={[s.ladeText, { color: farben.text2 }]}>{brand.name} wird geladen …</Text>
          </View>
        ) : null}

        {fehler || offline ? (
          <View style={[StyleSheet.absoluteFill, s.mitte, { backgroundColor: farben.hintergrund }]}>
            <View style={[s.fehlerIcon, { backgroundColor: farben.akzentWeich }]}>
              <Ionicons name={offline ? 'cloud-offline-outline' : 'alert-circle-outline'} size={30} color={farben.akzent} />
            </View>
            <Text style={[s.fehlerTitel, { color: farben.text }]}>{offline ? 'Keine Internetverbindung' : 'Verbindung fehlgeschlagen'}</Text>
            <Text style={[s.fehlerText, { color: farben.text2 }]}>
              {offline ? 'Sobald wieder eine Verbindung besteht, kann es weitergehen.' : fehler}
            </Text>
            <Knopf
              titel="Erneut versuchen"
              icon="refresh-outline"
              onPress={() => {
                setFehler(null);
                setNeuLadeSchluessel((k) => k + 1);
              }}
              style={{ minWidth: 220 }}
            />
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

/** Nur für die Entwicklung im Browser */
function WebIframe({ url }: { url: string }) {
  if (Platform.OS !== 'web') return null;
  return React.createElement('iframe', {
    src: url,
    style: { border: 'none', width: '100%', height: '100%', flex: 1 },
    allow: 'camera; microphone; geolocation',
    title: brand.name,
  });
}

const s = StyleSheet.create({
  mitte: { alignItems: 'center', justifyContent: 'center', padding: ABSTAND.xl, gap: ABSTAND.m },
  ladeText: { fontFamily: SCHRIFT.medium, fontSize: 14 },
  fehlerIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  fehlerTitel: { fontFamily: SCHRIFT.bold, fontSize: 20, textAlign: 'center' },
  fehlerText: { fontFamily: SCHRIFT.regular, fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: ABSTAND.s },
});
