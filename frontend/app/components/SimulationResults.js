// "use client";

// export default function SimulationResults({ result, onClose }) {
//   if (!result) {
//     return null;
//   }

//   const {
//     traffic,
//     performance,
//     queueing = [],
//     endToEndLatency = {
//       available: false,
//       averageEndToEndMs: null,
//       byClient: [],
//       message: "Run the simulation to calculate end-to-end latency.",
//     },
//   } = result;

//   return (
//     <aside
//       style={{
//         width: "360px",
//         minWidth: "320px",
//         height: "100%",
//         overflowY: "auto",
//         background: "#ffffff",
//         borderLeft: "1px solid #e5e7eb",
//         padding: "20px",
//         color: "#111827",
//       }}
//     >
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           marginBottom: "20px",
//         }}
//       >
//         <h2 style={{ fontSize: "20px", margin: 0 }}>Simulation Results</h2>

//         <button
//           onClick={onClose}
//           style={{
//             border: "none",
//             background: "#f3f4f6",
//             borderRadius: "6px",
//             padding: "6px 10px",
//             cursor: "pointer",
//           }}
//         >
//           Close
//         </button>
//       </div>

//       <section style={{ marginBottom: "24px" }}>
//         <h3 style={{ fontSize: "15px" }}>Overview</h3>

//         <p>
//           Total incoming traffic:{" "}
//           <strong>{traffic.totalIncomingTraffic.toLocaleString()} req/s</strong>
//         </p>

//         <p>
//           Components analyzed: <strong>{performance.components.length}</strong>
//         </p>

//         <p>
//           Overloaded components:{" "}
//           <strong>{performance.bottlenecks.length}</strong>
//         </p>

//         <div
//           style={{
//             padding: "12px",
//             borderRadius: "8px",
//             background: performance.hasBottlenecks ? "#fee2e2" : "#dcfce7",
//             color: performance.hasBottlenecks ? "#991b1b" : "#166534",
//           }}
//         >
//           <strong>
//             {performance.hasBottlenecks
//               ? "Capacity bottlenecks detected"
//               : "No capacity overload detected"}
//           </strong>
//         </div>
//       </section>

//       <section>
//         <h3 style={{ fontSize: "15px" }}>Component Performance</h3>

//         {performance.components.map((component) => (
//           <article
//             key={component.nodeId}
//             style={{
//               padding: "12px",
//               marginBottom: "12px",
//               border: "1px solid #e5e7eb",
//               borderRadius: "8px",
//             }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 gap: "8px",
//               }}
//             >
//               <strong>{component.name}</strong>

//               <span
//                 style={{
//                   fontSize: "12px",
//                   fontWeight: 700,
//                   color:
//                     component.status === "red"
//                       ? "#dc2626"
//                       : component.status === "yellow"
//                         ? "#ca8a04"
//                         : "#16a34a",
//                 }}
//               >
//                 {component.status.toUpperCase()}
//               </span>
//             </div>

//             <p style={{ margin: "10px 0 4px", fontSize: "13px" }}>
//               Incoming: {component.incomingTraffic.toLocaleString()} req/s
//             </p>

//             <p style={{ margin: "4px 0", fontSize: "13px" }}>
//               Capacity: {component.totalCapacity.toLocaleString()} req/s
//             </p>

//             <p style={{ margin: "4px 0", fontSize: "13px" }}>
//               Utilization: {component.utilization}%
//             </p>

//             <div
//               style={{
//                 height: "8px",
//                 background: "#e5e7eb",
//                 borderRadius: "4px",
//                 overflow: "hidden",
//                 marginTop: "10px",
//               }}
//             >
//               <div
//                 style={{
//                   height: "100%",
//                   width: `${Math.min(component.utilization, 100)}%`,
//                   background:
//                     component.status === "red"
//                       ? "#dc2626"
//                       : component.status === "yellow"
//                         ? "#eab308"
//                         : "#22c55e",
//                 }}
//               />
//             </div>
//           </article>
//         ))}
//       </section>
//       <section style={{ marginTop: "28px" }}>
//         <h3 style={{ fontSize: "17px" }}>Queueing Analysis</h3>

//         <p style={{ fontSize: "12px", color: "#6b7280" }}>
//           Steady-state estimates based on M/M/1 or M/M/c assumptions.
//         </p>

//         {queueing.map((component) => (
//           <article
//             key={component.nodeId}
//             style={{
//               padding: "12px",
//               marginBottom: "12px",
//               border: "1px solid #e5e7eb",
//               borderRadius: "8px",
//             }}
//           >
//             <strong>{component.name}</strong>

//             <p style={{ fontSize: "13px", margin: "8px 0" }}>
//               Model: {component.model}
//             </p>

//             {component.model === "N/A" ? (
//               <p style={{ fontSize: "13px", color: "#6b7280" }}>
//                 {component.message}
//               </p>
//             ) : (
//               <>
//                 <p style={{ fontSize: "13px", margin: "5px 0" }}>
//                   Arrival rate: {component.arrivalRate.toLocaleString()} req/s
//                 </p>

//                 <p style={{ fontSize: "13px", margin: "5px 0" }}>
//                   Instances: {component.instances}
//                 </p>

//                 <p style={{ fontSize: "13px", margin: "5px 0" }}>
//                   Utilization: {component.utilization}%
//                 </p>

//                 <p style={{ fontSize: "13px", margin: "5px 0" }}>
//                   Queue waiting time:{" "}
//                   {component.averageQueueWaitSeconds === null
//                     ? "Unavailable"
//                     : `${(component.averageQueueWaitSeconds * 1000).toFixed(
//                         3,
//                       )} ms`}
//                 </p>

//                 <p style={{ fontSize: "13px", margin: "5px 0" }}>
//                   Response time:{" "}
//                   {component.averageResponseSeconds === null
//                     ? "Unavailable"
//                     : `${(component.averageResponseSeconds * 1000).toFixed(
//                         3,
//                       )} ms`}
//                 </p>

//                 <div
//                   style={{
//                     marginTop: "10px",
//                     padding: "8px",
//                     borderRadius: "6px",
//                     background: component.stable ? "#dcfce7" : "#fee2e2",
//                     color: component.stable ? "#166534" : "#991b1b",
//                     fontSize: "12px",
//                   }}
//                 >
//                   <strong>
//                     {component.stable ? "Stable queue" : "Unstable queue"}
//                   </strong>

//                   <p style={{ margin: "4px 0 0" }}>{component.message}</p>
//                 </div>
//               </>
//             )}
//           </article>
//         ))}
//       </section>
//       <section
//         style={{
//           marginTop: "28px",
//           padding: "16px",
//           border: "1px solid #e5e7eb",
//           borderRadius: "10px",
//         }}
//       >
//         <h3 style={{ fontSize: "17px", marginBottom: "8px" }}>
//           End-to-End Latency
//         </h3>

//         <p
//           style={{
//             fontSize: "12px",
//             color: "#6b7280",
//             marginBottom: "16px",
//           }}
//         >
//           Estimated request latency across the architecture.
//         </p>

//         <div
//           style={{
//             padding: "14px",
//             borderRadius: "8px",
//             background: endToEndLatency.available ? "#dcfce7" : "#fee2e2",
//             color: endToEndLatency.available ? "#166534" : "#991b1b",
//           }}
//         >
//           <p style={{ fontSize: "13px", margin: "0 0 6px" }}>
//             Average Estimated Latency
//           </p>

//           <strong style={{ fontSize: "28px" }}>
//             {endToEndLatency.available
//               ? `${endToEndLatency.averageEndToEndMs.toFixed(3)} ms`
//               : "Unavailable"}
//           </strong>

//           <p
//             style={{
//               fontSize: "12px",
//               margin: "8px 0 0",
//             }}
//           >
//             {endToEndLatency.message}
//           </p>
//         </div>

//         {endToEndLatency.byClient.map((client) => (
//           <div
//             key={client.nodeId}
//             style={{
//               marginTop: "12px",
//               padding: "12px",
//               border: "1px solid #e5e7eb",
//               borderRadius: "8px",
//             }}
//           >
//             <strong>{client.name}</strong>

//             <p
//               style={{
//                 fontSize: "13px",
//                 margin: "6px 0 0",
//               }}
//             >
//               Estimated latency:{" "}
//               {client.available
//                 ? `${client.latencyMs.toFixed(3)} ms`
//                 : "Unavailable"}
//             </p>
//           </div>
//         ))}
//       </section>
//     </aside>
//   );
// }
"use client";

export default function SimulationResults({ result, onClose }) {
  if (!result) {
    return null;
  }

  const {
    traffic,
    performance,
    queueing = [],
    endToEndLatency = {
      available: false,
      averageEndToEndMs: null,
      byClient: [],
      message: "Run the simulation to calculate end-to-end latency.",
    },
  } = result;

  const getStatusColor = (status) =>
    status === "red" ? "#dc2626" : status === "yellow" ? "#ca8a04" : "#16a34a";

  return (
    <aside style={styles.panel}>
      {" "}
      <header style={styles.header}>
        {" "}
        <div>
          {" "}
          <h2 style={styles.title}>Simulation Results</h2>{" "}
          <p style={styles.subtitle}>Performance & traffic analysis</p>{" "}
        </div>
        <button
          onClick={onClose}
          style={styles.closeButton}
          aria-label="Close simulation results"
        >
          ×
        </button>
      </header>
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Simulation Overview</h3>

        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Incoming Traffic</span>
          <strong style={styles.metricValue}>
            {traffic.totalIncomingTraffic.toLocaleString()}
            <span style={styles.metricUnit}> req/s</span>
          </strong>
        </div>

        <div style={styles.overviewGrid}>
          <div style={styles.smallMetric}>
            <span style={styles.smallMetricLabel}>Components</span>
            <strong>{performance.components.length}</strong>
          </div>

          <div style={styles.smallMetric}>
            <span style={styles.smallMetricLabel}>Overloaded</span>
            <strong
              style={{
                color: performance.bottlenecks.length ? "#dc2626" : "#16a34a",
              }}
            >
              {performance.bottlenecks.length}
            </strong>
          </div>
        </div>

        <div
          style={{
            ...styles.statusCard,
            background: performance.hasBottlenecks ? "#fef2f2" : "#f0fdf4",
            color: performance.hasBottlenecks ? "#991b1b" : "#166534",
            borderColor: performance.hasBottlenecks ? "#fecaca" : "#bbf7d0",
          }}
        >
          <span style={styles.statusIcon}>
            {performance.hasBottlenecks ? "!" : "✓"}
          </span>
          <strong>
            {performance.hasBottlenecks
              ? "Capacity bottlenecks detected"
              : "No capacity overload detected"}
          </strong>
        </div>
      </section>
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Component Performance</h3>

        {performance.components.map((component) => (
          <article key={component.nodeId} style={styles.card}>
            <div style={styles.cardHeader}>
              <strong style={styles.componentName}>{component.name}</strong>

              <span
                style={{
                  ...styles.statusBadge,
                  color: getStatusColor(component.status),
                  background:
                    component.status === "red"
                      ? "#fee2e2"
                      : component.status === "yellow"
                        ? "#fef3c7"
                        : "#dcfce7",
                }}
              >
                {component.status.toUpperCase()}
              </span>
            </div>

            <div style={styles.detailRow}>
              <span>Incoming Traffic</span>
              <strong>
                {component.incomingTraffic.toLocaleString()} req/s
              </strong>
            </div>

            <div style={styles.detailRow}>
              <span>Total Capacity</span>
              <strong>{component.totalCapacity.toLocaleString()} req/s</strong>
            </div>

            <div style={styles.detailRow}>
              <span>Utilization</span>
              <strong>{component.utilization}%</strong>
            </div>

            <div style={styles.progressBackground}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${Math.min(component.utilization, 100)}%`,
                  background: getStatusColor(component.status),
                }}
              />
            </div>
          </article>
        ))}
      </section>
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Queueing Analysis</h3>

        <p style={styles.sectionDescription}>
          Steady-state estimates based on M/M/1 or M/M/c assumptions.
        </p>

        {queueing.map((component) => (
          <article key={component.nodeId} style={styles.card}>
            <strong style={styles.componentName}>{component.name}</strong>

            <div style={styles.modelBadge}>Model: {component.model}</div>

            {component.model === "N/A" ? (
              <p style={styles.unavailableText}>{component.message}</p>
            ) : (
              <>
                <div style={styles.detailRow}>
                  <span>Arrival Rate</span>
                  <strong>
                    {component.arrivalRate.toLocaleString()} req/s
                  </strong>
                </div>

                <div style={styles.detailRow}>
                  <span>Instances</span>
                  <strong>{component.instances}</strong>
                </div>

                <div style={styles.detailRow}>
                  <span>Utilization</span>
                  <strong>{component.utilization}%</strong>
                </div>

                <div style={styles.detailRow}>
                  <span>Queue Waiting Time</span>
                  <strong>
                    {component.averageQueueWaitSeconds === null
                      ? "Unavailable"
                      : `${(component.averageQueueWaitSeconds * 1000).toFixed(3)} ms`}
                  </strong>
                </div>

                <div style={styles.detailRow}>
                  <span>Response Time</span>
                  <strong>
                    {component.averageResponseSeconds === null
                      ? "Unavailable"
                      : `${(component.averageResponseSeconds * 1000).toFixed(3)} ms`}
                  </strong>
                </div>

                <div
                  style={{
                    ...styles.queueStatus,
                    background: component.stable ? "#f0fdf4" : "#fef2f2",
                    color: component.stable ? "#166534" : "#991b1b",
                    borderColor: component.stable ? "#bbf7d0" : "#fecaca",
                  }}
                >
                  <strong>
                    {component.stable ? "✓ Stable Queue" : "! Unstable Queue"}
                  </strong>
                  <p>{component.message}</p>
                </div>
              </>
            )}
          </article>
        ))}
      </section>
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>End-to-End Latency</h3>

        <p style={styles.sectionDescription}>
          Estimated request latency across the architecture.
        </p>

        <div
          style={{
            ...styles.latencyCard,
            background: endToEndLatency.available ? "#f0fdf4" : "#fef2f2",
            color: endToEndLatency.available ? "#166534" : "#991b1b",
            borderColor: endToEndLatency.available ? "#bbf7d0" : "#fecaca",
          }}
        >
          <span style={styles.latencyLabel}>Average Estimated Latency</span>

          <strong style={styles.latencyValue}>
            {endToEndLatency.available
              ? `${endToEndLatency.averageEndToEndMs.toFixed(3)} ms`
              : "Unavailable"}
          </strong>

          <p style={styles.latencyMessage}>{endToEndLatency.message}</p>
        </div>

        {endToEndLatency.byClient.map((client) => (
          <div key={client.nodeId} style={styles.clientLatency}>
            <strong>{client.name}</strong>

            <div style={styles.detailRow}>
              <span>Estimated Latency</span>
              <strong>
                {client.available
                  ? `${client.latencyMs.toFixed(3)} ms`
                  : "Unavailable"}
              </strong>
            </div>
          </div>
        ))}
      </section>
    </aside>
  );
}

const styles = {
  panel: {
    width: "360px",
    minWidth: "320px",
    height: "100%",
    overflowY: "auto",
    background: "#ffffff",
    borderLeft: "1px solid #e5e7eb",
    padding: "22px 18px",
    boxSizing: "border-box",
    color: "#111827",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
  },

  title: {
    fontSize: "18px",
    fontWeight: 700,
    margin: 0,
  },

  subtitle: {
    fontSize: "12px",
    color: "#9ca3af",
    margin: "5px 0 0",
  },

  closeButton: {
    width: "32px",
    height: "32px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    background: "#f9fafb",
    color: "#6b7280",
    fontSize: "22px",
    cursor: "pointer",
  },

  section: {
    marginBottom: "27px",
  },

  sectionTitle: {
    fontSize: "14px",
    fontWeight: 700,
    margin: "0 0 13px",
    color: "#1f2937",
  },

  sectionDescription: {
    fontSize: "11px",
    lineHeight: 1.6,
    color: "#9ca3af",
    margin: "-5px 0 13px",
  },

  metricCard: {
    padding: "16px",
    borderRadius: "11px",
    background: "#eff6ff",
    border: "1px solid #dbeafe",
    marginBottom: "10px",
  },

  metricLabel: {
    display: "block",
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "7px",
  },

  metricValue: {
    fontSize: "27px",
    color: "#1d4ed8",
    fontWeight: 800,
  },

  metricUnit: {
    fontSize: "13px",
    fontWeight: 500,
  },

  overviewGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "12px",
  },

  smallMetric: {
    padding: "13px",
    border: "1px solid #e5e7eb",
    borderRadius: "9px",
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    fontSize: "20px",
    fontWeight: 700,
  },

  smallMetricLabel: {
    fontSize: "11px",
    fontWeight: 500,
    color: "#9ca3af",
  },

  statusCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "13px",
    border: "1px solid",
    borderRadius: "9px",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  statusIcon: {
    width: "22px",
    height: "22px",
    minWidth: "22px",
    borderRadius: "50%",
    background: "#ffffff",
    display: "grid",
    placeItems: "center",
    fontWeight: 800,
  },

  card: {
    padding: "14px",
    marginBottom: "12px",
    border: "1px solid #e5e7eb",
    borderRadius: "11px",
    background: "#ffffff",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    marginBottom: "13px",
  },

  componentName: {
    fontSize: "13px",
    color: "#1f2937",
  },

  statusBadge: {
    padding: "5px 8px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: 800,
  },

  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
    fontSize: "11px",
    color: "#64748b",
    margin: "10px 0",
  },

  progressBackground: {
    height: "7px",
    background: "#f1f5f9",
    borderRadius: "10px",
    overflow: "hidden",
    marginTop: "13px",
  },

  progressFill: {
    height: "100%",
    borderRadius: "10px",
    transition: "width 0.3s ease",
  },

  modelBadge: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "6px",
    background: "#eff6ff",
    color: "#2563eb",
    fontSize: "10px",
    fontWeight: 700,
    marginTop: "10px",
    marginBottom: "8px",
  },

  unavailableText: {
    fontSize: "12px",
    lineHeight: 1.6,
    color: "#64748b",
  },

  queueStatus: {
    padding: "11px",
    border: "1px solid",
    borderRadius: "8px",
    fontSize: "11px",
    marginTop: "13px",
  },

  latencyCard: {
    padding: "17px",
    border: "1px solid",
    borderRadius: "11px",
    marginBottom: "12px",
  },

  latencyLabel: {
    display: "block",
    fontSize: "11px",
    marginBottom: "8px",
  },

  latencyValue: {
    fontSize: "27px",
    fontWeight: 800,
  },

  latencyMessage: {
    fontSize: "11px",
    lineHeight: 1.6,
    margin: "9px 0 0",
  },

  clientLatency: {
    padding: "13px",
    border: "1px solid #e5e7eb",
    borderRadius: "9px",
    marginTop: "10px",
    fontSize: "12px",
  },
};
