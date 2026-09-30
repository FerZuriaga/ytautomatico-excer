/**
 * Cobertura de lib/explore-scenarios.js (varias exploraciones en una sola
 * corrida de Cypress). Nace del 2026-09-28: ~20 arranques de Cypress por
 * lote en el discovery.
 *
 * Correr con: node --test v3/scripts/lib/explore-scenarios.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { checkActions, parseScenarios, resolveScenario, summarizeProblems } = require('./explore-scenarios');

const FILE = {
  app: 'practicesoftwaretesting',
  baseUrl: 'https://practicesoftwaretesting.com',
  storage: { language: 'en' },
  waitFor: '[data-test="nav-menu"]',
  scenarios: [
    { name: 'lista', url: '/account/invoices', data: ['cliente', 'compra'] },
    { name: 'ajena', url: '/account/invoices/{{otro.invoiceId}}', storage: { language: 'es' }, waitFor: null,
      actions: [{ action: 'click', selector: '[data-test="{{boton}}"]' }] }
  ]
};

test('parseScenarios aplica los valores comunes y deja que cada escenario los pise', () => {
  const plan = parseScenarios(FILE);
  assert.equal(plan.app, 'practicesoftwaretesting');
  assert.deepEqual(plan.scenarios[0], {
    name: 'lista', url: '/account/invoices', data: ['cliente', 'compra'],
    storage: { language: 'en' }, sessionStorage: {}, actions: [], waitFor: '[data-test="nav-menu"]'
  });
  assert.deepEqual(plan.scenarios[1].storage, { language: 'es' });
  assert.equal(plan.scenarios[1].waitFor, null, 'null explícito desactiva el waitFor común');
});

test('parseScenarios junta todos los errores: nombre inválido o repetido, url, app y acciones', () => {
  assert.throws(() => parseScenarios({ scenarios: [] }), /al menos uno/);
  let message = '';
  try {
    parseScenarios({
      scenarios: [
        { name: 'ok', url: '/relativa', data: 'cliente' },
        { name: 'OK', url: 'https://x.test' },
        { name: 'con espacio', url: 'https://x.test', actions: [{ action: 'hover' }] },
        { url: 'https://x.test' }
      ]
    });
  } catch (e) { message = e.message; }
  assert.match(message, /falta "app"/);
  assert.match(message, /Escenario 1 "ok": "url" relativa sin "baseUrl"/);
  assert.match(message, /Escenario 2 "OK": nombre repetido/);
  assert.match(message, /Escenario 3 "con espacio": "name" obligatorio/);
  assert.match(message, /Escenario 3 "con espacio": acciones desconocidas hover/);
  assert.match(message, /Escenario 4: "name" obligatorio/);
});

test('checkActions rechaza acciones desconocidas (antes se ignoraban en silencio)', () => {
  assert.deepEqual(checkActions([{ action: 'clear', selector: '#a' }], '--actions'), [{ action: 'clear', selector: '#a' }]);
  assert.throws(() => checkActions([{ action: 'scroll' }], '--actions'), /--actions: acciones desconocidas scroll/);
  assert.throws(() => checkActions({}, '--actions'), /tiene que ser una lista/);
  const attach = { action: 'attach', selector: '#file', fileName: 'vacio.txt', content: '' };
  assert.deepEqual(checkActions([attach], '--actions'), [attach], 'content "" (archivo vacío) es válido');
  assert.throws(() => checkActions([{ action: 'attach', selector: '#file', fileName: 'a.txt' }], '--actions'), /"attach" necesita selector, fileName y content/);
});

test('resolveScenario completa la URL, las plantillas y pone la sesión de las recetas debajo de la propia', () => {
  const [, ajena] = parseScenarios(FILE).scenarios;
  const prepared = {
    vars: { boton: 'details', otro: { invoiceId: 'INV-9' } },
    browser: { localStorage: { language: 'en', 'auth-token': 'tk' }, sessionStorage: { cart_id: 'C1' } }
  };
  assert.deepEqual(resolveScenario(ajena, FILE.baseUrl, prepared), {
    name: 'ajena',
    url: 'https://practicesoftwaretesting.com/account/invoices/INV-9',
    storage: { language: 'es', 'auth-token': 'tk' },
    sessionStorage: { cart_id: 'C1' },
    actions: [{ action: 'click', selector: '[data-test="details"]' }],
    waitFor: null
  });
  assert.throws(() => resolveScenario(ajena, FILE.baseUrl), /Variable sin definir: \{\{otro.invoiceId\}\}/);
});

test('summarizeProblems: agrupa las excepciones y errores de consola de toda la corrida (regresion hidratacion RBP)', () => {
  const hydration = 'The following error originated from your application code, not from Cypress.\n\n  > Minified React error #418; visit https://react.dev/errors/418\n\nWhen Cypress detects uncaught errors...';
  const crash = 'The following error originated from your application code, not from Cypress.\n\n  > Cannot read properties of undefined (reading \'length\')\n\nWhen Cypress...';
  const problems = summarizeProblems([
    { scenario: 'home', uncaughtExceptions: [hydration], consoleErrors: [] },
    { scenario: 'res-ok', uncaughtExceptions: [hydration, hydration], consoleErrors: [] },
    { scenario: 'res-ocupada', uncaughtExceptions: [hydration, crash], consoleErrors: ['Error booking room'] }
  ]);
  assert.equal(problems.length, 3);
  assert.deepEqual(problems[0], { kind: 'excepción no capturada', message: 'Minified React error #418; visit https://react.dev/errors/418', scenarios: ['home', 'res-ok', 'res-ocupada'] });
  assert.ok(problems.some(p => p.message === "Cannot read properties of undefined (reading 'length')" && p.scenarios.join() === 'res-ocupada'));
  assert.ok(problems.some(p => p.kind === 'error de consola' && p.message === 'Error booking room'));
  assert.deepEqual(summarizeProblems([{ scenario: 'limpio', uncaughtExceptions: [], consoleErrors: [] }]), []);
});
