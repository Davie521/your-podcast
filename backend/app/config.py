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

    # GLM (智谱) TTS
    glm_api_key: str = ""
    tts_voice_male: str = "male"
    tts_voice_female: str = "female"

    # RSS Feeds (comma-separated URLs)
    rss_feeds: str = ""

    # Cloudflare R2
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = ""
    r2_public_url: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
