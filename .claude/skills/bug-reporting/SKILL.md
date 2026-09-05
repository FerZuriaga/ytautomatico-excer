---
name: "bug-reporting"
description: "Valida y documenta un posible defecto detectado durante la automatización."
when:
  - cuando se detecta un posible bug durante una automatización
  - cuando el usuario solicita validar un bug
  - cuando el usuario solicita un ejemplo de reporte de bug
---

## Objetivo

Este skill debe utilizarse cuando durante una automatización se detecte un posible defecto de la aplicación o cuando el usuario solicite mostrar cómo validar o reportar un bug.


## RESPONSABILIDADES

Este skill únicamente debe:

- Validar que el problema corresponda a un defecto de la aplicación.
- Descartar falsos positivos.
- Documentar la evidencia disponible.
- Generar un reporte estructurado.

Nunca debe:

- crear tickets Jira;
- modificar tickets Jira;
- cambiar estados;
- interactuar con Git;
- modificar código;
- ejecutar Cypress.
---
## CUÁNDO UTILIZAR ESTE SKILL

Utilizar este skill cuando:

- durante una automatización se detecte un posible defecto;
- el usuario solicite validar un bug;
- el usuario solicite un ejemplo de reporte de bug.

No utilizar este skill para crear tickets Jira.

## ENTRADAS ESPERADAS

Este skill espera recibir alguno de los siguientes elementos:

- resultado de una automatización;
- evidencia del problema;
- pasos para reproducir;
- descripción del comportamiento observado.

Si no existe evidencia suficiente:

- informar la limitación;
- indicar qué información falta.

## Flujo obligatorio

### Paso 1 — Validar que no sea un falso positivo

Antes de considerar un bug de la aplicación, verificar que la falla no provenga de:

- la automatización
- datos inválidos
- configuración incorrecta
- selectores defectuosos
- problemas de timing
- errores del entorno

Nunca reportar un bug sin validar previamente estas causas.

---

### Paso 2 — Validación

Realizar el siguiente proceso:

1. Reproducir el comportamiento manualmente.
2. Comparar el comportamiento manual con la automatización.
3. Verificar que el problema sea reproducible.
4. Comparar Resultado Esperado vs Resultado Obtenido.
5. Recolectar evidencia disponible:
   - screenshots
   - videos
   - logs de Cypress
   - mensajes de error
   - URL
   - datos utilizados

Solo si el problema puede reproducirse y no proviene del test, considerar el bug como confirmado.

---

### Paso 3 — Reporte

Si el bug queda confirmado, responder SIEMPRE utilizando exactamente el siguiente formato.

No utilizar tablas.

No utilizar criterios de aceptación.

No utilizar historias de usuario.

No reemplazar este formato por otro.

## RESTRICCIONES

Este skill nunca debe:

- crear tickets Jira;
- modificar tickets Jira;
- cambiar estados;
- interactuar con ProductAgent;
- modificar código;
- ejecutar herramientas distintas al proceso de validación.

Finalizar una vez generado el reporte.

Formato obligatorio:

BUG_ID:

TÍTULO:

SEVERIDAD:

PRIORIDAD:

PRECONDICIONES:

PASOS_DE_REPRODUCCIÓN:

RESULTADO_ESPERADO:

RESULTADO_OBTENIDO:

EVIDENCIA:

ENTORNO:

OBSERVACIONES:

---

## REGLAS ESPECIALES

Si el usuario únicamente solicita:

- cómo validar un bug
- cómo reportar un bug
- mostrar un ejemplo de reporte

NO debes:

- invocar Manager
- invocar ProductAgent
- crear tickets Jira
- modificar Jira
- cerrar tickets
- comentar tickets

Solo debes mostrar el proceso de validación y el reporte utilizando el formato obligatorio indicado arriba.

 Si el usuario solicita crear el bug

Si el usuario solicita explícitamente crear el bug en Jira:

1. Confirmar previamente que el bug fue validado.
2. Informar que la creación del ticket debe ser delegada al Manager Agent.
3. No crear el ticket directamente.

Nunca inventar información.

Si algún dato no fue validado durante la ejecución
(Browser, Severidad, Prioridad, Reproducibilidad, Alcance, etc.)
debe indicarse como:

"No validado"

o

"Pendiente de confirmar"

Nunca asumir información.
---



## SALIDA ESPERADA

El resultado debe contener:

- validación del defecto;
- evidencia disponible;
- nivel de confianza;
- reporte estructurado;
- estado final de la validación.