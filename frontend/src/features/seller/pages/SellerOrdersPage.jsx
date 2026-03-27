import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = { bg: "#FDFDF9", soft: "#FBEF9C", primary: "#FEE32B", olive: "#877928", ink: "#201D18" };

const STATUS_COLORS = {
  pending:    { bg: "#FEF9C3", text: "#854D0E" },
  processing: { bg: "#DBEAFE", text: "#1E40AF" },
  shipped:    { bg: "#E0F2FE", text: "#0369A1" },
  delivered:  { bg: "#DCFCE7", text: "#166534" },
  cancelled:  { bg: "#FEE2E2", text: "#991B1B" },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: COLORS.soft, text: COLORS.olive };
  return <span style={{ background: s.bg, color: s.text, fontWeight: 800, fontSize: 11, padding: "3px 9px", borderRadius: 999, textTransform: "capitalize" }}>{status}</span>;
}

const STATUSES = ["all", "pending", "processing", "shipped", "delivered", "cancelled"];

export default function SellerOrdersPage() {
  const { fetchWithAuth } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeStatus = searchParams.get("status") || "all";
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    const url = activeStatus === "all" ? "/api/seller/orders" : `/api/seller/orders?status=${activeStatus}`;
    fetchWithAuth(url)
      .then((d) => setOrders(d.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeStatus]);

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: COLORS.ink, margin: "0 0 20px" }}>Orders</h1>

      {/* Status filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setSearchParams(s === "all" ? {} : { status: s })}
            style={{
              padding: "7px 14px", borderRadius: 10, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 800, textTransform: "capitalize",
              background: activeStatus === s ? COLORS.ink : COLORS.bg,
              color: activeStatus === s ? COLORS.primary : COLORS.olive,
              boxShadow: "0 1px 4px rgba(32,29,24,0.08)",
            }}
          >{s}</button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: COLORS.olive, fontWeight: 700 }}>Loading...</p>
      ) : orders.length === 0 ? (
        <div style={{ background: COLORS.bg, borderRadius: 16, padding: 40, textAlign: "center" }}>
          <p style={{ fontWeight: 700, color: COLORS.olive }}>No orders found.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {orders.map((o) => (
            <Link key={o.seller_order_id} to={`/seller/orders/${o.seller_order_id}`}
              style={{ textDecoration: "none", background: COLORS.bg, border: `1px solid rgba(32,29,24,0.1)`, borderRadius: 14, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}
            >
              <div>
                <p style={{ fontWeight: 900, fontSize: 14, color: COLORS.ink, margin: "0 0 4px" }}>
                  Order #{o.order_id} <span style={{ fontWeight: 400, color: COLORS.olive, fontSize: 12 }}>· Sub-order #{o.seller_order_id}</span>
                </p>
                <p style={{ fontSize: 12, color: COLORS.olive, margin: "0 0 6px" }}>
                  {o.item_count} item{o.item_count !== 1 ? "s" : ""} · {new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
                <div style={{ display: "flex", gap: 6 }}>
                  <StatusBadge status={o.status} />
                  {o.shipment_status && <StatusBadge status={o.shipment_status} />}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontWeight: 900, fontSize: 16, color: COLORS.ink, margin: "0 0 4px" }}>₹{Number(o.subtotal).toLocaleString("en-IN")}</p>
                <p style={{ fontSize: 12, color: COLORS.olive, margin: 0, fontWeight: 700 }}>View →</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}