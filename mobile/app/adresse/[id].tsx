import React from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { PROJEKT_STATUS_LABEL, projektStatusTon } from '@/domain/status';
import { useDaten } from '@/state/AppProvider';
import { ABSTAND } from '@/theme/farben';
import { Bildschirm } from '@/ui/Bildschirm';
import { Abschnitt, AktionsKnopf, Chip, Feld, Karte, Leer, Pille, Titel, Trenner, Untertitel, Zeile } from '@/ui';

export default function AdresseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const d = useDaten();
  const a = d.adressen.find((x) => x.id === id);
  if (!a) return <Leer titel="Adresse nicht gefunden" />;

  const anschrift = [a.strasse, [a.plz, a.ort].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const projekte = d.projekte.filter((p) => p.auftraggeberId === a.id);
  const kartenUrl =
    Platform.OS === 'ios'
      ? `https://maps.apple.com/?q=${encodeURIComponent(anschrift)}`
      : `geo:0,0?q=${encodeURIComponent(anschrift)}`;

  return (
    <Bildschirm>
      <Stack.Screen options={{ title: a.anzeigename }} />
      <View style={s.kopf}>
        <Titel>{a.anzeigename}</Titel>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <Chip>{a.istFirma ? 'Firma' : 'Person'}</Chip>
          {a.firma && a.firma !== a.anzeigename ? <Untertitel>{a.firma}</Untertitel> : null}
        </View>
      </View>

      <View style={s.aktionen}>
        {a.telefon ? <AktionsKnopf icon="call-outline" titel="Anrufen" onPress={() => Linking.openURL(`tel:${a.telefon}`)} /> : null}
        {a.email ? <AktionsKnopf icon="mail-outline" titel="E-Mail" onPress={() => Linking.openURL(`mailto:${a.email}`)} /> : null}
        {anschrift ? <AktionsKnopf icon="navigate-outline" titel="Navigation" onPress={() => Linking.openURL(kartenUrl)} /> : null}
        {a.internet ? (
          <AktionsKnopf
            icon="globe-outline"
            titel="Website"
            onPress={() => Linking.openURL(/^https?:/i.test(a.internet!) ? a.internet! : `https://${a.internet}`)}
          />
        ) : null}
      </View>

      <Abschnitt>Kontakt</Abschnitt>
      <Karte>
        <View style={s.felder}>
          <Feld label="Anschrift" wert={anschrift || '—'} />
          <Feld label="Briefanrede" wert={a.briefanrede ?? '—'} />
          <Feld label="Telefon" wert={a.telefon ?? '—'} />
          <Feld label="Fax" wert={a.fax ?? '—'} />
          <Feld label="E-Mail" wert={a.email ?? '—'} />
          <Feld label="Internet" wert={a.internet ?? '—'} />
          <Feld label="Steuernummer" wert={a.steuernummer ?? '—'} mono />
          <Feld label="Nummer" wert={a.id} mono />
        </View>
      </Karte>

      {projekte.length > 0 ? (
        <>
          <Abschnitt>Projekte</Abschnitt>
          <Karte>
            {projekte.map((p, i) => (
              <React.Fragment key={p.id}>
                {i > 0 ? <Trenner /> : null}
                <Zeile
                  titel={p.bezeichnung}
                  untertitel={p.nummer}
                  rechts={<Pille ton={projektStatusTon(p.status)}>{PROJEKT_STATUS_LABEL[p.status]}</Pille>}
                  onPress={() => router.push(`/projekt/${p.id}`)}
                />
              </React.Fragment>
            ))}
          </Karte>
        </>
      ) : null}
    </Bildschirm>
  );
}

const s = StyleSheet.create({
  kopf: { paddingHorizontal: ABSTAND.l, paddingTop: ABSTAND.l },
  aktionen: { flexDirection: 'row', gap: ABSTAND.s, paddingHorizontal: ABSTAND.l, paddingTop: ABSTAND.l },
  felder: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: ABSTAND.s },
});
