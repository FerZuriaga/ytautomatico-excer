---
name: framework-analysis

description: >
  Analyze the existing test automation framework before implementation.
  Identify reusable architecture, project conventions and shared
  components without modifying the project.

when_to_use: >
  Use after ticket-analysis and before implementation-plan.
  This skill must execute before any code is written.

---

## Objetivo

Analizar el framework existente antes de implementar cualquier automatización.

Ninguna automatización debe comenzar sin comprender previamente la arquitectura actual del proyecto.

# RESPONSABILIDAD

Este skill es responsable de:

- comprender la arquitectura existente
- identificar componentes reutilizables
- detectar patrones utilizados por el proyecto
- recomendar la estrategia de reutilización

Este skill nunca:

- escribe código
- modifica archivos
- crea componentes
- ejecuta pruebas


# ENTRADA ESPERADA

Este skill espera recibir:

- el proyecto actual;
- el resultado de ticket-analysis;
- la Historia;
- el framework a analizar.

La Historia deberá incluir:

- criterios de aceptación;
- casos de prueba asociados;
- matriz de trazabilidad.

Esta información se utilizará únicamente para comprender el alcance funcional de la implementación.

No deberá modificarse.

Debe utilizar esa información para comprender la arquitectura antes de cualquier implementación.

# Framework Analysis



---

## ALCANCE DEL ANÁLISIS

Antes de crear o modificar código revisar:

* estructura de carpetas
* Page Objects existentes
* Commands existentes
* Fixtures existentes
* Helpers existentes
* Utilidades compartidas
* Convenciones de nombres
* Patrones de diseño utilizados

Objetivo:

Comprender cómo fue construido el framework antes de agregar nuevas implementaciones.


---

## VALIDACIÓN DEL CONTEXTO FUNCIONAL

Antes de analizar el framework, verificar que la documentación funcional recibida sea consistente con el alcance técnico.

Confirmar que existan:

- Historia funcional;
- criterios de aceptación;
- casos de prueba asociados;
- matriz de trazabilidad.

Si la información funcional es insuficiente o inconsistente, marcar
`VALIDACIÓN: Incompleto` en la salida obligatoria e informar la
situación. Este skill no decide detener el flujo, solo informa.

No realizar recomendaciones técnicas basadas en documentación incompleta.


## PRINCIPIO DE REUTILIZACIÓN

Siempre priorizar:

1. Reutilizar componentes existentes.
2. Extender componentes existentes.
3. Crear nuevos componentes.

Nunca invertir este orden.

-------

## Reutilización obligatoria

Antes de crear cualquier archivo:

1. Buscar implementaciones similares.
2. Verificar si existe un Page Object reutilizable.
3. Verificar si existe lógica reutilizable.
4. Verificar si existe un fixture reutilizable.
5. Verificar si existe un helper reutilizable.

Si existe una implementación similar:

* reutilizarla
* extenderla cuando sea necesario
* evitar duplicación

---

## Extracción proactiva a componente compartido

No basta con reutilizar lo que ya existe. También debe anticiparse la duplicación.

Si una lógica nueva:

* se repite más de una vez dentro de la misma implementación, o
* tiene alta probabilidad de ser reutilizada por otros specs (mismo flujo, mismo dominio, patrón ya visto en el framework),

debe recomendarse extraerla a un componente compartido (Command, método de Page Object o helper) en lugar de dejarla duplicada o inline, aunque hoy no exista todavía una segunda ocurrencia.

Esto aplica en particular a Commands de Cypress: si una acción se repetirá entre specs (navegación, validaciones genéricas, utilidades), debe evaluarse como candidata a `cypress/support/commands.js` y no como lógica local del test.

---

## Prohibiciones

Está prohibido:

* crear Page Objects duplicados
* duplicar lógica existente
* crear estructuras paralelas al framework
* crear componentes innecesarios
* ignorar implementaciones ya existentes

---

## Creación de nuevos componentes

Crear nuevos componentes únicamente cuando:

* no exista una alternativa reutilizable
* la funcionalidad sea realmente nueva
* la extensión de componentes existentes no sea suficiente

Antes de crear un nuevo archivo justificar:

ARCHIVO_NUEVO:
MOTIVO:
ALTERNATIVAS_REVISADAS:

---

## Validación

Si no puede determinarse claramente el patrón correcto, marcar
`VALIDACIÓN: Incompleto` e informar el problema en la salida obligatoria.
Este skill no decide detener el flujo, solo informa — QaAutomation1
decide si solicita validación antes de continuar.

Nunca improvisar una arquitectura alternativa.

---

## SALIDA OBLIGATORIA

FRAMEWORK:

ARQUITECTURA:

PAGE_OBJECTS_REUTILIZABLES:

COMMANDS_REUTILIZABLES:

HELPERS_REUTILIZABLES:

FIXTURES_REUTILIZABLES:

PATRONES_IDENTIFICADOS:

COMPONENTES_A_EXTENDER:

COMPONENTES_NUEVOS_RECOMENDADOS:

LOGICA_CANDIDATA_A_EXTRACCION:

RIESGOS:

VALIDACIÓN:

✔ Completo | ✘ Incompleto

ESTADO:

• Framework analizado
• Listo para Implementation Plan (solo si VALIDACIÓN es Completo)

## Resultado esperado

Al finalizar este skill deberá existir una comprensión completa del framework, una estrategia de reutilización y una recomendación clara sobre qué componentes reutilizar, extender o crear antes de comenzar la implementación.


## RESTRICCIONES

Nunca:

- escribir código;
- modificar archivos;
- crear componentes;
- ejecutar herramientas;
- alterar la arquitectura del proyecto.

Finalizar una vez entregado el análisis.
