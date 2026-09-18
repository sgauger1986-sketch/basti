#!/usr/bin/env python3
"""Baut aus den echten Demo-Daten des Prototyps eine schreibgeschuetzte SQLite-DB.

Der selbstpruefende Chatbot (selfcheck_engine.py) fragt AUSSCHLIESSLICH diese DB
ab. So laeuft der Prototyp ohne Advantage-Server und ohne echte Kundendaten.

In der Produktivversion tritt hier statt SQLite ein *lesender* Zugriff auf die
Advantage-Datenbank von X2 (bzw. deren gespiegelte Kopie) an dieselbe Stelle --
die Engine bleibt unveraendert.

Aufruf:
    python build_db.py            # liest ../prototyp/x2-cloud-prototyp.html
    python build_db.py <html> <sqlite-ausgabe>
"""
import json
import re
import sqlite3
import sys
from pathlib import Path

HERE = Path(__file__).parent


def extract_bundle(html_path: Path) -> dict:
    html = html_path.read_text(encoding="utf-8")
    m = re.search(
        r'<script id="data" type="application/json">(\{.*?\})</script>', html, re.S
    )
    if not m:
        raise SystemExit(f"Kein eingebettetes Datenpaket in {html_path} gefunden.")
    return json.loads(m.group(1))


def build(bundle: dict, out_path: Path) -> None:
    if out_path.exists():
        out_path.unlink()
    con = sqlite3.connect(out_path)
    cur = con.cursor()
    for table, rows in bundle.items():
        if not isinstance(rows, list) or not rows:
            continue
        # Spaltenmenge aus allen Zeilen sammeln (robust gegen fehlende Keys).
        cols = list(dict.fromkeys(k for row in rows for k in row.keys()))
        col_defs = ", ".join(f'"{c}"' for c in cols)
        cur.execute(f'CREATE TABLE "{table}" ({col_defs})')
        placeholders = ", ".join("?" for _ in cols)
        cur.executemany(
            f'INSERT INTO "{table}" ({col_defs}) VALUES ({placeholders})',
            [[_flat(row.get(c)) for c in cols] for row in rows],
        )
        print(f"  {table:16} {len(rows):5} Zeilen, {len(cols)} Spalten")
    con.commit()
    con.close()


def _flat(v):
    if isinstance(v, bool):
        return 1 if v else 0
    if isinstance(v, (dict, list)):
        return json.dumps(v, ensure_ascii=False)
    return v


def main(argv):
    html_path = Path(argv[1]) if len(argv) > 1 else HERE.parent / "prototyp" / "x2-cloud-prototyp.html"
    out_path = Path(argv[2]) if len(argv) > 2 else HERE / "x2demo.sqlite"
    print(f"Lese Demo-Daten aus {html_path}")
    bundle = extract_bundle(html_path)
    print(f"Baue SQLite-DB {out_path}")
    build(bundle, out_path)
    print("Fertig.")


if __name__ == "__main__":
    main(sys.argv)
