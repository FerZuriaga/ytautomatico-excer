/**
 * Cobertura de lib/affected-specs.js (run-and-report.js --affected). Nace
 * del lote de Checkout del 2026-09-26: la regresión completa de la app
 * corrió 108 tests cuando el cambio tocaba 2 page objects.
 *
 * Correr con: node --test v3/scripts/lib/affected-specs.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { findAffectedSpecs, healthSpecs, isAppRegistrationDiff, parseImports, parseCommandsDefined } = require('./affected-specs');

// Estructura real (resumida) de Practice Software Testing.
const SOURCES = new Map([
  ['cypress/pages/practicesoftwaretesting/PSTLoginPage.js', "const FIXTURE = 'selectors/practicesoftwaretesting/login.json'\nclass PSTLoginPage {}"],
  ['cypress/pages/practicesoftwaretesting/PSTCartPage.js', "const FIXTURE = 'selectors/practicesoftwaretesting/carrito.json'\nclass PSTCartPage { open() { cy.pstSeedCart([]) } }"],
  ['cypress/pages/practicesoftwaretesting/PSTCheckoutPage.js', "import PSTLoginPage from './PSTLoginPage'\nimport PSTCartPage from './PSTCartPage'\nconst FIXTURE = 'selectors/practicesoftwaretesting/checkout.json'"],
  ['cypress/pages/practicesoftwaretesting/PSTCatalogPage.js', "class PSTCatalogPage { visit() { cy.gotoPSTUrl('/') } }"],
  ['cypress/e2e/practicesoftwaretesting/pst_tc_login.cy.js', "import PSTLoginPage from '../../pages/practicesoftwaretesting/PSTLoginPage'"],
  ['cypress/e2e/practicesoftwaretesting/pst_tc_checkout_pago.cy.js', "import PSTCheckoutPage from '../../pages/practicesoftwaretesting/PSTCheckoutPage'"],
  ['cypress/e2e/practicesoftwaretesting/pst_tc_carrito_quitar.cy.js', "import PSTCartPage from '../../pages/practicesoftwaretesting/PSTCartPage'"],
  ['cypress/e2e/practicesoftwaretesting/pst_tc_catalogo_busqueda.cy.js', "import PSTCatalogPage from '../../pages/practicesoftwaretesting/PSTCatalogPage'"],
  ['cypress/e2e/commitquality/cq_tc_login.cy.js', "describe('x', () => { it('y', () => { cy.cqLogin() }) })"],
  ['cypress/support/commands/practicesoftwaretesting.js', "Cypress.Commands.add(\"gotoPSTUrl\", (route) => {})\nCypress.Commands.add(\"pstSeedCart\", (items) => {})"],
  ['cypress/support/commands/commitquality.js', "Cypress.Commands.add('cqLogin', () => {})"]
]);

test('regresion Checkout 2026-09-26: cambiar PSTLoginPage afecta sus specs y los que la importan en cadena', () => {
  const { specs, global, reasons } = findAffectedSpecs(SOURCES, ['cypress/pages/practicesoftwaretesting/PSTLoginPage.js']);

  assert.equal(global, false);
  assert.deepEqual(specs, [
    'cypress/e2e/practicesoftwaretesting/pst_tc_checkout_pago.cy.js',
    'cypress/e2e/practicesoftwaretesting/pst_tc_login.cy.js'
  ]);
  assert.equal(reasons.get('cypress/e2e/practicesoftwaretesting/pst_tc_login.cy.js'), 'importa cypress/pages/practicesoftwaretesting/PSTLoginPage.js');
});

test('un spec modificado se incluye aunque nada lo importe', () => {
  const { specs } = findAffectedSpecs(SOURCES, ['cypress\\e2e\\practicesoftwaretesting\\pst_tc_carrito_quitar.cy.js']);

  assert.deepEqual(specs, ['cypress/e2e/practicesoftwaretesting/pst_tc_carrito_quitar.cy.js']);
});

test('un fixture de selectores modificado afecta a los page objects que lo usan y a sus specs', () => {
  const { specs, reasons } = findAffectedSpecs(SOURCES, ['cypress/fixtures/selectors/practicesoftwaretesting/carrito.json']);

  assert.deepEqual(specs, [
    'cypress/e2e/practicesoftwaretesting/pst_tc_carrito_quitar.cy.js',
    'cypress/e2e/practicesoftwaretesting/pst_tc_checkout_pago.cy.js'
  ]);
  assert.equal(reasons.get('cypress/e2e/practicesoftwaretesting/pst_tc_carrito_quitar.cy.js'), 'importa cypress/pages/practicesoftwaretesting/PSTCartPage.js');
});

test('un archivo de comandos modificado afecta solo a quien llama a esos comandos (otra app no)', () => {
  const { specs } = findAffectedSpecs(SOURCES, ['cypress/support/commands/practicesoftwaretesting.js']);

  assert.deepEqual(specs, [
    'cypress/e2e/practicesoftwaretesting/pst_tc_carrito_quitar.cy.js',
    'cypress/e2e/practicesoftwaretesting/pst_tc_catalogo_busqueda.cy.js',
    'cypress/e2e/practicesoftwaretesting/pst_tc_checkout_pago.cy.js'
  ]);
});

test('cambios globales (config, e2e.js, commands.js) afectan a todos los specs', () => {
  const { specs, global } = findAffectedSpecs(SOURCES, ['cypress.config.js']);

  assert.equal(global, true);
  assert.equal(specs.length, 5);
});

test('regresion D-33: un cambio global corre solo las apps activas y deja afuera el legado', () => {
  const sources = new Map([...SOURCES, ['cypress/e2e/disco/d_tc_busqueda.cy.js', "describe('x', () => {})"]]);
  const { specs, global, skipped } = findAffectedSpecs(sources, ['cypress/support/commands.js'], { activeApps: ['practicesoftwaretesting', 'commitquality'] });

  assert.equal(global, true);
  assert.equal(specs.length, 5);
  assert.deepEqual(skipped, ['cypress/e2e/disco/d_tc_busqueda.cy.js']);
  assert.equal(findAffectedSpecs(sources, ['cypress.config.js']).specs.length, 6);
});

test('regresion alta de RBP: registrar una app nueva en los archivos globales no es cambio global', () => {
  const config = ['diff --git a/cypress.config.js b/cypress.config.js', '--- a/cypress.config.js', '+++ b/cypress.config.js', '@@ -18,0 +19 @@', '+    restfulBookerPlatformUrl: "https://automationintesting.online",'];
  const commands = ['--- a/cypress/support/commands.js', '+++ b/cypress/support/commands.js', '@@ -21,0 +22 @@', "+import './commands/restful-booker-platform'"];
  const pkg = ['--- a/package.json', '+++ b/package.json', '@@ -18,0 +19 @@', '+    "test:restful-booker-platform": "cypress run --spec \\"cypress/e2e/restful-booker-platform/**/*.cy.js\\"",'];
  assert.equal(isAppRegistrationDiff('cypress.config.js', config), true);
  assert.equal(isAppRegistrationDiff('cypress/support/commands.js', commands), true);
  assert.equal(isAppRegistrationDiff('package.json', pkg), true);

  // Cualquier otra cosa sigue siendo global: una opción nueva, un cambio o un borrado.
  assert.equal(isAppRegistrationDiff('cypress.config.js', ['@@ -5 +5 @@', '-  defaultCommandTimeout: 4000,', '+  defaultCommandTimeout: 8000,']), false);
  assert.equal(isAppRegistrationDiff('cypress.config.js', ['@@ -5,0 +6 @@', '+  retries: { runMode: 2 },']), false);
  assert.equal(isAppRegistrationDiff('cypress/support/e2e.js', ["+import './commands/x'"]), false);

  const { specs, global } = findAffectedSpecs(SOURCES, ['cypress.config.js', 'cypress/support/commands.js', 'cypress/support/commands/commitquality.js'],
    { registrationOnly: ['cypress.config.js', 'cypress/support/commands.js'] });
  assert.equal(global, false);
  assert.deepEqual(specs, ['cypress/e2e/commitquality/cq_tc_login.cy.js']);
});

test('cambios fuera de cypress/ (scripts, docs) no afectan a ningun spec', () => {
  const { specs } = findAffectedSpecs(SOURCES, ['v3/scripts/run-and-report.js', 'docs/discovery/practicesoftwaretesting.md']);

  assert.deepEqual(specs, []);
});

test('lectura de imports y comandos', () => {
  assert.deepEqual(parseImports("import A from '../a'\nimport './b'\nconst c = require(\"./c\")\nimport x from 'cypress'"), ['../a', './b', './c']);
  assert.deepEqual(parseCommandsDefined("Cypress.Commands.add('uno', () => {})\nCypress.Commands.overwrite(\"visit\", fn)"), ['uno', 'visit']);
});

test('healthSpecs: un spec por app activa, el de menos tests que corren (sin contar it.skip)', () => {
  const sources = new Map([
    ['cypress/e2e/app-a/a_largo.cy.js', "it('1')\nit('2')\nit('3')"],
    ['cypress/e2e/app-a/a_corto.cy.js', "it('1')\nit.skip('2')\nit.skip('3')"],
    ['cypress/e2e/app-b/b_todo_skip.cy.js', "it.skip('1')"],
    ['cypress/e2e/app-b/b_uno.cy.js', "it('1')\nit('2')"],
    ['cypress/e2e/legado/l.cy.js', "it('1')"]
  ]);
  assert.deepEqual(healthSpecs(sources, ['app-a', 'app-b', 'app-c']), ['cypress/e2e/app-a/a_corto.cy.js', 'cypress/e2e/app-b/b_uno.cy.js']);
});
