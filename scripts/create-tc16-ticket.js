/**
 * Crea ticket Jira para TC16 - Place Order: Login before Checkout
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const https = require('https');

const HOSTNAME = new URL(process.env.JIRA_URL).hostname;
const AUTH = 'Basic ' + Buffer.from(process.env.JIRA_EMAIL + ':' + process.env.JIRA_API_TOKEN).toString('base64');
const PROJECT = process.env.JIRA_PROJECT_KEY;

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
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function h(level, text) {
  return { type: 'heading', attrs: { level }, content: [{ type: 'text', text }] };
}
function p(text) {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}
function olist(items) {
  return { type: 'orderedList', content: items.map(t => ({ type: 'listItem', content: [p(t)] })) };
}
function blist(items) {
  return { type: 'bulletList', content: items.map(t => ({ type: 'listItem', content: [p(t)] })) };
}

const description = {
  type: 'doc', version: 1,
  content: [
    h(2, 'Contexto'),
    p('El sitio automationexercise.com permite a usuarios registrados completar el flujo de compra desde una sesion activa. TC16 valida que un usuario que ya tiene cuenta puede iniciar sesion, agregar productos al carrito, navegar al checkout, ingresar datos de envio y pago, y confirmar el pedido exitosamente. A diferencia de TC14 (registro durante checkout) y TC15 (registro antes del checkout), este caso usa credenciales de un usuario existente, validando el flujo de compra para usuarios recurrentes.'),
    h(2, 'Objetivo'),
    p('Verificar que un usuario con cuenta existente puede iniciar sesion, agregar un producto al carrito y completar el proceso de pago de punta a punta, recibiendo confirmacion de pedido exitoso.'),
    h(2, 'Pasos'),
    olist([
      'Lanzar el navegador',
      "Navegar a url 'http://www.automationexercise.com'",
      'Verificar que la home page es visible correctamente',
      "Hacer click en el boton 'Signup / Login'",
      'Ingresar email y password de usuario existente y hacer click en Login',
      "Verificar que 'Logged in as username' es visible en la parte superior",
      'Agregar un producto al carrito desde la pagina de productos',
      "Hacer click en el boton 'Cart'",
      'Verificar que la pagina del carrito es visible',
      "Hacer click en 'Proceed To Checkout'",
      'Verificar Address Details y Review Your Order',
      "Ingresar descripcion en el area de comentarios y hacer click en 'Place Order'",
      'Ingresar datos de pago: Nombre, Numero de tarjeta, CVC, Fecha de expiracion',
      "Hacer click en 'Pay and Confirm Order'",
      "Verificar mensaje de exito 'Order Placed!'"
    ]),
    h(2, 'Resultado Esperado'),
    p("El pedido se completa exitosamente y el sistema muestra el mensaje 'Order Placed!' confirmando que la orden fue procesada correctamente para el usuario autenticado."),
    h(2, 'Criterios de Aceptacion'),
    blist([
      'El ticket esta correctamente documentado con todas las secciones requeridas',
      'El escenario es automatizable con Cypress usando Page Object Model',
      'Existe trazabilidad entre el ticket Jira, la rama de Git y el codigo de automatizacion',
      'El usuario puede iniciar sesion con credenciales validas antes de ir al checkout',
      'El carrito refleja el producto agregado correctamente',
      'El checkout muestra los datos de direccion del usuario logueado',
      "El mensaje 'Order Placed!' es visible tras confirmar el pago",
      'El test puede ser entendido y ejecutado por otro miembro del equipo sin informacion adicional',
      'La automatizacion pasa en modo headless con Cypress'
    ])
  ]
};

async function main() {
  console.log('Creando ticket Jira TC16...');

  const res = await jiraRequest('POST', '/rest/api/3/issue', {
    fields: {
      project: { key: PROJECT },
      summary: '[QA-AUTO] TC16 - Place Order: Login before Checkout',
      issuetype: { name: 'Historia' },
      description
    }
  });

  if (res.status !== 201) {
    console.error('Error al crear ticket:', JSON.stringify(res.body, null, 2));
    process.exit(1);
  }

  const key = res.body.key;
  console.log('Ticket creado: ' + key);
  console.log('URL: https://' + HOSTNAME + '/browse/' + key);

  const sprintRes = await jiraRequest('POST', '/rest/agile/1.0/sprint/2/issue', { issues: [key] });
  console.log('Sprint assign: ' + sprintRes.status + (sprintRes.status === 204 ? ' (OK)' : ' ' + JSON.stringify(sprintRes.body)));

  const transRes = await jiraRequest('POST', '/rest/api/3/issue/' + key + '/transitions', { transition: { id: '21' } });
  console.log('Transition: ' + transRes.status + (transRes.status === 204 ? ' (OK - En curso)' : ' ' + JSON.stringify(transRes.body)));

  console.log('TICKET_KEY=' + key);
}

main().catch(e => { console.error(e.message); process.exit(1); });
