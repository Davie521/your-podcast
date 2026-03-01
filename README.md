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

## 流程

```
RSS 抓取 → Gemini 筛选 8-10 篇 → Podcastfy 生成对话脚本 → GLM TTS 逐句合成 → ffmpeg 合并 MP3
                                                                                       ↓
                                                                                 Web 播放页面
```

## 技术栈

| 层 | 选型 | 说明 |
|----|------|------|
| 前端 | Next.js | 播客播放 & 往期浏览 |
| 后端 | FastAPI | API 服务 |
| RSS | feedparser | 抓取科技/AI 领域源 |
| 筛选 | Google Gemini | 从全部文章挑 8-10 篇 |
| 脚本 | [Podcastfy](https://github.com/souzatharsis/podcastfy) | 生成双主持人对话脚本 |
| TTS | GLM (智谱) | 逐句合成，小明(男声) + 小红(女声) |
| 音频 | ffmpeg | 拼接语音片段为 MP3 |

## 项目结构

```
your-podcast/
├── frontend/             # Next.js
│   ├── app/
│   └── components/
├── backend/              # FastAPI
│   ├── app/
│   │   ├── main.py
│   │   └── services/
│   │       ├── rss.py           # RSS 抓取
│   │       ├── gemini.py        # Gemini 筛选
│   │       ├── podcast.py       # Podcastfy 生成脚本
│   │       ├── tts.py           # GLM 语音合成
│   │       └── audio.py         # ffmpeg 合并
│   └── requirements.txt
└── README.md
```

## Quick Start

```bash
# 后端
cd backend
pip install -r requirements.txt
cp .env.example .env   # 填入 GEMINI_API_KEY, GLM_API_KEY
uvicorn app.main:app --reload

# 前端
cd frontend
npm install
npm run dev
```

## License

MIT
