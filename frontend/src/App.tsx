import { useEffect, useMemo, useState } from "react";
import { api } from "./api/client";
import { Card } from "./components/Card";
import { EntityEditPanel } from "./components/EntityEditPanel";
import { FunnelView } from "./components/FunnelView";
import { InstanceBrowser } from "./components/InstanceBrowser";
import { InstanceDetailModal } from "./components/InstanceDetailModal";
import { KpiDetailsModal } from "./components/KpiDetailsModal";
import { KpiHeader } from "./components/KpiHeader";
import { NewAlertModal } from "./components/NewAlertModal";
import { TopBar } from "./components/TopBar";
import { TreeView } from "./components/TreeView";
import { colors, inputStyle, linkButtonStyle, secondaryButtonStyle } from "./theme";
import type {
  Durations,
  FlowDefinition,
  FlowEdge,
  FunnelStep,
  Instance,
  InstanceDetailRow,
  KpiTimeseriesPoint,
  Kpis,
  MilestoneNode,
} from "./types";

const PROCESSES = ["account_opening", "order_fulfillment"];

export default function App() {
  const [process, setProcess] = useState(PROCESSES[0]);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [durations, setDurations] = useState<Durations | null>(null);
  const [tree, setTree] = useState<MilestoneNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [definition, setDefinition] = useState<FlowDefinition | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailRows, setDetailRows] = useState<InstanceDetailRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<string | null>(null);
  const [filterMilestone, setFilterMilestone] = useState<string | null>(null);
  const [showKpiDetails, setShowKpiDetails] = useState(false);
  const [kpiTimeseries, setKpiTimeseries] = useState<KpiTimeseriesPoint[]>([]);
  const [showNewAlert, setShowNewAlert] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setFilterMilestone(null);
    Promise.allSettled([
      api.kpis(process).then((r) => setKpis(r as unknown as Kpis)),
      api.durations(process).then((r) => setDurations(r as unknown as Durations)),
      api.tree(process).then((r) => setTree(r as unknown as MilestoneNode[])),
      api.edges(process).then((r) => setEdges(r as unknown as FlowEdge[])),
      api.funnel(process).then((r) => setFunnel(r as unknown as FunnelStep[])),
      api.instances(process).then((r) => setInstances(r as unknown as Instance[])),
      api.definition(process).then((r) => setDefinition(r as unknown as FlowDefinition)),
      api.kpiTimeseries(process).then((r) => setKpiTimeseries(r as unknown as KpiTimeseriesPoint[])),
    ]).then((results) => {
      const failed = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
      if (failed.length) {
        setError(failed.map((f) => f.reason?.message ?? String(f.reason)).join("; "));
      }
      setLoading(false);
    });
  }, [process]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setDetailError(null);
    api
      .instanceDetail(process, id)
      .then((r) => setDetailRows(r as unknown as InstanceDetailRow[]))
      .catch((e) => setDetailError(e.message));
  };

  const handleNodeClick = (milestone: string) => {
    if (editMode) {
      setEditingMilestone(milestone);
    } else {
      setFilterMilestone((prev) => (prev === milestone ? null : milestone));
    }
  };

  const handleSaveMilestone = (milestone: string, metadata: Parameters<typeof api.updateMilestoneDefinition>[2]) => {
    api.updateMilestoneDefinition(process, milestone, metadata).then((r) => {
      setDefinition(r as unknown as FlowDefinition);
      setEditingMilestone(null);
    });
  };

  const handleViewDetails = () => {
    setShowKpiDetails(true);
  };

  const filteredInstances = useMemo(
    () =>
      filterMilestone
        ? instances.filter((i) => i.milestones?.includes(filterMilestone))
        : instances,
    [instances, filterMilestone],
  );

  return (
    <div style={{ fontFamily: "sans-serif", minHeight: "100vh", background: colors.pageBg }}>
      <TopBar />
      <div style={{ padding: 20, maxWidth: 1440, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 20, color: colors.textPrimary }}>{process}</h1>
          <select value={process} onChange={(e) => setProcess(e.target.value)} style={inputStyle}>
            {PROCESSES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setEditMode((v) => !v);
              setEditingMilestone(null);
              setFilterMilestone(null);
            }}
            style={{ ...secondaryButtonStyle, marginLeft: "auto" }}
          >
            {editMode ? "Done editing" : "Edit flow"}
          </button>
        </div>

        {loading && <div style={{ padding: 8, color: colors.textMuted, fontSize: 13 }}>Loading…</div>}
        {error && (
          <div
            style={{
              padding: 8,
              marginBottom: 16,
              background: colors.dangerBg,
              color: colors.dangerText,
              borderRadius: 4,
              fontSize: 13,
            }}
          >
            Failed to load some data: {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 16, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            <KpiHeader kpis={kpis} durations={durations} timeseries={kpiTimeseries} onViewDetails={handleViewDetails} />

            <Card title="Tree">
              <TreeView
                milestones={tree}
                edges={edges}
                definition={definition}
                selectedMilestone={filterMilestone}
                onNodeClick={handleNodeClick}
              />
            </Card>

            <Card title="Funnel">
              <FunnelView steps={funnel} />
            </Card>
          </div>

          <Card
            title="Flow instances"
            style={{
              position: "sticky",
              top: 68,
              maxHeight: "calc(100vh - 84px)",
              overflowY: "auto",
            }}
            action={
              filterMilestone && (
                <button onClick={() => setFilterMilestone(null)} style={linkButtonStyle}>
                  clear ×
                </button>
              )
            }
          >
            {filterMilestone && (
              <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 8 }}>
                Filtered by entity: <strong style={{ color: colors.textPrimary }}>{filterMilestone}</strong>
              </div>
            )}
            <InstanceBrowser instances={filteredInstances} onSelect={handleSelect} />
          </Card>
        </div>
      </div>

      {selectedId && (
        <InstanceDetailModal
          correlationId={selectedId}
          rows={detailRows}
          error={detailError}
          onClose={() => setSelectedId(null)}
        />
      )}
      {showKpiDetails && (
        <KpiDetailsModal
          points={kpiTimeseries}
          onNewAlert={() => setShowNewAlert(true)}
          onClose={() => setShowKpiDetails(false)}
        />
      )}
      {showNewAlert && (
        <NewAlertModal
          process={process}
          milestones={tree.map((m) => m["business.milestone"])}
          onClose={() => setShowNewAlert(false)}
        />
      )}
      {editMode && (
        <EntityEditPanel
          milestone={editingMilestone}
          metadata={editingMilestone ? definition?.milestones[editingMilestone] : undefined}
          onSave={(metadata) => editingMilestone && handleSaveMilestone(editingMilestone, metadata)}
          onClose={() => setEditMode(false)}
        />
      )}
    </div>
  );
}
