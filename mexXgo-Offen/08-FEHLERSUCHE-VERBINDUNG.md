# Warum die App nicht richtig ankommt — was die Mitschnitte hergeben

Untersucht am 17.08.2026 allein anhand der mitgelieferten Aufzeichnungen, ohne
Zugriff auf die Zentrale. Grundlage:

| Quelle | Umfang |
|---|---|
| `beispiel/roh_original/` | 90 Anfragen der **Original-App** samt Antworten |
| `beispiel/roh_unsere/` | 104 Anfragen der **eigenen App** samt Antworten |
| `beispiel/log_blau.txt` | eigene App gegen den echten Vermittler, 152 Aufrufe |
| `beispiel/log_stabil.txt`, `log_praesenz.txt` | weitere Läufe derselben App |

Jeder Befund unten ist ausgezählt, nicht geschlossen. Wo etwas Vermutung
bleibt, steht es ausdrücklich dabei.

---

## 1 Der Kern: die Präsenz bleibt auf Zustand 2 liegen

Das ist der eigentliche Befund. Beide Apps schicken die Präsenz (`$F000`) und
fragen danach mit `GetMessageState`, was daraus geworden ist:

| | Abfragen | Zustände |
|---|---|---|
| **Original-App** | 4 | `I=5` → `I=6` |
| **Eigene App**, `log_blau.txt` | 68 | **immer `I=2`** |
| **Eigene App**, `log_stabil.txt` | 96 | **immer `I=1`/`I=2`** |

Nach der Zustandstabelle in `02-SCHNITTSTELLE.md`: `2` = keine, `5` =
bestätigt/erledigt, `6` = empfangen.

Die Präsenz der Original-App wandert also binnen zweier Abfragen auf **6 —
empfangen**. Die eigene App fragt 68-mal und bekommt 68-mal denselben Wert.
Parallel dazu beantwortet der Vermittler **33 von 36 `ReceiveMessage` mit
`X=;`** — es kommt nichts zurück.

**Damit erklärt sich die graue Lampe unmittelbar.** Laut Handbuch
(`07-BRIEFING-WINDOWS.md`, Abschnitt 3) heißt blau „angemeldet **und** eine
neue Datenbank angefordert". Von der Anforderung erfährt die Zentrale erst,
wenn sie die `$F000` **abholt**. Zustand 2 heißt: Sie hat es nie getan.

## 2 Dieselbe App war schon einmal erfolgreich

`log_praesenz.txt` ist der Gegenbeweis zur These „die App ist kaputt". Dort
läuft mit derselben App der vollständige Verlauf durch:

```
SendMessage → B=T;   ChangeState 5 → B=T;
GetMessageState → I=2;   GetMessageState → I=5;
ReceiveMessage → Nachricht, atttype 61442   ChangeState 6 → B=T;
```

Also `1 → 2 → 5 → 6`, und danach kommen tatsächlich Nachrichten von der
Gegenseite. `I=2` ist demnach **ein Durchgangswert kurz nach dem Senden**, kein
Fehlerwert. In den misslungenen Läufen bleibt er stehen, weil niemand abholt.

> Nebenbei: `atttype 61442` (`$F002`) ist in keinem Dokument beschrieben.
> Gehört zu den offenen Punkten in `00-LIESMICH.md`.

## 3 Am Satzaufbau liegt es nicht

Naheliegender Verdacht, geprüft und ausgeräumt. `ChangeState` und
`GetMessageState` sind bei beiden Apps im Aufbau deckungsgleich — gleiche
Feldzahl, gleiche Reihenfolge, gleiche Schreibweise:

```
Original: FC=ChangeState;RE=5;Key:S=7"0000999";StationID:I=1;SessionID:S=32"…";MessageID:S=32"…";State:I=5;
Eigene:   FC=ChangeState;RE=5;Key:S=7"0000999";StationID:I=1;SessionID:S=32"…";MessageID:S=32"…";State:I=5;
```

Beide bekommen `B=T;`. Der Unterschied entsteht erst danach.

---

## 4 Drei echte Mängel auf der App-Seite

Sie erklären die graue Lampe **nicht**, gehören aber abgestellt.

### 4.1 Leere Felder falsch geschrieben — behoben

Im Mitschnitt `roh_unsere` steht die alte Schreibweise:

| Feld | Original | eigene App (alt) |
|---|---|---|
| `Recipient` | `I=;` | `I=0;` |
| `Attachment` | `BS=;` | `S=0"";` |
| `PartID` | `S=;` | `S=0"";` |
| `PartCount` | `I=;` | `I=0;` |
| `Priority` | `I=;` | `I=0;` |

Die Antwort darauf ist gemessen: Original `B=T;`, eigene App **`B=;`** — genau
die Endlosschleife aus `07-BRIEFING-WINDOWS.md`, Abschnitt 2. Im aktuellen
Build ist es behoben (`BS` kommt in `classes.dex` vor, und `log_blau.txt` zeigt
`Attachment:BS=;`).

### 4.2 Dieselbe MessageID zweimal gesendet — offen

In `log_blau.txt` geht `379137F492644356B2C061956B49CCAB` **zweimal** hinaus.
Die Wiederholung beantwortet der Vermittler mit **HTTP 410**. Die Original-App
verschickt in 90 Aufrufen zwei Nachrichten mit zwei verschiedenen Kennungen —
nie eine doppelt.

Ursache vermutlich: Die Nachricht wird örtlich nicht als erledigt vermerkt und
im nächsten Takt erneut aus `messages` geholt.

### 4.3 Präsenz im Takt statt einmal je Sitzung — offen

| | SendMessage | Anteil |
|---|---|---|
| Original-App | 2 von 90 Aufrufen | einmal je Anmeldung |
| eigene App (`roh_unsere`) | 35 von 104 Aufrufen | in jedem Takt |
| eigene App (`log_blau`) | 3 von 152 Aufrufen | besser, noch nicht gleich |

Jede Präsenz erzeugt eine neue Nachricht in der Warteschlange. Die
Original-App meldet sie **einmal je Sitzung**.

### 4.4 Ausgehend wird nicht komprimiert — Randnotiz

Die Original-App schickt ihre `SendMessage` **zlib-komprimiert** (337 → 246
Bytes); 2 von 90 Anfragen tragen den Kopf `78 9C`, und zwar genau die beiden
Nachrichten. Die eigene App komprimiert in 104 Anfragen **nie**. Der Vermittler
nimmt beides an — es ist also kein Fehler, aber ein Unterschied zum Original.
`java.util.zip.Deflater` ist im aktuellen Build bereits vorhanden.

---

## 5 Was auf dem Windows-Rechner zu messen ist

Die Frage „warum holt niemand ab" lässt sich nur dort beantworten. In dieser
Reihenfolge, jeder Schritt kann schon der letzte sein:

1. **Läuft die Zentrale überhaupt und ist sie angemeldet?** Sie holt als
   Station 0 für Firma `0000999`. Ist sie aus oder abgemeldet, bleibt jede
   Präsenz auf 2 liegen — genau das Bild aus `log_blau.txt`.
2. **`SELECT MOBIL_KEY, MOBIL_NAME, MOBIL_STATUS, FLAG_1 FROM ADR_MOBIL;`** —
   welchen Wert trägt die Spalte bei grau, grün, blau?
3. **`Zentrale/mxWebZentrale.sqb`, Tabellen `messages` und `received`** — steht
   die `$F000` des Geräts dort? Mit welchem `msgstate`?
4. **Den Verkehr der Zentrale mitschneiden** (`IP.txt` auf `127.0.0.1`, daneben
   `weiterleiter.py --port 8080 --ziel 82.165.182.81 --zielport 8080`). Erst
   damit sieht man, ob die Zentrale `ReceiveMessage` für Station 0 überhaupt
   aufruft.

**Die Vorhersage, an der sich diese Auswertung messen lassen muss:** Schritt 1
oder 3 zeigt, dass die Zentrale die Präsenz nicht abholt. Trifft das nicht zu —
liegt die `$F000` in `received` und die Lampe bleibt trotzdem grau —, ist diese
Auswertung widerlegt und der Fehler sitzt in der Verarbeitung der Zentrale.
