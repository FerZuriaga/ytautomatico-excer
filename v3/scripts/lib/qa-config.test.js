/**
 * Cobertura de lib/qa-config.js y de los validadores con otra config
 * (D-43, 2026-10-03): el framework tiene que servir para otro proyecto u
 * otro idioma editando solo qa.config.json.
 *
 * Correr con: node --test v3/scripts/lib/qa-config.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { config, loadConfig, checkConfig, phrasesRegex, CONFIG_FILE } = require('./qa-config');
const validator = require('./testcase-validator');

const EXAMPLE_EN = path.resolve(path.dirname(CONFIG_FILE), 'qa.config.en.example.json');

test('la config del repo y el ejemplo en inglés están completos', () => {
  assert.equal(config.jira.projectKey, 'SCRUM');
  assert.equal(config.jira.issueTypes.Historia, 'Historia');
  const en = loadConfig(EXAMPLE_EN);
  assert.equal(en.jira.issueTypes.Historia, 'Story');
});

test('una config incompleta frena nombrando exactamente lo que falta', () => {
  const broken = JSON.parse(JSON.stringify(config));
  delete broken.jira.linkType;
  delete broken.jira.issueTypes.Test;
  delete broken.validadores.palabrasClave.verbosDeAccion;
  assert.throws(() => checkConfig(broken), /falta: jira\.linkType, jira\.issueTypes\.Test, validadores\.palabrasClave\.verbosDeAccion\./);
});

test('una config inexistente explica cómo crearla', () => {
  assert.throws(() => loadConfig('no-existe.json'), /Copiar qa\.config\.en\.example\.json como qa\.config\.json/);
});

test('phrasesRegex: palabra completa, "*" como cualquier terminación, sin tildes y con puntuación', () => {
  const words = phrasesRegex(['iniciar sesión', 'revert*']);
  assert.ok(words.test('debe iniciar sesion'));
  assert.ok(words.test('la nota queda revertida'));
  assert.ok(!words.test('reiniciar el equipo'));
  const connectors = phrasesRegex([';', ', y sin']);
  assert.ok(connectors.test('a; b'));
  assert.ok(connectors.test('con sesion avanza, y sin sesion no'));
});

test('con la config en inglés, los validadores entienden Test Cases en inglés sin tocar código', () => {
  const previous = validator.useKeywords(loadConfig(EXAMPLE_EN).validadores.palabrasClave);
  try {
    const step = (description, testData = '-') => ({ description, testData, expectedResult: 'Ok.' });
    const result = validator.validateTestCaseModel({
      name: 'Login', precondition: 'Account exists.',
      steps: [step('Open the login page'), step('Click on Login and verify the dashboard'), step('Type the email and the password'), step('Then open the menu')]
    }, 'TC');
    assert.match(result.errors.join(' | '), /paso 2 incluye una verificacion en la accion \("verify"\)/);
    const warnings = result.warnings.join(' | ');
    assert.match(warnings, /paso 3 parece cargar varios datos a la vez \("the email and the password"\)/);
    assert.match(warnings, /paso 4 usa una palabra de secuencia \("then"\)/);

    const story = validator.validateStoryText({ summary: 'Login', historia: {
      como: 'user', quiero: 'log in', para: 'see my notes', objetivo: 'Verify the login works',
      criterios: ['CA-01: A wrong password cannot log in.', 'CA-02: Valid credentials open the notes.']
    } }).warnings.join(' | ');
    assert.match(story, /usuario generico/);
    assert.match(story, /Objetivo esta escrito como objetivo de prueba/);
    assert.match(story, /CA-01 dice lo que no se puede hacer sin nombrar el resultado observable/);
  } finally {
    validator.useKeywords(previous);
  }
});

test('con la config en español, las mismas frases en inglés no disparan nada (cada proyecto, su idioma)', () => {
  const step = (description) => ({ description, testData: '-', expectedResult: 'Ok.' });
  const result = validator.validateTestCaseModel({ name: 'x', precondition: 'p', steps: [step('Abrir el login'), step('Click on Login and verify the dashboard')] }, 'TC');
  assert.deepEqual(result.errors, []);
});
