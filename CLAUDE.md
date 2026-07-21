# Reglas de ejecución rápida

Objetivo: el flujo completo de una User Story (Jira/Zephyr -> spec Cypress -> ejecución -> git) debe tardar menos de 7 minutos. Estas reglas son de aplicación directa, no requieren re-confirmarlas en cada tarea.

1. **Ejecución monolítica.** Un único agente ejecuta el flujo completo de forma lineal (Jira/Zephyr -> spec Cypress -> ejecución -> git), sin delegar en cadena entre roles (Manager -> QA -> Dev) ni esperar confirmaciones intermedias entre esos pasos.

   Excepción: **mergear una rama a `main` sigue requiriendo confirmación explícita del usuario antes de ejecutarlo.** Es una acción sobre estado compartido y visible del repositorio, no overhead de agentes — no se elimina por esta regla.

2. **Paralelización de llamadas a Zephyr.** Al crear varios Test Cases del mismo issue, usar `scripts/create-jira-task.js` con el campo `testcaseModels` (array, plural) en vez de invocar el script una vez por Test Case. Internamente (`createTestCasesBatch` en `scripts/create-jira-task.js`) se resuelve primero, de forma secuencial, el `folderId` de cada ruta de carpeta única y el Test Cycle (si corresponde) — son operaciones "buscar o crear" que no son seguras de paralelizar (dos llamadas concurrentes podrían no ver el recurso recién creado y duplicarlo). Recién con esos ids ya resueltos, la creación de cada Test Case (+ steps + link + ejecución) se dispara en paralelo con `Promise.all`.

3. **No auditar archivos fuera del scope de la tarea actual.** No revisar, diffear ni preguntar por specs, Page Objects o código de otras tareas/tickets que no sean los de la User Story en curso.

   Excepción: esto no aplica a archivos de configuración de permisos (ej. `.claude/settings.local.json`). Si aparece ahí un cambio sin atribuir (un permiso nuevo no explicado por la tarea en curso), se menciona en una sola línea sin bloquear el flujo — no se ignora por completo.

4. **Flujo directo post-ejecución.** Si Cypress corre y devuelve exit code 0 (`passing`), eso es evidencia suficiente: hacer commit y push directo a la rama de feature de inmediato, sin pedir capturas ni evidencia adicional, y sin abrir debates internos sobre el resultado.
