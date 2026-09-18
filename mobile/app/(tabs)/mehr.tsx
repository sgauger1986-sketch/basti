import React from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { brand } from '@/brand';
import { useApp, useDaten } from '@/state/AppProvider';
import { Bildschirm } from '@/ui/Bildschirm';
import { Abschnitt, Karte, Trenner, Zeile } from '@/ui';

export default function Mehr() {
  const router = useRouter();
  const { abmelden, einstellungen, sitzung, rapporte } = useApp();
  const d = useDaten();
  const offene = rapporte.filter((r) => r.sync !== 'synchronisiert').length;

  function abmeldenFragen() {
    Alert.alert(
      einstellungen.modus === 'demo' ? 'Demo beenden?' : 'Abmelden?',
      `Alle Daten, Rapporte und Fotos werden von diesem Gerät gelöscht.${offene > 0 ? `\n\nAchtung: ${offene} Rapport${offene === 1 ? ' ist' : 'e sind'} noch nicht übertragen.` : ''}`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: einstellungen.modus === 'demo' ? 'Beenden' : 'Abmelden',
          style: 'destructive',
          onPress: () => {
            void abmelden();
          },
        },
      ]
    );
  }

  return (
    <Bildschirm>
      <Abschnitt>Stammdaten</Abschnitt>
      <Karte>
        <Zeile
          icon="people-circle-outline"
          titel="Mitarbeiter"
          untertitel={`${d.mitarbeiter.length} Einträge · Löhne und Verrechnungssätze`}
          onPress={() => router.push('/mitarbeiter')}
        />
        <Trenner />
        <Zeile
          icon="list-outline"
          titel="Einheiten, MwSt und Lohnarten"
          untertitel={`${d.einheiten.length} Einheiten · ${d.mwst.length} MwSt-Sätze · ${d.lohnarten.length} Lohnarten`}
          onPress={() => router.push('/stammdaten')}
        />
      </Karte>

      <Abschnitt>App</Abschnitt>
      <Karte>
        <Zeile icon="settings-outline" titel="Einstellungen" untertitel="Darstellung, Standard-Mitarbeiter, Server" onPress={() => router.push('/einstellungen')} />
        <Trenner />
        <Zeile icon="information-circle-outline" titel={`Über ${brand.name}`} onPress={() => router.push('/ueber')} />
      </Karte>

      <Abschnitt>Konto</Abschnitt>
      <Karte>
        <Zeile
          icon="log-out-outline"
          titel={einstellungen.modus === 'demo' ? 'Demo beenden' : 'Abmelden'}
          untertitel={
            einstellungen.modus === 'demo'
              ? 'Löscht die lokalen Daten und kehrt zur Anmeldung zurück'
              : sitzung
                ? `${sitzung.benutzer} · ${sitzung.serverUrl} · löscht alle lokalen Daten`
                : undefined
          }
          onPress={abmeldenFragen}
          ohnePfeil
        />
      </Karte>
    </Bildschirm>
  );
}
