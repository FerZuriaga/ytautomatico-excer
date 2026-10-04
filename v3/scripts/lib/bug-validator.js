/**
 * Validación del payload de un Bug antes de publicarlo en Jira (la corre
 * create-jira-task.js, también con --dry-run). Los errores frenan siempre.
 *
 * Estándar del ticket (acordado con el usuario 2026-09-27):
 *   - Secciones: Resumen, Precondiciones, Pasos para reproducir, Resultado
 *     actual, Resultado esperado, Evidencia y Entorno (más Severidad y,
 *     opcional, Prioridad, que clasifican el ticket). Nada más: la vieja
 *     sección "Observaciones" terminaba con listas de Test Cases ("Afecta
 *     al TC SCRUM-559").
 *   - Los Test Cases viven en Xray y las relaciones con otros issues van
 *     como enlaces de Jira (`linkTo`), nunca listados en el texto.
 *   - La Evidencia son hechos observables y medibles, como los vería una
 *     persona usando la app (pantalla, errores de consola exactos,
 *     capturas), sin requests HTTP, rutas ni URLs fuera del Entorno
 *     (2026-09-29, NETWORK_DETAIL_PATTERNS), sin nombrar herramientas internas de la suite (D-31, ver
 *     lib/internal-tools.js) y sin especular sobre el código interno de la aplicación
 *     (nombres de funciones, componentes, condiciones) salvo que aparezcan
 *     en un stack trace real. Caso real: la evidencia del Bug SCRUM-528
 *     explicaba "la condición usa cusAddress.street.errors".
 *   - Captura de pantalla obligatoria (`bug.captura`: ruta o lista de
 *     rutas): un .png real (firma PNG) tomado por explore-page.js durante
 *     el discovery, es decir con el report.json de explore-page en la
 *     carpeta del informe. create-jira-task.js la adjunta al ticket.
 */
const fs = require('fs');
const { findInternalTool, internalToolMessage } = require('./internal-tools');
const path = require('path');
const { config } = require('./qa-config');

const REQUIRED_TEXT = ['resumen', 'precondiciones', 'resultadoActual', 'resultadoEsperado', 'severidad', 'evidencia', 'entorno'];
const ALLOWED = new Set([...REQUIRED_TEXT, 'pasos', 'prioridad', 'captura']);

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// Lectura real de la captura (se inyecta otra en los tests): si es un PNG
// y el report.json de explore-page que la acompaña (hasta 3 carpetas
// arriba: <out>/screenshots/explore.cy.js/explore.png).
function inspectCaptureOnDisk(filePath) {
  const header = Buffer.alloc(PNG_SIGNATURE.length);
  const fd = fs.openSync(filePath, 'r');
  try { fs.readSync(fd, header, 0, header.length, 0); } finally { fs.closeSync(fd); }
  let report = null;
  let dir = path.dirname(filePath);
  for (let i = 0; i < 3 && !report; i++) {
    const candidate = path.join(dir, 'report.json');
    if (fs.existsSync(candidate)) report = JSON.parse(fs.readFileSync(candidate, 'utf8'));
    dir = path.dirname(dir);
  }
  return { png: header.equals(PNG_SIGNATURE), report };
}

function capturesOf(bug) {
  const value = bug.captura;
  return (Array.isArray(value) ? value : [value]).filter(v => typeof v === 'string' && v.trim());
}

function validateCaptures(bug, label, inspectCapture) {
  const captures = capturesOf(bug);
  if (!captures.length) {
    return [`${label}: falta la captura de pantalla -- agregar "captura": "<.png de explore-page.js>" tomada en el navegador real durante el discovery. Sin evidencia gráfica no se publica.`];
  }
  const errors = [];
  for (const capture of captures) {
    if (path.extname(capture).toLowerCase() !== '.png') {
      errors.push(`${label}: la captura "${capture}" no es un archivo .png.`);
      continue;
    }
    let info;
    try {
      info = inspectCapture(capture);
    } catch (err) {
      errors.push(`${label}: no se pudo leer la captura "${capture}" (${err.code || err.message}).`);
      continue;
    }
    if (!info.png) errors.push(`${label}: "${capture}" no es una imagen PNG válida.`);
    if (!info.report || info.report.generator !== 'explore-page') {
      errors.push(`${label}: "${capture}" no la tomó explore-page.js (falta su report.json en la carpeta del informe); la captura tiene que salir del navegador real durante el discovery.`);
    }
  }
  return errors;
}

const TEST_CASE_PATTERNS = [
  /\bTC-\d+(\.\d+)?\b/,
  /\bcasos? de prueba\b/i,
  /\btest ?cases?\b/i,
  /\bciclos? de prueba\b/i,
  /\btest ?cycles?\b/i
];

// Referencias al código interno de la app: llamadas a funciones, `this.x`,
// propiedades encadenadas en camelCase y vocabulario de implementación.
const CODE_PATTERNS = [
  { re: /\b[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*\(\s*[^()]*\)/, what: 'llamada a una función' },
  { re: /\bthis\.[A-Za-z_$]/, what: 'referencia a "this."' },
  { re: /\b[a-z][a-z0-9]*[A-Z][A-Za-z0-9]*\.[A-Za-z_$][\w$]*/, what: 'propiedad del código (camelCase encadenado)' },
  { re: /\b(funci[oó]n|funciones|m[eé]todos?|componentes?|validador(es)?|variables?|handler|callback|FormGroup|FormControl)\b/i, what: 'vocabulario de implementación' },
  { re: /\b(la condici[oó]n|el c[oó]digo|c[oó]digo fuente|la plantilla|el template)\b/i, what: 'descripción del código interno' }
];

const SPECULATION = /\b(probablemente|seguramente|posiblemente|parece que|pareciera|supuestamente|se supone|creo que|creemos|intuyo|asumo|quiz[aá]s?|tal vez)\b/i;

// Un stack trace real ("at fn (archivo.js:10:5)") habilita citar nombres de
// funciones: es lo que la aplicación mostró, no una suposición.
const STACK_TRACE = /\bat\s+\S+\s+\(?[^\s()]+:\d+:\d+\)?/;

// Detalle de red en el texto del Bug (D-22, 2026-09-29): el Bug se redacta
// como lo vería una persona usando la app (pantalla, avisos, captura). Los
// requests, rutas y URLs quedan en docs/discovery; solo "entorno" lleva la
// URL del sitio. Caso real: la evidencia de SCRUM-658 citaba
// "GET /notes/api/notes/?search=Pan%20&%20queso".
const NETWORK_DETAIL_PATTERNS = [
  { re: /\b(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+\/\S*/, what: 'request HTTP' },
  { re: /https?:\/\/\S+/i, what: 'URL' },
  { re: /(^|[\s("'])\/[\w.{}-]+(\/[\w.{}%-]*)*(\?\S*)?/, what: 'ruta' }
];
const NETWORK_DETAIL_ALLOWED_FIELDS = new Set(['entorno']);

function issuesOf(payload) {
  if (payload && Array.isArray(payload.issues)) return payload.issues;
  return payload ? [payload] : [];
}

function isBlank(value) {
  return typeof value !== 'string' || !value.trim();
}

function validateBug(issue, { projectKey = config.jira.projectKey, inspectCapture = inspectCaptureOnDisk } = {}) {
  const label = `Bug "${issue.summary || '(sin summary)'}"`;
  const errors = [];
  const bug = issue.bug;
  if (!bug || typeof bug !== 'object') {
    return { errors: [`${label}: falta el objeto "bug" con las secciones del ticket.`] };
  }

  for (const field of REQUIRED_TEXT) {
    if (isBlank(bug[field])) errors.push(`${label}: falta la sección "${field}".`);
  }
  const steps = Array.isArray(bug.pasos) ? bug.pasos.filter(s => !isBlank(s)) : [];
  if (!steps.length) errors.push(`${label}: falta "pasos" (lista de pasos para reproducir).`);

  errors.push(...validateCaptures(bug, label, inspectCapture));

  for (const field of Object.keys(bug)) {
    if (!ALLOWED.has(field)) {
      errors.push(`${label}: la sección "${field}" no es parte del estándar del Bug (Resumen, Precondiciones, Pasos, Resultado actual, Resultado esperado, Evidencia, Entorno, Severidad, Prioridad).`);
    }
  }

  const issueKey = new RegExp(`\\b${projectKey}-\\d+\\b`);
  const texts = Object.entries(bug).filter(([field]) => field !== 'captura').flatMap(([field, value]) =>
    (Array.isArray(value) ? value : [value]).filter(v => typeof v === 'string').map(v => [field, v]));
  for (const [field, text] of texts) {
    if (TEST_CASE_PATTERNS.some(re => re.test(text))) {
      errors.push(`${label}: "${field}" menciona Test Cases o ciclos; viven en Xray, no en la descripción del Bug.`);
    }
    if (!NETWORK_DETAIL_ALLOWED_FIELDS.has(field)) {
      const network = NETWORK_DETAIL_PATTERNS.map(({ re, what }) => ({ hit: text.match(re), what })).find(({ hit }) => hit);
      if (network) {
        errors.push(`${label}: "${field}" trae detalle de red (${network.what}: "${network.hit[0].trim()}"); el Bug se redacta con lo que se ve en la pantalla y la captura, sin requests, rutas ni URLs (van en docs/discovery). Solo "entorno" lleva la URL del sitio.`);
      }
    }
    const tool = findInternalTool(text);
    if (tool) errors.push(internalToolMessage(`${label}: "${field}"`, tool));
    const key = text.match(issueKey);
    if (key) {
      errors.push(`${label}: "${field}" cita ${key[0]}; las relaciones con otros issues van como enlace de Jira (linkTo), no en el texto.`);
    }
  }

  if (!isBlank(bug.evidencia)) {
    const evidence = bug.evidencia;
    const speculation = evidence.match(SPECULATION);
    if (speculation) {
      errors.push(`${label}: la evidencia especula ("${speculation[0]}"); solo hechos observados y medibles.`);
    }
    if (!STACK_TRACE.test(evidence)) {
      for (const { re, what } of CODE_PATTERNS) {
        const hit = evidence.match(re);
        if (hit) {
          errors.push(`${label}: la evidencia describe el código interno de la aplicación (${what}: "${hit[0]}"); solo se citan nombres del código si aparecen en un stack trace real.`);
          break;
        }
      }
    }
  }

  return { errors };
}

/**
 * Valida todos los Bugs del payload (formato de un issue o lote `issues`).
 * Devuelve { errors, bugCount }.
 */
function validateBugs(payload, options = {}) {
  const bugs = issuesOf(payload).filter(issue => issue && (issue.issuetype === 'Bug' || issue.bug));
  const errors = bugs.flatMap(issue => validateBug(issue, options).errors);
  return { errors, bugCount: bugs.length };
}

module.exports = { validateBug, validateBugs };
