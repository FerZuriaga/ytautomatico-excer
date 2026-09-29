/**
 * Cobertura de lib/concurrency.js (reporte a Xray en paralelo).
 *
 * Correr con: node --test v3/scripts/lib/concurrency.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { mapWithLimit } = require('./concurrency');

const tick = ms => new Promise(resolve => setTimeout(resolve, ms));

test('respeta el límite de llamadas en curso y devuelve en el orden de entrada', async () => {
  let running = 0;
  let peak = 0;
  const results = await mapWithLimit([30, 5, 20, 1, 10, 2], 3, async (ms, i) => {
    running++;
    peak = Math.max(peak, running);
    await tick(ms);
    running--;
    return i * 10;
  });
  assert.equal(peak, 3);
  assert.deepEqual(results.map(r => r.value), [0, 10, 20, 30, 40, 50]);
});

test('una falla no corta al resto y queda en su posición', async () => {
  const seen = [];
  const results = await mapWithLimit(['a', 'b', 'c'], 2, async item => {
    seen.push(item);
    if (item === 'b') throw new Error('socket hang up');
    return item.toUpperCase();
  });
  assert.deepEqual(seen.sort(), ['a', 'b', 'c']);
  assert.deepEqual(results.map(r => r.ok), [true, false, true]);
  assert.equal(results[1].error.message, 'socket hang up');
});

test('lista vacía no llama nada', async () => {
  assert.deepEqual(await mapWithLimit([], 4, async () => { throw new Error('no'); }), []);
});
