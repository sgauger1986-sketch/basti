#!/usr/bin/env python3
"""Extract a curated, cleaned JSON bundle from the demo database for the prototype."""
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from adt_read import read_table

INT_NULLS = {-2147483648, -32768, -9223372036854775808}

def clean(v):
    if isinstance(v, float):
        if v != v or abs(v) < 1e-300:      # NaN or ADS double-null sentinel
            return None
        return round(v, 4)
    if isinstance(v, int) and v in INT_NULLS:
        return None
    if v == "":
        return None
    return v

def grab(src, table, cols, limit=400):
    r = read_table(src / f"{table}.adt", limit=limit)
    if not r:
        return []
    out = []
    for row in r["rows"]:
        rec = {c: clean(row.get(c)) for c in cols}
        if any(rec[c] is not None for c in cols):
            out.append(rec)
    return out

def main(src_dir, out_path):
    src = Path(src_dir)
    bundle = {}

    bundle["adressen"] = grab(src, "ADRESSE", [
        "ID_ADRESSE","TYP","AD_ANZEIGENAME","AD_FIRMA","AD_BRIEFANREDE",
        "TEL_GESCHAEFTLICH","TEL_FAXGESCHAEFTLICH","TEL_EMAIL1","TEL_INTERNET",
        "AN_STRASSE_GESCHAEFTLICH","AN_PLZ_GESCHAEFTLICH","AN_ORT_GESCHAEFTLICH",
        "STEUER_NUMMER","FLAG_FIRMA"])

    bundle["projekte"] = grab(src, "PROJEKTE", [
        "ID_PROJEKTE","ID_PROJEKTE_STATUS","NUMMER","KURZBEZ","BEZEICHNUNG",
        "PRIORITAET","KUNDEN_NAME","ID_AUFTRAGGEBER",
        "LV_SUMME_ANGEBOT","LV_SUMME_AUFTRAG","LV_SUMME_RECHNUNG"])

    bundle["lvlisten"] = grab(src, "PROJEKTE_LVLIST", [
        "ID_PROJEKTE_LVLIST","ID_PROJEKTE","ID_LV_STATUS","NUMMER","KURZBEZ",
        "BEZEICHNUNG","ARBEITSBEREICH","MWST","ZAKO","LV_SUMME"])

    bundle["lvpositionen"] = grab(src, "lv_pos", [
        "ID_LV_POS","ID_PARENT","ID_PROJEKTE_LVLIST","HKE","OZ","KE",
        "MENGE","PREIS","G_PREIS","MWST","KURZTEXT_TEXT","SORTIEREN"], limit=1500)

    bundle["mitarbeiter"] = grab(src, "ADR_MITARBEITER", [
        "ID_ADR_MITARBEITER","BEZEICHNUNG","PERSONALNUMMER","MATCHCODE",
        "STUNDENLOHN","STUNDENSATZ_TAGLOHN"])

    bundle["material"] = grab(src, "MAT_KATALOG", [
        "ID_MAT_KATALOG","BEZEICHNUNG","LIEFERANT_ANZEIGENAME"])

    bundle["einheiten"] = grab(src, "einheit_base", [
        "ID_EINHEIT","EINHEIT","BESCHREIBUNG"])

    bundle["mwst"] = grab(src, "MWST", ["ID_MWST","WERT","BEZEICHNUNG","AKTIV"])

    bundle["lohnarten"] = grab(src, "LOHNART", ["ID_LOHNART","BEZEICHNUNG","NUMMER"])

    bundle["rapporte"] = grab(src, "rapport", [
        "ID_RAPPORT","ID_PROJEKTE","NUMMER","NAME","GEPRUEFT"])

    Path(out_path).write_text(json.dumps(bundle, ensure_ascii=False,
                                         separators=(",", ":")), encoding="utf-8")
    print("Bundle geschrieben:", out_path)
    for k, v in bundle.items():
        print(f"  {k:<14} {len(v):>5} Datensätze")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
