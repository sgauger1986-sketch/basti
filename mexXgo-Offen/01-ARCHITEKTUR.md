# Die Architektur — wer spricht mit wem

Bevor irgendeine Zeile Code geschrieben wird, muss dieses Bild sitzen. Fast
jeder Irrtum bei diesem Thema kommt daher, dass man die Kästen falsch verbindet.

---

## 1 Das Bild

```
   ┌─────────────────────────────────────────┐
   │  mexXsoft X2                            │
   │  Advantage-Tabellen (*.adt)             │   beim Kunden
   └────────────────┬────────────────────────┘
                    │  direktes SQL über TAdsConnection
                    │
   ┌────────────────▼────────────────────────┐
   │  Zentrale                               │   beim Kunden, Windows
   │  (heute mxWebZentrale.exe)              │
   └────────────────┬────────────────────────┘
                    │  wählt sich HINAUS
                    │  HTTP, Klartext, Port 8080
                    │
   ┌────────────────▼────────────────────────┐
   │  Vermittler   /mxWebService             │   bei mexXsoft
   │  Warteschlange je Firma und Station     │   82.165.182.81
   └────────────────▲────────────────────────┘
                    │  wählt sich HINAUS
                    │  HTTP, Klartext, Port 8080
                    │
   ┌────────────────┴────────────────────────┐
   │  mexXgo-App                             │   auf dem Handy
   │  SQLite: messages / received            │
   └─────────────────────────────────────────┘
```

## 2 Die drei Sätze, auf die es ankommt

**Die App spricht nie mit der Zentrale.** Sie sieht X2 nie und das Kundennetz
nie. Sie sieht ausschließlich Nachrichten in der Warteschlange des Vermittlers.

**Beide Seiten wählen sich hinaus.** Weder die Zentrale noch die App nimmt
Verbindungen an. Deshalb braucht niemand eine Portfreigabe, eine feste Adresse
oder ein Zertifikat — es genügt ausgehendes HTTP.

**Der Vermittler ist ein Postfach, kein Verstand.** Er kennt Firmen, Stationen
und Nachrichten. Was in einer Nachricht steht, geht ihn nichts an.

## 3 Warum das so ist und nicht anders geht

`mxWebZentrale.exe` wurde für diese Unterlagen ausgewertet. Zwei Befunde
schließen jeden anderen Aufbau aus:

* Im 30‑MB‑Binary steckt **nur RTC‑Client‑Code** (`TRtcHttpClient`,
  `RtcHttpClient1`). Serverkomponenten kommen kein einziges Mal vor. Die
  Zentrale *kann* keine Verbindung annehmen.
* Die Zeichenkette **`https` kommt kein einziges Mal vor.** Die Zentrale *kann*
  nicht verschlüsseln.

Dazu `IP.txt` neben der EXE, die die Gegenstelle nennt:

```
[mexxgo.info]
82.165.182.81
```

Damit ist das heutige Protokoll bereits offen und unverschlüsselt. Es musste
nichts aufgebrochen werden — es war nie zu.

## 4 Was in welche Richtung geht

| Richtung | Inhalt | Wie |
|---|---|---|
| Zentrale → App | die Fachdaten des Geräts | SQLite‑Datei, gestückelt, `$F010` |
| App → Zentrale | Datenstand melden | `$F000`, `<SHA-1>,<MD5>` |
| App → Zentrale | Datenbank anfordern | `$F001` |
| App → Zentrale | Rapport, Tagesbericht, Unterschrift, Foto | Fachnachricht, `atttype 0` |

Welche X2‑Datensätze ein Gerät bekommt, steht in der X2‑Tabelle
**`ADR_MOBILDATA`** (`MOBIL_KEY`, `TABLENAME`, `ID`, `FLAGS`). Daraus bildet die
Zentrale das Paket. Einzelheiten in `02-SCHNITTSTELLE.md`, Abschnitt 9.

## 5 Was eine spätere Zentrale ersetzen muss

Nur den mittleren Kasten. Vermittler und App bleiben, wie sie sind. Die neue
Zentrale muss können:

1. an X2 heran (Advantage‑Tabellen lesen und schreiben),
2. die Schnittstelle aus `02-SCHNITTSTELLE.md` sprechen,
3. aus `ADR_MOBILDATA` die Pakete bilden,
4. eingehende Fachnachrichten nach X2 zurückschreiben.

Punkt 2 ist vollständig in `beispiel/zentrale_beispiel.py` vorgeführt und in
`04-MITSCHNITT.md` Zeile für Zeile belegt.

## 6 Der Testaufbau in diesen Unterlagen

Damit man den Ablauf ausprobieren kann, ohne den Produktivbetrieb anzufassen,
liegt ein winziger Vermittler bei:

```
   zentrale_beispiel.py  ─┐
                          ├──►  pruefstand.py  (127.0.0.1:8899)
   geraet_beispiel.py    ─┘        oder die echte mexXgo-App
```

`pruefstand.py` ist **kein Produkt** und kein Ersatz für den Vermittler von
mexXsoft — nur so viel Server, wie man zum Ausprobieren braucht.

> **Warum überhaupt ein eigener Endpunkt:** `ReceiveMessage` am Produktivserver
> holt eine Nachricht aus der Warteschlange und nimmt sie damit der laufenden
> Kunden‑Zentrale weg. `Connect` und `Login` sind unschädlich, `ReceiveMessage`
> ist es nicht.
