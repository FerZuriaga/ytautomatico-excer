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

// D-49 (2026-10-06): el reporte arrancaba en la primera corrida de Cypress;
// el discovery y la publicación no se medían y la duración del lote se
// estimaba.
test('el resumen mide el lote completo: discovery, publicacion, corridas y merge', () => {
  const at = minutes => new Date(Date.parse('2026-10-06T13:00:00Z') + minutes * 60000).toISOString();
  const entries = [
    { branch: 'f', mode: 'discovery', ok: true, at: at(0), totalMs: 57000 },
    { branch: 'f', mode: 'discovery', ok: true, at: at(10), totalMs: 37000 },
    { branch: 'f', mode: 'publicacion', ok: true, at: at(25), totalMs: 40000 },
    { branch: 'f', mode: 'lote', specsKey: 's', ok: true, at: at(40), totalMs: 44000, phases: [{ name: 'cypress', ms: 35000 }] },
    { branch: 'f', mode: 'pr', ok: true, at: at(50), totalMs: 2000 },
    { branch: 'f', mode: 'merge', ok: true, at: at(70), totalMs: 3000 }
  ];
  const [summary] = summarizeLog(entries, 'f');
  assert.equal(summary.runs, 1);
  assert.equal(summary.discoveryRuns, 2);
  assert.equal(summary.discoveryMs, 94000);
  assert.equal(summary.publishRuns, 1);
  assert.equal(summary.runMs, 44000);
  assert.equal(summary.merged, true);
  assert.equal(summary.wallMs, 70 * 60000 + 3000);
  const text = formatSummary(summary);
  assert.match(text, /lote completo: 1h 10m \(del primer registro al merge\)/);
  assert.match(text, /discovery: 2 exploracion\(es\), 1m 34s/);
  assert.match(text, /publicacion en el gestor: 1, 40s/);
  assert.doesNotMatch(text, /reloj desde/);
  // Sin merge todavía: reloj desde el primer registro.
  assert.match(formatSummary(summarizeLog(entries.slice(0, 4), 'f')[0]), /reloj desde el primer registro: 40m 44s/);
});

// 2026-10-08: el lote de borrar consultas de RBP dio "lote completo: 5h 26m"
// con ~12 min de trabajo; el resto era la espera del OK de merge.
test('el resumen separa el trabajo de la espera del OK de merge y de los huecos largos', () => {
  const entries = [
    { branch: 'r', mode: 'discovery', ok: true, at: '2026-10-08T16:39:18.583Z', totalMs: 53154 },
    { branch: 'r', mode: 'discovery', ok: true, at: '2026-10-08T16:40:58.474Z', totalMs: 31645 },
    { branch: 'r', mode: 'publicacion', ok: true, at: '2026-10-08T16:45:13.799Z', totalMs: 65763 },
    { branch: 'r', mode: 'lote', specsKey: 's', ok: true, at: '2026-10-08T16:48:38.306Z', totalMs: 67666 },
    { branch: 'r', mode: 'pr', ok: true, at: '2026-10-08T16:50:44.413Z', totalMs: 2038 },
    { branch: 'r', mode: 'publicacion', ok: true, at: '2026-10-08T16:50:47.340Z', totalMs: 2157 },
    { branch: 'r', mode: 'merge', ok: true, at: '2026-10-08T22:05:15.904Z', totalMs: 5215 }
  ];
  const [summary] = summarizeLog(entries, 'r');
  // Del fin de la última publicación (16:50:49.497) al merge.
  assert.equal(summary.mergeWaitMs, Date.parse('2026-10-08T22:05:15.904Z') - Date.parse('2026-10-08T16:50:49.497Z'));
  assert.equal(summary.idleMs, 0);
  assert.equal(summary.workMs, summary.wallMs - summary.mergeWaitMs);
  const text = formatSummary(summary);
  assert.match(text, /lote completo: 5h 26m/);
  assert.match(text, /trabajo: 11m 36s \| espera del OK de merge 5h 14m/);
  assert.doesNotMatch(text, /sin actividad/);

  // Un hueco de más de 30 min antes del merge (la pausa que pasó la noche)
  // sale entero del trabajo, con los minutos de trabajo que haya adentro
  // (ningún registro dice dónde terminan); uno de 20 min no.
  const shift = (e, ms) => ({ ...e, at: new Date(Date.parse(e.at) + ms).toISOString() });
  const overnight = entries.map((e, i) => (i >= 2 ? shift(e, 12 * 3600000) : e));
  const [night] = summarizeLog(overnight, 'r');
  assert.equal(night.idleGaps, 1);
  assert.equal(night.idleMs, Date.parse(overnight[2].at) - Date.parse('2026-10-08T16:41:30.119Z'));
  assert.equal(night.workMs, night.wallMs - night.mergeWaitMs - night.idleMs);
  assert.match(formatSummary(night), /sin actividad 12h \d\dm \(1 hueco\(s\) de mas de 30 min/);
  const short = entries.map((e, i) => (i >= 2 ? shift(e, 20 * 60000) : e));
  assert.equal(summarizeLog(short, 'r')[0].idleGaps, 0);
});

test('el registro JSONL ignora lineas vacias o rotas', () => {
  assert.deepEqual(parseLog('{"a":1}\n\nno-json\n{"b":2}\n'), [{ a: 1 }, { b: 2 }]);
});
