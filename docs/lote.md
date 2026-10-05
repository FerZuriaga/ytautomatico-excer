# Cómo se hace un lote

Único documento de trabajo del asistente para automatizar una
funcionalidad, de punta a punta. Reemplaza a las 10 skills de la v3
(archivadas en la etiqueta git `legado-2026-10-03`, ver D-36).

- **Qué hacer y con qué comando:** este documento.
- **Por qué** de cada regla: `docs/decisiones.md` (se cita como D-xx).
- **El control:** los validadores de los scripts. Lo que un validador ya
  frena no se repite acá; acá queda lo que ningún código controla.

Todo en el hilo principal, sin subagentes (D-01). Archivos auxiliares
(payloads, informes, bodies de PR) en el scratchpad, nunca en el repo
(D-03).

---

## 0. Antes de empezar

1. `node v3/scripts/create-pull-request.js --action wip-check`. Con más de
   2 PRs abiertos, proponer mergear o cerrar antes (D-05).
2. Si el pedido trae un ticket, una HU o una rama: buscar ramas (locales y
   remotas), PRs y tickets de ese alcance y seguir desde el punto más
   avanzado. Nunca asumir que un ticket "Tareas por hacer" parte de cero.
   Si solo trae una app o URL: discovery Parte A.
3. Leer `docs/discovery/<app>.md` y los specs de la misma familia para
   precargar los gotchas ya conocidos (D-15).

`--health` no se corre al empezar: solo a pedido o si una falla parece
ajena a la rama (D-35).

---

## 1. Discovery (PASO 1)

### Parte A — App nueva (solo si el usuario da una app o URL)

Fuentes en orden: documentación oficial → catálogo oficial de casos →
guía de usuario → la app misma. Recorrer la app completa. Cada
funcionalidad se marca OBSERVADA o INFERIDA (nunca inventar módulos), se
ordena de menor a mayor complejidad y se recomienda por dónde empezar.
Salida: lista numerada (agrupada por módulo si son más de ~10) con
riesgos del entorno (datos compartidos, cuentas demo). Terminar el turno:
el usuario elige. Una app nueva se declara en `apps` de
`qa.config.json` (D-28).

### Parte B — La funcionalidad elegida

| Qué | Cómo |
|---|---|
| Reglas de negocio (validaciones, límites, textos) | `bundle-scan.json` que deja `explore-page.js` (pista, no evidencia). Nunca leer el bundle minificado a mano. |
| Datos de prueba y conteos | API/HTML directo con los mismos parámetros que el front |
| Comportamiento real | `node v3/scripts/explore-page.js --scenarios <archivo.json> --out <scratchpad>` |

- **Todas las exploraciones del lote en un solo archivo `--scenarios`**
  (formato en `lib/explore-scenarios.js`): la carga, el camino del test y
  cada caso negativo, cada uno con nombre (D-14). Si uno falla, se corre
  otro archivo solo con lo que falte.
- Una sola pantalla: `--url <url>`; pantallas internas `--actions`;
  sesión o estado precargado `--storage`; adaptador dentro de Cypress
  `--init-script` (ver el encabezado del script).
- **Datos por receta** (`v3/data-recipes/<app>.json`, `"data": [...]` en
  el escenario). Si falta una receta, se agrega al JSON y se commitea.
  Nunca scripts sueltos (D-14).
- **Explorar el mismo camino que usará el test** (sesión inyectada,
  entrada directa a una pantalla interna), no solo el de la UI (D-12).
- **Cada negativo se ejecuta antes de especificarlo** y se anota lo
  observado (mensaje exacto, estado del campo y del botón). Lo que no se
  observó no es resultado esperado (D-13).

Del informe, mirar siempre:
- el resumen final "⚠ Excepciones y errores de consola": una excepción de
  la app tira cualquier test de Cypress; decidir antes si es defecto o se
  maneja en el comando de la app;
- método HTTP real de cada request (no asumir GET) y requests sin
  respuesta;
- idioma del documento vs. del navegador;
- `data-test` duplicados u ocultos, campos sin atributo de test;
- localStorage/sessionStorage que condicione el estado;
- recargas completas de página (`location.href=`, `reload()`, redirección
  por 401): todo lo instalado en la ventana se pierde.

Contra la API: ids estables (si la base se re-siembra, ubicar por texto
visible), datos que nadie más modifica, reglas ocultas del backend con
los datos elegidos. En entornos ajenos, nada irreversible (D-16).

**Artefactos (se commitean, nunca se borran):** selectores en
`cypress/fixtures/selectors/<app>/<modulo>.json`; hallazgos que valen para
2+ módulos en `docs/discovery/<app>.md`. Prohibido adivinar selectores.
Un selector, ruta o texto que usan 2+ pantallas va una sola vez en
`<app>/comunes.json` y el módulo lo referencia (`"@comun.<ruta>"`), nunca
copiado (D-44; hoy en Notes App).

---

## 2. Especificación

### La única pausa del lote (D-30)

Al terminar el discovery, UN mensaje con:
- escenarios positivos, negativos, alternativos y bordes, con prioridad
  (⭐⭐⭐ flujo principal / ⭐⭐ variantes / ⭐ bordes) y una selección
  recomendada;
- alcance propuesto: HU y sus CA, con los TC de cada CA contados contra
  el mínimo de 2 antes de mandar el mensaje. Si un CA queda con uno, su
  segundo TC se explora y se propone en esta pausa, no después (ParaBank
  CA-05, 2026-10-05: la falta apareció recién en el dry-run y costó una
  pregunta extra);
- dudas de alcance o datos y posibles defectos;
- archivos compartidos que se van a tocar: los de patrón conocido se
  informan (URL `<app>Url` en el config, `import './commands/<app>'`,
  `apps` de `qa.config.json`, `test:<app>`, filas del README); cualquier otro cambio en
  `cypress/support/`, `cypress.config.js`, `package.json` o fixtures
  globales se pide acá.

Terminar el turno. Después no se vuelve a preguntar salvo algo nuevo. Si
al escribir cambia la estructura aprobada (cantidad de HU o CA,
escenarios que entran o salen), se consulta ANTES de publicar. Eso
incluye sumar un TC que el usuario no pidió cuando fue él quien definió
los TC de un CA: aunque haga falta para el mínimo de 2, se propone y se
espera el OK (SCRUM-826, 2026-10-02).

### Historia

- Como (rol concreto) / Quiero / Para (beneficio que no repite el
  Quiero). Contexto = la pantalla y lo que ofrece hoy, en una o dos
  oraciones. Objetivo = resultado de negocio. Las cinco son obligatorias
  en una HU nueva (el validador frena si falta una). Lenguaje de negocio, sin rutas
  ni términos técnicos; los textos visibles sí (D-19).
- Una HU = una capacidad; lo destructivo en HU aparte (D-17).
- Secciones opcionales: `reglasNegocio`, `fueraDeAlcance`,
  `defectosConocidos`, `sinNegativo`.
- Antes de redactar, leer las HU ya publicadas de la misma app: un mensaje
  se cita igual en todas y cada regla tiene una sola HU dueña (D-32).

### Criterios (CA)

- Uno por regla relevada, en una oración, con id `CA-01: ...`, numeración
  global. 2 a 4 por HU (D-18).
- Si la segunda parte es la definición o el negativo de la misma regla,
  va en la misma oración (no con ";"). Dos comportamientos que fallan por
  separado = dos CA.
- El negativo de una regla ya cubierta es un TC de ese CA, no un CA nuevo.
- **Redactar por la regla, no por la lista de casos:** "un nombre que no
  tenga entre 4 y 30 caracteres…", no "un nombre vacío, de menos de 4 o de
  más de 30…". El vacío es un caso de la misma regla (0 caracteres, o un
  email sin formato) aunque la app muestre otro mensaje: va como TC, no en
  el texto del CA (D-18, caso SCRUM-786).
- Antes de cerrar un CA, contar sus verbos de resultado: "se crea la
  cuenta, **y** con ella se puede ingresar, **y** un email repetido se
  rechaza" son 3 cosas (SCRUM-766). El validador solo ve ";" o "mientras
  que": un ", y" con otro resultado lo tiene que ver quien escribe. Lo que
  es regla de otra HU (ingresar es de SCRUM-745) no va en el texto del CA.
- **Nunca acomodar una regla al mínimo de TC (D-39).** Si una regla
  relevada tiene un solo TC a la vista, no se mete en otro CA ("…solo si es
  distinta de ella"): se busca su segundo TC, casi siempre el borde (qué
  variante sí se acepta: otras mayúsculas, un espacio, el límite), se
  explora y queda como CA propio aunque la HU pase de 4 CA. El validador
  avisa "solo si", "salvo que", "excepto si" y "siempre que".
- **El CA dice el resultado observable**, no una palabra abstracta: "desde
  ese momento se ingresa con la nueva y la anterior deja de servir", no "la
  nueva reemplaza a la actual". Si los TC del CA prueban algo que el texto
  no nombra, el texto está mal (SCRUM-804). Lo mismo con lo que no se
  puede hacer: "ya no se puede ingresar" no sirve; se dice el aviso que se
  ve, y si hay dos caminos que fallan por separado (login con las
  credenciales y sesión ya abierta) son dos CA (SCRUM-821). El validador
  avisa "no se puede" o "no permite" sin aviso, mensaje ni texto citado.

### Test Cases

- 2 a 5 por CA, al menos un negativo o `sinNegativo` con motivo.
- Precondición aparte; Paso 1 = entrar a la pantalla probada; un paso por
  acción verificable; la Acción no verifica; datos en `testData` (D-20).
- **Un dato por paso (D-38):** cada campo que se completa es su propio
  paso (con su valor en Datos) y cada botón es otro paso. Nunca "Completar
  el formulario", "Ingresar el email y la contraseña" ni "Escribir X y
  hacer clic en Y". Un campo que el TC deja vacío no lleva paso. El
  validador lo frena (Datos con varios valores separados por ";" = error).
- Resultado esperado con textos exactos de la pantalla; los mensajes que
  redacta el servidor, por significado + consecuencia (D-21).
- Datos que no choquen con bugs conocidos ni reglas ocultas del backend.
- **Los TC se arman por la regla del CA, nunca según un bug:** si un
  defecto rompe la regla, todos los TC de esa regla quedan en `it.skip`
  "(bug conocido: KEY)"; no se parte el TC para que una mitad quede verde
  ni se valida el síntoma. Si el bug afecta solo un resultado secundario,
  ese resultado sale del TC y va a `defectosConocidos`.
- `folder`: la misma ruta para todos los lotes de la app.
- Cada negativo lleva `evidencia: { reporte, observado }` (D-13).

### Sentido de los CA: se cuida al escribir, no en una revisión aparte

Los validadores controlan la forma, no el sentido. El sentido no lleva un
paso extra: sale del orden en que se escribe cada CA del payload. No
cambia cómo se definen los CA (arriba): solo evita contradicciones.

1. **Si un CA nombra un límite** (ej. "título de 4 a 100 caracteres"),
   el TC del mínimo y el del máximo se escriben en el mismo momento
   (SCRUM-717). La mayoría de los CA no nombra límites: este punto no
   aplica y no se inventan.
2. **Cada TC se escribe debajo de la regla que se rompe si falla**, no de
   una vecina (SCRUM-593).
3. **`sinNegativo` se escribe con el motivo real:** si hay un camino de
   error que no se puede provocar desde la pantalla, se dice eso y va
   también a `fueraDeAlcance` (SCRUM-730).
4. **`fueraDeAlcance` se escribe al final**, con lo que ningún CA
   nombra; si algo choca con un CA, sale de una de las dos (SCRUM-717).
   "No se puede observar" no es motivo hasta intentarlo con una receta
   (otra sesión por API, un cambio hecho por API): en SCRUM-804 se observó
   después y era el defecto SCRUM-833, el corazón del "Para".
5. **Lo relevado que contradice el "Para"** va directo a posibles
   defectos, nunca a un CA (SCRUM-338).

---

## 3. Publicar en Jira/Xray (PASO 2)

Todo pasa por `v3/scripts/create-jira-task.js`. Nunca `node -e`, curl ni
REST a mano, ni scripts por ticket.

1. Payload como archivo de lote (`"formato": "lote"`, formato en
   `lib/payload-builder.js`), todas las HU en un solo `--data` (D-29).
   `--expand-to <archivo>` guarda el payload armado si hace falta mirarlo.
2. `node v3/scripts/create-jira-task.js --data <lote.json> --dry-run`.
   Errores: se corrigen siempre. Warnings: se corrigen; `--accept-warnings`
   solo tras revisar cada uno y confirmar falso positivo (o superposición
   aceptada entre HU, D-32).
3. Publicar sin `--dry-run`. Queda: HU, un TC por cada TC-XX.Y (nunca
   agrupados), un Test Cycle por HU, TC vinculados a la HU con labels
   `CA-XX` y `positivo/negativo`. Guardar keys de TC y ciclos.
4. Corregir pasos de TC ya publicados: `--update-steps --data <archivo>`
   (`{ "testcases": [ { key, precondition, steps } ] }`, también
   `criterio`). Sumar TC a una HU publicada: `issueKey` + `historia` +
   `testcaseModels` + `testCycle: { key }`.

Jira: el Bug se crea con `"issuetype": "Bug"` (se ve como "Error"). No hay
estado "Cancelada" (D-10). No existe validación de duplicados ni
asignación a Sprint: se crea en Backlog y se informa. Lo publicado no
nombra herramientas internas (D-31).

---

## 4. Automatizar y ejecutar (PASO 3)

### Antes del código (revisión corta, sin documento)

- Trazabilidad completa: cada HU con sus CA y cada CA con sus TC con key.
- Reutilizar → extender → crear: buscar Page Objects, comandos
  (`cypress/support/commands/<app>.js`), fixtures y helpers antes de crear
  algo. Lógica que se repite entre specs va a Page Object o comando.
- Cada negativo define cómo se comprueba el rechazo (mensaje, estado del
  control, request que no sale o responde error). Para afirmar que algo
  NO cambió, esperar la respuesta (`cy.wait('@alias')`) antes de afirmar.

### Rama

`git pull` de `main`; si hay cambios ajenos, preservarlos (nunca
descartarlos sin confirmación). Reutilizar la rama del ticket si existe;
si depende de una rama sin mergear, salir de esa (PR apilado, avisado).
Nombres: `feature/SCRUM-<key>-<descripcion>`, lote de varias HU
`feature/SCRUM-<app>-<lote>`, mantenimiento `chore/<descripcion>`.

### Código

- `.page.js` que lee el JSON de selectores; `.cy.js` con
  `it('[CA-01][TC-01.1][SCRUM-NNN] ...')`, la key de Xray al final (D-23).
  Se puede chequear temprano con `node v3/scripts/check-traceability.js
  --spec <carpeta>` (`--sync-labels` completa labels de CA faltantes).
- Cada `it()` afirma solo lo de su TC; en pantallas intermedias, lo mínimo
  para saber que se llegó (D-21). Mensajes del servidor: status + motivo
  devuelto + consecuencia, no el texto copiado.
- Sin `cy.wait()` estático, timeouts ≤ 15 s (D-25). Al extraer un helper
  compartido, no tocar el spec dedicado a ese flujo; antes de borrar un
  spec "duplicado", leer todos sus `it()`.

### Correr

```
node v3/scripts/run-and-report.js --spec <spec1>,<spec2> --test-cycle <ciclo1>,<ciclo2>
```

Verifica trazabilidad, corre Cypress y reporta a Xray solo con 100%
passing (y verifica los ciclos por lectura). "↻ Pasaron solo en reintento"
se informa siempre (`retries.runMode: 1`). Reporte cortado (502,
ECONNABORTED): `--from-results <json> --test-cycle <ciclos>`, sin volver a
correr.

**Si falla (D-24):** leer error y captura; seguir la Pista del script
("no encontró el elemento" vs. "está pero no cumple": en el segundo caso
reproducir con `explore-page.js` ANTES de tocar código). Clasificar:
automatización → corregir código; dato del TC incorrecto → corregir spec y
TC publicado (`--update-steps`); la app no cumple la HU → Bug (nunca
debilitar la aserción); entorno → evidencia y decide el usuario. Corregir
y correr el lote completo. 3 iteraciones fallidas → frenar y consultar.

### Regresión (D-35)

| La rama… | Regresión |
|---|---|
| solo agrega (spec, métodos, selectores o textos nuevos) | ninguna |
| modifica algo existente (método, selector o texto ya usado, comando) | solo los specs que lo usan (Grep), en una corrida |
| cambio global (`cypress.config.js`, `support/`, `package.json`, salvo alta de app) | `--affected` (apps activas, tope 20 specs, D-33) |

No frena el PR: corre en segundo plano y el resultado se agrega al PR. El
merge espera verde. Toda corrida de más de ~5 min se avisa antes (D-34).

### Revisión técnica (antes del commit, mirando el diff)

`npm run lint` sin errores, y sin avisos nuevos en lo que toca la rama
(D-42). Page Objects bien usados y spec sin lógica de más; sin duplicación de
métodos, selectores o cadenas; selectores estables; nada de código muerto,
esperas innecesarias ni falsos positivos posibles; cada `it()` en su
alcance. Lo que falle se corrige antes del commit.

### Commit, push y PR

- Revisar archivos: nada temporal ni ajeno; selectores y discovery sí.
- Un commit por HU: `Automatizar <funcionalidad> en <app> (SCRUM-<key>)`;
  la infraestructura común va en el de la primera HU.
- Si la app tiene reporte público (`docs/trazabilidad/<app>.md`), se
  regenera después de la corrida reportada y va en el mismo PR:
  `node v3/scripts/check-traceability.js --spec cypress/e2e/<app> --report
  docs/trazabilidad/<app>.md` (D-41).
- Push y PR: `node v3/scripts/create-pull-request.js --action create
  --head <rama> --title "..." --body-file <md del scratchpad>` (D-07).
  PR apilado: base = rama de la que depende, avisado en el body.
- HU a "In Review" (D-04).

### Auditoría en el PR (antes de pedir el merge)

El body del PR lleva, **por cada HU**, una tabla armada **releyendo lo
publicado** (el payload que se publicó y el spec), no de memoria. Muestra
el contenido, no un ✅ suelto:

| CA | Texto | Resultados | TC (pasos) | Bordes |
|---|---|---|---|---|
| CA-03 | Al iniciar sesión, una contraseña vacía, <6 o >30 se avisa y no se envía | 1 | 753 (3) · 754 (4) · … | 5 ✗ · 6 ✓ · 30 ✓ · 31 ✗ |

- **Texto:** el CA tal como está en Jira (se puede abreviar sin cambiar el
  sentido).
- **Resultados:** cuántos resultados tiene (contar los ", y"). Si son más
  de 1, se dice por qué es una sola regla (ej. "la 2.ª parte es su
  negativo") o se corrige. Lo que es regla de otra HU no va en el texto.
- **TC (pasos):** key y cantidad de pasos; cada paso es un campo o un
  botón (D-38). Un TC cuyo resultado esperado dice algo que el `it()` no
  afirma (o al revés) se marca y se corrige.
- **Bordes:** para cada límite que nombra el CA, el mínimo y el máximo,
  dentro (✓) y fuera (✗).

Arriba de las tablas, una línea por HU: rol, "Para" y objetivo, y si algún
CA se pisa con otro de la misma HU o de una hermana. Un problema se
corrige antes del merge o se explica por qué queda. Caso que lo
originó: 2026-10-01, el usuario tuvo que preguntar dos veces por HU de
SCRUM-745/760/766 y aparecieron un CA con 3 resultados, dos CA que se
pisaban y textos de TC que el test no controlaba.

---

## 5. Cierre

- **Merge solo con OK explícito del usuario**, siempre con
  `node v3/scripts/create-pull-request.js --action merge --pr <n>
  --delete-branch`; después `git checkout main`, `git pull` y borrar la
  rama local. Nunca encadenar borrados ni pasar la salida por un pipe
  (D-04).
- Tras el merge: HU a "Listo". Con un Bug abierto que rompe la HU, no se
  cierra sin decidirlo con el usuario.
- PR apilado: se mergea primero la base. Con `--delete-branch`, el merge
  re-apunta solo a `main` los PRs apilados ANTES de borrar la rama (si se
  borra antes, GitHub los cierra: caso #143). Sin `--delete-branch`,
  re-apuntarlo a mano con `--action update --pr <n> --base main`.
  Si el PR cambia, actualizar su descripción (`--action view` /
  `--action update --body-file`).
- `node v3/scripts/run-and-report.js --timing-report <rama>` para los
  tiempos del lote.

**Informe de cierre** (todos los campos; `N/A` si no aplica, nunca
inventar): TICKET, HU, RAMA, RESULTADO TESTS (passing / failing / ↻
reintento), COBERTURA (CA y TC automatizados; lo que no se pudo, con
motivo), REVISIÓN TÉCNICA, PULL REQUEST, ESTADO JIRA, BUGS, RIESGOS,
TIEMPOS, PRÓXIMOS PASOS.

Una funcionalidad cerrada no se vuelve a tocar salvo que el usuario la
reabra.

---

## 6. Bugs

1. Descartar que sea la automatización, los datos, la configuración, el
   timing o el entorno.
2. Reproducirlo en el navegador real con `explore-page.js --actions` hasta
   el estado que lo muestra: la captura `.png` de esa exploración es
   obligatoria.
3. Publicar con `create-jira-task.js` (payload `bug`: resumen,
   precondiciones, pasos, resultadoActual, resultadoEsperado, evidencia,
   entorno, severidad, captura; `linkTo` a la HU). El estándar lo frena
   `lib/bug-validator.js` (D-22, D-31): pasos solo funcionales, evidencia
   observable, sin requests/rutas/URLs fuera de Entorno, sin especular
   sobre el código, sin keys en el texto.
4. Durante un lote no se pregunta si se suma: se crea el Bug, el TC queda
   automatizado con el comportamiento correcto en `it.skip` "(bug conocido:
   KEY)" y se informa en el cierre. Solo se consulta si cambia el alcance.

Lo que no se validó se escribe "No validado"; nunca se asume.

---

## Reglas de trato con el usuario

- Preguntar solo lo que no se puede inferir: elegir funcionalidad, la
  pausa del lote, cambios compartidos fuera de patrón, el merge. Nunca
  meta-preguntas ("¿cómo seguimos?").
- Ante una supuesta limitación técnica, evidencia objetiva (repo, config,
  scripts, `.env`), nunca suposiciones.
- Antes de proponer un script o herramienta nueva: scripts oficiales →
  sus opciones → `.env`/APIs → el repo. Hay pausa de herramientas nuevas
  salvo pedido del usuario (D-34); cambios en `v3/scripts/lib/` con
  `npm run test:unit` y un test nuevo si corrigen un bug real (D-02).
