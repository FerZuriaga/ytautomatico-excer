---
name: testcase-model

description: >
  Transforma una especificación funcional proveniente de
  Scenario Builder en un Modelo Canónico de Test Case
  reutilizable por cualquier consumidor del flujo QA.

when_to_use: >
  Utilizar únicamente después de Scenario Builder y antes
  de cualquier componente que necesite consumir un Test Case
  funcional estructurado..

---

# TestCase Model



## Objetivo

Construir un Modelo Canónico de Test Case independiente de la herramienta de gestión de pruebas.

Este skill no conoce la API REST de ninguna herramienta de gestión de pruebas en particular.

Su única responsabilidad es transformar la especificación funcional
en un modelo consistente que posteriormente utilizará ProductAgent.

---

# RESPONSABILIDAD

Este skill es responsable de:

- transformar escenarios funcionales en Test Cases funcionales
- organizar pasos de ejecución
- preservar la trazabilidad
- validar consistencia documental
- preparar la información para ProductAgent

Nunca:

- crea Test Cases en la herramienta de gestión de pruebas
- llama APIs
- ejecuta scripts
- crea Historias
- automatiza pruebas
- modifica archivos

---

# ENTRADA ESPERADA

Debe recibir exclusivamente la salida estructurada de Scenario Builder.

La información esperada incluye:

- escenario funcional
- objetivo
- precondiciones
- criterios de aceptación
- casos de prueba
- matriz de trazabilidad

Nunca deberá solicitar nuevamente esta información.

Scenario Builder constituye la fuente oficial.

---

# OBJETIVO DEL ANÁLISIS

Transformar un Caso de Prueba Funcional en un Modelo Canónico.

El modelo debe poder representarse posteriormente
en cualquier herramienta de gestión de pruebas.

Por ejemplo:

- Zephyr
- Xray
- TestRail
- Azure Test Plans

Sin modificar este skill.

---

# PRINCIPIO DE INDEPENDENCIA

Este skill no conoce:

- endpoints
- APIs
- IDs internos
- campos propios de Zephyr
- formatos REST

Toda adaptación técnica corresponde exclusivamente a ProductAgent.

---

# MODELO CANÓNICO

Cada Test Case deberá contener:

Título

Objetivo

Precondiciones

Pasos

Resultado esperado

Criterio de aceptación asociado

Metadatos funcionales

---

## PASOS

Cada paso deberá dividirse en:

Acción

Datos

Resultado esperado

Ejemplo

Paso 1

Acción:
Ingresar el nombre del empleado.

Datos:
"Linda Anderson"

Resultado esperado:
El valor queda cargado en el campo.

---

No utilizar numeraciones embebidas dentro del texto.

Cada paso representa una unidad funcional.

---

## VALIDACIONES

Antes de finalizar verificar:

✓ existe un objetivo

✓ existe al menos un paso

✓ todos los pasos poseen resultado esperado

✓ todos los pasos pertenecen a un único caso de prueba

✓ todos los casos mantienen trazabilidad con un único criterio

---

## TRAZABILIDAD

Nunca modificar la numeración recibida.

Debe conservar:

CA-01

↓

TC-01.1

↓

Modelo Canónico

La numeración deberá mantenerse intacta.

---

## INFORMACIÓN PROHIBIDA

Nunca incluir:

- endpoints REST
- HTTP
- JSON
- API Keys
- Access Keys
- Secret Keys
- JWT
- Scripts
- Jira
- Zephyr
- Cypress
- Git
- Framework
- Código

---

## SALIDA OBLIGATORIA

TEST_CASE

Título:

Objetivo:

Precondiciones:

Pasos

Paso 1

Acción:

Datos:

Resultado esperado:

----------------

Paso 2

Acción:

Datos:

Resultado esperado:

----------------

Resultado esperado final:

Valida:

CA-XX

Metadatos

Prioridad funcional:

Etiquetas funcionales:

Escenario:

VALIDACIÓN:

✔ Completo | ✘ Incompleto

---

## MATRIZ DE TRAZABILIDAD

Mantener la matriz recibida.

Agregar únicamente la referencia al Modelo Canónico.

Ejemplo

| Escenario | CA | TC | Modelo |
|-----------|----|----|--------|
| Escenario 1 | CA-01 | TC-01.1 | TEST_CASE |

---

## VALIDACIÓN FINAL

Antes de finalizar comprobar:

- ningún criterio quedó sin caso de prueba

- ningún caso quedó sin pasos

- todos los pasos tienen resultado esperado

- la trazabilidad permanece completa

Si alguna validación falla, marcar `VALIDACIÓN: Incompleto` en la salida
obligatoria e informar la inconsistencia encontrada. Este skill no decide
si el flujo continúa — solo reporta; quien lo invocó (Manager o
ProductAgent) decide cómo proceder a partir de ese veredicto.

---

## RESULTADO ESPERADO

Al finalizar deberá existir un único Modelo Canónico de Test Case completamente definido.

Este modelo será consumido posteriormente por ProductAgent para publicarlo en la herramienta de gestión de pruebas configurada.

Este skill finaliza una vez generado dicho modelo.

---

# FORMATO CANÓNICO DE SALIDA

La salida obligatoria de este skill deberá representarse utilizando exactamente la siguiente estructura lógica:

```json
{
  "projectKey": "",
  "name": "",
  "objective": "",
  "precondition": "",
  "priorityName": "Normal",
  "statusName": "Draft",
  "labels": [],
  "folder": "",
  "criterio": "CA-01",
  "tipo": "positivo",
  "steps": [
    {
      "inline": 1,
      "description": "",
      "testData": "",
      "expectedResult": ""
    }
  ],
  "traceability": {
    "scenario": "",
    "testCase": ""
  }
}
```

## TRAZABILIDAD CON EL CRITERIO DE ACEPTACIÓN (`criterio`)

La propiedad `criterio` es OBLIGATORIA cuando el Test Case se publica
junto con su Historia: contiene el id exacto del Criterio de Aceptación
que valida (`"CA-01"`, `"CA-02"`, ...), tal como aparece al inicio de
cada criterio de la Historia (`"CA-01: El sistema debe..."`). Reemplaza
al antiguo `traceability.acceptanceCriteria` (texto libre, no auditable):
es la única fuente de la relación TC -> CA.

`create-jira-task.js` la audita antes de publicar
(`v3/scripts/lib/testcase-validator.js`): cada TC debe apuntar a un CA
existente de su Historia, y cada CA debe tener entre 2 y 5 TC.

## TIPO DE CASO (`tipo`)

`tipo` vale `"positivo"` (el sistema hace lo esperado) o `"negativo"`
(validación, restricción, error o intento inválido). Permite auditar la
regla de `scenario-builder` de al menos un caso negativo por criterio: un
CA sin ningún caso negativo es WARNING del validador (no error, porque
no todo criterio lo justifica).

## ORGANIZACIÓN FUNCIONAL (FOLDER)

La propiedad `folder` representa la ubicación organizativa del Test Case
dentro del árbol de módulos funcionales del sistema bajo prueba — un
concepto genérico de organización (toda herramienta de gestión de
pruebas admite agrupar casos en carpetas o suites), no un detalle técnico
de ninguna herramienta en particular.

Formato: ruta jerárquica separada por `/`, con el módulo principal
numerado y, opcionalmente, un sub-módulo o pantalla específica.

Ejemplos:

- `/01 - Auth & Login`
- `/02 - My Info/Contact Details`
- `/03 - Leave Management/Leave List`

Reglas:

- El número y nombre asignado a un módulo funcional debe mantenerse
  **idéntico** entre distintas invocaciones de este skill para el mismo
  sistema bajo prueba (ej. no usar `/02 - My Info` en una sesión y
  `/2 - My Info` o `/02 - Mi Info` en otra) — la herramienta de gestión
  de pruebas resuelve la carpeta por coincidencia exacta de nombre.
- Nunca incluir `/` ni `\` dentro del nombre de un segmento (son los
  separadores de la ruta).
- Si no se puede determinar con confianza el módulo funcional, dejar
  `folder` vacío (`""`) en vez de inventar una ruta.

## REGLAS

Este formato constituye el Modelo Canónico oficial del proyecto.

Todos los consumidores deberán reutilizar exactamente esta estructura.

Nunca modificar nombres de propiedades.

Nunca agregar propiedades específicas de:

- Zephyr
- Jira
- Xray
- TestRail

Toda adaptación hacia una herramienta deberá realizarse fuera de este skill.