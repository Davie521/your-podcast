# CLAUDE.md

## 项目概述

Your Podcast — 每日中文科技播客自动生成。RSS 抓取 → Gemini 筛选 → Podcastfy 对话脚本 → GLM TTS 合成 → MP3 → Web 播放。

## 架构

- **前端**: Next.js (TypeScript) → Vercel 部署
- **后端**: FastAPI (Python) → Railway 部署
- **存储**: Cloudflare R2 (MP3 文件, S3 兼容 API)
- **数据库**: Cloudflare D1 (SQLite 兼容，托管在 Cloudflare 边缘)
- **定时任务**: GitHub Actions cron

## 项目结构

```
frontend/          # Next.js — Vercel
backend/           # FastAPI — Railway
docs/              # 架构决策文档
.github/workflows/ # CI/CD
```

## 后端 (backend/)

- 入口: `app/main.py` (FastAPI)
- 配置: `app/config.py` (环境变量)
- 模型: `app/models.py` (仅含 TaskStatus 枚举)
- 数据库: `app/d1_database.py` (D1 查询层，返回 dict)
- D1 客户端: `app/services/d1.py` (Cloudflare D1 REST API 封装)
- 路由: `app/routers/` — `auth.py`, `episodes.py`, `generate.py`, `tasks.py`, `onboarding.py`
- 服务层: `app/services/`
  - `rss.py` — feedparser 抓取
  - `gemini.py` — Google Gemini 筛选
  - `podcast.py` — Podcastfy 脚本生成
  - `tts.py` — Inworld TTS（默认）/ Google Gemini TTS（备选），双声线 Alex + Jordan
  - `audio.py` — pydub/ffmpeg 合并 MP3
  - `storage.py` — R2 上传（boto3 S3 兼容）
  - `cover.py` — 播客封面生成（渐变色占位图）
  - `pipeline.py` — 全流程编排（RSS → 筛选 → 脚本 → TTS → 合并 → 上传 → 入库）
- CLI: `generate.py` — 手动生成播客；`seed.py` — 填充测试数据；`init_d1.py` — 初始化 D1 表结构
- 完整 API: `/api/health`, `/api/auth/*`, `/api/episodes`, `/api/episodes/me`, `/api/episodes/{id}`, `/api/generate`, `/api/tasks/{id}`, `/api/onboarding/interests`

## 前端 (frontend/)

- 页面:
  - `app/page.tsx` — 重定向到 /explore
  - `app/explore/page.tsx` — 播客发现页（当前使用硬编码示例数据，待接入 API）
  - `app/login/page.tsx` — 登录页（Google/GitHub OAuth）
  - `app/profile/page.tsx` — 个人资料页（需登录，显示用户信息）
- 组件:
  - `components/BottomNav.tsx` — 底部导航（/explore, /shows, /profile）
  - `components/ClientLayout.tsx` — 客户端布局（AuthProvider + AudioProvider + ViewTransition）
  - `components/EpisodeRow.tsx` — 播客集行
  - `components/MiniPlayer.tsx` — 迷你播放器
- 上下文:
  - `contexts/AudioContext.tsx` — 全局音频状态
  - `contexts/AuthContext.tsx` — 认证状态（auto dev-login in dev mode）
- Hooks:
  - `hooks/useAuth.ts` / `hooks/useAuthDispatch.ts` — 认证状态和操作
  - `hooks/useAudioState.ts` / `hooks/useAudioDispatch.ts` — 音频状态和操作
- 类型: `types/audio.ts`, `types/auth.ts`
- API 客户端: `lib/api.ts`（fetch wrapper with credentials: 'include'）

## 开发命令

```bash
# 后端
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload

# 前端
cd frontend && npm install && npm run dev

# 初始化 D1 表结构（首次部署）
cd backend && python init_d1.py

# 生成播客
cd backend && python generate.py

# 部署
railway up                    # 后端
cd frontend && vercel         # 前端
```

## 开发流程

> **⚠️ 改代码之前必须先看文档、先改文档！**

1. **读文档**：改任何代码前，先阅读 `docs/` 下的相关文档，了解当前架构和设计决策
2. **改文档**：如果实现方案与文档不符，或文档需要更新，**先更新文档**，再写代码
3. **再改代码**：文档确认无误后，才开始实现

这确保文档始终是代码的唯一真相来源。

## 代码规范

- 后端 Python: 使用 async/await, 类型注解, Pydantic 模型
- 前端 TypeScript: **必须遵守 [docs/frontend-coding-rules.md](docs/frontend-coding-rules.md)** — Next.js App Router, 静态导出, Tailwind CSS, 严格 TypeScript
- 环境变量通过 .env 管理，敏感 key 不要提交到代码仓库
- MP3 文件不提交到 Git，统一存 R2
- 测试截图统一放到 `screenshots/` 目录（已 gitignore）

## Git 工作流

> **⚠️ 绝对禁止直接 push 到 main 分支！所有变更必须通过 PR 合并！⚠️**

- 主分支: `main` — **受保护分支，禁止直接 push**
- **任何改动（无论大小）都必须：**
  1. 从 main 创建新分支（`git checkout -b feature/xxx`）
  2. 在新分支上提交代码
  3. 创建 Pull Request 到 main
  4. CI 通过后合并
- PR 描述中写 `Closes #issue号` 关联 Issue
- 合并后 Railway + Vercel 自动部署
- **再次强调：绝对不要 `git push origin main`，必须走 PR 流程！**

## Commit 规范

- 提交信息不要加 `Co-Authored-By` 行

## 注意事项

- 播客生成是长任务（几分钟），后端接口需要异步处理或后台任务
- TTS 需要逐句调用再用 ffmpeg 拼接，注意错误重试（Inworld 最多 5 次重试）
- R2 上传使用 boto3 (S3 兼容)，endpoint 指向 Cloudflare
- **数据库**：已迁移到 Cloudflare D1（通过 REST API 访问），需配置 `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `D1_DATABASE_ID`。初始化表结构：`python init_d1.py`
- 前端环境变量：`NEXT_PUBLIC_API_URL` 指向 Railway 后端地址（本地开发默认 `http://localhost:8000`）
