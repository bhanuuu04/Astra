from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "ASTRA API"
    app_env: str = "development"
    database_url: str = "postgresql+psycopg://astra:astra_dev@localhost:5432/astra"
    cors_origins: str = "http://localhost:3000"

    # Suspicious URL/app reputation
    virustotal_api_key: str = ""

    # Social data
    youtube_api_key: str = ""

    # Composio Integration
    composio_api_key: str = ""

    # Meta / Instagram Graph API
    meta_verify_token: str = "astra_meta_verify_secret"
    meta_app_secret: str = ""
    meta_page_access_token: str = ""

    # Google Play
    google_play_service_account_json: str = ""

    # AI Summary LLM Providers
    gemini_api_key: str = ""
    openai_api_key: str = ""

    # Error Monitoring
    sentry_dsn: str = ""

    # Security & Tenant Isolation
    admin_api_key: str = "astra_admin_dev_secret"
    astra_internal_api_key: str = ""
    api_secret_key: str = ""
    jwt_secret: str = "astra_enterprise_jwt_signing_secret_dev"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 1440  # 24 hours
    allow_anonymous_dev: bool = True
    allow_demo_reset: bool = False

    # Storage for raw evidence objects
    evidence_storage_path: str = "storage/evidence"

    # Connector polling runs in its own scheduler process.
    connector_auto_sync_enabled: bool = True
    connector_auto_sync_interval_seconds: int = 3600
    connector_scheduler_poll_seconds: int = 30

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    def validate_runtime_security(self) -> None:
        """Fail closed when a production deployment still has development credentials."""
        if self.app_env.lower() not in {"production", "prod"}:
            return

        problems: list[str] = []
        if len(self.jwt_secret) < 32 or self.jwt_secret == "astra_enterprise_jwt_signing_secret_dev":
            problems.append("JWT_SECRET must be a unique secret with at least 32 characters")
        if len(self.admin_api_key) < 32 or self.admin_api_key == "astra_admin_dev_secret":
            problems.append("ADMIN_API_KEY must be a unique secret with at least 32 characters")
        if len(self.astra_internal_api_key) < 32 or self.astra_internal_api_key.startswith("replace-this"):
            problems.append("ASTRA_INTERNAL_API_KEY must be a unique secret with at least 32 characters")
        if self.allow_anonymous_dev:
            problems.append("ALLOW_ANONYMOUS_DEV must be false")
        if any("*" in origin for origin in self.allowed_origins):
            problems.append("CORS_ORIGINS must contain exact origins only")
        if not self.allowed_origins or any(
            origin.startswith("http://localhost") or origin.startswith("http://127.0.0.1")
            for origin in self.allowed_origins
        ):
            problems.append("CORS_ORIGINS must be set to non-local deployment origins")
        if any(not origin.startswith("https://") for origin in self.allowed_origins):
            problems.append("CORS_ORIGINS must use HTTPS in production")

        if problems:
            raise RuntimeError("Unsafe production configuration: " + "; ".join(problems))


@lru_cache
def get_settings() -> Settings:
    return Settings()
