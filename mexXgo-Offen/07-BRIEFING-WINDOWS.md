# Briefing für die Sitzung auf dem Windows-PC

Dieses Blatt ist für eine **neue Claude-Sitzung auf dem Windows-Rechner**, auf
dem `mxWebZentrale.exe` läuft. Es fasst zusammen, was am 17.08.2026 auf dem Mac
erarbeitet wurde, was gesichert ist, was offen blieb — und was drüben als
Erstes zu tun ist.

Stand: 17.08.2026. Alles hier ist entweder mitgeschnitten oder aus einem Binary
belegt; wo etwas Vermutung ist, steht es ausdrücklich dabei.

---

## 1 Worum es geht

Die mexXgo-App soll sich an die **bestehende** mexXgo-Zentrale
(`mxWebZentrale.exe`) anbinden — lesen und schreiben, im Live-Betrieb, ohne
Verschlüsselung, mit offenem Protokoll. Die selbst gebaute neue Zentrale ist
dabei **nicht** das Ziel; alles, was nur sie versteht, muss aus der App raus.

Beteiligte Programme:

```
  mexXsoft X2 (Advantage *.adt)
        ▲ direktes SQL
  mxWebZentrale.exe  ──┐
                       ├──►  http://82.165.182.81:8080/mxWebService
  mexXgo-App        ───┘         (Vermittler bei mexXsoft, Klartext)
```

Beide Seiten sind **Clients**. Die Zentrale kann keine Verbindungen annehmen
(nur RTC-Client-Code im Binary) und nicht verschlüsseln (die Zeichenkette
`https` kommt kein einziges Mal vor).

---

## 2 Das Protokoll — gesichert

Vollständig in `02-SCHNITTSTELLE.md`. Das Wichtigste:

**Transport:** HTTP POST auf `/mxWebService?ID=<Sitzung>`, **kein
`Content-Type`** (sonst „404 Data Format not supported"), erste Anfrage mit
`?ID=NEW`.

**Ablauf, wortgetreu aus dem Mitschnitt der Original-App:**

```
[1] ?ID=NEW  FC=Login;RE=2;Key:S=7"0000999";StationID:I=1;      → Sitzung A
[2]          FC=Connect;RE=2;Key;StationID;
[3]          FC=SendMessage  (12 Felder)                        ← Präsenz $F000
[4] ?ID=NEW  FC=Connect2;RE=2;Key;StationID;                    → Sitzung B
[5]          FC=ChangeState;…;State:I=5;                        ← eigene Nachricht
[6]          FC=ReceiveMessage  — NUR über Sitzung B
[7]          FC=GetMessageState;…                               → bis I=6, dann löschen
```

**Die drei Erkenntnisse, die am meisten Zeit gekostet haben:**

1. **Der Inhalt der Präsenz ist `<SHA-1 des Kennworts>,<Gerätekennung>`.**
   Nicht der Datenstand! Belegt: Benutzer mit Kennwort `123456` →
   `7C4A8D09CA3762AF61E59520943DC26494F8941B,DA09DF1F48BE4476BEF3E20774EEC362`.
   Ein Benutzer **ohne** Kennwort schickt dort `DA39A3EE…AFD80709` — den SHA-1
   der leeren Zeichenkette. Genau das hat mich stundenlang glauben lassen, es
   sei „SHA-1 des leeren Datenbestands".
   Die Kennung ist 32 Hex-Zeichen GROSS, ohne Bindestriche.

2. **`Key` ist die 7-stellige Firmennummer** (`0000999`), nicht der 9-stellige
   Mobil-Key. Der Server lehnt `010000999` bei `Connect`/`SendMessage` ab. Die
   Original-App zeigt zwar `010000999` im Anmeldefeld, schneidet die
   Stationsnummer aber selbst ab.

3. **Zwei Sitzungen.** A (Login/Connect) zum Senden, B (`Connect2` unter
   `?ID=NEW`) ausschließlich für `ReceiveMessage`.

**Weitere Fallen, jede einzeln erlebt:**

* `SendMessage` hat **12 Felder** in dieser Reihenfolge: SessionID, Content,
  Key, MessageID, MsgState, Recipient, StationID, Attachment, AttachmentType,
  PartID, PartCount, Priority.
* Nicht gesetzte Felder gehen **ohne Wert** heraus: `Attachment:BS=;`,
  `Priority:I=;`. Schickt man stattdessen `Attachment:S=0""`, antwortet der
  Vermittler mit `B=;` statt `B=T;` — die Nachricht läuft in eine
  Endlosschleife.
* Die Antwort auf `ReceiveMessage` beginnt mit **`FC=;RE=10;…`** — also mit
  einem leeren Funktionsnamen vor dem Satz. Wer stur `RE=` erwartet, verwirft
  jede Nachricht stillschweigend.
* Die Feldnamen der Antwort sind die der **Anfrage** (`MessageID`,
  `AttachmentType`), nicht die Spaltennamen der Datenbank.
* Empfangene Nachrichten müssen **quittiert UND gelöscht** werden
  (`ChangeState` auf 6 über Sitzung B, dann `DeleteMessageID`). Sonst kommen
  sie bei jedem Takt wieder — beobachtet: 44-mal dieselbe Nachricht.
* `ChangeState` heißt das Zustandsfeld **`State`**, nicht `MsgState`.

**Steuertypen:**

| Hex | Dezimal | Richtung | Bedeutung |
|---|---|---|---|
| `$F000` | 61440 | Gerät → Zentrale | Präsenz / Anmeldung; zugleich die Datenanforderung |
| `$F001` | 61441 | **Zentrale → Gerät** | Antwort darauf |
| `$F010` | 61456 | Zentrale → Gerät | Datenbank-Paket, gestückelt |
| `$FF01` | 65281 | Zentrale → Gerät | Chat-Nachricht |
| `$FFFF` | 65535 | Gerät → Zentrale | **SQL an X2** (siehe Abschnitt 5) |

---

## 3 Die Statusfarben — aus dem Handbuch

Wörtlich aus der mexXsoft-Anleitung „Die mexXgo Zentrale":

| Farbe | Bedeutung |
|---|---|
| **grau** | nicht angemeldet |
| **blau** | angemeldet **und eine neue Datenbank angefordert** — nur dann lassen sich Daten zuweisen |
| **grün** | online verbunden, Chat möglich |

Grün ist **nicht** die Vorstufe von blau.

Der Benutzer wird in der Zentrale mit Mobilname und Kennwort angelegt; das
Kennwort ist danach nicht mehr einsehbar. Wer es vergisst, muss den Benutzer
löschen und neu anlegen — so setzt man auch die Gerätebindung zurück.

---

## 4 Der offene Punkt — und wie er drüben zu klären ist

**Die App wird nicht blau.** Sie meldet sich an, schickt die Präsenz mit dem
richtigen Kennwort-Hash, tauscht Nachrichten aus, die Zentrale antwortet — die
Lampe steht aber auf grün oder springt beim Neuladen des Reiters auf grau.

Am Mac war das nicht zu klären, weil dort nur die **App-Seite** sichtbar ist.
Auf dem Windows-Rechner geht es in drei Schritten:

**Schritt 1 — die Statusspalte direkt lesen.** Das beantwortet die Frage
vermutlich sofort:

```sql
SELECT MOBIL_KEY, MOBIL_NAME, MOBIL_STATUS, FLAG_1 FROM ADR_MOBIL;
```

Die Zentrale liest diese Spalte für das Geräte-Raster (belegt: die
`SELECT`-Abfrage steht wörtlich im Binary). Welchen Wert trägt sie bei grau,
grün, blau? Wann schreibt die Zentrale ihn?

**Schritt 2 — die Warteschlange der Zentrale ansehen.**
`Zentrale/mxWebZentrale.sqb`, Tabellen `messages` und `received`. Was kommt von
der App an, in welchem `msgstate`, was macht die Zentrale damit?

**Schritt 3 — den Verkehr der ZENTRALE mitschneiden.** Bisher haben wir nur die
App gesehen. In `IP.txt` neben der EXE steht die Serveradresse; ersetzt man sie
durch `127.0.0.1` und startet daneben

```
python weiterleiter.py --port 8080 --ziel 82.165.182.81 --zielport 8080
```

sieht man, was die Zentrale selbst sendet und empfängt — insbesondere, ob sie
`GetClients` oder `CheckOnline` benutzt (beide sind im Binary belegt, in der
App aber nicht vorhanden).

---

## 5 Der Schreibweg nach X2 — noch nicht umgesetzt

Für „Daten von der App zurück nach X2" gibt es einen belegten Weg, der **kein
BSON** ist. In der Vorlagendatenbank der Original-App
(`assets/internal/FmxWebClient.sqb`) stehen zwei echte Ausgangsnachrichten:

```
atttype = 65535 ($FFFF), attsize = 64, priority = 1
06 0F "TPersistentList"  02 01  06 0C "TDBQueryData"  …  06 0B "VACUUM;\r\n\r\n"
```

Ein Delphi-Objektstrom mit SQL-Befehlen. `TPersistentList` und `TDBQueryData`
stecken in **beiden** Binaries — App wie Zentrale. Rapporte, Tagesberichte und
Zeiten gehen also als SQL an die Zentrale, die sie gegen X2 ausführt.

Das ist der nächste große Brocken und in der App noch nicht gebaut.

---

## 6 Was in der App noch nach der neuen Zentrale riecht

Muss raus, damit sie rein mit dem Original spricht:

* `LoginBenutzer` — Anmeldung mit Benutzername/Kennwort und JSON-Antwort. Eine
  Erfindung unseres eigenen Vermittlers; das Original kennt sie nicht.
* JSON-Fachnachrichten (`{"typ":"rapport"}`, `leistungsstand`, `tagesbericht`,
  `lieferschein`, `foto`) → müssen auf `$FFFF`/`TDBQueryData` umgestellt werden.
* TLS-Vorgaben (Port 7443, Zertifikats-Fingerabdruck) — schaden nicht, werden
  aber nicht gebraucht.

---

## 7 Wo alles liegt

| | |
|---|---|
| Diese Unterlagen | `mexXgo-Offen/` (00-LIESMICH bis 07, `beispiel/`) |
| App-Quellcode | `mexXgo-Entwurf-APK/` (Java, `./build.sh`, ohne Gradle) |
| Fertige APK | `mexXgo-Entwurf-APK/bau/mexXgo-Entwurf.apk` |
| Mitschnitte | `mexXgo-Offen/beispiel/log_*.txt` |
| Mitschneide-Werkzeug | `mexXgo-Offen/beispiel/weiterleiter.py` |
| Original-APK | `mexXgo.apk` (Version 1.0.69) |
| Zentrale-Paket | `mxWebZentrale/` mit `Zentrale/mxDatabase.sqb` (X2-Schema) |

Die Regeln für die App stehen in `03-FAHRPLAN.md`: eine Sprache (Java nativ),
ein Baukasten (`UI.java`), keine Fremdbibliotheken, keine Lambdas.

---

## 8 Sicherheitshinweise

* `82.165.182.81:8080` ist der **Produktivbetrieb** von mexXsoft.
  `Connect`/`Login` sind unschädlich. **`ReceiveMessage` nicht** — es holt eine
  Nachricht aus der Warteschlange und nimmt sie einer laufenden Kunden-Zentrale
  weg. Zum Ausprobieren `beispiel/pruefstand.py` benutzen.
* Die Original-APK ist auf **Firma `0000020` bei `82.165.192.35`** vorbelegt —
  ein **anderer Kunde**. Vor dem Start umstellen, nicht einfach „Online"
  drücken. Umstellen geht per `adb root` in
  `files/FmxWebClient.sqb`, Tabelle `system` (`mxwebserver.ip`,
  `mxwebserver.key`).
* Testfirma ist `0000999` („Testzugang", aus `Neue_Firma.txt`).

---

## 9 Was ich heute falsch hatte — bitte nicht wiederholen

Damit die neue Sitzung dieselben Sackgassen nicht noch einmal geht:

* Ich hielt den ersten Teil der Präsenz für den **Datenstand**. Es ist der
  **Kennwort-Hash**. Erst ein gesetztes Kennwort machte es sichtbar.
* Ich hielt `$F001` für die Datenanforderung der App. Es ist die **Antwort der
  Zentrale**.
* Ich hielt den 9-stelligen Mobil-Key für den `Key`. Ist er nicht.
* Ich erklärte den grünen Punkt zweimal falsch (erst über `MOBIL_STATUS`
  allein, dann über die Gerätekennung). Beide Male war es Vermutung, die ich
  wie ein Ergebnis vorgetragen habe.
* Ich habe das `Connect` im Takt entfernt (Original ruft es nur einmal) —
  daraufhin wurde die Lampe grau. Es ist nötig, weil unser
  `HttpURLConnection` die Verbindung nicht so offenhält wie RTC.
* `Connection: close` behob eine Endlosschleife, verursachte aber ein
  Sekundenflackern im Büro. Beides zusammen tragen: Cookie weg, Verbindung
  offen lassen, `Connect` im Takt.

**Die Lehre:** Der Mitschneider gegen die echte Gegenstelle beantwortet in
Minuten, was aus Binärdateien stundenlang nur zu erraten ist. Erst messen,
dann behaupten.

---

## 10 Der Emulator (nur Mac-Seite)

Er stürzte am 17.08. elfmal ab. Ursache: `hw.ramSize = 1536M` und ein
widersprüchliches `hw.gpu.enabled = no` bei `hw.gpu.mode = auto`. Jetzt
4096 MB, `vm.heapSize = 512M`, `swiftshader_indirect`. Alte Einstellung liegt
als `config.ini.sicherung` daneben.
