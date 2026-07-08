/**
 * Agente autónomo: crea o actualiza un issue (Historia/Bug/Tarea) en Jira.
 * Uso: node scripts/create-jira-task.js --data <archivo.json> [issueKey]
 *   Sin issueKey  → crea un nuevo issue a partir del JSON
 *   Con issueKey  → actualiza el issue existente (ej: SCRUM-2)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const https = require('https');
const fs = require('fs');
const path = require('path');

const HOSTNAME  = new URL(process.env.JIRA_URL).hostname;
const AUTH      = 'Basic ' + Buffer.from(process.env.JIRA_EMAIL + ':' + process.env.JIRA_API_TOKEN).toString('base64');
const PROJECT = process.env.JIRA_PROJECT_KEY;


function parseArgs(argv) {
  const args = { dataPath: null, issueKey: null };

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--data') {
      args.dataPath = argv[i + 1];
      i++;
    } else if (!args.issueKey) {
      args.issueKey = argv[i];
    }
  }

  return args;
}

const { dataPath, issueKey } = parseArgs(process.argv.slice(2));
const ISSUE_KEY = issueKey;

if (!dataPath) {
  console.error('Uso: node scripts/create-jira-task.js --data <archivo.json> [issueKey]');
  process.exit(1);
}

let ISSUE;

try {
  ISSUE = JSON.parse(fs.readFileSync(path.resolve(dataPath), 'utf8'));
} catch (e) {
  console.error(`No se pudo leer o parsear "${dataPath}": ${e.message}`);
  process.exit(1);
}




/**
 * El objeto ISSUE se obtiene dinámicamente desde un archivo JSON externo.
 *
 * El script no contiene información específica de tickets.
 * Toda la información del issue debe enviarse mediante --data.
 */


function buildDescription(steps) {
  return {
    type: 'doc', version: 1,
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Pasos del caso de prueba' }]
      },
      {
        type: 'orderedList',
        content: steps.map(step => ({
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: step }] }]
        }))
      }
    ]
  };
}

// --- Helpers ADF genéricos (reutilizables para cualquier tipo de issue) ---
function h(level, text) {
  return { type: 'heading', attrs: { level }, content: [{ type: 'text', text }] };
}
function p(text) {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}
function olist(items) {
  return { type: 'orderedList', content: items.map(t => ({ type: 'listItem', content: [p(t)] })) };
}

/**
 * Construye la descripción ADF para un Bug siguiendo la plantilla oficial:
 * Resumen, Precondiciones, Pasos para reproducir, Resultado actual,
 * Resultado esperado, Severidad, Prioridad, Evidencia, Entorno, Observaciones.
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
 * Construye la descripción ADF para una Historia siguiendo la plantilla oficial:
 * Como/Quiero/Para, Contexto, Objetivo, Criterios de aceptación.
 * Las Historias describen la necesidad funcional del usuario, no los pasos
 * del Test Case ni el resultado esperado (eso pertenece al escenario funcional).
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
 * Construye la descripción ADF para una Tarea siguiendo la plantilla oficial:
 * Objetivo, Alcance, Entregables, Resultado esperado.
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
 * Crea un link entre dos issues existentes (ej: Bug -> Historia relacionada).
 * linkTypeName por defecto 'Relates' (tipo de link estándar en Jira Cloud).
 */
async function linkIssue(fromKey, toKey, linkTypeName = 'Relates') {
  return jiraRequest('POST', '/rest/api/3/issueLink', {
    type: { name: linkTypeName },
    inwardIssue: { key: fromKey },
    outwardIssue: { key: toKey }
  });
}

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

async function main() {
  // El contenido del issue proviene exclusivamente del JSON externo cargado al inicio.
  const issuetype = ISSUE.issuetype || 'Historia';
  const summary = ISSUE.summary;

  let description;
  if (issuetype === 'Bug') {
    description = buildBugDescription(ISSUE.bug);
  } else if (issuetype === 'Historia' && ISSUE.historia) {
    description = buildHistoriaDescription(ISSUE.historia);
  } else if (issuetype === 'Tarea') {
    description = buildTareaDescription(ISSUE.tarea);
  } else if (Array.isArray(ISSUE.steps)) {
    description = buildDescription(ISSUE.steps);
  } else {
    console.error(`No se pudo determinar la descripción para issuetype "${issuetype}".`);
    process.exit(1);
  }

  if (ISSUE_KEY) {
    console.log(`Actualizando ${ISSUE_KEY}...`);
    const res = await jiraRequest('PUT', `/rest/api/3/issue/${ISSUE_KEY}`, {
      fields: { summary, description }
    });
    if (res.status === 204) {
      console.log(`Actualizado: https://${HOSTNAME}/browse/${ISSUE_KEY}`);
    } else {
      console.error('Error al actualizar:', JSON.stringify(res.body, null, 2));
      process.exit(1);
    }
  } else {
    console.log(`Creando nuevo issue (${issuetype})...`);
    const res = await jiraRequest('POST', '/rest/api/3/issue', {
      fields: {
        project: { key: PROJECT },
        summary,
        issuetype: { name: issuetype },
        description
      }
    });
    if (res.status === 201) {
      const key = res.body.key;
      console.log(`Creado: ${key}`);
      console.log(`URL: https://${HOSTNAME}/browse/${key}`);

      if (ISSUE && ISSUE.linkTo && ISSUE.linkTo.key) {
        console.log(`Vinculando ${key} con ${ISSUE.linkTo.key} (${ISSUE.linkTo.type || 'Relates'})...`);
        const linkRes = await linkIssue(key, ISSUE.linkTo.key, ISSUE.linkTo.type);
        if (linkRes.status === 201) {
          console.log(`Vinculado correctamente con ${ISSUE.linkTo.key}.`);
        } else {
          console.error('Error al vincular issue:', JSON.stringify(linkRes.body, null, 2));
        }
      }
    } else {
      console.error('Error al crear:', JSON.stringify(res.body, null, 2));
      process.exit(1);
    }
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
