"""OTel LogRecord attribute keys for the Business Flow milestone schema.

These are the attribute names emitted by instrumented services and expected
by the SPL queries in splunk_client.py. Keep this in sync with
otel-collector/config.yaml's header comment.
"""

PROCESS = "business.process"
MILESTONE = "business.milestone"
CORRELATION_ID = "business.correlation_id"
EXCEPTION = "business.exception"
REVENUE = "business.revenue"
TRACE_ID = "trace_id"
SPAN_ID = "span_id"
