import dagre from "dagre";
import { useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Edge,
  Node,
  NodeMouseHandler,
  Position,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import type { FlowDefinition, FlowEdge, MilestoneNode } from "../types";
import { colors } from "../theme";

const NODE_WIDTH = 200;
const NODE_HEIGHT = 60;

function layout(
  milestones: MilestoneNode[],
  flowEdges: FlowEdge[],
  definition: FlowDefinition | null,
  selectedMilestone: string | null,
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR" });
  g.setDefaultEdgeLabel(() => ({}));

  milestones.forEach((m) => g.setNode(m["business.milestone"], { width: NODE_WIDTH, height: NODE_HEIGHT }));
  flowEdges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);

  const nodes: Node[] = milestones.map((m) => {
    const pos = g.node(m["business.milestone"]);
    const hasExceptions = m.exceptions > 0;
    const meta = definition?.milestones[m["business.milestone"]];
    const displayName = meta?.display_name ?? m["business.milestone"];
    const isSelected = selectedMilestone === m["business.milestone"];
    // dagre positions nodes by center; react-flow positions by top-left corner.
    return {
      id: m["business.milestone"],
      position: { x: (pos?.x ?? 0) - NODE_WIDTH / 2, y: (pos?.y ?? 0) - NODE_HEIGHT / 2 },
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
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

const FIT_VIEW_OPTIONS = { padding: 0.15, maxZoom: 1.5, duration: 200 };

function FitViewOnChange({ nodes }: { nodes: Node[] }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    if (!nodes.length) return;
    // defer a tick so react-flow has measured actual node DOM sizes first
    const id = requestAnimationFrame(() => fitView(FIT_VIEW_OPTIONS));
    return () => cancelAnimationFrame(id);
  }, [nodes, fitView]);
  return null;
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
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={FIT_VIEW_OPTIONS}
          onNodeClick={handleNodeClick}
        >
          <Background variant={BackgroundVariant.Dots} color={colors.border} gap={16} />
          <FitViewOnChange nodes={nodes} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
