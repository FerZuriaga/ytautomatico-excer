/**
 * Contrato del adapter del gestor de pruebas (lib/test-manager-contract.js):
 * el adapter actual lo cumple, los CLIs no usan nada fuera de él y no hay
 * funciones del contrato que nadie use.
 *
 * Correr con: node --test v3/scripts/lib/test-manager-contract.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { METHOD_NAMES, STATUSES, checkAdapter, methodsCalledOn, isExecution } = require('./test-manager-contract');

const SCRIPTS = path.resolve(__dirname, '..');
// Los CLIs que hablan con el gestor (regla uso-adapters-jira-xray de lib/architecture.js).
const CLIS = ['create-jira-task.js', 'run-and-report.js', 'check-traceability.js'];
const callsOf = file => methodsCalledOn(fs.readFileSync(path.join(SCRIPTS, file), 'utf8'), 'xray');

test('el adapter actual (lib/xray.js) cumple el contrato', () => {
  assert.deepEqual(checkAdapter(require('./xray')), []);
});

test('los CLIs solo usan funciones del contrato', () => {
  for (const cli of CLIS) {
    const outside = callsOf(cli).filter(name => !METHOD_NAMES.includes(name));
    assert.deepEqual(outside, [], `${cli} usa funciones del adapter fuera del contrato: agregarlas a lib/test-manager-contract.js o no usarlas`);
  }
});

test('cada función del contrato la usa algún CLI (el contrato no acumula funciones muertas)', () => {
  const used = new Set(CLIS.flatMap(callsOf));
  assert.deepEqual(METHOD_NAMES.filter(name => !used.has(name)), []);
});

test('checkAdapter nombra cada función faltante o que no es función', () => {
  const adapter = Object.fromEntries(METHOD_NAMES.map(name => [name, () => {}]));
  delete adapter.getTestCycle;
  adapter.getStatus = 'no es función';
  assert.deepEqual(checkAdapter(adapter), [
    'falta la función "getTestCycle" del contrato',
    'falta la función "getStatus" del contrato'
  ]);
  assert.equal(checkAdapter(undefined).length, METHOD_NAMES.length);
});

test('methodsCalledOn lee llamadas, no propiedades ni otras variables', () => {
  const code = 'await xray.getTestCase(k);\nxray.getTestCase (k);\nconst h = xray.host;\nother.getStatus(s);\nxray.getStatus(s)';
  assert.deepEqual(methodsCalledOn(code, 'xray'), ['getStatus', 'getTestCase']);
});

// Caso real (2026-10-03, D-45): getTestExecutions devolvía la forma del
// GraphQL de Xray y lib/test-runner.js la leía tal cual.
test('el adapter traduce el Test Run de Xray a la Ejecución del contrato', () => {
  const { toExecution } = require('./xray');
  const execution = toExecution({ id: '6a1', status: { name: 'PASSED' }, test: { issueId: '10', jira: { key: 'SCRUM-1' } } });
  assert.deepEqual(execution, { id: '6a1', testCaseKey: 'SCRUM-1', status: 'PASSED' });
  assert.ok(isExecution(execution));
  assert.equal(toExecution({ id: '6a2', status: null, test: { jira: { key: 'SCRUM-2' } } }).status, null);
});

test('isExecution rechaza la forma cruda del gestor y estados desconocidos', () => {
  assert.equal(isExecution({ id: '1', status: { name: 'PASSED' }, test: { jira: { key: 'SCRUM-1' } } }), false);
  assert.equal(isExecution({ id: '1', testCaseKey: 'SCRUM-1', status: 'APROBADO' }), false);
  assert.equal(isExecution({ id: '1', testCaseKey: 'SCRUM-1', status: null }), true);
  assert.deepEqual(STATUSES, ['TO DO', 'EXECUTING', 'PASSED', 'FAILED']);
});
