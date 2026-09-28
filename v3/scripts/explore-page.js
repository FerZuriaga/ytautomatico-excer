/**
 * CLI: explora una o varias pantallas con un navegador real (Cypress
 * headless) y devuelve un informe para el PASO 1 (discovery). No es un
 * test: no hace aserciones de negocio y no deja ningún spec en el repo.
 *
 * Uso (una pantalla):
 *   node v3/scripts/explore-page.js --url <url> [--storage '<json>'] [--session-storage '<json>']
 *                                   [--actions <archivo.json>] [--app <app> --data <recetas>]
 *                                   [--wait-for <selector>] [--init-script <archivo.js>]
 *                                   [--viewport 1280x800] [--out <carpeta>]
 * Uso (varias pantallas en UNA corrida de Cypress):
 *   node v3/scripts/explore-page.js --scenarios <archivo.json> [--init-script <archivo.js>]
 *                                   [--viewport 1280x800] [--out <carpeta>] [--detail]
 *
 *   --url        pantalla a explorar (modo una pantalla).
 *   --scenarios  archivo con la lista de escenarios (formato en
 *                lib/explore-scenarios.js). Cada arranque de Cypress cuesta
 *                ~40s: agrupar todas las exploraciones de un lote en un
 *                archivo es lo que baja el tiempo del discovery. Cada
 *                escenario corre aislado (storage y cookies limpios) y deja
 *                su informe en <out>/<nombre>/report.json.
 *   --app / --data  datos preparados por API antes de cargar la pantalla,
 *                con las recetas de v3/data-recipes/<app>.json (ver
 *                lib/data-recipe.js). --data: nombres separados por coma
 *                ("cliente,compra") o JSON. Las recetas corren dentro de la
 *                misma corrida, justo antes de cada escenario: un token de
 *                vida corta no vence entre exploraciones.
 *   --storage    (opcional) claves de localStorage a fijar antes de cargar,
 *                ej. '{"language":"en"}'.
 *   --session-storage (opcional) idem para sessionStorage, ej. el cart_id de
 *                un carrito preparado por API: explorar con el mismo estado
 *                que usará el test, no solo el camino de la UI.
 *   --actions    (opcional) JSON con acciones para llegar a una pantalla
 *                interna: [{ "action": "click", "selector": "..." },
 *                { "action": "type", "selector": "...", "value": "..." },
 *                { "action": "clear", "selector": "..." } (vacía un campo),
 *                { "action": "select", "selector": "...", "value": "..." },
 *                { "action": "visit", "value": "/ruta" },
 *                { "action": "waitFor", "selector": "..." }]
 *   --wait-for   (opcional) selector que indica que la pantalla terminó de
 *                renderizar (SPA).
 *   --init-script (opcional) archivo JS con `export default function (win) {}`
 *                que corre antes de cargar cada página (ej. un adaptador que
 *                la app necesita dentro de Cypress). Sin él se ve la app tal
 *                cual la recibe el navegador.
 *   --out        (opcional) carpeta del informe. Default: carpeta temporal
 *                del sistema (nunca el repo).
 *   --detail     (opcional, varias pantallas) resumen completo de cada
 *                escenario en vez de una línea por escenario.
 *
 * El informe (report.json + captura de pantalla completa) trae:
 *   - quién lo generó (generator: "explore-page"), cuándo y las acciones
 *     ejecutadas, más el texto visible después de la carga y de cada
 *     acción (snapshots): es la evidencia que exige create-jira-task.js
 *     para publicar un Test Case negativo;
 *   - los datos preparados por API (variables y requests), si hubo;
 *   - requests de red vistas desde el navegador (método, URL, status),
 *     antes del proxy de Cypress: un método que Cypress no soporta aparece
 *     igual, con status 0;
 *   - inventario de data-test / data-testid / data-cy con visibilidad real
 *     (detecta duplicados ocultos por CSS) y campos de formulario;
 *   - idioma del documento y del navegador, claves de localStorage y
 *     sessionStorage, errores de consola y excepciones no capturadas.
 *
 * Regla (CLAUDE.md): solo para el PASO 1. La corrida de los tests del
 * PASO 3 sigue siendo con run-and-report.js.
 *
 * Nace de la sesión del 2026-09-25 (Practice Software Testing): leer el
 * código minificado no mostró que el front pedía productos con el método
 * HTTP QUERY (no soportado por el Node de Cypress 14) ni que la app elegía
 * el idioma del navegador; ambos se descubrieron recién al correr los tests.
 * Escenarios y datos por receta: 2026-09-28 (~20 arranques de Cypress y un
 * script de sesión suelto por lote).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { parseScenarios, checkActions } = require('./lib/explore-scenarios');
const { loadRecipes, validateRecipes, normalizeInvocations } = require('./lib/data-recipe');

const REPO_ROOT = path.resolve(__dirname, '../..');
const STANDARD_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
const SINGLE_NAME = 'explore';

function parseArgs(argv) {
  const args = { url: null, scenarios: null, app: null, data: null, storage: {}, sessionStorage: {}, actions: [], waitFor: null, initScript: null, viewport: '1280x800', out: null, detail: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--url') args.url = argv[++i];
    else if (argv[i] === '--scenarios') args.scenarios = path.resolve(argv[++i]);
    else if (argv[i] === '--app') args.app = argv[++i];
    else if (argv[i] === '--data') args.data = parseDataArg(argv[++i]);
    else if (argv[i] === '--storage') args.storage = JSON.parse(argv[++i]);
    else if (argv[i] === '--session-storage') args.sessionStorage = JSON.parse(argv[++i]);
    else if (argv[i] === '--actions') args.actions = checkActions(JSON.parse(fs.readFileSync(argv[++i], 'utf8')), '--actions');
    else if (argv[i] === '--wait-for') args.waitFor = argv[++i];
    else if (argv[i] === '--init-script') args.initScript = path.resolve(argv[++i]);
    else if (argv[i] === '--viewport') args.viewport = argv[++i];
    else if (argv[i] === '--out') args.out = path.resolve(argv[++i]);
    else if (argv[i] === '--detail') args.detail = true;
  }
  return args;
}

function parseDataArg(value) {
  const text = String(value).trim();
  return /^[[{]/.test(text) ? JSON.parse(text) : text.split(',').map(s => s.trim()).filter(Boolean);
}

// Plan de la corrida: el modo una pantalla es un escenario único.
function buildPlan(args) {
  if (args.scenarios) {
    return { ...parseScenarios(JSON.parse(fs.readFileSync(args.scenarios, 'utf8'))), multi: true };
  }
  return {
    ...parseScenarios({
      app: args.app,
      scenarios: [{ name: SINGLE_NAME, url: args.url, data: args.data, storage: args.storage, sessionStorage: args.sessionStorage, actions: args.actions, waitFor: args.waitFor }]
    }),
    multi: false
  };
}

// Recetas revisadas antes de arrancar Cypress: un nombre mal escrito no
// tiene que costar un arranque.
function checkRecipes(plan) {
  if (!plan.app) return;
  const config = loadRecipes(plan.app);
  const errors = validateRecipes(config);
  if (errors.length) throw new Error(`Recetas de ${plan.app} inválidas:\n  ${errors.join('\n  ')}`);
  for (const s of plan.scenarios) {
    const unknown = normalizeInvocations(s.data).map(inv => inv.recipe).filter(name => !config.recipes[name]);
    if (unknown.length) throw new Error(`Escenario "${s.name}": recetas desconocidas ${unknown.join(', ')} (disponibles: ${Object.keys(config.recipes).join(', ')})`);
  }
}

const toPosix = p => p.split(path.sep).join('/');

function buildConfig({ width, height, app, baseUrl }) {
  return `const { runData, nodeRequest, loadRecipes } = require(${JSON.stringify(toPosix(path.join(__dirname, 'lib/data-recipe.js')))});
const { resolveScenario } = require(${JSON.stringify(toPosix(path.join(__dirname, 'lib/explore-scenarios.js')))});
const APP = ${JSON.stringify(app)};
const BASE_URL = ${JSON.stringify(baseUrl)};

module.exports = { e2e: {
  specPattern: 'explore.cy.js', supportFile: false, video: false, screenshotOnRunFailure: true, testIsolation: true,
  viewportWidth: ${width}, viewportHeight: ${height}, pageLoadTimeout: 20000, defaultCommandTimeout: 15000, retries: 0,
  setupNodeEvents(on) {
    on('task', {
      // Datos por API (en Node, sin CORS) y plantillas del escenario resueltas.
      async prepareScenario(scenario) {
        const prepared = APP
          ? await runData(loadRecipes(APP), scenario.data || [], { request: nodeRequest })
          : { vars: {}, browser: {}, log: [] };
        return {
          resolved: resolveScenario(scenario, BASE_URL, prepared),
          data: scenario.data ? { recipes: scenario.data, vars: prepared.vars, requests: prepared.log } : null
        };
      }
    });
  }
} };
`;
}

// Spec generado en una carpeta temporal: nunca vive en el repo.
function buildSpec(params) {
  const initImport = params.initScript
    ? `import initScript from ${JSON.stringify(toPosix(params.initScript))};`
    : 'const initScript = null;';
  return `
${initImport}
const P = ${JSON.stringify(params)};

// Estado del escenario en curso. El registro vive fuera de la ventana: si
// la app recarga la página (ej. un login que redirige con
// window.location.href), cada ventana nueva vuelve a instalar el recorder
// (window:before:load) y lo capturado en las anteriores se conserva.
let REC, SNAPSHOTS, CUR;

// Texto visible después de la carga y de cada acción: es la evidencia de
// lo observado en el discovery (un toast o un mensaje de error puede
// desaparecer antes del informe final). La usa create-jira-task.js para
// exigir que cada Test Case negativo se haya probado.
function snapshot(step, action) {
  cy.window().then(win => {
    const text = ((win.document.body && win.document.body.innerText) || '').replace(/\\s+/g, ' ').trim();
    SNAPSHOTS.push({ step, action, text: text.slice(0, 8000) });
  });
}

function applyStorage(win, s) {
  Object.entries(s.storage).forEach(([k, v]) => win.localStorage.setItem(k, v));
  Object.entries(s.sessionStorage).forEach(([k, v]) => win.sessionStorage.setItem(k, v));
}

function recorder(win) {
  // Las requests de la página anterior que no terminaron se cortan con la
  // recarga: no cuentan como en curso en la nueva.
  REC.pending = 0;
  win.__explore = REC;
  if (initScript) initScript(win);

  const proto = win.XMLHttpRequest.prototype;
  const open = proto.open;
  const send = proto.send;
  proto.open = function (method, url, ...rest) {
    this.__rec = { via: 'xhr', method: String(method).toUpperCase(), url: new win.URL(String(url), win.location.href).href };
    return open.call(this, method, url, ...rest);
  };
  proto.send = function (body) {
    const rec = this.__rec;
    if (rec) {
      win.__explore.requests.push(rec);
      win.__explore.pending++;
      this.addEventListener('loadend', () => {
        if (rec.status === undefined) { rec.status = this.status; win.__explore.pending--; }
      });
    }
    return send.call(this, body);
  };

  const fetch = win.fetch;
  win.fetch = function (input, init) {
    const method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    const url = new win.URL(typeof input === 'string' ? input : input.url, win.location.href).href;
    const rec = { via: 'fetch', method, url };
    win.__explore.requests.push(rec);
    win.__explore.pending++;
    return fetch.apply(this, arguments).then(
      res => { rec.status = res.status; win.__explore.pending--; return res; },
      err => { rec.status = 'error: ' + err.message; win.__explore.pending--; throw err; }
    );
  };

  const consoleError = win.console.error;
  win.console.error = (...args) => {
    const describe = a => {
      if (a instanceof win.Error) return a.message;
      if (a && typeof a === 'object') {
        if (a.message || a.status) return [a.status, a.statusText, a.url, a.message].filter(Boolean).join(' ');
        try { return JSON.stringify(a); } catch (e) { return String(a); }
      }
      return String(a);
    };
    win.__explore.errors.push(args.map(describe).join(' ').slice(0, 300));
    consoleError.apply(win.console, args);
  };
}

// Espera a que no queden requests en curso, sin fallar: una request que
// nunca termina (ej. método no soportado) se informa, no corta la
// exploración.
function settle() {
  cy.window().then({ timeout: 15000 }, win => new Cypress.Promise(resolve => {
    const started = Date.now();
    const check = () => (REC.pending <= 0 || Date.now() - started > 10000) ? resolve() : setTimeout(check, 250);
    check();
  }));
}

function collect(win) {
  const doc = win.document;
  const isVisible = el => {
    const style = win.getComputedStyle(el);
    return el.getClientRects().length > 0 && style.visibility !== 'hidden' && style.display !== 'none';
  };
  const text = el => (el.innerText || el.value || '').replace(/\\s+/g, ' ').trim().slice(0, 80);
  const testAttrs = ['data-test', 'data-testid', 'data-cy'];
  const inventory = [...doc.querySelectorAll(testAttrs.map(a => '[' + a + ']').join(','))].map(el => {
    const attr = testAttrs.find(a => el.hasAttribute(a));
    return { attr, value: el.getAttribute(attr), tag: el.tagName.toLowerCase(), visible: isVisible(el), text: text(el) };
  });
  const fields = [...doc.querySelectorAll('input, select, textarea, button')]
    .filter(el => !testAttrs.some(a => el.hasAttribute(a)))
    .map(el => ({ tag: el.tagName.toLowerCase(), type: el.type || null, id: el.id || null, name: el.name || null,
      placeholder: el.placeholder || null, ariaLabel: el.getAttribute('aria-label'), visible: isVisible(el), text: text(el) }));
  return {
    scenario: CUR.name,
    requestedUrl: CUR.resolved ? CUR.resolved.url : null,
    actions: CUR.resolved ? CUR.resolved.actions : [],
    data: CUR.data,
    url: win.location.href,
    title: doc.title,
    documentLang: doc.documentElement.lang || null,
    navigatorLanguage: win.navigator.language,
    headings: [...doc.querySelectorAll('h1, h2, h3')].filter(isVisible).map(text).filter(Boolean),
    localStorageKeys: Object.keys(win.localStorage),
    sessionStorageKeys: Object.keys(win.sessionStorage),
    requests: REC.requests,
    pendingRequests: REC.pending,
    consoleErrors: REC.errors,
    uncaughtExceptions: CUR.uncaught,
    failedStep: CUR.failure,
    snapshots: SNAPSHOTS,
    inventory,
    fieldsWithoutTestAttr: fields
  };
}

describe('explore', () => {
  // El informe se escribe en afterEach: si una acción falla (ej. un
  // selector que nunca aparece), igual queda lo capturado hasta ahí, y el
  // escenario siguiente corre igual.
  afterEach(() => {
    cy.screenshot(CUR.name, { capture: 'fullPage' });
    cy.window().then(win => cy.writeFile(P.reports[CUR.name], collect(win)));
  });

  P.scenarios.forEach(scenario => {
    it(scenario.name, () => {
      REC = { requests: [], errors: [], pending: 0 };
      SNAPSHOTS = [];
      CUR = { name: scenario.name, uncaught: [], failure: null, resolved: null, data: null };
      cy.on('uncaught:exception', err => { CUR.uncaught.push(String(err.message).slice(0, 300)); return false; });
      cy.on('fail', err => { CUR.failure = String(err.message).slice(0, 300); throw err; });
      cy.on('window:before:load', recorder);

      cy.task('prepareScenario', scenario, { timeout: 60000, log: false }).then(({ resolved, data }) => {
        CUR.resolved = resolved;
        CUR.data = data;
        cy.visit(resolved.url, { onBeforeLoad: win => applyStorage(win, resolved), failOnStatusCode: false });
        cy.document({ timeout: 15000 }).its('readyState').should('eq', 'complete');
        if (resolved.waitFor) cy.get(resolved.waitFor, { timeout: 15000 });
        settle();
        snapshot(0, 'carga');

        resolved.actions.forEach((a, i) => {
          if (a.action === 'click') cy.get(a.selector, { timeout: 15000 }).first().click();
          else if (a.action === 'type') cy.get(a.selector, { timeout: 15000 }).first().clear().type(a.value);
          else if (a.action === 'clear') cy.get(a.selector, { timeout: 15000 }).first().clear();
          else if (a.action === 'select') cy.get(a.selector, { timeout: 15000 }).first().select(a.value);
          else if (a.action === 'visit') cy.visit(new URL(a.value, resolved.url).href, { failOnStatusCode: false });
          else if (a.action === 'waitFor') cy.get(a.selector, { timeout: 15000 });
          settle();
          snapshot(i + 1, a.action + ' ' + (a.selector || a.value || ''));
        });
      });
    });
  });
});
`;
}

function groupRequests(requests) {
  const groups = new Map();
  for (const r of requests) {
    let key;
    try { const u = new URL(r.url); key = `${r.method} ${u.host}${u.pathname}`; } catch { key = `${r.method} ${r.url}`; }
    const g = groups.get(key) || { count: 0, statuses: new Set() };
    g.count++;
    g.statuses.add(r.status === undefined ? 'sin respuesta' : String(r.status));
    groups.set(key, g);
  }
  return [...groups].map(([key, g]) => {
    const flags = [];
    if (!STANDARD_METHODS.includes(key.split(' ')[0])) flags.push('METODO NO ESTANDAR');
    if ([...g.statuses].some(s => s === '0' || s.startsWith('error') || s === 'sin respuesta')) flags.push('SIN RESPUESTA/FALLIDA');
    return { key, count: g.count, statuses: [...g.statuses], flags };
  });
}

function summarize(report) {
  console.log(`\nURL final: ${report.url}`);
  console.log(`Titulo: ${report.title}`);
  console.log(`Idioma: documento=${report.documentLang} navegador=${report.navigatorLanguage}`);
  if (report.headings.length) console.log(`Encabezados visibles: ${report.headings.slice(0, 8).join(' | ')}`);
  console.log(`localStorage: ${report.localStorageKeys.join(', ') || '(vacio)'} | sessionStorage: ${report.sessionStorageKeys.join(', ') || '(vacio)'}`);
  if (report.data) console.log(`Datos preparados (${report.data.requests.length} requests): ${JSON.stringify(report.data.vars).slice(0, 400)}`);

  console.log(`\nRequests (${report.requests.length}, en curso al final: ${report.pendingRequests}):`);
  for (const g of groupRequests(report.requests)) {
    console.log(`  ${g.flags.length ? '⚠ ' : '  '}${g.key}  x${g.count}  [${g.statuses.join(', ')}]${g.flags.length ? '  <- ' + g.flags.join(', ') : ''}`);
  }

  const inv = report.inventory;
  const visible = inv.filter(i => i.visible).length;
  console.log(`\nAtributos de test: ${inv.length} (${visible} visibles, ${inv.length - visible} ocultos)`);
  const byValue = new Map();
  inv.forEach(i => byValue.set(`${i.attr}=${i.value}`, [...(byValue.get(`${i.attr}=${i.value}`) || []), i]));
  const dupes = [...byValue].filter(([, list]) => list.length > 1);
  if (dupes.length) {
    console.log('Duplicados (mismo valor en varios elementos):');
    dupes.slice(0, 20).forEach(([k, list]) => console.log(`  ${k}: ${list.length} (${list.filter(i => i.visible).length} visibles)`));
  }
  const fieldsNoAttr = report.fieldsWithoutTestAttr.filter(f => f.visible);
  if (fieldsNoAttr.length) console.log(`Campos/botones visibles SIN atributo de test: ${fieldsNoAttr.length}`);
  if (report.consoleErrors.length) console.log(`\nErrores de consola (${report.consoleErrors.length}):\n  ${report.consoleErrors.slice(0, 5).join('\n  ')}`);
  if (report.failedStep) console.log(`
⚠ La exploracion se corto en una accion: ${report.failedStep}`);
  if (report.uncaughtExceptions.length) console.log(`Excepciones no capturadas (${report.uncaughtExceptions.length}):\n  ${report.uncaughtExceptions.slice(0, 5).join('\n  ')}`);
}

// Una línea por escenario: para un lote de 20 el resumen completo tapa lo
// importante (qué se cortó y qué requests fallaron).
function summarizeBrief(name, report, reportPath) {
  const flagged = groupRequests(report.requests).filter(g => g.flags.length);
  const status = report.failedStep ? `⚠ CORTADA: ${report.failedStep.slice(0, 160)}` : 'OK';
  console.log(`\n[${name}] ${status}`);
  console.log(`  URL final: ${report.url} | requests ${report.requests.length} | errores de consola ${report.consoleErrors.length}`);
  flagged.forEach(g => console.log(`  ⚠ ${g.key} [${g.statuses.join(', ')}] <- ${g.flags.join(', ')}`));
  console.log(`  Informe: ${reportPath}`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.url && !args.scenarios) {
    console.error('Uso: node v3/scripts/explore-page.js --url <url> [--storage \'<json>\'] [--session-storage \'<json>\'] [--actions <archivo.json>] [--app <app> --data <recetas>] [--wait-for <selector>] [--init-script <archivo.js>] [--viewport 1280x800] [--out <carpeta>]');
    console.error('       node v3/scripts/explore-page.js --scenarios <archivo.json> [--init-script <archivo.js>] [--viewport 1280x800] [--out <carpeta>] [--detail]');
    process.exit(1);
  }

  let plan;
  try {
    plan = buildPlan(args);
    checkRecipes(plan);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }

  let host = 'app';
  try { host = new URL(plan.baseUrl || plan.scenarios[0].url).host.replace(/[^a-z0-9.-]/gi, '_'); } catch { /* url con plantilla */ }
  const outDir = args.out || path.join(os.tmpdir(), `explore-${host}-${Date.now()}`);
  if (outDir.startsWith(REPO_ROOT + path.sep)) {
    console.error('El informe no puede quedar dentro del repo: usar una carpeta fuera (o el default temporal).');
    process.exit(1);
  }
  const reportDir = name => (plan.multi ? path.join(outDir, name) : outDir);
  const reports = Object.fromEntries(plan.scenarios.map(s => [s.name, path.join(reportDir(s.name), 'report.json')]));
  plan.scenarios.forEach(s => fs.mkdirSync(reportDir(s.name), { recursive: true }));

  const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'explore-project-'));
  const [width, height] = args.viewport.split('x').map(Number);
  fs.writeFileSync(path.join(projectDir, 'cypress.config.js'), buildConfig({ width, height, app: plan.app, baseUrl: plan.baseUrl }));
  fs.writeFileSync(path.join(projectDir, 'explore.cy.js'), buildSpec({ scenarios: plan.scenarios, reports, initScript: args.initScript }));

  const started = Date.now();
  console.log(plan.multi
    ? `Explorando ${plan.scenarios.length} escenarios en una sola corrida de Cypress (headless)...`
    : `Explorando ${plan.scenarios[0].url} con navegador real (Cypress headless)...`);
  const run = spawnSync('npx', ['cypress', 'run', '--project', projectDir, '--quiet'], {
    cwd: REPO_ROOT, encoding: 'utf8', shell: true, maxBuffer: 64 * 1024 * 1024
  });

  const screenshots = path.join(projectDir, 'cypress', 'screenshots');
  if (fs.existsSync(screenshots)) {
    if (!plan.multi) fs.cpSync(screenshots, path.join(outDir, 'screenshots'), { recursive: true });
    else {
      const shotsDir = path.join(screenshots, 'explore.cy.js');
      const files = fs.existsSync(shotsDir) ? fs.readdirSync(shotsDir) : [];
      for (const s of plan.scenarios) {
        const own = files.filter(f => f === `${s.name}.png` || f === `explore -- ${s.name} (failed).png`);
        if (!own.length) continue;
        fs.mkdirSync(path.join(reportDir(s.name), 'screenshots'), { recursive: true });
        own.forEach(f => fs.copyFileSync(path.join(shotsDir, f), path.join(reportDir(s.name), 'screenshots', f)));
      }
    }
  }
  fs.rmSync(projectDir, { recursive: true, force: true });

  // Metadatos para usar el informe como evidencia (create-jira-task.js
  // exige uno por Test Case negativo): quién lo generó y cuándo; las
  // acciones y la URL ya vienen resueltas desde el navegador.
  const missing = [];
  let cut = 0;
  for (const s of plan.scenarios) {
    const reportPath = reports[s.name];
    if (!fs.existsSync(reportPath)) { missing.push(s.name); continue; }
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    Object.assign(report, { generator: 'explore-page', generatedAt: new Date().toISOString() });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    if (report.failedStep) cut++;

    if (!plan.multi || args.detail) {
      if (plan.multi) console.log(`\n===== ${s.name} =====`);
      summarize(report);
      if (plan.multi) console.log(`Informe: ${reportPath}`);
    } else summarizeBrief(s.name, report, reportPath);
  }

  if (missing.length) {
    console.error(`\nSin informe: ${missing.join(', ')}. Salida de Cypress:`);
    console.error((run.stdout || '').slice(-3000), (run.stderr || '').slice(-2000));
    process.exit(1);
  }

  const seconds = Math.round((Date.now() - started) / 1000);
  if (plan.multi) {
    console.log(`\n${plan.scenarios.length} escenarios en ${seconds}s (${cut} cortados). Informes en: ${outDir}`);
  } else {
    console.log(`\nInforme completo: ${reports[SINGLE_NAME]}`);
    console.log(`Capturas: ${path.join(outDir, 'screenshots')}`);
    console.log(`Duracion: ${seconds}s`);
  }
}

main();
