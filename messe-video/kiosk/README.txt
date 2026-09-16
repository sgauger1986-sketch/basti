MexXsoft Messevideo – Bildschirmschoner / Kiosk (Windows)
=========================================================

Start:      MexXsoft-Messevideo.exe doppelklicken.
            Das Video läuft sofort im Vollbild in Dauerschleife, ohne Ton, Mauszeiger versteckt.

Beenden:    Beliebige Taste drücken oder klicken -> PIN-Feld erscheint.
            PIN eingeben (Standard: 0000) -> Programm schließt sich.
            Ohne Eingabe verschwindet das PIN-Feld nach 20 Sekunden wieder.
            Alt+F4 und Esc beenden das Programm NICHT.

Modus in config.json: "cards" (Standard, ohne Kamera: Video + Karten), "attract" (Kamera-Spiegel,
            wenn eine Kamera ein Bild liefert, sonst automatisch Karten), "video" (nur Video).

Spiegel-Modus ("mode": "attract"):
            Ist eine Webcam angeschlossen (Laptop-Kamera reicht), zeigt der Bildschirm im
            Wechsel 25 Sekunden das LIVE-Spiegelbild der Passanten mit wechselnden Sprüchen
            ("Sie da! Ja, Sie.", "Wo ist Ihr Bagger gerade?") und danach einmal das Video.
            Bewegt sich jemand vor der Kamera, erscheint groß "HALLO!" / "JA, SIE!".
            Liefert die Kamera kein Bild (z. B. virtueller Kameratreiber), schaltet das Programm nach
            2 Sekunden von selbst auf die Karten um.
            Kamera oben am Monitor befestigen, Richtung Gang. Ohne Webcam läuft nur das Video.
            "mirrorSeconds": Dauer der Spiegelphase (5–120). "videoSeconds": nach so vielen Sekunden Video
            zurück zum Spiegel, das Video läuft danach an der Stelle weiter (0 = immer komplett).
            "punchlines": eigene Sprüche als
            Liste, z. B. ["Sie da!", "Noch Excel?"]. "mode": "video" schaltet den Spiegel ab.
            Windows: Einstellungen -> Datenschutz -> Kamera -> Zugriff für Desktop-Apps erlauben.

PIN ändern: config.json neben der .exe öffnen und "pin" anpassen (z. B. "1234").

Ohne Webcam (Karten-Modus, automatisch):
            Gibt es keine Kamera, zeigt das Programm nach jeweils 60 s Video ("videoSeconds")
            22 s lang drei Karten ("cardsSeconds"): Schätzfrage -> Auflösung -> Knall-Karte
            ("E-Rechnung? mexXsoft ist bereit.", "Wo ist Ihr Bagger gerade? INFLEET weiß es." ...).
            Optional "demoIntervalMinutes": 10 -> statt der Knall-Karte ein Countdown "Nächste
            Vorführung in 03:12" (auch als Plakette oben rechts im Video). Standard: 0 = aus.
            Eigene Fragen: "quiz": [{"q": "Frage?", "a": "Antwort."}, ...]

Zu dunkel?  In config.json "brightness" erhöhen: 1.2 = 20 % heller, 1.5 = 50 % heller
            (gilt für Video und Spiegelbild). Zusätzlich am Monitor Helligkeit/Kontrast hochdrehen
            und einen Bildmodus wie "Dynamisch"/"Lebhaft" statt "Kino"/"Eco" wählen.

Ränder abgeschnitten?
            Fehlen links/rechts oder oben/unten Bildteile (z. B. Chips oder die Web-Adresse
            unten rechts), schneidet der Fernseher das Bild ab ("Overscan").
            Abhilfe 1: Im TV-Menü das Bildformat auf "Just Scan", "1:1", "Bildschirmanpassung"
                       oder "Overscan aus" stellen (bei PC-Monitoren: "Auto-Anpassung" / 1:1).
            Abhilfe 2: In config.json neben der .exe "scale" auf 0.9 setzen (Video wird auf
                       90 % verkleinert, Rand bleibt frei). Werte 0.5 bis 1 sind erlaubt.

Video tauschen:
            Eine Datei "video.mp4" neben die .exe legen (wird bevorzugt) oder in
            config.json unter "video" einen Dateinamen eintragen.

Autostart:  Verknüpfung der .exe in den Autostart-Ordner legen:
            Win+R -> shell:startup -> Verknüpfung hineinkopieren.
            Empfehlung für den Messe-PC: Energieoptionen auf "Bildschirm nie ausschalten",
            Windows-Benachrichtigungen aus (Fokus-Assistent), Bildschirmschoner von Windows deaktivieren.

Ordner:     Der komplette Ordner gehört zusammen (die .exe braucht die Dateien daneben).
            Es ist keine Installation nötig; Windows 10/11, 64 Bit.
