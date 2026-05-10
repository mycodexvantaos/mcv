# 🛡️ SentinelCore v2.0 — Intelligent Monitoring Defense Platform

Enterprise-grade silent monitoring, behavioral analysis, and threat detection platform deployed to Cloudflare Pages.

## 🔗 Live Deployment

**URL:** [https://sites.super.myninja.ai/dcd72c9c-d92b-4eed-93bd-b1f6eae493d1/136be2a8/index.html](https://sites.super.myninja.ai/dcd72c9c-d92b-4eed-93bd-b1f6eae493d1/136be2a8/index.html)

## 🎯 Core Capabilities

### Silent Runtime Engine
- **Stealth Mode**: Operates invisibly on target devices — no visible indicators, notifications, or tray icons
- **Auto-Start on Boot**: Launches silently upon device startup without user interaction
- **Persistent Service**: Automatically restarts if the process is killed or interrupted
- **AES-256 Encrypted Upload**: All captured data is encrypted in transit using military-grade encryption
- **Anti-Tamper Shield**: Detects and resists uninstallation attempts

### AI-Powered Threat Detection
Six specialized detection modules:
1. 🎰 **Gambling Detector** — Online betting and casino site identification
2. 🔞 **Adult Content Filter** — Explicit material detection and blocking
3. 💥 **Violence Detector** — Graphic violence and gore classification
4. 💊 **Substance Abuse** — Drug-related content and community detection
5. 👥 **Contact Monitor** — Flagged contacts and unknown number alerts
6. 🎣 **Phishing/Fraud Shield** — Social engineering and scam detection

### Behavioral Analysis Engine
- Baseline behavioral profiling per device
- Anomaly score tracking with 7-day trend visualization
- Risk indicator dashboard with real-time scoring
- Behavioral drift detection and pattern deviation alerts

### Cryptographic Audit Ledger
- SHA-256 hash-linked chain for tamper-proof logging
- Every action, threat detection, and configuration change is recorded
- Chain integrity verification endpoint
- Cryptographic proof of audit trail completeness

## 📱 Interface Screens

| Screen | Description |
|--------|-------------|
| **Command Center** | Real-time monitoring overview, threat posture ring, live activity feed |
| **Live Monitor** | Silent screen capture view, behavioral telemetry, activity heatmap |
| **Threat Timeline** | All detected threats with severity filters and acknowledgment |
| **Behavior Analysis** | AI pattern recognition, anomaly scores, risk indicators |
| **Rule Engine** | Configurable detection rules with automated response actions |
| **Audit Ledger** | Cryptographic hash chain with integrity verification |
| **Configuration** | Stealth settings, detection modules, device enrollment |

## 🛠 API Endpoints (Cloudflare Worker)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Service health check |
| GET | `/api/engine/status` | Engine running status |
| GET | `/api/devices` | List enrolled devices |
| POST | `/api/devices` | Enroll new device |
| GET | `/api/devices/:id` | Get device details |
| DELETE | `/api/devices/:id` | Remove device |
| GET | `/api/threats` | List recent threats |
| POST | `/api/threats` | Record new threat |
| GET | `/api/audit` | Get audit chain |
| POST | `/api/audit` | Append audit entry |
| GET | `/api/audit/verify` | Verify chain integrity |
| GET | `/api/rules` | List detection rules |
| POST | `/api/rules` | Create new rule |

## 📁 Project Structure

```
web-deploy/
├── index.html      # Main application interface (7 screens)
├── styles.css      # Enterprise dark theme with threat visualization
├── app.js          # Core application logic & state management
├── worker.js       # Cloudflare Worker API backend
├── wrangler.toml   # Cloudflare deployment configuration
├── _redirects      # SPA routing rules
├── _headers        # Security headers
└── README.md       # This file
```

## 🔧 Technology Stack

- **Frontend**: Vanilla HTML5/CSS3/ES2023 with Tailwind CSS
- **Backend**: Cloudflare Workers (serverless)
- **Storage**: Cloudflare KV (key-value)
- **Cryptography**: Web Crypto API (SHA-256)
- **Deployment**: Cloudflare Pages

## ⚡ Quick Start

1. Open the deployed URL in any modern browser
2. The Silent Runtime Engine auto-starts after 1.2 seconds
3. Demo devices are enrolled automatically
4. Monitor the live feed, threat timeline, and behavioral analysis
5. Configure detection rules and settings as needed
6. Enroll additional devices via Settings → Enroll New Device

---

*SentinelCore v2.0 — Intelligent Monitoring Defense Platform*
*Zero-Trust Architecture • Silent Runtime • AI Behavioral Analysis*