# Cloudflare Pages 部署完整指南

## 當前狀態

✅ 已完成：

- Cloudflare 配置文件已創建並推送到分支 `cloudflare-deployment-config`
- Pull Request #9 已創建並可以合併
- 所有必要的配置文件已在倉庫中

## 下一步：配置 GitHub Secrets

您需要手動配置三個 GitHub Secrets 以啟用 Cloudflare Pages 部署：

### 步驟 1：訪問 Secrets 設置頁面

訪問：https://github.com/mycodexvantaos/mycodexvantaos/settings/secrets/actions

### 步驟 2：添加 Secrets

點擊「New repository secret」並添加以下三個 secrets：

#### Secret 1: CLOUDFLARE_API_TOKEN

- **Name:** `CLOUDFLARE_API_TOKEN`
- **Value:** 您的 Cloudflare API Token
- **獲取方式：**
  1. 訪問 https://dash.cloudflare.com/profile/api-tokens
  2. 點擊「Create Token」
  3. 使用「Edit Cloudflare Workers」模板
  4. 權限設置：
     - Account - Cloudflare Pages: Edit
     - Zone - DNS: Edit
  5. 創建並複製 token

#### Secret 2: CLOUDFLARE_ACCOUNT_ID

- **Name:** `CLOUDFLARE_ACCOUNT_ID`
- **Value:** `2fead4a141ec2c677eb3bf0ac535f1d5`
- **說明：** 您的 Cloudflare Account ID

#### Secret 3: CLOUDFLARE_ZONE_ID

- **Name:** `CLOUDFLARE_ZONE_ID`
- **Value:** `1bdb04f9da82872cdff76d8515b85246`
- **說明：** 您的 Cloudflare Zone ID

### 步驟 3：合併 Pull Request

配置完 Secrets 後：

1. 訪問 PR #9：https://github.com/mycodexvantaos/mycodexvantaos/pull/9
2. 確認所有配置文件正確
3. 點擊「Merge pull request」
4. 選擇合併方式（建議 Squash and merge）
5. 確認合併

### 步驟 4：部署驗證

合併後，GitHub Actions 將自動觸發部署：

1. 訪問 Actions 頁面：
   https://github.com/mycodexvantaos/mycodexvantaos/actions

2. 查看「Deploy to Cloudflare Pages」工作流程執行狀態

3. 部署完成後，您的應用將自動部署到 Cloudflare Pages

## 部署內容

此次部署包括：

### 配置文件

- `.cloudflare/wrangler.toml` - Cloudflare Pages 主配置
- `.cloudflare/_middleware.ts` - 安全中介軟體
- `.cloudflare/api-adapter.ts` - API 路由適配器
- `.cloudflare/types.ts` - TypeScript 類型定義
- `.cloudflare/access-policy.json` - Zero Trust 訪問策略

### GitHub 工作流程

- `.github/workflows/deploy-cloudflare.yaml` - 生產環境部署
- `.github/workflows/deploy-cloudflare-preview.yaml` - 預覽環境部署

### 腳本工具

- `.cloudflare/deploy.sh` - 自動部署腳本
- `.cloudflare/health-check.sh` - 健康檢查腳本
- `.cloudflare/dns-config.sh` - DNS 配置腳本

### 文檔

- `.cloudflare/README.md` - Cloudflare 配置說明
- `CLOUDFLARE_CREDENTIALS_CONFIG.md` - 憑證配置詳解
- `QUICK_DEPLOY_STEPS.md` - 快速部署步驟

## 快速命令參考

如果一切配置正確，您可以：

```bash
# 查看部署狀態
gh run list --repo mycodexvantaos/mycodexvantaos

# 查看最新工作流程
gh run view --repo mycodexvantaos/mycodexvantaos

# 手動觸發部署
gh workflow run deploy-cloudflare.yaml --repo mycodexvantaos/mycodexvantaos
```

## 故障排除

### Secrets 錯誤

如果工作流程失敗並顯示 Secrets 錯誤：

1. 再次確認所有三個 Secrets 已正確設置
2. 檢查 Cloudflare API Token 權限
3. 驗證 Account ID 和 Zone ID

### 構建錯誤

如果構建失敗：

1. 檢查 Actions 日志
2. 確認依賴是否正確安裝
3. 驗證構建命令

### 部署失敗

如果部署到 Cloudflare Pages 失敗：

1. 檢查 Cloudflare 儀表板
2. 驗證 API Token 權限
3. 檢查網域設置

## 安全建議

1. **定期輪換 Token：** 建議每 30-90 天更新一次 Cloudflare API Token
2. **最小權限原則：** 只授予必要的權限
3. **監控使用：** 定期檢查 Cloudflare 使用報告
4. **備份配置：** 保留配置文件的備份

## 支持聯繫

如遇到問題：

- GitHub Actions 日志：https://github.com/mycodexvantaos/mycodexvantaos/actions
- Cloudflare Docs：https://developers.cloudflare.com/pages
- GitHub Actions Docs：https://docs.github.com/en/actions

---

**恭喜！一旦完成 Secrets 配置並合併 PR #9，您的應用將自動部署到 Cloudflare Pages！**
