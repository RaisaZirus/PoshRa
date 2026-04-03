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

function Badge({ label, bg, text }) {
  return (
    <span style={{
      background: bg, color: text,
      fontWeight: 800, fontSize: 11,
      padding: "3px 9px", borderRadius: 999, textTransform: "capitalize",
    }}>
      {label}
    </span>
  );
}

const STATUS_COLORS = {
  pending:  { bg: "#FEF9C3", text: "#854D0E" },
  resolved: { bg: "#DCFCE7", text: "#166534" },
  rejected: { bg: "#FEE2E2", text: "#991B1B" },
};

const ENTITY_COLORS = {
  product: { bg: "#DBEAFE", text: "#1E40AF" },
  review:  { bg: "#E0F2FE", text: "#0369A1" },
  seller:  { bg: "#FBEF9C", text: "#877928" },
};

export default function AdminReportsPage() {
  const { fetchWithAuth } = useAuth();
  const [reports, setReports] = React.useState([]);
  const [meta, setMeta] = React.useState({ total: 0, page: 1, limit: 20 });
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState("pending");
  const [entityFilter, setEntityFilter] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [actionLoading, setActionLoading] = React.useState(null);

  const loadReports = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (statusFilter) params.set("status", statusFilter);
      if (entityFilter) params.set("entity_type", entityFilter);
      const d = await fetchWithAuth(`/api/admin/reports?${params}`);
      setReports(d.data || []);
      setMeta(d.meta || { total: 0, page: 1, limit: 20 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, page, statusFilter, entityFilter]);

  React.useEffect(() => { loadReports(); }, [loadReports]);

  const updateReport = async (report_id, status) => {
    setActionLoading(`${report_id}-${status}`);
    try {
      await fetchWithAuth(`/api/admin/reports/${report_id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setReports((prev) => prev.map((r) => r.report_id === report_id ? { ...r, status } : r));
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const selectStyle = {
    padding: "9px 14px", borderRadius: 10,
    border: "1.5px solid rgba(32,29,24,0.2)",
    fontSize: 13, fontWeight: 700,
    background: C.bg, color: C.ink, cursor: "pointer",
  };

  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: C.ink, margin: 0 }}>Reports</h1>
        <span style={{ fontSize: 12, fontWeight: 800, color: C.olive }}>
          {meta.total} total
        </span>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16, padding: 14 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={selectStyle}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }} style={selectStyle}>
            <option value="">All types</option>
            <option value="product">Product</option>
            <option value="review">Review</option>
            <option value="seller">Seller</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <p style={{ padding: 24, color: C.olive, fontWeight: 700 }}>Loading reports...</p>
        ) : reports.length === 0 ? (
          <p style={{ padding: 24, color: C.olive, fontWeight: 700 }}>No reports found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.soft }}>
                  {["ID", "Type", "Entity ID", "Reported By", "Reason", "Status", "Date", "Actions"].map((h) => (
                    <th key={h} style={{
                      padding: "12px 16px", textAlign: "left",
                      fontSize: 11, fontWeight: 900, color: C.olive,
                      textTransform: "uppercase", letterSpacing: 0.5,
                      borderBottom: "1px solid rgba(32,29,24,0.1)",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((r, i) => (
                  <tr
                    key={r.report_id}
                    style={{
                      background: i % 2 === 0 ? C.bg : "rgba(251,239,156,0.2)",
                      borderBottom: "1px solid rgba(32,29,24,0.06)",
                    }}
                  >
                    <td style={{ padding: "12px 16px", fontSize: 12, color: C.olive, fontWeight: 700 }}>#{r.report_id}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge label={r.entity_type} {...(ENTITY_COLORS[r.entity_type] || { bg: C.soft, text: C.olive })} />
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: C.ink }}>#{r.entity_id}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.ink }}>{r.reported_by_name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: C.olive }}>{r.reported_by_email}</p>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: C.olive, maxWidth: 200 }}>
                      {r.reason ? (
                        <span title={r.reason}>
                          {r.reason.length > 60 ? r.reason.slice(0, 60) + "…" : r.reason}
                        </span>
                      ) : "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge label={r.status} {...(STATUS_COLORS[r.status] || { bg: C.soft, text: C.olive })} />
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: C.olive, whiteSpace: "nowrap" }}>
                      {new Date(r.created_at).toLocaleDateString("en-GB")}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {r.status === "pending" && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => updateReport(r.report_id, "resolved")}
                            disabled={!!actionLoading}
                            style={{
                              padding: "5px 12px", borderRadius: 8,
                              background: "#DCFCE7", color: "#166534",
                              fontWeight: 800, fontSize: 11, border: "none", cursor: "pointer",
                            }}
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => updateReport(r.report_id, "rejected")}
                            disabled={!!actionLoading}
                            style={{
                              padding: "5px 12px", borderRadius: 8,
                              background: "#FEE2E2", color: "#991B1B",
                              fontWeight: 800, fontSize: 11, border: "none", cursor: "pointer",
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
          {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                width: 36, height: 36, borderRadius: 8,
                border: "1.5px solid rgba(32,29,24,0.15)",
                background: page === p ? C.primary : C.bg,
                fontWeight: 900, fontSize: 13, cursor: "pointer", color: C.ink,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


