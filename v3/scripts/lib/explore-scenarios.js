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

const ACTIONS = ['click', 'type', 'clear', 'select', 'visit', 'waitFor'];
const NAME_REGEX = /^[a-z0-9][a-z0-9_-]*$/i;

// Una acción desconocida se ignoraba en silencio y el informe quedaba como
// evidencia de un paso que nunca se ejecutó.
function checkActions(actions, where) {
  if (!Array.isArray(actions)) throw new Error(`${where}: "actions" tiene que ser una lista.`);
  const unknown = actions.filter(a => !ACTIONS.includes(a && a.action)).map(a => a && a.action);
  if (unknown.length) throw new Error(`${where}: acciones desconocidas ${unknown.join(', ')} (válidas: ${ACTIONS.join(', ')})`);
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

// Escenario listo para el navegador: plantillas resueltas con los datos
// preparados y el estado de sesión de las recetas debajo del propio.
function resolveScenario(scenario, baseUrl, prepared = { vars: {}, browser: {} }) {
  const vars = prepared.vars || {};
  const browser = prepared.browser || {};
  const url = fillTemplate(scenario.url, vars);
  return {
    name: scenario.name,
    url: baseUrl ? new URL(url, baseUrl).href : url,
    storage: { ...(browser.localStorage || {}), ...fillTemplate(scenario.storage || {}, vars) },
    sessionStorage: { ...(browser.sessionStorage || {}), ...fillTemplate(scenario.sessionStorage || {}, vars) },
    actions: fillTemplate(scenario.actions || [], vars),
    waitFor: scenario.waitFor ? fillTemplate(scenario.waitFor, vars) : null
  };
}

module.exports = { ACTIONS, checkActions, parseScenarios, resolveScenario };
