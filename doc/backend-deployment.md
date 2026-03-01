# 后端部署指南

> 平台：Railway | 区域：Europe West (Amsterdam)
> URL：https://your-podcast-production.up.railway.app

## 架构

```
GitHub push → Railway 自动构建 Docker 镜像 → 部署到 Amsterdam 节点
```

## 当前配置

| 项目 | 值 |
|------|-----|
| 平台 | Railway (Hobby Plan, $5/月含 $5 免费额度) |
| 区域 | europe-west4-drams3a (Amsterdam, 荷兰) |
| 实例数 | 1 |
| 运行时 | Python 3.12 + FastAPI + Uvicorn |
| 包管理 | uv |
| 容器 | Dockerfile (python:3.12-slim) |
| 端口 | Railway 自动注入 `$PORT`（默认 8080） |

## API 端点

| 方法 | 路径 | 说明 | 状态 |
|------|------|------|------|
| GET | `/api/health` | 健康检查 | 已上线 |
| GET | `/api/episodes` | 获取播客列表 | 待开发 |
| POST | `/api/generate` | 触发播客生成 | 待开发 |

## 验证

```bash
curl https://your-podcast-production.up.railway.app/api/health
# → {"status":"ok"}
```

## 部署方式

### 方式一：CLI 手动部署

```bash
cd backend
railway up
```

### 方式二：Git 推送自动部署

在 Railway Dashboard 关联 GitHub Repo 后，每次 push 到 main 会自动重新部署。

设置方法：
1. 打开 https://railway.com → 进入 your-podcast 项目
2. 点击服务 → Settings → Source
3. Connect Repo → 选择 `Davie521/your-podcast`
4. 设置 Root Directory 为 `backend/`
5. 之后每次 `git push origin main` 自动部署

## 环境变量

在 Railway Dashboard → 服务 → Variables 中设置：

| 变量 | 说明 | 是否必填 |
|------|------|---------|
| `FRONTEND_URL` | 前端 Vercel 域名（CORS 用） | 部署前端后填 |
| `GEMINI_API_KEY` | Google Gemini API Key | 开发时填 |
| `GLM_API_KEY` | 智谱 GLM API Key | 开发时填 |
| `R2_ACCOUNT_ID` | Cloudflare R2 Account ID | 开发时填 |
| `R2_ACCESS_KEY_ID` | R2 Access Key | 开发时填 |
| `R2_SECRET_ACCESS_KEY` | R2 Secret Key | 开发时填 |
| `R2_BUCKET_NAME` | R2 Bucket 名称 | 开发时填 |
| `R2_PUBLIC_URL` | R2 公开访问 URL | 开发时填 |

> 注意：`PORT` 由 Railway 自动注入，不需要手动设置。

## Dockerfile 说明

```dockerfile
FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
WORKDIR /app

# 先复制依赖文件（利用 Docker 层缓存）
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

# 再复制代码
COPY . /app
RUN uv sync --frozen --no-dev

ENV PATH="/app/.venv/bin:$PATH"

# shell form 让 Railway 的 $PORT 变量展开
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

关键点：
- `COPY pyproject.toml uv.lock` 在 `COPY . /app` 之前，改代码不会重新安装依赖
- CMD 用 shell form（不是 JSON form），让 `${PORT:-8000}` 在运行时展开
- `--frozen` 确保用 lock 文件安装，可复现

## 常用 Railway CLI 命令

```bash
# 查看状态
railway status

# 查看日志
railway logs

# 设置环境变量
railway variables --set KEY=value

# 切换区域（1 个实例在欧洲，0 个在亚洲）
railway scale --europe-west4-drams3a 1 --asia-southeast1-eqsg3a 0

# 重新部署
railway up

# 打开 Dashboard
railway open
```

## 踩坑记录

### 1. `--mount=type=cache` 不支持

Railway 的 Docker 构建不支持 `RUN --mount=type=cache` 和 `--mount=type=bind`。
解决：改用普通 `COPY` 命令。

### 2. 默认区域是 Singapore

Railway 默认部署到 `asia-southeast1`。我们在英国开发，手动切换到 `europe-west4-drams3a` (Amsterdam)。
Railway 没有 London 节点，Amsterdam 是最近的欧洲节点。

### 3. PORT 环境变量

Railway 运行时自动注入 `PORT`（通常是 8080），Dockerfile 的 CMD 必须用 shell form 才能读取。
`CMD ["uvicorn", ..., "--port", "$PORT"]` 不行（JSON form 不展开变量）。
