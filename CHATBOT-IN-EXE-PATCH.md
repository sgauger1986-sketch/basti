# Selbstprüfender Chatbot IN X2 — In-Process statt nur daneben

**Ausgangslage (aktualisiert):** Der Auftrag kommt von einem Entwickler bei
mexXsoft, also vom **Hersteller von X2 selbst**. Es geht um das eigene Produkt,
verteilt über den eigenen Installer. Damit sind Wege möglich und legitim, die
für einen Dritten tabu wären. Zwei harte Anforderungen:

1. Der Chatbot muss **in der Software** laufen — nicht als getrenntes Fenster
   daneben, sondern als Teil der laufenden X2-Sitzung.
2. Jede Antwort wird **fortlaufend von einem zweiten Chatbot auf Richtigkeit
   geprüft**, bevor der Nutzer sie sieht.

Dieses Dokument ersetzt für den Hersteller-Fall die vorsichtigere Empfehlung aus
`CHATBOT-INTEGRATION.md` (die für „ohne Rechte an der Software“ geschrieben war).

---

## Teil A — Wie der Bot wirklich „in X2" landet (ohne Quellcode)

Wichtige Unterscheidung, die alles entscheidet:

> **„In der Software laufen"** heißt: der Chatbot-Code läuft **im selben Prozess**
> wie X2 und zeigt sein Fenster **innerhalb** des X2-Hauptfensters. Das braucht
> **keine** Änderung an den Bytes der `.exe`. Es braucht nur, dass zusätzlicher
> Code **in den Prozess geladen** wird — und das geht sauber über eine **DLL**.

Eine `.exe` byteweise zu patchen (Formular-Ressourcen umschreiben, Code-Caves)
ist der **schlechteste** dieser Wege: extrem fragil, bricht bei jedem X2-Update,
ein Fehler legt das Programm lahm. Als Hersteller braucht ihr das nicht — ihr
kontrolliert den Installer und könnt eine Begleit-DLL einfach **mitausliefern**.

### Die vier In-Process-Varianten (von robust zu fragil)

| Variante | Mechanik | Robust? | Für den Hersteller |
|---|---|---|---|
| A1. Begleit-DLL im Installer | X2 lädt beim Start eine `x2ai.dll`, deren `DllMain` das Chat-Panel erzeugt | **ja** | **Empfehlung** |
| A2. Proxy-/Hijack-DLL | Eine DLL, die X2 ohnehin lädt, wird durch eine Proxy-DLL ersetzt (leitet alle Exporte weiter + startet den Bot) | ja | gut, wenn passende DLL existiert |
| A3. Fenster-Andocken (SetParent) | Ein Begleitprozess hängt sein Panel per `SetParent`/`SetWinEventHook` **in** das X2-Fenster | mittel | gut, überlebt Updates |
| A4. `.exe` byteweise patchen | Import-Tabelle/Ressourcen der `.exe` direkt ändern | **nein** | **vermeiden** |

**Empfohlen: A1 — Begleit-DLL, sauber mitgeliefert.**

- Eine kleine DLL (`x2ai.dll`) wird beim X2-Start in den Prozess geladen. Gängige
  Ladewege, ohne die `.exe` zu verändern:
  - Ein **schlanker Loader/Launcher** im Installer startet X2 und injiziert die
    DLL (`CreateRemoteThread` + `LoadLibrary`) — der Nutzer startet künftig den
    Launcher, nicht direkt `X2.exe`.
  - Oder die DLL wird als **Proxy** (A2) für eine von X2 geladene Hilfs-DLL
    installiert.
- In `DllMain`/nach Prozessstart findet die DLL das **VCL-Hauptfenster** von X2
  (Fensterklasse `TApplication`/`TMainForm`, per `FindWindow`/`EnumWindows`) und
  dockt ein Chat-Panel an — entweder als echtes Child-Window (`SetParent`) oder
  als angedockte Seitenleiste. Für den Nutzer ist es „ein Knopf mehr in X2".
- Das Panel selbst ist am schnellsten als **eingebettetes WebView2** (Edge/
  Chromium) gebaut: die Chat-Oberfläche ist HTML/JS, die Logik dahinter ruft die
  Selbstprüf-Engine (Teil B). So bleibt die UI modern und unabhängig von der
  alten VCL.

Für den Bau der DLL selbst braucht ihr **keinen** X2-Quellcode — nur ein neues,
kleines Projekt. Bewährte Bausteine: **Delphi** (ihr habt das Know-how; die DLL
kann VCL-frei sein), Anbindung an ein Modell über **Python4Delphi**,
**LlamaKit** (lokales Modell als DLL) oder eine **OpenAI/Anthropic-Bibliothek**.

### Was der Bot „sieht"

Der eigentliche Wert liegt nicht im Fenster, sondern im **Datenzugriff**:

- **Advantage-Datenbank (das Wichtigste).** Der Bot liest **dieselbe Datenbank**
  wie X2 — dieselbe, die unter `datenbank-schema/` bereits vollständig
  dokumentiert ist. Damit beantwortet er echte Fachfragen (Angebote, Projekte,
  LV-Positionen, Löhne …). Der Prototyp in `chatbot/` zeigt genau das.
- **Bildschirm-/Fokus-Kontext (optional).** Über UI-Automation kann die DLL
  wissen, *welcher* Datensatz gerade offen ist, und Fragen darauf beziehen
  („dieser Kunde", „dieses Projekt").

---

## Teil B — Der zweite Chatbot als Prüfer (das eigentlich Neue)

Ein Chatbot, der bei Geschäftszahlen frei erfindet, ist in einem ERP wertlos.
Die **Produkt-Idee** ist deshalb nicht „ein Chatbot", sondern **ein Chatbot, der
sich selbst kontrolliert**: Jede Antwort durchläuft eine zweite, unabhängige
Instanz, bevor sie angezeigt wird.

```
Frage
  │
  ▼
[Modell A · Autor]  ── erzeugt ──▶  SQL (nur lesend) + Antwortentwurf
                                        │
                                        ▼  SQL gegen die X2-Datenbank ausführen
                                     echte Zeilen
                                        │
                                        ▼
[Modell B · Prüfer] ── prüft ──▶  Urteil: 🟢 OK · 🟡 Vorbehalt · 🔴 falsch
                                        │                      (+ Korrektur)
                                        ▼
                        Nutzer sieht Antwort + Vertrauens-Ampel
```

**Warum zwei getrennte Aufrufe.** Ein Modell, das sich selbst im selben
Gedankengang bewertet, findet seine eigenen Fehler kaum. Erst ein **separater**
Prüf-Aufruf — idealerweise ein anderes Modell — bringt echte Kontrolle. Der
Prüfer bekommt die Frage, die ausgeführte Abfrage und die **echten
Ergebniszeilen** und muss belegen, dass die Antwort daraus folgt.

**Kostenlogik.** Der Autor darf ein starkes Modell sein, der Prüfer ein
günstigeres — Nachrechnen ist leichter als Formulieren. Im Prototyp:
Autor `claude-opus-5`, Prüfer `claude-sonnet-5`.

**Datenschutz-Variante.** Für ein ERP mit echten Kundendaten kann **beides
lokal** laufen (zwei lokale Modelle, z. B. über Ollama/llama.cpp) — dann verlässt
kein Datensatz das Haus. Die Engine ist so gebaut, dass nur das „Backend"
getauscht wird (siehe `chatbot/selfcheck_engine.py`, Klassen `AnthropicBackend`
/ `LocalBackend`).

**Sicherheitsnetz.** Der Bot schreibt **nie** in die Datenbank: Es sind nur
lesende `SELECT`-Abfragen erlaubt, mehrfache Anweisungen und alle
schreibenden/DDL-Befehle werden blockiert, die Verbindung ist schreibgeschützt
(`chatbot/selfcheck_engine.py`, `is_read_only()` + `open_readonly()`).

---

## Teil C — Der lauffähige Prototyp (`chatbot/`)

Der Ordner `chatbot/` enthält einen **funktionierenden** Kern der Selbstprüfung,
der ohne Netz und ohne API-Schlüssel läuft:

- `build_db.py` — baut aus den **echten Demo-Daten** des Prototyps eine
  schreibgeschützte SQLite-DB.
- `selfcheck_engine.py` — der Autor-/Prüfer-Ablauf. Standardmäßig mit einem
  deterministischen Mock-Backend (läuft überall), umschaltbar auf echtes Claude
  (`X2_LLM=anthropic`) oder ein lokales Modell.

Demo-Ausgabe (gekürzt) — der Prüfer bestätigt korrekte Zahlen und **fängt eine
absichtlich falsche Antwort**:

```
Frage:    Wie viele Positionen haben die Leistungsverzeichnisse?
Antwort:  Die Leistungsverzeichnisse enthalten 1087 Positionen.
Vertrauen: 🟢 geprueft   (Zahl 1087 durch Abfrage belegt)

Frage:    Wie hoch ist der durchschnittliche Stundenlohn der Mitarbeiter?
Antwort:  Der durchschnittliche Stundenlohn betraegt 99,00 EUR.
Vertrauen: 🔴 nicht bestanden   (Antwort nennt 99,0, Daten ergeben 18,42)
Korrektur: Aus den Daten belegt: 18,42.
```

In der Produktivversion wird an genau **einer** Stelle SQLite gegen den lesenden
Zugriff auf die Advantage-DB getauscht — der Autor-/Prüfer-Ablauf bleibt gleich.

---

## Empfehlung / Reihenfolge

1. **Engine zuerst (steht als Prototyp).** Der selbstprüfende Autor-/Prüfer-Kern
   über die Datenbank ist der eigentliche Produktkern und schon lauffähig.
2. **Einbettung über eine Begleit-DLL (A1)**, im X2-Installer mitgeliefert, mit
   WebView2-Panel im X2-Fenster. Kein Byte-Patch der `.exe`.
3. **Lokale Modelle** für Autor und Prüfer, damit keine Kundendaten das Haus
   verlassen.
4. **`.exe` byteweise patchen (A4): nicht.** Höherer Aufwand, schlechteres
   Ergebnis, bricht bei jedem Update.

> Das Neue, das sich verkaufen lässt, ist nicht „X2 hat jetzt auch einen
> Chatbot", sondern: **„X2 hat einen Assistenten, der jede Zahl gegen die echten
> Daten prüft, bevor er sie nennt — und der wahlweise komplett im Haus läuft."**

---

## Quellen (Recherche)

- [5 Ways To Make Use Of AI In Your Windows And Mobile Apps — Embarcadero](https://blogs.embarcadero.com/5-ways-to-make-use-of-ai-in-your-windows-and-mobile-apps/)
- [Awesome-AI-For-Delphi (Python4Delphi, LlamaKit u. a.) — GitHub](https://github.com/GabrielOnDelphi/Awesome-AI-For-Delphi)
- [Integrating Delphi with ChatGPT — DEV Community](https://dev.to/viniciusgdfurtado/integrating-delphi-with-chatgpt-unlocking-ai-powered-conversations-3035)
- [Copilot-Sidecar-Architektur in Dynamics 365 FO (Prüf-/Sidecar-Muster für ERP)](https://d365cliffsnotes.com/demystifying-the-copilot-sidecar-architecture-in-dynamics-365-finance-and-operations-erp-a-solution-architects-guide)
- [Windows-Use — AI-Agent über Windows-UI-Automation — GitHub](https://github.com/CursorTouch/Windows-Use)
