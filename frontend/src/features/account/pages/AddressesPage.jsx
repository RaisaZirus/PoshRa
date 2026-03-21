import React from "react";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = { bg: "#FDFDF9", soft: "#FBEF9C", primary: "#FEE32B", olive: "#877928", ink: "#201D18" };

function Card({ children, style }) {
  return <div style={{ background: COLORS.bg, border: `1px solid rgba(32,29,24,0.12)`, borderRadius: 16, padding: 20, boxShadow: "0 4px 16px rgba(32,29,24,0.06)", ...style }}>{children}</div>;
}

function Label({ children }) {
  return <label style={{ fontSize: 12, fontWeight: 800, color: COLORS.olive, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 }}>{children}</label>;
}

function Input({ style, ...props }) {
  return <input {...props} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid rgba(32,29,24,0.2)`, fontSize: 14, boxSizing: "border-box", outline: "none", background: COLORS.bg, color: COLORS.ink, ...style }} />;
}

export default function AddressesPage() {
  const { accessToken, fetchWithAuth } = useAuth();
  const [addresses, setAddresses] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [form, setForm] = React.useState({ city: "", area: "", details: "", is_default: false });
  const [saving, setSaving] = React.useState(false);

  const fetchAddresses = React.useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await fetchWithAuth("/api/account/addresses");
      setAddresses(data.data || []);
    } catch (err) {
      setError(err.message || "Failed to load addresses");
    } finally { setLoading(false); }
  }, [accessToken]);

  React.useEffect(() => { if (accessToken) fetchAddresses(); }, [accessToken, fetchAddresses]);

  function openNew() {
    setEditing(null);
    setForm({ city: "", area: "", details: "", is_default: false });
    setShowForm(true);
    setError("");
  }

  function openEdit(a) {
    setEditing(a);
    setForm({ city: a.city || "", area: a.area || "", details: a.details || "", is_default: !!a.is_default });
    setShowForm(true);
    setError("");
  }

  async function submitForm(e) {
    e && e.preventDefault();
    setError("");
    if (!form.city?.trim()) {
      setError("City is required."); return;
    }
    setSaving(true);
    try {
      const method = editing ? "PUT" : "POST";
      const url = editing ? `/api/account/addresses/${editing.address_id}` : "/api/account/addresses";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Server error ${res.status}`);
      setShowForm(false); setEditing(null);
      fetchAddresses();
    } catch (err) {
      setError(err.message || "Save failed");
    } finally { setSaving(false); }
  }

  async function removeAddress(id) {
    if (!confirm("Delete this address?")) return;
    try {
      await fetchWithAuth(`/api/account/addresses/${id}`, { method: "DELETE" });
      fetchAddresses();
    } catch (err) { setError(err.message || "Delete failed"); }
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: COLORS.ink, margin: "0 0 2px" }}>Saved addresses</h2>
          <p style={{ fontSize: 13, color: COLORS.olive, margin: 0 }}>{addresses.length} address{addresses.length !== 1 ? "es" : ""}</p>
        </div>
        <button onClick={openNew} style={{ padding: "10px 20px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, fontSize: 13, borderRadius: 10, border: "none", cursor: "pointer" }}>
          + Add address
        </button>
      </div>

      {error && !showForm && (
        <div style={{ background: "#fee2e2", border: "1px solid #dc2626", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
          <p style={{ color: "#dc2626", fontWeight: 700, fontSize: 13, margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Add/Edit form — inline, not modal */}
      {showForm && (
        <Card style={{ marginBottom: 16, borderColor: COLORS.primary, borderWidth: 1.5 }}>
          <h3 style={{ fontSize: 15, fontWeight: 900, color: COLORS.ink, margin: "0 0 16px" }}>
            {editing ? "Edit address" : "New address"}
          </h3>
          <form onSubmit={submitForm} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <Label>City <span style={{ color: "#dc2626" }}>*</span></Label>
                <Input value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} placeholder="e.g. Dhaka" required />
              </div>
              <div>
                <Label>Area / Neighbourhood</Label>
                <Input value={form.area} onChange={(e) => setForm((s) => ({ ...s, area: e.target.value }))} placeholder="e.g. Gulshan" />
              </div>
            </div>
            <div>
              <Label>Details</Label>
              <textarea
                value={form.details}
                onChange={(e) => setForm((s) => ({ ...s, details: e.target.value }))}
                placeholder="House no, street, landmark..."
                rows={3}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid rgba(32,29,24,0.2)`, fontSize: 14, resize: "vertical", fontFamily: "system-ui", boxSizing: "border-box", outline: "none" }}
              />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: COLORS.ink, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => setForm((s) => ({ ...s, is_default: e.target.checked }))}
                style={{ width: 16, height: 16, cursor: "pointer" }}
              />
              Set as default address
            </label>

            {error && <p style={{ color: "#dc2626", fontWeight: 700, fontSize: 13, margin: 0 }}>{error}</p>}

            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={saving}
                style={{ padding: "10px 24px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, fontSize: 13, borderRadius: 10, border: "none", cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Saving..." : editing ? "Save changes" : "Add address"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError(""); }}
                style={{ padding: "10px 16px", background: "transparent", border: `1.5px solid ${COLORS.olive}`, color: COLORS.olive, fontWeight: 700, fontSize: 13, borderRadius: 10, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Address list */}
      {loading ? (
        <p style={{ color: COLORS.olive, fontWeight: 700 }}>Loading...</p>
      ) : addresses.length === 0 && !showForm ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📍</div>
          <p style={{ fontWeight: 700, color: COLORS.ink, marginBottom: 6 }}>No saved addresses</p>
          <p style={{ fontSize: 13, color: COLORS.olive, marginBottom: 20 }}>Add an address to speed up checkout.</p>
          <button onClick={openNew}
            style={{ padding: "10px 20px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, fontSize: 13, borderRadius: 10, border: "none", cursor: "pointer" }}>
            Add your first address
          </button>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {addresses.map((a) => (
            <Card key={a.address_id} style={{
              borderLeft: a.is_default ? `3px solid ${COLORS.primary}` : `1px solid rgba(32,29,24,0.12)`,
              borderRadius: a.is_default ? "0 16px 16px 0" : 16,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <p style={{ fontWeight: 900, fontSize: 15, color: COLORS.ink, margin: 0 }}>
                      {[a.city, a.area].filter(Boolean).join(", ") || "—"}
                    </p>
                    {a.is_default && (
                      <span style={{ fontSize: 11, fontWeight: 800, background: COLORS.primary, color: COLORS.ink, padding: "2px 8px", borderRadius: 6 }}>
                        Default
                      </span>
                    )}
                  </div>
                  {a.details && (
                    <p style={{ fontSize: 13, color: COLORS.olive, margin: 0, lineHeight: 1.5 }}>{a.details}</p>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => openEdit(a)}
                    style={{ padding: "7px 14px", background: COLORS.soft, color: COLORS.ink, fontWeight: 700, fontSize: 12, borderRadius: 8, border: "none", cursor: "pointer" }}>
                    Edit
                  </button>
                  <button onClick={() => removeAddress(a.address_id)}
                    style={{ padding: "7px 14px", background: "#fee2e2", color: "#dc2626", fontWeight: 700, fontSize: 12, borderRadius: 8, border: "none", cursor: "pointer" }}>
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}