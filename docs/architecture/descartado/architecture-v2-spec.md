# Architecture V2 — Especificación (Fuente de Verdad)

## 0. Estado y propósito de este documento

Este documento es la **fuente de verdad** para diseñar la Arquitectura V2 del
proyecto. No implementa la V2. No define todavía la lista definitiva de
Agents y Skills — eso se deriva en una fase posterior, a partir de este
documento más un análisis adicional del repositorio real en el momento de
diseñar cada componente.

Este documento **no modifica** ningún Agent, Skill, script ni regla de la V1.
La V1 sigue siendo la arquitectura funcional vigente hasta que se decida y
apruebe explícitamente una migración.

Todo lo que seguía a partir de acá se basa en la inspección real de:

- `.claude/agents/*.md` (7 archivos)
- `.claude/skills/*/SKILL.md` (13 archivos)
- `scripts/*.js` y `scripts/lib/zephyr.js`
- `mcp-jira/index.js` y `.claude/settings.json`
- `docs/architecture/implementation-contract.md`
- `CLAUDE.md`
- `cypress.config.js`, `package.json`, `README.md`
- historial de git de los scripts (para distinguir implementación vigente de implementación obsoleta)

---

## 1. Hallazgos del análisis de la V1 (evidencia)

Esta sección documenta **lo que existe hoy**, no lo que debería existir.
Es la base empírica sobre la que se apoyan los principios de las secciones
siguientes.

### 1.1 Agents (`.claude/agents/`)

| Agent | Rol declarado | Observación |
|---|---|---|
| `Manager` | Orquestador del flujo end-to-end | 640 líneas. Mezcla reglas de orquestación legítimas (orden de fases, delegación) con reglas de **validación de contenido de dominio** (ej. valida que el Modelo Canónico tenga `projectKey`, `name`, `objective`, `steps`, `traceability` — ese schema ya está declarado en `testcase-model`). También define su propio formato de "Informe Final", casi idéntico pero no igual al `Executive Summary` que define `QaAutomation1` y al que define el skill `executive-summary` (ver 1.5). |
| `QaAutomation1` | Automatización, Git, PR | Nombra explícitamente scripts y skills concretos (`scripts/create-pull-request.js`, `cypress-execution`), y contiene conocimiento específico de Cypress (`cy.intercept`, `.has-error`, `aria-invalid`) dentro de reglas que en teoría deberían ser agnósticas de framework. |
| `productAgent` | Ciclo de vida de Jira/Zephyr | ~1000 líneas. Es el hallazgo más importante del análisis (ver 1.6): contiene conocimiento detallado de la **API de Zephyr** (endpoints, nombres de status internos, algoritmo de resolución de carpetas, tipo de link `COVERAGE`) que, según el propio `implementation-contract.md` del proyecto, debería vivir exclusivamente en la implementación, no en el agente. |
| `create-jira-task` | "Interfaz de solo lectura a Jira" | Nombre idéntico al script `scripts/create-jira-task.js`, pero es una entidad distinta: es un Agent que solo puede llamar `get_jira_issue` vía el MCP server `mcp-jira`. Esta colisión de nombres entre Agent y Script es confusa y no está justificada — su única responsabilidad (leer un issue) no representa un dominio de decisión, es una operación de lectura que cualquier agente autorizado podría invocar directamente contra el adapter de Jira. |
| `desarrollador` | "Actuar como desarrollador Senior" para tickets Jira | No participa del pipeline Manager → skills → ProductAgent/QaAutomation1. Duplica, en un agente aparte y con reglas propias, responsabilidades que ya cubren Manager + QaAutomation1 + ProductAgent (leer ticket, implementar, informar cambios). |
| `ejecutor` | "QA Automation Engineer" para ejecutar un test y diagnosticar fallas | Duplica funcionalmente `cypress-execution` + `execution-validation`, pero como agente aislado sin conexión al flujo oficial. |
| `probando` | `description: "cuando lo llame para hacer el prompt"` | Sin responsabilidad definida. Contenido del prompt: `"este tiene que hacer un prompt"`. Es un artefacto de prueba/experimentación, no una responsabilidad de producto. |

**Conclusión de 1.1:** de los 7 Agents actuales, solo 3 (`Manager`,
`QaAutomation1`, `productAgent`) forman un pipeline coherente y en uso activo.
Los otros 4 (`create-jira-task`, `desarrollador`, `ejecutor`, `probando`) son
candidatos a resultar **obsoletos o redundantes** bajo la definición de
Agent de la sección 4.1 — pero esta clasificación se **confirma, no se
decide, en este documento**; la decisión de eliminarlos pertenece a la fase
de diseño/migración (sección 13), no a este spec.

### 1.2 Skills (`.claude/skills/`)

13 skills, todas con estructura similar (RESPONSABILIDAD / ENTRADA ESPERADA /
RESTRICCIONES / SALIDA OBLIGATORIA). Se agrupan en tres franjas según quién
las invoca:

- **Invocadas directamente por Manager** (fase de descubrimiento y
  documentación funcional): `application-discovery`, `scenario-builder`,
  `testcase-model`.
- **Invocadas exclusivamente por `QaAutomation1`** (pipeline de
  automatización): `ticket-analysis`, `framework-analysis`,
  `implementation-plan`, `branch-management`, `cypress-execution`,
  `execution-validation`, `automation-review`, `git-workflow`,
  `bug-reporting`.
- **Ambigua / compartida**: `executive-summary`. Su propio `SKILL.md` dice
  que se usa "antes de informar el resultado al Manager" (sugiere que la
  invoca cualquier agente), pero `QaAutomation1.md` la reclama como su
  "salida oficial" con un formato de campos distinto al que define el
  propio skill, y `Manager.md` define un tercer formato ("Informe Final")
  para el mismo propósito. **Ningún componente es la fuente de verdad única
  del formato del resumen ejecutivo** (ver 1.5).

`testcase-model` es, de las 13, la que mejor cumple ya el principio de
independencia de herramienta: declara explícitamente que no conoce
endpoints ni campos de Zephyr, y que su salida (JSON canónico) debe poder
representarse en Zephyr, Xray, TestRail o Azure Test Plans sin modificar el
skill. **Es el mejor ejemplo existente en el repo de lo que la V2 busca
generalizar** (ver sección 12).

### 1.3 Scripts / Integraciones

| Archivo | Líneas | Rol real | Problema detectado |
|---|---|---|---|
| `scripts/create-jira-task.js` | 747 | "Implementación oficial" de Jira **y** Zephyr | Mezcla **cuatro** responsabilidades en un solo archivo: (a) cliente HTTP/auth de Jira (`jiraRequest`, `AUTH`, `HOSTNAME`), (b) plantillas de dominio en ADF para Historia/Bug/Tarea (`buildHistoriaDescription`, `buildBugDescription`, `buildTareaDescription` — esto es conocimiento de negocio, no de integración), (c) orquestación de Zephyr (resolución de carpetas, Test Cycles, batch paralelo), (d) parsing de CLI y modos de verificación/reporte. |
| `scripts/lib/zephyr.js` | 466 | Cliente REST de Zephyr | Buen ejemplo de adapter enfocado: solo llamadas HTTP a Zephyr (`createTestCase`, `createTestSteps`, `linkTestCaseToIssue`, `createTestCycle`, `createTestExecution`, resolución de folders). No conoce Jira ni reglas de negocio. **Modelo a replicar** para un futuro `scripts/lib/jira.js`. |
| `scripts/create-pull-request.js` | 337 | Adapter de GitHub (crear/mergear PR) | Adapter razonablemente enfocado, parametrizado por flags, sin conocimiento de tickets específicos. |
| `scripts/create-tc16-ticket.js`, `create-tc21-ticket.js`, `create-test-case-4.js` | 121–148 c/u | Scripts de creación de un ticket puntual | **Confirmado obsoletos por git log** (commits del 2026-06-01 al 2026-06-16, anteriores a que `create-jira-task.js` se consolidara como implementación única). Son exactamente el antipatrón que el propio `productAgent.md` y `implementation-contract.md` prohíben citando nombres casi idénticos (`create-tcX-ticket.js`, `jira-temp.js`). Siguen presentes en el repo aunque las reglas actuales los declaran no-oficiales. |
| `mcp-jira/index.js` | 165 | Servidor MCP con `create_jira_issue`, `update_jira_issue`, `get_jira_issue` | **Segunda implementación paralela e independiente del cliente Jira**: repite su propio `jiraRequest`, `AUTH` y `HOSTNAME` (código duplicado respecto a `create-jira-task.js`, sin compartir nada). Expone capacidades de escritura (`create_jira_issue`, `update_jira_issue`) que las reglas actuales prohíben usar (solo `ProductAgent` vía el script puede escribir), por lo que esas dos tools están efectivamente muertas en el flujo oficial. Solo `get_jira_issue` se usa, a través del Agent `create-jira-task`. |

**Conclusión de 1.3:** el proyecto ya tiene, en la práctica, **dos clientes
Jira distintos y sin relación entre sí** (uno vía HTTPS directo dentro del
script, otro vía protocolo MCP), y un único archivo (`create-jira-task.js`)
que concentra transporte + dominio + orquestación + CLI. Zephyr, en cambio,
ya está mejor separado (`scripts/lib/zephyr.js` como cliente puro). Esta
asimetría es la evidencia concreta de que **la separación
integración/dominio que pide el punto 6 del pedido del usuario no está
resuelta hoy ni siquiera para una sola herramienta (Jira) de forma
consistente**, aunque para otra (Zephyr) sí hay una aproximación aceptable.

### 1.4 Documentación

`docs/architecture/implementation-contract.md` ya declara el principio que
se busca generalizar: *"Los agentes conocen el negocio. La implementación
conoce las APIs. Nunca invertir esa responsabilidad."* Sin embargo:

- Es un contrato específico de Jira/Zephyr, no un documento de arquitectura
  general — no cubre Cypress/Git/GitHub ni define Agent/Skill/Orchestrator.
- **No se cumple en la implementación actual**: `productAgent.md` (el
  agente) contiene el conocimiento de endpoints y semántica de Zephyr que
  este contrato dice que debería vivir solo en el script (ver 1.6).

### 1.5 Duplicación de reglas — "Executive Summary" / "Informe Final"

Se detectaron **tres definiciones distintas del mismo artefacto**:

1. `Manager.md` → sección "INFORME FINAL": campos `TICKET / HU / RAMA /
   AUTOMATIZACIÓN / RESULTADO TESTS / COMMIT / PUSH / PULL REQUEST / ESTADO
   JIRA / RIESGOS / PRÓXIMOS PASOS`.
2. `QaAutomation1.md` → sección "FORMATO OFICIAL DEL EXECUTIVE SUMMARY":
   campos similares pero no idénticos, agrega `COBERTURA FUNCIONAL` y
   `AUTOMATION REVIEW`.
3. Skill `executive-summary/SKILL.md` → formato `RESUMEN EJECUTIVO` con
   campos `OBJETIVO / COMPONENTES_REUTILIZABLES / COMPONENTES_NUEVOS /
   RIESGOS_CRÍTICOS / RECOMENDACIONES / ESTADO / SIGUIENTE_PASO` — un tercer
   set de campos, orientado a "análisis técnico" en general, no a cierre de
   ticket.

No hay una única fuente de verdad de qué es un "Executive Summary" ni de su
schema. Cada componente que lo produce o consume asume una forma distinta.

### 1.6 Hallazgo principal — fuga de conocimiento de integración hacia el dominio

`productAgent.md` es, con diferencia, el artefacto que más viola el
principio que el propio proyecto ya se propuso en
`implementation-contract.md`. Contiene, en el prompt del agente de dominio:

- El nombre real de tipos de link de Jira disponibles en la instancia
  (`Blocks`, `Cloners`, `Duplicate`, `Relates`) y la constatación de que
  `Tests`/`is tested by` no existe, verificado contra
  `GET /rest/api/3/issueLinkType`.
- El tipo de link nativo de Zephyr usado (`COVERAGE`) y el nombre exacto del
  método que lo ejecuta (`zephyr.linkTestCaseToIssue`).
- El nombre real de un estado de Zephyr verificado contra
  `GET /statuses?projectKey=SCRUM&statusType=TEST_EXECUTION` (`"Not
  Executed"`, no `"UNEXECUTED"`).
- Verbos y endpoints HTTP concretos (`GET /testexecutions`,
  `PUT /testexecutions/{id}`).
- El algoritmo interno de resolución de carpetas de Zephyr (partir la ruta
  por segmentos, resolver `parentId` en cadena).

Esto es exactamentente el conocimiento que `implementation-contract.md`
dice que "los agentes nunca deberán conocer". El resultado práctico es que
si mañana Zephyr se reemplaza por Xray, **no alcanza con reemplazar el
script** — hay que reescribir buena parte de `productAgent.md`, que es
justamente el escenario que la V2 debe evitar (ver sección 7).

### 1.7 Acoplamiento del orquestador a herramientas concretas

`Manager.md`, en su sección "PRINCIPIO DE UNA SOLA RESPONSABILIDAD", nombra
explícitamente los scripts: *"creación de tickets Jira →
create-jira-task.js"*, *"creación de Pull Requests →
create-pull-request.js"*, *"ejecución de Cypress → skill
cypress-execution"*. El orquestador conoce nombres de archivo concretos de
la capa de integración. Cambiar de herramienta obliga a tocar el
orquestador, no solo el adapter — contradice directamente el punto 6 del
pedido del usuario (poder cambiar Jira→Azure DevOps, Zephyr→Xray,
Cypress→Playwright, GitHub→GitLab sin rediseñar toda la arquitectura).

### 1.8 Regla de paralelización de Zephyr, declarada tres veces

La regla "resolver folderId/Test Cycle de forma secuencial antes de
disparar la creación de Test Cases en paralelo" aparece: (a) en
`CLAUDE.md` sección "Reglas de ejecución rápida" punto 2, (b) como
comentario extenso dentro de `scripts/create-jira-task.js`
(`createTestCasesBatch`), y (c) implícita en `productAgent.md` ("Orden
obligatorio de verificación" / flujo de `testCycle`). Es la misma regla
técnica descripta en tres lugares con nivel de detalle distinto — cualquier
cambio en esa lógica requiere mantener sincronizados tres textos.

---

## 2. Contexto arquitectónico objetivo

La V2 debe optimizar, en este orden de prioridad cuando entren en tensión:

1. **Separación dominio / implementación** por sobre conveniencia de
   escritura rápida de reglas.
2. **Single Source of Truth** por sobre reglas redundantes "por las dudas".
3. **Sustituibilidad de herramientas** por sobre atajos que hardcodeen un
   proveedor concreto.
4. **Mínima cantidad de componentes** (Agents/Skills) que puedan justificar
   su propia existencia, por sobre modelar cada acción técnica como un
   componente separado.

Esto debe permitir, sin rediseñar la arquitectura completa:

- Jira → Azure DevOps
- Zephyr → Xray
- GitHub → GitLab
- Cypress → Playwright

---

## 3. Definiciones

### 3.1 Agent

Un **Agent** representa una **responsabilidad o dominio de decisión** —
alguien que puede decir "esto se hace así" dentro de su dominio, con
autoridad para tomar decisiones que otros componentes no pueden tomar por
él.

Un Agent **no** existe solo porque exista una acción técnica ejecutable
(ej. "ejecutar un comando" no es, por sí sola, motivo para crear un Agent —
ver el caso de `create-jira-task` en 1.1 y `ejecutor` en 1.1: ejecutar o
leer algo no es un dominio de decisión).

Prueba de existencia de un Agent: *si dos Agents distintos tuvieran que
ponerse de acuerdo sobre una decisión de este dominio, ¿a cuál de los dos
le correspondería la última palabra?* Si la respuesta es "a ninguno, porque
es solo una operación mecánica", no es un Agent.

### 3.2 Skill

Una **Skill** representa una **capacidad o procedimiento reutilizable**:
una forma repetible de producir un resultado a partir de una entrada, sin
autoridad de decisión propia sobre el dominio de negocio.

Una Skill **no debe convertirse en un Agent disfrazado**: si una Skill
empieza a acumular reglas de "cuándo permitir que el flujo continúe",
"cuándo detener el proceso e informar al usuario" y "qué constituye una
falla aceptable", está tomando decisiones de dominio, no solo ejecutando un
procedimiento. (Nota: varias skills actuales —`branch-management`,
`execution-validation`— ya tienen esta tensión al decidir cuándo "detener
el flujo"; queda para la fase de diseño evaluar si esa decisión debería
devolverse como dato al Agent que las invoca en lugar de resolverse dentro
de la skill.)

### 3.3 Orchestrator

Coordina el flujo entre Agents y Skills: qué se ejecuta, en qué orden, con
qué información se continúa.

Un Orchestrator **no** ejecuta responsabilidades de negocio ni conoce
herramientas concretas de integración (ver 1.7: `Manager.md` nombrando
`create-jira-task.js` es exactamente lo que la V2 debe evitar). El
Orchestrator conoce **capacidades** ("crear una Historia", "ejecutar la
suite de automatización"), nunca **implementaciones** ("ejecutar
`scripts/create-jira-task.js`", "correr `npx cypress run`").

### 3.4 Integration / Adapter

Encapsula los detalles específicos de una herramienta externa: endpoints,
payloads, autenticación, nombres de campos internos de esa herramienta,
algoritmos de resolución específicos de esa API (ej. resolución de
carpetas de Zephyr).

Un componente de dominio (Agent o Skill) **nunca** debería necesitar
conocer esos detalles para poder invocar la capacidad — los invoca a través
de un contrato estable (ver sección 9), y el Adapter es responsable de
traducir ese contrato a la API específica de la herramienta del momento.

`scripts/lib/zephyr.js` es hoy el ejemplo más cercano a este ideal en el
repo (ver 1.3): nadie fuera de `create-jira-task.js` necesita saber que
Zephyr requiere resolver un `folderId` antes de crear un Test Case.

### 3.5 Modelo Canónico

Una estructura de datos que representa un concepto de dominio (ej. "Test
Case", "Historia", "resultado de ejecución") de forma **independiente de
cualquier herramienta concreta**, para que Agents y Skills trabajen sobre
ese modelo y solo el Adapter correspondiente lo traduzca al formato de la
herramienta real.

El Modelo Canónico de Test Case ya existe y funciona así (`testcase-model`,
ver 1.2) — es la pieza de la V1 más alineada con este concepto y debe
preservarse como ancla de diseño para la V2, extendiendo el mismo patrón a
otros conceptos (Historia, resultado de ejecución, Pull Request) que hoy no
tienen un modelo canónico explícito y equivalente.

---

## 4. Regla fundamental

Todo diseño de componente en la V2 debe seguir este orden, sin saltearlo:

```
1. RESPONSABILIDAD   →  ¿qué decisión o capacidad de negocio es esta, en abstracto?
2. COMPONENTE        →  ¿es un Agent, una Skill, el Orchestrator, o un Adapter?
3. IMPLEMENTACIÓN    →  ¿con qué herramienta concreta se resuelve hoy?
```

Nunca diseñar empezando por el paso 3. La pregunta *"¿cómo lo hacemos en
Jira?"* solo puede responderse después de haber definido la responsabilidad
y el componente sin mencionar Jira.

---

## 5. Responsabilidades actuales (hipótesis a validar)

Estas son las responsabilidades que la V1 implementa hoy, tal como se
observaron en el análisis (sección 1). **No se asume que esta sea la
descomposición final** — la fase de diseño debe re-evaluar cada una contra
las definiciones de la sección 3 y contra los hallazgos de duplicación y
acoplamiento de la sección 1, antes de decidir si sobrevive como Agent,
pasa a ser Skill, se funde con otra, o se elimina.

| Responsabilidad observada | Dónde vive hoy | Tensión detectada |
|---|---|---|
| Orquestación del flujo end-to-end | `Manager` | Conoce nombres de scripts concretos (1.7); valida schemas de dominio que ya son responsabilidad de `testcase-model`. |
| Descubrimiento funcional de una app | skill `application-discovery` | Bien acotada; sin tensión relevante detectada. |
| Construcción de escenarios/CA/TC | skill `scenario-builder` | Bien acotada; concentra correctamente el conocimiento QA funcional. |
| Modelo canónico de Test Case | skill `testcase-model` | Es el mejor ejemplo de independencia de herramienta (3.5). |
| Gestión de Jira (Historias/Bugs/Tareas/estados) | `productAgent` | Contiene conocimiento de integración de Zephyr que no le corresponde (1.6). |
| Publicación de Test Cases en Zephyr | `productAgent` (invocando `create-jira-task.js`) | Mismo hallazgo que arriba: el agente de dominio conoce demasiado de la API concreta. |
| Lectura de un issue Jira | Agent `create-jira-task` (vía MCP) | Cuestionable como Agent independiente (3.1); es una operación de lectura, no un dominio de decisión. |
| Automatización end-to-end (implementación, ejecución, Git, PR) | `QaAutomation1` + 9 skills | Coherente como agrupación, pero mezcla dentro de sí "framework-agnostic" (ticket-analysis, implementation-plan) con conocimiento explícito de Cypress en esas mismas skills. |
| Integración con Jira (transporte) | `scripts/create-jira-task.js` + `mcp-jira/index.js` (duplicados) | Dos clientes Jira independientes, sin relación entre sí (1.3). |
| Integración con Zephyr (transporte) | `scripts/lib/zephyr.js` | Bien acotada, modelo a replicar. |
| Integración con GitHub (PR) | `scripts/create-pull-request.js` | Razonablemente acotada. |
| Ejecución de pruebas | Cypress directo + skill `cypress-execution` | La skill ya es un buen punto de indirección; falta un adapter explícito si se quisiera soportar otro runner. |

---

## 6. Principios de cambio de herramientas

Un cambio de herramienta debe quedar contenido, como máximo, en:

1. El **Adapter** correspondiente (nueva implementación del mismo contrato).
2. La configuración que indica qué Adapter usar para esa responsabilidad
   (no el Orchestrator ni los Agents de dominio decidiendo esto en su
   propio texto).

Un cambio de herramienta **nunca** debería requerir:

- Editar el prompt de un Agent de dominio (`productAgent`, `QaAutomation1`)
  para cambiar terminología o reglas de negocio.
- Editar `Manager` para que deje de nombrar un script concreto.
- Editar una Skill agnóstica de herramienta (`ticket-analysis`,
  `scenario-builder`) por haber cambiado de proveedor técnico.

Prueba de aceptación concreta (a validar en el diseño): *si se reemplaza
Jira por Azure DevOps, ¿cuántos archivos de `.claude/agents/` y
`.claude/skills/` hay que tocar?* Hoy la respuesta, según 1.6 y 1.7, sería
"varios" (`Manager.md`, `productAgent.md` como mínimo). El objetivo de la
V2 es que la respuesta sea "ninguno, solo el Adapter".

---

## 7. Granularidad

- No crear un Agent por cada acción técnica ejecutable (ver 3.1 y el caso
  de `create-jira-task` como Agent de solo-lectura).
- No crear una Skill por cada paso de un procedimiento — una Skill agrupa
  un procedimiento completo con entrada/salida propias, no un paso aislado
  dentro de otro procedimiento.
- No mantener Agents que no participan de ningún flujo activo
  (`desarrollador`, `ejecutor`, `probando` — ver 1.1) simplemente porque ya
  existen.
- Cada componente debe poder responder, sin ambigüedad, *"¿qué pasaría si
  yo no existiera?"* — si la respuesta es "otro componente ya cubre
  exactamente esto" (como ocurre entre `ejecutor` y
  `cypress-execution`+`execution-validation`), el componente no se
  justifica.
- Minimizar coordinación entre Agents: hoy solo tres Agents se coordinan en
  un pipeline real (`Manager` → `productAgent` / `QaAutomation1`); esa
  cantidad de coordinación es aceptable y no debería crecer sin una
  responsabilidad nueva y genuina que la justifique.

---

## 8. Single Source of Truth

Deben identificarse, y declararse en un único lugar cada uno, los
siguientes conceptos (hoy varios de ellos **no** cumplen esto — ver 1.5,
1.6, 1.8):

| Concepto | Estado actual | Objetivo V2 |
|---|---|---|
| Escenarios y Test Cases funcionales | SSOT real hoy: `scenario-builder` → `testcase-model`. | Mantener. |
| Modelo canónico de Test Case | SSOT real hoy: schema JSON en `testcase-model/SKILL.md`. | Mantener y usar como plantilla para modelar otros conceptos (Historia, resultado de ejecución). |
| Trazabilidad (Escenario↔CA↔TC↔Historia↔Test Case Zephyr↔Ejecución) | Repartida entre `scenario-builder`, `productAgent` y comentarios en `create-jira-task.js`. | Debe consolidarse en un único modelo de trazabilidad, independiente de Jira/Zephyr. |
| Reglas funcionales de negocio (HU, CA, formato BDD) | SSOT real hoy: `productAgent.md` + `CLAUDE.md`. | Mantener, pero separar de las reglas de integración que hoy conviven en el mismo archivo (1.6). |
| Formato de "Executive Summary" / cierre de ticket | **Sin SSOT** — 3 definiciones distintas (1.5). | Debe definirse una única vez y ser consumido, no redefinido, por cada Agent/Skill que lo produce o lee. |
| Estados de ejecución (Pass/Fail/Blocked, etc.) | Vive en `productAgent.md` como mapeo hacia nombres específicos de Zephyr. | El estado de dominio (Pass/Fail/Blocked) debe ser la SSOT; el mapeo a nombres específicos de la herramienta (`"Not Executed"` vs. `"UNEXECUTED"`) es responsabilidad exclusiva del Adapter. |
| Contratos de integración | Repartidos entre `implementation-contract.md`, `productAgent.md` y comentarios de código. | Un contrato por integración (Jira, Zephyr, Git/GitHub, Test Runner), sin conocimiento de sus detalles fuera del Adapter correspondiente. |

---

## 9. Contratos

Cada Adapter debe exponer un **contrato estable** hacia el dominio,
independiente del proveedor:

- El contrato se define en términos de **capacidades de negocio**
  ("crear historia", "publicar caso de prueba", "reportar resultado de
  ejecución", "abrir pull request"), nunca en términos de verbos HTTP,
  nombres de campos de una API específica, o algoritmos internos de una
  herramienta (contraste con 1.6).
- El contrato recibe y devuelve **Modelos Canónicos** (sección 3.5), nunca
  estructuras específicas de la herramienta.
- Cambiar de proveedor implica escribir un nuevo Adapter que cumpla el
  mismo contrato — el dominio no debería notar la diferencia.
- `docs/architecture/implementation-contract.md` ya es un punto de partida
  válido para el contrato de Jira/Zephyr (1.4), pero debe reescribirse
  para: (a) eliminar cualquier detalle que hoy se filtra hacia
  `productAgent.md`, y (b) generalizarse a un patrón de contrato aplicable
  también a Git/GitHub y al Test Runner, no solo a Jira/Zephyr.

---

## 10. Acoplamiento y dependencia

Hallazgos concretos a resolver en el diseño (detalle en sección 1):

- **Acoplamiento del Orchestrator a scripts concretos** (1.7): eliminar
  toda mención de nombres de archivo/script desde `Manager`.
- **Duplicación de cliente HTTP de Jira** (1.3): `create-jira-task.js` y
  `mcp-jira/index.js` no deberían tener implementaciones independientes del
  mismo cliente REST. Definir cuál de los dos mecanismos de acceso (script
  directo vs. MCP) es el canal oficial para Jira, y que el otro, si se
  mantiene, reutilice el mismo Adapter en lugar de reimplementarlo.
- **Fuga de conocimiento de integración hacia el dominio** (1.6): es la
  dependencia más severa detectada — un Agent de dominio (`productAgent`)
  depende de detalles internos de una API externa (Zephyr) que deberían
  ser invisibles para él.
- **Conocimiento de framework de test dentro de skills agnósticas** (1.7,
  `implementation-plan` con referencias a Cypress): separar la guía de
  "cómo validar un caso negativo" (agnóstica) de "cómo se expresa eso en
  Cypress" (específica del Test Runner).
- **Componentes sin dependientes activos** (`desarrollador`, `ejecutor`,
  `probando`, y las tools de escritura de `mcp-jira`): no generan
  acoplamiento hoy porque nadie los invoca desde el flujo oficial, pero
  representan superficie muerta que debe resolverse en la migración
  (mantener, fusionar o retirar — decisión pendiente, no tomada acá).

---

## 11. Reutilización de la implementación existente

Por instrucción explícita: la V2 **no debe crear implementaciones
paralelas** donde la actual ya sea correcta.

- `scripts/lib/zephyr.js`: **reutilizar como base** del futuro Adapter de
  Zephyr — ya es transporte puro, sin conocimiento de negocio. Su única
  evolución necesaria es que dejen de llegarle decisiones que hoy toma
  `productAgent.md` (nombres de estado, existencia de carpetas) como
  conocimiento de negocio filtrado, y pasen a ser parte del contrato del
  Adapter.
- `scripts/create-jira-task.js`: **reutilizar el transporte** (`jiraRequest`,
  auth), pero **separar** en el diseño las otras tres responsabilidades que
  hoy conviven ahí (plantillas ADF de dominio, orquestación Zephyr, CLI) —
  ver 1.3. No se trata de reescribirlo desde cero: se trata de decidir, en
  la fase de diseño, cómo particionar responsabilidades que hoy están
  fusionadas en un solo archivo.
- `scripts/create-pull-request.js`: reutilizar tal cual como Adapter de
  GitHub; ya cumple razonablemente el patrón.
- `mcp-jira/index.js`: evaluar en el diseño si se retiene solo la capacidad
  de lectura (la única en uso real, según 1.3) delegando en el mismo
  Adapter que use `create-jira-task.js`, en lugar de mantener un segundo
  cliente HTTP independiente.
- `scripts/create-tc16-ticket.js`, `create-tc21-ticket.js`,
  `create-test-case-4.js`: **no reutilizar** — confirmados obsoletos por
  git log (1.3), predecesores del script hoy oficial.
- `testcase-model` (skill): **reutilizar como está** — es el patrón de
  modelo canónico a replicar para otros conceptos de dominio.

---

## 12. Migración V1 → V2 (principios, no plan de ejecución)

Este documento **no define un plan de migración paso a paso** — eso
corresponde a una fase posterior, una vez diseñada la V2 concreta. Los
principios que deberá respetar esa migración, cuando se diseñe, son:

1. La V1 sigue operativa durante todo el proceso; no hay "big bang".
2. Ningún cambio de Agent/Skill se hace sin haber identificado primero a
   qué responsabilidad de la sección 5 corresponde y qué principio de la
   sección 2 resuelve.
3. Los componentes candidatos a redundantes (sección 1.1: `desarrollador`,
   `ejecutor`, `probando`, Agent `create-jira-task`; sección 1.3: los tres
   scripts obsoletos) se resuelven explícitamente (mantener con
   justificación, fusionar, o retirar) — nunca se arrastran "por si
   acaso" a la V2 sin una decisión documentada.
4. Toda migración de una integración (Jira, Zephyr, Cypress, GitHub) se
   valida primero contra el contrato (sección 9) antes de tocar el
   Adapter — si el contrato no alcanza para cubrir el caso real, se
   corrige el contrato antes que el Adapter.

---

## 13. Reglas de implementación

- Ningún Agent de dominio puede contener nombres de endpoints, verbos
  HTTP, nombres de campos internos de una API externa, ni algoritmos de
  resolución específicos de una herramienta (prohibido lo detectado en
  1.6).
- Ningún Orchestrator puede nombrar un archivo de script o una herramienta
  concreta en su propio texto (prohibido lo detectado en 1.7); solo puede
  nombrar capacidades.
- Toda regla técnica de una integración se escribe **una sola vez**, en el
  contrato o en el Adapter correspondiente — nunca repetida en
  `CLAUDE.md`, en el prompt de un Agent y en comentarios de código a la
  vez (evitar lo detectado en 1.8).
- Todo concepto de dominio que hoy no tiene Modelo Canónico (Historia,
  resultado de ejecución, Pull Request) debe evaluarse, en el diseño,
  contra el patrón ya probado de `testcase-model` antes de decidir su
  forma final.
- Antes de crear un Adapter nuevo, o una implementación paralela a una
  existente, debe aplicarse el mismo orden de verificación que ya exige
  `CLAUDE.md`/`Manager.md` (scripts oficiales → skills → agentes →
  herramientas ya configuradas) — este principio de la V1 es correcto y se
  conserva sin cambios.

---

## 14. Criterios de aceptación de la V2

La Arquitectura V2, cuando se diseñe, debe poder demostrar cada uno de
estos criterios contra el repositorio real (no solo declararlos en
prosa):

1. **Sustitución de herramienta sin tocar dominio**: reemplazar Jira por
   Azure DevOps (aunque sea a nivel de diseño, sin implementarlo) no
   requiere modificar ningún Agent ni Skill de dominio — solo el Adapter y
   su configuración.
2. **Cero fuga de conocimiento de integración**: ningún Agent ni Skill
   agnóstica de herramienta contiene nombres de endpoints, campos internos
   de una API o algoritmos específicos de un proveedor.
3. **Un solo dueño por artefacto compartido**: el formato de "resultado
   final de un flujo" (hoy fragmentado en tres definiciones, 1.5) tiene una
   única definición, referenciada, no reescrita, por cada consumidor.
4. **Sin implementaciones paralelas activas**: no coexisten dos clientes
   independientes para la misma herramienta (resuelto el caso de 1.3,
   Jira vía script vs. vía MCP).
5. **Cada componente resiste la prueba de existencia** de la sección 7:
   ningún Agent o Skill de la lista final queda sin un "qué pasaría si no
   existiera" concreto.
6. **Granularidad estable**: agregar una nueva capacidad razonable (ej.
   soportar un segundo gestor de tickets en paralelo, o un segundo test
   runner) no requiere crear un nuevo Agent — como mucho, un nuevo Adapter
   bajo un contrato ya existente.
7. **Trazabilidad de un solo camino**: se puede seguir un Test Case desde
   el escenario funcional hasta su ejecución real pasando por un único
   modelo de trazabilidad, no por fragmentos repartidos entre distintos
   archivos de prompt.

---

## 15. Explícitamente fuera de alcance de este documento

- La lista definitiva de Agents y Skills de la V2.
- La decisión de eliminar, fusionar o conservar `desarrollador`, `ejecutor`,
  `probando` o el Agent `create-jira-task` (sección 1.1) — quedan
  señalados como candidatos, no resueltos.
- La decisión sobre qué mecanismo de acceso a Jira (script directo vs. MCP)
  se conserva como canal oficial (sección 10).
- Cualquier modificación de código, prompts de Agents/Skills, o scripts.
- Un plan de migración con pasos, fechas o responsables.
