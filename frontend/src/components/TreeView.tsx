import dagre from "dagre";
import { useMemo } from "react";
import ReactFlow, { Background, BackgroundVariant, Edge, Node, NodeMouseHandler, Position } from "reactflow";
import "reactflow/dist/style.css";
import type { FlowDefinition, FlowEdge, MilestoneNode } from "../types";
import { colors } from "../theme";

function layout(
  milestones: MilestoneNode[],
  flowEdges: FlowEdge[],
  definition: FlowDefinition | null,
  selectedMilestone: string | null,
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR" });
  g.setDefaultEdgeLabel(() => ({}));

  milestones.forEach((m) => g.setNode(m["business.milestone"], { width: 200, height: 60 }));
  flowEdges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);

  const nodes: Node[] = milestones.map((m) => {
    const pos = g.node(m["business.milestone"]);
    const hasExceptions = m.exceptions > 0;
    const meta = definition?.milestones[m["business.milestone"]];
    const displayName = meta?.display_name ?? m["business.milestone"];
    const isSelected = selectedMilestone === m["business.milestone"];
    return {
      id: m["business.milestone"],
      position: { x: pos?.x ?? 0, y: pos?.y ?? 0 },
      data: { label: `${displayName}\n${m.volume} (${m.exceptions} exceptions)` },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: {
        whiteSpace: "pre-line",
        cursor: "pointer",
        borderRadius: 6,
        border: `1px solid ${colors.border}`,
        background: colors.cardBgAlt,
        color: colors.textPrimary,
        ...(hasExceptions
          ? { border: `2px solid ${colors.danger}`, background: "rgba(255,107,107,0.12)" }
          : {}),
        ...(isSelected ? { boxShadow: `0 0 0 3px ${colors.accent}` } : {}),
      },
    };
  });

  const edges: Edge[] = flowEdges.map((e) => ({
    id: `${e.source}-${e.target}`,
    source: e.source,
    target: e.target,
    label: String(e.transitions),
    labelStyle: { fill: colors.textMuted },
    style: { stroke: e.exceptions > 0 ? colors.danger : colors.border },
  }));

  return { nodes, edges };
}

export function TreeView({
  milestones,
  edges: flowEdges,
  definition,
  selectedMilestone,
  onNodeClick,
}: {
  milestones: MilestoneNode[];
  edges: FlowEdge[];
  definition?: FlowDefinition | null;
  selectedMilestone?: string | null;
  onNodeClick?: (milestone: string) => void;
}) {
  const { nodes, edges } = useMemo(
    () => layout(milestones, flowEdges, definition ?? null, selectedMilestone ?? null),
    [milestones, flowEdges, definition, selectedMilestone],
  );
  if (!milestones.length) return null;

  const handleNodeClick: NodeMouseHandler = (_, node) => onNodeClick?.(node.id);

  return (
    <div style={{ height: 400, background: colors.pageBg, borderRadius: 6 }}>
      <ReactFlow nodes={nodes} edges={edges} fitView onNodeClick={handleNodeClick}>
        <Background variant={BackgroundVariant.Dots} color={colors.border} gap={16} />
      </ReactFlow>
    </div>
  );
}
