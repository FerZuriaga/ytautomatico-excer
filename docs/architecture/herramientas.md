# Mapa de herramientas: qué vive dónde

Qué parte del repo habla con cada herramienta externa. El objetivo es que
cambiar una herramienta (Jira/Xray por otro gestor, Cypress por otro runner,
GitHub por otro host) sea tocar **los archivos de su fila y nada más**.

Las fronteras no dependen de que alguien las recuerde:
`v3/scripts/lib/architecture.js` las declara como reglas y
`npm run test:unit` falla si aparece un uso fuera de su lugar. Si un cambio
mueve una frontera a propósito, se actualizan las reglas **y** esta tabla en
el mismo commit.

## Herramientas externas

| Herramienta | Para qué | Único lugar donde vive | Quién lo usa | Regla |
|---|---|---|---|---|
| **Jira** (issues, HU, Bugs, transiciones) | Gestión de tickets | `v3/scripts/lib/jira.js` (credenciales `JIRA_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`) | `create-jira-task.js`, `run-and-report.js`, `check-traceability.js`, `lib/xray.js` | `credenciales-jira-xray`, `uso-adapters-jira-xray` |
| **Xray** (Test Cases, pasos, ciclos, resultados) | Gestión de pruebas | `v3/scripts/lib/xray.js` (credenciales `XRAY_CLIENT_ID`, `XRAY_CLIENT_SECRET`) | los mismos CLIs | idem |
| **Cypress** (arranque del runner) | Ejecutar tests y explorar pantallas | `v3/scripts/run-and-report.js` (PASO 3), `v3/scripts/explore-page.js` (PASO 1) | — | `arranque-cypress` |
| **Cypress** (formato de resultados) | Leer el reporte JSON de Mocha | `v3/scripts/lib/test-runner.js` | `run-and-report.js`, `create-jira-task.js` | (documentado en el archivo) |
| **GitHub** (PRs, merge, ramas) | Pull Requests | `v3/scripts/create-pull-request.js` (`GITHUB_TOKEN`, API REST; sin `gh`) | — | `github` |
| **APIs de las apps bajo prueba** | Preparar datos del discovery | motor general `v3/scripts/lib/data-recipe.js` + una receta JSON por app en `v3/data-recipes/<app>.json` | `explore-page.js` | — |

## Lógica independiente de las herramientas

Estas libs no hablan con ninguna herramienta externa: reciben datos y
devuelven errores, warnings o resultados. Se pueden reutilizar tal cual con
otro gestor u otro runner. Las reglas `libs-sin-procesos` y
`libs-sin-entorno` impiden que lancen procesos o lean credenciales.

| Archivo | Qué decide |
|---|---|
| `lib/testcase-validator.js` | Calidad de HU, CA y Test Cases antes de publicar |
| `lib/bug-validator.js` | Estándar de Bugs (secciones, evidencia, captura) |
| `lib/negative-evidence.js` | Que cada TC negativo tenga su exploración como evidencia |
| `lib/traceability.js` | Tags `[CA-XX][TC-XX.Y][KEY]` de los `it()` contra lo publicado |
| `lib/testcase-description.js` | Descripción estándar del Test Case |
| `lib/affected-specs.js` | Qué specs toca un cambio (`--affected`) |
| `lib/run-timing.js` | Tiempos por fase de cada corrida |
| `lib/explore-scenarios.js` | Formato de los escenarios del discovery |
| `lib/http-retry.js` | Reintentos ante fallas transitorias de red |
| `lib/payload-builder.js` | Archivo de lote → payload de publicación (PASO 2) |
| `lib/bundle-scan.js` | Atributos de test y mensajes de validación del código de la app (discovery) |
| `lib/concurrency.js` | Llamadas en paralelo con límite (reporte a Xray) |

## Artefactos por aplicación (datos, no código)

Cada app activa tiene todas estas piezas en su propia carpeta; `APPS` y
`checkAppLayout` de `lib/architecture.js` lo verifican en `test:unit`
(app sin declarar, pieza faltante, selector suelto o comandos sin importar
en `cypress/support/commands.js`).

| Qué | Dónde |
|---|---|
| Selectores relevados | `cypress/fixtures/selectors/<app>/<modulo>.json` |
| Hallazgos del discovery | `docs/discovery/<app>.md` |
| Recetas de datos por API | `v3/data-recipes/<app>.json` |
| URL base (se puede cambiar con `CYPRESS_<APP>_URL`) | `cypress.config.js` → `env` |

## Si mañana cambia una herramienta

- **Otro gestor de pruebas en lugar de Xray:** un adapter nuevo con la misma
  interfaz que `lib/xray.js`. Los validadores y la trazabilidad no cambian.
- **Playwright en lugar de Cypress:** `lib/test-runner.js` (formato de
  resultados), los comandos de arranque de `run-and-report.js` y
  `explore-page.js`, y los specs y Page Objects. Por decisión del
  2026-09-28, **no** se aísla Cypress detrás de un adaptador por ahora (ver
  `docs/decisiones.md`).
- **Otro host de Git:** solo `create-pull-request.js`.
