/**
 * Ejecuta `fn` sobre cada elemento con como mucho `limit` llamadas en
 * curso a la vez. Devuelve un resultado por elemento, en el mismo orden:
 * { ok: true, value } o { ok: false, error }. Nunca corta a la mitad: una
 * falla no frena al resto (quien llama decide qué hacer con las fallas).
 *
 * Nace del 2026-09-28: el reporte a Xray actualizaba los Test Runs de a uno
 * (~40 s por lote); con pocas llamadas a la vez baja sin saturar la API
 * (los 429 los sigue reintentando lib/http-retry.js).
 */
async function mapWithLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      try {
        results[index] = { ok: true, value: await fn(items[index], index) };
      } catch (error) {
        results[index] = { ok: false, error };
      }
    }
  };
  const workers = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workers }, worker));
  return results;
}

module.exports = { mapWithLimit };
