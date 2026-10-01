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

**2026-10-01 (D-36):** las 10 skills restantes (`manager`,
`product-agent`, `qa-automation1`, `discovery`, `especificacion`,
`plan-automatizacion`, `git`, `ejecucion`, `automation-review`,
`bug-reporting`) también se archivaron. Las reemplaza un solo documento,
`docs/lote.md`: cada regla quedó en un único lugar (el cómo en
`docs/lote.md`, el porqué en `docs/decisiones.md`, el control en los
validadores).

`implementation-plan` indicaba usar `cy.reconPage`/`cy.reconSubmit`, ya
prohibidos: la exploración con navegador ahora es `v3/scripts/explore-page.js`.
