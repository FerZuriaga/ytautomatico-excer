/**
 * Validación del payload de un Bug antes de publicarlo en Jira (la corre
 * create-jira-task.js, también con --dry-run). Los errores frenan siempre.
 *
 * Estándar del ticket (acordado con el usuario 2026-09-27):
 *   - Secciones: Resumen, Precondiciones, Pasos para reproducir, Resultado
 *     actual, Resultado esperado, Evidencia y Entorno (más Severidad y,
 *     opcional, Prioridad, que clasifican el ticket). Nada más: la vieja
 *     sección "Observaciones" terminaba con listas de Test Cases ("Afecta
 *     al TC SCRUM-559").
 *   - Los Test Cases viven en Xray y las relaciones con otros issues van
 *     como enlaces de Jira (`linkTo`), nunca listados en el texto.
 *   - La Evidencia son hechos observables y medibles (errores de consola
 *     exactos, respuestas HTTP, capturas o informe de explore-page,
 *     entorno), sin especular sobre el código interno de la aplicación
 *     (nombres de funciones, componentes, condiciones) salvo que aparezcan
 *     en un stack trace real. Caso real: la evidencia del Bug SCRUM-528
 *     explicaba "la condición usa cusAddress.street.errors".
 */

const REQUIRED_TEXT = ['resumen', 'precondiciones', 'resultadoActual', 'resultadoEsperado', 'severidad', 'evidencia', 'entorno'];
const ALLOWED = new Set([...REQUIRED_TEXT, 'pasos', 'prioridad']);

const TEST_CASE_PATTERNS = [
  /\bTC-\d+(\.\d+)?\b/,
  /\bcasos? de prueba\b/i,
  /\btest ?cases?\b/i,
  /\bciclos? de prueba\b/i,
  /\btest ?cycles?\b/i
];

// Referencias al código interno de la app: llamadas a funciones, `this.x`,
// propiedades encadenadas en camelCase y vocabulario de implementación.
const CODE_PATTERNS = [
  { re: /\b[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*\(\s*[^()]*\)/, what: 'llamada a una función' },
  { re: /\bthis\.[A-Za-z_$]/, what: 'referencia a "this."' },
  { re: /\b[a-z][a-z0-9]*[A-Z][A-Za-z0-9]*\.[A-Za-z_$][\w$]*/, what: 'propiedad del código (camelCase encadenado)' },
  { re: /\b(funci[oó]n|funciones|m[eé]todos?|componentes?|validador(es)?|variables?|handler|callback|FormGroup|FormControl)\b/i, what: 'vocabulario de implementación' },
  { re: /\b(la condici[oó]n|el c[oó]digo|c[oó]digo fuente|la plantilla|el template)\b/i, what: 'descripción del código interno' }
];

const SPECULATION = /\b(probablemente|seguramente|posiblemente|parece que|pareciera|supuestamente|se supone|creo que|creemos|intuyo|asumo|quiz[aá]s?|tal vez)\b/i;

// Un stack trace real ("at fn (archivo.js:10:5)") habilita citar nombres de
// funciones: es lo que la aplicación mostró, no una suposición.
const STACK_TRACE = /\bat\s+\S+\s+\(?[^\s()]+:\d+:\d+\)?/;

function issuesOf(payload) {
  if (payload && Array.isArray(payload.issues)) return payload.issues;
  return payload ? [payload] : [];
}

function isBlank(value) {
  return typeof value !== 'string' || !value.trim();
}

function validateBug(issue, { projectKey = 'SCRUM' } = {}) {
  const label = `Bug "${issue.summary || '(sin summary)'}"`;
  const errors = [];
  const bug = issue.bug;
  if (!bug || typeof bug !== 'object') {
    return { errors: [`${label}: falta el objeto "bug" con las secciones del ticket.`] };
  }

  for (const field of REQUIRED_TEXT) {
    if (isBlank(bug[field])) errors.push(`${label}: falta la sección "${field}".`);
  }
  const steps = Array.isArray(bug.pasos) ? bug.pasos.filter(s => !isBlank(s)) : [];
  if (!steps.length) errors.push(`${label}: falta "pasos" (lista de pasos para reproducir).`);

  for (const field of Object.keys(bug)) {
    if (!ALLOWED.has(field)) {
      errors.push(`${label}: la sección "${field}" no es parte del estándar del Bug (Resumen, Precondiciones, Pasos, Resultado actual, Resultado esperado, Evidencia, Entorno, Severidad, Prioridad).`);
    }
  }

  const issueKey = new RegExp(`\\b${projectKey}-\\d+\\b`);
  const texts = Object.entries(bug).flatMap(([field, value]) =>
    (Array.isArray(value) ? value : [value]).filter(v => typeof v === 'string').map(v => [field, v]));
  for (const [field, text] of texts) {
    if (TEST_CASE_PATTERNS.some(re => re.test(text))) {
      errors.push(`${label}: "${field}" menciona Test Cases o ciclos; viven en Xray, no en la descripción del Bug.`);
    }
    const key = text.match(issueKey);
    if (key) {
      errors.push(`${label}: "${field}" cita ${key[0]}; las relaciones con otros issues van como enlace de Jira (linkTo), no en el texto.`);
    }
  }

  if (!isBlank(bug.evidencia)) {
    const evidence = bug.evidencia;
    const speculation = evidence.match(SPECULATION);
    if (speculation) {
      errors.push(`${label}: la evidencia especula ("${speculation[0]}"); solo hechos observados y medibles.`);
    }
    if (!STACK_TRACE.test(evidence)) {
      for (const { re, what } of CODE_PATTERNS) {
        const hit = evidence.match(re);
        if (hit) {
          errors.push(`${label}: la evidencia describe el código interno de la aplicación (${what}: "${hit[0]}"); solo se citan nombres del código si aparecen en un stack trace real.`);
          break;
        }
      }
    }
  }

  return { errors };
}

/**
 * Valida todos los Bugs del payload (formato de un issue o lote `issues`).
 * Devuelve { errors, bugCount }.
 */
function validateBugs(payload, options = {}) {
  const bugs = issuesOf(payload).filter(issue => issue && (issue.issuetype === 'Bug' || issue.bug));
  const errors = bugs.flatMap(issue => validateBug(issue, options).errors);
  return { errors, bugCount: bugs.length };
}

module.exports = { validateBug, validateBugs };
