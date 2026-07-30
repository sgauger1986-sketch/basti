#!/usr/bin/env python3
"""Extract table schemas from Advantage Database (.adt) files.

ADT layout (empirically verified against the demo database):
  - 400-byte file header:
      [0:16]  signature "Advantage Table\0"
      [20:24] record count (u32 LE)
      [32:36] header size = 400 + n_fields*200 (u32 LE)
      [36:40] record size in bytes (u32 LE)
  - 200-byte field descriptors from offset 400:
      [0:128]   field name, NUL-padded
      [129:131] field type (u16 LE, ADS type code)
      [131:135] field offset within record (u32 LE)
      [135:137] declared field length (u16 LE)
"""
import json
import struct
import sys
from pathlib import Path

ADS_TYPES = {
    1: "LOGICAL", 2: "NUMERIC", 3: "DATE", 4: "STRING", 5: "MEMO",
    6: "BINARY", 7: "IMAGE", 8: "VARCHAR", 9: "COMPACTDATE", 10: "DOUBLE",
    11: "INTEGER", 12: "SHORTINT", 13: "TIME", 14: "TIMESTAMP",
    15: "AUTOINC", 16: "RAW", 17: "CURDOUBLE", 18: "MONEY", 19: "LONGLONG",
    20: "CICHARACTER", 21: "ROWVERSION", 22: "MODTIME", 23: "VARCHAR_FOX",
    24: "VARBINARY_FOX", 25: "SYSTEM", 26: "NCHAR", 27: "NVARCHAR", 28: "NMEMO",
}

# sensible PostgreSQL equivalents for a future migration
PG_TYPES = {
    "LOGICAL": "boolean", "NUMERIC": "numeric", "DATE": "date",
    "STRING": "varchar", "MEMO": "text", "BINARY": "bytea", "IMAGE": "bytea",
    "VARCHAR": "varchar", "COMPACTDATE": "date", "DOUBLE": "double precision",
    "INTEGER": "integer", "SHORTINT": "smallint", "TIME": "time",
    "TIMESTAMP": "timestamp", "AUTOINC": "serial", "RAW": "bytea",
    "CURDOUBLE": "numeric(18,4)", "MONEY": "numeric(18,4)", "LONGLONG": "bigint",
    "CICHARACTER": "varchar", "ROWVERSION": "bigint", "MODTIME": "timestamp",
    "NCHAR": "varchar", "NVARCHAR": "varchar", "NMEMO": "text",
}
SIZED = {"STRING", "CICHARACTER", "VARCHAR", "NCHAR", "NVARCHAR"}


def _plausible_name(raw: bytes) -> bool:
    name = raw.split(b"\0", 1)[0]
    return 0 < len(name) <= 100 and all(32 <= b < 127 for b in name)


def parse_adt(path: Path):
    data = path.read_bytes()
    if data[:15] != b"Advantage Table":
        raise ValueError(f"{path.name}: not an Advantage table")
    rec_count = struct.unpack_from("<I", data, 20)[0]
    header_size = struct.unpack_from("<I", data, 32)[0]
    rec_size = struct.unpack_from("<I", data, 36)[0]
    n_fields = (header_size - 400) // 200
    if not _plausible_name(data[400:528]):
        return {"table": path.stem, "record_size": rec_size,
                "record_count": rec_count, "encrypted": True,
                "field_count": n_fields, "fields": []}
    fields = []
    for i in range(n_fields):
        base = 400 + i * 200
        name = data[base:base + 128].split(b"\0", 1)[0].decode("latin-1")
        if not name:
            continue
        ftype = struct.unpack_from("<H", data, base + 129)[0]
        foffset = struct.unpack_from("<I", data, base + 131)[0]
        flen = struct.unpack_from("<H", data, base + 135)[0]
        fields.append({
            "name": name,
            "type": ADS_TYPES.get(ftype, f"UNKNOWN_{ftype}"),
            "length": flen,
            "offset": foffset,
        })
    fields.sort(key=lambda f: f["offset"])
    return {"table": path.stem, "record_size": rec_size,
            "record_count": rec_count, "encrypted": False, "fields": fields}


def pg_type(f):
    t = PG_TYPES.get(f["type"], "text /* " + f["type"] + " */")
    if f["type"] in SIZED:
        t = f"varchar({f['length']})"
    return t


def main(src_dir: str, out_dir: str):
    src, out = Path(src_dir), Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    tables, errors = [], []
    for p in sorted(src.glob("*.adt"), key=lambda p: p.stem.upper()):
        try:
            tables.append(parse_adt(p))
        except Exception as e:
            errors.append(f"{p.name}: {e}")

    (out / "schema.json").write_text(
        json.dumps(tables, indent=2, ensure_ascii=False), encoding="utf-8")

    with (out / "schema.sql").open("w", encoding="utf-8") as f:
        f.write("-- mexXsoft X2: aus der Advantage-Demo-Datenbank extrahiertes Schema\n"
                "-- Zieldialekt: PostgreSQL (Typzuordnung siehe SCHEMA.md)\n\n")
        for t in tables:
            if t["encrypted"]:
                f.write(f'-- Tabelle "{t["table"].lower()}" ist verschlüsselt '
                        f'({t["field_count"]} Felder) — Struktur nicht lesbar\n\n')
                continue
            f.write(f'CREATE TABLE "{t["table"].lower()}" (\n')
            cols = [f'    "{fl["name"].lower()}" {pg_type(fl)}' for fl in t["fields"]]
            f.write(",\n".join(cols))
            f.write("\n);\n\n")

    with (out / "SCHEMA.md").open("w", encoding="utf-8") as f:
        n_fields = sum(len(t["fields"]) for t in tables)
        f.write("# mexXsoft X2 — Datenbankschema (aus Demo-Datenbank extrahiert)\n\n")
        f.write(f"Quelle: Advantage Database (.adt), {len(tables)} Tabellen, "
                f"{n_fields} Felder insgesamt.\n\n")
        enc = [t for t in tables if t["encrypted"]]
        if enc:
            f.write(f"**Verschlüsselte Tabellen ({len(enc)}):** Struktur nicht direkt lesbar "
                    "(Advantage-Tabellenverschlüsselung). Export über Advantage Data Architect "
                    "mit Tabellenpasswort möglich: "
                    + ", ".join(t["table"] for t in enc) + "\n\n")
        f.write("| Tabelle | Felder | Datensätze (Demo) | Satzlänge |\n|---|---|---|---|\n")
        for t in tables:
            n = t["field_count"] if t["encrypted"] else len(t["fields"])
            note = " 🔒" if t["encrypted"] else ""
            f.write(f"| {t['table']}{note} | {n} | {t['record_count']} | {t['record_size']} B |\n")
        f.write("\n---\n\n")
        for t in tables:
            if t["encrypted"]:
                continue
            f.write(f"## {t['table']}\n\n")
            f.write("| Feld | Typ | Länge |\n|---|---|---|\n")
            for fl in t["fields"]:
                ln = fl["length"] if fl["type"] in SIZED else ""
                f.write(f"| {fl['name']} | {fl['type']} | {ln} |\n")
            f.write("\n")
    print(f"OK: {len(tables)} Tabellen, {n_fields} Felder")
    for e in errors:
        print("FEHLER:", e)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
