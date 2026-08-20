import { Area, AreaChart, ResponsiveContainer } from "recharts";
import type { Durations, KpiTimeseriesPoint, Kpis } from "../types";
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

interface Tile {
  label: string;
  value: string | number;
  sparkKey?: keyof KpiTimeseriesPoint;
  color: string;
}

export function KpiHeader({
  kpis,
  durations,
  timeseries,
  onViewDetails,
}: {
  kpis: Kpis | null;
  durations: Durations | null;
  timeseries: KpiTimeseriesPoint[];
  onViewDetails?: () => void;
}) {
  if (!kpis) return null;

  const tiles: Tile[] = [
    { label: "Unique flows", value: kpis.unique_flows, sparkKey: "unique_flows", color: "#65a300" },
    { label: "Total milestones", value: kpis.total_milestones, color: colors.accent },
    { label: "Exceptions", value: kpis.exceptions, sparkKey: "exceptions", color: "#d32f2f" },
    { label: "Revenue", value: `$${kpis.revenue?.toLocaleString() ?? 0}`, sparkKey: "revenue", color: "#4a90d9" },
    {
      label: "Avg. duration",
      value: formatDuration(durations?.avg_duration_sec),
      sparkKey: "avg_duration_sec",
      color: "#e0a800",
    },
    { label: "Max duration", value: formatDuration(durations?.max_duration_sec), color: colors.textMuted },
  ];

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
      {tiles.map((t) => (
        <KpiTile key={t.label} tile={t} timeseries={timeseries} />
      ))}
      {onViewDetails && (
        <button onClick={onViewDetails} style={{ ...secondaryButtonStyle, alignSelf: "center", marginLeft: "auto" }}>
          View details
        </button>
      )}
    </div>
  );
}

function KpiTile({ tile, timeseries }: { tile: Tile; timeseries: KpiTimeseriesPoint[] }) {
  const gradientId = `spark-${String(tile.sparkKey)}`;
  return (
    <div
      style={{
        flex: 1,
        minWidth: 130,
        border: `1px solid ${colors.border}`,
        borderRadius: 6,
        padding: "10px 12px 6px",
        background: colors.cardBgAlt,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ fontSize: 12, color: colors.textMuted }}>{tile.label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, color: colors.textPrimary, margin: "2px 0" }}>{tile.value}</div>
      <div style={{ height: 32, marginTop: "auto" }}>
        {tile.sparkKey && timeseries.length > 1 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeseries}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={tile.color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={tile.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey={tile.sparkKey}
                stroke={tile.color}
                fill={`url(#${gradientId})`}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
