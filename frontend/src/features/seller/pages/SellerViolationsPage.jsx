import React from "react";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = { bg: "#FDFDF9", soft: "#FBEF9C", primary: "#FEE32B", olive: "#877928", ink: "#201D18" };

function Card({ children, style }) {
  return <div style={{ background: COLORS.bg, border: `1px solid rgba(32,29,24,0.12)`, borderRadius: 16, padding: 20, boxShadow: "0 4px 16px rgba(32,29,24,0.06)", ...style }}>{children}</div>;
}

export default function SellerViolationsPage() {
  const { fetchWithAuth } = useAuth();
  const [violations, setViolations] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchWithAuth("/api/seller/violations")
      .then((d) => setViolations(d.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: COLORS.ink, margin: "0 0 8px" }}>Violations</h1>
      <p style={{ fontSize: 13, color: COLORS.olive, margin: "0 0 24px" }}>
        Policy violations issued by PoshRa admins against your seller account.
      </p>

      {loading ? (
        <p style={{ color: COLORS.olive, fontWeight: 700 }}>Loading...</p>
      ) : violations.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <p style={{ fontWeight: 900, fontSize: 16, color: COLORS.ink, marginBottom: 6 }}>No violations</p>
          <p style={{ fontSize: 13, color: COLORS.olive, margin: 0 }}>Your account is in good standing.</p>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Summary */}
          <div style={{ background: "#FEE2E2", border: "1.5px solid #dc2626", borderRadius: 14, padding: "14px 18px", marginBottom: 8 }}>
            <p style={{ fontWeight: 900, color: "#991B1B", fontSize: 14, margin: "0 0 4px" }}>
              {violations.length} violation{violations.length !== 1 ? "s" : ""} on record
            </p>
            <p style={{ fontSize: 12, color: "#dc2626", margin: 0 }}>
              Repeated violations may result in account suspension. Contact support if you believe a violation was issued in error.
            </p>
          </div>

          {violations.map((v) => (
            <Card key={v.violation_id} style={{ borderLeft: "3px solid #dc2626", borderRadius: "0 16px 16px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 900, fontSize: 14, color: COLORS.ink, margin: "0 0 6px" }}>
                    {v.violation_type || "Policy violation"}
                  </p>
                  {v.penalty && (
                    <div style={{ background: "#FEF9C3", border: "1px solid #d97706", borderRadius: 8, padding: "8px 12px", marginTop: 8 }}>
                      <p style={{ fontSize: 12, fontWeight: 800, color: "#854D0E", margin: "0 0 2px" }}>Penalty</p>
                      <p style={{ fontSize: 13, color: "#201D18", margin: 0 }}>{v.penalty}</p>
                    </div>
                  )}
                </div>
                <p style={{ fontSize: 12, color: COLORS.olive, fontWeight: 700, margin: 0, flexShrink: 0 }}>
                  {new Date(v.created_at).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

