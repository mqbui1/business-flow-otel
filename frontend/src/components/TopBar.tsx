import { colors } from "../theme";

export function TopBar() {
  return (
    <div
      style={{
        height: 48,
        background: `linear-gradient(90deg, ${colors.topbarFrom}, ${colors.topbarTo})`,
        borderBottom: `1px solid ${colors.border}`,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 12,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: 0.2 }}>
        splunk<span style={{ color: colors.logoOrange }}>&gt;</span>
      </div>
      <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.25)" }} />
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.85)" }}>Business Flow</div>
    </div>
  );
}
