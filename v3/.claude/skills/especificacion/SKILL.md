---
name: especificacion

description: >
  Convierte una funcionalidad relevada en escenarios, Historia(s) con
  Criterios de Aceptación y Test Cases en Modelo Canónico, listos para
  que product-agent los publique.

when_to_use: >
  Después de `discovery` (Parte B) y antes de publicar en Jira/Xray.

---

# Especificación (escenarios → HU → CA → Test Cases)

Reemplaza a `scenario-builder` y `testcase-model` (archivadas en
`v3/.claude/skills-archive/`). Piensa como QA funcional: nunca habla de
código, selectores, frameworks ni herramientas de gestión.

## Fase 1 — Escenarios (y esperar selección)

Con las reglas relevadas en `discovery`, listar TODOS los escenarios
funcionales reales de la funcionalidad, agrupados en **positivos,
negativos, alternativos y edge cases**, con prioridad y motivo:

- ⭐⭐⭐ flujo principal / alto impacto / alta probabilidad de regresión
- ⭐⭐ variantes importantes, validaciones secundarias
- ⭐ edge cases y casos poco frecuentes

Si no hay negativos reales, decirlo explícitamente (en apps de práctica,
la falta de validaciones visibles no implica que no haya negativos).
Agregar LIMITACIONES O POSIBLES DEFECTOS (ver abajo). Recomendar una
selección y **terminar el turno**: el usuario decide.

**Lo aprobado no se cambia en silencio.** Si al escribir la Fase 2 la
estructura aprobada cambia (cantidad de HU o de CA, escenarios que se
suman o se caen), consultar al usuario ANTES de publicar, no avisar
después (caso real: SCRUM-485 se aprobó con 4 CA y se publicó con 3).

## Fase 2 — Historia de Usuario

- **Como:** rol concreto (nunca "usuario" a secas). **Quiero:** la
  capacidad. **Para:** beneficio de negocio que no repite el "Quiero".
- **Objetivo:** resultado de negocio; nunca empieza con "Verificar".
- **Lenguaje de negocio:** sin rutas, URLs ni términos técnicos (iframe,
  backend, almacenamiento local). Sí textos visibles (botones, mensajes).
- Una HU = una capacidad de negocio. Las acciones destructivas van en HU
  aparte.
- Secciones opcionales de la HU (van a Jira si se completan):
  `reglasNegocio` (reglas relevadas que la HU respeta, ej. "un solo Thor
  Hammer por carrito"), `fueraDeAlcance`, `defectosConocidos` (keys de
  Bugs relacionados).

## Criterios de Aceptación

- Salen de las reglas relevadas, no de un número objetivo: **2 a 4 por
  HU** (menos de 2 = falta discovery; más de 4 = evaluar split).
- **Una regla por criterio, en una sola oración.** Si un texto junta dos
  comportamientos que pueden fallar por separado, son dos criterios o dos
  casos. Si la segunda parte es la definición o el caso negativo de la
  misma regla, se redacta como una sola oración (ej. "3 intentos fallidos
  seguidos, sin un ingreso exitoso entre ellos, bloquean la cuenta"), no
  unida con ";". Partir un criterio no justifica inventar casos para
  llegar al mínimo de 2. El validador avisa (criterio compuesto).
- Id al inicio: `"CA-01: ..."`. Numeración global sin reinicios.
- Un resultado negativo de una regla ya cubierta es un caso de ese
  criterio, no un criterio nuevo.
- **Comportamiento relevado ≠ requisito:** si lo que la app hace hoy
  contradice el "Para" (ej. perder datos guardados), NO es criterio: va a
  LIMITACIONES O POSIBLES DEFECTOS (y a `bug-reporting` si corresponde).
  Caso real: SCRUM-338 CA-04.

## Test Cases

- **2 a 5 por criterio**, cada uno valida un solo comportamiento y es
  ejecutable a mano por un tester sin conocer el código.
- Al menos un caso **negativo** por criterio. Si un criterio no lo
  admite (pantalla de consulta, opción que se activa y desactiva), no
  inventarlo: justificarlo en `historia.sinNegativo["CA-XX"]` con el
  motivo (queda escrito en la HU en Jira).
- **Precondición separada:** sesión iniciada, datos semilla, estado
  previo. Nunca repetida como acción del Paso 1.
- **Paso 1:** la acción es entrar a la pantalla objetivo (la que se
  prueba, no una intermedia: si se prueba el carrito, "Abrir el carrito
  desde el ícono del menú", no "Navegar a la Home"); el estado inicial va
  en su resultado esperado. **Un paso por acción verificable** (2 es el
  mínimo, no el molde); nunca varias acciones en un paso.
- **Sin pasos de relleno.** Cada paso es una acción real del usuario que
  produce un resultado nuevo. "Observar el menú" no es una acción (lo
  observado va en el resultado esperado del paso anterior) y "Abrir
  nuevamente ..." repite una acción sin validar nada nuevo. Si un caso no
  llega a 2 pasos con acciones reales, el recorrido está mal elegido:
  buscar el camino natural del usuario (ej. entrar a "My account" desde el
  menú en vez de por la dirección). Casos reales: SCRUM-499/500. El
  validador avisa (paso de relleno).
- **La acción describe solo lo que hace el usuario.** Nunca "y verificar",
  "comprobar", "validar" ni "revisar que" en la acción: lo que se controla
  va en el resultado esperado (el validador lo marca como ERROR). Caso real:
  SCRUM-477 ("Hacer clic en el carrito y verificar su contenido").
- **Datos de prueba en la columna Datos** (`testData`), nunca dentro del
  texto de la acción: si el seed cambia, se corrige solo el dato.
- Resultado esperado observable y concreto (textos exactos, cantidades).
- Elegir datos que no choquen con defectos conocidos ni con reglas
  ocultas del backend (verificadas en `discovery`).

## Modelo Canónico (uno por TC-XX.Y)

```json
{
  "projectKey": "SCRUM",
  "name": "",
  "objective": "Verificar que ...",
  "precondition": "",
  "priorityName": "Normal | High",
  "statusName": "Draft",
  "labels": [],
  "folder": "/<App>/<Modulo>",
  "criterio": "CA-01",
  "tipo": "positivo | negativo",
  "steps": [{ "inline": 1, "description": "", "testData": "-", "expectedResult": "" }],
  "traceability": { "scenario": "", "testCase": "TC-01.1" }
}
```

- `criterio` y `tipo` son obligatorios: se publican como labels en Xray y
  los audita `check-traceability.js`.
- `folder`: la misma ruta exacta para todos los lotes de la app.
- Nunca agregar campos propios de una herramienta: la adaptación la hace
  `product-agent` con `create-jira-task.js`.

## Salida (entrada de product-agent)

Por cada HU: Como/Quiero/Para, Contexto, Objetivo, criterios `CA-XX`,
secciones opcionales, `sinNegativo` si aplica, los Modelos Canónicos y la
matriz de trazabilidad (`| CA | TC |`). Más: RIESGOS O AMBIGÜEDADES y
LIMITACIONES O POSIBLES DEFECTOS.

El validador de `create-jira-task.js --dry-run` controla estas reglas
antes de publicar: corregir el payload ante cada error o warning.
