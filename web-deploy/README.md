# 守護核心 SentinelCore v3.0

> 兒童螢幕監護系統 — 防範賭博、色情、暴力、藥物、有害聯絡

## 金鑰配對系統

v3.0 新增完整的金鑰配對生命週期管理，取代原本任意文字輸入的驗證方式。

### 流程

**被觀察方（子女）**
1. 簽署責任協議
2. 系統自動生成 `XXXX-XXXX` 格式配對金鑰
3. 金鑰展示畫面：顯示金鑰、複製按鈕、使用說明
4. 再次輸入金鑰確認 → 開始消失序列 → 遁入後台

**觀察方（監護人）**
1. 輸入被觀察方提供的配對金鑰
2. 後端驗證金鑰有效性（格式、存在、未過期、未配對）
3. 建立配對連線 → 進入監控主控台

### API 端點

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/keys/generate` | POST | 生成配對金鑰 |
| `/api/keys/validate` | POST | 驗證金鑰有效性 |
| `/api/keys/pair` | POST | 建立配對連線 |
| `/api/keys/confirm-subject` | POST | 被觀察方確認金鑰 |
| `/api/keys/status` | GET | 查詢金鑰狀態 |
| `/api/keys/revoke` | POST | 撤銷金鑰 |
| `/api/keys/list` | GET | 列出所有金鑰 |
| `/api/health` | GET | 健康檢查 |
| `/api/devices` | GET | 裝置列表 |
| `/api/threats` | GET | 威脅紀錄 |
| `/api/audit` | GET | 審計紀錄 |
| `/api/rules` | GET | 監控規則 |

### 金鑰特性

- 格式：`XXXX-XXXX`（8 字元，排除容易混淆的 0/O/1/I/L）
- 有效期：24 小時
- 狀態：`active` → `paired` | `expired` | `revoked`
- 審計：SHA-256 加密雜湊審計日誌

### 無 KV 回退

當 Cloudflare KV 未綁定時，API 會自動回退為本地模式：
- 金鑰生成仍正常運作
- 驗證僅檢查格式
- 配對自動成功
- 審計紀錄不持久化

## 部署

```bash
# 安裝 Wrangler CLI
npm install -g wrangler

# 登入 Cloudflare
wrangler login

# 建立 KV namespace
wrangler kv:namespace create SCREEN_MONITOR_KV

# 部署 Worker
wrangler deploy

# 部署 Pages
wrangler pages deploy . --project-name lemon-screen-monitor-app
```

## 技術架構

- **前端**：純 HTML + CSS + JavaScript，零框架依賴
- **後端**：Cloudflare Workers + KV 無伺服器架構
- **加密**：AES-256 模擬加密傳輸 + SHA-256 審計雜湊
- **語言**：繁體中文（zh-Hant）
