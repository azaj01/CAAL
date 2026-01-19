"""Registry cache for tracking installed CAAL tools.

Maps n8n workflow IDs to their CAAL registry info (id, version).
This cache enables fast lookup without fetching full workflow data from n8n.

Cache is updated:
- When a tool is installed via CAAL (we know the registry info)
- When an uncached workflow is checked (parse sticky note, cache result)
- Pruned when workflows are deleted from n8n
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import TypedDict

logger = logging.getLogger(__name__)

# Path - same directory as settings.json
_SCRIPT_DIR = Path(__file__).parent.parent.parent  # src/caal -> project root
CACHE_PATH = Path(os.getenv("CAAL_REGISTRY_CACHE_PATH", _SCRIPT_DIR / "registry_cache.json"))


class CacheEntry(TypedDict):
    """Cache entry for a single workflow."""
    registry_id: str | None  # None = verified custom workflow
    version: str | None


class RegistryCache(TypedDict):
    """Full cache structure."""
    workflows: dict[str, CacheEntry]


# In-memory cache
_cache: RegistryCache | None = None


def load_cache() -> RegistryCache:
    """Load registry cache from JSON file.

    Returns:
        Cache dict with workflow mappings.
    """
    global _cache

    if _cache is not None:
        return _cache

    if CACHE_PATH.exists():
        try:
            with open(CACHE_PATH) as f:
                data = json.load(f)
                _cache = {"workflows": data.get("workflows", {})}
                logger.debug(f"Loaded registry cache from {CACHE_PATH}")
                return _cache
        except Exception as e:
            logger.warning(f"Failed to load registry cache: {e}")

    _cache = {"workflows": {}}
    return _cache


def save_cache() -> None:
    """Save registry cache to JSON file."""
    global _cache

    if _cache is None:
        return

    try:
        CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(CACHE_PATH, "w") as f:
            json.dump(_cache, f, indent=2)
        logger.debug(f"Saved registry cache to {CACHE_PATH}")
    except Exception as e:
        logger.error(f"Failed to save registry cache: {e}")


def get_cached_entry(n8n_workflow_id: str) -> CacheEntry | None:
    """Get cache entry for a workflow.

    Args:
        n8n_workflow_id: The n8n workflow ID

    Returns:
        CacheEntry if found, None if not in cache.
    """
    cache = load_cache()
    return cache["workflows"].get(n8n_workflow_id)


def set_cached_entry(
    n8n_workflow_id: str,
    registry_id: str | None,
    version: str | None = None,
) -> None:
    """Set cache entry for a workflow.

    Args:
        n8n_workflow_id: The n8n workflow ID
        registry_id: CAAL registry ID, or None for custom workflows
        version: Registry version (only if registry_id is set)
    """
    cache = load_cache()
    cache["workflows"][n8n_workflow_id] = {
        "registry_id": registry_id,
        "version": version,
    }
    save_cache()
    logger.info(f"Cached workflow {n8n_workflow_id}: registry_id={registry_id}, version={version}")


def remove_cached_entry(n8n_workflow_id: str) -> None:
    """Remove cache entry for a workflow.

    Args:
        n8n_workflow_id: The n8n workflow ID
    """
    cache = load_cache()
    if n8n_workflow_id in cache["workflows"]:
        del cache["workflows"][n8n_workflow_id]
        save_cache()
        logger.debug(f"Removed cached entry for workflow {n8n_workflow_id}")


def prune_deleted_workflows(active_workflow_ids: set[str]) -> int:
    """Remove cache entries for workflows that no longer exist in n8n.

    Args:
        active_workflow_ids: Set of workflow IDs currently in n8n

    Returns:
        Number of entries pruned
    """
    cache = load_cache()
    cached_ids = set(cache["workflows"].keys())
    deleted_ids = cached_ids - active_workflow_ids

    if deleted_ids:
        for wf_id in deleted_ids:
            del cache["workflows"][wf_id]
        save_cache()
        logger.info(f"Pruned {len(deleted_ids)} deleted workflows from cache")

    return len(deleted_ids)


def clear_cache() -> None:
    """Clear all cached entries (for testing or reset)."""
    global _cache
    _cache = {"workflows": {}}
    save_cache()
    logger.info("Cleared registry cache")


def reload_cache() -> RegistryCache:
    """Force reload cache from disk.

    Returns:
        Fresh cache dict
    """
    global _cache
    _cache = None
    return load_cache()


def parse_sticky_note_registry_info(workflow_nodes: list[dict]) -> CacheEntry:
    """Parse CAAL registry info from workflow sticky note.

    Looks for a sticky note with "CAAL Registry Tracking" content
    and extracts the registry_id and version.

    Args:
        workflow_nodes: List of workflow nodes from n8n

    Returns:
        CacheEntry with registry_id and version (or None values if not found)
    """
    for node in workflow_nodes:
        if node.get("type") != "n8n-nodes-base.stickyNote":
            continue

        content = node.get("parameters", {}).get("content", "")
        if "CAAL Registry Tracking" not in content:
            continue

        # Parse the sticky note content
        registry_id = None
        version = None

        for line in content.split("\n"):
            line = line.strip()
            if line.startswith("**id:**"):
                registry_id = line.replace("**id:**", "").strip()
            elif line.startswith("**version:**"):
                version = line.replace("**version:**", "").strip()
                # Remove 'v' prefix if present
                if version.startswith("v"):
                    version = version[1:]

        if registry_id:
            return {"registry_id": registry_id, "version": version}

    # No sticky note found = custom workflow
    return {"registry_id": None, "version": None}
