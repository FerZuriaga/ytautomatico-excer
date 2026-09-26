/**
 * Cobertura de testcase-validator -- nace del lote SCRUM-328/338
 * (2026-09-23), publicado con los 16 Test Cases en exactamente 2 pasos,
 * acciones encadenadas en un mismo paso y el login repetido dentro del
 * Paso 1. Los casos de regresión usan el texto REAL de esos pasos
 * (versión original vs. versión reescrita de SCRUM-335).
 *
 * Los casos de Criterios de Aceptación y relación TC -> CA reproducen el
 * relevamiento real de 2026-09-23 (racha de HU con 2 CA en Automation
 * Test Store, SCRUM-135 con 6 CA, lote SCRUM-328/338 con 2 TC por CA).
 *
 * Correr con: node --test v3/scripts/lib/testcase-validator.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  findActionVerbs,
  validateTestCaseModel,
  collectTestCases,
  validateStoryCriteria,
  validateStoryText,
  validatePayload,
  validateStepUpdates
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
    step('Navegar a la Home https://commitquality.com/.', 'Se muestra el listado con 10 productos.'),
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

test('regresion SCRUM-335 original: detecta acciones encadenadas, login sin precondicion y verificacion en la accion', () => {
  const { errors, warnings } = validateTestCaseModel(SCRUM_335_ORIGINAL);

  assert.equal(errors.length, 1);
  assert.match(errors[0], /el paso 1 incluye una verificacion en la accion \("verificar"\)/);
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
      step('Navegar a https://commitquality.com/ sin iniciar sesion.', 'El menu muestra el link Login.'),
      step('Reemplazar Name y Youtube sin presionar Save.')
    ]
  });

  assert.deepEqual(warnings, []);
});

test('regresion SCRUM-302: la negacion aplica a cualquier verbo de accion ("sin filtrar")', () => {
  assert.deepEqual(findActionVerbs('Navegar a la Home y verificar el listado inicial completo (sin filtrar).'), ['navegar']);
  assert.deepEqual(findActionVerbs('Volver al listado sin guardar ni eliminar nada.'), ['volver', 'eliminar']);
  assert.deepEqual(findActionVerbs('No recargar la pagina y presionar Reset.'), ['presionar']);
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

test('payload sin Test Cases (solo actualiza la Historia) con CA validos no genera errores ni warnings', () => {
  const result = validatePayload({ summary: 'HU', historia: { como: 'x', criterios: ['CA-01: uno', 'CA-02: dos', 'CA-03: tres'] } });

  assert.deepEqual(result, { errors: [], warnings: [], testCaseCount: 0 });
});

test('payload sin Historia ni Test Cases (ej. un Bug) no genera errores ni warnings', () => {
  const result = validatePayload({ summary: 'Bug', issuetype: 'Bug', bug: {} });

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

// ─── Criterios de Aceptación y relación TC -> CA ─────────────────────────────

const ca = (n) => `CA-0${n}: El sistema debe cumplir la regla ${n}.`;

// Test Case valido (3 pasos, sin warnings) asignado a un criterio.
const tcFor = (criterio, name = `TC ${criterio}`, tipo = 'positivo') => ({
  name,
  criterio,
  tipo,
  precondition: 'Sesion iniciada.',
  steps: [step('Navegar a la Home.'), step('Presionar Delete sobre el ID 11.'), step('Presionar Reset.')]
});

// HU con N criterios y `tcPerCa` Test Cases por criterio; el segundo caso
// de cada criterio es negativo (como un payload correcto).
const story = (summary, caCount, tcPerCa = 3) => {
  const criterios = Array.from({ length: caCount }, (_, i) => ca(i + 1));
  const testcaseModels = criterios.flatMap((_, i) =>
    Array.from({ length: tcPerCa }, (_, j) =>
      tcFor(`CA-0${i + 1}`, `TC-0${i + 1}.${j + 1}`, j === 1 ? 'negativo' : 'positivo')));
  return { summary, historia: { criterios }, testcaseModels };
};

test('HU con 3 CA y 3 TC por CA: sin errores ni warnings', () => {
  assert.deepEqual(validatePayload(story('HU', 3)), { errors: [], warnings: [], testCaseCount: 9 });
});

test('error: HU con menos de 2 CA (falta discovery)', () => {
  const { errors } = validateStoryCriteria(story('HU chica', 1));

  assert.equal(errors.length, 1);
  assert.match(errors[0], /HU chica: tiene 1 criterio\(s\) de aceptacion, el minimo es 2 -- probablemente falta discovery/);
});

test('regresion SCRUM-135: HU con 6 CA es WARNING (evaluar split), no error', () => {
  const { errors, warnings } = validateStoryCriteria(story('Registro de cuenta nueva', 6));

  assert.deepEqual(errors, []);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /tiene 6 criterios de aceptacion \(maximo 4\) -- evaluar si la HU requiere split/);
});

test('regresion racha Automation Test Store: lote entero con 2 CA por HU avisa como molde', () => {
  const { errors, warnings } = validatePayload({ issues: [story('HU A', 2), story('HU B', 2)] });

  assert.deepEqual(errors, []);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /Las 2 HU del lote tienen exactamente 2 criterios de aceptacion/);
});

test('una sola HU con 2 CA no avisa por uniformidad (puede ser legitima)', () => {
  assert.deepEqual(validatePayload(story('HU chica', 2)).warnings, []);
});

test('lote con CA variados (2 y 3) no avisa por uniformidad', () => {
  assert.deepEqual(validatePayload({ issues: [story('HU A', 2), story('HU B', 3)] }).warnings, []);
});

test('error: criterio sin id CA-XX o repetido', () => {
  const { errors } = validateStoryCriteria({
    summary: 'HU',
    historia: { criterios: ['El sistema debe loguear.', 'CA-01: uno', 'ca-01: repetido en minuscula'] }
  });

  assert.equal(errors.length, 2);
  assert.match(errors[0], /el criterio 1 no empieza con un id "CA-XX"/);
  assert.match(errors[1], /el criterio CA-01 esta repetido/);
});

test('error: TC sin campo criterio, con formato invalido o apuntando a un CA inexistente', () => {
  const hu = story('HU', 2);
  hu.testcaseModels.push({ ...tcFor(undefined, 'TC sin criterio') });
  hu.testcaseModels.push({ ...tcFor('criterio 1', 'TC formato malo') });
  hu.testcaseModels.push({ ...tcFor('CA-09', 'TC huerfano') });

  const { errors } = validateStoryCriteria(hu);

  assert.deepEqual(errors, [
    'HU > TC sin criterio: falta el campo "criterio" (ej. "CA-01") para trazar el TC a su criterio de aceptacion.',
    'HU > TC formato malo: criterio "criterio 1" no tiene formato CA-XX.',
    'HU > TC huerfano: apunta a CA-09, que no existe en los criterios de la HU (CA-01, CA-02).'
  ]);
});

test('el criterio del TC se compara sin importar mayusculas ni espacios', () => {
  const hu = story('HU', 2, 0);
  hu.testcaseModels = [tcFor(' ca-01'), tcFor('CA-01'), tcFor('Ca-02'), tcFor('CA-02 ')];

  assert.deepEqual(validateStoryCriteria(hu).errors, []);
});

test('error: CA con menos de 2 TC (incluido un CA sin cobertura)', () => {
  const hu = story('HU', 3, 0);
  hu.testcaseModels = [tcFor('CA-01'), tcFor('CA-01'), tcFor('CA-02')];

  const { errors } = validateStoryCriteria(hu);

  assert.deepEqual(errors, [
    'HU: CA-02 tiene 1 Test Case(s), el minimo es 2.',
    'HU: CA-03 tiene 0 Test Case(s), el minimo es 2.'
  ]);
});

test('warning: CA con mas de 5 TC', () => {
  const hu = story('HU', 2, 2);
  hu.testcaseModels.push(...Array.from({ length: 4 }, () => tcFor('CA-01')));

  const { errors, warnings } = validateStoryCriteria(hu);

  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, ['HU: CA-01 tiene 6 Test Cases (maximo 5) -- revisar si el criterio no esta agrupando varias reglas.']);
});

test('regresion lote SCRUM-328/338: todos los CA con exactamente 2 TC avisa como molde', () => {
  const { errors, warnings } = validatePayload({ issues: [story('Eliminar', 4, 2), story('Mi cuenta', 4, 2)] });

  assert.deepEqual(errors, []);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /Los 8 criterios de aceptacion del payload tienen exactamente 2 Test Cases/);
});

test('issue sin historia (agregar TC a una HU existente): no exige criterio, pero valida su formato', () => {
  assert.deepEqual(validatePayload({ summary: 'HU existente', testcaseModels: [tcFor(undefined), tcFor('CA-01')] }).errors, []);

  const { errors } = validatePayload({ summary: 'HU existente', testcaseModel: tcFor('uno') });
  assert.deepEqual(errors, ['HU existente > TC uno: criterio "uno" no tiene formato CA-XX.']);
});

// ─── Caso negativo por criterio (tipo) ──────────────────────────────────────

test('warning (no error): CA sin ningun caso negativo, como el CA-01 de Descarga (SCRUM-374)', () => {
  const hu = story('Descarga', 2, 0);
  hu.testcaseModels = [
    tcFor('CA-01', 'Nombre del archivo'), tcFor('CA-01', 'Contenido del archivo'),
    tcFor('CA-02', 'No cambia de pantalla'), tcFor('CA-02', 'Sin archivo seleccionado', 'negativo')
  ];

  const { errors, warnings } = validateStoryCriteria(hu);

  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, ['Descarga: CA-01 no tiene ningun caso negativo (tipo: "negativo") -- agregarlo o justificarlo en historia.sinNegativo["CA-01"].']);
});

test('payload sin campo tipo: avisa en cada CA (fuerza a declararlo)', () => {
  const hu = story('HU', 2, 0);
  hu.testcaseModels = ['CA-01', 'CA-01', 'CA-02', 'CA-02'].map(c => ({ ...tcFor(c), tipo: undefined }));

  const { warnings } = validateStoryCriteria(hu);

  assert.equal(warnings.length, 2);
  assert.match(warnings[0], /CA-01 no tiene ningun caso negativo/);
  assert.match(warnings[1], /CA-02 no tiene ningun caso negativo/);
});

test('un CA sin TC da solo el error de minimo, no ademas el warning de negativo', () => {
  const hu = story('HU', 2, 0);
  hu.testcaseModels = [tcFor('CA-01'), tcFor('CA-01', 'neg', 'negativo')];

  const { errors, warnings } = validateStoryCriteria(hu);

  assert.deepEqual(errors, ['HU: CA-02 tiene 0 Test Case(s), el minimo es 2.']);
  assert.deepEqual(warnings, []);
});

test('error: tipo con valor invalido; mayusculas y acentos se normalizan', () => {
  assert.deepEqual(validateTestCaseModel({ ...tcFor('CA-01'), tipo: 'Negativo' }).errors, []);
  assert.deepEqual(validateTestCaseModel({ ...tcFor('CA-01', 'TC'), tipo: 'borde' }).errors,
    ['TC: tipo "borde" invalido (valores posibles: positivo, negativo).']);
});

// ─── --update-steps ──────────────────────────────────────────────────────────

test('update-steps: payload valido (SCRUM-335 reescrito) sin errores ni warnings', () => {
  const result = validateStepUpdates({ testcases: [{ key: 'SCRUM-335', ...SCRUM_335_REWRITTEN }] });

  assert.deepEqual(result, { errors: [], warnings: [], testCaseCount: 1 });
});

test('update-steps: regresion SCRUM-346 -- detecta el paso que encadenaba expandir + guardar', () => {
  const { errors, warnings } = validateStepUpdates({
    testcases: [{
      key: 'SCRUM-346',
      precondition: 'Sesion iniciada.',
      steps: [step('Presionar My Account en el menu.'), step('Presionar +, reemplazar Name y Youtube y presionar Save.')]
    }]
  });

  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, ['SCRUM-346: el paso 2 parece encadenar 2 acciones (presionar, presionar) -- separar un paso por accion verificable.']);
});

test('update-steps: errores de estructura (sin testcases, key invalido, key repetido, pasos insuficientes)', () => {
  assert.match(validateStepUpdates({}).errors[0], /debe traer "testcases"/);
  assert.match(validateStepUpdates({ testcases: [] }).errors[0], /al menos un elemento/);

  const { errors } = validateStepUpdates({
    testcases: [
      { key: 'scrum 1', steps: [] },
      { key: 'SCRUM-10', precondition: 'x', steps: [step('Navegar a la Home.')] },
      { key: 'SCRUM-10', precondition: 'x', steps: [step('Navegar a la Home.'), step('Presionar Reset.')] }
    ]
  });

  assert.deepEqual(errors, [
    '--update-steps: el elemento 1 no tiene un "key" valido (ej. "SCRUM-335").',
    'SCRUM-10: tiene 1 paso(s), el minimo es 2.',
    '--update-steps: SCRUM-10 esta repetido en el payload.'
  ]);
});

// --- Redacción de la Historia (validateStoryText) ---------------------
// Textos REALES de las HU revisadas el 2026-09-24 (SCRUM-374/366/338).

test('HU SCRUM-374 real: usuario generico, Objetivo de prueba, ruta y detalle tecnico', () => {
  const { warnings } = validateStoryText({
    summary: 'CommitQuality - Practice: descarga de archivos',
    historia: {
      como: 'usuario de CommitQuality',
      quiero: 'descargar el archivo de ejemplo',
      para: 'obtener una copia local de su contenido',
      contexto: "El reto File Download (/practice-file-download) tiene un boton 'Download File' que genera en el navegador y descarga el archivo de texto dummy_file.txt, sin navegar a otra pagina.",
      objetivo: 'Verificar el nombre y el contenido del archivo descargado y que la descarga no saque al usuario de la pantalla.',
      criterios: ["CA-01: Al presionar 'Download File' se debe descargar el archivo 'dummy_file.txt'.", 'CA-02: La descarga debe ocurrir sin abandonar la pantalla.']
    }
  });
  assert.equal(warnings.length, 3);
  assert.match(warnings[0], /"Como usuario de CommitQuality" es un usuario generico/);
  assert.match(warnings[1], /Objetivo esta escrito como objetivo de prueba \("Verificar\.\.\."\)/);
  assert.match(warnings[2], /Contexto menciona una ruta\/URL \("\/practice-file-download"\)/);
});

test('HU SCRUM-338 real: CA que exige perder datos (defecto documentado como requisito) y detalle tecnico', () => {
  const { warnings } = validateStoryText({
    summary: 'CommitQuality - Mi cuenta',
    historia: {
      como: 'usuario logueado de CommitQuality',
      quiero: 'ver y actualizar mis datos de cuenta',
      para: 'mantener mi nombre y canal de Youtube al dia',
      contexto: 'La seccion Update Details dispara un alert nativo y actualiza My Details. Sin backend: los datos guardados son estado local de la pantalla.',
      objetivo: 'Que el usuario pueda consultar y mantener actualizados sus datos de cuenta.',
      criterios: [
        'CA-01: Con sesion iniciada, el link My Account debe llevar a /account mostrando los datos por defecto.',
        'CA-02: La seccion Update Details debe poder mostrarse/ocultarse con el control +/-.',
        'CA-04: Los datos guardados deben revertirse a los valores por defecto al salir de la pantalla o recargarla (estado local, sin backend).'
      ]
    }
  });
  assert.deepEqual(warnings.map(w => w.replace(/ -- .*/, '')), [
    'CommitQuality - Mi cuenta: Contexto tiene detalle tecnico (alert nativo, backend)',
    'CommitQuality - Mi cuenta: CA-01 menciona una ruta/URL ("/account")',
    'CommitQuality - Mi cuenta: CA-04 tiene detalle tecnico (backend)',
    'CommitQuality - Mi cuenta: CA-04 exige perder o revertir datos'
  ]);
});

test('"Para" que repite el "Quiero" (literal) da warning; "+/-" y "descartar" no dan falsos positivos', () => {
  const repetido = validateStoryText({ summary: 'HU', historia: { quiero: 'subir archivos al sistema', para: 'poder subir archivos' } });
  assert.match(repetido.warnings[0], /el "Para" repite el "Quiero"/);

  const limpio = validateStoryText({
    summary: 'HU',
    historia: {
      como: 'administrador del catalogo',
      quiero: 'dar de alta productos nuevos',
      para: 'que los clientes los encuentren disponibles para la venta',
      contexto: 'El alta pide nombre, precio y fecha de stock, con validaciones de formato.',
      objetivo: 'Que el catalogo solo incorpore productos con datos validos.',
      criterios: ['CA-01: La seccion de edicion se expande y colapsa con el control +/-.', 'CA-02: Cancelar debe descartar los datos ingresados sin crear el producto.']
    }
  });
  assert.deepEqual(limpio.warnings, []);
});

test('validatePayload incluye los warnings de redaccion; issue sin historia no se audita', () => {
  const hu = story('HU', 3);
  hu.historia.objetivo = 'Validar el alta de productos.';
  assert.deepEqual(validatePayload(hu).warnings, ['HU: el Objetivo esta escrito como objetivo de prueba ("Validar...") -- describir el resultado de negocio; lo que se verifica va en los Test Cases.']);
  assert.deepEqual(validateStoryText({ summary: 'Bug' }).warnings, []);
});

// ─── Justificación por criterio (historia.sinNegativo) ──────────────────────
// Nace del lote 2 de Practice Software Testing (2026-09-25): 5 CA sin caso
// negativo aceptados con un --accept-warnings global, sin dejar el motivo
// registrado en ningún lado.

const huSinNegativoEnCa01 = () => {
  const hu = story('Comparador', 2, 0);
  hu.testcaseModels = [
    tcFor('CA-01', 'Solo diferencias'), tcFor('CA-01', 'Desmarcar diferencias'),
    tcFor('CA-02', 'Quitar producto'), tcFor('CA-02', 'Comparacion vacia', 'negativo')
  ];
  return hu;
};

test('sinNegativo con motivo: el CA sin caso negativo no avisa', () => {
  const hu = huSinNegativoEnCa01();
  hu.historia.sinNegativo = { 'CA-01': 'Opcion que se activa y desactiva: no hay entrada invalida.' };

  assert.deepEqual(validateStoryCriteria(hu), { errors: [], warnings: [], criteriaCount: 2, tcCountByCriterion: { 'CA-01': 2, 'CA-02': 2 } });
});

test('error: sinNegativo sin motivo', () => {
  const hu = huSinNegativoEnCa01();
  hu.historia.sinNegativo = { 'CA-01': '  ' };

  const { errors, warnings } = validateStoryCriteria(hu);

  assert.deepEqual(errors, ['Comparador: historia.sinNegativo["CA-01"] no tiene motivo -- la justificacion es obligatoria.']);
  assert.match(warnings[0], /CA-01 no tiene ningun caso negativo/);
});

test('error: sinNegativo apunta a un criterio que no existe', () => {
  const hu = huSinNegativoEnCa01();
  hu.historia.sinNegativo = { 'CA-01': 'Motivo.', 'CA-07': 'Motivo.' };

  const { errors } = validateStoryCriteria(hu);

  assert.deepEqual(errors, ['Comparador: historia.sinNegativo apunta a "CA-07", que no es un criterio de la HU (CA-01, CA-02).']);
});

test('warning: sinNegativo sobre un CA que ya tiene casos negativos', () => {
  const hu = huSinNegativoEnCa01();
  hu.historia.sinNegativo = { 'CA-01': 'Motivo.', 'CA-02': 'Motivo innecesario.' };

  const { errors, warnings } = validateStoryCriteria(hu);

  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, ['Comparador: CA-02 ya tiene casos negativos -- sobra la justificacion en historia.sinNegativo.']);
});

// ─── Datos de prueba en la columna Datos ────────────────────────────────────

test('warning: dato de entrada entre comillas en la accion con Datos vacio', () => {
  const { warnings } = validateTestCaseModel({
    name: 'Busqueda', precondition: 'Sin sesion.',
    steps: [step('Navegar a la Home.'), { description: 'Ingresar "pliers" en el campo Search.', testData: '-', expectedResult: 'Se muestran 4 productos.' }]
  });

  assert.deepEqual(warnings, ['Busqueda: el paso 2 escribe un dato entre comillas en la accion y la columna Datos esta vacia -- mover el dato a testData.']);
});

test('dato en la columna Datos o comillas de un texto visible no avisan', () => {
  const { warnings } = validateTestCaseModel({
    name: 'Busqueda', precondition: 'Sin sesion.',
    steps: [
      step('Navegar a la Home.'),
      { description: 'Ingresar el termino en el campo Search.', testData: 'pliers', expectedResult: 'Se muestran 4 productos.' },
      { description: 'Marcar la opcion "Show only eco-friendly products".', testData: '-', expectedResult: 'Solo productos ECO.' }
    ]
  });

  assert.deepEqual(warnings, []);
});

// ─── Verificación fuera de la columna Acción ────────────────────────────────
// Nace de SCRUM-477 (2026-09-26): "Hacer clic en el icono del carrito y
// verificar su contenido". Verificar no es una acción del usuario: va en el
// resultado esperado. Es ERROR (bloquea la publicación).

test('error: la accion incluye "y verificar" (regresion SCRUM-477)', () => {
  const { errors } = validateTestCaseModel({
    name: 'Descuento eco', precondition: 'Carrito con Wood Saw x1.',
    steps: [step('Navegar a la Home y verificar que el menu muestra el carrito.'), step('Hacer clic en el icono del carrito y verificar su contenido.')]
  });

  assert.deepEqual(errors, [
    'Descuento eco: el paso 1 incluye una verificacion en la accion ("verificar") -- la accion describe solo lo que hace el usuario; lo que se controla va en el resultado esperado.',
    'Descuento eco: el paso 2 incluye una verificacion en la accion ("verificar") -- la accion describe solo lo que hace el usuario; lo que se controla va en el resultado esperado.'
  ]);
});

test('error: "comprobar", "validar" y "revisar que" tambien son verificaciones', () => {
  const { errors } = validateTestCaseModel({
    name: 'TC', precondition: 'x',
    steps: [step('Abrir el carrito y comprobar el total.'), step('Presionar Save y validar el mensaje.'), step('Revisar que el total sea $10.')]
  });

  assert.equal(errors.length, 3);
});

test('acciones del usuario sin verificacion no dan error ("Revisar el desglose", "confirmar el cambio")', () => {
  const { errors } = validateTestCaseModel({
    name: 'Carrito', precondition: 'Carrito con Wood Saw x1.',
    steps: [
      step('Abrir el carrito desde el icono del menu.', 'Se muestra Wood Saw con cantidad 1.'),
      step('Revisar el desglose de totales del carrito.', 'Subtotal $12.18, descuento - $0.61, total $11.57.'),
      { description: 'Cambiar la cantidad en el campo Quantity y confirmar el cambio.', testData: '2', expectedResult: 'Total $24.36.' }
    ]
  });

  assert.deepEqual(errors, []);
});
