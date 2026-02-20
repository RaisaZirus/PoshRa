import React from "react";
import { useAuth } from "../../../auth/useAuth.jsx";

function Modal({ children, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }} onClick={onClose}>
      <div style={{ background: "#fff", padding: 16, borderRadius: 12, minWidth: 320 }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export default function AddressesPage() {
  const { accessToken } = useAuth();
  const [addresses, setAddresses] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState(null);

  const [form, setForm] = React.useState({ city: "", area: "", details: "", is_default: false });

  const fetchAddresses = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/account/addresses`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load addresses");
      setAddresses(data.data || []);
    } catch (err) {
      setError(err.message || "Failed to load addresses");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    if (accessToken) fetchAddresses();
  }, [accessToken, fetchAddresses]);

  function openNew() {
    setEditing(null);
    setForm({ city: "", area: "", details: "", is_default: false });
    setShowForm(true);
  }

  function openEdit(a) {
    setEditing(a);
    setForm({ city: a.city || "", area: a.area || "", details: a.details || "", is_default: !!a.is_default });
    setShowForm(true);
  }

  async function submitForm(e) {
    e && e.preventDefault();
    setError("");
    try {
      const method = editing ? "PUT" : "POST";
      const url = editing ? `/api/account/addresses/${editing.address_id}` : "/api/account/addresses";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Save failed");
      setShowForm(false);
      fetchAddresses();
    } catch (err) {
      setError(err.message || "Save failed");
    }
  }

  async function removeAddress(id) {
    if (!confirm("Delete this address?")) return;
    try {
      const res = await fetch(`/api/account/addresses/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");
      fetchAddresses();
    } catch (err) {
      setError(err.message || "Delete failed");
    }
  }

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Your Addresses</h2>
        <button onClick={openNew} style={{ padding: "8px 12px", borderRadius: 8, cursor: "pointer" }}>Add address</button>
      </div>

      {error && <div style={{ marginBottom: 12, color: "#b91c1c" }}>❌ {error}</div>}

      {loading ? (
        <div>Loading…</div>
      ) : addresses.length === 0 ? (
        <div style={{ padding: 12, background: "#fff", borderRadius: 8 }}>You have no saved addresses.</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {addresses.map((a) => (
            <div key={a.address_id} style={{ background: "#fff", padding: 12, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 900 }}>{a.city || "-"} {a.is_default ? <span style={{ color: "#047857", marginLeft: 8, fontWeight: 900 }}>Default</span> : null}</div>
                <div style={{ color: "#4b5563", fontSize: 13 }}>{a.area || ""}</div>
                <div style={{ color: "#374151", marginTop: 6 }}>{a.details || ""}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => openEdit(a)} style={{ padding: "6px 8px", borderRadius: 8, cursor: "pointer" }}>Edit</button>
                <button onClick={() => removeAddress(a.address_id)} style={{ padding: "6px 8px", borderRadius: 8, background: "#fee2e2", cursor: "pointer" }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <h3 style={{ marginTop: 0 }}>{editing ? "Edit address" : "Add address"}</h3>
          <form onSubmit={submitForm} style={{ display: "grid", gap: 8 }}>
            <label style={{ fontSize: 13 }}>City</label>
            <input value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} />
            <label style={{ fontSize: 13 }}>Area / Neighbourhood</label>
            <input value={form.area} onChange={(e) => setForm((s) => ({ ...s, area: e.target.value }))} />
            <label style={{ fontSize: 13 }}>Details (house, street, landmark)</label>
            <textarea value={form.details} onChange={(e) => setForm((s) => ({ ...s, details: e.target.value }))} rows={4} />
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={form.is_default} onChange={(e) => setForm((s) => ({ ...s, is_default: e.target.checked }))} />
              Set as default address
            </label>

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button type="submit" style={{ padding: "8px 12px", borderRadius: 8, cursor: "pointer" }}>{editing ? "Save" : "Add"}</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: "8px 12px", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
