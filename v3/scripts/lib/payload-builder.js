/**
 * Armador oficial del payload de publicación (PASO 2): convierte un
 * archivo de lote declarativo en el payload que consume
 * create-jira-task.js (formato de un issue o modo lote `issues`).
 *
 * Nace del 2026-09-28: cada lote reescribía un build-*.js suelto con los
 * mismos ayudantes (numerar pasos, numerar TC por CA, armar la evidencia
 * del negativo, carpeta, ciclo). Con este formato el lote escribe solo los
 * datos de sus Test Cases; la validación sigue siendo la de siempre
 * (testcase-validator, negative-evidence) sobre el payload ya armado.
 *
 * Formato (`"formato": "lote"`):
 * {
 *   "formato": "lote",
 *   "comun": {
 *     "folder": "/App/Modulo",          // carpeta de Xray de todos los TC
 *     "precondicion": "...",            // default de cada TC
 *     "evidencias": "exp-lote",         // carpeta de --out de explore-page
 *                                       // (relativa al archivo del lote)
 *     "projectKey": "SCRUM"             // opcional (default: jira.projectKey de qa.config.json)
 *   },
 *   "datos": { "D": "Pintura, rodillos y cinta" },   // usables como {{D}}
 *   "pasos": {                                        // pasos con nombre
 *     "ABRIR": { "description": "Hacer clic en \"+ Add Note\"", "expectedResult": "Se abre ..." },
 *     "CREAR_KO": { "description": "Hacer clic en \"Create\"", "expectedResult": "{{texto}} La nota no se crea." }
 *   },
 *   "historias": [{
 *     "summary": "Notes App - Crear una nota",
 *     "historia": { como, quiero, para, ..., criterios, sinNegativo? },
 *     "ciclo": "nombre del Test Cycle",   // opcional (default: summary)
 *     "cicloKey": "SCRUM-622",            // opcional: reutiliza un ciclo publicado
 *     "casos": [{
 *       "criterio": "CA-02", "tipo": "negativo", "prioridad": "High",
 *       "nombre": "...", "objetivo": "...", "escenario": "Datos de la nota",
 *       "precondicion": "...",            // opcional (default: comun)
 *       "tc": "TC-02.5",                  // opcional (default: correlativo por CA)
 *       "pasos": ["ABRIR",
 *                 { "usa": "CREAR_KO", "texto": "Se muestra \"Title is required\"." },
 *                 { "description": "Recargar la página", "expectedResult": "..." }],
 *       "evidencia": { "escenario": "vacio", "observado": "..." }
 *                   // o { "reporte": "ruta/report.json", "observado": "..." }
 *     }]
 *   }]
 * }
 *
 * Un paso con "usa" toma el paso con nombre; sus otras claves son
 * parámetros de las plantillas ({{texto}}) o reemplazan description /
 * testData / expectedResult. Las plantillas buscan primero en los
 * parámetros del paso y después en "datos"; una plantilla sin valor es
 * error (nunca se publica "{{texto}}" literal). testData por defecto: "-".
 *
 * Una historia arma el formato de un issue (sirve también para sumar TC a
 * una HU publicada, con issueKey y "cicloKey"); varias, el modo lote.
 * Lógica pura: no lee archivos ni habla con Jira/Xray.
 */
const path = require('path');
const { config } = require('./qa-config');

const STEP_FIELDS = ['description', 'testData', 'expectedResult'];
const TEMPLATE_REGEX = /\{\{\s*([A-Za-z_][\w]*)\s*\}\}/g;
const CRITERION_REGEX = /^CA-(\d{2})$/;

function isBuildSpec(data) {
  return Boolean(data) && data.formato === 'lote';
}

function fill(text, params, where, errors) {
  if (typeof text !== 'string') return text;
  return text.replace(TEMPLATE_REGEX, (match, name) => {
    if (params && Object.prototype.hasOwnProperty.call(params, name)) return String(params[name]);
    errors.push(`${where}: la plantilla {{${name}}} no tiene valor (ni en el paso ni en "datos").`);
    return match;
  });
}

function buildStep(ref, library, datos, where, errors) {
  let base = {};
  let params = {};
  let own = {};
  if (typeof ref === 'string') {
    if (!library[ref]) {
      errors.push(`${where}: el paso "${ref}" no existe en "pasos" (disponibles: ${Object.keys(library).join(', ') || 'ninguno'}).`);
      return null;
    }
    base = library[ref];
  } else if (ref && typeof ref === 'object') {
    if (ref.usa !== undefined) {
      if (!library[ref.usa]) {
        errors.push(`${where}: el paso "${ref.usa}" no existe en "pasos" (disponibles: ${Object.keys(library).join(', ') || 'ninguno'}).`);
        return null;
      }
      base = library[ref.usa];
    }
    for (const [key, value] of Object.entries(ref)) {
      if (key === 'usa') continue;
      if (STEP_FIELDS.includes(key)) own[key] = value;
      else params[key] = value;
    }
  } else {
    errors.push(`${where}: un paso es un nombre de "pasos" o un objeto.`);
    return null;
  }

  // Un parámetro puede usar datos ({ "texto": "... {{D}} ..." }): se
  // resuelve antes de entrar a la plantilla del paso.
  const values = { ...datos };
  for (const [key, value] of Object.entries(params)) values[key] = fill(value, datos, `${where} (${key})`, errors);
  for (const key of Object.keys(own)) own[key] = fill(own[key], datos, `${where} (${key})`, errors);
  const step = {};
  for (const field of STEP_FIELDS) {
    const raw = own[field] !== undefined ? own[field] : base[field];
    step[field] = fill(raw, values, `${where} (${field})`, errors);
  }
  if (step.testData === undefined || step.testData === '') step.testData = '-';
  if (!step.description) errors.push(`${where}: falta description.`);
  if (!step.expectedResult) errors.push(`${where}: falta expectedResult.`);
  return step;
}

function evidenceOf(caso, comun, baseDir, where, errors) {
  const ev = caso.evidencia;
  if (!ev) return null;
  if (typeof ev !== 'object' || !ev.observado) {
    errors.push(`${where}: "evidencia" lleva { escenario | reporte, observado }.`);
    return null;
  }
  if (ev.reporte) return { reporte: path.resolve(baseDir, ev.reporte), observado: ev.observado };
  if (!ev.escenario) {
    errors.push(`${where}: "evidencia" necesita "escenario" (nombre en explore-page) o "reporte".`);
    return null;
  }
  if (!comun.evidencias) {
    errors.push(`${where}: "evidencia.escenario" necesita "comun.evidencias" (carpeta --out de explore-page).`);
    return null;
  }
  return { reporte: path.resolve(baseDir, comun.evidencias, ev.escenario, 'report.json'), observado: ev.observado };
}

/**
 * spec: archivo de lote ya parseado. baseDir: carpeta del archivo, contra
 * la que se resuelven las rutas de evidencia. Devuelve el payload o lanza
 * un Error con TODOS los problemas encontrados (no el primero).
 */
function buildPayload(spec, { baseDir = process.cwd() } = {}) {
  const errors = [];
  if (!isBuildSpec(spec)) throw new Error('El archivo no es un lote: falta "formato": "lote".');
  const comun = spec.comun || {};
  const datos = spec.datos || {};
  const library = spec.pasos || {};
  const historias = Array.isArray(spec.historias) ? spec.historias : [];
  if (!historias.length) errors.push('"historias" tiene que traer al menos una Historia.');

  const issues = historias.map((h, hi) => {
    const hWhere = `historias[${hi}]${h.summary ? ` (${h.summary})` : ''}`;
    if (!h.summary) errors.push(`${hWhere}: falta summary.`);
    if (!h.historia) errors.push(`${hWhere}: falta historia.`);
    const casos = Array.isArray(h.casos) ? h.casos : [];
    if (!casos.length) errors.push(`${hWhere}: "casos" está vacío.`);

    const counters = {};
    const models = casos.map((caso, ci) => {
      const where = `${hWhere} caso ${ci + 1}${caso.nombre ? ` "${caso.nombre}"` : ''}`;
      for (const field of ['criterio', 'tipo', 'prioridad', 'nombre', 'objetivo']) {
        if (!caso[field]) errors.push(`${where}: falta "${field}".`);
      }
      const criterio = String(caso.criterio || '').trim().toUpperCase();
      const match = criterio.match(CRITERION_REGEX);
      if (caso.criterio && !match) errors.push(`${where}: criterio "${caso.criterio}" no tiene el formato CA-XX.`);

      let testCase = caso.tc;
      if (match) {
        if (testCase) {
          const n = Number(String(testCase).split('.')[1]);
          if (!Number.isNaN(n)) counters[criterio] = Math.max(counters[criterio] || 0, n);
        } else {
          counters[criterio] = (counters[criterio] || 0) + 1;
          testCase = `TC-${match[1]}.${counters[criterio]}`;
        }
      }

      const pasos = Array.isArray(caso.pasos) ? caso.pasos : [];
      if (!pasos.length) errors.push(`${where}: "pasos" está vacío.`);
      const steps = pasos
        .map((ref, si) => buildStep(ref, library, datos, `${where} paso ${si + 1}`, errors))
        .filter(Boolean)
        .map((step, si) => ({ inline: si + 1, ...step }));

      const precondition = fill(caso.precondicion || comun.precondicion, datos, `${where} (precondicion)`, errors);
      if (!precondition) errors.push(`${where}: falta la precondición (en el caso o en "comun.precondicion").`);

      const model = {
        projectKey: comun.projectKey || config.jira.projectKey,
        statusName: config.jira.testCaseStatus,
        labels: [],
        folder: caso.folder || comun.folder,
        priorityName: caso.prioridad,
        name: fill(caso.nombre, datos, `${where} (nombre)`, errors),
        objective: fill(caso.objetivo, datos, `${where} (objetivo)`, errors),
        precondition,
        criterio,
        tipo: caso.tipo,
        steps,
        traceability: { scenario: caso.escenario || h.summary, testCase }
      };
      if (!model.folder) errors.push(`${where}: falta la carpeta de Xray ("comun.folder").`);
      const evidencia = evidenceOf(caso, comun, baseDir, where, errors);
      if (evidencia) model.evidencia = evidencia;
      return model;
    });

    const testCycle = h.cicloKey
      ? { key: h.cicloKey }
      : { name: h.ciclo || h.summary, description: `Ciclo de ejecución de la HU ${h.summary}`, statusName: config.jira.testCycleStatus };
    return { issuetype: 'Historia', summary: h.summary, historia: h.historia, testCycle, testcaseModels: models };
  });

  if (errors.length) {
    throw new Error(`Lote inválido (${errors.length} problema(s)):\n  ${errors.join('\n  ')}`);
  }
  return issues.length === 1 ? issues[0] : { issues };
}

// Formas de payload que create-jira-task.js sabe publicar. Caso real
// (2026-09-28): un archivo de lote pasado sin armar dio "validación
// completa" en --dry-run con 0 Test Cases revisados.
const KNOWN_ISSUE_KEYS = ['historia', 'bug', 'tarea', 'steps', 'testcaseModel', 'testcaseModels'];

function unknownShapeError(data, { updateSteps = false } = {}) {
  if (!data || typeof data !== 'object') return 'El JSON de --data no es un objeto.';
  if (updateSteps) return Array.isArray(data.testcases) ? null : '--update-steps espera { "testcases": [ ... ] }.';
  if (data.formato !== undefined && data.formato !== 'lote') return `"formato": "${data.formato}" no existe (el único es "lote").`;
  const issues = Array.isArray(data.issues) ? data.issues : [data];
  const unknown = issues.findIndex(issue => !issue || !KNOWN_ISSUE_KEYS.some(key => issue[key] !== undefined));
  if (unknown === -1) return null;
  const hint = Array.isArray(data.historias) ? ' Parece un archivo de lote: falta "formato": "lote".' : '';
  return `${Array.isArray(data.issues) ? `issues[${unknown}]` : 'El JSON de --data'} no trae ninguna de ${KNOWN_ISSUE_KEYS.join(', ')}: no hay nada que validar ni publicar.${hint}`;
}

module.exports = { isBuildSpec, buildPayload, unknownShapeError };
