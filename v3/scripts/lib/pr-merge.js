/**
 * Merge seguro de un Pull Request (lo usa create-pull-request.js
 * --action merge).
 *
 * Nace del 2026-09-28 (PR #123): el merge se pidió segundos después de un
 * push, GitHub respondió 405 (todavía calculaba si el PR era mergeable) y
 * el borrado de la rama, encadenado a mano detrás del merge, se ejecutó
 * igual: el PR quedó cerrado sin mergear y hubo que restaurar la rama y
 * abrir otro (#124).
 *
 * Reglas:
 *   - Antes de mergear se espera a que GitHub termine de calcular
 *     "mergeable" (null = calculando). Un PR cerrado o con conflictos no
 *     se intenta mergear.
 *   - Un 405 se reintenta (puede ser el mismo cálculo en curso) hasta
 *     agotar los intentos.
 *   - El merge se confirma por lectura (merged: true) y recién entonces,
 *     si se pidió, se borra la rama origen. Nunca se borra una rama de un
 *     PR que no quedó mergeado.
 *   - Antes de borrar la rama, los PRs abiertos que la usan como base (PRs
 *     apilados) se re-apuntan a la base del PR mergeado y se verifica el
 *     cambio. Si alguno no se puede re-apuntar, la rama no se borra.
 *     Caso real 2026-10-01: el merge del #142 borró su rama y GitHub cerró
 *     el #143, apilado sobre ella; hubo que rehacerlo como #144.
 *
 * Función pura: las llamadas a GitHub y la espera se inyectan.
 */

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * getPr() -> Promise<{ state, merged, mergeable, mergeable_state, head: { ref } }>
 * merge() -> Promise<{ status, body }>
 * deleteBranch(ref) -> Promise<{ status, body }>
 * listDependents(ref) -> Promise<[{ number }]>  PRs abiertos con base = ref
 * retarget(number, base) -> Promise<{ status, body: { base: { ref } } }>
 */
async function safeMerge({ getPr, merge, deleteBranch, listDependents, retarget, deleteHeadBranch = false, attempts = 6, delayMs = 3000, wait = sleep, log = () => {} }) {
  let result = null;

  for (let attempt = 1; attempt <= attempts && !result; attempt++) {
    const pr = await getPr();
    if (pr.merged) throw new Error('El Pull Request ya estaba mergeado: no se hace nada.');
    if (pr.state !== 'open') throw new Error(`El Pull Request está ${pr.state}: no se puede mergear (reabrirlo o crear uno nuevo desde la rama).`);
    if (pr.mergeable === false) throw new Error(`El Pull Request tiene conflictos o no cumple las reglas de la rama destino (mergeable_state: ${pr.mergeable_state}).`);

    if (pr.mergeable === null || pr.mergeable === undefined) {
      if (attempt === attempts) break;
      log(`GitHub todavía está calculando si el PR se puede mergear; nuevo intento en ${delayMs / 1000}s...`);
      await wait(delayMs);
      continue;
    }

    const res = await merge();
    if (res.status === 200) { result = res.body; break; }
    if (res.status === 405 && attempt < attempts) {
      log(`GitHub rechazó el merge (405: ${res.body && res.body.message}); nuevo intento en ${delayMs / 1000}s...`);
      await wait(delayMs);
      continue;
    }
    throw new Error(`Error al mergear el Pull Request (HTTP ${res.status}): ${JSON.stringify(res.body)}`);
  }

  if (!result) throw new Error(`GitHub no confirmó que el PR se pueda mergear después de ${attempts} intentos; no se mergeó ni se borró nada.`);

  const after = await getPr();
  if (!after.merged) throw new Error('GitHub respondió el merge pero el PR no figura mergeado al leerlo: no se borra la rama.');

  let branchDeleted = false;
  const retargeted = [];
  if (deleteHeadBranch) {
    const dependents = await listDependents(after.head.ref);
    for (const dep of dependents) {
      const res = await retarget(dep.number, after.base.ref);
      if (res.status !== 200 || !res.body || !res.body.base || res.body.base.ref !== after.base.ref) {
        throw new Error(`Merge confirmado (SHA ${result.sha}), pero el PR apilado #${dep.number} no se pudo re-apuntar a ${after.base.ref} (HTTP ${res.status}): no se borra la rama ${after.head.ref} para que no se cierre.`);
      }
      retargeted.push(dep.number);
      log(`PR apilado #${dep.number} re-apuntado a ${after.base.ref}.`);
    }
    const del = await deleteBranch(after.head.ref);
    if (del.status !== 204) {
      throw new Error(`Merge confirmado (SHA ${result.sha}), pero no se pudo borrar la rama ${after.head.ref} (HTTP ${del.status}).`);
    }
    branchDeleted = true;
  }

  return { sha: result.sha, branch: after.head.ref, branchDeleted, retargeted };
}

module.exports = { safeMerge };
