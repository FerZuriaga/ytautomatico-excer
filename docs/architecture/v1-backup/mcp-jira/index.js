require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const https = require('https');

const HOSTNAME = 'ferzuriaga1.atlassian.net';
const AUTH = 'Basic ' + Buffer.from(
  process.env.JIRA_EMAIL + ':' + process.env.JIRA_API_TOKEN
).toString('base64');

function jiraRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: HOSTNAME,
      path,
      method,
      headers: {
        'Authorization': AUTH,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
      }
    };
    const req = https.request(options, (res) => {
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

// MCP Protocol over stdio (JSON-RPC 2.0)
let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop();
  for (const line of lines) {
    if (line.trim()) {
      try { handleMessage(JSON.parse(line)); }
      catch {}
    }
  }
});

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

const TOOLS = [
  {
    name: 'create_jira_issue',
    description: 'Crea un nuevo issue en el proyecto Jira SCRUM',
    inputSchema: {
      type: 'object',
      properties: {
        summary:     { type: 'string', description: 'Título del issue' },
        description: { type: 'string', description: 'Descripción detallada (texto plano)' },
        issueType:   { type: 'string', description: 'Tipo: Historia, Tarea, Bug', default: 'Historia' }
      },
      required: ['summary']
    }
  },
  {
    name: 'update_jira_issue',
    description: 'Actualiza un issue existente en Jira',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey:    { type: 'string', description: 'Clave del issue (ej: SCRUM-2)' },
        summary:     { type: 'string', description: 'Nuevo título' },
        description: { type: 'string', description: 'Nueva descripción (texto plano)' }
      },
      required: ['issueKey']
    }
  },
  {
    name: 'get_jira_issue',
    description: 'Obtiene los detalles de un issue por su clave',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: { type: 'string', description: 'Clave del issue (ej: SCRUM-2)' }
      },
      required: ['issueKey']
    }
  }
];

function buildDescription(text) {
  return {
    type: 'doc', version: 1,
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }]
  };
}

async function handleMessage(msg) {
  if (!msg.id) return; // notification, no response

  try {
    if (msg.method === 'initialize') {
      send({ jsonrpc: '2.0', id: msg.id, result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'jira-mcp', version: '1.0.0' }
      }});

    } else if (msg.method === 'tools/list') {
      send({ jsonrpc: '2.0', id: msg.id, result: { tools: TOOLS } });

    } else if (msg.method === 'tools/call') {
      const { name, arguments: args } = msg.params;
      let result;

      if (name === 'create_jira_issue') {
        const res = await jiraRequest('POST', '/rest/api/3/issue', {
          fields: {
            project: { key: process.env.JIRA_PROJECT_KEY || 'SCRUM' },
            summary: args.summary,
            issuetype: { name: args.issueType || 'Historia' },
            ...(args.description ? { description: buildDescription(args.description) } : {})
          }
        });
        const text = res.status === 201
          ? `Issue creado: ${res.body.key}\nURL: https://${HOSTNAME}/browse/${res.body.key}`
          : `Error ${res.status}: ${JSON.stringify(res.body)}`;
        result = { content: [{ type: 'text', text }], isError: res.status !== 201 };

      } else if (name === 'update_jira_issue') {
        const fields = {};
        if (args.summary) fields.summary = args.summary;
        if (args.description) fields.description = buildDescription(args.description);
        const res = await jiraRequest('PUT', `/rest/api/3/issue/${args.issueKey}`, { fields });
        const text = res.status === 204
          ? `Issue ${args.issueKey} actualizado.\nURL: https://${HOSTNAME}/browse/${args.issueKey}`
          : `Error ${res.status}: ${JSON.stringify(res.body)}`;
        result = { content: [{ type: 'text', text }], isError: res.status !== 204 };

      } else if (name === 'get_jira_issue') {
        const res = await jiraRequest('GET', `/rest/api/3/issue/${args.issueKey}`);
        const text = res.status === 200
          ? `Key: ${res.body.key}\nSummary: ${res.body.fields.summary}\nType: ${res.body.fields.issuetype.name}\nStatus: ${res.body.fields.status.name}`
          : `Error ${res.status}: ${JSON.stringify(res.body)}`;
        result = { content: [{ type: 'text', text }], isError: res.status !== 200 };

      } else {
        result = { content: [{ type: 'text', text: `Tool desconocido: ${name}` }], isError: true };
      }

      send({ jsonrpc: '2.0', id: msg.id, result });

    } else {
      send({ jsonrpc: '2.0', id: msg.id, error: { code: -32601, message: `Method not found: ${msg.method}` } });
    }
  } catch (e) {
    send({ jsonrpc: '2.0', id: msg.id, error: { code: -32603, message: e.message } });
  }
}
