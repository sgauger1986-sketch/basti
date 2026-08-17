# Die offene Schnittstelle — Handbuch

Dieses Dokument beschreibt vollständig, wie sich ein Programm an den mexXgo‑Vermittler
anbindet. Es ist die Anleitung für eine **spätere Zentrale**: wer das hier umsetzt,
tauscht Nachrichten mit der App aus, ohne eine Zeile der bestehenden Programme zu kennen.

Alles hier Beschriebene ist **unverschlüsselt und offen**. Es gibt keinen geheimen
Schlüssel, kein proprietäres Binärformat, keine Bibliothek, die man kaufen müsste.
Der Verkehr lässt sich mit jedem Mitschnittwerkzeug lesen.

---

## 1 Wer spricht mit wem

Der wichtigste Satz zuerst, weil er oft falsch angenommen wird:

> **Die App spricht nicht mit der Zentrale. Beide sind Clients desselben Servers.**

```
   mexXsoft X2  (Advantage-Tabellen, *.adt)
        ▲
        │  direktes SQL
        │
   Zentrale  ──────────┐
   (wählt sich hinaus) │
                       ├──►   http://<server>:8080/mxWebService
                       │            der Vermittler
   mexXgo-App  ────────┘
   (wählt sich hinaus)
```

Belegt: In `mxWebZentrale.exe` steckt ausschließlich RTC‑**Client**‑Code
(`TRtcHttpClient`). Serverkomponenten kommen im ganzen 30‑MB‑Binary nicht ein
einziges Mal vor, und die Zeichenkette `https` ebenso wenig. Die Zentrale kann
also weder Verbindungen annehmen noch verschlüsseln — sie ruft hinaus, im Klartext.

Die Gegenstelle steht in `IP.txt` neben der EXE:

```
[mexxgo.info]
82.165.182.81
```

Weitere aus dem Binary bekannte Adressen: `82.165.192.35`, `87.106.191.240`.

**Folge für die spätere Zentrale:** Sie braucht keinen offenen Port, keine
Portfreigabe und kein Zertifikat. Sie braucht nur ausgehendes HTTP auf Port 8080.

---

## 2 Transport

| | |
|---|---|
| Verfahren | HTTP `POST` |
| Pfad | `/mxWebService` |
| Anfrage | `POST /mxWebService?ID=<Sitzung> HTTP/1.1` |
| Erste Anfrage | `?ID=NEW` |
| Rumpf | der Satz aus Abschnitt 3, als reiner Text |
| Antwort | HTTP 200 mit dem nackten Rückgabewert im Rumpf |

Zwei Eigenheiten, an denen jede Neuumsetzung zuerst scheitert:

**Kein `Content-Type`.** Wird einer gesetzt, antwortet die Gegenseite
`404 Data Format not supported`. Viele HTTP‑Bibliotheken setzen bei POST mit
Rumpf von sich aus einen — der muss ausdrücklich geleert werden. In Java:

```java
c.setRequestProperty("Content-Type", "");
```

**Die Sitzung läuft doppelt.** Sie steht in der Adresse als `?ID=<Sitzung>` **und**
zusätzlich als Cookie `ID=<Sitzung>`. Die Antwort auf die erste Anfrage bringt
`Set-Cookie: ID=<hex>`; diese Kennung wird ab dann in beiden Feldern mitgeschickt.

---

## 3 Das Satzformat

Ein Textformat, kein XML, kein JSON. Aufbau einer **Anfrage**:

```
FC=<Funktion>;RE=<Anzahl Felder>;<Feld>;<Feld>;…
```

Ein Feld ist `<Name>:<Typ>=<Wert>;` mit diesen Typen:

| Typ | Schreibweise | Bemerkung |
|---|---|---|
| Zeichenkette | `Name:S=5"Hallo";` | **Die Länge steht VOR dem Text.** |
| Ganzzahl | `Name:I=42;` | |
| Wahrheitswert | `Name:B=T;` | `T` oder `F` — nicht `1`/`0` |
| Leerwert | `Name:X=;` | |
| Binärkette | `Name:BS=1234"<rohe Bytes>";` | nur in Antworten |

Vollständiges Beispiel einer Anmeldung:

```
FC=Login;RE=4;Key:S=7"0000999";StationID:I=1;PW:S=40"DA39A3EE5E6B4B0D3255BFEF95601890AFD80709";UDID:S=36"7b1f…";
```

Die **Antwort** ist ein *nackter* Wert ohne Feldnamen:

```
S=32"A1B2C3D4E5F60718293A4B5C6D7E8F90";     ← Zeichenkette
I=3;                                         ← Zahl
B=T;                                         ← ja
X=;                                          ← nichts vorhanden
```

Nur `ReceiveMessage` antwortet mit einem ganzen Satz (Abschnitt 6).

### Drei Fallen beim Zerlegen

1. **Nach der Länge schneiden, nicht nach dem Trennzeichen.** Der Anhang darf
   beliebige Bytes enthalten — Nullbytes, Semikolons, Anführungszeichen. Wer bis
   zum nächsten `;` liest, zerlegt jede zweite Datenbank falsch.
2. **Längen zählen UTF‑16‑Einheiten**, weil die Gegenseite in Delphi geschrieben
   ist. Für ASCII und deutsche Umlaute ist das dieselbe Zahl wie die Zeichenzahl;
   bei Emoji nicht.
3. **Die Feldreihenfolge bleibt erhalten.** Nicht umsortieren.

---

## 4 Die Anmeldung

Zwei Aufrufe hintereinander, beide mit denselben Feldern:

| Feld | Typ | Inhalt |
|---|---|---|
| `Key` | S | die Firmennummer, 7‑stellig, z. B. `0000999` |
| `StationID` | I | `0` = Zentrale, `1`,`2`,… = Geräte |
| `PW` | S | **SHA‑1 des Kennworts, hexadezimal, GROSSBUCHSTABEN** |
| `UDID` | S | Gerätekennung, bindet die Station an ein Gerät |

Ablauf:

```
1.  POST ?ID=NEW    FC=Connect;RE=4;Key:…;StationID:…;PW:…;UDID:…;
    ← S=32"<SessionID>";          und  Set-Cookie: ID=<SessionID>

2.  POST ?ID=<SessionID>    FC=Login;RE=4;…dieselben Felder…
    ← S=32"<SessionID>";          leere Antwort = abgelehnt
```

`Connect` und `Login` liefern dieselbe SessionID. Ein leerer Rückgabewert bei
`Login` heißt: Firmennummer, Stationsnummer oder Kennwort stimmen nicht.

**Beleg für das Kennwortverfahren** aus der mitgelieferten Zentrale‑Datenbank
`Zentrale/mxWebZentrale.sqb`, Tabelle `clients`:

```
id  name      pw                                        udid
00  Zentrale  DA39A3EE5E6B4B0D3255BFEF95601890AFD80709
```

`DA39A3EE…AFD80709` ist der SHA‑1 der **leeren** Zeichenkette in Großbuchstaben —
die frische Testinstallation hat schlicht kein Kennwort gesetzt.

Abmelden:

```
FC=Logout;RE=1;SessionID:S=32"<SessionID>";
```

---

## 5 Nachrichten senden

```
FC=SendMessage;RE=11;
  SessionID:S=32"…";
  Key:S=7"0000999";
  StationID:I=1;
  MessageID:S=32"3E7BA090578F4FB9A3CAD87FB369F911";
  Recipient:I=0;
  MsgState:I=4;
  Content:S=…"…";
  AttachmentType:I=61440;
  AttachmentB64:S=…"…";      ← nur wenn ein Anhang mitgeht
  PartID:S=…"…";
  PartCount:I=0;
  Priority:I=0;
```

Antwort: `B=T;` bei Annahme.

**`MessageID` ist eine GUID in Großbuchstaben ohne Striche**, 32 Zeichen.

**Der Anhang geht ausgehend als Base64‑Text** im Feld `AttachmentB64`. Es gibt
ausgehend **kein** Binärfeld. (Eingehend schon — siehe `BS` im nächsten Abschnitt.)

---

## 6 Nachrichten abholen

```
FC=ReceiveMessage;RE=3;SessionID:S=32"…";Key:S=7"0000999";StationID:I=1;
```

Ist nichts da, kommt `X=;`. Sonst ein ganzer Satz:

```
RE=10;MessageID:S=32"EC84E385136E496C91652114BBC39F3D";StationID:S=1"0";
Recipient:I=1;MsgState:I=1;Content:S=32"E4641746F8533626330EE85AB7ED6CCF";
AttachmentType:I=61456;PartID:S=32"…";PartCount:I=2;Priority:I=0;
Attachment:BS=49152"<rohe Bytes>";
```

Der Anhang kommt hier **binär** als Typ `BS` — deshalb muss der Rumpf byte‑genau
und nicht als Zeichenkette zerlegt werden.

> **Die häufigste Verwechslung.** Die Felder heißen in der Antwort so wie in der
> **Anfrage** — `MessageID`, `AttachmentType`, `PartID`, `Attachment` —, **nicht**
> wie die Spalten der Datenbanktabelle aus Abschnitt 7 (`messageid`, `atttype`,
> `partid`, `attachment`). Wer die Spaltennamen auf die Leitung legt, baut eine
> Antwort, die richtig aussieht und die die Gegenseite stillschweigend verwirft.
> Genau dieser Fehler ist beim Bau des Prüfstands passiert und hat eine halbe
> Stunde gekostet.

Weitere Funktionen:

| Aufruf | Felder | Antwort |
|---|---|---|
| `GetMessageState` | `MessageID` | `I=<Zustand>;` |
| `ChangeState` | `MessageID`, `State` | `B=T;` |
| `DeleteMessageID` | `MessageID` | `B=T;` |
| `Ping` | — | `B=T;` |
| `RegisterLicense` | (nur Zentrale) | |

> Bei `ChangeState` heißt das Zustandsfeld je nach Gegenstelle `State` oder
> `MsgState`. Belegt ist beides; der sichere Weg ist, **beide mitzuschicken** —
> das kostet nichts und erspart eine Fehlersuche, bei der die Quittung
> stillschweigend verpufft.

Die App benutzt statt `Ping` einen erneuten `Connect` als Lebenszeichen — das
spart einen Aufruf und erneuert zugleich die Sitzung.

---

## 7 Das Nachrichtenmodell

Beide Seiten führen **dieselben zwei Tabellen mit demselben Spaltenschnitt**:
`messages` (Ausgang) und `received` (Eingang). Wörtlich aus
`Zentrale/mxWebZentrale.sqb`:

```sql
CREATE TABLE messages (
  id         VARCHAR(40) NOT NULL,   -- die Firmennummer
  stationid  INTEGER,                -- Absender
  messageid  VARCHAR(40) NOT NULL,   -- GUID, 32 Zeichen, GROSS
  recipient  INTEGER,                -- Empfänger-Station
  msgstate   INTEGER,
  content    TEXT,
  attachment BLOB    DEFAULT NULL,
  attsize    INTEGER DEFAULT 0,
  atttype    INTEGER DEFAULT 0,
  partid     VARCHAR(40) DEFAULT '',
  partcount  INTEGER DEFAULT 0,
  priority   INTEGER DEFAULT 5,
  modify_dt  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX ixMessageId ON messages(messageid);
```

Zeitformat: `yyyy-mm-dd hh:nn:ss.zzz`.

### Zustände (`msgstate`)

| Wert | Bedeutung |
|---|---|
| 0 | Fehler |
| 1 | neu |
| 2 | keine |
| 3 | abgeholt |
| 4 | zum Senden |
| 5 | bestätigt / erledigt |
| 6 | empfangen |

In den echten Warteschlangen der mitgelieferten Zentrale stehen alle
abgearbeiteten Nachrichten auf `msgstate = 5`.

### Anhangstypen (`atttype`)

Der Bereich ab `$F000` (dezimal 61440) sind **Steuernachrichten**, keine Anhänge.

| Dezimal | Hex | Richtung | Bedeutung | `content` | `priority` |
|---|---|---|---|---|---|
| 61440 | `$F000` | Gerät → Zentrale | „das ist mein Datenstand" | `<SHA-1>,<MD5>` | 0 |
| 61441 | `$F001` | Gerät → Zentrale | „schick mir die Datenbank" | leer | 0 |
| 61456 | `$F010` | Zentrale → Gerät | das Datenbank‑Paket | MD5 des Gesamtstroms | 0 |
| 61443 | `$F003` | — | in echten Daten beobachtet, Bedeutung unbekannt | leer | 0 |
| 0 | | beide | Fachnachricht | BSON | 5 |

**`$F000` und `$F001` kommen als Paar** und haben klar getrennte Aufgaben: Das
erste sagt, *was* die Station hat, das zweite *bittet* um die Datenbank.
Ausgelöst wird das Paket nur vom zweiten — wer auf beide reagiert, verschickt
es zweimal. Und `$F001` ist zugleich der Weg, über den ein Monteur mit
„Daten von der Zentrale holen" eine Aktualisierung anstößt.

Drei echte Sätze aus `Zentrale/mxWebZentrale.sqb`, unverändert:

```
id=0000548  atttype=61440  content=DA39A3EE5E6B4B0D3255BFEF95601890AFD80709,   priority=0  msgstate=5
id=0000581  atttype=61441  content=(leer)                                      priority=0  msgstate=5
id=0000999  atttype=61441  content=(leer)                                      priority=0  msgstate=5
```

Man sieht am ersten Satz genau den Aufbau `<SHA-1>,<MD5>`: SHA‑1 des bisherigen
Datenstands, Komma, MD5 der Datenbankfassung. Bei leerem Stand steht links der
SHA‑1 der leeren Zeichenkette und rechts nichts.

---

## 8 Stückelung großer Anhänge

Eine Datenbank von 250 kB geht nicht in einem Stück. Das Verfahren:

* Jeder Teil ist eine **eigene, vollständige Nachricht**.
* Alle Teile tragen dieselbe `partid` und dieselbe `partcount`.
* Die Reihenfolge ergibt sich aus `modify_dt`.
* Vollständig ist es, wenn die Anzahl der Teile `partcount` erreicht.
* Danach wird über den **zusammengesetzten Gesamtstrom** die **MD5** gebildet und
  gegen den Wert in `content` geprüft. Stimmt sie nicht, wird alles verworfen.

Die Prüfung auf Vollständigkeit steht wörtlich im Binärcode der Zentrale:

```sql
SELECT received.partid FROM (
    SELECT partid, partcount FROM received
     WHERE partid = (SELECT partid FROM received WHERE messageid = :messageid)
     GROUP BY partid ORDER BY modify_dt) t
LEFT JOIN received ON (received.partid = t.partid)
GROUP BY received.partid
HAVING (COUNT(*) = t.partcount)
ORDER BY modify_dt LIMIT 1;
```

Zugehörige Meldungen im Binary: `HeaderSize: %d`, `StreamSize: %d`,
`MD5-Gesamt: %s`, `Chunk : %.3d (%s)`, `CRC-Error in Stream`, `Chunk-Fehler: %s`.

---

## 9 Das Datenpaket

Was die Zentrale an ein Gerät schickt, ist eine **SQLite‑Datei mit X2‑Tabellen**.
Die mitgelieferte `Zentrale/mxDatabase.sqb` (11,8 MB) ist genau dieses Schema und
damit die verbindliche Vorlage — sie enthält u. a.:

`ADRESSE`, `ADR_MITARBEITER`, `ADR_MOBIL`, `ADR_MOBILDATA`, `PROJEKTE`,
`LV_POS`, `LV_KENNUNG`, `RAPPORT`, `RAPPORT_DETAIL`, `TAGESBERICHT`,
`TAGESBERICHT_DETAIL`, `AZ_KONTO`, `GERAET`, `LOHNGRUPPE`, `EINHEIT_BASE`,
`KALENDER`.

### Welche Datensätze auf welches Gerät gehören

Das steuert **`ADR_MOBILDATA`** — zeilenweise, mit `MOBIL_KEY` (das Gerät),
`TABLENAME`, `ID` und `FLAGS`. Wörtlich aus dem Binary:

```sql
insert into adr_mobildata (ID_ADR_MOBILDATA, MOBIL_KEY, TABLENAME, ID, FLAGS) values (…);
delete from adr_mobildata where MOBIL_KEY = :MOBIL_KEY and TABLENAME = :TABLENAME;
select * from adr_mobildata where TABLENAME = 'ADRESSEN' and MOBIL_KEY = :MOBIL_KEY;
```

Die spätere Zentrale bildet daraus die Menge der Datensätze für ein Gerät, liest
sie aus X2, schreibt sie in eine SQLite‑Datei, stückelt diese nach Abschnitt 8
und verschickt sie mit `AttachmentType = 61456` (`$F010`).

### Adressierung der Stationen

Aus der Tabelle `clients`:

| id | name |
|---|---|
| `00` | Zentrale |
| `010000050` | Mobil 1 |

Die 9‑stellige Gerätekennung ist der `MOBIL_KEY` aus X2; in der Anmeldung geht
sie als `Key`, die laufende Nummer als `StationID`.

---

## 10 Der Takt

Die App arbeitet mit einem **2‑Sekunden‑Takt**:

```
alle 2 s:
    besteht keine Sitzung?  →  Connect + Login
    sonst                   →  Connect  (Lebenszeichen, erneuert die Sitzung)
    offene Nachrichten aus `messages` senden
    ReceiveMessage, bis X=; kommt
```

Nach jeder Anmeldung meldet sie sich mit zwei Steuernachrichten hintereinander:
`$F000` mit `<SHA-1>,<MD5>` des vorhandenen Datenstands, dann `$F001` als Bitte
um die Datenbank. Die Zentrale antwortet auf `$F001` mit dem Datenpaket
(`$F010`), gestückelt nach Abschnitt 8.

---

## 10a Die Statusfarben im Büro — laut Handbuch

Das steht in der offiziellen mexXsoft-Anleitung "Die mexXgo Zentrale" und ist
damit verbindlich. Ich hatte es zwischenzeitlich falsch gedeutet, deshalb hier
wörtlich:

| Farbe | Bedeutung |
|---|---|
| **grau** | Der Benutzer ist nicht angemeldet. Chat nicht möglich; auf dem Gerät kann offline weitergearbeitet werden. |
| **blau** | Der Benutzer hat sich angemeldet **und eine neue Datenbank angefordert**. Nur in diesem Zustand lassen sich ihm Daten zuweisen. |
| **grün** | Der Benutzer ist online verbunden. Chat möglich. |

**Grün ist nicht die Vorstufe von blau.** Es sind eigene Zustände: grün heißt
verbunden, blau heißt "wartet auf Daten".

### Die Gerätebindung

Ein mexXgo-Benutzer wird in der Zentrale mit **Mobilname und Passwort**
angelegt. Das Passwort wird unlesbar gespeichert; laut Handbuch muss man den
Benutzer *löschen und neu anlegen*, wenn man es vergisst. Daraus folgt: Die
Bindung an ein bestimmtes Gerät entsteht beim ersten Anmelden und lässt sich
nur durch Löschen und Neuanlegen zurücksetzen.

Praktische Folge beim Testen: Hat sich einmal ein anderes Gerät (etwa die
Original-App) an diesem Benutzer angemeldet, erkennt die Zentrale ein zweites
Gerät mit anderer Gerätekennung nicht als denselben Benutzer.

## 10b Wie ein Gerät „online" wird

Das ist die Frage, an der am 17.08.2026 eine Stunde hängen blieb, deshalb hier
eigens: **Der grüne Punkt in der Zentrale kommt NICHT von einer lebenden
Verbindung.** Er steht in X2. Wörtlich aus `mxWebZentrale.exe`:

```sql
SELECT a.ID_ADRESSE, mit.PERSONALNUMMER, a.AD_ANZEIGENAME, …,
       mo.MOBIL_KEY, mo.MOBIL_NAME, mo.MOBIL_STATUS, mo.FLAG_1, …
  FROM ADRESSE a
  JOIN ADR_MOBIL mo  ON (a.ID_ADRESSE = mo.ID_ADRESSE)
  JOIN ADR_MITARBEITER mit ON (a.ID_ADRESSE = mit.ID_ADRESSE)
```

`mo.MOBIL_STATUS` ist die Statusspalte des Geräte-Rasters. Die Kette lautet:

```
App:        $F000 senden      (Recipient 0)
Vermittler: legt es in das Fach von Station 0
Zentrale:   ReceiveMessage → verarbeitet → schreibt MOBIL_STATUS
Raster:     Punkt wird grün
```

Daraus folgt zweierlei:

* **Eine angemeldete App allein genügt nicht.** Die Zentrale muss laufen, am
  Vermittler angemeldet sein und abholen. Ist sie es nicht, bleibt der Punkt
  grau, obwohl das Gerät einwandfrei verbunden ist.
* **Umgekehrt sagt grau nichts über das Gerät.** Wer einen Verbindungsfehler
  sucht, sieht hier den Zustand der *Zentrale*, nicht den des Handys. Zum
  Prüfen der App-Seite gehört ein Mitschnitt (`beispiel/weiterleiter.py`).

Die Zentrale kennt zusätzlich `GetClients` und `CheckOnline` — beides im Binary
belegt, beides nur auf der Zentrale-Seite. Die App braucht davon nichts.

## 11 Was das für eine spätere Zentrale bedeutet

Die Mindestumsetzung, in dieser Reihenfolge:

1. HTTP‑POST auf `/mxWebService`, **ohne `Content-Type`**, mit `?ID=` und Cookie.
2. Satzformat schreiben und lesen (Abschnitt 3) — byte‑genau, nach Längen.
3. `Connect` + `Login` mit `Key`/`StationID=0`/`PW`/`UDID`.
4. Takt: `Connect` als Lebenszeichen, `ReceiveMessage` in der Schleife.
5. Auf `$F000` einer Station antworten und bei veraltetem Stand ein Datenpaket
   nach Abschnitt 8/9 stückeln und senden.
6. Eingehende Fachnachrichten (Rapport, Tagesbericht, Unterschrift) nach X2 schreiben.

Punkt 1–4 sind in `beispiel/zentrale_beispiel.py` vollständig vorgeführt.

---

## 12 Was offen bleibt

* **Der Aufbau der Fachdatensätze innerhalb von `content`.** Bei Steuernachrichten
  ist `content` eine Prüfsumme, bei Fachnachrichten **BSON** (`Grijjy.Bson` im
  Binary belegt). Die Feldnamen sind bekannt — `AUFTRAG_KOPF`, `AUFTRAG_FUSS`,
  `LV_POS`, `SIGNATUR`, `MENGE_MASSEN` —, ihre Verschachtelung nicht.
  Der kürzeste Weg dahin: eine echte Rapport‑Nachricht mitschneiden und mit den
  Spalten von `RAPPORT`/`RAPPORT_DETAIL` aus `mxDatabase.sqb` abgleichen.
* **`FLAGS` in `ADR_MOBILDATA`** — vermutlich lesend/schreibend, nicht belegt.
* **`RegisterLicense`** — nur die Zentrale kennt den Aufruf; Felder unbekannt.

---

## 13 Wichtiger Hinweis zum Testen

Der Vermittler auf `82.165.182.81:8080` ist der **Produktivbetrieb**. `Connect`
und `Login` sind dort unschädlich — sie lesen nur.

**`ReceiveMessage` dagegen nicht.** Der Aufruf holt eine Nachricht aus der
Warteschlange und nimmt sie damit der laufenden Kunden‑Zentrale weg. Wer mit
einer echten Firmennummer testet, verursacht dort einen Datenverlust. Zum
Ausprobieren des vollen Ablaufs gehört ein eigener Endpunkt.
