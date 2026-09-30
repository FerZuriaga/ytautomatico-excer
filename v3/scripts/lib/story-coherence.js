/**
 * Coherencia entre Historias de la misma app: antes de publicar (o
 * actualizar) una HU, se compara con las HU hermanas ya publicadas.
 *
 * Nace del 2026-09-29 (auditoría de Notes App): cada HU pasaba sus
 * validadores por separado y el problema estaba en el conjunto:
 *   - SCRUM-659 decía que el resumen muestra "You have completed all notes"
 *     con la categoría completa y SCRUM-635 (bien) "You have completed all
 *     notes in the <categoría> category": el mismo mensaje, dos versiones;
 *   - SCRUM-635 dejaba fuera de alcance "El orden de la lista (pendientes
 *     primero)" y SCRUM-659 lo cubrió en su CA-04 sin que 635 lo supiera;
 *   - SCRUM-659 CA-03 y SCRUM-635 CA-02 hablan de la misma regla (el
 *     resumen por categoría) con distinto disparador.
 *
 * Son heurísticas: salen como WARNING (se revisan y, si son falsos
 * positivos, se aceptan con --accept-warnings). No reemplazan la lectura
 * de las HU hermanas; la ordenan.
 *
 * Funciones puras: la lectura de Jira y de los specs la hace
 * create-jira-task.js.
 */

// Palabras que no distinguen una regla de otra.
const STOPWORDS = new Set([
  'para', 'poder', 'quiero', 'desde', 'hasta', 'sobre', 'entre', 'como', 'cuando', 'donde', 'este', 'esta',
  'esos', 'esas', 'todos', 'todas', 'mismo', 'misma', 'queda', 'quedan', 'muestra', 'muestran', 'solo',
  'solamente', 'cada', 'otra', 'otras', 'otro', 'otros', 'tiene', 'tienen', 'puede', 'pueden', 'sin', 'con',
  'que', 'los', 'las', 'del', 'una', 'uno', 'unos', 'unas', 'historia', 'propia', 'propias'
]);
const MIN_SHARED_WORDS = 3;
// Entre criterios hace falta más: las palabras del dominio ("notas",
// "categoría", "elegida") se repiten en casi todos los de una misma app.
const MIN_SHARED_CRITERIA_WORDS = 4;
const SIMILAR_CRITERIA_RATIO = 0.6;
const MIN_MESSAGE_LENGTH = 12;

function normalize(text) {
  return String(text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function contentWords(text) {
  return new Set(normalize(text).split(/[^a-z0-9ñ]+/).filter(w => w.length >= 4 && !STOPWORDS.has(w)));
}

function shared(a, b) {
  return [...a].filter(w => b.has(w));
}

// Textos entre comillas dobles (mensajes y etiquetas de la pantalla).
function quotedTexts(text) {
  return [...String(text || '').matchAll(/"([^"]+)"/g)].map(m => m[1].trim()).filter(Boolean);
}

// Prefijo de app del summary ("Notes App - Buscar notas" -> "notes app").
function appPrefix(summary) {
  const i = String(summary || '').indexOf(' - ');
  return i > 0 ? normalize(summary.slice(0, i)).trim() : null;
}

/**
 * Keys de HU en los encabezados de los specs ("// Ticket Jira: SCRUM-635
 * (CA-01..CA-03, Test Cycle SCRUM-636)"): sin los Test Cycles.
 */
function storyKeysFromSpecs(sources, projectKey = 'SCRUM') {
  const keys = new Set();
  const keyRe = new RegExp(`\\b${projectKey}-\\d+\\b`, 'g');
  for (const source of sources) {
    for (const [, line] of String(source || '').matchAll(/Ticket Jira:([^\n]*)/g)) {
      const withoutCycles = line.replace(new RegExp(`Test Cycles?\\s+${projectKey}-\\d+`, 'g'), '');
      for (const key of withoutCycles.match(keyRe) || []) keys.add(key);
    }
  }
  return [...keys];
}

/**
 * Secciones de una HU publicada a partir de su descripción ADF (el formato
 * de jira.buildHistoriaDescription): encabezado de nivel 2 + párrafo o
 * lista. Devuelve el mismo formato que `historia` en el payload.
 */
function storyFromDescription(adf) {
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
  return {
    como: line('Como '),
    quiero: line('Quiero '),
    para: line('Para '),
    contexto: (sections.Contexto || []).join(' '),
    objetivo: (sections.Objetivo || []).join(' '),
    criterios: sections['Criterios de aceptación'] || [],
    reglasNegocio: sections['Reglas de negocio relevadas'] || [],
    fueraDeAlcance: sections['Fuera de alcance'] || []
  };
}

function storyTexts(historia) {
  const list = value => (Array.isArray(value) ? value : value ? [value] : []);
  return [
    ...list(historia.contexto).map(text => ['Contexto', text]),
    ...list(historia.criterios).map(text => [(String(text).match(/^\s*(CA-\d{2})/) || [])[1] || 'un criterio', text]),
    ...list(historia.reglasNegocio).map(text => ['reglasNegocio', text]),
    ...list(historia.fueraDeAlcance).map(text => ['fueraDeAlcance', text])
  ];
}

const criterionId = text => (String(text).match(/^\s*(CA-\d{2})/) || [])[1] || 'un criterio';
const criterionBody = text => String(text).replace(/^\s*CA-\d{2}\s*:\s*/, '');
const cut = text => (text.length > 90 ? `${text.slice(0, 87)}...` : text);

/**
 * Compara la HU nueva con sus hermanas: [{ key, summary, historia }].
 * `story`: { key?, summary, historia }. Devuelve { warnings }.
 */
function checkStoryCoherence(story, siblings) {
  const warnings = [];
  const label = story.key ? `${story.summary} (${story.key})` : story.summary;
  const prefix = appPrefix(story.summary);
  // Hermanas: misma app, sin la propia HU (por key si ya está publicada; las
  // HU nuevas de un mismo lote todavía no tienen key y se comparan entre sí).
  const family = siblings.filter(s => s !== story && !(story.key && s.key === story.key) && prefix && appPrefix(s.summary) === prefix);
  const own = storyTexts(story.historia || {});
  const ownQuoted = new Set(own.flatMap(([, text]) => quotedTexts(text)));
  const storyTitle = normalize(String(story.summary || '').split(' - ').slice(1).join(' - ')).trim() || null;
  const ownCriteria = (story.historia?.criterios || []).map(text => ({ id: criterionId(text), text, words: contentWords(criterionBody(text)) }));

  for (const sibling of family) {
    const theirs = storyTexts(sibling.historia || {});
    // Una HU nueva del mismo lote todavía no tiene key: se nombra por su summary.
    const name = sibling.key || `"${sibling.summary}"`;

    // 1. El mismo mensaje de pantalla escrito de dos formas.
    const reported = new Set();
    for (const [where, text] of own) {
      for (const mine of quotedTexts(text)) {
        if (mine.length < MIN_MESSAGE_LENGTH) continue;
        for (const [theirWhere, theirText] of theirs) {
          for (const other of quotedTexts(theirText)) {
            if (other === mine || ownQuoted.has(other) || reported.has(`${mine}|${other}`)) continue;
            if (other.startsWith(mine) || mine.startsWith(other)) {
              reported.add(`${mine}|${other}`);
              warnings.push(`${label}: ${where} cita "${mine}" y ${name} (${theirWhere}) cita "${other}" -- parece el mismo mensaje con otra redacción; confirmar en qué pantalla o categoría aparece cada uno para que las HU no se contradigan.`);
            }
          }
        }
      }
    }

    // 2. Lo que la hermana dejó fuera de alcance y esta HU cubre.
    for (const line of sibling.historia?.fueraDeAlcance || []) {
      // Si la línea ya dice dónde quedó cubierto (key o nombre de esta HU), no se avisa.
      if ((story.key && line.includes(story.key)) || (storyTitle && normalize(line).includes(storyTitle))) continue;
      const lineWords = contentWords(line);
      for (const criterion of ownCriteria) {
        const common = shared(criterion.words, lineWords);
        if (common.length >= MIN_SHARED_WORDS) {
          warnings.push(`${label}: ${criterion.id} parece cubrir lo que ${name} dejó fuera de alcance ("${cut(line)}"; en común: ${common.join(', ')}) -- si es así, actualizar ${name} para que indique dónde quedó cubierto.`);
        }
      }
    }

    // 3. Un criterio muy parecido al de la hermana.
    for (const text of sibling.historia?.criterios || []) {
      const theirWords = contentWords(criterionBody(text));
      for (const criterion of ownCriteria) {
        const common = shared(criterion.words, theirWords);
        const smaller = Math.min(criterion.words.size, theirWords.size) || 1;
        if (common.length >= MIN_SHARED_CRITERIA_WORDS && common.length / smaller >= SIMILAR_CRITERIA_RATIO) {
          warnings.push(`${label}: ${criterion.id} se parece a ${name} ${criterionId(text)} ("${cut(criterionBody(text))}") -- si es la misma regla, que tenga un solo dueño; si cambia el disparador, dejarlo explícito en el criterio.`);
        }
      }
    }
  }
  return { warnings, siblings: family.map(s => s.key || `"${s.summary}"`) };
}

module.exports = { checkStoryCoherence, storyFromDescription, storyKeysFromSpecs, appPrefix, contentWords };
