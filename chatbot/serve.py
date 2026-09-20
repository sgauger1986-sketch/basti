#!/usr/bin/env python3
"""Lokale Dienst-Schnittstelle fuer den X2-Assistenten.

Das ist die Bruecke zwischen dem Chat-Panel IM X2-Fenster (WebView2) und der
Pruef-Engine. Sie laeuft NUR auf localhost -- kein Internet, kein Datenabfluss.

    python serve.py            # startet http://127.0.0.1:8756
    -> im Browser oder in der eingebetteten WebView2 oeffnen

Endpunkte:
    GET  /                 -> das Chat-Panel (panel/index.html)
    POST /ask {question, customer_id?}  -> geprueftes Ergebnis als JSON

Die WebView2-DLL in X2 navigiert einfach auf http://127.0.0.1:8756/ -- damit
sitzt das Panel im X2-Fenster, die Engine laeuft daneben als lokaler Dienst.
"""
from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from selfcheck_engine import (
    DB_PATH, Principal, answer, make_backend, open_readonly,
)

HERE = Path(__file__).parent
PANEL = HERE / "panel" / "index.html"
HOST = "127.0.0.1"                                   # niemals 0.0.0.0 (Egress!)
PORT = int(os.environ.get("X2_SERVE_PORT", "8756"))


class Service:
    """Haelt Backend + DB-Verbindung offen (einmal aufgebaut, dann wiederverwendet)."""

    def __init__(self):
        if not DB_PATH.exists():
            raise SystemExit("Bitte zuerst 'python build_db.py' ausfuehren.")
        self.backend = make_backend()

    def ask(self, question: str, customer_id: str | None) -> dict:
        who = (Principal(f"Kunde {customer_id}", customer_id=customer_id)
               if customer_id else Principal("interner Nutzer"))
        # Pro Anfrage eine eigene, schreibgeschuetzte Verbindung -- SQLite-Objekte
        # sind nicht thread-uebergreifend nutzbar (ThreadingHTTPServer).
        con = open_readonly(DB_PATH)
        try:
            return answer(question, who, self.backend, con).to_dict()
        finally:
            con.close()


def make_handler(service: Service):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *a):  # still
            pass

        def _send(self, code, body: bytes, ctype="application/json; charset=utf-8"):
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            if self.path in ("/", "/index.html"):
                if PANEL.exists():
                    self._send(200, PANEL.read_bytes(), "text/html; charset=utf-8")
                else:
                    self._send(404, b"panel/index.html fehlt")
                return
            self._send(404, b"not found")

        def do_POST(self):
            if self.path != "/ask":
                self._send(404, b'{"error":"not found"}')
                return
            n = int(self.headers.get("Content-Length", "0"))
            try:
                req = json.loads(self.rfile.read(n) or b"{}")
                q = str(req.get("question", "")).strip()
                cid = req.get("customer_id") or None
                if not q:
                    raise ValueError("Frage fehlt")
                result = service.ask(q, cid)
            except Exception as e:
                self._send(400, json.dumps({"error": str(e)}).encode("utf-8"))
                return
            self._send(200, json.dumps(result, ensure_ascii=False).encode("utf-8"))

    return Handler


def main():
    service = Service()
    srv = ThreadingHTTPServer((HOST, PORT), make_handler(service))
    print(f"X2-Assistent laeuft auf http://{HOST}:{PORT}/  "
          f"(Backend: {type(service.backend).__name__})")
    print("Strg+C zum Beenden.")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        srv.shutdown()


if __name__ == "__main__":
    main()
