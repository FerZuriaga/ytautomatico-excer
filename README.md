# ytautomatico-excer

Suite de pruebas E2E con Cypress para varios sitios. Jira/Xray es la única
fuente de verdad de Historias y Test Cases (ver `CLAUDE.md`).

## Estado de las apps

| Carpeta (`cypress/e2e/`) | Estado | Trazabilidad |
|---|---|---|
| `automation-test-store` | Activa | Xray: `[CA-XX][TC-XX.Y][SCRUM-NNN]`, validada con `check-traceability` |
| `commitquality` | Activa | Xray: `[CA-XX][TC-XX.Y][SCRUM-NNN]`, validada con `check-traceability` |
| `expandtesting-notes` | Activa | Xray: `[CA-XX][TC-XX.Y][SCRUM-NNN]`, validada con `check-traceability` |
| `practicesoftwaretesting` | Activa | Xray: `[CA-XX][TC-XX.Y][SCRUM-NNN]`, validada con `check-traceability` |
| `restful-booker-platform` | Activa | Xray: `[CA-XX][TC-XX.Y][SCRUM-NNN]`, validada con `check-traceability` |

**Legado:** las 7 apps de la etapa Zephyr/experimental y las herramientas
v1/v2 se sacaron de `main` el 2026-10-03; siguen en la etiqueta git
`legado-2026-10-03` (D-09). Una app nueva siempre sigue el pipeline de
`CLAUDE.md` con trazabilidad a Xray.

Cada app activa tiene sus piezas en carpetas propias: `cypress/e2e/<app>/`,
`cypress/pages/<app>/`, `cypress/fixtures/selectors/<app>/`,
`cypress/support/commands/<app>.js`, `docs/discovery/<app>.md` y el script
`test:<app>` (más `v3/data-recipes/<app>.json` si tiene API para preparar
datos). `npm run test:unit` lo verifica: una carpeta de app sin declarar,
una pieza faltante o un selector suelto hacen fallar la suite. Al sumar una
app, declararla en `APPS` de `v3/scripts/lib/architecture.js`.

## Configuración de entorno (URLs por sitio)

Las URLs de cada sitio bajo prueba **no están hardcodeadas en el código**:
viven como defaults en el bloque `env` de `cypress.config.js` y se leen
desde los comandos custom (`cypress/support/commands/*.js`) con
`Cypress.env('<nombreDeLaVariable>')`.

| Variable              | Sitio              | Default (producción/demo actual)          |
|------------------------|---------------------|--------------------------------------------|
| `automationTestStoreUrl` | Automation Test Store | `https://automationteststore.com`       |
| `commitqualityUrl`      | CommitQuality       | `https://commitquality.com`               |
| `expandtestingNotesUrl` | Expand Testing Notes | `https://practice.expandtesting.com`     |
| `practicesoftwaretestingUrl` | Practice Software Testing | `https://practicesoftwaretesting.com` |
| `restfulBookerPlatformUrl` | Restful Booker Platform | `https://automationintesting.online` |

### Cómo apuntar los tests a otra URL sin tocar código

Para correr la suite (o un spec puntual) contra otro entorno, se pasa la
variable como `CYPRESS_<nombreDeLaVariable>` antes del comando:

```bash
CYPRESS_expandtestingNotesUrl=https://staging.example.com npx cypress run --spec "cypress/e2e/expandtesting-notes/**/*.cy.js"
```

También funciona con `--env` en vez de la variable de entorno:

```bash
npx cypress run --env expandtestingNotesUrl=https://staging.example.com --spec "cypress/e2e/expandtesting-notes/**/*.cy.js"
```

Sin overrides, cada comando usa el default de `cypress.config.js` (el
sitio real/demo pública actual) — no hace falta declarar nada para el uso
normal.

**Nota:** hoy ninguno de los sitios de este proyecto tiene un entorno de
staging propio (son demos públicas de terceros o el sitio real de un
gobierno), así que este mecanismo queda listo para el día en que se use
este framework contra una aplicación propia con staging real.

## Herramientas del pipeline (v3)

| Paso | Script | Qué hace |
|---|---|---|
| 1. Discovery | `node v3/scripts/explore-page.js --scenarios <archivo.json>` (o `--url <url>`) | Explora las pantallas del lote con navegador real en una sola corrida: requests de red (método y status), `data-test` visibles/ocultos, idioma, almacenamiento y errores de consola. Los datos que necesita cada escenario se preparan por API con las recetas de `v3/data-recipes/<app>.json`. Informe fuera del repo. |
| 2. Jira/Xray | `node v3/scripts/create-jira-task.js --data <lote.json> --dry-run` | Valida HU, criterios y Test Cases; sin `--dry-run` publica el lote (Historias, Test Cases, Test Cycles). |
| 3. Ejecución | `node v3/scripts/run-and-report.js --spec <specs> --test-cycle <ciclos>` | Verifica la trazabilidad, corre Cypress y reporta a Xray solo si pasa el 100%. |
| 3. Trazabilidad | `node v3/scripts/check-traceability.js --spec <carpeta>` | Cruza los tags `[CA-XX][TC-XX.Y][SCRUM-NNN]` de los specs contra Jira/Xray. |
| 3. PR | `node v3/scripts/create-pull-request.js --action create --head <rama> --title "<t>"` | Abre el Pull Request por la API de GitHub. |

Tests unitarios de la lógica del pipeline: `npm run test:unit`. Incluyen el
chequeo de fronteras de arquitectura: qué archivo puede hablar con Jira/Xray,
GitHub o Cypress (mapa en `docs/architecture/herramientas.md`).

Decisiones del proyecto y su porqué: `docs/decisiones.md`.

## Scripts disponibles

```bash
npm ci                                  # instala dependencias (node_modules no se versiona)
npm run test:unit                       # lógica del pipeline, sin navegador
npm run test:expandtesting-notes        # una app activa (igual con las otras 4)
```
