import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { KpiTimeseriesPoint } from "../types";
import { colors, modalCardStyle, modalOverlayStyle, secondaryButtonStyle } from "../theme";

function formatTick(t: string): string {
  const d = new Date(t);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric" });
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        padding: 12,
        height: 220,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 8 }}>{title}</div>
        {action}
      </div>
      <ResponsiveContainer width="100%" height="85%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}

export function KpiDetailsModal({
  points,
  onNewAlert,
  onClose,
}: {
  points: KpiTimeseriesPoint[];
  onNewAlert?: () => void;
  onClose: () => void;
}) {
  return (
    <div onClick={onClose} style={modalOverlayStyle}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...modalCardStyle,
          width: "90%",
          maxWidth: 1100,
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>KPI details</div>
          <button onClick={onClose} style={secondaryButtonStyle}>
            close
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginTop: 16,
          }}
        >
          <Panel title="Revenue">
            <LineChart data={points}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis dataKey="_time" tickFormatter={formatTick} tick={{ fontSize: 11, fill: colors.textMuted }} />
              <YAxis tick={{ fontSize: 11, fill: colors.textMuted }} />
              <Tooltip labelFormatter={formatTick} />
              <Line type="monotone" dataKey="revenue" stroke="#4a90d9" dot={false} />
            </LineChart>
          </Panel>

          <Panel title="Unique flows">
            <LineChart data={points}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis dataKey="_time" tickFormatter={formatTick} tick={{ fontSize: 11, fill: colors.textMuted }} />
              <YAxis tick={{ fontSize: 11, fill: colors.textMuted }} />
              <Tooltip labelFormatter={formatTick} />
              <Line type="monotone" dataKey="unique_flows" stroke="#65a300" dot={false} />
            </LineChart>
          </Panel>

          <Panel
            title="Errors"
            action={
              onNewAlert && (
                <button onClick={onNewAlert} style={{ ...secondaryButtonStyle, padding: "4px 10px", fontSize: 12 }}>
                  + New alert
                </button>
              )
            }
          >
            <BarChart data={points}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis dataKey="_time" tickFormatter={formatTick} tick={{ fontSize: 11, fill: colors.textMuted }} />
              <YAxis tick={{ fontSize: 11, fill: colors.textMuted }} />
              <Tooltip labelFormatter={formatTick} />
              <Bar dataKey="exceptions" fill="#d32f2f" />
            </BarChart>
          </Panel>

          <Panel title="Avg. duration (sec)">
            <LineChart data={points}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis dataKey="_time" tickFormatter={formatTick} tick={{ fontSize: 11, fill: colors.textMuted }} />
              <YAxis tick={{ fontSize: 11, fill: colors.textMuted }} />
              <Tooltip labelFormatter={formatTick} />
              <Line type="monotone" dataKey="avg_duration_sec" stroke="#e0a800" dot={false} />
            </LineChart>
          </Panel>
        </div>
      </div>
    </div>
  );
}
