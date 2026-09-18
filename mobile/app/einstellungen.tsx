import React from 'react';
import { Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
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
  const { einstellungen, einstellungenAendern, sitzung, datenAktualisieren, laedt, daten, abmelden, rapporte } = useApp();
  const router = useRouter();
  const offeneRapporte = rapporte.filter((r) => r.sync !== 'synchronisiert').length;

  const sperrzeiten: { wert: number; label: string }[] = [
    { wert: 0, label: 'Sofort' },
    { wert: 60, label: 'Nach 1 Minute' },
    { wert: 300, label: 'Nach 5 Minuten' },
    { wert: 900, label: 'Nach 15 Minuten' },
  ];

  function geraetBereinigen() {
    Alert.alert(
      'Alle Daten auf diesem Gerät löschen?',
      `Datenbestand, Rapporte, Fotos, Anmeldung und der Geräteschlüssel werden unwiderruflich gelöscht.${offeneRapporte > 0 ? `\n\nAchtung: ${offeneRapporte} Rapport${offeneRapporte === 1 ? ' ist' : 'e sind'} noch nicht übertragen.` : ''}`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Alles löschen', style: 'destructive', onPress: () => void abmelden().then(() => router.replace('/login')) },
      ]
    );
  }
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

      <Abschnitt>Sicherheit</Abschnitt>
      <Karte>
        <Zeile
          icon="finger-print-outline"
          titel="App-Sperre"
          untertitel="Face ID, Fingerabdruck oder Gerätecode beim Öffnen"
          rechts={
            <Switch
              value={einstellungen.appSperre}
              onValueChange={(v) => void einstellungenAendern({ appSperre: v })}
              trackColor={{ true: farben.akzent }}
            />
          }
        />
        {einstellungen.appSperre
          ? sperrzeiten.map((z) => (
              <React.Fragment key={z.wert}>
                <Trenner />
                <Zeile
                  titel={z.label}
                  untertitel={z.wert === 0 ? 'Bei jedem Wechsel in den Hintergrund sperren' : undefined}
                  rechts={einstellungen.sperrNachSekunden === z.wert ? haken : undefined}
                  onPress={() => void einstellungenAendern({ sperrNachSekunden: z.wert })}
                  ohnePfeil
                />
              </React.Fragment>
            ))
          : null}
        <Trenner />
        <Zeile
          icon="eye-off-outline"
          titel="Screenshots blockieren"
          untertitel="Verhindert Screenshots, Bildschirmaufnahmen und Vorschau im App-Switcher"
          rechts={
            <Switch
              value={einstellungen.screenshotSchutz}
              onValueChange={(v) => void einstellungenAendern({ screenshotSchutz: v })}
              trackColor={{ true: farben.akzent }}
            />
          }
        />
        <Trenner />
        <Zeile
          icon="lock-closed-outline"
          titel="Verschlüsselung"
          untertitel="Alle Daten und Fotos liegen AES-256-verschlüsselt auf dem Gerät. Der Schlüssel ist im Schlüsselbund des Systems gesichert."
        />
        <Trenner />
        <Zeile icon="nuclear-outline" titel="Alle Daten auf diesem Gerät löschen" onPress={geraetBereinigen} ohnePfeil />
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
