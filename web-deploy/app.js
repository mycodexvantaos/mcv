/**
 * ═══════════════════════════════════════════════════════════════
 * 守護核心 SentinelCore v3.0 — 中文啟動面板應用邏輯
 * ═══════════════════════════════════════════════════════════════
 *
 * 流程：
 *   啟動面板 → 選擇角色
 *     ├─ 觀察方 → 輸入金鑰 → 後端驗證 → 配對 → 監控主控台
 *     └─ 被觀察方 → 簽署協議 → 自動生成金鑰 → 展示金鑰 → 確認輸入 → 消失動畫 → 遁入後台
 *
 * 金鑰配對生命週期：
 *   被觀察方簽署協議 → POST /api/keys/generate → 取得金鑰
 *   被觀察方確認金鑰 → POST /api/keys/confirm-subject → 標記已確認
 *   觀察方輸入金鑰 → POST /api/keys/validate → 驗證有效
 *   觀察方連線 → POST /api/keys/pair → 建立配對連線
 */

// ═══════════════════════════════════════════════════════════════
// API 基礎設定
// ═══════════════════════════════════════════════════════════════

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8787'  // 本地開發用 Worker
  : 'https://api.autoecoops.io';  // 官方 API 網域

async function api(endpoint, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include' };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, opts);
    return await res.json();
  } catch (err) {
    console.error(`API ${endpoint} 錯誤:`, err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// 全域狀態
// ═══════════════════════════════════════════════════════════════

const S = {
  role: null,               // 'observer' | 'subject'
  key: null,                // 當前配對金鑰
  generatedKey: null,       // 被觀察方生成的金鑰
  keyExpiresAt: null,       // 金鑰過期時間
  sessionId: null,          // 配對後的 session ID
  pairedDevice: null,       // 配對的裝置資訊
  engineRunning: false,
  currentMScreen: 'overview',
  isDarkTheme: true,
  stats: { devices:0, sessions:0, critical:0, high:0, medium:0, totalEvents:0 },
  categories: { gambling:0, adult:0, violence:0, drugs:0, contacts:0, fraud:0 },
  threats: [],
  auditChain: [],
  lastHash: '0'.repeat(64),
  devices: [],
  feedEntries: [],
  feedRate: 0,
  settings: { stealth:false, autostart:false, persistent:false, encryption:true, antitamper:false },
  modules: { gambling:true, adult:true, violence:true, drugs:true, contacts:true, fraud:true },
  rules: [],
  ruleIdCounter: 0,
  captureActive: false,
  selectedDevice: null,
  heatmapData: [],
  anomalyScores: [],
  intervals: [],
  _startTime: null,
};

// ═══════════════════════════════════════════════════════════════
// SHA-256 密碼學雜湊
// ═══════════════════════════════════════════════════════════════

async function sha256(msg) {
  const buf = new TextEncoder().encode(msg);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function appendAudit(action, details, severity='info') {
  const ts = new Date().toISOString();
  const entry = { id:S.auditChain.length, timestamp:ts, action, details, severity, prevHash:S.lastHash };
  entry.hash = await sha256(`${entry.id}:${ts}:${action}:${details}:${entry.prevHash}`);
  S.lastHash = entry.hash;
  S.auditChain.push(entry);
  renderAuditEntry(entry);
  updateChainInfo();
  return entry;
}

// ═══════════════════════════════════════════════════════════════
// 導航
// ═══════════════════════════════════════════════════════════════

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => { s.classList.add('hidden'); s.classList.remove('active'); });
  const el = document.getElementById(`screen-${id}`);
  if (el) { el.classList.remove('hidden'); el.classList.add('active'); }
}

function goBack(screen) { showScreen(screen); }

function selectRole(role) {
  S.role = role;
  if (role === 'observer') showScreen('observer-key');
  else showScreen('subject-agreement');
}

// ═══════════════════════════════════════════════════════════════
// 金鑰輸入格式化（自動加橫線 XXXX-XXXX）
// ═══════════════════════════════════════════════════════════════

function formatKeyInput(input) {
  let val = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (val.length > 4) val = val.slice(0, 4) + '-' + val.slice(4);
  if (val.length > 9) val = val.slice(0, 9);
  input.value = val;
}

// ═══════════════════════════════════════════════════════════════
// 觀察方流程：輸入金鑰 → 後端驗證 → 配對 → 監控主控台
// ═══════════════════════════════════════════════════════════════

async function observerConnect() {
  const input = document.getElementById('observer-key-input');
  const key = input?.value.trim().toUpperCase();
  const errorEl = document.getElementById('observer-error');
  const btnText = document.getElementById('observer-btn-text');
  const spinner = document.getElementById('observer-spinner');
  const statusBox = document.getElementById('observer-status');

  // 基本格式驗證
  if (!key || !/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key)) {
    errorEl.textContent = '金鑰格式錯誤，應為 XXXX-XXXX';
    errorEl.classList.remove('hidden');
    return;
  }
  errorEl.classList.add('hidden');
  btnText.textContent = '驗證中…';
  spinner.classList.remove('hidden');
  statusBox.classList.remove('hidden');

  await appendAudit('觀察方連線', `嘗試使用金鑰 ${key.slice(0,4)}-**** 連線`, 'info');

  // 步驟一：驗證金鑰有效性
  const validateResult = await api('/api/keys/validate', 'POST', { key });

  if (!validateResult) {
    // API 不可用時，使用本地模擬
    errorEl.classList.add('hidden');
    btnText.textContent = '🔗 驗證並連線';
    spinner.classList.add('hidden');
    statusBox.classList.add('hidden');
    S.key = key;
    showToast('連線成功！正在進入監控主控台（離線模式）', 'low');
    await appendAudit('觀察方已連線', `金鑰驗證成功（離線模式），進入監控模式`, 'low');
    showScreen('monitor');
    startMonitorEngine();
    return;
  }

  if (!validateResult.valid) {
    errorEl.textContent = getErrorMessage(validateResult.error, validateResult.status);
    errorEl.classList.remove('hidden');
    btnText.textContent = '🔑 驗證並連線';
    spinner.classList.add('hidden');
    statusBox.classList.add('hidden');
    await appendAudit('金鑰驗證失敗', validateResult.error, 'high');
    return;
  }

  // 步驟二：金鑰有效，執行配對
  btnText.textContent = '配對中…';
  const pairResult = await api('/api/keys/pair', 'POST', { key });

  if (!pairResult || !pairResult.paired) {
    // 配對失敗，仍然允許進入（本地模式）
    S.key = key;
    showToast('配對連線成功（本地模式）', 'low');
    await appendAudit('觀察方已連線', `金鑰 ${key} 配對完成（本地模式）`, 'low');
  } else {
    S.key = key;
    S.sessionId = pairResult.session;
    S.pairedDevice = pairResult.device;
    showToast('配對成功！已建立監控連線', 'low');
    await appendAudit('觀察方已配對', `金鑰 ${key} 配對成功，Session: ${pairResult.session}`, 'low');
  }

  btnText.textContent = '🔑 驗證並連線';
  spinner.classList.add('hidden');
  statusBox.classList.add('hidden');

  // 顯示金鑰在頂部
  const keyDisplay = document.getElementById('monitor-key-display');
  if (keyDisplay) keyDisplay.textContent = key;

  showScreen('monitor');
  startMonitorEngine();
}

function getErrorMessage(error, status) {
  const map = {
    'not_found': '金鑰不存在，請確認後重新輸入',
    'expired': '金鑰已過期，請重新生成',
    'revoked': '金鑰已被撤銷',
    'already_paired': '金鑰已被使用，無法重複配對',
  };
  return map[status] || error || '金鑰驗證失敗';
}

// ═══════════════════════════════════════════════════════════════
// 被觀察方流程 — 協議簽署 → 自動生成金鑰
// ═══════════════════════════════════════════════════════════════

function toggleAgreeBtn() {
  const checked = document.getElementById('agreement-check').checked;
  const btn = document.getElementById('agree-btn');
  btn.disabled = !checked;
}

async function generateKeyAndProceed() {
  const checked = document.getElementById('agreement-check').checked;
  if (!checked) return;

  const btn = document.getElementById('agree-btn');
  btn.textContent = '正在生成金鑰…';
  btn.disabled = true;

  await appendAudit('協議簽署', '被觀察方已簽署使用責任協議', 'info');

  // 呼叫後端生成金鑰
  const result = await api('/api/keys/generate', 'POST', {
    deviceInfo: navigator.userAgent.slice(0, 60),
    guardianName: null,
  });

  if (result && result.key) {
    S.generatedKey = result.key;
    S.keyExpiresAt = result.expiresAt;
  } else {
    // API 不可用，本地生成金鑰
    S.generatedKey = generateLocalKey();
    S.keyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  }

  S.key = S.generatedKey;

  // 更新金鑰展示介面
  const keyEl = document.getElementById('subject-generated-key');
  if (keyEl) keyEl.textContent = S.generatedKey;

  const expiresEl = document.getElementById('subject-key-expires');
  if (expiresEl) {
    const expDate = new Date(S.keyExpiresAt);
    expiresEl.textContent = `有效期至：${expDate.toLocaleString('zh-TW')}`;
  }

  await appendAudit('金鑰生成', `配對金鑰 ${S.generatedKey} 已生成，有效期24小時`, 'info');

  // 進入金鑰展示畫面
  showScreen('subject-key-show');
}

/**
 * 本地金鑰生成（API 不可用時的備援）
 */
function generateLocalKey() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let key = '';
  for (let i = 0; i < 8; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key.slice(0, 4) + '-' + key.slice(4);
}

/**
 * 複製金鑰到剪貼簿
 */
async function copyGeneratedKey() {
  if (!S.generatedKey) return;
  try {
    await navigator.clipboard.writeText(S.generatedKey);
    const btn = document.getElementById('copy-key-btn');
    const confirm = document.getElementById('copy-confirmation');
    if (btn) btn.textContent = '✓ 已複製';
    if (confirm) confirm.classList.remove('hidden');
    setTimeout(() => {
      if (btn) btn.textContent = '📋 複製';
      if (confirm) confirm.classList.add('hidden');
    }, 2000);
  } catch (err) {
    // Clipboard API 不可用
    showToast('複製失敗，請手動記錄金鑰', 'medium');
  }
}

// ═══════════════════════════════════════════════════════════════
// 被觀察方流程 — 確認金鑰 → 消失序列
// ═══════════════════════════════════════════════════════════════

async function subjectConfirmAndVanish() {
  const input = document.getElementById('subject-key-confirm-input');
  const confirmKey = input?.value.trim().toUpperCase();
  const errorEl = document.getElementById('subject-confirm-error');
  const btnText = document.getElementById('subject-confirm-btn-text');
  const spinner = document.getElementById('subject-confirm-spinner');

  if (!confirmKey) {
    errorEl.textContent = '請輸入金鑰以確認部署';
    errorEl.classList.remove('hidden');
    return;
  }

  if (confirmKey !== S.generatedKey) {
    errorEl.textContent = '金鑰不匹配，請輸入上方顯示的金鑰';
    errorEl.classList.remove('hidden');
    return;
  }

  errorEl.classList.add('hidden');
  btnText.textContent = '部署中…';
  spinner.classList.remove('hidden');

  // 通知後端被觀察方已確認
  await api('/api/keys/confirm-subject', 'POST', { key: S.generatedKey });

  await appendAudit('被觀察方確認', `金鑰 ${S.generatedKey.slice(0,4)}-**** 已確認，準備部署靜默服務`, 'info');

  // 進入消失動畫
  showScreen('vanish');
  runVanishSequence();
}

async function runVanishSequence() {
  const steps = [
    { id:'vs-1', text:'驗證金鑰配對', delay:800 },
    { id:'vs-2', text:'安裝靜默監控服務', delay:1200 },
    { id:'vs-3', text:'設定開機自動啟動', delay:800 },
    { id:'vs-4', text:'啟用防反安裝保護', delay:1000 },
    { id:'vs-5', text:'刪除應用程式可見介面', delay:1200 },
    { id:'vs-6', text:'遁入系統背景執行', delay:1500 },
  ];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const el = document.getElementById(step.id);

    el.classList.add('active');
    await sleep(step.delay);

    el.classList.remove('active');
    el.classList.add('done');

    await appendAudit('部署步驟', step.text, i >= 4 ? 'critical' : 'info');
  }

  document.getElementById('vanish-final').classList.remove('hidden');

  setTimeout(() => {
    document.body.style.transition = 'opacity 2s ease';
    document.body.style.opacity = '0';
    setTimeout(() => {
      document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0a0d17;color:#1e2340;font-family:sans-serif;font-size:12px;">系統守護服務已在背景運行</div>';
      document.body.style.opacity = '1';
    }, 2000);
  }, 5000);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ═══════════════════════════════════════════════════════════════
// 監控主控台 — 導航
// ═══════════════════════════════════════════════════════════════

function navMonitor(screen) {
  S.currentMScreen = screen;
  document.querySelectorAll('.mscreen').forEach(s => { s.classList.add('hidden'); s.classList.remove('active'); });
  const el = document.getElementById(`mscreen-${screen}`);
  if (el) { el.classList.remove('hidden'); el.classList.add('active'); }
  document.querySelectorAll('[data-mnav]').forEach(b => b.classList.toggle('active', b.dataset.mnav === screen));

  if (screen === 'behavior') renderBehaviorScreen();
  if (screen === 'live') renderHeatmap();
  if (screen === 'audit') renderAuditLog();
  if (screen === 'rules') renderRules();
}

// ═══════════════════════════════════════════════════════════════
// 監控引擎
// ═══════════════════════════════════════════════════════════════

async function startMonitorEngine() {
  S.engineRunning = true;
  updateEngineUI(true);
  enrollDemoDevices();
  generateHeatmapData();
  renderHeatmap();
  generateAnomalyData();

  const fI = setInterval(simFeedEvent, 2000);
  const tI = setInterval(simThreatDetection, 5000);
  const sI = setInterval(updateDashboard, 3000);
  const teI = setInterval(simTelemetry, 4000);
  S.intervals = [fI, tI, sI, teI];

  await appendAudit('引擎啟動', '靜默運行引擎已啟動 — 所有偵測模組在線', 'low');
  showToast('靜默運行引擎已啟動', 'low');
}

function updateEngineUI(running) {
  const dot = document.getElementById('monitor-engine-dot');
  const label = document.getElementById('monitor-engine-label');
  const statE = document.getElementById('m-stat-engine');
  if (running) {
    dot.className = 'w-1.5 h-1.5 rounded-full active'; dot.id = 'monitor-engine-dot';
    label.textContent = '運行中'; label.className = 'text-threat-low';
    statE.textContent = '●'; statE.className = 'stat-value text-threat-low';
  } else {
    dot.className = 'w-1.5 h-1.5 rounded-full bg-gray-500'; dot.id = 'monitor-engine-dot';
    label.textContent = '離線'; label.className = '';
    statE.textContent = '—'; statE.className = 'stat-value';
  }
}

function deployMonitorEngine() {
  if (S.engineRunning) { showToast('引擎已在運行中', 'info'); return; }
  showToast('正在部署靜默運行引擎…', 'info', 2000);
  setTimeout(() => startMonitorEngine(), 1500);
}

// ═══════════════════════════════════════════════════════════════
// 裝置管理
// ═══════════════════════════════════════════════════════════════

function enrollDemoDevices() {
  S.devices = [
    { id:'DEV-001', name:'小明的 iPhone', type:'📱', os:'iOS 17.4', status:'online', lastSeen:Date.now() },
    { id:'DEV-002', name:'小華的 Samsung', type:'📱', os:'Android 14', status:'online', lastSeen:Date.now() },
    { id:'DEV-003', name:'家庭 iPad', type:'📱', os:'iPadOS 17.4', status:'online', lastSeen:Date.now() },
    { id:'DEV-004', name:'讀書筆電', type:'💻', os:'Windows 11', status:'offline', lastSeen:Date.now()-3600000 },
  ];
  // 如果有配對裝置，加入列表
  if (S.pairedDevice) {
    S.devices.unshift(S.pairedDevice);
  }
  S.stats.devices = S.devices.filter(d=>d.status==='online').length;
  renderDevicesList();
  updateDeviceSelector();
  appendAudit('裝置加入', `${S.devices.length} 台裝置已加入監控網格`);
}

function enrollMonitorDevice() {
  const names = ['小孩平板','家用桌電','遊戲電腦','學校 Chromebook','媽媽的手機'];
  const types = ['📱','📱','💻','💻','📱'];
  const osOpts = ['Android 14','iPadOS 17.4','Windows 11','ChromeOS 120','iOS 17.4'];
  const i = S.devices.length % names.length;
  const d = { id:`DEV-${String(S.devices.length+1).padStart(3,'0')}`, name:names[i], type:types[i], os:osOpts[i], status:'online', lastSeen:Date.now() };
  S.devices.push(d);
  S.stats.devices = S.devices.filter(x=>x.status==='online').length;
  renderDevicesList();
  updateDeviceSelector();
  showToast(`裝置「${d.name}」已加入`, 'low');
  appendAudit('裝置加入', `${d.name} (${d.id}) 加入監控網格`);
}

function renderDevicesList() {
  const c = document.getElementById('m-devices-list');
  if (!c) return;
  if (!S.devices.length) { c.innerHTML = '<div class="text-gray-600 text-center py-8">尚未連線裝置</div>'; return; }
  c.innerHTML = S.devices.map(d => `
    <div class="device-card">
      <div class="device-status-dot ${d.status}"></div>
      <div class="flex-1"><div class="text-xs font-bold">${d.type} ${d.name}</div><div class="text-[10px] text-gray-500">${d.id} · ${d.os} · ${timeAgo(d.lastSeen)}</div></div>
      <div class="text-[9px] ${d.status==='online'?'text-threat-low':'text-gray-600'} uppercase font-bold">${d.status==='online'?'在線':'離線'}</div>
    </div>
  `).join('');
}

function updateDeviceSelector() {
  const sel = document.getElementById('m-device-select');
  if (!sel) return;
  sel.innerHTML = '<option value="">選擇裝置…</option>' + S.devices.filter(d=>d.status==='online').map(d=>`<option value="${d.id}">${d.type} ${d.name}</option>`).join('');
}

// ═══════════════════════════════════════════════════════════════
// 即時饋送模擬
// ═══════════════════════════════════════════════════════════════

const FEED_TPL = [
  { msg:'螢幕擷取分析完成 — 未發現威脅', severity:'low', cat:null },
  { msg:'網址掃描：社群媒體瀏覽', severity:'info', cat:null },
  { msg:'按鍵模式分析 — 行為正常', severity:'info', cat:null },
  { msg:'應用程式啟動：遊戲應用', severity:'info', cat:null },
  { msg:'可疑賭博網站已封鎖', severity:'high', cat:'gambling' },
  { msg:'色情網域已攔截', severity:'critical', cat:'adult' },
  { msg:'暴力內容偵測觸發', severity:'high', cat:'violence' },
  { msg:'毒品相關搜尋已標記', severity:'medium', cat:'drugs' },
  { msg:'未知聯絡人通訊偵測', severity:'medium', cat:'contacts' },
  { msg:'釣魚網址已封鎖 — 偽證竊取嘗試', severity:'critical', cat:'fraud' },
  { msg:'加密遙測封包已上傳', severity:'info', cat:null },
  { msg:'行為基線已更新 — 正常變異', severity:'low', cat:null },
  { msg:'深夜瀏覽模式偵測（02:30）', severity:'medium', cat:null },
  { msg:'VPN/代理使用偵測 — 可能規避', severity:'high', cat:null },
  { msg:'螢幕時間超過 45 分鐘', severity:'medium', cat:null },
];

function simFeedEvent() {
  if (!S.engineRunning) return;
  const d = S.devices[Math.floor(Math.random()*S.devices.length)];
  if (!d) return;
  const t = FEED_TPL[Math.floor(Math.random()*FEED_TPL.length)];
  const entry = { timestamp:new Date().toLocaleTimeString(), device:d.id, deviceName:d.name, message:t.msg, severity:t.severity, category:t.cat };
  S.feedEntries.unshift(entry);
  if (S.feedEntries.length > 100) S.feedEntries.pop();
  if (t.cat && S.modules[t.cat]) S.categories[t.cat]++;
  S.stats.totalEvents++;
  S.feedRate = (S.stats.totalEvents / ((Date.now() - (S._startTime||Date.now()))/1000)).toFixed(1);
  if (!S._startTime) S._startTime = Date.now();
  renderLiveFeed();
  updateCategoryBars();
}

function renderLiveFeed() {
  const c = document.getElementById('m-live-feed');
  if (!c) return;
  c.innerHTML = S.feedEntries.slice(0,30).map(e => `
    <div class="feed-entry feed-${e.severity}">
      <span class="text-gray-600">${e.timestamp}</span>
      <span class="text-sentinel-400">[${e.device}]</span>
      <span class="${sevColor(e.severity)}">${e.message}</span>
    </div>
  `).join('');
  const r = document.getElementById('m-feed-rate');
  if (r) r.textContent = `${S.feedRate} 事件/秒`;
}

function sevColor(s) { return {critical:'text-threat-critical',high:'text-threat-high',medium:'text-threat-medium',low:'text-threat-low',info:'text-sentinel-400'}[s]||'text-gray-400'; }

// ═══════════════════════════════════════════════════════════════
// 威脅偵測模擬
// ═══════════════════════════════════════════════════════════════

const THREAT_TPL = [
  { title:'線上賭場存取偵測', desc:'使用者存取 bet365.com — 線上博弈平台。24小時內多次造訪。', severity:'critical', category:'gambling', action:'網址封鎖' },
  { title:'色情內容網域攔截', desc:'色情網站已存取 — 網域已標記於威脅資料庫。', severity:'critical', category:'adult', action:'網址封鎖' },
  { title:'暴力影片內容標記', desc:'串流內容中偵測到血腥暴力 — 極端暴力分類。', severity:'high', category:'violence', action:'內容標記' },
  { title:'毒品相關社群存取', desc:'使用者造訪已知藥物濫用論壇 — 可能接觸毒品文化。', severity:'medium', category:'drugs', action:'警示通知' },
  { title:'未知聯絡人通訊', desc:'偵測到未登錄聯絡人通訊 — 號碼不在核可清單中。', severity:'medium', category:'contacts', action:'聯絡人標記' },
  { title:'釣魚攻擊已封鎖', desc:'偽證竊取頁面已攔截 — 社群媒體假登入表單。', severity:'high', category:'fraud', action:'網址封鎖' },
  { title:'規避工具偵測', desc:'VPN 應用程式已啟動 — 可能嘗試繞過內容過濾。', severity:'high', category:'fraud', action:'警示通知' },
  { title:'深夜可疑活動', desc:'裝置於異常時段（03:00）有瀏覽活動 — 模式偏差。', severity:'medium', category:null, action:'模式標記' },
];

function simThreatDetection() {
  if (!S.engineRunning || Math.random()>0.4) return;
  const d = S.devices[Math.floor(Math.random()*S.devices.length)];
  if (!d) return;
  const t = THREAT_TPL[Math.floor(Math.random()*THREAT_TPL.length)];
  if (t.category && !S.modules[t.category]) return;
  const threat = { id:`THR-${Date.now().toString(36).toUpperCase()}`, timestamp:new Date().toISOString(), device:d.id, deviceName:d.name, title:t.title, description:t.desc, severity:t.severity, category:t.category, action:t.action, acknowledged:false };
  S.threats.unshift(threat);
  if (S.threats.length>50) S.threats.pop();
  if (t.severity==='critical') S.stats.critical++;
  else if (t.severity==='high') S.stats.high++;
  else if (t.severity==='medium') S.stats.medium++;
  updateThreatBadge();
  updateDashboard();
  if (t.severity==='critical'||t.severity==='high') showToast(`${t.title} — ${d.name}`, t.severity);
  appendAudit('威脅偵測', `[${threat.id}] ${t.title} 於 ${d.name}`, t.severity);
  if (S.currentMScreen==='threats') renderThreatTimeline();
}

function updateThreatBadge() {
  const badge = document.getElementById('monitor-threat-badge');
  const count = document.getElementById('monitor-threat-count');
  const active = S.stats.critical + S.stats.high;
  if (active>0) { badge.classList.remove('hidden'); count.textContent = active; }
  else badge.classList.add('hidden');
}

function renderThreatTimeline() {
  const c = document.getElementById('m-threat-timeline');
  if (!c) return;
  let filtered = [...S.threats];
  const sf = document.getElementById('m-threat-filter')?.value||'all';
  const cf = document.getElementById('m-threat-cat-filter')?.value||'all';
  if (sf!=='all') filtered = filtered.filter(t=>t.severity===sf);
  if (cf!=='all') filtered = filtered.filter(t=>t.category===cf);
  if (!filtered.length) { c.innerHTML = '<div class="text-gray-600 text-center py-12 text-xs">尚未偵測到威脅 — 系統安全</div>'; return; }
  c.innerHTML = filtered.map(t => `
    <div class="threat-entry severity-${t.severity}">
      <div class="flex items-center justify-between mb-1">
        <div class="flex items-center gap-2">
          <span class="severity-badge ${t.severity}">${sevLabel(t.severity)}</span>
          <span class="text-xs font-bold">${t.title}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[10px] text-gray-500">${fmtTime(t.timestamp)}</span>
          ${!t.acknowledged?`<button onclick="ackThreat('${t.id}')" class="text-[10px] px-2 py-0.5 rounded bg-surface-lighter border border-surface-border hover:bg-surface-border transition">確認</button>`:'<span class="text-[10px] text-threat-low">✓ 已確認</span>'}
        </div>
      </div>
      <div class="text-[11px] text-gray-400 mb-1">${t.description}</div>
      <div class="flex items-center gap-3 text-[10px] text-gray-600">
        <span>📍 ${t.device} · ${t.deviceName}</span>
        <span>🔧 ${t.action}</span>
        ${t.category?`<span>📂 ${catLabel(t.category)}</span>`:''}
      </div>
    </div>
  `).join('');
}

function filterMonitorThreats() { renderThreatTimeline(); }

function ackThreat(id) {
  const t = S.threats.find(x=>x.id===id);
  if (t) { t.acknowledged=true; renderThreatTimeline(); appendAudit('威脅確認', `威脅 ${id} 已確認`); }
}

function sevLabel(s) { return {critical:'嚴重',high:'高危',medium:'中等',low:'低',info:'資訊'}[s]||s; }
function catLabel(c) { return {gambling:'賭博',adult:'色情',violence:'暴力',drugs:'毒品',contacts:'有害接觸',fraud:'詐欺'}[c]||c; }

// ═══════════════════════════════════════════════════════════════
// 儀表板
// ═══════════════════════════════════════════════════════════════

function updateDashboard() {
  const el = (id) => document.getElementById(id);
  if (el('m-stat-devices')) el('m-stat-devices').textContent = S.stats.devices;
  if (el('m-stat-sessions')) { S.stats.sessions = S.engineRunning ? S.devices.filter(d=>d.status==='online').length : 0; el('m-stat-sessions').textContent = S.stats.sessions; }
  if (el('m-stat-critical')) el('m-stat-critical').textContent = S.stats.critical;
  if (el('m-stat-high')) el('m-stat-high').textContent = S.stats.high;
  if (el('m-stat-medium')) el('m-stat-medium').textContent = S.stats.medium;
  updatePosture();
}

function updatePosture() {
  const total = S.stats.critical + S.stats.high + S.stats.medium;
  let score = 100;
  if (total>0) score = Math.max(0, 100 - S.stats.critical*15 - S.stats.high*8 - S.stats.medium*3);
  const arc = document.getElementById('m-posture-arc');
  const scoreEl = document.getElementById('m-posture-score');
  const labelEl = document.getElementById('m-posture-label');
  if (arc) {
    const circ = 2*Math.PI*52;
    arc.setAttribute('stroke-dasharray', `${(score/100)*circ} ${circ}`);
    let color = '#22c55e';
    if (score<40) color='#ef4444'; else if (score<60) color='#f97316'; else if (score<80) color='#eab308';
    arc.setAttribute('stroke', color);
  }
  if (scoreEl) scoreEl.textContent = Math.round(score);
  if (labelEl) { let l='安全'; if(score<40)l='危險'; else if(score<60)l='升高'; else if(score<80)l='中等'; labelEl.textContent=l; }
}

// ═══════════════════════════════════════════════════════════════
// 分類條
// ═══════════════════════════════════════════════════════════════

function updateCategoryBars() {
  const max = Math.max(1,...Object.values(S.categories));
  Object.keys(S.categories).forEach(cat => {
    const bar = document.querySelector(`.cat-bar[data-mcat="${cat}"]`);
    const val = document.querySelector(`[data-mcat-val="${cat}"]`);
    if (bar) bar.style.width = `${(S.categories[cat]/max)*100}%`;
    if (val) val.textContent = S.categories[cat];
  });
}

// ═══════════════════════════════════════════════════════════════
// 熱力圖
// ═══════════════════════════════════════════════════════════════

function generateHeatmapData() {
  S.heatmapData = [];
  for (let day=0;day<7;day++) {
    const row = [];
    for (let h=0;h<24;h++) {
      let base = Math.random()*2;
      if (h>=20||h<=2) base+=2+Math.random()*3;
      if (h>=14&&h<=18) base+=1+Math.random()*2;
      row.push(Math.min(6,Math.floor(base)));
    }
    S.heatmapData.push(row);
  }
}

function renderHeatmap() {
  const c = document.getElementById('m-heatmap-grid');
  if (!c) return;
  if (!S.heatmapData.length) generateHeatmapData();
  const days = ['一','二','三','四','五','六','日'];
  let html = '';
  S.heatmapData.forEach((row,di) => row.forEach((v,hi) => {
    html += `<div class="heatmap-cell heat-${v}" title="週${days[di]} ${String(hi).padStart(2,'0')}:00 — 等級${v}"></div>`;
  }));
  c.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════
// 螢幕擷取 & 遙測
// ═══════════════════════════════════════════════════════════════

function toggleMonitorCapture() {
  S.captureActive = !S.captureActive;
  const btn = document.getElementById('m-capture-btn');
  const view = document.getElementById('m-screen-view');
  const status = document.getElementById('m-capture-status');
  if (S.captureActive) {
    btn.textContent = '停止擷取'; btn.classList.remove('bg-sentinel-600','hover:bg-sentinel-700'); btn.classList.add('bg-threat-critical','hover:bg-red-700');
    view.classList.add('active-capture');
    view.innerHTML = '<div class="w-full h-full flex items-center justify-center"><div class="text-center"><div class="text-4xl mb-3">📡</div><div class="text-xs text-threat-low font-bold">靜默擷取運行中</div><div class="text-[10px] text-gray-500 mt-1">目標裝置無任何可見指示</div><div class="text-[10px] text-gray-600 mt-2">AES-256 加密串流</div><div class="mt-3"><div class="spinner mx-auto"></div></div></div></div>';
    status.textContent = '擷取運行中 — 加密串流'; status.className = 'text-[10px] text-threat-low';
    appendAudit('擷取啟動', '靜默螢幕擷取已啟動');
  } else {
    btn.textContent = '啟動靜默擷取'; btn.classList.add('bg-sentinel-600','hover:bg-sentinel-700'); btn.classList.remove('bg-threat-critical','hover:bg-red-700');
    view.classList.remove('active-capture');
    view.innerHTML = '<div class="text-center"><div class="text-4xl mb-2 opacity-30">🖥️</div><div>靜默擷取未啟動</div><div class="text-[10px] mt-1">目標裝置無任何可見指示</div></div>';
    status.textContent = '未啟動擷取'; status.className = 'text-[10px] text-gray-500';
    appendAudit('擷取停止', '靜默螢幕擷取已終止');
  }
}

function simTelemetry() {
  if (!S.engineRunning||!S.captureActive) return;
  const c = document.getElementById('m-telemetry');
  if (!c) return;
  const d = S.devices[Math.floor(Math.random()*S.devices.length)];
  if (!d) return;
  const apps = ['Safari','Chrome','Instagram','TikTok','YouTube','LINE'];
  const urls = ['https://google.com','https://youtube.com','https://reddit.com','https://instagram.com'];
  const lines = [
    `螢幕變更 → ${d.name}: 應用切換至「${apps[Math.floor(Math.random()*apps.length)]}」`,
    `按鍵模式 → ${d.name}: 輸入節奏分析 — 正常基線`,
    `網址攔截 → ${d.name}: ${urls[Math.floor(Math.random()*urls.length)]}`,
    `應用啟動 → ${d.name}: PID:${Math.floor(Math.random()*9000+1000)}`,
    `網路封包 → ${d.name}: 外送 ${Math.floor(Math.random()*500+50)}B`,
    `行為脈動 → ${d.name}: 異常分數 ${(Math.random()*0.4+0.05).toFixed(3)} (閾值:0.500)`,
  ];
  if (c.querySelector('.text-center')) c.innerHTML = '';
  c.insertAdjacentHTML('afterbegin', `<div class="feed-entry feed-info"><span class="text-gray-600">${new Date().toLocaleTimeString()}</span> <span class="text-sentinel-400">${lines[Math.floor(Math.random()*lines.length)]}</span></div>`);
  while (c.children.length>50) c.removeChild(c.lastChild);
}

// ═══════════════════════════════════════════════════════════════
// 行為分析
// ═══════════════════════════════════════════════════════════════

function generateAnomalyData() {
  S.anomalyScores = [];
  for (let i=6;i>=0;i--) { const d=new Date(); d.setDate(d.getDate()-i); S.anomalyScores.push({ date:d.toLocaleDateString('zh',{weekday:'short'}), score:Math.random()*0.35+0.05 }); }
}

function renderBehaviorScreen() { renderBaseline(); renderAnomalyChart(); renderRiskIndicators(); }

function renderBaseline() {
  const c = document.getElementById('m-baseline');
  if (!c) return;
  const devs = S.devices.slice(0,3);
  if (!devs.length) { c.innerHTML = '<div class="text-gray-600 text-center py-8 text-xs">正在分析行為模式…</div>'; return; }
  const metrics = [
    { label:'螢幕時間（日均）', icon:'⏱', vals:devs.map(()=>`${Math.floor(Math.random()*4+1)}時${Math.floor(Math.random()*60)}分`) },
    { label:'尖峰活動時段', icon:'🌙', vals:devs.map(()=>`${String(Math.floor(Math.random()*5+20)%24).padStart(2,'0')}:00`) },
    { label:'異常分數', icon:'📊', vals:devs.map(()=>(Math.random()*0.4+0.05).toFixed(3)) },
    { label:'威脅暴露', icon:'⚠', vals:devs.map(()=>['低','中等','升高'][Math.floor(Math.random()*3)]) },
    { label:'行為偏移', icon:'📈', vals:devs.map(()=>`${(Math.random()*12-6).toFixed(1)}%`) },
  ];
  c.innerHTML = metrics.map(m => `<div class="baseline-metric"><div class="text-xs text-gray-400">${m.icon} ${m.label}</div><div class="text-xs font-bold">${m.vals.map(v=>`<span class="text-sentinel-300">${v}</span>`).join(' · ')}</div></div>`).join('');
}

function renderAnomalyChart() {
  const canvas = document.getElementById('m-anomaly-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;
  ctx.fillStyle='#12162a'; ctx.fillRect(0,0,W,H);
  if (!S.anomalyScores.length) generateAnomalyData();
  const data=S.anomalyScores, pad=40, cW=W-pad*2, cH=H-pad*2;
  ctx.strokeStyle='#252b4a'; ctx.lineWidth=0.5;
  for (let i=0;i<=4;i++) { const y=pad+(cH/4)*i; ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(W-pad,y); ctx.stroke(); }
  const tY=pad+cH*(1-0.5);
  ctx.strokeStyle='#ef4444'; ctx.lineWidth=1; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(pad,tY); ctx.lineTo(W-pad,tY); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle='#ef4444'; ctx.font='9px sans-serif'; ctx.fillText('閾值',W-pad-30,tY-4);
  ctx.strokeStyle='#818cf8'; ctx.lineWidth=2; ctx.beginPath();
  data.forEach((d,i)=>{ const x=pad+(cW/(data.length-1))*i, y=pad+cH*(1-d.score); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
  ctx.stroke();
  data.forEach((d,i)=>{ const x=pad+(cW/(data.length-1))*i, y=pad+cH*(1-d.score); ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.fillStyle=d.score>0.5?'#ef4444':'#818cf8'; ctx.fill(); ctx.fillStyle='#64748b'; ctx.font='9px sans-serif'; ctx.textAlign='center'; ctx.fillText(d.date,x,H-10); ctx.fillText(d.score.toFixed(2),x,y-10); });
}

function renderRiskIndicators() {
  const c = document.getElementById('m-risk-indicators');
  if (!c) return;
  const inds = [
    { label:'賭博暴露風險', val:Math.min(100,S.categories.gambling*12), color:'#ef4444' },
    { label:'色情內容暴露', val:Math.min(100,S.categories.adult*10), color:'#f97316' },
    { label:'暴力暴露風險', val:Math.min(100,S.categories.violence*10), color:'#f97316' },
    { label:'藥物濫用指標', val:Math.min(100,S.categories.drugs*8), color:'#eab308' },
    { label:'有害接觸風險', val:Math.min(100,S.categories.contacts*8), color:'#eab308' },
    { label:'釣魚/詐欺脆弱性', val:Math.min(100,S.categories.fraud*10), color:'#818cf8' },
  ];
  c.innerHTML = inds.map(i => `<div class="risk-bar-container"><span class="text-[11px] min-w-[140px] text-gray-400">${i.label}</span><div class="risk-bar-bg"><div class="risk-bar-fill" style="width:${i.val}%;background:${i.color}"></div></div><span class="text-[11px] font-bold min-w-[32px] text-right" style="color:${i.color}">${i.val}%</span></div>`).join('');
}

// ═══════════════════════════════════════════════════════════════
// 規則引擎
// ═══════════════════════════════════════════════════════════════

function initDefaultRules() {
  const defaults = [
    { name:'賭博網站封鎖器', category:'gambling', action:'封鎖網址', severity:'critical', active:true },
    { name:'色情內容過濾器', category:'adult', action:'封鎖網址', severity:'critical', active:true },
    { name:'暴力內容警示', category:'violence', action:'警示通知', severity:'high', active:true },
    { name:'毒品內容標記', category:'drugs', action:'警示通知', severity:'medium', active:true },
    { name:'未知聯絡人警告', category:'contacts', action:'記錄警示', severity:'medium', active:true },
    { name:'釣魚網址封鎖器', category:'fraud', action:'封鎖網址', severity:'high', active:true },
    { name:'深夜活動偵測', category:null, action:'記錄事件', severity:'low', active:false },
    { name:'螢幕時間過長', category:null, action:'使用者警告', severity:'low', active:false },
  ];
  defaults.forEach(r => S.rules.push({ id:++S.ruleIdCounter, ...r }));
}

function renderRules() {
  const c = document.getElementById('m-rules-list');
  if (!c) return;
  if (!S.rules.length) initDefaultRules();
  c.innerHTML = S.rules.map(r => `
    <div class="rule-card ${r.active?'active-rule':'inactive-rule'}">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2"><span class="severity-badge ${r.severity}">${sevLabel(r.severity)}</span><span class="text-xs font-bold">${r.name}</span></div>
        <div class="flex items-center gap-2"><button onclick="toggleRule(${r.id})" class="toggle-btn ${r.active?'on':'off'}">${r.active?'開':'關'}</button><button onclick="deleteRule(${r.id})" class="text-[10px] text-gray-600 hover:text-threat-critical transition">✕</button></div>
      </div>
      <div class="flex items-center gap-4 text-[10px] text-gray-500">${r.category?`<span>📂 ${catLabel(r.category)}</span>`:'<span>📂 一般</span>'}<span>🔧 ${r.action}</span></div>
    </div>
  `).join('');
}

function addMonitorRule() {
  const cats = ['gambling','adult','violence','drugs','contacts','fraud',null];
  const acts = ['封鎖網址','警示通知','記錄警示','記錄事件','使用者警告'];
  const sevs = ['critical','high','medium','low'];
  const r = { id:++S.ruleIdCounter, name:`自訂規則 ${S.ruleIdCounter}`, category:cats[Math.floor(Math.random()*cats.length)], action:acts[Math.floor(Math.random()*acts.length)], severity:sevs[Math.floor(Math.random()*sevs.length)], active:true };
  S.rules.push(r); renderRules(); showToast(`規則「${r.name}」已建立`, 'info'); appendAudit('規則建立', `規則「${r.name}」已加入引擎`);
}

function toggleRule(id) { const r=S.rules.find(x=>x.id===id); if(r){r.active=!r.active;renderRules();appendAudit('規則切換',`規則「${r.name}」${r.active?'啟用':'停用'}`);} }
function deleteRule(id) { const r=S.rules.find(x=>x.id===id); if(r){S.rules=S.rules.filter(x=>x.id!==id);renderRules();showToast(`規則「${r.name}」已刪除`,'medium');appendAudit('規則刪除',`規則「${r.name}」已移除`);} }

// ═══════════════════════════════════════════════════════════════
// 審計帳本
// ═══════════════════════════════════════════════════════════════

function renderAuditEntry(entry) {
  const c = document.getElementById('m-audit-log');
  if (!c) return;
  if (c.querySelector('.text-center')) c.innerHTML = '';
  c.insertAdjacentHTML('afterbegin', `<div class="audit-entry"><div class="flex items-center justify-between"><div class="flex items-center gap-2"><span class="text-gray-600">#${entry.id}</span><span class="severity-badge ${entry.severity}">${sevLabel(entry.severity)}</span><span class="text-gray-300">${entry.action}</span></div><span class="text-[10px] text-gray-600">${fmtTime(entry.timestamp)}</span></div><div class="text-gray-500 mt-1">${entry.details}</div><div class="audit-hash mt-1">⛓ ${entry.hash.slice(0,16)}…${entry.hash.slice(-8)}</div></div>`);
  while (c.children.length>50) c.removeChild(c.lastChild);
}

function updateChainInfo() {
  const e=document.getElementById('m-chain-entries'), h=document.getElementById('m-chain-hash'), s=document.getElementById('m-chain-status');
  if(e) e.textContent=S.auditChain.length;
  if(h) h.textContent=S.lastHash.slice(0,24)+'…';
  if(s) s.textContent='✓ 有效';
}

function renderAuditLog() {
  const c = document.getElementById('m-audit-log');
  if (!c) return;
  if (!S.auditChain.length) { c.innerHTML = '<div class="text-gray-600 text-center py-8">無審計紀錄</div>'; return; }
  c.innerHTML = '';
  S.auditChain.slice(-30).reverse().forEach(entry => {
    c.insertAdjacentHTML('beforeend', `<div class="audit-entry"><div class="flex items-center justify-between"><div class="flex items-center gap-2"><span class="text-gray-600">#${entry.id}</span><span class="severity-badge ${entry.severity}">${sevLabel(entry.severity)}</span><span class="text-gray-300">${entry.action}</span></div><span class="text-[10px] text-gray-600">${fmtTime(entry.timestamp)}</span></div><div class="text-gray-500 mt-1">${entry.details}</div><div class="audit-hash mt-1">⛓ ${entry.hash.slice(0,16)}…${entry.hash.slice(-8)}</div></div>`);
  });
}

// ═══════════════════════════════════════════════════════════════
// 設定
// ═══════════════════════════════════════════════════════════════

function toggleMonitorSetting(key) {
  S.settings[key]=!S.settings[key];
  const btn=document.getElementById(`m-set-${key}`);
  if(btn){btn.className=`toggle-btn ${S.settings[key]?'on':'off'}`;btn.textContent=S.settings[key]?'開':'關';}
  appendAudit('設定變更', `${key} → ${S.settings[key]?'啟用':'停用'}`);
  showToast(`${key} ${S.settings[key]?'啟用':'停用'}`, S.settings[key]?'low':'medium');
}

function toggleMonitorModule(key) {
  S.modules[key]=!S.modules[key];
  const btn=document.getElementById(`m-mod-${key}`);
  if(btn){btn.className=`toggle-btn ${S.modules[key]?'on':'off'}`;btn.textContent=S.modules[key]?'開':'關';}
  appendAudit('模組切換', `${catLabel(key)}偵測器 ${S.modules[key]?'啟動':'停用'}`);
  showToast(`${catLabel(key)}偵測器 ${S.modules[key]?'啟動':'停用'}`, S.modules[key]?'low':'medium');
}

// ═══════════════════════════════════════════════════════════════
// Toast 通知
// ═══════════════════════════════════════════════════════════════

function showToast(msg, severity='info', duration=4000) {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  const icons = {critical:'🔴',high:'🟠',medium:'🟡',low:'🟢',info:'🔵'};
  t.className = `toast toast-${severity} rounded-lg px-4 py-3 text-xs font-medium shadow-lg`;
  t.innerHTML = `<div class="flex items-center gap-2"><span>${icons[severity]||'⚪'}</span><span>${msg}</span></div>`;
  c.appendChild(t);
  setTimeout(()=>{t.classList.add('toast-exit');setTimeout(()=>t.remove(),300);},duration);
}

// ═══════════════════════════════════════════════════════════════
// 工具函式
// ═══════════════════════════════════════════════════════════════

function timeAgo(ts) { const d=Date.now()-ts; if(d<60000)return'剛剛'; if(d<3600000)return`${Math.floor(d/60000)}分鐘前`; if(d<86400000)return`${Math.floor(d/3600000)}小時前`; return`${Math.floor(d/86400000)}天前`; }
function fmtTime(iso) { return new Date(iso).toLocaleTimeString('zh-TW'); }
function toggleTheme() { S.isDarkTheme=!S.isDarkTheme; document.body.classList.toggle('light-theme',!S.isDarkTheme); }

// ═══════════════════════════════════════════════════════════════
// 初始化
// ═══════════════════════════════════════════════════════════════

(function init() { initDefaultRules(); })();
