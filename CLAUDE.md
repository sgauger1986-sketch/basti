# Projektregeln für Claude

## Skills (nur laden, wenn die Aufgabe passt)

Die Skills liegen unter `.claude/skills/`. Jeder Skill-Aufruf kostet Tokens, deshalb gilt: nur laden, wenn die Aufgabe es wirklich braucht, nie vorsorglich.

- **stop-slop**: bei längeren Texten für andere Leser (Dokumente, README, PR-Beschreibungen). Nicht für kurze Chat-Antworten.
- **ui-ux-pro-max** (plus `design`, `design-system`, `ui-styling`, `brand`, `banner-design`, `slides`): bei UI-, Design- oder Präsentationsarbeit. Nur den einen passenden Skill laden, nicht alle.
- **find-skills**: wenn eine Fähigkeit fehlt oder der Nutzer fragt, ob es einen Skill für etwas gibt.
- **free-llm-apis**: wenn es um kostenlose LLM-APIs, Modelle oder API-Keys geht.
- **unlazy**: nur wenn der Nutzer es verlangt (`/unlazy`, "gates", "hör nicht auf, bis es fertig ist") oder bei großen Aufgaben mit vielen Teilschritten. Dann Gates in `GATES.md` schreiben und erst "fertig" melden, wenn `node .claude/skills/unlazy/scripts/gate-check.mjs GATES.md` grün ist.
- **task-observer** ("One Skill to Rule Them All"): nur auf ausdrücklichen Wunsch des Nutzers, nicht automatisch zu Sessionbeginn. Beobachtungs-Workspace: `skill-observations/` im Repo-Root.

## Herkunft der Skills

| Skill | Quelle | Stand |
|---|---|---|
| stop-slop | github.com/hardikpandya/stop-slop | 8da1f03 |
| task-observer | github.com/rebelytics/one-skill-to-rule-them-all | c479475 |
| ui-ux-pro-max & Co. | github.com/nextlevelbuilder/ui-ux-pro-max-skill | 09170ee |
| find-skills | github.com/vercel-labs/skills | 3694740 |
| free-llm-apis | github.com/open-free-llm-api/awesome-freellm-apis | 058cc76 |
| unlazy | github.com/Leonxlnx/unlazy | 1667149 |

claude-mem (github.com/thedotmack/claude-mem) ist ein Plugin mit Hooks und Hintergrunddienst, kein reiner Skill, und ist hier noch nicht aktiviert.
