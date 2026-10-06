/**
 * Escenarios de explore-page.js: varias exploraciones de una misma app en
 * UNA sola corrida de Cypress (cada arranque de Cypress cuesta ~40s y un
 * lote llevaba ~20 exploraciones sueltas).
 *
 * Formato de --scenarios <archivo.json>:
 *   {
 *     "app": "practicesoftwaretesting",        // recetas de v3/data-recipes/<app>.json
 *     "baseUrl": "https://practicesoftwaretesting.com",
 *     "storage": { ... }, "sessionStorage": { ... }, "waitFor": "...",  // comunes (opcionales)
 *     "scenarios": [
 *       { "name": "lista", "url": "/account/invoices",
 *         "data": ["cliente", "compra"],           // ver lib/data-recipe.js
 *         "actions": [ ... ], "waitFor": "..." }
 *     ]
 *   }
 * url, storage, sessionStorage, waitFor y actions aceptan plantillas con
 * las variables de los datos preparados (ej. "/account/invoices/{{invoiceId}}").
 *
 * Funciones puras: la lectura de archivos y la API quedan en explore-page.js.
 */
const { fillTemplate } = require('./data-recipe');

const ACTIONS = ['click', 'type', 'clear', 'select', 'attach', 'visit', 'waitFor'];
const NAME_REGEX = /^[a-z0-9][a-z0-9_-]*$/i;

// Una acción desconocida se ignoraba en silencio y el informe quedaba como
// evidencia de un paso que nunca se ejecutó.
function checkActions(actions, where) {
  if (!Array.isArray(actions)) throw new Error(`${where}: "actions" tiene que ser una lista.`);
  const unknown = actions.filter(a => !ACTIONS.includes(a && a.action)).map(a => a && a.action);
  if (unknown.length) throw new Error(`${where}: acciones desconocidas ${unknown.join(', ')} (válidas: ${ACTIONS.join(', ')})`);
  // attach genera el archivo en memoria: sin archivos de prueba sueltos.
  const badAttach = actions.filter(a => a.action === 'attach' && (!a.selector || !a.fileName || typeof a.content !== 'string'));
  if (badAttach.length) throw new Error(`${where}: "attach" necesita selector, fileName y content (texto, "" para un archivo vacío); mimeType es opcional.`);
  return actions;
}

function parseScenarios(file) {
  const errors = [];
  if (!file || !Array.isArray(file.scenarios) || !file.scenarios.length) {
    throw new Error('El archivo de escenarios necesita "scenarios": [ ... ] con al menos uno.');
  }
  const names = new Set();
  const needsData = file.scenarios.some(s => s && s.data);
  if (needsData && !file.app) errors.push('Hay escenarios con "data" pero falta "app" (nombre del archivo en v3/data-recipes/).');

  file.scenarios.forEach((s, i) => {
    const where = `Escenario ${i + 1}${s && s.name ? ` "${s.name}"` : ''}`;
    if (!s || !s.name || !NAME_REGEX.test(s.name)) errors.push(`${where}: "name" obligatorio (letras, números, - y _): es la carpeta del informe.`);
    else if (names.has(s.name.toLowerCase())) errors.push(`${where}: nombre repetido.`);
    else names.add(s.name.toLowerCase());
    if (!s || !s.url) errors.push(`${where}: falta "url".`);
    else if (!file.baseUrl && !/^https?:\/\//.test(s.url)) errors.push(`${where}: "url" relativa sin "baseUrl".`);
    try { checkActions(s && s.actions ? s.actions : [], where); } catch (e) { errors.push(e.message); }
  });
  if (errors.length) throw new Error(`Escenarios inválidos:\n  ${errors.join('\n  ')}`);

  return {
    app: file.app || null,
    baseUrl: file.baseUrl || null,
    scenarios: file.scenarios.map(s => ({
      name: s.name,
      url: s.url,
      data: s.data || null,
      storage: { ...(file.storage || {}), ...(s.storage || {}) },
      sessionStorage: { ...(file.sessionStorage || {}), ...(s.sessionStorage || {}) },
      actions: s.actions || [],
      waitFor: s.waitFor !== undefined ? s.waitFor : (file.waitFor || null)
    }))
  };
}

// La url del escenario se agrega a la del baseUrl: con new URL("/index.htm",
// "https://host/parabank") la subruta se perdía (ParaBank, 2026-10-05).
function joinUrl(baseUrl, url) {
  if (!baseUrl || /^https?:\/\//.test(url)) return url;
  return `${baseUrl.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
}

// Escenario listo para el navegador: plantillas resueltas con los datos
// preparados y el estado de sesión de las recetas debajo del propio.
function resolveScenario(scenario, baseUrl, prepared = { vars: {}, browser: {} }) {
  const vars = prepared.vars || {};
  const browser = prepared.browser || {};
  const url = fillTemplate(scenario.url, vars);
  return {
    name: scenario.name,
    url: joinUrl(baseUrl, url),
    storage: { ...(browser.localStorage || {}), ...fillTemplate(scenario.storage || {}, vars) },
    sessionStorage: { ...(browser.sessionStorage || {}), ...fillTemplate(scenario.sessionStorage || {}, vars) },
    cookies: { ...(browser.cookies || {}) },
    actions: fillTemplate(scenario.actions || [], vars),
    waitFor: scenario.waitFor ? fillTemplate(scenario.waitFor, vars) : null
  };
}

/**
 * Excepciones no capturadas y errores de consola de todos los escenarios,
 * agrupados por mensaje (primer renglón, sin la explicación de Cypress) y
 * con los escenarios donde aparecieron. explore-page.js lo imprime al final
 * de la corrida: el 2026-09-29 el error de hidratación de Restful Booker
 * estaba en todos los informes (uncaughtExceptions) y nadie lo vio hasta
 * que rompió los specs (una iteración perdida).
 * `reports`: [{ scenario, uncaughtExceptions, consoleErrors }].
 */
function summarizeProblems(reports) {
  const groups = new Map();
  const add = (kind, raw, scenario) => {
    const message = String(raw || '')
      .replace(/The following error originated from your application code, not from Cypress\.\s*/i, '')
      .replace(/^\s*>\s*/, '')
      .split('\n')[0].trim().slice(0, 140);
    if (!message) return;
    const key = `${kind}|${message}`;
    if (!groups.has(key)) groups.set(key, { kind, message, scenarios: [] });
    const group = groups.get(key);
    if (!group.scenarios.includes(scenario)) group.scenarios.push(scenario);
  };
  for (const report of reports) {
    (report.uncaughtExceptions || []).forEach(e => add('excepción no capturada', e, report.scenario));
    (report.consoleErrors || []).forEach(e => add('error de consola', e, report.scenario));
  }
  return [...groups.values()].sort((a, b) => b.scenarios.length - a.scenarios.length);
}

module.exports = { ACTIONS, checkActions, parseScenarios, resolveScenario, summarizeProblems };
