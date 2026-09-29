/**
 * Cobertura de lib/bug-validator.js. Nace del estándar de Bugs acordado el
 * 2026-09-27: la sección "Observaciones" terminaba listando Test Cases
 * ("Afecta al TC SCRUM-559") y la evidencia del Bug SCRUM-528 especulaba
 * sobre el código de la app ("la condición usa cusAddress.street.errors").
 *
 * Correr con: node --test v3/scripts/lib/bug-validator.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { validateBug: validateBugRaw, validateBugs: validateBugsRaw } = require('./bug-validator');

const CAPTURE = 'exp/perfil-casa/screenshots/explore.cy.js/explore.png';
const EXPLORE_REPORT = { generator: 'explore-page', generatedAt: '2026-09-27T22:40:00Z' };
const okInspect = () => ({ png: true, report: EXPLORE_REPORT });

// La captura se lee de disco; en los tests se inyecta salvo el caso que
// prueba la lectura real.
const validateBug = (issue, opts = {}) => validateBugRaw(issue, { inspectCapture: okInspect, ...opts });
const validateBugs = (payload, opts = {}) => validateBugsRaw(payload, { inspectCapture: okInspect, ...opts });

// Bug SCRUM-585 tal como quedaría con el estándar nuevo.
const validBug = (overrides = {}) => ({
  issuetype: 'Bug',
  summary: 'Perfil: guardar los datos personales borra el número de casa de la dirección',
  linkTo: [{ key: 'SCRUM-565', type: 'Relates' }, { key: 'SCRUM-561', type: 'Relates' }],
  bug: {
    resumen: 'Al hacer clic en "Update Profile" la dirección del cliente queda sin número de casa aunque tenía uno cargado.',
    precondiciones: 'Cliente registrado con sesión iniciada, con número de casa 42 en su dirección.',
    pasos: ['Abrir la pantalla "Profile" de la cuenta.', 'Reemplazar la calle por Av Colon 100.', 'Hacer clic en "Update Profile".'],
    resultadoActual: 'Se muestra "Your profile is successfully updated!" y la dirección queda sin número de casa.',
    resultadoEsperado: 'La dirección conserva el número de casa 42 y solo cambia la calle.',
    severidad: 'Media',
    evidencia: 'Al hacer clic en "Update Profile" se muestra "Your profile is successfully updated!"; al volver a abrir "Profile" el número de casa aparece vacío (antes 42). Captura de la pantalla adjunta.',
    entorno: 'https://practicesoftwaretesting.com (Toolshop v5), Chrome headless, 2026-09-27.',
    captura: CAPTURE,
    ...overrides
  }
});

test('Bug con el estándar completo: sin errores', () => {
  assert.deepEqual(validateBug(validBug()).errors, []);
});

test('faltan secciones obligatorias (entorno, pasos, evidencia): error por cada una', () => {
  const { errors } = validateBug(validBug({ entorno: '', pasos: [], evidencia: '  ' }));
  assert.equal(errors.length, 3);
  assert.match(errors.join('\n'), /"entorno"/);
  assert.match(errors.join('\n'), /"pasos"/);
  assert.match(errors.join('\n'), /"evidencia"/);
});

test('sección fuera del estándar (observaciones): error', () => {
  const { errors } = validateBug(validBug({ observaciones: 'El checkout también pierde el número de casa.' }));
  assert.equal(errors.length, 1);
  assert.match(errors[0], /"observaciones" no es parte del estándar/);
});

test('caso real SCRUM-560: listar el Test Case afectado en la descripción es error', () => {
  const { errors } = validateBug(validBug({ resultadoActual: 'La cuenta se crea. Afecta al TC SCRUM-559 (queda en espera).' }));
  assert.ok(errors.some(e => /cita SCRUM-559/.test(e)));
});

test('menciones a Test Cases o ciclos sin key también son error', () => {
  for (const text of ['Ver TC-02.1.', 'Los casos de prueba del CA-02 quedan en espera.', 'Test Cases afectados: 3.', 'Se reportó en el ciclo de prueba.']) {
    const { errors } = validateBug(validBug({ resumen: text }));
    assert.ok(errors.some(e => /Test Cases o ciclos/.test(e)), text);
  }
});

test('relación con otro Bug citada en el texto: error (va en linkTo)', () => {
  const { errors } = validateBug(validBug({ resumen: 'Relacionado con SCRUM-561: el registro tampoco guarda el número de casa.' }));
  assert.equal(errors.length, 1);
  assert.match(errors[0], /linkTo/);
});

test('números que no son keys del proyecto (factura INV-...) no se confunden con issues', () => {
  const { errors } = validateBug(validBug({ resultadoActual: 'Se muestra "Thanks for your order! Your invoice number is INV-2026000123".' }));
  assert.deepEqual(errors, []);
});

test('caso real SCRUM-528: evidencia que describe el código interno es error', () => {
  const { errors } = validateBug(validBug({ evidencia: 'Los campos nunca se marcan: la condición usa cusAddress.street.errors (siempre undefined en un FormGroup).' }));
  assert.equal(errors.length, 1);
  assert.match(errors[0], /código interno/);
});

test('evidencia con funciones, this. o vocabulario de implementación: error', () => {
  for (const evidencia of [
    'Al hacer clic se llama a updatePassword() sin datos.',
    'this.profile es undefined al enviar.',
    'El validador del componente no se ejecuta.',
    'El método que arma el request omite el campo.'
  ]) {
    const { errors } = validateBug(validBug({ evidencia }));
    assert.ok(errors.some(e => /código interno/.test(e)), evidencia);
  }
});

test('evidencia especulativa: error', () => {
  const { errors } = validateBug(validBug({ evidencia: 'Tras "Update Profile" el número de casa queda vacío; probablemente el servicio pisa la dirección completa.' }));
  assert.equal(errors.length, 1);
  assert.match(errors[0], /especula \("probablemente"\)/);
});

test('con stack trace real se pueden citar nombres de funciones', () => {
  const evidencia = 'Consola: TypeError: Cannot read properties of undefined (reading \'id\')\n    at ProfileComponent.updatePassword (main-SCJRSYE5.js:1:2345)\nLa contraseña no cambia.';
  assert.deepEqual(validateBug(validBug({ evidencia })).errors, []);
});

test('hechos observables con paréntesis y campos de la respuesta no son código', () => {
  const evidencia = 'Al recargar, el número de casa aparece vacío (null). Consola: "Cannot read properties of undefined (reading \'cart_items\')" x250. Captura de la pantalla adjunta.';
  assert.deepEqual(validateBug(validBug({ evidencia })).errors, []);
});

test('validateBugs: recorre el lote y solo valida los Bugs', () => {
  const payload = { issues: [
    { issuetype: 'Historia', summary: 'HU', historia: {} },
    validBug(),
    validBug({ observaciones: 'x' })
  ] };
  const { errors, bugCount } = validateBugs(payload);
  assert.equal(bugCount, 2);
  assert.equal(errors.length, 1);
});

test('validateBugs: payload de un solo Bug (sin issues)', () => {
  assert.deepEqual(validateBugs(validBug()), { errors: [], bugCount: 1 });
});

test('Bug sin objeto "bug": error explícito', () => {
  const { errors } = validateBug({ issuetype: 'Bug', summary: 'X' });
  assert.match(errors[0], /falta el objeto "bug"/);
});

// ─── Captura de pantalla obligatoria (2026-09-27) ─────────────────────────────

test('Bug sin captura: error (sin evidencia gráfica no se publica)', () => {
  for (const captura of [undefined, '', []]) {
    const { errors } = validateBug(validBug({ captura }));
    assert.equal(errors.length, 1, String(captura));
    assert.match(errors[0], /falta la captura de pantalla/);
  }
});

test('captura que no es .png: error', () => {
  const { errors } = validateBug(validBug({ captura: 'exp/perfil-casa/screenshots/explore.jpg' }));
  assert.equal(errors.length, 1);
  assert.match(errors[0], /no es un archivo \.png/);
});

test('captura inexistente o ilegible: error', () => {
  const inspectCapture = () => { const e = new Error('no existe'); e.code = 'ENOENT'; throw e; };
  const { errors } = validateBug(validBug(), { inspectCapture });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /no se pudo leer la captura .*ENOENT/);
});

test('.png que no es una imagen PNG real: error', () => {
  const { errors } = validateBug(validBug(), { inspectCapture: () => ({ png: false, report: EXPLORE_REPORT }) });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /no es una imagen PNG válida/);
});

test('captura que no salió de explore-page (sin informe u otro generador): error', () => {
  for (const report of [null, { generator: 'cypress' }]) {
    const { errors } = validateBug(validBug(), { inspectCapture: () => ({ png: true, report }) });
    assert.equal(errors.length, 1);
    assert.match(errors[0], /no la tomó explore-page\.js/);
  }
});

test('varias capturas: se valida cada una', () => {
  const inspectCapture = p => ({ png: !p.includes('rota'), report: EXPLORE_REPORT });
  const { errors } = validateBug(validBug({ captura: [CAPTURE, 'exp/rota/screenshots/explore.cy.js/explore.png'] }), { inspectCapture });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /rota/);
});

test('la ruta de la captura no se revisa como texto del ticket', () => {
  assert.deepEqual(validateBug(validBug({ captura: 'exp/SCRUM-585-TC-01.1/screenshots/explore.png' })).errors, []);
});

test('lectura real de disco: PNG de explore-page válido y archivo sin firma PNG', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'bug-validator-'));
  try {
    const shots = path.join(out, 'screenshots', 'explore.cy.js');
    fs.mkdirSync(shots, { recursive: true });
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(EXPLORE_REPORT));
    const good = path.join(shots, 'explore.png');
    fs.writeFileSync(good, Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from('datos')]));
    const fake = path.join(shots, 'falsa.png');
    fs.writeFileSync(fake, 'no soy una imagen');
    const loose = path.join(os.tmpdir(), `suelta-${process.pid}.png`);
    fs.copyFileSync(good, loose);

    assert.deepEqual(validateBugRaw(validBug({ captura: good })).errors, []);
    assert.match(validateBugRaw(validBug({ captura: fake })).errors.join(' | '), /no es una imagen PNG válida/);
    assert.match(validateBugRaw(validBug({ captura: loose })).errors.join(' | '), /no la tomó explore-page\.js/);
    fs.rmSync(loose);
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});

test('regresion D-31: la evidencia que nombra un script interno de la suite es error; Cypress en el entorno no', () => {
  const original = 'En la exploración con explore-page.js la pantalla pidió GET /notes/api/notes/?search=Pan%20&%20queso (status 200).';
  const errors = validateBug(validBug({ evidencia: original })).errors.join(' | ');
  assert.match(errors, /"evidencia" nombra una herramienta interna de la suite \("explore-page\.js"\)/);
  assert.deepEqual(validateBug(validBug({ entorno: 'https://practicesoftwaretesting.com (Toolshop v5), Chrome headless vía Cypress 14.' })).errors, []);
  assert.match(validateBug(validBug({ pasos: ['Correr notes_tc_buscar_notas.cy.js'] })).errors.join(' | '), /"pasos" nombra una herramienta interna/);
});

test('regresion SCRUM-658: requests, rutas y URLs en el texto del Bug son error; la URL del sitio en el entorno no', () => {
  const evidencia = 'La pantalla pidió GET /notes/api/notes/?search=Pan%20&%20queso (status 200) y devolvió las dos notas.';
  assert.match(validateBug(validBug({ evidencia })).errors.join(' | '), /"evidencia" trae detalle de red \(request HTTP: "GET \/notes\/api\/notes\/\?search=Pan%20&%20queso"\)/);
  assert.match(validateBug(validBug({ evidencia: 'La dirección queda en /notes/app/search?keyword=Pan%20%26%20queso.' })).errors.join(' | '), /detalle de red \(ruta/);
  assert.match(validateBug(validBug({ pasos: ['Abrir https://practice.expandtesting.com/notes/app'] })).errors.join(' | '), /"pasos" trae detalle de red \(URL/);
  // Fechas, conteos y textos de la pantalla con "/" no son rutas.
  const functional = 'Con las notas "Pan & queso" y "Pan dulce", buscar "Pan & queso" muestra las dos tarjetas y el resumen "You have 0/2 notes completed in the all categories"; vence el 12/2030 (captura adjunta).';
  assert.deepEqual(validateBug(validBug({ evidencia: functional })).errors, []);
});
