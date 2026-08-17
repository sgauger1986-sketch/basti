#!/usr/bin/env python3
"""
Weiterleiter — hängt sich zwischen App und echten Vermittler und schreibt mit.

Das ist das Werkzeug für die Frage „was schickt die App wirklich?". Es nimmt
Anfragen entgegen, reicht sie unverändert an den echten Server weiter und gibt
beide Richtungen Zeile für Zeile aus. Nichts wird verändert — auch die Kopf-
zeilen nicht, denn genau an denen (kein Content-Type, Cookie) hängt das
Protokoll.

    python3 weiterleiter.py --port 8899 --ziel 82.165.182.81 --zielport 8080

Danach in der App als Server den Rechner eintragen (im Emulator 10.0.2.2)
und Port 8899.
"""

import argparse
import http.client
import http.server
import re
import threading

ZIEL = "82.165.182.81"
ZIELPORT = 8080
SPERRE = threading.Lock()
ZAEHLER = [0]


ROH = None      # Ordner für Rohbytes, per --roh gesetzt


def kurz(b, n=200):
    """
    Lesbar machen — und Binäres als solches kennzeichnen.

    Die Original-App schickt ihre Nachrichten **zlib-komprimiert** (Rumpf
    beginnt mit 78 9C). Als Text ausgegeben ist das Buchstabensalat; hier wird
    es deshalb erkannt, gleich ausgepackt und im Klartext gezeigt. Ohne das
    sieht man von der wichtigsten Nachricht überhaupt nichts.
    """
    if b[:1] == b"\x78":
        try:
            import zlib
            aus = zlib.decompress(b)
            t = aus.decode("utf-8", "replace")
            return (f"[zlib, {len(b)} → {len(aus)} Bytes] "
                    + (t if len(t) <= n * 3 else t[:n * 3] + " …"))
        except Exception as e:
            return f"[binär, {len(b)} Bytes, nicht auspackbar: {e}]"
    t = b.decode("utf-8", "replace")
    return t if len(t) <= n else t[:n] + f" … (+{len(t)-n} Zeichen)"


def roh_ablegen(nr, richtung, b):
    """Rohbytes wegschreiben — zum späteren Zerlegen Byte für Byte."""
    if not ROH:
        return
    import os
    os.makedirs(ROH, exist_ok=True)
    with open(os.path.join(ROH, f"{nr:04d}-{richtung}.bin"), "wb") as f:
        f.write(b)


class Handler(http.server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, *a):
        pass

    def do_POST(self):
        laenge = int(self.headers.get("Content-Length") or 0)
        rumpf = self.rfile.read(laenge)

        with SPERRE:
            ZAEHLER[0] += 1
            nr = ZAEHLER[0]

        # Kopfzeilen unverändert übernehmen — bis auf Host, der muss auf das
        # Ziel zeigen. Ein gesetzter Content-Type bleibt ausdrücklich stehen:
        # wenn die App einen mitschickt, soll man genau das hier sehen.
        kopf = {}
        for k, v in self.headers.items():
            if k.lower() in ("host", "content-length", "connection"):
                continue
            kopf[k] = v
        kopf["Content-Length"] = str(len(rumpf))

        ct = self.headers.get("Content-Type")
        print(f"\n[{nr}] → {self.command} {self.path}")
        if ct is not None:
            print(f"     ! Content-Type: {ct!r} — die Gegenseite mag das nicht")
        keks = self.headers.get("Cookie")
        if keks:
            print(f"     Cookie: {keks}")
        print(f"     {kurz(rumpf, 300)}")
        roh_ablegen(nr, "anfrage", rumpf)

        try:
            c = http.client.HTTPConnection(ZIEL, ZIELPORT, timeout=25)
            c.request("POST", self.path, body=rumpf, headers=kopf)
            a = c.getresponse()
            daten = a.read()
            antwortkopf = dict(a.getheaders())
            code = a.status
            c.close()
        except Exception as e:
            print(f"[{nr}] ← FEHLER beim Weiterreichen: {e}")
            self.send_error(502, "Weiterleiter: %s" % e)
            return

        setzt = antwortkopf.get("Set-Cookie")
        print(f"[{nr}] ← HTTP {code}"
              + (f"  Set-Cookie: {setzt}" if setzt else ""))
        print(f"     {kurz(daten, 300)}")
        roh_ablegen(nr, "antwort", daten)

        self.send_response(code)
        for k, v in antwortkopf.items():
            if k.lower() in ("content-length", "transfer-encoding", "connection"):
                continue
            self.send_header(k, v)
        self.send_header("Content-Length", str(len(daten)))
        self.end_headers()
        self.wfile.write(daten)


def main():
    global ZIEL, ZIELPORT, ROH
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--port", type=int, default=8899)
    p.add_argument("--adresse", default="0.0.0.0")
    p.add_argument("--ziel", default=ZIEL)
    p.add_argument("--zielport", type=int, default=ZIELPORT)
    p.add_argument("--roh", help="Ordner für die Rohbytes beider Richtungen")
    a = p.parse_args()
    ZIEL, ZIELPORT = a.ziel, a.zielport
    ROH = a.roh

    srv = http.server.ThreadingHTTPServer((a.adresse, a.port), Handler)
    print(f"Weiterleiter: http://{a.adresse}:{a.port}  →  "
          f"http://{ZIEL}:{ZIELPORT}")
    print("Alles unverändert. Beide Richtungen stehen hier.\n")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nEnde.")


if __name__ == "__main__":
    main()
