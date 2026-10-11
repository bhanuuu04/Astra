import logging
from typing import Optional

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def init_sentry(dsn: Optional[str] = None) -> bool:
    """Initialize Sentry error tracking if DSN is configured and sentry-sdk is available."""
    configured_dsn = dsn or get_settings().sentry_dsn
    if not configured_dsn:
        return False

    try:
        import sentry_sdk
        sentry_sdk.init(
            dsn=configured_dsn,
            traces_sample_rate=1.0,
            profiles_sample_rate=1.0,
            environment=get_settings().app_env,
        )
        logger.info("Sentry error monitoring successfully initialized.")
        return True
    except ImportError:
        logger.info("sentry-sdk not installed; skipping Sentry initialization.")
        return False
    except Exception as e:
        logger.warning(f"Failed to initialize Sentry: {e}")
        return False
