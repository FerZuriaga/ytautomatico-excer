/**
 * Medición de tiempos de run-and-report.js: duración de cada fase de una
 * corrida y registro histórico por rama, para comparar lotes con datos.
 *
 * Nace del 2026-09-27: el lote de Checkout se midió reconstruyendo la
 * sesión a mano (60 min: 13 de corridas, 10,5 de regresión, 7 de reporte
 * cortado). Con esto cada corrida deja su registro y
 * `run-and-report.js --timing-report` resume el lote.
 *
 * El registro es un JSONL local (.qa-metrics/run-and-report.jsonl,
 * ignorado por Git): una línea por corrida. Funciones puras salvo el
 * reloj, que se inyecta.
 */

const PHASE_LABELS = {
  trazabilidad: 'trazabilidad',
  cypress: 'Cypress',
  reporte: 'reporte a Xray',
  verificacion: 'verificacion por lectura',
  espera: 'espera por limite de pedidos (429)'
};

function createTimer(now = Date.now) {
  const startedAt = now();
  const phases = [];
  return {
    phases,
    async measure(name, fn) {
      const t = now();
      try {
        return await fn();
      } finally {
        phases.push({ name, ms: now() - t });
      }
    },
    totalMs: () => now() - startedAt
  };
}

function formatDuration(ms) {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes < 60) return `${minutes}m ${String(rest).padStart(2, '0')}s`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

function formatPhases(phases, totalMs) {
  const parts = phases.map(p => `${PHASE_LABELS[p.name] || p.name} ${formatDuration(p.ms)}`);
  return `Tiempos: ${parts.join(' | ')} | total ${formatDuration(totalMs)}`;
}

// Mismo conjunto de specs sin importar el orden.
function specsKey(specs) {
  return [...new Set(specs.map(s => String(s).replace(/\\/g, '/')))].sort().join(',');
}

/**
 * Número de iteración de esta corrida: cuántas corridas previas hubo en la
 * misma rama con el mismo conjunto de specs (las regresiones --affected,
 * los --from-results y las corridas que cortó el entorno con un 429, modo
 * 'entorno', no cuentan como iteración del lote).
 */
function iterationNumber(entries, branch, key) {
  return entries.filter(e => e.branch === branch && e.mode === 'lote' && e.specsKey === key).length + 1;
}

// Corridas de Cypress (run-and-report.js). El resto de los registros son
// los otros pasos del lote (D-49): 'discovery' (explore-page.js),
// 'publicacion' (create-jira-task.js), 'pr' y 'merge' (create-pull-request.js).
const RUN_MODES = new Set(['lote', 'regresion', 'entorno', 'from-results']);
const sumMs = entries => entries.reduce((sum, e) => sum + (e.totalMs || 0), 0);

// Un hueco sin ningún registro más largo que esto no es trabajo: es una
// pausa (la del lote esperando el OK, o el día que se cortó).
const IDLE_GAP_MS = 30 * 60000;

/**
 * Espera dentro del reloj del lote. Nace del 2026-10-08: el lote de borrar
 * consultas de RBP dio "lote completo: 5h 26m" con ~12 min de trabajo; el
 * resto era el OK del merge. Ningún script ve la respuesta del usuario, así
 * que se mide por huecos entre registros (del fin de uno al inicio del
 * siguiente): el hueco antes del merge es la espera del OK de merge y
 * cualquier otro de más de IDLE_GAP_MS es tiempo sin actividad. Es una
 * aproximación: un hueco cuenta entero, con los minutos de trabajo que haya
 * adentro (ej. armar los pasos después de la pausa).
 */
function waitBreakdown(entries) {
  const timed = entries
    .map(e => ({ e, start: new Date(e.at).getTime() }))
    .filter(t => !Number.isNaN(t.start))
    .sort((a, b) => a.start - b.start);
  let mergeWaitMs = 0;
  let idleMs = 0;
  let idleGaps = 0;
  let lastEnd = null;
  for (const { e, start } of timed) {
    if (lastEnd !== null && start > lastEnd) {
      const gap = start - lastEnd;
      if (e.mode === 'merge' && !mergeWaitMs) mergeWaitMs = gap;
      else if (gap > IDLE_GAP_MS) { idleMs += gap; idleGaps++; }
    }
    const end = start + (e.totalMs || 0);
    lastEnd = lastEnd === null ? end : Math.max(lastEnd, end);
  }
  return { mergeWaitMs, idleMs, idleGaps };
}

/**
 * Resumen por rama: discovery y publicación (cantidad y tiempo), corridas,
 * iteraciones del lote (y cuántas fallaron), tiempo en cada fase y tiempo
 * de reloj entre el primer y el último registro (incluye lo que pasa entre
 * pasos: diagnóstico, código, revisión). Con un merge registrado, ese reloj
 * es el lote completo: de la primera exploración al merge. De ese reloj se
 * separa la espera (waitBreakdown) para dar el trabajo real.
 */
function summarizeLog(entries, branch = null) {
  const byBranch = new Map();
  for (const e of entries) {
    if (branch && e.branch !== branch) continue;
    if (!byBranch.has(e.branch)) byBranch.set(e.branch, []);
    byBranch.get(e.branch).push(e);
  }
  return [...byBranch].map(([name, all]) => {
    const runs = all.filter(r => RUN_MODES.has(r.mode));
    const discovery = all.filter(r => r.mode === 'discovery');
    const publish = all.filter(r => r.mode === 'publicacion');
    const phaseMs = {};
    runs.forEach(r => (r.phases || []).forEach(p => { phaseMs[p.name] = (phaseMs[p.name] || 0) + p.ms; }));
    const lote = runs.filter(r => r.mode === 'lote');
    const times = all.map(r => new Date(r.at).getTime()).filter(t => !Number.isNaN(t));
    const last = all[all.length - 1];
    const wallMs = times.length > 1 ? Math.max(...times) + (last.totalMs || 0) - Math.min(...times) : (last.totalMs || 0);
    const { mergeWaitMs, idleMs, idleGaps } = waitBreakdown(all);
    return {
      branch: name,
      runs: runs.length,
      loteRuns: lote.length,
      loteFailed: lote.filter(r => !r.ok).length,
      regressionRuns: runs.filter(r => r.mode === 'regresion').length,
      environmentRuns: runs.filter(r => r.mode === 'entorno').length,
      discoveryRuns: discovery.length,
      discoveryMs: sumMs(discovery),
      publishRuns: publish.length,
      publishMs: sumMs(publish),
      merged: all.some(r => r.mode === 'merge'),
      phaseMs,
      runMs: sumMs(runs),
      wallMs,
      mergeWaitMs,
      idleMs,
      idleGaps,
      workMs: Math.max(0, wallMs - mergeWaitMs - idleMs)
    };
  });
}

function formatSummary(summary) {
  const phases = Object.entries(summary.phaseMs).map(([name, ms]) => `${PHASE_LABELS[name] || name} ${formatDuration(ms)}`).join(' | ');
  const lines = [`Rama ${summary.branch}:`];
  if (summary.merged) lines.push(`  lote completo: ${formatDuration(summary.wallMs)} (del primer registro al merge)`);
  if (summary.mergeWaitMs || summary.idleMs) {
    const waits = [];
    if (summary.mergeWaitMs) waits.push(`espera del OK de merge ${formatDuration(summary.mergeWaitMs)}`);
    if (summary.idleMs) waits.push(`sin actividad ${formatDuration(summary.idleMs)} (${summary.idleGaps} hueco(s) de mas de ${IDLE_GAP_MS / 60000} min, ej. la pausa del lote)`);
    lines.push(`    trabajo: ${formatDuration(summary.workMs)} | ${waits.join(' | ')}`);
  }
  if (summary.discoveryRuns) lines.push(`  discovery: ${summary.discoveryRuns} exploracion(es), ${formatDuration(summary.discoveryMs)}`);
  if (summary.publishRuns) lines.push(`  publicacion en el gestor: ${summary.publishRuns}, ${formatDuration(summary.publishMs)}`);
  lines.push(
    `  corridas: ${summary.runs} (lote: ${summary.loteRuns}, fallidas: ${summary.loteFailed}; regresion: ${summary.regressionRuns}${summary.environmentRuns ? `; cortadas por el entorno (429): ${summary.environmentRuns}` : ''})`,
    `  en corridas: ${formatDuration(summary.runMs)}${phases ? ` (${phases})` : ''}`
  );
  if (!summary.merged) lines.push(`  reloj desde el primer registro: ${formatDuration(summary.wallMs)}`);
  return lines.join('\n');
}

function parseLog(text) {
  return String(text || '').split('\n').filter(l => l.trim()).map(l => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

module.exports = { createTimer, formatDuration, formatPhases, specsKey, iterationNumber, summarizeLog, formatSummary, parseLog };
