import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = {
  bg: "#FDFDF9",
  soft: "#FBEF9C",
  primary: "#FEE32B",
  olive: "#877928",
  ink: "#201D18",
};

const PAYMENT_METHODS = [
  { id: "credit_card", label: "Credit Card", icon: "💳" },
  { id: "debit_card", label: "Debit Card", icon: "🏦" },
  { id: "upi", label: "UPI", icon: "📱" },
  { id: "net_banking", label: "Net Banking", icon: "🌐" },
  { id: "wallet", label: "Digital Wallet", icon: "👛" },
  { id: "cod", label: "Cash on Delivery", icon: "🚚" },
];

function Card({ children, style }) {
  return (
    <div
      style={{
        background: COLORS.bg,
        border: `1px solid rgba(32,29,24,0.12)`,
        borderRadius: 16,
        boxShadow: "0 10px 26px rgba(32,29,24,0.08)",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2
      style={{
        fontSize: 13,
        fontWeight: 900,
        color: COLORS.ink,
        letterSpacing: 0.5,
        marginBottom: 16,
        textTransform: "uppercase",
      }}
    >
      {children}
    </h2>
  );
}

export default function PaymentPage() {
  const { order_id } = useParams();
  const { fetchWithAuth } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = React.useState(null);
  const [payment, setPayment] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedMethod, setSelectedMethod] = React.useState(null);
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);

  // Fetch order and payment info
  React.useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch order
        const orderRes = await fetchWithAuth(`/api/orders/${order_id}`);
        setOrder(orderRes.data.order);

        // Fetch payment
        const paymentRes = await fetchWithAuth(`/api/payments/${order_id}`);
        if (paymentRes.data && paymentRes.data.length > 0) {
          setPayment(paymentRes.data[0]);
          setSelectedMethod(paymentRes.data[0].method);
        }
      } catch (err) {
        setError(err.message || "Failed to load payment details");
      } finally {
        setLoading(false);
      }
    };

    if (order_id) fetch();
  }, [order_id, fetchWithAuth]);

  // Initiate payment
  const handleInitiatePayment = async () => {
    if (!selectedMethod) {
      setError("Please select a payment method");
      return;
    }

    try {
      setError("");
      setConfirming(true);

      const res = await fetchWithAuth("/api/payments/initiate", {
        method: "POST",
        body: JSON.stringify({
          order_id: parseInt(order_id),
          method: selectedMethod,
        }),
      });

      setPayment(res.data);
    } catch (err) {
      setError(err.message || "Failed to initiate payment");
    } finally {
      setConfirming(false);
    }
  };

  // Confirm payment
  const handleConfirmPayment = async () => {
    if (!payment?.payment_id) {
      setError("Payment not initialized");
      return;
    }

    try {
      setError("");
      setConfirming(true);

      await fetchWithAuth("/api/payments/confirm", {
        method: "POST",
        body: JSON.stringify({
          payment_id: payment.payment_id,
        }),
      });

      setSuccess(true);
      setTimeout(() => {
        navigate(`/orders/${order_id}`, { state: { paymentCompleted: true } });
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to confirm payment");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: COLORS.soft, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.olive }}>Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ background: COLORS.soft, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Card style={{ padding: 40, textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: COLORS.ink, marginBottom: 12 }}>Order not found</h2>
          <p style={{ fontSize: 14, color: COLORS.olive }}>We couldn't find the order you're looking for.</p>
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        background: COLORS.soft,
        color: COLORS.ink,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        minHeight: "100vh",
        paddingBottom: 60,
      }}
    >
      <div className="container mx-auto px-4 py-8" style={{ maxWidth: 1000 }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: 0.2 }}>Payment</h1>
          <p style={{ fontSize: 13, color: COLORS.olive, marginTop: 4 }}>Order #{order.order_id}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Left column — Payment methods */}
          <div>
            {order.payment_status === "paid" ? (
              <Card style={{ padding: 20, textAlign: "center", background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>✓</div>
                <SectionTitle>Payment completed</SectionTitle>
                <p style={{ fontSize: 14, color: COLORS.olive, marginBottom: 20 }}>
                  Your payment has already been processed. Your order is now being prepared for shipment.
                </p>
              </Card>
            ) : (
              <Card style={{ padding: 20 }}>
                <SectionTitle>Select payment method</SectionTitle>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {PAYMENT_METHODS.map((method) => (
                    <div
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      style={{
                        border: `2px solid ${selectedMethod === method.id ? COLORS.primary : "rgba(32,29,24,0.12)"}`,
                        borderRadius: 12,
                        padding: "14px 16px",
                        cursor: "pointer",
                        background: selectedMethod === method.id ? "rgba(254,227,43,0.08)" : COLORS.bg,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        transition: "border-color 0.15s",
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          border: `2px solid ${selectedMethod === method.id ? COLORS.primary : COLORS.olive}`,
                          background: selectedMethod === method.id ? COLORS.primary : "transparent",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 16 }}>{method.icon}</span>
                      <span style={{ fontWeight: 800, fontSize: 14 }}>{method.label}</span>
                    </div>
                  ))}
                </div>

                {/* Initiate button */}
                {!payment && (
                  <button
                    onClick={handleInitiatePayment}
                    disabled={confirming || !selectedMethod}
                    style={{
                      width: "100%",
                      marginTop: 20,
                      padding: "12px",
                      background: !selectedMethod ? "rgba(254,227,43,0.5)" : COLORS.primary,
                      color: COLORS.ink,
                      fontWeight: 900,
                      fontSize: 14,
                      borderRadius: 12,
                      border: "none",
                      cursor: !selectedMethod ? "not-allowed" : "pointer",
                      opacity: !selectedMethod ? 0.6 : 1,
                    }}
                  >
                    {confirming ? "Processing..." : "Continue to Payment"}
                  </button>
                )}
              </Card>
            )}
          </div>

          {/* Right column — Order summary + Transaction */}
          <div>
            <Card style={{ padding: 20, marginBottom: 16 }}>
              <SectionTitle>Order summary</SectionTitle>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: COLORS.olive, marginBottom: 8 }}>
                  <span>Subtotal</span>
                  <span>₹{Number((order.total_amount || 0) - (order.shipping_fee || 0)).toLocaleString("en-BD")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: COLORS.olive }}>
                  <span>Shipping</span>
                  <span style={{ color: "#16a34a", fontWeight: 700 }}>₹{Number(order.shipping_fee || 0).toLocaleString("en-BD")}</span>
                </div>
              </div>

              <div style={{ borderTop: "1px solid rgba(32,29,24,0.1)", paddingTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 900 }}>
                  <span>Total</span>
                  <span style={{ color: COLORS.primary }}>₹{Number(order.total_amount || 0).toLocaleString("en-BD")}</span>
                </div>
              </div>
            </Card>

            {/* Transaction ID */}
            {payment && (
              <Card style={{ padding: 20, marginBottom: 16, background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)" }}>
                <SectionTitle>Transaction details</SectionTitle>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 11, color: COLORS.olive, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                      Transaction ID
                    </p>
                    <p
                      style={{
                        fontSize: 16,
                        fontWeight: 900,
                        color: "#16a34a",
                        fontFamily: "monospace",
                        wordBreak: "break-all",
                      }}
                    >
                      {payment.transaction_id}
                    </p>
                  </div>

                  <div>
                    <p style={{ fontSize: 11, color: COLORS.olive, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                      Payment method
                    </p>
                    <p style={{ fontSize: 14, fontWeight: 800, color: COLORS.ink }}>
                      {PAYMENT_METHODS.find((m) => m.id === payment.method)?.label || payment.method}
                    </p>
                  </div>

                  <div>
                    <p style={{ fontSize: 11, color: COLORS.olive, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                      Amount
                    </p>
                    <p style={{ fontSize: 14, fontWeight: 800, color: COLORS.ink }}>
                      ₹{Number(payment.amount).toLocaleString("en-BD")}
                    </p>
                  </div>

                  <div>
                    <p style={{ fontSize: 11, color: COLORS.olive, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                      Status
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: payment.status === "completed" ? "#16a34a" : "#dc2626",
                        background: payment.status === "completed" ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)",
                        padding: "4px 8px",
                        borderRadius: 6,
                        display: "inline-block",
                        textTransform: "capitalize",
                      }}
                    >
                      {payment.status}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Confirm button */}
            {payment && payment.status === "pending" && (
              <button
                onClick={handleConfirmPayment}
                disabled={confirming}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: COLORS.primary,
                  color: COLORS.ink,
                  fontWeight: 900,
                  fontSize: 14,
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {confirming ? "Processing..." : "Confirm Payment"}
              </button>
            )}

            {success && (
              <div style={{ background: "rgba(22,163,74,0.08)", border: "1.5px solid #16a34a", borderRadius: 12, padding: 16, textAlign: "center" }}>
                <p style={{ fontSize: 16, fontWeight: 900, color: "#16a34a", margin: 0 }}>✓ Payment confirmed!</p>
              </div>
            )}

            {error && (
              <div style={{ background: "#fef2f2", border: "1.5px solid #dc2626", borderRadius: 12, padding: 12 }}>
                <p style={{ fontSize: 13, color: "#dc2626", fontWeight: 700, margin: 0 }}>{error}</p>
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                onClick={() => navigate("/orders")}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "transparent",
                  border: `2px solid ${COLORS.olive}`,
                  color: COLORS.olive,
                  fontWeight: 900,
                  fontSize: 14,
                  borderRadius: 12,
                  cursor: "pointer",
                }}
              >
                My Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


