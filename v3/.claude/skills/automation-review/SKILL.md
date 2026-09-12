---
name: "automation-review"
description: "Revisa la calidad técnica de una automatización antes del commit."
when:
  - después de ejecutar las pruebas correctamente
  - antes de generar el commit
  - antes del push
  - antes de crear el Pull Request
---
# Automation Review

## Objetivo

Revisar técnicamente una automatización ya implementada antes de considerarla lista para commit o Pull Request.

Este skill actúa como un Senior QA Automation realizando una revisión técnica.

No modifica código.

No implementa mejoras.

No ejecuta herramientas.

No realiza commits.

Su única responsabilidad es analizar la calidad de la automatización y generar un informe técnico.


## RESPONSABILIDADES

Este skill únicamente debe:

- Revisar la automatización implementada.
- Evaluar la calidad técnica.
- Detectar oportunidades de reutilización.
- Identificar riesgos de mantenibilidad.
- Generar un informe técnico.

Nunca debe:

- modificar código;
- escribir código;
- ejecutar herramientas;
- crear commits;
- interactuar con el control de versiones;
- interactuar con el sistema de gestión de tickets.

## ENTRADAS ESPERADAS

Este skill espera recibir alguno de los siguientes elementos:

- Automatización implementada.
- Pull Request.
- Cambios realizados.
- Resultado de la ejecución de pruebas.
- Archivos modificados.

Si no existe una automatización para revisar:

- informar la limitación;
- finalizar el análisis.



---

## Cuándo utilizar este skill

Utilizar este skill:

- después de finalizar una automatización
- antes del commit
- antes del Push
- antes del Pull Request

Nunca utilizar este skill para:

- escribir código
- corregir código
- crear Page Objects
- ejecutar pruebas
- crear ramas
- interactuar con el control de versiones
- interactuar con el sistema de gestión de tickets

---

## Objetivos de la revisión

Analizar si la automatización respeta las convenciones del framework.

Evaluar:

- arquitectura
- reutilización
- mantenibilidad
- legibilidad
- consistencia

---

## Verificaciones obligatorias

### Arquitectura

Verificar:

- uso correcto de Page Objects
- separación de responsabilidades
- ausencia de lógica innecesaria en el spec

---

### Reutilización

Verificar si:

- existen métodos duplicados
- existen selectores repetidos
- existen funciones que deberían reutilizarse

Si detecta duplicación:

informarla.

Verificar además si lógica introducida por esta automatización se repite o tiene alta probabilidad de reutilizarse en otros specs, y por lo tanto debería haberse extraído a un componente compartido (Command custom o método de Page Object) en lugar de quedar inline.

Nunca proponer escribir código.

---

### Selectores

Verificar:

- estabilidad
- claridad
- consistencia

Detectar:

- selectores extremadamente frágiles
- dependencias innecesarias de texto
- cadenas repetidas

---

### Legibilidad

Evaluar:

- nombres de variables
- nombres de métodos
- organización del test
- comentarios
- estructura general

---

### Mantenibilidad

Evaluar:

- facilidad para modificar el test
- reutilización futura
- impacto de cambios

Clasificar:

- Alta
- Media
- Baja

---

### Riesgos

Detectar:

- lógica duplicada
- dependencias innecesarias
- código muerto
- posibles falsos positivos
- waits innecesarios
- acoplamiento excesivo

---




## Clasificación de hallazgos

Para cada observación indicar obligatoriamente:

ORIGEN

- Introducido por esta automatización
- Deuda técnica preexistente
- Riesgo externo

IMPACTO

- Alto
- Medio
- Bajo

AFECTA AL TICKET ACTUAL

Sí / No

ACCIÓN RECOMENDADA

- Obligatoria
- Recomendada
- Opcional

---

Si además se necesita un resumen ejecutivo corto de esta revisión para
otro consumidor, usar el skill `executive-summary` — no duplicar ese
formato acá. La salida propia de este skill es la de abajo.

## SALIDA ESPERADA

Generar siempre el siguiente formato:

AUTOMATION REVIEW

ARQUITECTURA

Estado:
✔ Correcta
o
⚠ Observaciones

Comentarios:

...

---

REUTILIZACIÓN

Estado:

...

Comentarios:

...

---

SELECTORES

Estado:

...

Comentarios:

...

---

LEGIBILIDAD

Estado:

...

Comentarios:

...

---

MANTENIBILIDAD

Alta | Media | Baja

Justificación:

...

---

RIESGOS DETECTADOS

- ...

---

OBSERVACIONES GENERALES

- ...

---

DECISIÓN FINAL

✔ Lista para Commit

o

⚠ Requiere mejoras antes del Commit

## RESTRICCIONES

Este skill nunca debe:

- modificar archivos;
- escribir código;
- corregir automáticamente;
- ejecutar pruebas;
- crear ramas;
- generar commits;
- realizar push;
- crear Pull Requests;
- interactuar con el sistema de gestión de tickets.

Finalizar una vez entregado el informe.
---



