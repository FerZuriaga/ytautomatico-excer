/**
 * Cobertura real de parseResultsText/splitConcatenatedJsonObjects/
 * mergeResultsDocs -- nace del bug real encontrado el 2026-09-20 al
 * correr 2 specs de Automation Test Store en una sola invocación de
 * Cypress (el reporter "json" de Mocha emite un documento JSON completo
 * por spec, concatenados sin separador, y el parseo original hacía un
 * único JSON.parse). Usa el test runner nativo de Node (node:test), sin
 * agregar una dependencia nueva al proyecto -- este repo no tenía
 * ningún test unitario hasta ahora, solo specs de Cypress.
 *
 * Correr con: node --test v3/scripts/lib/test-runner.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  splitConcatenatedJsonObjects,
  mergeResultsDocs,
  parseResultsText
} = require('./test-runner');

function mochaJsonDoc({ testsCount = 1, passesTitles = [], failuresTitles = [] } = {}) {
  const toEntry = (title) => ({ title, fullTitle: title, file: null, duration: 1, currentRetry: 0, err: {} });
  return {
    stats: {
      suites: 1,
      tests: testsCount,
      passes: passesTitles.length,
      pending: 0,
      failures: failuresTitles.length
    },
    tests: [...passesTitles, ...failuresTitles].map(toEntry),
    pending: [],
    failures: failuresTitles.map(toEntry),
    passes: passesTitles.map(toEntry)
  };
}

test('un solo documento se devuelve igual que antes (sin cambio de comportamiento)', () => {
  const doc = mochaJsonDoc({ testsCount: 1, passesTitles: ['[SCRUM-1] test unico'] });
  const raw = JSON.stringify(doc);

  const result = parseResultsText(raw, 'un-spec.json');

  assert.deepEqual(result, doc);
});

test('combina 2 documentos JSON concatenados (2 specs en 1 sola corrida)', () => {
  const docA = mochaJsonDoc({ testsCount: 1, passesTitles: ['[SCRUM-277] spec A'] });
  const docB = mochaJsonDoc({ testsCount: 1, passesTitles: ['[SCRUM-283] spec B'] });
  const raw = JSON.stringify(docA) + JSON.stringify(docB);

  const result = parseResultsText(raw, 'dos-specs.json');

  assert.equal(result.stats.tests, 2);
  assert.equal(result.stats.passes, 2);
  assert.equal(result.passes.length, 2);
  assert.deepEqual(result.passes.map(t => t.title), ['[SCRUM-277] spec A', '[SCRUM-283] spec B']);
});

test('combina 3+ documentos JSON concatenados, no solo 2', () => {
  const docs = [1, 2, 3, 4].map(n =>
    mochaJsonDoc({ testsCount: 1, passesTitles: [`[SCRUM-${n}] test ${n}`] })
  );
  const raw = docs.map(d => JSON.stringify(d)).join('');

  const result = parseResultsText(raw, 'cuatro-specs.json');

  assert.equal(result.stats.tests, 4);
  assert.equal(result.passes.length, 4);
});

test('un titulo de test con llaves literales no rompe el split', () => {
  const docA = mochaJsonDoc({ testsCount: 1, passesTitles: ['[SCRUM-1] valida el objeto {a: 1, b: 2}'] });
  const docB = mochaJsonDoc({ testsCount: 1, passesTitles: ['[SCRUM-2] otro test'] });
  const raw = JSON.stringify(docA) + JSON.stringify(docB);

  const result = parseResultsText(raw, 'con-llaves.json');

  assert.equal(result.passes.length, 2);
  assert.equal(result.passes[0].title, '[SCRUM-1] valida el objeto {a: 1, b: 2}');
});

test('combina failures y pending ademas de passes', () => {
  const docA = mochaJsonDoc({ testsCount: 1, failuresTitles: ['[SCRUM-9] test que falla'] });
  const docB = mochaJsonDoc({ testsCount: 1, passesTitles: ['[SCRUM-10] test que pasa'] });
  const raw = JSON.stringify(docA) + JSON.stringify(docB);

  const result = parseResultsText(raw, 'mixto.json');

  assert.equal(result.stats.failures, 1);
  assert.equal(result.stats.passes, 1);
  assert.equal(result.failures.length, 1);
  assert.equal(result.passes.length, 1);
});

test('texto vacio lanza un error claro en vez de devolver un resultado vacio silencioso', () => {
  assert.throws(
    () => parseResultsText('', 'vacio.json'),
    /no contiene ningún resultado de Cypress válido/
  );
});

test('JSON truncado (corrida de Cypress interrumpida) lanza un error claro', () => {
  const truncado = '{"stats":{"tests":1},"tests":[';

  assert.throws(
    () => parseResultsText(truncado, 'truncado.json'),
    /incompleto o truncado/
  );
});

test('una llave de cierre sin apertura lanza un error claro', () => {
  assert.throws(
    () => splitConcatenatedJsonObjects('}'),
    /sin apertura correspondiente/
  );
});

test('mergeResultsDocs sobre un array vacio devuelve una forma valida sin tests', () => {
  const result = mergeResultsDocs([]);

  assert.deepEqual(result.tests, []);
  assert.deepEqual(result.passes, []);
});
