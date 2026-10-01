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

Es la **única pausa del lote** (D-30): en el mismo mensaje van los
escenarios, el alcance propuesto (HU y CA), las dudas y los archivos
compartidos que se van a tocar, separando los de patrón conocido
(informados, no se preguntan) de los que necesitan aprobación. Después
de la respuesta no se vuelve a preguntar salvo que aparezca algo nuevo
que no estaba en esa lista.

**Lo aprobado no se cambia en silencio.** Si al escribir la Fase 2 la
estructura aprobada cambia (cantidad de HU o de CA, escenarios que se
suman o se caen), consultar al usuario ANTES de publicar, no avisar
después (caso real: SCRUM-485 se aprobó con 4 CA y se publicó con 3).

**Coherencia con las HU hermanas (D-32).** Antes de redactar la HU, leer
las HU publicadas de la misma app: un mensaje de pantalla se cita igual en
todas (con su contexto: pestaña All o categoría), una regla tiene un solo
dueño y lo que otra HU dejó fuera de alcance se toma explícitamente
(actualizando esa HU). `create-jira-task.js --dry-run` lo avisa, pero el
chequeo es por palabras: no reemplaza leerlas. Caso real: SCRUM-659 citaba
"You have completed all notes" donde SCRUM-635 (bien) decía "...in the
<categoría> category".

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
- **Sin contradicciones entre secciones:** una regla que queda fuera de
  alcance no se lista en `reglasNegocio` ni dentro de un criterio (casos
  reales: SCRUM-586 listaba "15 por página" y a la vez dejaba la
  paginación fuera de alcance; SCRUM-717 decía "título de 4 a 100
  caracteres" en el CA y dejaba "los largos máximos" fuera de alcance, sin
  TC para el máximo). Antes de publicar, releer cada línea de
  `fueraDeAlcance` contra los criterios: **cada límite que nombra un CA
  (mínimo y máximo) tiene su TC**.
- **Una justificación de `sinNegativo` tiene que ser verdad:** si el código
  muestra un camino de error (ej. el servidor no pudo borrar), no es "no
  hay nada que rechazar"; es "no se puede provocar desde la pantalla", y
  va también en `fueraDeAlcance` (caso real: SCRUM-730 CA-02).

## Criterios de Aceptación

- Salen de las reglas relevadas, no de un número objetivo: **2 a 4 por
  HU** (menos de 2 = falta discovery; más de 4 = evaluar split).
- **Una regla por criterio, en una sola oración.** Si un texto junta dos
  comportamientos que pueden fallar por separado, son dos criterios o dos
  casos. Si la segunda parte es la definición o el caso negativo de la
  misma regla, se redacta como una sola oración (ej. "3 intentos fallidos
  seguidos, sin un ingreso exitoso entre ellos, bloquean la cuenta"), no
  unida con ";". Partir un criterio no justifica inventar casos para
  llegar al mínimo de 2. El validador avisa (criterio compuesto), también
  con "mientras que", "en cambio", "y si no" y ", y sin" (caso real:
  SCRUM-502 CA-01 "con sesión avanza…, mientras que sin sesión se le
  pide…").
- Id al inicio: `"CA-01: ..."`. Numeración global sin reinicios.
- Un resultado negativo de una regla ya cubierta es un caso de ese
  criterio, no un criterio nuevo.
- **Cada TC pertenece a la regla de su CA, no a una vecina.** Antes de
  asignarlo, preguntarse qué regla se rompe si el TC falla: esa es su CA.
  Tampoco se meten reglas distintas en un criterio para no pasar de 4.
  Casos reales: "factura inexistente" estaba bajo "solo ve sus propias
  facturas" (es el negativo del detalle, SCRUM-593 → CA-02); "distinta de
  la actual" estaba dentro de "reglas de seguridad" (CA-08 propio).
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
  **Excepción: los mensajes que redacta el servidor** (errores de
  validación de una API) se describen por su significado ("se muestra un
  aviso que indica que la contraseña actual no es correcta") más la
  consecuencia de la regla ("y la contraseña no cambia"), no copiados
  palabra por palabra: si el equipo corrige la redacción, la regla se
  sigue cumpliendo y el TC no tiene que cambiar. Los textos propios de la
  pantalla (etiquetas, avisos del front) sí van exactos. Caso real:
  SCRUM-578..584 copiaban "does not matches" y "(and 3 more errors)".
- Elegir datos que no choquen con defectos conocidos ni con reglas
  ocultas del backend (verificadas en `discovery`).
- **Los TC se arman por la regla del CA, nunca según un bug.** Si un
  defecto rompe la regla del CA, todos los TC que la validan quedan en
  espera (`it.skip` con "(bug conocido: KEY)"), aunque una parte "pase":
  partir el TC para que una mitad quede en verde muestra el CA cumplido
  cuando no lo está. Tampoco se valida el síntoma del bug como si fuera el
  resultado. Casos reales: SCRUM-508 CA-03 (país/CP pasaba y calle/ciudad
  en espera) y SCRUM-514 CA-07 (el TC en verde validaba "Payment was
  successful", justo lo que muestra el Bug SCRUM-525 sin crear el pedido).
  Si el defecto afecta solo un resultado secundario que no es la regla del
  CA, ese resultado sale del TC y queda en `defectosConocidos`: el TC
  corre con lo que la regla exige (SCRUM-508 CA-04: no avanzar sin la
  calle corre; el campo sin marcar es el Bug SCRUM-528).
  `check-traceability.js` avisa si un CA queda con todos sus negativos en
  `it.skip`.

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
  "evidencia": { "reporte": "<report.json de explore-page.js>", "observado": "Se muestra \"<mensaje exacto>\" ..." },
  "steps": [{ "inline": 1, "description": "", "testData": "-", "expectedResult": "" }],
  "traceability": { "scenario": "", "testCase": "TC-01.1" }
}
```

- `criterio` y `tipo` son obligatorios: se publican como labels en Xray y
  los audita `check-traceability.js`.
- `folder`: la misma ruta exacta para todos los lotes de la app.
- `evidencia` es **obligatoria en cada caso negativo**: el `report.json`
  de `explore-page.js` donde se probó ese caso en el discovery y lo que se
  observó (textos exactos entre comillas). Sin ella `create-jira-task.js`
  no publica; si el informe no lo generó `explore-page.js` o la
  exploración se cortó, tampoco. Un texto entre comillas que no aparece en
  la exploración da warning. Los positivos no la llevan. Esta evidencia
  queda en el payload y no se publica.
- **Lo que se publica no nombra herramientas internas de la suite (D-31):**
  nombre, objetivo, precondición, pasos, datos y resultados de los TC, y
  todos los textos de la HU, sin `explore-page.js`, `v3/scripts/...`,
  specs, recetas ni `report.json`. Es error del validador.
- Nunca agregar campos propios de una herramienta: la adaptación la hace
  `product-agent` con `create-jira-task.js`.

## Salida (entrada de product-agent)

Por cada HU: Como/Quiero/Para, Contexto, Objetivo, criterios `CA-XX`,
secciones opcionales, `sinNegativo` si aplica, los Modelos Canónicos y la
matriz de trazabilidad (`| CA | TC |`). Más: RIESGOS O AMBIGÜEDADES y
LIMITACIONES O POSIBLES DEFECTOS.

El payload se escribe como **archivo de lote** (`"formato": "lote"`,
formato en `v3/scripts/lib/payload-builder.js`): pasos con nombre,
`datos` reutilizables, TC numerados solos por CA, evidencia del negativo
por nombre de escenario de `explore-page` y ciclo por defecto. Nunca un
`build-*.js` suelto. El validador de `create-jira-task.js --dry-run`
controla estas reglas antes de publicar (sobre el payload ya armado):
corregir el lote ante cada error o warning.
