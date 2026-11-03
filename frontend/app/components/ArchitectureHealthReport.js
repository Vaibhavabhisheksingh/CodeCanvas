

"use client";

const severityStyles = {
  critical: {
    background: "#fee2e2",
    color: "#991b1b",
    label: "CRITICAL",
  },
  high: {
    background: "#ffedd5",
    color: "#9a3412",
    label: "HIGH",
  },
  medium: {
    background: "#fef3c7",
    color: "#92400e",
    label: "MEDIUM",
  },
  low: {
    background: "#dbeafe",
    color: "#1e40af",
    label: "LOW",
  },
};

export default function ArchitectureHealthReport({ report, onClose }) {
  if (!report) {
    return null;
  }

  const scoreColor =
    report.score >= 85 ? "#15803d" : report.score >= 70 ? "#a16207" : "#dc2626";

  return (
    <aside style={styles.panel}>
      {" "}
      <header style={styles.header}>
        {" "}
        <div>
          {" "}
          <h2 style={styles.title}>Architecture Health</h2>{" "}
          <p style={styles.subtitle}>Analysis & recommendations</p>{" "}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close architecture health report"
            style={styles.closeButton}
          >
            ×
          </button>
        )}
      </header>
      <section style={styles.scoreCard}>
        <p style={styles.scoreLabel}>Architecture Health Score</p>

        <div style={{ ...styles.score, color: scoreColor }}>
          {report.score}
          <span style={styles.scoreMax}>/100</span>
        </div>

        <span
          style={{
            ...styles.ratingBadge,
            color: scoreColor,
            background: `${scoreColor}15`,
          }}
        >
          {report.rating}
        </span>

        <p style={styles.analyzed}>
          {report.analyzedComponents} components analyzed
        </p>

        <div style={styles.progressBackground}>
          <div
            style={{
              ...styles.progressFill,
              width: `${Math.max(0, Math.min(100, report.score))}%`,
              background: scoreColor,
            }}
          />
        </div>
      </section>
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Findings Summary</h3>
          <span style={styles.totalBadge}>{report.findings.length} total</span>
        </div>

        <div style={styles.summaryGrid}>
          {Object.entries(report.counts).map(([severity, count]) => {
            const severityStyle = severityStyles[severity];

            if (!severityStyle) return null;

            return (
              <div
                key={severity}
                style={{
                  ...styles.summaryCard,
                  background: severityStyle.background,
                  color: severityStyle.color,
                }}
              >
                <span style={styles.summaryLabel}>{severityStyle.label}</span>
                <strong style={styles.summaryCount}>{count}</strong>
              </div>
            );
          })}
        </div>
      </section>
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Findings ({report.findings.length})</h3>

        {report.findings.length === 0 ? (
          <div style={styles.successCard}>
            <div style={styles.successIcon}>✓</div>
            <strong>No issues detected</strong>
            <p style={styles.successText}>
              No issues were detected by the current checks. This does not
              guarantee production readiness.
            </p>
          </div>
        ) : (
          report.findings.map((finding) => {
            const severityStyle =
              severityStyles[finding.severity] || severityStyles.low;

            return (
              <article key={finding.id} style={styles.findingCard}>
                <div style={styles.findingHeader}>
                  <span
                    style={{
                      ...styles.severityBadge,
                      background: severityStyle.background,
                      color: severityStyle.color,
                    }}
                  >
                    {severityStyle.label}
                  </span>
                </div>

                <h4 style={styles.findingTitle}>{finding.title}</h4>

                <p style={styles.description}>{finding.description}</p>

                <div style={styles.recommendation}>
                  <strong style={styles.recommendationTitle}>
                    Recommendation
                  </strong>
                  <p style={styles.recommendationText}>
                    {finding.recommendation}
                  </p>
                </div>

                <div style={styles.category}>
                  {finding.category}
                  {finding.componentName ? ` · ${finding.componentName}` : ""}
                </div>
              </article>
            );
          })
        )}
      </section>
      <div style={styles.footer}>{report.scoringNote}</div>
    </aside>
  );
}

const styles = {
  panel: {
    width: "360px",
    minWidth: "320px",
    height: "100%",
    overflowY: "auto",
    padding: "22px 18px",
    boxSizing: "border-box",
    background: "#ffffff",
    borderLeft: "1px solid #e5e7eb",
    color: "#111827",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "22px",
  },

  title: {
    fontSize: "18px",
    fontWeight: 700,
    margin: 0,
  },

  subtitle: {
    margin: "5px 0 0",
    fontSize: "12px",
    color: "#9ca3af",
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

  scoreCard: {
    padding: "20px 16px",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    textAlign: "center",
    marginBottom: "25px",
    background: "#ffffff",
  },

  scoreLabel: {
    margin: "0 0 10px",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 600,
  },

  score: {
    fontSize: "46px",
    fontWeight: 800,
    lineHeight: 1.2,
  },

  scoreMax: {
    fontSize: "19px",
    color: "#9ca3af",
    fontWeight: 500,
  },

  ratingBadge: {
    display: "inline-block",
    marginTop: "10px",
    padding: "6px 13px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 700,
  },

  analyzed: {
    fontSize: "11px",
    color: "#9ca3af",
    margin: "12px 0",
  },

  progressBackground: {
    height: "7px",
    background: "#f1f5f9",
    borderRadius: "10px",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: "10px",
    transition: "width 0.3s ease",
  },

  section: {
    marginBottom: "25px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "13px",
  },

  sectionTitle: {
    fontSize: "14px",
    fontWeight: 700,
    margin: "0 0 13px",
    color: "#1f2937",
  },

  totalBadge: {
    fontSize: "11px",
    color: "#64748b",
    background: "#f1f5f9",
    padding: "5px 9px",
    borderRadius: "15px",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },

  summaryCard: {
    padding: "13px",
    borderRadius: "10px",
  },

  summaryLabel: {
    display: "block",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.5px",
  },

  summaryCount: {
    display: "block",
    fontSize: "25px",
    marginTop: "5px",
  },

  findingCard: {
    padding: "15px",
    marginBottom: "12px",
    border: "1px solid #e5e7eb",
    borderRadius: "11px",
    background: "#ffffff",
  },

  findingHeader: {
    display: "flex",
    justifyContent: "space-between",
  },

  severityBadge: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.4px",
  },

  findingTitle: {
    fontWeight: 700,
    fontSize: "14px",
    margin: "12px 0 7px",
    color: "#1f2937",
  },

  description: {
    fontSize: "12px",
    lineHeight: 1.7,
    color: "#64748b",
    overflowWrap: "anywhere",
    margin: "0 0 13px",
  },

  recommendation: {
    padding: "12px",
    borderRadius: "8px",
    background: "#f8fafc",
    border: "1px solid #f1f5f9",
  },

  recommendationTitle: {
    fontSize: "11px",
    color: "#2563eb",
  },

  recommendationText: {
    fontSize: "12px",
    lineHeight: 1.6,
    color: "#475569",
    margin: "5px 0 0",
  },

  category: {
    fontSize: "11px",
    color: "#9ca3af",
    marginTop: "12px",
  },

  successCard: {
    padding: "18px 14px",
    borderRadius: "10px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
    fontSize: "13px",
    textAlign: "center",
  },

  successIcon: {
    width: "30px",
    height: "30px",
    lineHeight: "30px",
    borderRadius: "50%",
    background: "#dcfce7",
    margin: "0 auto 10px",
    fontSize: "18px",
    fontWeight: 700,
  },

  successText: {
    fontSize: "11px",
    lineHeight: 1.6,
    marginBottom: 0,
  },

  footer: {
    marginTop: "22px",
    padding: "12px",
    borderRadius: "8px",
    background: "#f8fafc",
    fontSize: "11px",
    lineHeight: 1.7,
    color: "#64748b",
  },
};
