// ═══════════════════════════════════════════════════════════════════════
// MyCodeXvantaOS — API Gateway
// Lightweight reverse proxy that routes requests to platform services
// Routes: /api/v1/{identity,workspace,knowledge,chat,model,audit,usage}/*
// ═══════════════════════════════════════════════════════════════════════

const http = require('http');
const httpProxy = require('http-proxy');
const crypto = require('crypto');

const SERVICE_ROUTES = {
  identity:          process.env.IDENTITY_URL        || 'http://identity:8000',
  workspace:         process.env.WORKSPACE_URL       || 'http://workspace:8000',
  'knowledge-store': process.env.KNOWLEDGE_STORE_URL || 'http://knowledge-store:8000',
  'knowledge-search':process.env.KNOWLEDGE_SEARCH_URL|| 'http://knowledge-search:8000',
  'agent-chat':      process.env.AGENT_CHAT_URL      || 'http://agent-chat:8000',
  'model-byok':      process.env.MODEL_BYOK_URL      || 'http://model-byok:8000',
  'audit-log':       process.env.AUDIT_LOG_URL       || 'http://audit-log:8000',
  'usage-meter':     process.env.USAGE_METER_URL     || 'http://usage-meter:8000',
};

const ROUTE_ALIASES = {
  knowledge: 'knowledge-search',
  chat: 'agent-chat',
  model: 'model-byok',
  audit: 'audit-log',
  usage: 'usage-meter',
};

const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  proxyTimeout: 30000,
  timeout: 35000,
});

proxy.on('error', (err, req, res) => {
  console.error(`[proxy error] ${req.url}:`, err.message);
  if (!res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'bad_gateway', message: 'Service unavailable' }));
  }
});

function handler(req, res) {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'gateway',
      version: '0.1.0',
      routes: Object.keys(SERVICE_ROUTES),
    }));
    return;
  }

  const match = req.url.match(/^\/api\/v1\/([a-z-]+)(\/.*)?$/);
  if (!match) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not_found', message: 'Unknown route' }));
    return;
  }

  let serviceName = match[1];
  const remainingPath = match[2] || '/';

  if (ROUTE_ALIASES[serviceName]) {
    serviceName = ROUTE_ALIASES[serviceName];
  }

  const target = SERVICE_ROUTES[serviceName];
  if (!target) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'not_found',
      message: `Unknown service: ${serviceName}`,
      available: Object.keys(SERVICE_ROUTES),
    }));
    return;
  }

  req.url = remainingPath;

  const traceId = req.headers['x-trace-id'] || crypto.randomUUID();
  if (!req.headers['x-trace-id']) {
    req.headers['x-trace-id'] = traceId;
  }

  console.log(`[${new Date().toISOString()}] ${req.method} /api/v1/${serviceName}${remainingPath} -> ${target} [trace=${traceId}]`);

  proxy.web(req, res, { target }, (err) => {
    console.error(`[proxy error] ${serviceName}:`, err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'bad_gateway', message: 'Service unavailable' }));
    }
  });
}

const PORT = parseInt(process.env.PORT || '8080', 10);
const server = http.createServer(handler);

server.listen(PORT, () => {
  console.log(`MyCodeXvantaOS Gateway listening on :${PORT}`);
  console.log(`Routes: ${Object.entries(SERVICE_ROUTES).map(([k, v]) => `/api/v1/${k} -> ${v}`).join(', ')}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => process.exit(0));
});
process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => process.exit(0));
});
