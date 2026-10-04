/**
 * Fronteras de arquitectura: qué archivo puede hablar con qué herramienta
 * externa. El test (architecture.test.js) escanea el repo real y falla si
 * aparece un uso fuera de su lugar, así cambiar de herramienta (Jira/Xray
 * por otro gestor, Cypress por otro runner, GitHub por otro host) sigue
 * siendo tocar pocos archivos conocidos. El mapa legible está en
 * docs/architecture/herramientas.md y usa estas mismas reglas.
 *
 * Solo se analiza código: los comentarios se quitan antes de buscar (una
 * URL de Jira citada en un comentario no es un uso).
 *
 * Nace del 2026-09-28 (punto 2 del plan: portabilidad).
 */
const { config } = require('./qa-config');

// Rutas relativas a la raíz del repo, con "/".
const RULES = [
  {
    id: 'credenciales-jira-xray',
    tool: 'Jira / Xray',
    description: 'Credenciales y URL de Jira/Xray solo en sus adapters.',
    pattern: /process\.env\.(JIRA_URL|JIRA_EMAIL|JIRA_API_TOKEN|XRAY_[A-Z_]+)\b|atlassian\.net|xray\.cloud\.getxray\.app/,
    scope: /^(v3\/scripts|cypress)\/|^cypress\.config\.js$/,
    allowed: ['v3/scripts/lib/jira.js', 'v3/scripts/lib/xray.js']
  },
  {
    id: 'uso-adapters-jira-xray',
    tool: 'Jira / Xray',
    description: 'Los adapters de Jira/Xray solo los usan los CLIs del PASO 2/3 (las libs de reglas quedan independientes del gestor).',
    pattern: /require\(\s*['"][./]*(lib\/)?(jira|xray)(\.js)?['"]\s*\)/,
    scope: /^v3\/scripts\//,
    allowed: ['v3/scripts/create-jira-task.js', 'v3/scripts/run-and-report.js', 'v3/scripts/check-traceability.js', 'v3/scripts/lib/xray.js']
  },
  {
    id: 'github',
    tool: 'GitHub',
    description: 'Token y API de GitHub solo en create-pull-request.js.',
    pattern: /process\.env\.GITHUB_TOKEN\b|api\.github\.com/,
    scope: /^(v3\/scripts|cypress)\//,
    allowed: ['v3/scripts/create-pull-request.js']
  },
  {
    id: 'arranque-cypress',
    tool: 'Cypress',
    description: 'Solo run-and-report.js (PASO 3) y explore-page.js (PASO 1) arrancan Cypress.',
    pattern: /\[\s*['"]cypress['"]\s*,\s*['"](run|open)['"]|require\(\s*['"]cypress['"]\s*\)\.(run|open)\b/,
    scope: /^v3\/scripts\//,
    allowed: ['v3/scripts/run-and-report.js', 'v3/scripts/explore-page.js']
  },
  {
    id: 'libs-sin-procesos',
    tool: 'Sistema',
    description: 'Las libs no lanzan procesos: solo los CLIs ejecutan comandos (git, npx).',
    pattern: /require\(\s*['"](node:)?child_process['"]\s*\)/,
    scope: /^v3\/scripts\/lib\//,
    allowed: []
  },
  {
    id: 'libs-sin-entorno',
    tool: 'Sistema',
    description: 'Las libs no leen variables de entorno, salvo los adapters que manejan credenciales.',
    pattern: /process\.env\b/,
    scope: /^v3\/scripts\/lib\//,
    allowed: ['v3/scripts/lib/jira.js', 'v3/scripts/lib/xray.js']
  }
];

// Quita comentarios /* */ y // de línea completa o al final de una línea
// de código (sin tocar "https://" dentro de strings).
function stripComments(source) {
  return String(source)
    // Un "/*" pegado a "*" es un glob ("**/*.cy.js"), no un comentario: si
    // se tomara como tal escondería el código hasta el próximo "*/".
    .replace(/(^|[^*'"`\\])\/\*[\s\S]*?\*\//g, (block, before) => before + block.slice(before.length).replace(/[^\n]/g, '')) // conserva los números de línea
    .replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
}

const isTest = file => /\.test\.js$/.test(file);

/**
 * files: { "<ruta relativa>": "<código>" }. Devuelve una violación por
 * regla y archivo: { rule, file, line, text }.
 */
function checkArchitecture(files, rules = RULES) {
  const violations = [];
  for (const [file, source] of Object.entries(files)) {
    if (isTest(file)) continue;
    const lines = stripComments(source).split('\n');
    for (const rule of rules) {
      if (!rule.scope.test(file) || rule.allowed.includes(file)) continue;
      const index = lines.findIndex(line => rule.pattern.test(line));
      if (index >= 0) violations.push({ rule: rule.id, file, line: index + 1, text: lines[index].trim().slice(0, 120) });
    }
  }
  return violations;
}

function formatViolations(violations, rules = RULES) {
  return violations.map(v => {
    const rule = rules.find(r => r.id === v.rule);
    return `${v.file}:${v.line} [${v.rule}] ${rule.description} Permitido en: ${rule.allowed.join(', ') || 'ningún archivo'}. -> ${v.text}`;
  }).join('\n');
}

// ─── Orden por aplicación ────────────────────────────────────────────────────
//
// Toda carpeta de app en cypress/e2e/ tiene que estar declarada en "apps"
// de qa.config.json, y cada una tiene todas sus piezas en su lugar (D-28).
// Nace del 2026-09-28: 14 selectores de Automation Test Store estaban
// sueltos en la raíz de fixtures/selectors/ y nada lo detectaba.

// Piezas obligatorias de una app activa (las recetas de datos por API son
// opcionales: no toda app tiene una API para preparar datos).
const ACTIVE_APP_PARTS = [
  { label: 'specs', has: (s, app) => s.e2eApps.includes(app), where: app => `cypress/e2e/${app}/` },
  { label: 'Page Objects', has: (s, app) => s.pagesApps.includes(app), where: app => `cypress/pages/${app}/` },
  { label: 'selectores relevados', has: (s, app) => s.selectorApps.includes(app), where: app => `cypress/fixtures/selectors/${app}/` },
  { label: 'comandos propios', has: (s, app) => s.commandFiles.includes(`${app}.js`), where: app => `cypress/support/commands/${app}.js` },
  { label: 'discovery', has: (s, app) => s.discoveryDocs.includes(`${app}.md`), where: app => `docs/discovery/${app}.md` },
  { label: 'script npm', has: (s, app) => s.npmScripts.includes(`test:${app}`), where: app => `"test:${app}" en package.json` }
];

/**
 * snapshot: { e2eApps, pagesApps, selectorApps, looseSelectorFiles,
 *   commandFiles, commandImports, discoveryDocs, npmScripts } (listados del
 * repo). Devuelve la lista de problemas encontrados.
 */
function checkAppLayout(snapshot, apps = config.apps) {
  const problems = [];

  snapshot.e2eApps.filter(app => !apps.includes(app)).forEach(app =>
    problems.push(`cypress/e2e/${app}/: app no declarada -- agregarla a "apps" en qa.config.json (y a la tabla "Apps" del README).`));

  for (const app of apps) {
    ACTIVE_APP_PARTS.filter(part => !part.has(snapshot, app)).forEach(part =>
      problems.push(`${app}: faltan ${part.label} en ${part.where(app)}.`));
  }

  snapshot.looseSelectorFiles.forEach(file =>
    problems.push(`cypress/fixtures/selectors/${file}: selector suelto -- va en cypress/fixtures/selectors/<app>/.`));

  snapshot.commandFiles.filter(file => !snapshot.commandImports.includes(file.replace(/\.js$/, ''))).forEach(file =>
    problems.push(`cypress/support/commands/${file}: no está importado en cypress/support/commands.js (sus comandos no existen en los tests).`));

  return problems;
}

module.exports = { RULES, stripComments, checkArchitecture, formatViolations, checkAppLayout };
