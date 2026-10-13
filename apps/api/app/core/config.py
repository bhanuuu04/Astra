from functools import lru_cache
from enum import Enum

from pydantic_settings import BaseSettings, SettingsConfigDict


class Environment(str, Enum):
    """Strict environment enumeration"""
    LOCAL = "local"
    TEST = "test"
    TESTING = "testing"
    DEVELOPMENT = "development"
    STAGING = "staging"
    PREVIEW = "preview"
    PRODUCTION = "production"
    PROD = "prod"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "ASTRA API"
    app_env: str = "development"
    database_url: str = ""
    cors_origins: str = "http://localhost:3000"

    # Suspicious URL/app reputation
    virustotal_api_key: str = ""

    # Social data
    youtube_api_key: str = ""

    # Composio Integration
    composio_api_key: str = ""

    # Meta / Instagram Graph API
    meta_verify_token: str = ""
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
    # SECURITY: These MUST be overridden in non-local environments
    admin_api_key: str = "INSECURE_DEFAULT_CHANGE_IN_PRODUCTION"
    astra_internal_api_key: str = "INSECURE_DEFAULT_CHANGE_IN_PRODUCTION"
    api_secret_key: str = "INSECURE_DEFAULT_CHANGE_IN_PRODUCTION"
    jwt_secret: str = "INSECURE_DEFAULT_CHANGE_IN_PRODUCTION"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 1440  # 24 hours
    allow_anonymous_dev: bool = False
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
    
    @property
    def is_local_dev(self) -> bool:
        """True only for explicit local development mode"""
        return self.app_env.lower() in {"development", Environment.LOCAL.value, Environment.TEST.value, Environment.TESTING.value}
    
    @property
    def is_production(self) -> bool:
        """True for production and prod environments"""
        return self.app_env.lower() in {Environment.PRODUCTION.value, Environment.PROD.value}

    def validate_runtime_security(self) -> None:
        """
        Fail closed: validate security configuration for ALL non-local environments.
        
        This runs for: development, staging, preview, production, and any misspelled environment.
        Only explicit local/test modes skip validation.
        """
        if self.is_local_dev:
            return

        problems: list[str] = []
        
        # Check for insecure default secrets
        insecure_patterns = ["INSECURE_DEFAULT", "astra_admin_dev_secret", "astra_enterprise_jwt", 
                           "astra_internal_dev", "astra_meta_verify_secret", "replace-this"]
        
        if any(pattern in self.jwt_secret for pattern in insecure_patterns) or len(self.jwt_secret) < 32:
            problems.append(f"JWT_SECRET must be a unique secret with at least 32 characters (env: {self.app_env})")
        
        if any(pattern in self.admin_api_key for pattern in insecure_patterns) or len(self.admin_api_key) < 32:
            problems.append(f"ADMIN_API_KEY must be a unique secret with at least 32 characters (env: {self.app_env})")
        
        
        if self.allow_anonymous_dev:
            problems.append(f"ALLOW_ANONYMOUS_DEV must be false in {self.app_env} environment")
        
        if any("*" in origin for origin in self.allowed_origins):
            problems.append("CORS_ORIGINS must contain exact origins only (no wildcards)")
        
        # For production, enforce HTTPS and no localhost
        if self.is_production:
            if not self.allowed_origins or any(
                origin.startswith("http://localhost") or origin.startswith("http://127.0.0.1")
                for origin in self.allowed_origins
            ):
                problems.append("CORS_ORIGINS must be set to non-local deployment origins in production")
            
            if any(not origin.startswith("https://") for origin in self.allowed_origins):
                problems.append("CORS_ORIGINS must use HTTPS in production")
            

        if problems:
            raise RuntimeError(
                "Unsafe production configuration: " + "; ".join(problems)
            )


@lru_cache
def get_settings() -> Settings:
    return Settings()
