# Chatbot in X2 einbauen — ohne Delphi-Quellcode

**Frage:** Wie bekomme ich einen Chatbot in die X2-Anwendung, wenn nur die
kompilierte `.exe` vorliegt und kein Delphi-Quellcode?

**Kurze, ehrliche Antwort zuerst:** Einen Chatbot _sauber in die kompilierte
`.exe` hinein_ zu bauen, geht ohne Quellcode praktisch **nicht** — ein fertiges
Programm lässt sich nicht wie ein Textdokument aufmachen und um eine Funktion
ergänzen. Was aber sehr gut geht: den Chatbot **direkt neben** X2 laufen zu
lassen, so dass er sich für den Nutzer wie ein Teil des Programms anfühlt. Das
ist der übliche, bewährte Weg für Alt-Software ("Sidecar"- bzw.
"Companion"-Architektur) und braucht **keinen einzigen Eingriff in die `.exe`**.

Und der wichtigste Punkt für genau diese Situation: Der Chatbot wird erst dann
wirklich nützlich, wenn er **die X2-Daten kennt** — und die liegen vollständig
vor (Advantage-Datenbank, siehe `datenbank-schema/`). Genau das ist hier schon
angefangen: Die Werkzeuge unter `tools/` lesen die Datenbank bereits aus.

---

## Die vier möglichen Wege — von "empfohlen" bis "Finger weg"

| Weg | Eingriff in .exe | Aufwand | Robust? | Empfehlung |
|---|---|---|---|---|
| 1. Companion-Fenster daneben | keiner | mittel | ja | **Empfohlen** |
| 2. Chatbot in der Cloud-/Streaming-Variante | keiner | gering | ja | **Sofort machbar** |
| 3. Overlay per UI-Automation / OCR | keiner (nur Lesen) | hoch | fragil | nur als Ergänzung |
| 4. `.exe` patchen / Ressourcen injizieren | massiv | sehr hoch | nein | **Nicht empfehlen** |

---

## Weg 1 — Companion-Fenster daneben (die eigentliche Empfehlung)

Ein **eigenständiges kleines Programm** läuft parallel zu X2 und dockt als
Chatfenster an den Bildschirmrand (oder schwebt als kleines Fenster über X2). Der
Nutzer tippt seine Frage, der Bot antwortet — X2 selbst bleibt unangetastet.

**Was der Bot beantworten kann, hängt davon ab, worauf er zugreift:**

- **Datenbank (das Wertvollste).** Der Bot liest dieselbe Advantage-Datenbank wie
  X2 und beantwortet Fachfragen: _"Wie viele offene Angebote hat Kunde Müller?"_,
  _"Zeig mir die letzten 5 Rechnungen über 10.000 €"_, _"Welche Positionen im LV
  Projekt 2024-17 haben keinen Einheitspreis?"_. Technisch: Der Bot bekommt das
  Datenbankschema (liegt in `datenbank-schema/` schon dokumentiert), ein
  Sprachmodell übersetzt die Frage in eine SQL-Abfrage (Text-to-SQL), führt sie
  **nur lesend** aus und formuliert die Antwort. Das ist mit den vorhandenen
  Tools (`tools/adt_read.py`, `tools/adt_schema.py`) direkt anschlussfähig.
- **Bedienungshilfe.** Der Bot beantwortet _"Wie lege ich ein neues Aufmaß an?"_
  aus einer eingelesenen Anleitung/Doku (RAG — der Bot durchsucht die Handbücher
  und antwortet daraus). Braucht nicht einmal Datenbankzugriff.

**Womit gebaut:**

- **Python** — passt am besten, weil die Datenbank-Werkzeuge dieses Projekts
  schon Python sind. Chat-Fenster z. B. mit einer schlanken Web-Oberfläche
  (läuft lokal, öffnet sich als eigenes Fenster).
- **Delphi selbst** — man _kann_ das Companion-Fenster auch in Delphi neu bauen
  (das ist ein **neues, kleines** Programm mit eigenem Quellcode — es hat nichts
  mit dem verlorenen X2-Quellcode zu tun). Fertige Bausteine dafür:
  **Python4Delphi (P4D)**, der **SmartCore AI Components Pack** oder eine
  **OpenAI-Delphi-Bibliothek**.
- **C# / .NET oder Electron** — genauso möglich, wenn das Team damit vertrauter
  ist.

**Anbindung an ein KI-Modell** — zwei Varianten:

- **Cloud-Modell** (OpenAI, Anthropic Claude, Azure OpenAI): stärkste
  Antworten, aber Kundendaten verlassen das Haus → **nur mit sauberem Datenschutz
  (AVV, EU-Hosting)** und am besten so, dass echte Kundendaten anonymisiert oder
  gar nicht mitgeschickt werden.
- **Lokales Modell** (z. B. via `llama.cpp` / Ollama, für Delphi gibt es
  **LlamaKit** mit fertigen Windows-DLLs): läuft komplett auf dem eigenen Server,
  **keine Daten nach draußen**, kostenlos im Betrieb — dafür etwas schwächer und
  braucht Rechenleistung. Für ein ERP mit sensiblen Kundendaten oft die bessere
  Wahl.

---

## Weg 2 — Chatbot in der Cloud-/Streaming-Variante (sofort machbar)

Sobald X2 wie in `CLOUD-STRATEGIE.md` (Phase 1) im Browser gestreamt wird
(Thinfinity, Guacamole/RDS), ist der Chatbot **trivial**: Er ist einfach ein
**zweites Panel neben dem gestreamten X2-Fenster im Browser** — eine ganz normale
Web-Chat-Komponente. Kein Eingriff in die `.exe`, weil die ganze Oberfläche
ohnehin im Browser zusammengesetzt wird. Wer also die Streaming-Cloud aufsetzt,
bekommt den "Chatbot neben X2" quasi geschenkt.

Das gilt genauso für die **echte Web-Version** (Phase 2 / den Prototyp unter
`prototyp/`): Dort ist ein Chat-Panel von vornherein einplanbar.

---

## Weg 3 — Overlay per UI-Automation / OCR (nur als Ergänzung)

Es gibt Werkzeuge, die den **Bildschirminhalt einer fremden Anwendung auslesen** —
über die Windows-UI-Automation-Schnittstelle oder per **OCR** (Text aus dem Bild
erkennen). Damit "sieht" ein Assistent, was gerade in X2 auf dem Schirm steht, und
kann sich darauf beziehen (_"Zu diesem Kunden gibt es 3 offene Posten"_) oder
sogar Klicks/Eingaben automatisieren.

- **Werkzeuge:** UI-Automation-Bibliotheken, Tesseract-OCR, fertige Ansätze wie
  "Windows-Use" oder "AI Cowork".
- **Vorteil:** Kein Datenbankzugriff nötig, reagiert auf den aktuellen Bildschirm.
- **Nachteil (wichtig):** **fragil.** Delphi-VCL-Masken und eigengezeichnete
  Tabellen liefern der UI-Automation oft wenig verwertbare Struktur, dann bleibt
  nur OCR — und das bricht, sobald sich Layout, Auflösung oder Schriftgröße
  ändern. Als _alleinige_ Lösung unzuverlässig; sinnvoll höchstens **ergänzend**
  zu Weg 1 (Datenbank ist die verlässliche Quelle, der Bildschirm nur der
  Kontext, "welcher Datensatz gerade offen ist").

---

## Weg 4 — Die `.exe` selbst patchen (nicht empfehlen)

Theoretisch lassen sich in eine Delphi-`.exe` die Formular-Ressourcen (DFM)
verändern oder Code per DLL-Injection einschleusen. In der Praxis heißt das:
Reverse Engineering, extrem fehleranfällig, bei jedem Update wieder von vorn, und
ein einziger Fehler legt das Programm lahm. Für ein produktiv genutztes ERP mit
Kundendaten ist das **keine verantwortbare Option**. Der Aufwand ist höher als der
für ein sauberes Companion-Fenster (Weg 1) — bei viel schlechterem Ergebnis.

---

## Empfehlung

1. **Jetzt:** Ein **Companion-Chatfenster mit Datenbank-Zugriff** (Weg 1) auf
   Basis der schon vorhandenen Python-Datenbank-Werkzeuge bauen. Startklein: ein
   Bot, der Fragen zu den X2-Daten lesend beantwortet. **Lokales Modell**
   bevorzugen, damit keine Kundendaten das Haus verlassen.
2. **Parallel:** Sobald die Streaming-/Web-Variante steht (`CLOUD-STRATEGIE.md`),
   den Chatbot dort als Browser-Panel neben X2 einhängen (Weg 2) — dann ist er für
   alle Kunden zentral verfügbar.
3. **Weg 3 (Bildschirm-Kontext)** nur ergänzend, **Weg 4 (.exe patchen)** gar
   nicht.

> Kernaussage: Das Ziel "Chatbot in X2" ist **ohne Quellcode erreichbar** — nicht
> _in_ der `.exe`, sondern als eigenständiger Begleiter **daneben**, der die
> vorhandene Datenbank kennt. Genau die Bausteine dafür (Datenbankschema +
> Lesewerkzeuge) liegen in diesem Repo bereits.

---

## Quellen (Recherche)

- [Adding AI chat to a desktop app — JxBrowser Blog (Overlay-/Companion-Prinzip)](https://teamdev.com/jxbrowser/blog/embedding-ai-assistant-java-desktop/)
- [Copilot-Sidecar-Architektur in Dynamics 365 FO (Sidecar-Muster für ERP)](https://d365cliffsnotes.com/demystifying-the-copilot-sidecar-architecture-in-dynamics-365-finance-and-operations-erp-a-solution-architects-guide)
- [5 Ways To Make Use Of AI In Your Windows And Mobile Apps — Embarcadero](https://blogs.embarcadero.com/5-ways-to-make-use-of-ai-in-your-windows-and-mobile-apps/)
- [SmartCore AI Components Pack — Embarcadero](https://blogs.embarcadero.com/introducing-the-smartcore-ai-components-pack/)
- [Integrating Delphi with ChatGPT — DEV Community](https://dev.to/viniciusgdfurtado/integrating-delphi-with-chatgpt-unlocking-ai-powered-conversations-3035)
- [Awesome-AI-For-Delphi (P4D, LlamaKit u. a.) — GitHub](https://github.com/GabrielOnDelphi/Awesome-AI-For-Delphi)
- [Windows-Use — AI-Agent über Windows-UI-Automation — GitHub](https://github.com/CursorTouch/Windows-Use)
- [AI Cowork — Screen-Aware Assistant mit OCR](https://sami-fd.github.io/ai-cowork/)
