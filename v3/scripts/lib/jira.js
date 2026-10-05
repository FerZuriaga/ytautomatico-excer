/**
 * Jira Adapter — transporte HTTP puro hacia la API de Jira + serialización
 * de contenido de negocio a formato ADF.
 *
 * Este archivo concentra únicamente lo que pertenece a Jira (mapa en
 * docs/architecture/herramientas.md): ningún otro conoce los detalles de
 * autenticación, endpoints o formato ADF que hay acá dentro. Los nombres
 * propios de la instancia (tipos de issue, tipo de vínculo) vienen de
 * qa.config.json (D-43).
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const { withRetry, logRetry } = require('./http-retry');
const { onBody } = require('./http-body');
const { config } = require('./qa-config');

const JIRA = config.jira;

const HOSTNAME = new URL(process.env.JIRA_URL).hostname;
const AUTH = 'Basic ' + Buffer.from(process.env.JIRA_EMAIL + ':' + process.env.JIRA_API_TOKEN).toString('base64');

// Solo las operaciones idempotentes se reintentan ante una falla de red
// (lib/http-retry.js): lecturas, PUT y la búsqueda JQL (POST de solo lectura).
function isIdempotent(method, path) {
  return method === 'GET' || method === 'PUT' || (method === 'POST' && path.startsWith('/rest/api/3/search'));
}

function jiraRequest(method, path, body = null) {
  if (isIdempotent(method, path)) return withRetry(() => jiraRequestOnce(method, path, body), { onRetry: logRetry(`Jira ${method} ${path}`) });
  return jiraRequestOnce(method, path, body);
}

function jiraRequestOnce(method, path, body = null) {
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
      onBody(res, data => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// `issuetype` es el tipo del payload (Historia, Bug, Tarea): en Jira se
// crea con el nombre que tenga en esta instancia (config jira.issueTypes).
async function createIssue({ projectKey, summary, issuetype, description }) {
  return jiraRequest('POST', '/rest/api/3/issue', {
    fields: {
      project: { key: projectKey },
      summary,
      issuetype: { name: JIRA.issueTypes[issuetype] || issuetype },
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
 * inexistente simplemente no aparece en el Map. Con `withText` trae además
 * summary y description (ADF): los usa el chequeo de coherencia entre HU.
 */
async function getIssuesByKeys(keys, options = {}) {
  return fetchIssuesByKeys(keys, jiraRequest, options);
}

// Nombres con que la instancia muestra el tipo Bug (acá también "Error").
const BUG_TYPES = JIRA.bugTypeNames;

// Bugs vinculados a un issue (en cualquier dirección), con su estado. done =
// categoría de estado "terminado" de Jira, no un nombre de estado.
function linkedBugsOf(issuelinks) {
  return (issuelinks || []).map(l => l.outwardIssue || l.inwardIssue).filter(Boolean)
    .filter(o => BUG_TYPES.includes(o.fields?.issuetype?.name))
    .map(o => ({ key: o.key, summary: o.fields.summary || '', status: o.fields.status?.name || null, done: o.fields.status?.statusCategory?.key === 'done' }));
}

function issueEntry(issue, withText) {
  const linked = (issue.fields.issuelinks || []).map(l => l.outwardIssue || l.inwardIssue).filter(Boolean);
  const linkedTests = linked.filter(o => o.fields?.issuetype?.name === JIRA.issueTypes.Test).map(o => o.key);
  const entry = { issuetype: issue.fields.issuetype.name, labels: issue.fields.labels || [], linkedTests };
  if (withText) {
    const isStory = entry.issuetype === JIRA.issueTypes.Historia;
    Object.assign(entry, {
      summary: issue.fields.summary,
      // Las HU llegan ya leídas (forma del payload): el ADF no sale del adapter.
      historia: isStory && issue.fields.description ? parseHistoriaDescription(issue.fields.description) : null,
      status: issue.fields.status?.name || null,
      // Bugs vinculados (reporte de trazabilidad): el estado viene en el link.
      linkedBugs: linkedBugsOf(issue.fields.issuelinks).map(({ done, ...bug }) => bug)
    });
  }
  return entry;
}

// `request` es jiraRequest (inyectable para los tests).
async function fetchIssuesByKeys(keys, request, { withText = false } = {}) {
  const fields = withText ? ['issuetype', 'labels', 'issuelinks', 'summary', 'description', 'status'] : ['issuetype', 'labels', 'issuelinks'];
  const result = new Map();
  const unique = [...new Set(keys)];
  for (let i = 0; i < unique.length; i += 50) {
    const chunk = unique.slice(i, i + 50);
    let nextPageToken;
    do {
      const res = await request('POST', '/rest/api/3/search/jql', {
        jql: `key in (${chunk.join(',')})`,
        fields,
        maxResults: 100,
        nextPageToken
      });
      // Una key inexistente hace fallar el JQL completo ("An issue with key
      // ... does not exist"): se reintenta de a una para aislarla.
      if (res.status === 400 && chunk.length > 1) {
        for (const key of chunk) {
          (await fetchIssuesByKeys([key], request, { withText })).forEach((v, k) => result.set(k, v));
        }
        break;
      }
      if (res.status === 400) break;
      if (res.status !== 200) throw new Error(`Error leyendo issues (${res.status}): ${JSON.stringify(res.body)}`);
      for (const issue of res.body.issues || []) result.set(issue.key, issueEntry(issue, withText));
      nextPageToken = res.body.nextPageToken;
    } while (nextPageToken);

    // La búsqueda usa el índice de Jira, que tarda unos minutos en incluir
    // una issue recién creada: la que falta se lee directo antes de darla
    // por inexistente (caso real: SCRUM-737/738 recién publicados, 2026-09-30).
    for (const key of chunk.filter(k => !result.has(k))) {
      const res = await request('GET', `/rest/api/3/issue/${key}?fields=${fields.join(',')}`);
      if (res.status === 200) result.set(res.body.key, issueEntry(res.body, withText));
      else if (res.status !== 404) throw new Error(`Error leyendo ${key} (${res.status}): ${JSON.stringify(res.body)}`);
    }
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
 * Quita y agrega labels puntuales sin tocar el resto (operaciones
 * "remove"/"add" de Jira). Lo usa --update-steps al cambiar el criterio
 * (CA-XX) de un Test Case ya publicado.
 */
async function changeLabels(key, { remove = [], add = [] }) {
  return jiraRequest('PUT', `/rest/api/3/issue/${key}`, {
    update: { labels: [...remove.map(label => ({ remove: label })), ...add.map(label => ({ add: label }))] }
  });
}

/**
 * Crea un link entre dos issues existentes (ej: Bug -> Historia relacionada).
 * linkTypeName por defecto el de la config (jira.linkType; acá 'Relates',
 * el estándar de Jira Cloud — verificado contra GET
 * /rest/api/3/issueLinkType).
 */
async function linkIssue(fromKey, toKey, linkTypeName = JIRA.linkType) {
  return jiraRequest('POST', '/rest/api/3/issueLink', {
    type: { name: linkTypeName },
    inwardIssue: { key: fromKey },
    outwardIssue: { key: toKey }
  });
}

/** Bugs sin terminar vinculados (fields.issuelinks de la lectura): [{ key, summary, status }]. */
function openLinkedBugs(issuelinks) {
  return linkedBugsOf(issuelinks).filter(bug => !bug.done).map(({ done, ...bug }) => bug);
}

/**
 * Aplica una transición de estado a un issue existente.
 * Busca por nombre (case-insensitive) entre las transiciones disponibles
 * en el workflow real del issue. Si no hay coincidencia, informa las
 * transiciones disponibles por stderr y termina sin forzar nada.
 *
 * Si la transición termina el issue (categoría "done") y el issue no es un
 * Bug, frena cuando tiene Bugs sin terminar vinculados, salvo
 * { allowOpenBugs: true } (--cerrar-con-bugs, decisión del usuario).
 * Nace del 2026-10-05: SCRUM-883 pasó a Listo con 3 Bugs de severidad Alta
 * que dejaban dos de sus CA sin ningún TC que corra (docs/lote.md §5).
 */
async function transitionIssue(key, name, { allowOpenBugs = false } = {}) {
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

  if (match.to?.statusCategory?.key === 'done' && !allowOpenBugs) {
    const issue = await getIssue(key);
    if (issue.status !== 200) {
      console.error('Error al leer el issue antes de cerrarlo:', JSON.stringify(issue.body, null, 2));
      process.exit(1);
    }
    const isBug = BUG_TYPES.includes(issue.body.fields.issuetype?.name);
    const bugs = isBug ? [] : openLinkedBugs(issue.body.fields.issuelinks);
    if (bugs.length) {
      console.error(`${key} tiene ${bugs.length} Bug(s) sin terminar vinculados; no se pasa a "${match.name}" sin decidirlo con el usuario (docs/lote.md §5):`);
      bugs.forEach(b => console.error(`  - ${b.key} [${b.status}] ${b.summary}`));
      console.error('Si el usuario decidió cerrarla igual: repetir con --cerrar-con-bugs.');
      process.exit(1);
    }
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
 * Descripción ADF para un Bug, con el estándar de lib/bug-validator.js:
 * Resumen, Precondiciones, Pasos para reproducir, Resultado actual,
 * Resultado esperado, Evidencia y Entorno, más Severidad y Prioridad
 * (opcional) que clasifican el ticket. Sin secciones libres: los Test
 * Cases viven en Xray y las relaciones van como enlaces de Jira.
 */
function capturesOf(bug) {
  return (Array.isArray(bug.captura) ? bug.captura : [bug.captura]).filter(c => typeof c === 'string' && c.trim());
}

function buildBugDescription(bug) {
  const content = [
    h(2, 'Resumen del problema'), p(bug.resumen),
    h(2, 'Precondiciones'), p(bug.precondiciones),
    h(2, 'Pasos para reproducir'), olist(bug.pasos),
    h(2, 'Resultado actual'), p(bug.resultadoActual),
    h(2, 'Resultado esperado'), p(bug.resultadoEsperado),
    h(2, 'Evidencia'), p(bug.evidencia),
    ...capturesOf(bug).map(c => p(`Captura del navegador adjunta: ${captureFileName(c)}`)),
    h(2, 'Entorno'), p(bug.entorno),
    h(2, 'Severidad'), p(bug.severidad)
  ];
  if (bug.prioridad) content.push(h(2, 'Prioridad'), p(bug.prioridad));
  return { type: 'doc', version: 1, content };
}

function blist(items) {
  return { type: 'bulletList', content: items.map(t => ({ type: 'listItem', content: [p(t)] })) };
}

function nonEmptyList(value) {
  return Array.isArray(value) ? value.map(v => String(v || '').trim()).filter(Boolean) : [];
}

// Secciones de la descripción de una Historia en Jira. Las usan la
// escritura (buildHistoriaDescription) y la lectura (parseHistoriaDescription):
// el formato ADF no sale de este adapter.
const HISTORIA = {
  como: 'Como ', quiero: 'Quiero ', para: 'Para ',
  contexto: 'Contexto',
  objetivo: 'Objetivo',
  criterios: 'Criterios de aceptación',
  sinNegativo: 'Criterios sin caso negativo (justificados)',
  reglasNegocio: 'Reglas de negocio relevadas',
  fueraDeAlcance: 'Fuera de alcance',
  defectosConocidos: 'Defectos conocidos relacionados'
};

/**
 * Descripción ADF para una Historia: Como/Quiero/Para, Contexto, Objetivo,
 * Criterios de aceptación y, si vienen, las secciones opcionales:
 * - sinNegativo: { "CA-03": "motivo" } -> "Criterios sin caso negativo
 *   (justificados)", para que la excepción quede auditada en la HU;
 * - reglasNegocio, fueraDeAlcance, defectosConocidos: listas de texto.
 * El contenido (qué dice cada sección) lo decide quien escribe el lote —
 * esta función solo lo traduce al formato ADF de Jira.
 */
function buildHistoriaDescription(historia) {
  const content = [
    p(`${HISTORIA.como}${historia.como}`),
    p(`${HISTORIA.quiero}${historia.quiero}`),
    p(`${HISTORIA.para}${historia.para}`),
    h(2, HISTORIA.contexto), p(historia.contexto),
    h(2, HISTORIA.objetivo), p(historia.objetivo),
    h(2, HISTORIA.criterios),
    blist(historia.criterios)
  ];

  const justified = Object.entries(historia.sinNegativo || {})
    .filter(([, motivo]) => String(motivo || '').trim())
    .map(([id, motivo]) => `${id}: ${String(motivo).trim()}`);
  if (justified.length) content.push(h(2, HISTORIA.sinNegativo), blist(justified));

  for (const field of ['reglasNegocio', 'fueraDeAlcance', 'defectosConocidos']) {
    const items = nonEmptyList(historia[field]);
    if (items.length) content.push(h(2, HISTORIA[field]), blist(items));
  }

  return { type: 'doc', version: 1, content };
}

/**
 * Lectura de una Historia publicada: la descripción ADF (el formato de
 * buildHistoriaDescription) vuelve a la forma de `historia` del payload.
 * Antes vivía en lib/story-coherence.js (storyFromDescription), una lib que
 * tiene que ser independiente de Jira: cambiar de gestor obligaba a tocarla
 * (revisión de arquitectura del 2026-10-03). `sinNegativoTexto` es la lista
 * de "CA-XX: motivo" (en el payload, sinNegativo es un objeto).
 */
function parseHistoriaDescription(adf) {
  const sections = {};
  let current = 'intro';
  const textOf = node => {
    const parts = [];
    (function walk(n) { if (!n) return; if (n.text) parts.push(n.text); (n.content || []).forEach(walk); })(node);
    return parts.join('');
  };
  for (const node of (adf && adf.content) || []) {
    if (node.type === 'heading') { current = textOf(node).trim(); continue; }
    const items = node.type === 'bulletList' || node.type === 'orderedList'
      ? (node.content || []).map(textOf)
      : [textOf(node)];
    sections[current] = (sections[current] || []).concat(items.map(t => t.trim()).filter(Boolean));
  }
  const intro = sections.intro || [];
  const line = prefix => (intro.find(t => t.startsWith(prefix)) || '').slice(prefix.length);
  const list = title => sections[title] || [];
  return {
    como: line(HISTORIA.como),
    quiero: line(HISTORIA.quiero),
    para: line(HISTORIA.para),
    contexto: list(HISTORIA.contexto).join(' '),
    objetivo: list(HISTORIA.objetivo).join(' '),
    criterios: list(HISTORIA.criterios),
    reglasNegocio: list(HISTORIA.reglasNegocio),
    fueraDeAlcance: list(HISTORIA.fueraDeAlcance),
    defectosConocidos: list(HISTORIA.defectosConocidos),
    sinNegativoTexto: list(HISTORIA.sinNegativo)
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

/**
 * Nombre con el que se adjunta una captura de explore-page.js: la carpeta
 * del informe + el archivo ("pw-vieja-explore.png"), porque todas las
 * capturas finales se llaman explore.png. Si no se encuentra el informe,
 * el nombre del archivo tal cual.
 */
function captureFileName(filePath, { exists = fs.existsSync } = {}) {
  let dir = path.dirname(filePath);
  for (let i = 0; i < 3; i++) {
    if (exists(path.join(dir, 'report.json'))) return `${path.basename(dir)}-${path.basename(filePath)}`;
    dir = path.dirname(dir);
  }
  return path.basename(filePath);
}

// Cuerpo multipart/form-data con un único archivo en el campo "file" (el
// que espera POST /issue/{key}/attachments).
function buildMultipartBody(boundary, fileName, content, contentType = 'image/png') {
  return Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${contentType}\r\n\r\n`),
    content,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);
}

/**
 * Adjunta un archivo a un issue. No se reintenta (no es idempotente: un
 * reintento duplicaría el adjunto); quien llama verifica por lectura.
 */
function attachFile(key, filePath, fileName = path.basename(filePath)) {
  const boundary = `----qa${Date.now().toString(16)}`;
  const body = buildMultipartBody(boundary, fileName, fs.readFileSync(filePath));
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: HOSTNAME, path: `/rest/api/3/issue/${key}/attachments`, method: 'POST',
      headers: {
        'Authorization': AUTH,
        'X-Atlassian-Token': 'no-check',
        'Accept': 'application/json',
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      }
    }, (res) => {
      onBody(res, data => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function getAttachmentNames(key) {
  const res = await jiraRequest('GET', `/rest/api/3/issue/${key}?fields=attachment`);
  if (res.status !== 200) throw new Error(`No se pudieron leer los adjuntos de ${key} (HTTP ${res.status}).`);
  return (res.body.fields.attachment || []).map(a => a.filename);
}

module.exports = {
  fetchIssuesByKeys,
  isIdempotent,
  HOSTNAME,
  jiraRequest,
  createIssue,
  updateIssue,
  getIssue,
  getIssuesByKeys,
  addLabels,
  changeLabels,
  linkIssue,
  transitionIssue,
  openLinkedBugs,
  addComment,
  captureFileName,
  buildMultipartBody,
  attachFile,
  getAttachmentNames,
  buildDescription,
  buildBugDescription,
  capturesOf,
  buildHistoriaDescription,
  parseHistoriaDescription,
  buildTareaDescription
};
