import type { InstanceDetailRow } from "../types";
import { colors, modalCardStyle, modalOverlayStyle, secondaryButtonStyle } from "../theme";

export function InstanceDetailModal({
  correlationId,
  rows,
  error,
  onClose,
}: {
  correlationId: string;
  rows: InstanceDetailRow[];
  error?: string | null;
  onClose: () => void;
}) {
  return (
    <div onClick={onClose} style={modalOverlayStyle}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...modalCardStyle,
          width: "80%",
          maxWidth: 900,
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Correlation ID: {correlationId}</div>
            <div style={{ fontSize: 12, color: colors.textMuted }}>{rows.length} records (events)</div>
          </div>
          <button onClick={onClose} style={secondaryButtonStyle}>
            close
          </button>
        </div>

        {error && (
          <div
            style={{
              marginTop: 12,
              padding: 8,
              background: colors.dangerBg,
              color: colors.dangerText,
              borderRadius: 4,
              fontSize: 13,
            }}
          >
            Failed to load details: {error}
          </div>
        )}

        <table style={{ width: "100%", fontSize: 13, marginTop: 16, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.border}`, textAlign: "left", color: colors.textMuted }}>
              <th style={{ padding: "6px 8px" }}>Timestamp</th>
              <th style={{ padding: "6px 8px" }}>Step</th>
              <th style={{ padding: "6px 8px" }}>Is exception</th>
              <th style={{ padding: "6px 8px" }}>Revenue</th>
              <th style={{ padding: "6px 8px" }}>Trace ID</th>
              <th style={{ padding: "6px 8px" }}>Span ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }}>
                <td style={{ padding: "6px 8px" }}>{r._time}</td>
                <td style={{ padding: "6px 8px" }}>{r["business.milestone"]}</td>
                <td style={{ padding: "6px 8px" }}>{r["business.exception"] === "true" ? "True" : "False"}</td>
                <td style={{ padding: "6px 8px" }}>{r["business.revenue"] ?? "—"}</td>
                <td style={{ padding: "6px 8px" }}>{r.trace_id ?? "—"}</td>
                <td style={{ padding: "6px 8px" }}>{r.span_id ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
