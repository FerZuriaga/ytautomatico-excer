/**
 * Reporte público de trazabilidad: HU -> CA -> Test Case (con sus pasos)
 * -> it() del spec -> último resultado en Xray, más los Bugs vinculados.
 *
 * Nace del 2026-10-03 (presentación del proyecto): Jira/Xray es privado y
 * quien mira el repo no puede ver la mitad del trabajo. Hacer público el
 * proyecto de Jira no servía (team-managed, Xray no se muestra a anónimos
 * y expone todo); este reporte es la copia pública, elegida y regenerable:
 *   node v3/scripts/check-traceability.js --spec <carpeta> --report <archivo.md>
 *
 * Módulo puro: recibe lo leído de Jira/Xray y los specs, devuelve Markdown.
 */

const RESULT_LABEL = {
  PASSED: '✅ PASSED',
  FAILED: '❌ FAILED',
  'TO DO': '⏳ sin ejecutar',
  EXECUTING: '⏳ en ejecución'
};

// Ciclo de la HU en el encabezado del spec ("// Ticket Jira: SCRUM-804
// (CA-01..CA-06, Test Cycle SCRUM-805)").
function cycleFromSpec(source, projectKey = 'SCRUM') {
  const line = (String(source || '').match(/Ticket Jira:[^\n]*/) || [''])[0];
  const match = line.match(new RegExp(`Test Cycle\\s+(${projectKey}-\\d+)`));
  return match ? match[1] : null;
}

const cell = text => String(text ?? '').replace(/\r?\n/g, ' ').replace(/\|/g, '\\|').trim();
const tcOrder = tc => Number(String(tc || '').split('.')[1]) || 0;
const keyNumber = key => Number(String(key).split('-')[1]) || 0;
const criterionId = text => (String(text).match(/^\s*(CA-\d{2})/) || [])[1] || null;
// "Notes App - Cambiar mi contraseña" -> "Cambiar mi contraseña" (el título ya nombra la app).
const shortSummary = summary => String(summary || '').split(' - ').slice(1).join(' - ') || String(summary || '');
const heading = s => `${s.key} · ${shortSummary(s.summary)}`;
// Id que GitHub le da a un título: minúsculas, sin puntuación y cada espacio
// un guion (sin colapsar: "SCRUM-804 · Cambiar" -> "scrum-804--cambiar").
const anchorOf = text => text.toLowerCase().replace(/[^\p{L}\p{N} _-]/gu, '').replace(/ /g, '-');

function resultOf(test) {
  if (test.skipped) {
    const bug = (test.title.match(/bug conocido:\s*([A-Z][A-Z0-9]*-\d+)/i) || [])[1];
    return bug ? `⊘ salteado (bug conocido ${bug})` : '⊘ salteado';
  }
  return RESULT_LABEL[test.result] || (test.result ? test.result : '— sin dato');
}

function stepsBlock(test) {
  const steps = test.steps || [];
  const rows = steps.map((s, i) => `| ${i + 1} | ${cell(s.action)} | ${cell(s.data) || '-'} | ${cell(s.result)} |`);
  return [
    `**${test.key} · ${cell(test.name)}**`,
    '',
    '| # | Acción | Datos | Resultado esperado |',
    '|---|---|---|---|',
    ...rows,
    ''
  ];
}

/**
 * data: {
 *   title, generatedAt ("2026-10-03"), command, specBase (prefijo de link a
 *   los specs desde el archivo del reporte, ej. "../../"),
 *   stories: [{ key, summary, status, historia, cycleKey, specFile,
 *     bugs: [{ key, summary, status }],
 *     tests: [{ key, ca, tc, title, line, skipped, name, tipo, steps, result }],
 *     notAutomated: [keys] }]
 * }
 */
function buildTraceReport(data) {
  const stories = [...data.stories].sort((a, b) => keyNumber(a.key) - keyNumber(b.key));
  const out = [];
  const passed = s => s.tests.filter(t => !t.skipped && t.result === 'PASSED').length;
  const skipped = s => s.tests.filter(t => t.skipped).length;

  out.push(`# Trazabilidad · ${data.title}`, '');
  out.push(`Generado el ${data.generatedAt} leyendo Jira/Xray y los specs del repo con:`, '', '```', data.command, '```', '');
  out.push('Jira/Xray es privado: este archivo es la copia pública de lo publicado allá. Cada Historia muestra sus criterios de aceptación, los Test Cases de cada criterio con sus pasos tal como están en Xray, el `it()` que los automatiza y el último resultado reportado en su Test Cycle.', '');

  const totals = stories.reduce((acc, s) => ({
    ca: acc.ca + (s.historia.criterios || []).length,
    tc: acc.tc + s.tests.length + s.notAutomated.length,
    auto: acc.auto + s.tests.length,
    passed: acc.passed + passed(s),
    skipped: acc.skipped + skipped(s),
    bugs: acc.bugs + s.bugs.length
  }), { ca: 0, tc: 0, auto: 0, passed: 0, skipped: 0, bugs: 0 });

  out.push('## Resumen', '');
  out.push('| Historia | Estado | CA | Test Cases | Automatizados | Último resultado | Bugs vinculados |');
  out.push('|---|---|---|---|---|---|---|');
  for (const s of stories) {
    const result = `${passed(s)} ✅${skipped(s) ? ` · ${skipped(s)} ⊘` : ''}`;
    out.push(`| [${cell(heading(s))}](#${anchorOf(heading(s))}) | ${cell(s.status)} | ${(s.historia.criterios || []).length} | ${s.tests.length + s.notAutomated.length} | ${s.tests.length} | ${result} | ${s.bugs.map(b => b.key).join(', ') || '—'} |`);
  }
  out.push(`| **Total** | | **${totals.ca}** | **${totals.tc}** | **${totals.auto}** | **${totals.passed} ✅${totals.skipped ? ` · ${totals.skipped} ⊘` : ''}** | **${totals.bugs}** |`, '');
  out.push('✅ pasó en la última ejecución reportada · ⊘ automatizado pero salteado (`it.skip`) por un bug conocido, que figura vinculado a la Historia.', '');

  for (const s of stories) {
    const h = s.historia;
    out.push(`## ${heading(s)}`, '');
    out.push(`**Como** ${h.como}, **quiero** ${h.quiero}, **para** ${h.para}.`, '');
    if (h.objetivo) out.push(`**Objetivo:** ${h.objetivo}`, '');
    out.push(`Estado: ${s.status || '—'} · Spec: [\`${s.specFile.split('/').pop()}\`](${data.specBase}${s.specFile}) · Test Cycle: ${s.cycleKey || '—'}`, '');

    const byCa = new Map();
    for (const t of s.tests) {
      if (!byCa.has(t.ca)) byCa.set(t.ca, []);
      byCa.get(t.ca).push(t);
    }
    for (const criterion of h.criterios || []) {
      const ca = criterionId(criterion);
      const tests = (byCa.get(ca) || []).sort((a, b) => tcOrder(a.tc) - tcOrder(b.tc));
      out.push(`### ${cell(criterion)}`, '');
      if (!tests.length) {
        out.push('_Sin Test Cases automatizados._', '');
        continue;
      }
      out.push('| TC | Test Case | Tipo | Pasos | Test | Resultado |', '|---|---|---|---|---|---|');
      for (const t of tests) {
        out.push(`| ${t.tc} · ${t.key} | ${cell(t.name)} | ${t.tipo || '—'} | ${(t.steps || []).length} | [L${t.line}](${data.specBase}${t.file}#L${t.line}) | ${resultOf(t)} |`);
      }
      out.push('', `<details><summary>Pasos de los Test Cases de ${ca}</summary>`, '');
      tests.forEach(t => out.push(...stepsBlock(t)));
      out.push('</details>', '');
    }

    if (s.notAutomated.length) out.push(`**Test Cases vinculados sin automatizar:** ${s.notAutomated.join(', ')}`, '');
    const sections = [
      ['Bugs vinculados', s.bugs.map(b => `${b.key} · ${cell(b.summary)} (${b.status || '—'})`)],
      ['Criterios sin caso negativo (justificados)', h.sinNegativoTexto || []],
      ['Fuera de alcance', h.fueraDeAlcance || []]
    ];
    for (const [title, items] of sections) {
      if (items.length) out.push(`**${title}:**`, '', ...items.map(i => `- ${i}`), '');
    }
  }
  return out.join('\n');
}

module.exports = { buildTraceReport, cycleFromSpec, anchorOf };
