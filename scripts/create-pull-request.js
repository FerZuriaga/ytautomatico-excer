/**
 * Herramienta oficial y única del proyecto para crear Pull Requests en GitHub.
 * Cualquier flujo (git-workflow u otro) que necesite abrir un PR debe usar
 * exclusivamente este script.
 *
 * Uso:
 *   Uso:

  node scripts/create-pull-request.js \
      --action create \
      --head <rama-origen> \
      [--base <rama-destino>] \
      --title "<titulo>" \
      [--body "<texto>" | --body-file <archivo.md>] \
      [--repo <owner>/<name>]

Acciones soportadas actualmente:

- create
- merge
 *
 *   --head        (obligatorio) rama origen del PR, ej: feature/SCRUM-48-alta-empleado-pim
 *   --base        (opcional, default "main") rama destino del PR
 *   --title       (obligatorio) título del PR
 *   --body        (opcional) descripción del PR como texto plano
 *   --body-file   (opcional) ruta a un archivo .md con la descripción del PR
 *                 (--body y --body-file son mutuamente excluyentes)
 *   --repo        (opcional) "owner/name" del repositorio de GitHub.
 *                 Si no se indica, se deriva automáticamente parseando
 *                 la URL del remoto "origin" (git remote get-url origin).
 *
 * Requiere la variable GITHUB_TOKEN definida en el archivo .env de la raíz
 * del proyecto.
 *
 * El script no contiene información específica de tickets, ramas ni
 * repositorios: toda la información llega por argumentos/flags.
 *
 * Si ya existe un Pull Request abierto para la combinación head/base
 * indicada, el script informa su número y URL por stdout y termina sin
 * crear un duplicado (exit code 0).
 */

/**
 * Arquitectura oficial
 *
 * Este script constituye la implementación oficial para la creación
 * de Pull Requests del proyecto.
 *
 * Debe reutilizarse para cualquier flujo que necesite abrir Pull Requests.
 *
 * No crear scripts alternativos ni implementaciones paralelas.
 *
 * Toda nueva capacidad relacionada con Pull Requests deberá incorporarse
 * extendiendo este archivo.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const API_HOSTNAME = 'api.github.com';
const API_VERSION = '2022-11-28';

function parseArgs(argv) {
  const args = {
    action: 'create',
    head: null,
    base: 'main',
    title: null,
    body: null,
    bodyFile: null,
    repo: null
  };

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--action') {
      args.action = argv[i + 1];
      i++;
    } else if (argv[i] === '--head') {
      args.head = argv[i + 1];
      i++;
    } else if (argv[i] === '--base') {
      args.base = argv[i + 1];
      i++;
    } else if (argv[i] === '--title') {
      args.title = argv[i + 1];
      i++;
    } else if (argv[i] === '--body') {
      args.body = argv[i + 1];
      i++;
    } else if (argv[i] === '--body-file') {
      args.bodyFile = argv[i + 1];
      i++;
    } else if (argv[i] === '--repo') {
      args.repo = argv[i + 1];
      i++;
    } else if (argv[i] === '--pr') {
      args.pullRequestNumber = argv[i + 1];
      i++;
    }
  }

  return args;
}

function printUsage() {
  console.error('Uso: node scripts/create-pull-request.js --head <rama-origen> [--base <rama-destino>] --title "<titulo>" [--body "<texto>" | --body-file <archivo.md>] [--repo <owner>/<name>]');
}

/**
 * Deriva "owner/name" parseando la URL del remoto "origin" del repo git
 * actual. Soporta URLs https (https://github.com/<owner>/<repo>.git) y
 * ssh (git@github.com:<owner>/<repo>.git).
 */
function resolveRepoFromGitRemote() {
  let remoteUrl;
  try {
    remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
  } catch (e) {
    console.error('No se pudo obtener el remoto "origin" del repositorio git actual:', e.message);
    console.error('Indicá el repositorio explícitamente con --repo <owner>/<name>.');
    process.exit(1);
  }

  const httpsMatch = remoteUrl.match(/github\.com[/:]([^/]+)\/(.+?)(\.git)?$/);
  if (!httpsMatch) {
    console.error(`No se pudo interpretar el remoto "origin": "${remoteUrl}".`);
    console.error('Indicá el repositorio explícitamente con --repo <owner>/<name>.');
    process.exit(1);
  }

  return { owner: httpsMatch[1], name: httpsMatch[2].replace(/\.git$/, '') };
}

function resolveRepo(repoFlag) {
  if (repoFlag) {
    const parts = repoFlag.split('/');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      console.error(`--repo inválido: "${repoFlag}". Formato esperado: <owner>/<name>.`);
      process.exit(1);
    }
    return { owner: parts[0], name: parts[1] };
  }
  return resolveRepoFromGitRemote();
}

function githubRequest(method, apiPath, body = null) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: API_HOSTNAME,
      path: apiPath,
      method,
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': API_VERSION,
        'User-Agent': 'ytautomatico-excer-create-pull-request-script',
        ...(bodyStr ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) } : {})
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

/**
 * Busca un Pull Request abierto ya existente para la combinación head/base.
 * Devuelve el PR encontrado o null si no hay ninguno.
 */
async function findExistingPullRequest(owner, name, headBranch, base) {
  const query = `head=${encodeURIComponent(`${owner}:${headBranch}`)}&base=${encodeURIComponent(base)}&state=open`;
  const res = await githubRequest('GET', `/repos/${owner}/${name}/pulls?${query}`);

  if (res.status !== 200) {
    console.error('Error al consultar Pull Requests existentes:', JSON.stringify(res.body, null, 2));
    process.exit(1);
  }

  return Array.isArray(res.body) && res.body.length > 0 ? res.body[0] : null;
}

async function createPullRequest(owner, name, { head, base, title, body }) {
  const payload = { head, base, title };
  if (body) payload.body = body;

  const res = await githubRequest('POST', `/repos/${owner}/${name}/pulls`, payload);

  if (res.status === 201) {
    return res.body;
  }

  console.error('Error al crear el Pull Request:', JSON.stringify(res.body, null, 2));
  process.exit(1);
}

/**
 * Mergea un Pull Request existente.
 *
 * Utiliza el endpoint oficial de GitHub:
 * PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge
 */
async function mergePullRequest(owner, name, pullRequestNumber) {

  const res = await githubRequest(
    'PUT',
    `/repos/${owner}/${name}/pulls/${pullRequestNumber}/merge`
  );

  if (res.status === 200) {
    return res.body;
  }

  console.error(
    'Error al mergear el Pull Request:',
    JSON.stringify(res.body, null, 2)
  );
  process.exit(1);
}


/**
 * La autenticación siempre se realiza utilizando GITHUB_TOKEN
 * definido en .env.
 *
 * No utilizar GitHub CLI ni mecanismos alternativos.
 */
async function main() {
  if (!GITHUB_TOKEN) {
    console.error('Falta la variable GITHUB_TOKEN en el archivo .env de la raíz del proyecto.');
    process.exit(1);
  }

  const { action, head, base, title, body, bodyFile, repo, pullRequestNumber } = parseArgs(process.argv.slice(2));;

  if (action === 'create') {
    if (!head || !title) {
      printUsage();
      process.exit(1);
    }

    if (body && bodyFile) {
      console.error('--body y --body-file son mutuamente excluyentes. Usá solo uno.');
      process.exit(1);
    }
  } else if (action === 'merge') {
    if (!pullRequestNumber) {
      console.error('Debe indicar --pr <numero>.');
      process.exit(1);
    }
  }
  let resolvedBody = body || null;
  if (bodyFile) {
    try {
      resolvedBody = fs.readFileSync(path.resolve(bodyFile), 'utf8');
    } catch (e) {
      console.error(`No se pudo leer "${bodyFile}": ${e.message}`);
      process.exit(1);
    }
  }

  const { owner, name } = resolveRepo(repo);
  /*
* IMPORTANTE:
* La validación de PR existente solo aplica a CREATE.
* MERGE trabaja sobre un PR existente por número.
*/

  if (action === 'create') {

    console.log(`Verificando si ya existe un Pull Request abierto ${head} -> ${base} en ${owner}/${name}...`);
    const existing = await findExistingPullRequest(owner, name, head, base);

    if (existing) {
      console.log(`Ya existe un Pull Request abierto para ${head} -> ${base}: #${existing.number}`);
      console.log(`URL: ${existing.html_url}`);
      return;
    }
  }

   /**
   * Todas las operaciones sobre Pull Requests deben implementarse como
   * nuevas acciones dentro de este switch.
   *
   * No crear scripts adicionales para merge, cierre, comentarios,
   * reviews o cualquier otra operación relacionada con Pull Requests.
   */
  switch (action.toLowerCase()) {

    case 'create': {
      console.log(`Creando Pull Request ${head} -> ${base}...`);

      const pr = await createPullRequest(owner, name, {
        head,
        base,
        title,
        body: resolvedBody
      });

      console.log(`Creado: #${pr.number}`);
      console.log(`URL: ${pr.html_url}`);
      break;
    }
    
    case 'merge': {

      console.log(`Mergeando Pull Request #${pullRequestNumber}...`);

      const result = await mergePullRequest(
        owner,
        name,
        pullRequestNumber
      );

      console.log(`Merge realizado correctamente.`);
      console.log(`SHA: ${result.sha}`);

      break;
    }

    default:
      console.error(`Acción no soportada: "${action}".`);
      process.exit(1);
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
