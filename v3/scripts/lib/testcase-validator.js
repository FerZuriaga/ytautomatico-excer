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
 * También valida los Criterios de Aceptación de cada Historia y la
 * relación TC -> CA (campo `criterio: "CA-01"` de cada Test Case). Nace
 * del relevamiento de 2026-09-23: 19 HU con exactamente 2 CA (13 casi
 * seguidas en Automation Test Store, el mínimo usado como molde) y una
 * con 6 (SCRUM-135, que debió partirse):
 *   - errors: HU con menos de 2 CA (falta discovery), CA sin id "CA-XX"
 *     o repetido, TC sin `criterio` o apuntando a un CA inexistente, CA
 *     con menos de 2 TC.
 *   - warnings: HU con más de 4 CA (evaluar split), lote de 2+ HU todas
 *     con exactamente 2 CA, CA con más de 5 TC, y todos los CA con
 *     exactamente 2 TC.
 *
 * Módulo puro: no habla con Jira/Xray ni lee archivos.
 */

const MIN_STEPS = 2;

// Lotes chicos con 2 pasos uniformes son normales (casos de una sola
// acción); la señal de "molde" solo tiene sentido a partir de varios TC.
const UNIFORM_BATCH_MIN_TESTCASES = 4;

// Criterios de Aceptación por Historia (CLAUDE.md: matriz de 2 a 4).
const MIN_CRITERIA = 2;
const MAX_CRITERIA = 4;

// Test Cases por Criterio de Aceptación (piso estricto 2, techo 5).
const MIN_TC_PER_CRITERION = 2;
const MAX_TC_PER_CRITERION = 5;

// Una sola HU con 2 CA puede ser legítima; "lote entero con 2" requiere
// al menos 2 HU. Idem TC por CA: la uniformidad solo es señal con varios CA.
const UNIFORM_CRITERIA_MIN_STORIES = 2;
const UNIFORM_TC_PER_CRITERION_MIN_CRITERIA = 4;

const CRITERION_ID_REGEX = /^\s*(CA-\d{2})\b/i;

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
// sesion" o "verificar el listado (sin filtrar)" es UN paso. Cubre TODOS
// los verbos de acción (la primera versión listaba solo 4 y dio un falso
// positivo real en SCRUM-302 con "sin filtrar").
const NEGATED_ACTION_REGEX = new RegExp(`\\b(sin|no)\\s+(${ACTION_VERBS.map(escapeRegExp).join('|')})\\b`, 'g');

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
function issuesOf(payload) {
  return (Array.isArray(payload?.issues) ? payload.issues : [payload]).filter(Boolean);
}

function modelsOf(issue) {
  return [
    ...(issue.testcaseModel ? [issue.testcaseModel] : []),
    ...(Array.isArray(issue.testcaseModels) ? issue.testcaseModels : [])
  ];
}

function labelOf(issue, model) {
  const prefix = issue.summary ? `${issue.summary} > ` : '';
  return `${prefix}${model?.name || '(sin nombre)'}`;
}

function collectTestCases(payload) {
  return issuesOf(payload).flatMap(issue => modelsOf(issue).map(model => ({ model, label: labelOf(issue, model) })));
}

function normalizeCriterionId(value) {
  const match = String(value || '').match(CRITERION_ID_REGEX);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Valida los Criterios de Aceptación de una Historia (historia.criterios,
 * cada uno con prefijo "CA-XX") y la relación de sus Test Cases con ellos
 * (campo `criterio` de cada Test Case). Una issue sin `historia` (Bug,
 * Tarea, o solo agregar TC a una HU existente) no tiene CA contra los que
 * auditar: solo se valida el formato de `criterio` si viene informado.
 *
 * Devuelve además los conteos que validatePayload necesita para las
 * reglas de uniformidad a nivel lote.
 */
function validateStoryCriteria(issue) {
  const errors = [];
  const warnings = [];
  const story = issue.summary || '(HU sin summary)';
  const models = modelsOf(issue);

  if (!issue.historia) {
    for (const model of models) {
      if (model?.criterio !== undefined && !normalizeCriterionId(model.criterio)) {
        errors.push(`${labelOf(issue, model)}: criterio "${model.criterio}" no tiene formato CA-XX.`);
      }
    }
    return { errors, warnings, criteriaCount: null, tcCountByCriterion: null };
  }

  const criterios = Array.isArray(issue.historia.criterios) ? issue.historia.criterios : [];
  const ids = [];

  criterios.forEach((text, i) => {
    const id = normalizeCriterionId(text);
    if (!id) {
      errors.push(`${story}: el criterio ${i + 1} no empieza con un id "CA-XX" ("${String(text).slice(0, 40)}...") -- necesario para mapear los TC.`);
    } else if (ids.includes(id)) {
      errors.push(`${story}: el criterio ${id} esta repetido.`);
    } else {
      ids.push(id);
    }
  });

  if (criterios.length < MIN_CRITERIA) {
    errors.push(`${story}: tiene ${criterios.length} criterio(s) de aceptacion, el minimo es ${MIN_CRITERIA} -- probablemente falta discovery de reglas de negocio.`);
  } else if (criterios.length > MAX_CRITERIA) {
    warnings.push(`${story}: tiene ${criterios.length} criterios de aceptacion (maximo ${MAX_CRITERIA}) -- evaluar si la HU requiere split.`);
  }

  // Sin Test Cases en el payload (ej. solo se crea/actualiza la HU) no hay
  // relación TC -> CA que auditar.
  if (!models.length) {
    return { errors, warnings, criteriaCount: criterios.length, tcCountByCriterion: null };
  }

  const tcCountByCriterion = Object.fromEntries(ids.map(id => [id, 0]));

  for (const model of models) {
    const label = labelOf(issue, model);
    const id = normalizeCriterionId(model?.criterio);
    if (isBlank(model?.criterio)) {
      errors.push(`${label}: falta el campo "criterio" (ej. "CA-01") para trazar el TC a su criterio de aceptacion.`);
    } else if (!id) {
      errors.push(`${label}: criterio "${model.criterio}" no tiene formato CA-XX.`);
    } else if (!(id in tcCountByCriterion)) {
      errors.push(`${label}: apunta a ${id}, que no existe en los criterios de la HU (${ids.join(', ') || 'ninguno'}).`);
    } else {
      tcCountByCriterion[id]++;
    }
  }

  for (const [id, count] of Object.entries(tcCountByCriterion)) {
    if (count < MIN_TC_PER_CRITERION) {
      errors.push(`${story}: ${id} tiene ${count} Test Case(s), el minimo es ${MIN_TC_PER_CRITERION}.`);
    } else if (count > MAX_TC_PER_CRITERION) {
      warnings.push(`${story}: ${id} tiene ${count} Test Cases (maximo ${MAX_TC_PER_CRITERION}) -- revisar si el criterio no esta agrupando varias reglas.`);
    }
  }

  return { errors, warnings, criteriaCount: criterios.length, tcCountByCriterion };
}

/**
 * Valida todos los Test Cases y Criterios de Aceptación de un payload de
 * --data. Si el payload no trae Test Cases ni Historias (ej. un Bug),
 * devuelve listas vacías.
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

  const criteriaCounts = [];
  const tcPerCriterionCounts = [];
  for (const issue of issuesOf(payload)) {
    const result = validateStoryCriteria(issue);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
    if (result.criteriaCount !== null) criteriaCounts.push(result.criteriaCount);
    if (result.tcCountByCriterion) tcPerCriterionCounts.push(...Object.values(result.tcCountByCriterion));
  }

  if (criteriaCounts.length >= UNIFORM_CRITERIA_MIN_STORIES && criteriaCounts.every(n => n === MIN_CRITERIA)) {
    warnings.push(`Las ${criteriaCounts.length} HU del lote tienen exactamente ${MIN_CRITERIA} criterios de aceptacion -- revisar que el minimo no se este usando como molde (los CA salen de las reglas de negocio relevadas).`);
  }

  if (tcPerCriterionCounts.length >= UNIFORM_TC_PER_CRITERION_MIN_CRITERIA && tcPerCriterionCounts.every(n => n === MIN_TC_PER_CRITERION)) {
    warnings.push(`Los ${tcPerCriterionCounts.length} criterios de aceptacion del payload tienen exactamente ${MIN_TC_PER_CRITERION} Test Cases -- revisar que el minimo no se este usando como molde.`);
  }

  return { errors, warnings, testCaseCount: testCases.length };
}

module.exports = {
  MIN_STEPS,
  UNIFORM_BATCH_MIN_TESTCASES,
  MIN_CRITERIA,
  MAX_CRITERIA,
  MIN_TC_PER_CRITERION,
  MAX_TC_PER_CRITERION,
  findActionVerbs,
  validateTestCaseModel,
  collectTestCases,
  validateStoryCriteria,
  validatePayload
};
