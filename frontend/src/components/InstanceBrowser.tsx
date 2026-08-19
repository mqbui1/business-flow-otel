import type { CSSProperties } from "react";
import type { Instance } from "../types";
import { colors } from "../theme";

export function InstanceBrowser({
  instances,
  onSelect,
}: {
  instances: Instance[];
  onSelect: (correlationId: string) => void;
}) {
  const cellStyle: CSSProperties = { padding: "8px 8px", color: colors.textPrimary };
  const truncateStyle: CSSProperties = {
    ...cellStyle,
    maxWidth: 220,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  return (
    <div>
      <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${colors.border}`, color: colors.textMuted, textAlign: "left" }}>
            <th style={{ padding: "8px 8px", fontWeight: 500 }} align="left">
              Correlation ID
            </th>
            <th style={{ padding: "8px 8px", fontWeight: 500 }} align="left">
              Milestones
            </th>
            <th style={{ padding: "8px 8px", fontWeight: 500 }} align="left">
              Exception
            </th>
            <th style={{ padding: "8px 8px", fontWeight: 500 }} align="left">
              Revenue
            </th>
          </tr>
        </thead>
        <tbody>
          {instances.map((i) => (
            <tr
              key={i["business.correlation_id"]}
              onClick={() => onSelect(i["business.correlation_id"])}
              style={{ cursor: "pointer", borderBottom: `1px solid ${colors.border}` }}
              onMouseEnter={(e) => (e.currentTarget.style.background = colors.cardBgAlt)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <td style={truncateStyle} title={i["business.correlation_id"]}>
                {i["business.correlation_id"]}
              </td>
              <td style={truncateStyle} title={i.milestones?.join(", ")}>
                {i.milestones?.join(", ")}
              </td>
              <td style={cellStyle}>
                {i.had_exception ? <span style={{ color: colors.danger }}>Yes</span> : "No"}
              </td>
              <td style={cellStyle}>{i.revenue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
