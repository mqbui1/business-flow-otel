#!/usr/bin/env python3
"""Generate synthetic account_opening milestone events and send via Splunk HEC directly.

This is the fast path for seeding demo data: it POSTs straight to the Splunk
HTTP Event Collector, bypassing the OTel Collector entirely. It's useful for
quickly backfilling a large volume of history, but it is NOT representative
of how a real customer gets data into this schema.

For a script that demonstrates the actual customer integration path
(app -> OTel SDK -> OTLP -> Collector -> Splunk HEC exporter), see
generate_synthetic_data_otel.py.

Reads HEC settings from otel-collector/.env (SPLUNK_HEC_TOKEN, SPLUNK_HEC_ENDPOINT,
SPLUNK_HEC_INDEX) so it stays in sync with whatever the Collector is configured to use.

Usage:
    python3 scripts/generate_synthetic_data.py --flows 200 --days-back 14
"""

import argparse
import json
import random
import ssl
import urllib.request
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from _flow_model import PROCESS, generate_flow_events

REPO_ROOT = Path(__file__).resolve().parent.parent


def load_env(path: Path) -> dict:
    env = {}
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key] = value
    return env


def send_batch(url: str, token: str, index: str, events) -> int:
    body = "".join(
        json.dumps(
            {
                "time": ev.timestamp,
                "index": index,
                "sourcetype": "business:milestone",
                "event": {
                    "business.process": PROCESS,
                    "business.milestone": ev.milestone,
                    "business.correlation_id": ev.correlation_id,
                    "business.exception": "true" if ev.exception else "false",
                    **({"business.revenue": ev.revenue} if ev.revenue is not None else {}),
                },
            }
        )
        + "\n"
        for ev in events
    )
    req = urllib.request.Request(
        url,
        data=body.encode(),
        headers={
            "Authorization": f"Splunk {token}",
            "Content-Type": "application/json",
            "X-Splunk-Request-Channel": str(uuid.uuid4()),
        },
        method="POST",
    )
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        return resp.status


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--flows", type=int, default=200)
    parser.add_argument("--days-back", type=int, default=14)
    args = parser.parse_args()

    env = load_env(REPO_ROOT / "otel-collector" / ".env")
    token = env["SPLUNK_HEC_TOKEN"]
    endpoint = env["SPLUNK_HEC_ENDPOINT"].rstrip("/")
    index = env["SPLUNK_HEC_INDEX"]
    url = endpoint if endpoint.endswith("/event") else f"{endpoint}/event"

    now = datetime.now(timezone.utc)
    for i in range(args.flows):
        start = now - timedelta(days=random.uniform(0, args.days_back))
        events = generate_flow_events(start)
        send_batch(url, token, index, events)

        if (i + 1) % 25 == 0:
            print(f"{i + 1}/{args.flows} flows sent")

    print("done")


if __name__ == "__main__":
    main()
