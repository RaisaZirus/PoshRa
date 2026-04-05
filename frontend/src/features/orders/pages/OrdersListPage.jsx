import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = {
  bg: "#FFFDF5",
  surface: "rgba(255,255,255,0.76)",
  soft: "#FBEF9C",
  softDeep: "#F7E467",
  primary: "#FEE32B",
  primaryDeep: "#E0C400",
  olive: "#877928",
  ink: "#201D18",
  muted: "#6E6657",
  border: "rgba(32,29,24,0.10)",
  white: "#FFFFFF",
};

const STATUS_COLORS = {
  pending: { bg: "#FEF9C3", text: "#854D0E" },
  processing: { bg: "#DBEAFE", text: "#1E40AF" },
  shipped: { bg: "#E0F2FE", text: "#0369A1" },
  delivered: { bg: "#DCFCE7", text: "#166534" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B" },
  returned: { bg: "#F3F4F6", text: "#374151" },
  paid: { bg: "#DCFCE7", text: "#166534" },
  failed: { bg: "#FEE2E2", text: "#991B1B" },
  refunded: { bg: "#F3F4F6", text: "#374151" },
};

const PAGE_CSS = `
  .orders-page-shell {
    position: relative;
    min-height: 100vh;
    overflow: hidden;
    background:
      radial-gradient(circle at top left, rgba(254, 227, 43, 0.28), transparent 32%),
      radial-gradient(circle at 90% 12%, rgba(135, 121, 40, 0.10), transparent 26%),
      linear-gradient(180deg, #FFFDF6 0%, #FFF9D9 54%, #FFFDF2 100%);
    color: ${COLORS.ink};
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  }

  .orders-page-shell * {
    box-sizing: border-box;
  }

  .orders-bg-orb {
    position: absolute;
    border-radius: 999px;
    filter: blur(24px);
    pointer-events: none;
    opacity: 0.7;
    animation: floatOrb 10s ease-in-out infinite;
  }

  .orders-bg-orb.orb-1 {
    width: 260px;
    height: 260px;
    top: -70px;
    left: -60px;
    background: rgba(254, 227, 43, 0.24);
  }

  .orders-bg-orb.orb-2 {
    width: 220px;
    height: 220px;
    right: -40px;
    top: 180px;
    background: rgba(135, 121, 40, 0.12);
    animation-delay: -2s;
  }

  .orders-bg-orb.orb-3 {
    width: 180px;
    height: 180px;
    left: 12%;
    bottom: 80px;
    background: rgba(254, 227, 43, 0.16);
    animation-delay: -4s;
  }

  .orders-page-inner {
    position: relative;
    z-index: 1;
    max-width: 1180px;
    margin: 0 auto;
    padding: 32px 16px 72px;
  }

  .reveal-up {
    animation: riseIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: var(--delay, 0ms);
  }

  .orders-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr);
    gap: 20px;
    align-items: stretch;
    margin-bottom: 26px;
  }

  .orders-hero-card,
  .orders-summary-card,
  .orders-card,
  .orders-state-card,
  .orders-loading-card {
    position: relative;
    overflow: hidden;
    border: 1px solid ${COLORS.border};
    border-radius: 24px;
    background: ${COLORS.surface};
    backdrop-filter: blur(14px);
    box-shadow:
      0 12px 40px rgba(32, 29, 24, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.45);
  }

  .orders-hero-card {
    padding: 28px 28px 24px;
    min-height: 180px;
  }

  .orders-hero-card::before,
  .orders-summary-card::before,
  .orders-card::before,
  .orders-state-card::before,
  .orders-loading-card::before {
    content: "";
    position: absolute;
    inset: 0 auto auto 0;
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg, rgba(255,255,255,0.65), rgba(255,255,255,0));
    pointer-events: none;
  }

  .orders-hero-accent {
    position: absolute;
    inset: auto -26px -26px auto;
    width: 180px;
    height: 180px;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(254,227,43,0.28) 0%, rgba(254,227,43,0) 70%);
    pointer-events: none;
  }

  .orders-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 999px;
    background: rgba(254, 227, 43, 0.30);
    color: ${COLORS.olive};
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .orders-eyebrow-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: ${COLORS.primary};
    box-shadow: 0 0 0 5px rgba(254, 227, 43, 0.16);
  }

  .orders-title {
    margin: 18px 0 10px;
    font-size: clamp(32px, 5vw, 48px);
    line-height: 1;
    letter-spacing: -0.04em;
    font-weight: 900;
  }

  .orders-subtitle {
    max-width: 720px;
    margin: 0;
    color: ${COLORS.muted};
    font-size: 15px;
    line-height: 1.7;
  }

  .orders-summary-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .orders-summary-card {
    padding: 18px 18px 16px;
    min-height: 92px;
  }

  .orders-summary-label {
    margin: 0 0 10px;
    color: ${COLORS.muted};
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .orders-summary-value {
    margin: 0;
    font-size: 26px;
    line-height: 1;
    font-weight: 900;
    letter-spacing: -0.03em;
    color: ${COLORS.ink};
  }

  .orders-summary-value.is-money {
    color: ${COLORS.olive};
    font-size: 22px;
  }

  .orders-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .order-link {
    display: block;
    text-decoration: none;
    color: inherit;
  }

  .order-link:focus-visible {
    outline: none;
  }

  .order-link:focus-visible .orders-card {
    transform: translateY(-3px);
    box-shadow:
      0 18px 48px rgba(32, 29, 24, 0.14),
      0 0 0 4px rgba(254, 227, 43, 0.22);
  }

  .orders-card {
    transition:
      transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
      box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1),
      border-color 0.35s ease,
      background 0.35s ease;
  }

  .orders-card:hover {
    transform: translateY(-6px);
    border-color: rgba(32, 29, 24, 0.16);
    box-shadow:
      0 22px 54px rgba(32, 29, 24, 0.14),
      0 0 0 1px rgba(255,255,255,0.38) inset;
    background: rgba(255,255,255,0.84);
  }

  .orders-card-glow {
    position: absolute;
    inset: auto -40px -50px auto;
    width: 170px;
    height: 170px;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(254,227,43,0.22) 0%, rgba(254,227,43,0) 72%);
    transition: transform 0.35s ease, opacity 0.35s ease;
    opacity: 0.8;
    pointer-events: none;
  }

  .orders-card:hover .orders-card-glow {
    transform: scale(1.06);
    opacity: 1;
  }

  .orders-card-topline {
    height: 4px;
    width: 100%;
    background: linear-gradient(90deg, ${COLORS.primary} 0%, rgba(254, 227, 43, 0.35) 55%, rgba(254, 227, 43, 0) 100%);
  }

  .orders-card-body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 16px;
    align-items: center;
    padding: 20px;
  }

  .orders-card-left {
    min-width: 0;
  }

  .orders-card-right {
    text-align: right;
    min-width: 170px;
  }

  .orders-card-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .order-id {
    margin: 0;
    font-size: 18px;
    font-weight: 900;
    color: ${COLORS.ink};
    letter-spacing: -0.02em;
  }

  .order-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 0 0 14px;
    color: ${COLORS.muted};
    font-size: 13px;
    line-height: 1.6;
  }

  .meta-dot {
    opacity: 0.55;
    font-weight: 700;
  }

  .badges-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 7px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
    text-transform: capitalize;
    letter-spacing: 0.01em;
    border: 1px solid rgba(0,0,0,0.04);
    white-space: nowrap;
  }

  .coupon-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    border-radius: 999px;
    background: rgba(22,163,74,0.10);
    color: #15803D;
    font-size: 12px;
    font-weight: 800;
    border: 1px solid rgba(22,163,74,0.12);
  }

  .coupon-chip::before {
    content: "✦";
    font-size: 10px;
    line-height: 1;
  }

  .order-amount {
    margin: 0 0 6px;
    font-size: 28px;
    line-height: 1;
    letter-spacing: -0.03em;
    font-weight: 900;
    color: ${COLORS.olive};
  }

  .discount-note {
    margin: 0 0 12px;
    color: #15803D;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.5;
  }

  .view-cta {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: ${COLORS.ink};
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.01em;
  }

  .cta-arrow {
    display: inline-block;
    transition: transform 0.28s ease;
  }

  .orders-card:hover .cta-arrow {
    transform: translateX(4px);
  }

  .orders-state-card {
    padding: 36px 28px;
    text-align: center;
  }

  .state-emoji {
    font-size: 56px;
    line-height: 1;
    margin-bottom: 16px;
    animation: floatY 3s ease-in-out infinite;
  }

  .state-title {
    margin: 0 0 8px;
    font-size: 26px;
    font-weight: 900;
    letter-spacing: -0.03em;
    color: ${COLORS.ink};
  }

  .state-text {
    max-width: 540px;
    margin: 0 auto 22px;
    color: ${COLORS.muted};
    font-size: 14px;
    line-height: 1.75;
  }

  .primary-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 48px;
    padding: 0 20px;
    border-radius: 14px;
    border: 1px solid rgba(32,29,24,0.10);
    background: linear-gradient(180deg, ${COLORS.primary} 0%, ${COLORS.softDeep} 100%);
    color: ${COLORS.ink};
    font-size: 14px;
    font-weight: 900;
    text-decoration: none;
    box-shadow: 0 10px 24px rgba(254,227,43,0.20);
    transition:
      transform 0.25s ease,
      box-shadow 0.25s ease,
      filter 0.25s ease;
  }

  .primary-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 28px rgba(254,227,43,0.28);
    filter: saturate(1.04);
  }

  .primary-btn:focus-visible {
    outline: none;
    box-shadow:
      0 14px 28px rgba(254,227,43,0.28),
      0 0 0 4px rgba(254,227,43,0.22);
  }

  .error-card {
    background:
      linear-gradient(180deg, rgba(255,255,255,0.84), rgba(255,255,255,0.72)),
      linear-gradient(0deg, rgba(239,68,68,0.05), rgba(239,68,68,0.05));
    text-align: left;
  }

  .error-text {
    margin: 0;
    color: #991B1B;
    font-size: 14px;
    font-weight: 800;
    line-height: 1.7;
  }

  .loading-wrap {
    position: relative;
    z-index: 1;
    max-width: 1180px;
    margin: 0 auto;
    padding: 40px 16px 72px;
  }

  .loading-top {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 0.75fr);
    gap: 20px;
    margin-bottom: 26px;
  }

  .loading-hero {
    padding: 28px;
  }

  .loading-badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 999px;
    background: rgba(254,227,43,0.24);
    color: ${COLORS.olive};
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 18px;
  }

  .loading-badge::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: ${COLORS.primary};
    box-shadow: 0 0 0 4px rgba(254, 227, 43, 0.16);
  }

  .loading-icon {
    font-size: 46px;
    line-height: 1;
    margin-bottom: 16px;
    animation: floatY 3s ease-in-out infinite;
  }

  .skeleton {
    position: relative;
    overflow: hidden;
    background: linear-gradient(90deg, rgba(32,29,24,0.08), rgba(32,29,24,0.04), rgba(32,29,24,0.08));
    border-radius: 12px;
  }

  .skeleton::after {
    content: "";
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
    animation: shimmer 1.5s ease infinite;
  }

  .loading-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .orders-loading-card {
    padding: 20px;
  }

  .orders-loading-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 170px;
    gap: 16px;
    align-items: center;
  }

  @keyframes shimmer {
    100% {
      transform: translateX(100%);
    }
  }

  @keyframes riseIn {
    from {
      opacity: 0;
      transform: translateY(18px) scale(0.985);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes floatOrb {
    0%, 100% {
      transform: translate3d(0, 0, 0);
    }
    50% {
      transform: translate3d(0, -14px, 0);
    }
  }

  @keyframes floatY {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-6px);
    }
  }

  @media (max-width: 980px) {
    .orders-hero,
    .loading-top {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .orders-page-inner,
    .loading-wrap {
      padding-top: 24px;
      padding-bottom: 54px;
    }

    .orders-hero-card,
    .orders-summary-card,
    .orders-state-card,
    .orders-loading-card {
      border-radius: 20px;
    }

    .orders-summary-grid {
      grid-template-columns: 1fr;
    }

    .orders-card-body,
    .orders-loading-grid {
      grid-template-columns: 1fr;
    }

    .orders-card-right {
      min-width: 0;
      text-align: left;
      padding-top: 2px;
    }

    .order-amount {
      font-size: 24px;
    }

    .orders-title {
      font-size: 34px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .orders-bg-orb,
    .state-emoji,
    .loading-icon,
    .reveal-up,
    .skeleton::after,
    .cta-arrow {
      animation: none !important;
      transition: none !important;
      transform: none !important;
    }

    .orders-card:hover,
    .primary-btn:hover {
      transform: none !important;
    }
  }
`;

function formatDate(value) {
  if (!value) return "Date unavailable";
  return new Date(value).toLocaleDateString("en-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-BD");
}

function Card({ children, className = "", style }) {
  return (
    <div className={`orders-card ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || "unknown").toLowerCase();
  const s = STATUS_COLORS[normalized] || {
    bg: "rgba(254,227,43,0.24)",
    text: COLORS.olive,
  };

  return (
    <span
      className="status-badge"
      style={{
        background: s.bg,
        color: s.text,
      }}
    >
      {normalized}
    </span>
  );
}

function SummaryCard({ label, value, money = false, delay = 0 }) {
  return (
    <div
      className="orders-summary-card reveal-up"
      style={{ "--delay": `${delay}ms` }}
    >
      <p className="orders-summary-label">{label}</p>
      <p className={`orders-summary-value ${money ? "is-money" : ""}`}>{value}</p>
    </div>
  );
}

function LoadingSkeletonCard({ delay = 0 }) {
  return (
    <div
      className="orders-loading-card reveal-up"
      style={{ "--delay": `${delay}ms` }}
    >
      <div className="orders-loading-grid">
        <div>
          <div className="skeleton" style={{ width: "180px", height: 18, marginBottom: 10 }} />
          <div className="skeleton" style={{ width: "220px", height: 12, marginBottom: 14 }} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div className="skeleton" style={{ width: 88, height: 30, borderRadius: 999 }} />
            <div className="skeleton" style={{ width: 78, height: 30, borderRadius: 999 }} />
          </div>
        </div>
        <div>
          <div className="skeleton" style={{ width: "100%", maxWidth: 120, height: 24, marginBottom: 10, marginLeft: "auto" }} />
          <div className="skeleton" style={{ width: "100%", maxWidth: 130, height: 12, marginBottom: 10, marginLeft: "auto" }} />
          <div className="skeleton" style={{ width: "100%", maxWidth: 92, height: 12, marginLeft: "auto" }} />
        </div>
      </div>
    </div>
  );
}

export default function OrdersListPage() {
  const { accessToken } = useAuth();

  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/orders", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to load orders");
        }

        if (isMounted) {
          setOrders(data.data || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load orders");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (!accessToken) {
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  const summary = React.useMemo(() => {
    const totalOrders = orders.length;
    const activeOrders = orders.filter((order) => {
      const status = String(order.order_status || "").toLowerCase();
      return !["delivered", "cancelled", "returned"].includes(status);
    }).length;

    const totalSpent = orders.reduce(
      (sum, order) => sum + Number(order.total_amount || 0),
      0
    );

    return {
      totalOrders,
      activeOrders,
      totalSpent,
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="orders-page-shell">
        <style>{PAGE_CSS}</style>

        <div className="orders-bg-orb orb-1" />
        <div className="orders-bg-orb orb-2" />
        <div className="orders-bg-orb orb-3" />

        <div className="loading-wrap">
          <div className="loading-top">
            <div className="orders-loading-card loading-hero reveal-up">
              <div className="loading-badge">Fetching latest orders</div>
              <div className="loading-icon">📦</div>
              <div className="skeleton" style={{ width: "44%", minWidth: 210, height: 38, marginBottom: 14 }} />
              <div className="skeleton" style={{ width: "86%", height: 14, marginBottom: 10 }} />
              <div className="skeleton" style={{ width: "74%", height: 14 }} />
            </div>

            <div className="orders-summary-grid">
              <div className="orders-summary-card reveal-up" style={{ "--delay": "60ms" }}>
                <div className="skeleton" style={{ width: "56%", height: 12, marginBottom: 14 }} />
                <div className="skeleton" style={{ width: "48%", height: 28 }} />
              </div>
              <div className="orders-summary-card reveal-up" style={{ "--delay": "120ms" }}>
                <div className="skeleton" style={{ width: "48%", height: 12, marginBottom: 14 }} />
                <div className="skeleton" style={{ width: "40%", height: 28 }} />
              </div>
              <div className="orders-summary-card reveal-up" style={{ "--delay": "180ms" }}>
                <div className="skeleton" style={{ width: "44%", height: 12, marginBottom: 14 }} />
                <div className="skeleton" style={{ width: "60%", height: 28 }} />
              </div>
            </div>
          </div>

          <div className="loading-list">
            <LoadingSkeletonCard delay={120} />
            <LoadingSkeletonCard delay={180} />
            <LoadingSkeletonCard delay={240} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page-shell">
      <style>{PAGE_CSS}</style>

      <div className="orders-bg-orb orb-1" />
      <div className="orders-bg-orb orb-2" />
      <div className="orders-bg-orb orb-3" />

      <div className="orders-page-inner">
        <section className="orders-hero">
          <div className="orders-hero-card reveal-up" style={{ "--delay": "0ms" }}>
            <div className="orders-hero-accent" />
            <span className="orders-eyebrow">
              <span className="orders-eyebrow-dot" />
              Order dashboard
            </span>

            <h1 className="orders-title">My orders</h1>

            <p className="orders-subtitle">
              Track every purchase, payment, and delivery update in one clean,
              premium, and responsive experience.
            </p>
          </div>

          <div className="orders-summary-grid">
            <SummaryCard label="Total orders" value={summary.totalOrders} delay={80} />
            <SummaryCard label="Active orders" value={summary.activeOrders} delay={140} />
            <SummaryCard
              label="Total spent"
              value={`৳${formatMoney(summary.totalSpent)}`}
              money
              delay={200}
            />
          </div>
        </section>

        {error && (
          <div className="orders-state-card error-card reveal-up" style={{ "--delay": "60ms", marginBottom: 18 }}>
            <p className="error-text">{error}</p>
          </div>
        )}

        {!error && orders.length === 0 ? (
          <div className="orders-state-card reveal-up" style={{ "--delay": "80ms" }}>
            <div className="state-emoji">🛍️</div>
            <h2 className="state-title">No orders yet</h2>
            <p className="state-text">
              Your order history will appear here once you start shopping. Browse
              products and place your first order to see delivery and payment details.
            </p>

            <Link to="/" className="primary-btn">
              Start shopping <span className="cta-arrow">→</span>
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order, index) => (
              <Link
                key={order.order_id}
                to={`/orders/${order.order_id}`}
                className="order-link reveal-up"
                style={{ "--delay": `${120 + index * 70}ms` }}
              >
                <Card>
                  <div className="orders-card-glow" />
                  <div className="orders-card-topline" />

                  <div className="orders-card-body">
                    <div className="orders-card-left">
                      <div className="orders-card-head">
                        <p className="order-id">Order #{order.order_id}</p>

                        {order.coupon_code && (
                          <span className="coupon-chip">{order.coupon_code}</span>
                        )}
                      </div>

                      <p className="order-meta">
                        <span>{formatDate(order.created_at)}</span>
                        <span className="meta-dot">•</span>
                        <span>
                          {order.item_count} item{order.item_count !== 1 ? "s" : ""}
                        </span>
                      </p>

                      <div className="badges-row">
                        <StatusBadge status={order.order_status} />
                        <StatusBadge status={order.payment_status} />
                      </div>
                    </div>

                    <div className="orders-card-right">
                      <p className="order-amount">
                        ৳{formatMoney(order.total_amount)}
                      </p>

                      {order.coupon_code && (
                        <p className="discount-note">
                          {order.coupon_code} applied → -৳
                          {formatMoney(order.coupon_amount || 0)}
                        </p>
                      )}

                      <span className="view-cta">
                        View details <span className="cta-arrow">→</span>
                      </span>
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