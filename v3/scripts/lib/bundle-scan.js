/**
 * Lectura del código que la app le manda al navegador (bundle JS) para el
 * discovery: atributos de test (data-test / data-testid / data-cy) y
 * mensajes de validación, INCLUIDOS los que no se ven en la pantalla
 * explorada (un error que aparece solo con cierto dato, un botón de otro
 * estado). Lo usa explore-page.js; el informe es una pista para decidir qué
 * probar, no evidencia: lo observado en el navegador sigue siendo la fuente
 * (lib/negative-evidence.js exige el report.json de la exploración).
 *
 * Nace del 2026-09-28: en cada lote se leía el bundle minificado a mano, y
 * `grep -oE` sobre un archivo de una sola línea se colgaba. Por eso el
 * escaneo es una sola pasada lineal (indexOf + lectura de literales), sin
 * expresiones regulares sobre el archivo completo.
 *
 * Lógica pura: recibe el texto del bundle.
 */

const TEST_ATTRS = ['data-testid', 'data-test', 'data-cy'];
// Entre el nombre del atributo y su valor: comillas, ":", "=", ",", espacios
// y barras de escape (JSX compilado, templates de Angular, HTML en string).
const SEPARATORS = new Set(['"', "'", '`', ':', '=', ',', ' ', '\\', '\n', '\t']);
const QUOTES = new Set(['"', "'", '`']);
const MAX_VALUE = 100;
const MAX_LITERAL = 300;

// Frases típicas de una regla de validación o de un rechazo.
const VALIDATION_WORDS = /\b(required|invalid|must|should|at least|at most|between|minimum|maximum|minimal|maximal|characters|not allowed|already|too (short|long|many)|does not match|do not match|mismatch|valid|incorrect|wrong|exceed|exceeds|only|unauthori[sz]ed|forbidden|not found|expired|failed|error)\b/i;
// Lo que delata código o marcado, no un mensaje para el usuario.
const CODE_LIKE = /[{};<>]|=>|\bfunction\b|\breturn\b|^\s*[\w.$-]+\s*$|^[a-z]+(-[a-z]+)+$|https?:\/\//;
// Mensajes para desarrolladores que traen las librerías (React, Router,
// Angular, gráficos, QR...): se ven en cualquier bundle y tapan los de la app.
const LIBRARY_NOISE = /\b(react|router|route path|zone\.js|zone|must be used within|provider|iterable|symbol|instance|generator|listener|callback|canvas|chart|font|production mode|sanitize|fallback language|config|header name|bitmatrix|qr code|sjis|atob|toastcomponent|\[object|readonly|read-only method|frame rates?|destructure|spread|minified|scheduled action|analytics|docker|mock server|wiremock|mockoon|websocket|xhr (post|poll)|parser error)\b/i;
// Lista de clases CSS ("card-footer d-flex ..."): todas las palabras en
// minúscula y al menos una con guion.
const isClassList = text => text.split(' ').every(w => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(w)) && text.includes('-');

/**
 * Valores de atributos de test que aparecen como literales en el código.
 * Un valor calculado (ej. "data-testid": props.id) no es un literal y se
 * ignora. Devuelve [{ attr, value }] sin repetidos, en orden de aparición.
 */
function extractTestAttributes(source) {
  const text = String(source || '');
  const seen = new Set();
  const found = [];
  for (const attr of TEST_ATTRS) {
    let index = text.indexOf(attr);
    while (index !== -1) {
      const before = text[index - 1];
      const after = text[index + attr.length];
      // "data-test" dentro de "data-testid" no cuenta como data-test.
      const wholeWord = !(before && /[\w-]/.test(before)) && !(after && /[\w-]/.test(after));
      if (wholeWord) {
        const value = readValue(text, index + attr.length);
        if (value && !seen.has(`${attr}=${value}`)) {
          seen.add(`${attr}=${value}`);
          found.push({ attr, value });
        }
      }
      index = text.indexOf(attr, index + attr.length);
    }
  }
  return found;
}

// Lee el valor literal que sigue al atributo, o null si no es un literal.
function readValue(text, from) {
  let i = from;
  let lastSeparator = '';
  while (i < text.length && i - from < 8 && SEPARATORS.has(text[i])) lastSeparator = text[i++];
  // El valor tiene que abrir con una comilla (literal), no con un nombre de
  // variable ("data-testid": e.id).
  if (!QUOTES.has(lastSeparator) && lastSeparator !== '\\') return null;
  let value = '';
  while (i < text.length && value.length <= MAX_VALUE) {
    const ch = text[i];
    if (QUOTES.has(ch) || ch === '\\' || ch === '\n' || ch === ' ') break;
    value += ch;
    i++;
  }
  if (!value || value.length > MAX_VALUE || !/^[\w$][\w\-.:${}]*$/.test(value)) return null;
  return value;
}

/**
 * Todos los literales de texto del código, en una pasada. Un literal que no
 * cierra en MAX_LITERAL caracteres o en la misma línea (" y ') se descarta
 * y se sigue después de la comilla: el código minificado puede tener
 * comillas dentro de expresiones regulares.
 */
function stringLiterals(source) {
  const text = String(source || '');
  const literals = [];
  let i = 0;
  while (i < text.length) {
    const quote = text[i];
    if (!QUOTES.has(quote)) { i++; continue; }
    let j = i + 1;
    let value = '';
    let closed = false;
    while (j < text.length && j - i <= MAX_LITERAL) {
      const ch = text[j];
      if (ch === '\\') { value += text[j + 1] || ''; j += 2; continue; }
      if (ch === quote) { closed = true; break; }
      if (ch === '\n' && quote !== '`') break;
      if (quote === '`' && ch === '$' && text[j + 1] === '{') break;
      value += ch;
      j++;
    }
    if (closed) {
      literals.push(value);
      i = j + 1;
    } else {
      i++;
    }
  }
  return literals;
}

/**
 * Mensajes de validación / rechazo: literales con forma de frase (al menos
 * 2 palabras, una mayúscula o un punto) que usan vocabulario de reglas.
 */
function extractValidationMessages(source) {
  const seen = new Set();
  const messages = [];
  for (const raw of stringLiterals(source)) {
    const text = raw.replace(/\s+/g, ' ').trim();
    if (text.length < 8 || text.length > 200 || seen.has(text)) continue;
    if (text.split(' ').length < 2 || CODE_LIKE.test(text) || !/[A-Za-z]{3}/.test(text)) continue;
    if (LIBRARY_NOISE.test(text) || isClassList(text)) continue;
    if (!VALIDATION_WORDS.test(text)) continue;
    seen.add(text);
    messages.push(text);
  }
  return messages;
}

/**
 * Escanea varios archivos: { "<url>": "<código>" }. Devuelve atributos y
 * mensajes sin repetidos entre archivos, con el archivo donde aparecen.
 */
function scanBundles(files) {
  const testAttributes = new Map();
  const messages = new Map();
  for (const [url, source] of Object.entries(files)) {
    for (const { attr, value } of extractTestAttributes(source)) {
      const key = `${attr}=${value}`;
      if (!testAttributes.has(key)) testAttributes.set(key, { attr, value, file: url });
    }
    for (const message of extractValidationMessages(source)) {
      if (!messages.has(message)) messages.set(message, { text: message, file: url });
    }
  }
  return { testAttributes: [...testAttributes.values()], messages: [...messages.values()] };
}

/**
 * Atributos del código que no aparecieron en ninguna pantalla explorada
 * (inventory de los report.json): pantallas o estados sin explorar.
 */
function notSeenInExploration(testAttributes, inventories) {
  const seen = new Set(inventories.flat().map(item => `${item.attr}=${item.value}`));
  return testAttributes.filter(item => !seen.has(`${item.attr}=${item.value}`) && !item.value.includes('${'));
}

module.exports = { extractTestAttributes, stringLiterals, extractValidationMessages, scanBundles, notSeenInExploration };
