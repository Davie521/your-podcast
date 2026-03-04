# Issue #42 Implementation Plan

> 搭建后端音频存储、Cloudflare 数据库及播放功能
> Branch: `feature/issue-42`

## Current State

- **R2 storage**: ✅ Done — `backend/app/services/storage.py` fully implemented
- **Backend API**: ✅ Done — `/api/episodes`, `/api/episodes/{id}` return full data incl. `audio_url`
- **Database**: ⚠️ Currently SQLite — needs migration to Cloudflare D1
- **Frontend**: ❌ Hardcoded sample data, no API calls, no audio player

## Work Items

### 1. Cloudflare D1 Migration (Backend)

**New file: `backend/app/services/d1.py`**
- HTTP client wrapping the D1 REST API
- `query(sql, params)` — execute a SQL statement
- Used by all DB operations instead of SQLAlchemy session

**Update `backend/app/config.py`**
- Add: `cloudflare_account_id`, `cloudflare_api_token`, `d1_database_id`

**New file: `backend/app/d1_database.py`**
- Replace SQLModel engine/session with D1 client
- Provide same interface as current `database.py` where possible

**Migration script: `backend/migrate_to_d1.py`**
- Create D1 tables (episodes, users, sources, transcript_lines, tasks)
- Schema matches current SQLModel models

**Update all routers** to use D1 client instead of SQLAlchemy session:
- `app/routers/episodes.py`
- `app/routers/auth.py`
- `app/routers/generate.py`
- `app/routers/tasks.py`
- `app/routers/onboarding.py`

**Update `app/services/pipeline.py`** — DB writes go through D1

### 2. Frontend API Client

**New file: `frontend/lib/api.ts`**
```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export async function getEpisodes(limit = 20, offset = 0): Promise<EpisodeListResponse>
export async function getEpisode(id: string): Promise<EpisodeDetail>
```

**Update `frontend/types/podcast.ts`**
- Replace current `Podcast` interface with `Episode`, `EpisodeListResponse`, `EpisodeDetail` matching API contract

### 3. Explore Page — Real Data

**Update `frontend/app/explore/page.tsx`**
- Replace hardcoded `SAMPLE_PODCASTS` with `useEffect` → `getEpisodes()`
- Add loading skeleton state
- Add error state
- Map `Episode` fields to `PodcastCard` props

### 4. Audio Player Component

**New file: `frontend/components/Player.tsx`**
- Sticky bottom bar, renders when an episode is active
- Uses native `<audio>` element (ref)
- Controls: play/pause, scrubber (progress bar), current time / duration, speed (1×/1.5×/2×)
- Shows: episode cover, title
- State managed via React context or lifted to layout

**New file: `frontend/context/PlayerContext.tsx`**
- `activeEpisode: Episode | null`
- `setActiveEpisode(episode: Episode)`
- Consumed by Player + PodcastCard

**Update `frontend/app/layout.tsx`**
- Wrap with `PlayerProvider`
- Render `<Player />` above `<BottomNav />`

**Update `frontend/components/PodcastCard.tsx`**
- `onPlay` → calls `setActiveEpisode(episode)`

### 5. /shows Page Stub

**New file: `frontend/app/shows/page.tsx`**
- Simple placeholder so BottomNav link doesn't 404

## Implementation Order

| Step | What | File(s) |
|------|------|---------|
| 1 | D1 config + service | `config.py`, `services/d1.py` |
| 2 | D1 database layer | `d1_database.py`, `migrate_to_d1.py` |
| 3 | Update routers for D1 | all routers + pipeline.py |
| 4 | Frontend types | `types/podcast.ts` |
| 5 | API client | `lib/api.ts` |
| 6 | Player context | `context/PlayerContext.tsx` |
| 7 | Player component | `components/Player.tsx` |
| 8 | Update layout | `app/layout.tsx` |
| 9 | Wire explore page | `app/explore/page.tsx` |
| 10 | Wire PodcastCard | `components/PodcastCard.tsx` |
| 11 | /shows stub | `app/shows/page.tsx` |

## Environment Variables Required

```
# Backend (.env)
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
D1_DATABASE_ID=

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://your-podcast-production.up.railway.app
```

## D1 Table Schema

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  provider TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  interests TEXT DEFAULT '[]',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS episodes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  audio_url TEXT,
  duration INTEGER DEFAULT 0,
  is_public INTEGER DEFAULT 1,
  creator_id TEXT NOT NULL REFERENCES users(id),
  published_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  source TEXT
);

CREATE TABLE IF NOT EXISTS transcript_lines (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  line_order INTEGER NOT NULL,
  speaker TEXT NOT NULL,
  text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  progress TEXT DEFAULT '',
  episode_id TEXT REFERENCES episodes(id),
  created_at TEXT NOT NULL
);
```
