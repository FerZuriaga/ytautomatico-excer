/**
 * Cobertura de lib/data-recipe.js (datos por API para el discovery).
 * Nace del 2026-09-28: cada lote rehacía un script suelto de sesión y el
 * token de 5 minutos de Practice Software Testing vencía entre
 * exploraciones.
 *
 * Correr con: node --test v3/scripts/lib/data-recipe.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { fillTemplate, extractPath, normalizeInvocations, validateRecipes, runData, loadRecipes, RECIPES_DIR } = require('./data-recipe');

const CONFIG = {
  api: 'https://api.test/',
  headers: { Accept: 'application/json' },
  browser: { localStorage: { language: 'en' } },
  recipes: {
    cliente: {
      vars: { email: 'qa.{{unique}}@example.com' },
      steps: [
        { method: 'POST', path: '/login', body: { email: '{{email}}' }, expect: 200, save: { token: 'access_token' } }
      ],
      browser: { localStorage: { 'auth-token': '{{token}}' } }
    },
    compra: {
      requires: ['token'],
      params: { producto: 'Wood Saw', cantidad: 1 },
      steps: [
        { method: 'GET', path: '/products/search', query: { q: '{{producto}}' }, save: { productId: 'data[name={{producto}}].id' } },
        { method: 'POST', path: '/invoices', headers: { Authorization: 'Bearer {{token}}' }, body: { product_id: '{{productId}}', quantity: '{{cantidad}}' }, expect: 201, save: { invoiceId: 'id' } }
      ]
    }
  }
};

// API simulada: registra cada request y responde según la ruta.
function fakeApi(overrides = {}) {
  const calls = [];
  let n = 0;
  const request = async req => {
    calls.push(req);
    const { pathname } = new URL(req.url);
    if (overrides[pathname]) return overrides[pathname](req);
    if (pathname === '/login') return { status: 200, body: { access_token: `tk-${req.body.email}` } };
    if (pathname === '/products/search') {
      return { status: 200, body: { data: [{ id: 'P-sierra-electrica', name: 'Wood Saw Pro' }, { id: 'P-sierra', name: 'Wood Saw' }] } };
    }
    if (pathname === '/invoices') return { status: 201, body: { id: `INV-${++n}` } };
    return { status: 404, body: 'no existe' };
  };
  return { calls, request };
}

const counter = () => { let i = 0; return () => `u${++i}`; };

test('plantillas: texto interpolado, valor entero conserva el tipo y variable faltante es error', () => {
  const vars = { a: 'x', n: 3, obj: { k: 1 }, otro: { id: 'O1' } };
  assert.equal(fillTemplate('pre-{{a}}-{{n}}', vars), 'pre-x-3');
  assert.equal(fillTemplate('{{n}}', vars), 3);
  assert.deepEqual(fillTemplate({ d: '{{obj}}', l: ['{{otro.id}}'] }, vars), { d: { k: 1 }, l: ['O1'] });
  assert.throws(() => fillTemplate('/x/{{nada}}', vars), /Variable sin definir: \{\{nada\}\}/);
});

test('extractPath: ruta con índices y filtro por valor exacto en una lista', () => {
  const body = { data: [{ id: 1, name: 'Wood Saw Pro' }, { id: 2, name: 'Wood Saw' }] };
  assert.equal(extractPath(body, 'data.0.id'), 1);
  assert.equal(extractPath(body, 'data[name=Wood Saw].id'), 2);
  assert.equal(extractPath(body, 'data[name=Martillo].id'), undefined);
  assert.equal(extractPath(null, 'data.0'), undefined);
});

test('normalizeInvocations acepta un nombre, un objeto o una lista mixta', () => {
  assert.deepEqual(normalizeInvocations('cliente'), [{ recipe: 'cliente' }]);
  assert.deepEqual(normalizeInvocations(['cliente', { recipe: 'compra', as: 'otro' }]), [{ recipe: 'cliente' }, { recipe: 'compra', as: 'otro' }]);
  assert.deepEqual(normalizeInvocations(null), []);
});

test('validateRecipes marca api faltante, receta sin pasos y save que no es ruta', () => {
  assert.deepEqual(validateRecipes(CONFIG), []);
  const errors = validateRecipes({ recipes: { a: { steps: [] }, b: { steps: [{ method: 'GET', path: '/x', save: { id: 3 } }] } } });
  assert.equal(errors.length, 3);
  assert.match(errors[0], /Falta "api"/);
  assert.match(errors[1], /"a": sin "steps"/);
  assert.match(errors[2], /"b" paso 1: cada valor de "save"/);
});

test('runData encadena recetas: variables compartidas, headers comunes y sesión del navegador', async () => {
  const api = fakeApi();
  const result = await runData(CONFIG, ['cliente', { recipe: 'compra', params: { cantidad: 2 } }], { request: api.request, unique: counter() });

  assert.equal(result.vars.token, 'tk-qa.u1@example.com');
  assert.equal(result.vars.productId, 'P-sierra', 'toma el producto de nombre exacto, no el primero');
  assert.equal(result.vars.invoiceId, 'INV-1');
  assert.equal(result.vars.unique, undefined, 'unique no se filtra a las variables');
  assert.deepEqual(result.browser, { localStorage: { language: 'en', 'auth-token': 'tk-qa.u1@example.com' }, sessionStorage: {} });

  const [login, search, invoice] = api.calls;
  assert.equal(login.url, 'https://api.test/login');
  assert.equal(search.url, 'https://api.test/products/search?q=Wood+Saw');
  assert.deepEqual(invoice.headers, { Accept: 'application/json', Authorization: 'Bearer tk-qa.u1@example.com' });
  assert.deepEqual(invoice.body, { product_id: 'P-sierra', quantity: 2 }, 'el param pisa el default y conserva el número');
  assert.deepEqual(result.log.map(l => `${l.recipe}#${l.step} ${l.status}`), ['cliente#1 200', 'compra#1 200', 'compra#2 201']);
});

test('con "as" los datos de otro usuario quedan aparte y no tocan la sesión del navegador', async () => {
  const api = fakeApi();
  const result = await runData(CONFIG, ['cliente', { recipe: 'cliente', as: 'otro' }, { recipe: 'compra', as: 'otro' }], { request: api.request, unique: counter() });

  assert.equal(result.vars.token, 'tk-qa.u1@example.com');
  assert.equal(result.vars.otro.token, 'tk-qa.u2@example.com');
  assert.equal(result.vars.otro.invoiceId, 'INV-1');
  assert.equal(result.vars.invoiceId, undefined);
  assert.equal(result.browser.localStorage['auth-token'], 'tk-qa.u1@example.com');
  assert.equal(api.calls[3].headers.Authorization, 'Bearer tk-qa.u2@example.com', 'la compra de "otro" usa su propio token');
});

test('errores claros: receta desconocida, requisito faltante, status inesperado y dato que no llega', async () => {
  const api = fakeApi();
  await assert.rejects(runData(CONFIG, ['clientes'], { request: api.request }), /Receta desconocida "clientes" \(disponibles: cliente, compra\)/);
  await assert.rejects(runData(CONFIG, ['compra'], { request: api.request }), /"compra" necesita token/);

  const rechazo = fakeApi({ '/login': () => ({ status: 422, body: { email: ['ya existe'] } }) });
  await assert.rejects(runData(CONFIG, ['cliente'], { request: rechazo.request }), /"cliente" paso 1 \(POST \/login\): HTTP 422, esperado 200 -- \{"email":\["ya existe"\]\}/);

  const sinToken = fakeApi({ '/login': () => ({ status: 200, body: {} }) });
  await assert.rejects(runData(CONFIG, ['cliente'], { request: sinToken.request }), /no trae "access_token" para guardar token/);

  const sinExpect = { ...CONFIG, recipes: { x: { steps: [{ method: 'GET', path: '/nada' }] } } };
  await assert.rejects(runData(sinExpect, ['x'], { request: api.request }), /HTTP 404, esperado 2xx/);
});

test('las recetas versionadas del repo son válidas', () => {
  const fs = require('fs');
  const apps = fs.readdirSync(RECIPES_DIR).filter(f => f.endsWith('.json')).map(f => path.basename(f, '.json'));
  assert.ok(apps.length > 0);
  for (const app of apps) assert.deepEqual(validateRecipes(loadRecipes(app)), [], app);
  assert.throws(() => loadRecipes('app-inexistente'), /No hay recetas de datos para "app-inexistente".*Disponibles: .*practicesoftwaretesting/);
});
