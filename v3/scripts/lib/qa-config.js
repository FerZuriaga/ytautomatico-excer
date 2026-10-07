/**
 * Configuración del proyecto: `qa.config.json` en la raíz del repo (D-43).
 *
 * Las apps que se trabajan (`apps`, una carpeta por app en cypress/e2e/,
 * D-28) y todo lo que depende de la instancia de Jira/Xray (clave del proyecto,
 * nombres de los tipos de issue, estados iniciales, tipo de vínculo) o del
 * idioma en que se escriben las HU y los Test Cases (las palabras clave de
 * los validadores) vive en ese archivo y no en el código: otro proyecto u
 * otro idioma es copiar el archivo y editarlo (ejemplo en inglés:
 * qa.config.en.example.json).
 *
 * Nace del 2026-10-03 (framework reusable): "Historia", "Draft", "Relates" y
 * "SCRUM" estaban escritos en 7 archivos y los validadores solo entendían
 * español.
 *
 * No hay valores por defecto en el código: el archivo es la única fuente de
 * verdad (una regla en un solo lugar, D-36). Si falta una clave, frena con
 * el nombre exacto de lo que falta.
 */
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.resolve(__dirname, '../../../qa.config.json');

// Qué adapter de lib/ habla con cada gestor (lib/tools.js, D-48).
const REQUIRED_TOOLS = ['gestorDePruebas', 'gestorDeTickets'];
const REQUIRED_JIRA =['projectKey', 'issueTypes', 'bugTypeNames', 'linkType', 'testLinkType', 'testCaseStatus', 'testCycleStatus'];
const REQUIRED_ISSUE_TYPES = ['Historia', 'Bug', 'Tarea', 'Test'];
const REQUIRED_KEYWORDS = [
  'verbosDeAccion', 'verbosDeCarga', 'verbosDeCargaAlInicio', 'negaciones', 'articulos', 'conjuncion', 'variosDatos',
  'palabrasDeSecuencia', 'frasesDeLogin', 'verbosDeVerificacion', 'verbosDeVerificacionConQue', 'conector',
  'pasosQueNoSonAccion', 'pasosRepetidos', 'objetivoDePrueba', 'terminosTecnicos', 'personaGenerica', 'perdidaDeDatos',
  'conectoresDeReglas', 'imposibilidad', 'resultadoObservable', 'disparador', 'palabrasVacias', 'palabrasVaciasHistoria'
];

/** Minúsculas y sin tildes: los validadores comparan el texto así. */
function normalizeText(text) {
  return String(text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function checkConfig(config, file = CONFIG_FILE) {
  const missing = [];
  if (!Array.isArray(config && config.apps)) missing.push('apps');
  // Carpeta raíz de cada app en el gestor de pruebas: publicar en una ruta
  // que no existe la crea en silencio (RBP 2026-10-07, la carpeta no estaba
  // anotada en ningún lado y se buscó a mano).
  const folders = config && config.carpetasDePruebas;
  if (!folders) missing.push('carpetasDePruebas');
  else (config.apps || []).filter(app => typeof folders[app] !== 'string' || !folders[app].startsWith('/')).forEach(app => missing.push(`carpetasDePruebas.${app} ("/Raiz")`));
  const tools = config && config.herramientas;
  if (!tools) missing.push('herramientas');
  else REQUIRED_TOOLS.filter(k => !tools[k]).forEach(k => missing.push(`herramientas.${k}`));
  const jira = config && config.jira;
  if (!jira) missing.push('jira');
  else {
    REQUIRED_JIRA.filter(k => jira[k] === undefined).forEach(k => missing.push(`jira.${k}`));
    if (jira.issueTypes) REQUIRED_ISSUE_TYPES.filter(k => !jira.issueTypes[k]).forEach(k => missing.push(`jira.issueTypes.${k}`));
  }
  const keywords = config && config.validadores && config.validadores.palabrasClave;
  if (!keywords) missing.push('validadores.palabrasClave');
  else REQUIRED_KEYWORDS.filter(k => keywords[k] === undefined).forEach(k => missing.push(`validadores.palabrasClave.${k}`));
  if (missing.length) throw new Error(`${path.basename(file)} incompleto, falta: ${missing.join(', ')}.`);
  return config;
}

function loadConfig(file = CONFIG_FILE) {
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (cause) {
    throw new Error(`No se encontró la configuración del proyecto (${file}). Copiar qa.config.en.example.json como qa.config.json y completarla.`, { cause });
  }
  // Un BOM (lo agrega PowerShell al guardar) rompe JSON.parse.
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  return checkConfig(JSON.parse(raw), file);
}

/**
 * Fragmento de regex para una palabra o frase de la config: se normaliza,
 * se escapa, los espacios aceptan cualquier blanco, un '*' final acepta
 * cualquier terminación, y los bordes de palabra (\b) van solo donde la
 * frase empieza o termina con letra (";" o ", y sin" no los llevan).
 */
function phraseSource(phrase) {
  const text = normalizeText(phrase).trim();
  const wildcard = text.endsWith('*');
  const body = (wildcard ? text.slice(0, -1) : text)
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\s+/g, '\\s+');
  const start = /^\w/.test(text) ? '\\b' : '';
  const end = wildcard ? '\\w*' : (/\w$/.test(text) ? '\\b' : '');
  return `${start}${body}${end}`;
}

/** Regex que encuentra cualquiera de las frases (en texto ya normalizado). */
function phrasesRegex(phrases, { flags = '', anchored = false } = {}) {
  const list = (Array.isArray(phrases) ? phrases : [phrases]).filter(Boolean);
  // Las frases más largas primero: "hacer clic" antes que "hacer".
  const alternatives = [...list].sort((a, b) => b.length - a.length).map(phraseSource).join('|');
  return new RegExp(`${anchored ? '^\\s*' : ''}(?:${alternatives})`, flags);
}

const config = loadConfig();

module.exports = { config, loadConfig, checkConfig, phrasesRegex, phraseSource, normalizeText, CONFIG_FILE };
