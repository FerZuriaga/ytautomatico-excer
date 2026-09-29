/**
 * Specs afectados por los archivos modificados en una rama, para la
 * regresión después de un lote (run-and-report.js --affected). Nace del
 * 2026-09-26: en el lote de Checkout la regresión completa de la app (108
 * tests) llevó 10,5 minutos cuando el cambio tocaba 2 page objects.
 *
 * Un archivo de cypress/ está afectado si:
 *   - fue modificado;
 *   - importa (import/require relativo) un archivo afectado, en cadena;
 *   - usa un fixture modificado (por su ruta relativa a cypress/fixtures);
 *   - llama a un comando custom definido en un archivo de soporte
 *     modificado (cy.<comando>).
 * Cambios globales (cypress.config.js, cypress/support/e2e.js o
 * commands.js, package.json) afectan a todos los specs de las apps
 * activas (`activeApps`, ver APPS en lib/architecture.js); los de legado
 * quedan afuera (D-33, 2026-09-29: la suite completa de 89 specs llevaba
 * más de 35 minutos, casi todo en apps de legado rotas contra sitios reales
 * que nadie mantiene). Sin `activeApps`, todos los specs.
 *
 * Funciones puras: el acceso a git y al disco queda en run-and-report.js.
 * Todas las rutas son relativas a la raíz del repo, con "/".
 */
const path = require('path').posix;

const SPEC_REGEX = /^cypress\/e2e\/.+\.cy\.js$/;
const FIXTURES_DIR = 'cypress/fixtures/';
const GLOBAL_FILES = new Set(['cypress.config.js', 'cypress/support/e2e.js', 'cypress/support/commands.js', 'package.json']);

function toPosix(file) {
  return String(file).replace(/\\/g, '/');
}

function isSpec(file) {
  return SPEC_REGEX.test(toPosix(file));
}

// Rutas relativas de import/require ('./x', '../pages/y').
function parseImports(source) {
  const specs = [];
  const regex = /(?:\bimport\s+(?:[\s\S]*?\s+from\s+)?|\brequire\(\s*)['"`](\.{1,2}\/[^'"`]+)['"`]/g;
  for (const match of String(source).matchAll(regex)) specs.push(match[1]);
  return specs;
}

// Nombres de los comandos custom que define un archivo de soporte.
function parseCommandsDefined(source) {
  return [...String(source).matchAll(/Cypress\.Commands\.(?:add|overwrite)\(\s*['"`]([\w$]+)['"`]/g)].map(m => m[1]);
}

function resolveImport(fromFile, specifier, knownFiles) {
  const base = path.normalize(path.join(path.dirname(fromFile), specifier));
  return [base, `${base}.js`, `${base}/index.js`].find(candidate => knownFiles.has(candidate)) || null;
}

// "selectors/app/modulo" (sin .json) a partir de "cypress/fixtures/selectors/app/modulo.json".
function fixtureRef(file) {
  return file.slice(FIXTURES_DIR.length).replace(/\.json$/, '');
}

function referencesFixture(source, ref) {
  return ['\'', '"', '`'].some(q => source.includes(`${q}${ref}${q}`) || source.includes(`${q}${ref}.json${q}`));
}

function callsCommand(source, name) {
  return new RegExp(`\\bcy\\.${name.replace(/\$/g, '\\$')}\\(`).test(source);
}

/**
 * `sources`: Map ruta -> contenido de todos los .js de cypress/ (specs,
 * page objects, soporte). `changed`: rutas modificadas en la rama.
 * Devuelve { specs, global, reasons, skipped } con los specs afectados
 * ordenados, por spec el primer motivo encontrado (para mostrarlo en
 * consola) y, en un cambio global, los specs de legado que no se corren.
 */
function findAffectedSpecs(sources, changed, { activeApps } = {}) {
  const changedFiles = [...new Set(changed.map(toPosix))];
  const allSpecs = [...sources.keys()].filter(isSpec).sort();
  const globalChange = changedFiles.find(f => GLOBAL_FILES.has(f));
  if (globalChange) {
    const isActive = spec => !activeApps || activeApps.some(app => spec.startsWith(`cypress/e2e/${app}/`));
    const specs = allSpecs.filter(isActive);
    return {
      specs, global: true, skipped: allSpecs.filter(s => !isActive(s)),
      reasons: new Map(specs.map(s => [s, `cambio global (${globalChange})`]))
    };
  }

  const knownFiles = new Set(sources.keys());
  const fixtureRefs = changedFiles.filter(f => f.startsWith(FIXTURES_DIR) && f.endsWith('.json')).map(fixtureRef);
  const commands = changedFiles
    .filter(f => f.startsWith('cypress/support/') && sources.has(f))
    .flatMap(f => parseCommandsDefined(sources.get(f)));

  // Motivo directo de cada archivo (modificado, fixture o comando).
  const reasons = new Map();
  for (const [file, source] of sources) {
    if (changedFiles.includes(file)) reasons.set(file, 'modificado');
    else {
      const ref = fixtureRefs.find(r => referencesFixture(source, r));
      if (ref) reasons.set(file, `usa el fixture ${ref}.json`);
      else {
        const command = commands.find(c => callsCommand(source, c));
        if (command) reasons.set(file, `usa cy.${command}()`);
      }
    }
  }

  // Propagación por imports hasta que no cambie nada.
  const imports = new Map([...sources].map(([file, source]) => [
    file, parseImports(source).map(s => resolveImport(file, s, knownFiles)).filter(Boolean)
  ]));
  let grew = true;
  while (grew) {
    grew = false;
    for (const [file, deps] of imports) {
      if (reasons.has(file)) continue;
      const dep = deps.find(d => reasons.has(d));
      if (dep) {
        reasons.set(file, `importa ${dep}`);
        grew = true;
      }
    }
  }

  const specs = allSpecs.filter(s => reasons.has(s));
  return { specs, global: false, reasons: new Map(specs.map(s => [s, reasons.get(s)])) };
}

module.exports = { findAffectedSpecs, parseImports, parseCommandsDefined, isSpec, toPosix };
