/**
 * ══════════════════════════════════════════════════════════════════════════════
 * 守護核心 SentinelCore v3.0 — Cloudflare Worker API
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * 金鑰配對生命週期：
 *   POST /api/keys/generate      — 被觀察方簽署協議後生成金鑰
 *   POST /api/keys/validate      — 觀察方驗證金鑰有效性
 *   POST /api/keys/pair          — 觀察方建立配對連線
 *   POST /api/keys/confirm-subject — 被觀察方確認金鑰部署
 *   GET  /api/keys/status        — 查詢金鑰狀態
 *   POST /api/keys/revoke        — 撤銷金鑰
 *   GET  /api/keys/list          — 列出所有金鑰
 *
 * 其他端點：
 *   GET  /api/health             — 健康檢查
 *   GET  /api/devices            — 裝置列表
 *   GET  /api/threats            — 威脅紀錄
 *   GET  /api/audit              — 審計紀錄
 *   GET  /api/rules              — 監控規則
 */

// ══════════════════════════════════════════════════════════════════════════════
// 金鑰配對核心函數
// ══════════════════════════════════════════════════════════════════════════════

function generatePairingKey() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 排除容易混淆的 0/O/1/I/L
  let key = '';
  for (let i = 0; i < 8; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key.slice(0, 4) + '-' + key.slice(4);
}

async function handleKeysGenerate(request, env) {
  try {
    const body = await request.json().catch(() => ({}));
    const key = generatePairingKey();
    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000; // 24 小時有效期

    const keyRecord = {
      key,
      status: 'active',
      createdAt: now,
      expiresAt,
      subjectConfirmed: false,
      deviceInfo: body.deviceInfo || null,
      guardianName: body.guardianName || null,
      pairedAt: null,
      pairedObserver: null,
      sessionId: null,
    };

    // 存儲金鑰記錄
    await env.SCREEN_MONITOR_KV.put(`key:${key}`, JSON.stringify(keyRecord));

    // 更新活躍金鑰索引
    let activeKeys = [];
    try {
      const existing = await env.SCREEN_MONITOR_KV.get('keys:active');
      if (existing) activeKeys = JSON.parse(existing);
    } catch (e) {}
    activeKeys.push(key);
    await env.SCREEN_MONITOR_KV.put('keys:active', JSON.stringify(activeKeys));

    // 審計紀錄
    await appendAuditLog(env, {
      action: 'KEY_GENERATED',
      key,
      timestamp: now,
      details: '配對金鑰已生成',
    });

    return jsonResponse({
      success: true,
      key,
      status: 'active',
      expiresAt,
      createdAt: now,
    }, 201);
  } catch (err) {
    return jsonResponse({ error: '金鑰生成失敗', details: err.message }, 500);
  }
}

async function handleKeysValidate(request, env) {
  try {
    const body = await request.json().catch(() => ({}));
    const { key } = body;

    if (!key) {
      return jsonResponse({ error: '缺少金鑰參數' }, 400);
    }

    const recordRaw = await env.SCREEN_MONITOR_KV.get(`key:${key}`);
    if (!recordRaw) {
      return jsonResponse({
        valid: false,
        status: 'not_found',
        error: '金鑰不存在，請確認後重新輸入',
      }, 404);
    }

    const record = JSON.parse(recordRaw);

    // 檢查過期
    if (record.expiresAt && Date.now() > record.expiresAt) {
      record.status = 'expired';
      await env.SCREEN_MONITOR_KV.put(`key:${key}`, JSON.stringify(record));
      return jsonResponse({
        valid: false,
        status: 'expired',
        error: '金鑰已過期，請重新生成',
      }, 410);
    }

    // 檢查是否已撤銷
    if (record.status === 'revoked') {
      return jsonResponse({
        valid: false,
        status: 'revoked',
        error: '金鑰已被撤銷',
      }, 403);
    }

    // 檢查是否已配對
    if (record.status === 'paired') {
      return jsonResponse({
        valid: false,
        status: 'already_paired',
        error: '金鑰已被使用，無法重複配對',
      }, 409);
    }

    return jsonResponse({
      valid: true,
      status: record.status,
      keyInfo: {
        key: record.key,
        createdAt: record.createdAt,
        expiresAt: record.expiresAt,
        subjectConfirmed: record.subjectConfirmed,
      },
    });
  } catch (err) {
    return jsonResponse({ error: '金鑰驗證失敗', details: err.message }, 500);
  }
}

async function handleKeysPair(request, env) {
  try {
    const body = await request.json().catch(() => ({}));
    const { key, observerInfo } = body;

    if (!key) {
      return jsonResponse({ error: '缺少金鑰參數' }, 400);
    }

    const recordRaw = await env.SCREEN_MONITOR_KV.get(`key:${key}`);
    if (!recordRaw) {
      return jsonResponse({ error: '金鑰不存在', status: 'not_found' }, 404);
    }

    const record = JSON.parse(recordRaw);

    if (record.status !== 'active') {
      return jsonResponse({
        error: '金鑰狀態無效，無法配對',
        status: record.status,
      }, 409);
    }

    if (record.expiresAt && Date.now() > record.expiresAt) {
      return jsonResponse({ error: '金鑰已過期', status: 'expired' }, 410);
    }

    // 建立配對
    const sessionId = crypto.randomUUID();
    const now = Date.now();

    record.status = 'paired';
    record.pairedAt = now;
    record.pairedObserver = observerInfo || null;
    record.sessionId = sessionId;

    await env.SCREEN_MONITOR_KV.put(`key:${key}`, JSON.stringify(record));

    // 建立裝置紀錄
    const deviceId = `DEV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const deviceRecord = {
      id: deviceId,
      pairedKey: key,
      sessionId,
      status: 'online',
      pairedAt: now,
      lastSeen: now,
      observer: observerInfo || null,
    };
    await env.SCREEN_MONITOR_KV.put(`device:${deviceId}`, JSON.stringify(deviceRecord));
    await env.SCREEN_MONITOR_KV.put(`session:${sessionId}`, JSON.stringify({
      id: sessionId,
      key,
      deviceId,
      createdAt: now,
      status: 'active',
    }));

    // 審計紀錄
    await appendAuditLog(env, {
      action: 'KEY_PAIRED',
      key,
      sessionId,
      deviceId,
      timestamp: now,
      details: '觀察方已成功配對',
    });

    return jsonResponse({
      paired: true,
      session: sessionId,
      device: deviceId,
      pairedAt: now,
    });
  } catch (err) {
    return jsonResponse({ error: '配對失敗', details: err.message }, 500);
  }
}

async function handleKeysConfirmSubject(request, env) {
  try {
    const body = await request.json().catch(() => ({}));
    const { key } = body;

    if (!key) {
      return jsonResponse({ error: '缺少金鑰參數' }, 400);
    }

    const recordRaw = await env.SCREEN_MONITOR_KV.get(`key:${key}`);
    if (!recordRaw) {
      return jsonResponse({ error: '金鑰不存在' }, 404);
    }

    const record = JSON.parse(recordRaw);
    record.subjectConfirmed = true;
    record.confirmedAt = Date.now();

    await env.SCREEN_MONITOR_KV.put(`key:${key}`, JSON.stringify(record));

    // 審計紀錄
    await appendAuditLog(env, {
      action: 'SUBJECT_CONFIRMED',
      key,
      timestamp: record.confirmedAt,
      details: '被觀察方已確認金鑰並開始部署',
    });

    return jsonResponse({
      confirmed: true,
      key,
      confirmedAt: record.confirmedAt,
    });
  } catch (err) {
    return jsonResponse({ error: '確認失敗', details: err.message }, 500);
  }
}

async function handleKeysStatus(request, env) {
  try {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (!key) {
      return jsonResponse({ error: '缺少金鑰參數' }, 400);
    }

    const recordRaw = await env.SCREEN_MONITOR_KV.get(`key:${key}`);
    if (!recordRaw) {
      return jsonResponse({ error: '金鑰不存在', status: 'not_found' }, 404);
    }

    const record = JSON.parse(recordRaw);

    // 自動標記過期
    if (record.status === 'active' && record.expiresAt && Date.now() > record.expiresAt) {
      record.status = 'expired';
      await env.SCREEN_MONITOR_KV.put(`key:${key}`, JSON.stringify(record));
    }

    return jsonResponse({
      key: record.key,
      status: record.status,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      subjectConfirmed: record.subjectConfirmed,
      pairedAt: record.pairedAt,
      sessionId: record.sessionId,
    });
  } catch (err) {
    return jsonResponse({ error: '查詢失敗', details: err.message }, 500);
  }
}

async function handleKeysRevoke(request, env) {
  try {
    const body = await request.json().catch(() => ({}));
    const { key } = body;

    if (!key) {
      return jsonResponse({ error: '缺少金鑰參數' }, 400);
    }

    const recordRaw = await env.SCREEN_MONITOR_KV.get(`key:${key}`);
    if (!recordRaw) {
      return jsonResponse({ error: '金鑰不存在' }, 404);
    }

    const record = JSON.parse(recordRaw);
    record.status = 'revoked';
    record.revokedAt = Date.now();

    await env.SCREEN_MONITOR_KV.put(`key:${key}`, JSON.stringify(record));

    // 審計紀錄
    await appendAuditLog(env, {
      action: 'KEY_REVOKED',
      key,
      timestamp: record.revokedAt,
      details: '金鑰已被撤銷',
    });

    return jsonResponse({ revoked: true, key });
  } catch (err) {
    return jsonResponse({ error: '撤銷失敗', details: err.message }, 500);
  }
}

async function handleKeysList(request, env) {
  try {
    let activeKeys = [];
    try {
      const existing = await env.SCREEN_MONITOR_KV.get('keys:active');
      if (existing) activeKeys = JSON.parse(existing);
    } catch (e) {}

    const keys = [];
    for (const key of activeKeys) {
      const recordRaw = await env.SCREEN_MONITOR_KV.get(`key:${key}`);
      if (recordRaw) {
        const record = JSON.parse(recordRaw);
        keys.push({
          key: record.key,
          status: record.status,
          createdAt: record.createdAt,
          expiresAt: record.expiresAt,
          subjectConfirmed: record.subjectConfirmed,
        });
      }
    }

    return jsonResponse({ keys, total: keys.length });
  } catch (err) {
    return jsonResponse({ error: '列表查詢失敗', details: err.message }, 500);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 審計紀錄輔助函數
// ══════════════════════════════════════════════════════════════════════════════

async function appendAuditLog(env, entry) {
  try {
    let logs = [];
    try {
      const existing = await env.SCREEN_MONITOR_KV.get('audit:logs');
      if (existing) logs = JSON.parse(existing);
    } catch (e) {}

    // SHA-256 審計雜湊
    const hashInput = JSON.stringify(entry) + (logs.length > 0 ? logs[logs.length - 1].hash : 'genesis');
    const encoder = new TextEncoder();
    const data = encoder.encode(hashInput);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    entry.hash = hash;
    logs.push(entry);

    // 只保留最近 200 筆
    if (logs.length > 200) logs = logs.slice(-200);

    await env.SCREEN_MONITOR_KV.put('audit:logs', JSON.stringify(logs));
  } catch (e) {
    console.error('審計紀錄寫入失敗:', e);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 模擬數據（無 KV 時的回退方案）
// ══════════════════════════════════════════════════════════════════════════════

function getMockDevices() {
  return [
    { id: 'DEV-A7X3K9', name: '小明的手機', status: 'online', lastSeen: Date.now(), risk: 0.12, categories: { gambling: 0, adult: 0, violence: 1, drugs: 0, contacts: 0 } },
    { id: 'DEV-B2M8P4', name: '小華的平板', status: 'online', lastSeen: Date.now() - 30000, risk: 0.34, categories: { gambling: 2, adult: 0, violence: 0, drugs: 1, contacts: 1 } },
    { id: 'DEV-C5N1R7', name: '小美的筆電', status: 'offline', lastSeen: Date.now() - 7200000, risk: 0.08, categories: { gambling: 0, adult: 0, violence: 0, drugs: 0, contacts: 0 } },
  ];
}

function getMockThreats() {
  return [
    { id: 'THR-001', deviceId: 'DEV-B2M8P4', category: 'gambling', severity: 'high', description: '偵測到線上博弈網站存取', timestamp: Date.now() - 300000, resolved: false },
    { id: 'THR-002', deviceId: 'DEV-B2M8P4', category: 'drugs', severity: 'medium', description: '可疑藥物相關搜尋', timestamp: Date.now() - 900000, resolved: false },
    { id: 'THR-003', deviceId: 'DEV-A7X3K9', category: 'violence', severity: 'low', description: '暴力遊戲內容', timestamp: Date.now() - 3600000, resolved: true },
    { id: 'THR-004', deviceId: 'DEV-B2M8P4', category: 'contacts', severity: 'medium', description: '未知成人聯絡人', timestamp: Date.now() - 1800000, resolved: false },
    { id: 'THR-005', deviceId: 'DEV-A7X3K9', category: 'adult', severity: 'critical', description: '成人內容網站嘗試存取（已封鎖）', timestamp: Date.now() - 600000, resolved: false },
  ];
}

function getMockRules() {
  return [
    { id: 'RULE-001', name: '博弈網站封鎖', category: 'gambling', action: 'block', enabled: true, severity: 'critical' },
    { id: 'RULE-002', name: '成人內容過濾', category: 'adult', action: 'block', enabled: true, severity: 'critical' },
    { id: 'RULE-003', name: '暴力內容警示', category: 'violence', action: 'warn', enabled: true, severity: 'high' },
    { id: 'RULE-004', name: '藥物資訊監控', category: 'drugs', action: 'alert', enabled: true, severity: 'high' },
    { id: 'RULE-005', name: '陌生聯絡人提醒', category: 'contacts', action: 'alert', enabled: true, severity: 'medium' },
    { id: 'RULE-006', name: '深夜使用限制', category: 'general', action: 'restrict', enabled: false, severity: 'low' },
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// 輔助函數
// ══════════════════════════════════════════════════════════════════════════════

function jsonResponse(data, status = 200, request = null) {
  let allowOrigin = 'https://autoecoops.io';
  if (request) {
    const origin = request.headers.get('Origin') || '';
    const allowed = [
      'https://autoecoops.io',
      'https://www.autoecoops.io',
      'https://app.autoecoops.io',
      'http://localhost:8787',
      'http://localhost:3000',
    ];
    if (allowed.includes(origin)) allowOrigin = origin;
  }
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

function handleCORS(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = [
    'https://autoecoops.io',
    'https://www.autoecoops.io',
    'https://app.autoecoops.io',
    'http://localhost:8787',
    'http://localhost:3000',
  ];
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0];

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// 主請求處理器
// ══════════════════════════════════════════════════════════════════════════════

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS 預檢請求
    if (request.method === 'OPTIONS') {
      return handleCORS(request);
    }

    // ═══ 金鑰配對 API ═══
    if (path === '/api/keys/generate' && request.method === 'POST') {
      if (env.SCREEN_MONITOR_KV) {
        return handleKeysGenerate(request, env);
      }
      // 無 KV 時的回退
      const key = generatePairingKey();
      return jsonResponse({
        success: true, key, status: 'active',
        expiresAt: Date.now() + 86400000,
        createdAt: Date.now(),
        _fallback: true,
      }, 201);
    }

    if (path === '/api/keys/validate' && request.method === 'POST') {
      if (env.SCREEN_MONITOR_KV) {
        return handleKeysValidate(request, env);
      }
      const body = await request.json().catch(() => ({}));
      const keyFormat = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;
      if (keyFormat.test(body.key)) {
        return jsonResponse({ valid: true, status: 'active', _fallback: true });
      }
      return jsonResponse({ valid: false, status: 'invalid', error: '金鑰格式不正確' }, 400);
    }

    if (path === '/api/keys/pair' && request.method === 'POST') {
      if (env.SCREEN_MONITOR_KV) {
        return handleKeysPair(request, env);
      }
      const body = await request.json().catch(() => ({}));
      const sessionId = crypto.randomUUID();
      return jsonResponse({
        paired: true, session: sessionId,
        device: `DEV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        pairedAt: Date.now(), _fallback: true,
      });
    }

    if (path === '/api/keys/confirm-subject' && request.method === 'POST') {
      if (env.SCREEN_MONITOR_KV) {
        return handleKeysConfirmSubject(request, env);
      }
      return jsonResponse({ confirmed: true, _fallback: true });
    }

    if (path === '/api/keys/status' && request.method === 'GET') {
      if (env.SCREEN_MONITOR_KV) {
        return handleKeysStatus(request, env);
      }
      const key = url.searchParams.get('key');
      return jsonResponse({ key, status: 'active', _fallback: true });
    }

    if (path === '/api/keys/revoke' && request.method === 'POST') {
      if (env.SCREEN_MONITOR_KV) {
        return handleKeysRevoke(request, env);
      }
      return jsonResponse({ revoked: true, _fallback: true });
    }

    if (path === '/api/keys/list' && request.method === 'GET') {
      if (env.SCREEN_MONITOR_KV) {
        return handleKeysList(request, env);
      }
      return jsonResponse({ keys: [], total: 0, _fallback: true });
    }

    // ═══ 其他 API 端點 ═══
    if (path === '/api/health') {
      return jsonResponse({
        status: 'healthy',
        version: '3.0.0',
        timestamp: Date.now(),
        kv: !!env.SCREEN_MONITOR_KV,
        uptime: process.uptime ? process.uptime() : null,
      });
    }

    if (path === '/api/devices') {
      return jsonResponse({ devices: getMockDevices() });
    }

    if (path === '/api/threats') {
      return jsonResponse({ threats: getMockThreats() });
    }

    if (path === '/api/audit') {
      if (env.SCREEN_MONITOR_KV) {
        try {
          const logs = await env.SCREEN_MONITOR_KV.get('audit:logs');
          return jsonResponse({ entries: logs ? JSON.parse(logs) : [] });
        } catch (e) {
          return jsonResponse({ entries: [] });
        }
      }
      return jsonResponse({ entries: [], _fallback: true });
    }

    if (path === '/api/rules') {
      return jsonResponse({ rules: getMockRules() });
    }

    // 404
    return jsonResponse({ error: '端點不存在', path }, 404);
  },
};
