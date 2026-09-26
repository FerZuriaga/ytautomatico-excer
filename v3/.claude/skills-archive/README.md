# Skills archivadas de la v3

Archivadas el 2026-09-25 al simplificar la v3 de 13 skills de fase a 7.
Se conservan como referencia histórica: Claude Code NO las registra
(no están en `v3/.claude/skills/`).

| Skill archivada | Reemplazada por |
|---|---|
| application-discovery | `discovery` (Parte A) |
| scenario-builder, testcase-model | `especificacion` |
| ticket-analysis, framework-analysis, implementation-plan | `plan-automatizacion` |
| branch-management, git-workflow | `git` |
| test-execution, execution-validation | `ejecucion` (sobre `run-and-report.js`) |
| executive-summary | sin reemplazo: no formaba parte del flujo |

`implementation-plan` indicaba usar `cy.reconPage`/`cy.reconSubmit`, ya
prohibidos: la exploración con navegador ahora es `v3/scripts/explore-page.js`.
