---
name: ticket-analysis

description: >
  Analyze a Jira Story or Test Case before implementation.
  Identify reusable components, technical risks and the
  implementation scope without modifying the project.

when_to_use: >
  Use immediately before starting any implementation.
  This skill must be executed before framework-analysis
  and before writing any code.

---

# Ticket Analysis

## Objetivo

Analizar completamente el ticket antes de comenzar cualquier implementación.

Este skill debe ejecutarse inmediatamente después de recibir un ticket o un Test Case y antes de modificar cualquier archivo del proyecto.

Nunca escribir código durante este análisis.

# RESPONSABILIDAD

Este skill es responsable de:

- comprender completamente el escenario funcional
- analizar el framework existente
- identificar reutilización
- detectar riesgos
- recomendar una estrategia de implementación

Este skill nunca:

- escribe código
- modifica archivos
- ejecuta pruebas
- crea ramas
- realiza cambios sobre el proyecto

# ENTRADA ESPERADA

Este skill espera recibir alguno de los siguientes elementos:

- Historia Jira
- Test Case
- Escenario funcional aprobado

Debe utilizar esa información como fuente oficial del análisis.

Si la información es insuficiente para comprender el escenario, deberá indicarlo en el informe final.



##  SALIDA OBLIGATORIA (ALCANCE DEL ANÁLISIS)

Determinar:

- Alcance funcional.
- Componentes involucrados.
- Page Objects reutilizables.
- Commands reutilizables.
- Fixtures disponibles.
- Helpers existentes.
- Automatizaciones similares.
- Riesgos técnicos.
- Riesgos funcionales.

---

## PROCESO

### Paso 1 — Analizar el escenario

Identificar:

- Qué flujo funcional se automatizará.
- Qué valida el Test Case.
- Qué páginas participan.
- Qué datos necesita.

---

### Paso 2 — Validar la trazabilidad funcional

Verificar que la Historia recibida incluya:

- criterios de aceptación;
- casos de prueba asociados;
- matriz de trazabilidad.

Comprobar que:

- cada criterio tenga al menos un caso de prueba;
- la numeración sea consistente;
- los casos de prueba representen el comportamiento funcional esperado.

Si la documentación funcional es inconsistente o incompleta, detener el análisis e informarlo en el resultado final.

### Paso 3 — Analizar el framework

Revisar:

- Page Objects existentes.
- Custom Commands.
- Helpers.
- Fixtures.
- Utilidades compartidas.

Nunca asumir que algo no existe sin buscarlo primero.


## PRINCIPIO DE REUTILIZACIÓN

Siempre priorizar:

1. Reutilizar.

2. Extender.

3. Crear nuevos componentes.

Nunca invertir este orden.

---

### Paso 3 — Buscar reutilización

Verificar:

- ¿Existe un método que ya haga esta acción?
- ¿Existe un selector reutilizable?
- ¿Existe una automatización similar?
- ¿Puede extenderse una implementación existente?

Está prohibido duplicar código si existe una alternativa reutilizable.

---

### Paso 4 — Detectar riesgos

Analizar posibles riesgos como:

- Selectores frágiles.
- Dependencias entre tests.
- Datos de prueba compartidos.
- Posibles flujos inestables.
- Esperas implícitas.
- Posibles flakiness.

---

### Paso 5 — Generar el informe

Responder utilizando exactamente el siguiente formato.

---

## ANÁLISIS DEL TICKET

OBJETIVO:

PÁGINAS INVOLUCRADAS:

TRAZABILIDAD FUNCIONAL:

- Criterios de aceptación: Completa | Incompleta
- Casos de prueba: Completa | Incompleta
- Matriz de trazabilidad: Completa | Incompleta

PAGE OBJECTS REUTILIZABLES:

CUSTOM COMMANDS DISPONIBLES:

HELPERS DISPONIBLES:

FIXTURES DISPONIBLES:

AUTOMATIZACIONES SIMILARES:

RIESGOS TÉCNICOS:

RIESGOS FUNCIONALES:

COMPONENTES A MODIFICAR:

RECOMENDACIÓN TÉCNICA:

---

## RESULTADO ESPERADO

Al finalizar este skill deberá existir un análisis completo del escenario, una estrategia de reutilización y una recomendación técnica clara para comenzar la implementación.

# REGLAS DE DECISIÓN

No asumir automáticamente que debe crearse un nuevo Page Object.

Antes de recomendar crear nuevos archivos, evaluar obligatoriamente:

- si existe un Page Object que pueda extenderse.
- si existe un método reutilizable.
- si existe una implementación similar.

Solo recomendar crear un nuevo componente cuando exista una justificación técnica clara.

Siempre explicar el motivo de la decisión.

## CONCLUSIÓN FINAL

Todo análisis debe finalizar con un resumen utilizando exactamente este formato:

DECISIÓN:

REUTILIZAR:
- ...

EXTENDER:
- ...

CREAR:
- ...

NO MODIFICAR:
- ...

RIESGO GENERAL:
Bajo | Medio | Alto

LISTO PARA IMPLEMENTAR:
Sí | No

JUSTIFICACIÓN:
Breve explicación técnica de la decisión tomada.



## Restricciones

Nunca:

- escribir código;
- crear ramas;
- modificar archivos;
- ejecutar Cypress;
- generar commits;
- crear Pull Requests.

Este skill únicamente analiza.

Finalizar una vez entregado el informe.