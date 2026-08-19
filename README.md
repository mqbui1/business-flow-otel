# business-flow-otel

Business Flow / milestone-tracking demo (Dynatrace Business Flow-style funnel,
tree, and drill-down UI) backed by Splunk, fed via OpenTelemetry.

## Architecture

```
customer app code
   -> OTel Logs SDK (stdlib `logging` + OTel LoggingHandler)
   -> OTLP (grpc :4317 / http :4318)
   -> OTel Collector (otel-collector/config.yaml)
   -> splunkhecexporter
   -> Splunk index (business_milestones / main)
   -> backend (SPL via /services/search/jobs, backend/app/splunk_client.py)
   -> frontend (Tree / Funnel / Flow instances UI)
```

## Data contract

Milestones are emitted as OTel **LogRecords** (not spans), with these
attributes (see `backend/app/schema.py`):

| Attribute                  | Type                | Notes                                             |
|-----------------------------|---------------------|----------------------------------------------------|
| `business.process`         | string              | e.g. `"account_opening"`                          |
| `business.milestone`       | string              | e.g. `"credit_check"`                             |
| `business.correlation_id`  | string              | stitches milestones into one flow (order/app ID)  |
| `business.exception`       | string `"true"/"false"` | marks a failure-branch milestone              |
| `business.revenue`         | double, optional    | monetary value realized at that step              |
| `trace_id` / `span_id`     | optional            | cross-links into APM if emitted from a traced request |

## How a customer brings their own data in via OTel

1. **Instrument milestones in app code.** At each point in the business
   process where the app already knows its correlation ID (order ID,
   application ID, case ID, etc.), emit a log record with the `business.*`
   attributes above — e.g. in Python, `logging.getLogger(...).info(msg,
   extra={...})` through an OTel `LoggingHandler`, or the equivalent
   OTel Logs Bridge API in Java/Go/.NET.
2. **Point the OTel SDK at the Collector** (`otel-collector/config.yaml`) via
   `OTEL_EXPORTER_OTLP_ENDPOINT` — the Collector batches and forwards to
   Splunk HEC. No backend/frontend code changes are needed as long as
   attribute names match the contract above.
3. **Brownfield alternative:** if the customer already emits spans/logs with
   their own field names, use a Collector `transform`/`attributes` processor
   to derive `business.*` attributes from existing data instead of adding new
   instrumentation calls (e.g. map `order.status="shipped"` ->
   `business.milestone="order_shipped"`).

## Seeding demo data

Two generator scripts in `scripts/`, both driven by the same flow model
(`scripts/_flow_model.py`) so their output is directly comparable:

- **`generate_synthetic_data.py`** — fast path, POSTs straight to Splunk HEC.
  Bypasses the Collector entirely. Good for quickly backfilling history, but
  **not** representative of the customer integration path.
- **`generate_synthetic_data_otel.py`** — emits real OTel LogRecords over
  OTLP through a running Collector, exactly like a real customer would.
  Requires the Collector to be running:

  ```bash
  docker run --rm -p 4317:4317 -p 4318:4318 \
      --env-file otel-collector/.env \
      -v $(pwd)/otel-collector/config.yaml:/etc/otelcol-contrib/config.yaml \
      otel/opentelemetry-collector-contrib:latest

  python3 scripts/generate_synthetic_data_otel.py --flows 200 --days-back 14
  ```

Verified end-to-end: events emitted via this path show up in Splunk (`index=main`)
with correct `business.*` attributes within seconds.
