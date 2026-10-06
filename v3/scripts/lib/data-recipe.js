/**
 * Preparación de datos por API para el discovery (PASO 1): crear un
 * cliente, iniciar sesión, armar una compra... antes de explorar una
 * pantalla con explore-page.js.
 *
 * El motor es general: no sabe nada de ninguna aplicación. Lo propio de
 * cada app (endpoints, cuerpos, dónde queda el token) se declara en
 * `v3/data-recipes/<app>.json`; sumar una app nueva es escribir ese JSON,
 * no código.
 *
 * Formato de `v3/data-recipes/<app>.json`:
 *   {
 *     "api": "https://api.ejemplo.com",
 *     "headers": { "Accept": "application/json" },        // en cada request
 *     "browser": { "localStorage": { "language": "en" } }, // siempre
 *     "recipes": {
 *       "cliente": {
 *         "description": "...",
 *         "params": { "nombre": "Qa" },                   // valores por defecto
 *         "requires": [],                                 // variables previas
 *         "vars": { "email": "qa.{{unique}}@example.com" },
 *         "steps": [
 *           { "method": "POST", "path": "/login", "body": { "email": "{{email}}" },
 *             "expect": 200, "save": { "token": "access_token" } }
 *         ],
 *         "browser": { "localStorage": { "auth-token": "{{token}}" } }
 *       }
 *     }
 *   }
 *
 * Apps de formularios con sesión por cookie (ej. ParaBank): un paso con
 * "form": { campo: valor } manda application/x-www-form-urlencoded en vez
 * de JSON; las cookies que fija el servidor se reenvían solas en los pasos
 * siguientes del mismo "as" y quedan como {{cookies.NOMBRE}}; "browser":
 * { "cookies": { "JSESSIONID": "{{cookies.JSESSIONID}}" } } las pasa al
 * navegador. "expectText": "..." exige ese texto en la respuesta (un
 * formulario puede responder 200 aunque falle).
 *
 * Plantillas: "{{var}}" dentro de un texto se reemplaza; un valor que es
 * SOLO "{{var}}" conserva el tipo (número, objeto). {{unique}} es un valor
 * distinto en cada receta ejecutada. Una variable sin definir es error.
 *
 * Uso desde un escenario (`data`): una receta ("cliente"), o una lista que
 * se ejecuta en orden y comparte variables:
 *   [ "cliente",
 *     { "recipe": "compra", "params": { "producto": "Wood Saw" } },
 *     { "recipe": "cliente", "as": "otro" },
 *     { "recipe": "compra", "as": "otro" } ]
 * Con "as" las variables quedan aparte ({{otro.invoiceId}}) y no tocan la
 * sesión del navegador: sirve para datos de otro usuario. Dentro de un
 * mismo "as", una receta posterior pisa las variables con el mismo nombre.
 *
 * "save" toma valores de la respuesta por ruta: "access_token",
 * "data.0.id" o con filtro exacto "data[name=Wood Saw].id".
 *
 * Nace del 2026-09-28: en cada lote se rehacía a mano un script suelto
 * (sess.sh, build-*.js) para preparar cliente/sesión/compras y el token de
 * 5 minutos de Practice Software Testing vencía entre exploraciones.
 *
 * Función pura: la request HTTP se inyecta (request).
 */
const fs = require('fs');
const path = require('path');

const RECIPES_DIR = path.resolve(__dirname, '../../data-recipes');
const TEMPLATE = /\{\{\s*([\w.-]+)\s*\}\}/g;
const WHOLE_TEMPLATE = /^\{\{\s*([\w.-]+)\s*\}\}$/;

function lookup(vars, name) {
  return name.split('.').reduce((obj, key) => (obj == null ? undefined : obj[key]), vars);
}

function fillTemplate(value, vars) {
  if (typeof value === 'string') {
    const whole = value.match(WHOLE_TEMPLATE);
    if (whole) {
      const found = lookup(vars, whole[1]);
      if (found === undefined) throw new Error(`Variable sin definir: {{${whole[1]}}}`);
      return found;
    }
    return value.replace(TEMPLATE, (_, name) => {
      const found = lookup(vars, name);
      if (found === undefined) throw new Error(`Variable sin definir: {{${name}}}`);
      return typeof found === 'object' ? JSON.stringify(found) : String(found);
    });
  }
  if (Array.isArray(value)) return value.map(v => fillTemplate(v, vars));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fillTemplate(v, vars)]));
  }
  return value;
}

// "data.0.id" -> body.data[0].id; "data[name=Wood Saw].id" -> el primero
// de la lista cuyo name es exactamente "Wood Saw" (una búsqueda de la API
// puede devolver primero otro producto parecido).
const PATH_TOKEN = /\[([^=\]]+)=([^\]]*)\]|([^.[\]]+)/g;

function extractPath(obj, dotted) {
  let current = obj;
  for (const [, field, value, key] of String(dotted).matchAll(PATH_TOKEN)) {
    if (current == null) return undefined;
    current = key !== undefined
      ? current[key]
      : (Array.isArray(current) ? current.find(item => item != null && String(item[field]) === value) : undefined);
  }
  return current;
}

function normalizeInvocations(data) {
  if (data == null) return [];
  const list = Array.isArray(data) ? data : [data];
  return list.map(inv => (typeof inv === 'string' ? { recipe: inv } : inv));
}

function validateRecipes(config) {
  const errors = [];
  if (!config || typeof config !== 'object') return ['El archivo de recetas no es un objeto JSON.'];
  if (!config.api) errors.push('Falta "api" (URL base de la API).');
  if (!config.recipes || typeof config.recipes !== 'object' || !Object.keys(config.recipes).length) {
    errors.push('Falta "recipes" con al menos una receta.');
    return errors;
  }
  for (const [name, recipe] of Object.entries(config.recipes)) {
    if (!Array.isArray(recipe.steps) || !recipe.steps.length) errors.push(`Receta "${name}": sin "steps".`);
    (recipe.steps || []).forEach((step, i) => {
      if (!step.method || !step.path) errors.push(`Receta "${name}" paso ${i + 1}: falta "method" o "path".`);
      if (step.save && Object.values(step.save).some(p => typeof p !== 'string')) {
        errors.push(`Receta "${name}" paso ${i + 1}: cada valor de "save" es una ruta de texto (ej. "data.0.id").`);
      }
    });
  }
  return errors;
}

function buildUrl(api, stepPath, query) {
  const url = new URL(String(api).replace(/\/$/, '') + stepPath);
  Object.entries(query || {}).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.href;
}

function snippet(body) {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return String(text || '').slice(0, 200);
}

function defaultUnique() {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

/**
 * Ejecuta las recetas de `data` en orden. Devuelve las variables
 * ({ ...principal, <as>: { ... } }), el estado de navegador a fijar
 * (localStorage / sessionStorage) y el log de requests.
 * `request({ method, url, headers, body })` -> Promise<{ status, body }>.
 */
async function runData(config, data, { request, unique = defaultUnique }) {
  const configErrors = validateRecipes(config);
  if (configErrors.length) throw new Error(`Recetas inválidas:\n  ${configErrors.join('\n  ')}`);

  const scopes = { '': {} };
  const jars = {};
  const browser = {
    localStorage: { ...(config.browser?.localStorage || {}) },
    sessionStorage: { ...(config.browser?.sessionStorage || {}) },
    cookies: { ...(config.browser?.cookies || {}) }
  };
  const log = [];

  for (const inv of normalizeInvocations(data)) {
    const recipe = config.recipes[inv.recipe];
    if (!recipe) throw new Error(`Receta desconocida "${inv.recipe}" (disponibles: ${Object.keys(config.recipes).join(', ')})`);
    const scopeName = inv.as || '';
    const scope = scopes[scopeName] || (scopes[scopeName] = {});
    const who = inv.as ? `${inv.recipe} (as ${inv.as})` : inv.recipe;

    const missing = (recipe.requires || []).filter(name => lookup(scope, name) === undefined);
    if (missing.length) {
      throw new Error(`La receta "${who}" necesita ${missing.join(', ')}: ejecutar antes la receta que lo genera (ej. "cliente") con el mismo "as".`);
    }

    const vars = { ...scope, ...(recipe.params || {}), ...(inv.params || {}), unique: unique() };
    Object.assign(vars, fillTemplate(recipe.vars || {}, vars));
    // Cookies de la sesión (apps de formularios, ej. ParaBank): las que
    // devuelve un paso se reenvían en los siguientes del mismo "as".
    const jar = jars[scopeName] || (jars[scopeName] = {});

    for (const [i, step] of recipe.steps.entries()) {
      const filled = fillTemplate(step, vars);
      const cookieHeader = Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');
      const req = {
        method: String(filled.method).toUpperCase(),
        url: buildUrl(config.api, filled.path, filled.query),
        headers: { ...(config.headers || {}), ...(cookieHeader ? { Cookie: cookieHeader } : {}), ...(filled.headers || {}) },
        body: filled.body,
        form: filled.form
      };
      const res = await request(req);
      log.push({ recipe: who, step: i + 1, method: req.method, url: req.url, status: res.status });
      const expected = step.expect == null ? null : [].concat(step.expect);
      if (expected ? !expected.includes(res.status) : (res.status < 200 || res.status > 299)) {
        throw new Error(`Receta "${who}" paso ${i + 1} (${req.method} ${filled.path}): HTTP ${res.status}, esperado ${expected ? expected.join('/') : '2xx'} -- ${snippet(res.body)}`);
      }
      // Un formulario puede responder 200 aunque falle: el texto que tiene
      // que aparecer en la respuesta confirma el paso.
      if (filled.expectText && !String(typeof res.body === 'string' ? res.body : JSON.stringify(res.body)).includes(filled.expectText)) {
        throw new Error(`Receta "${who}" paso ${i + 1} (${req.method} ${filled.path}): la respuesta no contiene "${filled.expectText}" -- ${snippet(res.body)}`);
      }
      for (const raw of res.cookies || []) {
        const [pair] = String(raw).split(';');
        const eq = pair.indexOf('=');
        if (eq > 0) jar[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
      }
      vars.cookies = { ...jar };
      for (const [name, from] of Object.entries(filled.save || {})) {
        const value = extractPath(res.body, from);
        if (value === undefined) throw new Error(`Receta "${who}" paso ${i + 1}: la respuesta no trae "${from}" para guardar ${name} -- ${snippet(res.body)}`);
        vars[name] = value;
      }
    }

    delete vars.unique;
    Object.assign(scope, vars);
    if (!inv.as && recipe.browser) {
      const filled = fillTemplate(recipe.browser, vars);
      Object.assign(browser.localStorage, filled.localStorage || {});
      Object.assign(browser.sessionStorage, filled.sessionStorage || {});
      Object.assign(browser.cookies, filled.cookies || {});
    }
  }

  const { '': main, ...named } = scopes;
  return { vars: { ...main, ...named }, browser, log };
}

// Request real (Node 18+): JSON de ida y vuelta, o un formulario
// (application/x-www-form-urlencoded) si el paso trae "form". Devuelve
// también las cookies que fija el servidor. Sin reintentos: crear un
// cliente o una compra no es idempotente.
async function nodeRequest({ method, url, headers, body, form }) {
  let sent;
  let contentType = null;
  if (form !== undefined) {
    sent = new URLSearchParams(form).toString();
    contentType = 'application/x-www-form-urlencoded';
  } else if (body !== undefined) {
    sent = JSON.stringify(body);
    contentType = 'application/json';
  }
  const res = await fetch(url, {
    method,
    headers: contentType ? { 'Content-Type': contentType, ...headers } : headers,
    body: sent
  });
  const text = await res.text();
  let parsed = text;
  try { parsed = text ? JSON.parse(text) : null; } catch { /* queda como texto */ }
  const cookies = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
  return { status: res.status, body: parsed, cookies };
}

function loadRecipes(app, dir = RECIPES_DIR) {
  const file = path.join(dir, `${app}.json`);
  if (!fs.existsSync(file)) {
    const available = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => f.replace(/\.json$/, '')) : [];
    throw new Error(`No hay recetas de datos para "${app}" (${file}). Disponibles: ${available.join(', ') || 'ninguna'}`);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

module.exports = { fillTemplate, extractPath, normalizeInvocations, validateRecipes, runData, nodeRequest, loadRecipes, RECIPES_DIR };
