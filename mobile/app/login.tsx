import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { brand } from '@/brand';
import { useApp } from '@/state/AppProvider';
import { useTheme } from '@/theme/useTheme';
import { ABSTAND, RADIUS } from '@/theme/farben';
import { Eingabe, Hinweis, Knopf } from '@/ui';

export default function Login() {
  const { demoStarten, serverAnmelden, einstellungen } = useApp();
  const { farben } = useTheme();
  const [serverUrl, setServerUrl] = useState(einstellungen.serverUrl || brand.defaultServerUrl);
  const [benutzer, setBenutzer] = useState('');
  const [passwort, setPasswort] = useState('');
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [serverFormular, setServerFormular] = useState(false);

  async function demo() {
    setLaedt(true);
    try {
      await demoStarten();
    } finally {
      setLaedt(false);
    }
  }

  async function anmelden() {
    setFehler(null);
    if (!serverUrl.trim() || !benutzer.trim() || !passwort) {
      setFehler('Bitte Server, Benutzername und Passwort ausfüllen.');
      return;
    }
    setLaedt(true);
    try {
      await serverAnmelden({ serverUrl, benutzer: benutzer.trim(), passwort });
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Anmeldung fehlgeschlagen.');
    } finally {
      setLaedt(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: farben.hintergrund }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.inhalt} keyboardShouldPersistTaps="handled">
          <View style={s.kopf}>
            <View style={[s.logo, { backgroundColor: farben.akzent }]}>
              <Ionicons name="construct" size={34} color={farben.akzentText} />
            </View>
            <Text style={[s.name, { color: farben.text }]}>{brand.name}</Text>
            <Text style={[s.claim, { color: farben.text2 }]}>{brand.tagline}</Text>
          </View>

          {serverFormular ? (
            <View style={s.formular}>
              <Eingabe
                label="Server"
                value={serverUrl}
                onChangeText={setServerUrl}
                placeholder="https://cloud.beispiel.de"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                textContentType="URL"
              />
              <Eingabe
                label="Benutzername"
                value={benutzer}
                onChangeText={setBenutzer}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="username"
              />
              <Eingabe
                label="Passwort"
                value={passwort}
                onChangeText={setPasswort}
                secureTextEntry
                textContentType="password"
                onSubmitEditing={anmelden}
              />
              {fehler ? <Hinweis ton="fehler">{fehler}</Hinweis> : null}
              <Knopf titel="Anmelden" icon="log-in-outline" onPress={anmelden} laedt={laedt} />
              <Knopf titel="Zurück" variante="sekundaer" onPress={() => setServerFormular(false)} />
            </View>
          ) : (
            <View style={s.formular}>
              <Knopf
                titel="Demo-Daten ansehen"
                icon="play-outline"
                onPress={demo}
                laedt={laedt}
              />
              <Knopf
                titel="Mit Server verbinden"
                icon="cloud-outline"
                variante="sekundaer"
                onPress={() => setServerFormular(true)}
              />
              <Text style={[s.fuss, { color: farben.text3 }]}>
                Der Demo-Modus funktioniert komplett offline und zeigt die Daten der Demo-Datenbank.
                Für Live-Daten mit dem Cloud-Server Ihres Betriebs verbinden.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  inhalt: { flexGrow: 1, justifyContent: 'center', padding: ABSTAND.xl, gap: ABSTAND.xl },
  kopf: { alignItems: 'center', gap: 8 },
  logo: { width: 72, height: 72, borderRadius: RADIUS.l, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5, marginTop: 8 },
  claim: { fontSize: 15 },
  formular: { gap: ABSTAND.m },
  fuss: { fontSize: 12.5, textAlign: 'center', lineHeight: 18, marginTop: ABSTAND.s },
});
