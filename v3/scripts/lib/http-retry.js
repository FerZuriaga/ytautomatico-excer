/**
 * Reintento ante fallas transitorias de red para los adapters de Jira y
 * Xray. Nace del 2026-09-26: en el lote de Checkout (SCRUM-502/508/514) el
 * reporte a Xray se cortó dos veces con "socket hang up" y hubo que
 * verificar los Test Cases a mano.
 *
 * Solo se usa con operaciones idempotentes (lecturas, PUT, cambio de
 * estado de un Test Run): reintentar una creación que sí llegó al servidor
 * duplicaría el issue. Quien llama decide si la operación lo es.
 */

const TRANSIENT_CODES = new Set(['ECONNRESET', 'ETIMEDOUT', 'EPIPE', 'EAI_AGAIN', 'ECONNREFUSED', 'ENOTFOUND']);
const DEFAULT_DELAYS_MS = [1000, 3000, 6000];

function isTransientError(err) {
  if (!err) return false;
  return TRANSIENT_CODES.has(err.code) || /socket hang up/i.test(String(err.message || ''));
}

// Respuesta HTTP que conviene reintentar: límite de uso o error del servidor.
function isTransientStatus(status) {
  return status === 429 || (status >= 500 && status <= 599);
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Ejecuta `fn` (que devuelve una promesa de { status, body }) y la
 * reintenta ante un error transitorio o una respuesta 429/5xx, con las
 * esperas de `delays`. Agotados los reintentos, devuelve la última
 * respuesta o lanza el último error. `onRetry` permite avisar en consola.
 */
async function withRetry(fn, { delays = DEFAULT_DELAYS_MS, wait = sleep, onRetry = () => {} } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fn();
      if (attempt < delays.length && res && isTransientStatus(res.status)) {
        onRetry(attempt + 1, `HTTP ${res.status}`);
        await wait(delays[attempt]);
        continue;
      }
      return res;
    } catch (err) {
      if (attempt >= delays.length || !isTransientError(err)) throw err;
      onRetry(attempt + 1, err.message || err.code);
      await wait(delays[attempt]);
    }
  }
}

function logRetry(target) {
  return (attempt, reason) => console.warn(`  ${target}: falla transitoria (${reason}), reintento ${attempt}...`);
}

module.exports = { isTransientError, isTransientStatus, withRetry, logRetry };
