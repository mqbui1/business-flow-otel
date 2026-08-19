# Instrumentation examples

These show how a customer would emit `business.*` milestone attributes
(see `backend/app/schema.py`) from their own app code via the OTel Logs API,
so they flow through the Collector (`otel-collector/config.yaml`) into
Splunk. All examples emit a milestone the moment it happens in application
code — no backdating (unlike `scripts/generate_synthetic_data_otel.py`,
which backdates timestamps purely to spread out synthetic demo data).

## Python

```python
import logging
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.sdk.resources import Resource
from opentelemetry.exporter.otlp.proto.http._log_exporter import OTLPLogExporter

provider = LoggerProvider(resource=Resource.create({"service.name": "account-service"}))
provider.add_log_record_processor(
    BatchLogRecordProcessor(OTLPLogExporter(endpoint="http://otel-collector:4318/v1/logs"))
)
logger = logging.getLogger("business_flow")
logger.setLevel(logging.INFO)
logger.addHandler(LoggingHandler(level=logging.INFO, logger_provider=provider))


def submit_application(application_id: str) -> None:
    logger.info("milestone: application_submitted", extra={
        "business.process": "account_opening",
        "business.milestone": "application_submitted",
        "business.correlation_id": application_id,
        "business.exception": "false",
    })


def fund_account(application_id: str, fee: float) -> None:
    logger.info("milestone: account_funded", extra={
        "business.process": "account_opening",
        "business.milestone": "account_funded",
        "business.correlation_id": application_id,
        "business.exception": "false",
        "business.revenue": fee,
    })
```

## Java

```java
import io.opentelemetry.api.GlobalOpenTelemetry;
import io.opentelemetry.api.common.AttributeKey;
import io.opentelemetry.api.logs.Logger;
import io.opentelemetry.api.logs.Severity;

public class BusinessFlow {
    private static final Logger logger =
        GlobalOpenTelemetry.get().getLogsBridge().loggerBuilder("business-flow").build();

    public static void onCreditCheckFailed(String applicationId) {
        logger.logRecordBuilder()
            .setSeverity(Severity.INFO)
            .setBody("milestone: credit_check_failed")
            .setAttribute(AttributeKey.stringKey("business.process"), "account_opening")
            .setAttribute(AttributeKey.stringKey("business.milestone"), "credit_check_failed")
            .setAttribute(AttributeKey.stringKey("business.correlation_id"), applicationId)
            .setAttribute(AttributeKey.stringKey("business.exception"), "true")
            .emit();
    }
}
```

## Node.js

```javascript
const { logs, SeverityNumber } = require('@opentelemetry/api-logs');

const logger = logs.getLogger('business-flow');

function onOrderPlaced(orderId) {
  logger.emit({
    severityNumber: SeverityNumber.INFO,
    body: 'milestone: order_placed',
    attributes: {
      'business.process': 'order_fulfillment',
      'business.milestone': 'order_placed',
      'business.correlation_id': orderId,
      'business.exception': 'false',
    },
  });
}

function onPaymentCaptured(orderId, amount) {
  logger.emit({
    severityNumber: SeverityNumber.INFO,
    body: 'milestone: payment_captured',
    attributes: {
      'business.process': 'order_fulfillment',
      'business.milestone': 'payment_captured',
      'business.correlation_id': orderId,
      'business.exception': 'false',
      'business.revenue': amount,
    },
  });
}
```

## Go

```go
import (
    "context"

    "go.opentelemetry.io/otel/log"
    "go.opentelemetry.io/otel/log/global"
)

func onPaymentCaptured(ctx context.Context, orderID string, amount float64) {
    logger := global.Logger("business-flow")

    var r log.Record
    r.SetSeverity(log.SeverityInfo)
    r.SetBody(log.StringValue("milestone: payment_captured"))
    r.AddAttributes(
        log.String("business.process", "order_fulfillment"),
        log.String("business.milestone", "payment_captured"),
        log.String("business.correlation_id", orderID),
        log.String("business.exception", "false"),
        log.Float64("business.revenue", amount),
    )
    logger.Emit(ctx, r)
}
```

## Brownfield alternative: derive attributes at the Collector

If the customer doesn't want to add new logging calls, an OTel Collector
`transform` processor can derive `business.*` attributes from fields they
already emit, then feed into the same pipeline as `otel-collector/config.yaml`:

```yaml
processors:
  transform/derive_business_milestones:
    log_statements:
      - context: log
        statements:
          - set(attributes["business.process"], "order_fulfillment") where attributes["order.id"] != nil
          - set(attributes["business.correlation_id"], attributes["order.id"]) where attributes["order.id"] != nil
          - set(attributes["business.milestone"], "order_shipped") where attributes["order.status"] == "shipped"
          - set(attributes["business.milestone"], "order_delivered") where attributes["order.status"] == "delivered"
          - set(attributes["business.exception"], "false") where attributes["business.exception"] == nil

service:
  pipelines:
    logs:
      receivers: [otlp]
      processors: [transform/derive_business_milestones, batch]
      exporters: [splunk_hec]
```

This lets the customer point their *existing* OTLP-emitting services at the
Collector unchanged, and the mapping logic lives entirely in Collector config.
