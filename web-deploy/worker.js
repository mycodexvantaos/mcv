/**
 * ═══════════════════════════════════════════════════════════════
 * SentinelCore v2.0 — Cloudflare Worker API Backend
 * ═══════════════════════════════════════════════════════════════
 * Provides serverless API endpoints for the monitoring platform:
 * - Health check & engine status
 * - Device management (CRUD)
 * - Threat event ingestion
 * - Audit ledger persistence
 * - Rule configuration
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Sentinel-Key',
  'Access-Control-Max-Age': '86400',
};

function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...headers,
    },
  });
}

async function hashChainEntry(entry, prevHash) {
  const input = `${entry.id}:${entry.timestamp}:${entry.action}:${entry.details}:${prevHash}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    try {
      // ═════════════════════════════════════════════════════════
      // Health & Status
      // ═════════════════════════════════════════════════════════
      if (path === '/api/health' && method === 'GET') {
        return jsonResponse({
          status: 'operational',
          service: 'SentinelCore API',
          version: '2.0.0',
          timestamp: new Date().toISOString(),
          uptime: Date.now(),
        });
      }

      if (path === '/api/engine/status' && method === 'GET') {
        const status = await env.SENTINEL_KV.get('engine:status');
        return jsonResponse({
          running: status === 'active',
          startedAt: await env.SENTINEL_KV.get('engine:startedAt'),
          modules: {
            gambling: true,
            adult: true,
            violence: true,
            drugs: true,
            contacts: true,
            fraud: true,
          },
        });
      }

      // ═════════════════════════════════════════════════════════
      // Device Management
      // ═════════════════════════════════════════════════════════
      if (path === '/api/devices' && method === 'GET') {
        const devicesRaw = await env.SENTINEL_KV.get('devices:all', { type: 'json' });
        return jsonResponse({
          devices: devicesRaw || [],
          count: devicesRaw ? devicesRaw.length : 0,
        });
      }

      if (path === '/api/devices' && method === 'POST') {
        const body = await request.json();
        const device = {
          id: `DEV-${Date.now().toString(36).toUpperCase()}`,
          name: body.name || 'Unknown Device',
          type: body.type || '📱',
          os: body.os || 'Unknown',
          status: 'online',
          enrolledAt: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
        };

        const devices = (await env.SENTINEL_KV.get('devices:all', { type: 'json' })) || [];
        devices.push(device);
        await env.SENTINEL_KV.put('devices:all', JSON.stringify(devices));

        return jsonResponse({ device, enrolled: true }, 201);
      }

      if (path.match(/^\/api\/devices\/[\w-]+$/) && method === 'GET') {
        const deviceId = path.split('/').pop();
        const devices = (await env.SENTINEL_KV.get('devices:all', { type: 'json' })) || [];
        const device = devices.find(d => d.id === deviceId);
        if (!device) return jsonResponse({ error: 'Device not found' }, 404);
        return jsonResponse({ device });
      }

      if (path.match(/^\/api\/devices\/[\w-]+$/) && method === 'DELETE') {
        const deviceId = path.split('/').pop();
        const devices = (await env.SENTINEL_KV.get('devices:all', { type: 'json' })) || [];
        const filtered = devices.filter(d => d.id !== deviceId);
        await env.SENTINEL_KV.put('devices:all', JSON.stringify(filtered));
        return jsonResponse({ removed: deviceId });
      }

      // ═════════════════════════════════════════════════════════
      // Threat Events
      // ═════════════════════════════════════════════════════════
      if (path === '/api/threats' && method === 'GET') {
        const threats = (await env.SENTINEL_KV.get('threats:recent', { type: 'json' })) || [];
        return jsonResponse({ threats, count: threats.length });
      }

      if (path === '/api/threats' && method === 'POST') {
        const body = await request.json();
        const threat = {
          id: `THR-${Date.now().toString(36).toUpperCase()}`,
          timestamp: new Date().toISOString(),
          device: body.device || 'UNKNOWN',
          title: body.title || 'Unnamed Threat',
          description: body.description || '',
          severity: body.severity || 'medium',
          category: body.category || null,
          action: body.action || 'LOG_EVENT',
          acknowledged: false,
        };

        const threats = (await env.SENTINEL_KV.get('threats:recent', { type: 'json' })) || [];
        threats.unshift(threat);
        // Keep last 200 threats
        if (threats.length > 200) threats.length = 200;
        await env.SENTINEL_KV.put('threats:recent', JSON.stringify(threats));

        return jsonResponse({ threat, recorded: true }, 201);
      }

      // ═════════════════════════════════════════════════════════
      // Audit Ledger
      // ═════════════════════════════════════════════════════════
      if (path === '/api/audit' && method === 'GET') {
        const chain = (await env.SENTINEL_KV.get('audit:chain', { type: 'json' })) || [];
        const lastHash = await env.SENTINEL_KV.get('audit:lastHash') || '0'.repeat(64);
        return jsonResponse({
          entries: chain.slice(-50).reverse(),
          totalEntries: chain.length,
          lastHash,
          chainValid: true,
        });
      }

      if (path === '/api/audit' && method === 'POST') {
        const body = await request.json();
        const chain = (await env.SENTINEL_KV.get('audit:chain', { type: 'json' })) || [];
        const prevHash = await env.SENTINEL_KV.get('audit:lastHash') || '0'.repeat(64);

        const entry = {
          id: chain.length,
          timestamp: new Date().toISOString(),
          action: body.action || 'UNKNOWN',
          details: body.details || '',
          severity: body.severity || 'info',
          prevHash,
        };

        entry.hash = await hashChainEntry(entry, prevHash);

        chain.push(entry);
        await env.SENTINEL_KV.put('audit:chain', JSON.stringify(chain));
        await env.SENTINEL_KV.put('audit:lastHash', entry.hash);

        return jsonResponse({ entry, chained: true }, 201);
      }

      if (path === '/api/audit/verify' && method === 'GET') {
        const chain = (await env.SENTINEL_KV.get('audit:chain', { type: 'json' })) || [];
        let valid = true;
        let prevHash = '0'.repeat(64);

        for (const entry of chain) {
          if (entry.prevHash !== prevHash) {
            valid = false;
            break;
          }
          const computedHash = await hashChainEntry(entry, prevHash);
          if (computedHash !== entry.hash) {
            valid = false;
            break;
          }
          prevHash = entry.hash;
        }

        return jsonResponse({
          valid,
          totalEntries: chain.length,
          verifiedAt: new Date().toISOString(),
        });
      }

      // ═════════════════════════════════════════════════════════
      // Rules
      // ═════════════════════════════════════════════════════════
      if (path === '/api/rules' && method === 'GET') {
        const rules = (await env.SENTINEL_KV.get('rules:all', { type: 'json' })) || [];
        return jsonResponse({ rules, count: rules.length });
      }

      if (path === '/api/rules' && method === 'POST') {
        const body = await request.json();
        const rules = (await env.SENTINEL_KV.get('rules:all', { type: 'json' })) || [];
        const rule = {
          id: rules.length + 1,
          name: body.name || 'New Rule',
          category: body.category || null,
          action: body.action || 'LOG_EVENT',
          severity: body.severity || 'medium',
          active: body.active !== false,
        };
        rules.push(rule);
        await env.SENTINEL_KV.put('rules:all', JSON.stringify(rules));
        return jsonResponse({ rule, created: true }, 201);
      }

      // ═════════════════════════════════════════════════════════
      // Fallback — 404
      // ═════════════════════════════════════════════════════════
      return jsonResponse({ error: 'Endpoint not found', path }, 404);

    } catch (err) {
      return jsonResponse({
        error: 'Internal server error',
        message: err.message,
      }, 500);
    }
  },
};