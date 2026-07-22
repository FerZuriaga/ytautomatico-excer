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

1. **Granularidad y alcance de Historias de Usuario (HU).** Cada HU debe representar una única Capacidad de Negocio Principal. No combinar múltiples capacidades independientes en una misma HU. La verificación o visualización del estado resultante de una acción se considera parte de la validación de esa misma HU, no una HU independiente (ej: "ver el carrito tras agregar un producto" es parte de la HU de agregar, no una HU aparte). Si una funcionalidad requiere acciones adicionales o destructivas (eliminar, editar, aplicar cupones, etc.), proponer explícitamente dividirlas en HUs independientes antes de automatizar.

2. **Estructura y atomicidad de Criterios de Aceptación (CA).** Cada CA debe representar una única regla de negocio, aislada de las demás, con un identificador unívoco CA-01, CA-02, CA-03... La numeración es global dentro de la HU y nunca se reinicia entre criterios.

3. **Nomenclatura y trazabilidad en pruebas (Cypress/Zephyr).** Todo Test Case creado en Zephyr y todo bloque `it(...)` de Cypress debe incluir en su título el identificador del CA y del TC que valida, con la convención:

   ```js
   it('[CA-XX][TC-XX.X][SCRUM-Txx] Descripción clara de lo que prueba', () => { ... })
   ```

   El tag `[SCRUM-Txx]` (key real del Test Case en Zephyr) se mantiene junto a `[CA-XX][TC-XX.X]` porque el mecanismo de reporte automático (`--report-results`) depende de él para resolver la Test Execution a actualizar — sin ese tag el reporte a Zephyr deja de funcionar.

4. **Integración de reportes con Zephyr (export a archivo real).** Los resultados de cada corrida de Cypress deben guardarse en un archivo físico en disco, no confiar solo en el `stdout`. Comando validado:

   ```
   npx cypress run --quiet --reporter json > archivo.json
   ```

   El flag `--quiet` es imprescindible: sin él, Cypress mezcla sus propias cajas decorativas de la CLI con el JSON del reporter Mocha en el mismo `stdout`, y el archivo resultante no es JSON válido. Luego reportar con `node scripts/create-jira-task.js --report-results archivo.json --test-cycle <TestCycleKey>` para que las Test Executions queden en "Pass"/"Fail" reales, nunca en "Not Executed" por defecto. El archivo de resultados es un artefacto temporal: generarlo en el directorio de scratchpad, nunca commitearlo al repo.

5. **Flujo de trabajo por tarea.** Para cada nueva tarea: analizar el requerimiento, estructurar la HU y sus CA bajo las reglas 1-2, implementar el Page Object y el spec de Cypress correspondiente (regla 3), ejecutar `npx cypress run` localmente y reportar a Zephyr (regla 4), y completar el ciclo de Git (commit, push, Pull Request) según las Reglas de ejecución rápida de más arriba.
