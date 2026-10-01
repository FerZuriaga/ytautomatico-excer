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

- crear tickets;
- modificar tickets;
- cambiar estados;
- interactuar con Git;
- modificar código;
- ejecutar pruebas.
---
## CUÁNDO UTILIZAR ESTE SKILL

Utilizar este skill cuando:

- durante una automatización se detecte un posible defecto;
- el usuario solicite validar un bug;
- el usuario solicite un ejemplo de reporte de bug.

No utilizar este skill para crear tickets.

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
   - logs de ejecución
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

- crear tickets;
- modificar tickets;
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

---

### Estándar del ticket (lo valida `lib/bug-validator.js`)

- **Solo estas secciones:** Resumen, Precondiciones, Pasos para
  reproducir, Resultado actual, Resultado esperado, Evidencia y Entorno
  (más Severidad y, opcional, Prioridad). No hay "Observaciones" ni
  secciones libres.
- **Nunca Test Cases ni ciclos en el Bug** (ni keys, ni "TC-02.1", ni
  "casos de prueba"): viven en Xray. Las relaciones con la HU u otros
  Bugs van como enlaces de Jira (`linkTo`, acepta varios), nunca citadas
  en el texto.
- **Evidencia = hechos observables y medibles, como los vería una persona
  usando la app:** qué se hizo, qué mostró la pantalla (textos exactos),
  avisos o errores de consola exactos y la captura. **Sin requests HTTP
  (GET, POST…), rutas, URLs ni parámetros** en ninguna sección salvo
  Entorno, que lleva la URL del sitio (D-22, 2026-09-29): ese detalle
  técnico queda en `docs/discovery/<app>.md`. Caso real: SCRUM-658 citaba
  "GET /notes/api/notes/?search=Pan%20&%20queso"; quedó "buscar "Pan &
  queso" muestra las dos tarjetas…". Es error del validador. Prohibido especular sobre el
  código interno de la app (funciones, componentes, condiciones,
  "probablemente…"): un nombre del código solo se cita si aparece en un
  stack trace real. Caso real: SCRUM-528 explicaba "la condición usa
  cusAddress.street.errors".
- **Sin herramientas internas de la suite en el texto (D-31):** nunca
  `explore-page.js`, `v3/scripts/...`, specs `.cy.js`, `sess.sh`,
  `report.json`, recetas ni otros scripts del framework. Lo que se vio con
  la exploración se redacta como lo vería cualquier persona: "la pantalla
  muestra …", "al hacer clic en … aparece …". Cypress, Chrome y DevTools sí
  se pueden nombrar (herramientas de ejecución y del navegador). Caso
  real: SCRUM-585, 596, 620 y 658 decían "tomada con explore-page.js" y
  hubo que corregirlos. Lo controla `lib/internal-tools.js` desde el
  validador (error).
- **Captura de pantalla obligatoria:** `captura` con el `.png` que deja
  `explore-page.js` (`<out>/screenshots/explore.cy.js/explore.png`, o
  `<out>/<escenario>/screenshots/<escenario>.png` en modo lote) al
  reproducir el defecto en el navegador real durante el discovery. Sin
  captura, con un archivo que no es PNG o con una imagen que no salió de
  una exploración (sin su `report.json`) el Bug no se publica.
  `create-jira-task.js` la adjunta al ticket y lo verifica por lectura.
  Reproducir el defecto con `explore-page.js --actions` hasta el estado
  que lo muestra, así la captura final es la evidencia.

## REGLAS ESPECIALES

Si el usuario únicamente solicita:

- cómo validar un bug
- cómo reportar un bug
- mostrar un ejemplo de reporte

NO debes:

- invocar Manager
- invocar ProductAgent
- crear tickets
- modificar tickets
- cerrar tickets
- comentar tickets

Solo debes mostrar el proceso de validación y el reporte utilizando el formato obligatorio indicado arriba.

### Defecto confirmado durante un lote

No se le pregunta al usuario si se suma al lote (acordado el 2026-09-26:
esa pregunta costó ~5 min de espera en el lote de Checkout). Con el
defecto validado (Pasos 1 y 2): se genera el reporte, el Manager carga
`product-agent` para crear el Bug vinculado a la HU, y el Test Case queda
automatizado con el comportamiento correcto en `it.skip` con "(bug
conocido: KEY)". Se informa en el cierre del lote. Solo se consulta si el
defecto obliga a cambiar el alcance de la HU.

 Si el usuario solicita crear el bug

Si el usuario solicita explícitamente crear el bug como ticket:

1. Confirmar previamente que el bug fue validado.
2. Informar al Manager que la creación del ticket corresponde al rol `product-agent` (el Manager carga esa skill para crearlo).
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