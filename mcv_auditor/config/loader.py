"""
MyCodexVantaOS MCV Auditor — Configuration Loader
"""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any

import yaml


def _expand_env_vars(value: Any) -> Any:
    """Recursively expand environment variables in config values."""
    if isinstance(value, str):
        # Support ${VAR:-default} syntax
        pattern = re.compile(r'\$\{([^}:]+)(?::-(.*?))?\}')
        def replace(match):
            var_name = match.group(1)
            default = match.group(2) or ""
            return os.environ.get(var_name, default)
        return pattern.sub(replace, value)
    elif isinstance(value, dict):
        return {k: _expand_env_vars(v) for k, v in value.items()}
    elif isinstance(value, list):
        return [_expand_env_vars(item) for item in value]
    return value


def load_audit_config(config_path: str | None = None) -> dict[str, Any]:
    """
    Load audit configuration from YAML file.
    Expands environment variables in values.
    """
    if config_path is None:
        config_path = str(Path(__file__).parent / "audit_config.yaml")

    with open(config_path, encoding="utf-8") as f:
        config = yaml.safe_load(f)

    return _expand_env_vars(config)
