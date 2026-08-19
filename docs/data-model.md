# Data model: from raw events to charts

There are 3 distinct layers between "a customer emits a log record" and "a
chart renders in the browser." This doc walks through each layer with the
exact shape at every hop, for every view in the UI.

```
Layer 1: raw OTel LogRecord (per milestone event)
   -> Splunk index (business.* attributes)
Layer 2: SPL aggregation (backend/app/splunk_client.py)
   -> one JSON shape per view, computed fresh on every API call
Layer 3: frontend TS type (frontend/src/types.ts)
   -> passed as props straight into a chart/table component, no further
      client-side aggregation
```

Layer 2 is the part that's easy to miss: **the UI never sees raw milestone
events.** Every chart is backed by a specific `stats`/`timechart`/`streamstats`
SPL query that reshapes raw events into that chart's exact shape. If you're
replacing Splunk with something else (or adding a new chart), this is the
layer you need to reproduce.

---

## Layer 1 recap: the raw event

Every milestone is one OTel LogRecord / Splunk event with these fields (see
`docs/instrumentation-examples.md` for how to emit these):

```json
{
  "business.process": "account_opening",
  "business.milestone": "account_funded",
  "business.correlation_id": "de36cce8-05a4-4001-804a-17e5a6ebee9a",
  "business.exception": "false",
  "business.revenue": 134.44
}
```

Everything below is derived from a collection of these events, one per
`business.correlation_id` per `business.milestone` reached.

---

## Layer 2 + 3, per view

### 1. KPI header strip (`KpiHeader.tsx`)

**Endpoint:** `GET /flows/{process}/kpis` + `GET /flows/{process}/durations`

**SPL (`kpis`):**
```
search index={index} business.process="{process}"
| stats count as total_milestones,
        sum(eval(if('business.exception'="true",1,0))) as exceptions,
        sum(business.revenue) as revenue,
        dc(business.correlation_id) as unique_flows
```

**SPL (`durations`)** — computed by taking the time span between each flow's
first and last milestone, then averaging across flows:
```
search index={index} business.process="{process}"
| stats min(_time) as start_time, max(_time) as end_time by business.correlation_id
| eval duration = end_time - start_time
| stats avg(duration) as avg_duration_sec, max(duration) as max_duration_sec
```

**JSON response / TS type (`Kpis` / `Durations`):**
```json
// kpis
{ "total_milestones": 1779, "exceptions": 110, "revenue": 50403.53, "unique_flows": 302 }
// durations
{ "avg_duration_sec": 331920, "max_duration_sec": 622800 }
```

The component just renders each field as a stat tile — no math happens in
the browser.

---

### 2. Tree (`TreeView.tsx`)

**Endpoints:** `GET /flows/{process}/tree` (nodes) + `GET /flows/{process}/edges`
(edges) + `GET /flows/{process}/definition` (display labels, see §7)

**SPL (`tree`)** — one row per milestone, with volume/exception counts:
```
search index={index} business.process="{process}"
| stats count as volume,
        sum(eval(if('business.exception'="true",1,0))) as exceptions
        by business.milestone
| sort - volume
```

**SPL (`edges`)** — walks each flow in time order and counts `prev -> current`
milestone transitions across *all* flows (this is what makes it a tree/DAG,
not just a list):
```
search index={index} business.process="{process}"
| sort business.correlation_id, _time
| streamstats current=f last(business.milestone) as prev_milestone by business.correlation_id
| where isnotnull(prev_milestone)
| stats count as transitions,
        sum(eval(if('business.exception'="true",1,0))) as exceptions
        by prev_milestone, business.milestone
| rename prev_milestone as source, business.milestone as target
| sort - transitions
```

**JSON / TS types (`MilestoneNode[]` / `FlowEdge[]`):**
```json
// tree
[
  { "business.milestone": "application_submitted", "volume": 302, "exceptions": 0 },
  { "business.milestone": "identity_verification", "volume": 283, "exceptions": 22 },
  { "business.milestone": "identity_verification_failed", "volume": 22, "exceptions": 22 }
]
// edges
[
  { "source": "application_submitted", "target": "identity_verification", "transitions": 283, "exceptions": 0 },
  { "source": "identity_verification", "target": "identity_verification_failed", "transitions": 22, "exceptions": 22 }
]
```

`TreeView.tsx` feeds `nodes` + `edges` into `dagre` to auto-layout the graph,
then renders with `react-flow`. Node position is computed client-side by
dagre — the backend never sends x/y coordinates.

---

### 3. Funnel (`FunnelView.tsx`)

**Endpoint:** `GET /flows/{process}/funnel`

**SPL** — distinct flow count that ever reached each milestone (not total
event count, so a flow that hits a milestone twice doesn't inflate the bar):
```
search index={index} business.process="{process}"
| stats dc(business.correlation_id) as flows by business.milestone
| sort - flows
```

**JSON / TS type (`FunnelStep[]`):**
```json
[
  { "business.milestone": "application_submitted", "flows": 302 },
  { "business.milestone": "identity_verification", "flows": 283 },
  { "business.milestone": "account_funded", "flows": 192 }
]
```

`FunnelView.tsx` computes the conversion `%` labels itself, dividing each
step's `flows` by the first step's `flows` — that's the only client-side
derived math in the whole app.

---

### 4. Flow instances table (`InstanceBrowser.tsx`)

**Endpoint:** `GET /flows/{process}/instances?limit=50`

**SPL** — one row per flow (`business.correlation_id`), listing every
milestone it hit in order, whether any step was an exception, and total
revenue:
```
search index={index} business.process="{process}"
| sort business.correlation_id, _time
| stats list(business.milestone) as milestones,
        max(eval(if('business.exception'="true",1,0))) as had_exception,
        sum(business.revenue) as revenue,
        latest(_time) as _time
        by business.correlation_id
| sort - _time
| head {limit}
```

**JSON / TS type (`Instance[]`):**
```json
[
  {
    "business.correlation_id": "de36cce8-05a4-4001-804a-17e5a6ebee9a",
    "milestones": ["application_submitted", "identity_verification", "documents_submitted", "compliance_review", "credit_check", "account_approved", "account_funded"],
    "had_exception": 0,
    "revenue": 134.44,
    "_time": "2026-08-19T22:12:49.204+00:00"
  }
]
```
(`_time` is returned by the search but currently unused by the table —
`had_exception`/`revenue` drive the Exception/Revenue columns; `milestones`
drives the hover tooltip.)

---

### 5. Instance detail modal (`InstanceDetailModal.tsx`)

**Endpoint:** `GET /flows/{process}/instances/{correlation_id}`

**SPL** — raw per-event rows for one flow, in time order (this is the one
view that's *not* aggregated — it's the literal event list):
```
search index={index} business.process="{process}"
business.correlation_id="{correlation_id}"
| sort _time
| table _time, business.milestone, business.exception, business.revenue,
        trace_id, span_id
```

**JSON / TS type (`InstanceDetailRow[]`):**
```json
[
  { "_time": "2026-08-19T20:41:02.000+00:00", "business.milestone": "application_submitted", "business.exception": "false" },
  { "_time": "2026-08-19T22:12:49.204+00:00", "business.milestone": "credit_check", "business.exception": "false" },
  { "_time": "2026-08-20T02:03:11.500+00:00", "business.milestone": "account_funded", "business.exception": "false", "business.revenue": 134.44, "trace_id": "4bf92f...", "span_id": "00f067..." }
]
```

`trace_id`/`span_id` are only present on rows where the emitting service
attached them (the APM cross-link mentioned in the schema) — otherwise
absent, and the modal renders `—`.

---

### 6. KPI details modal / sparklines (`KpiDetailsModal.tsx`)

**Endpoint:** `GET /flows/{process}/kpi_timeseries`

**SPL** — two queries merged by the backend: an hourly `timechart` for
revenue/flows/exceptions, plus a separate per-flow-duration query rebinned
into the same hourly buckets (duration can't be `timechart`ed directly since
it requires a `stats ... by correlation_id` step first):
```
# kpi_timeseries
search index={index} business.process="{process}"
| timechart span=1h
        sum(business.revenue) as revenue,
        dc(business.correlation_id) as unique_flows,
        sum(eval(if('business.exception'="true",1,0))) as exceptions

# duration_timeseries (merged in by the backend on matching _time bucket)
search index={index} business.process="{process}"
| stats min(_time) as start_time, max(_time) as end_time by business.correlation_id
| eval duration = end_time - start_time, _time = end_time
| bin _time span=1h
| stats avg(duration) as avg_duration_sec by _time
| sort _time
```

**JSON / TS type (`KpiTimeseriesPoint[]`):**
```json
[
  { "_time": "2026-08-19T00:00:00+00:00", "revenue": 1204.50, "unique_flows": 9, "exceptions": 2, "avg_duration_sec": 302400 },
  { "_time": "2026-08-19T01:00:00+00:00", "revenue": 890.00, "unique_flows": 6, "exceptions": 0, "avg_duration_sec": 287100 }
]
```

Fed straight into 4 Recharts `LineChart`/`BarChart` panels, one field each —
no client-side bucketing or math.

---

### 7. Flow definition / entity edit panel (`EntityEditPanel.tsx`)

This is the **one piece of UI state that is not derived from Splunk events
at all.** It's small, hand-edited JSON per process, stored as a file
(`backend/app/flow_definitions_data/{process}.json`), used to attach display
labels/descriptions to milestones that only exist as raw string values
(`business.milestone="account_funded"`) in the event data.

**Endpoints:** `GET /flows/{process}/definition`,
`PUT /flows/{process}/definition/milestones/{milestone}`

**JSON / TS type (`FlowDefinition` / `MilestoneMetadata`):**
```json
{
  "milestones": {
    "documents_submitted": {
      "display_name": "Documents Submitted",
      "description": "KYC docs uploaded",
      "is_exception": false,
      "correlation_id_field": "business.correlation_id"
    }
  }
}
```

Milestones with no entry here just fall back to their raw `business.milestone`
string as the Tree node label. `correlation_id_field` is metadata only today
(not yet used to override which attribute the backend groups by) — it's there
so a customer's edit implies "if your correlation ID isn't
`business.correlation_id`, note the real field name here" as a future hook.

---

## Summary table

| UI element | Endpoint | Backend method | TS type |
|---|---|---|---|
| KPI stat tiles | `/kpis`, `/durations` | `kpis()`, `durations()` | `Kpis`, `Durations` |
| Tree nodes/edges | `/tree`, `/edges` | `tree()`, `edges()` | `MilestoneNode[]`, `FlowEdge[]` |
| Funnel bars | `/funnel` | `funnel()` | `FunnelStep[]` |
| Flow instances table | `/instances` | `instances()` | `Instance[]` |
| Instance detail modal | `/instances/{id}` | `instance_detail()` | `InstanceDetailRow[]` |
| KPI sparklines | `/kpi_timeseries` | `kpi_timeseries()` | `KpiTimeseriesPoint[]` |
| Entity edit panel | `/definition` | `flow_definitions.get_definition()` | `FlowDefinition` |
