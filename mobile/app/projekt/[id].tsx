import React, { useMemo } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { euro, prozent, datum, stunden } from '@/domain/format';
import { projektFortschritt, rapportStunden } from '@/domain/kpi';
import { LV_STATUS_LABEL, PROJEKT_STATUS_LABEL, SYNC_STATUS_LABEL, lvStatusTon, projektStatusTon, syncStatusTon } from '@/domain/status';
import { useApp, useDaten } from '@/state/AppProvider';
import { useTheme } from '@/theme/useTheme';
import { ABSTAND } from '@/theme/farben';
import { Bildschirm } from '@/ui/Bildschirm';
import { Abschnitt, AktionsKnopf, Feld, Karte, Knopf, Leer, Pille, Titel, Trenner, Untertitel, Zeile } from '@/ui';

export default function ProjektDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const d = useDaten();
  const { rapporte } = useApp();
  const { farben } = useTheme();

  const p = d.projekte.find((x) => x.id === id);
  const lvs = useMemo(() => d.lvListen.filter((l) => l.projektId === id), [d.lvListen, id]);
  const kunde = useMemo(() => d.adressen.find((a) => a.id === p?.auftraggeberId), [d.adressen, p]);
  const eigene = useMemo(() => rapporte.filter((r) => r.projektId === id), [rapporte, id]);
  const server = useMemo(() => d.rapporte.filter((r) => r.projektId === id), [d.rapporte, id]);

  if (!p) return <Leer titel="Projekt nicht gefunden" />;
  const fortschritt = projektFortschritt(p);

  return (
    <Bildschirm>
      <Stack.Screen options={{ title: p.kurzbez }} />
      <View style={s.kopf}>
        <Titel>{p.bezeichnung}</Titel>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <Untertitel>Projekt {p.nummer}</Untertitel>
          <Pille ton={projektStatusTon(p.status)}>{PROJEKT_STATUS_LABEL[p.status]}</Pille>
        </View>
      </View>

      {kunde ? (
        <View style={s.aktionen}>
          {kunde.telefon ? <AktionsKnopf icon="call-outline" titel="Anrufen" onPress={() => Linking.openURL(`tel:${kunde.telefon}`)} /> : null}
          {kunde.email ? <AktionsKnopf icon="mail-outline" titel="E-Mail" onPress={() => Linking.openURL(`mailto:${kunde.email}`)} /> : null}
          {kunde.ort ? (
            <AktionsKnopf
              icon="navigate-outline"
              titel="Navigation"
              onPress={() => Linking.openURL(`https://maps.apple.com/?q=${encodeURIComponent([kunde.strasse, kunde.plz, kunde.ort].filter(Boolean).join(', '))}`)}
            />
          ) : null}
          <AktionsKnopf icon="person-outline" titel="Kunde" onPress={() => router.push(`/adresse/${kunde.id}`)} />
        </View>
      ) : null}

      <Abschnitt>Eckdaten</Abschnitt>
      <Karte>
        <View style={s.felder}>
          <Feld label="Auftraggeber" wert={p.kundenName ?? kunde?.anzeigename ?? '—'} />
          <Feld label="Priorität" wert={p.prioritaet ?? '—'} />
          <Feld label="Angebotssumme" wert={euro(p.summeAngebot)} />
          <Feld label="Auftragssumme" wert={euro(p.summeAuftrag)} />
          <Feld label="Fakturiert" wert={euro(p.summeRechnung)} />
          <Feld label="Offen" wert={euro((p.summeAuftrag ?? 0) - (p.summeRechnung ?? 0))} />
        </View>
        {fortschritt != null ? (
          <View style={{ paddingHorizontal: ABSTAND.l, paddingBottom: ABSTAND.l, gap: 6 }}>
            <View style={[s.balken, { backgroundColor: farben.flaeche2 }]}>
              <View style={[s.balkenFuellung, { backgroundColor: farben.akzent, width: `${Math.round(fortschritt * 100)}%` }]} />
            </View>
            <Text style={{ color: farben.text2, fontSize: 12 }}>{prozent(fortschritt * 100)} der Auftragssumme fakturiert</Text>
          </View>
        ) : null}
      </Karte>

      <View style={{ paddingHorizontal: ABSTAND.l, paddingTop: ABSTAND.l }}>
        <Knopf titel="Rapport für dieses Projekt" icon="add-circle-outline" onPress={() => router.push({ pathname: '/rapport/neu', params: { projektId: p.id } })} />
      </View>

      <Abschnitt>Leistungsverzeichnisse</Abschnitt>
      <Karte>
        {lvs.length === 0 ? (
          <Leer icon="list-outline" titel="Keine Leistungsverzeichnisse" />
        ) : (
          lvs.map((l, i) => (
            <React.Fragment key={l.id}>
              {i > 0 ? <Trenner /> : null}
              <Zeile
                titel={l.bezeichnung}
                untertitel={[l.nummer, l.arbeitsbereich].filter(Boolean).join(' · ')}
                rechts={
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Pille ton={lvStatusTon(l.status)}>{LV_STATUS_LABEL[l.status]}</Pille>
                    <Text style={{ color: farben.text2, fontSize: 12, fontVariant: ['tabular-nums'] }}>{euro(l.summe)}</Text>
                  </View>
                }
                onPress={() => router.push(`/lv/${l.id}`)}
              />
            </React.Fragment>
          ))
        )}
      </Karte>

      <Abschnitt>Rapporte</Abschnitt>
      <Karte>
        {eigene.length === 0 && server.length === 0 ? (
          <Leer icon="create-outline" titel="Noch keine Rapporte" />
        ) : (
          <>
            {eigene.map((r, i) => (
              <React.Fragment key={r.id}>
                {i > 0 ? <Trenner /> : null}
                <Zeile
                  icon="phone-portrait-outline"
                  titel={r.name || 'Ohne Bezeichnung'}
                  untertitel={`${datum(r.datum)} · ${stunden(rapportStunden(r))}`}
                  rechts={<Pille ton={syncStatusTon(r.sync)}>{SYNC_STATUS_LABEL[r.sync]}</Pille>}
                  onPress={() => router.push(`/rapport/${r.id}`)}
                />
              </React.Fragment>
            ))}
            {server.map((r, i) => (
              <React.Fragment key={r.id}>
                {i > 0 || eigene.length > 0 ? <Trenner /> : null}
                <Zeile
                  icon="document-text-outline"
                  titel={r.name}
                  untertitel={`Nr. ${r.nummer}`}
                  rechts={<Pille ton={r.geprueft ? 'auftrag' : 'angebot'}>{r.geprueft ? 'Geprüft' : 'Offen'}</Pille>}
                />
              </React.Fragment>
            ))}
          </>
        )}
      </Karte>
    </Bildschirm>
  );
}

const s = StyleSheet.create({
  kopf: { paddingHorizontal: ABSTAND.l, paddingTop: ABSTAND.l },
  aktionen: { flexDirection: 'row', gap: ABSTAND.s, paddingHorizontal: ABSTAND.l, paddingTop: ABSTAND.l },
  felder: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: ABSTAND.s },
  balken: { height: 6, borderRadius: 3, overflow: 'hidden' },
  balkenFuellung: { height: 6, borderRadius: 3 },
});
