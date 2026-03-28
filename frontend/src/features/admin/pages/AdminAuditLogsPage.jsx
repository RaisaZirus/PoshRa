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

const ENTITY_COLORS = {
  user:       { bg: "#E0E7FF", text: "#3730A3" },
  seller:     { bg: "#FBEF9C", text: "#877928" },
  campaign:   { bg: "#DBEAFE", text: "#1E40AF" },
  commission: { bg: "#DCFCE7", text: "#166534" },
  report:     { bg: "#FEE2E2", text: "#991B1B" },
  payout:     { bg: "#E0F2FE", text: "#0369A1" },
};

export default function AdminAuditLogsPage() {
  const { fetchWithAuth } = useAuth();
  const [logs, setLogs] = React.useState([]);
  const [meta, setMeta] = React.useState({ total: 0, page: 1, limit: 30 });
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchWithAuth(`/api/admin/audit-logs?page=${page}&limit=30`);
      setLogs(d.data || []);
      setMeta(d.meta || { total: 0, page: 1, limit: 30 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, page]);

  React.useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: C.ink, margin: "0 0 4px" }}>Audit Logs</h1>
          <p style={{ fontSize: 13, color: C.olive, margin: 0, fontWeight: 700 }}>
            All admin actions are recorded here automatically.
          </p>
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: C.olive }}>
          {meta.total} entries
        </span>
      </div>

      {loading ? (
        <p style={{ color: C.olive, fontWeight: 700 }}>Loading audit logs...</p>
      ) : logs.length === 0 ? (
        <Card>
          <p style={{ color: C.olive, fontWeight: 700, textAlign: "center" }}>No audit entries yet.</p>
        </Card>
      ) : (
        <>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.soft }}>
                    {["#", "Admin", "Action", "Entity", "Date & Time"].map((h) => (
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
                  {logs.map((log, i) => {
                    const ec = ENTITY_COLORS[log.entity_type] || { bg: C.soft, text: C.olive };
                    return (
                      <tr
                        key={log.audit_id}
                        style={{
                          background: i % 2 === 0 ? C.bg : "rgba(251,239,156,0.15)",
                          borderBottom: "1px solid rgba(32,29,24,0.06)",
                        }}
                      >
                        <td style={{ padding: "11px 16px", fontSize: 12, color: "rgba(32,29,24,0.35)", fontWeight: 700 }}>
                          {log.audit_id}
                        </td>
                        <td style={{ padding: "11px 16px" }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.ink }}>{log.admin_name}</p>
                          <p style={{ margin: 0, fontSize: 11, color: C.olive }}>{log.admin_email}</p>
                        </td>
                        <td style={{ padding: "11px 16px", fontSize: 13, color: C.ink, fontWeight: 700, maxWidth: 320 }}>
                          {log.action}
                        </td>
                        <td style={{ padding: "11px 16px" }}>
                          {log.entity_type ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{
                                background: ec.bg, color: ec.text,
                                fontWeight: 800, fontSize: 11,
                                padding: "2px 8px", borderRadius: 999, textTransform: "capitalize",
                              }}>
                                {log.entity_type}
                              </span>
                              {log.entity_id && (
                                <span style={{ fontSize: 11, color: C.olive, fontWeight: 700 }}>
                                  #{log.entity_id}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: "rgba(32,29,24,0.3)" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "11px 16px", fontSize: 12, color: C.olive, whiteSpace: "nowrap" }}>
                          {new Date(log.created_at).toLocaleString("en-GB", {
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: "8px 16px", borderRadius: 8,
                  border: "1.5px solid rgba(32,29,24,0.15)",
                  background: C.bg, fontWeight: 900, fontSize: 13,
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  color: page === 1 ? "rgba(32,29,24,0.3)" : C.ink,
                }}
              >
                ← Prev
              </button>
              <span style={{
                padding: "8px 16px", fontSize: 13, fontWeight: 800, color: C.olive,
                display: "flex", alignItems: "center",
              }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: "8px 16px", borderRadius: 8,
                  border: "1.5px solid rgba(32,29,24,0.15)",
                  background: C.bg, fontWeight: 900, fontSize: 13,
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                  color: page === totalPages ? "rgba(32,29,24,0.3)" : C.ink,
                }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
