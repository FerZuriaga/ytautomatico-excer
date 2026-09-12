require('dotenv').config();

const https = require('https');

const HOST = 'api.zephyrscale.smartbear.com';

const TOKEN = process.env.ZEPHYR_API_TOKEN;

function zephyrRequest(method, path, body = null) {

    return new Promise((resolve, reject) => {

        const payload = body ? JSON.stringify(body) : null;

        const req = https.request({

            hostname: HOST,

            path,

            method,

            headers: {

                Authorization: `Bearer ${TOKEN}`,

                Accept: 'application/json',

                'Content-Type': 'application/json',

                ...(payload
                    ? { 'Content-Length': Buffer.byteLength(payload) }
                    : {})

            }

        }, res => {

            let data = '';

            res.on('data', chunk => data += chunk);

            res.on('end', () => {

                try {

                    resolve({

                        status: res.statusCode,

                        body: JSON.parse(data)

                    });

                }

                catch {

                    resolve({

                        status: res.statusCode,

                        body: data

                    });

                }

            });

        });

        req.on('error', reject);

        if (payload)
            req.write(payload);

        req.end();

    });

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Crea un Test Case vacío.
 * Devuelve:
 * {
 *   id,
 *   key,
 *   self
 * }
 *
 * Cuando varios Test Cases del mismo batch paralelo (ver
 * createTestCasesBatch en create-jira-task.js) introducen una etiqueta
 * nueva al mismo tiempo, Zephyr devuelve 409 ("Option Value with the
 * given name already exists") a todos menos al que gana la carrera. Para
 * cuando llega ese 409 la etiqueta ya existe, asi que reintentar la misma
 * request alcanza para que pase — no hace falta cambiar nada del payload.
 */
async function createTestCase(testcase, attempt = 0) {

    const body = {

        projectKey: testcase.projectKey,

        name: testcase.name,

        objective: testcase.objective,

        precondition: testcase.precondition,

        priorityName: testcase.priorityName || 'Normal',

        statusName: testcase.statusName || 'Draft',

        labels: testcase.labels || []

    };

    if (testcase.folderId) {
        body.folderId = testcase.folderId;
    }

    const res = await zephyrRequest(
        'POST',
        '/v2/testcases',
        body
    );

    if (res.status !== 201) {

        const isLabelRace = res.status === 409
            && typeof res.body?.message === 'string'
            && res.body.message.includes('Option Value')
            && res.body.message.includes('already exists');

        if (isLabelRace && attempt < 3) {
            await sleep(300 + Math.random() * 400);
            return createTestCase(testcase, attempt + 1);
        }

        throw new Error(
            JSON.stringify(res.body, null, 2)
        );

    }

    return res.body;

}

async function createTestSteps(testCaseKey, steps) {

    const body = {
        mode: "OVERWRITE",
        items: steps.map(step => ({
            inline: {
                description: step.description,
                testData: step.testData || "",
                expectedResult: step.expectedResult
            }
        }))
    };

    const res = await zephyrRequest(
        "POST",
        `/v2/testcases/${testCaseKey}/teststeps`,
        body
    );

    if (res.status !== 201) {
        throw new Error(JSON.stringify(res.body, null, 2));
    }

    return res.body;
}

/**
 * Vincula un Test Case existente con un issue de Jira (Historia, Bug, etc.)
 * mediante el link nativo de Zephyr. issueId es el ID numérico del issue
 * de Jira (no el key).
 * Devuelve:
 * {
 *   id,
 *   self
 * }
 */
async function linkTestCaseToIssue(testCaseKey, issueId) {

    const res = await zephyrRequest(
        'POST',
        `/v2/testcases/${testCaseKey}/links/issues`,
        { issueId }
    );

    if (res.status !== 201) {

        throw new Error(
            JSON.stringify(res.body, null, 2)
        );

    }

    return res.body;

}

/**
 * Crea (o reutiliza) un Test Cycle para agrupar ejecuciones de Test Cases.
 * Devuelve:
 * {
 *   id,
 *   key,
 *   self
 * }
 */
async function createTestCycle(cycle) {

    const body = {

        projectKey: cycle.projectKey,

        name: cycle.name,

        description: cycle.description,

        statusName: cycle.statusName

    };

    const res = await zephyrRequest(
        'POST',
        '/v2/testcycles',
        body
    );

    if (res.status !== 201) {

        throw new Error(
            JSON.stringify(res.body, null, 2)
        );

    }

    return res.body;

}

/**
 * Crea una ejecución de un Test Case dentro de un Test Cycle, con un
 * estado inicial (por defecto "Not Executed", el status real por
 * defecto configurado en Zephyr para TEST_EXECUTION).
 * Devuelve:
 * {
 *   id,
 *   self
 * }
 */
async function createTestExecution(execution) {

    const body = {

        projectKey: execution.projectKey,

        testCaseKey: execution.testCaseKey,

        testCycleKey: execution.testCycleKey,

        statusName: execution.statusName || 'Not Executed'

    };

    const res = await zephyrRequest(
        'POST',
        '/v2/testexecutions',
        body
    );

    if (res.status !== 201) {

        throw new Error(
            JSON.stringify(res.body, null, 2)
        );

    }

    return res.body;

}

/**
 * Lecturas de verificación (read-only). No crean ni modifican nada en Zephyr;
 * se utilizan para confirmar por lectura directa el resultado de las
 * operaciones de creación ya realizadas mediante la implementación oficial.
 */
async function getTestCase(testCaseKey) {
    const res = await zephyrRequest('GET', `/v2/testcases/${testCaseKey}`);
    if (res.status !== 200) {
        throw new Error(JSON.stringify(res.body, null, 2));
    }
    return res.body;
}

async function getTestCaseLinks(testCaseKey) {
    const res = await zephyrRequest('GET', `/v2/testcases/${testCaseKey}/links`);
    if (res.status !== 200) {
        throw new Error(JSON.stringify(res.body, null, 2));
    }
    return res.body;
}

async function getTestCaseSteps(testCaseKey) {
    const res = await zephyrRequest('GET', `/v2/testcases/${testCaseKey}/teststeps`);
    if (res.status !== 200) {
        throw new Error(JSON.stringify(res.body, null, 2));
    }
    return res.body;
}

async function getTestCycle(testCycleKey) {
    const res = await zephyrRequest('GET', `/v2/testcycles/${testCycleKey}`);
    if (res.status !== 200) {
        throw new Error(JSON.stringify(res.body, null, 2));
    }
    return res.body;
}

async function getStatus(statusId) {
    const res = await zephyrRequest('GET', `/v2/statuses/${statusId}`);
    if (res.status !== 200) {
        throw new Error(JSON.stringify(res.body, null, 2));
    }
    return res.body;
}

async function getTestExecutions(projectKey, testCycleKey) {
    const qs = `projectKey=${encodeURIComponent(projectKey)}&testCycle=${encodeURIComponent(testCycleKey)}`;
    const res = await zephyrRequest('GET', `/v2/testexecutions?${qs}`);
    if (res.status !== 200) {
        throw new Error(JSON.stringify(res.body, null, 2));
    }
    return res.body;
}

/**
 * Busca la Test Execution vigente de un Test Case dentro de un Test Cycle
 * puntual. Se usa para resolver dinamicamente, en tiempo de reporte, la
 * ejecucion real sobre la que hay que escribir el resultado (nunca se
 * hardcodea un ID de ejecucion en el codigo, porque es efimero por ciclo).
 * Devuelve la primera ejecucion encontrada, o null si no existe ninguna
 * para ese Test Case en ese ciclo (no inventa nada).
 */
async function findTestExecution(projectKey, testCycleKey, testCaseKey) {
    const qs = `projectKey=${encodeURIComponent(projectKey)}&testCycle=${encodeURIComponent(testCycleKey)}&testCase=${encodeURIComponent(testCaseKey)}`;
    const res = await zephyrRequest('GET', `/v2/testexecutions?${qs}`);
    if (res.status !== 200) {
        throw new Error(JSON.stringify(res.body, null, 2));
    }
    const values = Array.isArray(res.body) ? res.body : (res.body && res.body.values) || [];
    return values[0] || null;
}

/**
 * Actualiza el estado de una Test Execution existente (update parcial,
 * PUT /testexecutions solo pisa los campos enviados). No crea ejecuciones
 * nuevas.
 */
async function updateTestExecutionStatus(executionIdOrKey, statusName) {
    const res = await zephyrRequest('PUT', `/v2/testexecutions/${executionIdOrKey}`, { statusName });
    if (res.status !== 200 && res.status !== 204) {
        throw new Error(JSON.stringify(res.body, null, 2));
    }
    return res.body;
}

/**
 * Busca un folder existente por nombre y folderType dentro de un proyecto,
 * bajo un parentId puntual (null para carpetas raíz). GET /folders no
 * filtra por nombre ni por parentId (solo por projectKey/folderType), así
 * que se recorren todas las páginas del proyecto y se filtra del lado del
 * cliente. Devuelve el folder encontrado o null (nunca inventa).
 */
async function findFolder(projectKey, folderType, name, parentId) {
    let startAt = 0;
    const maxResults = 100;

    while (true) {
        const qs = `projectKey=${encodeURIComponent(projectKey)}&folderType=${encodeURIComponent(folderType)}&maxResults=${maxResults}&startAt=${startAt}`;
        const res = await zephyrRequest('GET', `/v2/folders?${qs}`);
        if (res.status !== 200) {
            throw new Error(JSON.stringify(res.body, null, 2));
        }

        const values = (res.body && res.body.values) || [];
        const match = values.find(f => f.name === name && (f.parentId || null) === (parentId || null));
        if (match) return match;

        if (res.body.isLast || values.length === 0) return null;
        startAt += values.length;
    }
}

/**
 * Crea un folder nuevo. parentId null (u omitido) crea un folder raíz.
 * Devuelve { id, self } (Zephyr no devuelve "key" para folders, solo el
 * id numérico).
 */
async function createFolder(projectKey, folderType, name, parentId) {
    const body = { projectKey, folderType, name };
    if (parentId) body.parentId = parentId;

    const res = await zephyrRequest('POST', '/v2/folders', body);
    if (res.status !== 201) {
        throw new Error(JSON.stringify(res.body, null, 2));
    }
    return res.body;
}

/**
 * Resuelve una ruta de carpetas tipo "/03 - Leave Management/Leave List"
 * al folderId real del último nivel: busca (o crea, si no existe) cada
 * segmento de la ruta como su propio folder, encadenado por parentId.
 * Los nombres de folder de Zephyr no admiten "/" ni "\", por eso la ruta
 * se parte en segmentos individuales en vez de usarse como un único
 * nombre con barras.
 */
async function resolveFolderPath(projectKey, folderPath, folderType = 'TEST_CASE') {
    const segments = folderPath.split('/').map(s => s.trim()).filter(Boolean);

    let parentId = null;

    for (const segment of segments) {
        let folder = await findFolder(projectKey, folderType, segment, parentId);
        if (!folder) {
            folder = await createFolder(projectKey, folderType, segment, parentId);
        }
        parentId = folder.id;
    }

    return parentId;
}

// ------------------------------------------------------------------
// Orquestación de publicación (movida acá desde create-jira-task.js —
// ver docs/architecture/architecture-v2-phase2-component-design.md,
// sección 8, punto 4: esta lógica es "cuándo llamar a qué" de Zephyr,
// no de Jira, y no debería vivir en el script de Jira).
// ------------------------------------------------------------------

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
 * Resuelve la propiedad "folder" del Modelo Canónico (ruta funcional tipo
 * "/03 - Leave Management/Leave List") a un folderId real de Zephyr,
 * buscando o creando cada segmento de la ruta (ver resolveFolderPath). Si
 * el Modelo Canónico no trae "folder", el Test Case se crea sin carpeta.
 */
async function resolveTestCaseFolder(testcaseModel) {
    if (!testcaseModel.folder) return null;

    const folderId = await resolveFolderPath(testcaseModel.projectKey, testcaseModel.folder);
    console.log(`Carpeta resuelta: "${testcaseModel.folder}" -> folderId ${folderId}.`);
    return folderId;
}

/**
 * Publica un único Test Case Canónico en Zephyr: resuelve carpeta, crea
 * el Test Case, sus steps, lo vincula a la Historia y, si corresponde,
 * crea/reutiliza el Test Cycle y la Test Execution inicial.
 *
 * Único punto de esta secuencia (antes duplicada dos veces dentro de
 * create-jira-task.js: una para el flujo de creación de Historia, otra
 * para el de actualización — ver hallazgo en architecture-v2-phase2-
 * component-design.md sección 1.3).
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
    console.log(`Vinculado con ${issueKey} en Zephyr.`);

    let testCycleKey = null;
    if (testCycle) {
        testCycleKey = await resolveTestCycle(testCycle, model.projectKey);
        await createTestExecution({
            projectKey: model.projectKey,
            testCaseKey: testCase.key,
            testCycleKey
        });
        console.log(`Ejecución creada en ${testCycleKey} con estado "Not Executed".`);
    }

    return { testCaseKey: testCase.key, testCycleKey };
}

/**
 * Crea múltiples Test Cases en Zephyr en paralelo (Promise.allSettled),
 * todos vinculados al mismo issue de Jira. Los recursos compartidos que no
 * son seguros de resolver en paralelo (folderId por ruta de carpeta, y el
 * Test Cycle si corresponde) se resuelven antes, de forma secuencial: crear
 * una carpeta o un Test Cycle es un patrón "buscar o crear", y dos llamadas
 * concurrentes que todavía no ven el recurso creado terminarían creando
 * cada una el suyo (carpeta/ciclo duplicado). Recién con esos ids ya
 * resueltos se dispara en paralelo la parte que sí es independiente por
 * Test Case: creación + steps + link + ejecución en el ciclo.
 *
 * Se usa Promise.allSettled (no Promise.all) a propósito: si un Test Case
 * falla, no debe frenar a los demás que ya están en vuelo. Con Promise.all,
 * el primer rechazo corta main() vía process.exit antes de que los que ya
 * habían creado el testcase lleguen a steps/link/ejecución, y quedan
 * huérfanos (ya pasó: SCRUM-62 necesitó reparación manual por esto). La
 * carrera de labels nuevos en sí se resuelve con retry en createTestCase;
 * esto cubre cualquier otro fallo parcial del batch.
 */
async function publishTestCasesBatch(models, testCycle, issueKey, issueId) {
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

    const results = await Promise.allSettled(models.map(async (model) => {
        model.folderId = model.folder ? folderCache.get(model.folder) : null;

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

        return testCase.key;
    }));

    const succeeded = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);
    const failed = results
        .map((r, i) => ({ r, model: models[i] }))
        .filter(({ r }) => r.status === 'rejected');

    if (succeeded.length) {
        console.log(`Test Cases creados: ${succeeded.join(', ')}`);
        console.log(`Vinculados con ${issueKey} en Zephyr.`);
        if (testCycleKey) {
            console.log(`Ejecuciones creadas en ${testCycleKey} con estado "Not Executed".`);
        }
    }

    if (failed.length) {
        console.error(`${failed.length} de ${models.length} Test Case(s) fallaron al crearse:`);
        failed.forEach(({ r, model }) => console.error(`  - "${model.name}": ${r.reason.message}`));
        throw new Error(`${failed.length} Test Case(s) fallaron. Los ${succeeded.length} que sí se crearon ya quedaron completos (steps + link + ejecución) — no hace falta re-crearlos, solo reintentar los fallidos.`);
    }

    return { keys: succeeded, testCycleKey };
}

module.exports = {

    createTestCase,
    createTestSteps,
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