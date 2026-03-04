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
- 服务层: `app/services/`
  - `rss.py` — feedparser 抓取
  - `gemini.py` — Google Gemini 筛选
  - `podcast.py` — Podcastfy 脚本生成
  - `tts.py` — GLM 智谱 TTS (小明男声 + 小红女声)
  - `audio.py` — pydub/ffmpeg 合并 MP3
  - `storage.py` — R2 上传
- CLI: `generate.py` — 手动生成播客
- API: `/api/episodes`, `/api/generate`

## 前端 (frontend/)

- 页面: `app/page.tsx` (首页播放器), `app/archive/page.tsx` (往期列表)
- 组件: `components/Player.tsx`, `components/EpisodeList.tsx`

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
- GLM TTS 需要逐句调用再用 ffmpeg 拼接，注意错误重试
- R2 上传使用 boto3 (S3 兼容)，endpoint 指向 Cloudflare
- SQLite 文件在容器内，用 Litestream 实时备份到 R2 防丢失
