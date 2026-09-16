MexXsoft Messevideo – Bildschirmschoner / Kiosk (Windows)
=========================================================

Start:      MexXsoft-Messevideo.exe doppelklicken.
            Das Video läuft sofort im Vollbild in Dauerschleife, ohne Ton, Mauszeiger versteckt.

Beenden:    Beliebige Taste drücken oder klicken -> PIN-Feld erscheint.
            PIN eingeben (Standard: 0000) -> Programm schließt sich.
            Ohne Eingabe verschwindet das PIN-Feld nach 20 Sekunden wieder.
            Alt+F4 und Esc beenden das Programm NICHT.

PIN ändern: config.json neben der .exe öffnen und "pin" anpassen (z. B. "1234").

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
