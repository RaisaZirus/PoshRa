import React from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = {
  bg: "#FDFDF9",
  soft: "#FBEF9C",
  primary: "#FEE32B",
  olive: "#877928",
  ink: "#201D18",
};

function Card({ children, style }) {
  return (
    <div style={{
      background: COLORS.bg,
      border: `1px solid rgba(32,29,24,0.12)`,
      borderRadius: 16,
      boxShadow: "0 10px 26px rgba(32,29,24,0.08)",
      overflow: "hidden",
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontSize: 13, fontWeight: 900, color: COLORS.ink,
      letterSpacing: 0.5, marginBottom: 16, textTransform: "uppercase",
    }}>
      {children}
    </h2>
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
      background: s.bg, color: s.text,
      fontWeight: 800, fontSize: 12,
      padding: "4px 10px", borderRadius: 999,
      textTransform: "capitalize",
    }}>
      {status}
    </span>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 10 }}>
      <span style={{ color: COLORS.olive }}>{label}</span>
      <span style={{ fontWeight: 700, color: COLORS.ink }}>{value}</span>
    </div>
  );
}

export default function OrderDetailsPage() {
  const { order_id } = useParams();
  const { fetchWithAuth, user } = useAuth();
  const location = useLocation();

  const [order, setOrder] = React.useState(null);
  const [sellerOrders, setSellerOrders] = React.useState([]);
  const [shipments, setShipments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [cancelling, setCancelling] = React.useState(false);
  const [paying, setPaying] = React.useState(false);
  const [payError, setPayError] = React.useState("");

  // show success banner if navigated here right after placing order
  const justPlaced = location.state?.justPlaced;

  React.useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchWithAuth(`/api/orders/${order_id}`);
        setOrder(data.data.order);
        setSellerOrders(data.data.seller_orders || []);
        setShipments(data.data.shipments || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (user && order_id) fetchOrder();
  }, [user, order_id]);

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(true);
    try {
      const data = await fetchWithAuth(`/api/orders/${order_id}/cancel`, { method: "PATCH" });
      setOrder((prev) => ({ ...prev, order_status: "cancelled" }));
      setSellerOrders((prev) => prev.map((so) => ({ ...so, status: "cancelled" })));
    } catch (err) {
      alert(err.message);
    } finally {
      setCancelling(false);
    }
  };

  const handlePay = async (method = "card") => {
    setPaying(true);
    setPayError("");
    try {
      // Step 1: initiate payment
      const initData = await fetchWithAuth("/api/payments/initiate", {
        method: "POST",
        body: JSON.stringify({ order_id: Number(order_id), method }),
      });
      // Step 2: confirm payment (simulates gateway callback)
      await fetchWithAuth("/api/payments/confirm", {
        method: "POST",
        body: JSON.stringify({ payment_id: initData.data.payment_id }),
      });
      // Update UI
      setOrder((prev) => ({ ...prev, payment_status: "paid", order_status: "processing" }));
      setSellerOrders((prev) => prev.map((so) => ({ ...so, status: "processing" })));
    } catch (err) {
      setPayError(err.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: COLORS.soft, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <p style={{ fontWeight: 700, color: COLORS.olive, fontSize: 16 }}>Loading order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ background: COLORS.soft, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Card style={{ padding: 40, textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
          <p style={{ fontWeight: 700, color: COLORS.ink, marginBottom: 20 }}>{error || "Order not found"}</p>
          <Link to="/orders" style={{ padding: "10px 20px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, borderRadius: 10, textDecoration: "none" }}>
            My orders
          </Link>
        </Card>
      </div>
    );
  }

  const shipmentForSeller = (sellerOrderId) =>
    shipments.find((s) => s.seller_order_id === sellerOrderId);

  const computedTotal = sellerOrders.reduce((sTotal, so) => {
    return sTotal + (so.items || []).reduce((itemSum, item) => {
      return itemSum + Number(item.price) * Number(item.quantity);
    }, 0);
  }, 0);

  const campaignAdjusted = Number(computedTotal) !== Number(order.total_amount);

  return (
    <div style={{
      background: COLORS.soft, color: COLORS.ink,
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      minHeight: "100vh", paddingBottom: 60,
    }}>
      <div className="container mx-auto px-4 py-8">

        {/* Success banner */}
        {justPlaced && (
          <div style={{
            background: "#DCFCE7", border: "1.5px solid #16a34a",
            borderRadius: 14, padding: "16px 20px", marginBottom: 24,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 24 }}>🎉</span>
            <div>
              <p style={{ fontWeight: 900, color: "#166534", fontSize: 15, margin: 0 }}>Order placed successfully!</p>
              <p style={{ fontSize: 13, color: "#166534", margin: "4px 0 0" }}>
                We've received your order. You'll be notified when it ships.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
          <div>
            <Link to="/orders" style={{ fontSize: 13, color: COLORS.olive, fontWeight: 700, textDecoration: "none" }}>
              ← My orders
            </Link>
            <h1 style={{ fontSize: 28, fontWeight: 900, margin: "6px 0 4px" }}>
              Order #{order.order_id}
            </h1>
            <p style={{ fontSize: 13, color: COLORS.olive, margin: 0 }}>
              Placed on {new Date(order.created_at).toLocaleDateString("en-BD", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <StatusBadge status={order.order_status} />
            <StatusBadge status={order.payment_status} />
            {order.order_status === "pending" && order.payment_status !== "paid" && (
              <button
                onClick={() => handlePay("card")}
                disabled={paying}
                style={{
                  padding: "8px 20px", background: COLORS.primary,
                  border: `1.5px solid ${COLORS.ink}`, color: COLORS.ink,
                  fontWeight: 900, fontSize: 13, borderRadius: 10,
                  cursor: paying ? "not-allowed" : "pointer",
                  opacity: paying ? 0.6 : 1,
                }}
              >
                {paying ? "Processing..." : "Pay now"}
              </button>
            )}
            {order.order_status === "pending" && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                style={{
                  padding: "8px 16px", background: "transparent",
                  border: "1.5px solid #dc2626", color: "#dc2626",
                  fontWeight: 800, fontSize: 13, borderRadius: 10,
                  cursor: cancelling ? "not-allowed" : "pointer",
                  opacity: cancelling ? 0.6 : 1,
                }}
              >
                {cancelling ? "Cancelling..." : "Cancel order"}
              </button>
            )}
            {sellerOrders.some(so => so.status === "delivered") && (
              (() => {
                const deliveredItem = sellerOrders.find(so => so.status === "delivered")?.items?.[0];
                if (deliveredItem?.order_item_id) {
                  return (
                    <Link to={`/returns/${deliveredItem.order_item_id}`}
                      style={{
                        fontSize: 13, fontWeight: 900, padding: "8px 20px",
                        background: "#FEE2E2", color: "#991B1B",
                        borderRadius: 10, textDecoration: "none",
                        border: "1.5px solid #991B1B",
                        display: "inline-block"
                      }}>
                      Return items
                    </Link>
                  );
                }
              })()
            )}
            {payError && (
              <p style={{ fontSize: 13, color: "#dc2626", fontWeight: 700, margin: 0 }}>{payError}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — seller orders + items */}
          <div className="lg:col-span-2 space-y-6">
            {sellerOrders.map((so) => {
              const shipment = shipmentForSeller(so.seller_order_id);
              return (
                <Card key={so.seller_order_id} style={{ padding: 20 }}>
                  {/* Seller header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid rgba(32,29,24,0.1)` }}>
                    <div>
                      <p style={{ fontWeight: 900, fontSize: 14, color: COLORS.ink, margin: 0 }}>
                        {so.business_name || `Seller #${so.seller_id}`}
                      </p>
                      <p style={{ fontSize: 12, color: COLORS.olive, margin: "4px 0 0" }}>
                        Sub-order #{so.seller_order_id}
                      </p>
                    </div>
                    <StatusBadge status={so.status} />
                  </div>

                  {/* Items */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                    {(so.items || []).map((item) => (
                      <div key={item.order_item_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                        <div>
                          <p style={{ fontWeight: 700, color: COLORS.ink, margin: 0 }}>
                            Variant #{item.variant_id}
                          </p>
                          <p style={{ color: COLORS.olive, margin: "2px 0 0" }}>
                            Qty: {item.quantity} × ₹{Number(item.price).toLocaleString("en-BD")}
                          </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <p style={{ fontWeight: 900, color: COLORS.ink, margin: 0 }}>
                            ₹{(Number(item.price) * item.quantity).toLocaleString("en-BD")}
                            {item.original_price && Number(item.original_price) !== Number(item.price) ? (
                              <span style={{ fontSize: 11, color: "#16a34a", marginLeft: 8 }}>
                                (campaign ₹{Number(item.price).toLocaleString("en-BD")})
                              </span>
                            ) : null}
                          </p>
                          {so.status === "delivered" && (
                            <Link to={`/returns/${item.order_item_id}`}
                              style={{ fontSize: 11, fontWeight: 800, padding: "4px 10px", background: "#FEE2E2", color: "#991B1B", borderRadius: 8, textDecoration: "none" }}>
                              Return
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Subtotal */}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, paddingTop: 12, borderTop: `1px solid rgba(32,29,24,0.1)`, marginBottom: shipment ? 14 : 0 }}>
                    <span style={{ color: COLORS.olive }}>Subtotal</span>
                    <span style={{ fontWeight: 900 }}>₹{Number(so.subtotal).toLocaleString("en-BD")}</span>
                  </div>

                  {/* Shipment tracking */}
                  {shipment && (
                    <div style={{ marginTop: 14, padding: "12px 14px", background: COLORS.soft, borderRadius: 10 }}>
                      <p style={{ fontSize: 12, fontWeight: 900, color: COLORS.olive, margin: "0 0 6px", letterSpacing: 0.3 }}>SHIPMENT</p>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                        <span style={{ color: COLORS.ink, fontWeight: 700 }}>{shipment.courier_name || "Courier"}</span>
                        <StatusBadge status={shipment.status} />
                      </div>
                      {shipment.courier_contact && (
                        <p style={{ fontSize: 12, color: COLORS.olive, margin: "6px 0 0" }}>
                          Contact: <strong>{shipment.courier_contact}</strong>
                        </p>
                      )}
                      {shipment.tracking_number && (
                        <p style={{ fontSize: 12, color: COLORS.olive, margin: "6px 0 0" }}>
                          Tracking: <strong>{shipment.tracking_number}</strong>
                        </p>
                      )}
                      {shipment.shipped_at && (
                        <p style={{ fontSize: 12, color: COLORS.olive, margin: "4px 0 0" }}>
                          Shipped: {new Date(shipment.shipped_at).toLocaleDateString("en-BD")}
                        </p>
                      )}
                      {shipment.delivered_at && (
                        <p style={{ fontSize: 12, color: "#16a34a", fontWeight: 700, margin: "4px 0 0" }}>
                          Delivered: {new Date(shipment.delivered_at).toLocaleDateString("en-BD")}
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Right — order summary + address */}
          <div className="space-y-6">
            <Card style={{ padding: 20 }}>
              <SectionTitle>Order summary</SectionTitle>
              <InfoRow label="Order ID" value={`#${order.order_id}`} />
              <InfoRow
                label="Date"
                value={new Date(order.created_at).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" })}
              />
              <InfoRow label="Order status" value={<StatusBadge status={order.order_status} />} />
              <InfoRow label="Payment status" value={<StatusBadge status={order.payment_status} />} />
              {order.coupon_code && (
                <div style={{ marginTop: 10, padding: "10px 12px", background: "rgba(22,163,74,0.08)", borderRadius: 10 }}>
                  <p style={{ margin: 0, fontSize: 12, color: "#16a34a", fontWeight: 700 }}>
                    Coupon applied: {order.coupon_code} (-₹{Number(order.coupon_amount || 0).toLocaleString("en-BD")})
                  </p>
                </div>
              )}
              <div style={{ borderTop: `1px solid rgba(32,29,24,0.1)`, paddingTop: 14, marginTop: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: COLORS.olive, marginBottom: 8 }}>
                    <span>Subtotal</span>
                    {campaignAdjusted ? (
                      <span style={{ fontWeight: 900, color: COLORS.ink }}>
                        ₹{Number(computedTotal).toLocaleString("en-BD")} (campaign price)
                      </span>
                    ) : (
                      <span>₹{Number(order.total_amount).toLocaleString("en-BD")}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: COLORS.olive, marginBottom: 8 }}>
                      <span>Final</span>
                      <span style={{ fontWeight: 900 }}>₹{Number(order.total_amount).toLocaleString("en-BD")}</span>
                  </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: COLORS.olive, marginBottom: 8 }}>
                  <span>Shipping</span>
                  <span style={{ color: "#16a34a", fontWeight: 700 }}>₹{Number(order.shipping_fee || 0).toLocaleString("en-BD")}</span>
                </div>
                {order.coupon_code && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#16a34a", fontWeight: 700 }}>
                    <span>Coupon savings ({order.coupon_code})</span>
                    <span>-₹{Number(order.coupon_amount || 0).toLocaleString("en-BD")}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Delivery address */}
            {(order.city || order.area || order.address_details) && (
              <Card style={{ padding: 20 }}>
                <SectionTitle>Delivery address</SectionTitle>
                <p style={{ fontSize: 14, fontWeight: 800, color: COLORS.ink, margin: "0 0 4px" }}>
                  {[order.city, order.area].filter(Boolean).join(", ")}
                </p>
                {order.address_details && (
                  <p style={{ fontSize: 13, color: COLORS.olive, margin: 0, lineHeight: 1.5 }}>
                    {order.address_details}
                  </p>
                )}
              </Card>
            )}

            {/* Actions */}
            <Card style={{ padding: 20 }}>
              <SectionTitle>Actions</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Link
                  to="/orders"
                  style={{ display: "block", textAlign: "center", padding: "11px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, fontSize: 13, borderRadius: 10, textDecoration: "none" }}
                >
                  My orders
                </Link>
                <Link
                  to="/"
                  style={{ display: "block", textAlign: "center", padding: "11px", border: `1.5px solid ${COLORS.olive}`, color: COLORS.olive, fontWeight: 700, fontSize: 13, borderRadius: 10, textDecoration: "none" }}
                >
                  Continue shopping
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

