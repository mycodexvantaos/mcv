# 快速部署步驟 - Cloudflare Pages

## 🚀 5 分鐘快速開始

### 第一步：配置 GitHub Secrets（3 分鐘）

前往：https://github.com/mycodexvantaos/mycodexvantaos/settings/secrets/actions

添加 3 個 Secrets：

1. **CLOUDFLARE_API_TOKEN**

   ```
   <redacted-cloudflare-token>
   ```

2. **CLOUDFLARE_ACCOUNT_ID**

   ```
   <your-account-id>
   ```

3. **CLOUDFLARE_ZONE_ID**
   ```
   <your-zone-id>
   ```

### 第二步：提交並推送代碼（1 分鐘）

```bash
# 創建分支
git checkout -b feat/cloudflare-integration

# 添加文件
git add .cloudflare/ .github/workflows/deploy-cloudflare.yaml .github/workflows/deploy-cloudflare-preview.yaml wrangler.toml next.config.cloudflare.ts

# 提交
git commit -m "feat: add Cloudflare Pages deployment configuration"

# 推送
git push -u origin feat/cloudflare-integration
```

### 第三步：創建 Pull Request（1 分鐘）

```bash
gh pr create --title "Add Cloudflare Pages Deployment" --body "Adds Cloudflare Pages deployment configuration"
```

或直接在 GitHub 網頁上創建 PR

### 第四步：等待部署（2-3 分鐘）

前往：https://github.com/mycodexvantaos/mycodexvantaos/actions

等待 GitHub Actions 自動執行部署

### 第五步：存取應用程式

部署完成後存取：

- **預覽環境**: https://preview.autoecoops.io
- **生產環境**: https://admin.autoecoops.io

## ✅ 完成！

您的應用程式現在已部署到 Cloudflare Pages！

## 📊 部署狀態檢查

```bash
# 檢查 GitHub Actions 狀態
gh run list --workflow=deploy-cloudflare.yaml

# 查看最新部署日誌
gh run view --log
```

## 🔧 故障排除

### 部署失敗

1. 檢查 GitHub Actions 日誌
2. 確認所有 Secrets 正確設置
3. 驗證 Cloudflare 憑證權限

### 無法存取網站

1. 檢查 DNS 設置
2. 確認 SSL/TLS 憑證
3. 查看 Cloudflare Pages 日誌

## 🎯 下一步

1. 配置資料庫連接（如果需要）
2. 設置環境變數
3. 配置自定義網域
4. 設置監控和警報

## 📞 需要協助？

查看完整文檔：

- CLOUDFLARE_CREDENTIALS_CONFIG.md - 詳細配置指南
- .cloudflare/README.md - 整合總覽
- .cloudflare/DEPLOYMENT_GUIDE.md - 完整部署指南
