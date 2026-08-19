"""Shared account_opening flow-generation model.

Both synthetic data scripts (direct-HEC and OTel-Collector-via-OTLP) use this
same milestone sequence/drop-off model so the two ingestion paths produce
comparable data. See schema.py for the attribute names this feeds into.
"""

import random
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta

PROCESS = "account_opening"

MAIN_SEQUENCE = [
    "application_submitted",
    "identity_verification",
    "documents_submitted",
    "compliance_review",
    "credit_check",
    "account_approved",
    "account_funded",
]

# Probability that a flow does NOT proceed past this stage (drop-off / failure).
DROP_OFF_AFTER = {
    "application_submitted": 0.06,
    "identity_verification": 0.10,
    "documents_submitted": 0.14,
    "compliance_review": 0.08,
    "credit_check": 0.05,
    "account_approved": 0.02,
}

# When a flow drops off after `stage`, emit this exception milestone instead
# of just silently stopping (mirrors a real failure branch, not just a gap).
EXCEPTION_STAGE = {
    "application_submitted": "application_abandoned",
    "identity_verification": "identity_verification_failed",
    "documents_submitted": "documents_rejected",
    "compliance_review": "compliance_hold",
    "credit_check": "credit_check_failed",
    "account_approved": "funding_failed",
}


@dataclass
class MilestoneEvent:
    milestone: str
    correlation_id: str
    timestamp: float
    exception: bool
    revenue: float | None


def generate_flow_events(start_time: datetime) -> list[MilestoneEvent]:
    """Returns the milestone events for one simulated account_opening flow."""
    correlation_id = str(uuid.uuid4())
    account_fee = round(random.uniform(50, 500), 2)
    t = start_time
    events = [MilestoneEvent(MAIN_SEQUENCE[0], correlation_id, t.timestamp(), False, None)]

    for i, stage in enumerate(MAIN_SEQUENCE[1:], start=1):
        prev_stage = MAIN_SEQUENCE[i - 1]
        t += timedelta(hours=random.uniform(1, 36))  # multi-day style gaps between milestones
        if random.random() < DROP_OFF_AFTER.get(prev_stage, 0):
            exc_stage = EXCEPTION_STAGE.get(prev_stage)
            if exc_stage:
                events.append(MilestoneEvent(exc_stage, correlation_id, t.timestamp(), True, None))
            break
        # account fee is only realized once the account is actually funded
        revenue = account_fee if stage == "account_funded" else None
        events.append(MilestoneEvent(stage, correlation_id, t.timestamp(), False, revenue))

    return events
