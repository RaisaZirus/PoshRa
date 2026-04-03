import React from "react";
import { useAuth } from "../../../auth/useAuth.jsx";

const C = {
  bg: "#FDFDF9", soft: "#FBEF9C", primary: "#FEE32B",
  olive: "#877928", ink: "#201D18",
};

function Card({ children, style }) {
  return (
    <div style={{
      background: C.bg, border: "1px solid rgba(32,29,24,0.12)",
      borderRadius: 16, padding: 20,
      boxShadow: "0 4px 16px rgba(32,29,24,0.06)", ...style,
    }}>
      {children}
    </div>
  );
}

export default function AdminCouponsPage() {
  const { fetchWithAuth } = useAuth();
  const [coupons, setCoupons] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);
  const [formData, setFormData] = React.useState({ code: "", discount_type: "percentage", discount_value: "", expiry_date: "" });
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchWithAuth("/api/admin/coupons");
      setCoupons(d.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  React.useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setFormData({ code: "", discount_type: "percentage", discount_value: "", expiry_date: "" });
    setEditingId(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {setError("Coupon code required"); return;}
    if (Number.isNaN(Number(formData.discount_value)) || Number(formData.discount_value) < 0) {
      setError("Discount value must be 0 or greater");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value),
        expiry_date: formData.expiry_date || null,
      };

      if (editingId) {
        await fetchWithAuth(`/api/admin/coupons/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await fetchWithAuth("/api/admin/coupons", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      resetForm();
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (coupon) => {
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value?.toString() ?? "",
      expiry_date: coupon.expiry_date ? coupon.expiry_date.slice(0,10) : "",
    });
    setEditingId(coupon.coupon_id);
    setShowForm(true);
    setError("");
  };

  const handleDelete = async (coupon_id) => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      await fetchWithAuth(`/api/admin/coupons/${coupon_id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: C.ink, margin: 0 }}>Coupons</h1>
        <button
          onClick={() => { setShowForm((v) => !v); resetForm(); }}
          style={{
            padding: "10px 20px", background: C.primary, color: C.ink,
            fontWeight: 900, fontSize: 13, borderRadius: 10, border: "none",
            cursor: "pointer",
          }}
        >
          {showForm ? "Cancel" : "Add Coupon"}
        </button>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 16 }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="text" placeholder="Code (e.g. WEEKLY10)" value={formData.code}
              onChange={(e) => { setFormData((s) => ({ ...s, code: e.target.value })); setError(""); }}
              style={{ padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${error && !formData.code ? "#dc2626" : "rgba(32,29,24,0.2)"}`, fontSize: 13, fontWeight: 600 }}
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select
                value={formData.discount_type}
                onChange={(e) => setFormData((s) => ({ ...s, discount_type: e.target.value }))}
                style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid rgba(32,29,24,0.2)", fontSize: 13, fontWeight: 600, flex: 1 }}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed</option>
              </select>
              <input
                type="number" step="0.01" placeholder="Discount Value" value={formData.discount_value}
                onChange={(e) => setFormData((s) => ({ ...s, discount_value: e.target.value }))}
                style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid rgba(32,29,24,0.2)", fontSize: 13, fontWeight: 600, flex: 1 }}
              />
              <input
                type="date" value={formData.expiry_date}
                onChange={(e) => setFormData((s) => ({ ...s, expiry_date: e.target.value }))}
                style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid rgba(32,29,24,0.2)", fontSize: 13, fontWeight: 600, flex: 1 }}
              />
            </div>
            {error && <p style={{ fontSize: 12, color: "#dc2626", fontWeight: 700, margin: 0 }}>{error}</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="submit" disabled={submitting}
                style={{ flex: 1, padding: "10px", background: C.primary, color: C.ink, fontWeight: 900, fontSize: 13, borderRadius: 10, border: "none", cursor: submitting ? "not-allowed" : "pointer" }}
              >
                {submitting ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
              <button
                type="button" onClick={() => { setShowForm(false); resetForm(); }}
                style={{ padding: "10px 16px", background: "transparent", border: `1px solid ${C.olive}`, color: C.olive, fontWeight: 700, fontSize: 13, borderRadius: 10, cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <p style={{ padding: 20, color: C.olive, fontWeight: 700 }}>Loading coupons...</p>
        ) : coupons.length === 0 ? (
          <p style={{ padding: 20, color: C.olive, fontWeight: 700 }}>No coupons found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.soft }}>
                  { ["ID", "Code", "Type", "Value", "Expiry", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 900, color: C.olive, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid rgba(32,29,24,0.1)" }}>{h}</th>
                  )) }
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon, i) => (
                  <tr key={coupon.coupon_id} style={{ background: i % 2 === 0 ? C.bg : "rgba(251,239,156,0.2)", borderBottom: "1px solid rgba(32,29,24,0.06)" }}>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: C.olive, fontWeight: 700 }}>
                      #{coupon.coupon_id}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 800, color: C.ink }}>
                      {coupon.code}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: C.olive }}>{coupon.discount_type}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: C.olive }}>{coupon.discount_value}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: C.olive }}>{coupon.expiry_date ? new Date(coupon.expiry_date).toLocaleDateString("en-IN") : "Never"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => handleEdit(coupon)} style={{ padding: "6px 12px", background: "#DBEAFE", color: "#1E40AF", fontWeight: 800, fontSize: 11, borderRadius: 6, border: "none", cursor: "pointer" }}>Edit</button>
                        <button onClick={() => handleDelete(coupon.coupon_id)} style={{ padding: "6px 12px", background: "#FEE2E2", color: "#991B1B", fontWeight: 800, fontSize: 11, borderRadius: 6, border: "none", cursor: "pointer" }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
