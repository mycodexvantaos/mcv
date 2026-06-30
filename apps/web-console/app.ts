/**
 * @module apps/web-console
 * @description Admin console Single Page Application for MyCodeXvantaOS.
 *
 * This is a static-site admin dashboard that talks to the api-worker.
 * It is built with vanilla HTML/CSS/JS (no framework) to keep the
 * dependency surface minimal. The output can be deployed to Cloudflare
 * Pages or served from R2.
 *
 * Features:
 *   - Service catalog overview (8 categories)
 *   - Workspace management
 *   - Knowledge collection browser + search
 *   - Agent session inspector
 *   - Audit event viewer with integrity chain verification
 *   - Usage metering dashboard
 *   - Automation job queue monitor
 */

// ── Configuration ──────────────────────────────────────────────────────

const API_BASE = (globalThis as Record<string, unknown>).API_BASE ?? "/api/v1";

// ── API Client ─────────────────────────────────────────────────────────

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

async function api<T>(
  path: string,
  options?: RequestInit & { token?: string }
): Promise<ApiResponse<T>> {
  const { token, ...init } = options ?? {};
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
    const body = (await res.json()) as T;
    return { data: body, status: res.status };
  } catch (err) {
    return { error: (err as Error).message, status: 500 };
  }
}

// ── Page Router (hash-based SPA) ───────────────────────────────────────

type RouteHandler = (params: Record<string, string>) => Promise<void>;

interface Route {
  pattern: RegExp;
  handler: RouteHandler;
}

const routes: Route[] = [
  { pattern: /^#\/$/, handleDashboard },
  { pattern: /^#\/services$/, handleServices },
  { pattern: /^#\/workspaces$/, handleWorkspaces },
  { pattern: /^#\/knowledge$/, handleKnowledge },
  { pattern: /^#\/agent$/, handleAgent },
  { pattern: /^#\/audit$/, handleAudit },
  { pattern: /^#\/usage$/, handleUsage },
  { pattern: /^#\/automation$/, handleAutomation },
  { pattern: /^#\/settings$/, handleSettings },
];

async function handleDashboard(_params: Record<string, string>): Promise<void> {
  const main = document.getElementById("main-content")!;
  main.innerHTML = `
    <h1>Dashboard</h1>
    <div class="stats-grid">
      <div class="stat-card"><h3>Services</h3><p>8 Categories</p></div>
      <div class="stat-card"><h3>Workspaces</h3><p id="ws-count">—</p></div>
      <div class="stat-card"><h3>Agent Sessions</h3><p>Active</p></div>
      <div class="stat-card"><h3>Audit Events</h3><p id="audit-count">—</p></div>
    </div>
  `;
  const ws = await api<{ items: unknown[] }>("/workspace");
  const audit = await api<{ items: unknown[] }>("/audit/events?limit=1");
  const wsCount = document.getElementById("ws-count");
  const auditCount = document.getElementById("audit-count");
  if (wsCount && ws.data) wsCount.textContent = String(ws.data.items?.length ?? 0);
  if (auditCount && audit.data) auditCount.textContent = "Available";
}

async function handleServices(_params: Record<string, string>): Promise<void> {
  const main = document.getElementById("main-content")!;
  main.innerHTML = `
    <h1>Service Catalog</h1>
    <div class="service-categories">
      <div class="category-card"><span class="cat-icon">📚</span><h3>Knowledge</h3><p>Document ingestion, vector search, collections</p></div>
      <div class="category-card"><span class="cat-icon">🤖</span><h3>Agent</h3><p>Conversational AI sessions, RAG pipeline</p></div>
      <div class="category-card"><span class="cat-icon">🏠</span><h3>Workspace</h3><p>Multi-tenant workspace management</p></div>
      <div class="category-card"><span class="cat-icon">🛠️</span><h3>Developer</h3><p>API keys, SDKs, webhooks</p></div>
      <div class="category-card"><span class="cat-icon">🔒</span><h3>Security</h3><p>Identity, auth, permissions</p></div>
      <div class="category-card"><span class="cat-icon">💾</span><h3>Storage</h3><p>Object storage, presigned URLs</p></div>
      <div class="category-card"><span class="cat-icon">🧠</span><h3>Model</h3><p>LLM & embedding model routing</p></div>
      <div class="category-card"><span class="cat-icon">⚡</span><h3>Automation</h3><p>Job queues, scheduled tasks</p></div>
    </div>
  `;
}

async function handleWorkspaces(_params: Record<string, string>): Promise<void> {
  const main = document.getElementById("main-content")!;
  main.innerHTML = `<h1>Workspaces</h1><div id="workspace-list">Loading...</div>`;
  const res = await api<{ items: Array<{ id: string; name: string }> }>("/workspace");
  const list = document.getElementById("workspace-list")!;
  if (res.data?.items?.length) {
    list.innerHTML = res.data.items
      .map((w) => `<div class="list-item">${w.name} <small>${w.id}</small></div>`)
      .join("");
  } else {
    list.innerHTML = "<p>No workspaces found. Create one to get started.</p>";
  }
}

async function handleKnowledge(_params: Record<string, string>): Promise<void> {
  const main = document.getElementById("main-content")!;
  main.innerHTML = `
    <h1>Knowledge</h1>
    <div class="action-bar">
      <button id="btn-create-collection">+ New Collection</button>
    </div>
    <div class="search-bar">
      <input type="text" id="knowledge-search" placeholder="Search knowledge base..." />
      <button id="btn-search">Search</button>
    </div>
    <div id="knowledge-results">Enter a query to search your knowledge base.</div>
  `;
  document.getElementById("btn-search")?.addEventListener("click", async () => {
    const query = (document.getElementById("knowledge-search") as HTMLInputElement)?.value;
    if (!query) return;
    const results = document.getElementById("knowledge-results")!;
    results.innerHTML = "Searching...";
    const res = await api<{ items: Array<{ content: string; score: number }> }>(
      "/knowledge/search",
      {
        method: "POST",
        body: JSON.stringify({ query, topK: 10 }),
      }
    );
    if (res.data?.items?.length) {
      results.innerHTML = res.data.items
        .map(
          (r) =>
            `<div class="result-item"><span class="score">${(r.score * 100).toFixed(1)}%</span><p>${r.content.slice(0, 200)}</p></div>`
        )
        .join("");
    } else {
      results.innerHTML = "<p>No results found.</p>";
    }
  });
}

async function handleAgent(_params: Record<string, string>): Promise<void> {
  const main = document.getElementById("main-content")!;
  main.innerHTML = `
    <h1>Agent</h1>
    <div class="agent-console">
      <div id="chat-messages" class="chat-log"></div>
      <div class="chat-input">
        <input type="text" id="agent-input" placeholder="Ask something..." />
        <button id="btn-send">Send</button>
      </div>
    </div>
  `;
}

async function handleAudit(_params: Record<string, string>): Promise<void> {
  const main = document.getElementById("main-content")!;
  main.innerHTML = `
    <h1>Audit Events</h1>
    <div class="action-bar">
      <button id="btn-verify-chain">🔐 Verify Chain Integrity</button>
    </div>
    <div id="audit-list">Loading...</div>
  `;
  const res = await api<{
    items: Array<{ eventId: string; eventType: string; timestamp: string; subjectId: string }>;
  }>("/audit/events?limit=50");
  const list = document.getElementById("audit-list")!;
  if (res.data?.items?.length) {
    list.innerHTML =
      '<table class="data-table"><thead><tr><th>Timestamp</th><th>Type</th><th>Subject</th><th>Event ID</th></tr></thead><tbody>' +
      res.data.items
        .map(
          (e) =>
            `<tr><td>${e.timestamp}</td><td>${e.eventType}</td><td>${e.subjectId}</td><td><code>${e.eventId}</code></td></tr>`
        )
        .join("") +
      "</tbody></table>";
  } else {
    list.innerHTML = "<p>No audit events found.</p>";
  }
  document.getElementById("btn-verify-chain")?.addEventListener("click", async () => {
    const v = await api<{ valid: boolean; brokenAt?: string }>("/audit/verify", { method: "POST" });
    alert(
      v.data?.valid
        ? "✅ Audit chain integrity verified!"
        : `❌ Chain broken at: ${v.data?.brokenAt}`
    );
  });
}

async function handleUsage(_params: Record<string, string>): Promise<void> {
  const main = document.getElementById("main-content")!;
  main.innerHTML = `<h1>Usage</h1><p>Usage metering dashboard coming soon.</p>`;
}

async function handleAutomation(_params: Record<string, string>): Promise<void> {
  const main = document.getElementById("main-content")!;
  main.innerHTML = `<h1>Automation</h1><p>Job queue monitor coming soon.</p>`;
}

async function handleSettings(_params: Record<string, string>): Promise<void> {
  const main = document.getElementById("main-content")!;
  main.innerHTML = `<h1>Settings</h1><p>Platform settings coming soon.</p>`;
}

// ── Navigation & Bootstrap ─────────────────────────────────────────────

function renderNav(): void {
  const nav = document.getElementById("main-nav")!;
  nav.innerHTML = `
    <a href="#/" class="nav-link">Dashboard</a>
    <a href="#/services" class="nav-link">Services</a>
    <a href="#/workspaces" class="nav-link">Workspaces</a>
    <a href="#/knowledge" class="nav-link">Knowledge</a>
    <a href="#/agent" class="nav-link">Agent</a>
    <a href="#/audit" class="nav-link">Audit</a>
    <a href="#/usage" class="nav-link">Usage</a>
    <a href="#/automation" class="nav-link">Automation</a>
    <a href="#/settings" class="nav-link">Settings</a>
  `;
}

async function handleRoute(): Promise<void> {
  const hash = window.location.hash || "#/";
  for (const route of routes) {
    const match = hash.match(route.pattern);
    if (match) {
      await route.handler({});
      return;
    }
  }
  // Default to dashboard
  await handleDashboard({});
}

// Bootstrap
window.addEventListener("hashchange", handleRoute);
document.addEventListener("DOMContentLoaded", () => {
  renderNav();
  handleRoute();
});
