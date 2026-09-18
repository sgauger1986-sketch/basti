import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { euro } from '@/domain/format';
import { passtZurSuche } from '@/domain/kpi';
import { useDaten } from '@/state/AppProvider';
import { useTheme } from '@/theme/useTheme';
import { ABSTAND, SCHRIFT } from '@/theme/farben';
import { Flaeche } from '@/ui/Bildschirm';
import { Liste } from '@/ui/Liste';
import { Leer, Suchfeld, Zeile } from '@/ui';

export default function MitarbeiterListe() {
  const { mitarbeiter } = useDaten();
  const { farben } = useTheme();
  const [suche, setSuche] = useState('');
  const liste = useMemo(
    () => mitarbeiter.filter((m) => passtZurSuche(suche, m.bezeichnung, m.personalnummer, m.matchcode)),
    [mitarbeiter, suche]
  );
  return (
    <Flaeche>
      <Liste
        data={liste}
        keyExtractor={(m) => m.id}
        ListHeaderComponent={
          <View style={s.kopf}>
            <Suchfeld wert={suche} onChange={setSuche} placeholder="Name, Personalnummer, Matchcode" />
          </View>
        }
        ListEmptyComponent={<Leer icon="people-circle-outline" titel="Keine Mitarbeiter" />}
        renderItem={({ item: m }) => (
          <Zeile
            titel={m.bezeichnung}
            untertitel={[m.personalnummer, m.matchcode].filter(Boolean).join(' · ')}
            rechts={
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: farben.text, fontSize: 13, fontFamily: SCHRIFT.semibold, fontVariant: ['tabular-nums'] }}>{euro(m.stundenlohn)}</Text>
                <Text style={{ color: farben.text3, fontFamily: SCHRIFT.regular, fontSize: 11 }}>Lohn / h</Text>
                {m.stundensatzTaglohn != null ? (
                  <Text style={{ color: farben.text2, fontFamily: SCHRIFT.regular, fontSize: 11, marginTop: 2 }}>Verrechnung {euro(m.stundensatzTaglohn)}</Text>
                ) : null}
              </View>
            }
          />
        )}
      />
    </Flaeche>
  );
}

const s = StyleSheet.create({ kopf: { paddingVertical: ABSTAND.m } });
