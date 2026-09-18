import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { brand } from '@/brand';
import { useApp } from '@/state/AppProvider';
import { useTheme } from '@/theme/useTheme';
import { ABSTAND, RADIUS, SCHATTEN, SCHRIFT } from '@/theme/farben';
import { Eingabe, Hinweis, Knopf } from '@/ui';

const DUNKEL = '#0f1a12';

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
    <View style={{ flex: 1, backgroundColor: DUNKEL }}>
      <Image source={require('../assets/hero.jpg')} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
      <LinearGradient
        colors={['rgba(15,26,18,0.05)', 'rgba(15,26,18,0.55)', DUNKEL]}
        locations={[0, 0.5, 0.92]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={s.inhalt} keyboardShouldPersistTaps="handled" bounces={false}>
            <View style={s.kopf}>
              <View style={[s.logoRahmen, SCHATTEN.hervorgehoben]}>
                <Image source={require('../assets/icon.png')} style={s.logo} contentFit="cover" />
              </View>
              <Text style={s.name}>{brand.name}</Text>
              <Text style={s.claim}>{brand.tagline}</Text>
            </View>

            <View style={[s.karte, { backgroundColor: farben.flaeche }, SCHATTEN.hervorgehoben]}>
              {serverFormular ? (
                <View style={s.formular}>
                  <Text style={[s.kartenTitel, { color: farben.text }]}>Mit Server verbinden</Text>
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
                  <Text style={[s.kartenTitel, { color: farben.text }]}>Willkommen</Text>
                  <Text style={[s.kartenText, { color: farben.text2 }]}>
                    Projekte, Leistungsverzeichnisse und Rapporte – auf der Baustelle wie im Büro. Verschlüsselt auf
                    diesem Gerät.
                  </Text>
                  <Knopf titel="Mit Server verbinden" icon="cloud-outline" onPress={() => setServerFormular(true)} />
                  <Knopf titel="Demo-Daten ansehen" icon="play-outline" variante="sekundaer" onPress={demo} laedt={laedt} />
                  <Text style={[s.fuss, { color: farben.text3 }]}>
                    Der Demo-Modus läuft komplett offline mit den Daten der Demo-Datenbank.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  inhalt: { flexGrow: 1, justifyContent: 'flex-end', padding: ABSTAND.l, paddingBottom: ABSTAND.xl, gap: ABSTAND.xl },
  kopf: { alignItems: 'center', gap: 6, paddingBottom: ABSTAND.s },
  logoRahmen: { width: 84, height: 84, borderRadius: 22, overflow: 'hidden', marginBottom: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)' },
  logo: { width: '100%', height: '100%' },
  name: { fontFamily: SCHRIFT.extrabold, fontSize: 36, color: '#ffffff', letterSpacing: -0.8 },
  claim: { fontFamily: SCHRIFT.medium, fontSize: 15, color: 'rgba(255,255,255,0.82)' },
  karte: { borderRadius: 22, padding: ABSTAND.xl, overflow: 'hidden' },
  formular: { gap: ABSTAND.m },
  kartenTitel: { fontFamily: SCHRIFT.bold, fontSize: 20, letterSpacing: -0.3 },
  kartenText: { fontFamily: SCHRIFT.regular, fontSize: 14, lineHeight: 20, marginBottom: 4 },
  fuss: { fontFamily: SCHRIFT.regular, fontSize: 12, textAlign: 'center', lineHeight: 17, marginTop: 4 },
});
