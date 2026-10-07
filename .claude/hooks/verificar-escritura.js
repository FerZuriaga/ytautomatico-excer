/**
 * Hook PostToolUse (Write|Edit) del asistente: corre en el momento los
 * chequeos que ya existen, sobre el archivo que se acaba de escribir (D-51).
 *
 *   - .js que revisa el lint (cypress/, cypress.config.js): eslint de ese
 *     archivo; frena con errores o con avisos nuevos contra el último commit.
 *   - archivo de lote ("formato": "lote", en cualquier carpeta):
 *     create-jira-task.js --dry-run --borrador.
 *
 * No agrega reglas: adelanta las de siempre para que un error se vea al
 * escribirlo y no varios pasos después (lote de RBP habitaciones,
 * 2026-10-07: 5 de los 7 errores los frenó un chequeo, pero tarde).
 * Sin problemas no dice nada (exit 0). Con problemas, exit 2: Claude Code le
 * pasa el stderr al asistente, que corrige antes de seguir.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
// Lo que revisa `npm run lint` (eslint.config.js): v3/ está fuera del lint,
// lo cubren los tests unitarios (npm run test:unit).
const LINTED_DIRS = ['cypress'].map(dir => path.join(ROOT, dir) + path.sep);
const LINTED_FILES = ['cypress.config.js'].map(file => path.join(ROOT, file));

function run(command, args, stdin) {
  const result = spawnSync(command, args, { cwd: ROOT, encoding: 'utf8', shell: process.platform === 'win32', timeout: 90000, input: stdin });
  return { status: result.status, stdout: result.stdout || '', output: `${result.stdout || ''}${result.stderr || ''}` };
}

// Mensajes de eslint (formato json) de un archivo, o de su versión del
// último commit (por stdin): los avisos que ya estaban no frenan (D-42).
function lint(full, source) {
  const args = ['eslint', '--no-warn-ignored', '--format', 'json'];
  const { stdout } = source === undefined
    ? run('npx', [...args, full])
    : run('npx', [...args, '--stdin', '--stdin-filename', full], source);
  try {
    return JSON.parse(stdout).flatMap(r => r.messages);
  } catch {
    return null;
  }
}

function committedSource(full) {
  const result = spawnSync('git', ['show', `HEAD:${path.relative(ROOT, full).split(path.sep).join('/')}`], { cwd: ROOT, encoding: 'utf8' });
  return result.status === 0 ? result.stdout : '';
}

function lintProblem(full) {
  const now = lint(full);
  if (!now) return null;
  const errors = now.filter(m => m.severity === 2);
  const before = lint(full, committedSource(full)) || [];
  const newWarnings = now.filter(m => m.severity === 1).length - before.filter(m => m.severity === 1).length;
  if (!errors.length && newWarnings <= 0) return null;
  const list = now.filter(m => m.severity === 2 || newWarnings > 0)
    .map(m => `  ${m.line}:${m.column} ${m.severity === 2 ? 'error' : 'aviso'} ${m.message} (${m.ruleId})`).join('\n');
  return `eslint en ${path.relative(ROOT, full)}: ${errors.length} error(es), ${Math.max(newWarnings, 0)} aviso(s) nuevo(s) contra el último commit\n${list}`;
}

function filePathFrom(input) {
  try {
    const payload = JSON.parse(input);
    return (payload.tool_input && payload.tool_input.file_path) || (payload.tool_response && payload.tool_response.filePath) || null;
  } catch {
    return null;
  }
}

function isLote(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')).formato === 'lote';
  } catch {
    return false;
  }
}

function check(file) {
  const full = path.resolve(file);
  if (full.endsWith('.js') && (LINTED_DIRS.some(dir => full.startsWith(dir)) || LINTED_FILES.includes(full))) {
    return lintProblem(full);
  }
  if (full.endsWith('.json') && isLote(full)) {
    const { status, output } = run('node', [path.join('v3', 'scripts', 'create-jira-task.js'), '--data', full, '--dry-run', '--borrador']);
    const lines = output.split(/\r?\n/).filter(line => !/injected env/.test(line)).join('\n').trim();
    return status === 0 ? null : `Borrador del lote (${path.basename(full)}):\n${lines}`;
  }
  return null;
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  const file = filePathFrom(input);
  const problem = file ? check(file) : null;
  if (problem) {
    process.stderr.write(`${problem}\n`);
    process.exit(2);
  }
});
