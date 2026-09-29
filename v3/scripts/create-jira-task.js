/**
 * CLI / fachada de compatibilidad: crea o actualiza un issue
 * (Historia/Bug/Tarea) en Jira, publica Test Cases en Xray, y reporta
 * resultados de ejecución — orquestando los Adapters de lib/jira.js,
 * lib/xray.js y lib/test-runner.js.
 *
 * Mismo uso de siempre (ver docs/architecture/architecture-v2-phase2-
 * component-design.md, sección 8, punto 8 — se preserva la compatibilidad
 * de esta CLI a propósito):
 *
 * Uso: node scripts/create-jira-task.js --data <archivo.json> [issueKey] [--transition "<Estado>"] [--comment "<texto>"]
 *   Sin issueKey  → crea un nuevo issue a partir del JSON
 *   Con issueKey  → actualiza el issue existente (ej: SCRUM-2)
 *
 * --data es opcional si se usa --transition y/o --comment junto a un issueKey:
 *   node scripts/create-jira-task.js SCRUM-2 --transition "En progreso"
 *   node scripts/create-jira-task.js SCRUM-2 --comment "Listo para QA"
 *   node scripts/create-jira-task.js SCRUM-2 --transition "Done" --comment "Cerrado"
 *
 * El JSON de --data acepta "testcaseModel" (un único Test Case) o
 * "testcaseModels" (array, para crear varios Test Cases del mismo issue en
 * un lote paralelo — ver xray.publishTestCasesBatch). Usar uno u otro,
 * no ambos.
 *
 * --report-results acepta más de un Test Cycle separados por coma
 * (--test-cycle SCRUM-204,SCRUM-211,SCRUM-217), para poder reportar en
 * una sola corrida de Cypress los resultados de varias HU que fueron
 * publicadas cada una con su propio Test Cycle. Con un solo key sigue
 * funcionando igual que antes (ver reportResults).
 *
 * El JSON de --data también acepta, en lugar del formato de un único
 * issue, un array top-level "issues": [ {mismo formato de un issue de
 * siempre}, ... ] para CREAR varias Historias (cada una con su propio
 * historia/testcaseModels/testCycle) en una sola invocación del script
 * -- "modo lote". Se procesan en secuencia (mismo motivo que
 * publishTestCasesBatch: orden correlativo, sin condiciones de carrera
 * en Jira), y las carpetas de Xray se resuelven una sola vez para todo
 * el lote aunque varias HU compartan la misma ruta. Solo sirve para
 * crear issues nuevos, no para actualizar (no acepta issueKey por
 * issue) -- para actualizar seguir usando el formato de un único issue
 * de siempre, invocando el script una vez por issueKey.
 *
 * Antes de publicar, los Test Cases del JSON de --data se validan con
 * lib/testcase-validator.js (mínimo de pasos, resultado esperado,
 * acciones encadenadas, login sin precondición). Los errores frenan
 * siempre; los warnings frenan salvo que se pase --accept-warnings.
 * Cada Test Case negativo tiene que traer "evidencia": { reporte,
 * observado } con el report.json de explore-page.js donde se probó
 * (lib/negative-evidence.js); sin ella no se publica.
 *
 * Los Bugs del JSON se validan con lib/bug-validator.js: secciones del
 * estándar (sin "Observaciones"), sin Test Cases ni keys de issues en el
 * texto (las relaciones van en "linkTo", que acepta uno o varios enlaces)
 * y evidencia sin especular sobre el código interno de la app. Cada Bug
 * trae "captura" (.png de explore-page.js, obligatoria): se adjunta al
 * ticket y se verifica por lectura.
 *
 * --dry-run: con --data, valida y termina sin publicar ni modificar nada.
 *
 * --data también acepta un archivo de lote ("formato": "lote",
 * lib/payload-builder.js): pasos con nombre, datos reutilizables, TC
 * numerados por CA, evidencia por escenario de explore-page y ciclo por
 * defecto. Se arma el payload y se valida igual que siempre.
 * --expand-to <archivo.json> guarda el payload armado (para revisarlo).
 *
 * --update-steps --data <archivo.json>: reescribe precondición y pasos de
 * Test Cases YA publicados ({ "testcases": [ { key, precondition, steps, criterio? } ] }),
 * validados con las mismas reglas (todo o nada), conservando el vínculo
 * con la Historia y verificando cada uno por lectura. Nombre y objetivo se
 * conservan salvo que el elemento traiga `name` / `objective` opcionales;
 * `criterio` (opcional, "CA-XX") mueve el Test Case a otro criterio
 * cambiando su label en Xray.
 *
 * Este archivo NO conoce endpoints, payloads ni formato ADF — todo eso
 * vive en lib/jira.js, lib/xray.js y lib/test-runner.js. Su única
 * responsabilidad es parsear la línea de comandos y componer, en el orden
 * correcto, las llamadas a esos tres Adapters.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');

const jira = require('./lib/jira');
const xray = require('./lib/xray');
const testRunner = require('./lib/test-runner');
const testcaseValidator = require('./lib/testcase-validator');
const bugValidator = require('./lib/bug-validator');
const testcaseDescription = require('./lib/testcase-description');
const negativeEvidence = require('./lib/negative-evidence');
const traceability = require('./lib/traceability');
const payloadBuilder = require('./lib/payload-builder');
const { mapWithLimit } = require('./lib/concurrency');

const PROJECT = process.env.JIRA_PROJECT_KEY;

function parseArgs(argv) {
  const args = { dataPath: null, issueKey: null, transitionName: null, commentText: null, verify: false, verifyTestcase: null, verifyCycle: null, verifyStatus: null, reportResultsPath: null, testCycleKeyArg: null, acceptWarnings: false, dryRun: false, updateSteps: false, expandTo: null };

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--data') {
      args.dataPath = argv[i + 1];
      i++;
    } else if (argv[i] === '--transition') {
      args.transitionName = argv[i + 1];
      i++;
    } else if (argv[i] === '--comment') {
      args.commentText = argv[i + 1];
      i++;
    } else if (argv[i] === '--verify') {
      args.verify = true;
    } else if (argv[i] === '--verify-testcase') {
      args.verifyTestcase = argv[i + 1];
      i++;
    } else if (argv[i] === '--verify-cycle') {
      args.verifyCycle = argv[i + 1];
      i++;
    } else if (argv[i] === '--verify-status') {
      args.verifyStatus = argv[i + 1];
      i++;
    } else if (argv[i] === '--report-results') {
      args.reportResultsPath = argv[i + 1];
      i++;
    } else if (argv[i] === '--accept-warnings') {
      args.acceptWarnings = true;
    } else if (argv[i] === '--dry-run') {
      args.dryRun = true;
    } else if (argv[i] === '--update-steps') {
      args.updateSteps = true;
    } else if (argv[i] === '--expand-to') {
      args.expandTo = argv[i + 1];
      i++;
    } else if (argv[i] === '--test-cycle') {
      args.testCycleKeyArg = argv[i + 1];
      i++;
    } else if (!args.issueKey) {
      args.issueKey = argv[i];
    }
  }

  return args;
}

const { dataPath, issueKey, transitionName, commentText, verify, verifyTestcase, verifyCycle, verifyStatus, reportResultsPath, testCycleKeyArg, acceptWarnings, dryRun, updateSteps, expandTo } = parseArgs(process.argv.slice(2));
const ISSUE_KEY = issueKey;

if (!dataPath && !transitionName && !commentText && !verify && !verifyTestcase && !verifyCycle && !verifyStatus && !reportResultsPath) {
  console.error('Uso: node scripts/create-jira-task.js --data <archivo.json> [issueKey] [--transition "<Estado>"] [--comment "<texto>"]');
  console.error('     node scripts/create-jira-task.js <issueKey> --verify');
  console.error('     node scripts/create-jira-task.js --verify-testcase <TestCaseKey>');
  console.error('     node scripts/create-jira-task.js --verify-cycle <TestCycleKey>');
  console.error('     node scripts/create-jira-task.js --report-results <results.json> --test-cycle <TestCycleKey>[,<TestCycleKey2>,...]');
  console.error('     node scripts/create-jira-task.js --data <archivo.json> --dry-run   (solo valida, no publica)');
  console.error('     node scripts/create-jira-task.js --data <lote.json> [--expand-to <payload.json>] [--dry-run]   (archivo de lote, lib/payload-builder.js)');
  console.error('     node scripts/create-jira-task.js --update-steps --data <archivo.json> [--dry-run] [--accept-warnings]');
  process.exit(1);
}

if ((updateSteps || dryRun) && !dataPath) {
  console.error('--update-steps y --dry-run requieren --data <archivo.json>.');
  process.exit(1);
}

if (reportResultsPath && !testCycleKeyArg) {
  console.error('Se requiere --test-cycle <key> junto con --report-results.');
  process.exit(1);
}

if (!dataPath && (transitionName || commentText) && !ISSUE_KEY) {
  console.error('Se requiere un issueKey para usar --transition/--comment sin --data.');
  process.exit(1);
}

let ISSUE = null;

if (dataPath) {
  try {
    ISSUE = JSON.parse(fs.readFileSync(path.resolve(dataPath), 'utf8'));
  } catch (e) {
    console.error(`No se pudo leer o parsear "${dataPath}": ${e.message}`);
    process.exit(1);
  }
  if (payloadBuilder.isBuildSpec(ISSUE)) {
    if (updateSteps) {
      console.error('--update-steps no acepta un archivo de lote: usa { "testcases": [ { key, precondition, steps } ] }.');
      process.exit(1);
    }
    try {
      ISSUE = payloadBuilder.buildPayload(ISSUE, { baseDir: path.dirname(path.resolve(dataPath)) });
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
    const built = Array.isArray(ISSUE.issues) ? ISSUE.issues : [ISSUE];
    console.log(`Lote armado: ${built.length} Historia(s), ${built.reduce((n, i) => n + i.testcaseModels.length, 0)} Test Case(s).`);
    if (expandTo) {
      fs.writeFileSync(path.resolve(expandTo), JSON.stringify(ISSUE, null, 2));
      console.log(`Payload armado guardado en ${path.resolve(expandTo)}.`);
    }
  } else if (expandTo) {
    console.error('--expand-to solo aplica a un archivo de lote ("formato": "lote").');
    process.exit(1);
  }
  const shapeError = payloadBuilder.unknownShapeError(ISSUE, { updateSteps });
  if (shapeError) {
    console.error(shapeError);
    process.exit(1);
  }
}

/**
 * Test Cases ya publicados y vinculados a la HU que se actualiza, con su
 * criterio y tipo (labels de Xray), para que el validador cuente la
 * cobertura completa del CA al sumarle un Test Case nuevo. Sin esto, un
 * payload con un solo TC nuevo fallaba por "CA-XX tiene 1 Test Case(s)"
 * (caso real 2026-09-27: TC-02.3 de SCRUM-469).
 */
async function existingTestCasesOf(issueKey) {
  const story = (await jira.getIssuesByKeys([issueKey])).get(issueKey);
  if (!story || !story.linkedTests.length) return [];
  const tests = await jira.getIssuesByKeys(story.linkedTests);
  return story.linkedTests.map(key => {
    const labels = tests.get(key)?.labels || [];
    return { key, criterio: labels.find(l => /^CA-\d{2}$/.test(l)) || null, tipo: labels.find(l => l === 'positivo' || l === 'negativo') || null };
  });
}

// Validación de pasos de los Test Cases ANTES de tocar Jira/Xray (ver
// lib/testcase-validator.js y CLAUDE.md sección 3). Los errores frenan
// siempre; los warnings frenan salvo --accept-warnings, que se pasa
// recién después de revisarlos (son heurísticas, pueden ser falsos
// positivos).
async function validateData() {
  const addsToPublishedStory = !updateSteps && ISSUE_KEY && ISSUE.historia && (ISSUE.testcaseModel || Array.isArray(ISSUE.testcaseModels));
  const existingTestCases = addsToPublishedStory ? await existingTestCasesOf(ISSUE_KEY) : [];
  if (existingTestCases.length) {
    console.log(`${ISSUE_KEY} ya tiene ${existingTestCases.length} Test Case(s) vinculados: se suman a la cobertura de cada CA.`);
  }
  const validation = updateSteps
    ? testcaseValidator.validateStepUpdates(ISSUE)
    : testcaseValidator.validatePayload(ISSUE, { existingTestCases });
  // Cada Test Case negativo nuevo trae el informe de explore-page.js donde
  // se probó (lib/negative-evidence.js): sin evidencia no se publica.
  if (!updateSteps) {
    const evidence = negativeEvidence.validateNegativeEvidence(ISSUE, {
      readReport: reportPath => JSON.parse(fs.readFileSync(path.resolve(reportPath), 'utf8'))
    });
    validation.errors.push(...evidence.errors);
    validation.warnings.push(...evidence.warnings);
  }
  // Estándar del Bug (lib/bug-validator.js): secciones fijas, sin Test
  // Cases ni keys en el texto y evidencia sin especular sobre el código.
  const bugs = updateSteps ? { errors: [], bugCount: 0 } : bugValidator.validateBugs(ISSUE, { projectKey: PROJECT || 'SCRUM' });
  if (bugs.errors.length) {
    console.error(`Validacion de Bugs: ${bugs.errors.length} error(es). No se publica nada.`);
    bugs.errors.forEach(msg => console.error(`  ERROR: ${msg}`));
    process.exit(1);
  }
  if (bugs.bugCount) console.log(`Validacion de Bugs: ${bugs.bugCount} OK.`);
  if (validation.errors.length) {
    console.error(`Validacion de Test Cases: ${validation.errors.length} error(es). No se publica nada.`);
    validation.errors.forEach(msg => console.error(`  ERROR: ${msg}`));
    process.exit(1);
  }
  if (validation.warnings.length) {
    validation.warnings.forEach(msg => console.warn(`  WARNING: ${msg}`));
    if (!acceptWarnings) {
      console.error(`Validacion de Test Cases: ${validation.warnings.length} warning(s). Revisarlos y corregir el payload, o re-ejecutar con --accept-warnings si son falsos positivos. No se publica nada.`);
      process.exit(1);
    }
    console.warn(`Validacion de Test Cases: ${validation.warnings.length} warning(s) aceptados con --accept-warnings.`);
  } else if (validation.testCaseCount) {
    console.log(`Validacion de Test Cases: ${validation.testCaseCount} OK.`);
  }

  if (dryRun) {
    console.log('Dry run: validacion completa, no se publico ni modifico nada.');
    process.exit(0);
  }
}

/**
 * Reporta a Xray los resultados reales de una corrida de Cypress contra
 * uno o varios Test Cycles ya existentes. Por cada test taggeado con
 * [key] en el título, prueba los Test Cycles indicados EN ORDEN hasta
 * encontrar aquel donde ese Test Case tiene una Test Execution (un Test
 * Case pertenece a un solo Test Cycle en el uso real de este proyecto,
 * así que el primero que matchea es el correcto). Si no encuentra una
 * ejecución en NINGUNO de los ciclos indicados, informa y frena sin
 * inventar nada.
 *
 * Acepta más de un Test Cycle para poder reportar, en una sola corrida
 * de Cypress, los resultados de varias HU que fueron publicadas cada
 * una con su propio Test Cycle (modo lote) -- antes esta función asumía
 * un único Test Cycle para toda la corrida, y fallaba con "no existe
 * una Test Execution" ante el primer test de una HU distinta (bug real
 * encontrado el 2026-09-17 al intentar reportar 2 HU en una sola
 * corrida).
 */
//
// Desde el 2026-09-28 el reporte lee los Test Runs de cada ciclo una sola
// vez, arma el plan completo antes de escribir (lib/test-runner.js,
// planReport: un key sin ejecución frena sin haber tocado Xray) y cambia
// los estados de a REPORT_CONCURRENCY a la vez (lib/concurrency.js). Antes
// eran 4 llamadas en serie por test (~40 s por lote). La verificación por
// lectura de run-and-report.js no cambia.
const REPORT_CONCURRENCY = 4;
const XRAY_RUNS_PAGE = 100; // límite de getTestRuns en xray.getTestExecutions

async function reportResults(resultsPath, testCycleKeys, projectKey) {
  const results = testRunner.parseResultsFile(resultsPath);
  const taggedTests = testRunner.collectTaggedTests(results);
  const knownBugSkips = testRunner.collectKnownBugSkips(results);

  if (!taggedTests.length) {
    console.log('No se encontraron tests taggeados con un Test Case key en el titulo.');
    return;
  }

  const cycles = await Promise.all(testCycleKeys.map(async cycleKey => ({
    cycleKey,
    executions: await xray.getTestExecutions(projectKey, cycleKey)
  })));
  let plan = testRunner.planReport(taggedTests, knownBugSkips, cycles);

  // Un ciclo con la página llena puede tener más Test Runs: lo que no
  // apareció se busca de a uno, como antes.
  if (plan.missing.length && cycles.some(c => c.executions.length >= XRAY_RUNS_PAGE)) {
    for (const key of plan.missing) {
      for (const cycle of cycles) {
        const run = await xray.findTestExecution(projectKey, cycle.cycleKey, key);
        if (run) {
          cycle.executions.push({ id: run.id, status: { name: run.status }, test: { jira: { key } } });
          break;
        }
      }
    }
    plan = testRunner.planReport(taggedTests, knownBugSkips, cycles);
  }

  if (plan.unknownStates.length) {
    plan.unknownStates.forEach(t => console.error(`Estado no reconocido ("${t.state}") para ${t.testCaseKey} ("${t.fullTitle}").`));
    console.error('Se frena sin reportar nada.');
    process.exit(1);
  }
  if (plan.missing.length) {
    console.error(`No existe una Test Execution para ${plan.missing.join(', ')} en ninguno de los ciclos indicados (${testCycleKeys.join(', ')}). Se frena sin reportar nada y sin inventar.`);
    process.exit(1);
  }

  const outcomes = await mapWithLimit(plan.updates, REPORT_CONCURRENCY, u => xray.updateTestExecutionStatus(u.runId, u.status));
  const failed = [];
  plan.updates.forEach((u, i) => {
    if (!outcomes[i].ok) {
      failed.push(u.testCaseKey);
      console.error(`${u.testCaseKey}: no se pudo pasar a ${u.status} (${outcomes[i].error.message}).`);
    } else if (u.bug) {
      // Los salteados por bug conocido no se reportan, pero su ejecución
      // vuelve a TO DO si quedó con un resultado de antes.
      console.log(`${u.testCaseKey} -> TO DO (estaba en ${u.previous}; en espera del bug ${u.bug}, en ${u.cycleKey}).`);
    } else {
      console.log(`${u.testCaseKey} -> ${u.status} (ejecucion ${u.runId} en ${u.cycleKey}).`);
    }
  });
  if (failed.length) {
    console.error(`Fallaron ${failed.length} de ${plan.updates.length} cambios de estado (${failed.join(', ')}). El reporte es idempotente: se puede reintentar con el mismo JSON.`);
    process.exit(1);
  }
}

/**
 * Construye la descripción ADF de un issue según su issuetype, con el
 * mismo criterio que main() usa para el issue único de siempre.
 */
function buildDescriptionFor(issueDef) {
  const issuetype = issueDef.issuetype || 'Historia';

  if (issuetype === 'Bug') return jira.buildBugDescription(issueDef.bug);
  if (issuetype === 'Historia' && issueDef.historia) return jira.buildHistoriaDescription(issueDef.historia);
  if (issuetype === 'Tarea') return jira.buildTareaDescription(issueDef.tarea);
  if (Array.isArray(issueDef.steps)) return jira.buildDescription(issueDef.steps);

  console.error(`No se pudo determinar la descripción para issuetype "${issuetype}".`);
  process.exit(1);
}

/**
 * Crea UN issue nuevo (Historia/Bug/Tarea) + sus Test Cases en Xray +
 * su link, usado por el modo lote (ISSUE.issues, ver main()). Mismo
 * comportamiento que la rama "crear nuevo issue" de main(), extraído a
 * función aparte para poder llamarlo varias veces en secuencia sin
 * duplicar la lógica de creación (la rama de actualización de un issue
 * existente no aplica al modo lote, que solo crea issues nuevos).
 *
 * `sharedFolderCache` se reenvía a publishTestCasesBatch para que dos
 * HU del mismo lote que publican en la misma carpeta de Xray no la
 * resuelvan dos veces contra la API.
 */
async function createSingleIssue(issueDef, sharedFolderCache) {
  const issuetype = issueDef.issuetype || 'Historia';
  const summary = issueDef.summary;
  const testcaseModel = issueDef.testcaseModel || null;
  const testcaseModels = Array.isArray(issueDef.testcaseModels) ? issueDef.testcaseModels : null;
  const testCycle = issueDef.testCycle || null;
  const description = buildDescriptionFor(issueDef);

  console.log(`Creando nuevo issue (${issuetype})...`);
  const res = await jira.createIssue({ projectKey: PROJECT, summary, issuetype, description });
  if (res.status !== 201) {
    console.error('Error al crear:', JSON.stringify(res.body, null, 2));
    process.exit(1);
  }

  const key = res.body.key;
  console.log(`Creado: ${key}`);
  console.log(`URL: https://${jira.HOSTNAME}/browse/${key}`);

  if (testcaseModel) {
    console.log('Se detectó un Modelo Canónico de Test Case.');
    try {
      await xray.publishTestCase(testcaseModel, { issueKey: key, issueId: res.body.id, testCycle });
    } catch (err) {
      console.error('Error creando Test Case en Xray');
      console.error(err.message);
      process.exit(1);
    }
  } else if (testcaseModels) {
    console.log(`Se detectaron ${testcaseModels.length} Modelos Canónicos de Test Case (lote paralelo).`);
    try {
      await xray.publishTestCasesBatch(testcaseModels, testCycle, key, res.body.id, sharedFolderCache);
    } catch (err) {
      console.error('Error creando Test Cases en Xray (lote paralelo)');
      console.error(err.message);
      process.exit(1);
    }
  }

  await attachCaptures(key, issueDef);
  await linkAll(key, issueDef);

  return key;
}

// `linkTo` acepta un enlace ({ key, type }) o varios ([{ key, type }, ...]):
// las relaciones con otros issues van como enlaces de Jira, no citadas en
// el texto del ticket (lib/bug-validator.js).
function linksOf(issueDef) {
  const links = issueDef && issueDef.linkTo;
  return (Array.isArray(links) ? links : [links]).filter(link => link && link.key);
}

// Adjunta las capturas del Bug (obligatorias, ya validadas por
// lib/bug-validator.js) y lo verifica por lectura. Una captura que ya está
// adjunta con el mismo nombre no se vuelve a subir (actualizar un Bug no
// la duplica).
async function attachCaptures(key, issueDef) {
  if (!issueDef || !issueDef.bug) return;
  const captures = jira.capturesOf(issueDef.bug);
  if (!captures.length) return;
  const existing = await jira.getAttachmentNames(key);
  const names = [];
  for (const capture of captures) {
    const name = jira.captureFileName(capture);
    names.push(name);
    if (existing.includes(name)) {
      console.log(`Captura ${name} ya adjunta en ${key}.`);
      continue;
    }
    console.log(`Adjuntando captura ${name} a ${key}...`);
    const res = await jira.attachFile(key, capture, name);
    if (res.status !== 200) {
      console.error(`Error al adjuntar ${name} a ${key} (HTTP ${res.status}):`, JSON.stringify(res.body, null, 2));
      process.exit(1);
    }
  }
  const attached = await jira.getAttachmentNames(key);
  const missing = names.filter(name => !attached.includes(name));
  if (missing.length) {
    console.error(`${key}: la lectura no muestra la(s) captura(s) ${missing.join(', ')}.`);
    process.exit(1);
  }
  console.log(`Verificado por lectura: ${names.length} captura(s) adjunta(s) en ${key}.`);
}

// Al actualizar un issue existente (`skipExisting`) no se repiten los
// enlaces que ya tiene con el mismo issue.
async function linkAll(key, issueDef, { skipExisting = false } = {}) {
  let linked = [];
  if (skipExisting && linksOf(issueDef).length) {
    const res = await jira.getIssue(key);
    linked = ((res.body.fields && res.body.fields.issuelinks) || [])
      .map(l => (l.inwardIssue || l.outwardIssue || {}).key).filter(Boolean);
  }
  for (const link of linksOf(issueDef)) {
    if (linked.includes(link.key)) {
      console.log(`${key} ya esta vinculado con ${link.key}.`);
      continue;
    }
    console.log(`Vinculando ${key} con ${link.key} (${link.type || 'Relates'})...`);
    const linkRes = await jira.linkIssue(key, link.key, link.type);
    if (linkRes.status === 201) {
      console.log(`Vinculado correctamente con ${link.key}.`);
    } else {
      console.error('Error al vincular issue:', JSON.stringify(linkRes.body, null, 2));
    }
  }
}

/**
 * --update-steps: reescribe precondición y pasos de Test Cases YA
 * publicados, conservando su vínculo con la Historia (y nombre/objetivo, salvo `name`/`objective`). El
 * payload ya pasó por testcaseValidator.validateStepUpdates (todo o nada)
 * antes de llegar acá. Cada Test Case se verifica por lectura después de
 * actualizarlo; si uno falla, se frena e informa cuáles ya se aplicaron.
 *
 * Nace de la sesión del 2026-09-23: 27 Test Cases se reescribieron con
 * scripts sueltos que llamaban al adapter directo (prohibido para
 * ProductAgent), sin validación previa ni verificación uniforme.
 */
async function updateTestCaseSteps(testcases) {
  const applied = [];
  const abort = (message) => {
    console.error(message);
    if (applied.length) console.error(`Ya actualizados antes del error: ${applied.join(', ')}.`);
    process.exit(1);
  };

  for (const tc of testcases) {
    const issue = await jira.getIssue(tc.key);
    if (issue.status !== 200) abort(`No se pudo leer ${tc.key}: ${JSON.stringify(issue.body)}`);

    // `name` y `objective` son opcionales: sin ellos se conservan los
    // publicados. Hacen falta cuando cambia lo que el TC valida (caso real:
    // SCRUM-346/347 pasaron de "se revierten" a "se conservan", Bug SCRUM-380).
    const objective = tc.objective || testcaseDescription.extractObjective(issue.body.fields.description);
    if (!objective) abort(`${tc.key}: no se encontro el objetivo en la descripcion actual; no se actualiza para no perderlo.`);

    const res = await jira.updateIssue(tc.key, {
      summary: tc.name || issue.body.fields.summary,
      description: testcaseDescription.buildTestCaseDescription(objective, tc.precondition)
    });
    if (res.status !== 204) abort(`Error al actualizar la descripcion de ${tc.key}: ${JSON.stringify(res.body)}`);

    await xray.replaceTestSteps(tc.key, tc.steps);

    const after = await xray.getTestCase(tc.key);
    if ((after.steps || []).length !== tc.steps.length) {
      abort(`${tc.key}: la verificacion por lectura encontro ${(after.steps || []).length} pasos, se esperaban ${tc.steps.length}.`);
    }
    if (tc.precondition && (after.precondition || '').trim() !== tc.precondition.trim()) {
      abort(`${tc.key}: la verificacion por lectura no encontro la precondicion esperada.`);
    }

    // `criterio` opcional: mueve el Test Case a otro CA cambiando su label
    // (el resto de los labels se conserva). Verificado por lectura.
    let movedTo = '';
    if (tc.criterio) {
      const target = String(tc.criterio).trim().toUpperCase();
      const change = traceability.criterionLabelChange(issue.body.fields.labels, target);
      if (change.remove.length || change.add.length) {
        const labelRes = await jira.changeLabels(tc.key, change);
        if (labelRes.status !== 204) abort(`Error al cambiar el criterio de ${tc.key}: ${JSON.stringify(labelRes.body)}`);
      }
      const reread = await jira.getIssue(tc.key);
      const criteria = (reread.body.fields.labels || []).filter(l => traceability.CRITERION_LABEL_REGEX.test(l));
      if (criteria.length !== 1 || criteria[0] !== target) {
        abort(`${tc.key}: la verificacion por lectura encontro los criterios [${criteria.join(', ')}], se esperaba ${target}.`);
      }
      movedTo = ` + criterio ${target}`;
    }

    applied.push(tc.key);
    console.log(`${tc.key}: precondicion + ${tc.steps.length} pasos${movedTo} (verificado por lectura).`);
  }

  console.log(`Update-steps completo: ${applied.length} Test Case(s) actualizados.`);
}

async function main() {
  if (dataPath) await validateData();

  if (updateSteps) {
    await updateTestCaseSteps(ISSUE.testcases);
    return;
  }

  // targetKey es el issue sobre el que finalmente se aplican --transition/--comment:
  // el ISSUE_KEY recibido, o el key recién creado si --data no traía issueKey.
  let targetKey = ISSUE_KEY;

  if (dataPath && Array.isArray(ISSUE.issues)) {
    if (ISSUE_KEY) {
      console.error('El modo lote (ISSUE.issues) solo crea issues nuevos -- no pasar un issueKey junto con él.');
      process.exit(1);
    }

    console.log(`Modo lote: se detectaron ${ISSUE.issues.length} issues para crear.`);
    const sharedFolderCache = new Map();
    const createdKeys = [];
    for (const issueDef of ISSUE.issues) {
      const key = await createSingleIssue(issueDef, sharedFolderCache);
      createdKeys.push(key);
    }
    console.log(`Lote completo. Issues creados en orden: ${createdKeys.join(', ')}`);

    // El lote no fija un targetKey único para --transition/--comment (no
    // tendría sentido aplicar la misma transición/comentario a varios
    // issues distintos sin que el usuario lo pida explícitamente por
    // issue) -- si se necesita, seguir usando el formato de un único
    // issue con su propio issueKey.
    return;
  }

  if (dataPath) {
    const issuetype = ISSUE.issuetype || 'Historia';
    const summary = ISSUE.summary;

    const testcaseModel = ISSUE.testcaseModel || null;
    // testcaseModels (plural) permite crear varios Test Cases de un mismo
    // issue en un lote paralelo (ver xray.publishTestCasesBatch), en vez
    // de invocar este script una vez por Test Case.
    const testcaseModels = Array.isArray(ISSUE.testcaseModels) ? ISSUE.testcaseModels : null;
    const testCycle = ISSUE.testCycle || null;

    let description;
    if (issuetype === 'Bug') {
      description = jira.buildBugDescription(ISSUE.bug);
    } else if (issuetype === 'Historia' && ISSUE.historia) {
      description = jira.buildHistoriaDescription(ISSUE.historia);
    } else if (issuetype === 'Tarea') {
      description = jira.buildTareaDescription(ISSUE.tarea);
    } else if (Array.isArray(ISSUE.steps)) {
      description = jira.buildDescription(ISSUE.steps);
    } else {
      console.error(`No se pudo determinar la descripción para issuetype "${issuetype}".`);
      process.exit(1);
    }

    if (ISSUE_KEY) {
      console.log(`Actualizando ${ISSUE_KEY}...`);
      const res = await jira.updateIssue(ISSUE_KEY, { summary, description });
      if (res.status === 204) {
        console.log(`Actualizado: https://${jira.HOSTNAME}/browse/${ISSUE_KEY}`);
        await attachCaptures(ISSUE_KEY, ISSUE);
        await linkAll(ISSUE_KEY, ISSUE, { skipExisting: true });
      } else {
        console.error('Error al actualizar:', JSON.stringify(res.body, null, 2));
        process.exit(1);
      }

      if (testcaseModel) {
        console.log('Se detectó un Modelo Canónico de Test Case.');

        try {
          const issueRes = await jira.getIssue(ISSUE_KEY);
          await xray.publishTestCase(testcaseModel, {
            issueKey: ISSUE_KEY,
            issueId: issueRes.body.id,
            testCycle
          });
        } catch (err) {
          console.error('Error creando Test Case en Xray');
          console.error(err.message);
          process.exit(1);
        }
      } else if (testcaseModels) {
        console.log(`Se detectaron ${testcaseModels.length} Modelos Canónicos de Test Case (lote paralelo).`);

        try {
          const issueRes = await jira.getIssue(ISSUE_KEY);
          await xray.publishTestCasesBatch(testcaseModels, testCycle, ISSUE_KEY, issueRes.body.id);
        } catch (err) {
          console.error('Error creando Test Cases en Xray (lote paralelo)');
          console.error(err.message);
          process.exit(1);
        }
      }
    } else {
      console.log(`Creando nuevo issue (${issuetype})...`);
      const res = await jira.createIssue({ projectKey: PROJECT, summary, issuetype, description });
      if (res.status === 201) {
        const key = res.body.key;
        console.log(`Creado: ${key}`);
        console.log(`URL: https://${jira.HOSTNAME}/browse/${key}`);
        targetKey = key;

        if (testcaseModel) {
          console.log('Se detectó un Modelo Canónico de Test Case.');

          try {
            await xray.publishTestCase(testcaseModel, {
              issueKey: key,
              issueId: res.body.id,
              testCycle
            });
          } catch (err) {
            console.error('Error creando Test Case en Xray');
            console.error(err.message);
            process.exit(1);
          }
        } else if (testcaseModels) {
          console.log(`Se detectaron ${testcaseModels.length} Modelos Canónicos de Test Case (lote paralelo).`);

          try {
            await xray.publishTestCasesBatch(testcaseModels, testCycle, key, res.body.id);
          } catch (err) {
            console.error('Error creando Test Cases en Xray (lote paralelo)');
            console.error(err.message);
            process.exit(1);
          }
        }

        await attachCaptures(key, ISSUE);
        await linkAll(key, ISSUE);
      } else {
        console.error('Error al crear:', JSON.stringify(res.body, null, 2));
        process.exit(1);
      }
    }
  }

  if (transitionName) {
    console.log(`Aplicando transición "${transitionName}" en ${targetKey}...`);
    await jira.transitionIssue(targetKey, transitionName);
  }

  if (commentText) {
    console.log(`Agregando comentario en ${targetKey}...`);
    await jira.addComment(targetKey, commentText);
  }

  // ------------------------------------------------------------
  // Verificación por lectura directa (read-only, no muta nada).
  // ------------------------------------------------------------
  if (verify) {
    if (!targetKey) {
      console.error('Se requiere un issueKey para --verify.');
      process.exit(1);
    }
    const res = await jira.getIssue(targetKey);
    if (res.status !== 200) {
      console.error('Error al leer el issue:', JSON.stringify(res.body, null, 2));
      process.exit(1);
    }
    console.log(JSON.stringify({
      id: res.body.id,
      key: res.body.key,
      status: res.body.fields.status && res.body.fields.status.name,
      summary: res.body.fields.summary,
      description: res.body.fields.description
    }, null, 2));
  }

  if (verifyTestcase) {
    const [testCase, links, steps] = await Promise.all([
      xray.getTestCase(verifyTestcase),
      xray.getTestCaseLinks(verifyTestcase),
      xray.getTestCaseSteps(verifyTestcase)
    ]);
    console.log(JSON.stringify({ testCase: { key: testCase.key, name: testCase.name, objective: testCase.objective, precondition: testCase.precondition }, links, steps }, null, 2));
  }

  if (verifyCycle) {
    const cycle = await xray.getTestCycle(verifyCycle);
    const executions = await xray.getTestExecutions(PROJECT, verifyCycle);
    console.log(JSON.stringify({ cycle: { key: cycle.key, name: cycle.name }, executions }, null, 2));
  }

  if (verifyStatus) {
    // Xray no identifica status de Test Run por id numérico como Zephyr
    // (ver lib/xray.js, getStatus) — no hay "id"/"type" que imprimir acá,
    // solo name/description/color.
    const status = await xray.getStatus(verifyStatus);
    console.log(JSON.stringify({ name: status.name, description: status.description, color: status.color }, null, 2));
  }

  if (reportResultsPath) {
    const testCycleKeys = testCycleKeyArg.split(',').map(k => k.trim()).filter(Boolean);
    await reportResults(reportResultsPath, testCycleKeys, PROJECT);
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
