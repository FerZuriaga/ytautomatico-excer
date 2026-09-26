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
const { buildHistoriaDescription } = require('./jira');

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
