/**
 * Cobertura de lib/http-body.js. Caso real (2026-10-03): una "ñ" cortada
 * entre dos pedazos de la respuesta de Xray salía como "contrase��a".
 *
 * Correr con: node --test v3/scripts/lib/http-body.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { PassThrough } = require('stream');
const { onBody } = require('./http-body');

// Emite el texto en pedazos cortados en los bytes indicados.
function streamOf(text, cuts) {
  const bytes = Buffer.from(text, 'utf8');
  const stream = new PassThrough();
  let from = 0;
  for (const to of [...cuts, bytes.length]) {
    stream.write(bytes.subarray(from, to));
    from = to;
  }
  stream.end();
  return stream;
}

test('regresion: una "ñ" cortada entre dos pedazos llega entera', async () => {
  const text = '{"action":"Escribir la contraseña actual"}';
  const cut = Buffer.from('{"action":"Escribir la contrase', 'utf8').length + 1; // en medio de los 2 bytes de la ñ
  const body = await new Promise(resolve => onBody(streamOf(text, [cut]), resolve));
  assert.equal(body, text);
  assert.equal(JSON.parse(body).action, 'Escribir la contraseña actual');
});

test('el mismo corte con "data += chunk" (lo que había antes) rompía el carácter', async () => {
  const text = 'contraseña';
  const cut = Buffer.from('contrase', 'utf8').length + 1;
  const stream = streamOf(text, [cut]);
  let data = '';
  await new Promise(resolve => { stream.on('data', c => { data += c; }); stream.on('end', resolve); });
  assert.notEqual(data, text);
});

test('emojis de 4 bytes cortados en cada byte y respuesta vacía', async () => {
  const text = '✅ PASSED · 😀';
  const cuts = [...Array(Buffer.byteLength(text)).keys()].slice(1);
  assert.equal(await new Promise(resolve => onBody(streamOf(text, cuts), resolve)), text);
  assert.equal(await new Promise(resolve => onBody(streamOf('', []), resolve)), '');
});
