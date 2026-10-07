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
| **Jira** (issues, HU, Bugs, transiciones) | Gestión de tickets | `v3/scripts/lib/jira.js` (credenciales `JIRA_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`) | `create-jira-task.js` y `check-traceability.js` vía `lib/tools.js`; `lib/xray.js` directo | `credenciales-jira-xray`, `uso-adapters-jira-xray` |
| **Xray** (Test Cases, pasos, ciclos, resultados) | Gestión de pruebas | `v3/scripts/lib/xray.js` (credenciales `XRAY_CLIENT_ID`, `XRAY_CLIENT_SECRET`) | los 3 CLIs vía `lib/tools.js` | idem |
| **Cypress** (arranque del runner) | Ejecutar tests y explorar pantallas | `v3/scripts/run-and-report.js` (PASO 3), `v3/scripts/explore-page.js` (PASO 1) | — | `arranque-cypress` |
| **Cypress en GitHub Actions** | Corrida nocturna de Notes App (D-06) | `.github/workflows/nocturna-notes.yml` | — | — |
| **GitHub Actions en cada PR** | Lint + unitarios; E2E afectados listos y apagados (D-06, D-43, D-49); se prenden con `create-pull-request.js --action ci-variable --name QA_PR_E2E --value true` | `.github/workflows/pr.yml` | — | — |
| **Cypress** (formato de resultados) | Leer el reporte JSON de Mocha | `v3/scripts/lib/test-runner.js` | `run-and-report.js`, `create-jira-task.js` | (documentado en el archivo) |
| **GitHub** (PRs, merge, ramas) | Pull Requests | `v3/scripts/create-pull-request.js` (`GITHUB_TOKEN`, API REST; sin `gh`) | — | `github` |
| **APIs de las apps bajo prueba** | Preparar datos del discovery | motor general `v3/scripts/lib/data-recipe.js` + una receta JSON por app en `v3/data-recipes/<app>.json` | `explore-page.js` | — |

**Qué adapter habla con cada gestor:** `herramientas` de `qa.config.json`
(`gestorDePruebas`, `gestorDeTickets`). Los CLIs piden el adapter a
`lib/tools.js`, que lo valida contra su contrato al cargarlo (D-48).

**Nombres de la instancia** (clave del proyecto, tipos de issue, tipo de
vínculo, estados iniciales): en `qa.config.json`, sección `jira` (D-43).
Otra instancia de Jira es editar ese archivo, no el código.

**Particularidades de la instancia de Jira:**
- La cuenta de Jira (`JIRA_EMAIL` del `.env`) no es la misma que la del
  usuario de git: usar siempre la del `.env`.
- El tipo de HU se llama "Historia" y el de Bug se ve como "Error" (en el
  payload `"issuetype": "Bug"`).
- La transición para cerrar se llama **"Listo"**, pero el estado que queda
  es **"Finalizada"**: `--transition "Finalizada"` falla.
- **No hay estado "Cancelada"** (antes D-10): un ticket descartado pasa a
  "Finalizada" con un comentario aclaratorio. Solo se borra si el usuario lo
  pide (caso SCRUM-52; limpieza del 2026-07-21, SCRUM-1 a 42).
- Para saber si un addon (Xray, Zephyr) está instalado, la API no es
  concluyente: en proyectos team-managed y con apps Forge da falsos
  negativos. Confirmarlo en la UI del proyecto.

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
| `lib/run-timing.js` | Tiempos por fase de cada corrida y resumen del lote completo por rama (D-49) |
| `lib/metrics-log.js` | Registro de tiempos del lote: discovery, publicación, corridas, PR y merge (D-49) |
| `lib/explore-scenarios.js` | Formato de los escenarios del discovery |
| `lib/http-retry.js` | Reintentos ante fallas transitorias de red |
| `lib/test-manager-contract.js` | Contrato que cumple el adapter del gestor de pruebas: funciones, formas y estados (D-45) |
| `lib/issue-tracker-contract.js` | Contrato que cumple el adapter del gestor de tickets (HU, Bugs, labels, vínculos, transiciones; D-48) |
| `lib/tools.js` | Carga el adapter de cada gestor según `herramientas` de `qa.config.json` y lo valida contra su contrato (D-48) |
| `lib/http-body.js` | Lectura del cuerpo de las respuestas HTTP en UTF-8 (todos los adapters; sin caracteres partidos entre pedazos) |
| `lib/payload-builder.js` | Archivo de lote → payload de publicación (PASO 2) |
| `lib/bundle-scan.js` | Atributos de test y mensajes de validación del código de la app (discovery) |
| `lib/concurrency.js` | Llamadas en paralelo con límite (reporte a Xray) |
| `lib/trace-report.js` | Reporte público de trazabilidad en Markdown (`check-traceability.js --report`, D-41) |

## Artefactos por aplicación (datos, no código)

Cada app activa tiene todas estas piezas en su propia carpeta; `apps` de `qa.config.json` y
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

- **Otro gestor de pruebas en lugar de Xray:** un archivo nuevo en
  `v3/scripts/lib/` (ej. `testrail.js`) que cumpla el contrato de
  `lib/test-manager-contract.js` (funciones, formas y estados del
  framework; D-45), y `"gestorDePruebas": "testrail"` en `qa.config.json`.
  Si le falta una función, frena al cargarlo nombrándola (D-48). Los CLIs,
  los validadores y la trazabilidad no cambian.
- **Otro gestor de tickets en lugar de Jira:** lo mismo con
  `lib/issue-tracker-contract.js` y `"gestorDeTickets"`. Las descripciones
  (`build*Description`) son del adapter: Jira usa ADF, otro gestor puede
  usar Markdown. Ojo: Xray solo funciona sobre Jira, así que cambiar Jira
  implica también cambiar de gestor de pruebas.
- **Playwright en lugar de Cypress:** `lib/test-runner.js` (formato de
  resultados), los comandos de arranque de `run-and-report.js` y
  `explore-page.js`, y los specs y Page Objects. Por decisión del
  2026-09-28, **no** se aísla Cypress detrás de un adaptador por ahora (ver
  `docs/decisiones.md`).
- **Otro host de Git:** solo `create-pull-request.js`.
