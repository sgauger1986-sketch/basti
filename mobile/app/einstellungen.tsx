import React from 'react';
import { Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Farbschema } from '@/data/storage';
import { storage } from '@/data/storage';
import { useApp, useDaten } from '@/state/AppProvider';
import { useTheme } from '@/theme/useTheme';
import { Bildschirm } from '@/ui/Bildschirm';
import { Abschnitt, Karte, Trenner, Zeile } from '@/ui';
import { Auswahl } from '@/ui/Auswahl';
import { View } from 'react-native';
import { ABSTAND } from '@/theme/farben';

export default function Einstellungen() {
  const { einstellungen, einstellungenAendern, sitzung, datenAktualisieren, laedt, daten } = useApp();
  const { mitarbeiter } = useDaten();
  const { farben } = useTheme();

  const schemata: { key: Farbschema; label: string }[] = [
    { key: 'system', label: 'Wie System' },
    { key: 'hell', label: 'Hell' },
    { key: 'dunkel', label: 'Dunkel' },
  ];

  const haken = <Ionicons name="checkmark" size={18} color={farben.akzent} />;

  function cacheLeeren() {
    Alert.alert('Zwischenspeicher leeren?', 'Die Stammdaten werden beim nächsten Laden neu geholt. Rapporte bleiben erhalten.', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Leeren', style: 'destructive', onPress: () => void storage.datenLoeschen().then(datenAktualisieren) },
    ]);
  }

  return (
    <Bildschirm>
      <Abschnitt>Darstellung</Abschnitt>
      <Karte>
        {schemata.map((sch, i) => (
          <React.Fragment key={sch.key}>
            {i > 0 ? <Trenner /> : null}
            <Zeile
              titel={sch.label}
              rechts={einstellungen.farbschema === sch.key ? haken : undefined}
              onPress={() => void einstellungenAendern({ farbschema: sch.key })}
              ohnePfeil
            />
          </React.Fragment>
        ))}
      </Karte>

      <Abschnitt>Rapporte</Abschnitt>
      <Karte>
        <View style={{ padding: ABSTAND.l }}>
          <Auswahl
            label="Standard-Mitarbeiter (wird bei neuen Zeiteinträgen vorbelegt)"
            wertId={einstellungen.eigeneMitarbeiterId}
            optionen={mitarbeiter.map((m) => ({ id: m.id, text: m.bezeichnung, untertitel: m.personalnummer }))}
            onWahl={(id) => void einstellungenAendern({ eigeneMitarbeiterId: id })}
            keinerErlaubt
            leerText="Nicht gesetzt"
          />
        </View>
      </Karte>

      <Abschnitt>Verbindung</Abschnitt>
      <Karte>
        <Zeile
          icon={einstellungen.modus === 'demo' ? 'flask-outline' : 'cloud-outline'}
          titel={einstellungen.modus === 'demo' ? 'Demo-Modus' : 'Server'}
          untertitel={einstellungen.modus === 'demo' ? 'Eingebettete Demo-Daten, offline' : sitzung?.serverUrl ?? einstellungen.serverUrl}
        />
        {sitzung ? (
          <>
            <Trenner />
            <Zeile icon="business-outline" titel="Mandant" untertitel={sitzung.mandant} />
            <Trenner />
            <Zeile icon="person-circle-outline" titel="Benutzer" untertitel={sitzung.benutzer} />
          </>
        ) : null}
        <Trenner />
        <Zeile
          icon="refresh-outline"
          titel="Daten jetzt aktualisieren"
          untertitel={daten?.standVom ? `Stand: ${new Date(daten.standVom).toLocaleString('de-DE')}` : 'Noch keine Daten geladen'}
          onPress={laedt ? undefined : () => void datenAktualisieren()}
          ohnePfeil
        />
        <Trenner />
        <Zeile icon="trash-outline" titel="Zwischenspeicher leeren" onPress={cacheLeeren} ohnePfeil />
      </Karte>
    </Bildschirm>
  );
}
