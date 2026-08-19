import type { CSSProperties } from "react";

export const colors = {
  pageBg: "#0f0f17",
  cardBg: "#1a1a25",
  cardBgAlt: "#20202d",
  border: "#2c2c3a",
  textPrimary: "#ececed",
  textMuted: "#9a9aa8",
  accent: "#1c7ed6",
  accentHover: "#1560b3",
  danger: "#ff6b6b",
  dangerBg: "rgba(255,107,107,0.12)",
  dangerText: "#ff8f8f",
  success: "#4caf50",
  topbarFrom: "#0b0b13",
  topbarTo: "#161225",
  logoOrange: "#ff6a1a",
};

export const radius = 8;

export const cardOuterStyle: CSSProperties = {
  background: colors.cardBg,
  border: `1px solid ${colors.border}`,
  borderRadius: radius,
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
};

export const cardHeaderBarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: colors.cardBgAlt,
  borderBottom: `1px solid ${colors.border}`,
  padding: "10px 16px",
};

export const cardBodyStyle: CSSProperties = {
  padding: 16,
};

export const cardTitleStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: colors.textPrimary,
};

export const primaryButtonStyle: CSSProperties = {
  background: colors.accent,
  color: "#fff",
  border: "none",
  borderRadius: 4,
  padding: "6px 14px",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};

export const secondaryButtonStyle: CSSProperties = {
  background: "transparent",
  color: colors.textPrimary,
  border: `1px solid ${colors.border}`,
  borderRadius: 4,
  padding: "6px 14px",
  fontSize: 13,
  cursor: "pointer",
};

export const linkButtonStyle: CSSProperties = {
  background: "none",
  border: "none",
  color: colors.accent,
  fontSize: 13,
  cursor: "pointer",
  padding: 0,
};

export const inputStyle: CSSProperties = {
  border: `1px solid ${colors.border}`,
  borderRadius: 4,
  padding: "6px 8px",
  fontSize: 13,
  color: colors.textPrimary,
  background: colors.cardBgAlt,
};

export const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
};

export const modalCardStyle: CSSProperties = {
  background: colors.cardBg,
  color: colors.textPrimary,
  borderRadius: radius,
  border: `1px solid ${colors.border}`,
  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
  padding: 20,
  fontFamily: "sans-serif",
};
