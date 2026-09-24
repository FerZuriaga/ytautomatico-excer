/**
 * Descripción de un Test Case en Jira (formato ADF): objetivo +
 * precondición. Es el mismo formato que deja Xray al crear el Test Case
 * (xray.createTestCase: "<objetivo>\n\nPrecondición: <texto>"), que Jira
 * guarda como un párrafo con el objetivo y otro que empieza con
 * "Precondición:".
 *
 * Lo usa `create-jira-task.js --update-steps` para reemplazar la
 * precondición de un Test Case ya publicado CONSERVANDO su objetivo.
 *
 * Módulo puro: no habla con Jira/Xray.
 */

const PRECONDITION_PREFIX = 'Precondición:';

function paragraph(text) {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}

function textOf(node) {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  if (node.type === 'hardBreak') return '\n';
  return (node.content || []).map(textOf).join('');
}

/**
 * Devuelve el objetivo: el texto de los párrafos anteriores al que empieza
 * con "Precondición:". Una descripción vacía devuelve ''.
 */
function extractObjective(description) {
  const paragraphs = (description?.content || []).map(textOf).map(t => t.trim()).filter(Boolean);
  const objective = [];
  for (const text of paragraphs) {
    if (text.startsWith(PRECONDITION_PREFIX)) break;
    objective.push(text);
  }
  return objective.join('\n\n');
}

/**
 * Construye la descripción ADF con el objetivo y, si viene, la precondición.
 */
function buildTestCaseDescription(objective, precondition) {
  const content = [];
  if (String(objective || '').trim()) content.push(paragraph(objective.trim()));
  if (String(precondition || '').trim()) content.push(paragraph(`${PRECONDITION_PREFIX} ${precondition.trim()}`));
  return { type: 'doc', version: 1, content };
}

module.exports = {
  PRECONDITION_PREFIX,
  extractObjective,
  buildTestCaseDescription
};
