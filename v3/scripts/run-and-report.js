/**
 * CLI: corre Cypress una vez (una iteración) sobre los specs indicados, controla que
 * la corrida sea 100% exitosa y, solo entonces, reporta los resultados a
 * los Test Cycles de Xray y verifica por lectura que hayan quedado en
 * PASSED.
 *
 * Uso:
 *   node v3/scripts/run-and-report.js --spec <spec1>[,<spec2>...] [--test-cycle <SCRUM-1>[,<SCRUM-2>...]] [--results-out <archivo.json>]
 *   node v3/scripts/run-and-report.js --from-results <archivo.json> --test-cycle <SCRUM-1>[,...]
 *   node v3/scripts/run-and-report.js --affected [--base <rama>] [--list]
 *   node v3/scripts/run-and-report.js --timing-report [<rama>]
 *
 *   --spec          (obligatorio) specs a correr, separados por coma.
 *   --test-cycle    (opcional) ciclos de Xray donde reportar. Sin este flag
 *                   solo corre y resume (no toca Xray).
 *   --results-out   (opcional) dónde guardar el JSON crudo de Cypress.
 *                   Default: carpeta temporal del sistema (nunca el repo).
 *   --from-results  (opcional) NO corre Cypress: toma el JSON de una corrida
 *                   ya hecha y reporta + verifica por lectura. Para cuando el
 *                   reporte se cortó (502, socket hang up): el reporte es
 *                   idempotente y así se verifica sin volver a correr los
 *                   specs (caso real 2026-09-26, lote Checkout).
 *   --affected      (opcional) suma a --spec los specs afectados por lo que
 *                   cambió en la rama respecto de --base (default main):
 *                   commits, cambios sin commitear y archivos nuevos. Es la
 *                   regresión después de un lote (ver lib/affected-specs.js):
 *                   solo lo que importa un page object, fixture o comando
 *                   modificado; la suite completa solo ante un cambio global
 *                   (cypress.config.js, support/e2e.js, support/commands.js).
 *   --base          (opcional) rama o commit de referencia para --affected.
 *   --list          (opcional) con --affected: lista los specs y el motivo,
 *                   sin correr Cypress.
 *   --timing-report (opcional) no corre nada: resume los tiempos
 *                   registrados (de una rama o de todas). Con el merge
 *                   registrado da el lote completo: discovery
 *                   (explore-page.js), publicación (create-jira-task.js),
 *                   corridas y PR (D-49).
 *   --esperar-limite (opcional) si TODAS las fallas son un 429 de la app
 *                   (límite de pedidos), espera a que la app vuelva a
 *                   responder y repite la corrida UNA vez. Sin el flag, la
 *                   corrida igual se marca como falla del entorno: no se
 *                   reporta y no cuenta como iteración del lote (D-48).
 *
 * Tiempos (lib/run-timing.js): cada corrida imprime la duración de cada
 * fase (trazabilidad, Cypress, reporte a Xray, verificación) y la deja en
 * .qa-metrics/run-and-report.jsonl (local, ignorado por Git), con el
 * número de iteración del lote en la rama, para comparar lotes con datos.
 *
 * Reglas (CLAUDE.md, PASO 3):
 *   - una corrida por invocación: `npx cypress run --quiet --reporter json --spec ...`
 *     (sin --quiet el JSON no parsea);
 *   - si hay fallas, pendientes o 0 tests: NO reporta y sale con código 1;
 *   - los tests que pasaron recién en el reintento (retries.runMode) se
 *     reportan PASSED pero se listan aparte, para no esconder inestabilidad;
 *   - si se va a reportar (--test-cycle), primero verifica la trazabilidad
 *     specs <-> Jira/Xray (check-traceability.js): con errores (key mal
 *     copiada, TC bajo otro CA, Test no vinculado a la HU) no corre nada;
 *   - el reporte a Xray lo hace la implementación oficial
 *     (create-jira-task.js --report-results), no una copia de su lógica.
 *
 * Nace de la sesión del 2026-09-23, donde parsear el JSON, contar
 * reintentos, reportar y verificar los ciclos se hacía con scripts sueltos.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env'), quiet: true });
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const testRunner = require('./lib/test-runner');
const xray = require('./lib/tools').testManager();
const { runCheck } = require('./check-traceability');
const affectedSpecs = require('./lib/affected-specs');
const { config } = require('./lib/qa-config');
const runTiming = require('./lib/run-timing');
const metricsLog = require('./lib/metrics-log');

const REPO_ROOT = path.resolve(__dirname, '../..');
const PROJECT = config.jira.projectKey;
const MAX_REGRESSION_SPECS = 20;

function parseArgs(argv) {
  const args = { specs: [], cycles: [], resultsOut: null, fromResults: null, affected: false, base: 'main', list: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--spec') args.specs = splitList(argv[++i]);
    else if (argv[i] === '--affected') args.affected = true;
    else if (argv[i] === '--base') args.base = argv[++i];
    else if (argv[i] === '--list') args.list = true;
    else if (argv[i] === '--max-specs') args.maxSpecs = Number(argv[++i]);
    else if (argv[i] === '--test-cycle') args.cycles = splitList(argv[++i]);
    else if (argv[i] === '--results-out') args.resultsOut = argv[++i];
    else if (argv[i] === '--from-results') args.fromResults = argv[++i];
    else if (argv[i] === '--health') args.health = true;
    else if (argv[i] === '--esperar-limite') args.waitRateLimit = true;
    else if (argv[i] === '--timing-report') args.timingReport = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : null;
  }
  return args;
}

function splitList(value) {
  return String(value || '').split(',').map(s => s.trim()).filter(Boolean);
}

function git(args) {
  const run = spawnSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' });
  if (run.status !== 0) throw new Error(`git ${args.join(' ')} fallo: ${(run.stderr || '').trim()}`);
  return run.stdout.split('\n').map(l => l.trim()).filter(Boolean);
}

// Todos los .js de cypress/ salvo fixtures y artefactos de corridas.
function readCypressSources() {
  const skip = new Set(['fixtures', 'screenshots', 'downloads', 'videos']);
  const sources = new Map();
  const walk = dir => fs.readdirSync(path.join(REPO_ROOT, dir), { withFileTypes: true }).forEach(entry => {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      if (!(dir === 'cypress' && skip.has(entry.name))) walk(rel);
    } else if (entry.name.endsWith('.js')) {
      sources.set(rel, fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8'));
    }
  });
  walk('cypress');
  return sources;
}

function resolveAffected(base) {
  const changed = [
    ...git(['diff', '--name-only', `${base}...HEAD`]),
    ...git(['diff', '--name-only', 'HEAD']),
    ...git(['ls-files', '--others', '--exclude-standard'])
  ];
  // Archivos globales que la rama solo toca para registrar una app nueva.
  const mergeBase = git(['merge-base', base, 'HEAD'])[0];
  const registrationOnly = [...affectedSpecs.GLOBAL_FILES].filter(file => changed.includes(file) &&
    affectedSpecs.isAppRegistrationDiff(file, spawnSync('git', ['diff', '-U0', mergeBase, '--', file], { cwd: REPO_ROOT, encoding: 'utf8' }).stdout.split('\n')));
  if (registrationOnly.length) console.log(`  Solo registro de app en: ${registrationOnly.join(', ')} (no es cambio global).`);
  const result = affectedSpecs.findAffectedSpecs(readCypressSources(), changed, { activeApps: config.apps, registrationOnly });
  console.log(`Regresion por impacto (respecto de ${base}): ${new Set(changed).size} archivo(s) cambiado(s), ${result.specs.length} spec(s) afectado(s).`);
  if (result.global) {
    console.warn(`  Cambio global: se corre la suite de las apps activas (${config.apps.join(', ')}).`);
    if (result.skipped.length) console.warn(`  Legado sin correr: ${result.skipped.length} spec(s) (D-33).`);
  }
  else result.reasons.forEach((reason, spec) => console.log(`  - ${spec} (${reason})`));
  return result.specs;
}

function runCypress(specs, resultsPath) {
  console.log(`Corriendo Cypress (una iteracion) sobre ${specs.length} spec(s)...`);
  const run = spawnSync('npx', ['cypress', 'run', '--quiet', '--reporter', 'json', '--spec', specs.join(',')], {
    cwd: REPO_ROOT,
    shell: process.platform === 'win32',
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'inherit']
  });
  fs.writeFileSync(resultsPath, run.stdout || '');
  console.log(`JSON de resultados: ${resultsPath}`);
  return run.status;
}

function printSummary(summary) {
  console.log(`\nResultado: ${summary.passed}/${summary.total} passing, ${summary.failed.length} failing, ${summary.pending.length} pendientes.`);
  summary.failed.forEach(f => {
    console.log(`  ✘ ${f.fullTitle}\n      ${f.message.split('\n')[0]}`);
    if (f.hint) console.log(`      → Pista: ${f.hint}`);
  });
  summary.pending.forEach(t => console.log(`  - PENDIENTE: ${t}`));
  summary.knownBugSkips.forEach(k => console.log(`  ⊘ SALTEADO por bug conocido ${k.bug} (no se reporta, queda en TO DO): ${k.fullTitle}`));
  if (summary.retriedPasses.length) {
    console.warn(`  ↻ ${summary.retriedPasses.length} test(s) pasaron SOLO en el reintento (posible inestabilidad):`);
    summary.retriedPasses.forEach(t => console.warn(`      ↻ ${t}`));
  } else if (summary.total) {
    console.log('  ↻ Ningun test necesito reintento.');
  }
  if (summary.untagged.length) {
    console.warn(`  ! ${summary.untagged.length} test(s) sin Test Case Key en el titulo (no se reportan a Xray):`);
    summary.untagged.forEach(t => console.warn(`      ! ${t}`));
  }
}

// Espera a que la URL que respondió 429 deje de hacerlo: consulta cada 30 s
// (o lo que pidió retry-after, si es más) hasta RATE_LIMIT_MAX_MINUTES.
const RATE_LIMIT_POLL_SECONDS = 30;
const RATE_LIMIT_MAX_MINUTES = 20;
async function waitUntilAvailable({ url, retryAfterSeconds }) {
  if (!url) return false;
  const deadline = Date.now() + RATE_LIMIT_MAX_MINUTES * 60 * 1000;
  let waitSeconds = Math.max(RATE_LIMIT_POLL_SECONDS, retryAfterSeconds || 0);
  console.log(`Esperando a que ${url} deje de responder 429 (hasta ${RATE_LIMIT_MAX_MINUTES} min)...`);
  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, Math.min(waitSeconds * 1000, Math.max(0, deadline - Date.now()))));
    const status = await fetch(url, { method: 'GET', redirect: 'manual' }).then(r => r.status).catch(() => null);
    console.log(`  ${new Date().toLocaleTimeString()} -> ${status === null ? 'sin respuesta' : status}`);
    if (status !== null && status !== 429) return true;
    waitSeconds = RATE_LIMIT_POLL_SECONDS;
  }
  return false;
}

async function verifyCycles(cycles, expectedKeys) {
  const executions = [];
  for (const cycle of cycles) executions.push(...await xray.getTestExecutions(PROJECT, cycle));
  return testRunner.compareReportedStatuses(executions, expectedKeys);
}

// Registro de tiempos del lote (lib/metrics-log.js, D-49).
const { METRICS_LOG, readLog: readTimingLog, appendEntry: appendTimingLog, currentBranch } = metricsLog;

function printTimingReport(branch) {
  const summaries = runTiming.summarizeLog(readTimingLog(), branch);
  if (!summaries.length) {
    console.log(`Sin registros${branch ? ` en la rama ${branch}` : ''} (${METRICS_LOG}).`);
    return;
  }
  summaries.forEach(s => console.log(runTiming.formatSummary(s)));
}

async function main() {
  const { specs: specArgs, cycles, resultsOut, fromResults, affected, base, list, timingReport, maxSpecs, health, waitRateLimit } = parseArgs(process.argv.slice(2));
  if (timingReport !== undefined) {
    printTimingReport(timingReport);
    return;
  }
  if (health) {
    const healthList = affectedSpecs.healthSpecs(readCypressSources(), config.apps);
    console.log(`Chequeo de salud: un spec por app activa (${healthList.length}), sin reporte a Xray.`);
    healthList.forEach(spec => console.log(`  - ${spec}`));
    if (list) return;
    const resultsPath = path.join(os.tmpdir(), `cypress-health-${Date.now()}.json`);
    const status = runCypress(healthList, resultsPath);
    printSummary(testRunner.summarizeResults(testRunner.parseResultsFile(resultsPath)));
    console.log(`\nChequeo de salud: ${status === 0 ? 'todas las apps activas OK' : 'hay fallas: diagnosticar antes de arrancar trabajo nuevo (ver capturas)'}.`);
    process.exit(status === 0 ? 0 : 1);
  }
  const specs = affected ? [...new Set([...specArgs, ...resolveAffected(base)])] : specArgs;
  if (affected && list) return;
  if (affected && !specs.length) {
    console.log('Ningun spec afectado por los cambios: no hay regresion que correr.');
    return;
  }
  // Tope de la regresión (D-33, 2026-09-29): una regresión de 89 specs corrió
  // 40 minutos sin que nadie lo decidiera. Más de MAX_REGRESSION_SPECS se
  // corre solo con --max-specs explícito, después de consultar al usuario.
  const limit = Number.isFinite(maxSpecs) ? maxSpecs : MAX_REGRESSION_SPECS;
  if (affected && specs.length > limit) {
    console.error(`La regresion tiene ${specs.length} spec(s) (tope ${limit}). No se corre: consultar al usuario y, si aprueba, re-ejecutar con --max-specs ${specs.length}.`);
    process.exit(1);
  }
  if (fromResults && !cycles.length) {
    console.error('--from-results requiere --test-cycle (solo sirve para reportar y verificar).');
    process.exit(1);
  }
  if (!specs.length && !fromResults) {
    console.error('Uso: node v3/scripts/run-and-report.js --spec <spec1>[,<spec2>...] | --affected [--base <rama>] [--list] [--test-cycle <SCRUM-1>[,...]] [--results-out <archivo.json>] | --timing-report [<rama>]');
    process.exit(1);
  }

  // Tiempos por fase (lib/run-timing.js): se imprimen y se registran en
  // .qa-metrics/run-and-report.jsonl en toda salida, exitosa o no.
  const timer = runTiming.createTimer();
  const startedAt = new Date().toISOString();
  const branch = currentBranch();
  const key = runTiming.specsKey(specs);
  // 'entorno' si la corrida la cortó un 429 de la app (no cuenta como iteración).
  let mode = fromResults ? 'from-results' : (affected && !specArgs.length ? 'regresion' : 'lote');
  if (mode === 'lote') console.log(`Iteracion ${runTiming.iterationNumber(readTimingLog(), branch, key)} de este lote en la rama ${branch}.`);
  let summary = null;
  let reported = false;
  const finish = (ok, exitCode = 0) => {
    const totalMs = timer.totalMs();
    console.log(`\n${runTiming.formatPhases(timer.phases, totalMs)}`);
    appendTimingLog({
      at: startedAt, branch, mode, specsKey: key, specs: specs.length, ok, reported, totalMs, phases: timer.phases,
      result: summary && { total: summary.total, passed: summary.passed, failed: summary.failed.length, knownBugSkips: summary.knownBugSkips.length, retried: summary.retriedPasses.length }
    });
    if (exitCode) process.exit(exitCode);
  };

  if (cycles.length && specs.length) {
    const trace = await timer.measure('trazabilidad', () => runCheck(specs));
    if (trace.errors.length) {
      console.error(`\nTrazabilidad rota (${trace.errors.length} error(es)): no se corre Cypress ni se reporta a Xray.`);
      finish(false, 1);
    }
  }

  const resultsPath = path.resolve(fromResults || resultsOut || path.join(os.tmpdir(), `cypress-results-${Date.now()}.json`));
  let exitCode = 0;
  // Un 429 en todas las fallas es del entorno (D-48): con --esperar-limite
  // se espera a la app y se repite UNA vez; si no, se corta sin contarla
  // como iteración ni mandar a revisar el código.
  for (let attempt = 0; ; attempt++) {
    exitCode = fromResults ? 0 : await timer.measure('cypress', async () => runCypress(specs, resultsPath));
    if (fromResults) console.log(`Sin correr Cypress: se usa la corrida guardada en ${resultsPath}`);

    summary = testRunner.summarizeResults(testRunner.parseResultsFile(resultsPath));
    printSummary(summary);

    const limit = summary.rateLimit;
    if (!limit) break;
    console.error(`\nFalla del entorno: ${limit.url || 'la app'} respondio 429 (limite de pedidos) en todas las fallas. No es una falla del codigo: no se reporta y no cuenta como iteracion.`);
    if (fromResults || !waitRateLimit || attempt >= 1) {
      console.error(waitRateLimit && !fromResults
        ? 'Volvio a cortarse por el limite despues de esperar: frenar y avisar al usuario (el entorno no da para esta corrida).'
        : 'Repetir cuando la app vuelva a responder, o correr con --esperar-limite para que espere y repita una vez.');
      if (!fromResults) mode = 'entorno';
      finish(false, 1);
    }
    const back = await timer.measure('espera', () => waitUntilAvailable(limit));
    if (!back) {
      console.error(`La app sigue respondiendo 429 despues de ${RATE_LIMIT_MAX_MINUTES} minutos: frenar y avisar al usuario.`);
      mode = 'entorno';
      finish(false, 1);
    }
    console.log('La app volvio a responder: se repite la corrida una vez.\n');
  }

  if (!testRunner.isReportable(summary)) {
    console.error(`\nLa corrida NO es 100% exitosa (codigo de salida de Cypress: ${exitCode}). No se reporta a Xray.`);
    finish(false, 1);
  }

  if (!cycles.length) {
    console.log('\nCorrida 100% exitosa. Sin --test-cycle: no se reporta a Xray.');
    finish(true);
    return;
  }

  console.log(`\nCorrida 100% exitosa. Reportando a ${cycles.join(', ')} con la implementacion oficial...`);
  const report = await timer.measure('reporte', async () => spawnSync('node', [path.join(__dirname, 'create-jira-task.js'), '--report-results', resultsPath, '--test-cycle', cycles.join(',')], {
    cwd: REPO_ROOT,
    stdio: 'inherit'
  }));
  if (report.status !== 0) {
    console.error('El reporte a Xray fallo (ver salida anterior). Es idempotente: se puede reintentar con el mismo JSON.');
    finish(true, 1);
  }

  const expectedKeys = testRunner.collectTaggedTests(testRunner.parseResultsFile(resultsPath)).map(t => t.testCaseKey);
  const { missing, notPassed } = await timer.measure('verificacion', () => verifyCycles(cycles, expectedKeys));
  if (missing.length || notPassed.length) {
    missing.forEach(k => console.error(`  ✘ ${k}: sin Test Execution en ${cycles.join(', ')}`));
    notPassed.forEach(e => console.error(`  ✘ ${e.key}: quedo en ${e.status}`));
    finish(true, 1);
  }
  reported = true;
  console.log(`\nVerificado por lectura: ${expectedKeys.length} Test Execution(s) en PASSED en ${cycles.join(', ')}.`);
  if (summary.retriedPasses.length) {
    console.warn(`Atencion: ${summary.retriedPasses.length} de esos tests pasaron solo en el reintento (ver arriba).`);
  }
  finish(true);
}

main().catch(e => { console.error(e.message); process.exit(1); });
