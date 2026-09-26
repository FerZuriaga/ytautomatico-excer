/**
 * CLI: explora una pantalla con un navegador real (Cypress headless) y
 * devuelve un informe para el PASO 1 (discovery). No es un test: no hace
 * aserciones de negocio y no deja ningún spec en el repo.
 *
 * Uso:
 *   node v3/scripts/explore-page.js --url <url> [--storage '<json>'] [--actions <archivo.json>]
 *                                   [--wait-for <selector>] [--init-script <archivo.js>]
 *                                   [--viewport 1280x800] [--out <carpeta>]
 *
 *   --url        (obligatorio) pantalla a explorar.
 *   --storage    (opcional) claves de localStorage a fijar antes de cargar,
 *                ej. '{"language":"en"}'.
 *   --actions    (opcional) JSON con acciones para llegar a una pantalla
 *                interna: [{ "action": "click", "selector": "..." },
 *                { "action": "type", "selector": "...", "value": "..." },
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
 *
 * El informe (report.json + captura de pantalla completa) trae:
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
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '../..');
const STANDARD_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

function parseArgs(argv) {
  const args = { url: null, storage: {}, actions: [], waitFor: null, initScript: null, viewport: '1280x800', out: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--url') args.url = argv[++i];
    else if (argv[i] === '--storage') args.storage = JSON.parse(argv[++i]);
    else if (argv[i] === '--actions') args.actions = JSON.parse(fs.readFileSync(argv[++i], 'utf8'));
    else if (argv[i] === '--wait-for') args.waitFor = argv[++i];
    else if (argv[i] === '--init-script') args.initScript = path.resolve(argv[++i]);
    else if (argv[i] === '--viewport') args.viewport = argv[++i];
    else if (argv[i] === '--out') args.out = path.resolve(argv[++i]);
  }
  return args;
}

// Spec generado en una carpeta temporal: nunca vive en el repo.
function buildSpec(params) {
  const initImport = params.initScript
    ? `import initScript from ${JSON.stringify(params.initScript.split(path.sep).join('/'))};`
    : 'const initScript = null;';
  return `
${initImport}
const P = ${JSON.stringify(params)};

// El registro vive fuera de la ventana: si la app recarga la página
// (ej. un login que redirige con window.location.href), cada ventana
// nueva vuelve a instalar el recorder (window:before:load) y lo capturado
// en las anteriores se conserva.
const REC = { requests: [], errors: [], pending: 0 };

function applyStorage(win) {
  Object.entries(P.storage).forEach(([k, v]) => win.localStorage.setItem(k, v));
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
    uncaughtExceptions: P.uncaught,
    failedStep: P.failure,
    inventory,
    fieldsWithoutTestAttr: fields
  };
}

describe('explore', () => {
  // El informe se escribe en afterEach: si una acción falla (ej. un
  // selector que nunca aparece), igual queda lo capturado hasta ahí.
  afterEach(() => {
    cy.screenshot('explore', { capture: 'fullPage' });
    cy.window().then(win => cy.writeFile(P.outJson, collect(win)));
  });

  it('explore', () => {
    P.uncaught = [];
    P.failure = null;
    Cypress.on('uncaught:exception', err => { P.uncaught.push(String(err.message).slice(0, 300)); return false; });
    Cypress.on('fail', err => { P.failure = String(err.message).slice(0, 300); throw err; });

    Cypress.on('window:before:load', recorder);
    cy.visit(P.url, { onBeforeLoad: applyStorage, failOnStatusCode: false });
    cy.document({ timeout: 15000 }).its('readyState').should('eq', 'complete');
    if (P.waitFor) cy.get(P.waitFor, { timeout: 15000 });
    settle();

    P.actions.forEach(a => {
      if (a.action === 'click') cy.get(a.selector, { timeout: 15000 }).first().click();
      else if (a.action === 'type') cy.get(a.selector, { timeout: 15000 }).first().clear().type(a.value);
      else if (a.action === 'select') cy.get(a.selector, { timeout: 15000 }).first().select(a.value);
      else if (a.action === 'visit') cy.visit(new URL(a.value, P.url).href, { failOnStatusCode: false });
      else if (a.action === 'waitFor') cy.get(a.selector, { timeout: 15000 });
      settle();
    });
  });
});
`;
}

function summarize(report) {
  console.log(`\nURL final: ${report.url}`);
  console.log(`Titulo: ${report.title}`);
  console.log(`Idioma: documento=${report.documentLang} navegador=${report.navigatorLanguage}`);
  if (report.headings.length) console.log(`Encabezados visibles: ${report.headings.slice(0, 8).join(' | ')}`);
  console.log(`localStorage: ${report.localStorageKeys.join(', ') || '(vacio)'} | sessionStorage: ${report.sessionStorageKeys.join(', ') || '(vacio)'}`);

  const groups = new Map();
  for (const r of report.requests) {
    let key;
    try { const u = new URL(r.url); key = `${r.method} ${u.host}${u.pathname}`; } catch { key = `${r.method} ${r.url}`; }
    const g = groups.get(key) || { count: 0, statuses: new Set() };
    g.count++;
    g.statuses.add(r.status === undefined ? 'sin respuesta' : String(r.status));
    groups.set(key, g);
  }
  console.log(`\nRequests (${report.requests.length}, en curso al final: ${report.pendingRequests}):`);
  for (const [key, g] of groups) {
    const method = key.split(' ')[0];
    const flags = [];
    if (!STANDARD_METHODS.includes(method)) flags.push('METODO NO ESTANDAR');
    if ([...g.statuses].some(s => s === '0' || s.startsWith('error') || s === 'sin respuesta')) flags.push('SIN RESPUESTA/FALLIDA');
    console.log(`  ${flags.length ? '⚠ ' : '  '}${key}  x${g.count}  [${[...g.statuses].join(', ')}]${flags.length ? '  <- ' + flags.join(', ') : ''}`);
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

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.url) {
    console.error('Uso: node v3/scripts/explore-page.js --url <url> [--storage \'<json>\'] [--actions <archivo.json>] [--wait-for <selector>] [--init-script <archivo.js>] [--viewport 1280x800] [--out <carpeta>]');
    process.exit(1);
  }

  const host = new URL(args.url).host.replace(/[^a-z0-9.-]/gi, '_');
  const outDir = args.out || path.join(os.tmpdir(), `explore-${host}-${Date.now()}`);
  if (outDir.startsWith(REPO_ROOT + path.sep)) {
    console.error('El informe no puede quedar dentro del repo: usar una carpeta fuera (o el default temporal).');
    process.exit(1);
  }
  const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'explore-project-'));
  fs.mkdirSync(outDir, { recursive: true });
  const outJson = path.join(outDir, 'report.json');
  const [width, height] = args.viewport.split('x').map(Number);

  fs.writeFileSync(path.join(projectDir, 'cypress.config.js'), `module.exports = { e2e: {
  specPattern: 'explore.cy.js', supportFile: false, video: false, screenshotOnRunFailure: true,
  viewportWidth: ${width}, viewportHeight: ${height}, pageLoadTimeout: 20000, defaultCommandTimeout: 15000, retries: 0
} };\n`);
  fs.writeFileSync(path.join(projectDir, 'explore.cy.js'), buildSpec({ url: args.url, storage: args.storage, actions: args.actions, waitFor: args.waitFor, initScript: args.initScript, outJson }));

  console.log(`Explorando ${args.url} con navegador real (Cypress headless)...`);
  const run = spawnSync('npx', ['cypress', 'run', '--project', projectDir, '--quiet'], {
    cwd: REPO_ROOT, encoding: 'utf8', shell: true, maxBuffer: 64 * 1024 * 1024
  });

  const screenshots = path.join(projectDir, 'cypress', 'screenshots');
  if (fs.existsSync(screenshots)) fs.cpSync(screenshots, path.join(outDir, 'screenshots'), { recursive: true });
  fs.rmSync(projectDir, { recursive: true, force: true });

  if (!fs.existsSync(outJson)) {
    console.error('La exploracion no llego a generar el informe. Salida de Cypress:');
    console.error((run.stdout || '').slice(-3000), (run.stderr || '').slice(-2000));
    process.exit(1);
  }

  summarize(JSON.parse(fs.readFileSync(outJson, 'utf8')));
  console.log(`\nInforme completo: ${outJson}`);
  console.log(`Capturas: ${path.join(outDir, 'screenshots')}`);
}

main();
