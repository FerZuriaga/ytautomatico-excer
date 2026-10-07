/**
 * Cobertura de lib/negative-evidence.js. Nace del lote de Checkout
 * (2026-09-26): negativos escritos sin probar en el discovery hicieron
 * aparecer los Bugs SCRUM-527/528 recien en la corrida.
 *
 * Correr con: node --test v3/scripts/lib/negative-evidence.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateNegativeEvidence } = require('./negative-evidence');

const NOW = new Date('2026-09-27T12:00:00Z');

// Informe real (resumido) de explore-page sobre el limite de Thor Hammer.
const THOR_REPORT = {
  generator: 'explore-page',
  generatedAt: '2026-09-27T05:36:23.152Z',
  failedStep: null,
  headings: [],
  snapshots: [
    { step: 0, action: 'carga', text: 'Thor Hammer 1 $11.14 Total $11.14 Proceed to checkout' },
    { step: 2, action: 'type [data-test="product-quantity"]', text: 'You can only have one Thor Hammer in the cart. Thor Hammer 2 $22.28 Total $11.14' }
  ]
};

const reports = { 'thor.json': THOR_REPORT };
const readReport = p => {
  if (!reports[p]) throw new Error('ENOENT');
  return reports[p];
};

const payloadWith = (models) => ({ summary: 'Carrito', testcaseModels: models });
const negativo = (evidencia) => ({ name: 'Rechazar un segundo Thor Hammer', tipo: 'negativo', evidencia });

test('regresion Checkout 2026-09-26: un negativo sin evidencia del discovery no se publica', () => {
  const { errors } = validateNegativeEvidence(payloadWith([negativo(undefined)]), { readReport, now: NOW });

  assert.equal(errors.length, 1);
  assert.match(errors[0], /caso negativo sin evidencia del discovery/);
});

test('un negativo con el informe de explore-page y el texto observado pasa sin avisos', () => {
  const result = validateNegativeEvidence(payloadWith([
    negativo({ reporte: 'thor.json', observado: 'Se muestra el aviso "You can only have one Thor Hammer in the cart." y el total sigue en $11.14' })
  ]), { readReport, now: NOW });

  assert.deepEqual(result, { errors: [], warnings: [] });
});

test('los positivos no necesitan evidencia', () => {
  const result = validateNegativeEvidence(payloadWith([{ name: 'Cambiar cantidad', tipo: 'positivo' }]), { readReport, now: NOW });

  assert.deepEqual(result, { errors: [], warnings: [] });
});

test('informe ilegible, que no es de explore-page o con la exploracion cortada: error', () => {
  reports['viejo.json'] = { url: 'x', requests: [] };
  reports['cortado.json'] = { ...THOR_REPORT, failedStep: 'Timed out retrying after 15000ms' };

  const { errors } = validateNegativeEvidence(payloadWith([
    negativo({ reporte: 'no-existe.json', observado: 'algo' }),
    negativo({ reporte: 'viejo.json', observado: 'algo' }),
    negativo({ reporte: 'cortado.json', observado: 'algo' })
  ]), { readReport, now: NOW });

  assert.equal(errors.length, 3);
  assert.match(errors[0], /no se pudo leer el informe/);
  assert.match(errors[1], /no es un informe de explore-page/);
  assert.match(errors[2], /se corto antes de terminar/);
});

test('texto entre comillas que no aparecio en la exploracion o informe viejo: warning', () => {
  reports['antiguo.json'] = { ...THOR_REPORT, generatedAt: '2026-08-01T00:00:00Z' };

  const { errors, warnings } = validateNegativeEvidence(payloadWith([
    negativo({ reporte: 'thor.json', observado: 'Se muestra "Quantity must be at least 1"' }),
    negativo({ reporte: 'antiguo.json', observado: 'Se rechaza el cambio' })
  ]), { readReport, now: NOW });

  assert.deepEqual(errors, []);
  assert.equal(warnings.length, 2);
  assert.match(warnings[0], /"Quantity must be at least 1" no aparece/);
  assert.match(warnings[1], /hace mas de 14 dias/);
});

test('modo lote: revisa los negativos de todas las HU', () => {
  const { errors } = validateNegativeEvidence({ issues: [
    { summary: 'HU 1', testcaseModels: [negativo(undefined)] },
    { summary: 'HU 2', testcaseModels: [negativo({ reporte: 'thor.json', observado: 'aviso' })] }
  ] }, { readReport, now: NOW });

  assert.equal(errors.length, 1);
  assert.match(errors[0], /^HU 1 \//);
});

test('evidencia cortada esperando un elemento: el error sugiere explorar con anyOf (RBP 2026-10-07)', () => {
  reports['espera.json'] = { ...THOR_REPORT, failedStep: 'Timed out retrying after 15000ms: Expected to find element: `.alert`, but never found it.' };
  const { errors } = validateNegativeEvidence(payloadWith([negativo({ reporte: 'espera.json', observado: 'algo' })]), { readReport, now: NOW });
  assert.match(errors[0], /se corto antes de terminar.*Pista: .*anyOf/);
});
