import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = { bg: "#FDFDF9", soft: "#FBEF9C", primary: "#FEE32B", olive: "#877928", ink: "#201D18" };

const STATUS_COLORS = {
  pending:    { bg: "#FEF9C3", text: "#854D0E" },
  shipped:    { bg: "#E0F2FE", text: "#0369A1" },
  in_transit: { bg: "#DBEAFE", text: "#1E40AF" },
  delivered:  { bg: "#DCFCE7", text: "#166534" },
  returned:   { bg: "#FEE2E2", text: "#991B1B" },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: COLORS.soft, text: COLORS.olive };
  return <span style={{ background: s.bg, color: s.text, fontWeight: 800, fontSize: 11, padding: "3px 9px", borderRadius: 999, textTransform: "capitalize" }}>{status?.replace("_", " ")}</span>;
}

export default function SellerShipmentsPage() {
  const { fetchWithAuth } = useAuth();
  const [shipments, setShipments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState("all");

  React.useEffect(() => {
    fetchWithAuth("/api/seller/shipments")
      .then((d) => setShipments(d.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? shipments : shipments.filter((s) => s.status === filter);

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: COLORS.ink, margin: "0 0 20px" }}>Shipments</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {["all"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding: "7px 14px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 800,
              background: filter === s ? COLORS.ink : COLORS.bg, color: filter === s ? COLORS.primary : COLORS.olive,
              boxShadow: "0 1px 4px rgba(32,29,24,0.08)", textTransform: "capitalize" }}>
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color: COLORS.olive, fontWeight: 700 }}>Loading...</p>
      : filtered.length === 0 ? (
        <div style={{ background: COLORS.bg, borderRadius: 16, padding: 48, textAlign: "center", border: `1px solid rgba(32,29,24,0.1)` }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🚚</div>
          <p style={{ fontWeight: 700, color: COLORS.olive }}>No shipments found.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((s) => (
            <div key={s.shipment_id} style={{ background: COLORS.bg, border: `1px solid rgba(32,29,24,0.1)`, borderRadius: 14, padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <p style={{ fontWeight: 900, fontSize: 14, color: COLORS.ink, margin: 0 }}>
                      Shipment #{s.shipment_id}
                    </p>
                    <StatusBadge status={s.status} />
                  </div>
                  <p style={{ fontSize: 12, color: COLORS.olive, margin: "0 0 4px" }}>
                    Order #{s.order_id} · Sub-order #{s.seller_order_id}
                  </p>
                  {s.courier_name && (
                    <p style={{ fontSize: 12, color: COLORS.olive, margin: "0 0 4px" }}>
                      Courier: <strong>{s.courier_name}</strong>
                    </p>
                  )}
                  {s.tracking_number && (
                    <p style={{ fontSize: 12, color: COLORS.olive, margin: 0 }}>
                      Tracking: <strong style={{ fontFamily: "monospace" }}>{s.tracking_number}</strong>
                    </p>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: 900, fontSize: 15, color: COLORS.ink, margin: "0 0 4px" }}>
                    ৳{Number(s.subtotal).toLocaleString("en-BD")}
                  </p>
                  {s.shipped_at && (
                    <p style={{ fontSize: 11, color: COLORS.olive, margin: "0 0 4px" }}>
                      Shipped: {new Date(s.shipped_at).toLocaleDateString("en-BD")}
                    </p>
                  )}
                  {s.delivered_at && (
                    <p style={{ fontSize: 11, color: "#166534", fontWeight: 700, margin: 0 }}>
                      Delivered: {new Date(s.delivered_at).toLocaleDateString("en-BD")}
                    </p>
                  )}
                  <Link to={`/seller/orders/${s.seller_order_id}`}
                    style={{ fontSize: 12, color: COLORS.olive, fontWeight: 700, textDecoration: "none" }}>
                    View order →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

