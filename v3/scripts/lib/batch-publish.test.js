/**
 * Cobertura de lib/batch-publish.js — nace del Test Case SCRUM-911
 * (ParaBank, 2026-10-05): creado con sus pasos, falló al vincularse a la
 * HU y se informó como "fallido" sin su key, con el consejo de reintentarlo
 * (lo habría duplicado).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { runBatch, batchErrorMessage } = require('./batch-publish');

const models = ['A', 'B', 'C'].map(name => ({ name }));

test('regresion SCRUM-911: un Test Case creado que falla al completarse queda como incompleto con su key, no como fallido', async () => {
  let next = 909;
  const result = await runBatch(models, {
    create: async () => `SCRUM-${next++}`,
    complete: async key => { if (key === 'SCRUM-910') throw new Error('issueLink 500'); }
  });

  assert.deepEqual(result.succeeded, ['SCRUM-909', 'SCRUM-911']);
  assert.equal(result.incomplete.length, 1);
  assert.equal(result.incomplete[0].key, 'SCRUM-910');
  assert.equal(result.failed.length, 0);

  const message = batchErrorMessage(result, { issueKey: 'SCRUM-906', testCycleKey: 'SCRUM-907' });
  assert.match(message, /CREADOS A MEDIAS \(no volver a crearlos\)/);
  assert.match(message, /SCRUM-910 "B": issueLink 500/);
  assert.match(message, /create-jira-task\.js SCRUM-906 --complete-testcase <key> --test-cycle SCRUM-907/);
});

test('un Test Case que no llega a crearse queda como fallido y se puede volver a publicar', async () => {
  const result = await runBatch(models, {
    create: async model => { if (model.name === 'A') throw new Error('429'); return `K-${model.name}`; },
    complete: async () => {}
  });

  assert.deepEqual(result.succeeded, ['K-B', 'K-C']);
  assert.deepEqual(result.failed.map(f => f.model.name), ['A']);
  assert.match(batchErrorMessage(result, { issueKey: 'SCRUM-1', testCycleKey: null }), /NO se crearon \(se pueden volver a publicar\)/);
});

test('sin fallas no hay mensaje de error', async () => {
  const result = await runBatch(models, { create: async m => m.name, complete: async () => {} });
  assert.equal(batchErrorMessage(result, { issueKey: 'SCRUM-1' }), null);
});
