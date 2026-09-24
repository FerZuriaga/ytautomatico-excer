/**
 * CLI: verifica la trazabilidad entre los specs de Cypress y lo publicado
 * en Jira/Xray (lógica en lib/traceability.js).
 *
 * Uso:
 *   node v3/scripts/check-traceability.js --spec <archivo|carpeta>[,<archivo|carpeta>...] [--sync-labels]
 *
 *   --spec          specs o carpetas de specs (se toman los *.cy.js).
 *   --sync-labels   agrega en Xray el label de criterio (CA-XX) que falte,
 *                   tomándolo del tag del spec. Solo corre si NO hay
 *                   errores (nunca "arregla" Xray a partir de un spec con
 *                   trazabilidad rota). Es aditivo e idempotente.
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
const traceability = require('./lib/traceability');

function parseArgs(argv) {
  const args = { specs: [], syncLabels: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--spec') args.specs = String(argv[++i] || '').split(',').map(s => s.trim()).filter(Boolean);
    else if (argv[i] === '--sync-labels') args.syncLabels = true;
  }
  return args;
}

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

module.exports = { runCheck };

if (require.main === module) {
  const { specs, syncLabels } = parseArgs(process.argv.slice(2));
  if (!specs.length) {
    console.error('Uso: node v3/scripts/check-traceability.js --spec <archivo|carpeta>[,...] [--sync-labels]');
    process.exit(1);
  }
  runCheck(specs, { syncLabels })
    .then(result => process.exit(result.errors.length ? 1 : 0))
    .catch(e => { console.error(e.message); process.exit(1); });
}
