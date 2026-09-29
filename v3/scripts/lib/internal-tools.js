/**
 * Nombres internos de la suite de automatización que no pueden aparecer en
 * la documentación pública de Jira/Xray (Historias, Test Cases y Bugs).
 *
 * Acordado con el usuario el 2026-09-29 (D-31): la evidencia y los textos
 * se redactan en términos funcionales, de la pantalla, de DevTools y de las
 * requests de red/API. Caso real: los Bugs SCRUM-585, 596, 620 y 658
 * decían "captura tomada con explore-page.js" / "en la exploración con
 * explore-page.js".
 *
 * Cypress, Chrome o DevTools sí se pueden nombrar: son herramientas de
 * ejecución o del navegador, no scripts internos de la suite.
 *
 * Función pura: la usan bug-validator.js y testcase-validator.js.
 */

const INTERNAL_TOOL_PATTERNS = [
  /\bexplore-page(\.js)?\b/i,
  /\bv3\/(scripts|data-recipes|\.claude)\b(?:[\w/.-]*[\w/])?/i,
  /\b(create-jira-task|run-and-report|check-traceability|create-pull-request)(\.js)?\b/i,
  /\b(bundle-scan|data-recipe|payload-builder|explore-scenarios|testcase-validator|bug-validator|negative-evidence)(\.js|\.json)?\b/i,
  /\bsess\.sh\b/i,
  /\bbuild-[\w-]+\.js\b/i,
  /\b[\w-]+\.cy\.js\b/i,
  /\breport\.json\b/i,
  /\bscratchpad\b/i
];

// Primera mención de una herramienta interna en el texto, o null.
function findInternalTool(text) {
  if (typeof text !== 'string' || !text) return null;
  for (const re of INTERNAL_TOOL_PATTERNS) {
    const hit = text.match(re);
    if (hit) return hit[0];
  }
  return null;
}

function internalToolMessage(where, hit) {
  return `${where} nombra una herramienta interna de la suite ("${hit}") -- la documentación de Jira/Xray se redacta en términos funcionales, de la pantalla, de DevTools y de las requests de red/API (D-31).`;
}

module.exports = { findInternalTool, internalToolMessage, INTERNAL_TOOL_PATTERNS };
