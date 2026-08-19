import { useEffect, useState } from "react";
import type { MilestoneMetadata } from "../types";
import { colors, inputStyle, primaryButtonStyle, secondaryButtonStyle } from "../theme";

export function EntityEditPanel({
  milestone,
  metadata,
  onSave,
  onClose,
}: {
  milestone: string | null;
  metadata: MilestoneMetadata | undefined;
  onSave: (metadata: MilestoneMetadata) => void;
  onClose: () => void;
}) {
  const [displayName, setDisplayName] = useState(metadata?.display_name ?? milestone ?? "");
  const [description, setDescription] = useState(metadata?.description ?? "");
  const [isException, setIsException] = useState(metadata?.is_exception ?? false);
  const [correlationIdField, setCorrelationIdField] = useState(
    metadata?.correlation_id_field ?? "business.correlation_id",
  );

  useEffect(() => {
    setDisplayName(metadata?.display_name ?? milestone ?? "");
    setDescription(metadata?.description ?? "");
    setIsException(metadata?.is_exception ?? false);
    setCorrelationIdField(metadata?.correlation_id_field ?? "business.correlation_id");
  }, [milestone, metadata]);

  return (
    <div
      style={{
        position: "fixed",
        top: 48,
        right: 0,
        bottom: 0,
        width: 320,
        background: colors.cardBg,
        color: colors.textPrimary,
        borderLeft: `1px solid ${colors.border}`,
        padding: 16,
        boxShadow: "-2px 0 8px rgba(15,15,20,0.08)",
        overflowY: "auto",
        fontFamily: "sans-serif",
        fontSize: 13,
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>Edit flow</div>
        <button onClick={onClose} style={secondaryButtonStyle}>
          done editing
        </button>
      </div>

      {!milestone && (
        <div style={{ color: colors.textMuted, marginTop: 16 }}>
          Click a node in the Tree to edit its metadata.
        </div>
      )}

      {milestone && (
        <>
          <div style={{ color: colors.textMuted, marginTop: 2 }}>Entity: {milestone}</div>

          <label style={{ display: "block", marginTop: 16 }}>
            Display name
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={{ ...inputStyle, width: "100%", marginTop: 4, boxSizing: "border-box" }}
            />
          </label>

          <label style={{ display: "block", marginTop: 12 }}>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ ...inputStyle, width: "100%", marginTop: 4, boxSizing: "border-box" }}
            />
          </label>

          <label style={{ display: "block", marginTop: 12 }}>
            Correlation ID field
            <input
              value={correlationIdField}
              onChange={(e) => setCorrelationIdField(e.target.value)}
              style={{ ...inputStyle, width: "100%", marginTop: 4, boxSizing: "border-box" }}
            />
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12 }}>
            <input
              type="checkbox"
              checked={isException}
              onChange={(e) => setIsException(e.target.checked)}
            />
            Classify as business exception
          </label>

          <button
            onClick={() =>
              onSave({
                display_name: displayName,
                description,
                is_exception: isException,
                correlation_id_field: correlationIdField,
              })
            }
            style={{ ...primaryButtonStyle, marginTop: 20, width: "100%", padding: 8 }}
          >
            Save
          </button>
        </>
      )}
    </div>
  );
}
