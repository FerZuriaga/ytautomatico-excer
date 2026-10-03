/**
 * Cobertura de lib/trace-report.js (reporte público de trazabilidad,
 * 2026-10-03). Correr con: node --test v3/scripts/lib/trace-report.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildTraceReport, cycleFromSpec, anchorOf } = require('./trace-report');

const step = (action, data, result) => ({ action, data, result });

const story = (overrides = {}) => ({
  key: 'SCRUM-804',
  summary: 'Notes App - Cambiar mi contraseña',
  status: 'Finalizada',
  cycleKey: 'SCRUM-805',
  specFile: 'cypress/e2e/expandtesting-notes/notes_tc_cambiar_contrasena.cy.js',
  historia: {
    como: 'usuario registrado de Notes App', quiero: 'cambiar mi contraseña', para: 'proteger mi cuenta',
    objetivo: 'Que solo quien conoce la vigente la cambie.',
    criterios: ['CA-01: Con la actual correcta se cambia.', 'CA-02: Una actual incorrecta se rechaza | con aviso.', 'CA-03: Sin TC todavía.'],
    fueraDeAlcance: ['Recuperar la contraseña por email.'],
    sinNegativoTexto: []
  },
  bugs: [{ key: 'SCRUM-833', summary: 'Las sesiones previas siguen activas', status: 'Tareas por hacer' }],
  tests: [
    { file: 'cypress/e2e/expandtesting-notes/notes_tc_cambiar_contrasena.cy.js', key: 'SCRUM-810', ca: 'CA-02', tc: 'TC-02.1', line: 81, skipped: false, title: 'x',
      name: 'No se cambia con la actual incorrecta', tipo: 'negativo', result: 'PASSED',
      steps: [step('Hacer clic en "Change password"', '-', 'Se muestra el formulario.'), step('Escribir la actual', 'Otra!Clave1', 'Queda completado.')] },
    { file: 'cypress/e2e/expandtesting-notes/notes_tc_cambiar_contrasena.cy.js', key: 'SCRUM-806', ca: 'CA-01', tc: 'TC-01.1', line: 52, skipped: false, title: 'x',
      name: 'Cambiar con la actual correcta', tipo: 'positivo', result: 'PASSED', steps: [step('a', '-', 'b')] },
    { file: 'cypress/e2e/expandtesting-notes/notes_tc_cambiar_contrasena.cy.js', key: 'SCRUM-807', ca: 'CA-01', tc: 'TC-01.2', line: 60, skipped: true,
      title: 'Ingresa con la nueva (bug conocido: SCRUM-833)', name: 'Ingresa con la nueva', tipo: 'positivo', result: 'TO DO', steps: [] }
  ],
  notAutomated: ['SCRUM-899'],
  ...overrides
});

const report = (stories = [story()]) => buildTraceReport({
  title: 'Notes App', generatedAt: '2026-10-03', command: 'node v3/scripts/check-traceability.js --spec x --report y', specBase: '../../', stories
});

test('cycleFromSpec: toma el Test Cycle del encabezado del spec', () => {
  assert.equal(cycleFromSpec('// Modulo\n// Ticket Jira: SCRUM-804 (CA-01..CA-06, Test Cycle SCRUM-805)\n'), 'SCRUM-805');
  assert.equal(cycleFromSpec('// Ticket Jira: SCRUM-64\n'), null);
});

test('anchorOf: el id que GitHub le da al título (un guion por espacio, sin puntuación)', () => {
  assert.equal(anchorOf('SCRUM-804 · Cambiar mi contraseña'), 'scrum-804--cambiar-mi-contraseña');
});

test('resumen: totales por HU y del lote, salteados por bug aparte de los que pasaron', () => {
  const md = report();
  assert.match(md, /\| \[SCRUM-804 · Cambiar mi contraseña\]\(#scrum-804--cambiar-mi-contraseña\) \| Finalizada \| 3 \| 4 \| 3 \| 2 ✅ · 1 ⊘ \| SCRUM-833 \|/);
  assert.match(md, /\| \*\*Total\*\* \| \| \*\*3\*\* \| \*\*4\*\* \| \*\*3\*\* \| \*\*2 ✅ · 1 ⊘\*\* \| \*\*1\*\* \|/);
});

test('cada CA lista sus TC en orden, con link al it() y resultado; el salteado nombra su bug', () => {
  const md = report();
  const ca01 = md.indexOf('### CA-01');
  assert.ok(md.indexOf('TC-01.1 · SCRUM-806') > ca01 && md.indexOf('TC-01.2 · SCRUM-807') > md.indexOf('TC-01.1 · SCRUM-806'));
  assert.match(md, /\| TC-02\.1 · SCRUM-810 \| No se cambia con la actual incorrecta \| negativo \| 2 \| \[L81\]\(\.\.\/\.\.\/cypress\/e2e\/expandtesting-notes\/notes_tc_cambiar_contrasena\.cy\.js#L81\) \| ✅ PASSED \|/);
  assert.match(md, /⊘ salteado \(bug conocido SCRUM-833\)/);
  assert.match(md, /### CA-03: Sin TC todavía\.\n\n_Sin Test Cases automatizados\._/);
});

test('pasos tal como están en Xray, con el pipe escapado para no romper la tabla', () => {
  const md = report();
  assert.match(md, /\| 2 \| Escribir la actual \| Otra!Clave1 \| Queda completado\. \|/);
  assert.match(md, /### CA-02: Una actual incorrecta se rechaza \\\| con aviso\./);
});

test('bugs vinculados, fuera de alcance y TC sin automatizar al pie de la HU', () => {
  const md = report();
  assert.match(md, /- SCRUM-833 · Las sesiones previas siguen activas \(Tareas por hacer\)/);
  assert.match(md, /- Recuperar la contraseña por email\./);
  assert.match(md, /\*\*Test Cases vinculados sin automatizar:\*\* SCRUM-899/);
});

test('las HU salen ordenadas por número de key', () => {
  const md = report([story(), story({ key: 'SCRUM-745', summary: 'Notes App - Iniciar sesión' })]);
  assert.ok(md.indexOf('## SCRUM-745') < md.indexOf('## SCRUM-804'));
});
