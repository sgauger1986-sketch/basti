import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { brand } from '@/brand';
import { kennzahlen, rapportStunden } from '@/domain/kpi';
import { datum, euroKompakt, stunden } from '@/domain/format';
import { PROJEKT_STATUS_LABEL, SYNC_STATUS_LABEL, projektStatusTon, syncStatusTon } from '@/domain/status';
import { useApp, useDaten } from '@/state/AppProvider';
import { useTheme } from '@/theme/useTheme';
import { ABSTAND } from '@/theme/farben';
import { Bildschirm } from '@/ui/Bildschirm';
import { Abschnitt, Hinweis, Karte, Kennzahl, Knopf, Leer, Pille, Trenner, Zeile } from '@/ui';

export default function Start() {
  const router = useRouter();
  const { laedt, ladeFehler, datenAktualisieren, rapporte, einstellungen, daten } = useApp();
  const d = useDaten();
  const { farben } = useTheme();
  const k = useMemo(() => kennzahlen(d.projekte), [d.projekte]);
  const aktiveProjekte = useMemo(
    () => d.projekte.filter((p) => p.status === 'bearbeitung' || p.status === 'auftrag').slice(0, 5),
    [d.projekte]
  );
  const offeneRapporte = useMemo(() => rapporte.filter((r) => r.sync !== 'synchronisiert').slice(0, 5), [rapporte]);
  const projektName = (id: string) => d.projekte.find((p) => p.id === id)?.kurzbez ?? 'Unbekanntes Projekt';

  return (
    <Bildschirm aktualisieren={datenAktualisieren} laedt={laedt}>
      <View style={s.kopf}>
        <Text style={[s.gruss, { color: farben.text }]}>{brand.name}</Text>
        <Text style={[s.stand, { color: farben.text3 }]}>
          {einstellungen.modus === 'demo' ? 'Demo-Modus · offline' : `Stand ${daten?.standVom ? datum(daten.standVom) : '—'}`}
        </Text>
      </View>

      {ladeFehler ? <Hinweis ton="fehler">Daten konnten nicht geladen werden: {ladeFehler}</Hinweis> : null}

      <View style={s.kpis}>
        <Kennzahl label="Projekte" wert={String(k.projekte)} meta={`${d.lvListen.length} Leistungsverzeichnisse`} />
        <Kennzahl label="Offen" wert={euroKompakt(k.offen)} meta={`${euroKompakt(k.fakturiert)} fakturiert`} />
      </View>
      <View style={s.kpis}>
        <Kennzahl label="Angebote" wert={euroKompakt(k.angebotsvolumen)} />
        <Kennzahl label="Aufträge" wert={euroKompakt(k.auftragsvolumen)} />
      </View>

      <View style={{ paddingHorizontal: ABSTAND.l, paddingTop: ABSTAND.l }}>
        <Knopf titel="Rapport erfassen" icon="add-circle-outline" onPress={() => router.push('/rapport/neu')} />
      </View>

      <Abschnitt>Laufende Projekte</Abschnitt>
      <Karte>
        {aktiveProjekte.length === 0 ? (
          <Leer titel="Keine laufenden Projekte" />
        ) : (
          aktiveProjekte.map((p, i) => (
            <React.Fragment key={p.id}>
              {i > 0 ? <Trenner /> : null}
              <Zeile
                titel={p.bezeichnung}
                untertitel={[p.nummer, p.kundenName].filter(Boolean).join(' · ')}
                rechts={<Pille ton={projektStatusTon(p.status)}>{PROJEKT_STATUS_LABEL[p.status]}</Pille>}
                onPress={() => router.push(`/projekt/${p.id}`)}
              />
            </React.Fragment>
          ))
        )}
      </Karte>

      <Abschnitt>Meine offenen Rapporte</Abschnitt>
      <Karte>
        {offeneRapporte.length === 0 ? (
          <Leer icon="checkmark-done-outline" titel="Alles übertragen" text="Keine offenen Rapporte." />
        ) : (
          offeneRapporte.map((r, i) => (
            <React.Fragment key={r.id}>
              {i > 0 ? <Trenner /> : null}
              <Zeile
                titel={r.name || 'Ohne Bezeichnung'}
                untertitel={`${datum(r.datum)} · ${projektName(r.projektId)} · ${stunden(rapportStunden(r))}`}
                rechts={<Pille ton={syncStatusTon(r.sync)}>{SYNC_STATUS_LABEL[r.sync]}</Pille>}
                onPress={() => router.push(`/rapport/${r.id}`)}
              />
            </React.Fragment>
          ))
        )}
      </Karte>
    </Bildschirm>
  );
}

const s = StyleSheet.create({
  kopf: { paddingHorizontal: ABSTAND.l, paddingTop: ABSTAND.l, paddingBottom: ABSTAND.m },
  gruss: { fontSize: 26, fontWeight: '800', letterSpacing: -0.4 },
  stand: { fontSize: 12.5, marginTop: 2 },
  kpis: { flexDirection: 'row', gap: ABSTAND.m, paddingHorizontal: ABSTAND.l, paddingTop: ABSTAND.m },
});
