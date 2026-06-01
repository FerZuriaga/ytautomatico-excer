/**
 * Crea el Test Case 4 - Logout User en Jira.
 * Uso: node scripts/create-test-case-4.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const https = require('https');

const HOSTNAME = new URL(process.env.JIRA_URL).hostname;
const AUTH = 'Basic ' + Buffer.from(process.env.JIRA_EMAIL + ':' + process.env.JIRA_API_TOKEN).toString('base64');
const PROJECT = process.env.JIRA_PROJECT_KEY;

const TEST_CASE = {
  summary: '[QA-AUTO] Test Case 4 - Logout User',
  contexto: 'Validar que un usuario logueado pueda cerrar sesion correctamente y regresar a la pagina de login.',
  objetivo: 'Verificar el flujo de logout del sitio automationexercise.com asegurando que el usuario sea redirigido a la pagina de login.',
  pasos: [
    "Launch browser",
    "Navigate to url 'http://automationexercise.com'",
    "Verify that home page is visible successfully",
    "Click on 'Signup / Login' button",
    "Verify 'Login to your account' is visible",
    "Enter correct email address and password",
    "Click 'login' button",
    "Verify that 'Logged in as username' is visible",
    "Click 'Logout' button",
    "Verify that user is navigated to login page"
  ],
  resultadoEsperado: 'El usuario puede cerrar sesion correctamente y es redirigido a la pagina de login.',
  criterios: [
    'El ticket debe estar correctamente documentado',
    'El caso debe ser automatizable',
    'Debe existir trazabilidad',
    'Debe asociarse al flujo QA Automation'
  ]
};

function heading(level, text) {
  return { type: 'heading', attrs: { level }, content: [{ type: 'text', text }] };
}
function paragraph(text) {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}
function orderedList(items) {
  return {
    type: 'orderedList',
    content: items.map(t => ({
      type: 'listItem',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: t }] }]
    }))
  };
}
function bulletList(items) {
  return {
    type: 'bulletList',
    content: items.map(t => ({
      type: 'listItem',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: t }] }]
    }))
  };
}

function buildDescription(tc) {
  return {
    type: 'doc',
    version: 1,
    content: [
      heading(2, 'Contexto'),
      paragraph(tc.contexto),
      heading(2, 'Objetivo'),
      paragraph(tc.objetivo),
      heading(2, 'Pasos'),
      orderedList(tc.pasos),
      heading(2, 'Resultado esperado'),
      paragraph(tc.resultadoEsperado),
      heading(2, 'Criterios de aceptacion'),
      bulletList(tc.criterios)
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
  const description = buildDescription(TEST_CASE);
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

main().catch(e => { console.error(e.message); process.exit(1); });
