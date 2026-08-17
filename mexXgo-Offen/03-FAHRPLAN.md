# Der Fahrplan der App

Dieses Dokument ist **verbindlich**. Es beschreibt nicht, wie die App zufällig
gerade aussieht, sondern wie sie zu bauen ist. Wer eine Seite hinzufügt, hält
sich daran — sonst hat man nach zehn Seiten zehn Apps.

Der Anlass ist konkret: Die App war auf dem besten Weg dorthin. Bei der Prüfung
am 17.08.2026 standen **53 rohe Farbwerte** außerhalb des Baukastens und
**16 verschiedene Schriftgrößen** in Gebrauch. Beides ist inzwischen aufgeräumt
(siehe Abschnitt 7), aber es passiert wieder, wenn niemand die Regeln kennt.

---

## 1 Eine Sprache

**Java, nativ. Sonst nichts.**

| erlaubt | nicht erlaubt |
|---|---|
| Java gegen das Android-SDK | Kotlin |
| Ansichten im Code gebaut | WebView, HTML, JavaScript |
| `android.*` | Fremdbibliotheken jeder Art |
| | XML-Layouts |

Warum so streng:

* **Kein WebView.** Eine App, die halb aus nativen Ansichten und halb aus einer
  Webseite besteht, hat zwei Gestaltungen, zwei Fehlerquellen und zwei Arten,
  eine Liste zu bauen. Genau das soll nicht sein.
* **Keine Fremdbibliothek.** Die App wird ohne Gradle gebaut (`build.sh` ruft
  aapt2, javac, d8, zipalign und apksigner direkt auf). Jede Bibliothek müsste
  von Hand eingebunden und gepflegt werden.
* **Ansichten im Code, nicht in XML.** Zwei Orte für dieselbe Sache sind einer
  zu viel. Wer eine Zeile ändern will, sucht sonst erst, wo sie steht.

### Zwei harte Regeln des Baus

1. **Keine Lambda-Ausdrücke.** `javac` mit `-bootclasspath android.jar` kann sie
   nicht übersetzen — die `LambdaMetafactory` fehlt. Immer anonyme Klassen:

   ```java
   // richtig
   taste.setOnClickListener(new View.OnClickListener() {
       public void onClick(View v) { … }
   });

   // baut NICHT
   taste.setOnClickListener(v -> { … });
   ```

2. **Randlos zeichnen ab targetSdk 35.** Der Inhalt muss in einem Rahmen
   stecken, dessen Polsterung aus den Window-Insets kommt. Sonst schneidet die
   Gestenleiste die untere Navigationsleiste ab.

---

## 2 Ein Baukasten

**`UI.java` ist die einzige Quelle für Farbe, Schriftgröße, Abstand und Rundung.**
Keine Seite definiert eigene.

### Farben

```java
UI.HG          Hintergrund der Seite
UI.KARTE       Kartenfläche
UI.TEXT        Haupttext
UI.NEBEN       Nebentext
UI.LINIE       Trennlinie
UI.MARKE       Markenfarbe für Kopfbereiche (tiefes Petrol)
UI.MARKE_TIEF  ihr dunkler Partner
UI.WEISS_70    Text auf der Markenfarbe

UI.BLAU  UI.GRUEN  UI.GELB  UI.ORANGE            die vier Logofarben
UI.BLAU_HELL  …                                   ihre hellen Flächen
UI.BLAU_TIEF  …  bzw.  UI.tiefer(farbe)           ihre dunklen Partner
```

Die vier Logofarben haben eine **feste Bedeutung** und werden nie dekorativ
benutzt:

| Farbe | Bedeutung |
|---|---|
| Blau | in Arbeit |
| Grün | an die Zentrale gesendet |
| Gelb | wartet (z. B. offline erfasst) |
| Orange | braucht Aufmerksamkeit |

Dafür gibt es `UI.statusFarbe(s)`, `UI.statusHell(s)`, `UI.statusWort(s)` und
`UI.plakette(c, s)`. Wer den Status selbst einfärbt, macht es falsch.

### Schriftgrößen

Es gibt **genau diese Stufen**, jede mit einer Rolle:

```java
UI.SP_KLEIN   11.5f   Plakette, Fußnote
UI.SP_NEBEN   12.5f   Nebentext, Beschriftung
UI.SP_TEXT    13.5f   Fließtext, Listeneintrag
UI.SP_ZEILE   14.5f   Zeilentitel — der häufigste Wert
UI.SP_BETONT  15.5f   hervorgehobener Wert
UI.SP_GROSS   16.5f   Abschnittsüberschrift, Taste
UI.SP_KOPF    17.5f   Seitenkopf
UI.SP_TITEL   20f     Titel im Startbild
UI.SP_ZAHL    30f     große Kennzahl
UI.SP_LOGO    48f     Zeichen im Startbild
```

`setTextSize(…)` mit einer eigenen Zahl kommt in keiner Seite vor.

### Abstände und Rundung

```java
UI.dp(c, 12)              alle Maße in dp, nie in Pixeln
UI.RADIUS                 die eine Rundung (6 dp)
UI.abstand(c, 12)         senkrechter Zwischenraum
UI.abstandBreit(c, 12)    waagerechter Zwischenraum
UI.linie(c)               Trennlinie
```

### Bausteine

```java
UI.karte(c)                          weiße Karte mit Schatten
UI.zeile(c, streifen, titel, …)      Zeilen-Karte — der Grundbaustein
UI.wertzeile(c, "Kunde", "Meier")    Beschriftung links, Wert rechts
UI.ueberschrift(c, "Positionen")     Abschnittsüberschrift
UI.hauptTaste(c, "Senden", klick)    die eine wichtige Taste einer Seite
UI.nebenTaste(c, "Abbrechen", klick) alles andere
UI.feld(c, "Suchen…")                Eingabefeld
UI.symbolfeld(c, res, farbe, …)      Symbol auf farbiger Fläche
UI.text(c, s, UI.SP_TEXT, UI.TEXT, false)
```

---

## 3 Ein Aufbau

Jede Seite ist gleich gebaut — Kopf, Inhalt, Leiste:

```
┌──────────────────────────────┐
│  Kopf  (UI.MARKE)            │  Titel, links Zurück, rechts höchstens
│                              │  eine Handlung
├──────────────────────────────┤
│                              │
│  Inhalt (UI.HG)              │  scrollend, Karten untereinander,
│    UI.karte / UI.zeile       │  Höchstbreite UI.inhaltsbreiteDp(c)
│                              │
├──────────────────────────────┤
│  Leiste                      │  höchstens eine UI.hauptTaste
└──────────────────────────────┘
```

Regeln dazu:

* **Zeilen, keine Kacheln.** Der Grundbaustein für Listen ist `UI.zeile(…)` —
  eine schlichte Zeilen-Karte mit farbigem Streifen links. Kachelgitter nur im
  Startbild.
* **Eine Seite, eine Hauptsache.** Höchstens eine `hauptTaste` je Seite.
* **Höchstbreite beachten.** Auf dem Tablett steht der Inhalt mittig mit
  `UI.inhaltsbreiteDp(c)`. Über die volle Breite zu setzen ist der häufigste
  Fehler — eine Textzeile von 25 cm liest niemand.
* **Kein eigenes Zurück-Verhalten.** Die Systemgeste ist das Zurück.

---

## 4 Eine Sprache im Wortsinn

Alles auf Deutsch — Bezeichner, Kommentare, Texte auf dem Bildschirm.

```java
class SeiteProjekte      nicht  ProjectsPage
void anmeldenAsync()     nicht  loginAsync()
String meldung           nicht  message
```

Ausnahme: Was über die Leitung geht, behält die Originalnamen (`MessageID`,
`StationID`, `msgstate`) — sonst stimmt es nicht mehr mit
`02-SCHNITTSTELLE.md` überein.

Für Texte auf dem Bildschirm gilt: **Sätze, keine Abkürzungen.** „Der Vermittler
antwortet nicht" statt „Netzwerkfehler 500". Der Monteur auf der Baustelle soll
lesen können, was los ist.

---

## 5 Der Aufbau in Dateien

| Bereich | Dateien |
|---|---|
| Oberfläche | `MainActivity`, `Seite*.java`, `UI`, `Startbild`, `UnterschriftView`, `Merkzettel` |
| Anbindung | `MXDienst`, `MXVerbindung`, `MXRtc`, `MXNachricht`, `MXSpeicher`, `MXDatenbank`, `Geraetekennung`, `Zentrale` |
| Daten | `Daten` |
| Hilfsmittel | `Bilder`, `BildMalen`, `BildProvider`, `Logo`, `Sprache` |

**Die Oberfläche spricht nie selbst mit dem Netz.** Sie fragt `MXDienst`, und
`MXDienst` meldet über die Schnittstelle `Beobachter` zurück. Wer in einer
`Seite*.java` eine `HttpURLConnection` aufmacht, hat die Regel gebrochen.

Eine neue Seite heißt `SeiteXyz.java`, baut ihre Ansichten mit `UI.*` und
bekommt ihren Platz im Hauptmenü — nicht in einer Schublade.

---

## 6 Was verboten ist

Eine kurze Liste, die man beim Prüfen durchgehen kann:

1. Rohe Farbwerte (`0xFF…`) außerhalb von `UI.java`
2. `setTextSize(…)` mit einer eigenen Zahl
3. Maße in Pixeln statt `UI.dp(c, …)`
4. Lambda-Ausdrücke
5. XML-Layouts
6. Fremdbibliotheken
7. WebView
8. Netzzugriff aus einer `Seite*.java`
9. Englische Bezeichner (außer den Feldnamen des Protokolls)
10. Mehr als eine `hauptTaste` je Seite

Punkt 1 und 2 lassen sich mechanisch prüfen:

```bash
cd mexXgo-Entwurf-APK/app/java/com/mexxsoft/mexxgo
grep -n "0x[0-9A-Fa-f]\{8\}" $(ls *.java | grep -v '^UI.java$')
grep -n "setTextSize" *.java
```

Beides muss leer bleiben.

---

## 7 Stand der Angleichung

Geprüft und aufgeräumt am 17.08.2026. Vorher:

| Datei | rohe Farben | eigene Schriftgrößen |
|---|---|---|
| `SeiteProjekte.java` | 21 | 1 |
| `SeiteBerichte.java` | 10 | 3 |
| `SeiteHome.java` | 5 | — |
| `SeiteStamm.java` | 4 | — |
| `Startbild.java` | 4 | — |
| `SeiteLiefer.java` | 3 | 1 |
| `MainActivity.java` | 2 | — |
| `SeiteStart.java` | 2 | 1 |
| `SeiteKalender.java` | 1 | — |
| `SeiteZeit.java` | 1 | 1 |
| **Summe** | **53** | **7** |

Dazu 16 verschiedene Schriftgrößen quer durch die App, die jetzt auf die zehn
benannten Stufen aus Abschnitt 2 zusammengeführt sind. Kein Schritt beträgt
mehr als 0,5 pt — das Aussehen bleibt, die Regel gilt ab jetzt.
