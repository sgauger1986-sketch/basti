#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""mexXsoft X2 Cloud — Büro-Connector

Läuft auf dem Büro-PC NEBEN der bestehenden Delphi-Anwendung (mexXsoft X2).
Die Delphi-Version bleibt unverändert — der Connector schlägt die Brücke
zwischen der Advantage-Datenbank (.adt) im Büro und der Web-Version:

  Büro → Web:  Der Connector überwacht die .adt-Tabellen. Neue oder geänderte
               Datensätze werden sofort (Standard: alle 10 Sekunden) an den
               Cloud-Server übertragen — alle Web-Nutzer sehen sie umgehend.

  Web → Büro:  Änderungen aus der Web-Version werden abgeholt und im Ordner
               "webeingang/" als JSON-Dateien pro Tabelle abgelegt (inkl.
               lesbarem Protokoll), damit sie im Büro geprüft und übernommen
               werden können. Direktes Zurückschreiben in die Advantage-DB
               erfolgt bewusst NICHT automatisch (Datensicherheit); dafür ist
               die ADS-/ODBC-Anbindung als Ausbaustufe vorgesehen.

Benötigt nur Python 3 (Standardbibliothek). Aufrufbeispiele:

  # Echtbetrieb neben mexXsoft (Datenverzeichnis mit den .adt-Dateien):
  python buero_connector.py --db "C:\\mexXsoft\\Demo\\Daten" \
      --server https://cloud.mexxsoft.de --tenant demo --user buero --pass geheim

  # Einmaliger Abgleich (z. B. für die Erst-Übernahme der Bestandsdaten):
  python buero_connector.py --db ... --server ... --einmalig

  # Test ohne echte Datenbank (liest Tabellen aus einer JSON-Datei):
  python buero_connector.py --simulate ../webapp/data/seed.json --server http://localhost:8080
"""
import argparse
import hashlib
import json
import socket
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

# .adt-Leser aus tools/ wiederverwenden
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "tools"))
try:
    from adt_read import read_table          # noqa: E402
except Exception:                            # Simulationsmodus braucht ihn nicht
    read_table = None

# Tabellen-Zuordnung: Web-Tabelle -> (.adt-Datei, Primärschlüssel, Spalten)
# (identisch zu tools/export_bundle.py, damit Web und Büro dieselbe Sicht haben)
TABLES = {
    "adressen": ("ADRESSE", "ID_ADRESSE", [
        "ID_ADRESSE", "TYP", "AD_ANZEIGENAME", "AD_FIRMA", "AD_BRIEFANREDE",
        "TEL_GESCHAEFTLICH", "TEL_FAXGESCHAEFTLICH", "TEL_EMAIL1", "TEL_INTERNET",
        "AN_STRASSE_GESCHAEFTLICH", "AN_PLZ_GESCHAEFTLICH", "AN_ORT_GESCHAEFTLICH",
        "STEUER_NUMMER", "FLAG_FIRMA"]),
    "projekte": ("PROJEKTE", "ID_PROJEKTE", [
        "ID_PROJEKTE", "ID_PROJEKTE_STATUS", "NUMMER", "KURZBEZ", "BEZEICHNUNG",
        "PRIORITAET", "KUNDEN_NAME", "ID_AUFTRAGGEBER",
        "LV_SUMME_ANGEBOT", "LV_SUMME_AUFTRAG", "LV_SUMME_RECHNUNG"]),
    "lvlisten": ("PROJEKTE_LVLIST", "ID_PROJEKTE_LVLIST", [
        "ID_PROJEKTE_LVLIST", "ID_PROJEKTE", "ID_LV_STATUS", "NUMMER", "KURZBEZ",
        "BEZEICHNUNG", "ARBEITSBEREICH", "MWST", "ZAKO", "LV_SUMME"]),
    "lvpositionen": ("lv_pos", "ID_LV_POS", [
        "ID_LV_POS", "ID_PARENT", "ID_PROJEKTE_LVLIST", "HKE", "OZ", "KE",
        "MENGE", "PREIS", "G_PREIS", "MWST", "KURZTEXT_TEXT", "SORTIEREN"]),
    "mitarbeiter": ("ADR_MITARBEITER", "ID_ADR_MITARBEITER", [
        "ID_ADR_MITARBEITER", "BEZEICHNUNG", "PERSONALNUMMER", "MATCHCODE",
        "STUNDENLOHN", "STUNDENSATZ_TAGLOHN"]),
    "material": ("MAT_KATALOG", "ID_MAT_KATALOG", [
        "ID_MAT_KATALOG", "BEZEICHNUNG", "LIEFERANT_ANZEIGENAME"]),
    "einheiten": ("einheit_base", "ID_EINHEIT", ["ID_EINHEIT", "EINHEIT", "BESCHREIBUNG"]),
    "mwst": ("MWST", "ID_MWST", ["ID_MWST", "WERT", "BEZEICHNUNG", "AKTIV"]),
    "lohnarten": ("LOHNART", "ID_LOHNART", ["ID_LOHNART", "BEZEICHNUNG", "NUMMER"]),
    "rapporte": ("rapport", "ID_RAPPORT", ["ID_RAPPORT", "ID_PROJEKTE", "NUMMER", "NAME", "GEPRUEFT"]),
}

INT_NULLS = {-2147483648, -32768, -9223372036854775808}


def clean(v):
    """ADS-Null-Sentinels und Leerwerte vereinheitlichen (wie export_bundle.py)."""
    if isinstance(v, float):
        if v != v or abs(v) < 1e-300:
            return None
        return round(v, 4)
    if isinstance(v, int) and v in INT_NULLS:
        return None
    if v == "":
        return None
    return v


# ---------------------------------------------------------------- Datenquellen
def lese_adt(db_dir):
    """Alle Tabellen aus dem mexXsoft-Datenverzeichnis lesen."""
    out = {}
    for web_tab, (adt_name, pk, cols) in TABLES.items():
        f = db_dir / f"{adt_name}.adt"
        if not f.exists():
            # Advantage-Dateinamen sind je nach System groß/klein geschrieben
            cand = [p for p in db_dir.glob("*.adt") if p.stem.lower() == adt_name.lower()]
            if not cand:
                continue
            f = cand[0]
        r = read_table(f)
        rows = []
        for row in (r["rows"] if r else []):
            rec = {c: clean(row.get(c)) for c in cols}
            if rec.get(pk) is not None and any(v is not None for v in rec.values()):
                rows.append(rec)
        out[web_tab] = rows
    return out


def lese_simulation(datei):
    """Testmodus: Tabellen aus einer JSON-Datei (Format wie webapp/data/seed.json)."""
    data = json.loads(Path(datei).read_text(encoding="utf-8"))
    out = {}
    for web_tab, (_, pk, cols) in TABLES.items():
        rows = []
        for row in data.get(web_tab, []):
            rec = {c: clean(row.get(c)) for c in cols}
            if rec.get(pk) is not None:
                rows.append(rec)
        out[web_tab] = rows
    return out


# ---------------------------------------------------------------- HTTP-Zugriff
def api(server, pfad, body, token=None):
    req = urllib.request.Request(
        server.rstrip("/") + pfad,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json",
                 **({"Authorization": "Bearer " + token} if token else {})},
        method="POST")
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode("utf-8"))


# ---------------------------------------------------------------- Zustand
class Zustand:
    """Merkt sich pro Datensatz einen Hash + die letzte Server-Revision."""

    def __init__(self, pfad):
        self.pfad = pfad
        try:
            d = json.loads(pfad.read_text(encoding="utf-8"))
        except Exception:
            d = {}
        self.hashes = d.get("hashes", {})
        self.last_rev = d.get("lastRev", 0)
        self.token = d.get("token")
        # Datensätze, die bisher nur im Web existieren (noch nicht in der
        # Büro-DB): dürfen von der Löschungs-Erkennung nicht angefasst werden.
        self.web_keys = set(d.get("webKeys", []))

    def speichern(self):
        self.pfad.write_text(json.dumps(
            {"hashes": self.hashes, "lastRev": self.last_rev, "token": self.token,
             "webKeys": sorted(self.web_keys)}),
            encoding="utf-8")


def rec_hash(rec):
    return hashlib.md5(json.dumps(rec, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


# ---------------------------------------------------------------- Kernablauf
def aenderungen_finden(tabellen, zustand, loeschungen=False):
    """Vergleicht den aktuellen DB-Stand mit den gemerkten Hashes."""
    changes = []
    gesehen = set()
    for tab, rows in tabellen.items():
        pk = TABLES[tab][1]
        for rec in rows:
            key = f"{tab}|{rec[pk]}"
            gesehen.add(key)
            zustand.web_keys.discard(key)   # jetzt auch im Büro vorhanden
            h = rec_hash(rec)
            if zustand.hashes.get(key) != h:
                changes.append({"table": tab, "pk": rec[pk], "op": "upsert",
                                "data": rec, "ts": int(time.time() * 1000)})
                zustand.hashes[key] = h
    if loeschungen:
        for key in list(zustand.hashes):
            tab = key.split("|", 1)[0]
            if tab in tabellen and key not in gesehen and key not in zustand.web_keys:
                changes.append({"table": tab, "pk": key.split("|", 1)[1],
                                "op": "delete", "ts": int(time.time() * 1000)})
                del zustand.hashes[key]
    return changes


def web_eingang_ablegen(eingang_dir, changes, geraet):
    """Web-Änderungen als Import-Dateien für das Büro ablegen."""
    fremde = [c for c in changes if c.get("device") not in (geraet, "seed")]
    if not fremde:
        return 0
    eingang_dir.mkdir(parents=True, exist_ok=True)
    pro_tabelle = {}
    for c in fremde:
        pro_tabelle.setdefault(c["table"], {})[str(c["pk"])] = c
    for tab, neu in pro_tabelle.items():
        f = eingang_dir / f"{tab}.json"
        try:
            alt = json.loads(f.read_text(encoding="utf-8"))
        except Exception:
            alt = {}
        alt.update(neu)
        f.write_text(json.dumps(alt, ensure_ascii=False, indent=1), encoding="utf-8")
    with (eingang_dir / "protokoll.txt").open("a", encoding="utf-8") as log:
        for c in fremde:
            name = ""
            if isinstance(c.get("data"), dict):
                name = c["data"].get("AD_ANZEIGENAME") or c["data"].get("NAME") or c["data"].get("BEZEICHNUNG") or ""
            log.write(f"{time.strftime('%d.%m.%Y %H:%M:%S')}  {c['table']:<14} "
                      f"{c['op']:<7} {c['pk']}  {name}\n")
    return len(fremde)


def sync_runde(args, zustand, tabellen, geraet):
    """Eine Synchronisationsrunde: pushen + pullen. Gibt (gesendet, empfangen) zurück."""
    changes = aenderungen_finden(tabellen, zustand, args.push_loeschungen)
    for c in changes:
        c["device"] = geraet

    if not zustand.token:
        antwort = api(args.server, "/api/login",
                      {"tenant": args.tenant, "user": args.user, "pass": args.passwort})
        zustand.token = antwort["token"]

    try:
        antwort = api(args.server, "/api/sync",
                      {"since": zustand.last_rev, "device": geraet, "changes": changes},
                      token=zustand.token)
    except urllib.error.HTTPError as e:
        if e.code == 401:   # Token abgelaufen → neu anmelden, einmal wiederholen
            zustand.token = None
            antwort = api(args.server, "/api/login",
                          {"tenant": args.tenant, "user": args.user, "pass": args.passwort})
            zustand.token = antwort["token"]
            antwort = api(args.server, "/api/sync",
                          {"since": zustand.last_rev, "device": geraet, "changes": changes},
                          token=zustand.token)
        else:
            raise

    empfangen = web_eingang_ablegen(Path(args.webeingang), antwort["changes"], geraet)
    # Web-Stände nicht erneut zurückschicken: Hashes fremder Upserts übernehmen
    for c in antwort["changes"]:
        if c.get("device") not in (geraet, "seed") and c["op"] == "upsert" and c["table"] in TABLES:
            pk_name = TABLES[c["table"]][1]
            data = c.get("data") or {}
            if data.get(pk_name) is not None:
                cols = TABLES[c["table"]][2]
                key = f"{c['table']}|{c['pk']}"
                if key not in zustand.hashes:
                    zustand.web_keys.add(key)
                zustand.hashes[key] = rec_hash({k: clean(data.get(k)) for k in cols})
    zustand.last_rev = antwort["rev"]
    zustand.speichern()
    return len(changes), empfangen


def main():
    ap = argparse.ArgumentParser(description="mexXsoft X2 Cloud — Büro-Connector")
    quelle = ap.add_mutually_exclusive_group(required=True)
    quelle.add_argument("--db", help="mexXsoft-Datenverzeichnis mit den .adt-Dateien")
    quelle.add_argument("--simulate", help="Testmodus: Tabellen aus JSON-Datei lesen")
    ap.add_argument("--server", required=True, help="Cloud-Server, z. B. https://cloud.mexxsoft.de")
    ap.add_argument("--tenant", default="demo", help="Mandant (Standard: demo)")
    ap.add_argument("--user", default="demo", help="Benutzer (Standard: demo)")
    ap.add_argument("--pass", dest="passwort", default="demo", help="Passwort")
    ap.add_argument("--intervall", type=int, default=10, help="Abgleich alle N Sekunden (Standard: 10)")
    ap.add_argument("--einmalig", action="store_true", help="nur eine Runde, dann beenden")
    ap.add_argument("--push-loeschungen", action="store_true",
                    help="im Büro gelöschte Datensätze auch in der Cloud löschen (Vorsicht)")
    ap.add_argument("--state", default=None, help="Pfad der Zustandsdatei")
    ap.add_argument("--webeingang", default=None, help="Ordner für Web-Änderungen (Standard: ./webeingang)")
    args = ap.parse_args()

    hier = Path(__file__).resolve().parent
    args.webeingang = args.webeingang or str(hier / "webeingang")
    zustand = Zustand(Path(args.state) if args.state else hier / "connector-state.json")
    geraet = "buero-" + socket.gethostname()

    if args.db and read_table is None:
        sys.exit("Fehler: tools/adt_read.py nicht gefunden — Ordner tools/ mitkopieren.")

    print(f"Büro-Connector gestartet — Gerät: {geraet}, Server: {args.server}, Mandant: {args.tenant}")
    print(f"Quelle: {'Simulation ' + args.simulate if args.simulate else args.db}")
    print(f"Web-Änderungen landen in: {args.webeingang}\n")

    letzte_mtimes = None
    while True:
        try:
            db_dir = Path(args.db) if args.db else None
            # Nur lesen, wenn sich seit der letzten Runde eine Datei geändert hat
            if db_dir:
                mtimes = tuple(sorted((p.name, p.stat().st_mtime) for p in db_dir.glob("*.adt")))
            else:
                mtimes = Path(args.simulate).stat().st_mtime
            if mtimes != letzte_mtimes or zustand.last_rev == 0:
                tabellen = lese_adt(db_dir) if db_dir else lese_simulation(args.simulate)
                letzte_mtimes = mtimes
            else:
                tabellen = {}   # nichts geändert → nur pullen
            gesendet, empfangen = sync_runde(args, zustand, tabellen, geraet)
            if gesendet or empfangen:
                print(f"{time.strftime('%H:%M:%S')}  → {gesendet} Änderung(en) gesendet, "
                      f"← {empfangen} aus dem Web empfangen (Rev {zustand.last_rev})")
        except urllib.error.HTTPError as e:
            print(f"{time.strftime('%H:%M:%S')}  Server-Fehler: HTTP {e.code} — {e.read().decode('utf-8', 'replace')[:200]}")
        except urllib.error.URLError as e:
            print(f"{time.strftime('%H:%M:%S')}  Keine Verbindung zum Server ({e.reason}) — nächster Versuch folgt.")
        except KeyboardInterrupt:
            print("\nBeendet.")
            return
        except Exception as e:
            print(f"{time.strftime('%H:%M:%S')}  Fehler: {e}")
        if args.einmalig:
            return
        try:
            time.sleep(args.intervall)
        except KeyboardInterrupt:
            print("\nBeendet.")
            return


if __name__ == "__main__":
    main()
