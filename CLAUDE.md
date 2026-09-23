# REGISTRO Y REGLAS DE EJECUCIÓN DEL PROYECTO

## 1. MANDATORY EXECUTION PIPELINE (3 PASOS STRICT ORDER)

- **PASO 1 (Discovery):** Antes de cualquier `curl` nuevo, consultar `docs/discovery/<app>.md` (si existe) para reusar patrones estructurales y datos de prueba ya verificados en sesiones previas. Inspeccionar el HTML real de la pantalla objetivo directamente (ej. `curl`/fetch fuera de Cypress) SOLO para lo que no esté ya documentado ahí, sin levantar Cypress para reconocimiento previo. **PROHIBIDO usar `cy.reconPage`/`cy.reconSubmit`** o cualquier corrida de Cypress con fines de discovery. Guardar los selectores relevados como artefacto PERMANENTE en `cypress/fixtures/selectors/<modulo>.json`, y si el hallazgo es un patrón que se repite en 2+ módulos (no exclusivo de esta HU), agregarlo también a `docs/discovery/<app>.md`. PROHIBIDO adivinar selectores o crear specs borrador/temporales.
- **PASO 2 (Jira/Xray):** Publicar HU, Test Cases y Test Cycles en Jira/Xray usando `v3/scripts/create-jira-task.js` en BATCH (un solo payload masivo secuencial), en base a lo relevado en el PASO 1.
- **PASO 3 (Execution & Git):** Validar rama base (`git branch`). Escribir `.page.js` (consumiendo el JSON) y `.cy.js`. Ejecutar Cypress UNA SOLA VEZ filtrando por el spec (`npx cypress run --quiet --reporter json --spec <ruta>`). Reportar a Xray y hacer commit/push directo si pasa 100%.

## 2. REGLAS DE PERFORMANCE & GOBERNANZA (INVIOLABLES)

- **PROHIBIDO SUBAGENTES / FORKS:** Ejecutar todo el proceso en el hilo principal. Prohibido delegar tareas a subagentes o forks en paralelo (causan latencia y alucinaciones).
- **PROHIBIDO RECON CON CYPRESS:** `cy.reconPage`/`cy.reconSubmit` quedan eliminados del pipeline. El reconocimiento se hace leyendo el HTML real directamente (fuera de Cypress), y Cypress se ejecuta una única vez al final (PASO 3), nunca para explorar.
- **ARTEFACTOS PERMANENTES:** Los archivos JSON en `cypress/fixtures/selectors/` y los archivos de referencia en `docs/discovery/` son assets del repositorio. DEBEN commitearse en Git y NUNCA borrarse.
- **BLINDAJE DE `v3/scripts/lib/`:** Cualquier cambio en la lógica de parseo/reporte de resultados (`test-runner.js`, `xray.js`, `jira.js`) DEBE correr `npm run test:unit` antes de darse por válido, y agregar un caso de test nuevo si el cambio corrige un bug real (no solo el fix puntual, para que no vuelva a romperse en caliente).
- **CONFIRMACIÓN DE MERGE:** El agente ejecuta todo automáticamente, EXCEPTO el merge a `main`, que requiere confirmación explícita del usuario.
- **XRAY ADAPTER:** Usar exclusivamente `v3/scripts/create-jira-task.js` con `testcaseModels` para la generación masiva y orden correlativo de Test Cases.
- **HU & CA GRANULARITY:** Respetar la matriz de 2 a 4 Criterios de Aceptación (CA) atómicos por Historia de Usuario según la regla de negocio, separando acciones destructivas en HUs independientes.
  - **Los CA salen de las reglas de negocio relevadas en el PASO 1, no de un número objetivo.** Cada CA corresponde a UNA regla concreta (camino feliz, validaciones, permisos/acceso, efectos de estado/persistencia), observable, verificable y en lenguaje de negocio. 2 es el MÍNIMO, no el molde.
  - Menos de 2 reglas relevadas = falta discovery (error del validador). Más de 4 = evaluar split de la HU (warning del validador), no amontonar CA.
  - Cada CA lleva id al inicio (`"CA-01: ..."`) y cada Test Case declara el CA que valida con el campo `criterio: "CA-01"` (entre 2 y 5 TC por CA), auditado por `testcase-validator.js` antes de publicar.
- **CODE QUALITY STANDARDS:** Prohibido `cy.wait()` estáticos (usar esperas dinámicas), timeouts máximos de 15s y selectores resilientes.

## 3. ESTÁNDARES DE XRAY/JIRA

- **ESTRUCTURA DE PASOS EN XRAY (OBLIGATORIO):** Queda prohibido resumir el Test Case en 1 sola fila genérica. Cada Test Case en Xray debe contar con al menos 2 pasos estructurados en su tabla:
  - **Paso 1 (Navegación / Precondición activa):** Declarar explícitamente la entrada a la pantalla/URL objetivo y verificar el estado inicial.
  - **Paso 2 en adelante (Acción e Interacción):** Describir la acción concreta del usuario sobre la UI (ingresar datos, clic en botón específico) y validar los resultados esperados detallados.
- **UN PASO POR ACCIÓN VERIFICABLE:** 2 es el MÍNIMO, no la cantidad por defecto. Cada acción del usuario que produce un resultado verificable va en su propio paso con su propio resultado esperado (ej. filtrar → 5 filas / eliminar → 4 filas / Reset → 10 filas = 3 pasos, no 1). PROHIBIDO encadenar varias acciones en un mismo paso ("filtrar, eliminar y volver"). Los casos de una sola acción siguen quedando en 2 pasos (no inflar con relleno).
- **VALIDACIÓN AUTOMÁTICA PREVIA:** `create-jira-task.js --data` valida los pasos con `v3/scripts/lib/testcase-validator.js` antes de publicar. Los errores frenan siempre. Los warnings frenan salvo `--accept-warnings`, que SOLO se usa después de revisar cada warning y confirmar que es un falso positivo (nunca para "destrabar" la publicación sin corregir el payload).
- **PRECONDICIÓN SEPARADA DE LOS PASOS:** El estado previo que no es objeto de la prueba (sesión iniciada, datos semilla, etc.) va en el campo `precondition` del Test Case, NO repetido como acción dentro del Paso 1.
