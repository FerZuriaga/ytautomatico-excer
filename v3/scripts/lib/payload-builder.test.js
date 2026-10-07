/**
 * Cobertura de lib/payload-builder.js (armador oficial del payload del
 * PASO 2). Nace del 2026-09-28: cada lote reescribía un build-*.js suelto.
 *
 * Correr con: node --test v3/scripts/lib/payload-builder.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { isBuildSpec, buildPayload, unknownShapeError, checkFolder } = require('./payload-builder');

const BASE = path.resolve('/lotes/notas');

const historia = { como: 'persona', quiero: 'crear notas', para: 'ordenar pendientes', criterios: ['CA-01: a', 'CA-02: b'] };

function spec(overrides = {}) {
  return {
    formato: 'lote',
    comun: { folder: '/Notes App/Notas', precondicion: 'Usuario con sesión.', evidencias: 'exp' },
    datos: { D: 'Pintura y rodillos' },
    pasos: {
      ABRIR: { description: 'Hacer clic en "+ Add Note"', expectedResult: 'Se abre el formulario.' },
      LLENAR: { description: 'Completar el formulario', testData: 'Title: Plan / Description: {{D}}', expectedResult: 'Los campos muestran los datos ingresados.' },
      CREAR_KO: { description: 'Hacer clic en "Create"', expectedResult: '{{texto}} La nota no se crea.' }
    },
    historias: [{
      summary: 'Notes - Crear',
      historia,
      casos: [
        { criterio: 'CA-01', tipo: 'positivo', prioridad: 'High', nombre: 'Crear', objetivo: 'o1', escenario: 'Crear una nota',
          pasos: ['ABRIR', 'LLENAR', { description: 'Hacer clic en "Create"', expectedResult: 'La lista muestra "Plan".' }] },
        { criterio: 'CA-02', tipo: 'negativo', prioridad: 'High', nombre: 'Vacío', objetivo: 'o2',
          pasos: ['ABRIR', { usa: 'CREAR_KO', texto: 'Se muestra "Title is required".' }],
          evidencia: { escenario: 'vacio', observado: 'Se muestra "Title is required".' } },
        { criterio: 'ca-02', tipo: 'negativo', prioridad: 'Normal', nombre: 'Corto', objetivo: 'o3', precondicion: 'Otra precondición.',
          pasos: ['ABRIR', { usa: 'LLENAR', testData: 'Title: Pan' }, { usa: 'CREAR_KO', texto: 'Se muestra el largo.' }],
          evidencia: { reporte: 'otra/report.json', observado: 'largo' } }
      ]
    }],
    ...overrides
  };
}

test('isBuildSpec reconoce solo el formato lote', () => {
  assert.equal(isBuildSpec(spec()), true);
  assert.equal(isBuildSpec({ issues: [] }), false);
  assert.equal(isBuildSpec(null), false);
});

test('una historia arma el formato de un issue con el modelo completo', () => {
  const payload = buildPayload(spec(), { baseDir: BASE });
  assert.equal(payload.issues, undefined);
  assert.equal(payload.issuetype, 'Historia');
  assert.equal(payload.summary, 'Notes - Crear');
  assert.deepEqual(payload.testCycle, { name: 'Notes - Crear', description: 'Ciclo de ejecución de la HU Notes - Crear', statusName: 'Not Executed' });
  const [first] = payload.testcaseModels;
  assert.deepEqual(first, {
    projectKey: 'SCRUM', statusName: 'Draft', labels: [], folder: '/Notes App/Notas', priorityName: 'High',
    name: 'Crear', objective: 'o1', precondition: 'Usuario con sesión.', criterio: 'CA-01', tipo: 'positivo',
    steps: [
      { inline: 1, description: 'Hacer clic en "+ Add Note"', testData: '-', expectedResult: 'Se abre el formulario.' },
      { inline: 2, description: 'Completar el formulario', testData: 'Title: Plan / Description: Pintura y rodillos', expectedResult: 'Los campos muestran los datos ingresados.' },
      { inline: 3, description: 'Hacer clic en "Create"', testData: '-', expectedResult: 'La lista muestra "Plan".' }
    ],
    traceability: { scenario: 'Crear una nota', testCase: 'TC-01.1' }
  });
});

test('TC correlativo por CA, criterio normalizado, escenario por defecto y precondición propia', () => {
  const models = buildPayload(spec(), { baseDir: BASE }).testcaseModels;
  assert.deepEqual(models.map(m => m.traceability.testCase), ['TC-01.1', 'TC-02.1', 'TC-02.2']);
  assert.equal(models[2].criterio, 'CA-02');
  assert.equal(models[1].traceability.scenario, 'Notes - Crear');
  assert.equal(models[2].precondition, 'Otra precondición.');
});

test('paso con "usa": parámetros de plantilla y reemplazo de campos', () => {
  const models = buildPayload(spec(), { baseDir: BASE }).testcaseModels;
  assert.equal(models[1].steps[1].expectedResult, 'Se muestra "Title is required". La nota no se crea.');
  assert.equal(models[2].steps[1].testData, 'Title: Pan');
  assert.equal(models[2].steps[1].description, 'Completar el formulario');
});

// Caso real (lote SCRUM-621 reescrito en este formato): el parámetro
// "texto" traía {{D}} y quedaba literal en el resultado esperado.
test('un parámetro del paso puede usar datos', () => {
  const s = spec();
  s.historias[0].casos[1].pasos[1] = { usa: 'CREAR_KO', texto: 'Falta "{{D}}".' };
  const models = buildPayload(s, { baseDir: BASE }).testcaseModels;
  assert.equal(models[1].steps[1].expectedResult, 'Falta "Pintura y rodillos". La nota no se crea.');
});

test('evidencia por escenario de explore-page o por ruta, resuelta contra la carpeta del lote', () => {
  const models = buildPayload(spec(), { baseDir: BASE }).testcaseModels;
  assert.deepEqual(models[1].evidencia, { reporte: path.join(BASE, 'exp', 'vacio', 'report.json'), observado: 'Se muestra "Title is required".' });
  assert.deepEqual(models[2].evidencia, { reporte: path.join(BASE, 'otra', 'report.json'), observado: 'largo' });
  assert.equal(models[0].evidencia, undefined);
});

test('varias historias arman el modo lote; cicloKey reutiliza el ciclo publicado', () => {
  const s = spec();
  s.historias.push({ summary: 'Notes - Editar', historia, cicloKey: 'SCRUM-700', casos: [s.historias[0].casos[0]] });
  const payload = buildPayload(s, { baseDir: BASE });
  assert.equal(payload.issues.length, 2);
  assert.deepEqual(payload.issues[1].testCycle, { key: 'SCRUM-700' });
  assert.equal(payload.issues[1].testcaseModels[0].traceability.testCase, 'TC-01.1');
});

test('"tc" explícito se respeta y la numeración sigue desde ahí', () => {
  const s = spec();
  s.historias[0].casos[1].tc = 'TC-02.4';
  const models = buildPayload(s, { baseDir: BASE }).testcaseModels;
  assert.deepEqual(models.map(m => m.traceability.testCase), ['TC-01.1', 'TC-02.4', 'TC-02.5']);
});

test('junta todos los problemas: paso inexistente, plantilla sin valor, campos y evidencia', () => {
  const s = spec({ comun: { precondicion: 'x' } });
  const casos = s.historias[0].casos;
  casos[0].pasos = ['NO_EXISTE', { usa: 'CREAR_KO' }];
  delete casos[1].prioridad;
  casos[2].criterio = 'CA2';
  let message = '';
  assert.throws(() => buildPayload(s, { baseDir: BASE }), err => { message = err.message; return true; });
  assert.match(message, /el paso "NO_EXISTE" no existe/);
  assert.match(message, /\{\{texto\}\} no tiene valor/);
  assert.match(message, /falta "prioridad"/);
  assert.match(message, /criterio "CA2" no tiene el formato CA-XX/);
  assert.match(message, /necesita "comun.evidencias"/);
  assert.match(message, /falta la carpeta de Xray/);
});

test('sin historias o sin formato lote es error', () => {
  assert.throws(() => buildPayload({ formato: 'lote', historias: [] }), /al menos una Historia/);
  assert.throws(() => buildPayload({ issues: [] }), /falta "formato": "lote"/);
});

// Caso real: un archivo de lote pasado sin armar dio "validación completa"
// en --dry-run con 0 Test Cases revisados.
test('unknownShapeError: payload sin nada que validar es error, con pista si parece un lote', () => {
  const lote = spec();
  delete lote.formato;
  assert.match(unknownShapeError(lote), /falta "formato": "lote"/);
  assert.match(unknownShapeError({ formato: 'Lote' }), /"formato": "Lote" no existe/);
  assert.match(unknownShapeError({ issues: [{ historia: {} }, { summary: 'x' }] }), /issues\[1\]/);
  assert.equal(unknownShapeError({ historia: {}, testcaseModels: [] }), null);
  assert.equal(unknownShapeError({ issuetype: 'Bug', bug: {} }), null);
  assert.equal(unknownShapeError(buildPayload(spec(), { baseDir: BASE })), null);
  assert.equal(unknownShapeError({ testcases: [] }, { updateSteps: true }), null);
  assert.match(unknownShapeError({ testcaseModels: [] }, { updateSteps: true }), /--update-steps espera/);
});

// Caso real (RBP, 2026-10-07): la raíz de la app no estaba anotada y el
// gestor crea en silencio una carpeta que no existe.
test('carpeta: tiene que ser "<raíz de una app>/<módulo>" de carpetasDePruebas', () => {
  const roots = ['/Restful Booker Platform', '/Notes App'];
  const check = folder => { const errors = []; checkFolder(folder, 'comun.folder', errors, roots); return errors; };
  assert.deepEqual(check('/Restful Booker Platform/Habitaciones'), []);
  assert.match(check('/Restful Booker Platform')[0], /<raíz>\/<módulo>/);
  assert.match(check('/RBP/Habitaciones')[0], /--list-folders/);
  assert.match(check('/Notes Application/Notas')[0], /\/Notes App/);
  const lote = spec();
  lote.comun.folder = '/Inventada/Notas';
  assert.throws(() => buildPayload(lote, { baseDir: BASE }), /comun\.folder: "\/Inventada\/Notas"/);
});

// Caso real (RBP, 2026-10-07): la pausa se mandó con CA de dos reglas y el
// validador recién lo vio con el payload completo. El borrador se valida
// con casos de una línea (criterio, tipo, nombre), sin pasos.
test('borrador: casos sin pasos ni precondición, con su criterio y tipo', () => {
  const lote = spec();
  delete lote.comun.precondicion;
  lote.historias[0].casos = [
    { criterio: 'CA-01', tipo: 'positivo', nombre: 'Crear' },
    { criterio: 'ca-01', tipo: 'negativo', nombre: 'Sin título' },
    { criterio: 'CA-02', nombre: 'Falta el tipo' }
  ];
  assert.throws(() => buildPayload(lote, { baseDir: BASE, borrador: true }), /caso 3 "Falta el tipo": falta "tipo"/);
  lote.historias[0].casos.pop();
  const payload = buildPayload(lote, { baseDir: BASE, borrador: true });
  assert.deepEqual(payload.testcaseModels.map(m => [m.criterio, m.tipo, m.name, m.traceability.testCase]), [['CA-01', 'positivo', 'Crear', 'TC-01.1'], ['CA-01', 'negativo', 'Sin título', 'TC-01.2']]);
  assert.throws(() => buildPayload(lote, { baseDir: BASE }), /"pasos" está vacío/);
});
