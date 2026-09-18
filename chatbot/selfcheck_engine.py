#!/usr/bin/env python3
"""Selbstpruefender X2-Chatbot -- Kern (Prototyp).

Idee: Jede Antwort wird von einem ZWEITEN, unabhaengigen Modell gegengeprueft,
bevor der Nutzer sie sieht. Kein "die KI hat halt was gesagt", sondern:

    Frage --> [Modell A: Autor] --> SQL + Antwort
                                       |
                                       v  (SQL wird NUR LESEND ausgefuehrt)
                                    echte Zeilen aus der DB
                                       |
                                       v
              [Modell B: Pruefer] --> Urteil: OK / WARNUNG / FALSCH  (+ Begruendung)
                                       |
                                       v
                          Nutzer sieht Antwort + Vertrauens-Ampel

Warum das fuer ein ERP der Kern des Produkts ist: Ein Chatbot, der bei
Geschaeftszahlen frei halluziniert, ist unbrauchbar. Die zweite Instanz macht aus
"plausibel klingend" ein "gegen die echten Daten geprueft".

Zwei Austauschpunkte, sonst nichts:
  * Datenquelle: hier SQLite (Demo). Produktiv -> lesender Zugriff auf die
    Advantage-DB von X2. Die Engine bleibt gleich.
  * LLM-Backend: hier per Default ein deterministischer MOCK (laeuft ohne
    Netz/Key). Fuer den echten Betrieb: AnthropicBackend (Claude) ODER ein
    lokales Modell (Ollama/llama.cpp) -- Letzteres, wenn keine Daten das Haus
    verlassen duerfen.

Aufruf:
    python build_db.py            # einmalig: Demo-DB erzeugen
    python selfcheck_engine.py    # Demo-Fragen mit Selbstpruefung
    python selfcheck_engine.py "Wie viele Projekte gibt es?"
    X2_LLM=anthropic python selfcheck_engine.py "..."   # echtes Claude-Backend
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

# Generator = starkes Modell (Autor der Antwort), Pruefer = zweites Modell.
# Der Pruefer darf bewusst ein guenstigeres Modell sein -- Pruefen ist leichter
# als Formulieren. Beide Rollen MUESSEN getrennte Aufrufe sein, sonst prueft
# sich das Modell selbst und der Effekt verpufft.
GENERATOR_MODEL = os.environ.get("X2_GEN_MODEL", "claude-opus-5")
VERIFIER_MODEL = os.environ.get("X2_VER_MODEL", "claude-sonnet-5")


# --------------------------------------------------------------------------- #
# Schreibschutz: die Engine darf die DB niemals veraendern.
# --------------------------------------------------------------------------- #
_FORBIDDEN = re.compile(
    r"\b(insert|update|delete|drop|alter|create|replace|attach|detach|"
    r"pragma|vacuum|reindex|truncate|grant|revoke)\b",
    re.I,
)


def is_read_only(sql: str) -> bool:
    """True nur fuer eine einzelne lesende SELECT/WITH-Anweisung."""
    s = sql.strip().rstrip(";").strip()
    if not s:
        return False
    if ";" in s:  # keine Mehrfach-Anweisungen
        return False
    if _FORBIDDEN.search(s):
        return False
    return s.lower().startswith(("select", "with"))


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
    """Kompakte Schema-Beschreibung fuer den Prompt (Tabellen + Spalten)."""
    out = []
    for (name,) in con.execute(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).fetchall():
        cols = [r[1] for r in con.execute(f'PRAGMA table_info("{name}")').fetchall()]
        out.append(f"{name}({', '.join(cols)})")
    return "\n".join(out)


# --------------------------------------------------------------------------- #
# Ergebnis-Objekt
# --------------------------------------------------------------------------- #
@dataclass
class Result:
    question: str
    sql: str = ""
    answer: str = ""
    rows: list = field(default_factory=list)
    verdict: str = "UNGEPRUEFT"       # OK | WARNUNG | FALSCH | FEHLER
    verifier_reason: str = ""
    corrected_answer: str = ""
    error: str = ""

    @property
    def trust_badge(self) -> str:
        return {
            "OK": "🟢 geprueft",
            "WARNUNG": "🟡 mit Vorbehalt",
            "FALSCH": "🔴 nicht bestanden",
            "FEHLER": "⚫ Fehler",
        }.get(self.verdict, "⚪ ungeprueft")

    def render(self) -> str:
        lines = [
            f"Frage:    {self.question}",
            f"Antwort:  {self.answer or '(keine)'}",
            f"Vertrauen: {self.trust_badge}",
        ]
        if self.verifier_reason:
            lines.append(f"Pruefer:  {self.verifier_reason}")
        if self.corrected_answer:
            lines.append(f"Korrektur: {self.corrected_answer}")
        if self.sql:
            lines.append(f"SQL:      {self.sql}")
        if self.error:
            lines.append(f"Fehler:   {self.error}")
        return "\n".join(lines)


# --------------------------------------------------------------------------- #
# LLM-Backends
# --------------------------------------------------------------------------- #
class Backend:
    """Schnittstelle: eine Roh-Textantwort auf (system, user) liefern."""

    def complete(self, system: str, user: str, model: str) -> str:
        raise NotImplementedError


class AnthropicBackend(Backend):
    """Echtes Claude-Backend. Nutzt das offizielle Anthropic-SDK.

    Aktiviert mit  X2_LLM=anthropic  und gesetztem ANTHROPIC_API_KEY (oder
    `ant auth login`). Fuer strengen Datenschutz stattdessen LocalBackend.
    """

    def __init__(self):
        import anthropic  # nur importieren, wenn tatsaechlich verwendet

        self.client = anthropic.Anthropic()

    def complete(self, system: str, user: str, model: str) -> str:
        resp = self.client.messages.create(
            model=model,
            max_tokens=1500,
            thinking={"type": "adaptive"},
            # Standard-Refusal-Fallback fuer Opus/Fable aktiviert.
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        if getattr(resp, "stop_reason", None) == "refusal":
            return json.dumps({"answer": "", "sql": "", "verdict": "FEHLER",
                               "reason": "Anfrage wurde abgelehnt."})
        return "".join(
            b.text for b in resp.content if getattr(b, "type", None) == "text"
        )


class LocalBackend(Backend):
    """Lokales Modell ueber eine OpenAI-kompatible Ollama-/llama.cpp-Schnittstelle.

    Platzhalter fuer den datensparsamen Betrieb (keine Daten verlassen das Haus).
    Absichtlich nicht ausimplementiert -- Endpunkt/Client projektabhaengig.
    """

    def complete(self, system: str, user: str, model: str) -> str:
        raise NotImplementedError(
            "LocalBackend: hier den lokalen LLM-Endpunkt (Ollama/llama.cpp) anbinden."
        )


class MockBackend(Backend):
    """Deterministischer Ersatz -- damit der Prototyp OHNE Netz/Key laeuft.

    Er bildet den Zwei-Rollen-Ablauf echt ab: Der Generator liefert SQL + Antwort
    per einfacher Stichwort-Zuordnung, der Pruefer rechnet die Antwort GEGEN die
    echten SQL-Ergebnisse nach. So zeigt die Demo eine bestandene UND eine
    absichtlich falsche Antwort, die der Pruefer faengt.
    """

    def complete(self, system: str, user: str, model: str) -> str:
        if "PRUEFER" in system:
            return self._verify(user)
        return self._generate(user)

    # -- Generator-Rolle ---------------------------------------------------- #
    def _generate(self, user: str) -> str:
        q = user.lower()
        if "projekt" in q and "wie viele" in q:
            return json.dumps({
                "sql": "SELECT COUNT(*) AS n FROM projekte",
                "answer_template": "Es gibt {n} Projekte.",
            })
        if "firm" in q:  # Firmenadressen
            return json.dumps({
                "sql": "SELECT COUNT(*) AS n FROM adressen WHERE FLAG_FIRMA=1",
                "answer_template": "Es sind {n} Firmen als Adresse hinterlegt.",
            })
        if "position" in q:
            return json.dumps({
                "sql": "SELECT COUNT(*) AS n FROM lvpositionen",
                "answer_template": "Die Leistungsverzeichnisse enthalten {n} Positionen.",
            })
        if "stundenlohn" in q or "mitarbeiter" in q:
            # ABSICHTLICH falsche Antwort (99,00), um den Pruefer zu zeigen:
            return json.dumps({
                "sql": "SELECT ROUND(AVG(STUNDENLOHN),2) AS n FROM mitarbeiter "
                       "WHERE STUNDENLOHN IS NOT NULL",
                "answer_template": "Der durchschnittliche Stundenlohn betraegt 99,00 EUR.",
            })
        return json.dumps({
            "sql": "SELECT name FROM sqlite_master WHERE type='table'",
            "answer_template": "Dazu liegen mir die Tabellen der X2-Datenbank vor.",
        })

    # -- Pruefer-Rolle ------------------------------------------------------ #
    def _verify(self, user: str) -> str:
        payload = json.loads(user)
        answer = payload["answer"]
        rows = payload["rows"]
        # Der Pruefer zieht die belegte Zahl aus den echten Zeilen ...
        fact = None
        if rows and isinstance(rows[0], dict) and rows[0]:
            v = list(rows[0].values())[0]
            if isinstance(v, (int, float)):
                fact = v
        # ... und vergleicht sie mit der Zahl in der Antwort.
        claimed_nums = [float(x) for x in re.findall(r"\d+\.?\d*", answer.replace(",", "."))]
        if fact is None:
            return json.dumps({"verdict": "WARNUNG",
                               "reason": "Kein eindeutiger Zahlenbeleg in den Daten."})
        if any(abs(c - float(fact)) < 0.01 for c in claimed_nums):
            return json.dumps({"verdict": "OK",
                               "reason": f"Zahl {fact} durch Abfrage belegt."})
        fact_str = (f"{fact:.2f}".replace(".", ",")
                    if isinstance(fact, float) else str(fact))
        return json.dumps({
            "verdict": "FALSCH",
            "reason": f"Antwort nennt {claimed_nums or '?'}, Daten ergeben {fact}.",
            "corrected_answer": f"Aus den Daten belegt: {fact_str}.",
        })


def _fill(template: str, n) -> str:
    if not template:
        return ""
    val = f"{n:.2f}".replace(".", ",") if isinstance(n, float) else str(n)
    return template.replace("{n}", val)


def make_backend() -> Backend:
    kind = os.environ.get("X2_LLM", "mock").lower()
    return {"anthropic": AnthropicBackend, "local": LocalBackend, "mock": MockBackend}.get(
        kind, MockBackend
    )()


# --------------------------------------------------------------------------- #
# Prompts
# --------------------------------------------------------------------------- #
GEN_SYSTEM = """Du bist der ANTWORT-AUTOR eines Assistenten fuer die ERP-Software X2.
Beantworte die Frage AUSSCHLIESSLICH aus der Datenbank. Erfinde keine Zahlen.
Gib NUR JSON zurueck: {{"sql": "<eine lesende SELECT-Abfrage>",
"answer_template": "<Antwortsatz mit {{n}} als Platzhalter fuer das Ergebnis>"}}.
Schema:
{schema}"""

VER_SYSTEM = """Du bist der PRUEFER. Ein zweiter, unabhaengiger Kontrolleur.
Dir liegen Frage, ausgefuehrte SQL-Abfrage, die ECHTEN Ergebniszeilen und die
vorgeschlagene Antwort vor. Pruefe, ob die Antwort exakt aus den Zeilen folgt.
Gib NUR JSON zurueck: {"verdict": "OK|WARNUNG|FALSCH", "reason": "<kurz>",
"corrected_answer": "<nur falls FALSCH, sonst leer>"}."""


def _parse_json(text: str) -> dict:
    """Tolerantes JSON aus einer Modellantwort ziehen."""
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


# --------------------------------------------------------------------------- #
# Orchestrierung: erst antworten, dann pruefen
# --------------------------------------------------------------------------- #
def answer(question: str, backend: Backend, con: sqlite3.Connection) -> Result:
    res = Result(question=question)

    # 1) Generator: Frage -> SQL + Antwortvorlage
    gen_raw = backend.complete(
        GEN_SYSTEM.format(schema=schema_text(con)), question, GENERATOR_MODEL
    )
    gen = _parse_json(gen_raw)
    res.sql = (gen.get("sql") or "").strip()
    template = gen.get("answer_template", "")

    # 2) SQL nur lesend ausfuehren
    if not res.sql or not is_read_only(res.sql):
        res.verdict, res.error = "FEHLER", "Keine gueltige lesende Abfrage erzeugt."
        return res
    try:
        _cols, res.rows = run_sql(con, res.sql)
    except Exception as e:  # defekte Abfrage ist selbst ein Pruefergebnis
        res.verdict, res.error = "FEHLER", f"SQL nicht ausfuehrbar: {e}"
        return res

    # Antwort aus Vorlage + erstem Ergebniswert fuellen
    first_val = list(res.rows[0].values())[0] if res.rows and res.rows[0] else None
    res.answer = _fill(template, first_val) if "{n}" in template else template

    # 3) Pruefer: unabhaengiges zweites Modell rechnet gegen die echten Zeilen
    ver_user = json.dumps({
        "question": question, "sql": res.sql, "rows": res.rows,
        "answer": res.answer, "answer_template": template,
    }, ensure_ascii=False)
    ver = _parse_json(backend.complete(VER_SYSTEM, ver_user, VERIFIER_MODEL))
    res.verdict = ver.get("verdict", "WARNUNG")
    res.verifier_reason = ver.get("reason", "")
    res.corrected_answer = ver.get("corrected_answer", "")
    return res


DEMO_QUESTIONS = [
    "Wie viele Projekte gibt es?",
    "Wie viele Firmen sind als Adresse hinterlegt?",
    "Wie viele Positionen haben die Leistungsverzeichnisse?",
    "Wie hoch ist der durchschnittliche Stundenlohn der Mitarbeiter?",  # Falle
]


def main(argv):
    if not DB_PATH.exists():
        raise SystemExit("Bitte zuerst 'python build_db.py' ausfuehren.")
    backend = make_backend()
    con = open_readonly(DB_PATH)
    questions = [" ".join(argv[1:])] if len(argv) > 1 else DEMO_QUESTIONS
    print(f"Backend: {type(backend).__name__}   "
          f"Generator: {GENERATOR_MODEL}   Pruefer: {VERIFIER_MODEL}\n")
    for q in questions:
        print(answer(q, backend, con).render())
        print("-" * 68)


if __name__ == "__main__":
    main(sys.argv)
