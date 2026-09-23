/**
 * Validación de la estructura de pasos de los Test Cases ANTES de
 * publicarlos en Xray (ver CLAUDE.md, sección 3: "un paso por acción
 * verificable" y "precondición separada de los pasos").
 *
 * Nace del lote SCRUM-328/338 (2026-09-23): los 16 Test Cases se
 * publicaron todos con exactamente 2 pasos, encadenando 2-3 acciones en
 * un mismo paso y repitiendo el login dentro del Paso 1 -- el mínimo de 2
 * pasos se había tomado como molde. La regla escrita no alcanza: este
 * módulo la hace verificable sin depender de la memoria del modelo.
 *
 * Dos niveles:
 *   - errors: reglas objetivas (menos de 2 pasos, paso sin acción o sin
 *     resultado esperado). Frenan la publicación siempre.
 *   - warnings: heurísticas sobre el texto (acciones encadenadas, login
 *     dentro del Paso 1 sin precondición, lote uniforme de 2 pasos).
 *     Pueden dar falsos positivos, por eso se pueden aceptar
 *     explícitamente con --accept-warnings después de revisarlas.
 *
 * Módulo puro: no habla con Jira/Xray ni lee archivos.
 */

const MIN_STEPS = 2;

// Lotes chicos con 2 pasos uniformes son normales (casos de una sola
// acción); la señal de "molde" solo tiene sentido a partir de varios TC.
const UNIFORM_BATCH_MIN_TESTCASES = 4;

// Verbos de ACCIÓN del usuario (infinitivo) que producen un resultado
// verificable propio. "verificar"/"observar" no cuentan: describen la
// comprobación del resultado, no una acción nueva.
const ACTION_VERBS = [
  'presionar', 'clickear', 'hacer clic', 'hacer click', 'eliminar',
  'filtrar', 'navegar', 'ir a', 'volver', 'recargar', 'guardar', 'enviar',
  'agregar', 'editar', 'expandir', 'colapsar', 'abrir', 'cerrar',
  'iniciar sesion', 'loguearse', 'subir', 'descargar', 'arrastrar',
  'cancelar'
];

// Los verbos de CARGA DE DATOS (ingresar, completar, escribir, tipear,
// reemplazar, seleccionar, marcar) quedan afuera a propósito: "completar X
// y presionar Guardar" es UNA acción con un único resultado verificable
// (cargar y confirmar), no dos pasos.

const SEQUENCE_WORDS = ['luego', 'despues', 'a continuacion'];

const LOGIN_PATTERN = /\b(iniciar sesion|loguearse|login con|ingresar con las credenciales)\b/;

// Una acción negada no es una acción: "navegar a la Home sin iniciar
// sesion" es UN paso, no un login encadenado.
const NEGATED_ACTION_REGEX = /\b(sin|no)\s+(iniciar sesion|loguearse|presionar|guardar)\b/g;

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(NEGATED_ACTION_REGEX, '');
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const ACTION_VERB_REGEX = new RegExp(`\\b(${ACTION_VERBS.map(escapeRegExp).join('|')})\\b`, 'g');
const SEQUENCE_REGEX = new RegExp(`\\b(${SEQUENCE_WORDS.map(escapeRegExp).join('|')})\\b`);

/**
 * Devuelve los verbos de acción encontrados en la descripción de un paso,
 * en orden de aparición (con repetidos: "presionar ... y presionar" son
 * 2 acciones).
 */
function findActionVerbs(description) {
  return normalize(description).match(ACTION_VERB_REGEX) || [];
}

function isBlank(value) {
  return !String(value || '').trim();
}

/**
 * Valida un único Modelo Canónico de Test Case. `label` identifica al TC
 * en los mensajes (ej. "CommitQuality - Eliminar producto > Paginacion...").
 */
function validateTestCaseModel(model, label = model?.name || '(sin nombre)') {
  const errors = [];
  const warnings = [];
  const steps = Array.isArray(model?.steps) ? model.steps : [];

  if (steps.length < MIN_STEPS) {
    errors.push(`${label}: tiene ${steps.length} paso(s), el minimo es ${MIN_STEPS}.`);
  }

  steps.forEach((step, i) => {
    const n = i + 1;
    if (isBlank(step?.description)) {
      errors.push(`${label}: el paso ${n} no tiene accion (description).`);
    }
    if (isBlank(step?.expectedResult)) {
      errors.push(`${label}: el paso ${n} no tiene resultado esperado (expectedResult).`);
    }

    const verbs = findActionVerbs(step?.description);
    if (verbs.length >= 2) {
      warnings.push(`${label}: el paso ${n} parece encadenar ${verbs.length} acciones (${verbs.join(', ')}) -- separar un paso por accion verificable.`);
    } else if (SEQUENCE_REGEX.test(normalize(step?.description))) {
      warnings.push(`${label}: el paso ${n} usa una palabra de secuencia ("luego"/"despues") -- probablemente son 2 pasos.`);
    }
  });

  if (steps.length && LOGIN_PATTERN.test(normalize(steps[0]?.description)) && isBlank(model?.precondition)) {
    warnings.push(`${label}: el paso 1 incluye el login y la precondicion esta vacia -- mover la sesion iniciada a "precondition".`);
  }

  return { errors, warnings };
}

/**
 * Extrae los Test Cases de un payload de --data con su etiqueta: soporta
 * issue único (testcaseModel / testcaseModels) y modo lote (issues: []).
 */
function collectTestCases(payload) {
  const issues = Array.isArray(payload?.issues) ? payload.issues : [payload];
  const collected = [];

  for (const issue of issues) {
    if (!issue) continue;
    const models = [
      ...(issue.testcaseModel ? [issue.testcaseModel] : []),
      ...(Array.isArray(issue.testcaseModels) ? issue.testcaseModels : [])
    ];
    for (const model of models) {
      const prefix = issue.summary ? `${issue.summary} > ` : '';
      collected.push({ model, label: `${prefix}${model?.name || '(sin nombre)'}` });
    }
  }

  return collected;
}

/**
 * Valida todos los Test Cases de un payload de --data. Si el payload no
 * trae Test Cases (ej. solo actualiza una Historia), devuelve listas vacías.
 */
function validatePayload(payload) {
  const testCases = collectTestCases(payload);
  const errors = [];
  const warnings = [];

  for (const { model, label } of testCases) {
    const result = validateTestCaseModel(model, label);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  const allTwoSteps = testCases.every(({ model }) => Array.isArray(model?.steps) && model.steps.length === MIN_STEPS);
  if (testCases.length >= UNIFORM_BATCH_MIN_TESTCASES && allTwoSteps) {
    warnings.push(`Los ${testCases.length} Test Cases del payload tienen exactamente ${MIN_STEPS} pasos -- revisar que el minimo no se este usando como molde.`);
  }

  return { errors, warnings, testCaseCount: testCases.length };
}

module.exports = {
  MIN_STEPS,
  UNIFORM_BATCH_MIN_TESTCASES,
  findActionVerbs,
  validateTestCaseModel,
  collectTestCases,
  validatePayload
};
