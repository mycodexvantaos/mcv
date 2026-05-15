#!/usr/bin/env node
/**
 * @module apps/cli
 * @description Command-line interface for MyCodeXvantaOS platform management.
 *
 * Usage:
 *   mcx <command> [subcommand] [options]
 *
 * Commands:
 *   mcx workspace create <name>          Create a workspace
 *   mcx workspace list                   List workspaces
 *   mcx knowledge ingest <file>          Ingest a document into knowledge base
 *   mcx knowledge search <query>         Search the knowledge base
 *   mcx knowledge collections            List knowledge collections
 *   mcx agent chat [options]             Start an interactive agent session
 *   mcx model list                       List available model endpoints
 *   mcx model chat <model> <prompt>      Call a model directly
 *   mcx audit list [options]             List audit events
 *   mcx audit verify                     Verify audit chain integrity
 *   mcx usage <subject-id> [options]     Show usage metering
 *   mcx automation enqueue <type> <data> Enqueue an automation job
 *   mcx config set <key> <value>         Set a configuration value
 *   mcx config get <key>                 Get a configuration value
 *   mcx status                           Show platform health status
 */

// ── Minimal CLI framework (no external deps) ───────────────────────────

interface CliCommand {
  name: string;
  description: string;
  subcommands?: CliCommand[];
  action?: (args: string[], opts: Record<string, string>) => Promise<void>;
  options?: Array<{ flag: string; description: string; default?: string }>;
}

// ── Configuration ──────────────────────────────────────────────────────

const CONFIG_DIR = `${process.env.HOME}/.mcx`;
const CONFIG_FILE = `${CONFIG_DIR}/config.json`;

function loadConfig(): Record<string, string> {
  try {
    const fs = require('fs');
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch { /* ignore */ }
  return {};
}

function saveConfig(config: Record<string, string>): void {
  try {
    const fs = require('fs');
    if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (err) {
    console.error('Failed to save config:', (err as Error).message);
  }
}

// ── API Client ─────────────────────────────────────────────────────────

async function apiRequest(
  method: string,
  path: string,
  body?: unknown,
): Promise<unknown> {
  const config = loadConfig();
  const baseUrl = config['api_base'] ?? 'http://localhost:8787/api/v1';
  const token = config['token'];

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`API ${res.status}: ${errBody}`);
  }

  return res.json();
}

// ── Commands ───────────────────────────────────────────────────────────

const statusCommand: CliCommand = {
  name: 'status',
  description: 'Show platform health status',
  action: async () => {
    const result = await apiRequest('GET', '/health') as { status: string; timestamp: string };
    console.log(`Platform Status: ${result.status}`);
    console.log(`Timestamp: ${result.timestamp}`);
  },
};

const configCommand: CliCommand = {
  name: 'config',
  description: 'Manage CLI configuration',
  subcommands: [
    {
      name: 'set',
      description: 'Set a configuration value',
      action: async (args) => {
        const [key, value] = args;
        if (!key || !value) { console.error('Usage: mcx config set <key> <value>'); process.exit(1); }
        const config = loadConfig();
        config[key] = value;
        saveConfig(config);
        console.log(`✓ Set ${key} = ${value}`);
      },
    },
    {
      name: 'get',
      description: 'Get a configuration value',
      action: async (args) => {
        const [key] = args;
        if (!key) { console.error('Usage: mcx config get <key>'); process.exit(1); }
        const config = loadConfig();
        if (config[key]) {
          console.log(config[key]);
        } else {
          console.error(`Key "${key}" not found in config`);
        }
      },
    },
  ],
};

const workspaceCommand: CliCommand = {
  name: 'workspace',
  description: 'Manage workspaces',
  subcommands: [
    {
      name: 'create',
      description: 'Create a workspace',
      action: async (args) => {
        const [name] = args;
        if (!name) { console.error('Usage: mcx workspace create <name>'); process.exit(1); }
        const result = await apiRequest('POST', '/workspace', { name, ownerId: 'cli-user' });
        console.log('✓ Workspace created:', JSON.stringify(result, null, 2));
      },
    },
    {
      name: 'list',
      description: 'List workspaces',
      action: async () => {
        const result = await apiRequest('GET', '/workspace') as { items: Array<{ id: string; name: string }> };
        if (result.items?.length) {
          console.table(result.items);
        } else {
          console.log('No workspaces found.');
        }
      },
    },
  ],
};

const knowledgeCommand: CliCommand = {
  name: 'knowledge',
  description: 'Knowledge base operations',
  subcommands: [
    {
      name: 'collections',
      description: 'List knowledge collections',
      action: async () => {
        const result = await apiRequest('GET', '/knowledge/collections');
        console.log(JSON.stringify(result, null, 2));
      },
    },
    {
      name: 'ingest',
      description: 'Ingest a document',
      action: async (args) => {
        const [filePath] = args;
        if (!filePath) { console.error('Usage: mcx knowledge ingest <file>'); process.exit(1); }
        const fs = require('fs');
        const content = fs.readFileSync(filePath, 'utf-8');
        const fileName = filePath.split('/').pop();
        const result = await apiRequest('POST', '/knowledge/ingest', {
          collectionId: 'default',
          documentId: fileName,
          content,
        });
        console.log('✓ Document ingested:', JSON.stringify(result, null, 2));
      },
    },
    {
      name: 'search',
      description: 'Search the knowledge base',
      action: async (args) => {
        const query = args.join(' ');
        if (!query) { console.error('Usage: mcx knowledge search <query>'); process.exit(1); }
        const result = await apiRequest('POST', '/knowledge/search', { query, topK: 5 });
        console.log(JSON.stringify(result, null, 2));
      },
    },
  ],
};

const agentCommand: CliCommand = {
  name: 'agent',
  description: 'Agent session operations',
  subcommands: [
    {
      name: 'chat',
      description: 'Start an interactive chat session',
      action: async (args, opts) => {
        const workspaceId = opts['workspace'] ?? 'default';
        // Create session
        const session = await apiRequest('POST', '/agent/sessions', { workspaceId }) as { sessionId: string };
        console.log(`Session started: ${session.sessionId}`);
        console.log('Type your message (Ctrl+C to exit):\n');

        const readline = require('readline');
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

        const prompt = () => {
          rl.question('You: ', async (msg: string) => {
            if (!msg.trim()) { prompt(); return; }
            try {
              const result = await apiRequest('POST', `/agent/sessions/${session.sessionId}/messages`, {
                content: msg,
              }) as { content: string; evidenceLevel: string; sources?: unknown[] };
              console.log(`\nAgent [${result.evidenceLevel}]: ${result.content}`);
              if (result.sources?.length) {
                console.log(`  Sources: ${result.sources.length} referenced`);
              }
              console.log();
            } catch (err) {
              console.error('Error:', (err as Error).message);
            }
            prompt();
          });
        };
        prompt();
      },
      options: [
        { flag: '--workspace', description: 'Workspace ID', default: 'default' },
      ],
    },
  ],
};

const modelCommand: CliCommand = {
  name: 'model',
  description: 'Model endpoint operations',
  subcommands: [
    {
      name: 'list',
      description: 'List available model endpoints',
      action: async () => {
        const result = await apiRequest('GET', '/model/endpoints');
        console.log(JSON.stringify(result, null, 2));
      },
    },
    {
      name: 'chat',
      description: 'Call a model directly',
      action: async (args) => {
        const [modelId, ...promptParts] = args;
        if (!modelId) { console.error('Usage: mcx model chat <model-id> <prompt>'); process.exit(1); }
        const prompt = promptParts.join(' ');
        const result = await apiRequest('POST', '/model/chat', {
          modelId,
          messages: [{ role: 'user', content: prompt }],
        });
        console.log(JSON.stringify(result, null, 2));
      },
    },
  ],
};

const auditCommand: CliCommand = {
  name: 'audit',
  description: 'Audit trail operations',
  subcommands: [
    {
      name: 'list',
      description: 'List audit events',
      action: async (args, opts) => {
        const limit = opts['limit'] ?? '50';
        const result = await apiRequest('GET', `/audit/events?limit=${limit}`);
        console.log(JSON.stringify(result, null, 2));
      },
      options: [
        { flag: '--limit', description: 'Max events to return', default: '50' },
      ],
    },
    {
      name: 'verify',
      description: 'Verify audit chain integrity',
      action: async () => {
        const result = await apiRequest('POST', '/audit/verify') as { valid: boolean; brokenAt?: string };
        if (result.valid) {
          console.log('✅ Audit chain integrity verified — no tampering detected.');
        } else {
          console.error(`❌ Audit chain integrity BROKEN at event: ${result.brokenAt}`);
          process.exit(1);
        }
      },
    },
  ],
};

const usageCommand: CliCommand = {
  name: 'usage',
  description: 'Usage metering',
  action: async (args, opts) => {
    const [subjectId] = args;
    if (!subjectId) { console.error('Usage: mcx usage <subject-id>'); process.exit(1); }
    const window = opts['window'] ?? 'hour';
    const result = await apiRequest('GET', `/usage/${subjectId}?window=${window}`);
    console.log(JSON.stringify(result, null, 2));
  },
  options: [
    { flag: '--window', description: 'Time window: minute, hour, day', default: 'hour' },
  ],
};

const automationCommand: CliCommand = {
  name: 'automation',
  description: 'Automation job operations',
  subcommands: [
    {
      name: 'enqueue',
      description: 'Enqueue an automation job',
      action: async (args) => {
        const [jobType, payloadJson] = args;
        if (!jobType) { console.error('Usage: mcx automation enqueue <type> [json-payload]'); process.exit(1); }
        const payload = payloadJson ? JSON.parse(payloadJson) : {};
        const result = await apiRequest('POST', '/automation/jobs', { jobType, payload });
        console.log('✓ Job enqueued:', JSON.stringify(result, null, 2));
      },
    },
  ],
};

// ── Root command tree ──────────────────────────────────────────────────

const rootCommands: CliCommand[] = [
  statusCommand,
  configCommand,
  workspaceCommand,
  knowledgeCommand,
  agentCommand,
  modelCommand,
  auditCommand,
  usageCommand,
  automationCommand,
];

// ── Argument parser ────────────────────────────────────────────────────

function parseArgs(argv: string[]): { positional: string[]; opts: Record<string, string> } {
  const positional: string[] = [];
  const opts: Record<string, string> = {};
  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      opts[key] = value ?? 'true';
    } else {
      positional.push(arg);
    }
  }
  return { positional, opts };
}

// ── Dispatcher ─────────────────────────────────────────────────────────

async function dispatch(commands: CliCommand[], positional: string[], opts: Record<string, string>): Promise<void> {
  const [cmd, ...rest] = positional;
  if (!cmd) {
    printHelp(commands);
    return;
  }

  const found = commands.find(c => c.name === cmd);
  if (!found) {
    console.error(`Unknown command: ${cmd}`);
    printHelp(commands);
    process.exit(1);
  }

  if (found.subcommands?.length && rest.length > 0 && !rest[0].startsWith('--')) {
    await dispatch(found.subcommands, rest, opts);
  } else if (found.action) {
    await found.action(rest, opts);
  } else if (found.subcommands?.length) {
    printHelp(found.subcommands, found.name);
  } else {
    console.error(`Command "${cmd}" has no action defined.`);
  }
}

function printHelp(commands: CliCommand[], prefix?: string): void {
  console.log(`\nMyCodeXvantaOS CLI (mcx) — Platform Management Tool\n`);
  console.log(`Usage: mcx ${prefix ? prefix + ' ' : ''}<command> [options]\n`);
  console.log('Commands:');
  for (const cmd of commands) {
    console.log(`  ${cmd.name.padEnd(20)} ${cmd.description}`);
  }
  console.log();
}

// ── Main ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { positional, opts } = parseArgs(process.argv.slice(2));
  try {
    await dispatch(rootCommands, positional, opts);
  } catch (err) {
    console.error('Error:', (err as Error).message);
    process.exit(1);
  }
}

main();
