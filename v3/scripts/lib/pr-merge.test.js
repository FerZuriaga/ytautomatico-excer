/**
 * Cobertura de lib/pr-merge.js (merge seguro de create-pull-request.js).
 * Regresión del 2026-09-28: el merge del #123 dio 405 recién pusheado y la
 * rama se borró igual (PR cerrado sin mergear).
 *
 * Correr con: node --test v3/scripts/lib/pr-merge.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { safeMerge } = require('./pr-merge');

const OPEN = { state: 'open', merged: false, mergeable: true, mergeable_state: 'clean', head: { ref: 'feature/x' }, base: { ref: 'main' } };
const MERGED = { ...OPEN, state: 'closed', merged: true };

// GitHub simulado: devuelve los estados del PR y las respuestas del merge
// en orden, y registra cada llamada.
function fakeGitHub({ prs, merges = [{ status: 200, body: { sha: 'abc123' } }], del = { status: 204 }, dependents = [], retargetStatus = 200 }) {
  const calls = [];
  let p = 0;
  let m = 0;
  return {
    calls,
    getPr: async () => { calls.push('get'); return prs[Math.min(p++, prs.length - 1)]; },
    merge: async () => { calls.push('merge'); return merges[Math.min(m++, merges.length - 1)]; },
    deleteBranch: async ref => { calls.push(`delete ${ref}`); return del; },
    listDependents: async ref => { calls.push(`dependents ${ref}`); return dependents; },
    retarget: async (number, base) => {
      calls.push(`retarget #${number} -> ${base}`);
      return retargetStatus === 200 ? { status: 200, body: { base: { ref: base } } } : { status: retargetStatus, body: {} };
    }
  };
}
const noWait = async () => {};

test('regresión #123: un 405 recién pusheado se reintenta y la rama se borra solo tras confirmar el merge', async () => {
  const gh = fakeGitHub({
    prs: [OPEN, OPEN, MERGED],
    merges: [{ status: 405, body: { message: 'Base branch was modified. Review and try the merge again.' } }, { status: 200, body: { sha: 'abc123' } }]
  });
  const logs = [];
  const result = await safeMerge({ ...gh, deleteHeadBranch: true, wait: noWait, log: m => logs.push(m) });

  assert.deepEqual(result, { sha: 'abc123', branch: 'feature/x', branchDeleted: true, retargeted: [] });
  assert.deepEqual(gh.calls, ['get', 'merge', 'get', 'merge', 'get', 'dependents feature/x', 'delete feature/x']);
  assert.match(logs[0], /405: Base branch was modified/);
});

test('espera a que GitHub termine de calcular mergeable antes de intentar', async () => {
  const gh = fakeGitHub({ prs: [{ ...OPEN, mergeable: null }, { ...OPEN, mergeable: null }, OPEN, MERGED] });
  const result = await safeMerge({ ...gh, wait: noWait });
  assert.equal(result.sha, 'abc123');
  assert.equal(result.branchDeleted, false, 'sin --delete-branch no se toca la rama');
  assert.deepEqual(gh.calls, ['get', 'get', 'get', 'merge', 'get']);
});

test('si el 405 persiste, falla sin borrar la rama', async () => {
  const gh = fakeGitHub({ prs: [OPEN], merges: [{ status: 405, body: { message: 'Pull Request is not mergeable' } }] });
  await assert.rejects(safeMerge({ ...gh, deleteHeadBranch: true, attempts: 3, wait: noWait }), /HTTP 405/);
  assert.ok(!gh.calls.some(c => c.startsWith('delete')));
});

test('PR cerrado, con conflictos o ya mergeado: no se intenta mergear', async () => {
  for (const [pr, pattern] of [
    [{ ...OPEN, state: 'closed' }, /está closed: no se puede mergear/],
    [{ ...OPEN, mergeable: false, mergeable_state: 'dirty' }, /conflictos .*dirty/],
    [MERGED, /ya estaba mergeado/]
  ]) {
    const gh = fakeGitHub({ prs: [pr] });
    await assert.rejects(safeMerge({ ...gh, deleteHeadBranch: true, wait: noWait }), pattern);
    assert.deepEqual(gh.calls, ['get']);
  }
});

test('mergeable que nunca se resuelve: no mergea ni borra', async () => {
  const gh = fakeGitHub({ prs: [{ ...OPEN, mergeable: null }] });
  await assert.rejects(safeMerge({ ...gh, deleteHeadBranch: true, attempts: 3, wait: noWait }), /no confirmó .* después de 3 intentos/);
  assert.ok(!gh.calls.includes('merge'));
});

test('merge respondido pero no confirmado por lectura: no borra la rama', async () => {
  const gh = fakeGitHub({ prs: [OPEN, OPEN] });
  await assert.rejects(safeMerge({ ...gh, deleteHeadBranch: true, wait: noWait }), /no figura mergeado/);
  assert.ok(!gh.calls.some(c => c.startsWith('delete')));
});

test('regresión #143: los PRs apilados se re-apuntan a la base antes de borrar la rama', async () => {
  const gh = fakeGitHub({ prs: [OPEN, MERGED], dependents: [{ number: 143 }] });
  const result = await safeMerge({ ...gh, deleteHeadBranch: true, wait: noWait });
  assert.deepEqual(result.retargeted, [143]);
  assert.deepEqual(gh.calls, ['get', 'merge', 'get', 'dependents feature/x', 'retarget #143 -> main', 'delete feature/x']);
});

test('si un PR apilado no se puede re-apuntar, la rama no se borra', async () => {
  const gh = fakeGitHub({ prs: [OPEN, MERGED], dependents: [{ number: 143 }], retargetStatus: 422 });
  await assert.rejects(safeMerge({ ...gh, deleteHeadBranch: true, wait: noWait }), /PR apilado #143 no se pudo re-apuntar a main \(HTTP 422\): no se borra la rama feature\/x/);
  assert.ok(!gh.calls.some(c => c.startsWith('delete')));
});

test('sin --delete-branch no se buscan ni se tocan PRs apilados', async () => {
  const gh = fakeGitHub({ prs: [OPEN, MERGED], dependents: [{ number: 143 }] });
  await safeMerge({ ...gh, wait: noWait });
  assert.deepEqual(gh.calls, ['get', 'merge', 'get']);
});

test('merge confirmado pero la rama no se pudo borrar: lo informa con el SHA', async () => {
  const gh = fakeGitHub({ prs: [OPEN, MERGED], del: { status: 422 } });
  await assert.rejects(safeMerge({ ...gh, deleteHeadBranch: true, wait: noWait }), /Merge confirmado \(SHA abc123\), pero no se pudo borrar la rama feature\/x \(HTTP 422\)/);
});
