/**
 * Recorrido de un lote de Test Cases (lo usa xray.publishTestCasesBatch):
 * uno que falla no frena a los demás, y el resultado separa los que se
 * crearon completos, los que se crearon a medias y los que no se crearon.
 *
 * Nace del 2026-10-05 (ParaBank, SCRUM-911): un Test Case se creó con sus
 * pasos, falló al vincularse a la HU y se informó como "fallido", sin su
 * key y con el consejo de "reintentar los fallidos" — reintentarlo lo
 * habría duplicado. Un Test Case creado a medias se completa
 * (create-jira-task.js --complete-testcase), nunca se vuelve a crear.
 *
 * Lógica pura: las etapas (crear y completar) se inyectan.
 */

/**
 * stages.create(model) -> testCaseKey; stages.complete(testCaseKey, model)
 * hace el resto (pasos, vínculo, ejecución).
 * Devuelve { succeeded: [key], incomplete: [{ model, key, err }], failed: [{ model, err }] }.
 */
async function runBatch(models, stages) {
  const succeeded = [];
  const incomplete = [];
  const failed = [];
  for (const model of models) {
    let key = null;
    try {
      key = await stages.create(model);
      await stages.complete(key, model);
      succeeded.push(key);
    } catch (err) {
      if (key) incomplete.push({ model, key, err });
      else failed.push({ model, err });
    }
  }
  return { succeeded, incomplete, failed };
}

/** Mensaje de error del lote, o null si todo se creó completo. */
function batchErrorMessage({ succeeded, incomplete, failed }, { issueKey, testCycleKey }) {
  if (!incomplete.length && !failed.length) return null;
  const lines = [];
  if (incomplete.length) {
    lines.push(`${incomplete.length} Test Case(s) CREADOS A MEDIAS (no volver a crearlos):`);
    incomplete.forEach(({ model, key, err }) => lines.push(`  - ${key} "${model.name}": ${err.message}`));
    const cycle = testCycleKey ? ` --test-cycle ${testCycleKey}` : '';
    lines.push(`  Completar cada uno con: node v3/scripts/create-jira-task.js ${issueKey} --complete-testcase <key>${cycle}`);
    lines.push('  (si faltan sus pasos, además --update-steps).');
  }
  if (failed.length) {
    lines.push(`${failed.length} Test Case(s) NO se crearon (se pueden volver a publicar):`);
    failed.forEach(({ model, err }) => lines.push(`  - "${model.name}": ${err.message}`));
  }
  lines.push(`Completos: ${succeeded.length}.`);
  return lines.join('\n');
}

module.exports = { runBatch, batchErrorMessage };
