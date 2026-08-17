# mexXgo — die offene Schnittstelle

Diese Unterlagen beschreiben, wie sich ein Programm an mexXgo anbindet. Sie sind
für die Programmierer von mexXsoft gedacht, die später eine neue Zentrale bauen.

**Das Protokoll ist offen und unverschlüsselt.** Kein geheimer Schlüssel, kein
Binärformat, keine Bibliothek, die man kaufen müsste. Reines HTTP und ein
Textformat, das man mitlesen kann.

---

## Der wichtigste Befund zuerst

`mxWebZentrale.exe` wurde für diese Unterlagen ausgewertet. Zwei Dinge stehen
damit fest:

1. **Die Zentrale kann keine Verbindungen annehmen.** Im 30‑MB‑Binary steckt nur
   RTC‑*Client*‑Code, keine einzige Serverkomponente. App und Zentrale sind
   beide Clients und treffen sich an einem vermittelnden Server.
2. **Die Zentrale kann nicht verschlüsseln.** Die Zeichenkette `https` kommt im
   ganzen Binary kein einziges Mal vor. Der Verkehr auf Port 8080 ist heute
   schon Klartext.

Es musste also nichts geöffnet werden — es war nie zu. Was gefehlt hat, war die
Beschreibung. Die steht hier.

---

## Wo anfangen

| Wenn Sie … | dann lesen Sie |
|---|---|
| verstehen wollen, wer mit wem spricht | [01-ARCHITEKTUR.md](01-ARCHITEKTUR.md) |
| die Anbindung programmieren | [02-SCHNITTSTELLE.md](02-SCHNITTSTELLE.md) |
| lieber Code lesen als Prosa | [beispiel/zentrale_beispiel.py](beispiel/zentrale_beispiel.py) |
| sehen wollen, wie es über die Leitung aussieht | [04-MITSCHNITT.md](04-MITSCHNITT.md) |
| an der App weiterarbeiten | [03-FAHRPLAN.md](03-FAHRPLAN.md) und [05-APP-AUFBAU.md](05-APP-AUFBAU.md) |
| etwas bauen oder ausprobieren | [06-BAUEN.md](06-BAUEN.md) |

---

## In drei Minuten zum laufenden Beispiel

```bash
cd beispiel

# Fenster 1
python3 pruefstand.py --port 8899 --adresse 127.0.0.1

# Fenster 2
python3 zentrale_beispiel.py betrieb --server 127.0.0.1 --port 8899 \
    --firma 0000999 --station 0 --datenbank beispiel_daten.sqb

# Fenster 3
python3 geraet_beispiel.py --server 127.0.0.1 --port 8899 \
    --firma 0000999 --station 1 --rapport
```

Alle drei Fenster zeigen jede Zeile, die über die Leitung geht. Nach wenigen
Sekunden hat das Gerät die Datenbank empfangen und einen Rapport zurückgeschickt.

---

## Was belegt ist

Nichts hiervon ist Vermutung. Der Ablauf ist am 17.08.2026 aufgezeichnet
worden — zuerst zwischen den Beispielprogrammen, dann **mit der echten
Android‑App**:

* App meldet sich im Klartext an (`Connect`, `Login`), Firma 0000999, Station 1
* App meldet ihren Datenstand (`$F000`) und fordert die Datenbank an (`$F001`)
* Zentrale schickt 81.920 Bytes in zwei Teilen (`$F010`), MD5 geprüft
* App setzt zusammen, öffnet die SQLite und zeigt die enthaltenen Projekte an

Die Rohprotokolle liegen in `beispiel/log_*.txt`.

---

## Die drei Fallen

Wer die Anbindung neu baut, läuft mit hoher Wahrscheinlichkeit in genau diese
drei. Alle drei stehen ausführlich in `02-SCHNITTSTELLE.md`:

1. **Kein `Content-Type` setzen.** Sonst kommt `404 Data Format not supported`.
   Viele HTTP‑Bibliotheken setzen von sich aus einen.
2. **Die Antwort byte‑genau nach Längen schneiden**, nicht nach Trennzeichen.
   Der Anhang ist eine rohe SQLite‑Datei und enthält Nullbytes, Semikolons und
   Anführungszeichen.
3. **Die Feldnamen der Antwort sind die der Anfrage** (`MessageID`,
   `AttachmentType`), nicht die Spaltennamen der Datenbank (`messageid`,
   `atttype`). Dieser Fehler ist beim Bau des Prüfstands passiert: Die App holte
   alles klaglos ab und verwarf es stillschweigend.

---

## Wenn die Zentrale ein Gerät als offline anzeigt

Der Punkt im Geräte-Raster kommt aus der X2-Spalte `ADR_MOBIL.MOBIL_STATUS` —
nicht aus einer lebenden Verbindung. Er wird erst grün, wenn die **Zentrale**
die Präsenznachricht des Geräts abgeholt und verarbeitet hat. Läuft sie nicht
oder ist sie nicht angemeldet, bleibt der Punkt grau, obwohl das Handy
einwandfrei verbunden ist. Einzelheiten in `02-SCHNITTSTELLE.md`, Abschnitt 10a.

Zum Prüfen der App-Seite: `beispiel/weiterleiter.py` hängt sich zwischen App und
Server und schreibt beide Richtungen mit. Damit sieht man in zehn Sekunden, ob
das Handy sendet — statt im Trüben zu fischen.

## Ein Hinweis zum Testen

Der Vermittler auf `82.165.182.81:8080` ist der **Produktivbetrieb**.

`Connect` und `Login` sind dort unschädlich — sie lesen nur.
**`ReceiveMessage` ist es nicht:** Der Aufruf holt eine Nachricht aus der
Warteschlange und nimmt sie damit der laufenden Kunden‑Zentrale weg. Zum
Ausprobieren des vollen Ablaufs gehört ein eigener Endpunkt; `pruefstand.py`
ist genau dafür da.

---

## Was noch offen ist

* **Der Aufbau der Fachdatensätze in `Content`.** Bei Steuernachrichten ist es
  eine Prüfsumme, bei Fachnachrichten BSON. Die Feldnamen sind bekannt
  (`AUFTRAG_KOPF`, `AUFTRAG_FUSS`, `LV_POS`, `SIGNATUR`, `MENGE_MASSEN`), ihre
  Verschachtelung nicht. Der kürzeste Weg: eine echte Rapport‑Nachricht
  mitschneiden und mit den Spalten von `RAPPORT`/`RAPPORT_DETAIL` abgleichen.
* **`FLAGS` in `ADR_MOBILDATA`** — vermutlich lesend/schreibend.
* **`RegisterLicense`** — nur die Zentrale kennt den Aufruf, Felder unbekannt.
* **`$F003`** — in echten Daten beobachtet, Bedeutung unbekannt.
* **Neuinstallationsfeste Gerätekennung unter Android.** Auf iOS liegt sie im
  Keychain; unter Android ändert sie sich bei einer Neuinstallation, und das
  Gerät muss im Vermittler einmal neu freigegeben werden.
