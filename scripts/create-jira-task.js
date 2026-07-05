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

/**
 * ISSUE: objeto genérico y parametrizable para crear/actualizar cualquier tipo
 * de issue (Historia, Bug, Tarea) sin necesidad de scripts específicos por ticket.
 * Si ISSUE es null, el script conserva el comportamiento original (Historia/TEST_CASE).
 *
 * Para reutilizar en un próximo ticket: reemplazar el contenido de este objeto
 * (o dejarlo en null para volver al comportamiento por defecto).
 */
const ISSUE = {
  issuetype: 'Bug',
  summary: 'BlazeDemo - El formulario de compra confirma la reserva sin validar campos obligatorios vacíos',
  bug: {
    resumen: 'El formulario de compra de BlazeDemo confirma la reserva aunque ningún campo obligatorio del formulario (nombre en tarjeta, dirección, número de tarjeta, entre otros) haya sido completado.',
    precondiciones: 'El usuario buscó un vuelo con origen y destino distintos, y seleccionó uno de los resultados del listado, llegando a la página de compra (Purchase Flight).',
    pasos: [
      'Ingresar a https://blazedemo.com',
      'Seleccionar una ciudad de origen (por ejemplo Boston) y una ciudad de destino (por ejemplo Cairo)',
      'Hacer clic en "Find Flights"',
      'Elegir cualquier vuelo del listado de resultados haciendo clic en "Choose This Flight"',
      'En la página de compra, no completar ningún campo del formulario (nombre en tarjeta, dirección, número de tarjeta, entre otros)',
      'Hacer clic en "Purchase Flight"'
    ],
    resultadoActual: 'El sistema navega a la página de confirmación de compra y muestra el mensaje de agradecimiento por la compra, confirmándola igualmente pese a que ningún campo del formulario fue completado.',
    resultadoEsperado: 'El sistema debería bloquear la confirmación de la compra e indicar qué campos obligatorios faltan por completar.',
    severidad: 'Media (defecto funcional, no bloquea el uso del sitio ni provoca errores del sistema, pero permite completar una transacción sin datos de pasajero/pago)',
    prioridad: 'Pendiente de confirmar',
    evidencia: 'Verificado mediante la ejecución de la automatización del caso BD-TC2 (ticket SCRUM-39), que asertó explícitamente la navegación a la página de confirmación y el mensaje de agradecimiento tras enviar el formulario vacío.',
    entorno: 'Sitio de demo público https://blazedemo.com. Navegador y versión de Cypress no confirmados en este flujo.',
    observaciones: 'BlazeDemo es un sitio de demostración conocido por no implementar validación real en su backend; es posible que esta ausencia de validación sea una limitación intencional del demo y no un defecto de un sistema productivo real. Se documenta igualmente como hallazgo funcional porque el comportamiento observado difiere del resultado esperado en un flujo de compra estándar.'
  },
  // Relaciona este issue con otro ya existente una vez creado.
  linkTo: { key: 'SCRUM-39', type: 'Relates' }
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
  // Si ISSUE está definido, tiene prioridad sobre TEST_CASE (comportamiento por defecto/legacy).
  const issuetype = (ISSUE && ISSUE.issuetype) || 'Historia';
  const summary = (ISSUE && ISSUE.summary) || TEST_CASE.summary;

  let description;
  if (ISSUE && issuetype === 'Bug') {
    description = buildBugDescription(ISSUE.bug);
  } else if (ISSUE && issuetype === 'Tarea') {
    description = buildTareaDescription(ISSUE.tarea);
  } else if (ISSUE && Array.isArray(ISSUE.steps)) {
    description = buildDescription(ISSUE.steps);
  } else {
    description = buildDescription(TEST_CASE.steps);
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
