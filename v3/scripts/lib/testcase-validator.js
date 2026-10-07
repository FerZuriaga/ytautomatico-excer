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
 *     con exactamente 2 CA, CA con más de 5 TC, todos los CA con
 *     exactamente 2 TC, y CA sin ningún caso `tipo: "negativo"` (warning y
 *     no error: no todo criterio justifica un caso negativo).
 *
 * validateStoryText audita la REDACCIÓN de la Historia (todo warnings,
 * son heurísticas de texto). Nace de la revisión de SCRUM-305/338/349/
 * 366/374 (2026-09-24): Objetivo escrito como objetivo de prueba
 * ("Verificar..."), rutas y términos técnicos en la HU, usuario genérico,
 * "Para" que repite el "Quiero" y, el caso grave, un CA de SCRUM-338 que
 * exigía que los datos guardados se perdieran al recargar (un defecto
 * relevado en el discovery y documentado como requisito).
 *
 * Lote SCRUM-485/495 (2026-09-26) sumó dos warnings: criterio compuesto
 * (dos reglas unidas con ";" o "además") y paso de relleno (un paso que no
 * es acción del usuario o que repite una anterior para llegar al mínimo).
 *
 * validateStepUpdates cubre la reescritura de pasos de Test Cases ya
 * publicados (`--update-steps`), con las mismas reglas de pasos.
 *
 * Las palabras clave de cada heurística (verbos de acción, de carga, de
 * verificación, conectores, términos técnicos...) vienen de
 * `qa.config.json` (D-43): otro idioma es editar ese archivo, no este.
 *
 * No habla con Jira/Xray; la única lectura es la de la config del proyecto.
 */

const { findInternalTool, internalToolMessage } = require('./internal-tools');
const { config, phrasesRegex, phraseSource } = require('./qa-config');

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

// Campo `tipo` del Test Case: permite auditar "al menos un caso negativo
// por criterio" (regla de la skill especificacion) como WARNING.
const TEST_CASE_TYPES = ['positivo', 'negativo'];

/**
 * Reglas de texto armadas desde las palabras clave de la config (D-43).
 * Qué es cada lista y por qué existe:
 * - verbosDeAccion: acciones del usuario que producen un resultado propio.
 *   "verificar"/"observar" no cuentan: describen la comprobación.
 * - verbosDeCarga: cargar un dato (ingresar, completar...). No son acciones:
 *   los controla "un dato por paso" (D-38, 2026-10-01: pasaron "Completar el
 *   formulario de registro" en SCRUM-766 e "Ingresar con el email y la
 *   contraseña" en SCRUM-769).
 * - articulos + conjuncion + variosDatos: varios datos nombrados en la
 *   acción ("el email y la contraseña", "los campos").
 * - negaciones: una acción negada no es una acción ("navegar sin iniciar
 *   sesion"; falso positivo real en SCRUM-302 con "sin filtrar").
 * - verbosDeVerificacion(ConQue): verificaciones escritas en la Acción
 *   (SCRUM-477, 2026-09-26). "revisar/confirmar" solos son acciones; con
 *   "que" pasan a ser verificaciones.
 * - pasosQueNoSonAccion / pasosRepetidos: pasos de relleno (SCRUM-499/500).
 */
function buildKeywordRules(k) {
  return {
    actionVerb: phrasesRegex(k.verbosDeAccion, { flags: 'g' }),
    inputVerb: phrasesRegex(k.verbosDeCarga),
    inputAtStart: phrasesRegex(k.verbosDeCargaAlInicio, { anchored: true }),
    negatedAction: new RegExp(`${phrasesRegex(k.negaciones).source}\\s+${phrasesRegex(k.verbosDeAccion).source}`, 'g'),
    severalInputs: new RegExp(`${phrasesRegex(k.articulos).source}\\s+[a-z]+(\\s+[a-z]+)?\\s+${phraseSource(k.conjuncion)}\\s+${phrasesRegex(k.articulos).source}\\s+[a-z]+|${phrasesRegex(k.variosDatos).source}`),
    sequence: phrasesRegex(k.palabrasDeSecuencia),
    login: phrasesRegex(k.frasesDeLogin),
    verifyInAction: new RegExp(`${phrasesRegex(k.verbosDeVerificacion).source}|${phrasesRegex(k.verbosDeVerificacionConQue).source}\\s+${phraseSource(k.conector)}`),
    nonActionStep: phrasesRegex(k.pasosQueNoSonAccion, { anchored: true }),
    repeatedStep: phrasesRegex(k.pasosRepetidos),
    testObjective: phrasesRegex(k.objetivoDePrueba, { anchored: true }),
    technicalTerms: phrasesRegex(k.terminosTecnicos, { flags: 'g' }),
    genericPersona: new RegExp(`^\\s*(${phrasesRegex(k.personaGenerica.articulos).source}\\s+)?${phrasesRegex(k.personaGenerica.palabras).source}(\\s+${phrasesRegex(k.personaGenerica.preposiciones).source}\\s+[^,]+)?\\s*$`),
    dataLoss: phrasesRegex(k.perdidaDeDatos),
    ruleConnectors: phrasesRegex(k.conectoresDeReglas),
    ruleConnectorList: k.conectoresDeReglas,
    impossibility: phrasesRegex(k.imposibilidad),
    observableOutcome: phrasesRegex(k.resultadoObservable),
    stopwords: new Set(k.palabrasVaciasHistoria)
  };
}

let K = buildKeywordRules(config.validadores.palabrasClave);

/**
 * Cambia las palabras clave en uso (tests, u otro idioma en un mismo
 * proceso). Devuelve las anteriores para restaurarlas.
 */
let currentKeywords = config.validadores.palabrasClave;
function useKeywords(keywords) {
  const previous = currentKeywords;
  K = buildKeywordRules(keywords);
  currentKeywords = keywords;
  return previous;
}

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(K.negatedAction, '');
}

/**
 * Devuelve los verbos de acción encontrados en la descripción de un paso,
 * en orden de aparición (con repetidos: "presionar ... y presionar" son
 * 2 acciones).
 */
function findActionVerbs(description) {
  return normalize(description).match(K.actionVerb) || [];
}

function isBlank(value) {
  return !String(value || '').trim();
}

function isBlankData(value) {
  return isBlank(value) || String(value).trim() === '-';
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

  if (model?.tipo !== undefined && !TEST_CASE_TYPES.includes(normalize(model.tipo))) {
    errors.push(`${label}: tipo "${model.tipo}" invalido (valores posibles: ${TEST_CASE_TYPES.join(', ')}).`);
  }

  steps.forEach((step, i) => {
    const n = i + 1;
    if (isBlank(step?.description)) {
      errors.push(`${label}: el paso ${n} no tiene accion (description).`);
    }
    if (isBlank(step?.expectedResult)) {
      errors.push(`${label}: el paso ${n} no tiene resultado esperado (expectedResult).`);
    }

    const verification = normalize(step?.description).match(K.verifyInAction);
    if (verification) {
      errors.push(`${label}: el paso ${n} incluye una verificacion en la accion ("${verification[0]}") -- la accion describe solo lo que hace el usuario; lo que se controla va en el resultado esperado.`);
    }

    // Dato de entrada escrito dentro de la acción: va en la columna Datos
    // (testData), así un cambio del seed se corrige solo en el dato.
    const description = String(step?.description || '');
    if (K.inputAtStart.test(normalize(description)) && /"[^"]+"/.test(description) && isBlankData(step?.testData)) {
      warnings.push(`${label}: el paso ${n} escribe un dato entre comillas en la accion y la columna Datos esta vacia -- mover el dato a testData.`);
    }

    const normalizedDescription = normalize(step?.description);
    if (K.nonActionStep.test(normalizedDescription)) {
      warnings.push(`${label}: el paso ${n} no describe una accion del usuario ("${String(step.description).trim().split(/\s+/)[0]}...") -- si no agrega un resultado nuevo es relleno; lo observado va en el resultado esperado del paso anterior.`);
    } else if (K.repeatedStep.test(normalizedDescription)) {
      warnings.push(`${label}: el paso ${n} repite una accion anterior ("${normalizedDescription.match(K.repeatedStep)[0]}") -- confirmar que produce un resultado nuevo; si no, es relleno.`);
    }

    // Un dato por paso (D-38): los Datos de un paso con varios valores
    // separados por ";" son varios campos cargados en una sola acción.
    const dataParts = String(step?.testData || '').split(';').map(part => part.trim()).filter(part => part && part !== '-');
    if (dataParts.length >= 2) {
      errors.push(`${label}: el paso ${n} carga ${dataParts.length} datos en una sola accion (${dataParts.join(' | ')}) -- un paso por dato: cada campo que se completa es su propio paso.`);
    }

    const verbs = findActionVerbs(step?.description);
    const loadsData = K.inputVerb.test(normalizedDescription);
    if (verbs.length >= 2) {
      warnings.push(`${label}: el paso ${n} parece encadenar ${verbs.length} acciones (${verbs.join(', ')}) -- separar un paso por accion verificable.`);
    } else if (loadsData && verbs.length === 1) {
      warnings.push(`${label}: el paso ${n} carga un dato y ademas hace otra accion (${verbs[0]}) -- separar: un paso para el dato y otro para la accion.`);
    } else if (loadsData && K.severalInputs.test(normalizedDescription)) {
      warnings.push(`${label}: el paso ${n} parece cargar varios datos a la vez ("${normalizedDescription.match(K.severalInputs)[0]}") -- un paso por campo.`);
    } else if (K.sequence.test(normalize(step?.description))) {
      warnings.push(`${label}: el paso ${n} usa una palabra de secuencia ("${normalize(step?.description).match(K.sequence)[0]}") -- probablemente son 2 pasos.`);
    }
  });

  // Nombres internos de la suite fuera de Jira/Xray (D-31).
  const tcTexts = [['el nombre', model?.name], ['el objetivo', model?.objective], ['la precondicion', model?.precondition],
    ...steps.flatMap((step, i) => [[`el paso ${i + 1}`, step?.description], [`los datos del paso ${i + 1}`, step?.testData], [`el resultado del paso ${i + 1}`, step?.expectedResult]])];
  for (const [where, text] of tcTexts) {
    const hit = findInternalTool(text);
    if (hit) errors.push(internalToolMessage(`${label}: ${where}`, hit));
  }

  if (steps.length && K.login.test(normalize(steps[0]?.description)) && isBlank(model?.precondition)) {
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
 *
 * `existingTestCases` ([{ key, criterio, tipo }]): Test Cases ya publicados
 * de la HU cuando se le suma uno nuevo (create-jira-task con issueKey);
 * cuentan para el mínimo por CA y para el caso negativo.
 */
function validateStoryCriteria(issue, existingTestCases = []) {
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
  const negativeCountByCriterion = Object.fromEntries(ids.map(id => [id, 0]));
  const sinNegativo = issue.historia.sinNegativo && typeof issue.historia.sinNegativo === 'object' ? issue.historia.sinNegativo : {};

  for (const existing of existingTestCases) {
    const id = normalizeCriterionId(existing.criterio);
    if (!id || !(id in tcCountByCriterion)) continue;
    tcCountByCriterion[id]++;
    if (existing.tipo === 'negativo') negativeCountByCriterion[id]++;
  }

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
      if (normalize(model?.tipo) === 'negativo') negativeCountByCriterion[id]++;
    }
  }

  for (const [id, count] of Object.entries(tcCountByCriterion)) {
    if (count < MIN_TC_PER_CRITERION) {
      errors.push(`${story}: ${id} tiene ${count} Test Case(s), el minimo es ${MIN_TC_PER_CRITERION}.`);
    } else if (count > MAX_TC_PER_CRITERION) {
      warnings.push(`${story}: ${id} tiene ${count} Test Cases (maximo ${MAX_TC_PER_CRITERION}) -- revisar si el criterio no esta agrupando varias reglas.`);
    }
    // WARNING y no error, a propósito: no todo criterio justifica un caso
    // negativo (ej. "el archivo descargado tiene el contenido exacto").
    // Si el payload lo justifica en historia.sinNegativo["CA-XX"], no
    // avisa: la excepción queda escrita en la HU (auditable) en lugar de
    // aceptarse con un --accept-warnings global.
    if (count > 0 && negativeCountByCriterion[id] === 0 && isBlank(sinNegativo[id])) {
      warnings.push(`${story}: ${id} no tiene ningun caso negativo (tipo: "negativo") -- agregarlo o justificarlo en historia.sinNegativo["${id}"].`);
    }
  }

  for (const [key, motivo] of Object.entries(sinNegativo)) {
    const id = normalizeCriterionId(key);
    if (!id || !(id in tcCountByCriterion)) {
      errors.push(`${story}: historia.sinNegativo apunta a "${key}", que no es un criterio de la HU (${ids.join(', ') || 'ninguno'}).`);
    } else if (isBlank(motivo)) {
      errors.push(`${story}: historia.sinNegativo["${id}"] no tiene motivo -- la justificacion es obligatoria.`);
    } else if (negativeCountByCriterion[id] > 0) {
      warnings.push(`${story}: ${id} ya tiene casos negativos -- sobra la justificacion en historia.sinNegativo.`);
    }
  }

  return { errors, warnings, criteriaCount: criterios.length, tcCountByCriterion };
}

// Palabras clave de la redacción de la HU (config, D-43):
// - objetivoDePrueba: verbos que delatan un Objetivo escrito como objetivo
//   de prueba ("Verificar..."); el Objetivo es un resultado de negocio.
// - terminosTecnicos: detalle de implementación prohibido en la HU (va en
//   el PR, en docs/discovery o en la precondición del TC).
// - personaGenerica: "usuario", "usuario de CommitQuality" (sin rol).
// - perdidaDeDatos: un CA que exige perder datos suele ser un defecto
//   relevado en el discovery (caso real: SCRUM-338 CA-04).

// Rutas de la app ("/account", "/practice-file-upload") y URLs completas.
const ROUTE_REGEX = /(^|[\s('"])(\/[a-z0-9][a-z0-9_-]*(\/[a-z0-9_-]+)*)(?=$|[\s)'".,;:])|https?:\/\//;

// CA compuesto (acordado 2026-09-26 tras SCRUM-485 CA-03, que juntaba
// "bloqueo tras 3 intentos" y "el exito reinicia el conteo" con ";"): cada
// parte con al menos 4 palabras cuenta como una regla. Heurística: la
// separación la decide quien escribe, el validador solo avisa.
// Lote SCRUM-502 (2026-09-26) sumó los conectores que esquivaban el ";":
// "mientras que", "en cambio", "y si no" y ", y sin" (la regla opuesta:
// "con sesión avanza…, mientras que sin sesión se le pide…").
// Lote SCRUM-804 (2026-10-02, D-39) sumó las condiciones que esconden otra
// regla dentro del camino feliz: "la nueva reemplaza a la actual solo si es
// distinta de ella" juntaba el reemplazo con "distinta de la actual" para
// que esa regla llegara al mínimo de 2 TC.
const MIN_CLAUSE_WORDS = 4;

// Conectores en config (conectoresDeReglas).
function compoundClauses(text) {
  const body = normalize(text).replace(CRITERION_ID_REGEX, '').replace(/^\s*:/, '');
  return body
    .split(new RegExp(K.ruleConnectors.source))
    .filter(part => part.split(/\s+/).filter(Boolean).length >= MIN_CLAUSE_WORDS)
    .length;
}

// CA abstracto (D-39, lote SCRUM-821 2026-10-02): "ya no se puede ingresar
// con ella" no dice qué ve el usuario. Avisa una imposibilidad (config:
// imposibilidad) que no nombra el resultado observable (config:
// resultadoObservable) ni cita un texto entre comillas.
function abstractOutcome(text) {
  const normalized = normalize(text);
  return K.impossibility.test(normalized) && !/["“”]/.test(String(text)) && !K.observableOutcome.test(normalized);
}

function contentWords(text) {
  return new Set(normalize(text).split(/[^a-z0-9]+/).filter(w => w.length >= 4 && !K.stopwords.has(w)));
}

/**
 * Audita la redacción de una Historia (historia.como/quiero/para/contexto/
 * objetivo/criterios). Solo warnings: son heurísticas de texto, pueden dar
 * falsos positivos y se aceptan con --accept-warnings tras revisarlas.
 * Lo que no se puede detectar por texto (ej. un "Para" que repite el
 * "Quiero" con sinónimos) lo cubre la regla de la skill especificacion.
 */
const STORY_REQUIRED = ['como', 'quiero', 'para', 'contexto', 'objetivo'];

function validateStoryText(issue) {
  const errors = [];
  const warnings = [];
  const historia = issue?.historia;
  if (!historia) return { errors: [], warnings };
  const story = issue.summary || '(HU sin summary)';

  // La plantilla de Jira (jira.buildHistoriaDescription) escribe estas
  // secciones siempre: una vacía llegaba como texto vacío y Jira rechazaba
  // la HU recién al publicar (ParaBank, 2026-10-05, sin "contexto").
  if (!issue.issueKey) {
    const missing = STORY_REQUIRED.filter(field => isBlank(historia[field]));
    if (missing.length) errors.push(`${story}: faltan secciones de la Historia: ${missing.join(', ')}.`);
  }

  if (!isBlank(historia.como) && K.genericPersona.test(normalize(historia.como))) {
    warnings.push(`${story}: "Como ${historia.como}" es un usuario generico -- indicar el rol concreto que obtiene el beneficio (ej. "administrador del catalogo").`);
  }

  if (!isBlank(historia.quiero) && !isBlank(historia.para)) {
    const quiero = contentWords(historia.quiero);
    const para = [...contentWords(historia.para)];
    if (para.length && para.filter(w => quiero.has(w)).length / para.length >= 0.5) {
      warnings.push(`${story}: el "Para" repite el "Quiero" -- el "Para" es el beneficio de negocio, no la misma accion.`);
    }
  }

  if (K.testObjective.test(normalize(historia.objetivo))) {
    warnings.push(`${story}: el Objetivo esta escrito como objetivo de prueba ("${String(historia.objetivo).trim().split(/\s+/)[0]}...") -- describir el resultado de negocio; lo que se verifica va en los Test Cases.`);
  }

  const criterios = Array.isArray(historia.criterios) ? historia.criterios : [];
  const sections = [
    ['Quiero', historia.quiero], ['Para', historia.para],
    ['Contexto', historia.contexto], ['Objetivo', historia.objetivo],
    ...criterios.map((text, i) => [normalizeCriterionId(text) || `criterio ${i + 1}`, text])
  ];
  for (const [name, text] of sections) {
    if (isBlank(text)) continue;
    const route = normalize(text).match(ROUTE_REGEX);
    if (route) {
      warnings.push(`${story}: ${name} menciona una ruta/URL ("${(route[2] || route[0]).trim()}") -- la HU no lleva rutas; van en la precondicion del Test Case o en docs/discovery.`);
    }
    const terms = [...new Set(normalize(text).match(K.technicalTerms) || [])];
    if (terms.length) {
      warnings.push(`${story}: ${name} tiene detalle tecnico (${terms.join(', ')}) -- describir el comportamiento en lenguaje de negocio.`);
    }
  }

  for (const text of criterios) {
    const clauses = compoundClauses(text);
    if (clauses > 1) {
      warnings.push(`${story}: ${normalizeCriterionId(text) || 'un criterio'} parece combinar ${clauses} reglas (separadas por ${K.ruleConnectorList.map(c => `"${c}"`).join(', ')}) -- una regla por criterio; si la segunda parte es el caso negativo o la definicion de la misma regla, redactarla como una sola oracion. Nunca juntar una regla en otro CA para llegar al minimo de 2 TC: buscarle su segundo TC (D-39).`);
    }
    if (abstractOutcome(text)) {
      warnings.push(`${story}: ${normalizeCriterionId(text) || 'un criterio'} dice lo que no se puede hacer sin nombrar el resultado observable -- decir que ve el usuario (el aviso, la pantalla a la que lleva); si hay dos caminos que fallan por separado (ej. login y sesion abierta), son dos CA (D-39).`);
    }
    if (K.dataLoss.test(normalize(text))) {
      warnings.push(`${story}: ${normalizeCriterionId(text) || 'un criterio'} exige perder o revertir datos -- si contradice el "Para" de la HU es un defecto (Bug o limitacion conocida), no un criterio de aceptacion.`);
    }
  }

  // Nombres internos de la suite fuera de Jira/Xray (D-31).
  const listed = value => (Array.isArray(value) ? value : [value]);
  const storyTexts = [
    ['el summary', issue.summary], ['Como', historia.como], ['Quiero', historia.quiero], ['Para', historia.para],
    ['Contexto', historia.contexto], ['Objetivo', historia.objetivo],
    ...criterios.map((text, i) => [normalizeCriterionId(text) || `criterio ${i + 1}`, text]),
    ...listed(historia.reglasNegocio).map(text => ['reglasNegocio', text]),
    ...listed(historia.fueraDeAlcance).map(text => ['fueraDeAlcance', text]),
    ...listed(historia.defectosConocidos).map(text => ['defectosConocidos', text]),
    ...Object.entries(historia.sinNegativo || {}).map(([id, text]) => [`sinNegativo ${id}`, text])
  ];
  for (const [name, text] of storyTexts) {
    const hit = findInternalTool(text);
    if (hit) errors.push(internalToolMessage(`${story}: ${name}`, hit));
  }

  return { errors, warnings };
}

/**
 * Valida todos los Test Cases y Criterios de Aceptación de un payload de
 * --data. Si el payload no trae Test Cases ni Historias (ej. un Bug),
 * devuelve listas vacías.
 */
function validatePayload(payload, { existingTestCases = [] } = {}) {
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
    const result = validateStoryCriteria(issue, existingTestCases);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
    const storyText = validateStoryText(issue);
    errors.push(...storyText.errors);
    warnings.push(...storyText.warnings);
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

/**
 * Borrador de la pausa del lote (--dry-run --borrador): las HU con sus CA
 * y una línea por TC ({ criterio, tipo, name }, sin pasos). Corre las
 * reglas de la HU y de los CA (dos reglas en un CA, mínimo de TC por CA,
 * negativo), no las de los pasos. Nace del 2026-10-07 (RBP habitaciones):
 * CA-01 y CA-03 llegaron a la aprobación del usuario con dos reglas cada
 * uno y el validador recién lo vio en el dry-run del payload completo.
 */
function validateDraft(payload) {
  const errors = [];
  const warnings = [];
  for (const issue of issuesOf(payload)) {
    for (const result of [validateStoryCriteria(issue), validateStoryText(issue)]) {
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    }
  }
  return { errors, warnings };
}

const ISSUE_KEY_REGEX = /^[A-Z][A-Z0-9]+-\d+$/;

/**
 * Valida el payload de `create-jira-task.js --update-steps`: reescritura
 * de pasos (y precondición) de Test Cases YA publicados.
 *   { "testcases": [ { "key": "SCRUM-335", "precondition": "...", "steps": [...] } ] }
 * Cada Test Case pasa por las mismas reglas de pasos que una publicación
 * nueva (validateTestCaseModel). Todo o nada: el CLI no aplica ninguna
 * actualización si hay errores (o warnings sin --accept-warnings).
 */
function validateStepUpdates(payload) {
  const errors = [];
  const warnings = [];
  const testcases = payload?.testcases;

  if (!Array.isArray(testcases) || !testcases.length) {
    errors.push('--update-steps: el payload debe traer "testcases": [ { key, precondition, steps } ] con al menos un elemento.');
    return { errors, warnings, testCaseCount: 0 };
  }

  const seen = new Set();
  testcases.forEach((tc, i) => {
    const key = String(tc?.key || '').trim();
    if (!ISSUE_KEY_REGEX.test(key)) {
      errors.push(`--update-steps: el elemento ${i + 1} no tiene un "key" valido (ej. "SCRUM-335").`);
      return;
    }
    if (seen.has(key)) {
      errors.push(`--update-steps: ${key} esta repetido en el payload.`);
      return;
    }
    seen.add(key);
    // `criterio` es opcional: mueve el Test Case a otro CA (cambia su label).
    if (tc.criterio !== undefined && !/^CA-\d{2}$/.test(String(tc.criterio).trim().toUpperCase())) {
      errors.push(`--update-steps: ${key} tiene un "criterio" invalido ("${tc.criterio}"); el formato es CA-XX (ej. "CA-05").`);
    }
    const result = validateTestCaseModel(tc, key);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  });

  return { errors, warnings, testCaseCount: testcases.length };
}

module.exports = {
  MIN_STEPS,
  TEST_CASE_TYPES,
  UNIFORM_BATCH_MIN_TESTCASES,
  MIN_CRITERIA,
  MAX_CRITERIA,
  MIN_TC_PER_CRITERION,
  MAX_TC_PER_CRITERION,
  findActionVerbs,
  useKeywords,
  validateTestCaseModel,
  collectTestCases,
  validateStoryCriteria,
  validateStoryText,
  validatePayload,
  validateDraft,
  validateStepUpdates
};
