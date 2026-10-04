// ESLint para el código de Cypress (D-42): specs, Page Objects, comandos y
// config. Reglas recomendadas de eslint-plugin-cypress (esperas fijas,
// asignar el retorno de un comando, encadenar después de una acción...).
// Correr con: npm run lint
const js = require('@eslint/js');
const pluginCypress = require('eslint-plugin-cypress');

module.exports = [
  {
    ignores: ['node_modules/', 'cypress/screenshots/', 'cypress/videos/', 'cypress/downloads/', 'v3/', 'eslint.config.js']
  },
  js.configs.recommended,
  pluginCypress.configs.recommended,
  {
    files: ['cypress/**/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    rules: {
      // Aviso, no error: al incorporar ESLint (2026-10-03) había 27 casos,
      // todos `.type(x).should('have.value', x)` en Page Objects de 4 apps
      // con tests verdes. Quedan como deuda visible (D-42); el código nuevo
      // separa la acción de la verificación.
      'cypress/unsafe-to-chain-command': 'warn'
    }
  },
  {
    files: ['cypress.config.js'],
    languageOptions: { sourceType: 'commonjs', globals: { require: 'readonly', module: 'writable' } }
  }
];
