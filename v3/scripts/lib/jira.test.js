/**
 * Cobertura de la plantilla de Historia (buildHistoriaDescription): las
 * secciones opcionales nacen del lote 2 de Practice Software Testing
 * (2026-09-25), donde las reglas de negocio relevadas (ej. "un solo Thor
 * Hammer por carrito"), los CA sin caso negativo justificados y los Bugs
 * relacionados quedaban solo en el chat o en docs/discovery.
 *
 * Correr con: node --test v3/scripts/lib/jira.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { buildHistoriaDescription, parseHistoriaDescription, buildBugDescription, captureFileName, buildMultipartBody, fetchIssuesByKeys, openLinkedBugs } = require('./jira');

const base = {
  como: 'cliente', quiero: 'comparar productos', para: 'elegir mejor',
  contexto: 'Contexto.', objetivo: 'Objetivo.', criterios: ['CA-01: Regla uno.', 'CA-02: Regla dos.']
};

const headings = (doc) => doc.content.filter(n => n.type === 'heading').map(n => n.content[0].text);
const listAfter = (doc, title) => {
  const i = doc.content.findIndex(n => n.type === 'heading' && n.content[0].text === title);
  return doc.content[i + 1].content.map(item => item.content[0].content[0].text);
};

test('HU sin secciones opcionales: mismo formato de siempre', () => {
  const doc = buildHistoriaDescription(base);

  assert.deepEqual(headings(doc), ['Contexto', 'Objetivo', 'Criterios de aceptación']);
  assert.deepEqual(listAfter(doc, 'Criterios de aceptación'), base.criterios);
});

test('HU con secciones opcionales: se agregan en orden y con su contenido', () => {
  const doc = buildHistoriaDescription({
    ...base,
    sinNegativo: { 'CA-02': 'Opcion que se activa y desactiva.' },
    reglasNegocio: ['Un solo Thor Hammer por carrito.'],
    fueraDeAlcance: ['Favoritos con sesion iniciada.'],
    defectosConocidos: ['SCRUM-459: el quinto producto se descarta sin aviso.']
  });

  assert.deepEqual(headings(doc), ['Contexto', 'Objetivo', 'Criterios de aceptación',
    'Criterios sin caso negativo (justificados)', 'Reglas de negocio relevadas', 'Fuera de alcance', 'Defectos conocidos relacionados']);
  assert.deepEqual(listAfter(doc, 'Criterios sin caso negativo (justificados)'), ['CA-02: Opcion que se activa y desactiva.']);
  assert.deepEqual(listAfter(doc, 'Defectos conocidos relacionados'), ['SCRUM-459: el quinto producto se descarta sin aviso.']);
});

test('secciones opcionales vacias o con motivos en blanco no se agregan', () => {
  const doc = buildHistoriaDescription({ ...base, sinNegativo: { 'CA-01': ' ' }, reglasNegocio: [], fueraDeAlcance: ['  '] });

  assert.deepEqual(headings(doc), ['Contexto', 'Objetivo', 'Criterios de aceptación']);
});

// Estándar del Bug (2026-09-27, ver lib/bug-validator.js): secciones fijas y
// sin "Observaciones", donde terminaban las listas de Test Cases.
const bug = {
  resumen: 'Resumen.', precondiciones: 'Precondiciones.', pasos: ['Paso uno.', 'Paso dos.'],
  resultadoActual: 'Actual.', resultadoEsperado: 'Esperado.', evidencia: 'PUT /users/{id} responde 200.',
  entorno: 'Toolshop v5.', severidad: 'Media', captura: 'exp/pw-vieja/screenshots/explore.cy.js/explore.png'
};

test('Bug: secciones del estándar en orden, sin Observaciones', () => {
  const doc = buildBugDescription({ ...bug, observaciones: 'Afecta al TC SCRUM-559.' });

  assert.deepEqual(headings(doc), ['Resumen del problema', 'Precondiciones', 'Pasos para reproducir', 'Resultado actual', 'Resultado esperado', 'Evidencia', 'Entorno', 'Severidad']);
  assert.deepEqual(listAfter(doc, 'Pasos para reproducir'), bug.pasos);
  assert.ok(!JSON.stringify(doc).includes('SCRUM-559'));
});

test('Bug con prioridad: se agrega al final', () => {
  assert.deepEqual(headings(buildBugDescription({ ...bug, prioridad: 'Alta' })).slice(-2), ['Severidad', 'Prioridad']);
});

test('Bug: la Evidencia nombra la captura adjunta', () => {
  const doc = buildBugDescription(bug);
  const i = doc.content.findIndex(n => n.type === 'heading' && n.content[0].text === 'Evidencia');
  assert.equal(doc.content[i + 2].content[0].text, 'Captura del navegador adjunta: explore.png');
});

test('captureFileName: carpeta del informe de explore-page + archivo', () => {
  const report = path.join('exp', 'pw-vieja', 'report.json');
  const exists = p => p === report;
  assert.equal(captureFileName(path.join('exp', 'pw-vieja', 'screenshots', 'explore.cy.js', 'explore.png'), { exists }), 'pw-vieja-explore.png');
  assert.equal(captureFileName(path.join('otra', 'captura.png'), { exists }), 'captura.png');
});

test('buildMultipartBody: un archivo en el campo "file" con su nombre y el contenido intacto', () => {
  const content = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff]);
  const body = buildMultipartBody('B0UND', 'pw-vieja-explore.png', content);
  const text = body.toString('latin1');
  assert.ok(text.startsWith('--B0UND\r\nContent-Disposition: form-data; name="file"; filename="pw-vieja-explore.png"\r\nContent-Type: image/png\r\n\r\n'));
  assert.ok(text.endsWith('\r\n--B0UND--\r\n'));
  assert.ok(body.includes(content));
});

// Índice de búsqueda de Jira desactualizado: una issue recién creada no sale
// en search/jql pero existe (caso real: SCRUM-737/738, 2026-09-30).
test('fetchIssuesByKeys: lee directo la issue que la búsqueda todavía no indexó', async () => {
  const issue = (key, type) => ({ key, fields: { issuetype: { name: type }, labels: ['CA-02'], issuelinks: [] } });
  const calls = [];
  const request = async (method, url) => {
    calls.push(`${method} ${url.split('?')[0]}`);
    if (method === 'POST') return { status: 200, body: { issues: [issue('SCRUM-736', 'Test')] } };
    if (url.startsWith('/rest/api/3/issue/SCRUM-737')) return { status: 200, body: issue('SCRUM-737', 'Test') };
    return { status: 404, body: {} };
  };
  const result = await fetchIssuesByKeys(['SCRUM-736', 'SCRUM-737', 'SCRUM-9999'], request);
  assert.deepEqual([...result.keys()].sort(), ['SCRUM-736', 'SCRUM-737']);
  assert.deepEqual(result.get('SCRUM-737'), { issuetype: 'Test', labels: ['CA-02'], linkedTests: [] });
  assert.deepEqual(calls, ['POST /rest/api/3/search/jql', 'GET /rest/api/3/issue/SCRUM-737', 'GET /rest/api/3/issue/SCRUM-9999']);
});

// Lectura de la HU publicada (antes storyFromDescription en story-coherence;
// el ADF no sale del adapter desde la revisión del 2026-10-03).
test('parseHistoriaDescription: lee de vuelta exactamente lo que escribe buildHistoriaDescription', () => {
  const historia = {
    como: 'persona que organiza sus tareas en Notes App', quiero: 'buscar mis notas', para: 'encontrar rápido un pendiente',
    contexto: 'En "My Notes"...', objetivo: 'Encontrar las notas.',
    criterios: ['CA-01: Uno.', 'CA-02: Dos.'],
    sinNegativo: { 'CA-02': 'no hay camino de error.' },
    reglasNegocio: ['Regla.'], fueraDeAlcance: ['Afuera.'], defectosConocidos: ['SCRUM-833: sesiones activas.']
  };
  const story = parseHistoriaDescription(buildHistoriaDescription(historia));
  assert.deepEqual(story, {
    como: historia.como, quiero: historia.quiero, para: historia.para,
    contexto: historia.contexto, objetivo: historia.objetivo, criterios: historia.criterios,
    reglasNegocio: historia.reglasNegocio, fueraDeAlcance: historia.fueraDeAlcance,
    defectosConocidos: historia.defectosConocidos, sinNegativoTexto: ['CA-02: no hay camino de error.']
  });
});

// Reporte de trazabilidad (2026-10-03): con withText trae el estado de la HU
// y sus Bugs vinculados ("Error" es el nombre visible del tipo Bug); la HU
// llega ya leída (`historia`), nunca como ADF.
test('fetchIssuesByKeys withText: estado, Bugs vinculados y la HU leída; sin withText la forma no cambia', async () => {
  const link = (key, type, status, summary = '') => ({ inwardIssue: { key, fields: { issuetype: { name: type }, status: { name: status }, summary } } });
  const description = buildHistoriaDescription({ como: 'usuario registrado', quiero: 'cambiar mi contraseña', para: 'proteger mi cuenta', contexto: 'c', objetivo: 'o', criterios: ['CA-01: Uno.'] });
  const story = { key: 'SCRUM-804', fields: {
    issuetype: { name: 'Historia' }, labels: [], summary: 'Cambiar mi contraseña', description, status: { name: 'Finalizada' },
    issuelinks: [link('SCRUM-806', 'Test', 'Draft'), link('SCRUM-833', 'Error', 'Tareas por hacer', 'Sesiones siguen activas')] } };
  const request = async () => ({ status: 200, body: { issues: [story] } });

  const full = (await fetchIssuesByKeys(['SCRUM-804'], request, { withText: true })).get('SCRUM-804');
  assert.equal(full.historia.quiero, 'cambiar mi contraseña');
  assert.deepEqual(full.historia.criterios, ['CA-01: Uno.']);
  assert.equal(full.description, undefined);
  assert.equal(full.status, 'Finalizada');
  assert.deepEqual(full.linkedTests, ['SCRUM-806']);
  assert.deepEqual(full.linkedBugs, [{ key: 'SCRUM-833', summary: 'Sesiones siguen activas', status: 'Tareas por hacer' }]);

  const plain = (await fetchIssuesByKeys(['SCRUM-804'], request)).get('SCRUM-804');
  assert.deepEqual(plain, { issuetype: 'Historia', labels: [], linkedTests: ['SCRUM-806'] });
});

test('regresion SCRUM-883: openLinkedBugs lista los Bugs sin terminar vinculados (en cualquier direccion) y deja afuera los terminados y lo que no es Bug', () => {
  const link = (dir, key, type, category, status = 'Tareas por hacer') => ({
    [dir]: { key, fields: { summary: `${key} resumen`, issuetype: { name: type }, status: { name: status, statusCategory: { key: category } } } }
  });
  const issuelinks = [
    link('inwardIssue', 'SCRUM-894', 'Bug', 'new'),
    link('outwardIssue', 'SCRUM-895', 'Error', 'indeterminate', 'En curso'),
    link('inwardIssue', 'SCRUM-857', 'Bug', 'done', 'Listo'),
    link('outwardIssue', 'SCRUM-885', 'Test', 'new')
  ];
  assert.deepEqual(openLinkedBugs(issuelinks), [
    { key: 'SCRUM-894', summary: 'SCRUM-894 resumen', status: 'Tareas por hacer' },
    { key: 'SCRUM-895', summary: 'SCRUM-895 resumen', status: 'En curso' }
  ]);
  assert.deepEqual(openLinkedBugs(undefined), []);
});
