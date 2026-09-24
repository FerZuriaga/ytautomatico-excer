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
  parseResultsText,
  summarizeResults,
  isReportable,
  compareReportedStatuses,
  collectTaggedTests,
  extractTestCaseKey
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

// ─── summarizeResults / isReportable / compareReportedStatuses ──────────────
// Nacen de la sesion del 2026-09-23: el conteo de reintentos y el control
// de "100% antes de reportar" se hacian a mano con scripts sueltos.

test('resumen: cuenta passes, fallas con mensaje, pendientes y tests sin tag', () => {
  const doc = mochaJsonDoc({ testsCount: 3, passesTitles: ['[CA-01][TC-01.1][SCRUM-351] pasa', 'sin tag'], failuresTitles: ['[CA-01][TC-01.2][SCRUM-352] falla'] });
  doc.failures[0].err = { message: 'expected 10 to equal 11' };

  const summary = summarizeResults(doc);

  assert.equal(summary.total, 3);
  assert.equal(summary.passed, 2);
  assert.deepEqual(summary.failed, [{ fullTitle: '[CA-01][TC-01.2][SCRUM-352] falla', message: 'expected 10 to equal 11' }]);
  assert.deepEqual(summary.untagged, ['sin tag']);
  assert.equal(isReportable(summary), false);
});

test('resumen: un test que paso recien en el reintento queda visible en retriedPasses', () => {
  const doc = mochaJsonDoc({ testsCount: 2, passesTitles: ['[SCRUM-360] estable', '[SCRUM-361] inestable'] });
  doc.passes[1].currentRetry = 1;

  const summary = summarizeResults(doc);

  assert.deepEqual(summary.retriedPasses, ['[SCRUM-361] inestable']);
  assert.equal(isReportable(summary), true);
});

test('isReportable: corrida vacia o con pendientes no se reporta', () => {
  assert.equal(isReportable(summarizeResults(mochaJsonDoc({ testsCount: 0 }))), false);

  const doc = mochaJsonDoc({ testsCount: 1, passesTitles: ['[SCRUM-1] ok'] });
  doc.pending = [{ fullTitle: '[SCRUM-2] skip' }];
  assert.equal(isReportable(summarizeResults(doc)), false);
});

test('compareReportedStatuses: detecta keys sin ejecucion y ejecuciones que no quedaron en PASSED', () => {
  const executions = [
    { status: { name: 'PASSED' }, test: { jira: { key: 'SCRUM-351' } } },
    { status: { name: 'TO DO' }, test: { jira: { key: 'SCRUM-352' } } }
  ];

  assert.deepEqual(compareReportedStatuses(executions, ['SCRUM-351', 'SCRUM-352', 'SCRUM-999']), {
    missing: ['SCRUM-999'],
    notPassed: [{ key: 'SCRUM-352', status: 'TO DO' }]
  });
  assert.deepEqual(compareReportedStatuses(executions, ['SCRUM-351']), { missing: [], notPassed: [] });
});

// ─── Tests salteados por bug conocido ───────────────────────────────────────
// Nace de SCRUM-346/347 (2026-09-24): validan el comportamiento esperado de
// Mi cuenta, que hoy falla por el Bug SCRUM-380, y se saltean con it.skip.
// Sin esta regla, isReportable los tomaba como pendientes y ninguna corrida
// de CommitQuality volvia a reportar a Xray.

test('pendiente con "(bug conocido: KEY)" no bloquea el reporte ni se reporta a Xray', () => {
  const doc = mochaJsonDoc({ testsCount: 2, passesTitles: ['[CA-03][TC-03.1][SCRUM-344] guarda'] });
  doc.pending = [{ fullTitle: '[CA-04][TC-04.1][SCRUM-346] conserva los datos (bug conocido: SCRUM-380)' }];

  const summary = summarizeResults(doc);

  assert.deepEqual(summary.pending, []);
  assert.deepEqual(summary.knownBugSkips, [{ fullTitle: '[CA-04][TC-04.1][SCRUM-346] conserva los datos (bug conocido: SCRUM-380)', bug: 'SCRUM-380' }]);
  assert.equal(isReportable(summary), true);
  assert.deepEqual(collectTaggedTests(doc).map(t => t.testCaseKey), ['SCRUM-344']);
  assert.equal(extractTestCaseKey(doc.pending[0].fullTitle), 'SCRUM-346');
});

test('pendiente sin bug conocido sigue frenando; corrida con solo salteados no se reporta', () => {
  const sinMotivo = mochaJsonDoc({ testsCount: 2, passesTitles: ['[SCRUM-1] ok'] });
  sinMotivo.pending = [{ fullTitle: '[SCRUM-2] skip sin motivo' }, { fullTitle: '[SCRUM-3] skip (bug conocido: SCRUM-9)' }];
  assert.deepEqual(summarizeResults(sinMotivo).pending, ['[SCRUM-2] skip sin motivo']);
  assert.equal(isReportable(summarizeResults(sinMotivo)), false);

  const soloSalteados = mochaJsonDoc({ testsCount: 1 });
  soloSalteados.pending = [{ fullTitle: '[SCRUM-3] skip (bug conocido: SCRUM-9)' }];
  assert.equal(isReportable(summarizeResults(soloSalteados)), false);
});
