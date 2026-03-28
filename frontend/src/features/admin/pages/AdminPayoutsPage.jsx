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
      background: bg, color: text, fontWeight: 800, fontSize: 11,
      padding: "3px 9px", borderRadius: 999, textTransform: "capitalize",
    }}>
      {label}
    </span>
  );
}

const STATUS_COLORS = {
  requested:  { bg: "#FEF9C3", text: "#854D0E" },
  processed:  { bg: "#DCFCE7", text: "#166534" },
  failed:     { bg: "#FEE2E2", text: "#991B1B" },
};

export default function AdminPayoutsPage() {
  const { fetchWithAuth } = useAuth();
  const [payouts, setPayouts] = React.useState([]);
  const [meta, setMeta] = React.useState({ total: 0, page: 1, limit: 20 });
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState("requested");
  const [page, setPage] = React.useState(1);
  const [actionLoading, setActionLoading] = React.useState(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (statusFilter) params.set("status", statusFilter);
      const d = await fetchWithAuth(`/api/admin/payouts?${params}`);
      setPayouts(d.data || []);
      setMeta(d.meta || { total: 0, page: 1, limit: 20 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, page, statusFilter]);

  React.useEffect(() => { load(); }, [load]);

  const updateStatus = async (payout_id, status) => {
    setActionLoading(`${payout_id}-${status}`);
    try {
      await fetchWithAuth(`/api/admin/payouts/${payout_id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setPayouts((prev) =>
        prev.map((p) => p.payout_id === payout_id ? { ...p, status } : p)
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(meta.total / meta.limit);
  const fmtMoney = (n) => `৳${Number(n || 0).toLocaleString("en-IN")}`;

  const selectStyle = {
    padding: "9px 14px", borderRadius: 10,
    border: "1.5px solid rgba(32,29,24,0.2)",
    fontSize: 13, fontWeight: 700,
    background: C.bg, color: C.ink, cursor: "pointer",
  };

  // Summary totals
  const totalRequested = payouts
    .filter((p) => p.status === "requested")
    .reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: C.ink, margin: 0 }}>Payouts</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {statusFilter === "requested" && payouts.length > 0 && (
            <span style={{
              fontSize: 13, fontWeight: 900, color: C.ink,
              padding: "8px 16px", background: C.primary, borderRadius: 10,
            }}>
              {fmtMoney(totalRequested)} pending
            </span>
          )}
          <span style={{ fontSize: 12, fontWeight: 800, color: C.olive }}>{meta.total} total</span>
        </div>
      </div>

      {/* Filter */}
      <Card style={{ marginBottom: 16, padding: 14 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={selectStyle}>
            <option value="">All statuses</option>
            <option value="requested">Requested</option>
            <option value="processed">Processed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <p style={{ padding: 24, color: C.olive, fontWeight: 700 }}>Loading payouts...</p>
        ) : payouts.length === 0 ? (
          <p style={{ padding: 24, color: C.olive, fontWeight: 700 }}>No payouts found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.soft }}>
                  {["ID", "Seller", "Amount", "Status", "Requested At", "Actions"].map((h) => (
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
                {payouts.map((p, i) => (
                  <tr
                    key={p.payout_id}
                    style={{
                      background: i % 2 === 0 ? C.bg : "rgba(251,239,156,0.2)",
                      borderBottom: "1px solid rgba(32,29,24,0.06)",
                    }}
                  >
                    <td style={{ padding: "12px 16px", fontSize: 12, color: C.olive, fontWeight: 700 }}>#{p.payout_id}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.ink }}>{p.seller_name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: C.olive }}>{p.seller_email}</p>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 16, fontWeight: 900, color: C.ink }}>
                      {fmtMoney(p.amount)}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge label={p.status} {...(STATUS_COLORS[p.status] || { bg: C.soft, text: C.olive })} />
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: C.olive, whiteSpace: "nowrap" }}>
                      {new Date(p.requested_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {p.status === "requested" && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => updateStatus(p.payout_id, "processed")}
                            disabled={!!actionLoading}
                            style={{
                              padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                              background: "#DCFCE7", color: "#166534", fontWeight: 800, fontSize: 11,
                            }}
                          >
                            Mark Processed
                          </button>
                          <button
                            onClick={() => updateStatus(p.payout_id, "failed")}
                            disabled={!!actionLoading}
                            style={{
                              padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                              background: "#FEE2E2", color: "#991B1B", fontWeight: 800, fontSize: 11,
                            }}
                          >
                            Fail
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
