# Registro de decisiones

Decisiones de trabajo acordadas con el usuario, versionadas con el código.
Cada una dice **qué** se decidió, **por qué** (el caso real que la originó)
y **dónde se hace cumplir**. Siempre que se puede, el control es código
(validador o CLI con test): una regla escrita sola se olvida. El cómo está
en `docs/lote.md`; acá está el porqué.

**Una decisión nueva edita la entrada de su tema** (con fecha), no agrega
una entrada paralela. Se consolidó el 2026-10-07: de 51 entradas a 26. Los
números se conservan porque el código los cita; los que se absorbieron
figuran en la tabla.

| Número viejo | Ahora en |
|---|---|
| D-01, D-02, D-08, D-37, D-34 (pausa de herramientas) | D-36 |
| D-10 | `docs/architecture/herramientas.md` (particularidades de Jira) |
| D-12, D-14, D-15, D-50.2 | D-11 |
| D-21 | D-18 y D-23 (lo concreto) |
| D-27, D-28, D-44b, D-45 | D-26 |
| D-31, D-47, D-50.4 | D-22 |
| D-38 | D-20 |
| D-39 | D-18 |
| D-40, D-44a | `docs/discovery/expandtesting-notes.md` |
| D-42 | D-25 |
| D-48.1, D-50.3 | D-43 |
| D-48.2 | D-24 |
| D-06, D-33, D-34 (salud), D-49.2 | D-35 |
| D-50.1 | D-30 |
| D-09 | Historia (al final) |

---

## Proceso y gobernanza

### D-36 · Cómo se mantienen las reglas
- **Decisión:**
  - **Todo en el hilo principal**, sin subagentes (antes D-01).
  - **Un solo documento de trabajo**, `docs/lote.md`, en vez de skills. Cada
    regla vive en un solo lugar: el cómo en `lote.md`, el porqué acá, el
    control en los validadores.
  - **Prevención en código** (antes D-02): cada error de proceso acordado
    se previene en un validador o chequeo de un CLI oficial, con un test del
    caso real; si no se puede, en `lote.md`. Nunca scripts sueltos. Un cambio
    en `v3/scripts/lib/` corre `npm run test:unit`.
  - **No se suman herramientas sin pedido** (antes D-34): no se agregan
    validadores, heurísticas ni opciones salvo que el usuario lo pida; los
    bugs de lo existente sí se corrigen. Antes de sumar una regla, se busca
    si se puede adelantar una que ya existe (D-30, D-51).
  - **Velocidad sin perder calidad** (antes D-08): el tiempo baja quitando
    overhead mecánico (arranques, scripts rehechos, esperas), nunca
    controles. Cada mejora se mide con `run-and-report.js --timing-report`.
  - **La memoria del asistente guarda solo estado** (antes D-37): reglas
    acá o en `lote.md`, gotchas de cada app en `docs/discovery/<app>.md`,
    particularidades de Jira en `docs/architecture/herramientas.md`.
- **Por qué:** la cadena de agentes tardaba más de 40 min y perdía contexto
  (2026-07-29). Las lecciones escritas se repetían ("explorar el camino del
  test" falló en Carrito y en Login, 2026-09-26). Cada lote cargaba ~2.200
  líneas de skills con reglas escritas hasta 3 veces (revisión 2026-09-30).
  Había 45 memorias locales, 27 repetían decisiones y algunas las
  contradecían (2026-10-01). Las herramientas crecían una por error,
  sumando falsos positivos (2026-09-30). Y este mismo registro llegó a 51
  entradas por sumar en vez de editar (2026-10-07).
- **Dónde:** `CLAUDE.md` §2, `docs/lote.md`, `npm run test:unit`.

### D-03 · Sin archivos temporales en el repo
- **Decisión:** informes de exploración, payloads y scripts de prueba viven
  en el scratchpad. El working tree queda limpio.
- **Por qué:** un `_tmp-open-pr.js` estuvo a punto de commitearse.
- **Dónde:** `explore-page.js` se niega a escribir el informe dentro del repo.

### D-04 · Merge a `main` solo con confirmación explícita
- **Decisión:** commit, push, PR y reporte son automáticos; el merge espera
  el OK del usuario. Las HU quedan en "In Review" hasta el merge.
- **Cómo se mergea:** siempre con `create-pull-request.js --action merge
  --pr <n> --delete-branch`. Espera a que GitHub confirme que se puede
  mergear, confirma por lectura y recién ahí borra la rama (#123: un 405
  quedó oculto por un pipe y el PR se cerró sin mergear). Antes de borrar la
  rama re-apunta a `main` los PRs apilados (#143 se cerró solo al borrarse
  su base). `.claude/settings.json` permite correr ese script sin prompt:
  el clasificador frenaba merges ya confirmados; la regla no reemplaza la
  confirmación.
- **Por qué:** cerrar el ticket antes del merge dice "terminado" sin código
  en `main` (SCRUM-65, 2026-07-29).
- **Dónde:** `lib/pr-merge.js` + test, `docs/lote.md` §5.

### D-05 · Máximo 2 PRs abiertos antes de un lote nuevo
- **Decisión:** `create-pull-request.js --action wip-check` al empezar; con
  más de 2, primero se mergea o se cierra.
- **Por qué:** los lotes apilados chocan entre sí.
- **Dónde:** `create-pull-request.js`.

### D-07 · GitHub por API REST, sin `gh`
- **Decisión:** PRs, merge y ramas con `create-pull-request.js` (token +
  API REST). Los bodies van por archivo (`--body-file`).
- **Por qué:** `gh` era una dependencia innecesaria y los backticks inline
  se perdían en Bash (PR #53).
- **Dónde:** `create-pull-request.js`.

### D-30 · Una sola pausa por lote, con el alcance ya validado
- **Decisión:** escenarios, alcance (HU, CA y TC contados contra el mínimo),
  dudas, posibles defectos y archivos compartidos van en una única pregunta
  al final del discovery. Agregar una línea igual a las existentes para una
  app (URL en el config, import de comandos, `apps`, `test:<app>`, filas del
  README) queda aprobado de antemano. **Antes de mandar la pausa**, el
  alcance se escribe en el archivo de lote (HU y una línea por TC) y se
  corre `create-jira-task.js --data <lote> --dry-run --borrador` (antes
  D-50.1): el usuario aprueba CA que ya pasaron por el validador.
- **Por qué:** cada pausa extra es espera sin trabajo (2026-09-28). En
  ParaBank CA-05 llegó con un solo TC y costó otra pregunta (2026-10-05). En
  RBP habitaciones CA-01 y CA-03 llegaron al OK del usuario con dos reglas
  cada uno y el validador recién lo vio con el payload completo (2026-10-07).
- **Dónde:** `docs/lote.md` §2; `--borrador` en `create-jira-task.js`,
  `lib/payload-builder.js` y `lib/testcase-validator.js` (`validateDraft`)
  con tests.

### D-46 · Una HU con Bugs abiertos no se cierra sin decidirlo
- **Decisión:** `--transition` a un estado terminado frena si hay Bugs
  vinculados sin terminar y los lista; pasa solo con `--cerrar-con-bugs`.
  En apps de terceros (demos que nadie va a corregir) el criterio está
  decidido: se cierra con `--cerrar-con-bugs` y un `--comment` que dice qué
  CA no se cumplen y qué Bugs lo explican (elegido el 2026-10-05).
- **Por qué:** SCRUM-883 pasó a Listo con tres Bugs Alta que dejaban dos CA
  sin TC que corra (2026-10-05).
- **Dónde:** `lib/jira.js` (`transitionIssue`, `openLinkedBugs`) + test.

### D-49 · El lote se mide completo
- **Decisión:** discovery, publicación, corridas, apertura y merge del PR
  dejan su tiempo en el mismo registro (`lib/metrics-log.js`).
  `run-and-report.js --timing-report <rama>` da el lote completo. Por eso la
  rama del lote se crea al empezar (`feature/<app>-<funcionalidad>`).
- **Por qué:** en el cierre del 2026-10-06 los tiempos se tuvieron que
  estimar: el reporte arrancaba en la primera corrida de Cypress.
- **Trabajo vs. espera (2026-10-08):** el reporte separa del total la
  espera del OK de merge (el hueco antes del merge) y los huecos de más de
  30 min sin registros (una pausa larga). El lote de borrar consultas de RBP
  daba "5h 26m" con 11m 36s de trabajo.
- **Límite:** es por huecos, porque ningún script ve la respuesta del
  usuario: una pausa respondida en menos de 30 min queda dentro del trabajo,
  y un hueco largo sale entero, con los minutos de trabajo que tenga adentro.
- **Dónde:** `lib/metrics-log.js`, `lib/run-timing.js` (+ tests), los CLIs,
  `docs/lote.md` §0 y §5.

### D-51 · Los chequeos corren solos al escribir
- **Decisión:** un hook `PostToolUse` (`Write|Edit`) corre
  `.claude/hooks/verificar-escritura.js`: eslint en cada `.js` de `cypress/`
  (frena con errores o avisos nuevos contra el último commit) y `--dry-run
  --borrador` en cada archivo de lote. Sin problemas no dice nada. No suma
  reglas: adelanta las existentes.
- **Por qué:** el usuario preguntó si el asistente podía ver sus errores en
  el momento (2026-10-07). En RBP habitaciones 5 de 7 errores los frenó un
  chequeo, pero varios pasos después. Cuesta ~4 s por `.js`.
- **Dónde:** `.claude/settings.json`, `.claude/hooks/verificar-escritura.js`,
  `eslint.config.js`.

---

## Discovery (PASO 1)

### D-11 · Explorar con navegador real, en lote y por el camino del test
- **Decisión:**
  - Solo `explore-page.js`, sin aserciones, informe fuera del repo;
    `cy.reconPage`/`cy.reconSubmit` eliminados y los specs no exploran.
  - **Todas las exploraciones del lote en un `--scenarios`** (una corrida de
    Cypress) y los datos por **receta JSON** de la app
    (`v3/data-recipes/<app>.json`), nunca scripts sueltos (antes D-14).
  - **El mismo camino que usará el test** (sesión o estado por API, entrada
    directa), no solo el de la UI (antes D-12).
  - **Leer antes el precedente**: `docs/discovery/<app>.md` y los specs de
    la misma familia (antes D-15).
  - **Sin suponer el resultado**: un caso no observado todavía se explora
    con `waitFor` + `anyOf`; si un escenario se corta esperando un elemento,
    el informe y el validador de evidencia lo dicen (antes D-50.2).
- **Por qué:** leer código minificado no mostró el método `QUERY` ni el
  idioma automático de PST (4 corridas, 2026-09-25). Eran ~20 arranques de
  40 s por lote; 6 escenarios bajaron a 87 s (PR #121). En Carrito y Login
  andaba la UI y no el camino del test. SCRUM-194 redescubrió un gotcha ya
  documentado en SCRUM-158. En RBP dos exploraciones esperaban el rechazo,
  la app aceptó y se cortaron (2026-10-07).
- **Dónde:** `explore-page.js`, `lib/explore-scenarios.js`,
  `lib/data-recipe.js` (+ tests), `docs/lote.md` §1.

### D-13 · Cada negativo se prueba antes de especificarlo
- **Decisión:** todo TC negativo lleva `evidencia: { reporte, observado }`
  con el informe de la exploración donde se probó; sin eso no se publica.
- **Por qué:** los Bugs SCRUM-527/528 aparecieron recién en el PASO 3 y
  costaron 2 iteraciones (Checkout, 2026-09-26).
- **Dónde:** `lib/negative-evidence.js`, llamado por `create-jira-task.js`.

### D-16 · Seguridad en entornos ajenos
- **Decisión:** en producción real solo flujos públicos, de lectura y sin
  login. En demos compartidas nunca una acción irreversible sobre datos de
  otros.
- **Por qué:** "Cancel Leave" de OrangeHRM canceló una solicitud ajena sin
  pedir confirmación (2026-07-18). Los datos de terceros no se restauran.

---

## Especificación (HU, CA, Test Cases, Bugs)

### D-17 · Una HU = una capacidad de negocio
- **Decisión:** las variantes del mismo comportamiento van en una HU; lo
  independiente o destructivo (eliminar, editar) en HU aparte.
- **Por qué:** una HU por escenario fragmentaba la funcionalidad (PIM,
  2026-07-22).
- **Dónde:** `CLAUDE.md` §2, `docs/lote.md`.

### D-18 · Los CA salen de las reglas relevadas, una por CA
- **Decisión:**
  - Una regla de negocio es un CA, en una oración, con el resultado
    observable. Mínimo 2 por HU (no es un molde); más de 4, evaluar split.
    Cada TC declara `criterio` y `tipo`, y va bajo la regla que se rompe si
    falla (antes D-21).
  - **Por la regla, no por la lista de casos**: "un nombre que no tenga
    entre 4 y 30 caracteres", no "vacío, de menos de 4 o de más de 30"; el
    vacío es un TC de la regla.
  - **Una regla no se acomoda al mínimo de TC** (antes D-39): si tiene un
    solo TC a la vista, se le busca el segundo (el borde), se explora y queda
    como CA propio, aunque la HU pase de 4. Lo que no se puede hacer se dice
    con el aviso que se ve; dos caminos que fallan por separado son dos CA.
- **Por qué:** 19 HU salieron con exactamente 2 CA por inercia (2026-09-23).
  SCRUM-786 hacía parecer dos reglas una sola (2026-10-01). SCRUM-804 CA-01
  ("solo si es distinta") juntaba dos reglas para llegar al mínimo; SCRUM-821
  CA-02 ("ya no se puede ingresar") era abstracto y tenía dos caminos
  (2026-10-02). En RBP habitaciones pasó de nuevo y lo frenó el validador
  (2026-10-07).
- **Dónde:** `lib/testcase-validator.js` (mínimos, CA compuesto con ";",
  "mientras que", "solo si"…, "no se puede" sin aviso) + tests; `docs/lote.md`
  §2.

### D-19 · HU en lenguaje de negocio
- **Decisión:** "Como" con un rol concreto, "Para" con un beneficio real,
  Objetivo como resultado de negocio (no "Verificar…"), sin rutas. Lo
  relevado que contradice el "Para" es un posible defecto, nunca un CA.
- **Por qué:** SCRUM-338 exigía como CA perder datos al recargar: el test
  pasaba cuando la función fallaba (2026-09-24).
- **Dónde:** `validateStoryText` en `lib/testcase-validator.js`.

### D-20 · Pasos de los Test Cases: un dato o un botón por paso
- **Decisión:** el Paso 1 entra a la pantalla probada; sesión y datos semilla
  van en `precondition`. Cada acción con resultado verificable es un paso,
  sin relleno, y la Acción no verifica. **Cada campo que se completa es su
  propio paso, con el valor en Datos, y cada botón es otro** (antes D-38).
- **Por qué:** los TC salían con 2 pasos y acciones encadenadas
  (2026-09-23) y con verificaciones en la acción (SCRUM-477). En SCRUM-766
  "Completar el formulario" juntaba 4 campos mientras SCRUM-745 los separaba:
  la misma acción escrita de dos formas (2026-10-01).
- **Dónde:** `lib/testcase-validator.js` + tests (ERROR con varios valores
  separados por ";" en Datos; WARNING si la acción carga un dato y hace otra
  cosa).

### D-22 · Bugs: estándar, certeza y sin herramientas internas
- **Decisión:**
  - Secciones fijas (Resumen, Precondiciones, Pasos, Resultado actual y
    esperado, Evidencia, Entorno, Severidad), sin Observaciones ni keys en el
    texto (relaciones con `linkTo`). Pasos funcionales, sin especular sobre
    el código de la app, sin requests, rutas ni URLs fuera del Entorno.
    Captura `.png` de `explore-page.js` obligatoria; su ruta relativa se
    resuelve contra la carpeta del `--data` (antes D-50.4).
  - **Certeza** (antes D-47): **seguro** si la app se contradice o
    pierde/expone dinero o datos; **probable** si viola una regla razonable
    no escrita, y entonces se publica solo si el usuario confirmó esa regla
    en la pausa (`reglaConfirmada`). Label `bug-seguro` / `bug-probable`.
  - **Sin herramientas internas** (antes D-31): HU, TC y Bugs no nombran
    scripts ni archivos de la suite (`explore-page.js`, specs, recetas);
    Cypress y Chrome sí. Es documentación del producto.
- **Por qué:** los Bugs mezclaban trazabilidad y especulación (SCRUM-528,
  559, 2026-09-27) y citaban requests (SCRUM-658, 2026-09-29). Varios decían
  "tomada con explore-page.js" (2026-09-29). En ParaBank se cargaron 17 Bugs
  sin distinguir seguros de probables (2026-10-05). Los 5 Bugs de RBP
  fallaron el dry-run por rutas relativas (2026-10-07).
- **Dónde:** `lib/bug-validator.js` (`resolveCaptures`), `lib/internal-tools.js`,
  `lib/testcase-validator.js` (+ tests); `create-jira-task.js`; `docs/lote.md`
  §6.

### D-32 · Coherencia entre HU de la misma app
- **Decisión:** al publicar se compara con las HU de la misma app: WARNING
  si cita un mensaje de pantalla distinto, si un CA cubre lo que otra dejó
  fuera de alcance o si repite un CA. Es un chequeo por palabras: no
  reemplaza leer las HU hermanas.
- **Por qué:** SCRUM-659 contradecía a SCRUM-635 y cada una pasaba sus
  validadores por separado (auditoría de Notes, 2026-09-29).
- **Dónde:** `lib/story-coherence.js` + test, en cada publicación y dry-run.

### D-29 · Payload por archivo de lote, bundle y reporte en paralelo
- **Decisión:** el payload es un archivo de lote (`"formato": "lote"`) que
  arma `lib/payload-builder.js` (pasos con nombre, TC numerados por CA,
  evidencia, ciclo); nunca un `build-*.js` suelto. `explore-page.js` deja
  `bundle-scan.json` con atributos y mensajes del código (pista, no
  evidencia). El reporte a Xray lee cada ciclo una vez y escribe de a 4 en
  paralelo.
- **Por qué:** cada lote rehacía el mismo script y leía el bundle a mano
  (2026-09-28). El reporte de SCRUM-621 bajó de 58 s a 8 s.
- **Dónde:** `lib/payload-builder.js`, `lib/bundle-scan.js`,
  `lib/concurrency.js`, `planReport` en `lib/test-runner.js` (+ tests).

---

## Automatización y ejecución (PASO 3)

### D-23 · Tags de trazabilidad en cada `it()`
- **Decisión:** `it('[CA-01][TC-01.1][SCRUM-307] …')`, key de Xray al final.
  Antes de correr se verifica que exista, esté vinculada a la HU y tenga el
  label del CA. Cada `it()` afirma solo lo de su TC; los mensajes que
  redacta el servidor, por significado y consecuencia (antes D-21).
- **Por qué:** una key mal copiada reportaba a otro TC; un test tiene que
  señalar el CA correcto y no romperse por un cambio de redacción.
- **Dónde:** `lib/test-runner.js`, `lib/traceability.js`,
  `check-traceability.js`.

### D-24 · Una corrida por iteración, con diagnóstico, máximo 3
- **Decisión:** si falla, se diagnostica con evidencia antes de volver a
  correr; a las 3 iteraciones fallidas se consulta. Solo se reporta a Xray
  con 100%. **Si todas las fallas son un 429** de la app, es falla del
  entorno: no cuenta como iteración y `--esperar-limite` espera y repite una
  vez (antes D-48.2).
- **Por qué:** ParaBank cortó 6 corridas con un 429 que contaban como
  iteraciones y se diagnosticaban a mano (2026-10-06).
- **Dónde:** `run-and-report.js`, `lib/test-runner.js` (`rateLimitInfo`),
  `lib/run-timing.js`.

### D-25 · Código Cypress y lint
- **Decisión:** sin `cy.wait()` estático, timeouts de 15 s como máximo,
  selectores relevados en fixtures JSON. Al extraer un helper no se toca el
  spec dedicado a ese flujo; antes de borrar un spec "duplicado" se leen sus
  `it()`. **`npm run lint`** (eslint-plugin-cypress) sin errores ni avisos
  nuevos (antes D-42); `unsafe-to-chain-command` queda como aviso por los 27
  casos previos. `v3/` no entra al lint: tiene sus tests.
- **Por qué:** casos de OrangeHRM (PR #38) y del saneamiento (se hubieran
  perdido 2 escenarios). Sin linter era lo primero que marcaría alguien
  técnico (2026-10-03).
- **Dónde:** `eslint.config.js`, `docs/lote.md` §4, hook de D-51.

### D-35 · Regresión y CI: solo lo que hace falta
- **Decisión:**
  - Rama que solo **agrega**: sin regresión. Que **modifica** algo
    existente: los specs que lo usan. **Cambio global** (`cypress.config.js`,
    `support/`, `package.json`): `--affected`. Dar de alta o de baja una app
    no es global. Ninguna regresión pasa de **20 specs** sin confirmación
    (`--max-specs`) (antes D-33).
  - La regresión no frena el PR: corre después y el merge espera el verde.
  - `--health` solo a pedido o si una falla parece ajena a la rama (antes
    D-34).
  - **CI** (antes D-06 y D-49.2): cada PR corre lint y unitarios; la
    nocturna corre solo Notes App; los E2E afectados por PR están listos y
    **apagados** (`QA_PR_E2E`) hasta tener un entorno propio. La evidencia
    de cada PR es la corrida local.
- **Por qué:** un CI E2E como requisito de merge falló 3 veces por demos
  inestables (2026-07-29). Una regresión de 89 specs llevaba más de 35 min
  (2026-09-29). En SCRUM-717 se esperaron 12,5 min una regresión innecesaria
  y 3 min de salud por sesión (2026-09-30). Con demos públicas, los E2E por
  PR dependerían del entorno (2026-10-06).
- **Dónde:** `lib/affected-specs.js` + test, `run-and-report.js`,
  `.github/workflows/`, `docs/lote.md` §4.

### D-41 · Jira privado; la trazabilidad se publica en el repo
- **Decisión:** por app se commitea `docs/trazabilidad/<app>.md` (HU → CA →
  TC → `it()` → resultado, más Bugs) con `check-traceability.js --report`,
  regenerado en cada lote. Hoy solo Notes App.
- **Por qué:** quien mira el repo no tiene acceso a Jira; hacerlo público no
  servía (team-managed, Xray no se muestra a anónimos), 2026-10-03.
- **Dónde:** `lib/trace-report.js` + test, `check-traceability.js`.

---

## Arquitectura y portabilidad

### D-43 · Lo propio de cada proyecto vive en `qa.config.json`
- **Decisión:** apps, carpeta raíz de cada app en el gestor de pruebas
  (`carpetasDePruebas`, antes D-50.3), qué adapter habla con cada gestor
  (`herramientas`, antes D-48.1), nombres de la instancia de Jira y palabras
  clave de los validadores se leen de `qa.config.json` (sin valores por
  defecto en el código). Otro gestor es **un archivo nuevo en `lib/` y una
  línea de config**. La carpeta de un lote es `<raíz>/<módulo>`; las que
  existen se listan con `create-jira-task.js --list-folders`.
- **Por qué:** "Historia", "Draft", "Relates" y "SCRUM" estaban en 7
  archivos y los validadores solo entendían español (2026-10-03). Cambiar
  de gestor obligaba a tocar 3 CLIs (2026-10-06). La carpeta de RBP no
  estaba anotada y el gestor crea en silencio una ruta que no existe; había
  raíces duplicadas (2026-10-07).
- **Límite:** los textos que escribe el framework siguen en español.
- **Dónde:** `lib/qa-config.js`, `lib/tools.js`, `lib/payload-builder.js`
  (`checkFolder`) + tests; README.

### D-26 · Fronteras de herramientas y contratos, verificados por test
- **Decisión:**
  - Jira/Xray, GitHub y el arranque de Cypress viven en archivos fijos;
    `npm run test:unit` falla si aparecen en otro lado (mapa en
    `docs/architecture/herramientas.md`). El formato de Jira (ADF) no sale
    de `lib/jira.js` (antes D-44b).
  - Cada app en sus carpetas, declarada en `apps`; sin selectores sueltos
    y con cada archivo de comandos importado (antes D-28).
  - **Contrato del gestor de pruebas** (antes D-45):
    `lib/test-manager-contract.js` con sus funciones y formas (una
    ejecución es `{ id, testCaseKey, status }`); el test falla si el adapter
    no lo cumple, si un CLI usa algo fuera de él o si una función no la usa
    nadie. Lo mismo para el gestor de tickets.
  - Cypress no se aísla detrás de un adaptador mientras no haya un cambio de
    runner a la vista (antes D-27).
- **Por qué:** portabilidad: cambiar una herramienta tiene que ser tocar
  pocos archivos conocidos (2026-09-28). Había 14 selectores sueltos de ATS
  (2026-09-28). `getTestExecutions` devolvía la forma de Xray hasta
  `test-runner.js` (2026-10-03).
- **Dónde:** `lib/architecture.js`, `lib/test-manager-contract.js`,
  `lib/issue-tracker-contract.js` (+ tests).

---

## Historia

- **D-09 · Legado fuera de main (2026-10-03).** Las apps de la etapa Zephyr
  o experimentales (SauceDemo, OrangeHRM, Argentina.gob.ar, Rentas Córdoba,
  Disco, Automation Exercise, BlazeDemo), las herramientas v1/v2 y
  `node_modules` (6.763 de 7.142 archivos) salieron de main; siguen en la
  etiqueta git `legado-2026-10-03`. Xray es la única fuente de verdad.
- **D-34 (2026-09-30)** pedía `--health` al empezar cada sesión; D-35 lo
  dejó a pedido. Su resumen de excepciones al final de `explore-page.js`
  sigue vigente (D-11).
- **D-21 (2026-09-27)** "cada artefacto cumple su función" quedó en lo
  concreto: D-18 (cada TC bajo su regla) y D-23 (cada `it()` solo su TC).
