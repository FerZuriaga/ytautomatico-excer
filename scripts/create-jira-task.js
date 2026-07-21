/**
 * Agente autónomo: crea o actualiza un issue (Historia/Bug/Tarea) en Jira,
 * y opcionalmente aplica una transición de estado y/o agrega un comentario.
 *
 * Uso: node scripts/create-jira-task.js --data <archivo.json> [issueKey] [--transition "<Estado>"] [--comment "<texto>"]
 *   Sin issueKey  → crea un nuevo issue a partir del JSON
 *   Con issueKey  → actualiza el issue existente (ej: SCRUM-2)
 *
 * --data es opcional si se usa --transition y/o --comment junto a un issueKey:
 *   node scripts/create-jira-task.js SCRUM-2 --transition "En progreso"
 *   node scripts/create-jira-task.js SCRUM-2 --comment "Listo para QA"
 *   node scripts/create-jira-task.js SCRUM-2 --transition "Done" --comment "Cerrado"
 *
 * El JSON de --data acepta "testcaseModel" (un único Test Case) o
 * "testcaseModels" (array, para crear varios Test Cases del mismo issue en
 * un lote paralelo — ver createTestCasesBatch). Usar uno u otro, no ambos.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const https = require('https');
const fs = require('fs');
const path = require('path');

const zephyr = require('./lib/zephyr');

const HOSTNAME  = new URL(process.env.JIRA_URL).hostname;
const AUTH      = 'Basic ' + Buffer.from(process.env.JIRA_EMAIL + ':' + process.env.JIRA_API_TOKEN).toString('base64');
const PROJECT = process.env.JIRA_PROJECT_KEY;


function parseArgs(argv) {
  const args = { dataPath: null, issueKey: null, transitionName: null, commentText: null, verify: false, verifyTestcase: null, verifyCycle: null, verifyStatus: null, reportResultsPath: null, testCycleKeyArg: null };

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--data') {
      args.dataPath = argv[i + 1];
      i++;
    } else if (argv[i] === '--transition') {
      args.transitionName = argv[i + 1];
      i++;
    } else if (argv[i] === '--comment') {
      args.commentText = argv[i + 1];
      i++;
    } else if (argv[i] === '--verify') {
      args.verify = true;
    } else if (argv[i] === '--verify-testcase') {
      args.verifyTestcase = argv[i + 1];
      i++;
    } else if (argv[i] === '--verify-cycle') {
      args.verifyCycle = argv[i + 1];
      i++;
    } else if (argv[i] === '--verify-status') {
      args.verifyStatus = argv[i + 1];
      i++;
    } else if (argv[i] === '--report-results') {
      args.reportResultsPath = argv[i + 1];
      i++;
    } else if (argv[i] === '--test-cycle') {
      args.testCycleKeyArg = argv[i + 1];
      i++;
    } else if (!args.issueKey) {
      args.issueKey = argv[i];
    }
  }

  return args;
}

const { dataPath, issueKey, transitionName, commentText, verify, verifyTestcase, verifyCycle, verifyStatus, reportResultsPath, testCycleKeyArg } = parseArgs(process.argv.slice(2));
const ISSUE_KEY = issueKey;

if (!dataPath && !transitionName && !commentText && !verify && !verifyTestcase && !verifyCycle && !verifyStatus && !reportResultsPath) {
  console.error('Uso: node scripts/create-jira-task.js --data <archivo.json> [issueKey] [--transition "<Estado>"] [--comment "<texto>"]');
  console.error('     node scripts/create-jira-task.js <issueKey> --verify');
  console.error('     node scripts/create-jira-task.js --verify-testcase <TestCaseKey>');
  console.error('     node scripts/create-jira-task.js --verify-cycle <TestCycleKey>');
  console.error('     node scripts/create-jira-task.js --report-results <results.json> --test-cycle <TestCycleKey>');
  process.exit(1);
}

if (reportResultsPath && !testCycleKeyArg) {
  console.error('Se requiere --test-cycle <key> junto con --report-results.');
  process.exit(1);
}

if (!dataPath && (transitionName || commentText) && !ISSUE_KEY) {
  console.error('Se requiere un issueKey para usar --transition/--comment sin --data.');
  process.exit(1);
}

let ISSUE = null;

if (dataPath) {
  try {
    ISSUE = JSON.parse(fs.readFileSync(path.resolve(dataPath), 'utf8'));
  } catch (e) {
    console.error(`No se pudo leer o parsear "${dataPath}": ${e.message}`);
    process.exit(1);
  }
}




/**
 * El objeto ISSUE se obtiene dinámicamente desde un archivo JSON externo.
 *
 * El script no contiene información específica de tickets.
 * Toda la información del issue debe enviarse mediante --data.
 */

/**
 * Arquitectura oficial
 *
 * Este script constituye la implementación oficial para todas las operaciones
 * sobre Jira del proyecto.
 *
 * Debe reutilizarse para:
 * - crear issues
 * - actualizar issues
 * - transicionar estados
 * - agregar comentarios
 * - vincular issues
 *
 * No crear scripts paralelos para operaciones específicas.
 * Toda nueva capacidad deberá incorporarse extendiendo este archivo.
 */


function buildDescription(steps) {
  return {
    type: 'doc', version: 1,
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Pasos del caso de prueba' }]
      },
      {
        type: 'orderedList',
        content: steps.map(step => ({
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: step }] }]
        }))
      }
    ]
  };
}

// --- Helpers ADF genéricos (reutilizables para cualquier tipo de issue) ---
function h(level, text) {
  return { type: 'heading', attrs: { level }, content: [{ type: 'text', text }] };
}
function p(text) {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}
function olist(items) {
  return { type: 'orderedList', content: items.map(t => ({ type: 'listItem', content: [p(t)] })) };
}

/**
 * Construye la descripción ADF para un Bug siguiendo la plantilla oficial:
 * Resumen, Precondiciones, Pasos para reproducir, Resultado actual,
 * Resultado esperado, Severidad, Prioridad, Evidencia, Entorno, Observaciones.
 */
function buildBugDescription(bug) {
  const content = [
    h(2, 'Resumen del problema'), p(bug.resumen),
    h(2, 'Precondiciones'), p(bug.precondiciones),
    h(2, 'Pasos para reproducir'), olist(bug.pasos),
    h(2, 'Resultado actual'), p(bug.resultadoActual),
    h(2, 'Resultado esperado'), p(bug.resultadoEsperado),
    h(2, 'Severidad'), p(bug.severidad)
  ];
  if (bug.prioridad) content.push(h(2, 'Prioridad'), p(bug.prioridad));
  content.push(h(2, 'Evidencia'), p(bug.evidencia));
  if (bug.entorno) content.push(h(2, 'Entorno'), p(bug.entorno));
  if (bug.observaciones) content.push(h(2, 'Observaciones'), p(bug.observaciones));
  return { type: 'doc', version: 1, content };
}

/**
 * Construye la descripción ADF para una Historia siguiendo la plantilla oficial:
 * Como/Quiero/Para, Contexto, Objetivo, Criterios de aceptación.
 * Las Historias describen la necesidad funcional del usuario, no los pasos
 * del Test Case ni el resultado esperado (eso pertenece al escenario funcional).
 */
function buildHistoriaDescription(historia) {
  return {
    type: 'doc', version: 1,
    content: [
      p(`Como ${historia.como}`),
      p(`Quiero ${historia.quiero}`),
      p(`Para ${historia.para}`),
      h(2, 'Contexto'), p(historia.contexto),
      h(2, 'Objetivo'), p(historia.objetivo),
      h(2, 'Criterios de aceptación'),
      { type: 'bulletList', content: historia.criterios.map(t => ({ type: 'listItem', content: [p(t)] })) }
    ]
  };
}

/**
 * Construye la descripción ADF para una Tarea siguiendo la plantilla oficial:
 * Objetivo, Alcance, Entregables, Resultado esperado.
 */
function buildTareaDescription(tarea) {
  return {
    type: 'doc', version: 1,
    content: [
      h(2, 'Objetivo'), p(tarea.objetivo),
      h(2, 'Alcance'), p(tarea.alcance),
      h(2, 'Entregables'), p(tarea.entregables),
      h(2, 'Resultado esperado'), p(tarea.resultadoEsperado)
    ]
  };
}

/**
 * Resuelve el Test Cycle a usar: reutiliza testCycle.key si ya viene informado
 * (invocaciones posteriores del mismo ciclo), o crea uno nuevo la primera vez.
 */
async function resolveTestCycle(testCycle, projectKey) {
  if (testCycle.key) {
    console.log(`Reutilizando Test Cycle existente: ${testCycle.key}`);
    return testCycle.key;
  }

  const cycle = await zephyr.createTestCycle({
    projectKey,
    name: testCycle.name,
    description: testCycle.description,
    statusName: testCycle.statusName
  });

  console.log(`Test Cycle creado: ${cycle.key}`);
  return cycle.key;
}

/**
 * Resuelve la propiedad "folder" del Modelo Canónico (ruta funcional tipo
 * "/03 - Leave Management/Leave List") a un folderId real de Zephyr,
 * buscando o creando cada segmento de la ruta (ver
 * zephyr.resolveFolderPath). Si el Modelo Canónico no trae "folder", el
 * Test Case se crea sin carpeta (comportamiento previo, sin cambios).
 */
async function resolveTestCaseFolder(testcaseModel) {
  if (!testcaseModel.folder) return null;

  const folderId = await zephyr.resolveFolderPath(testcaseModel.projectKey, testcaseModel.folder);
  console.log(`Carpeta resuelta: "${testcaseModel.folder}" -> folderId ${folderId}.`);
  return folderId;
}

/**
 * Crea múltiples Test Cases en Zephyr en paralelo (Promise.all), todos
 * vinculados al mismo issue de Jira. Los recursos compartidos que no son
 * seguros de resolver en paralelo (folderId por ruta de carpeta, y el Test
 * Cycle si corresponde) se resuelven antes, de forma secuencial: crear una
 * carpeta o un Test Cycle es un patrón "buscar o crear", y dos llamadas
 * concurrentes que todavía no ven el recurso creado terminarían creando
 * cada una el suyo (carpeta/ciclo duplicado). Recién con esos ids ya
 * resueltos se dispara en paralelo la parte que sí es independiente por
 * Test Case: creación + steps + link + ejecución en el ciclo.
 */
async function createTestCasesBatch(models, testCycle, issueKey, issueId) {
  const folderCache = new Map();
  for (const model of models) {
    if (model.folder && !folderCache.has(model.folder)) {
      folderCache.set(model.folder, await resolveTestCaseFolder(model));
    }
  }

  let testCycleKey = null;
  if (testCycle) {
    testCycleKey = await resolveTestCycle(testCycle, models[0].projectKey);
  }

  const keys = await Promise.all(models.map(async (model) => {
    model.folderId = model.folder ? folderCache.get(model.folder) : null;

    const testCase = await zephyr.createTestCase(model);

    if (model.steps?.length) {
      await zephyr.createTestSteps(testCase.key, model.steps);
    }

    await zephyr.linkTestCaseToIssue(testCase.key, issueId);

    if (testCycleKey) {
      await zephyr.createTestExecution({
        projectKey: model.projectKey,
        testCaseKey: testCase.key,
        testCycleKey
      });
    }

    return testCase.key;
  }));

  console.log(`Test Cases creados en paralelo: ${keys.join(', ')}`);
  console.log(`Vinculados con ${issueKey} en Zephyr.`);
  if (testCycleKey) {
    console.log(`Ejecuciones creadas en ${testCycleKey} con estado "Not Executed".`);
  }

  return { keys, testCycleKey };
}

/**
 * Crea un link entre dos issues existentes (ej: Bug -> Historia relacionada).
 * linkTypeName por defecto 'Relates' (tipo de link estándar en Jira Cloud).
 */
async function linkIssue(fromKey, toKey, linkTypeName = 'Relates') {
  return jiraRequest('POST', '/rest/api/3/issueLink', {
    type: { name: linkTypeName },
    inwardIssue: { key: fromKey },
    outwardIssue: { key: toKey }
  });
}

/**
 * Aplica una transición de estado a un issue existente.
 * Busca por nombre (case-insensitive) entre las transiciones disponibles
 * en el workflow real del issue. Si no hay coincidencia, informa las
 * transiciones disponibles por stderr y termina sin forzar nada.
 */
async function transitionIssue(key, name) {
  const res = await jiraRequest('GET', `/rest/api/3/issue/${key}/transitions`);
  if (res.status !== 200) {
    console.error('Error al obtener las transiciones disponibles:', JSON.stringify(res.body, null, 2));
    process.exit(1);
  }

  const transitions = (res.body && res.body.transitions) || [];
  const match = transitions.find(t => t.name.toLowerCase() === name.toLowerCase());

  if (!match) {
    console.error(`No existe la transición "${name}" para ${key}.`);
    console.error('Transiciones disponibles:', transitions.map(t => t.name).join(', ') || '(ninguna)');
    process.exit(1);
  }

  const transRes = await jiraRequest('POST', `/rest/api/3/issue/${key}/transitions`, {
    transition: { id: match.id }
  });

  if (transRes.status === 204) {
    console.log(`Transición aplicada en ${key}: "${match.name}".`);
  } else {
    console.error('Error al aplicar la transición:', JSON.stringify(transRes.body, null, 2));
    process.exit(1);
  }
}

/**
 * Construye el body ADF para un comentario a partir de texto plano.
 * Si el texto tiene saltos de línea, cada línea se convierte en su propio párrafo.
 */
function buildCommentBody(text) {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  return { type: 'doc', version: 1, content: (lines.length ? lines : [text]).map(p) };
}

/**
 * Agrega un comentario a un issue existente.
 */
async function addComment(key, text) {
  const res = await jiraRequest('POST', `/rest/api/3/issue/${key}/comment`, {
    body: buildCommentBody(text)
  });

  if (res.status === 201) {
    console.log(`Comentario agregado en ${key}.`);
  } else {
    console.error('Error al agregar el comentario:', JSON.stringify(res.body, null, 2));
    process.exit(1);
  }
}

/**
 * Extrae el Test Case key de Zephyr (ej. SCRUM-T5) de un titulo de test
 * de Cypress. Convencion: el tag va entre corchetes en el titulo del
 * it(), ej: it('[SCRUM-T5] Buscar solicitudes...', ...).
 */
function extractTestCaseKey(title) {
  const match = title && title.match(/\[(SCRUM-T\d+)\]/);
  return match ? match[1] : null;
}

function mapMochaStateToZephyr(state) {
  if (state === 'passed') return 'Pass';
  if (state === 'failed') return 'Fail';
  if (state === 'pending') return 'Blocked';
  return null;
}

/**
 * El reporter "json" nativo de Mocha, tal como lo integra Cypress, no
 * incluye un campo "state" en tests[]; el estado real hay que derivarlo
 * de en cual de los arrays passes/failures/pending aparece cada test
 * (verificado corriendo un spec real, no asumido).
 */
function collectTestsWithState(results) {
  const withState = [];
  (results.passes || []).forEach(t => withState.push({ ...t, state: 'passed' }));
  (results.failures || []).forEach(t => withState.push({ ...t, state: 'failed' }));
  (results.pending || []).forEach(t => withState.push({ ...t, state: 'pending' }));
  return withState;
}

/**
 * Reporta a Zephyr los resultados reales de una corrida de Cypress
 * (JSON del reporter nativo de Mocha, generado con
 * `cypress run --reporter json > archivo.json`) contra un Test Cycle ya
 * existente. Por cada test taggeado con [SCRUM-TXX] en el titulo,
 * resuelve la Test Execution vigente en ese ciclo y actualiza su estado.
 * Si no encuentra una ejecucion para ese Test Case en ese ciclo, informa
 * y frena sin inventar nada (mismo criterio ya usado en el resto de la
 * integracion Zephyr).
 */
async function reportResults(resultsPath, testCycleKey, projectKey) {
  let results;
  try {
    results = JSON.parse(fs.readFileSync(path.resolve(resultsPath), 'utf8'));
  } catch (e) {
    console.error(`No se pudo leer o parsear "${resultsPath}": ${e.message}`);
    process.exit(1);
  }

  const taggedTests = collectTestsWithState(results)
    .map(t => ({ fullTitle: t.fullTitle, state: t.state, testCaseKey: extractTestCaseKey(t.fullTitle) }))
    .filter(t => t.testCaseKey);

  if (!taggedTests.length) {
    console.log('No se encontraron tests taggeados con [SCRUM-TXX] en el titulo.');
    return;
  }

  for (const test of taggedTests) {
    const statusName = mapMochaStateToZephyr(test.state);
    if (!statusName) {
      console.error(`Estado no reconocido ("${test.state}") para ${test.testCaseKey} ("${test.fullTitle}"). Se frena sin reportar.`);
      process.exit(1);
    }

    const execution = await zephyr.findTestExecution(projectKey, testCycleKey, test.testCaseKey);

    if (!execution) {
      console.error(`No existe una Test Execution para ${test.testCaseKey} en el ciclo ${testCycleKey}. Se frena sin inventar nada.`);
      process.exit(1);
    }

    await zephyr.updateTestExecutionStatus(execution.id, statusName);
    console.log(`${test.testCaseKey} -> ${statusName} (ejecucion ${execution.key || execution.id} en ${testCycleKey}).`);
  }
}

function jiraRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: HOSTNAME, path, method,
      headers: {
        'Authorization': AUTH,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
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

async function main() {
  // targetKey es el issue sobre el que finalmente se aplican --transition/--comment:
  // el ISSUE_KEY recibido, o el key recién creado si --data no traía issueKey.
  let targetKey = ISSUE_KEY;

  if (dataPath) {
    // El contenido del issue proviene exclusivamente del JSON externo cargado al inicio.
    const issuetype = ISSUE.issuetype || 'Historia';
    const summary = ISSUE.summary;

    const testcaseModel = ISSUE.testcaseModel || null;
    // testcaseModels (plural) permite crear varios Test Cases de un mismo
    // issue en un lote paralelo (ver createTestCasesBatch), en vez de
    // invocar este script una vez por Test Case.
    const testcaseModels = Array.isArray(ISSUE.testcaseModels) ? ISSUE.testcaseModels : null;
    const testCycle = ISSUE.testCycle || null;

    let description;
    if (issuetype === 'Bug') {
      description = buildBugDescription(ISSUE.bug);
    } else if (issuetype === 'Historia' && ISSUE.historia) {
      description = buildHistoriaDescription(ISSUE.historia);
    } else if (issuetype === 'Tarea') {
      description = buildTareaDescription(ISSUE.tarea);
    } else if (Array.isArray(ISSUE.steps)) {
      description = buildDescription(ISSUE.steps);
    } else {
      console.error(`No se pudo determinar la descripción para issuetype "${issuetype}".`);
      process.exit(1);
    }

    if (ISSUE_KEY) {
      console.log(`Actualizando ${ISSUE_KEY}...`);
      const res = await jiraRequest('PUT', `/rest/api/3/issue/${ISSUE_KEY}`, {
        fields: { summary, description }
      });
      if (res.status === 204) {
        console.log(`Actualizado: https://${HOSTNAME}/browse/${ISSUE_KEY}`);
      } else {
        console.error('Error al actualizar:', JSON.stringify(res.body, null, 2));
        process.exit(1);
      }

      if (testcaseModel) {
        console.log('Se detectó un Modelo Canónico de Test Case.');

        try {
          testcaseModel.folderId = await resolveTestCaseFolder(testcaseModel);

          const testCase = await zephyr.createTestCase(testcaseModel);

          console.log(`Test Case creado: ${testCase.key}`);

          if (testcaseModel.steps?.length) {
            await zephyr.createTestSteps(testCase.key, testcaseModel.steps);

            console.log('Steps creados correctamente.');
          }

          const issueRes = await jiraRequest('GET', `/rest/api/3/issue/${ISSUE_KEY}`);
          await zephyr.linkTestCaseToIssue(testCase.key, issueRes.body.id);

          console.log(`Vinculado con ${ISSUE_KEY} en Zephyr.`);

          if (testCycle) {
            const testCycleKey = await resolveTestCycle(testCycle, testcaseModel.projectKey);

            await zephyr.createTestExecution({
              projectKey: testcaseModel.projectKey,
              testCaseKey: testCase.key,
              testCycleKey
            });

            console.log(`Ejecución creada en ${testCycleKey} con estado "Not Executed".`);
          }
        } catch (err) {
          console.error('Error creando Test Case en Zephyr');
          console.error(err.message);

          process.exit(1);
        }
      } else if (testcaseModels) {
        console.log(`Se detectaron ${testcaseModels.length} Modelos Canónicos de Test Case (lote paralelo).`);

        try {
          const issueRes = await jiraRequest('GET', `/rest/api/3/issue/${ISSUE_KEY}`);
          await createTestCasesBatch(testcaseModels, testCycle, ISSUE_KEY, issueRes.body.id);
        } catch (err) {
          console.error('Error creando Test Cases en Zephyr (lote paralelo)');
          console.error(err.message);

          process.exit(1);
        }
      }
    } else {
      console.log(`Creando nuevo issue (${issuetype})...`);
      const res = await jiraRequest('POST', '/rest/api/3/issue', {
        fields: {
          project: { key: PROJECT },
          summary,
          issuetype: { name: issuetype },
          description
        }
      });
      if (res.status === 201) {
        const key = res.body.key;
        console.log(`Creado: ${key}`);
        console.log(`URL: https://${HOSTNAME}/browse/${key}`);
        targetKey = key;
        // ------------------------------------------------------------
        // Creación automática del Test Case en Zephyr
        // ------------------------------------------------------------

        if (testcaseModel) {
          console.log('Se detectó un Modelo Canónico de Test Case.');

          try {
            testcaseModel.folderId = await resolveTestCaseFolder(testcaseModel);

            const testCase = await zephyr.createTestCase(testcaseModel);

            console.log(`Test Case creado: ${testCase.key}`);

            if (testcaseModel.steps?.length) {
              await zephyr.createTestSteps(
                testCase.key,
                ISSUE.testcaseModel.steps
              );

              console.log('Steps creados correctamente.');
            }

            await zephyr.linkTestCaseToIssue(testCase.key, res.body.id);

            console.log(`Vinculado con ${key} en Zephyr.`);

            if (testCycle) {
              const testCycleKey = await resolveTestCycle(testCycle, testcaseModel.projectKey);

              await zephyr.createTestExecution({
                projectKey: testcaseModel.projectKey,
                testCaseKey: testCase.key,
                testCycleKey
              });

              console.log(`Ejecución creada en ${testCycleKey} con estado "Not Executed".`);
            }

          } catch (err) {
            console.error('Error creando Test Case en Zephyr');
            console.error(err.message);

            process.exit(1);
          }
        } else if (testcaseModels) {
          console.log(`Se detectaron ${testcaseModels.length} Modelos Canónicos de Test Case (lote paralelo).`);

          try {
            await createTestCasesBatch(testcaseModels, testCycle, key, res.body.id);
          } catch (err) {
            console.error('Error creando Test Cases en Zephyr (lote paralelo)');
            console.error(err.message);

            process.exit(1);
          }
        }

        if (ISSUE && ISSUE.linkTo && ISSUE.linkTo.key) {
          console.log(`Vinculando ${key} con ${ISSUE.linkTo.key} (${ISSUE.linkTo.type || 'Relates'})...`);
          const linkRes = await linkIssue(key, ISSUE.linkTo.key, ISSUE.linkTo.type);
          if (linkRes.status === 201) {
            console.log(`Vinculado correctamente con ${ISSUE.linkTo.key}.`);
          } else {
            console.error('Error al vincular issue:', JSON.stringify(linkRes.body, null, 2));
          }
        }
      } else {
        console.error('Error al crear:', JSON.stringify(res.body, null, 2));
        process.exit(1);
      }
    }
  }

  if (transitionName) {
    console.log(`Aplicando transición "${transitionName}" en ${targetKey}...`);
    await transitionIssue(targetKey, transitionName);
  }

  if (commentText) {
    console.log(`Agregando comentario en ${targetKey}...`);
    await addComment(targetKey, commentText);
  }

  // ------------------------------------------------------------
  // Verificación por lectura directa (read-only, no muta nada).
  // Reutiliza jiraRequest/zephyr ya existentes en esta implementación.
  // ------------------------------------------------------------
  if (verify) {
    if (!targetKey) {
      console.error('Se requiere un issueKey para --verify.');
      process.exit(1);
    }
    const res = await jiraRequest('GET', `/rest/api/3/issue/${targetKey}`);
    if (res.status !== 200) {
      console.error('Error al leer el issue:', JSON.stringify(res.body, null, 2));
      process.exit(1);
    }
    console.log(JSON.stringify({
      id: res.body.id,
      key: res.body.key,
      status: res.body.fields.status && res.body.fields.status.name,
      summary: res.body.fields.summary,
      description: res.body.fields.description
    }, null, 2));
  }

  if (verifyTestcase) {
    const [testCase, links, steps] = await Promise.all([
      zephyr.getTestCase(verifyTestcase),
      zephyr.getTestCaseLinks(verifyTestcase),
      zephyr.getTestCaseSteps(verifyTestcase)
    ]);
    console.log(JSON.stringify({ testCase: { key: testCase.key, name: testCase.name, objective: testCase.objective, precondition: testCase.precondition }, links, steps }, null, 2));
  }

  if (verifyCycle) {
    const cycle = await zephyr.getTestCycle(verifyCycle);
    const executions = await zephyr.getTestExecutions(PROJECT, verifyCycle);
    console.log(JSON.stringify({ cycle: { key: cycle.key, name: cycle.name }, executions }, null, 2));
  }

  if (verifyStatus) {
    const status = await zephyr.getStatus(verifyStatus);
    console.log(JSON.stringify({ id: status.id, name: status.name, type: status.type }, null, 2));
  }

  if (reportResultsPath) {
    await reportResults(reportResultsPath, testCycleKeyArg, PROJECT);
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
