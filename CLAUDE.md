# REGISTRO Y REGLAS DE EJECUCIÓN DEL PROYECTO

## 1. MANDATORY EXECUTION PIPELINE (3 PASOS STRICT ORDER)

- **PASO 1 (Discovery):** Ejecutar `cy.reconPage` en el hilo principal antes de escribir código. Guardar artefacto PERMANENTE en `cypress/fixtures/selectors/<modulo>.json`. PROHIBIDO adivinar selectores o crear specs borrador/temporales.
- **PASO 2 (Recon & Xray):** Ejecutar `cy.reconSubmit` usando los selectores del JSON para mapear respuestas. Publicar HU, Test Cases y Test Cycles en Jira/Xray usando `v3/scripts/create-jira-task.js` en BATCH (un solo payload masivo secuencial).
- **PASO 3 (Execution & Git):** Validar rama base (`git branch`). Escribir `.page.js` (consumiendo el JSON) y `.cy.js`. Ejecutar Cypress UNA SOLA VEZ filtrando por el spec (`npx cypress run --quiet --reporter json --spec <ruta>`). Reportar a Xray y hacer commit/push directo si pasa 100%.

## 2. REGLAS DE PERFORMANCE & GOBERNANZA (INVIOLABLES)

- **PROHIBIDO SUBAGENTES / FORKS:** Ejecutar todo el proceso en el hilo principal. Prohibido delegar tareas a subagentes o forks en paralelo (causan latencia y alucinaciones).
- **ARTEFACTOS PERMANENTES:** Los archivos JSON en `cypress/fixtures/selectors/` son assets del repositorio. DEBEN commitearse en Git y NUNCA borrarse.
- **CONFIRMACIÓN DE MERGE:** El agente ejecuta todo automáticamente, EXCEPTO el merge a `main`, que requiere confirmación explícita del usuario.
- **XRAY ADAPTER:** Usar exclusivamente `v3/scripts/create-jira-task.js` con `testcaseModels` para la generación masiva y orden correlativo de Test Cases.
- **HU & CA GRANULARITY:** Respetar la matriz de 2 a 4 Criterios de Aceptación (CA) atómicos por Historia de Usuario según la regla de negocio, separando acciones destructivas en HUs independientes.
- **CODE QUALITY STANDARDS:** Prohibido `cy.wait()` estáticos (usar esperas dinámicas), timeouts máximos de 15s y selectores resilientes.

## 3. ESTÁNDARES DE XRAY/JIRA

- **ESTRUCTURA DE PASOS EN XRAY (OBLIGATORIO):** Queda prohibido resumir el Test Case en 1 sola fila genérica. Cada Test Case en Xray debe contar con al menos 2 pasos estructurados en su tabla:
  - **Paso 1 (Navegación / Precondición activa):** Declarar explícitamente la entrada a la pantalla/URL objetivo y verificar el estado inicial.
  - **Paso 2 (Acción e Interacción):** Describir la acción concreta del usuario sobre la UI (ingresar datos, clic en botón específico) y validar los resultados esperados detallados.
