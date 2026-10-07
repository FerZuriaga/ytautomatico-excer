/**
 * Herramienta oficial y única del proyecto para crear Pull Requests en GitHub.
 * Cualquier flujo (`docs/lote.md` u otro) que necesite abrir un PR debe usar
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
- merge --pr <n> [--delete-branch]: espera a que GitHub confirme que el PR
  se puede mergear, reintenta un 405 transitorio, confirma el merge por
  lectura y recién ahí (con --delete-branch) borra la rama origen. Nunca
  encadenar a mano el borrado de la rama detrás del merge (caso real #123:
  405 recién pusheado, la rama se borró igual y el PR quedó cerrado).
  Antes de borrar la rama re-apunta a la base los PRs apilados sobre ella
  (caso real #143: GitHub lo cerró al borrarse su base).
- view --pr <n>: muestra estado, ramas, título y descripción de un PR.
- close --pr <n>[,<n>...]: cierra PRs abiertos SIN mergear (la rama queda
  en el remoto). Solo con confirmación explícita del usuario.
- update --pr <n> [--title "..."] [--body "..." | --body-file <archivo.md>]
  [--base <rama>]: actualiza título, descripción o rama destino de un PR
  abierto (ej. re-apuntar a main un PR apilado cuando se mergea su base).
- wip-check  [--max <n>]  (default 2): lista los PRs abiertos y termina con
  código 1 si hay más de <n>. Se corre antes de arrancar un lote nuevo:
  con PRs acumulados sin mergear, los lotes nuevos salen apilados y
  chocan entre sí (caso real 2026-09-26: #107, #108 y #109 abiertos).
- ci-variable --name <QA_...> [--value <v> | --delete]: muestra, fija o
  borra una variable de Actions del repo que lee el workflow de los PR
  (QA_PR_E2E prende los E2E afectados; QA_PR_MAX_SPECS es su tope). Solo
  variables que empiezan con QA_. Prender los E2E es decisión del usuario
  (D-49: hoy apagados hasta tener un entorno propio).
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
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { safeMerge } = require('./lib/pr-merge');
const { onBody } = require('./lib/http-body');
const { recordStep } = require('./lib/metrics-log');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const STARTED = Date.now();
const API_HOSTNAME = 'api.github.com';
const API_VERSION = '2022-11-28';

// Máximo de PRs abiertos para arrancar un lote nuevo (wip-check).
const DEFAULT_WIP_LIMIT = 2;

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
      // update solo cambia la rama destino si se pasa explícitamente.
      args.baseGiven = true;
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
    } else if (argv[i] === '--max') {
      args.max = Number(argv[i + 1]);
      i++;
    } else if (argv[i] === '--delete-branch') {
      args.deleteBranch = true;
    } else if (argv[i] === '--pr') {
      args.pullRequestNumber = argv[i + 1];
      i++;
    } else if (argv[i] === '--name') {
      args.variableName = argv[i + 1];
      i++;
    } else if (argv[i] === '--value') {
      args.variableValue = argv[i + 1];
      i++;
    } else if (argv[i] === '--delete') {
      args.deleteVariable = true;
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
      onBody(res, data => {
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

  const { action, head, base, baseGiven, title, body, bodyFile, repo, pullRequestNumber, max, deleteBranch, variableName, variableValue, deleteVariable } = parseArgs(process.argv.slice(2));

  if (action === 'ci-variable') {
    if (!/^QA_[A-Z0-9_]+$/.test(String(variableName || ''))) {
      console.error('ci-variable: indicar --name con una variable que empiece con QA_ (ej. QA_PR_E2E).');
      process.exit(1);
    }
    if (variableValue !== undefined && deleteVariable) {
      console.error('ci-variable: --value y --delete son mutuamente excluyentes.');
      process.exit(1);
    }
  }

  if ((action === 'view' || action === 'close') && !pullRequestNumber) {
    console.error('Debe indicar --pr <numero>.');
    process.exit(1);
  }

  if (action === 'update') {
    if (!pullRequestNumber) {
      console.error('Debe indicar --pr <numero>.');
      process.exit(1);
    }
    if (!title && !body && !bodyFile && !baseGiven) {
      console.error('update: indicar al menos --title, --body/--body-file o --base.');
      process.exit(1);
    }
    if (body && bodyFile) {
      console.error('--body y --body-file son mutuamente excluyentes. Usá solo uno.');
      process.exit(1);
    }
  }

  if (action === 'wip-check' && max !== undefined && (!Number.isInteger(max) || max < 0)) {
    console.error('--max debe ser un entero >= 0.');
    process.exit(1);
  }

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
      recordStep('pr', STARTED, { branch: head, pr: pr.number });
      break;
    }
    
    case 'merge': {

      console.log(`Mergeando Pull Request #${pullRequestNumber}...`);

      const prPath = `/repos/${owner}/${name}/pulls/${pullRequestNumber}`;
      let result;
      try {
        result = await safeMerge({
          getPr: async () => {
            const res = await githubRequest('GET', prPath);
            if (res.status !== 200) throw new Error(`Error al leer el Pull Request (HTTP ${res.status}): ${JSON.stringify(res.body)}`);
            return res.body;
          },
          merge: () => githubRequest('PUT', `${prPath}/merge`),
          deleteBranch: ref => githubRequest('DELETE', `/repos/${owner}/${name}/git/refs/heads/${ref.split('/').map(encodeURIComponent).join('/')}`),
          listDependents: async ref => {
            const res = await githubRequest('GET', `/repos/${owner}/${name}/pulls?state=open&base=${encodeURIComponent(ref)}&per_page=100`);
            if (res.status !== 200) throw new Error(`Error al buscar PRs apilados sobre ${ref} (HTTP ${res.status}): no se borra la rama.`);
            return res.body;
          },
          retarget: (number, base) => githubRequest('PATCH', `/repos/${owner}/${name}/pulls/${number}`, { base }),
          deleteHeadBranch: Boolean(deleteBranch),
          log: message => console.log(message)
        });
      } catch (e) {
        console.error(e.message);
        process.exit(1);
      }

      console.log(`Merge realizado y confirmado por lectura.`);
      console.log(`SHA: ${result.sha}`);
      if (result.branchDeleted) console.log(`Rama remota borrada: ${result.branch}`);
      // Cierra el lote en el registro de tiempos (D-49): bajo la rama del PR.
      recordStep('merge', STARTED, { branch: result.branch, pr: Number(pullRequestNumber) });

      break;
    }

    case 'view': {
      const res = await githubRequest('GET', `/repos/${owner}/${name}/pulls/${pullRequestNumber}`);
      if (res.status !== 200) {
        console.error('Error al leer el Pull Request:', JSON.stringify(res.body, null, 2));
        process.exit(1);
      }
      const pr = res.body;
      console.log(`#${pr.number} [${pr.state}${pr.merged ? ', mergeado' : ''}] ${pr.head.ref} -> ${pr.base.ref}`);
      console.log(`Titulo: ${pr.title}`);
      console.log(`URL: ${pr.html_url}`);
      console.log('--- Descripcion ---');
      console.log(pr.body || '(vacia)');
      break;
    }

    case 'close': {
      const numbers = String(pullRequestNumber).split(',').map(n => n.trim()).filter(Boolean);
      let failed = 0;
      for (const number of numbers) {
        const res = await githubRequest('PATCH', `/repos/${owner}/${name}/pulls/${number}`, { state: 'closed' });
        if (res.status === 200 && res.body.state === 'closed') {
          console.log(`Cerrado sin mergear: #${number} ${res.body.head.ref} (la rama queda en el remoto).`);
        } else {
          failed++;
          console.error(`No se pudo cerrar #${number}:`, JSON.stringify(res.body, null, 2));
        }
      }
      if (failed) process.exit(1);
      break;
    }

    case 'update': {
      const changes = {};
      if (title) changes.title = title;
      if (resolvedBody) changes.body = resolvedBody;
      if (baseGiven) changes.base = base;

      console.log(`Actualizando Pull Request #${pullRequestNumber} (${Object.keys(changes).join(', ')})...`);
      const res = await githubRequest('PATCH', `/repos/${owner}/${name}/pulls/${pullRequestNumber}`, changes);
      if (res.status !== 200) {
        console.error('Error al actualizar el Pull Request:', JSON.stringify(res.body, null, 2));
        process.exit(1);
      }
      console.log(`Actualizado: #${res.body.number} ${res.body.head.ref} -> ${res.body.base.ref}`);
      console.log(`URL: ${res.body.html_url}`);
      break;
    }

    case 'wip-check': {
      const limit = max === undefined ? DEFAULT_WIP_LIMIT : max;
      const res = await githubRequest('GET', `/repos/${owner}/${name}/pulls?state=open&per_page=100`);
      if (res.status !== 200 || !Array.isArray(res.body)) {
        console.error('Error al listar los Pull Requests abiertos:', JSON.stringify(res.body, null, 2));
        process.exit(1);
      }

      console.log(`Pull Requests abiertos en ${owner}/${name}: ${res.body.length} (limite ${limit}).`);
      res.body.forEach(pr => {
        const stacked = pr.base.ref !== 'main' ? ` [apilado sobre ${pr.base.ref}]` : '';
        console.log(`  #${pr.number} ${pr.head.ref} -> ${pr.base.ref}${stacked}: ${pr.title}`);
      });

      if (res.body.length > limit) {
        console.error(`Hay ${res.body.length} PRs sin mergear (mas de ${limit}): mergear o cerrar antes de arrancar un lote nuevo.`);
        process.exit(1);
      }
      console.log('OK: se puede arrancar un lote nuevo.');
      break;
    }

    case 'ci-variable': {
      const varPath = `/repos/${owner}/${name}/actions/variables/${variableName}`;
      const current = await githubRequest('GET', varPath);
      if (current.status !== 200 && current.status !== 404) {
        console.error(`Error al leer ${variableName} (HTTP ${current.status}): ${JSON.stringify(current.body)}`);
        process.exit(1);
      }
      const before = current.status === 200 ? current.body.value : null;

      if (deleteVariable) {
        if (before === null) {
          console.log(`${variableName} no existe en ${owner}/${name}: nada que borrar.`);
          break;
        }
        const res = await githubRequest('DELETE', varPath);
        if (res.status !== 204) {
          console.error(`Error al borrar ${variableName} (HTTP ${res.status}): ${JSON.stringify(res.body)}`);
          process.exit(1);
        }
      } else if (variableValue !== undefined) {
        const res = before === null
          ? await githubRequest('POST', `/repos/${owner}/${name}/actions/variables`, { name: variableName, value: variableValue })
          : await githubRequest('PATCH', varPath, { name: variableName, value: variableValue });
        if (res.status !== 201 && res.status !== 204) {
          console.error(`Error al fijar ${variableName} (HTTP ${res.status}): ${JSON.stringify(res.body)}`);
          process.exit(1);
        }
      } else {
        console.log(`${variableName} en ${owner}/${name}: ${before === null ? 'sin definir' : `"${before}"`}.`);
        break;
      }

      // Confirmación por lectura, como el merge.
      const after = await githubRequest('GET', varPath);
      const now = after.status === 200 ? after.body.value : null;
      const expected = deleteVariable ? null : variableValue;
      if (now !== expected) {
        console.error(`${variableName} quedó en ${now === null ? 'sin definir' : `"${now}"`}, no en lo pedido.`);
        process.exit(1);
      }
      console.log(`${variableName} en ${owner}/${name}: ${before === null ? 'sin definir' : `"${before}"`} -> ${now === null ? 'sin definir' : `"${now}"`} (confirmado por lectura).`);
      break;
    }

    default:
      console.error(`Acción no soportada: "${action}".`);
      process.exit(1);
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
