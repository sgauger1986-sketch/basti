import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { prozent } from '@/domain/format';
import { useDaten } from '@/state/AppProvider';
import { useTheme } from '@/theme/useTheme';
import { ABSTAND, SCHRIFT } from '@/theme/farben';
import { Flaeche } from '@/ui/Bildschirm';
import { Liste } from '@/ui/Liste';
import { Chip, Leer, Zeile } from '@/ui';

type Tab = 'mwst' | 'einheiten' | 'lohnarten';

export default function Stammdaten() {
  const d = useDaten();
  const { farben } = useTheme();
  const [tab, setTab] = useState<Tab>('mwst');

  const tabs: { key: Tab; label: string; anzahl: number }[] = [
    { key: 'mwst', label: 'MwSt', anzahl: d.mwst.length },
    { key: 'einheiten', label: 'Einheiten', anzahl: d.einheiten.length },
    { key: 'lohnarten', label: 'Lohnarten', anzahl: d.lohnarten.length },
  ];

  const kopf = (
    <View style={s.tabs}>
      {tabs.map((t) => {
        const aktiv = t.key === tab;
        return (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[s.tab, { backgroundColor: aktiv ? farben.akzent : farben.flaeche, borderColor: farben.rand }]}
          >
            <Text style={{ color: aktiv ? farben.akzentText : farben.text2, fontFamily: SCHRIFT.semibold, fontSize: 13 }}>
              {t.label} ({t.anzahl})
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (tab === 'mwst') {
    return (
      <Flaeche>
        <Liste
          data={d.mwst}
          keyExtractor={(m) => m.id}
          ListHeaderComponent={kopf}
          ListEmptyComponent={<Leer titel="Keine MwSt-Sätze" />}
          renderItem={({ item: m }) => (
            <Zeile titel={m.bezeichnung} rechtsText={prozent(m.wert, 1)} rechts={m.aktiv ? <Chip>aktiv</Chip> : undefined} />
          )}
        />
      </Flaeche>
    );
  }
  if (tab === 'einheiten') {
    return (
      <Flaeche>
        <Liste
          data={d.einheiten}
          keyExtractor={(e) => e.id}
          ListHeaderComponent={kopf}
          ListEmptyComponent={<Leer titel="Keine Einheiten" />}
          renderItem={({ item: e }) => <Zeile titel={e.kuerzel} untertitel={e.beschreibung} mono />}
        />
      </Flaeche>
    );
  }
  return (
    <Flaeche>
      <Liste
        data={d.lohnarten}
        keyExtractor={(l) => l.id}
        ListHeaderComponent={kopf}
        ListEmptyComponent={<Leer titel="Keine Lohnarten" />}
        renderItem={({ item: l }) => <Zeile titel={l.bezeichnung} untertitel={l.nummer ? `Nr. ${l.nummer}` : undefined} />}
      />
    </Flaeche>
  );
}

const s = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: ABSTAND.s, paddingHorizontal: ABSTAND.l, paddingVertical: ABSTAND.m },
  tab: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
});
