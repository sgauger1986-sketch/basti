import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { brand } from '@/brand';
import { useTheme } from '@/theme/useTheme';
import { ABSTAND, RADIUS, SCHRIFT } from '@/theme/farben';
import { Bildschirm } from '@/ui/Bildschirm';
import { Abschnitt, Karte, Trenner, Zeile } from '@/ui';

export default function Ueber() {
  const { farben } = useTheme();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  return (
    <Bildschirm>
      <View style={s.kopf}>
        <View style={[s.logo, { backgroundColor: farben.akzent }]}>
          <Ionicons name="construct" size={30} color={farben.akzentText} />
        </View>
        <Text style={[s.name, { color: farben.text }]}>{brand.name}</Text>
        <Text style={{ color: farben.text2 }}>{brand.tagline}</Text>
        <Text style={{ color: farben.text3, fontFamily: SCHRIFT.regular, fontSize: 12, marginTop: 4 }}>Version {version}</Text>
      </View>
      <Abschnitt>Kontakt</Abschnitt>
      <Karte>
        <Zeile icon="mail-outline" titel="Support" untertitel={brand.supportEmail} onPress={() => Linking.openURL(`mailto:${brand.supportEmail}`)} />
        <Trenner />
        <Zeile icon="shield-checkmark-outline" titel="Datenschutz" untertitel="Alle Daten werden nur auf diesem Gerät und dem Server Ihres Betriebs gespeichert." />
      </Karte>
    </Bildschirm>
  );
}

const s = StyleSheet.create({
  kopf: { alignItems: 'center', padding: ABSTAND.xl, gap: 6 },
  logo: { width: 64, height: 64, borderRadius: RADIUS.l, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  name: { fontSize: 24, fontFamily: SCHRIFT.extrabold },
});
