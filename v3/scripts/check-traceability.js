/**
 * CLI: verifica la trazabilidad entre los specs de Cypress y lo publicado
 * en Jira/Xray (lógica en lib/traceability.js).
 *
 * Uso:
 *   node v3/scripts/check-traceability.js --spec <archivo|carpeta>[,<archivo|carpeta>...] [--sync-labels] [--report <archivo.md>]
 *
 *   --spec          specs o carpetas de specs (se toman los *.cy.js).
 *   --sync-labels   agrega en Xray el label de criterio (CA-XX) que falte,
 *                   tomándolo del tag del spec. Solo corre si NO hay
 *                   errores (nunca "arregla" Xray a partir de un spec con
 *                   trazabilidad rota). Es aditivo e idempotente.
 *   --report        escribe el reporte público de trazabilidad (HU -> CA ->
 *                   TC con pasos -> it() -> último resultado, Bugs
 *                   vinculados; lib/trace-report.js). Solo si NO hay
 *                   errores. Va en docs/trazabilidad/<app>.md y se
 *                   commitea (Jira/Xray es privado).
 *
 * Errores -> código de salida 1. Warnings -> se informan, salida 0.
 *
 * Lo invoca también run-and-report.js antes de correr Cypress cuando se
 * va a reportar a Xray, para frenar antes de reportar con keys erróneas.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env'), quiet: true });
const fs = require('fs');
const path = require('path');

const jira = require('./lib/jira');
const xray = require('./lib/xray');
const traceability = require('./lib/traceability');
const traceReport = require('./lib/trace-report');
const { config } = require('./lib/qa-config');

const PROJECT = config.jira.projectKey;

function parseArgs(argv) {
  const args = { specs: [], syncLabels: false, report: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--spec') args.specs = String(argv[++i] || '').split(',').map(s => s.trim()).filter(Boolean);
    else if (argv[i] === '--sync-labels') args.syncLabels = true;
    else if (argv[i] === '--report') args.report = argv[++i];
  }
  return args;
}

const posix = p => p.split(path.sep).join('/');

function expandSpecs(entries) {
  return entries.flatMap(entry => {
    const full = path.resolve(entry);
    if (!fs.existsSync(full)) throw new Error(`No existe: ${entry}`);
    if (fs.statSync(full).isDirectory()) {
      return fs.readdirSync(full).filter(f => f.endsWith('.cy.js')).sort().map(f => path.join(full, f));
    }
    return [full];
  });
}

async function check(specPaths) {
  const specs = specPaths.map(p => traceability.parseSpecTags(fs.readFileSync(p, 'utf8'), path.relative(process.cwd(), p)));
  const keys = specs.flatMap(s => [s.story, ...s.tests.map(t => t.key)]).filter(Boolean);
  const issuesByKey = await jira.getIssuesByKeys(keys);
  return { specs, ...traceability.checkTraceability(specs, issuesByKey) };
}

function print({ specs, errors, warnings }) {
  const testCount = specs.reduce((n, s) => n + s.tests.length, 0);
  console.log(`Trazabilidad: ${specs.length} spec(s), ${testCount} it().`);
  errors.forEach(m => console.error(`  ERROR: ${m}`));
  warnings.forEach(m => console.warn(`  WARNING: ${m}`));
  if (!errors.length && !warnings.length) console.log('  OK: specs, HU y Test Cases de Xray consistentes.');
}

async function runCheck(specEntries, { syncLabels = false } = {}) {
  const specPaths = expandSpecs(specEntries);
  let result = await check(specPaths);
  print(result);

  if (syncLabels && result.missingLabels.length) {
    if (result.errors.length) {
      console.error('--sync-labels no se aplica: hay errores de trazabilidad (corregirlos primero).');
    } else {
      for (const { key, label } of result.missingLabels) {
        const res = await jira.addLabels(key, [label]);
        if (res.status !== 204) throw new Error(`No se pudo agregar ${label} a ${key}: ${JSON.stringify(res.body)}`);
      }
      console.log(`Labels agregados: ${result.missingLabels.length}. Verificando por lectura...`);
      result = await check(specPaths);
      print(result);
    }
  }

  return result;
}

/**
 * Reporte público de trazabilidad (lib/trace-report.js). Lee las HU con su
 * texto, los pasos de los Test Cases y el último resultado de cada Test
 * Cycle (el del encabezado del spec). Con errores de trazabilidad no se
 * escribe: el reporte no puede mostrar un vínculo roto como si estuviera bien.
 */
async function writeReport(specEntries, outPath) {
  const specPaths = expandSpecs(specEntries);
  const sources = specPaths.map(p => ({ file: posix(path.relative(process.cwd(), p)), source: fs.readFileSync(p, 'utf8') }));
  const specs = sources.map(s => traceability.parseSpecTags(s.source, s.file));
  const issues = await jira.getIssuesByKeys(specs.flatMap(s => [s.story, ...s.tests.map(t => t.key)]).filter(Boolean), { withText: true });
  const check = traceability.checkTraceability(specs, issues);
  print({ specs, ...check });
  if (check.errors.length) throw new Error('Reporte no generado: hay errores de trazabilidad (corregirlos primero).');

  // Una HU puede repartirse en varios specs: se juntan por key.
  const byStory = new Map();
  sources.forEach((s, i) => {
    const spec = specs[i];
    if (!spec.story) return;
    const entry = byStory.get(spec.story) || { specFile: s.file, cycleKey: null, tests: [] };
    entry.cycleKey = entry.cycleKey || traceReport.cycleFromSpec(s.source, PROJECT);
    entry.tests.push(...spec.tests);
    byStory.set(spec.story, entry);
  });

  const testKeys = [...byStory.values()].flatMap(e => e.tests.map(t => t.key));
  const steps = await xray.getTestStepsByKeys(testKeys);
  const results = new Map();
  for (const cycleKey of new Set([...byStory.values()].map(e => e.cycleKey).filter(Boolean))) {
    for (const run of await xray.getTestExecutions(PROJECT, cycleKey)) results.set(run.testCaseKey, run.status);
  }

  const stories = [...byStory.entries()].map(([key, entry]) => {
    const issue = issues.get(key);
    const automated = new Set(entry.tests.map(t => t.key));
    return {
      key, summary: issue.summary, status: issue.status, cycleKey: entry.cycleKey, specFile: entry.specFile,
      historia: issue.historia || {},
      bugs: issue.linkedBugs || [],
      notAutomated: (issue.linkedTests || []).filter(k => !automated.has(k)),
      tests: entry.tests.map(t => {
        const tc = issues.get(t.key);
        return { ...t, name: tc.summary, tipo: tc.labels.find(l => l === 'positivo' || l === 'negativo') || null, steps: steps.get(t.key) || [], result: results.get(t.key) || null };
      })
    };
  });

  const out = path.resolve(outPath);
  const firstSummary = stories[0]?.summary || '';
  const markdown = traceReport.buildTraceReport({
    title: firstSummary.split(' - ')[0] || 'Trazabilidad',
    generatedAt: new Date().toISOString().slice(0, 10),
    command: `node v3/scripts/check-traceability.js --spec ${specEntries.map(posix).join(',')} --report ${posix(path.relative(process.cwd(), out))}`,
    specBase: `${posix(path.relative(path.dirname(out), process.cwd())) || '.'}/`,
    stories
  });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, markdown);
  console.log(`Reporte: ${posix(path.relative(process.cwd(), out))} (${stories.length} HU, ${testKeys.length} Test Cases).`);
}

module.exports = { runCheck };

if (require.main === module) {
  const { specs, syncLabels, report } = parseArgs(process.argv.slice(2));
  if (!specs.length) {
    console.error('Uso: node v3/scripts/check-traceability.js --spec <archivo|carpeta>[,...] [--sync-labels] [--report <archivo.md>]');
    process.exit(1);
  }
  const run = report
    ? writeReport(specs, report).then(() => 0)
    : runCheck(specs, { syncLabels }).then(result => (result.errors.length ? 1 : 0));
  run.then(code => process.exit(code)).catch(e => { console.error(e.message); process.exit(1); });
}
