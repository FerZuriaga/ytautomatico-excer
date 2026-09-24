/**
 * Trazabilidad HU -> CA -> Test Case -> spec de Cypress.
 *
 * Dos huecos que cubre (punto 4 de la revisión del 2026-09-23):
 *   1. El campo `criterio` del Test Case (y su `tipo`) solo vivía en el
 *      payload: al publicar se perdía en Xray. Ahora se publica como
 *      labels del Test Case (`CA-01`, `negativo`).
 *   2. Las keys de Xray se copian a mano en los títulos de los `it()`
 *      ([CA-XX][TC-XX.Y][SCRUM-key]); un error de tipeo no lo detectaba
 *      nadie. checkTraceability cruza los tags de los specs contra lo
 *      publicado en Jira/Xray.
 *
 * Módulo puro: no habla con Jira/Xray ni lee archivos.
 */

const CRITERION_LABEL_REGEX = /^CA-\d{2}$/;
const TYPE_LABELS = ['positivo', 'negativo'];

/**
 * Labels de trazabilidad de un Modelo Canónico de Test Case: los labels
 * propios del modelo + el id del criterio + el tipo, sin repetidos.
 */
function buildTraceabilityLabels(model) {
  const labels = [...(Array.isArray(model?.labels) ? model.labels : [])];
  const criterio = String(model?.criterio || '').trim().toUpperCase();
  if (CRITERION_LABEL_REGEX.test(criterio)) labels.push(criterio);
  const tipo = String(model?.tipo || '').trim().toLowerCase();
  if (TYPE_LABELS.includes(tipo)) labels.push(tipo);
  return [...new Set(labels)];
}

function criterionFromLabels(labels) {
  return (labels || []).find(l => CRITERION_LABEL_REGEX.test(l)) || null;
}

function lineAt(source, index) {
  return source.slice(0, index).split('\n').length;
}

/**
 * Lee un spec de Cypress y devuelve la HU del `describe` (último tag
 * [KEY] de su título) y, por cada `it()`, sus tags de trazabilidad.
 * Convención: [CA-XX][TC-XX.Y][KEY], donde KEY es el Test Case de Xray.
 */
function parseSpecTags(source, file = 'spec') {
  const titleRegex = (fn) => new RegExp(`\\b${fn}\\(\\s*(['"\`])((?:\\\\.|(?!\\1)[\\s\\S])*?)\\1`, 'g');
  const keysIn = (title) => [...title.matchAll(/\[([A-Z][A-Z0-9]*-\d+(?:\.\d+)?)\]/g)].map(m => m[1]);

  const describe = titleRegex('describe').exec(source);
  const describeKeys = describe ? keysIn(describe[2]).filter(k => !/^(CA|TC)-/.test(k)) : [];

  const tests = [];
  // it.skip también cuenta: un test salteado por bug conocido sigue
  // automatizando su Test Case (caso real: SCRUM-346/347, Bug SCRUM-380).
  for (const match of source.matchAll(titleRegex('it(?:\\.skip)?'))) {
    const title = match[2];
    const tags = keysIn(title);
    tests.push({
      file,
      line: lineAt(source, match.index),
      title,
      ca: tags.find(t => /^CA-\d{2}$/.test(t)) || null,
      tc: tags.find(t => /^TC-\d{2}\.\d+$/.test(t)) || null,
      key: tags.filter(t => !/^(CA|TC)-/.test(t)).pop() || null
    });
  }

  return { file, story: describeKeys.pop() || null, tests };
}

/**
 * Cruza los specs parseados contra lo publicado.
 *
 * `issuesByKey`: Map key -> { issuetype, labels, linkedTests: [keys] }
 * con la info de Jira de las HU (describe) y de los Test Cases (it()).
 *
 * Errores (trazabilidad rota): it() sin los 3 tags, TC-XX.Y que no
 * corresponde a su CA-XX, key repetida entre it(), key inexistente o que
 * no es un Test, Test no vinculado a la HU del describe, label de
 * criterio en Xray distinto del CA del spec.
 * Warnings: spec sin HU en el describe, Test Case sin label de criterio
 * (publicado antes del 2026-09-24; `missingLabels` permite sincronizarlo),
 * Test Case vinculado a la HU que ningún it() automatiza.
 */
function checkTraceability(specs, issuesByKey) {
  const errors = [];
  const warnings = [];
  const missingLabels = [];
  const seenKeys = new Map();

  for (const spec of specs) {
    const story = spec.story ? issuesByKey.get(spec.story) : null;
    if (!spec.story) {
      warnings.push(`${spec.file}: el describe no tiene la key de la HU ([SCRUM-xxx]); no se puede verificar el vinculo HU -> Test.`);
    } else if (!story) {
      errors.push(`${spec.file}: la HU ${spec.story} del describe no existe en Jira.`);
    }

    for (const t of spec.tests) {
      const where = `${t.file}:${t.line}`;
      if (!t.ca || !t.tc || !t.key) {
        errors.push(`${where}: el it() no tiene los 3 tags [CA-XX][TC-XX.Y][KEY] ("${t.title.slice(0, 60)}").`);
        continue;
      }
      if (t.tc.slice(3, 5) !== t.ca.slice(3, 5)) {
        errors.push(`${where}: ${t.tc} no corresponde a ${t.ca}.`);
      }
      if (seenKeys.has(t.key)) {
        errors.push(`${where}: ${t.key} ya esta usado en ${seenKeys.get(t.key)}.`);
        continue;
      }
      seenKeys.set(t.key, where);

      const issue = issuesByKey.get(t.key);
      if (!issue) {
        errors.push(`${where}: ${t.key} no existe en Jira/Xray.`);
        continue;
      }
      if (issue.issuetype !== 'Test') {
        errors.push(`${where}: ${t.key} no es un Test Case (es "${issue.issuetype}").`);
        continue;
      }
      if (story && !(story.linkedTests || []).includes(t.key)) {
        errors.push(`${where}: ${t.key} no esta vinculado a la HU ${spec.story}.`);
      }

      const labelCa = criterionFromLabels(issue.labels);
      if (labelCa && labelCa !== t.ca) {
        errors.push(`${where}: el spec dice ${t.ca} pero en Xray ${t.key} tiene el label ${labelCa}.`);
      } else if (!labelCa) {
        warnings.push(`${where}: ${t.key} no tiene label de criterio en Xray (esperado ${t.ca}).`);
        missingLabels.push({ key: t.key, label: t.ca });
      }
    }

    if (story) {
      const automated = new Set(spec.tests.map(t => t.key));
      (story.linkedTests || []).filter(k => !automated.has(k)).forEach(k => {
        warnings.push(`${spec.file}: ${k} esta vinculado a ${spec.story} pero ningun it() de este spec lo automatiza.`);
      });
    }
  }

  return { errors, warnings, missingLabels };
}

module.exports = {
  buildTraceabilityLabels,
  criterionFromLabels,
  parseSpecTags,
  checkTraceability
};
