
"use client";

import { useEffect, useState } from "react";

export default function PropertiesPanel({ node, onSave, onClose }) {
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(5000);
  const [servers, setServers] = useState(1);

  useEffect(() => {
    if (node) {
      setName(node.data.label || "");
      setCapacity(node.data.capacity ?? 5000);
      setServers(node.data.servers ?? 1);
    }
  }, [node]);

  if (!node) {
    return (
      <aside style={styles.panel}>
        {" "}
        <div style={styles.heading}>
          {" "}
          <h3 style={styles.title}>Properties</h3>{" "}
        </div>
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>⚙</div>
          <p style={styles.emptyTitle}>No component selected</p>
          <p style={styles.muted}>
            Select a component on the canvas to view and configure its
            properties.
          </p>
        </div>
      </aside>
    );
  }

  const handleSave = () => {
    const parsedCapacity = Number(capacity);
    const parsedServers = Number(servers);

    if (
      !name.trim() ||
      !Number.isFinite(parsedCapacity) ||
      parsedCapacity <= 0 ||
      !Number.isInteger(parsedServers) ||
      parsedServers < 1
    ) {
      window.alert(
        "Enter a valid name, positive capacity and a positive whole number of instances.",
      );
      return;
    }

    onSave(node.id, {
      label: name.trim(),
      capacity: parsedCapacity,
      servers: parsedServers,
    });
  };

  return (
    <aside style={styles.panel}>
      {" "}
      <div style={styles.heading}>
        {" "}
        <div>
          {" "}
          <h3 style={styles.title}>Properties</h3>{" "}
          <p style={styles.subtitle}>Configure your component</p>{" "}
        </div>
        <button
          onClick={onClose}
          style={styles.closeButton}
          aria-label="Close properties panel"
        >
          ×
        </button>
      </div>
      <div style={styles.typeBadge}>
        <span style={styles.statusDot}></span>
        {node.type}
      </div>
      <div style={styles.divider}></div>
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>General Settings</h4>

        <label style={styles.label}>
          Component Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            style={styles.input}
            placeholder="Enter component name"
          />
        </label>
      </div>
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Performance Settings</h4>

        <label style={styles.label}>
          Capacity
          <span style={styles.hint}>Requests per second</span>
          <input
            type="number"
            min="1"
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
            style={styles.input}
          />
        </label>

        <label style={styles.label}>
          Instances
          <span style={styles.hint}>Number of running instances</span>
          <input
            type="number"
            min="1"
            step="1"
            value={servers}
            onChange={(event) => setServers(event.target.value)}
            style={styles.input}
          />
        </label>
      </div>
      <button onClick={handleSave} style={styles.saveButton}>
        ✓ Save Changes
      </button>
    </aside>
  );
}

const styles = {
  panel: {
    width: "270px",
    minWidth: "270px",
    padding: "22px 18px",
    background: "#ffffff",
    borderLeft: "1px solid #e5e7eb",
    overflowY: "auto",
    color: "#111827",
    boxSizing: "border-box",
  },

  heading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px",
  },

  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 700,
    color: "#111827",
  },

  subtitle: {
    margin: "5px 0 0",
    fontSize: "12px",
    color: "#9ca3af",
  },

  closeButton: {
    width: "30px",
    height: "30px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    background: "#f9fafb",
    color: "#6b7280",
    fontSize: "22px",
    cursor: "pointer",
  },

  typeBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "7px 12px",
    borderRadius: "20px",
    background: "#eff6ff",
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "capitalize",
  },

  statusDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#3b82f6",
  },

  divider: {
    height: "1px",
    background: "#f1f5f9",
    margin: "22px 0",
  },

  section: {
    marginBottom: "25px",
  },

  sectionTitle: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.7px",
    margin: "0 0 17px",
  },

  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "17px",
  },

  hint: {
    display: "block",
    fontSize: "11px",
    fontWeight: 400,
    color: "#9ca3af",
    marginTop: "4px",
  },

  input: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    marginTop: "8px",
    padding: "11px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: "9px",
    background: "#f8fafc",
    color: "#111827",
    fontSize: "13px",
    outline: "none",
  },

  saveButton: {
    width: "100%",
    padding: "12px",
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "9px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 3px 8px rgba(37, 99, 235, 0.18)",
  },

  emptyState: {
    textAlign: "center",
    marginTop: "65px",
    padding: "10px",
  },

  emptyIcon: {
    fontSize: "30px",
    marginBottom: "15px",
  },

  emptyTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#374151",
  },

  muted: {
    color: "#9ca3af",
    fontSize: "12px",
    lineHeight: 1.6,
  },
};
