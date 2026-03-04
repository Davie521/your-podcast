# CLAUDE.md

## 项目概述

Your Podcast — 每日中文科技播客自动生成。RSS 抓取 → Gemini 筛选 → Podcastfy 对话脚本 → GLM TTS 合成 → MP3 → Web 播放。

## 架构

- **前端**: Next.js (TypeScript) → Vercel 部署
- **后端**: FastAPI (Python) → Railway 部署
- **存储**: Cloudflare R2 (MP3 文件, S3 兼容 API)
- **数据库**: SQLite + Litestream (自动备份到 R2)
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
- 模型: `app/models.py` (SQLModel + SQLite)
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
- CLI: `generate.py` — 手动生成播客；`seed.py` — 填充测试数据
- 完整 API: `/api/health`, `/api/auth/*`, `/api/episodes`, `/api/episodes/me`, `/api/episodes/{id}`, `/api/generate`, `/api/tasks/{id}`, `/api/onboarding/interests`

## 前端 (frontend/)

- 页面:
  - `app/page.tsx` — 重定向到 /explore
  - `app/explore/page.tsx` — 播客发现页（当前使用硬编码示例数据，待接入 API）
- 组件:
  - `components/PodcastCard.tsx` — 播客卡片（含播放按钮）
  - `components/SearchInput.tsx` — 搜索框
  - `components/BottomNav.tsx` — 底部导航（/explore, /shows, /profile）
  - `components/Player.tsx` — 音频播放器（待实现）
- 类型: `types/podcast.ts`
- API 客户端: `lib/api.ts`（待实现，调用后端 `/api/episodes`）

## 开发命令

```bash
# 后端
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload

# 前端
cd frontend && npm install && npm run dev

# 生成播客
cd backend && python generate.py

# 部署
railway up                    # 后端
cd frontend && vercel         # 前端
```

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
- SQLite 文件在容器内，用 Litestream 实时备份到 R2 防丢失
- **数据库选型已定**：保持 SQLite + Litestream，不迁移 Cloudflare D1（D1 已评估，复杂度收益比不佳）
- 前端环境变量：`NEXT_PUBLIC_API_URL` 指向 Railway 后端地址（本地开发默认 `http://localhost:8000`）
