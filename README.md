# Your Podcast 🎙️

[![CI](https://github.com/Davie521/your-podcast/actions/workflows/ci.yml/badge.svg)](https://github.com/Davie521/your-podcast/actions/workflows/ci.yml)

> **[中文文档](README.zh-CN.md)**

Auto-generate a daily Chinese tech podcast with one command.

RSS feeds → Gemini AI filtering → Podcastfy dialogue script → TTS synthesis → MP3 → Web player.

## Features

- **Personalized onboarding** — select interests via interactive bubble UI, get podcasts tailored to you
- **Dual generation modes** — keyword-driven (targeted RSS) or traditional (static feeds + interest filtering)
- **AI-powered pipeline** — Gemini selects articles, generates dialogue scripts and cover art
- **Dual-voice TTS** — Inworld (default) or Google Gemini TTS with male + female voices
- **Full web player** — explore page, personal shows, episode details with full-screen and mini player
- **OAuth login** — Google and GitHub authentication

## Architecture

```
GitHub Actions (daily cron)
         ↓
┌─ Railway (FastAPI) ─────────────────────────────────────┐
│  RSS fetch → Gemini filter → Podcastfy script → TTS     │
│       ↓                                       ↓         │
│  Cloudflare D1 (metadata)         ffmpeg merge → MP3    │
│                                        ↓                │
│                                  Upload to R2            │
│                                                         │
│  REST API: /api/episodes, /api/generate, /api/auth ...  │
└─────────────────────────────────────────────────────────┘
         ↓                          ↓
  Cloudflare R2 (MP3 CDN)    Vercel (Next.js frontend)
                                 - Podcast player
                                 - Browse episodes
                                 - OAuth login
```

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | [Next.js 16](https://nextjs.org) + [Vercel](https://vercel.com) | TypeScript, Tailwind CSS, static export |
| Backend | [FastAPI](https://fastapi.tiangolo.com) + [Railway](https://railway.com) | Async Python, Pydantic models |
| Database | [Cloudflare D1](https://developers.cloudflare.com/d1/) | SQLite-compatible edge database (dev: local SQLite) |
| Storage | [Cloudflare R2](https://www.cloudflare.com/r2/) | S3-compatible, free 10GB, global CDN |
| RSS | feedparser | Tech/AI feed aggregation |
| AI Filter | Google Gemini | Article selection + keyword extraction + title generation |
| Script | [Podcastfy](https://github.com/souzatharsis/podcastfy) | Dual-host dialogue generation |
| TTS | Inworld / Google Gemini | Sentence-level synthesis, dual voices |
| Audio | ffmpeg (pydub) | Merge voice clips into MP3 |
| Cover Art | Google Imagen | AI-generated covers (gradient fallback) |
| Auth | Google + GitHub OAuth | Session-based authentication |
| CI/CD | GitHub Actions | Lint, build, migration checks |
| Cron | GitHub Actions | Daily podcast generation |

## Project Structure

```
podcast-app/
├── frontend/                 # Next.js → Vercel
│   ├── app/
│   │   ├── explore/          # Discover page (public)
│   │   ├── shows/            # Personal shows (auth required)
│   │   ├── episode/[id]/     # Episode detail + player
│   │   ├── onboarding/       # Interest selection
│   │   ├── login/            # OAuth login
│   │   ├── profile/          # User profile
│   │   └── help/             # Help page
│   ├── components/           # BottomNav, MiniPlayer, NowPlaying, ...
│   ├── contexts/             # AudioContext, AuthContext
│   └── hooks/                # useAuth, useAudioState, ...
├── backend/                  # FastAPI → Railway
│   ├── app/
│   │   ├── main.py           # FastAPI entrypoint
│   │   ├── config.py         # Environment config
│   │   ├── db/               # Database layer (D1 + SQLite)
│   │   ├── routers/          # auth, episodes, generate, tasks, onboarding
│   │   └── services/         # rss, gemini, podcast, tts, audio, storage, cover
│   ├── alembic/              # Database migrations
│   ├── generate.py           # CLI: manual podcast generation
│   └── config/               # rss_sources.json (keyword → feed mapping)
├── docs/                     # Architecture decisions & plans
└── .github/workflows/        # CI + daily cron
```

## Quick Start

### Prerequisites

- Python 3.11+ with [uv](https://docs.astral.sh/uv/)
- Node.js 18+
- ffmpeg

### Local Development

```bash
# Backend
cd backend
cp .env.example .env   # Fill in API keys
uv sync
uv run uvicorn app.main:app --reload
# → http://localhost:8000/api/health

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Generate a Podcast

```bash
cd backend

# Traditional mode (static feeds)
uv run python generate.py

# Keyword-driven mode (targeted RSS)
uv run python generate.py --keywords AI,Science
```

### Database Migrations

```bash
cd backend

# Local SQLite
uv run alembic upgrade head

# Cloudflare D1 (requires env vars)
uv run python migrate_d1.py upgrade head

# Create new migration (after editing app/db/tables.py)
uv run alembic revision --autogenerate -m "description"
```

## Deployment

**Backend → Railway:**
1. Install Railway CLI: `npm i -g @railway/cli`
2. `cd backend && railway login && railway up`
3. Set environment variables in Railway Dashboard (see `backend/.env.example`)

**Frontend → Vercel:**
1. Install Vercel CLI: `npm i -g vercel`
2. `cd frontend && vercel`
3. Set `NEXT_PUBLIC_API_URL` to your Railway backend URL

## CI/CD

| Event | Action |
|-------|--------|
| PR to main | CI checks (lint / build / migration) + Vercel Preview |
| Merge to main | Vercel Production deploy + Railway auto-rebuild |

> See [docs/cicd-overview.md](docs/cicd-overview.md) for details.

## Cost

| Item | Monthly |
|------|---------|
| Railway (backend) | ~$0 (Hobby tier includes $5 credit) |
| Vercel (frontend) | $0 (Hobby free) |
| Cloudflare R2 + D1 | $0 (within free tier) |
| Gemini API | $0 (free tier) |
| TTS | ~¥10-30 |
| **Total** | **~¥10-30/mo** |

## Contributing

1. Create a branch from `main` (`git checkout -b feature/xxx`)
2. Develop and commit on your branch
3. Open a Pull Request to `main` (include `Closes #issue` to link issues)
4. Merge after CI passes

> **Never push directly to `main`.** All changes go through PRs.

## License

MIT
