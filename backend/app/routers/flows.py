from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from .. import flow_definitions
from ..splunk_client import splunk_client

router = APIRouter(prefix="/flows/{process}", tags=["flows"])


class AlertRequest(BaseModel):
    name: str
    threshold: int
    milestone: str | None = None
    cron_schedule: str = "*/5 * * * *"


@router.get("/kpis")
async def get_kpis(process: str):
    return await splunk_client.kpis(process)


@router.get("/tree")
async def get_tree(process: str):
    return await splunk_client.tree(process)


@router.get("/funnel")
async def get_funnel(process: str):
    return await splunk_client.funnel(process)


@router.get("/edges")
async def get_edges(process: str):
    return await splunk_client.edges(process)


@router.get("/durations")
async def get_durations(process: str):
    return await splunk_client.durations(process)


@router.get("/kpi_timeseries")
async def get_kpi_timeseries(process: str):
    return await splunk_client.kpi_timeseries(process)


@router.get("/instances")
async def get_instances(process: str, limit: int = 50):
    return await splunk_client.instances(process, limit)


@router.get("/instances/{correlation_id}")
async def get_instance_detail(process: str, correlation_id: str):
    return await splunk_client.instance_detail(process, correlation_id)


@router.get("/definition")
async def get_definition(process: str):
    return flow_definitions.get_definition(process)


@router.put("/definition/milestones/{milestone}")
async def put_milestone_definition(process: str, milestone: str, metadata: dict[str, Any]):
    return flow_definitions.update_milestone(process, milestone, metadata)


@router.post("/alerts")
async def create_alert(process: str, body: AlertRequest):
    return await splunk_client.create_alert(
        process, body.name, body.threshold, body.milestone, body.cron_schedule
    )
