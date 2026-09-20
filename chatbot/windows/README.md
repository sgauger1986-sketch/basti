# Windows — schlüsselfertig einrichten

Diese Skripte machen den X2-Assistenten auf einem Windows-Rechner startklar.
Reihenfolge: erst testen (Mock), dann lokales Modell, dann in X2 einbauen.

## 1. Sofort testen (ohne Modell, ohne Internet)

Voraussetzung: Python 3 installiert (python.org, Haken „Add to PATH").

- Doppelklick auf **`windows\start-demo.bat`**.
- Es baut die Demo-Datenbank, startet den lokalen Dienst und öffnet das Panel im
  Browser (`http://127.0.0.1:8756/`). Frage eintippen, Antwort erscheint mit den
  sechs Prüf-Badges.

## 2. Offline mit echtem lokalem Modell

1. [Ollama](https://ollama.com) installieren, dann einmalig (mit Internet):
   ```
   ollama pull qwen2.5-coder:7b
   ollama pull qwen2.5:7b
   ```
2. Bei Bedarf `windows\run-service.bat` oben anpassen (Modellnamen/Port).
3. Als Dauerbetrieb einrichten (Autostart bei Anmeldung), PowerShell als Admin:
   ```
   powershell -ExecutionPolicy Bypass -File windows\install-service.ps1
   ```
4. Zweiter Riegel „nichts darf raus" (Firewall), PowerShell als Admin:
   ```
   powershell -ExecutionPolicy Bypass -File windows\firewall-no-egress.ps1
   ```

## 3. In X2 einbauen (Panel im X2-Fenster)

Voraussetzung: Delphi 10.4+ und die Microsoft **WebView2-Runtime**.

1. Delphi-Umgebung laden (`rsvars.bat` des BDS ausführen), dann:
   ```
   x2host\build-delphi.bat
   ```
   erzeugt `X2Companion.exe`, `X2Dock.exe`, `x2ai.dll`, `x2inject.exe`.
2. In `x2host\X2Dock.dpr` (bzw. `x2ai.dpr`) vor dem Bauen eintragen:
   - `X2_EXE` = Pfad zu eurer `X2.exe`
   - `X2_MAINCLASS` = Fensterklasse des X2-Hauptfensters (mit „Spy++" auslesen)
3. `WebView2Loader.dll` neben `X2Companion.exe` legen.
4. **Weg A (empfohlen):** künftig `X2Dock.exe` statt `X2.exe` starten — es öffnet
   X2 und dockt das Panel rechts an. Verknüpfung im Startmenü darauf zeigen.
   **Weg B (in-process):** `x2inject.exe` starten — lädt `x2ai.dll` in den
   X2-Prozess und dockt von innen an.

Details und Hintergründe: `..\EINBAU-IN-EXE.md`.

## Was hier (Linux-Container) nicht getestet werden konnte

Die `.bat`/`.ps1`/`.dpr`-Dateien laufen nur unter Windows bzw. brauchen Delphi;
sie sind hier geschrieben, aber nicht ausführbar. Die Python-Kette (Engine,
Dienst, Panel, Guard-Tests, Offline-Selbsttest) ist dagegen getestet und grün.
