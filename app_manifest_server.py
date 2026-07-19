import json, urllib.parse, requests
from http.server import HTTPServer, BaseHTTPRequestHandler

TOKEN = "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"
APP_PORT = 8765
PUBLIC_HOST = "8765-imvd6d7dyousv1x5zd8gb-d0b9e1e2.sandbox.novita.ai"
PUBLIC_URL = f"https://{PUBLIC_HOST}"

github_app_result = {}

MANIFEST = {
    "name": "MyCodeXvantaOS-AI-Dev",
    "url": "https://github.com/ai-software-engineering-guild",
    "hook_attributes": {"url": "https://example.com/webhook", "active": False},
    "redirect_url": f"{PUBLIC_URL}/github-app-callback",
    "callback_urls": [f"{PUBLIC_URL}/github-app-callback"],
    "description": "AI Developer automation for MyCodeXvantaOS platform",
    "public": False,
    "default_events": [
        "push", "pull_request", "issues", "workflow_run",
        "check_run", "create", "delete", "release"
    ],
    "default_permissions": {
        "contents": "write",
        "pull_requests": "write",
        "issues": "write",
        "workflows": "write",
        "actions": "write",
        "metadata": "read",
        "checks": "write",
        "statuses": "write"
    }
}

def make_index():
    manifest_json = json.dumps(MANIFEST).replace('"', '&quot;')
    return f"""<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<title>GitHub App Creator</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 750px; margin: 40px auto; padding: 20px; background: #f6f8fa; }}
  .card {{ background: white; border-radius: 10px; padding: 30px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid #d0d7de; }}
  h1 {{ color: #24292f; margin-top: 0; }}
  h2 {{ color: #24292f; margin-top: 0; }}
  .btn {{ display: inline-block; padding: 12px 28px; background: #2da44e; color: white; border-radius: 6px; text-decoration: none; font-weight: 600; border: none; font-size: 16px; margin: 8px 4px 8px 0; cursor: pointer; transition: background 0.2s; }}
  .btn:hover {{ background: #2c974b; }}
  .btn-blue {{ background: #0969da; }}
  .btn-blue:hover {{ background: #0860ca; }}
  .step {{ display: flex; align-items: flex-start; margin: 12px 0; gap: 12px; }}
  .num {{ background: #0969da; color: white; border-radius: 50%; width: 28px; height: 28px; min-width: 28px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; }}
  .info-box {{ background: #f6f8fa; border: 1px solid #d0d7de; border-radius: 6px; padding: 16px; margin-top: 16px; font-size: 14px; line-height: 2; }}
  .info-box b {{ color: #24292f; }}
  .info-box code {{ background: #eaeef2; padding: 2px 6px; border-radius: 4px; font-family: monospace; }}
  .success {{ background: #dafbe1; color: #1a7f37; padding: 14px 18px; border-radius: 6px; border: 1px solid #a8f0c6; margin-top: 12px; font-weight: 500; }}
  .warning {{ background: #fff8c5; color: #7d4e00; padding: 12px 16px; border-radius: 6px; border: 1px solid #e4c84c; margin-bottom: 12px; font-size: 14px; }}
  pre {{ background: #f6f8fa; border: 1px solid #d0d7de; padding: 16px; border-radius: 6px; overflow-x: auto; font-size: 12px; margin-top: 12px; }}
  .tag {{ display: inline-block; background: #ddf4ff; color: #0969da; border-radius: 20px; padding: 2px 10px; font-size: 12px; font-weight: 600; margin-left: 8px; }}
  hr {{ border: none; border-top: 1px solid #d0d7de; margin: 24px 0; }}
</style>
</head>
<body>
<h1>&#x1F916; GitHub App &amp; OAuth App Creator</h1>
<p style="color:#57606a; margin-top:-10px;">帳號：<strong>ai-software-engineering-guild</strong> &nbsp;|&nbsp; 一鍵創建所需的 GitHub 整合</p>

<div class="warning">
  &#x26A0;&#xFE0F; <strong>注意：</strong>請確保此瀏覽器已登入 GitHub 帳號 <code>ai-software-engineering-guild</code>
  &nbsp;<a href="https://github.com/login" target="_blank" style="color:#0969da;">點此登入 →</a>
</div>

<!-- ===== STEP 1: GitHub App ===== -->
<div class="card">
  <h2>&#x1F4E6; Step 1：創建 GitHub App <span class="tag">MyCodeXvantaOS-AI-Dev</span></h2>

  <div class="step">
    <div class="num">1</div>
    <div>點擊下方綠色按鈕，會在新分頁開啟 GitHub App 設定頁面（已自動填入所有資訊）</div>
  </div>
  <div class="step">
    <div class="num">2</div>
    <div>在 GitHub 頁面底部點擊 <strong>「Create GitHub App」</strong> 按鈕</div>
  </div>
  <div class="step">
    <div class="num">3</div>
    <div>GitHub 會自動回調本頁面，App 憑證將被自動儲存 ✅</div>
  </div>

  <form action="https://github.com/organizations/ai-software-engineering-guild/settings/apps/new" method="POST" target="_blank">
    <input type="hidden" name="manifest" value="{manifest_json}" />
    <button type="submit" class="btn">&#x1F680; 創建 GitHub App（新分頁開啟）</button>
  </form>

  <div id="app-status"></div>
</div>

<!-- ===== STEP 2: OAuth App ===== -->
<div class="card">
  <h2>&#x1F511; Step 2：創建 OAuth App <span class="tag">MyCodeXvantaOS-OAuth</span></h2>

  <div class="step">
    <div class="num">1</div>
    <div>點擊下方藍色按鈕，前往 GitHub OAuth App 創建頁面</div>
  </div>
  <div class="step">
    <div class="num">2</div>
    <div>按照下方資訊填入表單，然後點擊 <strong>「Register application」</strong></div>
  </div>
  <div class="step">
    <div class="num">3</div>
    <div>創建後，點擊 <strong>「Generate a new client secret」</strong>，複製 Client ID 和 Secret 後，回報給 AI 助手</div>
  </div>

  <a href="https://github.com/organizations/ai-software-engineering-guild/settings/applications/new" target="_blank" class="btn btn-blue">&#x1F517; 前往創建 OAuth App（新分頁）</a>

  <div class="info-box">
    <strong>&#x1F4CB; 請複製以下資訊填入表單：</strong><br><br>
    &#x25B6; <b>Application name：</b><code>MyCodeXvantaOS-OAuth</code><br>
    &#x25B6; <b>Homepage URL：</b><code>https://github.com/ai-software-engineering-guild</code><br>
    &#x25B6; <b>Application description：</b><code>OAuth app for MyCodeXvantaOS AI platform</code><br>
    &#x25B6; <b>Authorization callback URL：</b><code>{PUBLIC_URL}/oauth-app-callback</code><br>
  </div>
</div>

<!-- ===== RESULTS ===== -->
<div class="card" id="results" style="display:none">
  <h2>&#x2705; GitHub App 創建成功！</h2>
  <div class="success" id="app-success-msg"></div>
  <pre id="results-json"></pre>
</div>

<script>
function poll() {{
  fetch('/status')
    .then(r => r.json())
    .then(d => {{
      if (d.github_app && d.github_app.id) {{
        document.getElementById('app-status').innerHTML =
          '<div class="success" style="margin-top:12px">&#x2705; GitHub App 創建成功！App ID: <strong>' +
          d.github_app.id + '</strong> | Name: ' + d.github_app.name + '</div>';
        document.getElementById('app-success-msg').textContent =
          'App ID: ' + d.github_app.id + '  |  Client ID: ' + (d.github_app.client_id || 'N/A');
        document.getElementById('results').style.display = 'block';
        document.getElementById('results-json').textContent = JSON.stringify(d.github_app, null, 2);
      }}
    }})
    .catch(() => {{}});
}}
setInterval(poll, 2000);
poll();
</script>
</body>
</html>"""


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        global github_app_result
        parsed = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(parsed.query)
        path = parsed.path

        if path in ('/', '/index.html'):
            body = make_index().encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        elif path == '/github-app-callback':
            code = qs.get('code', [None])[0]
            print(f"\n[CALLBACK] /github-app-callback received, code={code[:15] if code else None}...")
            if code:
                try:
                    resp = requests.post(
                        f"https://api.github.com/app-manifests/{code}/conversions",
                        headers={
                            "Authorization": f"token {TOKEN}",
                            "Accept": "application/vnd.github+json",
                            "X-GitHub-Api-Version": "2022-11-28"
                        },
                        timeout=30
                    )
                    data = resp.json()
                    print(f"[API] Response status: {resp.status_code}")
                    print(f"[API] App name: {data.get('name')}, ID: {data.get('id')}")
                    github_app_result = data
                    with open('/home/user/webapp/github_app_credentials.json', 'w') as f:
                        json.dump(data, f, indent=2)
                    print("[OK] Credentials saved to github_app_credentials.json")
                except Exception as e:
                    print(f"[ERR] Conversion failed: {e}")

            # Redirect back to main page with success indicator
            self.send_response(302)
            self.send_header('Location', f'{PUBLIC_URL}/?app=created')
            self.end_headers()

        elif path == '/oauth-app-callback':
            code = qs.get('code', [None])[0]
            print(f"\n[CALLBACK] /oauth-app-callback, code={code}")
            html = b"<h2>OAuth App callback received. You can close this tab.</h2>"
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(html)

        elif path == '/status':
            safe = {}
            if github_app_result:
                safe = {
                    k: github_app_result.get(k)
                    for k in ['id', 'name', 'slug', 'client_id', 'html_url', 'app_id']
                }
            body = json.dumps({"github_app": safe if safe else None}).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(body)

        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, fmt, *args):
        print(f"  [{self.client_address[0]}] {fmt % args}")


if __name__ == '__main__':
    print(f"=" * 60)
    print(f"GitHub App Creator Server")
    print(f"Port: {APP_PORT}")
    print(f"Public URL: {PUBLIC_URL}")
    print(f"Callback URL: {PUBLIC_URL}/github-app-callback")
    print(f"=" * 60)
    server = HTTPServer(('0.0.0.0', APP_PORT), Handler)
    print(f"Server ready — waiting for requests...")
    server.serve_forever()
