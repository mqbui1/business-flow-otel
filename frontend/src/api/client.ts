const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

export const api = {
  kpis: (process: string) => get(`/flows/${process}/kpis`),
  tree: (process: string) => get(`/flows/${process}/tree`),
  funnel: (process: string) => get(`/flows/${process}/funnel`),
  edges: (process: string) => get(`/flows/${process}/edges`),
  durations: (process: string) => get(`/flows/${process}/durations`),
  kpiTimeseries: (process: string) => get(`/flows/${process}/kpi_timeseries`),
  instances: (process: string) => get(`/flows/${process}/instances`),
  instanceDetail: (process: string, correlationId: string) =>
    get(`/flows/${process}/instances/${correlationId}`),
  definition: (process: string) => get(`/flows/${process}/definition`),
  updateMilestoneDefinition: (process: string, milestone: string, metadata: unknown) =>
    put(`/flows/${process}/definition/milestones/${encodeURIComponent(milestone)}`, metadata),
  createAlert: (
    process: string,
    body: { name: string; threshold: number; milestone?: string; cron_schedule?: string },
  ) => post(`/flows/${process}/alerts`, body),
};
