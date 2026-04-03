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

export default function AdminCouriersPage() {
  const { fetchWithAuth } = useAuth();
  const [couriers, setCouriers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);
  const [formData, setFormData] = React.useState({ name: "", contact_info: "" });
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchWithAuth("/api/admin/couriers");
      setCouriers(d.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  React.useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { setError("Courier name required"); return; }
    
    setSubmitting(true);
    setError("");
    try {
      if (editingId) {
        await fetchWithAuth(`/api/admin/couriers/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(formData),
        });
      } else {
        await fetchWithAuth("/api/admin/couriers", {
          method: "POST",
          body: JSON.stringify(formData),
        });
      }
      setFormData({ name: "", contact_info: "" });
      setEditingId(null);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (courier) => {
    setFormData({ name: courier.name, contact_info: courier.contact_info || "" });
    setEditingId(courier.courier_id);
    setShowForm(true);
  };

  const handleDelete = async (courier_id) => {
    if (!window.confirm("Delete this courier?")) return;
    try {
      await fetchWithAuth(`/api/admin/couriers/${courier_id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", contact_info: "" });
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: C.ink, margin: 0 }}>Couriers</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "10px 20px", background: C.primary, color: C.ink,
            fontWeight: 900, fontSize: 13, borderRadius: 10, border: "none",
            cursor: "pointer",
          }}
        >
          {showForm ? "Cancel" : "Add Courier"}
        </button>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 16 }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="text" placeholder="Courier name (e.g. DHL, FedEx)" value={formData.name}
              onChange={(e) => { setFormData((s) => ({ ...s, name: e.target.value })); setError(""); }}
              style={{
                padding: "10px 14px", borderRadius: 10,
                border: `1.5px solid ${error && !formData.name ? "#dc2626" : "rgba(32,29,24,0.2)"}`,
                fontSize: 13, fontWeight: 600,
              }}
            />
            <input
              type="text" placeholder="Contact info (optional)" value={formData.contact_info}
              onChange={(e) => setFormData((s) => ({ ...s, contact_info: e.target.value }))}
              style={{
                padding: "10px 14px", borderRadius: 10,
                border: "1.5px solid rgba(32,29,24,0.2)",
                fontSize: 13, fontWeight: 600,
              }}
            />
            {error && <p style={{ fontSize: 12, color: "#dc2626", fontWeight: 700, margin: 0 }}>{error}</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="submit" disabled={submitting}
                style={{
                  flex: 1, padding: "10px", background: C.primary, color: C.ink,
                  fontWeight: 900, fontSize: 13, borderRadius: 10, border: "none",
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
              <button
                type="button" onClick={handleCancel}
                style={{
                  padding: "10px 16px", background: "transparent",
                  border: `1px solid ${C.olive}`, color: C.olive,
                  fontWeight: 700, fontSize: 13, borderRadius: 10, cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <p style={{ padding: 20, color: C.olive, fontWeight: 700 }}>Loading couriers...</p>
        ) : couriers.length === 0 ? (
          <p style={{ padding: 20, color: C.olive, fontWeight: 700 }}>No couriers found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.soft }}>
                  {["ID", "Name", "Contact Info", "Actions"].map((h) => (
                    <th key={h} style={{
                      padding: "12px 16px", textAlign: "left",
                      fontSize: 11, fontWeight: 900, color: C.olive,
                      textTransform: "uppercase", letterSpacing: 0.5,
                      borderBottom: "1px solid rgba(32,29,24,0.1)",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {couriers.map((courier, i) => (
                  <tr
                    key={courier.courier_id}
                    style={{
                      background: i % 2 === 0 ? C.bg : "rgba(251,239,156,0.2)",
                      borderBottom: "1px solid rgba(32,29,24,0.06)",
                    }}
                  >
                    <td style={{ padding: "12px 16px", fontSize: 12, color: C.olive, fontWeight: 700 }}>#{courier.courier_id}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 800, color: C.ink }}>{courier.name}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: C.olive }}>{courier.contact_info || "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => handleEdit(courier)}
                          style={{
                            padding: "6px 12px", background: "#DBEAFE", color: "#1E40AF",
                            fontWeight: 800, fontSize: 11, borderRadius: 6, border: "none", cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(courier.courier_id)}
                          style={{
                            padding: "6px 12px", background: "#FEE2E2", color: "#991B1B",
                            fontWeight: 800, fontSize: 11, borderRadius: 6, border: "none", cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
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


