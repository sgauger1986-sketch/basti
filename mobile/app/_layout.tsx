import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { AppProvider, useApp } from '@/state/AppProvider';
import { useTheme } from '@/theme/useTheme';
import { AppSperre } from '@/security/AppSperre';
import { Hinweis } from '@/ui';
import { SCHRIFT } from '@/theme/farben';

void SplashScreen.preventAutoHideAsync().catch(() => {});

function Navigation() {
  const { bereit: datenBereit, einstellungen, tresorFehler } = useApp();
  const { farben, dunkel } = useTheme();
  const angemeldet = einstellungen.modus != null;
  const [schriftenBereit] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold });
  const bereit = datenBereit && schriftenBereit;

  useEffect(() => {
    if (bereit) void SplashScreen.hideAsync().catch(() => {});
  }, [bereit]);

  if (!bereit) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: farben.hintergrund }}>
        <ActivityIndicator color={farben.akzent} />
      </View>
    );
  }

  return (
    <AppSperre
      aktiv={einstellungen.appSperre}
      sperrNachSekunden={einstellungen.sperrNachSekunden}
      screenshotSchutz={einstellungen.screenshotSchutz}
    >
      <StatusBar style={dunkel ? 'light' : 'dark'} />
      {tresorFehler ? (
        <View style={{ paddingTop: 48 }}>
          <Hinweis ton="fehler">Verschlüsselter Speicher nicht verfügbar: {tresorFehler}</Hinweis>
        </View>
      ) : null}
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: farben.flaeche },
          headerTintColor: farben.akzent,
          headerTitleStyle: { color: farben.text, fontFamily: SCHRIFT.semibold, fontSize: 17 },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: farben.hintergrund },
        }}
      >
        {/* Ohne Anmeldung ist nur der Login erreichbar; danach nur die App. */}
        <Stack.Protected guard={!angemeldet}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={angemeldet}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="projekt/[id]" options={{ title: 'Projekt' }} />
          <Stack.Screen name="lv/[id]" options={{ title: 'Leistungsverzeichnis' }} />
          <Stack.Screen name="adresse/[id]" options={{ title: 'Adresse' }} />
          <Stack.Screen name="rapport/neu" options={{ title: 'Neuer Rapport', presentation: 'modal' }} />
          <Stack.Screen name="rapport/[id]" options={{ title: 'Rapport' }} />
          <Stack.Screen name="mitarbeiter" options={{ title: 'Mitarbeiter' }} />
          <Stack.Screen name="stammdaten" options={{ title: 'Stammdaten' }} />
          <Stack.Screen name="einstellungen" options={{ title: 'Einstellungen' }} />
          <Stack.Screen name="ueber" options={{ title: 'Über die App' }} />
        </Stack.Protected>
      </Stack>
    </AppSperre>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <Navigation />
    </AppProvider>
  );
}
