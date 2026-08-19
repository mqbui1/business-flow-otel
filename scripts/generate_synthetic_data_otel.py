#!/usr/bin/env python3
"""Generate synthetic account_opening milestone events via a real OTel pipeline.

Unlike generate_synthetic_data.py (which POSTs straight to Splunk HEC), this
script emits actual OTel LogRecords through the OpenTelemetry SDK and ships
them over OTLP to the Collector defined in otel-collector/config.yaml, which
then exports to Splunk HEC. This is the same integration pattern a real
customer would use:

    app code -> stdlib `logging` + OTel LoggingHandler -> OTLP -> Collector
        -> splunkhecexporter -> Splunk index

Each business milestone is logged with the business.* attributes from
backend/app/schema.py attached as log record attributes (via `extra=`).

Requires:
    pip install -r scripts/requirements-otel.txt

Requires the Collector to be running and reachable, e.g.:
    docker run --rm -p 4317:4317 -p 4318:4318 \\
        --env-file otel-collector/.env \\
        -v $(pwd)/otel-collector/config.yaml:/etc/otelcol-contrib/config.yaml \\
        otel/opentelemetry-collector-contrib:latest

Usage:
    python3 scripts/generate_synthetic_data_otel.py --flows 200 --days-back 14 \\
        --otlp-endpoint http://localhost:4318/v1/logs
"""

import argparse
import logging
import random
import time
from datetime import datetime, timedelta, timezone

from opentelemetry.exporter.otlp.proto.http._log_exporter import OTLPLogExporter
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.sdk.resources import Resource

from _flow_model import PROCESS, generate_flow_events


def build_handler(otlp_endpoint: str) -> LoggingHandler:
    resource = Resource.create({"service.name": "business-flow-demo"})
    provider = LoggerProvider(resource=resource)
    provider.add_log_record_processor(BatchLogRecordProcessor(OTLPLogExporter(endpoint=otlp_endpoint)))
    return LoggingHandler(level=logging.INFO, logger_provider=provider)


def emit_milestone(logger: logging.Logger, milestone: str, correlation_id: str, timestamp: float,
                    exception: bool = False, revenue: float | None = None) -> None:
    """Backdate the LogRecord's timestamp to `timestamp` and attach business.* attributes.

    A real customer would usually just call logger.info(..., extra={...}) at the
    moment the milestone happens (i.e. with the current time). We manually set
    `created` here only so the demo data can be spread across --days-back.
    """
    extra = {
        "business.process": PROCESS,
        "business.milestone": milestone,
        "business.correlation_id": correlation_id,
        "business.exception": "true" if exception else "false",
    }
    if revenue is not None:
        extra["business.revenue"] = revenue

    record = logger.makeRecord(
        logger.name, logging.INFO, __file__, 0, f"milestone: {milestone}", None, None, extra=extra,
    )
    record.created = timestamp
    for handler in logger.handlers:
        handler.emit(record)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--flows", type=int, default=200)
    parser.add_argument("--days-back", type=int, default=14)
    parser.add_argument("--otlp-endpoint", default="http://localhost:4318/v1/logs")
    args = parser.parse_args()

    handler = build_handler(args.otlp_endpoint)
    logger = logging.getLogger("business_flow")
    logger.setLevel(logging.INFO)
    logger.addHandler(handler)

    now = datetime.now(timezone.utc)
    for i in range(args.flows):
        start = now - timedelta(days=random.uniform(0, args.days_back))
        for ev in generate_flow_events(start):
            emit_milestone(logger, ev.milestone, ev.correlation_id, ev.timestamp, ev.exception, ev.revenue)

        if (i + 1) % 25 == 0:
            print(f"{i + 1}/{args.flows} flows emitted")

    # Force the batch processor to flush before the process exits.
    handler._logger_provider.force_flush()
    time.sleep(1)
    print("done")


if __name__ == "__main__":
    main()
