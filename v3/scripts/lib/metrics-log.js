/**
 * Registro de tiempos del lote (D-49): un JSONL local por repo
 * (.qa-metrics/run-and-report.jsonl, ignorado por Git) donde cada paso deja
 * una línea { at, branch, mode, ok, totalMs, ... }. Lo escriben
 * explore-page.js (discovery), create-jira-task.js (publicación),
 * run-and-report.js (corridas) y create-pull-request.js (PR y merge);
 * lib/run-timing.js lo resume por rama (`run-and-report.js --timing-report`).
 *
 * Nace del 2026-10-06: el reporte de tiempos arrancaba en la primera corrida
 * de Cypress, así que el discovery y la publicación no se medían y la
 * duración de un lote se tenía que estimar.
 *
 * El registro nunca corta el paso que lo escribe: si no se puede escribir,
 * se avisa y sigue.
 */
const fs = require('fs');
const path = require('path');
const { parseLog } = require('./run-timing');

const REPO_ROOT = path.resolve(__dirname, '../../..');
const METRICS_LOG = path.join(REPO_ROOT, '.qa-metrics', 'run-and-report.jsonl');

function readLog(file = METRICS_LOG) {
  try {
    return parseLog(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

function appendEntry(entry, file = METRICS_LOG) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, JSON.stringify(entry) + '\n');
  } catch (e) {
    console.warn(`No se pudo registrar el tiempo (${e.message}).`);
  }
}

/** Rama del contenido de .git/HEAD ("ref: refs/heads/<rama>"); con HEAD suelto, 'desconocida'. */
function branchFromHead(text) {
  const match = /^ref:\s*refs\/heads\/(.+)$/m.exec(String(text || ''));
  return match ? match[1].trim() : 'desconocida';
}

/** Rama actual sin lanzar git (las libs no lanzan procesos). */
function currentBranch(gitDir = path.join(REPO_ROOT, '.git')) {
  try {
    return branchFromHead(fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8'));
  } catch {
    return 'desconocida';
  }
}

/**
 * Registra un paso del lote que empezó en `startedMs` (Date.now()).
 * `branch` por defecto es la rama actual; el merge pasa la del PR.
 */
function recordStep(mode, startedMs, { ok = true, branch = currentBranch(), now = Date.now, file = METRICS_LOG, ...extra } = {}) {
  appendEntry({ at: new Date(startedMs).toISOString(), branch, mode, ok, totalMs: now() - startedMs, ...extra }, file);
}

module.exports = { METRICS_LOG, readLog, appendEntry, branchFromHead, currentBranch, recordStep };
