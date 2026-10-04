/**
 * Lectura del cuerpo de una respuesta HTTP como texto UTF-8.
 *
 * Nace del 2026-10-03: los lectores de Jira, Xray y GitHub hacían
 * `data += chunk`, que convierte cada pedazo a texto por separado. Un
 * carácter de varios bytes ("ñ", "á", "✅") que cae en el corte entre dos
 * pedazos se rompía: el reporte de trazabilidad regenerado mostró
 * "contrase��a" en un paso de Xray (intermitente, según dónde corta la red).
 * Acá se juntan los bytes y se decodifica una sola vez, al final.
 */

/** Llama a `done(texto)` cuando la respuesta terminó de llegar. */
function onBody(stream, done) {
  const chunks = [];
  stream.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
  stream.on('end', () => done(Buffer.concat(chunks).toString('utf8')));
}

module.exports = { onBody };
