# Architecture V2 — Fase 2: Diseño de Componentes

## 0. Estado y propósito

Este documento es la continuación de `docs/architecture/architecture-v2-phase1-responsibilities.md`
(Fase 1, **aprobada** — baseline de responsabilidades R1–R50, no se
rediscute aquí salvo contradicción objetiva) y de
`docs/architecture/architecture-v2-spec.md` (Fase 0, contexto arquitectónico
general).

**Esta fase no implementa código.** Diseña, a nivel de componentes, qué
Agents, Skills, Canonical Models, Capability Contracts y Adapters deben
existir para dar un dueño claro a cada responsabilidad de la Fase 1,
manteniendo alta cohesión, bajo acoplamiento y separación entre decisión,
conocimiento, procedimiento y ejecución.

Los componentes actuales (`.claude/agents/`, `.claude/skills/`, `scripts/`)
se tratan como **evidencia de cómo está implementada la V1**, no como el
resultado objetivo. Ningún nombre, agrupamiento o archivo actual sobrevive
por defecto — sobrevive solo si se justifica contra los 23 principios
obligatorios de esta fase.

No se elimina físicamente nada. Las decisiones de "eliminar/fusionar/
reclasificar" son arquitectónicas, ejecutables recién en una fase de
migración posterior y tras revisión humana.

---

## 1. Inventario de componentes actuales (evidencia)

Inspección directa del repositorio (no solo de los resúmenes de Fase 0/1).

### 1.1 Agents (`.claude/agents/`, 7 archivos)

| Agent | Líneas | Naturaleza real observada |
|---|---|---|
| `Manager` | 641 | Orquestador de 9 fases (numeradas 1–9, con fases 6/7 y 8/9 duplicadas literalmente — ver Gaps). Mezcla coordinación legítima con: validación de schema ajeno (FASE 4, valida campos del Modelo Canónico que ya valida `testcase-model`), nombres de scripts concretos ("PRINCIPIO DE UNA SOLA RESPONSABILIDAD"), y tres formatos de cierre distintos a los de otros Agents. |
| `QaAutomation1` | 636 | Domain Agent de automatización. Coordina 10 Skills. Contiene conocimiento explícito de Cypress/GitHub hardcodeado ("scripts/create-pull-request.js", convención de tag Zephyr en el `it()`) y duplica el formato de Executive Summary de `Manager`. |
| `productAgent` | 1025 | El más grande. Domain Agent de tickets, pero con el "conocimiento de integración" de Zephyr completamente filtrado dentro del prompt: nombres de link type de Jira, tipo `COVERAGE` de Zephyr, endpoints (`GET /testexecutions`, `PUT /testexecutions/{id}`), algoritmo de resolución de carpetas, nombre real de estados (`"Not Executed"`). Esto es exactamente lo que `implementation-contract.md` prohíbe. |
| `create-jira-task` | 172 | Wrapper de una sola tool MCP (`get_jira_issue`). Sin autoridad de decisión; el propio prompt deriva cualquier ambigüedad a `productAgent`. |
| `desarrollador` | 38 | Reencarnación completa e independiente del pipeline oficial (lee ticket → implementa → informa) sin coordinarse con `Manager`/`productAgent`/`QaAutomation1`. |
| `ejecutor` | 147 | De las 147 líneas, ~140 son boilerplate de memoria persistente (scaffolding estándar del harness); el contenido funcional real son 6 líneas que duplican `cypress-execution` + `execution-validation`. |
| `probando` | 147 | Misma proporción: ~140 líneas de boilerplate de memoria, 1 línea de contenido ("este tiene que hacer un prompt"). Artefacto experimental sin responsabilidad de producto. |

### 1.2 Skills (`.claude/skills/*/SKILL.md`, 13 archivos)

Todas comparten estructura similar (RESPONSABILIDAD / ENTRADA ESPERADA /
SALIDA OBLIGATORIA / RESTRICCIONES). Hallazgos por lectura completa:

- **Buen diseño ya alineado con V2** (framework-agnósticas, sin conocimiento de herramienta): `application-discovery`, `scenario-builder`, `testcase-model`, `ticket-analysis`, `execution-validation`.
- **Framework-agnósticas pero con fuga puntual**: `implementation-plan` menciona explícitamente `cy.intercept`, `.has-error`, `aria-invalid` en su sección "VALIDACIÓN DE CASOS NEGATIVOS Y DE BORDE" (confirma spec 1.7/C9).
- **Nombradas por la herramienta de hoy**: `cypress-execution` — su cuerpo es en realidad agnóstico ("ejecutar el mecanismo de ejecución definido por el proyecto"), solo el nombre y los ejemplos (`npx cypress run`) atan el nombre a Cypress.
- **Toman decisiones de dominio que no les corresponden (C8 confirmado por lectura)**: `branch-management`, `cypress-execution`, `execution-validation`, `framework-analysis`, `implementation-plan`, `ticket-analysis`, `testcase-model`, `bug-reporting`, `git-workflow` contienen frases como "detener el flujo", "informar el conflicto", "esperar instrucciones" como si la Skill decidiera el destino del flujo completo, en vez de devolver un veredicto al Agent invocador.
- **Duplicación de "Executive Summary" confirmada en 3 lugares además de `Manager`/`QaAutomation1`**: la skill `executive-summary` define un formato (`OBJETIVO/COMPONENTES_REUTILIZABLES/.../SIGUIENTE_PASO`), y la skill `automation-review` **reimplementa el mismo formato** dentro de su propia sección "Executive Summary" (líneas 220–236 de su `SKILL.md`), con exactamente los mismos 7 campos. Este es un cuarto punto de duplicación no documentado explícitamente en Fase 1, ahora confirmado por lectura directa.
- **`git-workflow`** mezcla tres capacidades de madurez distinta: commit/push (repetitivo, con lógica no trivial → Adapter/capability clara) y "creación de Pull Requests" (ya delega correctamente a `scripts/create-pull-request.js`, es decir, ya respeta la frontera de Adapter en la práctica, aunque el texto lo mezcla con reglas de commit).

### 1.3 Scripts e integraciones (`scripts/`, `scripts/lib/`, `mcp-jira/`)

Lectura de firmas de función (no solo conteo de líneas):

| Archivo | Funciones/responsabilidades reales encontradas |
|---|---|
| `scripts/create-jira-task.js` (747 líneas) | `jiraRequest` (transporte Jira) · `buildHistoriaDescription`/`buildBugDescription`/`buildTareaDescription` (plantillas de contenido de negocio en ADF) · `resolveTestCycle`/`resolveTestCaseFolder`/`createTestCasesBatch` (orquestación Zephyr — vuelve a implementar lógica que ya vive en `zephyr.js`, o la invoca) · `linkIssue`/`transitionIssue`/`addComment` (más transporte Jira) · `mapMochaStateToZephyr`/`collectTestsWithState`/`extractTestCaseKey` (**parsing de resultados de Cypress/Mocha — esto es responsabilidad del Test Runner, no de un script Jira/Zephyr**, hallazgo nuevo no señalado explícitamente en Fase 0/1) · `parseArgs`/`main` (CLI). **Confirmado: mezcla 5 responsabilidades, no 4** (transporte Jira, contenido de negocio, orquestación Zephyr, parsing de resultados de Test Runner, CLI). |
| `scripts/lib/zephyr.js` (466 líneas) | `zephyrRequest` + 16 funciones, todas transporte/orquestación puro de Zephyr (`createTestCase`, `createTestSteps`, `linkTestCaseToIssue`, `createTestCycle`, `createTestExecution`, `findFolder`/`createFolder`/`resolveFolderPath`, `findTestExecution`, `updateTestExecutionStatus`). **Sin conocimiento de Jira ni de negocio.** Adapter ya bien encapsulado — modelo a replicar. |
| `scripts/create-pull-request.js` (337 líneas) | `githubRequest` + `findExistingPullRequest`/`createPullRequest`/`mergePullRequest`/`resolveRepoFromGitRemote`. Adapter razonablemente enfocado, sin conocimiento de tickets. |
| `mcp-jira/index.js` (164 líneas) | Segundo cliente Jira independiente (`jiraRequest` propio, `AUTH`, `HOSTNAME` duplicados respecto a `create-jira-task.js`). Expone 3 tools MCP: `create_jira_issue`, `update_jira_issue` (ambas **muertas** en el flujo oficial — solo `productAgent` puede escribir, vía el script) y `get_jira_issue` (la única realmente usada, a través del Agent `create-jira-task`). |
| `scripts/create-tc16-ticket.js`, `create-tc21-ticket.js`, `create-test-case-4.js` | Confirmados obsoletos (spec 1.3, por git log). No se reutilizan en este diseño. |

### 1.4 Configuración

`.claude/settings.json` registra un único MCP server (`mcp-jira`, vía
`node mcp-jira/index.js`). No hay MCP servers para Zephyr, GitHub o Cypress
— esas integraciones son 100% scripts directos invocados por los Agents.

---

## 2. Matriz R1–R50 → Componente Objetivo V2

Fuente: `architecture-v2-phase1-responsibilities.md` sección 1 (ya
corregida). Tipos de componente usados: **Orchestrator**, **Domain Agent**,
**Skill**, **Canonical Model**, **Capability Contract**, **Adapter**,
**Tool**, **Cross-cutting Policy**. Cuando Fase 1 ya separó decisión de
ejecución (R18–R26), la matriz muestra ambas partes explícitamente.

| R | Dueño V2 | Tipo | Decide | Ejecuta | Valida | Conoce |
|---|---|---|---|---|---|---|
| R1 | Manager | Orchestrator | Manager | Manager | Manager | Tipos de insumo (app/URL vs ticket/HU/TC/rama) |
| R2 | Manager | Orchestrator | Manager | Manager | Manager | Orden de fases, agentes disponibles |
| R3 | Manager | Orchestrator | Manager | Manager | Manager | Estado de fases ya completadas en la sesión |
| R4 | Manager + Flow Result (Canonical Model) | Orchestrator / Canonical Model | Manager (cuándo cerrar) | Manager (agrega) + `executive-summary` (presenta) | Manager | Esquema del Flow Result |
| R5 | Manager | Orchestrator | Manager | Manager | Manager | Catálogo de decisiones funcionales válidas |
| R6 | `application-discovery` | Skill | — (informativo) | `application-discovery` | Manager | Fuentes funcionales de la app |
| R7 | `application-discovery` | Skill | — (informativo) | `application-discovery` | Manager | Criterios OBSERVADA/INFERIDA |
| R8 | `scenario-builder` | Skill | — | `scenario-builder` | Manager | Estructura del escenario funcional |
| R9 | `scenario-builder` | Skill | — | `scenario-builder` | Manager | Reglas de CA atómico |
| R10 | `scenario-builder` | Skill | — | `scenario-builder` | Manager | Reglas de cobertura TC (2–5, ≥1 negativo) |
| R11 | `scenario-builder` | Skill / Canonical Model (Traceability) | — | `scenario-builder` | Manager | Esquema de Traceability |
| R12 | `testcase-model` | Skill / Canonical Model (Test Case) | — | `testcase-model` | `testcase-model` (auto-validación) | Esquema del Test Case canónico |
| R13 | ProductAgent | Domain Agent | ProductAgent | ProductAgent | ProductAgent | Naturaleza de la solicitud (Historia/Bug/Tarea) |
| R14 | ProductAgent | Domain Agent | ProductAgent | ProductAgent | ProductAgent | Principio de transformación (síntesis, no copia) |
| R15 | `bug-reporting` (valida) + ProductAgent (decide creación) | Skill + Domain Agent | ProductAgent (crear o no el ticket) | `bug-reporting` (reporte) / Jira Adapter (si se crea) | QaAutomation1 (invoca), ProductAgent (aprueba) | Criterios de falso positivo |
| R16 | ProductAgent | Domain Agent | ProductAgent | ProductAgent | ProductAgent | Plantilla de Tarea |
| R17 | ProductAgent (decide) / Jira Adapter (ejecuta) | Domain Agent + Capability Contract | ProductAgent | Jira Adapter | ProductAgent | Iterations disponibles (vía `ConsultarIteraciones`) — nunca IDs internos de Sprint |
| R18 | ProductAgent (decide) / Jira Adapter (ejecuta) | Domain Agent + Adapter | ProductAgent | Jira Adapter | ProductAgent | Estado destino de negocio |
| R19 | ProductAgent (decide) / Jira Adapter (ejecuta) | Domain Agent + Adapter | ProductAgent | Jira Adapter | ProductAgent | Relación funcional entre tickets |
| R20 | Capability Contract "leer ticket" | Capability Contract | Agent autorizado (cuándo invocar) | Jira Adapter | — | Ninguno (dato plano) |
| R21 | ProductAgent (decide) / Zephyr Adapter (ejecuta) | Domain Agent + Adapter | ProductAgent | Zephyr Adapter | ProductAgent | Que el TC del Modelo Canónico debe existir en Zephyr |
| R22 | Zephyr Adapter | Adapter | ProductAgent (entrega `folder`) | Zephyr Adapter (algoritmo de resolución) | Zephyr Adapter | Algoritmo de carpetas (segmentos, `parentId`) |
| R23 | ProductAgent (decide) / Zephyr Adapter (ejecuta) | Domain Agent + Adapter | ProductAgent | Zephyr Adapter | ProductAgent | Que el vínculo de cobertura debe existir |
| R24 | ProductAgent (decide) / Zephyr Adapter (ejecuta) | Domain Agent + Adapter | ProductAgent | Zephyr Adapter | ProductAgent | Ciclo de la Historia (crear vs reutilizar) |
| R25 | ProductAgent/QaAutomation1 (decide) / Zephyr Adapter (ejecuta) | Domain Agent + Adapter | Quien posee el Execution Result | Zephyr Adapter | ProductAgent | Resultado de dominio (Pass/Fail/Blocked) |
| R26 | Zephyr Adapter | Adapter | — (sin decisión) | Zephyr Adapter | — | Nombre real del estado en Zephyr (`"Not Executed"`, etc.) |
| R27 | `ticket-analysis` | Skill | — | `ticket-analysis` | QaAutomation1 | — |
| R28 | `framework-analysis` | Skill | — | `framework-analysis` | QaAutomation1 | — |
| R29 | `implementation-plan` | Skill | — | `implementation-plan` | QaAutomation1 | — |
| R30 | QaAutomation1 | Domain Agent | QaAutomation1 | QaAutomation1 | `automation-review` | Framework detectado |
| R31 | `cypress-execution`* (Capability "ejecutar suite") | Skill / Capability Contract | — | Test Runner Adapter | `execution-validation` | — |
| R32 | `execution-validation` | Skill | QaAutomation1 (consume veredicto) | `execution-validation` | QaAutomation1 | Criterios de aprobación |
| R33 | `automation-review` | Skill | QaAutomation1 (consume veredicto) | `automation-review` | QaAutomation1 | — |
| R34 | `bug-reporting` | Skill | QaAutomation1 (qué hacer con el veredicto) | `bug-reporting` | QaAutomation1 | Criterios de falso positivo |
| R35 | QaAutomation1 (materializa) / Traceability (Canonical Model, dueño conceptual) | Domain Agent + Canonical Model | — | QaAutomation1 (tag en `it()`) | — | Esquema de Traceability (pendiente, ver sección 5 y 15) |
| R36 | `branch-management` | Skill | QaAutomation1 (consume recomendación) | `branch-management` (recomienda) / Git (ejecuta) | QaAutomation1 | — |
| R37 | `branch-management` / `git-workflow` | Skill | QaAutomation1 | ambas | QaAutomation1 | — |
| R38 | `git-workflow` | Skill / Adapter (Git CLI) | QaAutomation1 (cuándo) | Git CLI (directo) | `git-workflow` | — |
| R39 | `git-workflow` | Skill / Adapter (Git CLI) | QaAutomation1 (cuándo) | Git CLI (directo) | `git-workflow` | — |
| R40 | Capability "crear Pull Request" | Capability Contract | QaAutomation1 (cuándo) | GitHub Adapter | `git-workflow` | — |
| R41 | Usuario (fuera del sistema de Agents) | External Boundary / Cross-cutting Policy | Usuario | Usuario (acción manual) | — | — |
| R42 | `executive-summary` (Skill) + Flow Result (Canonical Model) | Skill / Canonical Model | — (agregación, no decisión) | `executive-summary` | Manager | Esquema del Flow Result |
| R43 | — (mecanismo contractual transversal) | Cross-cutting mechanism | — | Toda interfaz Agent↔Skill↔Adapter | — | Esquema `{estado, resultado, motivo, artefactos, identificadores, errores, bloqueos}` |
| R44 | Jira Adapter | Adapter | — | Jira Adapter | — | REST API de Jira |
| R45 | Zephyr Adapter | Adapter | — | Zephyr Adapter | — | REST API de Zephyr |
| R46 | GitHub Adapter | Adapter | — | GitHub Adapter | — | REST API de GitHub |
| R47 | Test Runner Adapter | Adapter | — | Test Runner Adapter | — | Proceso `npx cypress run` (hoy) |
| R48 | — | Cross-cutting Policy | Todos los Agents | — | Manager (control de instancias) | — |
| R49 | — | Cross-cutting Policy | Todos los Agents/Skills | — | — | — |
| R50 | — (patrón de R43/C8) | Cross-cutting Policy | Agent invocador (nunca la Skill) | — | Agent invocador | — |

`*` `cypress-execution` es el nombre V1; el nombre conceptual V2 propuesto es
`test-execution` (ver sección 4) — la tabla usa el nombre actual para
trazabilidad directa con el repo.

---

## 3. Diseño de Agents V2

Aplicado el **Agent Existence Test** (7 preguntas) a cada candidato,
partiendo de responsabilidades (sección 2), no de los 7 Agents actuales.

### Manager (Orchestrator)

No se evalúa aquí con el mismo test que un Domain Agent — se diseña en
detalle en la sección 9 (Tarea 9). Se incluye en el resumen de esta sección
solo por completitud.

### ProductAgent (Domain Agent — Tickets)

- **Responsabilidad:** decidir tipo de issue, sintetizar Historia/Bug/Tarea, decidir CUÁNDO y POR QUÉ asignar un ticket a una iteración (o dejarlo en Backlog), decidir transición de estado, decidir vínculos entre tickets/Test Cases/Ciclos, decidir qué resultado de dominio reportar.
- **Dominio:** gestión de tickets de negocio (Jira hoy).
- **Decisiones que posee:** R13, R14, R16, R17(decisión — consume `ConsultarIteraciones`, decide a cuál asignar o Backlog), R18(decisión), R19(decisión), R21/R23/R24/R25(decisión), cobertura mínima de una Historia (4 CA, 2–5 TC/CA).
- **Decisiones que NO posee:** cómo se serializa un campo en ADF (Jira Adapter); nombre real de un estado de Zephyr (Zephyr Adapter); algoritmo de resolución de carpetas (Zephyr Adapter); ID interno de un Sprint/Iteración de Jira (Jira Adapter — ProductAgent solo conoce la Iteration canónica devuelta por `ConsultarIteraciones`); si el flujo completo se detiene por una falla técnica de fase anterior (Manager).
- **Entradas:** especificación funcional de `scenario-builder`, Modelo Canónico de Test Case (uno por TC-XX.Y), Ticket Canónico existente (si continúa trabajo).
- **Salidas:** Ticket Canónico creado/actualizado (sección 5), confirmación de capacidades de publicación/vínculo/ciclo ejecutadas por los Adapters, veredicto de cobertura.
- **Skills que puede utilizar:** ninguna directamente hoy (no hay Skills propias en este dominio) — candidato a incorporar una Skill de validación de cobertura BDD si esa lógica crece (ver Gaps, sección 15).
- **Capabilities que puede solicitar:** LeerTicket, CrearTicket, ActualizarTicket, ComentarTicket, AplicarTransicionDeEstado, VincularTickets, ConsultarIteraciones, AsignarTicketAIteracion, PublicarTestCase, VincularTestCaseATicket, CrearOReutilizarCicloDeEjecucion, ReportarResultadoDeEjecucion.
- **Dependencias permitidas:** Jira Adapter, Zephyr Adapter (vía Capability Contracts, nunca directo).
- **Dependencias prohibidas:** conocer endpoints/payloads de Jira o Zephyr; conocer sintaxis de Cypress/Git.
- **Razón de existencia:** es la única fuente de verdad de "qué es una Historia bien formada" y de los mínimos de cobertura — juicio de negocio no mecanizable.
- **Agent Existence Test:** 1) Sí (síntesis funcional, no copia). 2) Sí (dominio de tickets). 3) No sin pérdida de cohesión (mezclaría negocio con orquestación en Manager, o con automatización en QaAutomation1). 4) Sí. 5) No — la síntesis BDD y la clasificación de tipo de issue son juicio, no procedimiento fijo. 6) No — no es transporte, es decisión. 7) Decisión real.
- **Veredicto:** **Conservar** (mismo nombre — su identidad de dominio no cambia, solo se retira el conocimiento de integración que tenía filtrado, ver C3).

### QaAutomation1 (Domain Agent — Automatización)

- **Responsabilidad:** decidir estrategia técnica de implementación, cuándo un resultado es aceptable para PR, si un comportamiento inesperado es bug real o falso positivo.
- **Dominio:** automatización técnica end-to-end de un ticket ya aprobado.
- **Decisiones que posee:** R30(estrategia), R32(consume veredicto y decide avanzar), R33(consume veredicto y decide avanzar), R34(decide invocar bug-reporting y qué hacer con el resultado), R36/R37(consume recomendación y decide), R38/R39/R40(decide cuándo).
- **Decisiones que NO posee:** tipo de issue Jira, contenido de la Historia, transición de estado Jira, nombre de campos de Zephyr, mecánica interna de un Test Runner distinto de Cypress (eso es del Adapter).
- **Entradas:** Ticket Canónico aprobado, contexto de `productAgent`.
- **Salidas:** código de automatización, Execution Result canónico, commit/push realizados, PR creado, contribución al Flow Result.
- **Skills que puede utilizar:** `ticket-analysis`, `framework-analysis`, `implementation-plan`, `branch-management`, `test-execution` (ex `cypress-execution`), `execution-validation`, `automation-review`, `git-workflow`, `bug-reporting`.
- **Capabilities que puede solicitar:** EjecutarSuiteDePruebas, CrearRama, Commit, Push, CrearPullRequest, ReportarResultadoDeEjecucion (aporta el dato, ProductAgent decide reportarlo a Zephyr).
- **Dependencias permitidas:** Test Runner Adapter, GitHub Adapter (vía capability), Git CLI (directo, ver sección 6).
- **Dependencias prohibidas:** crear/actualizar/transicionar tickets Jira; llamar Zephyr directamente (siempre vía ProductAgent).
- **Razón de existencia:** coordina 9 Skills con puntos de decisión reales; el "cómo" técnico no es mecanizable en un procedimiento único.
- **Agent Existence Test:** 1) Sí. 2) Sí (dominio técnico de automatización). 3) No sin pérdida (mezclaría negocio técnico con orquestación o con dominio de tickets). 4) Sí — sin él, ninguna Skill tiene autoridad para decidir "listo para PR" (ver C8). 5) No — coordina múltiples Skills con juicio, no es un procedimiento fijo. 6) No — decide, no traduce a una API. 7) Decisión real.
- **Veredicto:** **Conservar** (mismo nombre), con corrección: dejar de hardcodear conocimiento de Cypress/GitHub como reglas de negocio (mover a Adapters, ver C9 y sección 7).

### create-jira-task (Agent, solo lectura)

- **Agent Existence Test:** 1) No — no interpreta el resultado. 2) No. 3) Sí — cualquier Agent autorizado invoca la misma capability. 4) No — nada se pierde. 5) Sí, directamente (procedimiento de lectura). 6) Sí — de hecho es más preciso llamarlo Capability Contract que Skill (no transforma nada, solo expone lectura). 7) Existe por una acción técnica ejecutable, no una decisión.
- **Veredicto:** **Eliminar como Agent.** La capacidad "leer ticket" pasa a ser el Capability Contract `LeerTicket` (sección 6), implementado por el Jira Adapter, invocable directamente por `ProductAgent` o `Manager`. Ver desarrollo completo en sección 8.

### desarrollador

- **Agent Existence Test:** 3) Sí — el pipeline `Manager → ProductAgent/QaAutomation1` cubre exactamente el mismo caso de uso. 4) No — nada se pierde si se retira.
- **Veredicto:** **Eliminar.** Duplica el pipeline oficial completo sin agregar una decisión propia.

### ejecutor

- **Agent Existence Test:** 3) Sí — `test-execution` + `execution-validation`, invocadas por `QaAutomation1`, cubren el mismo resultado.
- **Veredicto:** **Eliminar.** Es una Skill disfrazada de Agent, ya cubierta.

### probando

- **Agent Existence Test:** ninguna pregunta aplica — no tiene contenido funcional.
- **Veredicto:** **Eliminar.** Artefacto experimental sin responsabilidad de producto.

### Resumen de Agents V2

| Agent V1 | Decisión V2 |
|---|---|
| `Manager` | Conservar (rediseñado, ver sección 9) |
| `productAgent` | Conservar (rediseñado — pierde conocimiento de integración) |
| `QaAutomation1` | Conservar (rediseñado — pierde conocimiento de Cypress/GitHub como reglas de negocio) |
| `create-jira-task` | Eliminar como Agent → Capability Contract `LeerTicket` |
| `desarrollador` | Eliminar |
| `ejecutor` | Eliminar |
| `probando` | Eliminar |

---

## 4. Diseño de Skills V2

Para cada Skill actual, con el formato pedido. "Cambio V1→V2" solo cuando
hay corrección de fondo (no se repite cuando la Skill ya está alineada).

**Regla de autoridad (corrección de Fase 2):** una Skill **evalúa,
ejecuta un procedimiento, valida, detecta problemas y produce un
resultado o una recomendación** — nunca decide el destino del flujo, ni
tiene autoridad de orquestación. El término "veredicto", usado en todo
este documento para describir la salida de una Skill, describe **un dato
estructurado que la Skill produce**, nunca una decisión que la Skill
ejecuta por sí misma. La cadena de autoridad es siempre:

```
Skill    → evalúa / produce resultado / recomienda
Agent    → toma decisiones dentro de su propio dominio
Manager  → toma decisiones de orquestación global
```

Ninguna corrección de esta fase requiere crear un "Decision Agent" ni un
"Communication Agent" — el mecanismo ya existe y es el patrón de R43/C8:
la Skill devuelve el dato estructurado, el Agent que la invocó decide qué
hacer con él.

### application-discovery

- **Propósito:** descubrir el contexto funcional de una aplicación antes de cualquier actividad QA.
- **Entrada:** nombre de app, URL o nombre de proyecto.
- **Salida:** lista de funcionalidades (clasificadas OBSERVADA/INFERIDA, priorizadas), fuente funcional utilizada.
- **Responsabilidad:** descubrimiento, no decisión.
- **Puede decidir:** nada — solo reporta y recomienda un punto de partida (no vinculante).
- **No puede decidir:** qué funcionalidad se automatiza (elige el usuario/Manager).
- **Reutilización:** total — agnóstica de dominio de negocio y de herramienta técnica.
- **Dependencias:** ninguna (no llama Adapters).
- **Herramientas que NO debe conocer:** Jira, Zephyr, Cypress, Git, GitHub.
- **Agent(s) consumidores:** Manager.
- **Cambio V1→V2:** ninguno de fondo.

### scenario-builder

- **Propósito:** transformar una funcionalidad seleccionada en un escenario funcional estructurado con CA/TC/trazabilidad.
- **Entrada:** funcionalidad seleccionada (de `application-discovery` o directa del usuario).
- **Salida:** especificación funcional (escenario, CA-XX con formato Dado/Cuando/Entonces, TC-XX.Y por CA, matriz de trazabilidad).
- **Responsabilidad:** construcción funcional, no de negocio ni técnica.
- **Puede decidir:** consolidar variantes de un mismo comportamiento en un único CA (regla de atomicidad).
- **No puede decidir:** cuántos escenarios se seleccionan para convertirse en Historia (el usuario).
- **Reutilización:** total.
- **Dependencias:** ninguna.
- **Herramientas que NO debe conocer:** Jira, Zephyr, Cypress, Git.
- **Agent(s) consumidores:** Manager (invoca), ProductAgent (consume su salida).
- **Cambio V1→V2:** ninguno de fondo. Nota: su matriz de trazabilidad (CA↔TC) es la semilla del Traceability Canonical Model (sección 5) pero no necesita cambiar su formato de salida actual.

### testcase-model

- **Propósito:** transformar la especificación de `scenario-builder` en el Modelo Canónico de Test Case.
- **Entrada:** salida estructurada de `scenario-builder` (un escenario/CA/TC a la vez).
- **Salida:** JSON del Test Case Canónico (`name`, `objective`, `steps`, `traceability`, `folder`, `status`, `priority`, `labels`, etc. — corregido en sección 5; **ya no incluye `projectKey`** ni los nombres `statusName`/`priorityName` propios de Zephyr).
- **Responsabilidad:** transformación 1:1, con auto-validación de completitud.
- **Puede evaluar:** la completitud de su propia salida y producir un veredicto (`válido`/`inválido` + motivo) — no "decide detener": solo emite el veredicto (Regla de autoridad, principio de esta sección); quien la invoca decide si eso detiene el flujo (C8).
- **No puede decidir:** el algoritmo de resolución de `folder` a `folderId` (Zephyr Adapter); el formato REST de ningún gestor de pruebas.
- **Reutilización:** total — ya es el mejor ejemplo del proyecto (spec 3.5).
- **Dependencias:** ninguna.
- **Herramientas que NO debe conocer:** Zephyr, Jira, Xray, TestRail, Azure Test Plans.
- **Agent(s) consumidores:** Manager (invoca), ProductAgent (consume).
- **Cambio V1→V2:** ninguno — es el patrón a replicar.

### ticket-analysis

- **Propósito:** analizar un ticket/Test Case antes de implementar, sin modificar nada.
- **Entrada:** Historia Jira / Ticket Canónico, Test Case, escenario aprobado.
- **Salida:** análisis de alcance, reutilización, riesgos, decisión REUTILIZAR/EXTENDER/CREAR, veredicto `LISTO PARA IMPLEMENTAR: Sí/No`.
- **Responsabilidad:** análisis, no ejecución.
- **Puede decidir:** su propio veredicto de completitud del análisis.
- **No puede decidir:** si el flujo completo se detiene cuando el veredicto es "No" — eso lo decide QaAutomation1 (corrección C8).
- **Reutilización:** total.
- **Dependencias:** ninguna.
- **Herramientas que NO debe conocer:** ninguna herramienta externa (Jira/Zephyr/GitHub) — sí puede referirse a Page Objects/Commands del framework, que es su objeto de análisis.
- **Agent(s) consumidores:** QaAutomation1.
- **Cambio V1→V2:** corregir su redacción para que "detener el flujo" se reemplace por devolver `LISTO_PARA_IMPLEMENTAR: No` + motivo, dejando la decisión de detener a QaAutomation1.

### framework-analysis

- **Propósito:** comprender arquitectura y convenciones del framework de automatización existente.
- **Entrada:** proyecto actual, resultado de `ticket-analysis`.
- **Salida:** inventario de Page Objects/Commands/Fixtures/Helpers reutilizables, componentes a extender/crear, lógica candidata a extracción.
- **Responsabilidad:** análisis técnico del framework, no de negocio.
- **Puede decidir:** su propio veredicto de "patrón no determinable con claridad".
- **No puede decidir:** si eso detiene el flujo completo (C8).
- **Reutilización:** total, pero el análisis es específico del Test Runner actual del proyecto (hoy Cypress) — su *procedimiento* de análisis (buscar Page Objects/Commands/Fixtures) es agnóstico de Test Runner, aunque los nombres de esos conceptos son propios del patrón Page Object, no exclusivos de Cypress.
- **Dependencias:** ninguna.
- **Herramientas que NO debe conocer:** Jira, Zephyr, GitHub.
- **Agent(s) consumidores:** QaAutomation1.
- **Cambio V1→V2:** misma corrección de C8 que `ticket-analysis`.

### implementation-plan

- **Propósito:** definir la estrategia técnica de implementación (qué reutilizar/extender/crear) antes de escribir código.
- **Entrada:** resultado de `ticket-analysis` + `framework-analysis`, Ticket Canónico.
- **Salida:** plan de implementación (archivos a modificar/crear, Page Objects a reutilizar/extender, orden recomendado, riesgos, estrategia de validación negativa/borde).
- **Responsabilidad:** planificación técnica.
- **Puede decidir:** qué componente nuevo se justifica crear (con justificación obligatoria).
- **No puede decidir:** el mecanismo concreto de verificación de error de un Test Runner específico (**corrección C9**: hoy pregunta "¿cómo se ve un error en Cypress (`cy.intercept`, `.has-error`, `aria-invalid`)?"; en V2 debe preguntar al **contrato del Test Runner** "¿qué mecanismos de verificación de error están disponibles?" — la traducción a `cy.intercept` o su equivalente en otro runner es del Test Runner Adapter).
- **Reutilización:** alta, una vez separado el conocimiento de Cypress.
- **Dependencias:** Capability Contract "consultar mecanismos de verificación de error" (nuevo, ver sección 6) expuesto por el Test Runner Adapter.
- **Herramientas que NO debe conocer:** Cypress específicamente (sí puede conocer el concepto agnóstico "verificación de estado de error en el DOM" o "interceptación de red").
- **Agent(s) consumidores:** QaAutomation1.
- **Cambio V1→V2:** **corrección de fondo** — quitar los ejemplos de Cypress de la sección "VALIDACIÓN DE CASOS NEGATIVOS Y DE BORDE" y reemplazarlos por la pregunta agnóstica al contrato del Test Runner (resuelve C9).

### branch-management

- **Propósito:** determinar si reutilizar o crear una rama Git, sin ejecutar nada.
- **Entrada:** ticket, escenario, convención de ramas, estado del repo.
- **Salida:** rama recomendada, acción (reutilizar/crear), estado del working directory, conflictos detectados.
- **Responsabilidad:** recomendación, no ejecución (ya lo cumple en V1).
- **Puede decidir:** cuál es la convención de nombre correcta.
- **No puede decidir:** si el flujo se detiene ante un conflicto (C8) — ya en V1 tiende a "presentar opciones y esperar decisión del usuario", que es el patrón correcto; falta remover las frases "detener el proceso" y reemplazarlas por veredicto estructurado.
- **Reutilización:** total.
- **Dependencias:** ninguna directa (opera sobre el estado de git ya expuesto por el entorno; no hay una API de Git remota que abstraer).
- **Herramientas que NO debe conocer:** Jira, Zephyr, GitHub API.
- **Agent(s) consumidores:** QaAutomation1.
- **Cambio V1→V2:** ajuste de redacción (C8), sin cambio de responsabilidad.

### test-execution (renombrada; V1: `cypress-execution`)

- **Propósito:** ejecutar la suite de pruebas implementada y recolectar el Execution Result canónico.
- **Entrada:** implementación finalizada, spec asociado.
- **Salida:** Execution Result canónico (sección 5): spec, comando, passing/failing, duración, estado.
- **Responsabilidad:** invocar la capability "ejecutar suite de pruebas" y normalizar su resultado al modelo canónico.
- **Puede decidir:** qué spec corresponde ejecutar (si es determinable automáticamente).
- **No puede decidir:** si el flujo se detiene ante un fallo (C8) — hoy lo decide ella misma ("detener el flujo... no generar commit"); en V2 solo reporta `RESULTADO: fallido` + motivo, QaAutomation1 decide.
- **Reutilización:** total una vez desacoplada del comando concreto (`npx cypress run`).
- **Dependencias:** Capability Contract `EjecutarSuiteDePruebas` → Test Runner Adapter.
- **Herramientas que NO debe conocer:** el binario/flags concretos de Cypress (eso lo resuelve el Adapter); sí conoce el concepto "spec", "suite", "resultado".
- **Agent(s) consumidores:** QaAutomation1.
- **Cambio V1→V2:** **rename conceptual** `cypress-execution` → `test-execution` (ver Migración, sección 14) + delegar la ejecución real al Test Runner Adapter en vez de invocar `npx cypress run` como conocimiento propio + corrección C8.

### execution-validation

- **Propósito:** validar si el Execution Result cumple los criterios para continuar el flujo.
- **Entrada:** Execution Result de `test-execution`.
- **Salida:** veredicto `APROBADA/RECHAZADA` + evidencia.
- **Responsabilidad:** validación, ya agnóstica de herramienta (no menciona Cypress en ningún lado de su texto).
- **Puede decidir:** si la evidencia es suficiente.
- **No puede decidir:** si el flujo se detiene (C8) — igual que las anteriores, hoy dice "detener el flujo inmediatamente"; debe devolver `VALIDACIÓN: Rechazada` y dejar la decisión a QaAutomation1.
- **Reutilización:** total, ya es el mejor ejemplo de Skill agnóstica junto a `testcase-model`.
- **Dependencias:** ninguna (consume el Execution Result canónico, no ejecuta nada).
- **Herramientas que NO debe conocer:** ninguna — ya cumple esto.
- **Agent(s) consumidores:** QaAutomation1.
- **Cambio V1→V2:** solo C8.

### automation-review

- **Propósito:** revisión técnica de calidad de la automatización antes del commit.
- **Entrada:** automatización implementada, Execution Result.
- **Salida:** informe de arquitectura/reutilización/selectores/legibilidad/mantenibilidad/riesgos + decisión `Lista para Commit / Requiere mejoras`.
- **Responsabilidad:** revisión de calidad, no de negocio.
- **Puede decidir:** su propio veredicto de calidad.
- **No puede decidir:** el formato del cierre del flujo (**corrección de fondo, resuelve parte de C1**: eliminar por completo la sección "Executive Summary" de su `SKILL.md` — es una reimplementación literal del formato de la Skill `executive-summary`; `automation-review` debe aportar únicamente su veredicto de calidad como un campo más del Flow Result, nunca redefinir el resumen ejecutivo).
- **Reutilización:** total.
- **Dependencias:** ninguna.
- **Herramientas que NO debe conocer:** Jira, Zephyr, Git.
- **Agent(s) consumidores:** QaAutomation1.
- **Cambio V1→V2:** **eliminar la sección "Executive Summary" duplicada** de su propio `SKILL.md`; aportar su veredicto como campo estructurado del Flow Result.

### bug-reporting

- **Propósito:** validar que un comportamiento inesperado sea un defecto real (no falso positivo) y documentarlo.
- **Entrada:** resultado de automatización, evidencia, pasos.
- **Salida:** reporte de bug estructurado (BUG_ID, título, severidad, pasos, evidencia) o descarte por falso positivo.
- **Responsabilidad:** validación + documentación, no creación de tickets.
- **Puede decidir:** si el defecto está confirmado o es falso positivo (juicio técnico repetible, no de negocio).
- **No puede decidir:** si se crea el ticket Bug en Jira (eso es ProductAgent, vía Manager).
- **Reutilización:** total.
- **Dependencias:** ninguna.
- **Herramientas que NO debe conocer:** Jira.
- **Agent(s) consumidores:** QaAutomation1.
- **Cambio V1→V2:** ninguno de fondo.

### git-workflow

- **Propósito:** gestionar commit y push una vez validada la automatización.
- **Entrada:** ticket, rama activa, Execution Result exitoso, archivos listos.
- **Salida:** commit generado, push realizado, estado del flujo Git.
- **Responsabilidad:** procedimiento de commit/push; **no** decide crear el PR, solo lo solicita como capability.
- **Puede decidir:** si el estado del working directory permite commitear (archivos ajenos al ticket, temporales, etc.).
- **No puede decidir:** si el flujo se detiene ante un error (C8).
- **Reutilización:** alta.
- **Dependencias:** Git CLI (directo, ver sección 6), Capability Contract `CrearPullRequest` → GitHub Adapter.
- **Herramientas que NO debe conocer:** Jira, Zephyr.
- **Agent(s) consumidores:** QaAutomation1.
- **Cambio V1→V2:** separar conceptualmente "commit/push" (Git CLI directo, capability de bajo valor de abstracción) de "crear PR" (ya delega correctamente a `create-pull-request.js`/GitHub Adapter) — sin cambio de comportamiento, solo de encuadre; corrección C8.

### executive-summary

- **Propósito:** presentar el resultado consolidado de un flujo (Flow Result canónico) como resumen ejecutivo.
- **Entrada:** Flow Result canónico (sección 5) — ya no "uno o varios análisis técnicos" sueltos, sino el modelo consolidado.
- **Salida:** resumen ejecutivo en el único formato oficial (a definir con el Flow Result, sección 5) — reemplaza los 3 formatos hoy en competencia (`Manager` "INFORME FINAL", `QaAutomation1` "FORMATO OFICIAL DEL EXECUTIVE SUMMARY", el propio "RESUMEN EJECUTIVO").
- **Responsabilidad:** presentación, nunca agregación de datos nuevos.
- **Puede decidir:** el nivel de detalle de la presentación (resumen vs. completo) — nunca el contenido.
- **No puede decidir:** qué campos existen en el resultado (eso lo define el Flow Result canónico, sección 5).
- **Reutilización:** total — consumible por Manager, y opcionalmente por QaAutomation1 para su propio cierre parcial.
- **Dependencias:** Flow Result (Canonical Model).
- **Herramientas que NO debe conocer:** ninguna.
- **Agent(s) consumidores:** Manager (principal), QaAutomation1 (cierre parcial, si aplica).
- **Cambio V1→V2:** **resuelve C1** — se convierte en la única Skill autorizada a producir el resumen ejecutivo; `Manager` y `QaAutomation1` dejan de tener su propio formato ("INFORME FINAL" / "FORMATO OFICIAL DEL EXECUTIVE SUMMARY") y en su lugar invocan esta Skill sobre el Flow Result.

---

## 5. Canonical Models

Evaluados los 6 conceptos sugeridos. No todos ameritan un modelo formal
independiente.

**Regla general (corrección de Fase 2):** un Canonical Model representa
significado funcional/de dominio — nunca la API ni el modelo interno de
una herramienta concreta. Todo campo debe poder responder "sí" a esta
pregunta: *¿un Canonical Model debe poder existir aunque Jira, Zephyr,
GitHub, Cypress o cualquier otra herramienta sea reemplazada?* Un campo
que solo tiene sentido para una herramienta puntual (un ID interno, el
nombre exacto de un estado de esa herramienta, una clave de proyecto de
esa herramienta) no pertenece al modelo — pertenece al Adapter, o es
contexto de integración que se pasa junto al modelo en el momento de
invocar una capability, nunca un campo del modelo en sí.

### Test Case — **mantener, con corrección de leakage**

- **Concepto:** un caso de prueba funcional ejecutable.
- **Propósito:** representar un TC sin atarse a Zephyr/Xray/TestRail/Azure.
- **Productor:** `testcase-model`.
- **Consumidores:** ProductAgent (publica), Zephyr Adapter (traduce).
- **Campos principales (corregidos):** `name`, `objective`, `precondition`, `priority` (canónico: `baja|normal|alta`), `status` (canónico: `pending|ready|executed|passed|failed|blocked` — ver detalle abajo), `labels`, `folder` (ver detalle abajo), `steps[]`, `traceability`.
- **Campo removido — `projectKey`:** revisado y **retirado del modelo**. `projectKey` es un dato de configuración/contexto de integración (a qué proyecto de Jira/Zephyr se publica), no un atributo del Test Case en sí — un mismo Test Case Canónico podría publicarse, sin cambiar una sola de sus propiedades, en dos proyectos distintos. Pasa a ser parte de la **entrada conceptual** de la capability `PublicarTestCase` (sección 6), suministrado por ProductAgent en el momento de invocarla, nunca un campo persistido dentro del modelo.
- **Campo corregido — `status` (antes `statusName: "Draft"`):** `statusName` era literalmente el nombre del campo y de los valores de Zephyr (`"Draft"`, `"Approved"`). Se renombra a `status` con vocabulario canónico de dominio: `pending` (aún no ejecutado — valor por defecto), `ready` (revisado, listo para ejecutar), `executed`/`passed`/`failed`/`blocked` (último resultado conocido). El Adapter traduce, por ejemplo: `pending → "Not Executed"` (Zephyr), y análogamente hacia el estado nativo de cualquier otro gestor. **Nunca** se coloca un valor propio de Zephyr (como `"Not Executed"`) como parte del vocabulario canónico o como requisito del modelo.
- **Campo corregido — `priority` (antes `priorityName: "Normal"`):** mismo criterio — `priorityName` es el nombre de campo de Zephyr; se renombra a `priority` con valores canónicos (`baja|normal|alta`), traducidos por el Adapter al nombre que use cada herramienta.
- **Campo revisado — `folder`:** es **(A) una clasificación funcional/dominio** — representa la ubicación del Test Case en el árbol de módulos funcionales del sistema bajo prueba (ej. `/02 - My Info/Contact Details`), no una carpeta nativa de Zephyr. Se mantiene en el modelo con esta semántica explícita. Lo que **nunca** entra al modelo es el `folderId` técnico ni el algoritmo de resolución de segmentos — eso es 100% responsabilidad del Zephyr Adapter (ya reflejado en R22, sección 2, y en la descripción del Zephyr Adapter, sección 7).
- **Campo revisado — `labels`:** se mantiene sin cambios — es un concepto de dominio genérico (etiquetado/tagging), no exclusivo de Zephyr; distinto del caso de `statusName`/`priorityName`/`projectKey`, que sí eran nombres o valores propios de esa herramienta.
- **Qué NO debe contener:** IDs internos de ninguna herramienta, endpoints, nombres de campos REST, valores de estado/prioridad específicos de Zephyr o cualquier otro gestor.
- **Qué duplicación elimina:** reinterpretación del TC en cada consumidor.
- **Por qué es canonical:** ya cruza una frontera real de herramienta (puede representarse en 4 gestores de prueba distintos) y ya tiene múltiples consumidores potenciales.

### Scenario — **no promover a Canonical Model**

- **Por qué no:** la salida de `scenario-builder` (Escenario/CA/TC/matriz) tiene un único productor y dos consumidores directos e inmediatos (`testcase-model` y `ProductAgent`), ambos dentro del mismo flujo secuencial — no cruza una frontera de herramienta externa (no hay "Scenario" en ninguna API externa a representar). Su esquema ya está suficientemente estabilizado en la sección "Salida obligatoria" de `scenario-builder`. Crear un Canonical Model aquí sería un componente por conveniencia (principio 17), no por necesidad de sustituibilidad.

### Ticket / Work Item — **crear**

- **Concepto:** una Historia, Bug o Tarea de negocio.
- **Propósito:** desacoplar el contenido de negocio (Como/Quiero/Para, CA en BDD, pasos prohibidos técnicos) del formato específico de Jira (ADF, `issuetype`, `fields`).
- **Productor:** ProductAgent.
- **Consumidores:** Jira Adapter (traduce a ADF/campos), Manager (lo referencia en el Flow Result).
- **Campos principales:** `tipo` (Historia/Bug/Tarea), `titulo`, `narrativa` (Como/Quiero/Para o plantilla de Bug/Tarea), `contexto`, `objetivo`, `criteriosDeAceptacion[]` (cada uno con `id`, `dado/cuando/entonces`, `casosDePrueba[]`), `iteracionAsignada` (referencia canónica a una Iteration — ver corrección de "Sprint" en sección 6; nunca un ID de Sprint de Jira), `vinculos[]` (a otros tickets).
- **Qué NO debe contener:** ADF, `issueLinkType` de Jira, nombres de transición específicos de un workflow de Jira.
- **Qué duplicación elimina:** hoy la plantilla de Historia/Bug/Tarea vive como texto de prompt en `productAgent.md` Y como código ADF en `create-jira-task.js` (`buildHistoriaDescription`, etc.) — con este modelo, el contenido vive una vez (ProductAgent decide los valores) y la codificación ADF vive una vez (Jira Adapter).
- **Por qué es canonical:** es exactamente el mismo patrón que resolvió Jira→Azure DevOps en el criterio de aceptación 1 de Fase 1/spec (sección 14.1 del spec).

### Execution Result — **crear**

- **Concepto:** el resultado de una corrida de la suite de pruebas.
- **Propósito:** desacoplar "qué pasó en la ejecución" de "cómo lo reporta Cypress/Mocha".
- **Productor:** `test-execution` (vía Test Runner Adapter).
- **Consumidores:** `execution-validation`, `automation-review` (referencia), ProductAgent (para R25), Flow Result.
- **Campos principales:** `spec`, `comando`, `testsEjecutados`, `passing`, `failing`, `duracion`, `estado` (`exitoso`/`fallido`), `evidencia[]`, `testsPorId[]` (cada uno con `identificadorDeTrazabilidad` opcional — ver Traceability).
- **Qué NO debe contener:** el formato nativo del reporter (`json` de Mocha), nombres de propiedades específicas de Cypress.
- **Qué duplicación elimina:** hoy `cypress-execution` y `execution-validation` casi redefinen el mismo shape en sus respectivas "SALIDA OBLIGATORIA"; y el parsing de Mocha JSON (`collectTestsWithState`, `mapMochaStateToZephyr`) vive, fuera de lugar, dentro de `create-jira-task.js`.
- **Por qué es canonical:** es la pieza que permite Cypress→Playwright sin tocar `execution-validation`, `automation-review` ni el reporte a Zephyr (criterio de aceptación 1 de Fase 1, escenario D).

### Flow Result — **crear (resuelve C1)**

- **Concepto:** el resultado consolidado de un flujo completo (o de una fase), independiente de cómo se presenta.
- **Propósito:** ser la única fuente de verdad que consume `executive-summary` — termina con la fragmentación de 4 formatos (`Manager`, `QaAutomation1`, skill `executive-summary`, skill `automation-review`).
- **Productor:** cada componente aporta su fragmento — Manager consolida (R4), no produce contenido propio.
- **Consumidores:** `executive-summary` (único renderer autorizado).
- **Campos principales:** `ticket` (referencia a Ticket Canónico), `rama`, `automatizacion.estado` (Completada/Parcial/Fallida), `executionResult` (referencia al Execution Result), `automationReview.veredicto`, `commit`, `push`, `pullRequest.url`, `estadoJira`, `riesgos[]`, `proximosPasos[]`, `bugsEncontrados[]`.
- **Qué NO debe contener:** prosa libre — todo campo es estructurado; la prosa es responsabilidad exclusiva de `executive-summary` al renderizar.
- **Qué duplicación elimina:** las 4 definiciones de "resumen ejecutivo"/"informe final" hoy en competencia.
- **Por qué es canonical:** múltiples productores parciales, un único consumidor de presentación — el caso de uso exacto de un Canonical Model.

### Traceability — **crear (conceptos y relaciones definidos; persistencia pendiente, ver sección 15)**

- **Concepto:** la cadena completa que conecta un comportamiento funcional con su evidencia de ejecución real: `Scenario → Acceptance Criterion → Test Case → Published Test Case → Automated Test → Execution → Result → Artifacts`.
- **Propósito:** hoy esta cadena está repartida entre la matriz de `scenario-builder` (Escenario↔CA↔TC), el conocimiento de ProductAgent (CA↔TC↔Test Case Key↔Ciclo) y la convención de tag de QaAutomation1 (Test Case Key↔`it()`) — sin un modelo único. Esta corrección no cierra el detalle técnico de persistencia, pero elimina la ambigüedad arquitectónica: qué representa cada elemento, qué ID necesita, y **distingue explícitamente el Canonical ID del External Tool ID** en cada eslabón.

**Regla explícita:** un identificador de Jira/Zephyr/GitHub/Cypress **nunca** es, por sí mismo, un identificador canónico. Ejemplo: el Canonical Test Case ID es `TC-XX.Y` (nace en `scenario-builder`, sobrevive a cualquier herramienta); el Zephyr Test Case Key (ej. `SCRUM-T25`) es un External Tool ID que el Zephyr Adapter genera y devuelve — el Canonical Model del Test Case (y cualquier otro componente de dominio) razona en términos de `TC-XX.Y`, nunca depende de que exista un `SCRUM-T25`.

| Elemento | Qué representa (concepto) | Canonical ID | External Tool ID (ejemplo de hoy) | Relación conceptual | Capa que materializa la relación |
|---|---|---|---|---|---|
| Scenario | Especificación funcional de un comportamiento | Nombre/slug del escenario dentro de la ejecución (no cruza herramienta externa, ver "Scenario" más arriba) | — | 1 Scenario → 1..N Acceptance Criterion | `scenario-builder` |
| Acceptance Criterion | Regla de negocio atómica | `CA-XX` (numeración global dentro de la Historia) | — | 1 CA → 1..N Test Case | `scenario-builder` |
| Test Case | Caso de prueba funcional | `TC-XX.Y` | — (el Test Case funcional en sí no tiene equivalente externo hasta que se publica) | 1 TC → 0..1 Published Test Case | `testcase-model` |
| Published Test Case | Reflejo del Test Case en el gestor de pruebas | Referenciado por su `TC-XX.Y` de origen (no tiene Canonical ID propio distinto) | Zephyr Test Case Key (ej. `SCRUM-T25`) | 1 Published Test Case → 0..1 Automated Test | ProductAgent decide publicar (R21); Zephyr Adapter ejecuta y devuelve el External Tool ID |
| Automated Test | Implementación ejecutable (spec + `it()`) | El mismo Canonical ID del Test Case publicado (`TC-XX.Y` o el Test Case Key ya asignado, embebido como tag en el título del `it()`) | Ruta de archivo + nombre del `it()` (formato propio del Test Runner) | 1 Automated Test → 0..N Execution | QaAutomation1 materializa el tag (R35); Test Runner Adapter conoce la ruta/nombre real |
| Execution | Una corrida concreta de un Automated Test | No requiere Canonical ID propio — se identifica por `(Automated Test, momento/ciclo)` | Zephyr Test Execution ID/Key | 1 Execution → 1 Result | Test Runner Adapter ejecuta; Zephyr Adapter registra la Execution dentro de un Test Cycle |
| Result | Resultado de dominio de una Execution | Estado canónico (`pending\|passed\|failed\|blocked` — mismo vocabulario que `status` del Test Case Canónico) | Estado nativo de Zephyr (ej. `"Not Executed"`, `"Pass"`, `"Fail"`) | 1 Result → 0..N Artifacts | `execution-validation` produce el Execution Result canónico; Zephyr Adapter traduce el estado (R26) |
| Artifacts | Evidencia de una Execution (logs, capturas, video) | Referencia lógica dentro del Execution Result (ej. tipo + descripción) | Ubicación física específica del Test Runner/CI | — (hoja de la cadena) | Test Runner Adapter |

- **Productor:** se construye incrementalmente — `scenario-builder` aporta Scenario↔CA↔TC; `testcase-model`/ProductAgent aportan TC↔Published Test Case; QaAutomation1 aporta Published Test Case↔Automated Test; el Test Runner Adapter aporta Automated Test↔Execution↔Result↔Artifacts.
- **Consumidores:** cualquier componente que necesite responder "¿qué automatiza este TC?" o "¿qué CA cubre este `it()`?" sin recorrer 3 documentos distintos.
- **Por qué es canonical:** cruza los tres dominios (funcional, negocio/gestor de pruebas, automatización) — es exactamente la responsabilidad transversal que Fase 1 dejó señalada en R35 sin resolver.
- **Nota:** este documento define los conceptos, sus identificadores canónicos, sus relaciones y qué capa materializa cada una. **No cierra** el detalle técnico de persistencia (¿dónde vive físicamente esta cadena — un registro nuevo, o se reconstruye consultando cada Adapter?) — ver "Architectural Gaps" (sección 15) y "Decisiones Abiertas" (sección 16, ítem 5).

---

## 6. Capability Contracts

Formato: Nombre / Intención / Consumidor / Proveedor / Entrada conceptual /
Resultado conceptual / Errores / Bloqueos / Idempotencia necesaria /
Adaptadores posibles. Sin detalles de API.

**Regla general (corrección de Fase 2):** un Capability Contract
representa una capacidad estable del sistema — nunca un método HTTP, un
endpoint, un payload de Jira/Zephyr/GitHub, una CLI específica ni un
comando concreto de un Test Runner. Ejemplo correcto: `PublicarTestCase`.
Ejemplo incorrecto: `POST /testcases`. Ejemplo correcto:
`AsignarTicketAIteracion`. Ejemplo incorrecto: `PUT Jira Agile Sprint API`.
El Adapter es quien traduce el contrato hacia la herramienta concreta —
revisadas las 15 capabilities de esta sección, ninguna nombra un verbo
HTTP, un endpoint ni un payload (correcto); la única corrección de fondo
detectada es la de "Iteration/Sprint" que se resuelve a continuación.

**LeerTicket**
Intención: obtener el estado/contenido actual de un ticket. Consumidor: ProductAgent, Manager. Proveedor: Jira Adapter. Entrada: identificador de ticket. Resultado: Ticket Canónico (parcial, solo lectura). Errores: ticket inexistente. Bloqueos: ninguno. Idempotencia: sí (lectura pura). Adaptadores posibles: Jira, Azure DevOps.

**CrearTicket**
Intención: crear una Historia/Bug/Tarea. Consumidor: ProductAgent. Proveedor: Jira Adapter. Entrada: Ticket Canónico. Resultado: identificador de ticket creado + URL. Errores: proyecto inválido, tipo de issue no soportado. Bloqueos: iteración ambigua (se informa, no bloquea — cae a Backlog; ver `ConsultarIteraciones`/`AsignarTicketAIteracion` abajo). Idempotencia: no (cada llamada crea); requiere que el consumidor evite llamadas duplicadas. Adaptadores posibles: Jira, Azure DevOps.

**ActualizarTicket**
Intención: modificar campos de un ticket existente. Consumidor: ProductAgent. Proveedor: Jira Adapter. Entrada: identificador + campos del Ticket Canónico a modificar. Resultado: confirmación. Errores: ticket inexistente, campo no soportado. Bloqueos: ninguno. Idempotencia: sí (mismo valor, mismo resultado). Adaptadores posibles: Jira, Azure DevOps.

**ComentarTicket**
Intención: agregar un comentario (ej. Flow Result renderizado) a un ticket. Consumidor: ProductAgent. Proveedor: Jira Adapter. Entrada: identificador + texto. Resultado: confirmación. Errores: ticket inexistente. Bloqueos: comentario ya agregado para ese Flow Result (evitar duplicados, R "Si el Executive Summary ya fue procesado anteriormente"). Idempotencia: deseable, no crítica. Adaptadores posibles: Jira, Azure DevOps.

**AplicarTransicionDeEstado**
Intención: ejecutar el cambio de estado decidido por ProductAgent (R18). Consumidor: ProductAgent. Proveedor: Jira Adapter. Entrada: identificador + estado destino de negocio (no el nombre nativo del workflow). Resultado: confirmación + estado real resultante. Errores: transición no permitida por el workflow. Bloqueos: ninguno propio. Idempotencia: sí. Adaptadores posibles: Jira, Azure DevOps.

**VincularTickets**
Intención: crear una relación entre dos tickets (R19). Consumidor: ProductAgent. Proveedor: Jira Adapter. Entrada: dos identificadores + tipo de relación de negocio (ej. "descubierto durante"). Resultado: confirmación. Errores: tipo de relación no soportado nativamente (ver C6/hallazgo `Tests`/`is tested by` inexistente). Bloqueos: ninguno. Idempotencia: deseable. Adaptadores posibles: Jira, Azure DevOps.

**ConsultarIteraciones** *(corrección de Fase 2 — antes parte de "AsignarSprint")*
Intención: obtener las iteraciones (Sprints, en Jira) disponibles/activas para un contexto de integración dado. Consumidor: ProductAgent. Proveedor: Jira Adapter. Entrada: contexto de integración (a qué proyecto/tablero consultar — dato de configuración, no un campo del Ticket Canónico). Resultado: lista de Iterations canónicas (identificador + estado activa/futura/cerrada). Errores: ninguno propio. Bloqueos: ninguno. Idempotencia: sí (lectura pura). Adaptadores posibles: Jira (Sprint), Azure DevOps (Iteration Path).

**AsignarTicketAIteracion** *(corrección de Fase 2 — antes parte de "AsignarSprint")*
Intención: ejecutar la asignación de un ticket a la iteración que ProductAgent ya decidió. Consumidor: ProductAgent. Proveedor: Jira Adapter. Entrada: identificador de ticket + Iteration canónica destino (o "sin asignar" → Backlog). Resultado: confirmación. Errores: iteración inexistente. Bloqueos: ninguno propio (la ambigüedad de "a cuál asignar" ya se resolvió antes de invocar esta capability — ver Ownership, sección 10). Idempotencia: sí. Adaptadores posibles: Jira, Azure DevOps.

**Separación de responsabilidades (corrección de fondo):** en V1/borrador de Fase 2, una única capacidad "AsignarSprint" mezclaba tres cosas — consultar iteraciones, determinar la correcta, y asignar el ticket. Determinar la correcta **no es una capability** en absoluto: es una decisión de negocio de ProductAgent (¿existe una única iteración activa? ¿hay ambigüedad?), que consume el resultado de `ConsultarIteraciones` como dato. Queda así: **ProductAgent decide CUÁNDO y POR QUÉ asignar un ticket a una iteración** (usando `ConsultarIteraciones` como insumo de esa decisión); **el Adapter ejecuta la asignación** vía `AsignarTicketAIteracion`. ProductAgent nunca conoce IDs internos de Jira — trabaja con la Iteration canónica que le devuelve `ConsultarIteraciones`. El concepto de dominio es **Iteration/Iteración**; "Sprint" es únicamente el nombre que usa el Adapter de Jira al traducir ese concepto (`Iteration → Sprint de Jira`, o su equivalente en cualquier otra herramienta).

**PublicarTestCase**
Intención: reflejar un Test Case Canónico en el gestor de pruebas. Consumidor: ProductAgent. Proveedor: Zephyr Adapter. Entrada: Test Case Canónico + identificador de Historia. Resultado: Test Case Key. Errores: proyecto inválido. Bloqueos: ninguno. Idempotencia: no nativamente (cada llamada crea) — el consumidor debe evitar republicar el mismo TC. Adaptadores posibles: Zephyr, Xray, TestRail, Azure Test Plans.

**VincularTestCaseATicket**
Intención: cobertura Test Case↔Historia. Consumidor: ProductAgent. Proveedor: Zephyr Adapter. Entrada: Test Case Key + identificador de Historia. Resultado: confirmación de vínculo. Errores: tipo de link no disponible. Bloqueos: ninguno. Idempotencia: deseable. Adaptadores posibles: Zephyr, Xray, TestRail.

**CrearOReutilizarCicloDeEjecucion**
Intención: agrupar ejecuciones de una Historia en un ciclo (R24). Consumidor: ProductAgent. Proveedor: Zephyr Adapter. Entrada: identificador de Historia + nombre de ciclo o key existente. Resultado: Test Cycle Key. Errores: ninguno propio. Bloqueos: ninguno. Idempotencia: sí — dado el mismo nombre/key, reutiliza (no duplica). Adaptadores posibles: Zephyr, Xray.

**ReportarResultadoDeEjecucion**
Intención: reportar el resultado de dominio (Pass/Fail/Blocked) de un test ya publicado (R25/R26). Consumidor: ProductAgent (decide reportar) usando el Execution Result que le entrega QaAutomation1. Proveedor: Zephyr Adapter. Entrada: Test Case Key + Test Cycle Key + resultado de dominio. Resultado: confirmación. Errores: Test Execution no encontrada (no se inventa, se informa — regla ya vigente). Bloqueos: Test Cycle inexistente. Idempotencia: sí (actualiza el mismo registro). Adaptadores posibles: Zephyr, Xray.

**EjecutarSuiteDePruebas**
Intención: correr la suite/spec implementada (R31/R47). Consumidor: `test-execution` (QaAutomation1). Proveedor: Test Runner Adapter. Entrada: identificador de spec/suite. Resultado: Execution Result canónico. Errores: spec inexistente, fallo de compilación. Bloqueos: ninguno propio. Idempotencia: no aplica (cada corrida es un evento). Adaptadores posibles: Cypress, Playwright.

**ConsultarMecanismosDeVerificacionDeError** *(nueva, deriva de la corrección C9)*
Intención: que `implementation-plan` pueda preguntar qué mecanismos de verificación de error negativo/borde soporta el Test Runner activo, sin hardcodear Cypress. Consumidor: `implementation-plan`. Proveedor: Test Runner Adapter. Entrada: ninguna (o tipo de validación: DOM/red). Resultado: lista de mecanismos disponibles (ej. "aserción de estado DOM", "interceptación de red"). Errores: ninguno. Bloqueos: ninguno. Idempotencia: sí. Adaptadores posibles: Cypress, Playwright.

**CrearPullRequest**
Intención: abrir un PR (R40). Consumidor: `git-workflow` (QaAutomation1). Proveedor: GitHub Adapter. Entrada: rama origen/destino, título, cuerpo. Resultado: URL del PR. Errores: PR ya existente para esa rama (se reutiliza, no se duplica — ya implementado en `findExistingPullRequest`). Bloqueos: ninguno. Idempotencia: sí (reutiliza si ya existe). Adaptadores posibles: GitHub, GitLab.

**ConsultarEstadoDePR** *(especulativa — sin consumidor real hoy)*
Intención: saber si un PR está abierto/mergeado/cerrado. Consumidor: ninguno confirmado en V1. Proveedor: GitHub Adapter. Se documenta porque aparecía en los ejemplos de la Tarea 6, pero **no se justifica todavía** — no hay ningún flujo actual que la necesite. Marcada como pendiente en "Decisiones Abiertas" en vez de forzarla como capability activa (principio 17: no crear componentes por conveniencia).

**Crear rama / Commit / Push** — evaluadas y **no promovidas a Capability Contract con Adapter propio**: son prácticamente 1:1 con la Tool (`git` CLI). El valor de abstracción de envolverlas es bajo porque no hay un escenario de sustitución de herramienta realista para Git en sí (a diferencia de GitHub→GitLab, que sí es sobre el *hosting*, no sobre Git). Se mantienen como comandos directos invocados por la Skill `git-workflow`, documentados nominalmente como "Adapter = Git CLI" en la sección 7.

---

## 7. Adapters

### Jira Adapter (nuevo, consolidado)

- **Capacidades que implementa:** LeerTicket, CrearTicket, ActualizarTicket, ComentarTicket, AplicarTransicionDeEstado, VincularTickets, ConsultarIteraciones, AsignarTicketAIteracion.
- **Detalles técnicos que encapsula:** autenticación (`AUTH`/`HOSTNAME`), formato ADF, `issuetype`/`fields` de Jira, tipos de link disponibles en la instancia (`Blocks`/`Cloners`/`Duplicate`/`Relates`, y la ausencia confirmada de `Tests`/`is tested by`), nombres de estado del workflow, traducción `Iteration → Sprint` (incluyendo el ID interno del Sprint de Jira, que ProductAgent nunca ve).
- **Herramientas concretas que conoce:** Jira REST API v3.
- **Componentes de dominio que NO deben conocer esos detalles:** ProductAgent, Manager.
- **Origen:** consolidación de la mitad "Jira" de `scripts/create-jira-task.js` (`jiraRequest`, `linkIssue`, `transitionIssue`, `addComment`, CRUD) — **las plantillas de contenido ADF (`buildHistoriaDescription`, etc.) se quedan aquí como serialización** (traducir el Ticket Canónico a ADF es trabajo de Adapter), pero el contenido de esos campos lo decide ProductAgent, no el Adapter.
- **Riesgo de refactor:** medio — es el script más grande (747 líneas) y el más usado en el flujo de <7 minutos (regla de CLAUDE.md); ver Tarea 8 para el tratamiento detallado y la fachada de compatibilidad recomendada.

### Zephyr Adapter (ya existe, extender)

- **Capacidades que implementa:** PublicarTestCase, VincularTestCaseATicket, CrearOReutilizarCicloDeEjecucion, ReportarResultadoDeEjecucion.
- **Detalles técnicos que encapsula:** resolución de `folderId` por segmentos de ruta, nombre real de estados (`"Not Executed"`), mapeo `passed/failed/pending` → `Pass/Fail/Blocked`, endpoints de Test Executions.
- **Herramientas concretas que conoce:** Zephyr Scale REST API.
- **Componentes de dominio que NO deben conocer esos detalles:** ProductAgent.
- **Origen:** `scripts/lib/zephyr.js` ya cumple este rol casi completo — **se le suma** la orquestación que hoy vive equivocadamente en `create-jira-task.js` (`resolveTestCycle`, `resolveTestCaseFolder`, `createTestCasesBatch`), para que toda la lógica de "cuándo crear vs. reutilizar carpeta/ciclo" viva en un único archivo.
- **Riesgo de refactor:** bajo — `zephyr.js` ya es el ejemplo a replicar; el único cambio es mover funciones desde `create-jira-task.js`, no reescribirlas.

### GitHub Adapter (ya existe, mantener)

- **Capacidades que implementa:** CrearPullRequest (y, si se activa en el futuro, ConsultarEstadoDePR/mergear).
- **Detalles técnicos que encapsula:** autenticación (`GITHUB_TOKEN`), resolución de repo desde el remoto git, formato de la API de PRs.
- **Herramientas concretas que conoce:** GitHub REST API.
- **Componentes de dominio que NO deben conocer esos detalles:** QaAutomation1.
- **Origen:** `scripts/create-pull-request.js` — ya cumple el patrón, **no requiere refactor**.

### Test Runner Adapter (nuevo — hoy no existe como componente separado)

- **Capacidades que implementa:** EjecutarSuiteDePruebas, ConsultarMecanismosDeVerificacionDeError.
- **Detalles técnicos que encapsula:** comando concreto (`npx cypress run --spec ... --reporter json`), parsing del reporter nativo (Mocha JSON) hacia el Execution Result canónico — **incluye las funciones `mapMochaStateToZephyr`, `collectTestsWithState`, `extractTestCaseKey` que hoy están fuera de lugar dentro de `create-jira-task.js`**; mecanismos de verificación de error concretos (`cy.intercept`, `.has-error`, `aria-invalid`).
- **Herramientas concretas que conoce:** Cypress (hoy).
- **Componentes de dominio que NO deben conocer esos detalles:** `test-execution`, `implementation-plan`, QaAutomation1.
- **Origen:** no existe como archivo propio hoy — es lógica dispersa entre la Skill `cypress-execution` (que invoca `npx cypress run` como texto de instrucción, no como código) y `create-jira-task.js` (que parsea el JSON resultante). **Se recomienda crear `scripts/lib/test-runner.js`** con esa lógica consolidada, análogo a `zephyr.js`.
- **Riesgo de refactor:** medio-bajo — es lógica nueva a extraer (no reescribir desde cero, el parsing ya existe y funciona, solo cambia de archivo).

### Git CLI (sin Adapter dedicado)

- **Capacidades que implementa:** crear rama, commit, push — invocadas directamente como comandos `git` desde la Skill `git-workflow`.
- **Por qué no es un Adapter formal:** ver justificación en sección 6 (bajo valor de abstracción, sin escenario de sustitución realista de Git en sí).

---

## 8. Caso especial: `create-jira-task` (Agent) y `create-jira-task.js` (script)

Son dos componentes distintos que comparten nombre por accidente histórico
— se analizan por separado.

1. **¿Debe existir el Agent?** No. Ver Agent Existence Test en sección 3: no posee ninguna decisión, es un wrapper de una sola tool de lectura. Se elimina como Agent (no como capacidad).

2. **¿Qué capacidades representa el script?** Cinco, no cuatro (hallazgo de la sección 1.3, más fino que Fase 0): (a) transporte Jira, (b) plantillas de contenido de negocio en ADF, (c) orquestación Zephyr (carpetas/ciclos/batch), (d) parsing de resultados de Test Runner (Mocha→Zephyr), (e) CLI (`parseArgs`/`main`).

3. **¿Qué parte pertenece a Jira?** (a) — `jiraRequest`, `linkIssue`, `transitionIssue`, `addComment`, el CRUD de issues.

4. **¿Qué parte pertenece a Zephyr?** (c) — `resolveTestCycle`, `resolveTestCaseFolder`, `createTestCasesBatch`. Esta parte hoy *orquesta* llamadas a `zephyr.js`, no las reimplementa — es la capa "cuándo llamar a qué" de Zephyr, que pertenece conceptualmente al Zephyr Adapter, no al script de Jira.

5. **¿Qué parte es fachada/orquestación técnica?** (e) — el CLI que compone en una sola invocación "crear Historia en Jira" + "publicar N Test Cases en Zephyr" + "reportar resultados" + "verificar ciclo". Esta composición es justamente lo que sostiene la regla de <7 minutos de `CLAUDE.md` — tiene valor operativo real, no es solo desorden.

6. **¿Qué parte debería convertirse en Adapter?** (a) → Jira Adapter. (c) → se funde dentro del Zephyr Adapter (junto a `zephyr.js`).

7. **¿Qué parte debería convertirse en librería interna (no Adapter)?** (b) — las plantillas ADF quedan como funciones internas del Jira Adapter (serialización, no dominio). (d) — el parsing de Mocha JSON se muda a `scripts/lib/test-runner.js` (Test Runner Adapter), porque no tiene nada que ver con Jira ni con Zephyr: es "cómo leer el resultado nativo del Test Runner", y hoy vive en el script equivocado solo porque el flujo de reporte lo necesitaba ahí.

8. **¿Qué compatibilidad debería preservarse?** La interfaz de línea de comandos (`node scripts/create-jira-task.js --data ...`, `--report-results ... --test-cycle ...`, `--verify-cycle ...`) que `ProductAgent`/`Manager` invocan hoy. Se recomienda mantener un **CLI facade** — puede seguir llamándose `scripts/create-jira-task.js` durante la migración — que internamente delegue en el Jira Adapter + Zephyr Adapter + Test Runner Adapter ya separados, en vez de reimplementar transporte propio. Esto evita romper el flujo de <7 minutos mientras se reorganiza el código por dentro.

**Nota sobre `mcp-jira/index.js` (relacionado, no parte de esta tarea pero detectado en la misma inspección):** es un segundo cliente Jira independiente (duplica `jiraRequest`/`AUTH`/`HOSTNAME`). Sus tools de escritura (`create_jira_issue`, `update_jira_issue`) ya están muertas en el flujo oficial. Este documento no decide si el canal MCP sobrevive — eso es C6, explícitamente fuera de alcance de Fase 1 y señalado de nuevo en "Decisiones Abiertas" (sección 16) — pero si sobrevive, debería invocar el mismo Jira Adapter en vez de mantener su propio transporte.

---

## 9. Manager / Orchestrator

**Dentro del Orchestrator (Manager decide):**

- Selección del flujo aplicable según el insumo recibido (R1).
- Orden de ejecución de fases y a qué Agent/Skill delegar en cada momento (R2).
- Reutilización de contexto ya obtenido — nunca repetir una fase ya resuelta (R3).
- Consolidación del resultado final (agrega los fragmentos del Flow Result y decide *cuándo* está completo — R4).
- Manejo de bloqueos: cuándo un "estado: bloqueado" devuelto por una Skill/Agent detiene el flujo completo vs. solo esa sub-tarea (generalización de C8 al nivel de flujo completo).
- Resultado final: disparar `executive-summary` sobre el Flow Result consolidado.
- Las únicas preguntas funcionales válidas al usuario: elegir funcionalidad, elegir escenario (R5).

**Fuera del Orchestrator (Manager NO decide):**

- Lógica funcional de Producto: tipo de issue, contenido de la Historia, cobertura de CA (ProductAgent).
- Lógica de automatización: estrategia técnica, bug real vs. falso positivo (QaAutomation1).
- Jira: nombres de campos, endpoints, ADF (Jira Adapter).
- Zephyr: carpetas, ciclos, nombres de estado (Zephyr Adapter).
- Cypress/Test Runner: comando de ejecución, parsing de resultados (Test Runner Adapter).
- Git/GitHub: comandos concretos, formato de PR (Git CLI / GitHub Adapter).
- Detalles técnicos de las Skills: **Manager nunca nombra una Skill o script por su nombre de archivo en su propio texto** (corrige C4) — invoca capacidades ("descubrir aplicación", "construir escenario", "modelar Test Case") resueltas por un registro de configuración, no por el prompt del Manager.
- Validación de esquema de un Modelo Canónico ajeno: **Manager ya no valida los campos del Test Case Canónico** (corrige C2) — consume el veredicto explícito (`válido`/`inválido` + motivo) que `testcase-model` ya expone en su propia sección de validaciones.
- **El Manager no debe conocer los detalles semánticos internos de ninguna Skill para decidir su propio funcionamiento** (corrección de Fase 2) — trabaja exclusivamente con el resultado/contrato estructurado que la Skill produce (ver "Regla de autoridad", sección 4), nunca con el procedimiento interno que llevó a ese resultado. Esto aplica incluso cuando Manager invoca una Skill directamente (`application-discovery`, `scenario-builder`, `testcase-model`, `executive-summary` — ver mapa de sección 2): Manager consume su salida estructurada, no su lógica interna. Patrón general: `Skill → produce resultado estructurado` / `Agent → interpreta ese resultado dentro de su dominio` / `Manager → usa el resultado (propio o ya interpretado por un Agent) para una decisión de orquestación`.

"Manager decide X" / "Manager NO decide Y" — resumen:

| Manager decide | Manager NO decide |
|---|---|
| Qué flujo corresponde | Qué contenido tiene la Historia |
| En qué orden se ejecutan las fases | Cómo se implementa técnicamente un test |
| Si se reutiliza contexto previo | Qué campos tiene un Test Case válido (eso ya lo valida `testcase-model`) |
| Si un bloqueo detiene todo el flujo o solo una fase | Qué script/Skill concreta implementa una capacidad (eso es config del registro Capability→Adapter) |
| Cuándo el flujo terminó y se genera el cierre | El formato del resumen ejecutivo (lo renderiza `executive-summary` sobre el Flow Result) |

---

## 10. Ownership Matrix

| Decisión | Owner | Ejecuta | Valida | Fuente de conocimiento |
|---|---|---|---|---|
| Qué aplicación analizar | Usuario/Manager | `application-discovery` | Manager | Insumo del usuario |
| Qué flujo funcional seleccionar | Usuario | `application-discovery` (recomienda) | Manager | Lista de funcionalidades detectadas |
| Qué escenario construir | Usuario | `scenario-builder` | Manager | Escenarios detectados |
| Si se reutiliza un Test Case/escenario ya resuelto en fases previas | Manager | — (verificación de contexto, no ejecución) | Manager | Contexto acumulado del flujo (R3) |
| Qué ticket crear (tipo) | ProductAgent | ProductAgent | ProductAgent | Naturaleza de la solicitud (R13) |
| A qué iteración asignar un ticket (o dejarlo en Backlog) | ProductAgent | Jira Adapter (`AsignarTicketAIteracion`) | ProductAgent | `ConsultarIteraciones` (lectura del Adapter) |
| Qué estado debe tener | ProductAgent | Jira Adapter | ProductAgent | Resultado del flujo + workflow de Jira |
| Qué Test Case publicar | ProductAgent | Zephyr Adapter | ProductAgent | Modelo Canónico de Test Case |
| Qué ciclo utilizar | ProductAgent | Zephyr Adapter | ProductAgent | Historia de origen (uno por Historia) |
| Qué resultado reportar | ProductAgent | Zephyr Adapter | ProductAgent | Execution Result canónico (aportado por QaAutomation1) |
| Qué código automatizar | QaAutomation1 | QaAutomation1 | `automation-review` | `implementation-plan` |
| Cuándo crear branch | QaAutomation1 | Git CLI | QaAutomation1 | Recomendación de `branch-management` |
| Cuándo crear PR | QaAutomation1 | GitHub Adapter | QaAutomation1 | Execution Result exitoso + `automation-review` aprobado |
| Detener una sub-tarea ante un veredicto bloqueado de una Skill | El Agent invocador de esa Skill (ProductAgent o QaAutomation1 según el caso) | — | El mismo Agent | Veredicto estructurado de la Skill (patrón R43/C8) |
| Detener el flujo completo | Manager | — | Manager | Reporte de bloqueo del Agent afectado |
| Qué campos y contenido tiene el resultado final | Manager (consolida, R4) | `executive-summary` (renderiza) | Manager | Esquema del Flow Result (Canonical Model) |

No existen dos owners para ninguna decisión de esta lista — cada fila tiene
exactamente un "Decide". Donde la Fase 2 original mezclaba dos actores en
una misma celda ("ProductAgent/Adapter", "Skill decide"), se separó en dos
filas o se movió el segundo actor a la columna que le corresponde
(Ejecuta o Fuente de conocimiento) — corrección de Fase 2, sección 7 del
pedido de corrección.

---

## 11. Dependency Rules

**Regla general de capas** (referencia, no secuencia obligatoria de
runtime — sección "Arquitectura Conceptual" del prompt de esta fase):

```
Manager → Agents (ProductAgent, QaAutomation1)
Agent → Skills / Canonical Models / Capability Contracts
Skill → Canonical Models / procedimientos necesarios
Capability Contract → contrato (nombre + entrada/resultado conceptual)
Adapter → Capability Contract + Tool
Tool → externo
```

**Dependencias explícitamente prohibidas** (de la lista de ejemplo de la
Tarea 11, evaluadas contra este diseño):

| Dependencia prohibida | ¿Existe en V1? | ¿La resuelve este diseño? |
|---|---|---|
| Agent → endpoint Jira | Sí (`productAgent.md` cita `GET /testexecutions`, `PUT /testexecutions/{id}`) | Sí — pasa al Jira/Zephyr Adapter (sección 7) |
| Agent → payload Zephyr | Sí (`productAgent.md` cita `COVERAGE`, `"Not Executed"`) | Sí — Zephyr Adapter |
| Skill → decisión global del flujo | Sí (C8, 9 Skills con "detener el flujo") | Sí — cada Skill devuelve veredicto, el Agent invocador decide (sección 4) |
| Adapter → decisión funcional | No detectada en V1 (los Adapters actuales, `zephyr.js`/`create-pull-request.js`, ya son transporte puro) | Se mantiene la restricción explícita hacia adelante |
| Manager → script concreto | Sí (`Manager.md`, "PRINCIPIO DE UNA SOLA RESPONSABILIDAD" nombra `create-jira-task.js`, `create-pull-request.js`) | Sí — Manager invoca capacidades, no scripts (sección 9) |
| Canonical Model → Jira | No detectada (el Modelo Canónico de Test Case ya es agnóstico) | Se mantiene la restricción hacia los nuevos modelos (Ticket, Execution Result, Flow Result) |
| Cypress Skill → Jira API | No detectada directamente, pero `create-jira-task.js` sí conoce el formato de resultados de Cypress/Mocha (dirección inversa: Jira/Zephyr script → Test Runner) | Sí — ese parsing se muda al Test Runner Adapter (sección 7/8) |
| Git Skill → ProductAgent | No detectada (`git-workflow` no menciona a `productAgent`) | Se mantiene la restricción — `git-workflow` nunca debe necesitar conocer el dominio de tickets |

No se fuerza la estructura de capas donde el análisis mostró una
alternativa mejor: la Skill `bug-reporting` no depende de ningún Canonical
Model (su entrada es evidencia ad-hoc de una ejecución, no un modelo
estructurado) y eso es correcto — forzarla a depender de un modelo hoy
sería un componente por conveniencia.

---

## 12. Cambio de herramienta

### A. Jira → Azure DevOps

- **Qué cambia:** Jira Adapter completo (nueva implementación del mismo contrato); plantillas ADF → equivalente de Azure DevOps.
- **Qué NO cambia:** ProductAgent (decide igual: tipo de issue, síntesis, cobertura); Ticket Canónico; Manager; ningún Skill.
- **Componente que absorbe el cambio:** Jira Adapter → Azure DevOps Adapter.
- **Contrato que permanece estable:** LeerTicket, CrearTicket, ActualizarTicket, ComentarTicket, AplicarTransicionDeEstado, VincularTickets, ConsultarIteraciones, AsignarTicketAIteracion.
- **¿Hay cambio semántico?** Sí, parcial: Azure DevOps representa el concepto de dominio **Iteration** con su propio "Iteration Path" (no idéntico a un Sprint de Jira en todos los planes), y su modelo de "Work Item Type" difiere de Historia/Bug/Tarea — precisamente porque el contrato ya habla de `Iteration` (no de "Sprint"), `ConsultarIteraciones`/`AsignarTicketAIteracion` migran con mapeo cuidadoso en el Adapter, sin tocar ProductAgent; la relación de `TIPOS DE ISSUE` del Ticket Canónico sí requiere ese mismo mapeo cuidadoso, no es sustitución 1:1 mecánica.

### B. Zephyr → Xray

- **Qué cambia:** Zephyr Adapter → Xray Adapter.
- **Qué NO cambia:** ProductAgent, Test Case Canónico, Flow de publicación/ciclo/reporte.
- **Componente que absorbe el cambio:** Zephyr Adapter.
- **Contrato estable:** PublicarTestCase, VincularTestCaseATicket, CrearOReutilizarCicloDeEjecucion, ReportarResultadoDeEjecucion.
- **¿Hay cambio semántico?** Sí, uno relevante: Xray sí soporta el tipo de link nativo `Tests`/`is tested by` en Jira (el hallazgo de Fase 0 fue "esta instancia de Jira sin Xray no lo tiene") — migrar a Xray potencialmente **simplifica** `VincularTestCaseATicket` (podría usar un link type nativo de Jira en vez del mecanismo propio de Zephyr), lo cual es una mejora de contrato, no solo una sustitución mecánica de Adapter.

### C. GitHub → GitLab

- **Qué cambia:** GitHub Adapter → GitLab Adapter.
- **Qué NO cambia:** `git-workflow`, QaAutomation1, todo lo relativo a Git en sí (commits, push, ramas).
- **Componente que absorbe el cambio:** GitHub Adapter.
- **Contrato estable:** CrearPullRequest (GitLab lo llama "Merge Request" — es un cambio de nombre, no de contrato).
- **¿Hay cambio semántico?** No — es el caso más mecánico de los cuatro. Riesgo bajo.

### D. Cypress → Playwright

- **Qué cambia:** Test Runner Adapter (comando de ejecución, parsing de resultados nativos, mecanismos de verificación de error).
- **Qué NO cambia:** `test-execution`, `execution-validation`, `automation-review`, `implementation-plan` (una vez aplicada la corrección C9), Execution Result Canónico, reporte a Zephyr.
- **Componente que absorbe el cambio:** Test Runner Adapter.
- **Contrato estable:** EjecutarSuiteDePruebas, ConsultarMecanismosDeVerificacionDeError.
- **¿Hay cambio semántico?** Sí, uno relevante y no trivial: el código de automatización en sí (Page Objects, comandos, specs) **no es parte de ningún contrato de esta arquitectura** — Cypress y Playwright tienen APIs de scripting incompatibles, por lo que cambiar de Test Runner implica reescribir el código de automatización existente, no solo sustituir un Adapter. La arquitectura aísla la *orquestación* del cambio de herramienta (qué Skill/Agent se entera), pero **no elimina el costo de reescritura del código de prueba en sí** — eso es trabajo de dominio técnico (QaAutomation1), inevitable en cualquier arquitectura.

**Conclusión general de la Tarea 12:** los 4 escenarios confirman que el
cambio de herramienta queda aislado en el Adapter correspondiente para la
*orquestación e integración*, pero el escenario D muestra el límite real de
"todo cambio de herramienta queda aislado" — cuando la herramienta es el
medio de ejecución del propio artefacto de negocio (el código de test), el
cambio es semántico y toca el dominio técnico, no solo el Adapter. Esto se
deja explícito para no prometer una sustituibilidad que la arquitectura no
puede dar.

---

## 13. Flujo V2 (conceptual, por responsabilidad y contrato)

```
Usuario → Manager
  Manager decide flujo (R1) según insumo (app/URL vs ticket/HU/TC/rama)

  [Si insumo = app/URL/proyecto]
  Manager → Skill "descubrir aplicación" (application-discovery)
    → genera: lista de funcionalidades
    → Manager muestra lista, espera selección del usuario (única pregunta válida)

  Manager → Skill "construir escenario funcional" (scenario-builder)
    → genera: Especificación funcional (Escenario/CA/TC/matriz)
    → Manager muestra escenarios si hay más de uno, espera selección

  Manager → Skill "modelar Test Case canónico" (testcase-model)
    → por cada TC-XX.Y: genera Test Case Canónico
    → testcase-model valida su propia salida (veredicto válido/inválido)
    → Manager consume el veredicto (ya no re-valida los campos, corrige C2)

  Manager → ProductAgent (Domain Agent), entrega: Especificación funcional + Test Cases Canónicos
    ProductAgent decide: tipo de issue (R13), síntesis de Ticket Canónico (R14)
    ProductAgent valida: cobertura mínima (4 CA, 2-5 TC/CA)
    ProductAgent solicita Capability "CrearTicket" → Jira Adapter ejecuta
      ← resultado: Ticket creado (identificador + URL)
    Por cada Test Case Canónico:
      ProductAgent decide "debe publicarse" (R21) → Capability "PublicarTestCase" → Zephyr Adapter ejecuta
      ProductAgent decide "debe vincularse" (R23) → Capability "VincularTestCaseATicket" → Zephyr Adapter ejecuta
      ProductAgent decide ciclo (R24, una vez por Historia) → Capability "CrearOReutilizarCicloDeEjecucion" → Zephyr Adapter ejecuta
    ProductAgent → Manager: confirmación (Ticket Canónico + Test Case Keys + Test Cycle Key)

  Manager → QaAutomation1 (Domain Agent), entrega: Ticket Canónico aprobado
    QaAutomation1 → Skill "analizar ticket" (ticket-analysis) → veredicto de alcance/riesgos
    QaAutomation1 → Skill "analizar framework" (framework-analysis) → veredicto de reutilización
    QaAutomation1 → Skill "planificar implementación" (implementation-plan)
      → consulta Capability "ConsultarMecanismosDeVerificacionDeError" → Test Runner Adapter (si hay casos negativos/borde)
      → genera: plan técnico
    Si cualquier veredicto = bloqueado → QaAutomation1 decide si detiene su fase (nunca la Skill decide esto)

    QaAutomation1 → Skill "gestionar rama" (branch-management) → recomendación
    QaAutomation1 decide y ejecuta (Git CLI): crear/reutilizar rama

    QaAutomation1 implementa el código (R30, sin Skill dedicada)

    QaAutomation1 → Skill "test-execution" → Capability "EjecutarSuiteDePruebas" → Test Runner Adapter ejecuta
      ← Execution Result Canónico
    QaAutomation1 → Skill "execution-validation" → veredicto (aprobada/rechazada)
    Si rechazada → QaAutomation1 decide detener (no continúa a commit/PR)

    QaAutomation1 → Skill "automation-review" → veredicto de calidad
    Si se detecta posible bug → QaAutomation1 → Skill "bug-reporting" → reporte o descarte

    QaAutomation1 → Skill "git-workflow": commit + push (Git CLI directo)
    QaAutomation1 → Capability "CrearPullRequest" → GitHub Adapter ejecuta
      ← URL del PR

    QaAutomation1 aporta su fragmento del Flow Result (Execution Result, review, commit/push/PR)
    QaAutomation1 → Manager: confirmación

  Manager → ProductAgent: cierre
    ProductAgent decide resultado de dominio a reportar (R25) usando el Execution Result recibido
      → Capability "ReportarResultadoDeEjecucion" → Zephyr Adapter ejecuta
    ProductAgent decide transición de estado (R18) → Capability "AplicarTransicionDeEstado" → Jira Adapter ejecuta
    ProductAgent → Capability "ComentarTicket" (con el Flow Result renderizado) → Jira Adapter ejecuta
    ProductAgent aporta su fragmento del Flow Result (estado Jira)

  Manager consolida el Flow Result completo (R4)
  Manager → Skill "executive-summary" → renderiza el resumen ejecutivo único
  Manager entrega el resumen al usuario. Fin del flujo.
```

Puntos donde el flujo se detiene (siempre decisión del Agent invocador, no
de la Skill que emitió el veredicto):

- Especificación funcional incompleta antes de ProductAgent.
- Cobertura de CA/TC insuficiente en ProductAgent.
- Capacidad Jira/Zephyr requerida no soportada por el Adapter actual.
- `ticket-analysis`/`framework-analysis`/`implementation-plan` con veredicto bloqueado.
- Execution Result fallido (`execution-validation` rechazada).
- `automation-review` con "Requiere mejoras" (a criterio de QaAutomation1, no automático).
- Inconsistencia ticket/rama/commit (`branch-management`).

---

## 14. Migración V1 → V2

Ningún componente se elimina físicamente en esta fase. Tabla de destino
propuesto:

| V1 | Decisión V2 | Destino | Riesgo | Compatibilidad |
|---|---|---|---|---|
| `Manager.md` | Conservar, reescribir | Orchestrator (sección 9) | Medio — quitar nombres de scripts (C4) y validación de schema ajeno (C2) sin romper el flujo de <7 min | Alta — mismo Agent, mismo nombre |
| `productAgent.md` | Conservar, reescribir | Domain Agent Tickets (sección 3) | Alto — es el que más conocimiento de integración pierde (C3); requiere que el Jira/Zephyr Adapter ya esté listo antes de reescribirlo | Alta — mismo Agent, mismo nombre |
| `QaAutomation1.md` | Conservar, reescribir | Domain Agent Automatización (sección 3) | Medio — quitar hardcodeo de Cypress/GitHub (C9) | Alta — mismo Agent, mismo nombre |
| `create-jira-task.md` (Agent) | Eliminar como Agent | Capability `LeerTicket` (Jira Adapter) | Bajo — sin consumidores propios más allá de derivar a ProductAgent | Media — quien lo invocaba pasa a invocar la capability directamente |
| `desarrollador.md` | Eliminar | — | Ninguno — sin consumidores en el pipeline oficial | Ninguna afectada |
| `ejecutor.md` | Eliminar | — | Ninguno | Ninguna afectada |
| `probando.md` | Eliminar | — | Ninguno | Ninguna afectada |
| `application-discovery` | Conservar | Skill (sección 4) | Ninguno | Total |
| `scenario-builder` | Conservar | Skill | Ninguno | Total |
| `testcase-model` | Conservar | Skill / Canonical Model | Ninguno | Total |
| `ticket-analysis` | Conservar, ajuste C8 | Skill | Bajo | Alta |
| `framework-analysis` | Conservar, ajuste C8 | Skill | Bajo | Alta |
| `implementation-plan` | Conservar, corrección C9 | Skill | Medio — requiere que el Test Runner Adapter exponga `ConsultarMecanismosDeVerificacionDeError` antes de quitar el hardcodeo de Cypress | Alta |
| `branch-management` | Conservar, ajuste C8 | Skill | Bajo | Alta |
| `cypress-execution` | Renombrar conceptualmente | Skill `test-execution` | Medio — depende de que exista el Test Runner Adapter | Media — el nombre de invocación cambia, mantener alias durante la transición |
| `execution-validation` | Conservar, ajuste C8 | Skill | Bajo | Alta |
| `automation-review` | Conservar, quitar sección Executive Summary duplicada | Skill | Bajo | Alta |
| `bug-reporting` | Conservar | Skill | Ninguno | Total |
| `git-workflow` | Conservar, ajuste C8 | Skill | Bajo | Alta |
| `executive-summary` | Conservar, redefinir entrada (Flow Result) | Skill | Medio — depende de que el Flow Result Canonical Model esté definido en detalle | Media |
| `scripts/create-jira-task.js` | Particionar (no reescribir desde cero) | Jira Adapter + Zephyr Adapter (orquestación) + Test Runner Adapter (parsing) + CLI facade | Alto — es el componente más crítico del flujo de <7 min | Alta si se preserva el CLI facade (sección 8) |
| `scripts/lib/zephyr.js` | Extender (recibe funciones movidas desde create-jira-task.js) | Zephyr Adapter | Bajo | Total |
| `scripts/create-pull-request.js` | Conservar tal cual | GitHub Adapter | Ninguno | Total |
| `mcp-jira/index.js` | Evaluar (C6, fuera de alcance cerrar acá) | Posible fachada sobre Jira Adapter, o retiro de las tools muertas | Medio — depende de la decisión de canal oficial (Decisiones Abiertas) | Baja si se retira sin avisar a nada que lo consuma (verificar primero que nada más allá de `create-jira-task` Agent lo use) |
| `scripts/create-tc16-ticket.js`, `create-tc21-ticket.js`, `create-test-case-4.js` | Retirar (ya confirmados obsoletos en Fase 0) | — | Ninguno | Ninguna — sin consumidores |

**Orden seguro de migración recomendado** (dependencias, no fechas):

1. Crear `scripts/lib/test-runner.js` (Test Runner Adapter) moviendo el parsing de Mocha desde `create-jira-task.js` — no rompe nada porque es código nuevo en paralelo.
2. Extender `scripts/lib/zephyr.js` con la orquestación de carpetas/ciclos movida desde `create-jira-task.js`.
3. Extraer el transporte Jira puro a un módulo `scripts/lib/jira.js` (Jira Adapter), manteniendo `create-jira-task.js` como CLI facade que ahora delega en los tres módulos anteriores.
4. Recién con los tres Adapters estables, reescribir `productAgent.md` (el cambio de mayor riesgo) para que deje de narrar los detalles internos.
5. Reescribir `QaAutomation1.md` e `implementation-plan` en paralelo (ambos dependen del Test Runner Adapter del paso 1).
6. Reescribir `Manager.md` al final (depende de que los Agents delegados ya no necesiten que Manager conozca sus scripts).
7. Retirar `create-jira-task` (Agent), `desarrollador`, `ejecutor`, `probando` — sin dependencias, se puede hacer en cualquier momento, incluso antes que el resto.

---

## 15. Architectural Gaps

- **Traceability sin dueño de esquema cerrado.** El Canonical Model de Traceability (sección 5) está identificado y con productores incrementales asignados, pero su esquema exacto de campos no está definido — es la responsabilidad sin dueño más concreta que deja esta fase (relacionada con R35, R11).
- **Flow Result sin esquema de campos cerrado más allá de una lista de alto nivel.** La sección 5 lista los campos principales, pero no define, por ejemplo, el formato exacto de `riesgos[]` o cómo se versiona un Flow Result parcial (¿existe un Flow Result "en progreso" que Manager consulta durante el flujo, o solo se materializa al final?). Gap para la fase de diseño de componentes detallado.
- **`ConsultarEstadoDePR` es una capability sin consumidor real.** Se documentó por completitud (aparecía en los ejemplos de la Tarea 6) pero ningún flujo actual la necesita — riesgo de sobre-diseño si se implementa sin un caso de uso. Mantenida como capability latente, no activa.
- **`ConsultarIteraciones`/`AsignarTicketAIteracion` no tienen Adapter method 1:1 hoy.** `create-jira-task.js` no expone una función dedicada para "consultar sprints activos" de forma aislada — hoy esa lógica vive inline dentro del flujo de creación de ticket, ya mezclada con la decisión de a cuál asignar. Al extraer el Jira Adapter, ambas capabilities requieren funciones nuevas (no una migración directa de código existente), separando lo que hoy es una sola pieza de lógica en dos: "consultar" (lectura pura) y "asignar" (ejecución de la decisión ya tomada por ProductAgent).
- **Modelo Canónico de "Historia" reemplaza contenido hoy embebido en `productAgent.md` (plantilla BDD completa, ejemplos, prohibiciones).** Falta decidir cuánto de ese contenido (formato BDD, reglas de "no mezclar formatos", ejemplos) se queda como *reglas de negocio en ProductAgent* (correcto) vs. cuánto se convierte en *parte del schema del Ticket Canónico* (también correcto, pero hay que trazar la línea exacta). Gap de diseño detallado, no de esta fase.
- **Las 9 Skills cuya redacción V1 todavía dice "detener el flujo" (C8) necesitan reescritura uniforme al veredicto estructurado** (`estado: ok|bloqueado`, `motivo`) — esta fase define el patrón y la regla de autoridad (R43, sección 4) y dejó marcado el cambio puntual en cada una (sección 4), pero no reescribe el texto completo de las 9 `SKILL.md`; eso es trabajo de implementación, no de diseño.
- **Ningún Adapter ni Capability sin consumidor** más allá de `ConsultarEstadoDePR` (ya señalada). Ninguna Skill sin Agent consumidor. Ningún Canonical Model sin productor.
- **Ningún caso detectado de "Agent que conoce demasiado" no cubierto ya por C3/C9** (los dos hallazgos de Fase 0/1 siguen siendo los únicos de ese tipo tras la inspección directa del código en la sección 1).
- **Integraciones expuestas al dominio, hallazgo nuevo de esta fase:** el parsing de resultados de Cypress/Mocha dentro de `create-jira-task.js` (sección 1.3/8) — no estaba señalado explícitamente en Fase 0/1 como su propio hallazgo (se mencionaba dentro de "mezcla 4 responsabilidades" sin nombrar esta quinta). Resuelto en el diseño (sección 7/8), pendiente de implementación.

---

## 16. Decisiones abiertas (Open Architectural Decisions)

| # | Pregunta | Opciones | Evidencia disponible | Decisión recomendada | Qué falta para cerrarla |
|---|---|---|---|---|---|
| 1 | ¿Cuál es el canal Jira oficial? (C6) | (a) Script directo (`create-jira-task.js`/Jira Adapter) (b) MCP (`mcp-jira`) (c) Ambos, MCP como fachada del Adapter | Solo `get_jira_issue` de MCP está realmente en uso; `create_jira_issue`/`update_jira_issue` están muertas | (a) como único canal de escritura; evaluar si mantener MCP solo para lectura, delegando al mismo Adapter | Confirmar si algo fuera de este proyecto (otro cliente MCP) depende de `mcp-jira` antes de tocarlo |
| 2 | ¿Qué estrategia sigue `create-jira-task.js`? | (a) Particionar en 3 Adapters + CLI facade (recomendado, sección 8) (b) Reescribir desde cero (c) Dejarlo igual | Es el componente más usado en el flujo de <7 min; particionar preserva compatibilidad | (a) | Validar que el orden de migración (sección 14) no rompa una ejecución en curso durante la transición |
| 3 | ¿Cómo se particiona exactamente Jira/Zephyr dentro del nuevo Jira Adapter? | (a) Un solo archivo `jira.js` con todo Jira (b) Separar además por sub-capacidad (tickets vs. comentarios vs. transiciones) | `zephyr.js` ya demuestra que un solo archivo por herramienta es suficiente | (a), replicando el patrón de `zephyr.js` | Ninguna — es una decisión de bajo riesgo, se resuelve en implementación |
| 4 | ¿Cuál es el esquema exacto del Flow Result? | (a) Definirlo ahora, en detalle de campos (b) Dejarlo como lista de alto nivel (esta fase) y cerrarlo en diseño de componentes | Cuatro formatos compitiendo hoy (C1) dan buena base de campos candidatos | (b) — esta fase ya identificó el modelo y sus productores (sección 5); el detalle de campos es Fase 2.1/diseño de componentes | Recolectar los campos exactos de los 4 formatos hoy en competencia y unificarlos sin perder ninguno |
| 5 | ¿Cuál es el esquema exacto del modelo de trazabilidad? | (a) Definirlo ahora (b) Dejarlo pendiente | Fragmentado en 3 lugares (sección 5/15) | (b) — identificado el productor incremental, el schema exacto requiere revisar cómo Zephyr expone realmente la cadena Test Case↔Ejecución↔Ciclo | Confirmar contra la API de Zephyr qué se puede consultar de vuelta (ej. ¿se puede pedir "todas las ejecuciones de un Test Case"?) antes de fijar campos |
| 6 | ¿Qué estrategia de ejecución Cypress sigue vigente mientras no exista el Test Runner Adapter? | (a) Mantener `npx cypress run` invocado como hoy dentro de `test-execution` (compatibilidad temporal) (b) Bloquear cualquier ejecución hasta que el Adapter exista | El Adapter es nuevo, no existe código previo que migrar 1:1 | (a) — sin Adapter, `test-execution` sigue invocando el comando directamente hasta que se implemente `scripts/lib/test-runner.js` | Ninguna — es una decisión de secuenciación de migración |
| 7 | ¿Qué política de Git/PR sigue vigente para operaciones puntuales (merge, fetch, consulta de estado)? | (a) Comando directo sin Adapter (ya es la política mixta vigente en `git-workflow`) (b) Formalizar todas como capabilities | `git-workflow` ya documenta explícitamente esta política mixta y funciona | (a) — se conserva sin cambios, ya está bien resuelta en V1 | Ninguna |
| 8 | ¿Qué compatibilidad con V1 debe preservarse durante toda la migración? | (a) Ningún flujo en curso se rompe: los Agents V2 deben poder leer artefactos creados por los Agents V1 (tickets, ramas, PRs ya existentes) (b) Se acepta una ventana de discontinuidad | No hay evidencia de necesidad de discontinuidad — el proyecto sigue operando sobre el mismo Jira/Zephyr/GitHub | (a) — los Canonical Models nuevos deben poder construirse a partir de tickets/PRs ya existentes en Jira/GitHub, no solo de los creados después de la migración | Validar con un ticket real ya cerrado que el Ticket Canónico puede reconstruirse desde `LeerTicket` sin pérdida |

---

## 17. Resumen ejecutivo

Ver mensaje de cierre de esta tarea para el resumen ejecutivo dirigido al
usuario (Agents V2, Skills V2, Canonical Models, Capability Contracts,
Adapters, candidatos a eliminar/fusionar, decisiones principales, abiertas
y riesgos). Este documento es la especificación completa; el resumen es su
versión de lectura rápida.
