import { useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import type { Instance } from "../types";
import { colors } from "../theme";

export function InstanceBrowser({
  instances,
  onSelect,
}: {
  instances: Instance[];
  onSelect: (correlationId: string) => void;
}) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const cellStyle: CSSProperties = { padding: "8px 8px", color: colors.textPrimary };
  const headerStyle: CSSProperties = {
    padding: "8px 8px",
    fontWeight: 500,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };
  const truncateStyle: CSSProperties = {
    ...cellStyle,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const showTooltip = (text: string) => (e: MouseEvent) =>
    setTooltip({ text, x: e.clientX, y: e.clientY });
  const hideTooltip = () => setTooltip(null);

  return (
    <div>
      <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", tableLayout: "fixed" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${colors.border}`, color: colors.textMuted, textAlign: "left" }}>
            <th style={{ ...headerStyle, width: "30%" }} align="left">
              Correlation ID
            </th>
            <th style={{ ...headerStyle, width: "30%" }} align="left">
              Milestones
            </th>
            <th style={{ ...headerStyle, width: "20%" }} align="left">
              Exception
            </th>
            <th style={{ ...headerStyle, width: "20%" }} align="left">
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
              <td
                style={truncateStyle}
                onMouseEnter={showTooltip(i.milestones?.join(", ") ?? "")}
                onMouseMove={showTooltip(i.milestones?.join(", ") ?? "")}
                onMouseLeave={hideTooltip}
              >
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

      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 12,
            top: tooltip.y + 12,
            zIndex: 1000,
            maxWidth: 300,
            background: colors.cardBgAlt,
            border: `1px solid ${colors.border}`,
            borderRadius: 6,
            padding: "8px 10px",
            fontSize: 12,
            color: colors.textPrimary,
            whiteSpace: "normal",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            pointerEvents: "none",
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
