import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = { bg: "#FDFDF9", soft: "#FBEF9C", primary: "#FEE32B", olive: "#877928", ink: "#201D18" };

function Card({ children, style }) {
  return <div style={{ background: COLORS.bg, border: `1px solid rgba(32,29,24,0.12)`, borderRadius: 16, padding: 20, boxShadow: "0 10px 26px rgba(32,29,24,0.08)", ...style }}>{children}</div>;
}

const STATUS_COLORS = {
  requested:  { bg: "#FEF9C3", text: "#854D0E" },
  approved:   { bg: "#DBEAFE", text: "#1E40AF" },
  rejected:   { bg: "#FEE2E2", text: "#991B1B" },
  completed:  { bg: "#DCFCE7", text: "#166534" },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: COLORS.soft, text: COLORS.olive };
  return <span style={{ background: s.bg, color: s.text, fontWeight: 800, fontSize: 12, padding: "4px 10px", borderRadius: 999, textTransform: "capitalize" }}>{status}</span>;
}

const RETURN_REASONS = [
  "Item is defective or damaged",
  "Wrong item received",
  "Item not as described",
  "Item arrived too late",
  "Changed my mind",
  "Other",
];

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

  // Load item info from the order
  React.useEffect(() => {
    const load = async () => {
      try {
        // Fetch item details via the return check endpoint
        const res = await fetchWithAuth(`/api/orders/items/${order_item_id}/returns`);
        if (res.existing) {
          setExistingReturn(res.existing);
        }
        setItemInfo(res.item);
      } catch (err) {
        // If endpoint doesn't exist yet, show form anyway
        setItemInfo(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [order_item_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const reason = selectedReason === "Other" ? customReason.trim() : selectedReason;
    if (!reason) { setError("Please select or enter a reason."); return; }

    setSubmitting(true); setError("");
    try {
      await fetchWithAuth(`/api/orders/items/${order_item_id}/returns`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      setSubmitted(true);
      // Navigate to orders after 2 seconds
      setTimeout(() => navigate("/orders"), 2500);
    } catch (err) {
      setError(err.message || "Failed to submit return request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ background: COLORS.soft, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontWeight: 700, color: COLORS.olive }}>Loading...</p>
    </div>
  );

  return (
    <div style={{ background: COLORS.soft, minHeight: "100vh", paddingBottom: 60, fontFamily: "system-ui, sans-serif" }}>
      <div className="container mx-auto px-4 py-8" style={{ maxWidth: 600 }}>
        <Link to="/orders" style={{ fontSize: 13, color: COLORS.olive, fontWeight: 700, textDecoration: "none" }}>← My orders</Link>

        <h1 style={{ fontSize: 26, fontWeight: 900, color: COLORS.ink, margin: "12px 0 24px" }}>Request a return</h1>

        {/* Success state */}
        {submitted ? (
          <Card style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: COLORS.ink, marginBottom: 8 }}>Return request submitted</h2>
            <p style={{ fontSize: 14, color: COLORS.olive, marginBottom: 24, lineHeight: 1.6 }}>
              Your return request has been received. Our team will review it and get back to you within 2–3 business days.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Link to="/orders"
                style={{ padding: "11px 24px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, fontSize: 14, borderRadius: 12, textDecoration: "none" }}>
                My orders
              </Link>
              <Link to="/"
                style={{ padding: "11px 20px", background: "transparent", border: `1.5px solid ${COLORS.olive}`, color: COLORS.olive, fontWeight: 700, fontSize: 14, borderRadius: 12, textDecoration: "none" }}>
                Continue shopping
              </Link>
            </div>
          </Card>
        ) : (
          <Card>
            {/* Item info if available */}
            {itemInfo && (
              <div style={{ background: COLORS.soft, borderRadius: 10, padding: "12px 14px", marginBottom: 20 }}>
                <p style={{ fontWeight: 800, fontSize: 14, color: COLORS.ink, margin: "0 0 2px" }}>{itemInfo.product_name}</p>
                <p style={{ fontSize: 12, color: COLORS.olive, margin: 0 }}>
                  SKU: {itemInfo.sku} · Qty: {itemInfo.quantity} · ₹{(Number(itemInfo.price) * itemInfo.quantity).toLocaleString("en-BD")}
                </p>
              </div>
            )}

            <h2 style={{ fontSize: 15, fontWeight: 900, color: COLORS.ink, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Why are you returning this?
            </h2>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Reason options */}
              {RETURN_REASONS.map((reason) => (
                <label key={reason}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                    border: `1.5px solid ${selectedReason === reason ? COLORS.primary : "rgba(32,29,24,0.15)"}`,
                    borderRadius: 10, cursor: "pointer",
                    background: selectedReason === reason ? "rgba(254,227,43,0.08)" : COLORS.bg,
                    transition: "border-color 0.15s",
                  }}>
                  <input
                    type="radio" name="reason" value={reason}
                    checked={selectedReason === reason}
                    onChange={() => { setSelectedReason(reason); setError(""); }}
                    style={{ width: 16, height: 16, accentColor: COLORS.primary }}
                  />
                  <span style={{ fontSize: 14, fontWeight: selectedReason === reason ? 800 : 400, color: COLORS.ink }}>
                    {reason}
                  </span>
                </label>
              ))}

              {/* Custom reason if Other */}
              {selectedReason === "Other" && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Please describe the issue..."
                  rows={4}
                  style={{
                    padding: "10px 14px", borderRadius: 10,
                    border: `1.5px solid rgba(32,29,24,0.2)`,
                    fontSize: 14, resize: "vertical", fontFamily: "system-ui",
                    marginTop: 4,
                  }}
                />
              )}

              {/* Policy note */}
              <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "10px 14px", marginTop: 4 }}>
                <p style={{ fontSize: 12, color: "#1E40AF", margin: 0, lineHeight: 1.6 }}>
                  <strong>Return policy:</strong> Returns are accepted within 30 days of delivery. Items must be unused and in original packaging. Refunds are processed within 5–7 business days after approval.
                </p>
              </div>

              {error && <p style={{ fontSize: 13, color: "#dc2626", fontWeight: 700, margin: 0 }}>{error}</p>}

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="submit" disabled={submitting || !selectedReason}
                  style={{
                    flex: 1, padding: "13px",
                    background: !selectedReason ? "rgba(32,29,24,0.1)" : COLORS.primary,
                    color: !selectedReason ? COLORS.olive : COLORS.ink,
                    fontWeight: 900, fontSize: 14, borderRadius: 12, border: "none",
                    cursor: !selectedReason || submitting ? "not-allowed" : "pointer",
                  }}>
                  {submitting ? "Submitting..." : "Submit return request"}
                </button>
                <Link to="/orders"
                  style={{
                    padding: "13px 20px", background: "transparent",
                    border: `1.5px solid ${COLORS.olive}`, color: COLORS.olive,
                    fontWeight: 700, fontSize: 14, borderRadius: 12, textDecoration: "none",
                    display: "flex", alignItems: "center",
                  }}>
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

