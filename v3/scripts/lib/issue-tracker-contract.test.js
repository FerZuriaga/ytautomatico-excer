/**
 * Contrato del adapter del gestor de tickets (lib/issue-tracker-contract.js):
 * el adapter actual lo cumple, los CLIs no usan nada fuera de él y no hay
 * funciones del contrato que nadie use. Mismo esquema que el del gestor de
 * pruebas (test-manager-contract.test.js).
 *
 * Correr con: node --test v3/scripts/lib/issue-tracker-contract.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { METHOD_NAMES, checkAdapter } = require('./issue-tracker-contract');
const { methodsCalledOn } = require('./test-manager-contract');
const { stripComments } = require('./architecture');

const SCRIPTS = path.resolve(__dirname, '..');
// Los CLIs que hablan con el gestor de tickets (lib/tools.js, D-48).
const CLIS = ['create-jira-task.js', 'check-traceability.js', 'run-and-report.js'];
const callsOf = file => methodsCalledOn(fs.readFileSync(path.join(SCRIPTS, file), 'utf8'), 'jira');

test('el adapter actual (lib/jira.js) cumple el contrato', () => {
  assert.deepEqual(checkAdapter(require('./jira')), []);
});

test('los CLIs solo usan funciones del contrato', () => {
  for (const cli of CLIS) {
    const outside = callsOf(cli).filter(name => !METHOD_NAMES.includes(name));
    assert.deepEqual(outside, [], `${cli} usa funciones del adapter fuera del contrato: agregarlas a lib/issue-tracker-contract.js o no usarlas`);
  }
});

test('cada función del contrato la usa algún CLI (el contrato no acumula funciones muertas)', () => {
  const used = new Set(CLIS.flatMap(callsOf));
  assert.deepEqual(METHOD_NAMES.filter(name => !used.has(name)), []);
});

// Caso real (2026-10-06): create-jira-task.js armaba el link con
// jira.HOSTNAME, una propiedad que el contrato no veía (solo mira llamadas).
test('los CLIs no leen propiedades del adapter: todo pasa por funciones', () => {
  for (const cli of CLIS) {
    // Sin comentarios y sin `config.jira.*` (la config, no el adapter).
    const code = stripComments(fs.readFileSync(path.join(SCRIPTS, cli), 'utf8'));
    const properties = [...code.matchAll(/(?<![.\w$])jira\.([A-Za-z_$][\w$]*)\b(?!\s*\()/g)].map(m => m[1]);
    assert.deepEqual(properties, [], `${cli} lee propiedades del adapter (usar una función del contrato, como issueUrl)`);
  }
});

test('checkAdapter nombra cada función faltante', () => {
  const adapter = Object.fromEntries(METHOD_NAMES.map(name => [name, () => {}]));
  delete adapter.issueUrl;
  assert.deepEqual(checkAdapter(adapter), ['falta la función "issueUrl" del contrato']);
});
