---
name: execution-validation

description: >
  Validate the results produced by the test execution and determine
  whether the workflow can continue.

when_to_use: >
  Use immediately after cypress-execution and before automation-review.

---


# Execution & Validation


## Objetivo

Validar los resultados obtenidos durante la ejecución y determinar si la automatización cumple los criterios necesarios para continuar con el flujo.

Este skill no ejecuta Cypress.

Utiliza exclusivamente los resultados obtenidos por cypress-execution.

# RESPONSABILIDAD

Este skill es responsable de:

- analizar los resultados de ejecución
- validar que la automatización sea confiable
- verificar que existan evidencias suficientes
- determinar si el flujo puede continuar

Este skill nunca:

- ejecuta Cypress
- modifica código
- crea commits
- realiza push
- crea Pull Requests

# ENTRADA ESPERADA

Este skill espera recibir:

- resultado de cypress-execution
- evidencias de ejecución
- logs disponibles
- ticket asociado

Debe validar si la ejecución cumple los criterios definidos por el proyecto.


## Cuándo utilizarlo

Utilizar este skill cuando:

- Cypress haya finalizado su ejecución;
- exista un resultado de cypress-execution;
- deba decidirse si el flujo puede continuar.

No utilizar este skill para:

- ejecutar nuevamente Cypress;
- modificar código;
- generar commits;
- realizar push.


---

## PRINCIPIOS

Siempre priorizar:

1. Validar la evidencia.
2. Validar los resultados.
3. Determinar si el flujo puede continuar.

Nunca asumir que una ejecución fue exitosa sin evidencia suficiente.

## VALIDACIÓN DE RESULTADOS

Analizar obligatoriamente:

- resultado de la ejecución
- cantidad de tests ejecutados
- tests exitosos
- tests fallidos
- duración
- evidencias disponibles

Nunca volver a ejecutar las pruebas.

## CRITERIOS DE APROBACIÓN
Verificar además:

- que exista evidencia suficiente
- que los resultados sean consistentes
- que no existan errores críticos pendientes

## Validaciones obligatorias

Antes de considerar finalizada una automatización verificar:

- errores de sintaxis
- errores de compilación
- errores de ejecución
- selectores inválidos
- validaciones incorrectas
- resultados esperados


---

## SI LA EJECUCIÓN FALLÓ

Detener el flujo inmediatamente.

Informar:

- comando ejecutado
- mensaje de error
- cantidad de tests fallidos
- evidencia disponible

No realizar:

- commit
- push
- Pull Request

Esperar corrección antes de continuar.

---

## SI LA EJECUCIÓN ES EXITOSA

Informar:

- comando ejecutado
- cantidad de tests ejecutados
- cantidad de tests exitosos
- cantidad de tests fallidos
- duración
- navegador utilizado

Continuar únicamente con:

- commit
- push
- Pull Request

---

## EVIDENCIAS REQUERIDAS

Siempre entregar evidencia de ejecución.

Como mínimo informar:

- spec ejecutado
- resultado
- duración
- browser utilizado

Nunca indicar que una automatización fue exitosa sin evidencia.

---




## SALIDA OBLIGATORIA

TICKET:

SPEC:

RESULTADO:

PASSING:

FAILING:

DURACIÓN:

EVIDENCIAS:

VALIDACIÓN:

✔ Aprobada

✘ Rechazada

ESTADO:

• Validación completada

• Listo para Automation Review

## RESTRICCIONES

Nunca:

- ejecutar Cypress nuevamente
- modificar código
- crear ramas
- realizar commits
- ejecutar push
- crear Pull Requests

Este skill únicamente valida los resultados obtenidos.