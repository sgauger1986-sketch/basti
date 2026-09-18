import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { ProjektStatus } from '@/domain/types';
import { euro } from '@/domain/format';
import { passtZurSuche } from '@/domain/kpi';
import { PROJEKT_STATUS_LABEL, projektStatusTon } from '@/domain/status';
import { useApp, useDaten } from '@/state/AppProvider';
import { useTheme } from '@/theme/useTheme';
import { ABSTAND } from '@/theme/farben';
import { Flaeche } from '@/ui/Bildschirm';
import { Liste } from '@/ui/Liste';
import { Leer, Pille, Suchfeld, Zeile } from '@/ui';

const FILTER: { key: ProjektStatus | 'alle'; label: string }[] = [
  { key: 'alle', label: 'Alle' },
  { key: 'bearbeitung', label: 'In Bearbeitung' },
  { key: 'angebot', label: 'Angebot' },
  { key: 'auftrag', label: 'Auftrag' },
  { key: 'abgeschlossen', label: 'Abgeschlossen' },
];

export default function Projekte() {
  const router = useRouter();
  const { projekte } = useDaten();
  const { laedt, datenAktualisieren } = useApp();
  const { farben } = useTheme();
  const [suche, setSuche] = useState('');
  const [filter, setFilter] = useState<ProjektStatus | 'alle'>('alle');

  const liste = useMemo(
    () =>
      projekte.filter(
        (p) =>
          (filter === 'alle' || p.status === filter) &&
          passtZurSuche(suche, p.nummer, p.bezeichnung, p.kurzbez, p.kundenName)
      ),
    [projekte, suche, filter]
  );

  return (
    <Flaeche>
      <Liste
        data={liste}
        keyExtractor={(p) => p.id}
        refreshing={laedt}
        onRefresh={datenAktualisieren}
        ListHeaderComponent={
          <View style={s.kopf}>
            <Suchfeld wert={suche} onChange={setSuche} placeholder="Projekt, Nummer oder Kunde" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filter}>
              {FILTER.map((f) => {
                const aktiv = f.key === filter;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => setFilter(f.key)}
                    style={[
                      s.filterKnopf,
                      { backgroundColor: aktiv ? farben.akzent : farben.flaeche, borderColor: farben.rand },
                    ]}
                  >
                    <Text style={{ color: aktiv ? farben.akzentText : farben.text2, fontSize: 13, fontWeight: '600' }}>
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={<Leer titel="Keine Projekte gefunden" text="Suche oder Filter anpassen." />}
        renderItem={({ item: p }) => (
          <Zeile
            titel={p.bezeichnung}
            untertitel={[p.nummer, p.kundenName].filter(Boolean).join(' · ')}
            rechts={
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Pille ton={projektStatusTon(p.status)}>{PROJEKT_STATUS_LABEL[p.status]}</Pille>
                {p.summeAuftrag != null ? (
                  <Text style={{ color: farben.text2, fontSize: 12, fontVariant: ['tabular-nums'] }}>
                    {euro(p.summeAuftrag)}
                  </Text>
                ) : null}
              </View>
            }
            onPress={() => router.push(`/projekt/${p.id}`)}
          />
        )}
      />
    </Flaeche>
  );
}

const s = StyleSheet.create({
  kopf: { paddingTop: ABSTAND.m, paddingBottom: ABSTAND.m, gap: ABSTAND.m },
  filter: { paddingHorizontal: ABSTAND.l, gap: ABSTAND.s },
  filterKnopf: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
});
