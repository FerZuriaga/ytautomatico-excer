/**
 * Cobertura de testcase-description -- usado por --update-steps para
 * reemplazar la precondición de un Test Case publicado conservando su
 * objetivo. Los casos usan la descripción REAL que Jira devolvió para
 * SCRUM-368 (creado por Xray) y SCRUM-335 (reescrito el 2026-09-23).
 *
 * Correr con: node --test v3/scripts/lib/testcase-description.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { extractObjective, buildTestCaseDescription } = require('./testcase-description');

const p = (text) => ({ type: 'paragraph', content: [{ type: 'text', text }] });

// Descripción real de SCRUM-368 tal como la devuelve Jira.
const SCRUM_368 = {
  type: 'doc', version: 1,
  content: [p('Verificar la subida de un archivo .txt.'), p('Precondición: Sin sesion iniciada.')]
};

test('extrae el objetivo de una descripcion real (SCRUM-368)', () => {
  assert.equal(extractObjective(SCRUM_368), 'Verificar la subida de un archivo .txt.');
});

test('descripcion sin precondicion devuelve el objetivo completo', () => {
  assert.equal(extractObjective({ type: 'doc', version: 1, content: [p('Solo objetivo.')] }), 'Solo objetivo.');
});

test('objetivo en varios parrafos se conserva completo', () => {
  const description = { type: 'doc', version: 1, content: [p('Linea 1.'), p('Linea 2.'), p('Precondición: X.')] };

  assert.equal(extractObjective(description), 'Linea 1.\n\nLinea 2.');
});

test('texto partido en varios nodos y con hardBreak', () => {
  const description = {
    type: 'doc', version: 1,
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Verificar ' }, { type: 'text', text: 'algo' }, { type: 'hardBreak' }, { type: 'text', text: 'mas.' }] }]
  };

  assert.equal(extractObjective(description), 'Verificar algo\nmas.');
});

test('descripcion vacia o nula devuelve string vacio', () => {
  assert.equal(extractObjective(null), '');
  assert.equal(extractObjective({ type: 'doc', version: 1, content: [] }), '');
});

test('build + extract es reversible (ida y vuelta)', () => {
  const built = buildTestCaseDescription('Verificar X.', 'Sesion iniciada.');

  assert.deepEqual(built, { type: 'doc', version: 1, content: [p('Verificar X.'), p('Precondición: Sesion iniciada.')] });
  assert.equal(extractObjective(built), 'Verificar X.');
});

test('build sin precondicion no agrega el parrafo "Precondición:"', () => {
  assert.deepEqual(buildTestCaseDescription('Verificar X.', '  '), { type: 'doc', version: 1, content: [p('Verificar X.')] });
});
