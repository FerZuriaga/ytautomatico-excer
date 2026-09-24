/**
 * CLI: corre Cypress UNA sola vez sobre los specs indicados, controla que
 * la corrida sea 100% exitosa y, solo entonces, reporta los resultados a
 * los Test Cycles de Xray y verifica por lectura que hayan quedado en
 * PASSED.
 *
 * Uso:
 *   node v3/scripts/run-and-report.js --spec <spec1>[,<spec2>...] [--test-cycle <SCRUM-1>[,<SCRUM-2>...]] [--results-out <archivo.json>]
 *
 *   --spec          (obligatorio) specs a correr, separados por coma.
 *   --test-cycle    (opcional) ciclos de Xray donde reportar. Sin este flag
 *                   solo corre y resume (no toca Xray).
 *   --results-out   (opcional) dónde guardar el JSON crudo de Cypress.
 *                   Default: carpeta temporal del sistema (nunca el repo).
 *
 * Reglas (CLAUDE.md, PASO 3):
 *   - una sola corrida: `npx cypress run --quiet --reporter json --spec ...`
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
const xray = require('./lib/xray');
const { runCheck } = require('./check-traceability');

const REPO_ROOT = path.resolve(__dirname, '../..');
const PROJECT = process.env.JIRA_PROJECT_KEY;

function parseArgs(argv) {
  const args = { specs: [], cycles: [], resultsOut: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--spec') args.specs = splitList(argv[++i]);
    else if (argv[i] === '--test-cycle') args.cycles = splitList(argv[++i]);
    else if (argv[i] === '--results-out') args.resultsOut = argv[++i];
  }
  return args;
}

function splitList(value) {
  return String(value || '').split(',').map(s => s.trim()).filter(Boolean);
}

function runCypress(specs, resultsPath) {
  console.log(`Corriendo Cypress (una sola vez) sobre ${specs.length} spec(s)...`);
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
  summary.failed.forEach(f => console.log(`  ✘ ${f.fullTitle}\n      ${f.message.split('\n')[0]}`));
  summary.pending.forEach(t => console.log(`  - PENDIENTE: ${t}`));
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

async function verifyCycles(cycles, expectedKeys) {
  const executions = [];
  for (const cycle of cycles) executions.push(...await xray.getTestExecutions(PROJECT, cycle));
  return testRunner.compareReportedStatuses(executions, expectedKeys);
}

async function main() {
  const { specs, cycles, resultsOut } = parseArgs(process.argv.slice(2));
  if (!specs.length) {
    console.error('Uso: node v3/scripts/run-and-report.js --spec <spec1>[,<spec2>...] [--test-cycle <SCRUM-1>[,...]] [--results-out <archivo.json>]');
    process.exit(1);
  }

  if (cycles.length) {
    const trace = await runCheck(specs);
    if (trace.errors.length) {
      console.error(`
Trazabilidad rota (${trace.errors.length} error(es)): no se corre Cypress ni se reporta a Xray.`);
      process.exit(1);
    }
  }

  const resultsPath = path.resolve(resultsOut || path.join(os.tmpdir(), `cypress-results-${Date.now()}.json`));
  const exitCode = runCypress(specs, resultsPath);

  const summary = testRunner.summarizeResults(testRunner.parseResultsFile(resultsPath));
  printSummary(summary);

  if (!testRunner.isReportable(summary)) {
    console.error(`\nLa corrida NO es 100% exitosa (codigo de salida de Cypress: ${exitCode}). No se reporta a Xray.`);
    process.exit(1);
  }

  if (!cycles.length) {
    console.log('\nCorrida 100% exitosa. Sin --test-cycle: no se reporta a Xray.');
    return;
  }

  console.log(`\nCorrida 100% exitosa. Reportando a ${cycles.join(', ')} con la implementacion oficial...`);
  const report = spawnSync('node', [path.join(__dirname, 'create-jira-task.js'), '--report-results', resultsPath, '--test-cycle', cycles.join(',')], {
    cwd: REPO_ROOT,
    stdio: 'inherit'
  });
  if (report.status !== 0) {
    console.error('El reporte a Xray fallo (ver salida anterior). Es idempotente: se puede reintentar con el mismo JSON.');
    process.exit(1);
  }

  const expectedKeys = testRunner.collectTaggedTests(testRunner.parseResultsFile(resultsPath)).map(t => t.testCaseKey);
  const { missing, notPassed } = await verifyCycles(cycles, expectedKeys);
  if (missing.length || notPassed.length) {
    missing.forEach(k => console.error(`  ✘ ${k}: sin Test Execution en ${cycles.join(', ')}`));
    notPassed.forEach(e => console.error(`  ✘ ${e.key}: quedo en ${e.status}`));
    process.exit(1);
  }
  console.log(`\nVerificado por lectura: ${expectedKeys.length} Test Execution(s) en PASSED en ${cycles.join(', ')}.`);
  if (summary.retriedPasses.length) {
    console.warn(`Atencion: ${summary.retriedPasses.length} de esos tests pasaron solo en el reintento (ver arriba).`);
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
