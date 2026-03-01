# CI/CD + 最小骨架 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 搭建 FastAPI + Next.js 最小可部署骨架，注册 Railway / Vercel 后一条命令即可部署。

**Architecture:** 后端 FastAPI (uv + Dockerfile) 部署到 Railway，前端 Next.js (App Router + TypeScript + Tailwind) 部署到 Vercel。后端提供 `/api/health` 端点，前端调用验证连通。

**Tech Stack:** Python 3.12, FastAPI, uv, Docker | Next.js 15, TypeScript, Tailwind CSS

---

### Task 1: 初始化后端 uv 项目

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`

**Step 1: 创建 backend 目录并初始化 uv 项目**

```bash
cd /Users/yifan/Desktop/podcast_app
mkdir -p backend/app
cd backend
uv init --no-readme
```

**Step 2: 添加依赖**

```bash
cd /Users/yifan/Desktop/podcast_app/backend
uv add fastapi uvicorn[standard]
```

**Step 3: 创建 `app/__init__.py`**

创建空文件:
```python
# backend/app/__init__.py
```

**Step 4: 创建 `app/main.py`**

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="Your Podcast API")

origins = [
    "http://localhost:3000",
    os.getenv("FRONTEND_URL", ""),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in origins if o],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
```

**Step 5: 本地验证**

```bash
cd /Users/yifan/Desktop/podcast_app/backend
uv run uvicorn app.main:app --reload
```

在浏览器访问 `http://localhost:8000/api/health`，应返回 `{"status":"ok"}`。
Ctrl+C 停止。

**Step 6: Commit**

```bash
git add backend/
git commit -m "feat: init backend with FastAPI + uv, add health endpoint"
```

---

### Task 2: 创建后端 Dockerfile

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/.dockerignore`

**Step 1: 创建 `backend/Dockerfile`**

```dockerfile
FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# 先安装依赖（利用 Docker 层缓存）
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project --no-dev

# 复制代码并安装项目
COPY . /app
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

ENV PATH="/app/.venv/bin:$PATH"

# Railway 注入 PORT 环境变量，shell form 让 $PORT 展开
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

**Step 2: 创建 `backend/.dockerignore`**

```
.venv
__pycache__
.git
.env
*.pyc
```

**Step 3: 本地验证 Docker build**

```bash
cd /Users/yifan/Desktop/podcast_app/backend
docker build -t podcast-backend .
docker run --rm -p 8000:8000 podcast-backend
```

访问 `http://localhost:8000/api/health`，应返回 `{"status":"ok"}`。
Ctrl+C 停止。

**Step 4: Commit**

```bash
git add backend/Dockerfile backend/.dockerignore
git commit -m "feat: add Dockerfile for backend (uv + Railway compatible)"
```

---

### Task 3: 创建后端环境变量模板

**Files:**
- Create: `backend/.env.example`

**Step 1: 创建 `backend/.env.example`**

```env
# Google Gemini
GEMINI_API_KEY=

# GLM (智谱) TTS
GLM_API_KEY=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

**Step 2: Commit**

```bash
git add backend/.env.example
git commit -m "feat: add backend .env.example"
```

---

### Task 4: 初始化前端 Next.js 项目

**Files:**
- Create: `frontend/` (via create-next-app)

**Step 1: 创建 Next.js 项目**

```bash
cd /Users/yifan/Desktop/podcast_app
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*" \
  --use-npm
```

对所有交互选项选 Yes/默认。

**Step 2: 创建 `frontend/.env.example`**

```env
# 后端 API 地址
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Step 3: Commit**

```bash
git add frontend/
git commit -m "feat: init frontend with Next.js (App Router, TypeScript, Tailwind)"
```

---

### Task 5: 前端首页 — 显示后端连通状态

**Files:**
- Modify: `frontend/app/page.tsx`

**Step 1: 替换 `frontend/app/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [status, setStatus] = useState<string>("checking...");

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiUrl}/api/health`)
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("unreachable"));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold">Your Podcast</h1>
      <p className="text-lg text-gray-500">
        每天自动生成的中文科技播客
      </p>
      <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
        <span
          className={`h-3 w-3 rounded-full ${
            status === "ok" ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-sm">
          后端状态: {status}
        </span>
      </div>
    </main>
  );
}
```

**Step 2: 本地验证**

终端 1 — 启动后端:
```bash
cd /Users/yifan/Desktop/podcast_app/backend
uv run uvicorn app.main:app --reload
```

终端 2 — 启动前端:
```bash
cd /Users/yifan/Desktop/podcast_app/frontend
npm run dev
```

访问 `http://localhost:3000`，应显示 "Your Podcast" 标题和绿色圆点 "后端状态: ok"。

**Step 3: Commit**

```bash
git add frontend/app/page.tsx
git commit -m "feat: add homepage with backend health check indicator"
```

---

### Task 6: 更新 README 部署文档

**Files:**
- Modify: `README.md`

**Step 1: 更新 README.md 的 Quick Start 部分**

在 Quick Start 中确保包含以下内容:

```markdown
## Quick Start

### 本地开发

```bash
# 后端
cd backend
uv sync
uv run uvicorn app.main:app --reload
# → http://localhost:8000/api/health

# 前端
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### 部署

**后端 → Railway:**
1. 注册 [Railway](https://railway.com)，安装 CLI: `npm i -g @railway/cli`
2. ```bash
   cd backend
   railway login
   railway up
   ```
3. 在 Railway Dashboard 设置环境变量（参考 `backend/.env.example`）
4. 记录后端 URL（如 `https://xxx.up.railway.app`）

**前端 → Vercel:**
1. 注册 [Vercel](https://vercel.com)，安装 CLI: `npm i -g vercel`
2. ```bash
   cd frontend
   vercel
   ```
3. 设置环境变量 `NEXT_PUBLIC_API_URL` 为 Railway 后端 URL
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update Quick Start with local dev and deployment steps"
```

---

### Task 7: 最终验证

**Step 1: 从头跑通整个流程**

```bash
# 后端
cd /Users/yifan/Desktop/podcast_app/backend
uv sync
uv run uvicorn app.main:app --reload

# 另一个终端 — 前端
cd /Users/yifan/Desktop/podcast_app/frontend
npm install
npm run dev
```

验证清单:
- [ ] `http://localhost:8000/api/health` 返回 `{"status":"ok"}`
- [ ] `http://localhost:3000` 显示绿色圆点 + "后端状态: ok"
- [ ] `docker build -t podcast-backend ./backend` 构建成功
- [ ] `docker run --rm -p 8000:8000 podcast-backend` 运行后 health check 正常

**Step 2: Push**

```bash
git push origin main
```
