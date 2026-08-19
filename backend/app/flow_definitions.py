"""Per-process editable metadata for milestone nodes (display name, description,
exception classification, correlation ID field). Backs the "edit entity" panel
in the Tree view. Stored as plain JSON files - this is display/config metadata
only, not the underlying Splunk event data.
"""

import json
from pathlib import Path
from typing import Any

DEFINITIONS_DIR = Path(__file__).resolve().parent / "flow_definitions_data"
DEFINITIONS_DIR.mkdir(exist_ok=True)


def _path(process: str) -> Path:
    return DEFINITIONS_DIR / f"{process}.json"


def get_definition(process: str) -> dict[str, Any]:
    path = _path(process)
    if not path.exists():
        return {"milestones": {}}
    return json.loads(path.read_text())


def update_milestone(process: str, milestone: str, metadata: dict[str, Any]) -> dict[str, Any]:
    definition = get_definition(process)
    definition.setdefault("milestones", {})[milestone] = metadata
    _path(process).write_text(json.dumps(definition, indent=2))
    return definition
