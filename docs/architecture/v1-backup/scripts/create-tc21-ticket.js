/**
 * ProductAgent: Crea el ticket Jira para TC21 - Add Review on Product
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const https = require('https');

const HOSTNAME = 'ferzuriaga1.atlassian.net';
const AUTH = 'Basic ' + Buffer.from(
  process.env.JIRA_EMAIL + ':' + process.env.JIRA_API_TOKEN
).toString('base64');

function jiraRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: HOSTNAME, path, method,
      headers: {
        'Authorization': AUTH,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
      }
    }, res => {
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
  const description = {
    type: 'doc',
    version: 1,
    content: [
      {
        type: 'heading', attrs: { level: 3 },
        content: [{ type: 'text', text: 'Contexto' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Automatizacion del Test Case 21 de automationexercise.com. Validar que un usuario (registrado o invitado) puede agregar una resena a un producto y recibir confirmacion de exito.' }]
      },
      {
        type: 'heading', attrs: { level: 3 },
        content: [{ type: 'text', text: 'Objetivo' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Verificar que el formulario de resena de producto es accesible, funcional y que el sistema confirma correctamente el envio mediante el mensaje "Thank you for your review."' }]
      },
      {
        type: 'heading', attrs: { level: 3 },
        content: [{ type: 'text', text: 'Pasos' }]
      },
      {
        type: 'orderedList',
        content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Launch browser.' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Navigate to url http://automationexercise.com.' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Click on Products button.' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Verify user is navigated to ALL PRODUCTS page successfully.' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Click on View Product button.' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Verify "Write Your Review" is visible.' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Enter name, email and review.' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Click Submit button.' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Verify success message "Thank you for your review."' }] }] }
        ]
      },
      {
        type: 'heading', attrs: { level: 3 },
        content: [{ type: 'text', text: 'Resultado esperado' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'El mensaje de confirmacion "Thank you for your review." debe ser visible despues de enviar la resena.' }]
      },
      {
        type: 'heading', attrs: { level: 3 },
        content: [{ type: 'text', text: 'Criterios de aceptacion' }]
      },
      {
        type: 'bulletList',
        content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'El ticket esta correctamente documentado.' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'El escenario es automatizable con Cypress.' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Existe trazabilidad completa con el proceso de automatizacion.' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Puede ser comprendido por cualquier miembro del equipo sin informacion adicional.' }] }] }
        ]
      }
    ]
  };

  // PASO 1: Crear el ticket
  console.log('[ProductAgent] Creando ticket Jira TC21...');
  const createRes = await jiraRequest('POST', '/rest/api/3/issue', {
    fields: {
      project: { key: 'SCRUM' },
      summary: '[QA-AUTO] Test Case 21 - Add Review on Product',
      issuetype: { name: 'Historia' },
      description,
      customfield_10020: 2
    }
  });

  if (createRes.status !== 201) {
    console.error('ERROR creando ticket:', JSON.stringify(createRes.body, null, 2));
    process.exit(1);
  }

  const key = createRes.body.key;
  console.log('[ProductAgent] Ticket creado:', key);

  // PASO 2: Asignar al sprint activo ID 2
  console.log('[ProductAgent] Asignando al Sprint 2...');
  const sprintRes = await jiraRequest('POST', '/rest/agile/1.0/sprint/2/issue', {
    issues: [key]
  });
  console.log('[ProductAgent] Sprint assignment status:', sprintRes.status);

  // PASO 3: Mover a In Progress (transicion 21)
  console.log('[ProductAgent] Moviendo a In Progress...');
  const transRes = await jiraRequest('POST', '/rest/api/3/issue/' + key + '/transitions', {
    transition: { id: '21' }
  });
  console.log('[ProductAgent] Transicion status:', transRes.status);

  // PASO 4: Verificar estado final
  const getRes = await jiraRequest('GET', '/rest/api/3/issue/' + key + '?fields=summary,status,issuetype');
  const issue = getRes.body;

  console.log('\n=== REPORTE PRODUCTagent ===');
  console.log('TICKET:', key);
  console.log('HU:', issue.fields.summary);
  console.log('TYPE:', issue.fields.issuetype.name);
  console.log('STATUS:', issue.fields.status.name);
  console.log('SPRINT_ASIGNADO: SCRUM Sprint 0 (ID 2)');
  console.log('UBICACION_FINAL: Sprint Activo');
  console.log('URL: https://' + HOSTNAME + '/browse/' + key);
}

main().catch(e => { console.error(e.message); process.exit(1); });
