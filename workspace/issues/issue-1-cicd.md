# Issue #1: 搭建 CI/CD 工作流：Railway + Vercel + GitHub Actions

**Status:** OPEN
**Label:** infra
**Link:** https://github.com/Davie521/your-podcast/issues/1

## 目标

搭建完整的 CI/CD 流水线，实现代码推送后自动部署，以及每日定时生成播客。

## 任务清单

### 1. Railway 部署后端（FastAPI）
- [ ] 在 Railway 创建项目，关联 GitHub Repo
- [ ] 配置 `backend/Dockerfile`
- [ ] 设置环境变量（GEMINI_API_KEY, GLM_API_KEY, R2 配置等）
- [ ] 确认 `railway up` 能正常部署
- [ ] 配置自动部署：push 到 main 时自动重新部署后端

### 2. Vercel 部署前端（Next.js）
- [ ] 在 Vercel 导入项目，Root Directory 设为 `frontend/`
- [ ] 配置环境变量（NEXT_PUBLIC_API_URL 指向 Railway 后端）
- [ ] 确认 `vercel` CLI 能正常部署
- [ ] 配置自动部署：push 到 main 时自动重新部署前端
- [ ] 配置 Preview 部署：PR 自动生成预览链接

### 3. Cloudflare R2 存储
- [ ] 创建 R2 Bucket
- [ ] 生成 Access Key，配置到 Railway 环境变量
- [ ] 配置公开访问域名（用于 MP3 CDN）

### 4. GitHub Actions 每日定时生成
- [ ] 创建 `.github/workflows/daily.yml`
- [ ] 配置 cron 定时（如每天 UTC 8:00）
- [ ] 调用 Railway 后端 API `/api/generate` 触发播客生成
- [ ] 配置 Secrets（API URL、Auth Token）

### 5. PR 工作流
- [ ] push 到 main 自动触发后端（Railway）+ 前端（Vercel）部署
- [ ] PR 提交时 Vercel 自动生成 Preview 链接
- [ ] （可选）PR 提交时跑 lint / test

## 最终效果

```
开发者 push 代码
    ↓
├── Railway 自动部署后端
├── Vercel 自动部署前端
└── PR 生成 Preview 链接

GitHub Actions cron 每天定时
    ↓
调用 /api/generate → 生成播客 → MP3 上传到 R2
```

## 参考

- 架构详情：[doc/architecture-decision.md](https://github.com/Davie521/your-podcast/blob/main/doc/architecture-decision.md)
