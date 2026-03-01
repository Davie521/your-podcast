# CI/CD + 最小骨架设计

> 日期: 2026-03-01
> Issue: #1

## 目标

搭建 FastAPI + Next.js 最小可部署骨架，注册 Railway / Vercel 后一条命令即可部署。

## 范围

**做：**
- backend/ — FastAPI 空项目 + health check 端点 + Dockerfile (uv)
- frontend/ — Next.js 空项目 + 调用后端验证连通
- .env.example — 环境变量模板
- README 部署文档

**不做：**
- 业务逻辑（RSS、Gemini、TTS 等）
- GitHub Actions 定时任务
- Cloudflare R2 配置

## Backend

```
backend/
├── app/
│   └── main.py          # FastAPI, GET /api/health → {"status": "ok"}
├── pyproject.toml       # uv 项目, 依赖: fastapi, uvicorn
├── uv.lock
├── Dockerfile           # python:3.12-slim, uv sync, uvicorn 启动
└── .env.example         # GEMINI_API_KEY, GLM_API_KEY, R2_* 等
```

- CORS 允许 `localhost:3000` 和 Vercel 域名
- Health check 用于验证 Railway 部署成功

## Frontend

```
frontend/
├── app/
│   ├── layout.tsx
│   └── page.tsx         # 首页, 显示标题 + 后端连通状态
├── next.config.ts
├── package.json
└── .env.example         # NEXT_PUBLIC_API_URL
```

- create-next-app 标准模板 (App Router, TypeScript, Tailwind)
- 首页调用 `NEXT_PUBLIC_API_URL/api/health` 显示后端状态

## Dockerfile (backend)

- 基于 `python:3.12-slim`
- 安装 uv, 用 `uv sync` 安装依赖
- 启动: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- Railway 通过 PORT 环境变量指定端口

## 部署流程

```bash
# 后端 → Railway
cd backend
railway login
railway up

# 前端 → Vercel
cd frontend
vercel
```

## 验证标准

1. `uv run uvicorn app.main:app --reload` 本地启动后端成功
2. `npm run dev` 本地启动前端成功
3. 前端页面能显示后端 health check 状态
4. Dockerfile 能 build 成功
