# ytautomatico-excer

[![Nocturna Notes App](https://github.com/FerZuriaga/ytautomatico-excer/actions/workflows/nocturna-notes.yml/badge.svg)](https://github.com/FerZuriaga/ytautomatico-excer/actions/workflows/nocturna-notes.yml)

Caso de estudio de automatización E2E con criterio de QA: de una regla de
negocio relevada en la app a un test de Cypress que reporta su resultado en
Jira/Xray, con trazabilidad verificada en cada paso. Jira/Xray es la única
fuente de verdad de Historias y Test Cases.

## Qué muestra este repo

**Trazabilidad de punta a punta, controlada por código:**

```
Historia (SCRUM-804)                    "Cambiar mi contraseña"
  └─ Criterio CA-06                     una regla de negocio, en una oración
       └─ Test Case SCRUM-835           pasos en Xray, label CA-06 / negativo
            └─ it('[CA-06][TC-06.3][SCRUM-835] ...')   en el spec
                 └─ ejecución PASSED en el Test Cycle SCRUM-805
```

**Ver la trazabilidad completa sin acceso a Jira:**
[`docs/trazabilidad/expandtesting-notes.md`](docs/trazabilidad/expandtesting-notes.md)
— las 12 Historias de Notes App con sus 48 criterios, los 143 Test Cases
con sus pasos tal como están en Xray, el `it()` que automatiza cada uno y su
último resultado (generado desde Jira/Xray, D-41).

Antes de cada corrida, `check-traceability` cruza cada `it()` con Xray: una
key mal copiada, un TC colgado de otro criterio o un Test sin vincular a la
Historia frenan la ejecución. Los resultados se reportan solo si la corrida
pasa al 100%, y se verifican leyendo los ciclos.

**Calidad de la especificación, no solo del código.** Los validadores
frenan la publicación de Test Cases con pasos que verifican en la acción,
varios datos en un paso, negativos sin evidencia de haberse ejecutado,
Historias con criterios que juntan dos reglas o Bugs que especulan sobre el
código. Cada regla nació de un error real y tiene su test
(`npm run test:unit`, 235 tests).

**Defectos encontrados en el camino.** Un ejemplo: al revisar la Historia de
cambio de contraseña, el discovery mostró que dos logins de la misma cuenta
comparten el token y que cambiar la contraseña no lo renueva: quien ya
había entrado con la contraseña vieja sigue adentro (Bug SCRUM-833, con
captura). Lo que contradice el objetivo de la Historia va a Bug, nunca a un
criterio de aceptación.

## Números (al 2026-10-03)

| | |
|---|---|
| Apps activas | 5 (demos públicas de terceros) |
| Specs / `it()` | 70 / 542 (16 en `it.skip` por bugs conocidos, con su key) |
| Corridas registradas desde el 2026-09-27 | 42 lotes, 758 tests ejecutados, 6 pasaron recién en el reintento |
| Tiempo de un lote (HU → Jira/Xray → tests verdes → PR) | de 45 min (SCRUM-717) a ~11-13 min (SCRUM-730, SCRUM-786) |
| Reporte a Xray por corrida | de 38-49 s a 3-8 s (plan de reporte + escrituras en paralelo, D-29) |
| Decisiones de trabajo documentadas | 40, con su porqué (`docs/decisiones.md`) |

## Cómo se trabaja

Un lote sigue siempre el mismo documento, `docs/lote.md`:

| Paso | Script | Qué hace |
|---|---|---|
| 1. Discovery | `node v3/scripts/explore-page.js --scenarios <archivo.json>` | Explora las pantallas con navegador real en una sola corrida: requests (método y status), atributos de test, idioma, almacenamiento y errores de consola. Los datos se preparan por API con recetas (`v3/data-recipes/<app>.json`). Cada negativo se ejecuta antes de especificarlo. |
| 2. Jira/Xray | `node v3/scripts/create-jira-task.js --data <lote.json> --dry-run` | Valida Historia, criterios y Test Cases; sin `--dry-run` publica el lote (Historias, Test Cases, Test Cycles). |
| 3. Ejecución | `node v3/scripts/run-and-report.js --spec <specs> --test-cycle <ciclos>` | Verifica la trazabilidad, corre Cypress y reporta a Xray solo si pasa el 100%. |
| 3. PR | `node v3/scripts/create-pull-request.js --action create ...` | Abre el Pull Request por la API de GitHub, con una auditoría por Historia (criterio, resultados, TC con pasos, bordes). |

- **Por qué** de cada regla: `docs/decisiones.md`.
- **Hallazgos por app** (comportamientos, gotchas, selectores): `docs/discovery/<app>.md`.
- **Qué archivo habla con cada herramienta** (Jira, Xray, Cypress, GitHub): `docs/architecture/herramientas.md`; `npm run test:unit` falla si una frontera se cruza.

## Apps

| Carpeta (`cypress/e2e/`) | Sitio | Datos |
|---|---|---|
| `expandtesting-notes` | [Notes App](https://practice.expandtesting.com/notes/app) | Aislados: cada test registra su usuario |
| `practicesoftwaretesting` | [Toolshop](https://practicesoftwaretesting.com) | Demo compartida |
| `automation-test-store` | [Automation Test Store](https://automationteststore.com) | Demo compartida |
| `restful-booker-platform` | [Restful Booker Platform](https://automationintesting.online) | Demo compartida, se re-siembra |
| `commitquality` | [CommitQuality](https://commitquality.com) | Demo compartida |

Cada app tiene sus piezas en carpetas propias: `cypress/e2e/<app>/`,
`cypress/pages/<app>/`, `cypress/fixtures/selectors/<app>/`,
`cypress/support/commands/<app>.js`, `docs/discovery/<app>.md` y el script
`test:<app>`. `npm run test:unit` lo verifica. Al sumar una app, declararla
en `APPS` de `v3/scripts/lib/architecture.js`.

**Corrida nocturna:** GitHub Actions corre Notes App todas las noches (el
badge de arriba). Solo esa app: las demás son demos compartidas cuyos datos
cambian por otros testers, y un rojo ajeno al código no aporta (D-06). No es
requisito de merge.

**Legado:** las apps y herramientas de la etapa Zephyr/experimental se
sacaron de `main` el 2026-10-03 y siguen en la etiqueta git
`legado-2026-10-03` (D-09).

## Correrlo

```bash
npm ci                                  # dependencias
npm run test:unit                       # lógica del pipeline, sin navegador
npm run test:expandtesting-notes        # una app (igual con las otras 4)
```

Las URLs de cada sitio son defaults del bloque `env` de `cypress.config.js`
y se cambian sin tocar código:

```bash
CYPRESS_expandtestingNotesUrl=https://staging.example.com npx cypress run --spec "cypress/e2e/expandtesting-notes/**/*.cy.js"
```

Publicar en Jira/Xray y abrir PRs necesita un `.env` con `JIRA_URL`,
`JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY`, `XRAY_CLIENT_ID`,
`XRAY_CLIENT_SECRET` y `GITHUB_TOKEN`; correr los tests no.
