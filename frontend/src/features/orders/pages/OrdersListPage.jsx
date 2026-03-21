import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = {
  bg: "#FDFDF9", soft: "#FBEF9C",
  primary: "#FEE32B", olive: "#877928", ink: "#201D18",
};

function Card({ children, style }) {
  return (
    <div style={{
      background: COLORS.bg, border: `1px solid rgba(32,29,24,0.12)`,
      borderRadius: 16, boxShadow: "0 10px 26px rgba(32,29,24,0.08)",
      overflow: "hidden", ...style,
    }}>
      {children}
    </div>
  );
}

const STATUS_COLORS = {
  pending:    { bg: "#FEF9C3", text: "#854D0E" },
  processing: { bg: "#DBEAFE", text: "#1E40AF" },
  shipped:    { bg: "#E0F2FE", text: "#0369A1" },
  delivered:  { bg: "#DCFCE7", text: "#166534" },
  cancelled:  { bg: "#FEE2E2", text: "#991B1B" },
  returned:   { bg: "#F3F4F6", text: "#374151" },
  paid:       { bg: "#DCFCE7", text: "#166534" },
  failed:     { bg: "#FEE2E2", text: "#991B1B" },
  refunded:   { bg: "#F3F4F6", text: "#374151" },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: COLORS.soft, text: COLORS.olive };
  return (
    <span style={{
      background: s.bg, color: s.text, fontWeight: 800,
      fontSize: 11, padding: "3px 9px", borderRadius: 999, textTransform: "capitalize",
    }}>
      {status}
    </span>
  );
}

export default function OrdersListPage() {
  const { accessToken } = useAuth();
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/orders", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load orders");
        setOrders(data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (accessToken) fetchOrders();
  }, [accessToken]);

  if (loading) {
    return (
      <div style={{ background: COLORS.soft, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <p style={{ fontWeight: 700, color: COLORS.olive }}>Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: COLORS.soft, color: COLORS.ink,
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      minHeight: "100vh", paddingBottom: 60,
    }}>
      <div className="container mx-auto px-4 py-8">
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, margin: "0 0 4px" }}>My orders</h1>
          <p style={{ fontSize: 13, color: COLORS.olive, margin: 0 }}>
            {orders.length} order{orders.length !== 1 ? "s" : ""}
          </p>
        </div>

        {error && (
          <Card style={{ padding: 20, marginBottom: 20, background: "#FEE2E2" }}>
            <p style={{ color: "#991B1B", fontWeight: 700, margin: 0 }}>{error}</p>
          </Card>
        )}

        {!error && orders.length === 0 ? (
          <Card style={{ padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🛍️</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: COLORS.ink, marginBottom: 10 }}>
              No orders yet
            </h2>
            <p style={{ fontSize: 14, color: COLORS.olive, marginBottom: 24 }}>
              Start shopping to place your first order.
            </p>
            <Link
              to="/"
              style={{ display: "inline-block", padding: "12px 24px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, borderRadius: 12, textDecoration: "none" }}
            >
              Start shopping
            </Link>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {orders.map((order) => (
              <Link
                key={order.order_id}
                to={`/orders/${order.order_id}`}
                style={{ textDecoration: "none" }}
              >
                <Card style={{ padding: 18, transition: "box-shadow 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 14px 32px rgba(32,29,24,0.13)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "0 10px 26px rgba(32,29,24,0.08)"}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <p style={{ fontWeight: 900, fontSize: 15, color: COLORS.ink, margin: "0 0 4px" }}>
                        Order #{order.order_id}
                      </p>
                      <p style={{ fontSize: 12, color: COLORS.olive, margin: "0 0 10px" }}>
                        {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                        {" · "}
                        {order.item_count} item{order.item_count != 1 ? "s" : ""}
                      </p>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <StatusBadge status={order.order_status} />
                        <StatusBadge status={order.payment_status} />
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontWeight: 900, fontSize: 18, color: COLORS.primary, margin: "0 0 6px" }}>
                        ₹{Number(order.total_amount).toLocaleString("en-IN")}
                      </p>
                      <p style={{ fontSize: 12, color: COLORS.olive, margin: 0, fontWeight: 700 }}>
                        View details →
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}