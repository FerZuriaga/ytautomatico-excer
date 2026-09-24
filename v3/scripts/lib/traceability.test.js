/**
 * Cobertura de traceability -- punto 4 de la revisión del 2026-09-23:
 * el criterio del Test Case se perdía al publicar en Xray, y un error de
 * tipeo en las keys copiadas a mano en los it() no lo detectaba nadie.
 * La regresión principal usa el spec REAL de Practice IFrame (SCRUM-349).
 *
 * Correr con: node --test v3/scripts/lib/traceability.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const {
  buildTraceabilityLabels,
  criterionFromLabels,
  parseSpecTags,
  checkTraceability
} = require('./traceability');

const IFRAME_SPEC = path.resolve(__dirname, '../../../cypress/e2e/commitquality/cq_tc_practice_iframe.cy.js');

const spec = (tests, story = 'SCRUM-1') => ({
  file: 'x.cy.js',
  story,
  tests: tests.map(([ca, tc, key], i) => ({ file: 'x.cy.js', line: i + 1, title: `[${ca}][${tc}][${key}] t`, ca, tc, key }))
});

const testIssue = (labels = []) => ({ issuetype: 'Test', labels, linkedTests: [] });

// ─── Labels al publicar ──────────────────────────────────────────────────────

test('labels: agrega criterio y tipo a los labels propios, sin repetidos', () => {
  assert.deepEqual(buildTraceabilityLabels({ labels: ['smoke', 'CA-01'], criterio: 'ca-01', tipo: 'Negativo' }), ['smoke', 'CA-01', 'negativo']);
  assert.deepEqual(buildTraceabilityLabels({ criterio: 'CA-02' }), ['CA-02']);
  assert.deepEqual(buildTraceabilityLabels({ criterio: 'criterio 1', tipo: 'borde' }), []);
  assert.deepEqual(buildTraceabilityLabels({}), []);
});

test('criterionFromLabels encuentra el label CA-XX entre otros', () => {
  assert.equal(criterionFromLabels(['negativo', 'CA-03']), 'CA-03');
  assert.equal(criterionFromLabels(['smoke']), null);
});

// ─── Lectura de specs ────────────────────────────────────────────────────────

test('regresion spec real de IFrame: HU del describe y los 7 it() con sus tags', () => {
  const parsed = parseSpecTags(fs.readFileSync(IFRAME_SPEC, 'utf8'), 'cq_tc_practice_iframe.cy.js');

  assert.equal(parsed.story, 'SCRUM-349');
  assert.equal(parsed.tests.length, 7);
  assert.deepEqual(parsed.tests.map(t => t.key), ['SCRUM-351', 'SCRUM-352', 'SCRUM-353', 'SCRUM-354', 'SCRUM-355', 'SCRUM-356', 'SCRUM-357']);
  assert.deepEqual(parsed.tests[2], {
    file: 'cq_tc_practice_iframe.cy.js',
    line: parsed.tests[2].line,
    title: '[CA-02][TC-02.1][SCRUM-353] Debe filtrar productos por nombre dentro del iframe',
    ca: 'CA-02',
    tc: 'TC-02.1',
    key: 'SCRUM-353'
  });
  assert.ok(parsed.tests[2].line > 1);
});

test('lectura: comillas dobles/backticks, it() sin tags y describe sin HU', () => {
  const source = [
    'describe("Suite sin key", () => {',
    '  it(`[CA-01][TC-01.1][SCRUM-10] con backticks`, () => {})',
    "  it('sin tags', () => {})",
    '})'
  ].join('\n');

  const parsed = parseSpecTags(source, 'y.cy.js');

  assert.equal(parsed.story, null);
  assert.deepEqual(parsed.tests.map(t => [t.key, t.line]), [['SCRUM-10', 2], [null, 3]]);
});

test('parseSpecTags: it.skip (bug conocido) tambien se parsea con su key', () => {
  const source = [
    "describe('Mi cuenta [SCRUM-338]', () => {",
    "  it.skip('[CA-04][TC-04.1][SCRUM-346] Debe conservar los datos (bug conocido: SCRUM-380)', () => {})",
    '})'
  ].join('\n');

  const parsed = parseSpecTags(source, 'z.cy.js');

  assert.equal(parsed.story, 'SCRUM-338');
  assert.deepEqual(parsed.tests.map(t => [t.ca, t.tc, t.key]), [['CA-04', 'TC-04.1', 'SCRUM-346']]);
});

// ─── Cruce contra Jira/Xray ──────────────────────────────────────────────────

test('trazabilidad completa y con labels: sin errores ni warnings', () => {
  const issues = new Map([
    ['SCRUM-1', { issuetype: 'Historia', labels: [], linkedTests: ['SCRUM-2', 'SCRUM-3'] }],
    ['SCRUM-2', testIssue(['CA-01', 'positivo'])],
    ['SCRUM-3', testIssue(['CA-01', 'negativo'])]
  ]);

  const result = checkTraceability([spec([['CA-01', 'TC-01.1', 'SCRUM-2'], ['CA-01', 'TC-01.2', 'SCRUM-3']])], issues);

  assert.deepEqual(result, { errors: [], warnings: [], missingLabels: [] });
});

test('error: key mal tipeada que apunta a otra HU o a algo que no es un Test', () => {
  const issues = new Map([
    ['SCRUM-1', { issuetype: 'Historia', labels: [], linkedTests: ['SCRUM-2'] }],
    ['SCRUM-2', testIssue(['CA-01'])],
    ['SCRUM-20', testIssue(['CA-01'])],
    ['SCRUM-348', { issuetype: 'Error', labels: [], linkedTests: [] }]
  ]);

  const { errors } = checkTraceability([spec([
    ['CA-01', 'TC-01.1', 'SCRUM-2'],
    ['CA-01', 'TC-01.2', 'SCRUM-20'],
    ['CA-01', 'TC-01.3', 'SCRUM-348'],
    ['CA-01', 'TC-01.4', 'SCRUM-9999']
  ])], issues);

  assert.deepEqual(errors, [
    'x.cy.js:2: SCRUM-20 no esta vinculado a la HU SCRUM-1.',
    'x.cy.js:3: SCRUM-348 no es un Test Case (es "Error").',
    'x.cy.js:4: SCRUM-9999 no existe en Jira/Xray.'
  ]);
});

test('error: TC bajo otro CA, key repetida, it() sin tags y label de criterio distinto', () => {
  const issues = new Map([
    ['SCRUM-1', { issuetype: 'Historia', labels: [], linkedTests: ['SCRUM-2', 'SCRUM-3'] }],
    ['SCRUM-2', testIssue(['CA-02'])],
    ['SCRUM-3', testIssue(['CA-01'])]
  ]);
  const s = spec([['CA-01', 'TC-02.1', 'SCRUM-2'], ['CA-01', 'TC-01.2', 'SCRUM-2']]);
  s.tests.push({ file: 'x.cy.js', line: 9, title: 'sin tags', ca: null, tc: null, key: null });

  const { errors } = checkTraceability([s], issues);

  assert.deepEqual(errors, [
    'x.cy.js:1: TC-02.1 no corresponde a CA-01.',
    'x.cy.js:1: el spec dice CA-01 pero en Xray SCRUM-2 tiene el label CA-02.',
    'x.cy.js:2: SCRUM-2 ya esta usado en x.cy.js:1.',
    'x.cy.js:9: el it() no tiene los 3 tags [CA-XX][TC-XX.Y][KEY] ("sin tags").'
  ]);
});

test('warning: Test sin label de criterio (publicado antes) queda listo para sincronizar', () => {
  const issues = new Map([
    ['SCRUM-1', { issuetype: 'Historia', labels: [], linkedTests: ['SCRUM-2'] }],
    ['SCRUM-2', testIssue([])]
  ]);

  const result = checkTraceability([spec([['CA-01', 'TC-01.1', 'SCRUM-2']])], issues);

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, ['x.cy.js:1: SCRUM-2 no tiene label de criterio en Xray (esperado CA-01).']);
  assert.deepEqual(result.missingLabels, [{ key: 'SCRUM-2', label: 'CA-01' }]);
});

test('warning: Test vinculado a la HU sin automatizar, y describe sin HU', () => {
  const issues = new Map([
    ['SCRUM-1', { issuetype: 'Historia', labels: [], linkedTests: ['SCRUM-2', 'SCRUM-5'] }],
    ['SCRUM-2', testIssue(['CA-01'])]
  ]);

  const conHu = checkTraceability([spec([['CA-01', 'TC-01.1', 'SCRUM-2']])], issues);
  assert.deepEqual(conHu.warnings, ['x.cy.js: SCRUM-5 esta vinculado a SCRUM-1 pero ningun it() de este spec lo automatiza.']);

  const sinHu = checkTraceability([spec([['CA-01', 'TC-01.1', 'SCRUM-2']], null)], issues);
  assert.match(sinHu.warnings[0], /el describe no tiene la key de la HU/);
});

test('error: la HU del describe no existe', () => {
  const { errors } = checkTraceability([spec([], 'SCRUM-404')], new Map());

  assert.deepEqual(errors, ['x.cy.js: la HU SCRUM-404 del describe no existe en Jira.']);
});
