import React from "react";
import { useAuth } from "../../../auth/useAuth.jsx";

const C = {
  bg: "#FDFDF9", soft: "#FBEF9C", primary: "#FEE32B",
  olive: "#877928", ink: "#201D18",
};

function Card({ children, style }) {
  return (
    <div style={{
      background: C.bg, border: "1px solid rgba(32,29,24,0.12)",
      borderRadius: 16, padding: 20,
      boxShadow: "0 4px 16px rgba(32,29,24,0.06)", ...style,
    }}>
      {children}
    </div>
  );
}

function Badge({ children, color = C.primary, text = C.ink }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px",
      borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: color, color: text,
    }}>
      {children}
    </span>
  );
}

export default function AdminProductViewsPage() {
  const { fetchWithAuth } = useAuth();

  // Summary tab state
  const [summary, setSummary] = React.useState([]);
  const [summaryDays, setSummaryDays] = React.useState(30);
  const [summaryLoading, setSummaryLoading] = React.useState(true);

  // Logs tab state
  const [logs, setLogs] = React.useState([]);
  const [meta, setMeta] = React.useState({ total: 0, page: 1, limit: 30 });
  const [page, setPage] = React.useState(1);
  const [filterProduct, setFilterProduct] = React.useState("");
  const [filterFrom, setFilterFrom] = React.useState("");
  const [filterTo, setFilterTo] = React.useState("");
  const [logsLoading, setLogsLoading] = React.useState(true);

  const [activeTab, setActiveTab] = React.useState("summary");

  // ── Load summary ──────────────────────────────────────────────────────────
  const loadSummary = React.useCallback(async () => {
    setSummaryLoading(true);
    try {
      const d = await fetchWithAuth(
        `/api/admin/product-views/summary?days=${summaryDays}&limit=20`
      );
      setSummary(d.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSummaryLoading(false);
    }
  }, [fetchWithAuth, summaryDays]);

  React.useEffect(() => { loadSummary(); }, [loadSummary]);

  // ── Load logs ─────────────────────────────────────────────────────────────
  const loadLogs = React.useCallback(async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 30 });
      if (filterProduct) params.set("product_id", filterProduct);
      if (filterFrom)    params.set("from", filterFrom);
      if (filterTo)      params.set("to", filterTo);

      const d = await fetchWithAuth(`/api/admin/product-views?${params}`);
      setLogs(d.data || []);
      setMeta(d.meta || { total: 0, page: 1, limit: 30 });
    } catch (err) {
      console.error(err);
    } finally {
      setLogsLoading(false);
    }
  }, [fetchWithAuth, page, filterProduct, filterFrom, filterTo]);

  React.useEffect(() => { if (activeTab === "logs") loadLogs(); }, [loadLogs, activeTab]);

  const totalPages = Math.ceil(meta.total / meta.limit);

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "—";

  const fmtDuration = (s) => {
    if (!s) return "—";
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  const maxViews = summary.length ? summary[0].total_views : 1;

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: C.ink }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Product View Logs</h1>
        <p style={{ fontSize: 13, color: C.olive, margin: "4px 0 0" }}>
          Track which products customers are viewing and for how long.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["summary", "logs"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700,
              border: "none", cursor: "pointer",
              background: activeTab === tab ? C.primary : "rgba(32,29,24,0.08)",
              color: activeTab === tab ? C.ink : C.olive,
            }}
          >
            {tab === "summary" ? "Top Products" : "Raw Logs"}
          </button>
        ))}
      </div>

      {/* ── SUMMARY TAB ── */}
      {activeTab === "summary" && (
        <>
          {/* Period selector */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Period:</span>
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setSummaryDays(d)}
                style={{
                  padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                  border: "none", cursor: "pointer",
                  background: summaryDays === d ? C.primary : "rgba(32,29,24,0.08)",
                  color: summaryDays === d ? C.ink : C.olive,
                }}
              >
                {d}d
              </button>
            ))}
          </div>

          <Card>
            {summaryLoading ? (
              <p style={{ textAlign: "center", color: C.olive, padding: 40 }}>Loading…</p>
            ) : summary.length === 0 ? (
              <p style={{ textAlign: "center", color: C.olive, padding: 40 }}>
                No view data in this period.
              </p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid rgba(32,29,24,0.1)" }}>
                    <th style={{ textAlign: "left", padding: "8px 12px", color: C.olive }}>#</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", color: C.olive }}>Product</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", color: C.olive }}>Views</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", color: C.olive }}>Unique</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", color: C.olive }}>Avg Time</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", color: C.olive }}>Last Viewed</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((row, i) => (
                    <tr key={row.product_id}
                      style={{ borderBottom: "1px solid rgba(32,29,24,0.06)" }}
                    >
                      <td style={{ padding: "10px 12px", color: C.olive, fontWeight: 700 }}>
                        {i + 1}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ fontWeight: 700 }}>{row.product_name}</div>
                        {/* Mini bar chart */}
                        <div style={{
                          marginTop: 4, height: 4, borderRadius: 4,
                          background: "rgba(32,29,24,0.08)", width: "100%",
                        }}>
                          <div style={{
                            height: "100%", borderRadius: 4,
                            background: C.primary,
                            width: `${Math.round((row.total_views / maxViews) * 100)}%`,
                          }} />
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>
                        {row.total_views.toLocaleString()}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        {row.unique_viewers.toLocaleString()}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        {fmtDuration(row.avg_duration_seconds)}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: C.olive, fontSize: 12 }}>
                        {fmtDate(row.last_viewed_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}

      {/* ── LOGS TAB ── */}
      {activeTab === "logs" && (
        <>
          {/* Filters */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4, color: C.olive }}>
                  Product ID
                </label>
                <input
                  type="number"
                  value={filterProduct}
                  onChange={(e) => { setFilterProduct(e.target.value); setPage(1); }}
                  placeholder="All products"
                  style={{
                    padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(32,29,24,0.2)",
                    fontSize: 13, width: 120,
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4, color: C.olive }}>
                  From
                </label>
                <input
                  type="date"
                  value={filterFrom}
                  onChange={(e) => { setFilterFrom(e.target.value); setPage(1); }}
                  style={{
                    padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(32,29,24,0.2)",
                    fontSize: 13,
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4, color: C.olive }}>
                  To
                </label>
                <input
                  type="date"
                  value={filterTo}
                  onChange={(e) => { setFilterTo(e.target.value); setPage(1); }}
                  style={{
                    padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(32,29,24,0.2)",
                    fontSize: 13,
                  }}
                />
              </div>
              <button
                onClick={() => { setFilterProduct(""); setFilterFrom(""); setFilterTo(""); setPage(1); }}
                style={{
                  padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: "rgba(32,29,24,0.08)", color: C.olive, fontSize: 13, fontWeight: 700,
                }}
              >
                Clear
              </button>
            </div>
          </Card>

          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                {meta.total.toLocaleString()} total views
              </span>
              <span style={{ fontSize: 12, color: C.olive }}>
                Page {page} of {totalPages || 1}
              </span>
            </div>

            {logsLoading ? (
              <p style={{ textAlign: "center", color: C.olive, padding: 40 }}>Loading…</p>
            ) : logs.length === 0 ? (
              <p style={{ textAlign: "center", color: C.olive, padding: 40 }}>No view logs found.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid rgba(32,29,24,0.1)" }}>
                    <th style={{ textAlign: "left", padding: "8px 12px", color: C.olive }}>Time</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", color: C.olive }}>Product</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", color: C.olive }}>Viewer</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", color: C.olive }}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.view_id}
                      style={{ borderBottom: "1px solid rgba(32,29,24,0.06)" }}
                    >
                      <td style={{ padding: "10px 12px", color: C.olive, fontSize: 12, whiteSpace: "nowrap" }}>
                        {fmtDate(log.created_at)}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ fontWeight: 700 }}>{log.product_name || "—"}</span>
                        <span style={{ color: C.olive, fontSize: 11, marginLeft: 6 }}>
                          #{log.product_id}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        {log.user_name ? (
                          <>
                            <span style={{ fontWeight: 600 }}>{log.user_name}</span>
                            <span style={{ color: C.olive, fontSize: 11, marginLeft: 6 }}>
                              {log.user_email}
                            </span>
                          </>
                        ) : (
                          <Badge color="rgba(32,29,24,0.08)" text={C.olive}>Guest</Badge>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        {fmtDuration(log.duration_seconds)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    padding: "6px 16px", borderRadius: 8, border: "none",
                    background: page === 1 ? "rgba(32,29,24,0.05)" : C.primary,
                    color: page === 1 ? C.olive : C.ink,
                    cursor: page === 1 ? "not-allowed" : "pointer",
                    fontWeight: 700, fontSize: 13,
                  }}
                >
                  ← Prev
                </button>
                <span style={{ padding: "6px 12px", fontSize: 13, color: C.olive }}>
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    padding: "6px 16px", borderRadius: 8, border: "none",
                    background: page === totalPages ? "rgba(32,29,24,0.05)" : C.primary,
                    color: page === totalPages ? C.olive : C.ink,
                    cursor: page === totalPages ? "not-allowed" : "pointer",
                    fontWeight: 700, fontSize: 13,
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}