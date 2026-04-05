import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = {
  bg: "#fffef8",
  surface: "rgba(255,255,255,0.88)",
  surfaceStrong: "#ffffff",
  line: "rgba(32,29,24,0.12)",
  lineStrong: "rgba(32,29,24,0.18)",
  soft: "#f7f3d0",
  primary: "#fee32b",
  primaryDeep: "#e2c913",
  olive: "#877928",
  oliveDark: "#5f551d",
  ink: "#201d18",
  muted: "#6d665a",
  success: "#16a34a",
  successSoft: "rgba(22,163,74,0.10)",
  danger: "#dc2626",
  dangerSoft: "rgba(220,38,38,0.08)",
};

const PAYMENT_METHODS = [
  { id: "bkash", label: "bKash", icon: "📱", hint: "Pay via bKash mobile wallet" },
  { id: "nagad", label: "Nagad", icon: "💜", hint: "Fast & easy Nagad payments" },
  { id: "rocket", label: "Rocket", icon: "🚀", hint: "Dutch-Bangla Bank mobile banking" },
  { id: "upay", label: "Upay", icon: "🔵", hint: "UCB mobile financial service" },
  { id: "card", label: "Credit / Debit Card", icon: "💳", hint: "Visa, Mastercard, AMEX" },
  { id: "net_banking", label: "Internet Banking", icon: "🌐", hint: "Pay directly from your bank" },
  { id: "paypal", label: "PayPal", icon: "🅿️", hint: "International PayPal checkout" },
  { id: "stripe", label: "Stripe", icon: "⚡", hint: "Secure international card payment" },
  { id: "cod", label: "Cash on Delivery", icon: "🚚", hint: "Pay when your order arrives" },
];

function formatCurrency(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD")}`;
}

function Card({ children, style, className = "" }) {
  return (
    <div className={`pp-card ${className}`} style={style}>
      {children}
    </div>
  );
}

function SectionTitle({ children, subtext }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h2 className="pp-section-title">{children}</h2>
      {subtext ? <p className="pp-section-subtitle">{subtext}</p> : null}
    </div>
  );
}

function StatusBadge({ status }) {
  const isCompleted = status === "completed" || status === "paid";
  const isPending = status === "pending";
  const styles = isCompleted
    ? {
        color: COLORS.success,
        background: "rgba(22,163,74,0.10)",
        border: "1px solid rgba(22,163,74,0.18)",
      }
    : isPending
    ? {
        color: "#a16207",
        background: "rgba(245,158,11,0.10)",
        border: "1px solid rgba(245,158,11,0.18)",
      }
    : {
        color: COLORS.danger,
        background: "rgba(220,38,38,0.08)",
        border: "1px solid rgba(220,38,38,0.16)",
      };

  return (
    <span className="pp-status-badge" style={styles}>
      {status || "unknown"}
    </span>
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

  React.useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError("");

        const orderRes = await fetchWithAuth(`/api/orders/${order_id}`);
        setOrder(orderRes.data.order);

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

  const activeMethod =
    PAYMENT_METHODS.find((method) => method.id === (payment?.method || selectedMethod)) || null;

  const subtotal = Math.max(
    Number(order?.total_amount || 0) - Number(order?.shipping_fee || 0),
    0
  );

  const isPaid = order?.payment_status === "paid" || payment?.status === "completed";

  if (loading) {
    return (
      <div className="pp-loading-screen">
        <style>{styles}</style>
        <div className="pp-loading-card">
          <div className="pp-spinner-wrap">
            <div className="pp-spinner-ring" />
            <div className="pp-spinner-core">৳</div>
          </div>
          <h2 className="pp-loading-title">Preparing your secure checkout</h2>
          <p className="pp-loading-text">Fetching order and payment details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="pp-empty-screen">
        <style>{styles}</style>
        <Card style={{ maxWidth: 460, padding: 34, textAlign: "center" }}>
          <div className="pp-empty-icon">❌</div>
          <h2 className="pp-empty-title">Order not found</h2>
          <p className="pp-empty-text">
            We couldn&apos;t find the order you&apos;re looking for. Please go back and try again.
          </p>
          <button className="pp-primary-btn" onClick={() => navigate("/orders")}>
            Back to Orders
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="pp-shell">
      <style>{styles}</style>

      <div className="pp-orb pp-orb-1" />
      <div className="pp-orb pp-orb-2" />
      <div className="pp-grid-glow" />

      <div className="pp-container">
        <div className="pp-header">
          <div className="pp-header-copy">
            <div className="pp-kicker">Secure Checkout</div>
            <h1 className="pp-title">Complete your payment</h1>
            <p className="pp-subtitle">
              Review your order, choose a payment option, and confirm your purchase with a smooth,
              premium checkout experience.
            </p>

            <div className="pp-steps">
              <div className="pp-step pp-step-active">
                <span>01</span>
                <p>Review</p>
              </div>
              <div className={`pp-step ${payment ? "pp-step-active" : ""}`}>
                <span>02</span>
                <p>Pay</p>
              </div>
              <div className={`pp-step ${success || isPaid ? "pp-step-active" : ""}`}>
                <span>03</span>
                <p>Confirm</p>
              </div>
            </div>
          </div>

          <Card className="pp-header-card">
            <div className="pp-order-chip">Order #{order.order_id}</div>
            <div className="pp-header-card-row">
              <div>
                <p className="pp-label">Total amount</p>
                <h3 className="pp-price">{formatCurrency(order.total_amount)}</h3>
              </div>
              <div className="pp-secure-mini">
                <span>🔒</span>
                <p>Protected checkout</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="pp-layout">
          <div className="pp-left-col">
            {isPaid ? (
              <Card
                className="pp-success-card"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(22,163,74,0.10) 0%, rgba(255,255,255,0.88) 100%)",
                  border: "1px solid rgba(22,163,74,0.18)",
                }}
              >
                <div className="pp-success-icon">✓</div>
                <SectionTitle
                  subtext="Your payment has already been processed and your order is now moving forward."
                >
                  Payment completed
                </SectionTitle>

                <div className="pp-success-grid">
                  <div className="pp-detail-box">
                    <p className="pp-label">Order Status</p>
                    <StatusBadge status={payment?.status || order.payment_status} />
                  </div>
                  <div className="pp-detail-box">
                    <p className="pp-label">Payment Method</p>
                    <p className="pp-strong">{activeMethod?.label || "Already selected"}</p>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="pp-card-glow">
                <SectionTitle subtext="Choose the option that works best for you.">
                  Select payment method
                </SectionTitle>

                <div className="pp-method-list">
                  {PAYMENT_METHODS.map((method, index) => {
                    const isSelected = selectedMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        className={`pp-method ${isSelected ? "pp-method-selected" : ""}`}
                        onClick={() => setSelectedMethod(method.id)}
                        style={{ animationDelay: `${index * 70}ms` }}
                      >
                        <div className="pp-method-left">
                          <div className="pp-radio-wrap">
                            <div className="pp-radio-dot" />
                          </div>
                          <div className="pp-method-icon">{method.icon}</div>
                          <div>
                            <div className="pp-method-title">{method.label}</div>
                            <div className="pp-method-hint">{method.hint}</div>
                          </div>
                        </div>
                        <div className="pp-method-check">{isSelected ? "✓" : ""}</div>
                      </button>
                    );
                  })}
                </div>

                {!payment && (
                  <button
                    type="button"
                    onClick={handleInitiatePayment}
                    disabled={confirming || !selectedMethod}
                    className="pp-primary-btn pp-full-btn"
                  >
                    <span className="pp-btn-shine" />
                    {confirming ? "Processing..." : "Continue to Payment"}
                  </button>
                )}

                <div className="pp-note-strip">
                  <span>🛡️</span>
                  <p>Your transaction details are handled through your existing secure payment flow.</p>
                </div>
              </Card>
            )}
          </div>

          <div className="pp-right-col">
            <Card>
              <SectionTitle subtext="A quick look at what you&apos;re paying for.">
                Order summary
              </SectionTitle>

              <div className="pp-summary-list">
                <div className="pp-summary-row">
                  <span>Subtotal</span>
                  <strong>{formatCurrency(subtotal)}</strong>
                </div>

                <div className="pp-summary-row">
                  <span>Shipping</span>
                  <strong className="pp-green">{formatCurrency(order.shipping_fee)}</strong>
                </div>

                <div className="pp-summary-divider" />

                <div className="pp-summary-total">
                  <span>Total</span>
                  <strong>{formatCurrency(order.total_amount)}</strong>
                </div>
              </div>
            </Card>

            {payment && (
              <Card
                className="pp-transaction-card"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(254,227,43,0.08) 100%)",
                }}
              >
                <SectionTitle subtext="Live information from your current payment session.">
                  Transaction details
                </SectionTitle>

                <div className="pp-transaction-grid">
                  <div className="pp-data-item pp-data-item-wide">
                    <p className="pp-label">Transaction ID</p>
                    <p className="pp-mono">{payment.transaction_id}</p>
                  </div>

                  <div className="pp-data-item">
                    <p className="pp-label">Payment method</p>
                    <p className="pp-strong">
                      {PAYMENT_METHODS.find((m) => m.id === payment.method)?.label || payment.method}
                    </p>
                  </div>

                  <div className="pp-data-item">
                    <p className="pp-label">Amount</p>
                    <p className="pp-strong">{formatCurrency(payment.amount)}</p>
                  </div>

                  <div className="pp-data-item pp-data-item-wide">
                    <p className="pp-label">Status</p>
                    <StatusBadge status={payment.status} />
                  </div>
                </div>
              </Card>
            )}

            {payment && payment.status === "pending" && (
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={confirming}
                className="pp-primary-btn pp-full-btn pp-confirm-btn"
              >
                <span className="pp-btn-shine" />
                {confirming ? "Processing..." : "Confirm Payment"}
              </button>
            )}

            {success && (
              <div className="pp-alert pp-alert-success">
                <p>✓ Payment confirmed successfully! Redirecting to your order details...</p>
              </div>
            )}

            {error && (
              <div className="pp-alert pp-alert-error">
                <p>{error}</p>
              </div>
            )}

            <div className="pp-actions">
              <button type="button" onClick={() => navigate("/orders")} className="pp-secondary-btn">
                My Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = `
  * {
    box-sizing: border-box;
  }

  .pp-shell {
    position: relative;
    min-height: 100vh;
    overflow: hidden;
    background:
      radial-gradient(circle at top left, rgba(254,227,43,0.18), transparent 32%),
      radial-gradient(circle at bottom right, rgba(135,121,40,0.12), transparent 26%),
      linear-gradient(180deg, #f9f5d7 0%, #f7f2d0 35%, #fbfaf4 100%);
    color: ${COLORS.ink};
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    padding: 40px 18px 72px;
  }

  .pp-container {
    position: relative;
    z-index: 2;
    max-width: 1180px;
    margin: 0 auto;
  }

  .pp-orb {
    position: absolute;
    border-radius: 999px;
    filter: blur(18px);
    pointer-events: none;
    z-index: 0;
    animation: ppFloat 9s ease-in-out infinite;
  }

  .pp-orb-1 {
    top: 70px;
    right: -80px;
    width: 280px;
    height: 280px;
    background: rgba(254,227,43,0.22);
  }

  .pp-orb-2 {
    bottom: 120px;
    left: -100px;
    width: 240px;
    height: 240px;
    background: rgba(135,121,40,0.14);
    animation-delay: -3s;
  }

  .pp-grid-glow {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(32,29,24,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(32,29,24,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    mask-image: linear-gradient(180deg, rgba(0,0,0,0.2), transparent 85%);
    pointer-events: none;
    z-index: 0;
  }

  .pp-header {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.75fr);
    gap: 24px;
    align-items: end;
    margin-bottom: 28px;
  }

  .pp-header-copy {
    animation: ppFadeUp 700ms ease both;
  }

  .pp-kicker {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border-radius: 999px;
    background: rgba(255,255,255,0.65);
    border: 1px solid rgba(32,29,24,0.08);
    color: ${COLORS.oliveDark};
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    box-shadow: 0 10px 24px rgba(32,29,24,0.05);
    backdrop-filter: blur(12px);
  }

  .pp-title {
    margin: 16px 0 10px;
    font-size: clamp(32px, 5vw, 52px);
    line-height: 1.02;
    letter-spacing: -0.04em;
    font-weight: 900;
  }

  .pp-subtitle {
    margin: 0;
    max-width: 720px;
    color: ${COLORS.muted};
    font-size: 15px;
    line-height: 1.8;
  }

  .pp-steps {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 22px;
  }

  .pp-step {
    min-width: 96px;
    padding: 12px 14px;
    border-radius: 16px;
    border: 1px solid rgba(32,29,24,0.08);
    background: rgba(255,255,255,0.58);
    backdrop-filter: blur(10px);
    box-shadow: 0 10px 24px rgba(32,29,24,0.04);
    transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
  }

  .pp-step:hover {
    transform: translateY(-2px);
    box-shadow: 0 18px 30px rgba(32,29,24,0.06);
  }

  .pp-step span {
    display: inline-flex;
    width: 28px;
    height: 28px;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: rgba(32,29,24,0.06);
    color: ${COLORS.oliveDark};
    font-size: 12px;
    font-weight: 900;
  }

  .pp-step p {
    margin: 10px 0 0;
    font-size: 13px;
    font-weight: 800;
    color: ${COLORS.muted};
  }

  .pp-step-active {
    border-color: rgba(254,227,43,0.65);
    background: linear-gradient(180deg, rgba(254,227,43,0.18), rgba(255,255,255,0.85));
  }

  .pp-step-active span {
    background: ${COLORS.primary};
    color: ${COLORS.ink};
  }

  .pp-step-active p {
    color: ${COLORS.ink};
  }

  .pp-header-card {
    padding: 24px;
    animation: ppFadeUp 800ms ease both;
    animation-delay: 120ms;
  }

  .pp-order-chip {
    display: inline-flex;
    padding: 8px 12px;
    border-radius: 999px;
    background: rgba(254,227,43,0.16);
    color: ${COLORS.oliveDark};
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 16px;
  }

  .pp-header-card-row {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 18px;
  }

  .pp-label {
    margin: 0 0 8px;
    color: ${COLORS.muted};
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .pp-price {
    margin: 0;
    font-size: clamp(24px, 4vw, 34px);
    line-height: 1;
    letter-spacing: -0.04em;
    font-weight: 900;
    color: ${COLORS.ink};
  }

  .pp-secure-mini {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 16px;
    background: rgba(255,255,255,0.7);
    border: 1px solid rgba(32,29,24,0.08);
  }

  .pp-secure-mini p {
    margin: 0;
    font-size: 12px;
    font-weight: 800;
    color: ${COLORS.muted};
  }

  .pp-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.12fr) minmax(320px, 0.88fr);
    gap: 24px;
    align-items: start;
  }

  .pp-left-col,
  .pp-right-col {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .pp-card {
    position: relative;
    overflow: hidden;
    padding: 22px;
    border-radius: 26px;
    background: ${COLORS.surface};
    border: 1px solid rgba(255,255,255,0.7);
    box-shadow:
      0 12px 32px rgba(32,29,24,0.07),
      inset 0 1px 0 rgba(255,255,255,0.75);
    backdrop-filter: blur(14px);
    animation: ppFadeUp 650ms ease both;
  }

  .pp-card::before {
    content: "";
    position: absolute;
    inset: 0 0 auto 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent);
    pointer-events: none;
  }

  .pp-card-glow::after {
    content: "";
    position: absolute;
    inset: -80% auto auto -10%;
    width: 120px;
    height: 240%;
    transform: rotate(18deg);
    background: linear-gradient(
      90deg,
      rgba(255,255,255,0) 0%,
      rgba(255,255,255,0.28) 50%,
      rgba(255,255,255,0) 100%
    );
    animation: ppSweep 7s linear infinite;
    pointer-events: none;
  }

  .pp-section-title {
    margin: 0;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: ${COLORS.ink};
  }

  .pp-section-subtitle {
    margin: 8px 0 0;
    color: ${COLORS.muted};
    font-size: 14px;
    line-height: 1.7;
  }

  .pp-method-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .pp-method {
    width: 100%;
    border: 1px solid rgba(32,29,24,0.10);
    background: rgba(255,255,255,0.78);
    border-radius: 20px;
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    cursor: pointer;
    text-align: left;
    box-shadow: 0 8px 18px rgba(32,29,24,0.04);
    transform: translateY(0);
    transition:
      transform 220ms ease,
      border-color 220ms ease,
      box-shadow 220ms ease,
      background 220ms ease;
    animation: ppFadeUp 600ms ease both;
  }

  .pp-method:hover {
    transform: translateY(-3px);
    border-color: rgba(254,227,43,0.55);
    box-shadow: 0 18px 28px rgba(32,29,24,0.08);
  }

  .pp-method-selected {
    background: linear-gradient(180deg, rgba(254,227,43,0.14), rgba(255,255,255,0.88));
    border-color: rgba(254,227,43,0.75);
    box-shadow:
      0 16px 30px rgba(32,29,24,0.07),
      0 0 0 4px rgba(254,227,43,0.12);
  }

  .pp-method-left {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
  }

  .pp-radio-wrap {
    width: 22px;
    height: 22px;
    border-radius: 999px;
    border: 2px solid ${COLORS.olive};
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: rgba(255,255,255,0.8);
    transition: all 200ms ease;
  }

  .pp-method-selected .pp-radio-wrap {
    border-color: ${COLORS.primaryDeep};
    background: rgba(254,227,43,0.20);
  }

  .pp-radio-dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: transparent;
    transition: background 200ms ease, transform 200ms ease;
    transform: scale(0.7);
  }

  .pp-method-selected .pp-radio-dot {
    background: ${COLORS.primaryDeep};
    transform: scale(1);
  }

  .pp-method-icon {
    width: 46px;
    height: 46px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(254,227,43,0.14);
    font-size: 22px;
    flex-shrink: 0;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.75);
  }

  .pp-method-title {
    font-size: 15px;
    font-weight: 900;
    color: ${COLORS.ink};
    line-height: 1.3;
  }

  .pp-method-hint {
    margin-top: 4px;
    font-size: 12px;
    color: ${COLORS.muted};
    line-height: 1.6;
  }

  .pp-method-check {
    min-width: 24px;
    text-align: center;
    font-size: 18px;
    font-weight: 900;
    color: ${COLORS.success};
  }

  .pp-primary-btn,
  .pp-secondary-btn {
    position: relative;
    overflow: hidden;
    border: none;
    outline: none;
    cursor: pointer;
    border-radius: 18px;
    font-size: 14px;
    font-weight: 900;
    transition:
      transform 200ms ease,
      box-shadow 220ms ease,
      opacity 200ms ease,
      background 220ms ease;
  }

  .pp-primary-btn:hover,
  .pp-secondary-btn:hover {
    transform: translateY(-2px);
  }

  .pp-primary-btn:disabled,
  .pp-secondary-btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
    transform: none;
  }

  .pp-primary-btn {
    padding: 15px 18px;
    background: linear-gradient(180deg, #ffea57 0%, ${COLORS.primary} 60%, #f2d80c 100%);
    color: ${COLORS.ink};
    box-shadow:
      0 14px 24px rgba(254,227,43,0.24),
      inset 0 1px 0 rgba(255,255,255,0.7);
  }

  .pp-primary-btn:hover {
    box-shadow:
      0 18px 30px rgba(254,227,43,0.30),
      inset 0 1px 0 rgba(255,255,255,0.8);
  }

  .pp-secondary-btn {
    width: 100%;
    padding: 14px 18px;
    border: 1.5px solid rgba(32,29,24,0.16);
    background: rgba(255,255,255,0.72);
    color: ${COLORS.oliveDark};
    box-shadow: 0 10px 20px rgba(32,29,24,0.04);
  }

  .pp-full-btn {
    width: 100%;
    margin-top: 18px;
  }

  .pp-confirm-btn {
    animation: ppPopIn 450ms ease both;
  }

  .pp-btn-shine {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .pp-primary-btn .pp-btn-shine::after {
    content: "";
    position: absolute;
    inset: -120% auto auto -25%;
    width: 60px;
    height: 320%;
    transform: rotate(24deg);
    background: linear-gradient(
      90deg,
      rgba(255,255,255,0) 0%,
      rgba(255,255,255,0.42) 50%,
      rgba(255,255,255,0) 100%
    );
    animation: ppSweep 3.5s linear infinite;
  }

  .pp-note-strip {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-top: 18px;
    padding: 14px 16px;
    border-radius: 18px;
    background: rgba(255,255,255,0.62);
    border: 1px solid rgba(32,29,24,0.08);
  }

  .pp-note-strip span {
    font-size: 18px;
  }

  .pp-note-strip p {
    margin: 0;
    color: ${COLORS.muted};
    font-size: 13px;
    line-height: 1.7;
  }

  .pp-summary-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .pp-summary-row,
  .pp-summary-total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
  }

  .pp-summary-row span,
  .pp-summary-row strong {
    font-size: 14px;
    color: ${COLORS.muted};
  }

  .pp-summary-row strong {
    color: ${COLORS.ink};
    font-weight: 800;
  }

  .pp-summary-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(32,29,24,0.14), transparent);
    margin: 2px 0;
  }

  .pp-summary-total span {
    font-size: 15px;
    color: ${COLORS.ink};
    font-weight: 800;
  }

  .pp-summary-total strong {
    font-size: 26px;
    font-weight: 900;
    color: ${COLORS.primaryDeep};
    letter-spacing: -0.03em;
  }

  .pp-green {
    color: ${COLORS.success} !important;
  }

  .pp-transaction-card {
    animation-delay: 80ms;
  }

  .pp-transaction-grid,
  .pp-success-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .pp-data-item,
  .pp-detail-box {
    padding: 15px 16px;
    border-radius: 18px;
    background: rgba(255,255,255,0.72);
    border: 1px solid rgba(32,29,24,0.08);
  }

  .pp-data-item-wide {
    grid-column: 1 / -1;
  }

  .pp-mono {
    margin: 0;
    color: ${COLORS.success};
    font-size: 15px;
    font-weight: 900;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    word-break: break-word;
    line-height: 1.7;
  }

  .pp-strong {
    margin: 0;
    color: ${COLORS.ink};
    font-size: 14px;
    font-weight: 800;
    line-height: 1.7;
  }

  .pp-status-badge {
    display: inline-flex;
    align-items: center;
    padding: 7px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 900;
    text-transform: capitalize;
    letter-spacing: 0.02em;
  }

  .pp-success-card {
    text-align: left;
  }

  .pp-success-icon {
    width: 76px;
    height: 76px;
    border-radius: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${COLORS.successSoft};
    color: ${COLORS.success};
    font-size: 34px;
    font-weight: 900;
    box-shadow:
      0 18px 30px rgba(22,163,74,0.12),
      inset 0 1px 0 rgba(255,255,255,0.85);
    margin-bottom: 16px;
    animation: ppPulse 2.2s ease-in-out infinite;
  }

  .pp-alert {
    border-radius: 18px;
    padding: 14px 16px;
    font-size: 14px;
    font-weight: 800;
    animation: ppPopIn 350ms ease both;
  }

  .pp-alert p {
    margin: 0;
    line-height: 1.7;
  }

  .pp-alert-success {
    background: rgba(22,163,74,0.08);
    border: 1px solid rgba(22,163,74,0.18);
    color: ${COLORS.success};
  }

  .pp-alert-error {
    background: rgba(220,38,38,0.06);
    border: 1px solid rgba(220,38,38,0.16);
    color: ${COLORS.danger};
  }

  .pp-actions {
    display: flex;
    gap: 10px;
  }

  .pp-loading-screen,
  .pp-empty-screen {
    min-height: 100vh;
    padding: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background:
      radial-gradient(circle at top left, rgba(254,227,43,0.18), transparent 30%),
      linear-gradient(180deg, #f9f5d7 0%, #fbfaf4 100%);
  }

  .pp-loading-card {
    width: min(92vw, 460px);
    padding: 34px 26px;
    border-radius: 28px;
    text-align: center;
    background: rgba(255,255,255,0.84);
    border: 1px solid rgba(255,255,255,0.74);
    box-shadow: 0 18px 38px rgba(32,29,24,0.08);
    backdrop-filter: blur(14px);
    animation: ppFadeUp 550ms ease both;
  }

  .pp-spinner-wrap {
    position: relative;
    width: 90px;
    height: 90px;
    margin: 0 auto 18px;
  }

  .pp-spinner-ring {
    position: absolute;
    inset: 0;
    border-radius: 999px;
    border: 4px solid rgba(32,29,24,0.08);
    border-top-color: ${COLORS.primaryDeep};
    animation: ppSpin 0.95s linear infinite;
  }

  .pp-spinner-core {
    position: absolute;
    inset: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: rgba(254,227,43,0.16);
    font-size: 28px;
    font-weight: 900;
    color: ${COLORS.oliveDark};
  }

  .pp-loading-title,
  .pp-empty-title {
    margin: 0 0 8px;
    font-size: 24px;
    font-weight: 900;
    color: ${COLORS.ink};
    letter-spacing: -0.03em;
  }

  .pp-loading-text,
  .pp-empty-text {
    margin: 0;
    color: ${COLORS.muted};
    font-size: 14px;
    line-height: 1.8;
  }

  .pp-empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
  }

  @keyframes ppFadeUp {
    from {
      opacity: 0;
      transform: translateY(18px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes ppPopIn {
    from {
      opacity: 0;
      transform: scale(0.98) translateY(8px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @keyframes ppFloat {
    0%, 100% {
      transform: translateY(0px) translateX(0px);
    }
    50% {
      transform: translateY(-12px) translateX(8px);
    }
  }

  @keyframes ppSpin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes ppPulse {
    0%, 100% {
      transform: scale(1);
      box-shadow:
        0 18px 30px rgba(22,163,74,0.12),
        inset 0 1px 0 rgba(255,255,255,0.85);
    }
    50% {
      transform: scale(1.04);
      box-shadow:
        0 22px 34px rgba(22,163,74,0.18),
        inset 0 1px 0 rgba(255,255,255,0.85);
    }
  }

  @keyframes ppSweep {
    0% {
      transform: translateX(-30vw) rotate(18deg);
    }
    100% {
      transform: translateX(120vw) rotate(18deg);
    }
  }

  @media (max-width: 1024px) {
    .pp-header,
    .pp-layout {
      grid-template-columns: 1fr;
    }

    .pp-header-card-row {
      align-items: start;
      flex-direction: column;
    }
  }

  @media (max-width: 640px) {
    .pp-shell {
      padding: 24px 14px 54px;
    }

    .pp-card {
      padding: 18px;
      border-radius: 22px;
    }

    .pp-title {
      font-size: 34px;
    }

    .pp-transaction-grid,
    .pp-success-grid {
      grid-template-columns: 1fr;
    }

    .pp-data-item-wide {
      grid-column: auto;
    }

    .pp-method {
      padding: 14px;
      border-radius: 18px;
    }

    .pp-method-left {
      gap: 12px;
      align-items: flex-start;
    }

    .pp-method-icon {
      width: 42px;
      height: 42px;
      font-size: 20px;
      border-radius: 12px;
    }

    .pp-summary-total strong {
      font-size: 22px;
    }

    .pp-steps {
      gap: 10px;
    }

    .pp-step {
      flex: 1 1 calc(33.333% - 10px);
      min-width: 0;
    }

    .pp-step p {
      font-size: 12px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .pp-card,
    .pp-header-copy,
    .pp-header-card,
    .pp-method,
    .pp-alert,
    .pp-confirm-btn,
    .pp-orb,
    .pp-success-icon,
    .pp-spinner-ring,
    .pp-primary-btn .pp-btn-shine::after,
    .pp-card-glow::after {
      animation: none !important;
      transition: none !important;
    }
  }
`;