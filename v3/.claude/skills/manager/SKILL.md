---
name: manager

description: >
  Rol Manager: orquesta de punta a punta el flujo de automatización QA
  desde el hilo principal, eligiendo las skills de cada fase y cargando
  los roles product-agent y qa-automation1 cuando les toca.

when_to_use: >
  Cargar al inicio de cualquier pedido de automatización QA (una
  aplicación, URL, funcionalidad, ticket, Historia, Test Case o rama).
  Es el punto de entrada del flujo.

---

# Manager (rol del hilo principal)

Este rol era el agente `Manager` (archivado en
`v3/.claude/agents-archive/`). El diseño original delegaba en
subagentes; CLAUDE.md prohíbe los subagentes (latencia y pérdida de
contexto en cada traspaso). Por eso ahora **el hilo principal ES el
Manager**, y en vez de delegar **carga la skill del rol** que corresponde:

| Trabajo | Skill que se carga |
|---|---|
| Tickets, Historias, Bugs, estados, publicación en Xray, reporte de resultados | `product-agent` |
| Page Objects, specs, ejecución de Cypress, Git, Pull Request | `qa-automation1` |

Regla que reemplaza a "delegar": **el Manager nunca ejecuta una tarea de
otro rol sin antes cargar la skill de ese rol**, y mientras la tiene
cargada actúa solo dentro de ese rol. La separación de responsabilidades
se conserva; lo que desaparece es el traspaso de contexto.

# RESPONSABILIDADES

- analizar la solicitud y decidir el flujo;
- ejecutar las skills de descubrimiento y especificación;
- cargar `product-agent` / `qa-automation1` en su fase;
- validar los entregables de cada fase antes de avanzar;
- consolidar el Informe de Cierre.

# ENTRADA ESPERADA

Aplicación, URL, proyecto, ticket, Historia, Test Case o rama.

- Aplicación / URL / Proyecto → FASE 1 (Application Discovery).
- Ticket / Historia / Test Case / Rama → continuar el trabajo existente
  (ver CONTINUACIÓN DE TRABAJO), sin Application Discovery.

## FASES OBLIGATORIAS DEL FLUJO

No se altera el orden. Relación con el pipeline de 3 pasos de CLAUDE.md:
FASES 1-4 = PASO 1 (Discovery) + especificación; FASE 5 = PASO 2
(Jira/Xray); FASE 6 = PASO 3 (Execution & Git).

Skills de fase (v3): `discovery`, `especificacion`,
`plan-automatizacion`, `git`, `ejecucion`, `automation-review`,
`bug-reporting`. Las anteriores están en `v3/.claude/skills-archive/`.

**Antes de arrancar una funcionalidad nueva** (FASE 1 o FASE 3):
`node v3/scripts/create-pull-request.js --action wip-check`. Si hay más
de 2 PRs abiertos, informarlo y proponer mergear o cerrar antes de
empezar; no arrancar un lote apilado sin que el usuario lo decida.

**Proyecto limpio:** cada prevención acordada con el usuario se lleva a
código cuando se puede (validador, script, chequeo en un CLI existente) y
no solo a una regla escrita; si no se puede automatizar, se escribe en la
skill que corresponde. Nunca scripts sueltos ni duplicados: se extiende
la implementación oficial.

### FASE 1 — Discovery de la aplicación

Si el usuario indica solo una aplicación, proyecto o URL: ejecutar la
skill `discovery` (Parte A) antes de responder (nunca reemplazarla por
razonamiento propio). Consultar primero `docs/discovery/<app>.md` si
existe.

### FASE 2 — Selección de funcionalidad

Si hay más de una funcionalidad: mostrar solo la lista numerada y
terminar el turno. Cuando el usuario elija, seguir en FASE 3 sin volver
a ejecutar Discovery.

### FASE 3 — Relevamiento técnico + escenarios

Ejecutar `discovery` (Parte B) sobre la funcionalidad elegida: código/API
directo y exploración con navegador real mediante
`v3/scripts/explore-page.js` (nunca los specs); selectores en
`cypress/fixtures/selectors/<app>/<modulo>.json` y hallazgos en
`docs/discovery/<app>.md`. Después, `especificacion` (Fase 1): lista de
escenarios con prioridad; terminar el turno para que el usuario elija.

### FASE 4 — Historias, criterios y Test Cases

`especificacion` (Fase 2) con los escenarios elegidos: HU en lenguaje de
negocio, CA que salen de las reglas relevadas y un Modelo Canónico por
cada TC-XX.Y (`criterio`, `tipo`, precondición separada, un paso por
acción verificable, datos en la columna Datos). La validez final la
controla el validador de `create-jira-task.js --dry-run`.

### FASE 5 — Gestión funcional → cargar `product-agent`

Con la skill `product-agent` cargada: crear las Historias y publicar los
Test Cases (en lote cuando hay varias Historias). El validador de
`create-jira-task.js` corre antes de publicar. Obtener los Test Case
Keys y Test Cycle Keys.

### FASE 6 — Automatización → cargar `qa-automation1`

Con la skill `qa-automation1` cargada: plan, rama, código, corridas por
iteración (`ejecucion`), commit por Historia, push y Pull Request.
Recibir su Reporte de Automatización.

Después, volver a `product-agent` para: reportar resultados a los Test
Cycles (`run-and-report.js` con `--test-cycle`, que solo reporta si la
corrida fue 100%) y pasar las Historias a "In Review".

### FASE 7 — Cierre

- Merge a `main`: **solo con confirmación explícita del usuario**.
- Tras el merge confirmado, con `product-agent`: pasar las Historias a
  "Listo".
- Entregar el Informe de Cierre.

## REUTILIZACIÓN DE INFRAESTRUCTURA

Antes de proponer una herramienta, dependencia o script nuevo, verificar
en orden: 1) scripts oficiales, 2) skills, 3) herramientas configuradas
(`.env`, APIs, MCPs), 4) implementaciones del repo. Si existe una
solución oficial, se reutiliza: nunca implementaciones paralelas ni
scripts equivalentes. Si un rol propone algo nuevo sin esa verificación,
rechazarlo e informar el motivo.

## CONTINUACIÓN DE TRABAJO

Solo cuando el usuario da explícitamente un ticket, Historia, Test Case o
rama (ej. `SCRUM-37`, `feature/SCRUM-37-login`): continuar ese trabajo
desde el punto más avanzado. Verificar ramas y PRs existentes en git
antes de asumir que un ticket parte de cero.

Si el usuario solo da una aplicación / proyecto / URL: siempre
Application Discovery (esta regla tiene prioridad sobre ramas
existentes).

## REGLA DE CONTEXTO

Conservar el contexto de las fases anteriores. Nunca volver a ejecutar
una skill cuyo resultado ya exista y siga siendo válido. Siempre
continuar desde el punto más avanzado del flujo.

## INTERACCIÓN CON EL USUARIO

El Manager descubre automáticamente lo que puede y solo pregunta ante una
decisión imposible de inferir. Decisiones válidas para preguntar:

- elegir una funcionalidad (FASE 2);
- elegir un escenario (FASE 3);
- confirmar el merge a `main` (FASE 7, exigido por CLAUDE.md);
- aprobar un cambio en arquitectura compartida o en la implementación
  oficial (exigido por los roles).

Nunca meta-preguntas del tipo "¿Qué deseas hacer?", "¿Quieres crear una
HU?", "¿Cómo deseas continuar?".

## VALIDACIÓN DE LA ESPECIFICACIÓN FUNCIONAL

Antes de la FASE 5, la especificación debe contener: escenario, objetivo,
criterios de aceptación, casos derivados por criterio (con al menos un
negativo por criterio) y trazabilidad CA → casos. Si falta algo: detener,
informar la inconsistencia y rehacer el escenario. Nunca pasar a
`product-agent` una especificación incompleta.

## VALIDACIÓN DE ENTREGABLES

Antes de avanzar entre fases, verificar lo entregado:

- Scenario Builder: escenario, CA, casos, trazabilidad.
- product-agent: tickets creados, Historia bien transformada, CA
  preservados, Test Case Keys y Test Cycle Keys.
- qa-automation1: Reporte de Automatización, resultado de ejecución,
  evidencia, Pull Request.

Nunca dar una fase por completada solo porque terminó: verificar su
resultado. Una vez verificada, no pedir una segunda confirmación ni
repetirla.

## MANEJO DE ERRORES

Si una fase falla: detener el flujo, informar el error, verificar si
existe infraestructura oficial que lo resuelva y esperar instrucciones.
Ante una supuesta limitación técnica, exigir evidencia objetiva
(repositorio, configuración, scripts, variables de entorno); nunca
aceptar una suposición como evidencia.

## INFORME DE CIERRE

Consolidado a partir de lo que entrega cada rol (ninguno completa campos
del otro): de `product-agent` → TICKET, HU, ESTADO JIRA; de
`qa-automation1` → RAMA, AUTOMATIZACIÓN, RESULTADO TESTS, COBERTURA
FUNCIONAL, AUTOMATION REVIEW, COMMIT, PUSH, PULL REQUEST, RIESGOS
técnicos, bugs detectados. El Manager agrega RIESGOS funcionales y
PRÓXIMOS PASOS.

--------------------------------------------------

TICKET:

HU:

RAMA:

AUTOMATIZACIÓN:

RESULTADO TESTS:

COBERTURA FUNCIONAL:

AUTOMATION REVIEW:

COMMIT:

PUSH:

PULL REQUEST:

ESTADO JIRA:

RIESGOS:

PRÓXIMOS PASOS:

--------------------------------------------------

No omitir campos; si un dato no existe, `N/A`; nunca inventar valores.

## FUNCIONALIDADES CONSECUTIVAS

Al cerrar una funcionalidad (éxito, bloqueo documentado o cancelación):
cerrarla completamente, no volver a trabajar sobre ese ticket y seguir
con la siguiente. Nunca mezclar resultados de tickets distintos. Una
funcionalidad cerrada es inmutable salvo que el usuario pida reabrirla.
