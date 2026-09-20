# Einbau in X2 — vom geprüften Assistenten zum Panel in der .exe

Diese Anleitung zeigt konkret, wie der geprüfte Assistent **in X2** landet, ohne
die `X2.exe` byteweise zu verändern. Sie setzt auf den Teilen dieses Ordners auf:
der Pruef-Engine (`selfcheck_engine.py`), dem lokalen Dienst (`serve.py`) und dem
Chat-Panel (`panel/index.html`).

## Das Gesamtbild

```
        X2-Prozess / X2-Fenster
   ┌───────────────────────────────────┐
   │  X2 (unverändert)   │  Chat-Panel  │   <- WebView2 zeigt panel/index.html
   │                     │  (WebView2)  │
   └─────────────────────┴──────┬───────┘
                                │ HTTP nur auf 127.0.0.1
                                ▼
                        serve.py  (lokaler Dienst)
                                │
                                ▼
                  selfcheck_engine.py  (Autor + 6 Prüf-Bots)
                                │  nur lesend, mandantengetrennt
                                ▼
                  Advantage-DB von X2   (kein Internet)
```

Drei bewegliche Teile, alle lokal, kein Datenabfluss:
1. **Dienst + Engine** (Python) — läuft als lokaler Windows-Dienst/Autostart.
2. **Panel** — HTML/JS, wird vom Dienst ausgeliefert.
3. **Die Hülle in X2** — ein WebView2, das das Panel anzeigt, an X2 angedockt.

Teil 1 und 2 laufen und sind getestet (`python serve.py`, dann
`http://127.0.0.1:8756/`). Teil 3 sind die Delphi-Vorlagen in `x2host/`, die auf
dem Windows-Rechner gebaut werden.

## Drei Wege, das Panel an X2 zu bringen (empfohlen zuerst)

| Weg | Mechanik | Eingriff in .exe | Robust | Dateien |
|---|---|---|---|---|
| **A. Andocken (SetParent)** | Begleit-Fenster wird ins X2-Fenster gehängt | keiner | **ja** | `X2Companion.dpr` + `X2Dock.dpr` |
| **B. In-Process-DLL** | DLL wird in den X2-Prozess geladen, dockt von innen an | keiner (nur Laufzeit) | ja | `x2inject.dpr` + `x2ai.dll` |
| **C. Byte-Patch** | Ressourcen/Import der .exe ändern | massiv | nein | — (nicht empfohlen) |

**Empfehlung: Weg A.** Er ist am robustesten, überlebt X2-Updates und braucht
keine Injektion. Der Nutzer startet künftig `X2Dock.exe` statt `X2.exe` direkt;
der Installer legt die Verknüpfung entsprechend an. Weg B, wenn der Assistent
zwingend im selben Prozess laufen soll. Weg C nie.

## Weg A — Schritt für Schritt

**1. Voraussetzungen auf dem Windows-Rechner**
- Delphi 10.4+ (enthält `TEdgeBrowser`).
- Microsoft Edge **WebView2-Runtime** (Evergreen) installiert; `WebView2Loader.dll`
  neben die Companion-Exe legen.
- Python (für Dienst + Engine) und das lokale Modell (siehe `OFFLINE-SETUP.md`).

**2. Dienst starten (lokal, offline)**
```
python build_db.py       # bzw. produktiv: Anbindung an die Advantage-DB
python serve.py          # http://127.0.0.1:8756/
```
Im Betrieb läuft `serve.py` als Autostart oder Windows-Dienst (z. B. per NSSM),
gebunden nur an 127.0.0.1.

**3. X2s Fensterklasse ermitteln** (einmalig, für `X2Dock.dpr`)
- Entfällt: `X2Dock.dpr` und `x2ai.dpr` finden das X2-Hauptfenster automatisch
  über den Prozess (größtes sichtbares Top-Level-Fenster von `X2.exe`).
- Nur der Pfad `X2_EXE` in `X2Dock.dpr` ist einzutragen.

**4. Bauen**
```
dcc32 X2Companion.dpr     # erzeugt das WebView2-Fenster (zeigt das Panel)
dcc32 X2Dock.dpr          # Launcher: startet X2 + Companion und dockt an
```

**5. Ausrollen**
- Im X2-Installer mitliefern: `X2Dock.exe`, `X2Companion.exe`,
  `WebView2Loader.dll`, der Python-Dienst (als Dienst eingerichtet) und das
  lokale Modell.
- Startmenü/Desktop-Verknüpfung auf `X2Dock.exe` zeigen lassen.

## Weg B — In-Process (nur wenn nötig)

`x2inject.dpr` startet X2 angehalten, injiziert `x2ai.dll` (LoadLibrary im
Zielprozess) und lässt X2 weiterlaufen. Die DLL macht in `DllMain` dasselbe
Andocken wie `X2Dock`, nur aus dem X2-Prozess heraus. Die `X2.exe` auf der Platte
bleibt unverändert. Weil Injektion von Virenschutz beargwöhnt wird: DLL signieren
(es ist eure eigene Software) und die Schutzsoftware entsprechend einstellen.

## Was ich hier bauen/testen konnte — und was nicht

- **Getestet und lauffähig:** die Engine, der lokale Dienst (`serve.py`) und das
  Panel (`panel/index.html`) — Anfragen liefern das geprüfte Ergebnis mit allen
  sechs Bots, Mandanten-Leck und Injektion werden gesperrt.
- **Vorlage, auf dem Windows-Rechner zu bauen:** die Delphi-Dateien in `x2host/`.
  Sie brauchen Delphi, die WebView2-Runtime und die echte `X2.exe` und lassen
  sich hier (Linux, kein Delphi) nicht kompilieren. Die mit `TODO` markierten
  Stellen (Pfade, Fensterklasse) sind am Zielsystem einzutragen.

## Sicherheit bleibt erhalten

Egal welcher Weg: Das Panel spricht nur mit `127.0.0.1`, die Engine liest die DB
nur, grenzt Kundenfragen auf den Mandanten ein und lässt jede Antwort durch die
sechs Prüf-Bots laufen. Der Einbau ändert daran nichts — er stellt nur das
Fenster bereit.
