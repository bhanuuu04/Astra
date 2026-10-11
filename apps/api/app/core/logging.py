import logging
import re
from typing import Any, Dict

SENSITIVE_PATTERNS = [
    re.compile(r"(bearer\s+)[a-zA-Z0-9_\-\.:]+", re.IGNORECASE),
    re.compile(r"(api[_\-]?key['\":\s=]+)[a-zA-Z0-9_\-]+", re.IGNORECASE),
    re.compile(r"(secret['\":\s=]+)[a-zA-Z0-9_\-]+", re.IGNORECASE),
    re.compile(r"(password['\":\s=]+)[^'\"\s&]+", re.IGNORECASE),
    re.compile(r"(token['\":\s=]+)[a-zA-Z0-9_\-\.:]+", re.IGNORECASE),
]


class SensitiveDataRedactor(logging.Filter):
    """Filter that intercepts log records and redacts secrets, tokens, and PII."""

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = self.redact_text(record.msg)
        if record.args:
            if isinstance(record.args, dict):
                record.args = {k: self.redact_value(v) for k, v in record.args.items()}
            elif isinstance(record.args, (list, tuple)):
                record.args = tuple(self.redact_value(v) for v in record.args)
        return True

    @classmethod
    def redact_text(cls, text: str) -> str:
        for pattern in SENSITIVE_PATTERNS:
            text = pattern.sub(r"\1[REDACTED]", text)
        return text

    @classmethod
    def redact_value(cls, val: Any) -> Any:
        if isinstance(val, str):
            return cls.redact_text(val)
        return val


def setup_enterprise_logging(level: int = logging.INFO) -> None:
    """Configure structured, redacting logger for enterprise production compliance."""
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Avoid duplicate handlers
    if not root_logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%SZ",
        )
        handler.setFormatter(formatter)
        handler.addFilter(SensitiveDataRedactor())
        root_logger.addHandler(handler)
    else:
        for h in root_logger.handlers:
            h.addFilter(SensitiveDataRedactor())
