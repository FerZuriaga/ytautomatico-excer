/**
 * Fronteras de arquitectura (lib/architecture.js): escanea el repo real y
 * falla si Jira/Xray, GitHub o el arranque de Cypress aparecen fuera de
 * sus archivos permitidos. Mapa legible: docs/architecture/herramientas.md.
 *
 * Correr con: node --test v3/scripts/lib/architecture.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { RULES, stripComments, checkArchitecture, formatViolations, checkAppLayout } = require('./architecture');

const REPO_ROOT = path.resolve(__dirname, '../../..');

function readJs(dir, out = {}) {
  const abs = path.join(REPO_ROOT, dir);
  if (!fs.existsSync(abs)) return out;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) { if (entry.name !== 'node_modules') readJs(rel, out); }
    else if (entry.name.endsWith('.js')) out[rel] = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');
  }
  return out;
}

test('el repo respeta las fronteras de arquitectura', () => {
  const files = { ...readJs('v3/scripts'), ...readJs('cypress'), 'cypress.config.js': fs.readFileSync(path.join(REPO_ROOT, 'cypress.config.js'), 'utf8') };
  assert.ok(Object.keys(files).length > 20, 'el escaneo encontró los archivos del repo');
  const violations = checkArchitecture(files);
  assert.equal(violations.length, 0, `Uso de herramienta fuera de su lugar:\n${formatViolations(violations)}\nSi el cambio es a propósito, actualizar RULES en lib/architecture.js y docs/architecture/herramientas.md.`);
});

test('cada archivo permitido existe (una regla no puede quedar apuntando a un archivo borrado o renombrado)', () => {
  for (const rule of RULES) {
    for (const file of rule.allowed) assert.ok(fs.existsSync(path.join(REPO_ROOT, file)), `${rule.id}: ${file} no existe`);
  }
});

test('detecta cada tipo de violación en el archivo equivocado', () => {
  const violations = checkArchitecture({
    'v3/scripts/lib/testcase-validator.js': "const x = 1;\nconst jira = require('./jira');\n",
    'v3/scripts/lib/nueva.js': "const { spawnSync } = require('child_process');\nconst t = process.env.XRAY_CLIENT_ID;\n",
    'v3/scripts/otro-cli.js': "spawnSync('npx', ['cypress', 'run']);\nfetch('https://api.github.com/repos');\n",
    'cypress/support/commands/app.js': "cy.request('https://empresa.atlassian.net/rest/api/3/issue')\n"
  });
  assert.deepEqual(violations.map(v => `${v.file}:${v.line} ${v.rule}`).sort(), [
    'cypress/support/commands/app.js:1 credenciales-jira-xray',
    'v3/scripts/lib/nueva.js:1 libs-sin-procesos',
    'v3/scripts/lib/nueva.js:2 credenciales-jira-xray',
    'v3/scripts/lib/nueva.js:2 libs-sin-entorno',
    'v3/scripts/lib/testcase-validator.js:2 uso-adapters-jira-xray',
    'v3/scripts/otro-cli.js:1 arranque-cypress',
    'v3/scripts/otro-cli.js:2 github'
  ]);
  assert.match(formatViolations(violations), /Permitido en: v3\/scripts\/create-pull-request\.js/);
});

test('los usos en su lugar, en tests o en comentarios no cuentan', () => {
  assert.deepEqual(checkArchitecture({
    'v3/scripts/lib/jira.js': 'const url = process.env.JIRA_URL;',
    'v3/scripts/run-and-report.js': "const xray = require('./lib/xray');\nspawnSync('npx', ['cypress', 'run']);",
    'v3/scripts/lib/jira.test.js': "process.env.JIRA_URL = 'x';",
    'cypress/e2e/app/login.cy.js': "// ver https://empresa.atlassian.net/browse/SCRUM-45\n/* process.env.JIRA_API_TOKEN */\ncy.visit('https://app.test')"
  }), []);
});

test('stripComments conserva strings con // y los números de línea', () => {
  const code = "const a = 'https://x.test'; // nota\n/* bloque\n de dos */\nconst b = 2;";
  const lines = stripComments(code).split('\n');
  assert.equal(lines[0].trim(), "const a = 'https://x.test';");
  assert.equal(lines[3], 'const b = 2;');
});

test('un glob con "**/*" en un string no esconde el código que sigue', () => {
  const violations = checkArchitecture({
    'v3/scripts/lib/nueva.js': "const specs = 'cypress/e2e/**/*.cy.js';\nconst t = process.env.JIRA_URL;\n/* fin */"
  });
  assert.deepEqual(violations.map(v => `${v.line} ${v.rule}`), ['2 credenciales-jira-xray', '2 libs-sin-entorno']);
});

// ─── Orden por aplicación ────────────────────────────────────────────────────

function repoSnapshot() {
  const dirs = rel => fs.readdirSync(path.join(REPO_ROOT, rel), { withFileTypes: true });
  const selectors = dirs('cypress/fixtures/selectors');
  const commandsJs = fs.readFileSync(path.join(REPO_ROOT, 'cypress/support/commands.js'), 'utf8');
  return {
    e2eApps: dirs('cypress/e2e').filter(d => d.isDirectory()).map(d => d.name),
    pagesApps: dirs('cypress/pages').filter(d => d.isDirectory()).map(d => d.name),
    selectorApps: selectors.filter(d => d.isDirectory()).map(d => d.name),
    looseSelectorFiles: selectors.filter(d => d.isFile()).map(d => d.name),
    commandFiles: dirs('cypress/support/commands').filter(d => d.isFile() && d.name.endsWith('.js')).map(d => d.name),
    commandImports: [...commandsJs.matchAll(/import\s+['"]\.\/commands\/([^'"]+)['"]/g)].map(m => m[1].replace(/\.js$/, '')),
    discoveryDocs: dirs('docs/discovery').map(d => d.name),
    npmScripts: Object.keys(JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8')).scripts || {})
  };
}

test('cada app está declarada y las activas tienen todas sus piezas en su carpeta', () => {
  const problems = checkAppLayout(repoSnapshot());
  assert.deepEqual(problems, [], `Orden por app:\n  ${problems.join('\n  ')}`);
});

test('detecta app no declarada, piezas faltantes, selector suelto y comandos sin importar', () => {
  const complete = app => ({
    e2eApps: [app], pagesApps: [app], selectorApps: [app], looseSelectorFiles: [],
    commandFiles: [`${app}.js`], commandImports: [app], discoveryDocs: [`${app}.md`], npmScripts: [`test:${app}`]
  });
  const apps = ['tienda'];
  assert.deepEqual(checkAppLayout(complete('tienda'), apps), []);

  const snapshot = {
    ...complete('tienda'),
    e2eApps: ['tienda', 'nueva'],
    selectorApps: [],
    looseSelectorFiles: ['carrito.json'],
    commandFiles: ['tienda.js', 'nueva.js'],
    discoveryDocs: []
  };
  assert.deepEqual(checkAppLayout(snapshot, apps), [
    'cypress/e2e/nueva/: app no declarada -- agregarla a "apps" en qa.config.json (y a la tabla "Apps" del README).',
    'tienda: faltan selectores relevados en cypress/fixtures/selectors/tienda/.',
    'tienda: faltan discovery en docs/discovery/tienda.md.',
    'cypress/fixtures/selectors/carrito.json: selector suelto -- va en cypress/fixtures/selectors/<app>/.',
    'cypress/support/commands/nueva.js: no está importado en cypress/support/commands.js (sus comandos no existen en los tests).'
  ]);
});
