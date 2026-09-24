/**
 * Jira Adapter — transporte HTTP puro hacia la API de Jira + serialización
 * de contenido de negocio a formato ADF.
 *
 * Extraído de scripts/create-jira-task.js (ver
 * docs/architecture/architecture-v2-phase2-component-design.md, sección 8):
 * este archivo concentra únicamente lo que pertenece a Jira. Ningún Agent
 * ni Skill debería conocer los detalles de autenticación, endpoints o
 * formato ADF que hay acá dentro.
 */
require('dotenv').config();
const https = require('https');

const HOSTNAME = new URL(process.env.JIRA_URL).hostname;
const AUTH = 'Basic ' + Buffer.from(process.env.JIRA_EMAIL + ':' + process.env.JIRA_API_TOKEN).toString('base64');

function jiraRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: HOSTNAME, path, method,
      headers: {
        'Authorization': AUTH,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function createIssue({ projectKey, summary, issuetype, description }) {
  return jiraRequest('POST', '/rest/api/3/issue', {
    fields: {
      project: { key: projectKey },
      summary,
      issuetype: { name: issuetype },
      description
    }
  });
}

async function updateIssue(key, { summary, description }) {
  return jiraRequest('PUT', `/rest/api/3/issue/${key}`, { fields: { summary, description } });
}

async function getIssue(key) {
  return jiraRequest('GET', `/rest/api/3/issue/${key}`);
}

/**
 * Lee varias issues por key en pocas llamadas (search/jql, de a 50 keys
 * por consulta, paginando con nextPageToken). Devuelve un Map key ->
 * { issuetype, labels, linkedTests } donde linkedTests son las keys de
 * las issues de tipo "Test" vinculadas (en cualquier dirección). Una key
 * inexistente simplemente no aparece en el Map.
 */
async function getIssuesByKeys(keys) {
  const result = new Map();
  const unique = [...new Set(keys)];
  for (let i = 0; i < unique.length; i += 50) {
    const chunk = unique.slice(i, i + 50);
    let nextPageToken;
    do {
      const res = await jiraRequest('POST', '/rest/api/3/search/jql', {
        jql: `key in (${chunk.join(',')})`,
        fields: ['issuetype', 'labels', 'issuelinks'],
        maxResults: 100,
        nextPageToken
      });
      // Una key inexistente hace fallar el JQL completo ("An issue with key
      // ... does not exist"): se reintenta de a una para aislarla.
      if (res.status === 400 && chunk.length > 1) {
        for (const key of chunk) {
          (await getIssuesByKeys([key])).forEach((v, k) => result.set(k, v));
        }
        break;
      }
      if (res.status === 400) break;
      if (res.status !== 200) throw new Error(`Error leyendo issues (${res.status}): ${JSON.stringify(res.body)}`);
      for (const issue of res.body.issues || []) {
        const linkedTests = (issue.fields.issuelinks || [])
          .map(l => l.outwardIssue || l.inwardIssue)
          .filter(o => o && o.fields?.issuetype?.name === 'Test')
          .map(o => o.key);
        result.set(issue.key, { issuetype: issue.fields.issuetype.name, labels: issue.fields.labels || [], linkedTests });
      }
      nextPageToken = res.body.nextPageToken;
    } while (nextPageToken);
  }
  return result;
}

/**
 * Agrega labels a una issue sin pisar los existentes (operación "add" de
 * Jira: agregar un label que ya está no hace nada, es idempotente).
 */
async function addLabels(key, labels) {
  return jiraRequest('PUT', `/rest/api/3/issue/${key}`, {
    update: { labels: labels.map(label => ({ add: label })) }
  });
}

/**
 * Crea un link entre dos issues existentes (ej: Bug -> Historia relacionada).
 * linkTypeName por defecto 'Relates' (tipo de link estándar en Jira Cloud;
 * esta instancia no tiene instalado "Tests"/"is tested by" — verificado
 * contra GET /rest/api/3/issueLinkType).
 */
async function linkIssue(fromKey, toKey, linkTypeName = 'Relates') {
  return jiraRequest('POST', '/rest/api/3/issueLink', {
    type: { name: linkTypeName },
    inwardIssue: { key: fromKey },
    outwardIssue: { key: toKey }
  });
}

/**
 * Aplica una transición de estado a un issue existente.
 * Busca por nombre (case-insensitive) entre las transiciones disponibles
 * en el workflow real del issue. Si no hay coincidencia, informa las
 * transiciones disponibles por stderr y termina sin forzar nada.
 */
async function transitionIssue(key, name) {
  const res = await jiraRequest('GET', `/rest/api/3/issue/${key}/transitions`);
  if (res.status !== 200) {
    console.error('Error al obtener las transiciones disponibles:', JSON.stringify(res.body, null, 2));
    process.exit(1);
  }

  const transitions = (res.body && res.body.transitions) || [];
  const match = transitions.find(t => t.name.toLowerCase() === name.toLowerCase());

  if (!match) {
    console.error(`No existe la transición "${name}" para ${key}.`);
    console.error('Transiciones disponibles:', transitions.map(t => t.name).join(', ') || '(ninguna)');
    process.exit(1);
  }

  const transRes = await jiraRequest('POST', `/rest/api/3/issue/${key}/transitions`, {
    transition: { id: match.id }
  });

  if (transRes.status === 204) {
    console.log(`Transición aplicada en ${key}: "${match.name}".`);
  } else {
    console.error('Error al aplicar la transición:', JSON.stringify(transRes.body, null, 2));
    process.exit(1);
  }
}

/**
 * Construye el body ADF para un comentario a partir de texto plano.
 * Si el texto tiene saltos de línea, cada línea se convierte en su propio párrafo.
 */
function buildCommentBody(text) {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  return { type: 'doc', version: 1, content: (lines.length ? lines : [text]).map(p) };
}

/**
 * Agrega un comentario a un issue existente.
 */
async function addComment(key, text) {
  const res = await jiraRequest('POST', `/rest/api/3/issue/${key}/comment`, {
    body: buildCommentBody(text)
  });

  if (res.status === 201) {
    console.log(`Comentario agregado en ${key}.`);
  } else {
    console.error('Error al agregar el comentario:', JSON.stringify(res.body, null, 2));
    process.exit(1);
  }
}

// --- Serialización ADF (traduce contenido de negocio ya decidido por
// ProductAgent al formato de documento enriquecido de Jira) ---

function h(level, text) {
  return { type: 'heading', attrs: { level }, content: [{ type: 'text', text }] };
}
function p(text) {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}
function olist(items) {
  return { type: 'orderedList', content: items.map(t => ({ type: 'listItem', content: [p(t)] })) };
}

function buildDescription(steps) {
  return {
    type: 'doc', version: 1,
    content: [
      h(2, 'Pasos del caso de prueba'),
      olist(steps)
    ]
  };
}

/**
 * Descripción ADF para un Bug: Resumen, Precondiciones, Pasos para
 * reproducir, Resultado actual, Resultado esperado, Severidad, Prioridad,
 * Evidencia, Entorno, Observaciones.
 */
function buildBugDescription(bug) {
  const content = [
    h(2, 'Resumen del problema'), p(bug.resumen),
    h(2, 'Precondiciones'), p(bug.precondiciones),
    h(2, 'Pasos para reproducir'), olist(bug.pasos),
    h(2, 'Resultado actual'), p(bug.resultadoActual),
    h(2, 'Resultado esperado'), p(bug.resultadoEsperado),
    h(2, 'Severidad'), p(bug.severidad)
  ];
  if (bug.prioridad) content.push(h(2, 'Prioridad'), p(bug.prioridad));
  content.push(h(2, 'Evidencia'), p(bug.evidencia));
  if (bug.entorno) content.push(h(2, 'Entorno'), p(bug.entorno));
  if (bug.observaciones) content.push(h(2, 'Observaciones'), p(bug.observaciones));
  return { type: 'doc', version: 1, content };
}

/**
 * Descripción ADF para una Historia: Como/Quiero/Para, Contexto, Objetivo,
 * Criterios de aceptación. El contenido (qué dice cada sección) lo decide
 * ProductAgent — esta función solo lo traduce al formato ADF de Jira.
 */
function buildHistoriaDescription(historia) {
  return {
    type: 'doc', version: 1,
    content: [
      p(`Como ${historia.como}`),
      p(`Quiero ${historia.quiero}`),
      p(`Para ${historia.para}`),
      h(2, 'Contexto'), p(historia.contexto),
      h(2, 'Objetivo'), p(historia.objetivo),
      h(2, 'Criterios de aceptación'),
      { type: 'bulletList', content: historia.criterios.map(t => ({ type: 'listItem', content: [p(t)] })) }
    ]
  };
}

/**
 * Descripción ADF para una Tarea: Objetivo, Alcance, Entregables,
 * Resultado esperado.
 */
function buildTareaDescription(tarea) {
  return {
    type: 'doc', version: 1,
    content: [
      h(2, 'Objetivo'), p(tarea.objetivo),
      h(2, 'Alcance'), p(tarea.alcance),
      h(2, 'Entregables'), p(tarea.entregables),
      h(2, 'Resultado esperado'), p(tarea.resultadoEsperado)
    ]
  };
}

module.exports = {
  HOSTNAME,
  jiraRequest,
  createIssue,
  updateIssue,
  getIssue,
  getIssuesByKeys,
  addLabels,
  linkIssue,
  transitionIssue,
  addComment,
  buildDescription,
  buildBugDescription,
  buildHistoriaDescription,
  buildTareaDescription
};
