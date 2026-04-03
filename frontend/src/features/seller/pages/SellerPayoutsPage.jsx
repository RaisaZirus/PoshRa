import React from "react";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = { bg: "#FDFDF9", soft: "#FBEF9C", primary: "#FEE32B", olive: "#877928", ink: "#201D18" };

function Card({ children, style }) {
  return <div style={{ background: COLORS.bg, border: `1px solid rgba(32,29,24,0.12)`, borderRadius: 16, padding: 20, boxShadow: "0 4px 16px rgba(32,29,24,0.06)", ...style }}>{children}</div>;
}

const STATUS_COLORS = {
  requested:  { bg: "#FEF9C3", text: "#854D0E" },
  processed:  { bg: "#DCFCE7", text: "#166534" },
  failed:     { bg: "#FEE2E2", text: "#991B1B" },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: COLORS.soft, text: COLORS.olive };
  return <span style={{ background: s.bg, color: s.text, fontWeight: 800, fontSize: 11, padding: "3px 9px", borderRadius: 999, textTransform: "capitalize" }}>{status}</span>;
}

export default function SellerPayoutsPage() {
  const { fetchWithAuth } = useAuth();
  const [payouts, setPayouts] = React.useState([]);
  const [balance, setBalance] = React.useState(0);
  const [pending, setPending] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [amount, setAmount] = React.useState("");
  const [requesting, setRequesting] = React.useState(false);
  const [error, setError] = React.useState("");

  const loadPayouts = React.useCallback(async () => {
    try {
      const data = await fetchWithAuth("/api/seller/payouts");
      setPayouts(data.data || []);
      setBalance(Number(data.available_balance || 0));
      setPending(Number(data.pending_payout || 0));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [fetchWithAuth]);

  React.useEffect(() => { loadPayouts(); }, [loadPayouts]);

  const requestPayout = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) { setError("Enter a valid amount"); return; }
    if (Number(amount) > balance) { setError("Amount exceeds available balance"); return; }
    setRequesting(true); setError("");
    try {
      await fetchWithAuth("/api/seller/payouts", { method: "POST", body: JSON.stringify({ amount: Number(amount) }) });
      setAmount("");
      loadPayouts();
    } catch (err) { setError(err.message); }
    finally { setRequesting(false); }
  };

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: COLORS.ink, margin: "0 0 24px" }}>Payouts</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, marginBottom: 24 }}>
        {/* Balance + request */}
        <Card>
          <p style={{ fontSize: 12, fontWeight: 900, color: COLORS.olive, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.5 }}>Available balance</p>
          <p style={{ fontSize: 36, fontWeight: 900, color: COLORS.ink, margin: "0 0 20px" }}>₹{balance.toLocaleString("en-IN")}</p>
          <p style={{ fontSize: 12, color: COLORS.olive, margin: "0 0 16px" }}>Balance is calculated from delivered orders.</p>

          <form onSubmit={requestPayout} style={{ display: "flex", gap: 10 }}>
            <input
              type="number" placeholder="Amount to withdraw" value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(""); }}
              style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${error ? "#dc2626" : "rgba(32,29,24,0.2)"}`, fontSize: 14, fontWeight: 700 }}
            />
            <button type="submit" disabled={requesting || !amount}
              style={{ padding: "10px 20px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, fontSize: 13, borderRadius: 10, border: "none", cursor: "pointer" }}>
              {requesting ? "..." : "Request"}
            </button>
          </form>
          {error && <p style={{ fontSize: 12, color: "#dc2626", fontWeight: 700, margin: "8px 0 0" }}>{error}</p>}
        </Card>

        {/* Quick stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card style={{ padding: 16 }}>
            <p style={{ fontSize: 12, color: COLORS.olive, margin: "0 0 4px", fontWeight: 700 }}>Pending payout requests</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: COLORS.ink, margin: 0 }}>
              ₹{pending.toLocaleString("en-IN")}
            </p>
          </Card>
          <Card style={{ padding: 16 }}>
            <p style={{ fontSize: 12, color: COLORS.olive, margin: "0 0 4px", fontWeight: 700 }}>Processed</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: "#166534", margin: 0 }}>
              ₹{payouts.filter((p) => p.status === "processed").reduce((s, p) => s + Number(p.amount), 0).toLocaleString("en-IN")}
            </p>
          </Card>
        </div>
      </div>

      {/* Payout history */}
      <Card>
        <h2 style={{ fontSize: 13, fontWeight: 900, color: COLORS.ink, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>Payout history</h2>
        {loading ? (
          <p style={{ color: COLORS.olive, fontWeight: 700 }}>Loading...</p>
        ) : payouts.length === 0 ? (
          <p style={{ color: COLORS.olive, fontSize: 13 }}>No payout requests yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {payouts.map((p) => (
              <div key={p.payout_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: COLORS.soft, borderRadius: 10 }}>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 14, color: COLORS.ink, margin: "0 0 3px" }}>₹{Number(p.amount).toLocaleString("en-IN")}</p>
                  <p style={{ fontSize: 12, color: COLORS.olive, margin: 0 }}>{new Date(p.requested_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}