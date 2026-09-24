/**
 * Xray Adapter — reemplaza a lib/zephyr.js cumpliendo el mismo contrato
 * documentado en docs/architecture/domain-model.md ("Cómo agregar o
 * reemplazar una herramienta"). Firmas verificadas por introspección real
 * del schema GraphQL de Xray Cloud (no adivinadas de la documentación
 * pública, que está fragmentada) — ver detalle de mapeo abajo.
 *
 * Diferencias estructurales reales con Zephyr (no solo de nombres):
 *
 * - Zephyr Test Cycle  -> Xray Test Execution (issue contenedor).
 *   Zephyr Test Execution (registro por Test Case dentro de un ciclo)
 *   -> Xray Test Run (registro por Test dentro de un Test Execution;
 *   su id se resuelve con getTestRun(testIssueId, testExecIssueId), no
 *   es el mismo id que el issue).
 * - Zephyr Folder (búsqueda/creación encadenada por parentId numérico)
 *   -> Xray Folder (se direcciona por ruta completa como string, no por
 *   id). La documentación pública sugiere que createTest autocrea la
 *   carpeta al recibir folderPath — falso, verificado contra la API
 *   real: si la carpeta no existe, el Test se crea igual sin error pero
 *   la carpeta nunca aparece. Por eso resolveFolderPath sigue haciendo
 *   el mismo patrón "buscar o crear" que en Zephyr (findFolder/
 *   createFolder), solo que en un único paso por ruta completa en vez
 *   de por segmentos encadenados.
 * - Zephyr vincula Test Case <-> Historia con su propio endpoint de
 *   link. Xray no tiene mutación propia de linking — un Test de Xray ES
 *   un issue de Jira, así que se vincula con el issueLink nativo de
 *   Jira (tipo "Test", ya presente en este proyecto: outward "tests").
 * - Zephyr identifica status por id numérico. Xray identifica status de
 *   Test Run por nombre ("TO DO", "EXECUTING", "PASSED", "FAILED" —
 *   confirmado con getStatuses()). getStatus(statusId) acá recibe un
 *   nombre, no un id — único punto donde el parámetro cambia de
 *   semántica respecto al contrato original.
 * - precondition (texto libre del Modelo Canónico) no tiene campo
 *   propio en el Test de Xray (ahí una Precondition es su propio tipo
 *   de issue, fuera de alcance de este swap) — se anexa al description
 *   del Test. statusName al crear un Test Case tampoco se setea (el
 *   workflow de Jira define el estado inicial); se ignora si viene.
 */
require('dotenv').config();

const https = require('https');
const jira = require('./jira');
const traceability = require('./traceability');

const HOST = 'xray.cloud.getxray.app';

function xrayAuth() {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            client_id: process.env.XRAY_CLIENT_ID,
            client_secret: process.env.XRAY_CLIENT_SECRET
        });

        const req = https.request({
            hostname: HOST,
            path: '/api/v2/authenticate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    reject(new Error(`Xray authenticate falló (${res.statusCode}): ${data}`));
                    return;
                }
                resolve(JSON.parse(data));
            });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

let tokenPromise = null;
function getToken() {
    if (!tokenPromise) tokenPromise = xrayAuth();
    return tokenPromise;
}

async function xrayRequest(query, variables = null) {
    const token = await getToken();

    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(variables ? { query, variables } : { query });

        const req = https.request({
            hostname: HOST,
            path: '/api/v2/graphql',
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

function assertNoErrors(res) {
    if (res.status !== 200 || res.body?.errors) {
        throw new Error(JSON.stringify(res.body?.errors || res.body, null, 2));
    }
}

/**
 * Resuelve el issueId numérico de Jira para cualquier key (Test, Test
 * Execution, Historia). Se reutiliza el cliente de lib/jira.js en vez de
 * duplicar autenticación contra Jira acá adentro.
 */
async function issueIdOf(key) {
    const res = await jira.getIssue(key);
    if (res.status !== 200) {
        throw new Error(JSON.stringify(res.body, null, 2));
    }
    return res.body.id;
}

const projectIdCache = new Map();

/**
 * Resuelve el projectId numérico de Jira a partir de la key del proyecto.
 * Solo lo necesitan las mutaciones de folder de Xray (createFolder /
 * addTestsToFolder piden projectId, no projectKey).
 */
async function projectIdOf(projectKey) {
    if (projectIdCache.has(projectKey)) return projectIdCache.get(projectKey);

    const res = await jira.jiraRequest('GET', `/rest/api/3/project/${projectKey}`);
    if (res.status !== 200) {
        throw new Error(JSON.stringify(res.body, null, 2));
    }

    projectIdCache.set(projectKey, res.body.id);
    return res.body.id;
}

/**
 * El Modelo Canónico de Test Case usa el vocabulario de prioridad de
 * Zephyr (Highest/High/Normal/Low/Lowest, "Normal" como default). Un Test
 * de Xray es un issue real de Jira, así que su prioridad tiene que
 * coincidir con el esquema de prioridades configurado en la instancia
 * (Highest/High/Medium/Low/Lowest, sin "Normal") — se traduce acá, único
 * punto que conoce ambos vocabularios.
 */
function toJiraPriority(priorityName) {
    return priorityName === 'Normal' ? 'Medium' : priorityName;
}

/**
 * Crea un Test Case (Test de Xray) vacío, sin steps.
 * Devuelve:
 * {
 *   id,
 *   key,
 *   self
 * }
 */
async function createTestCase(testcase) {
    let description = testcase.objective || '';
    if (testcase.precondition) {
        description += `\n\nPrecondición: ${testcase.precondition}`;
    }

    const jiraFields = {
        summary: testcase.name,
        project: { key: testcase.projectKey },
        description,
        // Labels de trazabilidad: criterio (CA-XX) y tipo (positivo/negativo)
        // del Modelo Canónico, para que no se pierdan al publicar.
        labels: traceability.buildTraceabilityLabels(testcase)
    };
    if (testcase.priorityName) {
        jiraFields.priority = { name: toJiraPriority(testcase.priorityName) };
    }

    const query = `
        mutation($jira: JSON!, $folderPath: String) {
            createTest(testType: { name: "Manual" }, jira: $jira, folderPath: $folderPath) {
                test { issueId jira(fields: ["key"]) }
                warnings
            }
        }
    `;

    const res = await xrayRequest(query, {
        jira: { fields: jiraFields },
        folderPath: testcase.folderId || null
    });
    assertNoErrors(res);

    const test = res.body.data.createTest.test;
    return { id: test.issueId, key: test.jira.key, self: null };
}

/**
 * Crea los steps de un Test Case ya existente. Cada step se agrega con
 * su propia mutación, en secuencia (no en paralelo, para no depender del
 * orden de llegada).
 */
async function createTestSteps(testCaseKey, steps) {
    const issueId = await issueIdOf(testCaseKey);

    const query = `
        mutation($issueId: String!, $step: CreateStepInput!) {
            addTestStep(issueId: $issueId, step: $step) { id }
        }
    `;

    for (const step of steps) {
        const res = await xrayRequest(query, {
            issueId,
            step: {
                action: step.description,
                data: step.testData || '',
                result: step.expectedResult
            }
        });
        assertNoErrors(res);
    }

    return { count: steps.length };
}

/**
 * Borra TODOS los steps existentes de un Test Case. Firma verificada por
 * introspección real del schema (removeAllTestSteps(issueId, versionId)),
 * no adivinada — Xray SÍ tiene un modo overwrite, a diferencia de lo que
 * decía este comentario antes.
 */
async function removeAllTestSteps(testCaseKey) {
    const issueId = await issueIdOf(testCaseKey);

    const query = `
        mutation($issueId: String!) {
            removeAllTestSteps(issueId: $issueId)
        }
    `;
    const res = await xrayRequest(query, { issueId });
    assertNoErrors(res);
    return res.body.data.removeAllTestSteps;
}

/**
 * Reemplaza por completo los steps de un Test Case ya existente (borra
 * los actuales y crea los nuevos), para corregir Test Cases ya
 * publicados sin tener que borrar y recrear el issue.
 */
async function replaceTestSteps(testCaseKey, steps) {
    await removeAllTestSteps(testCaseKey);
    return createTestSteps(testCaseKey, steps);
}

/**
 * Vincula un Test Case existente con un issue de Jira (Historia, Bug, etc.)
 * mediante el issueLink nativo de Jira — Xray no expone mutación propia de
 * linking porque un Test ya ES un issue de Jira. Tipo de link "Test"
 * (outward "tests"), ya presente en el proyecto. issueId es el ID
 * numérico del issue de Jira (no el key), igual que en el contrato
 * original de Zephyr.
 */
async function linkTestCaseToIssue(testCaseKey, issueId) {
    const res = await jira.jiraRequest('POST', '/rest/api/3/issueLink', {
        type: { name: 'Test' },
        inwardIssue: { id: String(issueId) },
        outwardIssue: { key: testCaseKey }
    });

    if (res.status !== 201) {
        throw new Error(JSON.stringify(res.body, null, 2));
    }

    return res.body;
}

/**
 * Crea un Test Cycle. Mapeado a un Test Execution de Xray: el issue
 * contenedor donde después se agregan Tests individuales (cada uno se
 * convierte en un Test Run dentro de este issue).
 * Devuelve:
 * {
 *   id,
 *   key,
 *   self
 * }
 */
async function createTestCycle(cycle) {
    const query = `
        mutation($jira: JSON!) {
            createTestExecution(jira: $jira) {
                testExecution { issueId jira(fields: ["key"]) }
                warnings
            }
        }
    `;

    const res = await xrayRequest(query, {
        jira: {
            fields: {
                summary: cycle.name,
                project: { key: cycle.projectKey },
                description: cycle.description
            }
        }
    });
    assertNoErrors(res);

    const testExecution = res.body.data.createTestExecution.testExecution;
    return { id: testExecution.issueId, key: testExecution.jira.key, self: null };
}

/**
 * Agrega un Test Case al Test Execution (Test Cycle) indicado, creando su
 * Test Run con estado inicial "TO DO" (equivalente al "Not Executed" de
 * Zephyr). Si execution.statusName trae un estado distinto del default,
 * se resuelve el Test Run recién creado y se actualiza.
 * Devuelve:
 * {
 *   id,
 *   self
 * }
 */
async function createTestExecution(execution) {
    const testIssueId = await issueIdOf(execution.testCaseKey);
    const testExecIssueId = await issueIdOf(execution.testCycleKey);

    const addQuery = `
        mutation($issueId: String!, $testIssueIds: [String]) {
            addTestsToTestExecution(issueId: $issueId, testIssueIds: $testIssueIds) { warning }
        }
    `;
    const addRes = await xrayRequest(addQuery, { issueId: testExecIssueId, testIssueIds: [testIssueId] });
    assertNoErrors(addRes);

    let runId = null;
    if (execution.statusName && execution.statusName !== 'TO DO') {
        const run = await findTestExecution(execution.projectKey, execution.testCycleKey, execution.testCaseKey);
        if (run) {
            await updateTestExecutionStatus(run.id, execution.statusName);
            runId = run.id;
        }
    }

    return { id: runId, self: null };
}

/**
 * Lecturas de verificación (read-only). No crean ni modifican nada en
 * Xray; se utilizan para confirmar por lectura directa el resultado de
 * las operaciones de creación ya realizadas mediante la implementación
 * oficial.
 */
/**
 * Devuelve una forma aplanada (key, name, objective, precondition, steps)
 * en vez del JSON crudo de Xray (que anida todo lo de Jira bajo "jira"),
 * para que el resto del framework siga leyendo los mismos campos que
 * leía de Zephyr sin tener que saber que cambió de herramienta. Xray no
 * tiene un campo propio de precondición en el Test (ver comentario de
 * cabecera) — createTestCase la concatena al description con el
 * separador "\n\nPrecondición: "; acá se vuelve a separar para que el
 * round-trip de verificación no pierda esa información.
 */
async function getTestCase(testCaseKey) {
    const query = `
        query($jql: String!) {
            getTests(jql: $jql, limit: 1) {
                results {
                    issueId
                    testType { name }
                    jira(fields: ["key", "summary", "description"])
                    steps { action data result }
                }
            }
        }
    `;
    const res = await xrayRequest(query, { jql: `key = "${testCaseKey}"` });
    assertNoErrors(res);

    const result = res.body.data.getTests.results[0];
    if (!result) throw new Error(`Test Case ${testCaseKey} no encontrado en Xray.`);

    const description = result.jira.description || '';
    const marker = '\n\nPrecondición: ';
    const markerIndex = description.indexOf(marker);
    const objective = markerIndex === -1 ? description : description.slice(0, markerIndex);
    const precondition = markerIndex === -1 ? null : description.slice(markerIndex + marker.length);

    return {
        issueId: result.issueId,
        key: result.jira.key,
        name: result.jira.summary,
        objective,
        precondition,
        testType: result.testType,
        steps: result.steps
    };
}

async function getTestCaseLinks(testCaseKey) {
    const res = await jira.getIssue(testCaseKey);
    if (res.status !== 200) {
        throw new Error(JSON.stringify(res.body, null, 2));
    }
    return res.body.fields.issuelinks;
}

async function getTestCaseSteps(testCaseKey) {
    const testCase = await getTestCase(testCaseKey);
    return testCase.steps;
}

/**
 * Forma aplanada (key, name), mismo motivo que getTestCase.
 */
async function getTestCycle(testCycleKey) {
    const issueId = await issueIdOf(testCycleKey);

    const query = `
        query($issueId: String) {
            getTestExecution(issueId: $issueId) {
                issueId
                jira(fields: ["key", "summary"])
            }
        }
    `;
    const res = await xrayRequest(query, { issueId });
    assertNoErrors(res);

    const testExecution = res.body.data.getTestExecution;
    if (!testExecution) throw new Error(`Test Cycle ${testCycleKey} no encontrado en Xray.`);

    return {
        issueId: testExecution.issueId,
        key: testExecution.jira.key,
        name: testExecution.jira.summary
    };
}

/**
 * Devuelve la metadata de un status de Test Run por nombre. Xray no
 * identifica sus status de Test Run por id numérico como Zephyr — acá
 * statusId es en realidad el nombre exacto ("TO DO", "EXECUTING",
 * "PASSED", "FAILED"), único punto donde cambia la semántica del
 * parámetro respecto al contrato original de Zephyr.
 */
async function getStatus(statusId) {
    const res = await xrayRequest('{ getStatuses { name description color } }');
    assertNoErrors(res);

    const status = res.body.data.getStatuses.find(s => s.name === statusId);
    if (!status) throw new Error(`Status "${statusId}" no encontrado en Xray.`);
    return status;
}

async function getTestExecutions(projectKey, testCycleKey) {
    const testExecIssueId = await issueIdOf(testCycleKey);

    const query = `
        query($testExecIssueIds: [String]) {
            getTestRuns(testExecIssueIds: $testExecIssueIds, limit: 100) {
                total
                results {
                    id
                    status { name }
                    test { issueId jira(fields: ["key"]) }
                }
            }
        }
    `;
    const res = await xrayRequest(query, { testExecIssueIds: [testExecIssueId] });
    assertNoErrors(res);

    return res.body.data.getTestRuns.results;
}

/**
 * Busca el Test Run vigente de un Test Case dentro de un Test Cycle
 * puntual. Se usa para resolver dinámicamente, en tiempo de reporte, la
 * ejecución real sobre la que hay que escribir el resultado (nunca se
 * hardcodea un id de ejecución en el código). Devuelve null si no existe
 * (no inventa nada).
 */
async function findTestExecution(projectKey, testCycleKey, testCaseKey) {
    const testIssueId = await issueIdOf(testCaseKey);
    const testExecIssueId = await issueIdOf(testCycleKey);

    const query = `
        query($testIssueId: String, $testExecIssueId: String) {
            getTestRun(testIssueId: $testIssueId, testExecIssueId: $testExecIssueId) {
                id
                status { name }
            }
        }
    `;
    const res = await xrayRequest(query, { testIssueId, testExecIssueId });
    assertNoErrors(res);

    const run = res.body.data.getTestRun;
    return run ? { id: run.id, key: null } : null;
}

/**
 * Actualiza el estado de un Test Run existente. El nombre debe coincidir
 * exactamente con el de getStatuses() ("TO DO", "EXECUTING", "PASSED",
 * "FAILED").
 */
async function updateTestExecutionStatus(executionIdOrKey, statusName) {
    const query = `
        mutation($id: String!, $status: String!) {
            updateTestRunStatus(id: $id, status: $status)
        }
    `;
    const res = await xrayRequest(query, { id: executionIdOrKey, status: statusName });
    assertNoErrors(res);
    return res.body.data;
}

/**
 * Busca un folder existente por ruta completa. Xray direcciona folders
 * por path (no por id encadenado como Zephyr) — folderType/parentId del
 * contrato original de Zephyr no tienen equivalente acá y se descartan;
 * "name" se usa directamente como la ruta completa.
 */
async function findFolder(projectKey, folderType, name) {
    const projectId = await projectIdOf(projectKey);

    const query = `
        query($projectId: String, $path: String!) {
            getFolder(projectId: $projectId, path: $path) { name path }
        }
    `;
    const res = await xrayRequest(query, { projectId, path: name });
    if (res.status !== 200 || res.body?.errors) return null;
    return res.body.data.getFolder;
}

/**
 * Crea un folder por ruta completa (crea también los segmentos
 * intermedios que no existan). parentId del contrato original de Zephyr
 * no tiene equivalente acá.
 */
async function createFolder(projectKey, folderType, name) {
    const projectId = await projectIdOf(projectKey);

    const query = `
        mutation($projectId: String, $path: String!) {
            createFolder(projectId: $projectId, path: $path) { folder { name path } }
        }
    `;
    const res = await xrayRequest(query, { projectId, path: name });
    assertNoErrors(res);
    return res.body.data.createFolder.folder;
}

/**
 * En Zephyr esto resolvía cada segmento de la ruta a un folderId
 * encadenado por parentId. En Xray los folders se direccionan por ruta
 * completa — pero, a diferencia de lo que sugiere la documentación
 * pública, createTest NO autocrea la carpeta si no existe (falla
 * silenciosamente: el Test se crea igual, sin error, pero la carpeta
 * nunca aparece — verificado contra la API real). Por eso acá sigue
 * haciendo falta el mismo patrón "buscar o crear" que en Zephyr, solo
 * que en un único paso (sin encadenar segmentos por parentId).
 */
async function resolveFolderPath(projectKey, folderPath) {
    const existing = await findFolder(projectKey, null, folderPath);
    if (existing) return existing.path;

    const created = await createFolder(projectKey, null, folderPath);
    return created.path;
}

/**
 * Resuelve la propiedad "folder" del Modelo Canónico a la ruta que
 * createTest espera en folderPath (autocreación incluida, ver
 * resolveFolderPath). Si el Modelo Canónico no trae "folder", el Test
 * Case se crea sin carpeta.
 */
async function resolveTestCaseFolder(testcaseModel) {
    if (!testcaseModel.folder) return null;
    return resolveFolderPath(testcaseModel.projectKey, testcaseModel.folder);
}

/**
 * Resuelve el Test Cycle a usar: reutiliza testCycle.key si ya viene
 * informado (invocaciones posteriores del mismo ciclo), o crea uno nuevo
 * la primera vez.
 */
async function resolveTestCycle(testCycle, projectKey) {
    if (testCycle.key) {
        console.log(`Reutilizando Test Cycle existente: ${testCycle.key}`);
        return testCycle.key;
    }

    const cycle = await createTestCycle({
        projectKey,
        name: testCycle.name,
        description: testCycle.description,
        statusName: testCycle.statusName
    });

    console.log(`Test Cycle creado: ${cycle.key}`);
    return cycle.key;
}

/**
 * Publica un único Test Case Canónico en Xray: crea el Test, sus steps,
 * lo vincula a la Historia y, si corresponde, crea/reutiliza el Test
 * Cycle (Test Execution) y agrega el Test Run inicial.
 */
async function publishTestCase(model, { issueKey, issueId, testCycle }) {
    model.folderId = await resolveTestCaseFolder(model);

    const testCase = await createTestCase(model);
    console.log(`Test Case creado: ${testCase.key}`);

    if (model.steps?.length) {
        await createTestSteps(testCase.key, model.steps);
        console.log('Steps creados correctamente.');
    }

    await linkTestCaseToIssue(testCase.key, issueId);
    console.log(`Vinculado con ${issueKey} en Xray.`);

    let testCycleKey = null;
    if (testCycle) {
        testCycleKey = await resolveTestCycle(testCycle, model.projectKey);
        await createTestExecution({
            projectKey: model.projectKey,
            testCaseKey: testCase.key,
            testCycleKey
        });
        console.log(`Ejecución creada en ${testCycleKey} con estado "TO DO".`);
    }

    return { testCaseKey: testCase.key, testCycleKey };
}

/**
 * Crea múltiples Test Cases en Xray en secuencia estricta (await paso a
 * paso, uno completo antes de arrancar el siguiente), todos vinculados al
 * mismo issue de Jira. El Test Cycle (si corresponde) y cada carpeta única
 * (si corresponde) se resuelven primero, también en secuencia, por el
 * mismo motivo de siempre: tanto crear un Test Execution como crear una
 * carpeta son patrones "buscar o crear" que dos llamadas concurrentes con
 * la misma ruta pueden hacer fallar o duplicar.
 *
 * Se procesa en secuencia (no en paralelo) a pedido explícito del usuario
 * (2026-09-13): necesita que los Test Cases entren en orden correlativo
 * tanto en la Historia como en el Test Repository de Xray — algo que
 * Promise.allSettled no garantiza, porque las respuestas de la API pueden
 * llegar desordenadas aunque las llamadas se disparen en el orden del
 * array. Ver Regla 2 de CLAUDE.md: prioriza orden sobre velocidad para
 * este caso, revierte la paralelización que tenía esta función antes.
 *
 * Un Test Case que falla no aborta el batch completo (se sigue
 * intentando con los siguientes, misma lección de SCRUM-62), pero sí
 * respeta el orden: no se dispara el siguiente hasta que el actual
 * terminó (con éxito o error).
 *
 * `sharedFolderCache` es opcional: un Map externo (folderPath -> id) que
 * el llamador puede pasar para reutilizarlo entre varias HU de un mismo
 * lote (ver create-jira-task.js, modo `issues` de --data) -- si dos HU
 * publican Test Cases en la misma carpeta, la segunda no vuelve a
 * resolverla contra la API. Sin llamador que lo pase, se crea uno nuevo
 * por invocación (comportamiento de siempre, sin cambios).
 */
async function publishTestCasesBatch(models, testCycle, issueKey, issueId, sharedFolderCache) {
    let testCycleKey = null;
    if (testCycle) {
        testCycleKey = await resolveTestCycle(testCycle, models[0].projectKey);
    }

    // Resolver cada ruta de carpeta única una sola vez, en secuencia,
    // antes de crear los Test Cases (ver comentario de la función).
    const folderIdByPath = sharedFolderCache || new Map();
    for (const model of models) {
        if (model.folder && !folderIdByPath.has(model.folder)) {
            folderIdByPath.set(model.folder, await resolveTestCaseFolder(model));
        }
    }

    const succeeded = [];
    const failed = [];

    for (const model of models) {
        try {
            model.folderId = model.folder ? folderIdByPath.get(model.folder) : null;

            const testCase = await createTestCase(model);

            if (model.steps?.length) {
                await createTestSteps(testCase.key, model.steps);
            }

            await linkTestCaseToIssue(testCase.key, issueId);

            if (testCycleKey) {
                await createTestExecution({
                    projectKey: model.projectKey,
                    testCaseKey: testCase.key,
                    testCycleKey
                });
            }

            succeeded.push(testCase.key);
        } catch (err) {
            failed.push({ model, err });
        }
    }

    if (succeeded.length) {
        console.log(`Test Cases creados en orden: ${succeeded.join(', ')}`);
        console.log(`Vinculados con ${issueKey} en Xray.`);
        if (testCycleKey) {
            console.log(`Ejecuciones creadas en ${testCycleKey} con estado "TO DO".`);
        }
    }

    if (failed.length) {
        console.error(`${failed.length} de ${models.length} Test Case(s) fallaron al crearse:`);
        failed.forEach(({ model, err }) => console.error(`  - "${model.name}": ${err.message}`));
        throw new Error(`${failed.length} Test Case(s) fallaron. Los ${succeeded.length} que sí se crearon ya quedaron completos (steps + link + ejecución) — no hace falta re-crearlos, solo reintentar los fallidos.`);
    }

    return { keys: succeeded, testCycleKey };
}

module.exports = {

    createTestCase,
    createTestSteps,
    removeAllTestSteps,
    replaceTestSteps,
    linkTestCaseToIssue,
    createTestCycle,
    createTestExecution,
    getTestCase,
    getTestCaseLinks,
    getTestCaseSteps,
    getTestCycle,
    getTestExecutions,
    getStatus,
    findTestExecution,
    updateTestExecutionStatus,
    findFolder,
    createFolder,
    resolveFolderPath,
    resolveTestCycle,
    resolveTestCaseFolder,
    publishTestCase,
    publishTestCasesBatch

};
