/**
 * CLI / fachada de compatibilidad: crea o actualiza un issue
 * (Historia/Bug/Tarea) en Jira, publica Test Cases en Xray, y reporta
 * resultados de ejecución — orquestando los Adapters de lib/jira.js,
 * lib/xray.js y lib/test-runner.js.
 *
 * Mismo uso de siempre (ver docs/architecture/architecture-v2-phase2-
 * component-design.md, sección 8, punto 8 — se preserva la compatibilidad
 * de esta CLI a propósito):
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
 * un lote paralelo — ver xray.publishTestCasesBatch). Usar uno u otro,
 * no ambos.
 *
 * Este archivo NO conoce endpoints, payloads ni formato ADF — todo eso
 * vive en lib/jira.js, lib/xray.js y lib/test-runner.js. Su única
 * responsabilidad es parsear la línea de comandos y componer, en el orden
 * correcto, las llamadas a esos tres Adapters.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');

const jira = require('./lib/jira');
const xray = require('./lib/xray');
const testRunner = require('./lib/test-runner');

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
 * Reporta a Xray los resultados reales de una corrida de Cypress contra
 * un Test Cycle ya existente. Por cada test taggeado con [key] en
 * el título, resuelve la Test Execution vigente en ese ciclo y actualiza
 * su estado. Si no encuentra una ejecución para ese Test Case en ese
 * ciclo, informa y frena sin inventar nada.
 */
async function reportResults(resultsPath, testCycleKey, projectKey) {
  const results = testRunner.parseResultsFile(resultsPath);
  const taggedTests = testRunner.collectTaggedTests(results);

  if (!taggedTests.length) {
    console.log('No se encontraron tests taggeados con un Test Case key en el titulo.');
    return;
  }

  for (const test of taggedTests) {
    const statusName = testRunner.mapMochaStateToXray(test.state);
    if (!statusName) {
      console.error(`Estado no reconocido ("${test.state}") para ${test.testCaseKey} ("${test.fullTitle}"). Se frena sin reportar.`);
      process.exit(1);
    }

    const execution = await xray.findTestExecution(projectKey, testCycleKey, test.testCaseKey);

    if (!execution) {
      console.error(`No existe una Test Execution para ${test.testCaseKey} en el ciclo ${testCycleKey}. Se frena sin inventar nada.`);
      process.exit(1);
    }

    await xray.updateTestExecutionStatus(execution.id, statusName);
    console.log(`${test.testCaseKey} -> ${statusName} (ejecucion ${execution.key || execution.id} en ${testCycleKey}).`);
  }
}

async function main() {
  // targetKey es el issue sobre el que finalmente se aplican --transition/--comment:
  // el ISSUE_KEY recibido, o el key recién creado si --data no traía issueKey.
  let targetKey = ISSUE_KEY;

  if (dataPath) {
    const issuetype = ISSUE.issuetype || 'Historia';
    const summary = ISSUE.summary;

    const testcaseModel = ISSUE.testcaseModel || null;
    // testcaseModels (plural) permite crear varios Test Cases de un mismo
    // issue en un lote paralelo (ver xray.publishTestCasesBatch), en vez
    // de invocar este script una vez por Test Case.
    const testcaseModels = Array.isArray(ISSUE.testcaseModels) ? ISSUE.testcaseModels : null;
    const testCycle = ISSUE.testCycle || null;

    let description;
    if (issuetype === 'Bug') {
      description = jira.buildBugDescription(ISSUE.bug);
    } else if (issuetype === 'Historia' && ISSUE.historia) {
      description = jira.buildHistoriaDescription(ISSUE.historia);
    } else if (issuetype === 'Tarea') {
      description = jira.buildTareaDescription(ISSUE.tarea);
    } else if (Array.isArray(ISSUE.steps)) {
      description = jira.buildDescription(ISSUE.steps);
    } else {
      console.error(`No se pudo determinar la descripción para issuetype "${issuetype}".`);
      process.exit(1);
    }

    if (ISSUE_KEY) {
      console.log(`Actualizando ${ISSUE_KEY}...`);
      const res = await jira.updateIssue(ISSUE_KEY, { summary, description });
      if (res.status === 204) {
        console.log(`Actualizado: https://${jira.HOSTNAME}/browse/${ISSUE_KEY}`);
      } else {
        console.error('Error al actualizar:', JSON.stringify(res.body, null, 2));
        process.exit(1);
      }

      if (testcaseModel) {
        console.log('Se detectó un Modelo Canónico de Test Case.');

        try {
          const issueRes = await jira.getIssue(ISSUE_KEY);
          await xray.publishTestCase(testcaseModel, {
            issueKey: ISSUE_KEY,
            issueId: issueRes.body.id,
            testCycle
          });
        } catch (err) {
          console.error('Error creando Test Case en Xray');
          console.error(err.message);
          process.exit(1);
        }
      } else if (testcaseModels) {
        console.log(`Se detectaron ${testcaseModels.length} Modelos Canónicos de Test Case (lote paralelo).`);

        try {
          const issueRes = await jira.getIssue(ISSUE_KEY);
          await xray.publishTestCasesBatch(testcaseModels, testCycle, ISSUE_KEY, issueRes.body.id);
        } catch (err) {
          console.error('Error creando Test Cases en Xray (lote paralelo)');
          console.error(err.message);
          process.exit(1);
        }
      }
    } else {
      console.log(`Creando nuevo issue (${issuetype})...`);
      const res = await jira.createIssue({ projectKey: PROJECT, summary, issuetype, description });
      if (res.status === 201) {
        const key = res.body.key;
        console.log(`Creado: ${key}`);
        console.log(`URL: https://${jira.HOSTNAME}/browse/${key}`);
        targetKey = key;

        if (testcaseModel) {
          console.log('Se detectó un Modelo Canónico de Test Case.');

          try {
            await xray.publishTestCase(testcaseModel, {
              issueKey: key,
              issueId: res.body.id,
              testCycle
            });
          } catch (err) {
            console.error('Error creando Test Case en Xray');
            console.error(err.message);
            process.exit(1);
          }
        } else if (testcaseModels) {
          console.log(`Se detectaron ${testcaseModels.length} Modelos Canónicos de Test Case (lote paralelo).`);

          try {
            await xray.publishTestCasesBatch(testcaseModels, testCycle, key, res.body.id);
          } catch (err) {
            console.error('Error creando Test Cases en Xray (lote paralelo)');
            console.error(err.message);
            process.exit(1);
          }
        }

        if (ISSUE && ISSUE.linkTo && ISSUE.linkTo.key) {
          console.log(`Vinculando ${key} con ${ISSUE.linkTo.key} (${ISSUE.linkTo.type || 'Relates'})...`);
          const linkRes = await jira.linkIssue(key, ISSUE.linkTo.key, ISSUE.linkTo.type);
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
    await jira.transitionIssue(targetKey, transitionName);
  }

  if (commentText) {
    console.log(`Agregando comentario en ${targetKey}...`);
    await jira.addComment(targetKey, commentText);
  }

  // ------------------------------------------------------------
  // Verificación por lectura directa (read-only, no muta nada).
  // ------------------------------------------------------------
  if (verify) {
    if (!targetKey) {
      console.error('Se requiere un issueKey para --verify.');
      process.exit(1);
    }
    const res = await jira.getIssue(targetKey);
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
      xray.getTestCase(verifyTestcase),
      xray.getTestCaseLinks(verifyTestcase),
      xray.getTestCaseSteps(verifyTestcase)
    ]);
    console.log(JSON.stringify({ testCase: { key: testCase.key, name: testCase.name, objective: testCase.objective, precondition: testCase.precondition }, links, steps }, null, 2));
  }

  if (verifyCycle) {
    const cycle = await xray.getTestCycle(verifyCycle);
    const executions = await xray.getTestExecutions(PROJECT, verifyCycle);
    console.log(JSON.stringify({ cycle: { key: cycle.key, name: cycle.name }, executions }, null, 2));
  }

  if (verifyStatus) {
    // Xray no identifica status de Test Run por id numérico como Zephyr
    // (ver lib/xray.js, getStatus) — no hay "id"/"type" que imprimir acá,
    // solo name/description/color.
    const status = await xray.getStatus(verifyStatus);
    console.log(JSON.stringify({ name: status.name, description: status.description, color: status.color }, null, 2));
  }

  if (reportResultsPath) {
    await reportResults(reportResultsPath, testCycleKeyArg, PROJECT);
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
