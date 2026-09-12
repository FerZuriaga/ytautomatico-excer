# Official Implementation Contract (v2)

## Objetivo

Definir la implementación oficial utilizada por la arquitectura QA para interactuar con Jira y Zephyr.

Este documento representa el contrato técnico consumido por ProductAgent.

No describe detalles de implementación interna.

---

# Implementación Oficial

La implementación oficial de la arquitectura es:

scripts/create-jira-task.js

Toda operación relacionada con Jira y Zephyr deberá realizarse únicamente mediante esta implementación.

Está prohibido crear implementaciones paralelas para operaciones equivalentes.

Ejemplos prohibidos:

- create-zephyr-testcase.js
- create-story.js
- create-transition.js
- jira-temp.js
- zephyr-temp.js
- cualquier script específico para una única operación

Toda nueva capacidad deberá extender la implementación oficial.

---

# Responsabilidades

La implementación oficial es responsable de:

## Jira

- Crear Historias
- Crear Bugs
- Crear Tareas
- Actualizar Issues
- Realizar transiciones
- Agregar comentarios
- Crear vínculos entre Issues

## Zephyr

- Crear Test Cases
- Crear Test Steps
- Asociar Test Cases con Historias Jira
- Recuperar información necesaria para mantener la trazabilidad

---

# Entradas

La implementación recibe información estructurada proveniente de ProductAgent.

Nunca interpreta escenarios funcionales.

Nunca construye Historias.

Nunca genera Test Cases por sí misma.

Toda la información funcional ya debe encontrarse validada.

---

# Flujo Oficial

Scenario Builder

↓

testcase-model

↓

ProductAgent

↓

create-jira-task.js

↓

Jira

↓

Zephyr

---

# Operaciones soportadas

La implementación deberá soportar progresivamente:

- create-story
- create-bug
- create-task
- update-issue
- transition
- comment
- link-issues
- create-testcase
- create-teststeps

Toda nueva operación deberá agregarse sin romper compatibilidad con las anteriores.

---

# Flujo para Historias

1. Validar datos.
2. Crear Issue Jira.
3. Obtener Issue Key.
4. Devolver resultado a ProductAgent.

---

# Flujo para Test Cases

1. Recibir Modelo Canónico generado por testcase-model.
2. Validar consistencia.
3. Crear Test Case en Zephyr.
4. Obtener Test Case Key.
5. Crear Test Steps.
6. Asociar Test Case con la Historia Jira.
7. Devolver ambos identificadores a ProductAgent.

---

# Modelo recibido desde testcase-model

La implementación espera recibir un modelo canónico independiente de Zephyr.

Debe contener como mínimo:

- título
- objetivo
- precondiciones
- pasos
- resultados esperados
- trazabilidad

La implementación será responsable de traducir ese modelo al formato requerido por la API de Zephyr.

---

# Responsabilidades de traducción

La implementación es responsable de convertir el modelo canónico en el contrato específico de Zephyr.

Ejemplos:

Modelo Canónico

↓

POST /testcases

↓

POST /testcases/{key}/teststeps

Los agentes nunca deberán conocer estos endpoints.

---

# Responsabilidades prohibidas

La implementación nunca debe:

- descubrir escenarios
- crear Historias funcionales
- interpretar reglas de negocio
- generar casos de prueba
- modificar información funcional

Toda esa información proviene de las etapas anteriores.

---

# Trazabilidad

La implementación deberá conservar:

Scenario

↓

Historia Jira

↓

Test Case Zephyr

↓

Test Steps

Los identificadores generados por Jira y Zephyr deberán devolverse a ProductAgent.

---

# Compatibilidad

Toda ampliación futura deberá ser incremental.

Nunca eliminar funcionalidades previamente soportadas.

Nunca romper el contrato existente.

Toda evolución deberá mantener compatibilidad hacia atrás.

---

# Principio Arquitectónico

Los agentes conocen el negocio.

La implementación conoce las APIs.

Nunca invertir esa responsabilidad.