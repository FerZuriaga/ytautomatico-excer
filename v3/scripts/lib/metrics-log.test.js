/**
 * lib/metrics-log.js (D-49): cada paso del lote deja su línea en el
 * registro de tiempos, bajo la rama del lote.
 *
 * Correr con: node --test v3/scripts/lib/metrics-log.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { readLog, branchFromHead, currentBranch, recordStep } = require('./metrics-log');

const tempFile = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'metrics-')), 'log.jsonl');

test('la rama sale de .git/HEAD; con HEAD suelto o sin repo es "desconocida"', () => {
  assert.equal(branchFromHead('ref: refs/heads/feature/parabank-recuperar-datos\n'), 'feature/parabank-recuperar-datos');
  assert.equal(branchFromHead('3f2a9c1d0e\n'), 'desconocida');
  assert.equal(currentBranch(path.join(os.tmpdir(), 'no-es-un-repo')), 'desconocida');
});

test('recordStep deja el paso con su duración, la rama y los datos extra', () => {
  const file = tempFile();
  recordStep('discovery', Date.parse('2026-10-06T13:00:00Z'), { branch: 'feature/x', now: () => Date.parse('2026-10-06T13:00:40Z'), file, scenarios: 6 });
  recordStep('merge', Date.parse('2026-10-06T14:00:00Z'), { branch: 'feature/x', now: () => Date.parse('2026-10-06T14:00:02Z'), file, pr: 177 });
  assert.deepEqual(readLog(file), [
    { at: '2026-10-06T13:00:00.000Z', branch: 'feature/x', mode: 'discovery', ok: true, totalMs: 40000, scenarios: 6 },
    { at: '2026-10-06T14:00:00.000Z', branch: 'feature/x', mode: 'merge', ok: true, totalMs: 2000, pr: 177 }
  ]);
});

test('sin archivo, el registro está vacío (no corta el paso que lo lee)', () => {
  assert.deepEqual(readLog(path.join(os.tmpdir(), 'no-existe', 'log.jsonl')), []);
});
