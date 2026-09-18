import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { leererRapport } from '@/data/rapportSync';
import { heuteIso } from '@/domain/format';
import { passtZurSuche } from '@/domain/kpi';
import { PROJEKT_STATUS_LABEL, projektStatusTon } from '@/domain/status';
import { useApp, useDaten } from '@/state/AppProvider';
import { ABSTAND } from '@/theme/farben';
import { Flaeche } from '@/ui/Bildschirm';
import { Liste } from '@/ui/Liste';
import { Leer, Pille, Suchfeld, Untertitel, Zeile } from '@/ui';

/**
 * Projekt auswählen → Entwurf anlegen → zum Editor wechseln.
 * Kommt bereits eine projektId mit (z. B. aus der Projektansicht), wird
 * der Entwurf sofort erzeugt.
 */
export default function RapportNeu() {
  const { projektId } = useLocalSearchParams<{ projektId?: string }>();
  const router = useRouter();
  const { projekte } = useDaten();
  const { rapportSpeichern } = useApp();
  const [suche, setSuche] = useState('');

  async function anlegen(pid: string) {
    const r = leererRapport(pid, heuteIso());
    const projekt = projekte.find((p) => p.id === pid);
    r.name = projekt ? `Rapport ${projekt.kurzbez}` : '';
    await rapportSpeichern(r);
    router.replace(`/rapport/${r.id}`);
  }

  useEffect(() => {
    if (projektId) void anlegen(projektId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projektId]);

  const liste = projekte
    .filter((p) => p.status !== 'abgeschlossen' && p.status !== 'muster')
    .filter((p) => passtZurSuche(suche, p.nummer, p.bezeichnung, p.kundenName));

  return (
    <Flaeche>
      <Liste
        data={liste}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={
          <View style={{ paddingTop: ABSTAND.m, paddingBottom: ABSTAND.m, gap: ABSTAND.m }}>
            <Untertitel style={{ paddingHorizontal: ABSTAND.l }}>Für welches Projekt ist der Rapport?</Untertitel>
            <Suchfeld wert={suche} onChange={setSuche} placeholder="Projekt suchen" />
          </View>
        }
        ListEmptyComponent={<Leer titel="Kein aktives Projekt gefunden" />}
        renderItem={({ item: p }) => (
          <Zeile
            titel={p.bezeichnung}
            untertitel={[p.nummer, p.kundenName].filter(Boolean).join(' · ')}
            rechts={<Pille ton={projektStatusTon(p.status)}>{PROJEKT_STATUS_LABEL[p.status]}</Pille>}
            onPress={() => void anlegen(p.id)}
          />
        )}
      />
    </Flaeche>
  );
}
