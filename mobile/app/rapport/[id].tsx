import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import type { MobilerRapport, RapportMaterial, RapportZeit } from '@/domain/types';
import { datum, datumParsen, dezimalParsen, stunden, zahl } from '@/domain/format';
import { rapportStunden } from '@/domain/kpi';
import { SYNC_STATUS_LABEL, syncStatusTon } from '@/domain/status';
import { neueId, rapportPruefen } from '@/data/rapportSync';
import { useApp, useDaten } from '@/state/AppProvider';
import { fotoAblegen, fotoAnzeigen, fotoLoeschen } from '@/security/fotoTresor';
import { useTheme } from '@/theme/useTheme';
import { ABSTAND, RADIUS } from '@/theme/farben';
import { Bildschirm } from '@/ui/Bildschirm';
import { Abschnitt, Chip, Eingabe, Hinweis, Karte, Knopf, Pille, Trenner, Untertitel, Zeile } from '@/ui';
import { Auswahl } from '@/ui/Auswahl';

export default function RapportEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { rapporte, rapportSpeichern, rapportLoeschen, rapportEinreichen, einstellungen } = useApp();
  const d = useDaten();
  const { farben } = useTheme();

  const gespeichert = rapporte.find((r) => r.id === id);
  const [r, setR] = useState<MobilerRapport | null>(gespeichert ?? null);
  const rRef = useRef<MobilerRapport | null>(r);
  rRef.current = r;
  const [fehler, setFehler] = useState<string[]>([]);
  const [sendet, setSendet] = useState(false);
  const [ortLaedt, setOrtLaedt] = useState(false);
  const [datumFehler, setDatumFehler] = useState<string | null>(null);
  const [fotoLaedt, setFotoLaedt] = useState(false);
  const speicherTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!r && gespeichert) setR(gespeichert);
  }, [gespeichert, r]);

  const projekt = useMemo(() => d.projekte.find((p) => p.id === r?.projektId), [d.projekte, r]);
  const gesperrt = r?.sync === 'synchronisiert';
  const einheitOptionen = useMemo(() => {
    const gesehen = new Set<string>();
    return d.einheiten
      .filter((e) => (gesehen.has(e.kuerzel) ? false : (gesehen.add(e.kuerzel), true)))
      .map((e) => ({ id: e.kuerzel, text: e.kuerzel, untertitel: e.beschreibung }));
  }, [d.einheiten]);

  // Sync-Status aus dem gespeicherten Stand übernehmen (z. B. nach fehlgeschlagener Übertragung)
  useEffect(() => {
    if (!gespeichert) return;
    setR((alt) =>
      alt && (alt.sync !== gespeichert.sync || alt.syncFehler !== gespeichert.syncFehler || alt.serverId !== gespeichert.serverId)
        ? { ...alt, sync: gespeichert.sync, syncFehler: gespeichert.syncFehler, serverId: gespeichert.serverId }
        : alt
    );
  }, [gespeichert]);

  // Automatisch speichern (entprellt), damit auf der Baustelle nichts verloren geht
  const aendern = useCallback(
    (patch: Partial<MobilerRapport>) => {
      setR((alt) => {
        if (!alt) return alt;
        const neu = { ...alt, ...patch, geaendertAm: new Date().toISOString() };
        if (speicherTimer.current) clearTimeout(speicherTimer.current);
        speicherTimer.current = setTimeout(() => void rapportSpeichern(neu), 400);
        return neu;
      });
    },
    [rapportSpeichern]
  );

  useEffect(
    () => () => {
      if (speicherTimer.current) clearTimeout(speicherTimer.current);
    },
    []
  );

  if (!r) {
    return (
      <View style={{ padding: ABSTAND.xl }}>
        <Untertitel>Rapport nicht gefunden.</Untertitel>
      </View>
    );
  }

  /* ---- Zeiten ---- */
  function zeitHinzufuegen() {
    const standard = einstellungen.eigeneMitarbeiterId ?? d.mitarbeiter[0]?.id ?? '';
    aendern({ zeiten: [...r!.zeiten, { key: neueId(), mitarbeiterId: standard, stunden: 8, lohnartId: null }] });
  }
  function zeitAendern(i: number, patch: Partial<RapportZeit>) {
    aendern({ zeiten: r!.zeiten.map((z, j) => (j === i ? { ...z, ...patch } : z)) });
  }
  function zeitEntfernen(i: number) {
    aendern({ zeiten: r!.zeiten.filter((_, j) => j !== i) });
  }

  /* ---- Material ---- */
  function materialHinzufuegen() {
    aendern({ material: [...r!.material, { key: neueId(), bezeichnung: '', menge: 1, einheit: d.einheiten[0]?.kuerzel ?? 'Stk' }] });
  }
  function materialAendern(i: number, patch: Partial<RapportMaterial>) {
    aendern({ material: r!.material.map((m, j) => (j === i ? { ...m, ...patch } : m)) });
  }
  function materialEntfernen(i: number) {
    aendern({ material: r!.material.filter((_, j) => j !== i) });
  }

  /* ---- Fotos ---- */
  async function fotoAufnehmen(quelle: 'kamera' | 'galerie') {
    const erlaubnis =
      quelle === 'kamera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!erlaubnis.granted) {
      Alert.alert('Keine Berechtigung', 'Bitte den Zugriff in den Systemeinstellungen erlauben.');
      return;
    }
    // exif: false → keine Kamera-/GPS-Metadaten im Bild
    const ergebnis =
      quelle === 'kamera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.5, allowsEditing: false, exif: false })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.5, allowsMultipleSelection: true, mediaTypes: ['images'], exif: false });
    if (ergebnis.canceled) return;
    setFotoLaedt(true);
    try {
      const ids: string[] = [];
      for (const a of ergebnis.assets) ids.push(await fotoAblegen(a.uri));
      aendern({ fotos: [...r!.fotos, ...ids] });
    } catch (e) {
      Alert.alert('Foto konnte nicht gespeichert werden', e instanceof Error ? e.message : String(e));
    } finally {
      setFotoLaedt(false);
    }
  }
  function fotoEntfernen(i: number) {
    const id = r!.fotos[i];
    aendern({ fotos: r!.fotos.filter((_, j) => j !== i) });
    fotoLoeschen(id);
  }

  /* ---- Standort ---- */
  async function standortErfassen() {
    setOrtLaedt(true);
    try {
      const erlaubnis = await Location.requestForegroundPermissionsAsync();
      if (!erlaubnis.granted) {
        Alert.alert('Keine Berechtigung', 'Standortzugriff wurde nicht erlaubt.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      aendern({ standort: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
    } catch (e) {
      Alert.alert('Standort nicht verfügbar', e instanceof Error ? e.message : String(e));
    } finally {
      setOrtLaedt(false);
    }
  }

  /* ---- Abschließen ---- */
  async function einreichen() {
    const aktuell = rRef.current;
    if (!aktuell) return;
    if (speicherTimer.current) clearTimeout(speicherTimer.current);
    await rapportSpeichern(aktuell);
    const probleme = rapportPruefen(aktuell);
    setFehler(probleme);
    if (probleme.length) return;
    setSendet(true);
    try {
      const rest = await rapportEinreichen(aktuell.id);
      setFehler(rest);
      if (!rest.length) router.back();
    } finally {
      setSendet(false);
    }
  }

  function loeschenFragen() {
    Alert.alert('Rapport löschen?', 'Der Rapport wird von diesem Gerät entfernt.', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: () => {
          if (speicherTimer.current) clearTimeout(speicherTimer.current);
          void rapportLoeschen(r!.id).then(() => router.back());
        },
      },
    ]);
  }


  return (
    <Bildschirm>
      <Stack.Screen options={{ title: gesperrt ? 'Rapport (übertragen)' : 'Rapport bearbeiten' }} />
      <View style={s.kopf}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Untertitel>{projekt ? `${projekt.nummer} · ${projekt.kurzbez}` : 'Projekt unbekannt'}</Untertitel>
          <Pille ton={syncStatusTon(r.sync)}>{SYNC_STATUS_LABEL[r.sync]}</Pille>
        </View>
        {r.syncFehler ? <Hinweis ton="fehler">Letzter Übertragungsversuch: {r.syncFehler}</Hinweis> : null}
      </View>

      <Abschnitt>Allgemein</Abschnitt>
      <Karte>
        <View style={s.formular}>
          <Eingabe label="Bezeichnung" value={r.name} onChangeText={(t) => aendern({ name: t })} editable={!gesperrt} placeholder="z. B. Pflasterarbeiten Hof" />
          <Eingabe
            label="Datum (TT.MM.JJJJ)"
            defaultValue={datum(r.datum)}
            editable={!gesperrt}
            keyboardType="numbers-and-punctuation"
            fehler={datumFehler}
            onChangeText={(text) => {
              const iso = datumParsen(text);
              setDatumFehler(iso ? null : 'Bitte als TT.MM.JJJJ eingeben.');
              if (iso) aendern({ datum: iso });
            }}
          />
          <Eingabe
            label="Ausgeführte Arbeiten"
            value={r.taetigkeit}
            onChangeText={(t) => aendern({ taetigkeit: t })}
            multiline
            editable={!gesperrt}
            placeholder="Was wurde heute gemacht?"
          />
        </View>
      </Karte>

      <Abschnitt rechts={<Text style={{ color: farben.text3, fontSize: 12 }}>{stunden(rapportStunden(r))}</Text>}>Arbeitszeiten</Abschnitt>
      <Karte>
        {r.zeiten.map((z, i) => (
          <React.Fragment key={z.key}>
            {i > 0 ? <Trenner /> : null}
            <View style={s.eintrag}>
              <Auswahl
                label="Mitarbeiter"
                wertId={z.mitarbeiterId || null}
                optionen={d.mitarbeiter.map((m) => ({ id: m.id, text: m.bezeichnung, untertitel: m.personalnummer }))}
                onWahl={(mid) => zeitAendern(i, { mitarbeiterId: mid ?? '' })}
                gesperrt={gesperrt}
              />
              <View style={{ flexDirection: 'row', gap: ABSTAND.s, alignItems: 'flex-end' }}>
                <View style={{ width: 90 }}>
                  <Eingabe
                    label="Stunden"
                    defaultValue={zahl(z.stunden, 2)}
                    keyboardType="decimal-pad"
                    editable={!gesperrt}
                    selectTextOnFocus
                    onChangeText={(text) => {
                      const n = dezimalParsen(text);
                      if (n != null) zeitAendern(i, { stunden: n });
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Auswahl
                    label="Lohnart"
                    wertId={z.lohnartId}
                    optionen={d.lohnarten.map((l) => ({ id: l.id, text: l.bezeichnung }))}
                    onWahl={(lid) => zeitAendern(i, { lohnartId: lid })}
                    gesperrt={gesperrt}
                    keinerErlaubt
                  />
                </View>
                {!gesperrt ? <Entfernen onPress={() => zeitEntfernen(i)} /> : null}
              </View>
            </View>
          </React.Fragment>
        ))}
        {!gesperrt ? (
          <>
            {r.zeiten.length > 0 ? <Trenner /> : null}
            <Zeile icon="add" titel="Zeit hinzufügen" onPress={zeitHinzufuegen} ohnePfeil />
          </>
        ) : null}
      </Karte>

      <Abschnitt>Material</Abschnitt>
      <Karte>
        {r.material.map((m, i) => (
          <React.Fragment key={m.key}>
            {i > 0 ? <Trenner /> : null}
            <View style={s.eintrag}>
              <Eingabe
                label="Bezeichnung"
                value={m.bezeichnung}
                editable={!gesperrt}
                placeholder="z. B. Betonpflaster grau 20×10"
                onChangeText={(text) => materialAendern(i, { bezeichnung: text })}
              />
              <View style={{ flexDirection: 'row', gap: ABSTAND.s, alignItems: 'flex-end' }}>
                <View style={{ width: 90 }}>
                  <Eingabe
                    label="Menge"
                    defaultValue={zahl(m.menge, 2)}
                    keyboardType="decimal-pad"
                    editable={!gesperrt}
                    selectTextOnFocus
                    onChangeText={(text) => {
                      const n = dezimalParsen(text);
                      if (n != null) materialAendern(i, { menge: n });
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Auswahl
                    label="Einheit"
                    wertId={m.einheit}
                    optionen={einheitOptionen}
                    onWahl={(k) => materialAendern(i, { einheit: k ?? '' })}
                    gesperrt={gesperrt}
                  />
                </View>
                {!gesperrt ? <Entfernen onPress={() => materialEntfernen(i)} /> : null}
              </View>
            </View>
          </React.Fragment>
        ))}
        {!gesperrt ? (
          <>
            {r.material.length > 0 ? <Trenner /> : null}
            <Zeile icon="add" titel="Material hinzufügen" onPress={materialHinzufuegen} ohnePfeil />
          </>
        ) : null}
      </Karte>

      <Abschnitt rechts={<Text style={{ color: farben.text3, fontSize: 12 }}>{r.fotos.length} Fotos</Text>}>Fotos</Abschnitt>
      <Karte>
        {r.fotos.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.fotos}>
            {r.fotos.map((id, i) => (
              <View key={id} style={s.foto}>
                <TresorBild id={id} style={[s.fotoBild, { backgroundColor: farben.flaeche2 }]} />
                {!gesperrt ? (
                  <Pressable onPress={() => fotoEntfernen(i)} style={[s.fotoX, { backgroundColor: farben.flaeche }]} hitSlop={6}>
                    <Ionicons name="close" size={14} color={farben.text} />
                  </Pressable>
                ) : null}
              </View>
            ))}
          </ScrollView>
        ) : null}
        {!gesperrt ? (
          <>
            {r.fotos.length > 0 ? <Trenner /> : null}
            <Zeile icon="camera-outline" titel={fotoLaedt ? 'Foto wird verschlüsselt …' : 'Foto aufnehmen'} onPress={fotoLaedt ? undefined : () => void fotoAufnehmen('kamera')} ohnePfeil />
            <Trenner />
            <Zeile icon="images-outline" titel="Aus Galerie wählen" onPress={fotoLaedt ? undefined : () => void fotoAufnehmen('galerie')} ohnePfeil />
          </>
        ) : null}
      </Karte>

      <Abschnitt>Standort & Notizen</Abschnitt>
      <Karte>
        <Zeile
          icon="location-outline"
          titel={r.standort ? `${r.standort.lat.toFixed(5)}, ${r.standort.lng.toFixed(5)}` : 'Standort erfassen'}
          untertitel={r.standort ? 'GPS-Position der Baustelle' : 'Ordnet den Rapport der Baustelle zu'}
          onPress={gesperrt ? undefined : () => void standortErfassen()}
          rechts={ortLaedt ? <Chip>…</Chip> : undefined}
          ohnePfeil
        />
        <Trenner />
        <View style={s.formular}>
          <Eingabe label="Notizen" value={r.notizen} onChangeText={(t) => aendern({ notizen: t })} multiline editable={!gesperrt} placeholder="Besonderheiten, Wetter, Absprachen mit dem Kunden" />
        </View>
      </Karte>

      {fehler.length > 0 ? (
        <View style={{ paddingTop: ABSTAND.l }}>
          <Hinweis ton="fehler">{fehler.join('\n')}</Hinweis>
        </View>
      ) : null}

      <View style={s.aktionen}>
        {!gesperrt ? (
          <Knopf
            titel={einstellungen.modus === 'server' ? 'Abschließen und übertragen' : 'Abschließen'}
            icon="checkmark-circle-outline"
            onPress={() => void einreichen()}
            laedt={sendet}
          />
        ) : (
          <Hinweis ton="auftrag">Dieser Rapport wurde übertragen und kann nicht mehr geändert werden.</Hinweis>
        )}
        <Knopf titel="Rapport löschen" variante="gefaehrlich" icon="trash-outline" onPress={loeschenFragen} />
      </View>
    </Bildschirm>
  );
}

/** Zeigt ein verschlüsselt abgelegtes Foto; die Entschlüsselung bleibt im Arbeitsspeicher */
function TresorBild({ id, style }: { id: string; style: React.ComponentProps<typeof Image>['style'] }) {
  const [uri, setUri] = useState<string | null>(null);
  useEffect(() => {
    let aktiv = true;
    fotoAnzeigen(id)
      .then((u) => aktiv && setUri(u))
      .catch(() => aktiv && setUri(null));
    return () => {
      aktiv = false;
    };
  }, [id]);
  return <Image source={uri ? { uri } : undefined} style={style} />;
}

function Entfernen({ onPress }: { onPress: () => void }) {
  const { farben } = useTheme();
  return (
    <Pressable onPress={onPress} hitSlop={8} style={[s.entfernen, { backgroundColor: farben.fehlerWeich }]}>
      <Ionicons name="trash-outline" size={18} color={farben.fehler} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  kopf: { paddingHorizontal: ABSTAND.l, paddingTop: ABSTAND.l, gap: ABSTAND.m },
  formular: { padding: ABSTAND.l, gap: ABSTAND.m },
  eintrag: { padding: ABSTAND.l, gap: ABSTAND.m },
  auswahl: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: RADIUS.s, paddingHorizontal: 12, minHeight: 44 },
  entfernen: { width: 44, height: 44, borderRadius: RADIUS.s, alignItems: 'center', justifyContent: 'center' },
  fotos: { padding: ABSTAND.l, gap: ABSTAND.s },
  foto: { position: 'relative' },
  fotoBild: { width: 96, height: 96, borderRadius: RADIUS.s },
  fotoX: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  aktionen: { padding: ABSTAND.l, gap: ABSTAND.m },
});
