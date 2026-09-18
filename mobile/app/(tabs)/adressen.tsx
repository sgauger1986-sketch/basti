import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { passtZurSuche } from '@/domain/kpi';
import { useApp, useDaten } from '@/state/AppProvider';
import { ABSTAND } from '@/theme/farben';
import { Flaeche } from '@/ui/Bildschirm';
import { Liste } from '@/ui/Liste';
import { Chip, Leer, Suchfeld, Zeile } from '@/ui';

export default function Adressen() {
  const router = useRouter();
  const { adressen } = useDaten();
  const { laedt, datenAktualisieren } = useApp();
  const [suche, setSuche] = useState('');

  const liste = useMemo(
    () =>
      adressen
        .filter((a) => passtZurSuche(suche, a.anzeigename, a.firma, a.ort, a.plz, a.telefon, a.email))
        .sort((a, b) => a.anzeigename.localeCompare(b.anzeigename, 'de')),
    [adressen, suche]
  );

  return (
    <Flaeche>
      <Liste
        data={liste}
        keyExtractor={(a) => a.id}
        refreshing={laedt}
        onRefresh={datenAktualisieren}
        ListHeaderComponent={
          <View style={s.kopf}>
            <Suchfeld wert={suche} onChange={setSuche} placeholder="Name, Ort, Telefon" />
          </View>
        }
        ListEmptyComponent={<Leer icon="people-outline" titel="Keine Adressen gefunden" />}
        renderItem={({ item: a }) => (
          <Zeile
            titel={a.anzeigename}
            untertitel={[a.strasse, [a.plz, a.ort].filter(Boolean).join(' ')].filter(Boolean).join(', ') || a.telefon}
            rechts={<Chip>{a.istFirma ? 'Firma' : 'Person'}</Chip>}
            onPress={() => router.push(`/adresse/${a.id}`)}
          />
        )}
      />
    </Flaeche>
  );
}

const s = StyleSheet.create({
  kopf: { paddingTop: ABSTAND.m, paddingBottom: ABSTAND.m },
});
