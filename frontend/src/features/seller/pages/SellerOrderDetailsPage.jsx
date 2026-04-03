import React from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = { bg: "#FDFDF9", soft: "#FBEF9C", primary: "#FEE32B", olive: "#877928", ink: "#201D18" };

function Card({ children, style }) {
  return <div style={{ background: COLORS.bg, border: `1px solid rgba(32,29,24,0.12)`, borderRadius: 16, padding: 20, boxShadow: "0 4px 16px rgba(32,29,24,0.06)", ...style }}>{children}</div>;
}

const STATUS_COLORS = {
  pending: { bg: "#FEF9C3", text: "#854D0E" }, processing: { bg: "#DBEAFE", text: "#1E40AF" },
  shipped: { bg: "#E0F2FE", text: "#0369A1" }, delivered: { bg: "#DCFCE7", text: "#166534" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B" },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: COLORS.soft, text: COLORS.olive };
  return <span style={{ background: s.bg, color: s.text, fontWeight: 800, fontSize: 12, padding: "4px 10px", borderRadius: 999, textTransform: "capitalize" }}>{status}</span>;
}

const STATUS_TRANSITIONS = {
  pending: ["processing", "cancelled"],
  processing: ["cancelled"],
  shipped: ["delivered"],
  delivered: [], cancelled: [],
};

export default function SellerOrderDetailsPage() {
  const { seller_order_id } = useParams();
  const { fetchWithAuth } = useAuth();
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [updating, setUpdating] = React.useState(false);
  const [showShipForm, setShowShipForm] = React.useState(false);
  const [returns, setReturns] = React.useState([]);
  const [shipForm, setShipForm] = React.useState({ courier_name: "" });
  const [couriers, setCouriers] = React.useState([]);
  const [error, setError] = React.useState("");

  const load = React.useCallback(() => {
    Promise.all([
      fetchWithAuth(`/api/seller/orders/${seller_order_id}`),
      fetchWithAuth("/api/seller/returns"),
      fetchWithAuth("/api/seller/couriers"),
    ]).then(([d, r, c]) => {
      setData(d.data);
      // filter returns for this seller_order
      setReturns((r.data || []).filter((x) => x.seller_order_id === Number(seller_order_id)));
      setCouriers(c.data || []);
    }).catch((e) => setError(e.message))
    .finally(() => setLoading(false));
  }, [seller_order_id]);

  React.useEffect(() => { load(); }, [load]);

  const updateStatus = async (status) => {
    setUpdating(true);
    try {
      await fetchWithAuth(`/api/seller/orders/${seller_order_id}/status`, {
        method: "PATCH", body: JSON.stringify({ status }),
      });
      setData((prev) => ({ ...prev, order: { ...prev.order, status } }));
    } catch (err) { alert(err.message); }
    finally { setUpdating(false); }
  };

  const submitShipment = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await fetchWithAuth("/api/seller/shipments", {
        method: "POST",
        body: JSON.stringify({ 
          seller_order_id: Number(seller_order_id), 
          courier_name: shipForm.courier_name,
          tracking_number: order.tracking_number 
        }),
      });
      setShowShipForm(false);
      load();
    } catch (err) { alert(err.message); }
    finally { setUpdating(false); }
  };

  const updateReturn = async (returnId, status) => {
    try {
      await fetchWithAuth(`/api/seller/returns/${returnId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (status === "completed") {
        setReturns((prev) => prev.filter((r) => r.return_id !== returnId));
        load(); // reload order to reflect removed item
      } else {
        setReturns((prev) => prev.map((r) => r.return_id === returnId ? { ...r, status } : r));
      }
    } catch (err) { alert(err.message); }
  };

  if (loading) return <p style={{ color: COLORS.olive, fontWeight: 700 }}>Loading...</p>;
  if (error) return <p style={{ color: "#dc2626", fontWeight: 700 }}>{error}</p>;
  if (!data) return null;

  const { order, items, shipment } = data;
  const nextStatuses = STATUS_TRANSITIONS[order.status] || [];

  return (
    <div>
      <Link to="/seller/orders" style={{ fontSize: 13, color: COLORS.olive, fontWeight: 700, textDecoration: "none" }}>← Orders</Link>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "12px 0 24px" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: COLORS.ink, margin: "0 0 4px" }}>Sub-order #{seller_order_id}</h1>
          <p style={{ fontSize: 13, color: COLORS.olive, margin: 0 }}>
            Order #{order.order_id} · {new Date(order.created_at).toLocaleDateString("en-BD", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Items */}
          <Card>
            <h2 style={{ fontSize: 13, fontWeight: 900, color: COLORS.ink, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: 0.5 }}>Items</h2>
            {items.map((item) => (
              <div key={item.order_item_id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid rgba(32,29,24,0.08)` }}>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 13, color: COLORS.ink, margin: "0 0 2px" }}>{item.product_name}</p>
                  <p style={{ fontSize: 12, color: COLORS.olive, margin: 0 }}>SKU: {item.sku} · Qty: {item.quantity}</p>
                </div>
                <p style={{ fontWeight: 900, fontSize: 14, color: COLORS.ink, margin: 0 }}>
                  ৳{(Number(item.price) * item.quantity).toLocaleString("en-BD")}
                </p>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, fontWeight: 900, fontSize: 15 }}>
              <span>Subtotal</span>
              <span>৳{Number(order.subtotal).toLocaleString("en-BD")}</span>
            </div>
          </Card>

          {/* Return requests */}
          {returns.length > 0 && (
            <Card>
              <h2 style={{ fontSize: 13, fontWeight: 900, color: COLORS.ink, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: 0.5 }}>Return requests</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {returns.map((r) => {
                  const STATUS_C = { requested: { bg: "#FEF9C3", text: "#854D0E" }, approved: { bg: "#DBEAFE", text: "#1E40AF" }, rejected: { bg: "#FEE2E2", text: "#991B1B" }, completed: { bg: "#DCFCE7", text: "#166534" } };
                  const sc = STATUS_C[r.status] || { bg: COLORS.soft, text: COLORS.olive };
                  return (
                    <div key={r.return_id} style={{ background: COLORS.soft, borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          <p style={{ fontWeight: 800, fontSize: 13, color: COLORS.ink, margin: "0 0 2px" }}>{r.product_name}</p>
                          <p style={{ fontSize: 12, color: COLORS.olive, margin: "0 0 4px" }}>SKU: {r.sku} · Qty: {r.quantity}</p>
                          <p style={{ fontSize: 12, color: COLORS.ink, margin: 0 }}>Reason: {r.reason}</p>
                        </div>
                        <span style={{ background: sc.bg, color: sc.text, fontWeight: 800, fontSize: 11, padding: "3px 9px", borderRadius: 999, textTransform: "capitalize", flexShrink: 0 }}>{r.status}</span>
                      </div>
                      {r.status === "requested" && (
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
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
                          style={{ marginTop: 8, padding: "7px 14px", background: "#DCFCE7", color: "#166534", fontWeight: 800, fontSize: 12, borderRadius: 8, border: "none", cursor: "pointer" }}>
                          Mark completed
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Shipment */}
          <Card>
            <h2 style={{ fontSize: 13, fontWeight: 900, color: COLORS.ink, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: 0.5 }}>Shipment</h2>
            {shipment ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: COLORS.olive }}>Status</span>
                  <StatusBadge status={shipment.status} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: COLORS.olive }}>Courier</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{shipment.courier_name || "—"}</span>
                </div>
                {shipment.tracking_number && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: COLORS.olive }}>Tracking</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{shipment.tracking_number}</span>
                  </div>
                )}
              </div>
            ) : order.status === "processing" ? (
              !showShipForm ? (
                <button onClick={() => setShowShipForm(true)}
                  style={{ padding: "10px 20px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, fontSize: 13, borderRadius: 10, border: "none", cursor: "pointer" }}>
                  Mark as shipped
                </button>
              ) : (
                <form onSubmit={submitShipment} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: COLORS.olive }}>Tracking Number</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{order.tracking_number || "—"}</span>
                  </div>
                  <select value={shipForm.courier_name}
                    onChange={(e) => setShipForm((s) => ({ ...s, courier_name: e.target.value }))}
                    style={{ padding: "9px 12px", borderRadius: 10, border: `1px solid rgba(32,29,24,0.2)`, fontSize: 13, fontWeight: 600, color: COLORS.ink }}>
                    <option value="">Select a courier</option>
                    {couriers.map((c) => (
                      <option key={c.courier_id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="submit" disabled={updating}
                      style={{ flex: 1, padding: "10px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, fontSize: 13, borderRadius: 10, border: "none", cursor: "pointer" }}>
                      {updating ? "Saving..." : "Confirm shipment"}
                    </button>
                    <button type="button" onClick={() => setShowShipForm(false)}
                      style={{ padding: "10px 16px", background: "transparent", border: `1px solid ${COLORS.olive}`, color: COLORS.olive, fontWeight: 700, fontSize: 13, borderRadius: 10, cursor: "pointer" }}>
                      Cancel
                    </button>
                  </div>
                </form>
              )
            ) : (
              <p style={{ fontSize: 13, color: COLORS.olive }}>No shipment yet.</p>
            )}
          </Card>
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Update status */}
          {nextStatuses.length > 0 && (
            <Card>
              <h2 style={{ fontSize: 13, fontWeight: 900, color: COLORS.ink, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: 0.5 }}>Update status</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {nextStatuses.map((s) => (
                  <button key={s} onClick={() => updateStatus(s)} disabled={updating}
                    style={{
                      padding: "10px", background: s === "cancelled" ? "#fee2e2" : COLORS.primary,
                      color: s === "cancelled" ? "#991B1B" : COLORS.ink,
                      fontWeight: 900, fontSize: 13, borderRadius: 10, border: "none",
                      cursor: updating ? "not-allowed" : "pointer", textTransform: "capitalize",
                    }}>
                    Mark as {s}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Delivery address */}
          {(order.city || order.area) && (
            <Card>
              <h2 style={{ fontSize: 13, fontWeight: 900, color: COLORS.ink, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: 0.5 }}>Delivery address</h2>
              <p style={{ fontWeight: 800, fontSize: 13, color: COLORS.ink, margin: "0 0 4px" }}>{[order.city, order.area].filter(Boolean).join(", ")}</p>
              {order.address_details && <p style={{ fontSize: 12, color: COLORS.olive, margin: 0 }}>{order.address_details}</p>}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

