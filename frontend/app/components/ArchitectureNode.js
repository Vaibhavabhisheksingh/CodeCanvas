import { Handle, Position } from "@xyflow/react";

const componentStyles = {
  client: { background: "#dbeafe", border: "#2563eb" },
  loadBalancer: { background: "#f3e8ff", border: "#9333ea" },
  server: { background: "#dcfce7", border: "#16a34a" },
  cache: { background: "#fef3c7", border: "#d97706" },
  database: { background: "#fee2e2", border: "#dc2626" },
};

export default function ArchitectureNode({ data, type }) {
  const style = componentStyles[type] || componentStyles.server;

  return (
    <div
      style={{
        background: style.background,
        border: `2px solid ${style.border}`,
        borderRadius: "10px",
        padding: "16px 22px",
        minWidth: "130px",
        textAlign: "center",
        color: "#111827",
        fontWeight: 600,
        boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
      }}
    >
      {" "}
      <Handle type="target" position={Position.Left} />
      <div>{data.label}</div>
      <small style={{ display: "block", marginTop: "5px", fontWeight: 400 }}>
        {type === "client" && "Request Source"}
        {type === "loadBalancer" && "Traffic Distribution"}
        {type === "server" && "Request Processing"}
        {type === "cache" && "Fast Data Access"}
        {type === "database" && "Persistent Storage"}
      </small>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
