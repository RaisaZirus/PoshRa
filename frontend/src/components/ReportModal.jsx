// =============================================================
// FILE: src/components/ReportModal.jsx
//
// Premium animated modal to let any logged-in user report a
// product, review, or seller.
//
// Usage:
//   <ReportModal
//     entityType="product"        // "product" | "review" | "seller"
//     entityId={product_id}
//     entityLabel="Red Shirt"
//     onClose={() => setOpen(false)}
//   />
// =============================================================

import React from "react";
import { useAuth } from "../auth/useAuth.jsx";
import { useNavigate } from "react-router-dom";

const C = {
  bg: "#F8F8F4",
  panel: "rgba(255,255,255,0.82)",
  soft: "#FFF5AE",
  primary: "#FEE32B",
  primaryDeep: "#F6D90E",
  olive: "#877928",
  ink: "#181611",
  muted: "#6D6558",
  line: "rgba(24,22,17,0.10)",
  lineStrong: "rgba(24,22,17,0.16)",
  dangerBg: "#FEF2F2",
  dangerText: "#B42318",
  successBg: "#ECFDF3",
  successText: "#027A48",
};

const REASON_PRESETS = {
  product: [
    "Counterfeit / fake product",
    "Misleading product description",
    "Inappropriate or offensive content",
    "Dangerous or unsafe item",
    "Duplicate listing",
    "Other",
  ],
  review: [
    "Fake or paid review",
    "Offensive or abusive language",
    "Spam or irrelevant content",
    "Contains personal information",
    "Other",
  ],
  seller: [
    "Fraudulent seller",
    "Selling prohibited items",
    "Harassment or abusive behaviour",
    "Impersonation",
    "Other",
  ],
};

export default function ReportModal({
  entityType,
  entityId,
  entityLabel,
  onClose,
}) {
  const { user, fetchWithAuth } = useAuth();
  const navigate = useNavigate();

  const [preset, setPreset] = React.useState("");
  const [custom, setCustom] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState("");
  const [isClosing, setIsClosing] = React.useState(false);

  const closeTimerRef = React.useRef(null);

  const presets = REASON_PRESETS[entityType] || REASON_PRESETS.product;
  const typeLabel = entityType?.charAt(0).toUpperCase() + entityType?.slice(1);
  const reason = preset === "Other" ? custom.trim() : preset;

  const closeWithAnimation = React.useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    closeTimerRef.current = setTimeout(() => {
      onClose?.();
    }, 220);
  }, [isClosing, onClose]);

  React.useEffect(() => {
    if (!user) {
      onClose?.();
      navigate("/auth/login");
    }
  }, [user, onClose, navigate]);

  React.useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !loading) {
        closeWithAnimation();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [closeWithAnimation, loading]);

  const handleSubmit = async () => {
    if (!reason || reason.length < 5) {
      setError("Please select a reason or describe the issue (min 5 characters).");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await fetchWithAuth("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          reason,
        }),
      });

      setSuccess(true);
    } catch (err) {
      setError(err?.message || "Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .report-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background:
            radial-gradient(circle at top right, rgba(254, 227, 43, 0.12), transparent 28%),
            radial-gradient(circle at bottom left, rgba(135, 121, 40, 0.10), transparent 24%),
            rgba(17, 15, 11, 0.58);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          animation: reportBackdropIn 220ms ease forwards;
        }

        .report-modal-backdrop.closing {
          animation: reportBackdropOut 220ms ease forwards;
        }

        .report-modal-card {
          position: relative;
          width: 100%;
          max-width: 560px;
          border-radius: 28px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.45);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.88), rgba(248,248,244,0.96)),
            ${C.panel};
          box-shadow:
            0 30px 80px rgba(0,0,0,0.22),
            0 8px 24px rgba(0,0,0,0.10),
            inset 0 1px 0 rgba(255,255,255,0.65);
          transform-origin: center;
          animation: reportModalIn 260ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        }

        .report-modal-card.closing {
          animation: reportModalOut 220ms ease forwards;
        }

        .report-modal-card::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at top right, rgba(254, 227, 43, 0.22), transparent 22%),
            radial-gradient(circle at 20% 0%, rgba(135, 121, 40, 0.10), transparent 28%);
        }

        .report-modal-header {
          position: relative;
          padding: 26px 26px 10px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .report-modal-body {
          position: relative;
          padding: 8px 26px 26px;
        }

        .report-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(254, 227, 43, 0.18);
          border: 1px solid rgba(24,22,17,0.08);
          color: ${C.olive};
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 14px;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }

        .report-badge-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: linear-gradient(135deg, ${C.primary}, ${C.primaryDeep});
          box-shadow: 0 0 0 4px rgba(254, 227, 43, 0.18);
        }

        .report-title {
          margin: 0;
          color: ${C.ink};
          font-size: clamp(22px, 2.6vw, 28px);
          line-height: 1.2;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .report-subtitle {
          margin: 10px 0 0;
          color: ${C.muted};
          font-size: 14px;
          line-height: 1.65;
          max-width: 430px;
        }

        .report-close {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          border: 1px solid ${C.line};
          background: rgba(255,255,255,0.75);
          color: ${C.olive};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 180ms ease, background 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
          box-shadow: 0 6px 20px rgba(0,0,0,0.06);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          flex-shrink: 0;
        }

        .report-close:hover {
          transform: translateY(-1px) rotate(90deg);
          background: rgba(255,255,255,0.95);
          border-color: ${C.lineStrong};
          box-shadow: 0 10px 24px rgba(0,0,0,0.10);
        }

        .report-close:focus-visible,
        .report-option:focus-within,
        .report-textarea:focus,
        .report-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 4px rgba(254, 227, 43, 0.32);
        }

        .report-section-label {
          display: block;
          margin-bottom: 10px;
          color: ${C.olive};
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .report-options {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .report-option {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 18px;
          border: 1px solid ${C.line};
          background: rgba(255,255,255,0.72);
          cursor: pointer;
          transition:
            transform 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease,
            background 180ms ease;
          animation: reportItemIn 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .report-option:hover {
          transform: translateY(-2px);
          border-color: rgba(24,22,17,0.18);
          box-shadow: 0 14px 28px rgba(0,0,0,0.07);
          background: rgba(255,255,255,0.95);
        }

        .report-option.active {
          border-color: rgba(24,22,17,0.28);
          background:
            linear-gradient(180deg, rgba(255, 247, 184, 0.88), rgba(255,255,255,0.95));
          box-shadow:
            0 12px 30px rgba(254, 227, 43, 0.14),
            inset 0 1px 0 rgba(255,255,255,0.8);
        }

        .report-option input[type="radio"] {
          margin: 0;
          width: 16px;
          height: 16px;
          accent-color: ${C.ink};
          flex-shrink: 0;
        }

        .report-option-text {
          color: ${C.ink};
          font-size: 14px;
          line-height: 1.5;
          font-weight: 700;
        }

        .report-option-check {
          margin-left: auto;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: ${C.ink};
          background: rgba(254, 227, 43, 0.18);
          border: 1px solid rgba(24,22,17,0.08);
          transform: scale(0.9);
          opacity: 0;
          transition: opacity 180ms ease, transform 180ms ease;
        }

        .report-option.active .report-option-check {
          opacity: 1;
          transform: scale(1);
        }

        .report-textarea-wrap {
          margin-top: 16px;
          animation: reportSectionReveal 220ms ease;
        }

        .report-textarea {
          width: 100%;
          box-sizing: border-box;
          resize: vertical;
          min-height: 110px;
          padding: 14px 16px;
          border-radius: 18px;
          border: 1px solid ${C.lineStrong};
          background: rgba(255,255,255,0.88);
          color: ${C.ink};
          font-size: 14px;
          line-height: 1.6;
          font-family: inherit;
          transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
        }

        .report-textarea::placeholder {
          color: #9A9388;
        }

        .report-textarea:focus {
          border-color: rgba(24,22,17,0.22);
          transform: translateY(-1px);
        }

        .report-meta-row {
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .report-hint,
        .report-counter {
          font-size: 12px;
          color: ${C.muted};
        }

        .report-alert {
          margin-top: 16px;
          padding: 12px 14px;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.5;
          border: 1px solid transparent;
          animation: reportSectionReveal 200ms ease;
        }

        .report-alert.error {
          background: ${C.dangerBg};
          color: ${C.dangerText};
          border-color: rgba(180, 35, 24, 0.10);
        }

        .report-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 22px;
        }

        .report-btn {
          position: relative;
          overflow: hidden;
          border-radius: 16px;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 900;
          border: 1px solid transparent;
          cursor: pointer;
          transition:
            transform 180ms ease,
            box-shadow 180ms ease,
            background 180ms ease,
            border-color 180ms ease,
            color 180ms ease;
        }

        .report-btn:hover {
          transform: translateY(-2px);
        }

        .report-btn.secondary {
          background: rgba(255,255,255,0.72);
          color: ${C.ink};
          border-color: ${C.lineStrong};
          box-shadow: 0 8px 22px rgba(0,0,0,0.05);
        }

        .report-btn.secondary:hover {
          background: rgba(255,255,255,0.95);
        }

        .report-btn.primary {
          background: linear-gradient(180deg, ${C.primary}, ${C.primaryDeep});
          color: ${C.ink};
          border-color: rgba(24,22,17,0.15);
          box-shadow:
            0 14px 30px rgba(254, 227, 43, 0.24),
            0 6px 14px rgba(0,0,0,0.08);
        }

        .report-btn.primary::before {
          content: "";
          position: absolute;
          top: 0;
          left: -120%;
          width: 70%;
          height: 100%;
          transform: skewX(-20deg);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
          transition: left 500ms ease;
        }

        .report-btn.primary:hover::before {
          left: 140%;
        }

        .report-btn.primary:disabled,
        .report-btn.secondary:disabled {
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .report-btn.primary:disabled {
          background: rgba(24,22,17,0.08);
          color: rgba(24,22,17,0.40);
          border-color: transparent;
        }

        .report-success {
          text-align: center;
          padding: 14px 4px 6px;
          animation: reportSectionReveal 220ms ease;
        }

        .report-success-icon {
          width: 76px;
          height: 76px;
          margin: 0 auto 16px;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at top, rgba(255,255,255,0.85), rgba(255,255,255,0.15)),
            linear-gradient(180deg, #ECFDF3, #D1FADF);
          color: ${C.successText};
          box-shadow:
            0 16px 34px rgba(2, 122, 72, 0.12),
            inset 0 1px 0 rgba(255,255,255,0.8);
          font-size: 34px;
        }

        .report-success-title {
          margin: 0 0 8px;
          color: ${C.ink};
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .report-success-text {
          margin: 0 auto 22px;
          max-width: 360px;
          color: ${C.muted};
          font-size: 14px;
          line-height: 1.7;
        }

        @keyframes reportBackdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes reportBackdropOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }

        @keyframes reportModalIn {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes reportModalOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(14px) scale(0.97);
          }
        }

        @keyframes reportItemIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes reportSectionReveal {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 640px) {
          .report-modal-backdrop {
            padding: 12px;
            align-items: flex-end;
          }

          .report-modal-card {
            max-width: 100%;
            border-radius: 24px 24px 0 0;
          }

          .report-modal-header {
            padding: 22px 18px 8px;
          }

          .report-modal-body {
            padding: 8px 18px 18px;
          }

          .report-actions {
            flex-direction: column-reverse;
          }

          .report-btn {
            width: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .report-modal-backdrop,
          .report-modal-card,
          .report-option,
          .report-textarea-wrap,
          .report-alert,
          .report-success {
            animation: none !important;
          }

          .report-btn,
          .report-close,
          .report-option,
          .report-option-check,
          .report-textarea {
            transition: none !important;
          }
        }
      `}</style>

      <div
        className={`report-modal-backdrop ${isClosing ? "closing" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget && !loading) {
            closeWithAnimation();
          }
        }}
        aria-hidden="true"
      >
        <div
          className={`report-modal-card ${isClosing ? "closing" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
          aria-describedby="report-modal-description"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="report-modal-header">
            <div>
              <div className="report-badge">
                <span className="report-badge-dot" />
                Report {typeLabel}
              </div>

              <h2 id="report-modal-title" className="report-title">
                {entityLabel
                  ? <>Report &ldquo;{entityLabel}&rdquo;</>
                  : <>Report this {typeLabel?.toLowerCase()}</>}
              </h2>

              <p id="report-modal-description" className="report-subtitle">
                Help us maintain a safe and trustworthy marketplace. Select the issue
                that best matches this {typeLabel?.toLowerCase()}.
              </p>
            </div>

            <button
              type="button"
              className="report-close"
              onClick={closeWithAnimation}
              disabled={loading}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="report-modal-body">
            {success ? (
              <div className="report-success">
                <div className="report-success-icon">✓</div>
                <h3 className="report-success-title">Report submitted</h3>
                <p className="report-success-text">
                  Thank you. Our moderation team will review this report and take
                  appropriate action within 48 hours.
                </p>

                <button
                  type="button"
                  className="report-btn primary"
                  onClick={closeWithAnimation}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <label className="report-section-label">What&apos;s the issue?</label>

                <div className="report-options">
                  {presets.map((p, index) => {
                    const active = preset === p;

                    return (
                      <label
                        key={p}
                        className={`report-option ${active ? "active" : ""}`}
                        style={{ animationDelay: `${index * 45}ms` }}
                      >
                        <input
                          type="radio"
                          name="report_reason"
                          value={p}
                          checked={active}
                          onChange={() => {
                            setPreset(p);
                            setError("");
                          }}
                        />

                        <span className="report-option-text">{p}</span>

                        <span className="report-option-check">✓</span>
                      </label>
                    );
                  })}
                </div>

                {preset === "Other" && (
                  <div className="report-textarea-wrap">
                    <label className="report-section-label" style={{ marginTop: 18 }}>
                      Please describe the issue
                    </label>

                    <textarea
                      className="report-textarea"
                      value={custom}
                      onChange={(e) => {
                        setCustom(e.target.value);
                        setError("");
                      }}
                      placeholder="Describe what’s wrong in a clear and short way (min 5 characters)…"
                      rows={4}
                      maxLength={500}
                    />

                    <div className="report-meta-row">
                      <span className="report-hint">Be specific so the review is faster.</span>
                      <span className="report-counter">{custom.length}/500</span>
                    </div>
                  </div>
                )}

                {error ? (
                  <div className="report-alert error">
                    {error}
                  </div>
                ) : null}

                <div className="report-actions">
                  <button
                    type="button"
                    className="report-btn secondary"
                    onClick={closeWithAnimation}
                    disabled={loading}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="report-btn primary"
                    onClick={handleSubmit}
                    disabled={loading || !preset}
                  >
                    {loading ? "Submitting…" : "Submit report"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}