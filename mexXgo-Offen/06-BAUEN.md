# Bauen und Ausprobieren

---

## 1 Die App bauen

```bash
cd mexXgo-Entwurf-APK
./build.sh
```

Ergebnis: `bau/mexXgo-Entwurf.apk` (rund 320 kB).

**Bewusst ohne Gradle.** `build.sh` ruft aapt2, javac, d8, zipalign und
apksigner direkt aus dem Android‑SDK auf. Das hält den Bau durchschaubar und
frei von Fremdbibliotheken — passend zur Regel „eine Sprache" aus
`03-FAHRPLAN.md`.

Voraussetzungen:

| | |
|---|---|
| Android‑SDK | `$ANDROID_HOME`, sonst `~/Library/Android/sdk` |
| Build‑Tools | 36.0.0 |
| Plattform | android‑36 |
| JDK | 21 — liegt unter `werkzeuge/jdk` bei und wird automatisch genommen, wenn `JAVA_HOME` leer ist |

### Zwei Dinge, die man nicht ändern darf

**Der Signierschlüssel liegt in `schluessel/`, nicht in `bau/`.** `bau/` wird bei
jedem Lauf geleert. Ein wechselnder Schlüssel macht jede Aktualisierung auf dem
Gerät unmöglich (`INSTALL_FAILED_UPDATE_INCOMPATIBLE`).

**Keine Lambda‑Ausdrücke im Quellcode.** `javac` mit
`-bootclasspath android.jar` kann sie nicht übersetzen — die
`LambdaMetafactory` fehlt. Immer anonyme Klassen.

Aufs Gerät:

```bash
adb install -r bau/mexXgo-Entwurf.apk
```

---

## 2 Den ganzen Ablauf ausprobieren

Drei Fenster. Der Prüfstand ersetzt den Vermittler; er ist nur zum
Ausprobieren da und prüft keine Kennwörter.

```bash
cd mexXgo-Offen/beispiel
```

**Fenster 1 — der Prüfstand.** `0.0.0.0`, damit auch der Emulator herankommt:

```bash
python3 pruefstand.py --port 8899 --adresse 0.0.0.0
```

**Fenster 2 — die Zentrale:**

```bash
python3 zentrale_beispiel.py betrieb --server 127.0.0.1 --port 8899 \
    --firma 0000999 --station 0 --datenbank beispiel_daten.sqb
```

**Fenster 3 — ein Gerät.** Entweder das Beispielprogramm:

```bash
python3 geraet_beispiel.py --server 127.0.0.1 --port 8899 \
    --firma 0000999 --station 1 --rapport
```

… oder die echte App (siehe Abschnitt 3).

Jede Zeile, die über die Leitung geht, steht in allen drei Fenstern auf der
Konsole. So sieht das aus: `04-MITSCHNITT.md`.

---

## 3 Die echte App gegen den Prüfstand

Der Emulator erreicht den Rechner unter **`10.0.2.2`**, nicht unter
`127.0.0.1`. Einrichtungsverweis erzeugen:

```bash
python3 - <<'EOF'
import base64, hashlib, json
d = {"server": "10.0.2.2", "port": 8899, "firma": "0000999", "station": 1,
     "pw": hashlib.sha1(b"").hexdigest().upper(), "name": "Prüfstand-Gerät"}
b64 = base64.urlsafe_b64encode(json.dumps(d).encode()).decode().rstrip("=")
print("mxgo://einrichten?d=" + b64)
EOF
```

Und abfeuern:

```bash
adb shell am start -a android.intent.action.VIEW -d "<der Verweis>" com.mexxsoft.mexxgo
```

Danach zeigt der Prüfstand `Connect`, `Login`, `$F000`, `$F001` und den
2‑Sekunden‑Takt. Startet man jetzt Fenster 2, kommen die Projekte auf dem
Bildschirm an.

### Voreinstellungen der App

| | |
|---|---|
| Port | 8080 (Klartext) — wie `mxWebZentrale.exe` |
| Klartext | erlaubt (`usesCleartextTraffic="true"`) |
| TLS | sobald ein Zertifikats‑Fingerabdruck gesetzt ist oder Port 7443 gewählt wird |

---

## 4 Gegen den echten Vermittler

Nur anmelden — unschädlich, weil es ausschließlich liest:

```bash
python3 zentrale_beispiel.py anmelden --server 82.165.182.81 --firma 0000999
```

> **`ReceiveMessage` niemals gegen den Produktivserver.** Der Aufruf holt eine
> Nachricht aus der Warteschlange und nimmt sie damit der laufenden
> Kunden‑Zentrale weg — das ist ein Datenverlust bei einem echten Kunden.
> `zentrale_beispiel.py betrieb` fragt deshalb nach, wenn der Server nicht
> `127.0.0.1` ist.

---

## 5 Prüfen, ob der Fahrplan noch eingehalten wird

Beide Ausgaben müssen leer bleiben:

```bash
cd mexXgo-Entwurf-APK/app/java/com/mexxsoft/mexxgo
grep -n "0x[0-9A-Fa-f]\{8\}" $(ls *.java | grep -v '^UI.java$')
grep -n "setTextSize" $(ls *.java | grep -v -e '^UI.java$' -e '^Bilder.java$')
```

Ausnahmen, die richtig sind: `UI.java` — dort **gehören** die Farbwerte und die
Schriftstufen hin. Und `Bilder.java`, wo `setTextSize` auf einem `Paint` in
Pixeln arbeitet, um in ein Bild zu schreiben; das ist keine Oberflächenschrift.

---

## 6 Ordner in diesen Unterlagen

```
mexXgo-Offen/
  00-LIESMICH.md          Einstieg und Wegweiser
  01-ARCHITEKTUR.md       wer spricht mit wem
  02-SCHNITTSTELLE.md     das Protokoll, byte-genau
  03-FAHRPLAN.md          die verbindlichen Regeln der App
  04-MITSCHNITT.md        eine echte Sitzung, Zeile für Zeile
  05-APP-AUFBAU.md        welche Datei was tut
  06-BAUEN.md             dieses Dokument
  beispiel/
    zentrale_beispiel.py  Vorlage für die spätere Zentrale
    geraet_beispiel.py    Vorlage für ein Gerät
    pruefstand.py         winziger Vermittler zum Ausprobieren
    weiterleiter.py       schneidet mit, was die App wirklich sendet
    beispiel_daten.sqb    kleine Datenbank im X2-Schema
    log_pruefstand.txt    Rohprotokoll: was der Vermittler gesehen hat
    log_zentrale.txt      Rohprotokoll: die Zentrale
    log_geraet.txt        Rohprotokoll: das Beispiel-Gerät
    log_android_app.txt   Rohprotokoll: die ECHTE Android-App
```
