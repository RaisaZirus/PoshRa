import React from "react";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = { bg: "#FDFDF9", soft: "#FBEF9C", primary: "#FEE32B", olive: "#877928", ink: "#201D18" };

function Card({ children, style }) {
  return <div style={{ background: COLORS.bg, border: `1px solid rgba(32,29,24,0.12)`, borderRadius: 16, padding: 20, boxShadow: "0 4px 16px rgba(32,29,24,0.06)", ...style }}>{children}</div>;
}

function autoSlug(n) {
  return n.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function SellerStoreSettingsPage() {
  const { fetchWithAuth } = useAuth();
  const [stores, setStores] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ store_name: "", store_slug: "" });
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetchWithAuth("/api/seller/stores")
      .then((d) => setStores(d.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const createStore = async (e) => {
    e.preventDefault();
    if (!form.store_name.trim()) { setError("Store name required"); return; }
    setSaving(true); setError("");
    try {
      const data = await fetchWithAuth("/api/seller/stores", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setStores((prev) => [...prev, data.data]);
      setShowForm(false);
      setForm({ store_name: "", store_slug: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={{ color: COLORS.olive, fontWeight: 700 }}>Loading...</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: COLORS.ink, margin: 0 }}>Your stores</h1>
        <button onClick={() => setShowForm((s) => !s)}
          style={{ padding: "10px 20px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, fontSize: 13, borderRadius: 10, border: "none", cursor: "pointer" }}>
          {showForm ? "Cancel" : "+ New store"}
        </button>
      </div>

      {/* Create store form */}
      {showForm && (
        <Card style={{ marginBottom: 20, maxWidth: 480 }}>
          <h2 style={{ fontSize: 15, fontWeight: 900, color: COLORS.ink, margin: "0 0 16px" }}>New store</h2>
          <form onSubmit={createStore} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: COLORS.olive, display: "block", marginBottom: 6 }}>Store name</label>
              <input value={form.store_name}
                onChange={(e) => setForm({ store_name: e.target.value, store_slug: autoSlug(e.target.value) })}
                placeholder="e.g. Tech Haven"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid rgba(32,29,24,0.2)`, fontSize: 14, fontWeight: 700, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: COLORS.olive, display: "block", marginBottom: 6 }}>URL slug</label>
              <div style={{ display: "flex", alignItems: "center", border: `1.5px solid rgba(32,29,24,0.2)`, borderRadius: 10, overflow: "hidden" }}>
                <span style={{ padding: "10px 12px", background: COLORS.soft, fontSize: 12, color: COLORS.olive, fontWeight: 700 }}>/s/</span>
                <input value={form.store_slug}
                  onChange={(e) => setForm((f) => ({ ...f, store_slug: autoSlug(e.target.value) }))}
                  style={{ flex: 1, padding: "10px 12px", border: "none", fontSize: 14, fontWeight: 700, outline: "none" }} />
              </div>
            </div>
            {error && <p style={{ color: "#dc2626", fontSize: 13, fontWeight: 700, margin: 0 }}>{error}</p>}
            <button type="submit" disabled={saving}
              style={{ padding: "11px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, fontSize: 13, borderRadius: 10, border: "none", cursor: "pointer" }}>
              {saving ? "Creating..." : "Create store"}
            </button>
          </form>
        </Card>
      )}

      {/* Stores list */}
      {stores.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏪</div>
          <p style={{ fontWeight: 700, color: COLORS.olive }}>No stores yet. Create one to start selling.</p>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {stores.map((s) => (
            <Card key={s.store_id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontWeight: 900, fontSize: 16, color: COLORS.ink, margin: "0 0 4px" }}>{s.store_name}</p>
                  <p style={{ fontSize: 13, color: COLORS.olive, margin: "0 0 8px" }}>/s/{s.store_slug}</p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, padding: "3px 10px", borderRadius: 6,
                      background: s.store_status === "active" ? "#DCFCE7" : "#FEE2E2",
                      color: s.store_status === "active" ? "#166534" : "#991B1B" }}>
                      {s.store_status}
                    </span>
                    <span style={{ fontSize: 12, color: COLORS.olive }}>⭐ {Number(s.store_rating).toFixed(1)}</span>
                  </div>
                </div>
                <a href={`/s/${s.store_slug}`} target="_blank" rel="noreferrer"
                  style={{ padding: "8px 14px", background: COLORS.soft, color: COLORS.ink, fontWeight: 700, fontSize: 12, borderRadius: 8, textDecoration: "none" }}>
                  View store →
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}