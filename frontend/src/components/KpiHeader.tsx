import type { Durations, Kpis } from "../types";
import { colors, secondaryButtonStyle } from "../theme";

function formatDuration(seconds: number | undefined): string {
  if (!seconds) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function KpiHeader({
  kpis,
  durations,
  onViewDetails,
}: {
  kpis: Kpis | null;
  durations: Durations | null;
  onViewDetails?: () => void;
}) {
  if (!kpis) return null;
  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-end" }}>
      <Stat label="Unique flows" value={kpis.unique_flows} />
      <Stat label="Total milestones" value={kpis.total_milestones} />
      <Stat label="Exceptions" value={kpis.exceptions} />
      <Stat label="Revenue" value={`$${kpis.revenue?.toLocaleString() ?? 0}`} />
      <Stat label="Avg. duration" value={formatDuration(durations?.avg_duration_sec)} />
      <Stat label="Max duration" value={formatDuration(durations?.max_duration_sec)} />
      {onViewDetails && (
        <button onClick={onViewDetails} style={{ ...secondaryButtonStyle, marginLeft: "auto" }}>
          View details
        </button>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: colors.textMuted }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600, color: colors.textPrimary }}>{value}</div>
    </div>
  );
}
