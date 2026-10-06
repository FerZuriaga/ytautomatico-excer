/**
 * Único lugar que elige con qué gestor habla el framework (D-48).
 *
 * `herramientas` de qa.config.json nombra el adapter de cada gestor (un
 * archivo de esta carpeta): { "gestorDePruebas": "xray", "gestorDeTickets":
 * "jira" }. Cambiar de gestor es escribir el adapter nuevo, que cumpla su
 * contrato, y cambiar esa línea: los CLIs piden el adapter acá y no saben
 * cuál es. Si al adapter le falta una función del contrato, frena al
 * cargarlo nombrando lo que falta (antes de publicar o reportar nada).
 *
 * Nace del 2026-10-06: cambiar Xray era escribir el adapter Y tocar el
 * require de 3 CLIs; y Jira no tenía contrato.
 */
const fs = require('fs');
const path = require('path');
const { config } = require('./qa-config');
const testManagerContract = require('./test-manager-contract');
const issueTrackerContract = require('./issue-tracker-contract');

const KINDS = {
  gestorDePruebas: { label: 'gestor de pruebas', contract: testManagerContract, contractFile: 'lib/test-manager-contract.js' },
  gestorDeTickets: { label: 'gestor de tickets', contract: issueTrackerContract, contractFile: 'lib/issue-tracker-contract.js' }
};

const requireFromLib = name => require(path.join(__dirname, name));
const existsInLib = name => fs.existsSync(path.join(__dirname, `${name}.js`));

/**
 * El adapter de `kind` según `tools` (la sección `herramientas`), validado
 * contra su contrato. `load` y `exists` se inyectan en los tests.
 */
function loadAdapter(kind, { tools = config.herramientas, load = requireFromLib, exists = existsInLib } = {}) {
  const spec = KINDS[kind];
  if (!spec) throw new Error(`Herramienta desconocida "${kind}" (disponibles: ${Object.keys(KINDS).join(', ')}).`);
  const name = tools && tools[kind];
  if (!/^[a-z0-9][a-z0-9-]*$/.test(String(name || ''))) {
    throw new Error(`qa.config.json: herramientas.${kind} tiene que ser el nombre de un archivo de v3/scripts/lib/ sin ".js" (ej. "xray"), no "${name}".`);
  }
  if (!exists(name)) {
    throw new Error(`qa.config.json: herramientas.${kind} = "${name}", pero no existe v3/scripts/lib/${name}.js. Escribir el adapter del ${spec.label} según ${spec.contractFile}.`);
  }
  const adapter = load(name);
  const problems = spec.contract.checkAdapter(adapter);
  if (problems.length) {
    throw new Error(`El adapter "${name}" (${spec.label}) no cumple ${spec.contractFile}: ${problems.join('; ')}.`);
  }
  return adapter;
}

module.exports = {
  KINDS,
  loadAdapter,
  testManager: options => loadAdapter('gestorDePruebas', options),
  issueTracker: options => loadAdapter('gestorDeTickets', options)
};
