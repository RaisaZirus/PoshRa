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

function inputStyle(extra = {}) {
  return {
    padding: "9px 14px", borderRadius: 10,
    border: "1.5px solid rgba(32,29,24,0.2)",
    fontSize: 13, fontWeight: 700, color: C.ink,
    background: C.bg, outline: "none",
    ...extra,
  };
}

export default function AdminCommissionsPage() {
  const { fetchWithAuth } = useAuth();
  const [commissions, setCommissions] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [editingId, setEditingId] = React.useState(null);
  const [editPct, setEditPct] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(null);
  const [showForm, setShowForm] = React.useState(false);
  const [newForm, setNewForm] = React.useState({ category_id: "", percentage: "" });
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, catRes] = await Promise.all([
        fetchWithAuth("/api/admin/commissions"),
        fetchWithAuth("/api/admin/categories"),
      ]);
      setCommissions(cRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  React.useEffect(() => { load(); }, [load]);

  const startEdit = (c) => {
    setEditingId(c.commission_id);
    setEditPct(String(c.percentage));
  };

  const saveEdit = async (id) => {
    setSaving(true);
    try {
      await fetchWithAuth(`/api/admin/commissions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ percentage: Number(editPct) }),
      });
      setCommissions((prev) =>
        prev.map((c) => c.commission_id === id ? { ...c, percentage: Number(editPct) } : c)
      );
      setEditingId(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this commission rule?")) return;
    setDeleting(id);
    try {
      await fetchWithAuth(`/api/admin/commissions/${id}`, { method: "DELETE" });
      setCommissions((prev) => prev.filter((c) => c.commission_id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newForm.percentage) { setError("Percentage is required."); return; }
    setCreating(true); setError("");
    try {
      const d = await fetchWithAuth("/api/admin/commissions", {
        method: "POST",
        body: JSON.stringify({
          category_id: newForm.category_id || null,
          percentage: Number(newForm.percentage),
        }),
      });
      setShowForm(false);
      setNewForm({ category_id: "", percentage: "" });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  // Find category names that already have a commission rule
  const usedCategoryIds = new Set(
    commissions.filter((c) => c.category_id).map((c) => String(c.category_id))
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: C.ink, margin: "0 0 4px" }}>Commissions</h1>
          <p style={{ fontSize: 13, color: C.olive, margin: 0, fontWeight: 700 }}>
            Set platform commission rates per category. A rule without a category applies globally.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(""); }}
          style={{
            padding: "10px 20px", background: C.primary, color: C.ink,
            fontWeight: 900, fontSize: 13, borderRadius: 10, border: "none", cursor: "pointer",
          }}
        >
          + Add Rule
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card style={{ marginBottom: 20, borderLeft: `4px solid ${C.primary}` }}>
          <h2 style={{ fontSize: 15, fontWeight: 900, color: C.ink, margin: "0 0 14px" }}>New Commission Rule</h2>
          <form onSubmit={handleCreate} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 900, color: C.olive, display: "block", marginBottom: 5, textTransform: "uppercase" }}>
                Category (optional)
              </label>
              <select
                value={newForm.category_id}
                onChange={(e) => setNewForm({ ...newForm, category_id: e.target.value })}
                style={{ ...inputStyle(), minWidth: 200 }}
              >
                <option value="">— Global (all categories) —</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id} disabled={usedCategoryIds.has(String(cat.category_id))}>
                    {cat.name}{cat.parent_name ? ` (under ${cat.parent_name})` : ""}{usedCategoryIds.has(String(cat.category_id)) ? " ✓" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 900, color: C.olive, display: "block", marginBottom: 5, textTransform: "uppercase" }}>
                Commission %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={newForm.percentage}
                onChange={(e) => setNewForm({ ...newForm, percentage: e.target.value })}
                placeholder="e.g. 8.5"
                style={{ ...inputStyle(), width: 120 }}
              />
            </div>
            {error && <p style={{ fontSize: 13, color: "#dc2626", fontWeight: 700, margin: 0, width: "100%" }}>{error}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={creating} style={{
                padding: "10px 24px", background: C.primary, color: C.ink,
                fontWeight: 900, fontSize: 13, borderRadius: 10, border: "none", cursor: creating ? "not-allowed" : "pointer",
              }}>
                {creating ? "Saving..." : "Save Rule"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{
                padding: "10px 20px", background: "transparent", color: C.olive,
                fontWeight: 900, fontSize: 13, borderRadius: 10,
                border: "1.5px solid rgba(32,29,24,0.2)", cursor: "pointer",
              }}>
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Commission Rules Table */}
      {loading ? (
        <p style={{ color: C.olive, fontWeight: 700 }}>Loading commissions...</p>
      ) : commissions.length === 0 ? (
        <Card>
          <p style={{ color: C.olive, fontWeight: 700, textAlign: "center" }}>No commission rules yet.</p>
        </Card>
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.soft }}>
                {["Category", "Slug", "Rate", "Actions"].map((h) => (
                  <th key={h} style={{
                    padding: "12px 20px", textAlign: "left",
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
              {commissions.map((c, i) => (
                <tr
                  key={c.commission_id}
                  style={{
                    background: i % 2 === 0 ? C.bg : "rgba(251,239,156,0.2)",
                    borderBottom: "1px solid rgba(32,29,24,0.06)",
                  }}
                >
                  <td style={{ padding: "14px 20px" }}>
                    {c.category_name ? (
                      <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: C.ink }}>{c.category_name}</p>
                        {/* show parent if available */}
                      </div>
                    ) : (
                      <span style={{
                        background: C.primary, color: C.ink,
                        fontWeight: 900, fontSize: 11, padding: "3px 10px", borderRadius: 999,
                      }}>
                        Global Default
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 12, color: C.olive, fontWeight: 700 }}>
                    {c.slug || "—"}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    {editingId === c.commission_id ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={editPct}
                          onChange={(e) => setEditPct(e.target.value)}
                          style={{ ...inputStyle(), width: 90 }}
                          autoFocus
                        />
                        <span style={{ fontSize: 14, fontWeight: 900, color: C.olive }}>%</span>
                        <button
                          onClick={() => saveEdit(c.commission_id)}
                          disabled={saving}
                          style={{
                            padding: "6px 14px", background: C.primary, color: C.ink,
                            fontWeight: 900, fontSize: 12, borderRadius: 8, border: "none", cursor: "pointer",
                          }}
                        >
                          {saving ? "…" : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{
                            padding: "6px 10px", background: "transparent", color: C.olive,
                            fontWeight: 800, fontSize: 12, borderRadius: 8,
                            border: "1px solid rgba(32,29,24,0.2)", cursor: "pointer",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span style={{
                        fontSize: 20, fontWeight: 900, color: C.ink,
                      }}>
                        {Number(c.percentage).toFixed(2)}
                        <span style={{ fontSize: 13, color: C.olive, fontWeight: 700 }}>%</span>
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      {editingId !== c.commission_id && (
                        <button
                          onClick={() => startEdit(c)}
                          style={{
                            padding: "6px 14px", background: C.soft, color: C.ink,
                            fontWeight: 800, fontSize: 12, borderRadius: 8, border: "none", cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(c.commission_id)}
                        disabled={deleting === c.commission_id}
                        style={{
                          padding: "6px 14px", background: "#FEE2E2", color: "#991B1B",
                          fontWeight: 800, fontSize: 12, borderRadius: 8, border: "none", cursor: "pointer",
                        }}
                      >
                        {deleting === c.commission_id ? "…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
