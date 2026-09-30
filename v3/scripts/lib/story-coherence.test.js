/**
 * Cobertura de story-coherence -- nace de la auditoría de Notes App del
 * 2026-09-29: SCRUM-659 contradecía a SCRUM-635 en el texto del resumen,
 * cubría algo que 635 dejaba fuera de alcance y repetía su regla del
 * resumen. Los textos son los publicados (versión original y corregida).
 *
 * Correr con: node --test v3/scripts/lib/story-coherence.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { checkStoryCoherence, storyFromDescription, storyKeysFromSpecs, appPrefix } = require('./story-coherence');

const FILTRAR = {
  key: 'SCRUM-635',
  summary: 'Notes App - Filtrar notas por categoría',
  historia: {
    criterios: [
      'CA-01: La lista muestra solo las notas de la categoría elegida, y la pestaña All muestra todas.',
      'CA-02: El resumen de notas completadas cuenta solo las notas de la categoría elegida.',
      'CA-03: La categoría elegida se conserva al recargar la página.'
    ],
    reglasNegocio: [
      'Una categoría sin notas muestra el aviso "You don\'t have any notes in the <categoría> category" en lugar de la lista.',
      'Cuando todas las notas de la categoría están completadas, el resumen dice "You have completed all notes in the <categoría> category".'
    ],
    fueraDeAlcance: [
      'El orden de la lista (pendientes primero), que es una regla de la lista y no del filtro.',
      'Combinar el filtro con la búsqueda de notas (Historia propia).'
    ]
  }
};

const BUSCAR = {
  key: 'SCRUM-646',
  summary: 'Notes App - Buscar notas',
  historia: {
    criterios: [
      'CA-01: Al confirmar la búsqueda se muestran solo las notas cuyo título o descripción contienen el texto buscado, sin distinguir mayúsculas de minúsculas.',
      'CA-02: La búsqueda muestra solo las coincidencias de la categoría elegida.',
      'CA-03: Confirmar la búsqueda con el campo vacío vuelve a mostrar todas las notas.'
    ],
    reglasNegocio: ['Si no hay coincidencias se muestra "Couldn\'t find any notes in all categories" o, con una categoría elegida, "Couldn\'t find any notes in the <categoría> category".'],
    fueraDeAlcance: ['Conservar los resultados de la búsqueda al recargar la página (no priorizado en este lote).']
  }
};

const COMPLETAR_ORIGINAL = {
  summary: 'Notes App - Marcar notas como completadas o pendientes',
  historia: {
    criterios: [
      'CA-01: Una nota pendiente se marca como completada desde su tarjeta y queda guardada así.',
      'CA-02: Una nota completada vuelve a pendiente desde su tarjeta y queda guardada así.',
      'CA-03: El resumen de notas completadas se actualiza al cambiar el estado de una nota en la categoría elegida.',
      'CA-04: La lista muestra primero las notas pendientes y al final las completadas.'
    ],
    reglasNegocio: ['Con todas las notas de la categoría completadas, el resumen dice "You have completed all notes".'],
    fueraDeAlcance: ['Marcar como completada desde el formulario de edición (Historia "Editar una nota").']
  }
};

test('regresion SCRUM-659 original: detecta el mensaje contradictorio, el fuera de alcance cubierto y el criterio repetido', () => {
  const { warnings, siblings } = checkStoryCoherence(COMPLETAR_ORIGINAL, [FILTRAR, BUSCAR]);
  assert.deepEqual(siblings, ['SCRUM-635', 'SCRUM-646']);
  const all = warnings.join(' | ');
  assert.match(all, /cita "You have completed all notes" y SCRUM-635 \(reglasNegocio\) cita "You have completed all notes in the <categoría> category"/);
  assert.match(all, /CA-04 parece cubrir lo que SCRUM-635 dejó fuera de alcance \("El orden de la lista/);
  assert.match(all, /CA-03 se parece a SCRUM-635 CA-02/);
  assert.equal(warnings.length, 3);
});

test('SCRUM-659 y SCRUM-635 corregidas: queda solo el aviso del criterio parecido (superposición aceptada)', () => {
  const completar = {
    ...COMPLETAR_ORIGINAL,
    key: 'SCRUM-659',
    historia: {
      ...COMPLETAR_ORIGINAL.historia,
      reglasNegocio: ['Con todas las notas completadas, el resumen dice "You have completed all notes" en la pestaña All y "You have completed all notes in the <categoría> category" dentro de una categoría.']
    }
  };
  const filtrar = { ...FILTRAR, historia: { ...FILTRAR.historia, fueraDeAlcance: ['El orden de la lista (pendientes primero y completadas al final): regla de la lista, cubierta en la Historia SCRUM-659.'] } };
  const { warnings } = checkStoryCoherence(completar, [filtrar, BUSCAR, completar]);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /CA-03 se parece a SCRUM-635 CA-02/);
});

test('HU que conviven sin pisarse: buscar contra filtrar no avisa', () => {
  assert.deepEqual(checkStoryCoherence(BUSCAR, [FILTRAR]).warnings, []);
});

test('solo compara con HU de la misma app (prefijo del summary)', () => {
  const otraApp = { ...FILTRAR, key: 'SCRUM-586', summary: 'Practice Software Testing - Facturas' };
  assert.deepEqual(checkStoryCoherence(COMPLETAR_ORIGINAL, [otraApp]).siblings, []);
  assert.equal(appPrefix('Notes App - Buscar notas'), 'notes app');
  assert.equal(appPrefix('Sin prefijo'), null);
});

test('storyKeysFromSpecs: toma las HU del encabezado de los specs, sin los Test Cycles', () => {
  const specs = [
    '// Modulo: Notas\n// Ticket Jira: SCRUM-646 (CA-01..CA-03, Test Cycle SCRUM-647)\n',
    '// Ticket Jira: SCRUM-502 / SCRUM-508 (Test Cycles SCRUM-503)\n',
    '// Ticket Jira: SCRUM-64\n'
  ];
  assert.deepEqual(storyKeysFromSpecs(specs), ['SCRUM-646', 'SCRUM-502', 'SCRUM-508', 'SCRUM-64']);
});

test('storyFromDescription: lee las secciones de la HU publicada (formato de buildHistoriaDescription)', () => {
  const p = text => ({ type: 'paragraph', content: [{ type: 'text', text }] });
  const h = text => ({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text }] });
  const list = items => ({ type: 'bulletList', content: items.map(t => ({ type: 'listItem', content: [p(t)] })) });
  const adf = { type: 'doc', content: [
    p('Como persona que organiza sus tareas en Notes App'), p('Quiero buscar mis notas'), p('Para encontrar rápido un pendiente'),
    h('Contexto'), p('En "My Notes"...'), h('Objetivo'), p('Encontrar las notas.'),
    h('Criterios de aceptación'), list(['CA-01: Uno.', 'CA-02: Dos.']),
    h('Reglas de negocio relevadas'), list(['Regla.']), h('Fuera de alcance'), list(['Afuera.'])
  ] };
  const story = storyFromDescription(adf);
  assert.equal(story.como, 'persona que organiza sus tareas en Notes App');
  assert.equal(story.quiero, 'buscar mis notas');
  assert.deepEqual(story.criterios, ['CA-01: Uno.', 'CA-02: Dos.']);
  assert.deepEqual(story.reglasNegocio, ['Regla.']);
  assert.deepEqual(story.fueraDeAlcance, ['Afuera.']);
});

test('regresion lote RBP (2026-09-29): dos HU nuevas del mismo lote (sin key) se comparan entre sí y se nombran por su summary', () => {
  const enviar = { summary: 'Restful Booker Platform - Enviar una consulta al hotel', historia: { criterios: ['CA-01: Una consulta se envía.'] } };
  const leer = { summary: 'Restful Booker Platform - Leer las consultas recibidas', historia: { criterios: ['CA-01: La consulta aparece en la bandeja.'] } };
  const { siblings } = checkStoryCoherence(enviar, [enviar, leer]);
  assert.deepEqual(siblings, ['"Restful Booker Platform - Leer las consultas recibidas"']);
});
