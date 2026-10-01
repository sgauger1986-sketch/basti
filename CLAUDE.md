# Projektregeln für Claude

## Pflicht-Skills (in jeder Session dieses Repos verwenden)

Die Skills liegen unter `.claude/skills/` und werden automatisch geladen.

- **task-observer** ("One Skill to Rule Them All"): vor dem ersten Tool-Call jeder Session laden. Beobachtungs-Workspace: `skill-observations/` im Repo-Root (wird mit committet, damit die Beobachtungen Container-Neustarts überleben).
- **stop-slop**: bei jedem Prosatext anwenden (Antworten, Dokumente, Commit-Messages, PR-Texte).
- **ui-ux-pro-max** (plus `design`, `design-system`, `ui-styling`, `brand`, `banner-design`, `slides`): bei jeder UI-, Design- oder Präsentationsarbeit.
- **find-skills**: wenn eine Fähigkeit fehlt oder der Nutzer fragt, ob es einen Skill für etwas gibt.
- **free-llm-apis**: wenn es um kostenlose LLM-APIs, Modelle oder API-Keys geht.
- **unlazy**: bei jeder längeren oder mehrteiligen Aufgabe: Gates in `GATES.md` schreiben, bevor die Arbeit beginnt, und erst "fertig" melden, wenn `node .claude/skills/unlazy/scripts/gate-check.mjs GATES.md` grün ist.

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
