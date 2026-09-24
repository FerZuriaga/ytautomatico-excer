# ytautomatico-excer

Suite de pruebas E2E con Cypress para varios sitios. Jira/Xray es la única
fuente de verdad de Historias y Test Cases (ver `CLAUDE.md`).

## Estado de las apps

| Carpeta (`cypress/e2e/`) | Estado | Trazabilidad |
|---|---|---|
| `automation-test-store` | Activa | Xray: `[CA-XX][TC-XX.Y][SCRUM-NNN]`, validada con `check-traceability` |
| `commitquality` | Activa | Xray: `[CA-XX][TC-XX.Y][SCRUM-NNN]`, validada con `check-traceability` |
| `saucedemo`, `orangehrm`, `argentinagobar`, `rentascordoba`, `disco` | Legado | Tags `[SCRUM-Txx]` de Zephyr (discontinuado) |
| `automation-exercise`, `blazedemo` | Legado | Sin tags o con keys de la etapa experimental (SCRUM-1 a 42, archivados) |

**Legado** (decisión del 2026-09-24): se conservan como regresión que corre
con `npm run test:<app>`, pero no se modifican, no se migran a Xray, no
reportan resultados y no se les corre `check-traceability` (sus keys no
existen en Xray). Sus Historias y Test Cases son anteriores a las reglas
de calidad actuales. Una app nueva siempre sigue el pipeline de
`CLAUDE.md` con trazabilidad a Xray.

## Configuración de entorno (URLs por sitio)

Las URLs de cada sitio bajo prueba **no están hardcodeadas en el código**:
viven como defaults en el bloque `env` de `cypress.config.js` y se leen
desde los comandos custom (`cypress/support/commands/*.js`) con
`Cypress.env('<nombreDeLaVariable>')`.

| Variable              | Sitio              | Default (producción/demo actual)          |
|------------------------|---------------------|--------------------------------------------|
| `automationExerciseUrl` | AutomationExercise  | `https://automationexercise.com`          |
| `blazedemoUrl`          | BlazeDemo           | `https://blazedemo.com`                   |
| `discoUrl`              | Disco Online        | `https://www.disco.com.ar`                |
| `orangehrmUrl`          | OrangeHRM           | `https://opensource-demo.orangehrmlive.com` |
| `rentascordobaUrl`      | Rentas Córdoba      | `https://www.rentascordoba.gob.ar`        |
| `saucedemoUrl`          | SauceDemo           | `https://www.saucedemo.com`               |

### Cómo apuntar los tests a otra URL sin tocar código

Para correr la suite (o un spec puntual) contra otro entorno, se pasa la
variable como `CYPRESS_<nombreDeLaVariable>` antes del comando:

```bash
CYPRESS_orangehrmUrl=https://staging.orangehrmlive.com npx cypress run --spec "cypress/e2e/orangehrm/**/*.cy.js"
```

También funciona con `--env` en vez de la variable de entorno:

```bash
npx cypress run --env orangehrmUrl=https://staging.orangehrmlive.com --spec "cypress/e2e/orangehrm/**/*.cy.js"
```

Sin overrides, cada comando usa el default de `cypress.config.js` (el
sitio real/demo pública actual) — no hace falta declarar nada para el uso
normal.

**Nota:** hoy ninguno de los sitios de este proyecto tiene un entorno de
staging propio (son demos públicas de terceros o el sitio real de un
gobierno), así que este mecanismo queda listo para el día en que se use
este framework contra una aplicación propia con staging real.

## Scripts disponibles

```bash
npm run test:automation-exercise
npm run test:orangehrm
npm run test:blazedemo
npm run test:saucedemo
npm run test:disco
npm run test:rentascordoba
```
