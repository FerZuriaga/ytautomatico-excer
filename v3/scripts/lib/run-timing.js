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
  verificacion: 'verificacion por lectura'
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
 * misma rama con el mismo conjunto de specs (las regresiones --affected y
 * los --from-results no cuentan como iteración del lote).
 */
function iterationNumber(entries, branch, key) {
  return entries.filter(e => e.branch === branch && e.mode === 'lote' && e.specsKey === key).length + 1;
}

/**
 * Resumen por rama: corridas, iteraciones del lote (y cuántas fallaron),
 * tiempo en cada fase y tiempo de reloj entre la primera y la última
 * corrida (incluye lo que pasa entre corridas: diagnóstico, código).
 */
function summarizeLog(entries, branch = null) {
  const byBranch = new Map();
  for (const e of entries) {
    if (branch && e.branch !== branch) continue;
    if (!byBranch.has(e.branch)) byBranch.set(e.branch, []);
    byBranch.get(e.branch).push(e);
  }
  return [...byBranch].map(([name, runs]) => {
    const phaseMs = {};
    runs.forEach(r => (r.phases || []).forEach(p => { phaseMs[p.name] = (phaseMs[p.name] || 0) + p.ms; }));
    const lote = runs.filter(r => r.mode === 'lote');
    const times = runs.map(r => new Date(r.at).getTime()).filter(t => !Number.isNaN(t));
    const last = runs[runs.length - 1];
    return {
      branch: name,
      runs: runs.length,
      loteRuns: lote.length,
      loteFailed: lote.filter(r => !r.ok).length,
      regressionRuns: runs.filter(r => r.mode === 'regresion').length,
      phaseMs,
      runMs: runs.reduce((sum, r) => sum + (r.totalMs || 0), 0),
      wallMs: times.length > 1 ? Math.max(...times) + (last.totalMs || 0) - Math.min(...times) : (last.totalMs || 0)
    };
  });
}

function formatSummary(summary) {
  const phases = Object.entries(summary.phaseMs).map(([name, ms]) => `${PHASE_LABELS[name] || name} ${formatDuration(ms)}`).join(' | ');
  return [
    `Rama ${summary.branch}:`,
    `  corridas: ${summary.runs} (lote: ${summary.loteRuns}, fallidas: ${summary.loteFailed}; regresion: ${summary.regressionRuns})`,
    `  en corridas: ${formatDuration(summary.runMs)}${phases ? ` (${phases})` : ''}`,
    `  reloj desde la primera corrida: ${formatDuration(summary.wallMs)}`
  ].join('\n');
}

function parseLog(text) {
  return String(text || '').split('\n').filter(l => l.trim()).map(l => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

module.exports = { createTimer, formatDuration, formatPhases, specsKey, iterationNumber, summarizeLog, formatSummary, parseLog };
