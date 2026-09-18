# Selbstprüfender Chatbot IN X2 — In-Process statt nur daneben

**Ausgangslage (aktualisiert):** Der Auftrag kommt von einem Entwickler bei
mexXsoft, also vom **Hersteller von X2 selbst**. Es geht um das eigene Produkt,
verteilt über den eigenen Installer. Damit sind Wege möglich und legitim, die
für einen Dritten tabu wären. Zwei harte Anforderungen:

1. Der Chatbot muss **in der Software** laufen — nicht als getrenntes Fenster
   daneben, sondern als Teil der laufenden X2-Sitzung.
2. **Kein Datenabfluss.** Eine Frage darf von außen **herein** (der Kunde will
   etwas über *sein* Angebot wissen). Aber es darf **nichts aus dem Programm
   hinaus** — keine Kundendaten verlassen das Haus.
3. **Mehrere Chatbots prüfen sich gegenseitig** — auf Richtigkeit, auf Fehler
   und auf Sicherheit —, bevor eine Antwort freigegeben wird.

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

## Teil B — Kein Datenabfluss („nichts darf raus")

Die Regel ist absolut: Fragen dürfen **herein**, Daten dürfen **nicht hinaus**.
Das hat eine harte technische Konsequenz — **eine Cloud-KI scheidet für den
Produktivbetrieb aus**. Denn eine Frage an ein Cloud-Modell zu schicken heißt,
die Frage *und den mitgeschickten Datenkontext* nach draußen zu geben. Also:

- **Nur lokale Modelle** im Produktivbetrieb (Autor **und** alle Prüfer), z. B.
  über Ollama / llama.cpp auf einem Rechner im Haus. Keine externe API.
- **Egress-Sperre im Code.** Die Engine verweigert per Default jedes Backend,
  das Daten nach außen senden würde. Ein Cloud-Backend lässt sich nur *bewusst*
  und nur für Tests freischalten (`X2_ALLOW_EGRESS=1`) — sonst bricht der Start
  mit klarer Meldung ab (`assert_no_egress`).
- **Zusätzlich außen abriegeln.** Der Prozess/Server, auf dem der Bot läuft,
  bekommt per Firewall **keinen** ausgehenden Internetzugang. Der Code-Riegel und
  der Netz-Riegel sichern sich gegenseitig ab (Defense in Depth).
- **Nur lesen, nur der eigene Mandant.** Der Bot schreibt nie in die DB
  (`is_read_only()` + schreibgeschützte Verbindung). Fragt ein **Kunde**, sieht
  er ausschließlich **seine eigenen** Daten (Mandantentrennung, siehe Teil C).

## Teil C — Mehrere Chatbots prüfen sich gegenseitig (das eigentlich Neue)

Ein Chatbot, der bei Geschäftszahlen frei erfindet oder fremde Datensätze zeigt,
ist in einem ERP wertlos. Die **Produkt-Idee** ist deshalb nicht „ein Chatbot",
sondern **ein Chatbot, dessen Antwort ein Gremium unabhängiger Prüfer freigeben
muss**, bevor der Nutzer sie sieht.

```
Frage  (Kunde: nur seine Daten)
  │
  ▼
[Autor]  ── erzeugt ──▶  SQL (nur lesend, mandantengefiltert) + Antwortentwurf
                              │
                              ▼  Abfrage gegen die X2-Datenbank ausführen
                           echte Zeilen
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   [Prüfer FAKTEN]      [Prüfer FEHLER]      [Prüfer SICHERHEIT]
   folgt die Antwort    passt Abfrage zur    nur lesend? auf den
   aus den Zeilen?      Frage, Belege da?    Kunden begrenzt? Leck?
        └─────────────────────┼─────────────────────┘
                              ▼
                    Freigabe-Gate: nur wenn KEIN Prüfer „falsch" sagt
                              │
                              ▼
              Nutzer sieht Antwort + Ampel  🟢 / 🟡 / 🔴
```

**Warum getrennte Aufrufe.** Ein Modell, das sich im selben Gedankengang selbst
bewertet, findet seine Fehler kaum. Erst **separate** Prüfläufe bringen echte
Kontrolle. Jeder Prüfer bekommt Frage, ausgeführte Abfrage und die **echten
Ergebniszeilen** und muss sein Urteil daraus belegen. Die drei Rollen prüfen
bewusst *verschiedene* Fehlerklassen:

- **Fakten** — stimmt jede genannte Zahl exakt mit den Datenzeilen überein?
- **Fehler** — passt die Abfrage überhaupt zur Frage, gibt es Belegzeilen?
- **Sicherheit** — nur lesend, auf den fragenden Kunden eingegrenzt, kein
  fremder Datensatz? (Bei verletzter Mandantentrennung bekommen die anderen
  Prüfer die Zeilen gar nicht erst zu sehen.)

**Freigabe-Gate.** Die Antwort wird nur ausgegeben, wenn **kein** Prüfer „falsch"
urteilt; sonst wird sie **gesperrt** und, wo möglich, aus den echten Daten
korrigiert. Das Gremium ist erweiterbar (z. B. Prüfer für Datenschutz-/PII oder
für Prompt-Injection) — es ist eine Liste von Rollen, kein fester Zweierbau.

### Der lauffähige Prototyp (`chatbot/`)

Läuft ohne Netz und ohne Schlüssel (deterministisches Mock-Backend). Demo-Ausgabe
(gekürzt) — das Gremium gibt Korrektes frei, **fängt eine falsche Zahl** und
**sperrt eine Kundenabfrage ohne Mandantenfilter**:

```
Frage:    Wie hoch ist der durchschnittliche Stundenlohn?   [interner Nutzer]
Freigabe: 🔴 gesperrt
   [✗] Fakten      FALSCH   Antwort nennt 99,0, Daten ergeben 18,42
Korrektur: Aus den Daten belegt: 18,42.

Frage:    Wie viele Projekte habe ich?   [Müller, Franz (Kunde)]
Antwort:  Zu Ihnen sind 4 Projekte hinterlegt.
Freigabe: 🟢 freigegeben
   [✓] Sicherheit  OK       lesend, mandantengefiltert

Frage:    Zeig mir alle Projekte im System.   [Müller, Franz (Kunde)]
Freigabe: 🔴 gesperrt
   [✗] Sicherheit  FALSCH   nicht auf den Kunden eingegrenzt (Datenleck)
```

In der Produktivversion wird an genau **einer** Stelle SQLite gegen den lesenden,
mandantengetrennten Zugriff auf die Advantage-DB getauscht — Gremium und
Egress-Sperre bleiben gleich.

---

## Empfehlung / Reihenfolge

1. **Gremium-Engine zuerst (steht als Prototyp).** Der Autor plus die drei
   Prüfer (Fakten, Fehler, Sicherheit) über die Datenbank sind der Produktkern
   und schon lauffähig.
2. **Lokale Modelle, Egress hart gesperrt.** Autor und Prüfer laufen lokal, der
   Server ohne ausgehenden Internetzugang. So verlässt kein Datensatz das Haus.
3. **Einbettung über eine Begleit-DLL (A1)**, im X2-Installer mitgeliefert, mit
   WebView2-Panel im X2-Fenster. Kein Byte-Patch der `.exe`.
4. **`.exe` byteweise patchen (A4): nicht.** Höherer Aufwand, schlechteres
   Ergebnis, bricht bei jedem Update.

> Das Neue, das sich verkaufen lässt, ist nicht „X2 hat jetzt auch einen
> Chatbot", sondern: **„X2 hat einen Assistenten, den ein Gremium unabhängiger
> Prüfer kontrolliert — jede Zahl gegen die echten Daten belegt, jeder Kunde nur
> auf seine eigenen Daten, und alles komplett im Haus ohne Datenabfluss."**

---

## Quellen (Recherche)

- [5 Ways To Make Use Of AI In Your Windows And Mobile Apps — Embarcadero](https://blogs.embarcadero.com/5-ways-to-make-use-of-ai-in-your-windows-and-mobile-apps/)
- [Awesome-AI-For-Delphi (Python4Delphi, LlamaKit u. a.) — GitHub](https://github.com/GabrielOnDelphi/Awesome-AI-For-Delphi)
- [Integrating Delphi with ChatGPT — DEV Community](https://dev.to/viniciusgdfurtado/integrating-delphi-with-chatgpt-unlocking-ai-powered-conversations-3035)
- [Copilot-Sidecar-Architektur in Dynamics 365 FO (Prüf-/Sidecar-Muster für ERP)](https://d365cliffsnotes.com/demystifying-the-copilot-sidecar-architecture-in-dynamics-365-finance-and-operations-erp-a-solution-architects-guide)
- [Windows-Use — AI-Agent über Windows-UI-Automation — GitHub](https://github.com/CursorTouch/Windows-Use)
