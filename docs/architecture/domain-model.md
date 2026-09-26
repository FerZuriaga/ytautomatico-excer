# Modelo de Dominio (borrador v3)

## Objetivo de este documento

Diccionario único de los conceptos de negocio que maneja el framework de
automatización QA. Agents, Skills y adapters **referencian** estas
definiciones en vez de repetirlas o reinterpretarlas cada uno a su manera.

Este documento reemplaza al "Canonical Model / Capability Contract" de
`architecture-v2-phase2-component-design.md` — se consideró demasiado
formal para el uso real. Este es intencionalmente más chico: entidad,
definición, campos, relaciones, invariantes. Nada más.

**Principio central:** las entidades de acá son agnósticas de herramienta.
Jira, Zephyr, Cypress y GitHub son *representaciones externas* de estos
conceptos, traducidas por un adapter (`scripts/lib/*.js`). Ningún Agent ni
Skill debería necesitar saber cómo Zephyr llama internamente a un estado
o un tipo de link — eso es problema exclusivo del adapter.

---

## Entidades

### Application

Sistema bajo prueba (ej. SauceDemo, OrangeHRM, Rentas Córdoba). Entidad
genérica: agregar una aplicación nueva es completar sus campos, no tocar
código.

| Campo | Descripción |
|---|---|
| `name` | Nombre de la aplicación |
| `baseUrl` | URL de entrada |
| `entorno` | `sandbox` \| `demo-compartida` \| `prod-real` |
| `nivelAcceso` | `completo` \| `solo-lectura` |
| `restricciones` | Lista estructurada de reglas conocidas, no texto libre — ver estructura abajo |
| `modulos` | Lista de módulos/flujos funcionales identificados |

**Estructura de `restricciones`** (para que el Manager pueda decidir con
esto, no solo leerlo):

```
restricciones: [
  { accion: "Cancel Leave", motivo: "no confirma y no es reversible", severidad: "critica" },
  { accion: "crear datos", motivo: "prod real de gobierno, solo lectura", severidad: "critica" }
]
```

**Relación:** 1 Application → N User Story.
**Quién la genera:** skill `discovery` (Parte A).

---

### User Story (HU)

Capacidad de negocio completa y autocontenida.

| Campo | Descripción |
|---|---|
| `id` | Key externa (ej. SCRUM-64) una vez creada en Jira |
| `titulo` | Formato "Como [Rol], Quiero [Acción], Para [Beneficio]" |
| `contexto` | Entorno relevante (flujo público, autenticado, etc.) |
| `application` | Application a la que pertenece |

**Invariante:** representa un objetivo de negocio único — no una pantalla
ni un escenario. Se agrupan funcionalidades cuando entregan valor
conjuntamente; se separan cuando cambia el objetivo, cuando puede
evolucionar de forma autónoma, o cuando es una acción destructiva
(eliminar, editar, aplicar cupón, etc.).

**Relación:** 1 HU → 2..N Acceptance Criteria (piso estricto 2, sin
techo — ver método de 3 dimensiones más abajo). 1 HU → 0..1 Branch/PR.
1 HU → 0..N Bug.
**Quién la genera:** skill `especificacion` → rol `product-agent` (skill, crea en Jira).

---

### Acceptance Criteria (CA)

Una única regla de negocio dentro de una HU.

| Campo | Descripción |
|---|---|
| `codigo` | `CA-01`, `CA-02`... numeración global dentro de la HU, nunca se reinicia |
| `descripcion` | Comportamiento funcional visible, sin selectores técnicos ni lenguaje HTML/CSS |
| `estadoInicial` | Qué se ve/carga por defecto, si aplica |

**Invariante:** se crea un CA nuevo únicamente cuando cambia la regla de
negocio, el estado final o el comportamiento esperado — **nunca** solo
porque cambia la pantalla de entrada. Dos puntos de entrada de UI que
validan exactamente la misma regla comparten el mismo CA.

**Método obligatorio para derivar CAs de una HU:** evaluar explícitamente,
sin saltear ninguna, las 3 dimensiones: (1) puntos de entrada de UI, (2)
estados resultantes (contadores, listas vacías), (3) variaciones de
flujo/límites (1 elemento vs. varios). El piso de 2 CA por HU **no** se
sube artificialmente — si al evaluar las 3 dimensiones el resultado
genuino es 2 CA, está bien quedarse en 2. El problema a evitar no es
"terminar en 2", es evaluar solo 1 dimensión y no llegar nunca a
analizar las otras 2 (ahí es donde se pierden CA válidos). No inventar CA
de relleno solo para llegar a un número — es el mismo error que ya se
corrigió una vez con el piso de Test Case por CA (ver abajo).

**Relación:** 1 CA → 2..5 Test Case (mínimo 2, techo 5 si aplica).
**Quién lo genera:** mismo origen que la HU (`especificacion`).

---

### Test Case (TC)

Escenario concreto y ejecutable que valida un CA.

| Campo | Descripción |
|---|---|
| `codigo` | `TC-XX.X` (X = número de CA, X = número de TC dentro de ese CA) |
| `zephyrKey` | Key externa una vez publicado (ej. SCRUM-Txx) |
| `precondiciones` | Requisitos previos, o `N/A` |
| `pasos` | Lista de Test Step |

**Relación:** 1 TC → N Test Step. 1 TC → N Test Execution (histórico).
**Quién lo genera:** skill `especificacion` (transforma el escenario
funcional en modelo canónico) → publicado a Zephyr por
`scripts/lib/zephyr.js`.

---

### Test Step

Un paso dentro de un Test Case. Nunca existe suelto, siempre pertenece a
un TC.

| Campo | Descripción |
|---|---|
| `paso` | Acción concreta (nunca verbos ambiguos: "Identificar", "Verificar", "Observar", "Notar", "Revisar") |
| `datosPrueba` | Datos concretos usados, o `N/A` |
| `resultadoEsperado` | Uno o más resultados numerados, lenguaje funcional (nunca selectores) |

**Quién lo genera:** parte de `especificacion`.

---

### Test Execution

Un resultado de correr un Test Case en un momento dado. **Histórico, no
se pisa** — cada corrida es una entrada nueva, igual que en Zephyr.

| Campo | Descripción |
|---|---|
| `testCase` | TC al que pertenece |
| `testCycle` | Test Cycle al que pertenece esta corrida |
| `resultado` | `Pass` \| `Fail` \| `Not Executed` |
| `timestamp` | Cuándo se ejecutó |

**Invariante:** el "estado actual" de un TC es una vista derivada (la
Test Execution más reciente), no un campo propio del TC.

**Quién lo genera:** skill `ejecucion` sobre `v3/scripts/run-and-report.js`
(corre y valida el resultado) → reportado a Xray por
`v3/scripts/lib/test-runner.js` + `xray.js`.

---

### Test Cycle

Agrupador de Test Executions correspondientes a una misma corrida/entrega.
Resuelto automáticamente (buscar-o-crear) al reportar resultados.

| Campo | Descripción |
|---|---|
| `key` | Identificador en Zephyr |
| `nombre` | Nombre del ciclo |

**Relación:** 1 Test Cycle → N Test Execution.
**Quién lo resuelve:** `resolveTestCycle` en `scripts/lib/zephyr.js`.

---

### Bug

Defecto detectado durante la automatización, vinculado a la HU/CA que lo
evidenció.

| Campo | Descripción |
|---|---|
| `id` | Key externa en Jira |
| `hu` | HU/CA donde se detectó |
| `pasosReproducir` | Solo acciones funcionales — sin selectores, aliases ni código |
| `resultadoActual` / `resultadoEsperado` | Comportamiento observado vs. esperado |

**Relación:** N Bug → 1 HU (0..N por HU).
**Quién lo genera:** skill `bug-reporting`.

---

### Branch/PR

Artefacto de git asociado a la implementación de una HU.

| Campo | Descripción |
|---|---|
| `rama` | Nombre de rama siguiendo convención del proyecto |
| `pr` | Número/URL de Pull Request |
| `hu` | HU que implementa |

**Relación:** 1 HU → 0..1 Branch/PR activo.
**Quién lo genera:** skill `git` (Parte A: rama; Parte B: commit/push/PR).

---

## Mapeo a sistemas externos (responsabilidad exclusiva del adapter)

| Entidad de dominio | Representación externa | Adapter responsable |
|---|---|---|
| User Story | Jira Issue tipo "Historia" | `scripts/lib/jira.js` |
| Bug | Jira Issue tipo "Bug" | `scripts/lib/jira.js` |
| Test Case + Test Step | Zephyr Test Case + testscript/teststeps | `scripts/lib/zephyr.js` |
| Test Cycle | Zephyr Test Cycle | `scripts/lib/zephyr.js` |
| Test Execution | Zephyr Test Execution (`PUT /testexecutions`) | `scripts/lib/zephyr.js` |
| Branch/PR | GitHub branch + Pull Request | `scripts/create-pull-request.js` |
| Resultado de corrida | JSON de Cypress/Mocha (`cypress run --quiet --reporter json`) | `scripts/lib/test-runner.js` |

Ningún Agent ni Skill debería contener nombres de link type, strings de
estado exactos ("Not Executed"), ni algoritmos de resolución de carpeta —
eso vive únicamente en la fila correspondiente de esta tabla.

---

## Cómo agregar o reemplazar una herramienta (contrato de adapter)

Objetivo de esta sección: que cambiar de herramienta (ej. Zephyr → Xray,
o Jira → Linear) tenga un alcance **acotado y predecible**, no una
búsqueda a ciegas de qué tocar en 16 archivos.

**Principio:** un adapter nuevo debe exponer las mismas funciones
(mismo nombre, misma firma) que el que reemplaza. Si lo cumple, el
resto del framework (script de orquestación, Agents, Skills) no
necesita cambiar — solo cambia el `require(...)` que apunta al adapter.

### Contrato del adapter de "gestor de tickets" (hoy `scripts/lib/jira.js`)

Un adapter nuevo (ej. `scripts/lib/linear.js`) debe exponer:

`createIssue`, `updateIssue`, `getIssue`, `linkIssue`,
`transitionIssue`, `addComment`, `buildDescription`,
`buildBugDescription`, `buildHistoriaDescription`,
`buildTareaDescription`

### Contrato del adapter de "gestor de Test Cases" (hoy `scripts/lib/zephyr.js`)

Un adapter nuevo (ej. `scripts/lib/xray.js`) debe exponer:

`createTestCase`, `createTestSteps`, `linkTestCaseToIssue`,
`createTestCycle`, `createTestExecution`, `getTestCase`,
`getTestCaseLinks`, `getTestCaseSteps`, `getTestCycle`, `getStatus`,
`getTestExecutions`, `findTestExecution`, `updateTestExecutionStatus`,
`findFolder`, `createFolder`, `resolveFolderPath`, `resolveTestCycle`,
`resolveTestCaseFolder`, `publishTestCase`, `publishTestCasesBatch`

### Ejemplo trabajado: reemplazar Zephyr por Xray

Inventario real (relevado 2026-09-09, grepeando "Zephyr" en `v3/`):

**Obligatorio — reescritura completa (1 archivo):**
- `scripts/lib/zephyr.js` → nuevo `scripts/lib/xray.js` implementando
  el contrato de arriba contra la API de Xray.

**Obligatorio — edición mecánica, no reescritura (2 archivos):**
- `scripts/create-jira-task.js`: cambiar el `require('./lib/zephyr')`
  por `require('./lib/xray')`. Si el contrato se respetó, el resto del
  archivo no cambia (los 6 mensajes de log que dicen literalmente
  "Zephyr" son cosméticos, no funcionales).
- `scripts/lib/test-runner.js`: la función `mapMochaStateToZephyr`
  traduce estados de Mocha (Pass/Fail) al vocabulario de la herramienta
  destino — revisar si Xray usa los mismos nombres de estado o hace
  falta ajustar el mapeo (no la lógica, solo la tabla de valores).

**Opcional — cosmético, el framework funciona igual si no se toca
(~22 menciones en 4 archivos):** `productAgent.md` (la sección MATRIZ
DE TRAZABILIDAD EN ZEPHYR, ~13 menciones — describe el mecanismo de
linking, que es conceptualmente el mismo en Xray), `testcase-model/
SKILL.md` (4), `QaAutomation1.md` (3), `scenario-builder/SKILL.md` (2,
ya usadas como ejemplo — "como Zephyr" — no como concepto exclusivo).
Vale la pena limpiarlas eventualmente por prolijidad, pero no bloquean
el swap.

**Orden recomendado:** escribir `xray.js` cumpliendo el contrato →
correr un caso real de prueba (como se hizo con SCRUM-70) → si
funciona, recién ahí limpiar las menciones cosméticas si se quiere.

## Diagrama de relaciones

```
Application
  └─< User Story (HU)
        ├─< Acceptance Criteria (CA)   [≥2 por HU, sin techo]
        │     └─< Test Case (TC)       [2..5 por CA]
        │           ├─< Test Step
        │           └─< Test Execution >─ Test Cycle
        ├─< Bug                        [0..N]
        └─< Branch/PR                  [0..1]
```

---

## Decisiones validadas con el usuario (2026-09-08)

- **Entidades:** las 8 listadas alcanzan. "Sprint/Iteration" descartada
  (no se usa en este flujo). "Test Suite/Módulo" descartada como entidad
  aparte — ya cubierta por `Application.modulos`, agregarla sería
  sobre-modelar organización de archivos como si fuera regla de negocio.
- **`restricciones` de Application:** estructurada (`accion`, `motivo`,
  `severidad`), no texto libre — el Manager necesita poder decidir con
  esto, no solo leerlo.
- **CA por HU:** piso estricto en **2**, no se sube a 4. Se refuerza en
  cambio la obligatoriedad de evaluar las 3 dimensiones del método antes
  de conformarse con 2 (ver sección Acceptance Criteria arriba).
- **TC por CA:** confirmado 2 a 5, piso estricto 2, techo 5 flexible.
