/**
 * Cobertura de lib/bundle-scan.js (lectura del bundle en explore-page.js).
 * Los fragmentos imitan lo encontrado en los bundles reales de Notes App
 * (React) y Practice Software Testing (Angular) el 2026-09-28.
 *
 * Correr con: node --test v3/scripts/lib/bundle-scan.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { extractTestAttributes, stringLiterals, extractValidationMessages, scanBundles, notSeenInExploration } = require('./bundle-scan');

const REACT = '(0,Ge.jsx)("input",{type:"text","data-testid":"search-input",id:"search-input"}),(0,Ge.jsx)("button",{"data-testid":"search-btn",onClick:function(e){}}),(0,Ge.jsx)("div",{"data-testid":e.testId}),'
  + '(e.title.length<4||e.title.length>100)&&(t=!0,n.title="Title should be between 4 and 100 characters"):(t=!0,n.title="Title is required")';
const ANGULAR = 'i.ɵɵelementStart(0,"input",["data-test","first-name","type","text"]),i.ɵɵtext(1," First Name is required ");const c=\'<button data-test="nav-home">\';var cy={"data-cy":"checkout"}';

test('atributos de test: JSX compilado, arreglos de Angular, HTML en string y data-cy', () => {
  assert.deepEqual(extractTestAttributes(REACT), [
    { attr: 'data-testid', value: 'search-input' },
    { attr: 'data-testid', value: 'search-btn' }
  ]);
  assert.deepEqual(extractTestAttributes(ANGULAR), [
    { attr: 'data-test', value: 'first-name' },
    { attr: 'data-test', value: 'nav-home' },
    { attr: 'data-cy', value: 'checkout' }
  ]);
});

test('un valor calculado no es un literal y data-test dentro de data-testid no se cuenta dos veces', () => {
  const values = extractTestAttributes(REACT).map(a => `${a.attr}=${a.value}`);
  assert.ok(!values.some(v => v.includes('testId')));
  assert.ok(!values.some(v => v.startsWith('data-test=')));
});

test('los valores con plantilla se conservan (card-${id}) y no se repiten', () => {
  const source = '"data-testid":`note-card-${e.id}`,"data-testid":"note-card","data-testid":"note-card"';
  assert.deepEqual(extractTestAttributes(source).map(a => a.value), ['note-card-${e.id}', 'note-card']);
});

test('literales: escapes, comillas simples y una comilla suelta de una regex no rompe el resto', () => {
  assert.deepEqual(stringLiterals('a="uno",b=\'dos\',c="tres \\"cuatro\\""'), ['uno', 'dos', 'tres "cuatro"']);
  const withRegex = 'x=/"/g\ny="Email address is required"';
  assert.ok(stringLiterals(withRegex).includes('Email address is required'));
});

test('mensajes de validación: se quedan las reglas de la app, sin código, clases ni ruido de librerías', () => {
  const source = REACT + ANGULAR
    + ';a="card-footer d-flex justify-content-between";b="useNotes must be used within NotesProvider";'
    + 'c="Invalid attempt to spread non-iterable instance";h="xhr poll error";i="websocket error";d="function(){return 1}";e="search-input";f="Hello world";'
    + 'g="Your session has expired. Please login again to continue."';
  assert.deepEqual(extractValidationMessages(source), [
    'Title should be between 4 and 100 characters',
    'Title is required',
    'First Name is required',
    'Your session has expired. Please login again to continue.'
  ]);
});

test('scanBundles junta varios archivos sin repetir y guarda dónde apareció cada hallazgo', () => {
  const result = scanBundles({ 'main.js': REACT, 'chunk.js': REACT + ANGULAR });
  assert.equal(result.testAttributes.find(a => a.value === 'search-btn').file, 'main.js');
  assert.equal(result.testAttributes.find(a => a.value === 'first-name').file, 'chunk.js');
  assert.equal(result.messages.filter(m => m.text === 'Title is required').length, 1);
});

test('notSeenInExploration: lo del código que ninguna exploración mostró (sin los de plantilla)', () => {
  const attrs = [
    { attr: 'data-testid', value: 'search-btn' },
    { attr: 'data-testid', value: 'delete-account' },
    { attr: 'data-testid', value: 'note-card-${e.id}' }
  ];
  const inventories = [[{ attr: 'data-testid', value: 'search-btn', visible: true }], []];
  assert.deepEqual(notSeenInExploration(attrs, inventories).map(a => a.value), ['delete-account']);
});

// El bundle minificado es una sola línea enorme: `grep -oE` se colgaba
// sobre el de Notes App (2026-09-28). El escaneo tiene que ser lineal.
test('un bundle de una sola línea de ~6 MB se escanea en menos de 3 segundos', () => {
  const chunk = REACT + ANGULAR + ';var q="x".replace(/["\']/g,"");';
  const big = chunk.repeat(Math.ceil(6e6 / chunk.length));
  const started = Date.now();
  const result = scanBundles({ 'big.js': big });
  assert.ok(Date.now() - started < 3000, `tardó ${Date.now() - started} ms`);
  assert.ok(result.testAttributes.length >= 5);
});
