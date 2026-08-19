import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FunnelStep } from "../types";
import { colors } from "../theme";

export function FunnelView({ steps }: { steps: FunnelStep[] }) {
  if (!steps.length) return null;
  const baseline = steps[0].flows || 1;
  const data = steps.map((s) => ({ ...s, pct: `${Math.round((s.flows / baseline) * 100)}%` }));

  return (
    <div style={{ height: steps.length * 36 + 40 }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
          <XAxis type="number" tick={{ fontSize: 12, fill: colors.textMuted }} />
          <YAxis
            type="category"
            dataKey="business.milestone"
            width={160}
            interval={0}
            tick={{ fontSize: 12, fill: colors.textPrimary }}
          />
          <Tooltip />
          <Bar dataKey="flows" fill={colors.accent}>
            <LabelList dataKey="pct" position="right" fill={colors.textMuted} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
