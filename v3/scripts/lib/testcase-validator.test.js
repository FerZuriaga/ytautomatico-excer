/**
 * Cobertura de testcase-validator -- nace del lote SCRUM-328/338
 * (2026-09-23), publicado con los 16 Test Cases en exactamente 2 pasos,
 * acciones encadenadas en un mismo paso y el login repetido dentro del
 * Paso 1. Los casos de regresión usan el texto REAL de esos pasos
 * (versión original vs. versión reescrita de SCRUM-335).
 *
 * Correr con: node --test v3/scripts/lib/testcase-validator.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  findActionVerbs,
  validateTestCaseModel,
  collectTestCases,
  validatePayload
} = require('./testcase-validator');

const step = (description, expectedResult = 'Resultado esperado.') => ({ description, testData: '-', expectedResult });

// SCRUM-335 tal como se publicó originalmente (2 pasos, 3 acciones en el Paso 1).
const SCRUM_335_ORIGINAL = {
  name: 'Producto eliminado no reaparece al resetear el filtro',
  precondition: '',
  steps: [
    step('Iniciar sesion con test/test en https://commitquality.com/login y verificar que la Home muestra el listado de productos con la columna Actions. Filtrar por Product 1 y eliminar el ID 10.', 'La vista filtrada queda con 4 filas.'),
    step('Presionar Reset.', 'El listado completo muestra 10 productos, el ID 10 no aparece y Show More no se muestra.')
  ]
};

// SCRUM-335 reescrito con la regla nueva (precondición + 1 paso por acción).
const SCRUM_335_REWRITTEN = {
  name: 'Producto eliminado no reaparece al resetear el filtro',
  precondition: 'Sesion iniciada con las credenciales validas (test/test).',
  steps: [
    step('Navegar a la Home https://commitquality.com/ y verificar el listado de productos.', 'Se muestran 10 productos.'),
    step('Ingresar el texto en el filtro y presionar Filter.', 'El listado muestra solo los 5 productos llamados Product 1.'),
    step('Presionar Delete sobre el producto con ID 10.', 'La vista filtrada queda con 4 filas.'),
    step('Presionar Reset.', 'El listado completo muestra 10 productos y el ID 10 no aparece.')
  ]
};

const twoStepModel = (name) => ({
  name,
  precondition: 'Sesion iniciada.',
  steps: [step('Navegar a la Home.'), step('Presionar Delete sobre el ID 11.')]
});

// ─── Errores (reglas objetivas) ──────────────────────────────────────────────

test('error: Test Case con un solo paso', () => {
  const { errors } = validateTestCaseModel({ name: 'TC', steps: [step('Presionar Login.')] });

  assert.equal(errors.length, 1);
  assert.match(errors[0], /tiene 1 paso\(s\), el minimo es 2/);
});

test('error: Test Case sin steps', () => {
  const { errors } = validateTestCaseModel({ name: 'TC' });

  assert.match(errors[0], /tiene 0 paso\(s\)/);
});

test('error: paso sin resultado esperado o sin accion', () => {
  const { errors } = validateTestCaseModel({
    name: 'TC',
    steps: [step('Navegar a la Home.', '  '), { description: '', expectedResult: 'Algo.' }]
  });

  assert.deepEqual(errors, [
    'TC: el paso 1 no tiene resultado esperado (expectedResult).',
    'TC: el paso 2 no tiene accion (description).'
  ]);
});

// ─── Warnings (heurísticas) ──────────────────────────────────────────────────

test('regresion SCRUM-335 original: detecta acciones encadenadas y login sin precondicion', () => {
  const { errors, warnings } = validateTestCaseModel(SCRUM_335_ORIGINAL);

  assert.deepEqual(errors, []);
  assert.equal(warnings.length, 2);
  assert.match(warnings[0], /el paso 1 parece encadenar 3 acciones \(iniciar sesion, filtrar, eliminar\)/);
  assert.match(warnings[1], /el paso 1 incluye el login y la precondicion esta vacia/);
});

test('regresion SCRUM-335 reescrito: sin errores ni warnings', () => {
  const { errors, warnings } = validateTestCaseModel(SCRUM_335_REWRITTEN);

  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
});

test('cargar datos y confirmar ("completar X y presionar Y") cuenta como UNA accion', () => {
  assert.deepEqual(findActionVerbs('Reemplazar Name y Youtube y presionar Save.'), ['presionar']);
  assert.deepEqual(findActionVerbs('Ingresar el texto en el filtro y presionar Filter.'), ['presionar']);
});

test('"verificar"/"observar" no cuentan como accion', () => {
  assert.deepEqual(findActionVerbs('Navegar a la Home y verificar el listado.'), ['navegar']);
  assert.deepEqual(findActionVerbs('Observar las filas del listado.'), []);
});

test('la misma accion repetida cuenta 2 veces (expandir + guardar)', () => {
  const { warnings } = validateTestCaseModel({
    name: 'TC',
    precondition: 'Sesion iniciada.',
    steps: [step('Navegar a /account.'), step('Presionar +, reemplazar Name y presionar Save.')]
  });

  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /el paso 2 parece encadenar 2 acciones \(presionar, presionar\)/);
});

test('palabra de secuencia sin 2 verbos reconocidos tambien avisa', () => {
  const { warnings } = validateTestCaseModel({
    name: 'TC',
    precondition: 'Sesion iniciada.',
    steps: [step('Navegar a la Home.'), step('Presionar Delete, luego confirmar el dialogo.')]
  });

  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /palabra de secuencia/);
});

test('regresion SCRUM-331: una accion negada ("sin iniciar sesion") no cuenta como accion ni como login', () => {
  const { warnings } = validateTestCaseModel({
    name: 'Accion Delete oculta sin sesion',
    precondition: '',
    steps: [
      step('Navegar a https://commitquality.com/ sin iniciar sesion y verificar que el menu muestra el link Login.'),
      step('Reemplazar Name y Youtube sin presionar Save.')
    ]
  });

  assert.deepEqual(warnings, []);
});

test('acentos y mayusculas no evitan la deteccion', () => {
  assert.deepEqual(findActionVerbs('INICIAR SESIÓN y Navegar a la Home.'), ['iniciar sesion', 'navegar']);
});

test('login en el Paso 1 con precondicion cargada no avisa por login', () => {
  const { warnings } = validateTestCaseModel({
    name: 'TC',
    precondition: 'Usuario registrado.',
    steps: [step('Iniciar sesion con test/test.'), step('Presionar Logout.')]
  });

  assert.deepEqual(warnings, []);
});

// ─── Payload completo ────────────────────────────────────────────────────────

test('collectTestCases: modo lote, issue unico con testcaseModel y payload sin Test Cases', () => {
  const lote = collectTestCases({
    issues: [
      { summary: 'HU A', testcaseModels: [twoStepModel('A1'), twoStepModel('A2')] },
      { summary: 'HU B', testcaseModel: twoStepModel('B1') }
    ]
  });
  assert.deepEqual(lote.map(t => t.label), ['HU A > A1', 'HU A > A2', 'HU B > B1']);

  assert.equal(collectTestCases({ summary: 'HU', testcaseModel: twoStepModel('X') }).length, 1);
  assert.equal(collectTestCases({ summary: 'HU', historia: {} }).length, 0);
});

test('payload sin Test Cases (solo actualiza la Historia) no genera errores ni warnings', () => {
  const result = validatePayload({ summary: 'HU', historia: { como: 'x' } });

  assert.deepEqual(result, { errors: [], warnings: [], testCaseCount: 0 });
});

test('regresion lote SCRUM-328/338: todos los TC con exactamente 2 pasos avisa como posible molde', () => {
  const { errors, warnings } = validatePayload({
    issues: [{ summary: 'HU', testcaseModels: ['A', 'B', 'C', 'D'].map(twoStepModel) }]
  });

  assert.deepEqual(errors, []);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /Los 4 Test Cases del payload tienen exactamente 2 pasos/);
});

test('lote chico uniforme de 2 pasos (menos de 4 TC) no avisa', () => {
  const { warnings } = validatePayload({ testcaseModels: ['A', 'B', 'C'].map(twoStepModel) });

  assert.deepEqual(warnings, []);
});

test('lote con pasos variados no avisa por uniformidad', () => {
  const { warnings } = validatePayload({
    testcaseModels: [...['A', 'B', 'C'].map(twoStepModel), SCRUM_335_REWRITTEN]
  });

  assert.deepEqual(warnings, []);
});
