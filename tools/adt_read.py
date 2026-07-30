#!/usr/bin/env python3
"""Read record data from Advantage (.adt) tables (readable/unencrypted only)."""
import struct, sys, json, datetime
from pathlib import Path

def fields_of(data):
    header_size = struct.unpack_from("<I", data, 32)[0]
    rec_size = struct.unpack_from("<I", data, 36)[0]
    rec_count = struct.unpack_from("<I", data, 20)[0]
    n = (header_size - 400) // 200
    fs = []
    for i in range(n):
        b = 400 + i*200
        name = data[b:b+128].split(b"\0",1)[0].decode("latin-1")
        if not name: continue
        ftype = struct.unpack_from("<H", data, b+129)[0]
        off = struct.unpack_from("<I", data, b+131)[0]
        ln  = struct.unpack_from("<H", data, b+135)[0]
        fs.append((name, ftype, off, ln))
    return header_size, rec_size, rec_count, fs

def decode(ftype, raw):
    try:
        if ftype in (4,20,8,26,27):            # char/cichar/varchar
            return raw.split(b"\0",1)[0].rstrip(b" ").decode("latin-1", "replace")
        if ftype == 1:                          # logical
            return raw[:1] in (b"T", b"t", b"1", b"Y")
        if ftype in (11,15,21):                 # integer/autoinc
            return struct.unpack_from("<i", raw)[0] if len(raw)>=4 else None
        if ftype == 12:                         # shortint
            return struct.unpack_from("<h", raw)[0] if len(raw)>=2 else None
        if ftype == 19:                         # longlong
            return struct.unpack_from("<q", raw)[0] if len(raw)>=8 else None
        if ftype in (10,17,18):                 # double/money
            v = struct.unpack_from("<d", raw)[0] if len(raw)>=8 else None
            return v
        if ftype in (3,9):                      # date (julian day number)
            n = struct.unpack_from("<i", raw)[0] if len(raw)>=4 else 0
            if 2200000 < n < 2600000:
                return (datetime.date(1,1,1) + datetime.timedelta(days=n-1721426)).isoformat()
            return None
        if ftype == 2:                          # numeric (ascii-coded)
            s = raw.split(b"\0",1)[0].strip().decode("latin-1","replace")
            return s or None
        return None                             # memo/binary/image -> skip blobs
    except Exception:
        return None

def read_table(path, limit=None):
    data = path.read_bytes()
    header_size, rec_size, rec_count, fs = fields_of(data)
    # skip encrypted tables (garbage field names)
    if not fs or not all(32<=b<127 for b in fs[0][0].encode("latin-1","replace")):
        return None
    rows = []
    pos = header_size
    got = 0
    while pos + rec_size <= len(data):
        rec = data[pos:pos+rec_size]
        pos += rec_size
        # 5-byte record prefix; skip if it looks deleted (first byte != valid marker)
        row = {}
        empty = True
        for name, ftype, off, ln in fs:
            raw = rec[off:off+ln]
            v = decode(ftype, raw)
            if v not in (None, "", 0):
                empty = False
            row[name] = v
        if not empty:
            rows.append(row)
            got += 1
            if limit and got >= limit:
                break
    return {"table": path.stem, "count_declared": rec_count, "rows": rows}

if __name__ == "__main__":
    src = Path(sys.argv[1])
    for tname in sys.argv[2:]:
        r = read_table(src / f"{tname}.adt", limit=5)
        print("="*70)
        print(tname, "-> Datensätze (deklariert):", r["count_declared"] if r else "verschlüsselt")
        if r:
            for row in r["rows"][:3]:
                shown = {k:v for k,v in row.items() if v not in (None,"",0)}
                print(json.dumps(shown, ensure_ascii=False)[:600])
