import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { euro, prozent, zahl } from '@/domain/format';
import { lvBaumBauen, lvBaumFlach, lvPositionenZaehlen, type LvKnoten } from '@/domain/lvTree';
import { LV_STATUS_LABEL, lvStatusTon } from '@/domain/status';
import { useDaten } from '@/state/AppProvider';
import { useTheme } from '@/theme/useTheme';
import { ABSTAND, SCHRIFT } from '@/theme/farben';
import { Flaeche } from '@/ui/Bildschirm';
import { Liste } from '@/ui/Liste';
import { Abschnitt, Chip, Feld, Karte, Leer, Pille, Suchfeld, Titel, Untertitel } from '@/ui';
import { passtZurSuche } from '@/domain/kpi';

export default function LvDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const d = useDaten();
  const { farben } = useTheme();
  const [eingeklappt, setEingeklappt] = useState<Set<string>>(new Set());
  const [suche, setSuche] = useState('');

  const lv = d.lvListen.find((x) => x.id === id);
  const projekt = d.projekte.find((p) => p.id === lv?.projektId);
  const baum = useMemo(() => lvBaumBauen(d.lvPositionen.filter((p) => p.lvId === id)), [d.lvPositionen, id]);
  const anzahl = useMemo(() => lvPositionenZaehlen(baum), [baum]);
  const zeilen = useMemo(() => {
    if (suche.trim()) {
      // Bei Suche: flache Trefferliste über alle Blätter
      const treffer: LvKnoten[] = [];
      const gehe = (k: LvKnoten) => {
        if (!k.istGruppe && passtZurSuche(suche, k.position.oz, k.position.kurztext)) treffer.push({ ...k, tiefe: 0 });
        k.kinder.forEach(gehe);
      };
      baum.forEach(gehe);
      return treffer;
    }
    return lvBaumFlach(baum, eingeklappt);
  }, [baum, eingeklappt, suche]);

  if (!lv) return <Leer titel="Leistungsverzeichnis nicht gefunden" />;

  function umschalten(posId: string) {
    setEingeklappt((alt) => {
      const neu = new Set(alt);
      if (neu.has(posId)) neu.delete(posId);
      else neu.add(posId);
      return neu;
    });
  }

  return (
    <Flaeche>
      <Stack.Screen options={{ title: lv.kurzbez }} />
      <Liste
        data={zeilen}
        keyExtractor={(k) => k.position.id}
        ListHeaderComponent={
          <View>
            <View style={s.kopf}>
              <Titel>{lv.bezeichnung}</Titel>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                <Untertitel>{[lv.nummer ? `LV ${lv.nummer}` : null, projekt?.kurzbez].filter(Boolean).join(' · ')}</Untertitel>
                <Pille ton={lvStatusTon(lv.status)}>{LV_STATUS_LABEL[lv.status]}</Pille>
              </View>
            </View>
            <Karte style={{ marginTop: ABSTAND.l }}>
              <View style={s.felder}>
                <Feld label="Arbeitsbereich" wert={lv.arbeitsbereich ?? '—'} />
                <Feld label="Zahlungskondition" wert={lv.zahlungskondition ?? '—'} />
                <Feld label="MwSt" wert={prozent(lv.mwst)} />
                <Feld label="LV-Summe (netto)" wert={euro(lv.summe)} />
              </View>
            </Karte>
            <Abschnitt rechts={<Text style={{ color: farben.text3, fontFamily: SCHRIFT.regular, fontSize: 12 }}>{anzahl} Positionen</Text>}>Positionen</Abschnitt>
            <View style={{ paddingBottom: ABSTAND.m }}>
              <Suchfeld wert={suche} onChange={setSuche} placeholder="OZ oder Kurztext" />
            </View>
          </View>
        }
        ListEmptyComponent={<Leer icon="list-outline" titel="Keine Positionen" />}
        renderItem={({ item: k }) => {
          const p = k.position;
          const zu = eingeklappt.has(p.id);
          return (
            <Pressable
              onPress={k.istGruppe ? () => umschalten(p.id) : undefined}
              style={({ pressed }) => [
                s.pos,
                { paddingLeft: ABSTAND.l + k.tiefe * 14, backgroundColor: pressed ? farben.flaeche2 : k.istGruppe ? farben.flaeche2 : farben.flaeche },
              ]}
            >
              <View style={s.posKopf}>
                {k.istGruppe ? <Ionicons name={zu ? 'chevron-forward' : 'chevron-down'} size={15} color={farben.text3} /> : null}
                <Text style={[s.oz, { color: farben.text3 }]}>{p.oz ?? ''}</Text>
                {k.istGruppe && p.ke ? <Chip>{p.ke}</Chip> : null}
                <Text style={[s.kurztext, { color: farben.text, fontFamily: k.istGruppe ? SCHRIFT.bold : SCHRIFT.medium }]} numberOfLines={3}>
                  {p.kurztext}
                </Text>
              </View>
              <View style={s.posWerte}>
                {!k.istGruppe && p.menge != null ? (
                  <Text style={[s.wert, { color: farben.text2 }]}>{zahl(p.menge)} × {euro(p.preis)}</Text>
                ) : (
                  <View />
                )}
                <Text style={[s.wert, { color: farben.text, fontFamily: SCHRIFT.bold }]}>{euro(p.gesamtpreis)}</Text>
              </View>
            </Pressable>
          );
        }}
      />
    </Flaeche>
  );
}

const s = StyleSheet.create({
  kopf: { paddingHorizontal: ABSTAND.l, paddingTop: ABSTAND.l },
  felder: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: ABSTAND.s },
  pos: { paddingRight: ABSTAND.l, paddingVertical: 10, gap: 4 },
  posKopf: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  oz: { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }), fontSize: 12, minWidth: 44 },
  kurztext: { flex: 1, fontFamily: SCHRIFT.regular, fontSize: 14 },
  posWerte: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 52 },
  wert: { fontFamily: SCHRIFT.regular, fontSize: 13, fontVariant: ['tabular-nums'] },
});
