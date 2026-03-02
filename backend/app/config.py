from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///data/podcast.db"

    # Auth - Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""

    # Auth - GitHub OAuth
    github_client_id: str = ""
    github_client_secret: str = ""

    # Session
    session_secret: str = "change-me"
    frontend_url: str = "http://localhost:3000"

    # Google Gemini
    gemini_api_key: str = ""

    # TTS provider: "google" or "inworld"
    tts_provider: str = "inworld"

    # Google TTS (via Gemini)
    google_tts_model: str = "gemini-2.5-flash-preview-tts"
    google_tts_voice_male: str = "Puck"
    google_tts_voice_female: str = "Aoede"

    # Inworld TTS (direct API — https://inworld.ai)
    inworld_api_key: str = ""
    inworld_tts_model: str = "inworld-tts-1.5-max"
    inworld_tts_voice_male: str = "Theodore"
    inworld_tts_voice_female: str = "Sarah"

    # Dev mode — saves MP3 to current directory instead of temp
    dev_mode: bool = False

    # RSS Feeds (comma-separated URLs)
    rss_feeds: str = ""

    # Cloudflare R2
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = ""
    r2_public_url: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
