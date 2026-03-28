import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = { bg: "#FDFDF9", soft: "#FBEF9C", primary: "#FEE32B", olive: "#877928", ink: "#201D18" };

const STATUS_COLORS = {
  requested:  { bg: "#FEF9C3", text: "#854D0E" },
  approved:   { bg: "#DBEAFE", text: "#1E40AF" },
  rejected:   { bg: "#FEE2E2", text: "#991B1B" },
  completed:  { bg: "#DCFCE7", text: "#166534" },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: COLORS.soft, text: COLORS.olive };
  return <span style={{ background: s.bg, color: s.text, fontWeight: 800, fontSize: 11, padding: "3px 9px", borderRadius: 999, textTransform: "capitalize" }}>{status}</span>;
}

const FILTERS = ["all", "requested", "approved", "rejected", "completed"];

export default function SellerReturnsPage() {
  const { fetchWithAuth } = useAuth();
  const [returns, setReturns] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState("all");

  React.useEffect(() => {
    fetchWithAuth("/api/seller/returns")
      .then((d) => setReturns(d.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const updateReturn = async (returnId, status) => {
    try {
      await fetchWithAuth(`/api/seller/returns/${returnId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (status === "completed") {
        // Remove the item from list since order item is deleted
        setReturns((prev) => prev.filter((r) => r.return_id !== returnId));
      } else {
        setReturns((prev) => prev.map((r) => r.return_id === returnId ? { ...r, status } : r));
      }
    } catch (err) { alert(err.message); }
  };

  const filtered = filter === "all" ? returns : returns.filter((r) => r.status === filter);
  const pending = returns.filter((r) => r.status === "requested").length;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: COLORS.ink, margin: "0 0 4px" }}>Returns</h1>
        {pending > 0 && (
          <p style={{ fontSize: 13, color: "#d97706", fontWeight: 800, margin: 0 }}>
            {pending} pending return{pending !== 1 ? "s" : ""} need your action
          </p>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "7px 14px", borderRadius: 10, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 800, textTransform: "capitalize",
              background: filter === f ? COLORS.ink : COLORS.bg,
              color: filter === f ? COLORS.primary : COLORS.olive,
              boxShadow: "0 1px 4px rgba(32,29,24,0.08)" }}>
            {f}
            {f === "requested" && pending > 0 && (
              <span style={{ marginLeft: 6, background: "#d97706", color: "#fff", borderRadius: "50%", width: 16, height: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>
                {pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: COLORS.olive, fontWeight: 700 }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div style={{ background: COLORS.bg, borderRadius: 16, padding: 48, textAlign: "center", border: `1px solid rgba(32,29,24,0.1)` }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <p style={{ fontWeight: 700, color: COLORS.olive }}>No return requests found.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((r) => (
            <div key={r.return_id} style={{
              background: COLORS.bg, border: `1px solid rgba(32,29,24,0.1)`,
              borderLeft: r.status === "requested" ? "3px solid #d97706" : `1px solid rgba(32,29,24,0.1)`,
              borderRadius: r.status === "requested" ? "0 14px 14px 0" : 14,
              padding: "16px 18px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <p style={{ fontWeight: 900, fontSize: 14, color: COLORS.ink, margin: 0 }}>{r.product_name}</p>
                    <StatusBadge status={r.status} />
                  </div>
                  <p style={{ fontSize: 12, color: COLORS.olive, margin: "0 0 4px" }}>
                    SKU: {r.sku} · Qty: {r.quantity} · ₹{(Number(r.price) * r.quantity).toLocaleString("en-IN")}
                  </p>
                  <p style={{ fontSize: 12, color: COLORS.ink, margin: "0 0 4px" }}>
                    <strong>Reason:</strong> {r.reason}
                  </p>
                  <p style={{ fontSize: 12, color: COLORS.olive, margin: 0 }}>
                    By {r.customer_name} · {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  <Link to={`/seller/orders/${r.seller_order_id}`}
                    style={{ fontSize: 12, color: COLORS.olive, fontWeight: 700, textDecoration: "none" }}>
                    View order →
                  </Link>
                  {r.status === "requested" && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => updateReturn(r.return_id, "approved")}
                        style={{ padding: "7px 14px", background: "#DBEAFE", color: "#1E40AF", fontWeight: 800, fontSize: 12, borderRadius: 8, border: "none", cursor: "pointer" }}>
                        Approve
                      </button>
                      <button onClick={() => updateReturn(r.return_id, "rejected")}
                        style={{ padding: "7px 14px", background: "#FEE2E2", color: "#991B1B", fontWeight: 800, fontSize: 12, borderRadius: 8, border: "none", cursor: "pointer" }}>
                        Reject
                      </button>
                    </div>
                  )}
                  {r.status === "approved" && (
                    <button onClick={() => updateReturn(r.return_id, "completed")}
                      style={{ padding: "7px 14px", background: "#DCFCE7", color: "#166534", fontWeight: 800, fontSize: 12, borderRadius: 8, border: "none", cursor: "pointer" }}>
                      Mark completed
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}