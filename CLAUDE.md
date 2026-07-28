# Reglas de ejecución rápida

Objetivo: el flujo completo de una User Story (Jira/Zephyr -> spec Cypress -> ejecución -> git) debe tardar menos de 7 minutos. Estas reglas son de aplicación directa, no requieren re-confirmarlas en cada tarea.

1. **Ejecución monolítica.** Un único agente ejecuta el flujo completo de forma lineal (Jira/Zephyr -> spec Cypress -> ejecución -> git), sin delegar en cadena entre roles (Manager -> QA -> Dev) ni esperar confirmaciones intermedias entre esos pasos.

   Excepción: **mergear una rama a `main` sigue requiriendo confirmación explícita del usuario antes de ejecutarlo.** Es una acción sobre estado compartido y visible del repositorio, no overhead de agentes — no se elimina por esta regla.

2. **Paralelización de llamadas a Zephyr.** Al crear varios Test Cases del mismo issue, usar `scripts/create-jira-task.js` con el campo `testcaseModels` (array, plural) en vez de invocar el script una vez por Test Case. Internamente (`createTestCasesBatch` en `scripts/create-jira-task.js`) se resuelve primero, de forma secuencial, el `folderId` de cada ruta de carpeta única y el Test Cycle (si corresponde) — son operaciones "buscar o crear" que no son seguras de paralelizar (dos llamadas concurrentes podrían no ver el recurso recién creado y duplicarlo). Recién con esos ids ya resueltos, la creación de cada Test Case (+ steps + link + ejecución) se dispara en paralelo con `Promise.all`.

3. **No auditar archivos fuera del scope de la tarea actual.** No revisar, diffear ni preguntar por specs, Page Objects o código de otras tareas/tickets que no sean los de la User Story en curso.

   Excepción: esto no aplica a archivos de configuración de permisos (ej. `.claude/settings.local.json`). Si aparece ahí un cambio sin atribuir (un permiso nuevo no explicado por la tarea en curso), se menciona en una sola línea sin bloquear el flujo — no se ignora por completo.

4. **Flujo directo post-ejecución.** Si Cypress corre y devuelve exit code 0 (`passing`), eso es evidencia suficiente: hacer commit y push directo a la rama de feature de inmediato, sin pedir capturas ni evidencia adicional, y sin abrir debates internos sobre el resultado.

# Reglas de Arquitectura, Diseño de HUs y Pruebas Automatizadas

Aplican a todo el desarrollo del proyecto de aquí en adelante, no solo a la tarea en curso. No requieren re-confirmarse en cada tarea.

1. **Granularidad y alcance de Historias de Usuario (HU).** Las HU deben representar capacidades de negocio, no pantallas ni escenarios. Se pueden agrupar funcionalidades cuando forman parte de una misma capacidad y entregan valor conjuntamente (ej: "ver el carrito tras agregar un producto" es parte de la HU de agregar). Deben considerarse HU independientes cuando una funcionalidad:
   - representa un objetivo diferente;
   - puede evolucionar de forma autónoma;
   - puede implementarse de forma independiente;
   - incrementa significativamente la complejidad de la HU (ej: acciones destructivas como eliminar, editar, aplicar cupones, etc.).

   No existe una regla rígida — cada decisión de agrupar o separar debe justificarse explícitamente (ver regla 6, Justificación obligatoria).

2. **Estructura y atomicidad de Criterios de Aceptación (CA).** Cada CA representa una única regla de negocio — no un escenario ni un caso de prueba aislado — con un identificador unívoco CA-01, CA-02, CA-03... (numeración global dentro de la HU, nunca se reinicia entre criterios). Crear un CA independiente únicamente cuando cambie la regla de negocio, el estado final o el comportamiento esperado. Distintos puntos de acceso de la interfaz (ej. listado vs. detalle, catálogo vs. carrito) PUEDEN compartir un mismo CA si validan exactamente la misma regla; se separan en CA distintos solo cuando el punto de entrada conlleva una regla, un estado o un comportamiento diferente — no por el solo hecho de estar en una pantalla distinta.

3. **Método de análisis para generar CAs.** Al analizar cualquier Historia de Usuario, NUNCA te limites a 1 solo Criterio de Aceptación. Debes evaluar obligatoriamente:

   1. Puntos de entrada de UI (¿se ejecuta desde más de una pantalla o componente, y eso cambia la regla de negocio?).
   2. Estados resultantes (¿cómo afecta a contadores, listas vacías o elementos visibles?).
   3. Variaciones de flujo/límites (¿qué ocurre con 1 elemento vs. múltiples elementos?).

   **Regla de cantidad:** toda HU debe contar con un mínimo de 2 a 4 Criterios de Aceptación (CA) atómicos según esta matriz.

4. **Nomenclatura y trazabilidad en pruebas (Cypress/Zephyr).** Todo Test Case creado en Zephyr y todo bloque `it(...)` de Cypress debe incluir en su título el identificador del CA y del TC que valida, con la convención:

   ```js
   it('[CA-XX][TC-XX.X][SCRUM-Txx] Descripción clara de lo que prueba', () => { ... })
   ```

   El tag `[SCRUM-Txx]` (key real del Test Case en Zephyr) se mantiene junto a `[CA-XX][TC-XX.X]` porque el mecanismo de reporte automático (`--report-results`) depende de él para resolver la Test Execution a actualizar — sin ese tag el reporte a Zephyr deja de funcionar.

5. **Integración de reportes con Zephyr (export a archivo real).** Los resultados de cada corrida de Cypress deben guardarse en un archivo físico en disco, no confiar solo en el `stdout`. Comando validado:

   ```
   npx cypress run --quiet --reporter json > archivo.json
   ```

   El flag `--quiet` es imprescindible: sin él, Cypress mezcla sus propias cajas decorativas de la CLI con el JSON del reporter Mocha en el mismo `stdout`, y el archivo resultante no es JSON válido. Luego reportar con `node scripts/create-jira-task.js --report-results archivo.json --test-cycle <TestCycleKey>` para que las Test Executions queden en "Pass"/"Fail" reales, nunca en "Not Executed" por defecto. El archivo de resultados es un artefacto temporal: generarlo en el directorio de scratchpad, nunca commitearlo al repo.

6. **Justificación obligatoria.** Al finalizar la propuesta de una HU (o de su reestructuración), incluir siempre un apartado de explicación que detalle:
   - por qué se agruparon determinadas funcionalidades;
   - por qué otras se separaron;
   - qué criterio arquitectónico se utilizó (regla 1 para HU, regla 2-3 para CA).

7. **Flujo de trabajo por tarea.** Para cada nueva tarea: analizar el requerimiento, estructurar la HU y sus CA bajo las reglas 1-3, justificar explícitamente el agrupamiento/separación (regla 6), implementar el Page Object y el spec de Cypress correspondiente (regla 4), ejecutar `npx cypress run` localmente y reportar a Zephyr (regla 5), y completar el ciclo de Git (commit, push, Pull Request) según las Reglas de ejecución rápida de más arriba.

8. **Script npm por aplicación.** Al crear el primer spec de Cypress para una aplicación/página nueva (carpeta nueva bajo `cypress/e2e/<app>/`), agregar en `package.json` un script `test:<app>` siguiendo el patrón ya existente:

   ```json
   "test:<app>": "cypress run --spec \"cypress/e2e/<app>/**/*.cy.js\""
   ```

   Esto se hace una sola vez por aplicación (no por spec ni por HU); si el script `test:<app>` ya existe, no se toca.

9. **Organización de specs por Módulo/Flujo Funcional.** Los specs de Cypress se agrupan por módulo o flujo funcional de la aplicación (ej: autenticación, empleados, carrito), no un spec por Test Case individual. Cada bloque `it(...)` dentro del spec sigue siendo un Test Case atómico con su tag `[CA-XX][TC-XX.X][SCRUM-Txx]` (regla 4); lo que cambia es que varios `it(...)` relacionados por el mismo módulo conviven en un único archivo `describe(...)`, en vez de un archivo `.cy.js` por cada uno. Al implementar un nuevo Test Case, primero verificar si ya existe un spec del mismo módulo en `cypress/e2e/<app>/` y agregar el `it(...)` ahí antes de crear un archivo nuevo.

# Estándares y Performance de Cypress

- **Timeouts Realistas:** `pageLoadTimeout` debe estar configurado en máximo 15000-30000ms en `cypress.config.js`.
- **Cero Retries Infinitos:** En ejecuciones locales/desarrollo usar `retries: 0` o `1` para detectar fallos al instante sin desperdiciar tiempo.
- **Sin Esperas Estáticas:** Queda prohibido el uso de `cy.wait(ms)` fijos. Utilizar siempre esperas dinámicas basadas en la visibilidad de elementos (`.should('be.visible')`) o intercepción de red (`cy.intercept()`).
- **Selectores Resilientes:** Priorizar atributos estáticos, roles o texto. Evitar clases CSS generadas dinámicamente por frameworks (hashes o sufijos tipo `-1-x-`).
- **Proyectos y Entornos:** Los casos de prueba principales deben automatizarse prioritariamente sobre aplicaciones objetivo controladas (ej. SauceDemo / AutomationExercise).
