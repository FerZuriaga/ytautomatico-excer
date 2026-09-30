# Registro de decisiones

Decisiones de trabajo acordadas con el usuario a lo largo del proyecto,
versionadas con el código. Antes vivían solo en la memoria local del
asistente (fuera del repo), y se habrían perdido al cambiar de PC o de
herramienta.

Cada decisión dice **qué** se decidió, **por qué** (el caso real que la
originó) y **dónde se hace cumplir**. Siempre que se puede, el control es
código (validador o CLI con test): una regla escrita sola se olvida. Las
reglas de ejecución obligatorias están en `CLAUDE.md`; acá está el
porqué. Cuando una decisión cambia, se edita su entrada (con fecha), no se
agrega una contradictoria.

---

## Proceso y gobernanza

### D-01 · Todo en el hilo principal: roles como skills, sin subagentes
- **Decisión:** Manager, ProductAgent y QaAutomation1 son skills
  (`v3/.claude/skills/`) que carga el hilo principal. No se delega en
  subagentes. Desde PR #106 hay 7 skills de fase: discovery, especificacion,
  plan-automatizacion, git, ejecucion, automation-review y bug-reporting.
- **Por qué:** la cadena de agentes tardaba más de 40 minutos por
  mensajería y perdía contexto en cada traspaso (2026-07-29).
- **Dónde:** `CLAUDE.md` §2, skill `manager`.

### D-02 · Prevención en código, sin scripts sueltos
- **Decisión:** cada error de proceso acordado se previene en código
  (validador o chequeo en un CLI oficial, con test del caso real). Si no se
  puede, va en la skill que corresponde. Siempre se extiende la
  implementación oficial.
- **Por qué:** las lecciones escritas se repetían. "Explorar el camino del
  test" falló dos veces, en Carrito y en Login (2026-09-26).
- **Dónde:** `CLAUDE.md` §2, `npm run test:unit`.

### D-03 · Sin archivos temporales en el repo
- **Decisión:** los informes de exploración, los payloads de prueba y los
  scripts de validación viven fuera del repo (carpeta temporal). El working
  tree queda limpio.
- **Por qué:** apareció un `_tmp-open-pr.js` a punto de commitearse.
- **Dónde:** `explore-page.js` se niega a escribir el informe dentro del repo.

### D-04 · Merge a `main` solo con confirmación explícita
- **Decisión:** todo lo demás es automático (commit, push, PR, reporte),
  pero el merge espera el OK del usuario. Las HU quedan en "In Review" hasta
  el merge y recién ahí pasan a "Listo".
- **Por qué:** cerrar el ticket antes del merge da una foto falsa: dice
  "terminado" y el código no está en `main` (SCRUM-65, 2026-07-29).
- **Dónde:** `CLAUDE.md` §2, skills `manager` y `product-agent`.
- **Cómo se mergea (2026-09-28):** siempre con `create-pull-request.js
  --action merge --pr <n> --delete-branch`. El script espera a que GitHub
  confirme que el PR se puede mergear, confirma el merge por lectura y
  recién ahí borra la rama. Nació del #123: un 405 recién pusheado quedó
  oculto por un pipe, la rama se borró igual y el PR se cerró sin mergear.
  Controlado en `lib/pr-merge.js` con test.
- **Permiso del asistente (2026-09-29):** `.claude/settings.json` permite
  correr `node v3/scripts/create-pull-request.js` sin pedir permiso: el
  clasificador del modo automático frenaba el merge ya confirmado por el
  usuario. La regla no reemplaza la confirmación: el asistente sigue
  mergeando solo cuando el usuario lo dice.

### D-05 · Máximo 2 PRs abiertos antes de un lote nuevo
- **Decisión:** `create-pull-request.js --action wip-check` antes de
  arrancar. Con más de 2 PRs abiertos, primero se mergea o se cierra.
- **Por qué:** los lotes apilados chocan entre sí.
- **Dónde:** `create-pull-request.js`.

### D-06 · Sin CI; validación local
- **Decisión:** no hay workflow de GitHub Actions. La evidencia es la
  corrida local con `run-and-report.js`.
- **Por qué:** con un CI de la suite completa como requisito de merge, el
  check falló 3 veces seguidas por demos públicas inestables (datos sucios,
  timeouts, un 500 del servidor), ajenas al código (2026-07-29). Retomar CI
  queda para más adelante, excluyendo las demos compartidas del gate.
- **Dónde:** no hay `.github/workflows`.

### D-07 · GitHub por API REST, sin `gh`
- **Decisión:** los PRs, el merge y el borrado de ramas se hacen con
  `create-pull-request.js` (token + API REST). No se instala `gh`.
- **Por qué:** era una dependencia innecesaria. Los bodies se pasan por
  archivo, porque los backticks inline se perdían en Bash (PR #53).
- **Dónde:** `create-pull-request.js` (`--body-file`).

### D-08 · Velocidad sin perder calidad
- **Decisión:** los tiempos bajan solo quitando overhead mecánico
  (arranques repetidos de Cypress, scripts rehechos, esperas evitables).
  Nunca se quitan controles: evidencia de negativos, validadores,
  diagnóstico entre iteraciones y revisión de alcance. Cada mejora se mide
  antes y después con `run-and-report.js --timing-report`. El número de
  minutos no es una meta a cumplir: la meta es el camino directo, sin
  desvíos no pedidos.
- **Por qué:** pedido explícito del usuario (2026-09-11 y 2026-09-27). El
  valor del proyecto es el criterio de QA.
- **Dónde:** skills `ejecucion` y `discovery`. Mejoras aplicadas: D-14
  (discovery en lote), D-29 (armador, bundle, reporte en paralelo) y D-30
  (una sola pausa).

### D-29 · Lote rápido: armador de payloads, lectura del bundle y reporte en paralelo
- **Decisión:** (a) el payload del PASO 2 se escribe como archivo de lote
  (`"formato": "lote"`), que arma `lib/payload-builder.js`: pasos con
  nombre, datos reutilizables, TC numerados por CA, evidencia por escenario
  de `explore-page` y ciclo por defecto. Nunca un `build-*.js` suelto.
  (b) `explore-page.js` lee el código de la app y deja
  `bundle-scan.json` con los atributos de test y los mensajes de
  validación, marcando lo que no se vio en ninguna exploración. Es una
  pista, no evidencia. (c) El reporte a Xray lee cada ciclo una vez, arma
  el plan completo antes de escribir y cambia los estados de a 4 en
  paralelo. La verificación por lectura no cambia.
- **Por qué:** 2026-09-28. Cada lote rehacía el mismo script de ayudantes,
  el bundle minificado se leía a mano (`grep` se colgaba) y el reporte
  hacía 4 llamadas en serie por test. Medido: el reporte de SCRUM-621 bajó
  de 58 s a 8 s y el de Contacto (2 ciclos, 17 tests) de 110 s a 8 s. El
  lote de SCRUM-621 reescrito en el formato nuevo arma un payload idéntico
  al publicado.
- **Dónde:** `lib/payload-builder.js`, `lib/bundle-scan.js`,
  `lib/concurrency.js`, `planReport` en `lib/test-runner.js` (todos con
  test); `create-jira-task.js` (`--data` con lote, `--expand-to`) y
  `explore-page.js` (`--no-bundle`). Un `--data` sin nada que publicar
  frena: antes un lote sin `"formato"` pasaba el `--dry-run` con 0 TC
  validados.

### D-30 · Una sola pausa por lote; cambios compartidos de patrón conocido aprobados
- **Decisión:** escenarios, alcance, dudas y archivos compartidos van en
  una única pregunta al final del discovery. Agregar una línea igual a las
  existentes para una app queda aprobado de antemano: se hace y se informa.
  Esto vale para la URL `<app>Url` en `env` de `cypress.config.js`, el
  `import './commands/<app>'`, `APPS.active`, el script `test:<app>` y las
  filas del README. Cualquier otro cambio compartido se sigue aprobando
  (en esa misma pausa si se conoce), y el merge a `main` se confirma
  siempre (D-04).
- **Por qué:** pedido del usuario (2026-09-28). Cada pausa extra es tiempo
  de espera sin trabajo, y esos cambios de una línea se aprobaron igual en
  todas las apps nuevas.
- **Dónde:** skills `manager`, `discovery`, `especificacion`,
  `plan-automatizacion` y `qa-automation1`.

### D-09 · Solo 2 apps activas; el resto es legado intocable
- **Decisión:** el trabajo nuevo va solo en apps con trazabilidad a Xray.
  SauceDemo, OrangeHRM, Argentina.gob.ar, Rentas Córdoba, Disco, Automation
  Exercise y BlazeDemo (etapa Zephyr o experimental) corren como regresión
  con `npm run test:<app>`, pero no se modifican, no se migran y no se
  reportan.
- **Por qué:** Xray es la única fuente de verdad. Migrar unos 120 `it()`
  de Zephyr no compensa el costo (2026-09-24).
- **Dónde:** README, sección "Estado de las apps".

### D-10 · Jira: no hay estado "Cancelada"
- **Decisión:** un ticket descartado se pasa a "Finalizada" con un
  comentario aclaratorio. Solo se borra si el usuario lo pide
  explícitamente (caso SCRUM-52).
- **Por qué:** el workflow del proyecto no tiene otro estado terminal
  (limpieza del 2026-07-21, SCRUM-1 a 42).

---

## Discovery (PASO 1)

### D-11 · Navegador real solo con `explore-page.js`
- **Decisión:** la exploración con navegador se hace únicamente con
  `explore-page.js` en el PASO 1. El informe queda fuera del repo y no hay
  aserciones. `cy.reconPage` y `cy.reconSubmit` están eliminados, y los
  specs no se usan para explorar.
- **Por qué:** leer código minificado no mostró el método HTTP `QUERY` ni el
  idioma automático de PST, y costó 4 corridas (2026-09-25, PR #106).
- **Dónde:** skill `discovery`, `CLAUDE.md` §1.

### D-12 · Explorar el mismo camino que usará el test
- **Decisión:** si el test prepara el estado por API (sesión, carrito,
  compras), la exploración se hace con ese mismo estado, no solo por la UI.
- **Por qué:** en Carrito y en Login el camino de la UI andaba y el del
  test no.
- **Dónde:** skill `discovery`.

### D-13 · Cada negativo se prueba antes de especificarlo
- **Decisión:** todo Test Case negativo lleva `evidencia: { reporte,
  observado }` con el `report.json` de la exploración donde se probó. Sin
  eso no se publica.
- **Por qué:** los Bugs SCRUM-527 y SCRUM-528 aparecieron recién en el
  PASO 3 y costaron 2 iteraciones (Checkout, 2026-09-26).
- **Dónde:** `lib/negative-evidence.js`, llamado por `create-jira-task.js`.

### D-14 · Discovery en lote y datos por receta
- **Decisión:** todas las exploraciones de un lote van en un archivo
  `--scenarios` (una sola corrida de Cypress). Los datos que necesitan
  (cliente, sesión, compras) salen de recetas JSON por app
  (`v3/data-recipes/<app>.json`) con un motor general, nunca de scripts
  sueltos.
- **Por qué:** eran unos 20 arranques de 40 segundos por lote, y un script
  de sesión rehecho a mano en cada uno. Medido: 6 escenarios en 87 s contra
  unos 66 s cada uno por separado (2026-09-28, PR #121). El motor es
  general a pedido del usuario: una app nueva es un JSON, no código.
- **Dónde:** `explore-page.js`, `lib/data-recipe.js`, skill `discovery`.

### D-15 · Leer el precedente antes de relevar
- **Decisión:** antes de relevar una funcionalidad, leer
  `docs/discovery/<app>.md` y los specs de la misma familia (recuperar
  credencial, checkout...) para precargar los gotchas ya conocidos.
- **Por qué:** en SCRUM-194 se redescubrió por un fallo un gotcha ya
  documentado en SCRUM-158. Leerlo cuesta unos 20 segundos.
- **Dónde:** `CLAUDE.md` §1 PASO 1, skill `discovery`.

### D-16 · Seguridad en entornos ajenos
- **Decisión:** en producción real (Rentas Córdoba, sitios `.gob.ar`) solo
  se automatizan flujos públicos, de solo lectura y sin login. En demos
  compartidas nunca se ejecuta una acción irreversible sobre datos de otros:
  "Cancel Leave" de OrangeHRM no pide confirmación y canceló una solicitud
  ajena (2026-07-18).
- **Por qué:** los datos son de terceros y no se pueden restaurar.

---

## Especificación (HU, CA, Test Cases)

### D-17 · Una HU = una capacidad de negocio
- **Decisión:** las variantes del mismo comportamiento van en una HU. Las
  capacidades independientes o destructivas (eliminar, editar) van en HUs
  separadas.
- **Por qué:** una HU por escenario fragmentaba la funcionalidad (PIM,
  2026-07-22).
- **Dónde:** `CLAUDE.md` §2, skill `especificacion`.

### D-18 · Los CA salen de las reglas relevadas
- **Decisión:** una regla de negocio es un CA, en una oración. El mínimo es
  2 y no es un molde: con menos de 2 es error y con más de 4 hay que evaluar
  un split. Cada TC declara `criterio` y `tipo`.
- **Por qué:** 19 HU salieron con exactamente 2 CA por inercia
  (2026-09-23).
- **Dónde:** `lib/testcase-validator.js` (PR #94).

### D-19 · HU en lenguaje de negocio
- **Decisión:** "Como" lleva un rol concreto y "Para" un beneficio real. El
  Objetivo es un resultado de negocio (no "Verificar…") y no se mencionan
  rutas. Un comportamiento relevado que contradice el "Para" es un posible
  defecto, nunca un CA.
- **Por qué:** SCRUM-338 exigía como CA que los datos guardados se
  perdieran al recargar: el test pasaba cuando la función fallaba
  (2026-09-24).
- **Dónde:** `validateStoryText` (PR #102).

### D-20 · Un paso por acción verificable; verificar solo en el resultado
- **Decisión:** cada acción con resultado verificable es un paso, sin
  relleno. La columna Acción no dice "verificar…". El Paso 1 es entrar a la
  pantalla probada. La sesión y los datos semilla van en `precondition`.
- **Por qué:** todos los TC salían con 2 pasos y acciones encadenadas
  (2026-09-23), y había verificaciones dentro de la acción (SCRUM-477).
- **Dónde:** `lib/testcase-validator.js` (PR #93, #108).

### D-21 · Alcance: cada artefacto cumple su función sin pisar al vecino
- **Decisión:** cada TC va en la regla que se rompe si falla, y cada `it()`
  afirma solo lo de su TC. Los mensajes que redacta el servidor se verifican
  por significado y consecuencia. La HU no lista lo que queda fuera de
  alcance.
- **Por qué:** auditoría del 2026-09-27 (PR #120): un test tiene que señalar
  el CA correcto y no romperse por un cambio de redacción.
- **Dónde:** skills `especificacion`, `qa-automation1` y `automation-review`.

### D-22 · Estándar de Bugs
- **Decisión:** secciones fijas (Resumen, Precondiciones, Pasos, Resultado
  actual y esperado, Evidencia, Entorno), sin sección de Observaciones y sin
  keys de TC en el texto (se relacionan con `linkTo`). Los pasos son
  funcionales, sin selectores ni código. No se especula sobre el código de
  la app. La captura `.png` de `explore-page.js` es obligatoria.
- **Sin detalle de red (2026-09-29):** la Evidencia y el resto del Bug se
  redactan como los vería una persona usando la app (pantalla, avisos,
  consola, captura), sin requests HTTP, rutas, URLs ni parámetros. Solo el
  Entorno lleva la URL del sitio. El detalle técnico queda en
  `docs/discovery/<app>.md`. Nació de SCRUM-658, que citaba
  "GET /notes/api/notes/?search=Pan%20&%20queso"; se reescribieron 585,
  596, 620 y 658 (los viejos no se tocan). Solo aplica a Bugs: las HU ya
  avisan por rutas y los TC las pueden llevar en la precondición.
- **Por qué:** los Bugs mezclaban trazabilidad y especulación sobre código
  interno (SCRUM-528, SCRUM-559), 2026-09-27.
- **Dónde:** `lib/bug-validator.js` (PR #119; detalle de red, PR #131).

### D-31 · Jira/Xray sin herramientas internas de la suite
- **Decisión:** las HU, los Test Cases y los Bugs no nombran scripts ni
  archivos internos de la automatización (`explore-page.js`,
  `v3/scripts/...`, specs `.cy.js`, `sess.sh`, `report.json`, recetas). La
  evidencia se redacta en términos funcionales y de lo que muestra la
  pantalla (en los Bugs, sin detalle de red: D-22). Cypress, Chrome y
  DevTools sí se pueden nombrar (herramientas de ejecución y del navegador).
- **Por qué:** es documentación pública del producto, no del framework.
  Los Bugs SCRUM-585, 596, 620 y 658 decían "tomada con explore-page.js" y
  se corrigieron (2026-09-29). Los Bugs viejos (482, 483, 525, 526) y las
  Tareas 222 y 225 quedan como están, por decisión del usuario.
- **Dónde:** `lib/internal-tools.js`, usado como error por
  `lib/bug-validator.js` y `lib/testcase-validator.js` (TC y texto de la
  HU); skills `bug-reporting`, `especificacion` y `product-agent`.

### D-32 · Coherencia entre HU de la misma app
- **Decisión:** al publicar o actualizar una HU se compara con las HU
  publicadas de la misma app. WARNING si cita un mensaje de pantalla que
  otra HU escribe distinto, si un CA cubre lo que otra HU dejó fuera de
  alcance, o si un CA repite el de otra HU. Se corrige el texto (y la HU
  hermana si hace falta) o, si es una superposición aceptada, se publica
  con `--accept-warnings`.
- **Por qué:** la auditoría de Notes App (2026-09-29) encontró que cada HU
  pasaba sus validadores por separado y el problema estaba en el conjunto:
  SCRUM-659 contradecía a SCRUM-635 en el texto del resumen, cubría algo
  que 635 dejaba fuera de alcance y repetía su regla del resumen.
- **Límite:** es un chequeo por palabras; no entiende el significado. No
  reemplaza leer las HU hermanas (skill `especificacion`).
- **Dónde:** `lib/story-coherence.js` + test; `create-jira-task.js` lo
  corre en cada publicación, también en `--dry-run`. Las HU hermanas salen
  del encabezado "Ticket Jira" de los specs (`getIssuesByKeys` con
  `withText`), sin búsquedas por texto en Jira.

---

## Automatización y ejecución (PASO 3)

### D-23 · Tags de trazabilidad en cada `it()`
- **Decisión:** `it('[CA-01][TC-01.1][SCRUM-307] …')`. La key de Xray va al
  final. Antes de correr se verifica que exista, que esté vinculada a la HU
  y que tenga el label del CA.
- **Por qué:** es lo que usa el reporte a Xray. Una key mal copiada
  reportaba a otro Test Case.
- **Dónde:** `lib/test-runner.js`, `lib/traceability.js`,
  `check-traceability.js`.

### D-24 · Una corrida por iteración, con diagnóstico, máximo 3
- **Decisión:** si una corrida falla, se diagnostica con evidencia antes de
  volver a correr. Nunca se re-corre "a ver si pasa". A las 3 iteraciones
  fallidas se consulta al usuario. Solo se reporta a Xray si pasa el 100%.
- **Dónde:** `run-and-report.js`, skill `ejecucion`.

### D-33 · La regresión por cambio global corre solo las apps activas
- **Decisión:** ante un cambio global (`cypress.config.js`,
  `support/e2e.js`, `support/commands.js`, `package.json`),
  `run-and-report.js --affected` corre los specs de las apps de
  `APPS.active` y deja afuera el legado, informando cuántos specs quedaron
  sin correr.
- **Por qué:** al dar de alta Restful Booker Platform (2026-09-29) la suite
  completa de 89 specs llevaba más de 35 minutos sin terminar, casi todo en
  apps de legado rotas contra sitios reales que por decisión no se
  mantienen (D-09). El legado no se toca, así que su regresión no aporta.
- **Además (mismo día):** dar de alta una app nueva no es un cambio
  global. Si los archivos globales solo suman sus líneas de registro (URL
  en el config, import de comandos, script de npm), la regresión corre solo
  lo que esa app toca. Y **ninguna regresión pasa de 20 specs sin
  confirmación del usuario**: por encima del tope el script no corre y hay
  que re-ejecutar con `--max-specs N`. En total se perdieron ~50 minutos en
  regresiones que nadie decidió.
- **Dónde:** `lib/affected-specs.js` (`activeApps`, `registrationOnly`,
  `isAppRegistrationDiff`) + test; `run-and-report.js` (tope
  `MAX_REGRESSION_SPECS`, `--max-specs`); skill `ejecucion`.

### D-34 · Consolidar: salud al empezar, pausa de herramientas y corridas avisadas
- **Decisión:**
  - Cada sesión arranca con `run-and-report.js --health` (un spec por app
    activa, el de menos tests; sin reporte). Si algo falla, se diagnostica
    antes de trabajo nuevo.
  - Pausa de herramientas nuevas: no se agregan validadores, heurísticas ni
    opciones a los scripts salvo pedido del usuario; se corrigen bugs de lo
    existente.
  - Toda corrida o espera de más de ~5 minutos se avisa antes y se informa
    el avance.
  - `explore-page.js` imprime al final un resumen de excepciones y errores
    de consola de toda la corrida (`summarizeProblems`), para que no quede
    enterrado en los informes.
- **Por qué:** revisión del usuario (2026-09-30) tras dos días de lotes. Las
  demoras venían de descuidos del asistente (excepciones sin revisar,
  esperas silenciosas) y de roturas ajenas descubiertas a mitad de un lote;
  y las herramientas crecían a un ritmo de una por error, sumando falsos
  positivos.
- **Dónde:** `lib/affected-specs.js` (`healthSpecs`) y
  `lib/explore-scenarios.js` (`summarizeProblems`) + tests;
  `run-and-report.js --health`; `explore-page.js`; skills `manager`,
  `discovery` y `ejecucion`.
- **Cambiado por D-35:** el chequeo de salud ya no se corre al empezar cada
  sesión.

### D-35 · Regresión solo si se modifica algo existente, y sin frenar el PR
- **Decisión:**
  - Si la rama solo **agrega** (spec, métodos, textos o selectores nuevos),
    no hay regresión: alcanza con la corrida del lote.
  - Si **modifica** algo existente (método, selector o texto ya usado,
    comando custom), corre solo los specs que usan eso.
  - Si es un **cambio global**, `--affected` como en D-33.
  - La regresión no frena el PR: corre en segundo plano después de abrirlo
    y su resultado se agrega al PR; el merge espera a que termine en verde.
  - El chequeo de salud (`--health`) deja de correrse al empezar cada
    sesión: solo a pedido o si una falla del lote parece ajena a la rama.
- **Por qué:** revisión del usuario (2026-09-30) tras el lote SCRUM-717: 45
  min de reloj, con 12,5 min esperando una regresión de 5 specs cuando la
  rama solo agregaba métodos (alcanzaba con 1 spec) y 3 min de chequeo de
  salud por sesión. La regresión por lote se había vuelto un reflejo (desde
  el 2026-09-27) sin que nadie lo decidiera. En un equipo real quien
  automatiza corre sus tests y no espera la regresión para abrir el PR. Se
  resuelve restando pasos, sin herramientas nuevas.
- **Dónde:** skills `ejecucion` (tabla de regresión) y `manager`.

### D-25 · Estándares de código Cypress
- **Decisión:** nada de `cy.wait()` estático, timeouts de 15 s como máximo,
  selectores relevados (nunca adivinados) en fixtures JSON. Al extraer un
  helper compartido, no se toca el spec dedicado a validar ese flujo paso a
  paso. Antes de borrar un spec "duplicado" se leen todos sus `it()`.
- **Por qué:** casos reales de OrangeHRM (PR #38) y del saneamiento
  (se hubieran perdido 2 escenarios únicos).
- **Dónde:** `CLAUDE.md` §2, skill `automation-review`.

---

## Arquitectura y portabilidad

### D-26 · Fronteras de herramientas verificadas por test
- **Decisión:** Jira/Xray, GitHub y el arranque de Cypress viven en archivos
  fijos, y `npm run test:unit` falla si aparecen en otro lado. El mapa está
  en `docs/architecture/herramientas.md`.
- **Por qué:** portabilidad. Cambiar una herramienta tiene que ser tocar
  pocos archivos conocidos (2026-09-28).
- **Dónde:** `lib/architecture.js` + su test.

### D-28 · Cada app en sus carpetas, verificado por test
- **Decisión:** toda carpeta de app se declara como activa o legado en
  `APPS` (`lib/architecture.js`). Una app activa tiene specs, Page Objects,
  selectores, comandos, discovery y script `test:<app>` en carpetas propias.
  No hay selectores sueltos, y cada archivo de comandos está importado.
  `cy.reconPage`, `cy.reconSubmit` y `twoRandomNum` se borraron del código.
- **Por qué:** 14 selectores de Automation Test Store estaban sueltos en la
  raíz de `fixtures/selectors/`, y los comandos "eliminados" seguían
  definidos. Nada lo detectaba (2026-09-28).
- **Dónde:** `checkAppLayout` + test en `npm run test:unit`.

### D-27 · Cypress no se aísla detrás de un adaptador (por ahora)
- **Decisión:** no se abstrae Cypress. Los specs y los Page Objects lo usan
  directamente.
- **Por qué:** es un costo alto sin un cambio de runner a la vista. Si
  llega, el mapa de herramientas dice qué tocar (2026-09-28).
