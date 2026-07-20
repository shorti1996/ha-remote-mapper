"""Constants for Remote Mapper."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Final

DOMAIN: Final = "remote_mapper"

_MANIFEST_PATH = Path(__file__).parent / "manifest.json"
with open(_MANIFEST_PATH, encoding="utf-8") as _f:
    INTEGRATION_VERSION: Final[str] = json.load(_f).get("version", "0.0.0")

URL_BASE: Final = "/hacsfiles/remote_mapper"

JSMODULES: Final[list[dict[str, str]]] = [
    {
        "name": "Remote Mapper Card",
        "filename": "remote-mapper-card.js",
        "version": INTEGRATION_VERSION,
    },
]

# Prefixes stamped onto materialized automations/scenes (M4+).
# Orphan detection is a substring check on these — keep stable across versions.
AUTOMATION_ALIAS_PREFIX: Final = f"[{DOMAIN}]"
MANAGED_DESCRIPTION_MARKER: Final = f"Auto-managed by {DOMAIN}."

# Bus event fired after every mutating WS handler; the card refetches on it.
EVENT_UPDATED: Final = f"{DOMAIN}_updated"

# Config entry data keys
CONF_SOURCE: Final = "source"
CONF_SOURCE_CONFIG: Final = "source_config"

# Options keys
CONF_SNAPSHOT_ENTITIES: Final = "snapshot_entities"
CONF_OWNED_SCENE_CLEANUP: Final = "owned_scene_cleanup"

CLEANUP_ASK: Final = "ask"
CLEANUP_ALWAYS_DELETE: Final = "always_delete"
CLEANUP_NEVER_DELETE: Final = "never_delete"
