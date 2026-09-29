/**
 * Cobertura de internal-tools -- nace del 2026-09-29 (D-31): los Bugs
 * SCRUM-585, 596, 620 y 658 nombraban explore-page.js en la evidencia
 * publicada en Jira. Los textos de los casos son los reales de esos Bugs.
 *
 * Correr con: node --test v3/scripts/lib/internal-tools.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { findInternalTool, internalToolMessage } = require('./internal-tools');

test('detecta los scripts internos con que se publicaron los Bugs reales', () => {
  assert.equal(findInternalTool('En la exploración con explore-page.js la pantalla pidió GET /notes/api/notes/?search=Pan%20&%20queso'), 'explore-page.js');
  assert.equal(findInternalTool('Captura del paso Billing Address tomada con explore-page.js'), 'explore-page.js');
  assert.equal(findInternalTool('Detectado con la exploracion automatica (v3/scripts/explore-page.js) el 2026-09-26'), 'explore-page.js');
  assert.equal(findInternalTool('Validacion tecnica de v3/scripts/create-jira-task.js.'), 'v3/scripts/create-jira-task.js');
});

test('detecta specs, recetas, informes y archivos de trabajo de la suite', () => {
  assert.equal(findInternalTool('Falla en notes_tc_buscar_notas.cy.js'), 'notes_tc_buscar_notas.cy.js');
  assert.equal(findInternalTool('Datos armados con sess.sh'), 'sess.sh');
  assert.equal(findInternalTool('Ver el report.json del escenario'), 'report.json');
  assert.equal(findInternalTool('Lote armado con build-checkout.js'), 'build-checkout.js');
  assert.equal(findInternalTool('Corrida de run-and-report'), 'run-and-report');
  assert.equal(findInternalTool('Receta en v3/data-recipes/expandtesting-notes.json'), 'v3/data-recipes/expandtesting-notes.json');
});

test('herramientas de ejecución y del navegador, requests y textos funcionales: permitidos', () => {
  assert.equal(findInternalTool('Chrome headless vía Cypress 14, 2026-09-26.'), null);
  assert.equal(findInternalTool('En la inspección de red de DevTools la pantalla pidió GET /notes/api/notes/?search=Pan%20&%20queso (status 200).'), null);
  assert.equal(findInternalTool('Se muestra "Couldn\'t find any notes in all categories".'), null);
  assert.equal(findInternalTool('Exploramos la pantalla de facturas'), null);
  assert.equal(findInternalTool(undefined), null);
});

test('el mensaje indica dónde está y qué usar en su lugar', () => {
  const message = internalToolMessage('Bug X: "evidencia"', 'explore-page.js');
  assert.match(message, /Bug X: "evidencia" nombra una herramienta interna de la suite \("explore-page\.js"\)/);
  assert.match(message, /DevTools/);
});
