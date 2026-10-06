/**
 * Contrato del adapter del gestor de pruebas (hoy lib/xray.js).
 *
 * Es lo que los CLIs (create-jira-task.js, run-and-report.js,
 * check-traceability.js) le piden al gestor, y nada más. Otro gestor
 * (Zephyr, TestRail, Azure Test Plans) es un archivo nuevo que exporta
 * estas funciones con estas formas; los CLIs, los validadores y la
 * trazabilidad no cambian. test-manager-contract.test.js verifica que el
 * adapter actual lo cumpla y que los CLIs no usen nada fuera de él.
 *
 * Las formas de entrada y salida son del framework, no del gestor: el
 * adapter traduce. Nace del 2026-10-03 (D-45): getTestExecutions devolvía
 * la forma cruda del GraphQL de Xray ({ test: { jira: { key } } }) y esa
 * forma llegaba hasta lib/test-runner.js.
 *
 * Lógica pura: no habla con ningún gestor.
 */

/** Estados de una ejecución que usa el framework. El adapter traduce los del gestor a estos. */
const STATUSES = ['TO DO', 'EXECUTING', 'PASSED', 'FAILED'];

/**
 * Formas compartidas:
 *   Paso      { action, data, result }
 *   Modelo    Test Case canónico de lib/payload-builder.js
 *             ({ projectKey, name, objective, precondition, folder, labels, steps: [Paso] })
 *   Ciclo     { key } para reusar uno existente o { name, description } para crearlo
 *   Ejecución { id, testCaseKey, status }   (status: uno de STATUSES o null)
 */
const METHODS = [
  // PASO 2: publicar
  { name: 'publishTestCase', signature: '(modelo, { issueKey, issueId, testCycle: Ciclo|null }) -> { testCaseKey, testCycleKey }', does: 'Crea un Test Case con sus pasos, lo vincula a la HU y, con ciclo, le agrega su ejecución en TO DO.' },
  { name: 'publishTestCasesBatch', signature: '([modelo], Ciclo|null, issueKey, issueId, folderCache?: Map) -> { keys: [testCaseKey], testCycleKey }', does: 'Lo mismo para varios, en orden correlativo; uno que falla no frena a los demás pero el lote termina en error, separando los creados a medias (con key) de los no creados (lib/batch-publish.js).' },
  { name: 'completeTestCase', signature: '(testCaseKey, issueKey, testCycleKey|null, projectKey) -> { linked, executionCreated }', does: 'Completa un Test Case creado a medias: vínculo con la HU y ejecución en el ciclo, solo lo que falte (--complete-testcase).' },
  { name: 'replaceTestSteps', signature: '(testCaseKey, [Paso]) -> void', does: 'Reemplaza todos los pasos de un Test Case publicado (--update-steps).' },
  // PASO 3: reportar y verificar
  { name: 'getTestExecutions', signature: '(projectKey, testCycleKey) -> [Ejecución]', does: 'Ejecuciones de un ciclo (primera página, hasta 100).' },
  { name: 'findTestExecution', signature: '(projectKey, testCycleKey, testCaseKey) -> Ejecución|null', does: 'La ejecución de un Test Case en un ciclo, sin inventar si no existe.' },
  { name: 'updateTestExecutionStatus', signature: '(executionId, status) -> any', does: 'Cambia el estado de una ejecución (status: uno de STATUSES).' },
  // Lecturas (trazabilidad y --verify-*)
  { name: 'getTestCase', signature: '(testCaseKey) -> { key, name, objective, precondition, steps: [Paso] }', does: 'Un Test Case publicado, con la precondición separada del objetivo.' },
  { name: 'getTestCaseSteps', signature: '(testCaseKey) -> [Paso]', does: 'Solo los pasos de un Test Case.' },
  { name: 'getTestStepsByKeys', signature: '([testCaseKey]) -> Map<testCaseKey, [Paso]>', does: 'Pasos de muchos Test Cases en pocas llamadas.' },
  { name: 'getTestCaseLinks', signature: '(testCaseKey) -> [vínculo]', does: 'Vínculos del Test Case con otros issues (solo se imprimen, sin forma fija).' },
  { name: 'getTestCycle', signature: '(testCycleKey) -> { key, name }', does: 'Datos de un ciclo.' },
  { name: 'getStatus', signature: '(status) -> { name, description }', does: 'Confirma que un estado existe en el gestor.' }
];

const METHOD_NAMES = METHODS.map(m => m.name);

/** Funciones de `names` que le faltan a un adapter (común a los contratos de lib/tools.js). */
function missingFunctions(adapter, names) {
  return names
    .filter(name => typeof (adapter || {})[name] !== 'function')
    .map(name => `falta la función "${name}" del contrato`);
}

/** Problemas de un adapter contra el contrato: [] si lo cumple. */
function checkAdapter(adapter) {
  return missingFunctions(adapter, METHOD_NAMES);
}

/** Funciones que un archivo llama sobre `variable` (ej. "xray.getTestCase(" -> getTestCase). */
function methodsCalledOn(source, variable) {
  const pattern = new RegExp(`\\b${variable}\\.([A-Za-z_$][\\w$]*)\\s*\\(`, 'g');
  return [...new Set([...String(source).matchAll(pattern)].map(m => m[1]))].sort();
}

/** Una Ejecución con forma de contrato. */
function isExecution(value) {
  return !!value && typeof value === 'object'
    && value.id !== undefined && value.id !== null
    && typeof value.testCaseKey === 'string'
    && (value.status === null || STATUSES.includes(value.status));
}

module.exports = { STATUSES, METHODS, METHOD_NAMES, checkAdapter, missingFunctions, methodsCalledOn, isExecution };
