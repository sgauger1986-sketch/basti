# Mitschnitt einer vollständigen Sitzung

Hier steht Zeile für Zeile, was über die Leitung geht. Nichts ist gekürzt oder
nachbearbeitet außer den Auslassungen, die als `…` gekennzeichnet sind.

Aufgezeichnet am 17.08.2026, drei Beteiligte:

| Rolle | Programm | Station |
|---|---|---|
| Vermittler | `beispiel/pruefstand.py` auf `127.0.0.1:8899` | — |
| Zentrale | `beispiel/zentrale_beispiel.py` | 0 |
| Gerät | `beispiel/geraet_beispiel.py` | 1 |

Firma `0000999`, kein Kennwort. Die vollständigen Rohprotokolle liegen daneben:
`beispiel/log_pruefstand.txt`, `log_zentrale.txt`, `log_geraet.txt`. Der
Mitschnitt der **echten Android‑App** steht in `beispiel/log_android_app.txt`
und ist in Abschnitt 9 ausgewertet.

`→` ist die Anfrage, `←` die Antwort.

---

## 1 Anmeldung

Das Gerät meldet sich an. Erste Anfrage mit `?ID=NEW`:

```
→ POST /mxWebService?ID=NEW
  FC=Connect;RE=4;Key:S=7"0000999";StationID:I=1;PW:S=40"DA39A3EE5E6B4B0D3255BFEF95601890AFD80709";UDID:S=36"9c5750f5-ddce-43e5-b0fe-ba891909df2e";
← S=32"779B0735373C4BE6B4550652A2617B16";
```

Danach `Login` mit denselben Feldern, jetzt unter der erhaltenen Sitzung:

```
→ POST /mxWebService?ID=779B0735373C4BE6B4550652A2617B16
  FC=Login;RE=4;Key:S=7"0000999";StationID:I=1;PW:S=40"DA39A3EE…";UDID:S=36"9c5750f5-…";
← S=32"779B0735373C4BE6B4550652A2617B16";
```

Beachtenswert: **`Connect` und `Login` liefern dieselbe SessionID.** Und der
Kennwort‑Hash `DA39A3EE5E6B4B0D3255BFEF95601890AFD80709` ist genau der Wert, der
in der mitgelieferten `Zentrale/mxWebZentrale.sqb` in der Tabelle `clients`
steht — der SHA‑1 der leeren Zeichenkette, weil die Testinstallation kein
Kennwort gesetzt hat.

---

## 2 Datenstand melden und Datenbank anfordern

Zwei Steuernachrichten als Paar. Zuerst `$F000` — „das ist mein Datenstand":

```
→ FC=SendMessage;RE=11;SessionID:S=32"779B0735…";Key:S=7"0000999";StationID:I=1;
  MessageID:S=32"E0F82399046046D0AF96B67D895F7C34";Recipient:I=0;MsgState:I=4;
  Content:S=41"DA39A3EE5E6B4B0D3255BFEF95601890AFD80709,";AttachmentType:I=61440;
  PartID:S=0"";PartCount:I=0;Priority:I=0;
← B=T;
```

`AttachmentType:I=61440` ist `$F000`. Der `Content` ist `<SHA-1>,<MD5>` — links
der SHA‑1 des bisherigen Stands, rechts die MD5 der vorhandenen Fassung. Das
Gerät hat noch nichts, deshalb steht rechts vom Komma nichts.

**Das ist wörtlich derselbe Aufbau, der in der echten Zentrale-Datenbank steht:**

```
id=0000548  atttype=61440  content=DA39A3EE5E6B4B0D3255BFEF95601890AFD80709,
```

Direkt danach `$F001` (61441) — „schick mir die Datenbank":

```
→ FC=SendMessage;RE=11;…;Content:S=0"";AttachmentType:I=61441;…;Priority:I=0;
← B=T;
```

**Die Aufgabenteilung der beiden ist wichtig.** Das erste sagt, *was* die
Station hat; das zweite *bittet* um die Datenbank. Ausgelöst wird das Paket nur
vom zweiten — wer auf beide reagiert, verschickt es zweimal.

---

## 3 Der Takt

Alle 2 Sekunden: ein `Connect` als Lebenszeichen, dann `ReceiveMessage` bis
nichts mehr kommt.

```
→ FC=Connect;RE=4;Key:S=7"0000999";StationID:I=1;PW:S=40"DA39A3EE…";UDID:S=36"…";
← S=32"779B0735373C4BE6B4550652A2617B16";
→ FC=ReceiveMessage;RE=3;SessionID:S=32"779B0735…";Key:S=7"0000999";StationID:I=1;
← X=;
```

`X=;` heißt: Postfach leer. Das ist der Normalfall und kein Fehler.

---

## 4 Die Zentrale reagiert

Auf der Gegenseite sieht dieselbe Sekunde so aus:

```
  Eingang: von Station 1, atttype $F000, 0 Bytes Anhang
  Station 1 hat (nichts), soll E4641746F8533626330EE85AB7ED6CCF — sie ist nicht auf Stand.

  Eingang: von Station 1, atttype $F001, 0 Bytes Anhang
  Station 1 fordert die Datenbank an.
  Datenpaket: 81920 Bytes, 2 Teile, MD5 E4641746F8533626330EE85AB7ED6CCF
  Teil 1/2 abgeschickt (49152 Bytes)
  Teil 2/2 abgeschickt (32768 Bytes)
```

Ein Paar Steuernachrichten, ein Datenpaket.

---

## 5 Das Datenpaket kommt an

Die Antwort auf `ReceiveMessage` ist jetzt ein ganzer Satz statt eines nackten
Werts:

```
← RE=10;MessageID:S=32"CEF0094D35C8428D9A516ADD537B10D7";StationID:S=1"0";
  Recipient:I=1;MsgState:I=1;Content:S=32"E4641746F8533626330EE85AB7ED6CCF";
  AttachmentType:I=61456;PartID:S=32"…";PartCount:I=2;Priority:I=0;
  Attachment:BS=49152"<49152 rohe Bytes>";
```

Zwei Dinge, an denen jede Neuumsetzung hängenbleibt:

**Die Feldnamen sind die der Anfrage, nicht die der Datenbankspalten.** Es heißt
`MessageID` und `AttachmentType`, nicht `messageid` und `atttype`. Genau dieser
Fehler ist beim Bau des Prüfstands passiert: Die App holte die Nachrichten
klaglos ab und verwarf sie stillschweigend, weil sie das Feld nicht fand.

**`Attachment:BS=49152"…"` muss byte‑genau geschnitten werden.** Der Inhalt ist
eine rohe SQLite‑Datei — mit Nullbytes, Semikolons und Anführungszeichen
mittendrin. Wer bis zum nächsten `;` liest, bekommt Müll.

Das Gerät sammelt ein:

```
  Eingang: atttype $F010, 49152 Bytes Anhang
    Teil 1/2 (49152 Bytes) angekommen
  Eingang: atttype $F010, 32768 Bytes Anhang
    Teil 2/2 (32768 Bytes) angekommen
    Vollständig: 81920 Bytes, MD5 E4641746F8533626330EE85AB7ED6CCF — abgelegt
```

Die MD5 des Gesamtstroms stimmt mit dem `Content` überein — erst dann wird die
Datei geschrieben. Danach ist sie eine ganz normale SQLite‑Datenbank:

```
    Enthaltene Tabellen: ADRESSE, ADR_MITARBEITER, EINHEIT_BASE, LV_KENNUNG,
                         LV_POS, PROJEKTE, RAPPORT, RAPPORT_DETAIL
      LV_POS                        5 Datensätze
      PROJEKTE                      2 Datensätze
```

Jede empfangene Nachricht wird quittiert:

```
→ FC=ChangeState;RE=3;MessageID:S=32"CEF0094D35C8428D9A516ADD537B10D7";State:I=5;MsgState:I=5;
← B=T;
```

Zustand `5` ist „bestätigt" — derselbe Wert, der in den echten Warteschlangen
der mitgelieferten Zentrale bei allen erledigten Nachrichten steht. Das Feld
heißt je nach Gegenstelle `State` oder `MsgState`; hier gehen beide mit, weil
das nichts kostet und eine unangenehme Fehlersuche erspart.

---

## 6 Der Rapport zurück

Das Gerät schickt eine Fachnachricht. `AttachmentType:I=0` und `Priority:I=5`
unterscheiden sie von den Steuernachrichten:

```
→ FC=SendMessage;RE=11;SessionID:S=32"779B0735…";Key:S=7"0000999";StationID:I=1;
  MessageID:S=32"D8D6F191481541BCA1B08437CFF501EC";Recipient:I=0;MsgState:I=4;
  Content:S=127"{"AUFTRAG_KOPF":{"NUMMER":"R-0001","DATUM":"2026-08-17","PROJEKT":"P-100"},
  "LV_POS":[{"POS":"1.1","MENGE":12.5}],"SIGNATUR":""}";
  AttachmentType:I=0;PartID:S=0"";PartCount:I=0;Priority:I=5;
← B=T;
```

Und kommt bei der Zentrale an:

```
  Eingang: von Station 1, atttype $0000, 0 Bytes Anhang
  Fachnachricht, 127 Zeichen Inhalt — gehört nach X2 geschrieben.
```

> **Achtung, hier ist der Mitschnitt bewusst nicht echt.** Der Inhalt ist im
> Beispiel JSON, damit man ihn lesen kann. **Die Original‑App verschickt an
> dieser Stelle BSON** (`Grijjy.Bson` im Binary belegt). Die Verschachtelung
> der Felder ist der letzte offene Punkt — siehe `02-SCHNITTSTELLE.md`,
> Abschnitt 12.

---

## 7 Abmelden

```
→ FC=Logout;RE=1;SessionID:S=32"779B0735373C4BE6B4550652A2617B16";
← B=T;
```

---

## 8 Selbst nachstellen

```bash
cd beispiel

# Fenster 1 — der Prüfstand
python3 pruefstand.py --port 8899 --adresse 127.0.0.1

# Fenster 2 — die Zentrale
python3 zentrale_beispiel.py betrieb --server 127.0.0.1 --port 8899 \
    --firma 0000999 --station 0 --datenbank beispiel_daten.sqb

# Fenster 3 — das Gerät
python3 geraet_beispiel.py --server 127.0.0.1 --port 8899 \
    --firma 0000999 --station 1 --rapport
```

Nur anmelden — das ist auch am Produktivserver unschädlich, weil es nur liest:

```bash
python3 zentrale_beispiel.py anmelden --server 82.165.182.81 --firma 0000999
```

> **`ReceiveMessage` niemals gegen den Produktivserver.** Der Aufruf holt eine
> Nachricht aus der Warteschlange und nimmt sie damit der laufenden
> Kunden‑Zentrale weg. `zentrale_beispiel.py betrieb` fragt deshalb nach, wenn
> der Server nicht `127.0.0.1` ist.

---

## 9 Dasselbe mit der echten Android‑App

Der Ablauf oben ist nicht nur zwischen zwei Skripten nachgestellt. Die
**mexXgo‑Entwurf‑App** spricht dasselbe Protokoll im Klartext. Am 17.08.2026
im Emulator aufgezeichnet, eingerichtet mit

```
mxgo://einrichten?d=<Base64 von {"server":"10.0.2.2","port":8899,
                                 "firma":"0000999","station":1,"pw":"DA39A3EE…"}>
```

Was der Prüfstand von der App gesehen hat, unverändert:

```
→ Connect          ID=NEW      {'Key': '0000999', 'StationID': '1', 'PW': 'DA39A3EE…', 'UDID': '9e983c20-…'}
← S=32"EA136AA1698C470DBEAAA07F475E93C3";
→ Login            ID=EA136AA1 {'Key': '0000999', 'StationID': '1', 'PW': 'DA39A3EE…', 'UDID': '9e983c20-…'}
← S=32"EA136AA1698C470DBEAAA07F475E93C3";
→ SendMessage      ID=EA136AA1 {'MessageID': '93B1CEC3…', 'Recipient': '0', 'MsgState': '4',
                                'Content': 'DA39A3EE…,D41D8CD98F00B204E9800998ECF8427E',
                                'AttachmentType': '61440', 'Priority': '0'}
← B=T;
→ SendMessage      ID=EA136AA1 {'MessageID': 'D2F01217…', 'Content': '', 'AttachmentType': '61441', 'Priority': '0'}
← B=T;
→ Connect          ID=EA136AA1 {…}
← S=32"EA136AA1698C470DBEAAA07F475E93C3";
→ ReceiveMessage   ID=EA136AA1 {'Key': '0000999', 'StationID': '1'}
← X=;
```

Zeichen für Zeichen dasselbe wie in Abschnitt 1–3: `Connect`, `Login`, `$F000`
mit `<SHA-1>,<MD5>`, `$F001`, dann der 2‑Sekunden‑Takt aus `Connect` und
`ReceiveMessage`.

### Und die Daten kommen wirklich an

Anschließend lief `zentrale_beispiel.py` gegen dieselbe Gegenstelle und schickte
`beispiel_daten.sqb` — dieselben zwei Teile wie in Abschnitt 5:

```
  Station 1 fordert die Datenbank an.
  Datenpaket: 81920 Bytes, 2 Teile, MD5 E4641746F8533626330EE85AB7ED6CCF
  Teil 1/2 abgeschickt (49152 Bytes)
  Teil 2/2 abgeschickt (32768 Bytes)
```

Die App hat beide Teile als Datenbank erkannt (sie quittiert sie mit
`DeleteMessageID`, zweimal), zusammengesetzt, die MD5 geprüft und die
SQLite‑Datei geöffnet. **Auf dem Bildschirm standen danach genau die beiden
Datensätze, die in der Datenbank stehen:**

```
2026-100   Neuanlage Vorgarten Musterweg 3
2026-101   Pflasterarbeiten Schulhof Nord
```

Damit ist die Kette vollständig belegt: X2‑Tabellenschema → Zentrale →
offenes Klartext‑Protokoll → App. Nichts davon ist verschlüsselt, alles davon
steht in `02-SCHNITTSTELLE.md`.

Die einzige Änderung an der App dafür: `usesCleartextTraffic="true"` im
Manifest und Port 8080 als Vorgabe. Das Protokoll selbst konnte sie schon.
