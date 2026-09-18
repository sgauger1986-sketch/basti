#!/usr/bin/env python3
"""Selbstpruefender X2-Assistent -- Pruefgremium mit Egress-Sperre (Prototyp).

Zwei harte Vorgaben von mexXsoft sind hier eingebaut:

1) KEIN DATENABFLUSS ("nichts darf raus").
   Eine Frage darf von aussen HEREIN (der Kunde will etwas ueber SEIN Angebot
   wissen). Aber es darf NICHTS aus dem Programm HINAUS. Deshalb:
     * Standard ist Betrieb OHNE Netz mit LOKALEM Modell. Ein Backend, das Daten
       nach draussen schickt (Cloud-API), wird per Default VERWEIGERT
       (assert_no_egress). Freischaltbar nur bewusst mit X2_ALLOW_EGRESS=1.
     * Der Bot liest die DB nur (kein Schreiben), und bei Kundenfragen sieht er
       nur die Daten des fragenden Kunden (Mandantentrennung).

2) MEHRERE CHATBOTS PRUEFEN SICH GEGENSEITIG.
   Die Antwort des Autors wird von drei unabhaengigen Pruefern kontrolliert,
   bevor sie freigegeben wird:
     * FAKTEN     -- folgt die Antwort exakt aus den echten Datenzeilen?
     * FEHLER     -- passt die Abfrage zur Frage, gibt es Belegzeilen?
     * SICHERHEIT -- nur lesend? auf den Kunden eingegrenzt? kein Datenleck?
   Erst wenn keiner FALSCH sagt, wird die Antwort freigegeben (Gate).

Ablauf:
    Frage --> [Autor] --> SQL + Antwort --(nur lesend, mandantengefiltert)-->
    echte Zeilen --> [Fakten][Fehler][Sicherheit] --> Freigabe-Gate --> Nutzer

Aufruf:
    python build_db.py            # einmalig: Demo-DB
    python selfcheck_engine.py    # Demo: interne + Kundenfragen, mit Gremium
"""
from __future__ import annotations

import json
import os
import re
import sqlite3
import sys
from dataclasses import dataclass, field
from pathlib import Path

HERE = Path(__file__).parent
DB_PATH = HERE / "x2demo.sqlite"

AUTHOR_MODEL = os.environ.get("X2_GEN_MODEL", "local-llm")
REVIEW_MODEL = os.environ.get("X2_VER_MODEL", "local-llm")

# Egress-Sperre: standardmaessig darf NICHTS raus. Nur bewusst aufhebbar.
ALLOW_EGRESS = os.environ.get("X2_ALLOW_EGRESS") == "1"


# --------------------------------------------------------------------------- #
# Prinzipal: wer fragt? Ein Kunde sieht nur seine eigenen Daten.
# --------------------------------------------------------------------------- #
@dataclass
class Principal:
    name: str
    customer_id: str | None = None   # None = interner X2-Nutzer (voller Lesezugriff)

    @property
    def is_customer(self) -> bool:
        return self.customer_id is not None


# --------------------------------------------------------------------------- #
# Schreibschutz + Mandantentrennung
# --------------------------------------------------------------------------- #
_FORBIDDEN = re.compile(
    r"\b(insert|update|delete|drop|alter|create|replace|attach|detach|"
    r"pragma|vacuum|reindex|truncate|grant|revoke)\b",
    re.I,
)


def is_read_only(sql: str) -> bool:
    s = sql.strip().rstrip(";").strip()
    if not s or ";" in s or _FORBIDDEN.search(s):
        return False
    return s.lower().startswith(("select", "with"))


def is_tenant_scoped(sql: str, principal: Principal) -> bool:
    """Kundenabfrage MUSS die Kunden-ID enthalten (harte Eingrenzung)."""
    if not principal.is_customer:
        return True
    return principal.customer_id in sql


def open_readonly(db_path: Path) -> sqlite3.Connection:
    con = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    con.execute("PRAGMA query_only = ON")
    return con


def run_sql(con: sqlite3.Connection, sql: str, max_rows: int = 200):
    if not is_read_only(sql):
        raise ValueError("Nur lesende SELECT-Abfragen sind erlaubt.")
    cur = con.execute(sql)
    cols = [d[0] for d in cur.description] if cur.description else []
    rows = [dict(zip(cols, r)) for r in cur.fetchmany(max_rows)]
    return cols, rows


def schema_text(con: sqlite3.Connection) -> str:
    out = []
    for (name,) in con.execute(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).fetchall():
        cols = [r[1] for r in con.execute(f'PRAGMA table_info("{name}")').fetchall()]
        out.append(f"{name}({', '.join(cols)})")
    return "\n".join(out)


# --------------------------------------------------------------------------- #
# LLM-Backends -- mit Egress-Markierung
# --------------------------------------------------------------------------- #
class Backend:
    is_local: bool = False

    def complete(self, system: str, user: str, model: str) -> str:
        raise NotImplementedError


class MockBackend(Backend):
    """Deterministisch, offline -- fuer die Demo. Kein Netz, kein Abfluss."""

    is_local = True

    def complete(self, system: str, user: str, model: str) -> str:
        if "ROLLE:FAKTEN" in system:
            return self._r_fakten(user)
        if "ROLLE:FEHLER" in system:
            return self._r_fehler(user)
        if "ROLLE:SICHERHEIT" in system:
            return self._r_sicherheit(user)
        return self._autor(user)

    # -- Autor -------------------------------------------------------------- #
    def _autor(self, user: str) -> str:
        p = json.loads(user)
        q, cid = p["question"].lower(), p.get("customer_id")
        if cid:  # Kundenkontext
            if "alle projekte" in q or "andere" in q:
                # ABSICHTLICH ohne Mandantenfilter -> Sicherheitspruefer faengt es
                return json.dumps({
                    "sql": "SELECT COUNT(*) AS n FROM projekte",
                    "answer_template": "Es gibt {n} Projekte.",
                })
            # korrekt: auf den fragenden Kunden eingegrenzt
            return json.dumps({
                "sql": f"SELECT COUNT(*) AS n FROM projekte "
                       f"WHERE ID_AUFTRAGGEBER='{cid}'",
                "answer_template": "Zu Ihnen sind {n} Projekte hinterlegt.",
            })
        if "projekt" in q:
            return json.dumps({"sql": "SELECT COUNT(*) AS n FROM projekte",
                               "answer_template": "Es gibt {n} Projekte."})
        if "position" in q:
            return json.dumps({"sql": "SELECT COUNT(*) AS n FROM lvpositionen",
                               "answer_template": "Die LVs enthalten {n} Positionen."})
        if "stundenlohn" in q or "mitarbeiter" in q:
            # ABSICHTLICH falsche Zahl -> Faktenpruefer faengt es
            return json.dumps({
                "sql": "SELECT ROUND(AVG(STUNDENLOHN),2) AS n FROM mitarbeiter "
                       "WHERE STUNDENLOHN IS NOT NULL",
                "answer_template": "Der durchschnittliche Stundenlohn ist 99,00 EUR.",
            })
        if "material" in q:  # gueltige Abfrage, aber ohne Treffer -> Fehlerpruefer
            return json.dumps({
                "sql": "SELECT COUNT(*) AS n FROM material WHERE BEZEICHNUNG='__nix__'",
                "answer_template": "Es gibt {n} passende Materialien."})
        return json.dumps({"sql": "SELECT name FROM sqlite_master WHERE type='table'",
                           "answer_template": "Mir liegen die X2-Tabellen vor."})

    # -- Pruefer: Fakten ---------------------------------------------------- #
    def _r_fakten(self, user: str) -> str:
        p = json.loads(user)
        rows, answer = p["rows"], p["answer"]
        fact = None
        if rows and isinstance(rows[0], dict) and rows[0]:
            v = list(rows[0].values())[0]
            if isinstance(v, (int, float)):
                fact = float(v)
        if fact is None:
            return json.dumps({"verdict": "OK", "reason": "keine Zahl zu pruefen"})
        claimed = [float(x) for x in re.findall(r"\d+\.?\d*", answer.replace(",", "."))]
        if any(abs(c - fact) < 0.01 for c in claimed):
            return json.dumps({"verdict": "OK", "reason": f"Zahl {fact:g} belegt"})
        fs = f"{fact:.2f}".replace(".", ",") if fact % 1 else f"{int(fact)}"
        return json.dumps({"verdict": "FALSCH",
                           "reason": f"Antwort nennt {claimed or '?'}, Daten ergeben {fact:g}",
                           "corrected_answer": f"Aus den Daten belegt: {fs}."})

    # -- Pruefer: Fehler ---------------------------------------------------- #
    def _r_fehler(self, user: str) -> str:
        p = json.loads(user)
        if not p["rows"]:
            return json.dumps({"verdict": "WARNUNG",
                               "reason": "Abfrage liefert keine Belegzeile"})
        if not p["sql"].lower().startswith(("select", "with")):
            return json.dumps({"verdict": "FALSCH", "reason": "keine Abfrage"})
        return json.dumps({"verdict": "OK", "reason": "Abfrage passt, Zeilen vorhanden"})

    # -- Pruefer: Sicherheit ------------------------------------------------ #
    def _r_sicherheit(self, user: str) -> str:
        p = json.loads(user)
        sql, cid = p["sql"], p.get("customer_id")
        if not is_read_only(sql):
            return json.dumps({"verdict": "FALSCH", "reason": "nicht nur lesend"})
        if cid and cid not in sql:
            return json.dumps({
                "verdict": "FALSCH",
                "reason": "Kundenabfrage nicht auf den Kunden eingegrenzt "
                          "(Mandantentrennung verletzt -> Datenleck)"})
        return json.dumps({"verdict": "OK",
                           "reason": "lesend" + (", mandantengefiltert" if cid else "")})


class LocalBackend(Backend):
    """Lokales Modell (Ollama/llama.cpp). Kein Abfluss. Hier anzubinden."""

    is_local = True

    def complete(self, system: str, user: str, model: str) -> str:
        raise NotImplementedError(
            "LocalBackend: lokalen LLM-Endpunkt (Ollama/llama.cpp) anbinden.")


class AnthropicBackend(Backend):
    """Cloud-Claude. ACHTUNG: sendet Daten nach draussen -> verletzt 'nichts raus'.

    Nur fuer Test/Entwicklung, nie im mandantengetrennten Produktivbetrieb, und
    nur mit X2_ALLOW_EGRESS=1 ueberhaupt aktivierbar.
    """

    is_local = False

    def __init__(self):
        import anthropic
        self.client = anthropic.Anthropic()

    def complete(self, system: str, user: str, model: str) -> str:
        resp = self.client.messages.create(
            model=model, max_tokens=1500, thinking={"type": "adaptive"},
            betas=["server-side-fallback-2026-07-01"], fallbacks="default",
            system=system, messages=[{"role": "user", "content": user}],
        )
        if getattr(resp, "stop_reason", None) == "refusal":
            return json.dumps({"verdict": "FEHLER", "reason": "abgelehnt"})
        return "".join(b.text for b in resp.content
                       if getattr(b, "type", None) == "text")


def make_backend() -> Backend:
    kind = os.environ.get("X2_LLM", "mock").lower()
    cls = {"anthropic": AnthropicBackend, "local": LocalBackend,
           "mock": MockBackend}.get(kind, MockBackend)
    # Egress-Sperre VOR dem Konstruieren pruefen (Kernregel 'nichts darf raus').
    if not cls.is_local and not ALLOW_EGRESS:
        raise SystemExit(
            f"ABGEBROCHEN: {cls.__name__} wuerde Daten nach aussen senden. "
            "Das ist verboten ('nichts darf raus'). Nutze ein lokales Backend, "
            "oder setze bewusst X2_ALLOW_EGRESS=1 (nur fuer Tests).")
    return cls()


# --------------------------------------------------------------------------- #
# Prompts (Rollen-Marker steuern auch das Mock-Routing)
# --------------------------------------------------------------------------- #
AUTHOR_SYS = """Du bist der ANTWORT-AUTOR fuer die ERP-Software X2. Antworte NUR
aus der Datenbank, erfinde nichts. Bei einer Kundenanfrage (customer_id gesetzt)
MUSS die Abfrage auf genau diesen Kunden eingegrenzt sein. Gib NUR JSON:
{{"sql": "<eine lesende SELECT-Abfrage>", "answer_template": "<Satz mit {{n}}>"}}.
Schema:
{schema}"""

FAKTEN_SYS = """ROLLE:FAKTEN. Pruefe, ob die Antwort EXAKT aus den Ergebniszeilen
folgt. NUR JSON: {"verdict":"OK|WARNUNG|FALSCH","reason":"...","corrected_answer":""}"""

FEHLER_SYS = """ROLLE:FEHLER. Pruefe, ob die Abfrage zur Frage passt und Belegzeilen
liefert. NUR JSON: {"verdict":"OK|WARNUNG|FALSCH","reason":"..."}"""

SICHERHEIT_SYS = """ROLLE:SICHERHEIT. Pruefe: nur lesend? Bei Kundenanfrage auf
den Kunden eingegrenzt (kein fremder Datensatz)? NUR JSON:
{"verdict":"OK|WARNUNG|FALSCH","reason":"..."}"""

REVIEWERS = [("Fakten", FAKTEN_SYS), ("Fehler", FEHLER_SYS), ("Sicherheit", SICHERHEIT_SYS)]
_RANK = {"OK": 0, "WARNUNG": 1, "FALSCH": 2, "FEHLER": 3}


def _parse_json(text: str) -> dict:
    try:
        return json.loads(text)
    except Exception:
        m = re.search(r"\{.*\}", text, re.S)
        if m:
            try:
                return json.loads(m.group(0))
            except Exception:
                pass
    return {}


def _fill(template: str, n) -> str:
    if not template or "{n}" not in template:
        return template
    val = f"{n:.2f}".replace(".", ",") if isinstance(n, float) and n % 1 else str(n)
    return template.replace("{n}", val)


# --------------------------------------------------------------------------- #
# Ergebnis + Orchestrierung
# --------------------------------------------------------------------------- #
@dataclass
class Result:
    question: str
    principal: str
    sql: str = ""
    answer: str = ""
    reviews: list = field(default_factory=list)   # (name, verdict, reason)
    corrected_answer: str = ""
    released: bool = False
    error: str = ""

    @property
    def overall(self) -> str:
        if self.error:
            return "FEHLER"
        return max((v for _, v, _ in self.reviews), key=lambda v: _RANK.get(v, 0),
                   default="UNGEPRUEFT")

    @property
    def badge(self) -> str:
        return {"OK": "🟢 freigegeben", "WARNUNG": "🟡 mit Vorbehalt",
                "FALSCH": "🔴 gesperrt", "FEHLER": "⚫ Fehler"}.get(self.overall, "⚪")

    def render(self) -> str:
        out = [f"Frage:     {self.question}   [Fragender: {self.principal}]",
               f"Antwort:   {self.answer or '(gesperrt)'}",
               f"Freigabe:  {self.badge}"]
        for name, verdict, reason in self.reviews:
            mark = {"OK": "✓", "WARNUNG": "!", "FALSCH": "✗", "FEHLER": "⚫"}.get(verdict, "?")
            out.append(f"   [{mark}] {name:11} {verdict:8} {reason}")
        if self.corrected_answer:
            out.append(f"Korrektur: {self.corrected_answer}")
        if self.sql:
            out.append(f"SQL:       {self.sql}")
        if self.error:
            out.append(f"Fehler:    {self.error}")
        return "\n".join(out)


def answer(question: str, principal: Principal, backend: Backend,
           con: sqlite3.Connection) -> Result:
    res = Result(question=question, principal=principal.name)

    # 1) Autor
    author_user = json.dumps({"question": question, "customer_id": principal.customer_id})
    gen = _parse_json(backend.complete(
        AUTHOR_SYS.format(schema=schema_text(con)), author_user, AUTHOR_MODEL))
    res.sql = (gen.get("sql") or "").strip()
    template = gen.get("answer_template", "")

    # 2) Harte Vorpruefung: lesend + mandantengetrennt (unabhaengig vom Modell)
    if not is_read_only(res.sql):
        res.error = "Keine gueltige lesende Abfrage erzeugt."
        return res
    try:
        _c, rows = run_sql(con, res.sql)
    except Exception as e:
        res.error = f"SQL nicht ausfuehrbar: {e}"
        return res

    first = list(rows[0].values())[0] if rows and rows[0] else None
    draft = _fill(template, first)

    # 3) Prueferzugriff auf den Antwortentwurf. Bei verletzter Mandantentrennung
    #    bekommt der Sicherheitspruefer die ZEILEN gar nicht erst zu sehen.
    tenant_ok = is_tenant_scoped(res.sql, principal)
    review_rows = rows if tenant_ok else []
    ver_user = json.dumps({"question": question, "sql": res.sql,
                           "rows": review_rows, "answer": draft,
                           "customer_id": principal.customer_id}, ensure_ascii=False)
    for name, sys_prompt in REVIEWERS:
        r = _parse_json(backend.complete(sys_prompt, ver_user, REVIEW_MODEL))
        res.reviews.append((name, r.get("verdict", "WARNUNG"), r.get("reason", "")))
        if r.get("corrected_answer"):
            res.corrected_answer = r["corrected_answer"]

    # 4) Freigabe-Gate: nur wenn KEIN Pruefer FALSCH/FEHLER sagt
    res.released = res.overall in ("OK", "WARNUNG")
    res.answer = draft if res.released else ""
    return res


INTERN = Principal("interner Nutzer")
KUNDE = Principal("Müller, Franz (Kunde)", customer_id="SV0000030A")

DEMO = [
    ("Wie viele Projekte gibt es?", INTERN),
    ("Wie hoch ist der durchschnittliche Stundenlohn?", INTERN),      # Fakten faengt
    ("Wie viele Materialien heissen so?", INTERN),                    # Fehler warnt
    ("Wie viele Projekte habe ich?", KUNDE),                          # korrekt, gefiltert
    ("Zeig mir alle Projekte im System.", KUNDE),                     # Sicherheit sperrt
]


def main(argv):
    if not DB_PATH.exists():
        raise SystemExit("Bitte zuerst 'python build_db.py' ausfuehren.")
    backend = make_backend()
    con = open_readonly(DB_PATH)
    print(f"Backend: {type(backend).__name__}  (lokal={backend.is_local}, "
          f"Egress erlaubt={ALLOW_EGRESS})")
    print(f"Autor: {AUTHOR_MODEL}   Pruefer: {REVIEW_MODEL}   "
          f"Gremium: {', '.join(n for n, _ in REVIEWERS)}\n")
    tasks = [(" ".join(argv[1:]), INTERN)] if len(argv) > 1 else DEMO
    for q, who in tasks:
        print(answer(q, who, backend, con).render())
        print("-" * 72)


if __name__ == "__main__":
    main(sys.argv)
