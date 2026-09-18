# chatbot/ — Selbstprüfender X2-Assistent (Prototyp)

Lauffähiger Kern der Produktidee: ein Chatbot für X2, dessen Antworten von einem
**zweiten, unabhängigen Modell** gegen die echten Daten geprüft werden, bevor der
Nutzer sie sieht. Die Gesamtstrategie (Einbettung als In-Process-DLL in X2,
Datenschutz-Varianten) steht in `../CHATBOT-IN-EXE-PATCH.md`.

## Schnellstart

```bash
cd chatbot
python3 build_db.py          # 1x: baut x2demo.sqlite aus den echten Demo-Daten
python3 selfcheck_engine.py  # Demo-Fragen inkl. Selbstprüfung
python3 selfcheck_engine.py "Wie viele Projekte gibt es?"
```

Läuft **ohne Netz und ohne API-Schlüssel** (deterministisches Mock-Backend).

## Dateien

- `build_db.py` — liest das eingebettete Datenpaket aus
  `../prototyp/x2-cloud-prototyp.html` und schreibt eine **schreibgeschützte**
  SQLite-DB `x2demo.sqlite`. In der Produktivversion tritt hier der lesende
  Zugriff auf die Advantage-DB von X2 an dieselbe Stelle.
- `selfcheck_engine.py` — der Autor-/Prüfer-Ablauf:
  1. **Autor** (Modell A): Frage → lesende SQL-Abfrage + Antwortentwurf.
  2. Abfrage **nur lesend** ausführen (Schreibschutz erzwungen).
  3. **Prüfer** (Modell B): rechnet die Antwort gegen die echten Zeilen nach →
     Urteil 🟢/🟡/🔴 (+ Korrektur).

## Backend umschalten

| Umgebungsvariable | Wirkung |
|---|---|
| _(nichts)_ | `MockBackend` — deterministisch, offline, für die Demo |
| `X2_LLM=anthropic` | echtes Claude über das Anthropic-SDK (`pip install anthropic`, `ANTHROPIC_API_KEY` oder `ant auth login`) |
| `X2_LLM=local` | Platzhalter für ein **lokales** Modell (Ollama/llama.cpp) — anbinden, wenn keine Daten das Haus verlassen dürfen |

Modelle wählbar über `X2_GEN_MODEL` (Autor, Default `claude-opus-5`) und
`X2_VER_MODEL` (Prüfer, Default `claude-sonnet-5`).

## Was die Demo zeigt

Drei korrekte Antworten (🟢, jeweils durch die Abfrage belegt) und eine
**absichtlich falsche** vierte Antwort zum Stundenlohn, die der Prüfer fängt
(🔴) und aus den echten Daten korrigiert (18,42 statt 99,00). Genau dieser
Gegencheck ist der Kern des Produkts.

## Sicherheit

- Nur einzelne, lesende `SELECT`/`WITH`-Abfragen; mehrfache Anweisungen und alle
  schreibenden/DDL-Befehle (`INSERT`, `UPDATE`, `DROP`, `PRAGMA` …) werden
  abgewiesen (`is_read_only()`).
- Die DB-Verbindung ist schreibgeschützt geöffnet (`open_readonly()`,
  `mode=ro` + `PRAGMA query_only`).
- Der Bot kann X2-Daten also **lesen, aber nie verändern**.
