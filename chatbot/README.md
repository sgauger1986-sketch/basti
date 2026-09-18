# chatbot/ — Selbstprüfender X2-Assistent mit Prüfgremium (Prototyp)

Lauffähiger Kern der Produktidee für mexXsoft: ein Chatbot für X2, dessen
Antworten ein **Gremium mehrerer unabhängiger Prüfer** freigeben muss, der
**keine Daten nach außen gibt** und bei Kundenfragen **nur die Daten des
fragenden Kunden** zeigt. Gesamtstrategie und Einbettung in X2 (In-Process-DLL):
`../CHATBOT-IN-EXE-PATCH.md`.

## Schnellstart

```bash
cd chatbot
python3 build_db.py          # 1x: baut x2demo.sqlite aus den echten Demo-Daten
python3 selfcheck_engine.py  # Demo: interne + Kundenfragen, mit Prüfgremium
python3 selfcheck_engine.py "Wie viele Projekte gibt es?"
```

Läuft **ohne Netz und ohne API-Schlüssel** (deterministisches Mock-Backend).

## Die zwei Kernregeln

**1. Nichts darf raus (kein Datenabfluss).**
Fragen dürfen herein, Daten nicht hinaus. Deshalb ist der Produktivbetrieb nur
mit **lokalen** Modellen vorgesehen. Ein Backend, das Daten nach außen schickt
(Cloud-API), wird per Default **verweigert**:

```bash
X2_LLM=anthropic python3 selfcheck_engine.py "test"
# -> ABGEBROCHEN: AnthropicBackend wuerde Daten nach aussen senden ...
```

Nur bewusst für Tests aufhebbar mit `X2_ALLOW_EGRESS=1`. Im Echtbetrieb kommt
zusätzlich eine Firewall ohne ausgehenden Internetzugang dazu (Defense in Depth).

**2. Mehrere Chatbots prüfen sich gegenseitig.**
Nach dem Autor prüfen drei unabhängige Rollen den Antwortentwurf gegen die echten
Datenzeilen, jede auf eine andere Fehlerklasse:

| Prüfer | prüft |
|---|---|
| **Fakten** | Stimmt jede genannte Zahl exakt mit den Datenzeilen? |
| **Fehler** | Passt die Abfrage zur Frage, gibt es Belegzeilen? |
| **Sicherheit** | Nur lesend? Auf den fragenden Kunden eingegrenzt? Kein Leck? |

**Freigabe-Gate:** Die Antwort wird nur ausgegeben, wenn **kein** Prüfer „falsch"
sagt; sonst 🔴 gesperrt (und wo möglich aus den Daten korrigiert). Das Gremium
ist eine Liste (`REVIEWERS`) und leicht erweiterbar (z. B. PII-/Injection-Prüfer).

## Dateien

- `build_db.py` — baut die schreibgeschützte SQLite-DB aus den echten Demo-Daten
  (`../prototyp/x2-cloud-prototyp.html`). Produktiv: lesender, mandantengetrennter
  Zugriff auf die Advantage-DB von X2 an derselben Stelle.
- `selfcheck_engine.py` — Autor, drei Prüfer, Freigabe-Gate, Egress-Sperre,
  Mandantentrennung.

## Backend & Modelle

| Umgebungsvariable | Wirkung |
|---|---|
| _(nichts)_ | `MockBackend` — deterministisch, offline, für die Demo |
| `X2_LLM=local` | lokales Modell (Ollama/llama.cpp) — **die Produktivvariante**, hier anzubinden |
| `X2_LLM=anthropic` | Cloud-Claude — **gesperrt**, nur mit `X2_ALLOW_EGRESS=1` für Tests |

Modelle: `X2_GEN_MODEL` (Autor), `X2_VER_MODEL` (Prüfer).

## Was die Demo zeigt

Fünf Fälle, u. a.:
- interne Zählfragen → 🟢 freigegeben, Zahl belegt;
- falscher Stundenlohn (99,00) → 🔴 **Fakten** sperrt, korrigiert auf 18,42;
- Kunde „Müller, Franz" fragt nach *seinen* Projekten → 🟢, mandantengefiltert (4);
- derselbe Kunde will **alle** Projekte → 🔴 **Sicherheit** sperrt (Datenleck).

## Sicherheit (erzwungen, nicht nur erbeten)

- Nur einzelne lesende `SELECT`/`WITH`-Abfragen; alle schreibenden/DDL-Befehle und
  Mehrfach-Anweisungen werden abgewiesen (`is_read_only`), Verbindung
  schreibgeschützt (`open_readonly`).
- Kundenabfragen müssen die Kunden-ID enthalten, sonst sperrt der
  Sicherheitsprüfer und die Zeilen werden gar nicht erst weitergereicht
  (`is_tenant_scoped`).
- Cloud-Backends sind ohne ausdrückliche Freigabe blockiert (`make_backend`).
