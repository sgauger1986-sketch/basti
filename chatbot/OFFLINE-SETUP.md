# Offline-Einrichtung — X2-Assistent ganz ohne Internet

Ziel: Autor **und** alle Prüfer laufen mit einem **lokalen** Modell auf einem
Rechner im Haus. Kein Datenabfluss, kein Cloud-Dienst. Getestet mit
[Ollama](https://ollama.com); llama.cpp / LM Studio gehen über den
OpenAI-kompatiblen Modus genauso.

## 0. Ohne alles: der Offline-Selbsttest

Beweist die komplette Kette (Autor + 3 Prüfer + Freigabe) über echtes HTTP auf
localhost, ohne Modell und ohne Netz:

```bash
python3 build_db.py
python3 selfcheck_engine.py --selftest      # erwartet: "SELBSTTEST OK"
```

## 1. Ollama installieren (einmalig, mit Internet)

Nur die Installation und das Laden der Modelle brauchen einmalig Internet. Danach
läuft alles offline. Auf dem Zielrechner am besten vorbereiten und dann trennen.

```bash
# Windows: Installer von ollama.com   |   Linux:
curl -fsSL https://ollama.com/install.sh | sh

ollama pull qwen2.5-coder:7b     # Autor (gut in SQL)
ollama pull qwen2.5:7b           # Prüfer (reicht ein kleineres Modell)
```

Kleinere Rechner: `qwen2.5-coder:3b` bzw. `qwen2.5:3b`. Ab jetzt ist kein
Internet mehr nötig — `ollama serve` läuft lokal auf Port 11434.

## 2. Assistent gegen das lokale Modell starten

```bash
export X2_LLM=local                 # lokales Backend (Standard-URL localhost:11434)
export X2_GEN_MODEL=qwen2.5-coder:7b
export X2_VER_MODEL=qwen2.5:7b
python3 selfcheck_engine.py "Wie viele Projekte gibt es?"
```

Windows (PowerShell): `setx` bzw. `$env:X2_LLM="local"` usw.

## 3. llama.cpp / LM Studio statt Ollama (optional)

```bash
export X2_LOCAL_API=openai
export X2_LOCAL_URL=http://localhost:8080   # llama.cpp-Server / LM Studio
```

## Die eingebauten Sicherungen

- **Egress-Sperre:** Ein Cloud-Backend (`X2_LLM=anthropic`) wird abgewiesen; ein
  `X2_LOCAL_URL`, das nicht auf localhost zeigt, ebenfalls. Aufhebbar nur bewusst
  mit `X2_ALLOW_EGRESS=1` (nur für Tests).
- **Zusätzlich außen:** Dem Rechner per Firewall den ausgehenden Internetzugang
  entziehen — dann kann selbst bei Fehlkonfiguration nichts abfließen.
- **Nur lesen, nur eigener Mandant:** siehe `README.md`.

## Umgebungsvariablen (Übersicht)

| Variable | Default | Zweck |
|---|---|---|
| `X2_LLM` | `mock` | `mock` / `local` / `anthropic` |
| `X2_LOCAL_URL` | `http://localhost:11434` | Endpunkt des lokalen Modells (muss localhost sein) |
| `X2_LOCAL_API` | `ollama` | `ollama` oder `openai` (llama.cpp/LM Studio) |
| `X2_LOCAL_MODEL` | `qwen2.5-coder:7b` | Default-Modell, falls GEN/VER nicht gesetzt |
| `X2_GEN_MODEL` | = `X2_LOCAL_MODEL` | Modell des Autors |
| `X2_VER_MODEL` | = `X2_LOCAL_MODEL` | Modell der Prüfer |
| `X2_LOCAL_TIMEOUT` | `120` | Sekunden pro Modellaufruf |
| `X2_ALLOW_EGRESS` | _(aus)_ | `1` hebt die Egress-Sperre auf (nur Tests) |
