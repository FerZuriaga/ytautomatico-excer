/**
 * Cobertura de lib/http-retry.js. Nace del bug real del 2026-09-26: el
 * reporte a Xray del lote de Checkout (SCRUM-503/509/515) se cortó con
 * "socket hang up" y no había reintento.
 *
 * Correr con: node --test v3/scripts/lib/http-retry.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { isTransientError, isTransientStatus, withRetry } = require('./http-retry');

const noWait = { wait: async () => {} };

function hangUp() {
  const err = new Error('socket hang up');
  err.code = 'ECONNRESET';
  return err;
}

test('regresion Checkout 2026-09-26: "socket hang up" se reintenta y la respuesta llega', async () => {
  let calls = 0;
  const res = await withRetry(async () => {
    calls++;
    if (calls < 3) throw hangUp();
    return { status: 200, body: { ok: true } };
  }, noWait);

  assert.equal(calls, 3);
  assert.deepEqual(res, { status: 200, body: { ok: true } });
});

test('respuestas 429 y 5xx se reintentan; la ultima se devuelve si no se recupera', async () => {
  let calls = 0;
  const res = await withRetry(async () => {
    calls++;
    return { status: 503, body: 'down' };
  }, { ...noWait, delays: [1, 1] });

  assert.equal(calls, 3);
  assert.equal(res.status, 503);
});

test('un error no transitorio o un 4xx no se reintentan', async () => {
  let calls = 0;
  await assert.rejects(withRetry(async () => { calls++; throw new Error('JSON invalido'); }, noWait), /JSON invalido/);
  assert.equal(calls, 1);

  calls = 0;
  const res = await withRetry(async () => { calls++; return { status: 400, body: {} }; }, noWait);
  assert.equal(calls, 1);
  assert.equal(res.status, 400);
});

test('agotados los reintentos se lanza el ultimo error transitorio', async () => {
  let calls = 0;
  await assert.rejects(withRetry(async () => { calls++; throw hangUp(); }, { ...noWait, delays: [1] }), /socket hang up/);
  assert.equal(calls, 2);
});

test('clasificacion de errores y estados', () => {
  assert.equal(isTransientError(hangUp()), true);
  assert.equal(isTransientError(Object.assign(new Error('x'), { code: 'ETIMEDOUT' })), true);
  assert.equal(isTransientError(new Error('Unauthorized')), false);
  assert.equal(isTransientStatus(429), true);
  assert.equal(isTransientStatus(502), true);
  assert.equal(isTransientStatus(404), false);
});

test('solo las operaciones idempotentes de Jira y Xray usan el reintento', () => {
  const { isIdempotent } = require('./jira');
  const { isIdempotentQuery } = require('./xray');

  assert.equal(isIdempotent('GET', '/rest/api/3/issue/SCRUM-1'), true);
  assert.equal(isIdempotent('PUT', '/rest/api/3/issue/SCRUM-1'), true);
  assert.equal(isIdempotent('POST', '/rest/api/3/search/jql'), true);
  assert.equal(isIdempotent('POST', '/rest/api/3/issue'), false);
  assert.equal(isIdempotent('POST', '/rest/api/3/issue/SCRUM-1/comment'), false);

  assert.equal(isIdempotentQuery('\n  query($id: String) { getTestRun(id: $id) { id } }'), true);
  assert.equal(isIdempotentQuery('{ getStatuses { name } }'), true);
  assert.equal(isIdempotentQuery('mutation($t: String) { createTest(t: $t) { id } }'), false);
});
