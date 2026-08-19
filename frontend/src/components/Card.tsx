import type { ReactNode } from "react";
import { cardBodyStyle, cardHeaderBarStyle, cardOuterStyle, cardTitleStyle } from "../theme";

export function Card({
  title,
  action,
  children,
  style,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ ...cardOuterStyle, ...style }}>
      {title && (
        <div style={cardHeaderBarStyle}>
          <div style={cardTitleStyle}>{title}</div>
          {action}
        </div>
      )}
      <div style={cardBodyStyle}>{children}</div>
    </div>
  );
}
