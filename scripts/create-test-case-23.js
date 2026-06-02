/**
 * Crea el Test Case 23 - Verify address details in checkout page en Jira.
 * Uso: node scripts/create-test-case-23.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const https = require('https');

const HOSTNAME = new URL(process.env.JIRA_URL).hostname;
const AUTH = 'Basic ' + Buffer.from(process.env.JIRA_EMAIL + ':' + process.env.JIRA_API_TOKEN).toString('base64');
const PROJECT = process.env.JIRA_PROJECT_KEY;

const TEST_CASE = {
  summary: '[QA-AUTO] Test Case 23 - Verify address details in checkout page',
  contexto: 'Validar que las direcciones de entrega y facturacion mostradas en el checkout coincidan con los datos ingresados al momento del registro de la cuenta.',
  objetivo: 'Verificar que el sitio automationexercise.com muestra correctamente la direccion de registro en la pagina de checkout, tanto para delivery como para billing.',
  pasos: [
    "Launch browser",
    "Navigate to url 'http://automationexercise.com'",
    "Verify that home page is visible successfully",
    "Click 'Signup / Login' button",
    "Fill all details in Signup and create account",
    "Verify 'ACCOUNT CREATED!' and click 'Continue' button",
    "Verify 'Logged in as username' at top",
    "Add products to cart",
    "Click 'Cart' button",
    "Verify that cart page is displayed",
    "Click Proceed To Checkout",
    "Verify that the delivery address matches the registration address",
    "Verify that the billing address matches the registration address",
    "Click 'Delete Account' button",
    "Verify 'ACCOUNT DELETED!' and click 'Continue' button"
  ],
  resultadoEsperado: 'La direccion de entrega y la de facturacion en el checkout coinciden con los datos registrados durante la creacion de cuenta.',
  criterios: [
    'El ticket debe estar correctamente documentado',
    'El caso debe ser automatizable con Cypress',
    'Debe existir trazabilidad entre ticket, rama y commit',
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
