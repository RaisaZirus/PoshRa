// =============================================================
// FILE: src/components/ReportModal.jsx
//
// Reusable modal to let any logged-in user report a product,
// review, or seller.
//
// Usage:
//   <ReportModal
//     entityType="product"        // "product" | "review" | "seller"
//     entityId={product_id}
//     entityLabel="Red Shirt"     // shown in the modal title
//     onClose={() => setOpen(false)}
//   />
// =============================================================

import React from "react";
import { useAuth } from "../auth/useAuth.jsx";
import { useNavigate } from "react-router-dom";

const C = {
  bg:      "#FDFDF9",
  soft:    "#FBEF9C",
  primary: "#FEE32B",
  olive:   "#877928",
  ink:     "#201D18",
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

export default function ReportModal({ entityType, entityId, entityLabel, onClose }) {
  const { user, fetchWithAuth } = useAuth();
  const navigate = useNavigate();

  const [preset, setPreset]     = React.useState("");
  const [custom, setCustom]     = React.useState("");
  const [loading, setLoading]   = React.useState(false);
  const [success, setSuccess]   = React.useState(false);
  const [error, setError]       = React.useState("");

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!user) {
      onClose();
      navigate("/auth/login");
    }
  }, [user, onClose, navigate]);

  const reason = preset === "Other" ? custom.trim() : preset;

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
        body: JSON.stringify({ entity_type: entityType, entity_id: entityId, reason }),
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const presets = REASON_PRESETS[entityType] || REASON_PRESETS.product;
  const typeLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1);

  return (
    // Backdrop
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(32,29,24,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: C.bg,
          border: "1.5px solid rgba(32,29,24,0.14)",
          borderRadius: 20,
          boxShadow: "0 24px 60px rgba(32,29,24,0.18)",
          width: "100%",
          maxWidth: 480,
          padding: 28,
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, color: C.olive, letterSpacing: 1, textTransform: "uppercase" }}>
              Report {typeLabel}
            </div>
            <h2 style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 900, color: C.ink, lineHeight: 1.3 }}>
              {entityLabel
                ? <>Report &ldquo;{entityLabel}&rdquo;</>
                : <>Report this {typeLabel.toLowerCase()}</>}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 20, color: C.olive, lineHeight: 1, padding: 4,
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {success ? (
          /* Success state */
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: C.ink, marginBottom: 6 }}>
              Report submitted
            </div>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: C.olive, lineHeight: 1.5 }}>
              Thank you. Our moderation team will review this and take action within 48 hours.
            </p>
            <button
              onClick={onClose}
              style={{
                background: C.primary, color: C.ink,
                border: `1.5px solid ${C.ink}`, borderRadius: 12,
                padding: "10px 28px", fontWeight: 900, fontSize: 13, cursor: "pointer",
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Reason presets */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: C.olive, marginBottom: 8 }}>
                What&apos;s the issue?
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {presets.map((p) => (
                  <label
                    key={p}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                      border: preset === p
                        ? `2px solid ${C.ink}`
                        : "1.5px solid rgba(32,29,24,0.15)",
                      background: preset === p ? C.soft : C.bg,
                      fontWeight: preset === p ? 800 : 600,
                      fontSize: 13, color: C.ink,
                      transition: "all 0.12s",
                    }}
                  >
                    <input
                      type="radio"
                      name="report_reason"
                      value={p}
                      checked={preset === p}
                      onChange={() => { setPreset(p); setError(""); }}
                      style={{ accentColor: C.ink }}
                    />
                    {p}
                  </label>
                ))}
              </div>
            </div>

            {/* Custom reason — shown when "Other" is selected */}
            {preset === "Other" && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: C.olive, marginBottom: 6 }}>
                  Please describe the issue
                </label>
                <textarea
                  value={custom}
                  onChange={(e) => { setCustom(e.target.value); setError(""); }}
                  placeholder="Describe what's wrong (min 5 characters)…"
                  rows={3}
                  maxLength={500}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "10px 14px", borderRadius: 10,
                    border: "1.5px solid rgba(32,29,24,0.2)",
                    fontSize: 13, fontFamily: "inherit", resize: "vertical",
                    background: C.bg, color: C.ink,
                    outline: "none",
                  }}
                />
                <div style={{ textAlign: "right", fontSize: 11, color: C.olive, marginTop: 4 }}>
                  {custom.length}/500
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                background: "#FEE2E2", color: "#991B1B",
                borderRadius: 10, padding: "10px 14px",
                fontSize: 13, fontWeight: 700, marginBottom: 14,
              }}>
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
              <button
                onClick={onClose}
                disabled={loading}
                style={{
                  background: "none", color: C.ink,
                  border: "1.5px solid rgba(32,29,24,0.2)", borderRadius: 12,
                  padding: "10px 20px", fontWeight: 800, fontSize: 13, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !preset}
                style={{
                  background: !preset || loading ? "rgba(32,29,24,0.08)" : C.primary,
                  color: !preset || loading ? "rgba(32,29,24,0.4)" : C.ink,
                  border: `1.5px solid ${!preset || loading ? "transparent" : C.ink}`,
                  borderRadius: 12, padding: "10px 24px",
                  fontWeight: 900, fontSize: 13,
                  cursor: !preset || loading ? "not-allowed" : "pointer",
                  transition: "all 0.12s",
                }}
              >
                {loading ? "Submitting…" : "Submit report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}