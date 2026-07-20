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

/**
 * Crea un Test Case vacío.
 * Devuelve:
 * {
 *   id,
 *   key,
 *   self
 * }
 */
async function createTestCase(testcase) {

    const body = {

        projectKey: testcase.projectKey,

        name: testcase.name,

        objective: testcase.objective,

        precondition: testcase.precondition,

        priorityName: testcase.priorityName || 'Normal',

        statusName: testcase.statusName || 'Draft',

        labels: testcase.labels || []

    };

    const res = await zephyrRequest(
        'POST',
        '/v2/testcases',
        body
    );

    if (res.status !== 201) {

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
    getStatus


};