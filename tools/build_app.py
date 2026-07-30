#!/usr/bin/env python3
"""Inject the data bundle into the prototype HTML shell."""
import json, sys
from pathlib import Path

data = Path(sys.argv[1]).read_text(encoding="utf-8")
shell = Path(sys.argv[2]).read_text(encoding="utf-8")
out = shell.replace('"__DATA__"', data)
Path(sys.argv[3]).write_text(out, encoding="utf-8")
print("App gebaut:", sys.argv[3], f"({len(out)//1024} KB)")
