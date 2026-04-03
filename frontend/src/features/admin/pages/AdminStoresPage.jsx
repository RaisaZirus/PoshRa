import React from "react";
import { useAuth } from "../../../auth/useAuth.jsx";

const C = {
  bg: "#FDFDF9", soft: "#FBEF9C", primary: "#FEE32B",
  olive: "#877928", ink: "#201D18", red: "#dc2626",
  green: "#16a34a",
};

const STATUS_STYLES = {
  pending:   { bg: "#FEF9C3", text: "#A16207" },
  active:    { bg: "#DCFCE7", text: "#166534" },
  inactive:  { bg: "#F1F5F9", text: "#475569" },
  suspended: { bg: "#FEE2E2", text: "#991B1B" },
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

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.inactive;
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px",
      borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.text,
    }}>
      {status}
    </span>
  );
}

export default function AdminStoresPage() {
  const { fetchWithAuth } = useAuth();
  const [stores, setStores] = React.useState([]);
  const [meta, setMeta] = React.useState({ total: 0, page: 1, limit: 20 });
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(null); // store_id being actioned
  const [page, setPage] = React.useState(1);
  const [filterStatus, setFilterStatus] = React.useState("pending");
  const [search, setSearch] = React.useState("");
  const [toast, setToast] = React.useState(null);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filterStatus) params.set("status", filterStatus);
      if (search) params.set("search", search);
      const d = await fetchWithAuth(`/api/admin/stores?${params}`);
      setStores(d.data || []);
      setMeta(d.meta || { total: 0, page: 1, limit: 20 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, page, filterStatus, search]);

  React.useEffect(() => { load(); }, [load]);

  const updateStatus = async (storeId, status) => {
    setActionLoading(storeId);
    try {
      const d = await fetchWithAuth(`/api/admin/stores/${storeId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (d.success) {
        showToast(`Store ${status === "active" ? "approved" : status} successfully.`);
        load();
      } else {
        showToast(d.message || "Failed to update store.", false);
      }
    } catch {
      showToast("Network error.", false);
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(meta.total / meta.limit);

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-US", { dateStyle: "medium" }) : "—";

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: C.ink }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: toast.ok ? C.green : C.red,
          color: "#fff", padding: "12px 20px", borderRadius: 12,
          fontWeight: 700, fontSize: 13,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Store Approvals</h1>
        <p style={{ fontSize: 13, color: C.olive, margin: "4px 0 0" }}>
          Review and approve stores created by sellers before they go live.
        </p>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4, color: C.olive }}>
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              style={{
                padding: "7px 12px", borderRadius: 8,
                border: "1px solid rgba(32,29,24,0.2)", fontSize: 13,
              }}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4, color: C.olive }}>
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Store name or slug…"
              style={{
                padding: "7px 12px", borderRadius: 8,
                border: "1px solid rgba(32,29,24,0.2)", fontSize: 13, width: 200,
              }}
            />
          </div>
          <button
            onClick={() => { setFilterStatus("pending"); setSearch(""); setPage(1); }}
            style={{
              padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              background: "rgba(32,29,24,0.08)", color: C.olive, fontSize: 13, fontWeight: 700,
            }}
          >
            Reset
          </button>
        </div>
      </Card>

      {/* Summary counts */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {["pending", "active", "suspended"].map((s) => (
          <button
            key={s}
            onClick={() => { setFilterStatus(s); setPage(1); }}
            style={{
              padding: "6px 16px", borderRadius: 10, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 700,
              ...STATUS_STYLES[s],
              opacity: filterStatus === s ? 1 : 0.55,
            }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>
            {meta.total} store{meta.total !== 1 ? "s" : ""}
          </span>
          <span style={{ fontSize: 12, color: C.olive }}>
            Page {page} / {totalPages || 1}
          </span>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: C.olive, padding: 40 }}>Loading…</p>
        ) : stores.length === 0 ? (
          <p style={{ textAlign: "center", color: C.olive, padding: 40 }}>
            No stores found{filterStatus === "pending" ? " awaiting approval" : ""}.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid rgba(32,29,24,0.1)" }}>
                <th style={{ textAlign: "left", padding: "8px 12px", color: C.olive }}>Store</th>
                <th style={{ textAlign: "left", padding: "8px 12px", color: C.olive }}>Seller</th>
                <th style={{ textAlign: "center", padding: "8px 12px", color: C.olive }}>Status</th>
                <th style={{ textAlign: "left", padding: "8px 12px", color: C.olive }}>Created</th>
                <th style={{ textAlign: "left", padding: "8px 12px", color: C.olive }}>Approved</th>
                <th style={{ textAlign: "center", padding: "8px 12px", color: C.olive }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store.store_id}
                  style={{ borderBottom: "1px solid rgba(32,29,24,0.06)" }}
                >
                  <td style={{ padding: "12px 12px" }}>
                    <div style={{ fontWeight: 700 }}>{store.store_name}</div>
                    <div style={{ fontSize: 11, color: C.olive }}>/{store.store_slug}</div>
                    {store.store_rating > 0 && (
                      <div style={{ fontSize: 11, color: C.olive, marginTop: 2 }}>
                        ★ {Number(store.store_rating).toFixed(1)}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "12px 12px" }}>
                    <div style={{ fontWeight: 600 }}>{store.seller_name}</div>
                    <div style={{ fontSize: 11, color: C.olive }}>{store.seller_email}</div>
                  </td>
                  <td style={{ padding: "12px 12px", textAlign: "center" }}>
                    <StatusBadge status={store.store_status} />
                  </td>
                  <td style={{ padding: "12px 12px", color: C.olive, fontSize: 12 }}>
                    {fmtDate(store.created_at)}
                  </td>
                  <td style={{ padding: "12px 12px", fontSize: 12 }}>
                    {store.approved_at ? (
                      <>
                        <div>{fmtDate(store.approved_at)}</div>
                        {store.approved_by_name && (
                          <div style={{ color: C.olive, fontSize: 11 }}>by {store.approved_by_name}</div>
                        )}
                      </>
                    ) : (
                      <span style={{ color: C.olive }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "12px 12px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                      {store.store_status !== "active" && (
                        <button
                          onClick={() => updateStatus(store.store_id, "active")}
                          disabled={actionLoading === store.store_id}
                          style={{
                            padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                            background: "#DCFCE7", color: "#166534",
                            fontSize: 12, fontWeight: 700,
                            opacity: actionLoading === store.store_id ? 0.5 : 1,
                          }}
                        >
                          Approve
                        </button>
                      )}
                      {store.store_status !== "suspended" && (
                        <button
                          onClick={() => updateStatus(store.store_id, "suspended")}
                          disabled={actionLoading === store.store_id}
                          style={{
                            padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                            background: "#FEE2E2", color: "#991B1B",
                            fontSize: 12, fontWeight: 700,
                            opacity: actionLoading === store.store_id ? 0.5 : 1,
                          }}
                        >
                          Suspend
                        </button>
                      )}
                      {store.store_status !== "inactive" && store.store_status !== "pending" && (
                        <button
                          onClick={() => updateStatus(store.store_id, "inactive")}
                          disabled={actionLoading === store.store_id}
                          style={{
                            padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                            background: "rgba(32,29,24,0.08)", color: C.olive,
                            fontSize: 12, fontWeight: 700,
                            opacity: actionLoading === store.store_id ? 0.5 : 1,
                          }}
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

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
    </div>
  );
}

