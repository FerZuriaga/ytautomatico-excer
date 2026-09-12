---
name: "executive-summary"
description: "Genera un resumen ejecutivo a partir de uno o varios análisis técnicos."
when_to_use :
  - cuando el usuario solicita un resumen
  - cuando el usuario solicita una versión ejecutiva
  - cuando finaliza un análisis técnico
  - antes de informar el resultado al Manager
---

# Executive Summary

## Objetivo

Transformar el resultado de uno o varios análisis técnicos en un resumen ejecutivo, fácil de leer y orientado a la toma de decisiones.

Este skill nunca modifica el análisis realizado.

Nunca elimina información crítica.

Únicamente resume la presentación para el usuario.

---

## RESPONSABILIDADES

Este skill únicamente debe:

- Resumir uno o varios análisis técnicos.
- Conservar las conclusiones relevantes.
- Facilitar la toma de decisiones.
- Generar un resumen claro y conciso.

Nunca debe:

- modificar el análisis original;
- alterar las conclusiones;
- inventar información;
- escribir código;
- ejecutar herramientas;
- reemplazar el análisis técnico.

## Cuándo utilizarlo

Utilizar este skill cuando:

- El usuario solicite un resumen.
- El usuario solicite una versión ejecutiva.
- El usuario solicite una respuesta breve.
- Se hayan ejecutado uno o más análisis técnicos (Framework Analysis, Ticket Analysis, Automation Review, Execution & Validation, etc.).
- Se necesite presentar una conclusión antes de continuar con la implementación.

No utilizar este skill para reemplazar los análisis técnicos.

Los análisis completos siempre deben existir antes del resumen.

---

## ENTRADAS ESPERADAS

Este skill espera recibir:

- uno o varios análisis técnicos;
- resultados de automatización;
- informes de revisión;
- reportes de ejecución.

Si no existe información suficiente para resumir:

- informar la limitación;
- solicitar el análisis correspondiente.

## Objetivo del resumen

El resumen debe responder rápidamente:

- ¿Qué se analizó?
- ¿Qué se reutiliza?
- ¿Qué debe crearse?
- ¿Qué riesgos existen?
- ¿Está listo para continuar?

---

## SALIDA ESPERADA

El resultado debe contener:

- objetivo;
- componentes relevantes;
- riesgos principales;
- recomendaciones;
- estado;
- siguiente paso.

Nunca modificar el contenido técnico.

Únicamente resumirlo.

## Formato obligatorio

Generar siempre el siguiente formato:

RESUMEN EJECUTIVO

OBJETIVO:

COMPONENTES_REUTILIZABLES:

COMPONENTES_NUEVOS:

RIESGOS_CRÍTICOS:

RECOMENDACIONES:

ESTADO:

SIGUIENTE_PASO:

---

## Reglas

Nunca copiar el análisis completo.

Nunca repetir tablas extensas.

Nunca incluir razonamientos internos.

Resumir únicamente las conclusiones.

---



## Ejemplo

RESUMEN EJECUTIVO

OBJETIVO:
Analizar el escenario antes de implementar.

COMPONENTES_REUTILIZABLES:
- Page Objects existentes
- Commands existentes

COMPONENTES_NUEVOS:

- Componentes requeridos por el escenario
- Métodos nuevos (si fueran necesarios)

RIESGOS_CRÍTICOS:
- Selectores dinámicos.
- Dependencias compartidas.

RECOMENDACIONES:
Reutilizar la arquitectura existente y extender únicamente los componentes necesarios.

ESTADO:
Listo para implementar.

SIGUIENTE_PASO:
Comenzar la implementación.

---

## RESTRICCIONES

Este skill nunca debe:

- modificar código;
- crear tickets;
- ejecutar pruebas;
- generar commits;
- interactuar con Git;
- reemplazar el análisis original.

Finalizar una vez generado el resumen.