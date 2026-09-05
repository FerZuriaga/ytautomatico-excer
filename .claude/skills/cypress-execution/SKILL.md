---
name: cypress-execution

description: >
  Execute the implemented automated tests using Cypress and collect
  execution results before allowing the workflow to continue.

when_to_use: >
  Use after implementation and before execution-validation.

---

# Cypress Execution

## Objetivo

Ejecutar la automatización implementada y validar el resultado antes de continuar con el flujo de trabajo.

# RESPONSABILIDAD

Este skill es responsable de:

- identificar el spec correspondiente
- ejecutar Cypress
- recopilar los resultados de la ejecución
- determinar si la automatización puede continuar

Este skill nunca:

- modifica código
- crea commits
- realiza push
- crea Pull Requests

# ENTRADA ESPERADA

Este skill espera recibir:

- Ticket Jira
- implementación finalizada
- spec asociado
- proyecto listo para ejecutar

Debe ejecutar la automatización y registrar el resultado obtenido.

## Cuándo utilizarlo

Utilizar este skill cuando:

- la implementación haya finalizado;
- exista un spec asociado al ticket;
- el proyecto esté listo para ejecutar pruebas.

No utilizar este skill para:

- validar resultados;
- generar commits;
- realizar push;
- crear Pull Requests.



## PRINCIPIOS

Siempre priorizar:

1. Ejecutar únicamente el spec correspondiente.
2. Validar el resultado completo.
3. Detener el flujo ante cualquier error.

Nunca asumir resultados sin ejecutar Cypress.

## PROCESO DE EJECUCIÓN

Una vez finalizada la implementación:


## 1. VALIDACIÓN PREVIA

Antes de ejecutar verificar:

- existe el spec
- el proyecto compila
- las dependencias están disponibles
- el entorno está listo

Si alguna validación falla:

- detener el flujo
- informar el problema
- no ejecutar Cypress

 ## 2. Identificación del spec

Antes de ejecutar Cypress:

- Identificar el spec asociado al ticket Jira.
- Si no puede determinarse automáticamente, informar el problema y solicitar confirmación.
- Nunca ejecutar un spec que no corresponda al ticket.



## 3. EJECUCIÓN
Utilizar el mecanismo de ejecución definido por el proyecto.

Ejemplos:

- npx cypress run --spec "<archivo_spec>"
- npm run test
- script propio del proyecto

Nunca asumir un único mecanismo de ejecución.

Si el archivo no puede determinarse automáticamente:

- identificar el spec correcto antes de ejecutar.

## RESULTADOS DE LA EJECUCIÓN

Registrar siempre:

- Comando ejecutado.
- Tests ejecutados.
- Tests exitosos.
- Tests fallidos.
- Tiempo de ejecución.

Nunca asumir resultados sin ejecutar Cypress.

## Si existen errores

Si Cypress devuelve errores:

- detener el flujo.
- informar el error encontrado.
- no generar commit.
- no realizar push.
- no crear Pull Request.

## Si la ejecución es exitosa

Cuando todos los tests finalicen correctamente:

- informar evidencia al Manager.
- permitir continuar con commit.
- permitir continuar con push.
- permitir continuar con Pull Request.

## Evidencia mínima

Informar siempre:

- Spec ejecutado.
- Cantidad de tests.
- Passing.
- Failing.
- Duración.



## SALIDA OBLIGATORIA

SPEC:

COMANDO_UTILIZADO:

TESTS_EJECUTADOS:

PASSING:

FAILING:

DURACIÓN:

RESULTADO:

✔ Exitoso

✘ Fallido

ESTADO:

• Ejecución completada
• Listo para Execution Validation

## RESTRICCIONES

Nunca:

- modificar código
- crear ramas
- generar commits
- realizar push
- crear Pull Requests

Este skill únicamente ejecuta la automatización y registra el resultado.