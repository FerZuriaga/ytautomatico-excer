/**
 * Contrato del adapter del gestor de tickets (hoy lib/jira.js).
 *
 * Es lo que los CLIs (create-jira-task.js, check-traceability.js) le piden
 * al gestor de HU y Bugs, y nada más. Otro gestor (Azure Boards, GitLab
 * Issues, Linear) es un archivo nuevo en lib/ que exporta estas funciones
 * con estas formas, y la línea `herramientas.gestorDeTickets` de
 * qa.config.json (lib/tools.js, D-48). issue-tracker-contract.test.js
 * verifica que el adapter actual lo cumpla y que los CLIs no usen nada
 * fuera de él.
 *
 * Las descripciones (`build*Description`) son del gestor: Jira usa ADF,
 * otro gestor puede usar Markdown. El framework les pasa sus datos (HU,
 * Bug, Tarea, pasos) y el adapter decide el formato.
 *
 * Nace del 2026-10-06: el gestor de pruebas tenía contrato (D-45) y el de
 * tickets no; cambiar Jira era reescribir lib/jira.js sin saber qué faltaba.
 *
 * Lógica pura: no habla con ningún gestor.
 */
const { missingFunctions } = require('./test-manager-contract');

const METHODS = [
  // Crear y editar
  { name: 'createIssue', signature: '({ projectKey, summary, issuetype, description }) -> { status, body: { key, id } }', does: 'Crea una HU, un Bug o una Tarea.' },
  { name: 'updateIssue', signature: '(key, { summary, description }) -> { status }', does: 'Reemplaza resumen y descripción (204 si salió bien).' },
  { name: 'addComment', signature: '(key, texto) -> any', does: 'Agrega un comentario.' },
  { name: 'transitionIssue', signature: '(key, estado, { allowOpenBugs }) -> any', does: 'Pasa el issue a un estado; a uno terminado frena con Bugs abiertos salvo allowOpenBugs (D-46).' },
  { name: 'linkIssue', signature: '(desde, hacia, tipoDeVínculo?) -> any', does: 'Vincula dos issues.' },
  { name: 'addLabels', signature: '(key, [label]) -> any', does: 'Agrega labels (CA-XX, positivo/negativo, bug-seguro).' },
  { name: 'changeLabels', signature: '(key, { remove, add }) -> any', does: 'Saca y agrega labels en una sola llamada.' },
  { name: 'attachFile', signature: '(key, rutaDelArchivo, nombre?) -> any', does: 'Adjunta la captura de un Bug.' },
  // Leer
  { name: 'getIssue', signature: '(key) -> { status, body }', does: 'Un issue con sus campos.' },
  { name: 'getIssuesByKeys', signature: '([key], opciones?) -> [issue]', does: 'Muchos issues en pocas llamadas.' },
  { name: 'getAttachmentNames', signature: '(key) -> [nombre]', does: 'Nombres de los adjuntos (verificar la captura por lectura).' },
  { name: 'issueUrl', signature: '(key) -> url', does: 'Link para abrir el issue en el navegador.' },
  // Formato de la descripción (propio de cada gestor)
  { name: 'buildHistoriaDescription', signature: '(historia) -> descripción', does: 'HU: Como/Quiero/Para, contexto, objetivo, CA y secciones opcionales.' },
  { name: 'buildBugDescription', signature: '(bug) -> descripción', does: 'Bug con sus secciones estándar (lib/bug-validator.js).' },
  { name: 'buildTareaDescription', signature: '(tarea) -> descripción', does: 'Tarea.' },
  { name: 'buildDescription', signature: '([paso]) -> descripción', does: 'Lista de pasos simple.' },
  { name: 'capturesOf', signature: '(bug) -> [rutaDelArchivo]', does: 'Capturas que declara un Bug.' },
  { name: 'captureFileName', signature: '(rutaDelArchivo) -> nombre', does: 'Nombre con el que se adjunta una captura.' }
];

const METHOD_NAMES = METHODS.map(m => m.name);

/** Problemas de un adapter contra el contrato: [] si lo cumple. */
function checkAdapter(adapter) {
  return missingFunctions(adapter, METHOD_NAMES);
}

module.exports = { METHODS, METHOD_NAMES, checkAdapter };
