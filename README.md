# Your Podcast 🎙️

> 一条命令，把今天的科技新闻变成一期双人中文播客。

每天自动抓取 RSS → AI 筛选 → Podcastfy 写稿 → GLM 语音合成 → Web 播放。

## MVP 范围

**做：**
- 抓取 RSS，Gemini 筛选文章，Podcastfy 生成对话脚本，GLM TTS 合成语音，输出 MP3
- 一个能播放和浏览往期的 Web 页面

**不做（后续迭代）：**
- 用户系统 / 登录
- 自定义 RSS 源
- 多语言
- 定时任务 / Telegram 推送

## 架构

```
GitHub Actions (每天定时触发)
         ↓
┌─ Railway (FastAPI) ────────────────────────────────┐
│  RSS 抓取 → Gemini 筛选 → Podcastfy 脚本 → GLM TTS │
│       ↓                                     ↓      │
│    SQLite (元信息)              ffmpeg 合并 MP3     │
│                                      ↓             │
│                               上传到 R2 存储        │
│                                                    │
│  REST API: /api/episodes, /api/generate ...        │
└────────────────────────────────────────────────────┘
         ↓                          ↓
  Cloudflare R2 (MP3 CDN)    Vercel (Next.js 前端)
                                 - 播客播放器
                                 - 往期浏览
                                 - 调用 FastAPI
```

## 技术栈

| 层 | 选型 | 说明 |
|----|------|------|
| 云平台 | [Railway](https://railway.com) | 后端部署，欧洲节点，容器无超时 |
| 前端 | [Next.js](https://nextjs.org) + [Vercel](https://vercel.com) | 播客播放 & 往期浏览 |
| 后端 | FastAPI | REST API + 播客生成服务 |
| RSS | feedparser | 抓取科技/AI 领域源 |
| 筛选 | Google Gemini | 从全部文章挑 8-10 篇 |
| 脚本 | [Podcastfy](https://github.com/souzatharsis/podcastfy) | 生成双主持人对话脚本 |
| TTS | GLM (智谱) | 逐句合成，小明(男声) + 小红(女声) |
| 音频 | ffmpeg (pydub) | 拼接语音片段为 MP3 |
| 存储 | [Cloudflare R2](https://www.cloudflare.com/r2/) | 免费 10GB，全球 CDN |
| 数据库 | SQLite + Litestream | 零运维，自动备份到 R2 |
| 定时 | GitHub Actions cron | 免费 2000 分钟/月 |

> 架构决策详情见 [doc/architecture-decision.md](doc/architecture-decision.md)

## 项目结构

```
podcast-app/
├── frontend/                   # Next.js (Vercel 部署)
│   ├── app/
│   │   ├── page.tsx            # 首页 / 播放器
│   │   └── archive/
│   │       └── page.tsx        # 往期列表
│   ├── components/
│   │   ├── Player.tsx          # 播放器组件
│   │   └── EpisodeList.tsx     # 节目列表组件
│   ├── package.json
│   └── next.config.js
├── backend/                    # FastAPI (Railway 部署)
│   ├── app/
│   │   ├── main.py             # FastAPI 入口
│   │   ├── config.py           # 环境变量配置
│   │   ├── models.py           # SQLite 模型 (SQLModel)
│   │   └── services/
│   │       ├── rss.py          # RSS 抓取
│   │       ├── gemini.py       # Gemini 筛选
│   │       ├── podcast.py      # Podcastfy 脚本生成
│   │       ├── tts.py          # GLM TTS 合成
│   │       ├── audio.py        # ffmpeg 合并
│   │       └── storage.py      # R2 上传
│   ├── generate.py             # CLI 入口: python generate.py
│   ├── requirements.txt
│   └── Dockerfile
├── doc/
│   └── architecture-decision.md
└── .github/
    └── workflows/
        └── daily.yml           # 每天定时生成
```

## Quick Start

```bash
# 后端
cd backend
pip install -r requirements.txt
cp .env.example .env   # 填入 GEMINI_API_KEY, GLM_API_KEY, R2 配置
uvicorn app.main:app --reload

# 前端
cd frontend
npm install
npm run dev

# 生成播客
cd backend
python generate.py

# 部署
railway login && railway up          # 后端 → Railway
cd frontend && vercel                # 前端 → Vercel
```

## 费用

| 项目 | 月费 |
|------|------|
| Railway (后端) | ~$0（Hobby 含 $5 免费额度） |
| Vercel (前端) | $0（Hobby 免费） |
| Cloudflare R2 | $0（10GB 内免费） |
| Gemini API | $0（免费额度） |
| GLM TTS | ~¥10-30 |
| **合计** | **~¥10-30/月** |

## License

MIT
