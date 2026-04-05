import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = {
  pageBg: "#fbfbf7",
  panel: "rgba(255,255,255,0.72)",
  panelSolid: "#ffffff",
  soft: "#fff7bf",
  primary: "#fee32b",
  primaryDeep: "#e0c500",
  olive: "#877928",
  oliveDeep: "#5e5420",
  ink: "#181712",
  inkSoft: "#5e5748",
  border: "rgba(24,23,18,0.10)",
  borderStrong: "rgba(24,23,18,0.14)",
  success: "#166534",
  danger: "#dc2626",
};

const STATUS_COLORS = {
  requested: { bg: "#FEF9C3", text: "#854D0E", ring: "rgba(133,77,14,0.16)" },
  approved: { bg: "#DBEAFE", text: "#1E40AF", ring: "rgba(30,64,175,0.14)" },
  rejected: { bg: "#FEE2E2", text: "#991B1B", ring: "rgba(153,27,27,0.12)" },
  completed: { bg: "#DCFCE7", text: "#166534", ring: "rgba(22,101,52,0.12)" },
};

const RETURN_REASONS = [
  "Item is defective or damaged",
  "Wrong item received",
  "Item not as described",
  "Item arrived too late",
  "Changed my mind",
  "Other",
];

const APP_STYLES = `
  :root {
    color-scheme: light;
  }

  * {
    box-sizing: border-box;
  }

  .rr-page {
    min-height: 100vh;
    position: relative;
    overflow: hidden;
    background:
      radial-gradient(circle at top left, rgba(254, 227, 43, 0.18), transparent 28%),
      radial-gradient(circle at 90% 10%, rgba(135, 121, 40, 0.10), transparent 22%),
      linear-gradient(180deg, #fffef8 0%, #fbfbf7 48%, #f7f6f0 100%);
    color: ${COLORS.ink};
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .rr-orb,
  .rr-grid,
  .rr-noise {
    pointer-events: none;
    position: absolute;
    inset: 0;
  }

  .rr-grid {
    background-image:
      linear-gradient(rgba(24, 23, 18, 0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(24, 23, 18, 0.035) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: linear-gradient(180deg, rgba(0,0,0,0.55), transparent 95%);
    opacity: 0.45;
  }

  .rr-noise {
    opacity: 0.06;
    background-image: radial-gradient(rgba(24,23,18,0.8) 0.6px, transparent 0.6px);
    background-size: 10px 10px;
  }

  .rr-orb::before,
  .rr-orb::after {
    content: "";
    position: absolute;
    border-radius: 999px;
    filter: blur(20px);
    animation: rrFloat 14s ease-in-out infinite;
  }

  .rr-orb::before {
    width: 320px;
    height: 320px;
    background: radial-gradient(circle, rgba(254,227,43,0.22) 0%, rgba(254,227,43,0.08) 48%, transparent 72%);
    top: -80px;
    left: -60px;
  }

  .rr-orb::after {
    width: 280px;
    height: 280px;
    background: radial-gradient(circle, rgba(135,121,40,0.18) 0%, rgba(135,121,40,0.06) 44%, transparent 70%);
    right: -80px;
    top: 120px;
    animation-delay: -5s;
  }

  .rr-shell {
    position: relative;
    z-index: 1;
    width: min(100%, 780px);
    margin: 0 auto;
    padding: 34px 18px 72px;
  }

  .rr-back-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: ${COLORS.oliveDeep};
    font-size: 13px;
    font-weight: 800;
    text-decoration: none;
    letter-spacing: 0.02em;
    margin-bottom: 14px;
    transition: transform 180ms ease, color 180ms ease;
  }

  .rr-back-link:hover {
    color: ${COLORS.ink};
    transform: translateX(-2px);
  }

  .rr-header {
    margin-bottom: 24px;
    animation: rrFadeUp 700ms cubic-bezier(.2,.8,.2,1) both;
  }

  .rr-kicker {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 999px;
    background: rgba(255,255,255,0.66);
    border: 1px solid rgba(24,23,18,0.08);
    backdrop-filter: blur(12px);
    color: ${COLORS.oliveDeep};
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    box-shadow: 0 10px 32px rgba(24,23,18,0.06);
  }

  .rr-title {
    margin: 14px 0 8px;
    font-size: clamp(30px, 4vw, 42px);
    line-height: 1.04;
    font-weight: 900;
    letter-spacing: -0.04em;
    color: ${COLORS.ink};
  }

  .rr-subtitle {
    margin: 0;
    font-size: 15px;
    line-height: 1.75;
    color: ${COLORS.inkSoft};
    max-width: 56ch;
  }

  .rr-card {
    position: relative;
    border-radius: 28px;
    padding: 26px;
    background: ${COLORS.panel};
    border: 1px solid rgba(255,255,255,0.85);
    box-shadow:
      0 28px 70px rgba(24,23,18,0.08),
      inset 0 1px 0 rgba(255,255,255,0.72);
    backdrop-filter: blur(18px);
    overflow: hidden;
    animation: rrFadeUp 760ms cubic-bezier(.2,.8,.2,1) both;
  }

  .rr-card::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(254,227,43,0.18), transparent 26%, transparent 70%, rgba(135,121,40,0.07));
    pointer-events: none;
  }

  .rr-card::after {
    content: "";
    position: absolute;
    inset: 1px;
    border-radius: 27px;
    border: 1px solid rgba(24,23,18,0.06);
    pointer-events: none;
  }

  .rr-section + .rr-section {
    margin-top: 18px;
  }

  .rr-item-card,
  .rr-existing-card,
  .rr-policy-card,
  .rr-error,
  .rr-success-note {
    position: relative;
    z-index: 1;
  }

  .rr-item-card {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 16px 18px;
    border-radius: 20px;
    background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,247,191,0.64));
    border: 1px solid rgba(24,23,18,0.08);
    box-shadow: 0 12px 30px rgba(24,23,18,0.06);
  }

  .rr-item-icon {
    flex-shrink: 0;
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    background: linear-gradient(180deg, rgba(254,227,43,0.34), rgba(254,227,43,0.16));
    color: ${COLORS.oliveDeep};
    font-size: 20px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.7);
  }

  .rr-item-title {
    margin: 0 0 4px;
    font-size: 15px;
    font-weight: 900;
    color: ${COLORS.ink};
  }

  .rr-item-meta {
    margin: 0;
    font-size: 12.5px;
    line-height: 1.7;
    color: ${COLORS.inkSoft};
  }

  .rr-existing-card {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
    padding: 16px 18px;
    border-radius: 20px;
    background: rgba(255,255,255,0.74);
    border: 1px solid rgba(24,23,18,0.08);
  }

  .rr-existing-title {
    margin: 0 0 6px;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${COLORS.oliveDeep};
  }

  .rr-existing-text {
    margin: 0;
    color: ${COLORS.inkSoft};
    font-size: 13px;
    line-height: 1.7;
  }

  .rr-status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 7px 12px;
    border-radius: 999px;
    font-size: 11px;
    line-height: 1;
    font-weight: 900;
    text-transform: capitalize;
    letter-spacing: 0.05em;
    white-space: nowrap;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.7);
  }

  .rr-heading-row {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;
  }

  .rr-heading {
    margin: 0;
    font-size: 12px;
    font-weight: 900;
    color: ${COLORS.oliveDeep};
    text-transform: uppercase;
    letter-spacing: 0.18em;
  }

  .rr-heading-copy {
    margin: 0 0 4px;
    font-size: 18px;
    font-weight: 900;
    color: ${COLORS.ink};
  }

  .rr-heading-subcopy {
    margin: 0;
    color: ${COLORS.inkSoft};
    font-size: 13px;
    line-height: 1.7;
  }

  .rr-options {
    position: relative;
    z-index: 1;
    display: grid;
    gap: 12px;
  }

  .rr-option {
    --option-border: rgba(24,23,18,0.10);
    --option-bg: rgba(255,255,255,0.84);
    --option-shadow: 0 14px 34px rgba(24,23,18,0.04);
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    padding: 14px 16px;
    border-radius: 18px;
    border: 1px solid var(--option-border);
    background: var(--option-bg);
    box-shadow: var(--option-shadow);
    cursor: pointer;
    transition:
      transform 220ms ease,
      border-color 220ms ease,
      background 220ms ease,
      box-shadow 220ms ease;
    animation: rrFadeUp 680ms cubic-bezier(.2,.8,.2,1) both;
  }

  .rr-option:hover {
    transform: translateY(-2px);
    border-color: rgba(24,23,18,0.16);
    box-shadow: 0 18px 38px rgba(24,23,18,0.08);
  }

  .rr-option.active {
    --option-border: rgba(254,227,43,0.98);
    --option-bg: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(254,227,43,0.16));
    --option-shadow:
      0 22px 48px rgba(24,23,18,0.10),
      0 0 0 4px rgba(254,227,43,0.16);
  }

  .rr-radio-shell {
    position: relative;
    width: 22px;
    height: 22px;
    flex-shrink: 0;
  }

  .rr-radio {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }

  .rr-radio-visual {
    width: 22px;
    height: 22px;
    border-radius: 999px;
    border: 1.5px solid rgba(24,23,18,0.22);
    background: white;
    display: grid;
    place-items: center;
    transition: border-color 180ms ease, transform 180ms ease, background 180ms ease;
  }

  .rr-radio-visual::after {
    content: "";
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: ${COLORS.primary};
    transform: scale(0);
    transition: transform 220ms cubic-bezier(.2,.8,.2,1);
    box-shadow: 0 0 0 6px rgba(254,227,43,0.16);
  }

  .rr-option.active .rr-radio-visual {
    border-color: ${COLORS.primaryDeep};
    background: rgba(255,255,255,0.92);
    transform: scale(1.04);
  }

  .rr-option.active .rr-radio-visual::after {
    transform: scale(1);
  }

  .rr-option-copy {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .rr-option-title {
    font-size: 14px;
    font-weight: 800;
    color: ${COLORS.ink};
    line-height: 1.45;
  }

  .rr-option-subtitle {
    font-size: 12px;
    color: ${COLORS.inkSoft};
    line-height: 1.55;
  }

  .rr-textarea-wrap {
    position: relative;
    z-index: 1;
    animation: rrExpand 340ms cubic-bezier(.2,.8,.2,1) both;
  }

  .rr-textarea {
    width: 100%;
    min-height: 124px;
    border-radius: 18px;
    border: 1px solid rgba(24,23,18,0.12);
    background: rgba(255,255,255,0.86);
    padding: 14px 16px;
    font-size: 14px;
    line-height: 1.7;
    color: ${COLORS.ink};
    resize: vertical;
    outline: none;
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.7);
    transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
  }

  .rr-textarea:focus {
    border-color: rgba(254,227,43,1);
    box-shadow: 0 0 0 4px rgba(254,227,43,0.16);
  }

  .rr-policy-card {
    padding: 14px 16px;
    border-radius: 18px;
    background: linear-gradient(180deg, rgba(239,246,255,0.96), rgba(219,234,254,0.88));
    border: 1px solid rgba(147,197,253,0.55);
    box-shadow: 0 14px 34px rgba(30,64,175,0.08);
  }

  .rr-policy-title {
    margin: 0 0 6px;
    color: #1E3A8A;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .rr-policy-text {
    margin: 0;
    font-size: 12.5px;
    line-height: 1.7;
    color: #1E40AF;
  }

  .rr-error {
    padding: 12px 14px;
    border-radius: 16px;
    background: rgba(254,226,226,0.95);
    border: 1px solid rgba(248,113,113,0.35);
    color: #991B1B;
    font-size: 13px;
    font-weight: 800;
    box-shadow: 0 10px 24px rgba(153,27,27,0.08);
    animation: rrShakeIn 360ms ease both;
  }

  .rr-actions {
    position: relative;
    z-index: 1;
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }

  .rr-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 16px;
    border: none;
    text-decoration: none;
    font-size: 14px;
    font-weight: 900;
    line-height: 1;
    transition: transform 180ms ease, box-shadow 180ms ease, opacity 180ms ease, border-color 180ms ease, color 180ms ease;
    overflow: hidden;
    white-space: nowrap;
  }

  .rr-btn::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: -120%;
    width: 120%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
    transform: skewX(-18deg);
    transition: left 520ms ease;
  }

  .rr-btn:hover::before {
    left: 120%;
  }

  .rr-btn:hover {
    transform: translateY(-1px);
  }

  .rr-btn:active {
    transform: translateY(0);
  }

  .rr-btn-primary {
    flex: 1;
    min-height: 54px;
    padding: 14px 18px;
    background: linear-gradient(180deg, #fff06a 0%, ${COLORS.primary} 100%);
    color: ${COLORS.ink};
    box-shadow: 0 18px 36px rgba(254,227,43,0.34);
  }

  .rr-btn-primary:disabled {
    background: rgba(24,23,18,0.08);
    color: rgba(94,87,72,0.92);
    box-shadow: none;
    cursor: not-allowed;
  }

  .rr-btn-secondary {
    min-height: 54px;
    padding: 14px 18px;
    border: 1px solid rgba(24,23,18,0.16);
    background: rgba(255,255,255,0.68);
    color: ${COLORS.oliveDeep};
    box-shadow: 0 12px 30px rgba(24,23,18,0.05);
  }

  .rr-success {
    text-align: center;
    padding: 46px 28px;
  }

  .rr-success-check {
    width: 88px;
    height: 88px;
    margin: 0 auto 20px;
    border-radius: 28px;
    display: grid;
    place-items: center;
    font-size: 40px;
    background: linear-gradient(180deg, rgba(220,252,231,0.96), rgba(187,247,208,0.88));
    box-shadow:
      0 22px 44px rgba(22,101,52,0.14),
      inset 0 1px 0 rgba(255,255,255,0.72);
    animation: rrPop 620ms cubic-bezier(.2,.8,.2,1) both;
  }

  .rr-success-title {
    margin: 0 0 10px;
    font-size: clamp(24px, 4vw, 30px);
    line-height: 1.12;
    font-weight: 900;
    color: ${COLORS.ink};
    letter-spacing: -0.03em;
  }

  .rr-success-text {
    max-width: 44ch;
    margin: 0 auto 26px;
    color: ${COLORS.inkSoft};
    font-size: 14px;
    line-height: 1.8;
  }

  .rr-success-note {
    margin-top: 14px;
    font-size: 12px;
    color: ${COLORS.olive};
    letter-spacing: 0.02em;
  }

  .rr-loading {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 24px;
  }

  .rr-loading-card {
    width: min(100%, 620px);
    border-radius: 28px;
    padding: 30px;
    background: rgba(255,255,255,0.70);
    border: 1px solid rgba(255,255,255,0.88);
    backdrop-filter: blur(18px);
    box-shadow: 0 24px 60px rgba(24,23,18,0.08);
  }

  .rr-skeleton,
  .rr-skeleton-sm,
  .rr-skeleton-lg {
    position: relative;
    overflow: hidden;
    border-radius: 14px;
    background: linear-gradient(90deg, rgba(24,23,18,0.06), rgba(24,23,18,0.10), rgba(24,23,18,0.06));
    background-size: 200% 100%;
    animation: rrShimmer 1.4s linear infinite;
  }

  .rr-skeleton-lg { height: 26px; width: 48%; margin-bottom: 18px; }
  .rr-skeleton-sm { height: 16px; width: 70%; margin-bottom: 22px; }
  .rr-skeleton { height: 72px; width: 100%; margin-top: 12px; border-radius: 18px; }

  @media (max-width: 640px) {
    .rr-shell {
      padding: 22px 14px 56px;
    }

    .rr-card {
      padding: 18px;
      border-radius: 22px;
    }

    .rr-existing-card,
    .rr-actions {
      flex-direction: column;
    }

    .rr-btn,
    .rr-btn-primary,
    .rr-btn-secondary {
      width: 100%;
    }

    .rr-title {
      font-size: 28px;
    }

    .rr-success {
      padding: 34px 12px;
    }
  }

  @keyframes rrFloat {
    0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
    50% { transform: translate3d(18px, 26px, 0) scale(1.05); }
  }

  @keyframes rrFadeUp {
    from {
      opacity: 0;
      transform: translateY(22px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes rrExpand {
    from {
      opacity: 0;
      transform: translateY(-8px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes rrPop {
    0% {
      opacity: 0;
      transform: scale(0.7) rotate(-10deg);
    }
    65% {
      opacity: 1;
      transform: scale(1.08) rotate(0deg);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes rrShakeIn {
    0% { opacity: 0; transform: translateY(8px); }
    25% { transform: translateX(-4px); }
    50% { transform: translateX(4px); }
    75% { transform: translateX(-2px); }
    100% { opacity: 1; transform: translateX(0); }
  }

  @keyframes rrShimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-BD")}`;
}

function Card({ children, className = "", style }) {
  return (
    <section className={`rr-card ${className}`.trim()} style={style}>
      {children}
    </section>
  );
}

function StatusBadge({ status }) {
  const key = String(status || "requested").toLowerCase();
  const palette = STATUS_COLORS[key] || {
    bg: COLORS.soft,
    text: COLORS.oliveDeep,
    ring: "rgba(135,121,40,0.18)",
  };

  return (
    <span
      className="rr-status"
      style={{
        background: palette.bg,
        color: palette.text,
        boxShadow: `0 0 0 1px ${palette.ring}`,
      }}
    >
      {status || "requested"}
    </span>
  );
}

function LoadingScreen() {
  return (
    <div className="rr-page rr-loading">
      <style>{APP_STYLES}</style>
      <div className="rr-orb" />
      <div className="rr-grid" />
      <div className="rr-noise" />

      <div className="rr-loading-card">
        <div className="rr-skeleton-lg" />
        <div className="rr-skeleton-sm" />
        <div className="rr-skeleton" />
        <div className="rr-skeleton" />
        <div className="rr-skeleton" />
      </div>
    </div>
  );
}

function ReasonOption({ reason, active, onChange, index }) {
  const helperText =
    reason === "Other"
      ? "Write your own details so the support team can review it faster."
      : "Select this if it best matches the issue with your order item.";

  return (
    <label
      className={`rr-option ${active ? "active" : ""}`.trim()}
      style={{ animationDelay: `${120 + index * 60}ms` }}
    >
      <span className="rr-radio-shell" aria-hidden="true">
        <input
          className="rr-radio"
          type="radio"
          name="reason"
          value={reason}
          checked={active}
          onChange={onChange}
        />
        <span className="rr-radio-visual" />
      </span>

      <span className="rr-option-copy">
        <span className="rr-option-title">{reason}</span>
        <span className="rr-option-subtitle">{helperText}</span>
      </span>
    </label>
  );
}

export default function ReturnRequestPage() {
  const { order_item_id } = useParams();
  const { fetchWithAuth } = useAuth();
  const navigate = useNavigate();

  const [itemInfo, setItemInfo] = React.useState(null);
  const [existingReturn, setExistingReturn] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [selectedReason, setSelectedReason] = React.useState("");
  const [customReason, setCustomReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const res = await fetchWithAuth(`/api/orders/items/${order_item_id}/returns`);

        if (!isMounted) return;

        if (res?.existing) {
          setExistingReturn(res.existing);
        }

        setItemInfo(res?.item || null);
      } catch (err) {
        if (isMounted) {
          setItemInfo(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [fetchWithAuth, order_item_id]);

  React.useEffect(() => {
    if (!submitted) return undefined;

    const timer = window.setTimeout(() => {
      navigate("/orders");
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [submitted, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const reason = selectedReason === "Other" ? customReason.trim() : selectedReason;

    if (!reason) {
      setError("Please select or enter a reason.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await fetchWithAuth(`/api/orders/items/${order_item_id}/returns`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });

      setSubmitted(true);
    } catch (err) {
      setError(err?.message || "Failed to submit return request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="rr-page">
      <style>{APP_STYLES}</style>
      <div className="rr-orb" />
      <div className="rr-grid" />
      <div className="rr-noise" />

      <div className="rr-shell">
        <Link to="/orders" className="rr-back-link">
          <span aria-hidden="true">←</span>
          <span>My orders</span>
        </Link>

        <header className="rr-header">
          <div className="rr-kicker">
            <span>Premium returns</span>
          </div>
          <h1 className="rr-title">Request a return</h1>
          <p className="rr-subtitle">
            Submit your request with a clear reason and we will review it as quickly as possible without interrupting your order flow.
          </p>
        </header>

        {submitted ? (
          <Card className="rr-success">
            <div className="rr-success-check" aria-hidden="true">✓</div>
            <h2 className="rr-success-title">Return request submitted</h2>
            <p className="rr-success-text">
              Your return request has been received successfully. Our team will review it and get back to you within 2–3 business days.
            </p>

            <div className="rr-actions" style={{ justifyContent: "center" }}>
              <Link to="/orders" className="rr-btn rr-btn-primary">
                My orders
              </Link>
              <Link to="/" className="rr-btn rr-btn-secondary">
                Continue shopping
              </Link>
            </div>

            <p className="rr-success-note">Redirecting you to your orders automatically…</p>
          </Card>
        ) : (
          <Card>
            {itemInfo && (
              <div className="rr-section rr-item-card">
                <div className="rr-item-icon" aria-hidden="true">↩</div>
                <div>
                  <p className="rr-item-title">{itemInfo.product_name}</p>
                  <p className="rr-item-meta">
                    SKU: {itemInfo.sku || "—"} · Qty: {itemInfo.quantity || 0} · {formatCurrency(Number(itemInfo.price || 0) * Number(itemInfo.quantity || 0))}
                  </p>
                </div>
              </div>
            )}

            {existingReturn && (
              <div className="rr-section rr-existing-card">
                <div>
                  <p className="rr-existing-title">Existing return request</p>
                  <p className="rr-existing-text">
                    We already found a return request for this order item.
                    {existingReturn.reason ? ` Reason: ${existingReturn.reason}.` : ""}
                    {existingReturn.created_at ? ` Submitted: ${existingReturn.created_at}.` : ""}
                  </p>
                </div>
                <StatusBadge status={existingReturn.status || "requested"} />
              </div>
            )}

            <div className="rr-section rr-heading-row">
              <div>
                <p className="rr-heading">Return details</p>
                <p className="rr-heading-copy">Why are you returning this item?</p>
                <p className="rr-heading-subcopy">
                  Choose the closest reason below. A precise explanation helps speed up approval.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
              <div className="rr-options">
                {RETURN_REASONS.map((reason, index) => (
                  <ReasonOption
                    key={reason}
                    reason={reason}
                    index={index}
                    active={selectedReason === reason}
                    onChange={() => {
                      setSelectedReason(reason);
                      setError("");
                      if (reason !== "Other") {
                        setCustomReason("");
                      }
                    }}
                  />
                ))}
              </div>

              {selectedReason === "Other" && (
                <div className="rr-textarea-wrap">
                  <textarea
                    className="rr-textarea"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Please describe the issue in a few clear sentences..."
                    rows={4}
                  />
                </div>
              )}

              <div className="rr-policy-card">
                <p className="rr-policy-title">Return policy</p>
                <p className="rr-policy-text">
                  Returns are accepted within 30 days of delivery. Items must be unused and in original packaging. Refunds are processed within 5–7 business days after approval.
                </p>
              </div>

              {error ? <div className="rr-error">{error}</div> : null}

              <div className="rr-actions">
                <button
                  type="submit"
                  className="rr-btn rr-btn-primary"
                  disabled={submitting || !selectedReason}
                >
                  {submitting ? "Submitting..." : "Submit return request"}
                </button>

                <Link to="/orders" className="rr-btn rr-btn-secondary">
                  Cancel
                </Link>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}