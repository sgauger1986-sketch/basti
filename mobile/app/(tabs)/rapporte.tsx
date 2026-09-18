import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { datum, stunden } from '@/domain/format';
import { passtZurSuche, rapportStunden } from '@/domain/kpi';
import { SYNC_STATUS_LABEL, syncStatusTon } from '@/domain/status';
import { useApp, useDaten } from '@/state/AppProvider';
import { ABSTAND } from '@/theme/farben';
import { Flaeche } from '@/ui/Bildschirm';
import { Liste } from '@/ui/Liste';
import { Abschnitt, Hinweis, Knopf, Leer, Pille, Suchfeld, Zeile } from '@/ui';

type Eintrag =
  | { art: 'mobil'; id: string; titel: string; unter: string; ton: 'angebot' | 'auftrag' | 'rechnung' | 'neutral' | 'fehler'; status: string }
  | { art: 'server'; id: string; titel: string; unter: string; ton: 'auftrag' | 'angebot'; status: string };

export default function Rapporte() {
  const router = useRouter();
  const { rapporte, rapporteSynchronisieren, einstellungen } = useApp();
  const { rapporte: serverRapporte, projekte } = useDaten();
  const [suche, setSuche] = useState('');
  const [sync, setSync] = useState(false);

  const projektName = (id: string) => projekte.find((p) => p.id === id)?.kurzbez ?? 'Unbekanntes Projekt';
  const wartend = rapporte.filter((r) => r.sync === 'wartet' || r.sync === 'fehler').length;

  const eintraege = useMemo<Eintrag[]>(() => {
    const mobil: Eintrag[] = rapporte
      .slice()
      .sort((a, b) => b.geaendertAm.localeCompare(a.geaendertAm))
      .map((r) => ({
        art: 'mobil',
        id: r.id,
        titel: r.name || 'Ohne Bezeichnung',
        unter: `${datum(r.datum)} · ${projektName(r.projektId)} · ${stunden(rapportStunden(r))}`,
        ton: syncStatusTon(r.sync),
        status: SYNC_STATUS_LABEL[r.sync],
      }));
    const server: Eintrag[] = serverRapporte.map((r) => ({
      art: 'server',
      id: r.id,
      titel: r.name,
      unter: `Nr. ${r.nummer} · ${projektName(r.projektId)}`,
      ton: r.geprueft ? 'auftrag' : 'angebot',
      status: r.geprueft ? 'Geprüft' : 'Offen',
    }));
    return [...mobil, ...server].filter((e) => passtZurSuche(suche, e.titel, e.unter));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rapporte, serverRapporte, projekte, suche]);

  async function synchronisieren() {
    setSync(true);
    try {
      await rapporteSynchronisieren();
    } finally {
      setSync(false);
    }
  }

  return (
    <Flaeche>
      <Liste
        data={eintraege}
        keyExtractor={(e) => `${e.art}-${e.id}`}
        ListHeaderComponent={
          <View style={s.kopf}>
            <Suchfeld wert={suche} onChange={setSuche} placeholder="Rapport oder Projekt" />
            <View style={{ paddingHorizontal: ABSTAND.l, gap: ABSTAND.s }}>
              <Knopf titel="Neuer Rapport" icon="add-circle-outline" onPress={() => router.push('/rapport/neu')} />
              {wartend > 0 && einstellungen.modus === 'server' ? (
                <Knopf
                  titel={`${wartend} Rapport${wartend === 1 ? '' : 'e'} jetzt übertragen`}
                  icon="cloud-upload-outline"
                  variante="sekundaer"
                  onPress={synchronisieren}
                  laedt={sync}
                />
              ) : null}
            </View>
            {einstellungen.modus === 'demo' ? (
              <Hinweis>
                Im Demo-Modus bleiben neue Rapporte auf diesem Gerät gespeichert. Mit Server-Verbindung werden sie
                automatisch ins Büro übertragen.
              </Hinweis>
            ) : null}
            <Abschnitt>Rapporte</Abschnitt>
          </View>
        }
        ListEmptyComponent={
          <Leer bild titel="Noch keine Rapporte" text="Erfassen Sie den ersten Tagesbericht direkt auf der Baustelle." />
        }
        renderItem={({ item: e }) => (
          <Zeile
            titel={e.titel}
            untertitel={e.unter}
            icon={e.art === 'mobil' ? 'phone-portrait-outline' : 'document-text-outline'}
            rechts={<Pille ton={e.ton}>{e.status}</Pille>}
            onPress={e.art === 'mobil' ? () => router.push(`/rapport/${e.id}`) : undefined}
          />
        )}
      />
    </Flaeche>
  );
}

const s = StyleSheet.create({
  kopf: { paddingTop: ABSTAND.m, gap: ABSTAND.m },
});
