# Architecture V2 — Fase 1: Mapa de Responsabilidades y Límites

## 0. Estado y propósito de este documento

Este documento es la continuación de `docs/architecture/architecture-v2-spec.md`
(Fase 0, fuente de verdad arquitectónica). No la reemplaza ni la contradice —
la profundiza.

**Esta fase no implementa la V2, no modifica ningún Agent/Skill/script, no
elimina archivos y no define todavía la estructura definitiva de
`.claude/agents` ni `.claude/skills`.**

Objetivo único de esta fase: **definir responsabilidades y límites**, en
este orden:

1. Inventario exhaustivo de responsabilidades reales (sin agrupar por
   Agent/Skill todavía).
2. Mapa de dónde vive cada responsabilidad hoy.
3. Conflictos de responsabilidad detectados entre componentes.
4. Test de existencia de Agent aplicado a los 7 Agents actuales.
5. Mapeo de responsabilidades a las capas objetivo de la V2.

Base empírica: lectura completa de los 7 archivos de `.claude/agents/*.md`,
los 13 `.claude/skills/*/SKILL.md`, y los hallazgos ya documentados en la
sección 1 de `architecture-v2-spec.md`. No se repite ese análisis de
evidencia — se referencia por número (ej. "spec 1.6").

---

## 1. Inventario de responsabilidades

Responsabilidades atómicas observadas en el sistema real, en términos de
**qué se hace**, no de **quién lo hace**. Agrupadas solo por tema para
legibilidad — el agrupamiento no implica que deban compartir dueño.

### Orquestación del flujo

- R1. Determinar el flujo aplicable según el insumo recibido (app/URL vs.
  ticket/HU/Test Case/rama existente).
- R2. Coordinar el orden de fases y decidir a qué componente delegar en
  cada momento.
- R3. Detectar y reutilizar contexto ya obtenido en fases previas (no
  repetir descubrimiento, selección o construcción ya resuelta).
- R4. Consolidar el resultado final de un flujo completo en un único
  artefacto de cierre.
- R5. Detener el flujo y solicitar una decisión al usuario únicamente
  cuando esa decisión sea funcional (no técnica).

### Descubrimiento y especificación funcional

- R6. Descubrir el contexto funcional de una aplicación (módulos,
  funcionalidades principales, fuente de esa información).
- R7. Clasificar y priorizar funcionalidades detectadas (observada vs.
  inferida; complejidad).
- R8. Construir un escenario funcional (objetivo, precondición, flujo
  esperado, reglas de negocio).
- R9. Derivar criterios de aceptación de un escenario funcional.
- R10. Derivar casos de prueba funcionales de un criterio de aceptación.
- R11. Construir y mantener la matriz de trazabilidad
  Escenario↔CA↔TC.
- R12. Transformar una especificación funcional en un Modelo Canónico de
  Test Case, independiente de cualquier herramienta de gestión de pruebas.

### Gestión de tickets (dominio "trabajo de negocio")

- R13. Determinar el tipo de issue que corresponde a una solicitud
  (Historia / Bug / Tarea).
- R14. Transformar una especificación funcional en una Historia de Usuario
  orientada a negocio (síntesis, no copia literal).
- R15. Validar y redactar un reporte de Bug (sin falsos positivos, sin
  selectores técnicos).
- R16. Redactar una Tarea técnica.
- R17. Determinar a qué Sprint (o Backlog) asignar un nuevo ticket.
- R18. Determinar el estado/transición de negocio que corresponde al
  resultado del flujo (la ejecución concreta contra la herramienta de
  gestión de tickets es responsabilidad del Adapter).
- R19. Determinar cuándo un ticket debe quedar vinculado a otro ticket
  relacionado (ej. Bug descubierto durante la automatización de una
  Historia); la ejecución del vínculo es responsabilidad del Adapter.
- R20. Necesidad, por parte de un Agent autorizado (ej. `productAgent`), de
  consultar el estado/contenido de un ticket existente — es una capacidad
  de integración/Jira (el Adapter de Jira la ejecuta), no una
  responsabilidad de dominio en sí misma; el Agent solo decide *cuándo*
  invocarla (ver C7).

### Gestión de casos de prueba en la herramienta de test management

- R21. Determinar que un Test Case del Modelo Canónico debe quedar
  publicado en la herramienta de gestión de pruebas; la ejecución de la
  publicación es responsabilidad del Adapter.
- R22. Organizar Test Cases en carpetas/suites funcionales.
- R23. Determinar que un Test Case debe quedar vinculado a su Historia de
  origen (trazabilidad de cobertura); la ejecución del vínculo es
  responsabilidad del Adapter.
- R24. Determinar el ciclo de prueba al que deben agruparse las
  ejecuciones de una Historia; la ejecución de esa agrupación es
  responsabilidad del Adapter.
- R25. Determinar el resultado de dominio (Pass/Fail/Blocked) que debe
  reportarse al sistema de gestión de pruebas a partir de una ejecución
  automatizada; la ejecución del reporte es responsabilidad del Adapter.
- R26. Traducir un estado de dominio (Pass/Fail/Blocked, ya determinado en
  R25) al nombre específico que usa la herramienta concreta — esta
  traducción es, en sí misma, responsabilidad del Adapter, no una decisión
  de negocio adicional.

### Automatización técnica

- R27. Analizar un ticket/escenario para determinar el alcance técnico de
  implementación.
- R28. Analizar el framework de automatización existente (arquitectura,
  convenciones, componentes reutilizables).
- R29. Definir un plan técnico de implementación (qué reutilizar, extender
  o crear).
- R30. Implementar el código de automatización (specs, Page Objects,
  helpers, comandos).
- R31. Ejecutar la suite de pruebas automatizadas.
- R32. Validar los resultados de una ejecución (evidencia suficiente,
  consistencia, ausencia de errores críticos).
- R33. Revisar la calidad técnica de una automatización antes de
  integrarla (arquitectura, reutilización, mantenibilidad, riesgos).
- R34. Detectar un posible defecto de la aplicación durante la
  automatización y descartar falsos positivos.
- R35. Materializar en el código de un test el identificador de
  trazabilidad (CA/TC/Test Case Key) que permite el reporte automático
  posterior — el Agent de automatización aplica esa trazabilidad, pero no
  es su dueño conceptual (ver nota siguiente).

**Nota sobre trazabilidad (R35):** la trazabilidad CA → TC → Test Case →
Automated Test → Execution → resultado/artefactos es una preocupación
transversal y canónica, no una responsabilidad exclusiva de
Cypress/QaAutomation. R35 cubre únicamente la materialización técnica de
esa trazabilidad en el código de un test concreto; el modelo/regla/contrato
de trazabilidad en sí (quién es la fuente de verdad de cada identificador,
cómo se propaga entre capas) no se define en esta fase — queda pendiente
para una fase posterior (ver sección 6).

### Control de versiones y entrega

- R36. Determinar la estrategia de rama (reutilizar existente vs. crear
  nueva) para un ticket.
- R37. Verificar consistencia entre ticket, rama y mensaje de commit.
- R38. Generar un commit siguiendo la convención del proyecto.
- R39. Realizar push de una rama.
- R40. Crear un Pull Request.
- R41. Mergear un Pull Request a la rama principal (acción que requiere
  confirmación explícita del usuario, sin excepción — ver `CLAUDE.md`).

### Comunicación y reporte

- R42. Presentar el resultado consolidado de un flujo (o de uno o varios
  análisis técnicos) en formato de resumen ejecutivo. Esto distingue tres
  preocupaciones hoy mezcladas: (a) el **resultado canónico** del flujo (el
  dato en sí — ver R4 y C1); (b) su **agregación/consolidación**
  (responsabilidad de `Manager`, R4); y (c) su **representación/
  presentación** como "Executive Summary" (R42 en sí mismo). R42 debe
  derivarse del modelo canónico de (a), nunca redefinir su propio formato.
- R43. Comunicar resultados, errores o limitaciones entre componentes del
  flujo — no es un dominio de decisión ni un componente (Agent/Skill), sino
  un **mecanismo contractual**: cada componente devuelve al que lo invocó
  un resultado estructurado (`estado`, `resultado`, `motivo`, `artefactos`,
  `identificadores`, `errores`, `bloqueos`), en vez de una comunicación
  libre/informal ("informar al Manager"). No debe crear un Agent o Skill
  "CommunicationAgent" ni equivalente — generaliza a toda comunicación
  entre componentes el mismo patrón que C8 ya propone para el veredicto de
  "detener el flujo" (`estado: ok | bloqueado`, `motivo`).

### Integración con herramientas externas (transporte)

- R44. Autenticarse y realizar llamadas HTTP contra la API de Jira.
- R45. Autenticarse y realizar llamadas HTTP contra la API de Zephyr.
- R46. Autenticarse y realizar llamadas HTTP contra la API de GitHub.
- R47. Ejecutar el test runner (hoy Cypress) como proceso del sistema.

### Gobernanza / higiene del proyecto (transversales)

- R48. Verificar que no exista ya una implementación oficial antes de
  proponer una nueva herramienta o script (evitar duplicación).
- R49. Evitar archivos temporales/experimentales dentro del repositorio.
- R50. Detener el flujo e informar ante inconsistencias de trazabilidad o
  cobertura funcional insuficiente.

---

## 2. Mapa actual: dónde vive cada responsabilidad hoy

| # | Responsabilidad | Dónde vive hoy |
|---|---|---|
| R1–R5 | Orquestación | `Manager` |
| R6, R7 | Descubrimiento de app | skill `application-discovery` |
| R8–R11 | Escenario/CA/TC funcionales | skill `scenario-builder` |
| R12 | Modelo Canónico de Test Case | skill `testcase-model` |
| R13–R19 | Ciclo de vida de tickets | `productAgent` |
| R20 | Lectura de un issue Jira | Agent `create-jira-task` (vía MCP `get_jira_issue`) — pero `productAgent` también podría leer (capacidad de integración, no de dominio — ver corrección de R20 en sección 1 y C7) |
| R21–R26 | Publicación/estado en Zephyr | `productAgent`, invocando `scripts/create-jira-task.js` |
| R27 | Análisis de ticket para implementación | skill `ticket-analysis` |
| R28 | Análisis de framework | skill `framework-analysis` |
| R29 | Plan técnico | skill `implementation-plan` |
| R30 | Implementación de código | `QaAutomation1` (directamente, sin skill dedicada) |
| R31 | Ejecución de Cypress | skill `cypress-execution` |
| R32 | Validación de resultados | skill `execution-validation` |
| R33 | Revisión de calidad | skill `automation-review` |
| R34 | Detección/validación de bugs | skill `bug-reporting` |
| R35 | Tag `[CA-XX][TC-XX.X][SCRUM-Txx]` | regla dentro de `QaAutomation1.md` |
| R36 | Estrategia de rama | skill `branch-management` |
| R37–R39 | Commit/push | skill `git-workflow` (y reglas duplicadas en `QaAutomation1.md`) |
| R40 | Crear Pull Request | `scripts/create-pull-request.js`, invocado por `QaAutomation1`/skill `git-workflow` |
| R41 | Merge a main | acción manual con confirmación explícita del usuario (regla de `CLAUDE.md`) |
| R42 | Resumen ejecutivo | **tres definiciones distintas**: `Manager.md` ("INFORME FINAL"), `QaAutomation1.md` ("FORMATO OFICIAL DEL EXECUTIVE SUMMARY"), skill `executive-summary` ("RESUMEN EJECUTIVO") — más una cuarta variante dentro de skill `automation-review` que reutiliza los mismos campos que `executive-summary` (ver corrección de R42 en sección 1: la causa raíz es que hoy no existe un resultado canónico de flujo del que derivar la representación) |
| R43 | Comunicación entre componentes (mecanismo contractual, no componente) | implícita e informal en cada Agent/Skill ("informar al Manager") — sin estructura de datos común (`estado`/`resultado`/`motivo`/`artefactos`/`identificadores`/`errores`/`bloqueos`) |
| R44 | Transporte Jira | `scripts/create-jira-task.js` (`jiraRequest`) **y**, por separado, `mcp-jira/index.js` (implementación duplicada, ver spec 1.3) |
| R45 | Transporte Zephyr | `scripts/lib/zephyr.js` |
| R46 | Transporte GitHub | `scripts/create-pull-request.js` |
| R47 | Ejecución de Cypress (proceso) | invocado directamente (`npx cypress run ...`) dentro de skill `cypress-execution` |
| R48 | No duplicar herramientas | regla repetida en `Manager.md`, `QaAutomation1.md`, `productAgent.md` y `CLAUDE.md` |
| R49 | No archivos temporales | regla repetida en `QaAutomation1.md`, `productAgent.md`, `desarrollador.md`, `git-workflow` |
| R50 | Frenar ante inconsistencia | regla repetida, con criterio propio, en `Manager.md`, `productAgent.md`, `ticket-analysis`, `framework-analysis`, `implementation-plan`, `testcase-model`, `branch-management`, `cypress-execution`, `execution-validation` |

**Lectura de esta tabla:** las filas con una única celda de "dónde vive
hoy" (R1–R40 en su mayoría) están razonablemente bien ubicadas. Las filas
con múltiples ubicaciones o redacciones distintas de la misma regla (R42,
R44, R48, R49, R50) son exactamente los puntos de fricción que se
profundizan en la sección 3.

---

## 3. Conflictos de responsabilidad

Para cada conflicto: **por qué existe**, **cuál es el conflicto concreto**,
**dónde debería quedar la autoridad**, y **qué parte debería devolverse
como dato** al componente que hoy decide de más.

### C1 — Formato de cierre de flujo ("Executive Summary" / "Informe Final")

- **Por qué existe:** cada componente que necesitaba comunicar un cierre
  escribió su propio formato en el momento en que lo necesitó, en lugar de
  delegar en una única definición. Hay cuatro variantes: `Manager` (INFORME
  FINAL), `QaAutomation1` (FORMATO OFICIAL DEL EXECUTIVE SUMMARY, con
  campos que `Manager` no tiene), skill `executive-summary` (RESUMEN
  EJECUTIVO, con campos orientados a análisis técnico) y skill
  `automation-review` (reimplementa los mismos campos que
  `executive-summary` dentro de su propia sección "Executive Summary").
- **Conflicto concreto:** no existe una única fuente de verdad de qué
  campos tiene un "resultado de flujo". `QaAutomation1` y
  `automation-review` no consumen el skill `executive-summary`: cada uno
  redefine su propio formato con el mismo nombre.
- **Dónde debería quedar la autoridad:** un único Modelo Canónico de
  "resultado de flujo/ticket" (mismo patrón que `testcase-model`, ver spec
  3.5), consumido — no reescrito — por cada Agent que necesite cerrarlo.
- **Qué se devuelve como dato:** cada productor parcial (`cypress-execution`
  → passing/failing/duración, `execution-validation` → veredicto,
  `automation-review` → estado de calidad, `productAgent` → ticket/estado
  Jira) debe devolver campos estructurados; la capacidad de "resumir" los
  combina en el Modelo Canónico único. Ningún Agent debería redefinir el
  formato de salida por su cuenta.
- **Aclaración (separación de capas, sin resolver el conflicto):** este
  conflicto mezcla tres preocupaciones distintas que conviene distinguir
  aunque su resolución quede para el diseño: (1) el **resultado canónico**
  del flujo (el dato — hoy inexistente como modelo formal, ver R42); (2) su
  **agregación/consolidación**, que sí es responsabilidad legítima de
  `Manager` (R4); y (3) su **representación/presentación** como "Executive
  Summary" (R42), que debería derivarse de (1) y nunca redefinirse por
  separado en `Manager`, `QaAutomation1` o `automation-review`. El
  conflicto sigue **abierto** porque (1) no existe todavía — no se crea en
  esta fase.

### C2 — Validación duplicada del esquema del Modelo Canónico

- **Por qué existe:** `Manager` (FASE 4) no confía en que `testcase-model`
  ya validó su propia salida, y repite el chequeo de campos mínimos
  (`projectKey`, `name`, `objective`, `steps`, `traceability`).
- **Conflicto concreto:** el mismo esquema tiene dos validadores
  independientes; si el esquema cambia, hay que actualizar ambos.
- **Dónde debería quedar la autoridad:** `testcase-model` es el único dueño
  del esquema y de su propia validación (ya la tiene: sección
  "VALIDACIONES" de su `SKILL.md`).
- **Qué se devuelve como dato:** `testcase-model` debería exponer un
  veredicto explícito (`válido` / `inválido` + motivo) que `Manager`
  simplemente consume, en lugar de re-inspeccionar los campos del modelo.

### C3 — Fuga de conocimiento de integración de Zephyr hacia `productAgent` (el más severo, spec 1.6)

- **Por qué existe:** la única implementación real de Zephyr
  (`create-jira-task.js`) se fue documentando dentro del agente de dominio
  a medida que se construía, en vez de en un contrato de integración
  separado.
- **Conflicto concreto:** `productAgent` (que debería razonar en términos
  de "Historia", "Bug", "Test Case") conoce el tipo de link nativo
  (`COVERAGE`), el nombre real de un estado (`"Not Executed"`), endpoints
  concretos (`GET /testexecutions`, `PUT /testexecutions/{id}`) y el
  algoritmo de resolución de carpetas.
- **Dónde debería quedar la autoridad:** el Adapter/contrato de Zephyr es
  el único dueño de esos detalles; `productAgent` solo debería conocer
  capacidades ("publicar test case", "reportar resultado", "agrupar en
  ciclo").
- **Qué se devuelve como dato:** el Adapter devuelve al Agent únicamente
  resultados de dominio (Test Case Key, Test Cycle Key, confirmación de
  vínculo) — nunca se le pide al Agent que arme un payload con nombres de
  campos internos de la API.
- **Coherencia con la corrección de R21–R26 (sección 1):** este conflicto
  queda reforzado, no contradicho, por esa corrección — al reformular
  R21–R26 como "determinar que algo debe ocurrir" (decisión de negocio) en
  vez de "ejecutar contra la API", la separación decisión/ejecución que
  este conflicto exige queda explícita también en el inventario.

### C4 — El Orchestrator nombra herramientas concretas (spec 1.7)

- **Por qué existe:** `Manager.md`, en "PRINCIPIO DE UNA SOLA
  RESPONSABILIDAD", documenta qué script es la fuente oficial de cada
  responsabilidad (`create-jira-task.js`, `create-pull-request.js`, skill
  `cypress-execution`) mezclando eso con la regla de orquestación.
- **Conflicto concreto:** cambiar de herramienta obliga a editar el
  Orchestrator, no solo el Adapter — contradice directamente el objetivo
  de sustituibilidad (spec sección 2, punto 3).
- **Dónde debería quedar la autoridad:** la relación "capacidad →
  implementación concreta" es responsabilidad de una capa de
  configuración/registro de Adapters, no del texto del Orchestrator.
- **Qué se devuelve como dato:** el Orchestrator invoca una capacidad por
  nombre ("crear Pull Request"); qué implementación concreta la resuelve
  es un dato de configuración, no una decisión escrita en el prompt del
  Manager.

### C5 — La regla de paralelización de Zephyr está declarada tres veces (spec 1.8)

- **Por qué existe:** la misma regla técnica (resolver `folderId`/Test
  Cycle de forma secuencial antes de paralelizar la creación de Test
  Cases) se documentó en `CLAUDE.md`, en un comentario extenso de
  `create-jira-task.js`, e implícitamente en `productAgent.md`.
- **Conflicto concreto:** tres textos con el mismo contenido técnico y
  distinto nivel de detalle; cualquier cambio en esa lógica requiere
  mantenerlos sincronizados a mano.
- **Dónde debería quedar la autoridad:** es un detalle de implementación
  del Adapter de Zephyr — vive una sola vez ahí (o en su contrato).
- **Qué se devuelve como dato:** el Adapter expone una única capacidad
  ("crear N test cases bajo una Historia") que internamente resuelve el
  orden correcto; ningún Agent necesita saber por qué ni repetir la regla.

### C6 — Dos clientes Jira independientes (spec 1.3, 1.10)

- **Por qué existe:** `create-jira-task.js` (con su propio `jiraRequest`) y
  `mcp-jira/index.js` (con su propio `jiraRequest`/`AUTH`/`HOSTNAME`) se
  construyeron en momentos distintos, uno como script y otro como servidor
  MCP, sin compartir código.
- **Conflicto concreto:** dos implementaciones del mismo transporte pueden
  divergir en comportamiento (manejo de errores, timeouts, auth) y
  duplican la superficie a mantener.
- **Dónde debería quedar la autoridad:** un único cliente Jira (Adapter);
  el otro canal, si sobrevive, debe invocar ese mismo Adapter en vez de
  reimplementar el transporte.
- **Qué se devuelve como dato:** **conflicto abierto, no resuelto en esta
  fase** — decidir cuál de los dos canales (script directo vs. MCP) es el
  oficial queda fuera de alcance de esta fase (igual que en spec sección
  15); aquí solo se confirma y documenta el conflicto.

### C7 — El Agent `create-jira-task` no tiene una decisión que defender

- **Por qué existe:** se envolvió la única tool de lectura expuesta por el
  MCP server (`get_jira_issue`) en un Agent dedicado.
- **Conflicto concreto:** una operación mecánica (leer un issue) tiene un
  "dueño" formal (un Agent), cuando ninguna decisión de dominio ocurre ahí
  — el propio `create-jira-task.md` dice que ante cualquier limitación debe
  derivar a `productAgent`.
- **Dónde debería quedar la autoridad:** la lectura de un issue es una
  capacidad que cualquier Agent autorizado (`productAgent`, `Manager`)
  debería poder invocar directamente contra el Adapter de Jira.
- **Qué se devuelve como dato:** el resultado de `get_jira_issue` es
  simplemente el dato del issue — no hay decisión que devolver. Este
  conflicto es, en la práctica, la evidencia del resultado de la sección 4
  para este Agent.
- **Coherencia con la corrección de R20 (sección 1):** la reclasificación
  de R20 como capacidad de integración/Jira (no responsabilidad de
  dominio) confirma este conflicto en el mismo sentido — es la misma
  operación de lectura vista desde el inventario de responsabilidades.

### C8 — La decisión de "detener el flujo" está repartida en casi todas las Skills

- **Por qué existe:** cada Skill fue escrita end-to-end incluyendo qué
  hacer ante un problema ("detener el flujo", "informar la
  inconsistencia"), en lugar de limitarse a detectar y reportar un estado.
  Aparece en `branch-management`, `cypress-execution`,
  `execution-validation`, `framework-analysis`, `implementation-plan`,
  `ticket-analysis`, `testcase-model` y `bug-reporting`.
- **Conflicto concreto:** las Skills están tomando una decisión de dominio
  ("¿esto amerita frenar el flujo completo?"), que el propio spec (3.2) ya
  señala como una tensión: eso corresponde a un Agent, no a una Skill.
- **Dónde debería quedar la autoridad:** el Agent que invoca la Skill
  (`Manager`, `productAgent` o `QaAutomation1` según el caso) es quien
  decide si un resultado adverso detiene el flujo completo o solo esa
  sub-tarea.
- **Qué se devuelve como dato:** cada Skill devuelve un veredicto
  estructurado (`estado: ok | bloqueado`, `motivo`) al Agent invocador, en
  vez de resolver internamente si el flujo completo se detiene.
- **Coherencia con la corrección de R43 (sección 1):** el veredicto
  estructurado que este conflicto propone para "frenar el flujo" es un caso
  particular del mecanismo contractual general que R43 define para toda
  comunicación entre componentes — no son dos ideas distintas.

### C9 — Conocimiento de Cypress dentro de Skills que deberían ser agnósticas de framework

- **Por qué existe:** el único Test Runner usado hasta hoy es Cypress, así
  que el conocimiento específico (`cy.intercept`, `.has-error`,
  `aria-invalid`) se coló directamente en `implementation-plan` (sección
  "VALIDACIÓN DE CASOS NEGATIVOS Y DE BORDE") y en `QaAutomation1.md`.
- **Conflicto concreto:** soportar otro Test Runner (Playwright) obligaría
  a reescribir la Skill de planificación, no solo a agregar un Adapter —
  contradice el objetivo de sustituibilidad (spec sección 2, punto 3).
- **Dónde debería quedar la autoridad:** la guía de "cómo validar un caso
  negativo" (estado del DOM / mensaje de error / respuesta 4xx) es
  agnóstica de herramienta; su traducción a `cy.intercept` o el equivalente
  de otro runner es responsabilidad del Adapter del Test Runner.
- **Qué se devuelve como dato:** `implementation-plan` debería pedir al
  contrato del Test Runner "qué mecanismos de verificación de error están
  disponibles", en vez de hardcodear los de Cypress en el plan.

---

## 4. Test de existencia de Agent

Aplicado el criterio de `architecture-v2-spec.md` sección 3.1 a los 7
Agents actuales: *"si dos Agents tuvieran que ponerse de acuerdo sobre una
decisión de este dominio, ¿a cuál le correspondería la última palabra? Si
la respuesta es 'a ninguno, porque es solo una operación mecánica', no es
un Agent."*

### Manager

- **Qué decisión posee:** cuál es el flujo aplicable y en qué orden se
  ejecutan las fases; cuándo un insumo está incompleto para avanzar.
- **Qué autoridad tiene:** puede detener el flujo completo y exigir una
  decisión funcional al usuario; ningún otro componente tiene esa
  potestad.
- **Por qué no puede ser Skill:** una Skill no controla a qué otro
  componente delegar ni cuándo termina un flujo completo entre varios
  Agents — eso es coordinación entre componentes, no un procedimiento de
  entrada/salida fija.
- **Por qué no es solo "el Orchestrator" puro:** en la V1, Manager mezcla
  el rol de Orchestrator (spec 3.3) con validaciones de contenido de
  dominio que no le corresponden (C2) y con conocimiento de herramientas
  concretas (C4) — pero la función de coordinar el flujo en sí necesita un
  dueño con autoridad para decidir el orden.
- **Qué pasaría si no existiera:** nadie decidiría el orden de fases ni
  cuándo pedir intervención del usuario; los demás Agents tendrían que
  coordinarse entre sí de forma ad-hoc (acoplamiento N a N).
- **Veredicto:** Agent legítimo (rol de Orchestrator), condicionado a
  resolver C2 y C4 en el diseño.

### productAgent

- **Qué decisión posee:** qué tipo de issue corresponde a una solicitud;
  cómo sintetizar una especificación funcional en una Historia orientada a
  negocio; cuándo una Historia está lista para publicarse; cuándo
  transicionar el estado de un ticket.
- **Qué autoridad tiene:** es quien decide "esto es una Historia, no un
  Bug" y quien determina si la cobertura funcional recibida es suficiente
  antes de crear el ticket (regla "COBERTURA DE CRITERIOS").
- **Por qué no puede ser Skill:** la clasificación de tipo de issue y la
  síntesis funcional ("PRINCIPIO DE TRANSFORMACIÓN": nunca copiar
  literalmente la salida de Scenario Builder) son juicios de negocio, no
  un procedimiento mecánico repetible con la misma entrada→salida.
- **Por qué no puede ser responsabilidad del Orchestrator:** no coordina
  otros Agents; produce y mantiene artefactos de un dominio propio
  (gestión de tickets) que requiere criterio especializado (formato BDD,
  mínimos de cobertura, tipos de issue).
- **Qué pasaría si no existiera:** se perdería la única fuente de verdad
  de "qué es una Historia bien formada" en este proyecto — nadie decidiría
  cómo transformar un escenario en un ticket de negocio ni gestionaría el
  ciclo de estados.
- **Veredicto:** Agent legítimo, condicionado a resolver C3 (perder el
  conocimiento de integración de Zephyr) en el diseño.

### QaAutomation1

- **Qué decisión posee:** cómo implementar técnicamente una automatización
  dado un escenario aprobado; cuándo un resultado de ejecución es
  aceptable para avanzar a commit/PR; si un comportamiento inesperado es
  un bug real o un falso positivo.
- **Qué autoridad tiene:** decide si el código está "listo para PR" y
  puede detener el flujo si detecta cobertura insuficiente frente a los
  criterios de aceptación recibidos.
- **Por qué no puede ser Skill:** coordina múltiples Skills
  (`ticket-analysis`, `framework-analysis`, `implementation-plan`,
  `cypress-execution`, `execution-validation`, `automation-review`,
  `git-workflow`, `bug-reporting`) en una secuencia con puntos de decisión
  reales — no es un procedimiento único de entrada/salida fija.
- **Por qué no puede ser responsabilidad del Orchestrator:** no decide el
  flujo de negocio general (HU → ticket → cierre); solo decide el "cómo"
  técnico de una automatización ya aprobada por `Manager`/`productAgent`.
- **Qué pasaría si no existiera:** nadie tomaría la decisión técnica de
  "cómo implementar esto en este framework" ni el juicio de "el test está
  listo para integrarse" — quedaría repartido entre Skills sin autoridad
  real para decidir (ver C8).
- **Veredicto:** Agent legítimo, condicionado a resolver C9 (framework
  agnosticismo) en el diseño.

### create-jira-task (Agent de solo lectura)

- **Qué decisión posee:** ninguna — ejecuta `get_jira_issue` y devuelve el
  resultado sin interpretarlo.
- **Qué autoridad tiene:** ninguna; el propio prompt deriva cualquier
  limitación o ambigüedad a `productAgent`.
- **Por qué no puede ser Skill:** de hecho sí podría serlo — es un
  procedimiento de lectura reutilizable, o directamente una llamada
  disponible desde el Adapter de Jira.
- **Por qué no puede ser responsabilidad del Orchestrator:** no aplica —
  no coordina nada, tampoco decide nada.
- **Qué pasaría si no existiera:** `productAgent` o `Manager` invocarían la
  misma capacidad de lectura del Adapter de Jira directamente; no se
  perdería ninguna decisión.
- **Veredicto: CANDIDATO A NO SER AGENT** (confirma spec 1.1/3.1 — ver
  también C7 y la corrección de R20 en sección 1). No se elimina en esta
  fase.

### desarrollador

- **Qué decisión posee:** en teoría, todo el ciclo "leer ticket →
  implementar → informar", pero sin ninguna decisión que no cubran ya
  `Manager` + `productAgent` + `QaAutomation1` combinados.
- **Qué autoridad tiene:** pretende actuar como "desarrollador Senior"
  end-to-end sin participar del pipeline oficial ni coordinarse con él.
- **Por qué no puede ser Skill:** no aplica — no es un procedimiento
  acotado, es una reencarnación completa del pipeline existente.
- **Por qué no puede ser responsabilidad del Orchestrator:** no coordina
  con los Agents del pipeline oficial; es un camino paralelo no
  integrado.
- **Qué pasaría si no existiera:** el pipeline `Manager` → `productAgent` /
  `QaAutomation1` ya cubre exactamente el mismo caso de uso ("desarrollar
  una tarea de Jira").
- **Veredicto: CANDIDATO A NO SER AGENT** (duplica el pipeline oficial
  completo).

### ejecutor

- **Qué decisión posee:** ninguna nueva — "ejecutar y diagnosticar" es
  exactamente lo que ya hacen `cypress-execution` + `execution-validation`.
- **Qué autoridad tiene:** ninguna distinta de las Skills que ya cubren
  ese procedimiento dentro del flujo oficial.
- **Por qué no puede ser Skill:** en rigor, es una Skill disfrazada de
  Agent — un procedimiento (ejecutar, analizar, informar) sin autoridad de
  dominio propia.
- **Por qué no puede ser responsabilidad del Orchestrator:** no coordina
  nada; ejecuta un único paso aislado, fuera del pipeline.
- **Qué pasaría si no existiera:** `cypress-execution` + `execution-validation`,
  invocadas por `QaAutomation1`, cubren el mismo resultado dentro del
  flujo oficial.
- **Veredicto: CANDIDATO A NO SER AGENT.**

### probando

- **Qué decisión posee:** ninguna — su propio prompt ("este tiene que
  hacer un prompt") no define responsabilidad alguna.
- **Qué autoridad tiene:** ninguna.
- **Por qué no puede ser Skill/Orchestrator:** no hay contenido funcional
  que evaluar contra ningún criterio.
- **Qué pasaría si no existiera:** nada — no tiene consumidores ni
  participa de ningún flujo.
- **Veredicto: CANDIDATO A NO SER AGENT** (artefacto experimental, no una
  responsabilidad de producto).

**Resumen del test:** de los 7 Agents actuales, 3 pasan el test
(`Manager`, `productAgent`, `QaAutomation1`) — cada uno con al menos un
conflicto de la sección 3 que debe resolverse en el diseño, no eliminarse
como Agent. Los 4 restantes (`create-jira-task`, `desarrollador`,
`ejecutor`, `probando`) son candidatos a no ser Agent. **Ningún Agent se
elimina en esta fase** — la decisión de fusionar/retirar queda para la
fase de migración (spec sección 12).

---

## 5. Capas de la arquitectura V2

Mapeo de las responsabilidades del inventario (sección 1) a las capas
objetivo definidas en `architecture-v2-spec.md` (secciones 3.1–3.5). Esto
**no asigna nombres de archivo ni de componente definitivo** — solo indica
en qué capa debería resolverse cada responsabilidad.

```text
Orchestrator
   ↓
Domain Agent
   ↓
Canonical Model
   ↓
Capability Contract
   ↓
Adapter
   ↓
Tool
```

| Capa | Responsabilidades que le corresponden | Responsabilidades que hoy están mal ubicadas ahí |
|---|---|---|
| **Orchestrator** | R1–R5 (determinar flujo, coordinar orden, reutilizar contexto, consolidar cierre, decisiones funcionales) | Hoy también contiene: nombres de scripts concretos (C4), validación de esquema ajeno (C2) — ambos deben bajar de capa |
| **Domain Agent** ("Gestión de tickets") | R13–R19 (tipo de issue, síntesis de Historia, Bug, Tarea, Sprint, transición de estado, vínculos) — la *decisión*, no el detalle de API | Hoy también contiene: nombres de link type y estado de Zephyr, endpoints, algoritmo de carpetas (C3) — debe bajar a Capability Contract/Adapter |
| **Domain Agent** ("Automatización") | R27–R35 en cuanto *decisión* (alcance, "listo para commit", bug real vs. falso positivo, estrategia de rama/commit/PR como decisión de "cuándo") | Hoy también contiene: sintaxis concreta de Cypress dentro de la guía de planificación (C9) — debe bajar a Adapter del Test Runner |
| **Canonical Model** | R12 (Test Case), y — a extender siguiendo el mismo patrón — un modelo canónico de "Historia", de "resultado de ejecución" y de "resultado de flujo" (para resolver C1) | Ninguna detectada; `testcase-model` ya es el ejemplo a replicar (spec 3.5) |
| **Capability Contract** | "publicar test case", "vincular cobertura", "agrupar en ciclo de ejecución", "reportar resultado", "crear/mergear Pull Request", "ejecutar suite de pruebas" — como capacidades de negocio, nunca como verbos HTTP | Hoy no existe esta capa de forma explícita: las capacidades están implícitas dentro de `productAgent.md` y `Manager.md` en vez de declaradas aparte |
| **Adapter** | R44–R47 (transporte Jira/Zephyr/GitHub/Test Runner) + R21, R22, R24, R26 (detalles de *cómo* Zephyr resuelve carpetas, vínculos, ciclos y nombres de estado) | `scripts/lib/zephyr.js` ya cumple este rol para Zephyr; Jira tiene **dos** implementaciones de esta capa sin relación entre sí (C6) |
| **Tool** | Jira REST API, Zephyr REST API, GitHub REST API, proceso `npx cypress run` | — |

**Responsabilidades transversales que no pertenecen a ninguna capa
específica** (R48, R49, R50 — no duplicar herramientas, no dejar archivos
temporales, frenar ante inconsistencia): son *reglas de comportamiento*
aplicables a cualquier capa, no una responsabilidad de una capa
particular. Hoy están repetidas textualmente en múltiples Agents/Skills
(C8 es el caso más agudo, para R50). El diseño debe declararlas una sola
vez como principio general — ya existe un borrador de esto en `CLAUDE.md`
— y que cada capa las herede por referencia, no por copia.

---

## 6. Explícitamente fuera de alcance de esta fase

- La lista definitiva de Agents y Skills de la V2 (eso requiere, además de
  este mapa, decidir cómo particionar `create-jira-task.js` — spec 1.3/11
  — y cuál canal de Jira es el oficial — C6).
- La decisión de eliminar, fusionar o conservar `desarrollador`,
  `ejecutor`, `probando` o el Agent `create-jira-task` — quedan
  confirmados como candidatos (sección 4), no resueltos.
- Cualquier modificación de código, prompts de Agents/Skills o scripts.
- La definición formal del contrato de cada Capability Contract (nombres
  de método, forma exacta del payload) — eso corresponde a la fase de
  diseño de componentes, una vez cerrado este mapa de responsabilidades.
- El modelo/regla/contrato de trazabilidad transversal (CA → TC → Test
  Case → Automated Test → Execution → resultado/artefactos) que generaliza
  R35 — queda identificado como pendiente, no se define en esta fase.
- El Modelo Canónico de "resultado de flujo" que resolvería C1/R42 — queda
  identificado como pendiente, no se define en esta fase.
