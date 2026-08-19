"""Thin wrapper around Splunk's REST search API (/services/search/jobs).

Reuses the SPL patterns already validated in the ITSI proposal (Section 5):
milestone volume, exception rate, funnel/drop-off, inter-milestone duration
via `transaction`, and per-flow drill-down by correlation ID.
"""

import asyncio
from typing import Any

import httpx

from .config import settings

_SPL = {
    "kpis": '''
        search index={index} business.process="{process}"
        | stats count as total_milestones,
                sum(eval(if('business.exception'="true",1,0))) as exceptions,
                sum(business.revenue) as revenue,
                dc(business.correlation_id) as unique_flows
    ''',
    "tree": '''
        search index={index} business.process="{process}"
        | stats count as volume,
                sum(eval(if('business.exception'="true",1,0))) as exceptions
                by business.milestone
        | sort - volume
    ''',
    "funnel": '''
        search index={index} business.process="{process}"
        | stats dc(business.correlation_id) as flows by business.milestone
        | sort - flows
    ''',
    "edges": '''
        search index={index} business.process="{process}"
        | sort business.correlation_id, _time
        | streamstats current=f last(business.milestone) as prev_milestone by business.correlation_id
        | where isnotnull(prev_milestone)
        | stats count as transitions,
                sum(eval(if('business.exception'="true",1,0))) as exceptions
                by prev_milestone, business.milestone
        | rename prev_milestone as source, business.milestone as target
        | sort - transitions
    ''',
    "durations": '''
        search index={index} business.process="{process}"
        | stats min(_time) as start_time, max(_time) as end_time by business.correlation_id
        | eval duration = end_time - start_time
        | stats avg(duration) as avg_duration_sec, max(duration) as max_duration_sec
    ''',
    "instances": '''
        search index={index} business.process="{process}"
        | sort business.correlation_id, _time
        | stats list(business.milestone) as milestones,
                max(eval(if('business.exception'="true",1,0))) as had_exception,
                sum(business.revenue) as revenue,
                latest(_time) as _time
                by business.correlation_id
        | sort - _time
        | head {limit}
    ''',
    "kpi_timeseries": '''
        search index={index} business.process="{process}"
        | timechart span=1h
                sum(business.revenue) as revenue,
                dc(business.correlation_id) as unique_flows,
                sum(eval(if('business.exception'="true",1,0))) as exceptions
    ''',
    "duration_timeseries": '''
        search index={index} business.process="{process}"
        | stats min(_time) as start_time, max(_time) as end_time by business.correlation_id
        | eval duration = end_time - start_time, _time = end_time
        | bin _time span=1h
        | stats avg(duration) as avg_duration_sec by _time
        | sort _time
    ''',
    "instance_detail": '''
        search index={index} business.process="{process}"
        business.correlation_id="{correlation_id}"
        | sort _time
        | table _time, business.milestone, business.exception, business.revenue,
                trace_id, span_id
    ''',
}


def _to_number(value: Any) -> Any:
    """Splunk's REST API returns every stats value as a string. Coerce fields
    that are actually numeric so JSON consumers (e.g. Recharts) don't fall
    back to lexical string comparison for domain/axis calculations."""
    if not isinstance(value, str):
        return value
    try:
        return int(value)
    except ValueError:
        try:
            return float(value)
        except ValueError:
            return value


def _coerce(row: dict[str, Any], fields: list[str]) -> dict[str, Any]:
    return {**row, **{f: _to_number(row[f]) for f in fields if f in row}}


class SplunkClient:
    def __init__(self) -> None:
        self._client = httpx.AsyncClient(
            base_url=settings.splunk_base_url,
            headers={"Authorization": f"Bearer {settings.splunk_token}"},
            verify=settings.verify_tls,
        )

    async def close(self) -> None:
        await self._client.aclose()

    async def run_search(self, spl: str) -> list[dict[str, Any]]:
        create = await self._client.post(
            "/services/search/jobs",
            data={"search": spl, "output_mode": "json", "exec_mode": "blocking"},
        )
        create.raise_for_status()
        sid = create.json()["sid"]

        for _ in range(30):
            results = await self._client.get(
                f"/services/search/jobs/{sid}/results",
                params={"output_mode": "json"},
            )
            if results.status_code == 200:
                return results.json().get("results", [])
            await asyncio.sleep(1)
        raise TimeoutError(f"Splunk search job {sid} did not return results in time")

    async def kpis(self, process: str) -> dict[str, Any]:
        rows = await self.run_search(
            _SPL["kpis"].format(index=settings.splunk_index, process=process)
        )
        if not rows:
            return {"total_milestones": 0, "exceptions": 0, "revenue": 0, "unique_flows": 0}
        return _coerce(rows[0], ["total_milestones", "exceptions", "revenue", "unique_flows"])

    async def tree(self, process: str) -> list[dict[str, Any]]:
        rows = await self.run_search(
            _SPL["tree"].format(index=settings.splunk_index, process=process)
        )
        return [_coerce(r, ["volume", "exceptions"]) for r in rows]

    async def funnel(self, process: str) -> list[dict[str, Any]]:
        rows = await self.run_search(
            _SPL["funnel"].format(index=settings.splunk_index, process=process)
        )
        return [_coerce(r, ["flows"]) for r in rows]

    async def edges(self, process: str) -> list[dict[str, Any]]:
        rows = await self.run_search(
            _SPL["edges"].format(index=settings.splunk_index, process=process)
        )
        return [_coerce(r, ["transitions", "exceptions"]) for r in rows]

    async def durations(self, process: str) -> dict[str, Any]:
        rows = await self.run_search(
            _SPL["durations"].format(index=settings.splunk_index, process=process)
        )
        if not rows:
            return {"avg_duration_sec": 0, "max_duration_sec": 0}
        return _coerce(rows[0], ["avg_duration_sec", "max_duration_sec"])

    async def kpi_timeseries(self, process: str) -> list[dict[str, Any]]:
        kpi_rows = await self.run_search(
            _SPL["kpi_timeseries"].format(index=settings.splunk_index, process=process)
        )
        duration_rows = await self.run_search(
            _SPL["duration_timeseries"].format(index=settings.splunk_index, process=process)
        )
        duration_by_time = {r["_time"]: r.get("avg_duration_sec") for r in duration_rows}
        merged = []
        for r in kpi_rows:
            row = _coerce(r, ["revenue", "unique_flows", "exceptions"])
            for field in ("revenue", "unique_flows", "exceptions"):
                row.setdefault(field, 0)
            row["avg_duration_sec"] = _to_number(duration_by_time.get(r["_time"])) or 0
            merged.append(row)
        return merged

    async def instances(self, process: str, limit: int = 50) -> list[dict[str, Any]]:
        rows = await self.run_search(
            _SPL["instances"].format(
                index=settings.splunk_index, process=process, limit=limit
            )
        )
        return [_coerce(r, ["had_exception", "revenue"]) for r in rows]

    async def instance_detail(self, process: str, correlation_id: str) -> list[dict[str, Any]]:
        rows = await self.run_search(
            _SPL["instance_detail"].format(
                index=settings.splunk_index,
                process=process,
                correlation_id=correlation_id,
            )
        )
        return [_coerce(r, ["business.revenue"]) for r in rows]

    async def create_alert(
        self,
        process: str,
        name: str,
        threshold: int,
        milestone: str | None = None,
        cron_schedule: str = "*/5 * * * *",
    ) -> dict[str, Any]:
        """Creates a real scheduled saved-search alert in Splunk (fires when
        the exception count for this process/milestone over the last 5 minutes
        exceeds `threshold`)."""
        milestone_filter = f' business.milestone="{milestone}"' if milestone else ""
        search = (
            f'search index={settings.splunk_index} business.process="{process}"'
            f'{milestone_filter} \'business.exception\'="true"'
            f" | stats count as exception_count"
        )
        response = await self._client.post(
            "/servicesNS/-/-/saved/searches",
            data={
                "name": name,
                "search": search,
                "is_scheduled": "1",
                "cron_schedule": cron_schedule,
                "dispatch.earliest_time": "-5m",
                "dispatch.latest_time": "now",
                "alert_type": "number of events",
                "alert_comparator": "greater than",
                "alert_threshold": str(threshold),
                "alert.severity": "4",
                "actions": "",
            },
            headers={"Accept": "application/json"},
            params={"output_mode": "json"},
        )
        response.raise_for_status()
        return response.json()


splunk_client = SplunkClient()
