# Was in mxWebZentrale.exe steht

Auswertung des Binaries am 17.08.2026.
SHA-256 `8f173237bad771406d68dc9618f8160425f1a8b2650223aecc6b789a09e37348`,
29.970.944 Bytes, PE32 GUI für Windows, 11 Abschnitte.

Getrennt gehalten: **gefunden** heißt, es steht so im Binary. **Vermutung**
heißt, es ist daraus geschlossen und noch zu messen.

---

## 1 Der Suchfehler, der bisher Funde verhindert hat

Die SQL-Befehle der Zentrale liegen als **UTF-16** im Binary, nicht als
8-Bit-Text. Ein gewöhnliches `strings` findet sie deshalb nicht — es meldet
nur die RTTI-Namen des tiOPF-Rahmenwerks (`mxTiOPF_adr_mobil.TAdr_mobil` und
Ähnliches) und erweckt den Eindruck, es gebe kein festes SQL.

```bash
# findet nichts
strings mxWebZentrale.exe | grep -i "from adr_mobil"

# findet 149 SQL-Fragmente
python3 -c "
import re
t = open('mxWebZentrale.exe','rb').read().decode('utf-16-le', errors='ignore')
for s in re.findall(r'(?i)\b(?:select|update|insert into|delete from)\b[ -~]{10,400}', t):
    print(s.strip())
"
```

Das gilt für jede weitere Suche in dieser Datei.

## 2 Die Aufrufe, die die Zentrale kennt — gefunden

Aus der Ergebnisbehandlung ihrer RTC-Klasse, vollständig:

```
mxConnectResult      mxConnect2Result     mxLoginResult       mxLogoutResult
mxReceiveResult      mxChangeStateResult  mxSendResult        mxGetStateResult
mxDeleteResult       mxPingResult         mxRegisterLicenseResult
```

Dazu die Methoden `InitConnection`, `Reconnect`, `Disconnect`, `SendClients`,
`GetClients`.

**Für die App bedeutet das:**

| Aufruf | Zentrale | eigene App (APK) |
|---|---|---|
| `Connect`, `Connect2` | ja | ja |
| `Login`, `Logout` | ja | ja |
| `SendMessage`, `ReceiveMessage` | ja | ja |
| `ChangeState`, `GetMessageState`, `DeleteMessageID` | ja | ja |
| **`Ping`** | **ja** | **nein** |
| `RegisterLicense` | ja | nein (nur Zentrale) |
| `GetClients` / `SendClients` | ja | nein (nur Zentrale) |

`Ping` ist also vorhanden. Die App benutzt statt dessen einen erneuten
`Connect` als Lebenszeichen — das ist zulässig, aber nicht das, was das
Original tut.

## 3 Wie die Zentrale Verbundenheit führt — gefunden

Sie hält je Station ein `TClientObject` mit genau diesen Feldern:

```
MsgStr    SessionValid    Session    Session2    IsConnect    IsRealConnected    StationId
```

Zwei Dinge stehen damit fest:

* **Das Zwei-Sitzungen-Modell gilt auch auf der Zentrale-Seite** (`Session`
  und `Session2`) — es ist keine Eigenart der App.
* Die Zentrale unterscheidet **`IsConnect` von `IsRealConnected`**. Es gibt
  also zwei verschiedene Begriffe von „verbunden", und nur einer davon ist der
  strenge.

## 4 `MOBIL_STATUS` hat sechs Werte, nicht drei — gefunden

Aus der Formulardefinition: Die Spalte hängt an einer
`TcxImageComboBoxProperties` mit sechs Einträgen, Wert 0 bis 5, jeder mit
eigenem Symbol:

```
ImageIndex 0 -> Value 0      ImageIndex 3 -> Value 3
ImageIndex 1 -> Value 1      ImageIndex 4 -> Value 4
ImageIndex 2 -> Value 2      ImageIndex 5 -> Value 5
```

Grau / grün / blau aus dem Handbuch ist demnach eine Vereinfachung. Welche
Zahl welche Farbe trägt, steht in der Bilderliste `cxImageList1` und ist aus
dem Text nicht abzulesen — **am laufenden Programm abzulesen**.

## 5 `MOBIL_STATUS` wird per SQL nie geschrieben — gefunden

In allen 149 SQL-Fragmenten kommt **kein einziges** `SET MOBIL_STATUS` und
kein `MOBIL_STATUS =` vor. Gelesen wird die Spalte nur, in der Rasterabfrage:

```sql
SELECT a.ID_ADRESSE, mit.PERSONALNUMMER, a.AD_ANZEIGENAME, …
       mo.ID_ADR_MOBIL, mo.MOBIL_KEY, mo.MOBIL_NAME, mo.MOBIL_STATUS, mo.FLAG_1, …
```

**Vermutung, ausdrücklich noch nicht belegt:** Die Farbe im Raster kommt nicht
aus einem gespeicherten Datenbankwert, sondern aus dem `TClientObject` — also
aus der Client-Liste, die die Zentrale sich per `GetClients` beim Vermittler
holt. Die Spalte in der Datenbank wäre dann nur der zuletzt bekannte Stand.

Der Gegeneinwand, der zuerst auszuräumen ist: Die Zentrale schreibt über das
tiOPF-Rahmenwerk (`TmxVisitorUpdate<TAdr_mobil>`), das sein SQL **zur Laufzeit
zusammensetzt**. Ein fehlendes festes `UPDATE` beweist also nicht, dass nie
geschrieben wird. Aus dem Binärtext allein ist das nicht zu entscheiden.

**Die Messung, die es entscheidet:** Bei laufender Zentrale den Wert in der
Datenbank beobachten, während sich ein Gerät an- und abmeldet. Ändert er sich,
schreibt die Zentrale über das Rahmenwerk. Bleibt er stehen, während die Lampe
wechselt, kommt die Farbe aus `GetClients`.

## 6 Zwei praktische Funde nebenbei — gefunden

### Das Kennwort lässt sich zurücksetzen

```sql
UPDATE adr_mobil SET MOBIL_PW=NULL;
```

Dieser Befehl steht im Binary. Das Handbuch sagt, ein vergessenes Kennwort
zwinge dazu, den Benutzer **zu löschen und neu anzulegen**. Das stimmt so
nicht — die Zentrale kann es zurücksetzen. Wichtig, weil das Löschen und
Neuanlegen bisher als einziger Weg galt, auch die Gerätebindung zu lösen.

### Eine bisher unbekannte Spalte `MESSAGES`

```sql
SELECT MESSAGES FROM adr_mobil WHERE MOBIL_KEY=:MOBIL_KEY;
UPDATE adr_mobil SET MESSAGES=:MESSAGES WHERE MOBIL_KEY=:MOBIL_KEY;
```

In `01-ARCHITEKTUR.md` und `02-SCHNITTSTELLE.md` kommt sie nicht vor. Zweck
unbekannt.

### Die Datenzuordnung bestätigt sich

```sql
select * from adr_mobildata where TABLENAME='ADRESSEN' and MOBIL_KEY=:MOBIL_KEY;
select FLAGS from adr_mobildata where TABLENAME='PROJEKTE' and ID=… and MOBIL_KEY=:MOBIL_KEY;
insert into adr_mobildata(ID_ADR_MOBILDATA,MOBIL_KEY,TABLENAME,ID) values(…);
delete from adr_mobildata where MOBIL_KEY=:MOBIL_KEY and TABLENAME=:TABLENAME;
```

Genau wie in `01-ARCHITEKTUR.md`, Abschnitt 4 beschrieben: Was ein Gerät
bekommt, steht in `ADR_MOBILDATA`. **Ist dort für einen `MOBIL_KEY` nichts
eingetragen, gibt es nichts zu schicken** — die App bleibt leer, obwohl
protokollseitig alles stimmt.

## 7 Ein Irrtum aus dem Briefing, der sich hier auflöst

`07-BRIEFING-WINDOWS.md`, Abschnitt 4 empfiehlt zu prüfen, ob die Zentrale
`GetClients` **oder** `CheckOnline` benutzt. `CheckOnline` ist ein falscher
Hinweis: Der Name steht im Binary in der Nachbarschaft von
`AConnectionString`, `AUserName`, `APassword`, `CheckActive`, `CheckInactive`,
`Offline`, `Online` — das ist die **Datenbankschicht**, nicht das
mexXgo-Protokoll. Nur `GetClients` gehört zur Sache.

---

## 8 Was daraus für „die App soll voll mit der Zentrale laufen" folgt

Nach Dringlichkeit:

1. **`ADR_MOBILDATA` prüfen, bevor irgendetwas am Protokoll geändert wird.**
   Ohne Einträge dort schickt die Zentrale nichts. Das erklärt „ich kann keine
   Daten abrufen" vollständig, ohne dass an der App etwas falsch wäre.
2. **Sitzung B lebendig halten.** Die Zentrale führt `Session` **und**
   `Session2` und unterscheidet `IsConnect` von `IsRealConnected`. Die App
   erneuert im Takt nur Sitzung A per `Connect`; Sitzung B (`Connect2`) wird
   nach dem Anlegen nie wieder angefasst. *Vermutung* — zu messen.
3. **`Ping` erwägen.** Vorhanden, wird von der App nicht benutzt.
4. **`LoginBenutzer` entfernen.** Kommt in der Zentrale nicht vor, ist eine
   Erfindung der eigenen Zentrale. Steht schon in `07`, Abschnitt 6.
