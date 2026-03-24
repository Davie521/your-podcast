# Your Podcast 🎙️

[![CI](https://github.com/Davie521/your-podcast/actions/workflows/ci.yml/badge.svg)](https://github.com/Davie521/your-podcast/actions/workflows/ci.yml)

> **[English](README.md)**

一条命令，自动生成每日中文科技播客。

RSS 抓取 → Gemini AI 筛选 → Podcastfy 对话脚本 → TTS 语音合成 → MP3 → Web 播放。

## 功能特性

- **个性化引导** — 通过互动气泡 UI 选择兴趣，获取量身定制的播客
- **双生成模式** — 关键词驱动（定向 RSS）或传统模式（静态 feeds + 兴趣筛选）
- **AI 驱动流水线** — Gemini 筛选文章、生成对话脚本和封面图
- **双声线 TTS** — Inworld（默认）或 Google Gemini TTS，男女双声
- **完整播放器** — 发现页、个人节目、播客详情页（全屏 + 迷你播放器）
- **OAuth 登录** — 支持 Google 和 GitHub 认证

## 架构

```
GitHub Actions（每日定时触发）
         ↓
┌─ Railway (FastAPI) ─────────────────────────────────────┐
│  RSS 抓取 → Gemini 筛选 → Podcastfy 脚本 → TTS 合成     │
│       ↓                                       ↓         │
│  Cloudflare D1（元信息）              ffmpeg 合并 → MP3  │
│                                        ↓                │
│                                  上传到 R2 存储          │
│                                                         │
│  REST API: /api/episodes, /api/generate, /api/auth ...  │
└─────────────────────────────────────────────────────────┘
         ↓                          ↓
  Cloudflare R2 (MP3 CDN)    Vercel (Next.js 前端)
                                 - 播客播放器
                                 - 往期浏览
                                 - OAuth 登录
```

## 技术栈

| 层 | 选型 | 说明 |
|----|------|------|
| 前端 | [Next.js 16](https://nextjs.org) + [Vercel](https://vercel.com) | TypeScript, Tailwind CSS, 静态导出 |
| 后端 | [FastAPI](https://fastapi.tiangolo.com) + [Railway](https://railway.com) | 异步 Python, Pydantic 模型 |
| 数据库 | [Cloudflare D1](https://developers.cloudflare.com/d1/) | SQLite 兼容边缘数据库（开发用本地 SQLite） |
| 存储 | [Cloudflare R2](https://www.cloudflare.com/r2/) | S3 兼容，免费 10GB，全球 CDN |
| RSS | feedparser | 科技/AI 领域源聚合 |
| AI 筛选 | Google Gemini | 文章筛选 + 关键词提取 + AI 标题生成 |
| 脚本 | [Podcastfy](https://github.com/souzatharsis/podcastfy) | 双主持人对话脚本生成 |
| TTS | Inworld / Google Gemini | 逐句合成，双声线 |
| 音频 | ffmpeg (pydub) | 拼接语音片段为 MP3 |
| 封面 | Google Imagen | AI 生成封面（失败时回退渐变色占位图） |
| 认证 | Google + GitHub OAuth | 基于 Session 的认证 |
| CI/CD | GitHub Actions | Lint、构建、迁移检查 |
| 定时 | GitHub Actions | 每日自动生成播客 |

## 项目结构

```
podcast-app/
├── frontend/                 # Next.js → Vercel
│   ├── app/
│   │   ├── explore/          # 发现页（公开）
│   │   ├── shows/            # 个人节目（需登录）
│   │   ├── episode/[id]/     # 播客详情 + 播放器
│   │   ├── onboarding/       # 兴趣选择引导
│   │   ├── login/            # OAuth 登录
│   │   ├── profile/          # 个人资料
│   │   └── help/             # 帮助页
│   ├── components/           # BottomNav, MiniPlayer, NowPlaying, ...
│   ├── contexts/             # AudioContext, AuthContext
│   └── hooks/                # useAuth, useAudioState, ...
├── backend/                  # FastAPI → Railway
│   ├── app/
│   │   ├── main.py           # FastAPI 入口
│   │   ├── config.py         # 环境变量配置
│   │   ├── db/               # 数据库层（D1 + SQLite）
│   │   ├── routers/          # auth, episodes, generate, tasks, onboarding
│   │   └── services/         # rss, gemini, podcast, tts, audio, storage, cover
│   ├── alembic/              # 数据库迁移
│   ├── generate.py           # CLI: 手动生成播客
│   └── config/               # rss_sources.json（关键词 → Feed 映射）
├── docs/                     # 架构决策文档
└── .github/workflows/        # CI + 每日定时任务
```

## 快速开始

### 环境要求

- Python 3.11+，安装 [uv](https://docs.astral.sh/uv/)
- Node.js 18+
- ffmpeg

### 本地开发

```bash
# 后端
cd backend
cp .env.example .env   # 填入 API Key
uv sync
uv run uvicorn app.main:app --reload
# → http://localhost:8000/api/health

# 前端（另开终端）
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### 生成播客

```bash
cd backend

# 传统模式（静态 feeds）
uv run python generate.py

# 关键词驱动模式（定向 RSS）
uv run python generate.py --keywords AI,Science
```

### 数据库迁移

```bash
cd backend

# 本地 SQLite
uv run alembic upgrade head

# Cloudflare D1（需设置环境变量）
uv run python migrate_d1.py upgrade head

# 新建迁移（改完 app/db/tables.py 后）
uv run alembic revision --autogenerate -m "描述"
```

## 部署

**后端 → Railway：**
1. 安装 Railway CLI：`npm i -g @railway/cli`
2. `cd backend && railway login && railway up`
3. 在 Railway Dashboard 设置环境变量（参考 `backend/.env.example`）

**前端 → Vercel：**
1. 安装 Vercel CLI：`npm i -g vercel`
2. `cd frontend && vercel`
3. 设置环境变量 `NEXT_PUBLIC_API_URL` 为 Railway 后端 URL

## CI/CD

| 事件 | 执行操作 |
|------|---------|
| PR 到 main | CI 检查（lint / build / 迁移）+ Vercel Preview 部署 |
| 合并到 main | Vercel Production 部署 + Railway 自动重新构建 |

> 详见 [docs/cicd-overview.md](docs/cicd-overview.md)

## 费用

| 项目 | 月费 |
|------|------|
| Railway（后端） | ~$0（Hobby 含 $5 免费额度） |
| Vercel（前端） | $0（Hobby 免费） |
| Cloudflare R2 + D1 | $0（免费额度内） |
| Gemini API | $0（免费额度） |
| TTS | ~¥10-30 |
| **合计** | **~¥10-30/月** |

## 参与贡献

1. 从 `main` 创建新分支（`git checkout -b feature/xxx`）
2. 在分支上开发并提交代码
3. 创建 Pull Request 到 `main`（用 `Closes #issue号` 关联 Issue）
4. CI 通过后合并

> **禁止直接 push 到 `main` 分支，所有变更必须通过 PR 合并！**

## License

MIT
