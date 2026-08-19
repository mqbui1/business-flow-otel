import { useState } from "react";
import { api } from "../api/client";
import {
  colors,
  inputStyle,
  modalCardStyle,
  modalOverlayStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
} from "../theme";

export function NewAlertModal({
  process,
  milestones,
  onClose,
}: {
  process: string;
  milestones: string[];
  onClose: () => void;
}) {
  const [name, setName] = useState(`${process}-error-alert`);
  const [threshold, setThreshold] = useState(10);
  const [milestone, setMilestone] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = () => {
    setStatus("submitting");
    api
      .createAlert(process, { name, threshold, milestone: milestone || undefined })
      .then(() => {
        setStatus("done");
        setMessage(`Alert "${name}" created in Splunk.`);
      })
      .catch((e) => {
        setStatus("error");
        setMessage(e.message);
      });
  };

  return (
    <div onClick={onClose} style={modalOverlayStyle}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...modalCardStyle,
          width: 380,
          fontSize: 13,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>New alert</div>
          <button onClick={onClose} style={secondaryButtonStyle}>
            close
          </button>
        </div>
        <div style={{ color: colors.textMuted, marginTop: 4 }}>
          Creates a real scheduled saved-search alert in Splunk (checks every 5 minutes).
        </div>

        <label style={{ display: "block", marginTop: 16 }}>
          Alert name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ ...inputStyle, width: "100%", marginTop: 4, boxSizing: "border-box" }}
          />
        </label>

        <label style={{ display: "block", marginTop: 12 }}>
          Trigger when exceptions (last 5 min) &gt;
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            style={{ ...inputStyle, width: "100%", marginTop: 4, boxSizing: "border-box" }}
          />
        </label>

        <label style={{ display: "block", marginTop: 12 }}>
          Scope to entity (optional)
          <select
            value={milestone}
            onChange={(e) => setMilestone(e.target.value)}
            style={{ ...inputStyle, width: "100%", marginTop: 4, boxSizing: "border-box" }}
          >
            <option value="">All milestones</option>
            {milestones.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        {status === "done" && <div style={{ marginTop: 12, color: colors.success }}>{message}</div>}
        {status === "error" && <div style={{ marginTop: 12, color: colors.danger }}>Failed: {message}</div>}

        <button
          onClick={submit}
          disabled={status === "submitting" || status === "done"}
          style={{
            ...primaryButtonStyle,
            marginTop: 20,
            width: "100%",
            padding: 8,
            opacity: status === "submitting" || status === "done" ? 0.6 : 1,
          }}
        >
          {status === "submitting" ? "Creating…" : "Create alert in Splunk"}
        </button>
      </div>
    </div>
  );
}
