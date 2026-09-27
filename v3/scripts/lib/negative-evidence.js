/**
 * Evidencia del discovery para los Test Cases negativos: cada TC con
 * tipo "negativo" tiene que traer el informe de explore-page.js donde se
 * probó y lo que se observó. Sin eso no se publica.
 *
 * Nace del lote de Checkout (2026-09-26): los Bugs SCRUM-527 y SCRUM-528
 * aparecieron recién al correr los specs porque los negativos se habían
 * escrito sin probarlos en el discovery (2 iteraciones, ~8 min). La regla
 * estaba en la skill `discovery`; acá pasa a ser obligatoria.
 *
 * Formato en el Modelo Canónico:
 *   "evidencia": {
 *     "reporte": "<ruta al report.json de explore-page.js>",
 *     "observado": "Se muestra el aviso \"You can only have one Thor Hammer in the cart.\""
 *   }
 *
 * Errores (frenan): falta la evidencia, el informe no se puede leer, no lo
 * generó explore-page.js o la exploración se cortó antes de terminar.
 * Warnings: un texto entre comillas de "observado" que no aparece en
 * ningún momento de la exploración (puede ser algo que se espera que NO
 * esté, por eso no frena) o un informe de hace más de 14 días.
 *
 * Función pura: la lectura del informe se inyecta (readReport).
 */

const MAX_AGE_DAYS = 14;
const QUOTED_REGEX = /["“]([^"”]{3,})["”]/g;

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function modelsOf(issue) {
  return [
    ...(issue.testcaseModel ? [issue.testcaseModel] : []),
    ...(Array.isArray(issue.testcaseModels) ? issue.testcaseModels : [])
  ];
}

function issuesOf(payload) {
  return (Array.isArray(payload?.issues) ? payload.issues : [payload]).filter(Boolean);
}

function validateNegativeEvidence(payload, { readReport, now = new Date() }) {
  const errors = [];
  const warnings = [];

  for (const issue of issuesOf(payload)) {
    for (const model of modelsOf(issue)) {
      if (normalizeText(model?.tipo) !== 'negativo') continue;
      const label = `${issue.summary || '(sin summary)'} / ${model.name || '(TC sin nombre)'}`;
      const evidencia = model.evidencia;

      if (!evidencia || isBlank(evidencia.reporte) || isBlank(evidencia.observado)) {
        errors.push(`${label}: caso negativo sin evidencia del discovery -- agregar "evidencia": { "reporte": "<report.json de explore-page.js>", "observado": "<lo que se vio>" }. Si no se probo con explore-page.js, no se publica.`);
        continue;
      }

      let report;
      try {
        report = readReport(evidencia.reporte);
      } catch (e) {
        errors.push(`${label}: no se pudo leer el informe de evidencia "${evidencia.reporte}" (${e.message}).`);
        continue;
      }

      if (report?.generator !== 'explore-page') {
        errors.push(`${label}: "${evidencia.reporte}" no es un informe de explore-page.js (o es de una version anterior sin capturas de texto) -- volver a explorar el caso.`);
        continue;
      }
      if (report.failedStep) {
        errors.push(`${label}: la exploracion de "${evidencia.reporte}" se corto antes de terminar ("${String(report.failedStep).slice(0, 80)}") -- no prueba el resultado.`);
        continue;
      }

      const seen = normalizeText([...(report.snapshots || []).map(s => s.text), ...(report.headings || [])].join(' '));
      for (const match of String(evidencia.observado).matchAll(QUOTED_REGEX)) {
        if (!seen.includes(normalizeText(match[1]))) {
          warnings.push(`${label}: "${match[1]}" no aparece en ningun momento de la exploracion -- confirmar que es lo observado (o algo que se espera que no este).`);
        }
      }

      const generatedAt = new Date(report.generatedAt);
      if (!Number.isNaN(generatedAt.getTime()) && (now - generatedAt) / 86400000 > MAX_AGE_DAYS) {
        warnings.push(`${label}: la evidencia es de hace mas de ${MAX_AGE_DAYS} dias (${report.generatedAt.slice(0, 10)}) -- la app pudo cambiar; conviene volver a explorar.`);
      }
    }
  }

  return { errors, warnings };
}

module.exports = { validateNegativeEvidence };
