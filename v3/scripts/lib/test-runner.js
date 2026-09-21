/**
 * Test Runner Adapter — lee y normaliza el resultado nativo del Test
 * Runner (hoy Cypress, vía el reporter "json" de Mocha).
 *
 * Extraído de scripts/create-jira-task.js (ver
 * docs/architecture/architecture-v2-phase2-component-design.md, sección 8,
 * punto 7): este parsing no tiene nada que ver con Jira ni con el gestor
 * de Test Cases — es "cómo leer el resultado nativo del Test Runner", y
 * vivía en el script de Jira solo porque el flujo de reporte lo
 * necesitaba ahí.
 *
 * El día que el Test Runner cambie (ej. Cypress -> Playwright), este es el
 * único archivo que debería tocarse para que el reporte siga funcionando
 * igual.
 */
const fs = require('fs');
const path = require('path');

/**
 * Extrae el Test Case key de un titulo de test de Cypress. Convención
 * (ver CLAUDE.md, regla 4): el título lleva varios tags entre corchetes,
 * [CA-XX][TC-XX.X][<key real>], en ese orden — el key del Test Case
 * siempre es el último.
 *
 * En Zephyr las keys de Test Case llevan un prefijo "T" propio
 * (SCRUM-T5, secuencia independiente de los issues de Jira). En Xray un
 * Test Case ES un issue de Jira, así que su key es una key de Jira común
 * (SCRUM-72, sin "T") — por eso el patrón es genérico (letras+dígitos -
 * dígitos, formato estándar de key de Jira) en vez de hardcodear el "T"
 * de Zephyr. Con un patrón genérico, un tag como "[CA-01]" también
 * matchea la forma "LETRAS-DÍGITOS" — por eso se toma el ÚLTIMO match
 * del título, no el primero (bug real encontrado validando el reporte:
 * con el primer match, "[CA-01]" se confundía con la key real y el
 * reporte fallaba buscando un issue "CA-01" que no existe).
 */
function extractTestCaseKey(title) {
  if (!title) return null;
  const matches = [...title.matchAll(/\[([A-Z][A-Z0-9]*-\d+)\]/g)];
  return matches.length ? matches[matches.length - 1][1] : null;
}

/**
 * Traduce el estado de Mocha al vocabulario de status de Test Run de
 * Xray (confirmado contra la API real con getStatuses(): solo existen
 * "TO DO", "EXECUTING", "PASSED", "FAILED" por defecto — a diferencia de
 * Zephyr, no hay un status "Blocked"/"Pending" de fábrica). Un test
 * "pending" de Mocha no tiene equivalente seguro, así que se devuelve
 * null a propósito: el llamador (create-jira-task.js) ya frena y avisa
 * ante un estado no reconocido en vez de reportar algo inventado.
 */
function mapMochaStateToXray(state) {
  if (state === 'passed') return 'PASSED';
  if (state === 'failed') return 'FAILED';
  return null;
}

/**
 * El reporter "json" nativo de Mocha, tal como lo integra Cypress, no
 * incluye un campo "state" en tests[]; el estado real hay que derivarlo
 * de en cual de los arrays passes/failures/pending aparece cada test
 * (verificado corriendo un spec real, no asumido).
 */
function collectTestsWithState(results) {
  const withState = [];
  (results.passes || []).forEach(t => withState.push({ ...t, state: 'passed' }));
  (results.failures || []).forEach(t => withState.push({ ...t, state: 'failed' }));
  (results.pending || []).forEach(t => withState.push({ ...t, state: 'pending' }));
  return withState;
}

/**
 * Lee y parsea el archivo de resultados generado con
 * `cypress run --reporter json > archivo.json`.
 */
/**
 * Divide un texto en los documentos JSON individuales que contiene,
 * escaneando profundidad de llaves y respetando strings (para no
 * confundir un "}" literal dentro de un título de test con el cierre de
 * un documento). Necesario porque `cypress run --spec "a.cy.js,b.cy.js"`
 * corre cada spec como una instancia de Mocha independiente -- el
 * reporter "json" nativo hace su propio epilogue por spec, así que
 * stdout trae varios documentos JSON completos concatenados (sin
 * separador) en vez de uno solo apenas la corrida abarca más de un
 * archivo. Con un solo spec devuelve un array de un elemento, sin
 * cambiar el comportamiento de siempre.
 */
function splitConcatenatedJsonObjects(text) {
  const objects = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escapeNext) escapeNext = false;
      else if (ch === '\\') escapeNext = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth < 0) {
        throw new Error(`Llave de cierre "}" sin apertura correspondiente (posición ${i}) -- el contenido no es JSON válido.`);
      }
      if (depth === 0 && start !== -1) {
        objects.push(text.slice(start, i + 1));
        start = -1;
      }
    }
  }

  if (depth !== 0) {
    throw new Error(`Documento JSON incompleto o truncado (${depth} llave(s) sin cerrar) -- la corrida de Cypress puede no haber terminado de escribir el archivo.`);
  }

  return objects;
}

/**
 * Combina varios documentos de resultado (uno por spec) en uno solo, con
 * la misma forma que ya consume collectTestsWithState (stats + tests +
 * pending + failures + passes), para que el resto del pipeline no tenga
 * que saber que la corrida abarcó varios specs.
 */
function mergeResultsDocs(docs) {
  return docs.reduce((merged, doc) => ({
    stats: {
      suites: (merged.stats.suites || 0) + (doc.stats?.suites || 0),
      tests: (merged.stats.tests || 0) + (doc.stats?.tests || 0),
      passes: (merged.stats.passes || 0) + (doc.stats?.passes || 0),
      pending: (merged.stats.pending || 0) + (doc.stats?.pending || 0),
      failures: (merged.stats.failures || 0) + (doc.stats?.failures || 0)
    },
    tests: [...merged.tests, ...(doc.tests || [])],
    pending: [...merged.pending, ...(doc.pending || [])],
    failures: [...merged.failures, ...(doc.failures || [])],
    passes: [...merged.passes, ...(doc.passes || [])]
  }), { stats: {}, tests: [], pending: [], failures: [], passes: [] });
}

/**
 * Parsea el texto crudo de un archivo de resultados (uno o varios
 * documentos JSON concatenados) y devuelve un único resultado combinado.
 * Lógica pura (sin fs ni process.exit) para poder cubrirla con tests
 * reales sin tocar el filesystem ni terminar el proceso -- parseResultsFile
 * es la única que conoce la ruta del archivo y el manejo de error de CLI.
 */
function parseResultsText(raw, sourceLabel = 'resultados') {
  let docs;
  try {
    docs = splitConcatenatedJsonObjects(raw).map(s => JSON.parse(s));
  } catch (e) {
    throw new Error(`No se pudo parsear "${sourceLabel}": ${e.message}`);
  }

  if (!docs.length) {
    throw new Error(`"${sourceLabel}" no contiene ningún resultado de Cypress válido.`);
  }

  return docs.length === 1 ? docs[0] : mergeResultsDocs(docs);
}

function parseResultsFile(resultsPath) {
  let raw;
  try {
    raw = fs.readFileSync(path.resolve(resultsPath), 'utf8');
  } catch (e) {
    console.error(`No se pudo leer "${resultsPath}": ${e.message}`);
    process.exit(1);
  }

  try {
    return parseResultsText(raw, resultsPath);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

/**
 * Devuelve, a partir de un resultado ya parseado, solo los tests que
 * llevan un Test Case Key de Zephyr taggeado en el título, con su estado
 * ya normalizado (sin el vocabulario de Mocha/Zephyr todavía traducido —
 * eso lo hace mapMochaStateToZephyr).
 */
function collectTaggedTests(results) {
  return collectTestsWithState(results)
    .map(t => ({ fullTitle: t.fullTitle, state: t.state, testCaseKey: extractTestCaseKey(t.fullTitle) }))
    .filter(t => t.testCaseKey);
}

module.exports = {
  extractTestCaseKey,
  mapMochaStateToXray,
  collectTestsWithState,
  splitConcatenatedJsonObjects,
  mergeResultsDocs,
  parseResultsText,
  parseResultsFile,
  collectTaggedTests
};
