/**
 * Agente autónomo: crea o actualiza un Test Case en Jira.
 * Uso: node scripts/create-jira-task.js [issueKey]
 *   Sin argumento  → crea un nuevo issue
 *   Con argumento  → actualiza el issue existente (ej: SCRUM-2)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const https = require('https');

const HOSTNAME  = new URL(process.env.JIRA_URL).hostname;
const AUTH      = 'Basic ' + Buffer.from(process.env.JIRA_EMAIL + ':' + process.env.JIRA_API_TOKEN).toString('base64');
const PROJECT   = process.env.JIRA_PROJECT_KEY;
const ISSUE_KEY = process.argv[2] || null;

const TEST_CASE = {
  summary: 'Test Case 9 - Search Product',
  steps: [
    'Abrir el navegador.',
    'Navegar a http://automationexercise.com.',
    'Verificar que la página principal se visualiza correctamente.',
    'Hacer clic en el botón Products.',
    'Verificar que el usuario es redirigido a la página All Products.',
    'Ingresar el nombre de un producto en el campo de búsqueda.',
    'Hacer clic en el botón de búsqueda.',
    'Verificar que el texto SEARCHED PRODUCTS sea visible.',
    'Verificar que todos los productos mostrados correspondan al texto buscado.'
  ]
};

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
  const description = buildDescription(TEST_CASE.steps);

  if (ISSUE_KEY) {
    console.log(`Actualizando ${ISSUE_KEY}...`);
    const res = await jiraRequest('PUT', `/rest/api/3/issue/${ISSUE_KEY}`, {
      fields: { summary: TEST_CASE.summary, description }
    });
    if (res.status === 204) {
      console.log(`Actualizado: https://${HOSTNAME}/browse/${ISSUE_KEY}`);
    } else {
      console.error('Error al actualizar:', JSON.stringify(res.body, null, 2));
      process.exit(1);
    }
  } else {
    console.log('Creando nuevo issue...');
    const res = await jiraRequest('POST', '/rest/api/3/issue', {
      fields: {
        project: { key: PROJECT },
        summary: TEST_CASE.summary,
        issuetype: { name: 'Historia' },
        description
      }
    });
    if (res.status === 201) {
      console.log(`Creado: ${res.body.key}`);
      console.log(`URL: https://${HOSTNAME}/browse/${res.body.key}`);
    } else {
      console.error('Error al crear:', JSON.stringify(res.body, null, 2));
      process.exit(1);
    }
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
