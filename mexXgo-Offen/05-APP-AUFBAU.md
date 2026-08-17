# Der Aufbau der App

Wo was steht und warum. Projekt: `mexXgo-Entwurf-APK/`, Paket
`com.mexxsoft.mexxgo`, Java nativ ohne Fremdbibliotheken. Die Regeln dazu
stehen in `03-FAHRPLAN.md`; hier steht, was es gibt.

---

## 1 Die Schichten

```
   ┌──────────────────────────────────────────────┐
   │  Oberfläche                                  │
   │  MainActivity · Seite*.java · UI · Startbild │
   └───────────────────┬──────────────────────────┘
                       │  Zentrale.java (Bindeglied)
   ┌───────────────────▼──────────────────────────┐
   │  Anbindung                                   │
   │  MXDienst · MXVerbindung · MXRtc             │
   │  MXNachricht · MXSpeicher · MXDatenbank      │
   └───────────────────┬──────────────────────────┘
                       │  HTTP, Klartext
                       ▼
                  Vermittler
```

**Die Oberfläche spricht nie selbst mit dem Netz.** Sie fragt `MXDienst`, und
`MXDienst` meldet über die Schnittstelle `Beobachter` zurück. Wer in einer
`Seite*.java` eine `HttpURLConnection` aufmacht, hat die Regel gebrochen.

---

## 2 Die Anbindung

| Datei | Zweck |
|---|---|
| `MXRtc.java` | Das Übertragungsformat: Sätze schreiben und **byte‑genau** lesen. Hier liegt der Parser, der den Binäranhang nach Längen schneidet statt nach Trennzeichen. |
| `MXVerbindung.java` | Die Aufrufe: `Connect`, `Login`, `Logout`, `SendMessage`, `ReceiveMessage`, `DeleteMessageID`. Kein `Content-Type`, Sitzung über `?ID=` **und** Cookie. Klartext ab Werk, TLS auf Wunsch. |
| `MXNachricht.java` | Eine Nachricht mit den Feldnamen des Originals. |
| `MXSpeicher.java` | Örtliche SQLite‑Spiegelung der Warteschlange: `messages` (Ausgang), `received` (Eingang), gleicher Spaltenschnitt wie in der Zentrale. Damit arbeitet die App ohne Netz weiter. |
| `MXDatenbank.java` | Sammelt das gestückelte Datenpaket ein, prüft die MD5, öffnet die SQLite und liest die Fachdaten heraus. |
| `MXDienst.java` | Führt alles zusammen: Anmeldung, 2‑Sekunden‑Takt, Ausgang senden, Eingang holen, Einrichtung über `mxgo://`. |
| `Geraetekennung.java` | Die UDID für die Gerätebindung, in `SharedPreferences`. |
| `Zentrale.java` | Bindeglied nach oben: füllt `Daten` und nimmt Rapporte entgegen. |

### Der Takt

```
alle 2 Sekunden:
    keine Sitzung?  →  Connect + Login   (kommt von allein zurück)
    sonst           →  Connect            (Lebenszeichen)
    offene Nachrichten aus `messages` senden
    ReceiveMessage, bis X=; kommt
```

Der Takt läuft **auch nach einer misslungenen Anmeldung** weiter. Sonst bliebe
das Gerät für immer still, wenn der Server beim Start gerade im Funkloch war —
und niemand käme darauf, dass ein Neustart der App hilft.

---

## 3 Die Oberfläche

| Datei | Bereich |
|---|---|
| `MainActivity.java` | Trägt den Stapel der Bildschirme; Hauptmenü statt Schublade |
| `UI.java` | Der Baukasten: Farben, Schriftstufen, Karten, Zeilen, Tasten |
| `SeiteStart.java` | Startbild, Anmeldung, Chat, Stand, Einstellungen |
| `SeiteHome.java` | Hauptmenü mit Marken‑Kopf |
| `SeiteProjekte.java` | Projekte, Leistungsverzeichnis, Positionen, Massenliste |
| `SeiteBerichte.java` | Rapporte und Tagesberichte samt Unterschriften |
| `SeiteZeit.java` | Zeiterfassung mit Stoppuhr |
| `SeiteKalender.java` | Wochenplan / Tourenplan |
| `SeiteStamm.java` | Adressen und Dokumente |
| `SeiteLiefer.java` | Lieferscheine und AZ‑Konto |
| `Startbild.java` | Der gezeichnete Startbildschirm |
| `UnterschriftView.java` | Zeichenfläche für die Unterschrift |
| `Merkzettel.java` | Hält Rapporte über einen Neustart hinweg |

Hilfsmittel: `Bilder`, `BildMalen`, `BildProvider` (Fotos aufnehmen, einkreisen,
ablegen), `Sprache` (diktieren statt tippen), `Logo`, `Daten` (Demodaten).

---

## 4 Die Einrichtung eines Geräts

Über einen Verweis, den die Zentrale als QR‑Code ausgibt:

```
mxgo://einrichten?d=<Base64url eines kleinen JSON>
```

Der Inhalt:

```json
{ "server": "82.165.182.81", "port": 8080, "firma": "0000999",
  "station": 1, "pw": "<SHA-1 des Kennworts, GROSS>", "name": "Gerät 1" }
```

Zusätzlich möglich: `"fp"` mit dem SHA‑256 eines Server‑Zertifikats — dann
schaltet die Verbindung auf TLS mit Pinning um. Ohne `fp` und mit einem Port
ungleich 7443 läuft es im Klartext, so wie die Zentrale auch.

Ein per Verweis eingerichtetes Gerät gilt als Gerät und meldet ab dann seine
Präsenz.

### Ein Fallstrick

Die Gerätekennung liegt in `SharedPreferences`. `pm clear` oder eine
Neuinstallation löscht sie — dann antwortet der Vermittler
„ABGELEHNT: Andere UDID", und das Gerät muss dort einmal neu freigegeben
werden. Auf iOS liegt die Kennung im Keychain und übersteht das; für Android
ist das ein offener Punkt.

---

## 5 Was offline geht

Alles Erfassen. Rapporte, Zeiten, Fotos und Unterschriften landen in
`messages` und gehen heraus, sobald wieder Verbindung besteht. Der Monteur
merkt vom Funkloch nichts außer der gelben Plakette „Wartet".
