export interface Kpis {
  total_milestones: number;
  exceptions: number;
  revenue: number;
  unique_flows: number;
}

export interface MilestoneNode {
  "business.milestone": string;
  volume: number;
  exceptions: number;
}

export interface FunnelStep {
  "business.milestone": string;
  flows: number;
}

export interface FlowEdge {
  source: string;
  target: string;
  transitions: number;
  exceptions: number;
}

export interface Instance {
  "business.correlation_id": string;
  milestones: string[];
  had_exception: number;
  revenue: number;
}

export interface Durations {
  avg_duration_sec: number;
  max_duration_sec: number;
}

export interface InstanceDetailRow {
  _time: string;
  "business.milestone": string;
  "business.exception": string;
  "business.revenue"?: number;
  trace_id?: string;
  span_id?: string;
}

export interface MilestoneMetadata {
  display_name?: string;
  description?: string;
  is_exception?: boolean;
  correlation_id_field?: string;
}

export interface FlowDefinition {
  milestones: Record<string, MilestoneMetadata>;
}

export interface KpiTimeseriesPoint {
  _time: string;
  revenue: number;
  unique_flows: number;
  exceptions: number;
  avg_duration_sec: number;
}
