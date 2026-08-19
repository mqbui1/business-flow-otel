from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import flows
from .splunk_client import splunk_client

app = FastAPI(title="Business Flow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(flows.router)


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.on_event("shutdown")
async def shutdown() -> None:
    await splunk_client.close()
