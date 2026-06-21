# Cloudflare 憑證配置指南

## ⚠️ 重要安全提醒

您已提供以下憑證資訊：

- **CLOUDFLARE_API_TOKEN**: [已提供]
- **CLOUDFLARE_ACCOUNT_ID**: [請填入您的 Account ID]
- **CLOUDFLARE_ZONE_ID**: [請填入您的 Zone ID]

**請立即執行以下步驟完成配置：**

## 📋 配置步驟

### 步驟 1：配置 GitHub Secrets（必須）

#### 方法 A：使用 GitHub 網頁介面（推薦）

1. 前往 GitHub Secrets 設定頁面：

   ```
   https://github.com/mycodexvantaos/mycodexvantaos/settings/secrets/actions
   ```

2. 點擊 "New repository secret"

3. 添加第一個 Secret：
   - **Name**: `CLOUDFLARE_API_TOKEN`
   - **Value**: `<redacted-cloudflare-token>`
   - 點擊 "Add secret"

4. 添加第二個 Secret：
   - **Name**: `CLOUDFLARE_ACCOUNT_ID`
   - **Value**: `2fead4a141ec2c677eb3bf0ac535f1d5`
   - 點擊 "Add secret"

5. 添加第三個 Secret：
   - **Name**: `CLOUDFLARE_ZONE_ID`
   - **Value**: `1bdb04f9da82872cdff76d8515b85246`
   - 點擊 "Add secret"

#### 方法 B：使用 GitHub CLI

如果您已安裝 GitHub CLI，可以在終端機執行：

```bash
# 設置 API Token
gh secret set CLOUDFLARE_API_TOKEN
# 在提示時貼上您的 token

# 設置 Account ID
gh secret set CLOUDFLARE_ACCOUNT_ID
# 在提示時貼上：<您的 Account ID>

# 設置 Zone ID
gh secret set CLOUDFLARE_ZONE_ID
# 在提示時貼上：<您的 Zone ID>
```

### 步驟 2：驗證配置

執行以下命令驗證 Secrets 是否正確設置：

```bash
gh secret list
```

您應該看到三個 secrets：

- CLOUDFLARE_API_TOKEN
- CLOUDFLARE_ACCOUNT_ID
- CLOUDFLARE_ZONE_ID

### 步驟 3：提交並推送代碼

```bash
# 創建新分支
git checkout -b feat/cloudflare-integration

# 添加所有 Cloudflare 配置文件
git add .cloudflare/ .github/workflows/deploy-cloudflare.yaml .github/workflows/deploy-cloudflare-preview.yaml wrangler.toml next.config.cloudflare.ts

# 提交
git commit -m "feat: add Cloudflare Pages deployment configuration"

# 推送到 GitHub
git push -u origin feat/cloudflare-integration
```

### 步驟 4：創建 Pull Request

```bash
gh pr create --title "Add Cloudflare Pages Deployment" --body "Adds Cloudflare Pages deployment configuration with automated CI/CD"
```

### 步驟 5：監控部署

1. 前往 GitHub Actions 頁面：

   ```
   https://github.com/mycodexvantaos/mycodexvantaos/actions
   ```

2. 等待 2-3 分鐘，部署會自動執行

3. 查看部署日誌確認成功

### 步驟 6：存取部署的應用程式

部署完成後，您可以存取：

- **預覽環境**: https://preview.autoecoops.io
- **生產環境**: https://admin.autoecoops.io

## 🔧 其他環境變數（可選）

對於完整功能，您可能還需要配置：

### 資料庫配置

```bash
gh secret set DATABASE_URL
# 格式: postgresql://user:password@host:port/database
```

### Redis 配置

```bash
gh secret set REDIS_URL
# 格式: redis://user:password@host:port
```

### 身份驗證金鑰

```bash
# 生成 NextAuth secret
openssl rand -base64 32
gh secret set NEXTAUTH_SECRET
# 貼上生成的字串
```

### AI 服務 API Keys

```bash
gh secret set GENKIT_API_KEY
gh secret set OPENAI_API_KEY
gh secret set ANTHROPIC_API_KEY
gh secret set GOOGLE_AI_API_KEY
```

## ✅ 完成檢查清單

- [ ] 已配置 CLOUDFLARE_API_TOKEN
- [ ] 已配置 CLOUDFLARE_ACCOUNT_ID
- [ ] 已配置 CLOUDFLARE_ZONE_ID
- [ ] 已提交並推送代碼
- [ ] 已創建 Pull Request
- [ ] GitHub Actions 部署成功
- [ ] 可以存取 https://preview.autoecoops.io
- [ ] （可選）已配置資料庫連接
- [ ] （可選）已配置 AI 服務 API Keys

## 🚨 重要提醒

1. **立即更改密碼**: 完成配置後，請立即更改您的 Cloudflare 和 GitHub 密碼
2. **Token 安全**: API Token 只會顯示一次，請妥善保存
3. **權限檢查**: 確認 API Token 有足夠的權限（Workers、Pages、DNS）
4. **監控部署**: 密切監控首次部署的日誌

## 📞 需要協助？

如果遇到問題：

1. 檢查 GitHub Actions 日誌
2. 確認所有 Secrets 正確設置
3. 驗證 Cloudflare 憑證權限
4. 查看部署腳本輸出

## 🎯 下一步

完成上述步驟後，您的應用程式將自動部署到 Cloudflare Pages！

**預期時間**: 5-10 分鐘完成所有配置
**部署時間**: 2-3 分鐘
**總計**: 15 分鐘內完成首次部署
