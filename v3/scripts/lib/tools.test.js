/**
 * lib/tools.js (D-48): cada gestor se elige en qa.config.json y el adapter
 * se valida contra su contrato al cargarlo.
 *
 * Correr con: node --test v3/scripts/lib/tools.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadAdapter, testManager, issueTracker } = require('./tools');
const { config } = require('./qa-config');
const testManagerContract = require('./test-manager-contract');

const complete = names => Object.fromEntries(names.map(name => [name, () => {}]));
const fakeLib = files => ({ exists: name => name in files, load: name => files[name] });

test('la config del repo elige Xray y Jira, y los dos cumplen su contrato', () => {
  assert.deepEqual(config.herramientas, { gestorDePruebas: 'xray', gestorDeTickets: 'jira' });
  assert.equal(testManager(), require('./xray'));
  assert.equal(issueTracker(), require('./jira'));
});

test('otro gestor de pruebas es un archivo nuevo y una línea de config', () => {
  const testrail = complete(testManagerContract.METHOD_NAMES);
  const adapter = loadAdapter('gestorDePruebas', { tools: { gestorDePruebas: 'testrail' }, ...fakeLib({ testrail }) });
  assert.equal(adapter, testrail);
});

test('un adapter incompleto frena al cargarlo, nombrando lo que falta', () => {
  const partial = complete(testManagerContract.METHOD_NAMES);
  delete partial.getTestCycle;
  assert.throws(
    () => loadAdapter('gestorDePruebas', { tools: { gestorDePruebas: 'zephyr' }, ...fakeLib({ zephyr: partial }) }),
    /El adapter "zephyr" \(gestor de pruebas\) no cumple lib\/test-manager-contract\.js: falta la función "getTestCycle" del contrato\./
  );
});

test('un adapter que no existe explica qué archivo escribir', () => {
  assert.throws(
    () => loadAdapter('gestorDeTickets', { tools: { gestorDeTickets: 'azure-boards' }, ...fakeLib({}) }),
    /no existe v3\/scripts\/lib\/azure-boards\.js\. Escribir el adapter del gestor de tickets según lib\/issue-tracker-contract\.js/
  );
});

test('un nombre que no es de un archivo de lib/ se rechaza sin cargar nada', () => {
  for (const name of ['../jira', 'Xray', 'xray.js', '', undefined]) {
    assert.throws(() => loadAdapter('gestorDePruebas', { tools: { gestorDePruebas: name }, ...fakeLib({}) }), /tiene que ser el nombre de un archivo de v3\/scripts\/lib\/ sin "\.js"/);
  }
  assert.throws(() => loadAdapter('gestorDeCodigo'), /Herramienta desconocida "gestorDeCodigo"/);
});
