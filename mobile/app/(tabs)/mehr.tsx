import React from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { brand } from '@/brand';
import { useApp, useDaten } from '@/state/AppProvider';
import { Bildschirm } from '@/ui/Bildschirm';
import { Abschnitt, Karte, Trenner, Zeile } from '@/ui';

export default function Mehr() {
  const router = useRouter();
  const { abmelden, einstellungen, sitzung } = useApp();
  const d = useDaten();

  function abmeldenFragen() {
    Alert.alert(
      einstellungen.modus === 'demo' ? 'Demo beenden?' : 'Abmelden?',
      'Lokal gespeicherte Rapporte bleiben auf dem Gerät erhalten.',
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
              ? 'Zurück zur Anmeldung'
              : sitzung
                ? `${sitzung.benutzer} · ${sitzung.serverUrl}`
                : undefined
          }
          onPress={abmeldenFragen}
          ohnePfeil
        />
      </Karte>
    </Bildschirm>
  );
}
