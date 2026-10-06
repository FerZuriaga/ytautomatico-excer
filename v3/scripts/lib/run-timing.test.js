/**
 * Cobertura de lib/run-timing.js (tiempos por fase de run-and-report.js).
 * Nace del 2026-09-27: el lote de Checkout (60 min) se midio
 * reconstruyendo la sesion a mano.
 *
 * Correr con: node --test v3/scripts/lib/run-timing.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { createTimer, formatDuration, formatPhases, specsKey, iterationNumber, summarizeLog, formatSummary, parseLog } = require('./run-timing');

test('el timer mide cada fase con el reloj inyectado, aunque la fase falle', async () => {
  let clock = 0;
  const timer = createTimer(() => clock);

  await timer.measure('trazabilidad', async () => { clock += 3000; });
  await assert.rejects(timer.measure('cypress', async () => { clock += 210000; throw new Error('falla'); }));
  clock += 1000;

  assert.deepEqual(timer.phases, [{ name: 'trazabilidad', ms: 3000 }, { name: 'cypress', ms: 210000 }]);
  assert.equal(timer.totalMs(), 214000);
  assert.equal(formatPhases(timer.phases, timer.totalMs()), 'Tiempos: trazabilidad 3s | Cypress 3m 30s | total 3m 34s');
});

test('formato de duraciones', () => {
  assert.equal(formatDuration(12400), '12s');
  assert.equal(formatDuration(65000), '1m 05s');
  assert.equal(formatDuration(3780000), '1h 03m');
});

// Lote de Checkout (2026-09-26) reconstruido: 3 iteraciones (2 fallidas) y la regresion.
const CHECKOUT = [
  { at: '2026-09-26T20:17:30Z', branch: 'lote5', mode: 'lote', specsKey: 'a,b,c', ok: false, totalMs: 213000, phases: [{ name: 'trazabilidad', ms: 3000 }, { name: 'cypress', ms: 210000 }] },
  { at: '2026-09-26T20:21:28Z', branch: 'lote5', mode: 'lote', specsKey: 'a,b,c', ok: false, totalMs: 225000, phases: [{ name: 'trazabilidad', ms: 3000 }, { name: 'cypress', ms: 222000 }] },
  { at: '2026-09-26T20:26:24Z', branch: 'lote5', mode: 'lote', specsKey: 'a,b,c', ok: true, totalMs: 251000, phases: [{ name: 'trazabilidad', ms: 3000 }, { name: 'cypress', ms: 228000 }, { name: 'reporte', ms: 20000 }] },
  { at: '2026-09-26T20:37:49Z', branch: 'lote5', mode: 'regresion', specsKey: 'x', ok: true, totalMs: 617000, phases: [{ name: 'cypress', ms: 617000 }] },
  { at: '2026-09-27T01:00:00Z', branch: 'otra', mode: 'lote', specsKey: 'z', ok: true, totalMs: 60000, phases: [] }
];

test('iteracion: cuenta solo corridas del lote con los mismos specs en la misma rama', () => {
  assert.equal(specsKey(['b', 'a', 'c', 'a']), 'a,b,c');
  assert.equal(iterationNumber(CHECKOUT, 'lote5', 'a,b,c'), 4);
  assert.equal(iterationNumber(CHECKOUT, 'lote5', 'x'), 1);
  assert.equal(iterationNumber(CHECKOUT, 'nueva', 'a,b,c'), 1);
});

test('resumen por rama: corridas, fallidas, tiempo por fase y reloj', () => {
  const [lote5] = summarizeLog(CHECKOUT, 'lote5');

  assert.equal(lote5.runs, 4);
  assert.equal(lote5.loteRuns, 3);
  assert.equal(lote5.loteFailed, 2);
  assert.equal(lote5.regressionRuns, 1);
  assert.equal(lote5.phaseMs.cypress, 1277000);
  assert.equal(lote5.wallMs, (20 * 60 + 19) * 1000 + 617000);
  assert.match(formatSummary(lote5), /corridas: 4 \(lote: 3, fallidas: 2; regresion: 1\)/);
  assert.equal(summarizeLog(CHECKOUT).length, 2);
});

// D-48 (2026-10-06): una corrida cortada por un 429 de la app no es una
// iteración del lote (en ParaBank figuraba "Iteracion 2" sin haber tocado
// el código).
test('las corridas cortadas por el entorno no cuentan como iteracion y se resumen aparte', () => {
  const entries = [
    { branch: 'b', mode: 'lote', specsKey: 's', ok: false, at: '2026-10-06T12:00:00Z', totalMs: 1000 },
    { branch: 'b', mode: 'entorno', specsKey: 's', ok: false, at: '2026-10-06T12:01:00Z', totalMs: 1000 },
    { branch: 'b', mode: 'entorno', specsKey: 's', ok: false, at: '2026-10-06T12:02:00Z', totalMs: 1000 }
  ];
  assert.equal(iterationNumber(entries, 'b', 's'), 2);
  const [summary] = summarizeLog(entries, 'b');
  assert.equal(summary.loteRuns, 1);
  assert.equal(summary.environmentRuns, 2);
  assert.match(formatSummary(summary), /cortadas por el entorno \(429\): 2/);
  assert.doesNotMatch(formatSummary({ ...summary, environmentRuns: 0 }), /entorno/);
});

test('el registro JSONL ignora lineas vacias o rotas', () => {
  assert.deepEqual(parseLog('{"a":1}\n\nno-json\n{"b":2}\n'), [{ a: 1 }, { b: 2 }]);
});
