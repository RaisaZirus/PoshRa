import React from "react";
import { useAuth } from "../../../auth/useAuth.jsx";

const C = {
  bg: "#FDFDF9", soft: "#FBEF9C", primary: "#FEE32B",
  olive: "#877928", ink: "#201D18", red: "#dc2626",
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

export default function AdminCategoriesPage() {
  const { fetchWithAuth } = useAuth();
  const [categories, setCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [toast, setToast] = React.useState(null);

  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [parentId, setParentId] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const autoSlug = (n) => n.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchWithAuth("/api/admin/categories");
      setCategories(d.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  React.useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    setSaving(true);
    try {
      const d = await fetchWithAuth("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim(), parent_id: parentId || null }),
      });
      if (d.success) {
        showToast("Category created.");
        setName(""); setSlug(""); setParentId("");
        load();
      } else {
        showToast(d.message || "Failed.", false);
      }
    } catch (err) {
      showToast(err.message || "Error.", false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (categoryId, categoryName) => {
    if (!confirm(`Delete "${categoryName}"? Subcategories will also be removed.`)) return;
    try {
      const d = await fetchWithAuth(`/api/admin/categories/${categoryId}`, { method: "DELETE" });
      if (d.success) { showToast("Category deleted."); load(); }
      else showToast(d.message || "Failed.", false);
    } catch (err) {
      showToast(err.message || "Error.", false);
    }
  };

  // Build tree for display
  const roots = categories.filter((c) => !c.parent_id);
  const children = (parentId) => categories.filter((c) => String(c.parent_id) === String(parentId));
  // Only top-level categories available as parents (no nesting beyond 2 levels)
  const parentOptions = categories.filter((c) => !c.parent_id);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: C.ink }}>
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: toast.ok ? "#16a34a" : C.red,
          color: "#fff", padding: "12px 20px", borderRadius: 12,
          fontWeight: 700, fontSize: 13,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Categories</h1>
        <p style={{ fontSize: 13, color: C.olive, margin: "4px 0 0" }}>
          Manage top-level categories and subcategories.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 20, alignItems: "start" }}>

        {/* Create form */}
        <Card>
          <h2 style={{ fontSize: 15, fontWeight: 900, margin: "0 0 16px" }}>New category</h2>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.olive, display: "block", marginBottom: 4 }}>NAME</label>
              <input
                value={name}
                onChange={(e) => { setName(e.target.value); setSlug(autoSlug(e.target.value)); }}
                placeholder="e.g. Electronics"
                required
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 8,
                  border: "1px solid rgba(32,29,24,0.2)", fontSize: 13, boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.olive, display: "block", marginBottom: 4 }}>SLUG</label>
              <input
                value={slug}
                onChange={(e) => setSlug(autoSlug(e.target.value))}
                placeholder="e.g. electronics"
                required
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 8,
                  border: "1px solid rgba(32,29,24,0.2)", fontSize: 13, boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.olive, display: "block", marginBottom: 4 }}>PARENT (optional)</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 8,
                  border: "1px solid rgba(32,29,24,0.2)", fontSize: 13, boxSizing: "border-box",
                }}
              >
                <option value="">— Top-level category —</option>
                {parentOptions.map((c) => (
                  <option key={c.category_id} value={c.category_id}>{c.name}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "10px", background: C.primary, color: C.ink,
                fontWeight: 900, fontSize: 13, borderRadius: 10,
                border: "none", cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "Creating..." : "Create category"}
            </button>
          </form>
        </Card>

        {/* Category tree */}
        <Card>
          <h2 style={{ fontSize: 15, fontWeight: 900, margin: "0 0 16px" }}>
            All categories
            <span style={{ fontSize: 12, fontWeight: 400, color: C.olive, marginLeft: 8 }}>
              {categories.length} total
            </span>
          </h2>

          {loading ? (
            <p style={{ color: C.olive, fontSize: 13 }}>Loading...</p>
          ) : roots.length === 0 ? (
            <p style={{ color: C.olive, fontSize: 13 }}>No categories yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {roots.map((root) => (
                <div key={root.category_id}>
                  {/* Root category row */}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 12px", borderRadius: 10,
                    background: C.soft,
                  }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: 13 }}>{root.name}</span>
                      <span style={{ fontSize: 11, color: C.olive, marginLeft: 8 }}>/{root.slug}</span>
                    </div>
                    <button
                      onClick={() => handleDelete(root.category_id, root.name)}
                      style={{
                        padding: "4px 10px", borderRadius: 6, border: "none",
                        background: "#FEE2E2", color: C.red,
                        fontSize: 11, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>

                  {/* Subcategory rows */}
                  {children(root.category_id).map((sub) => (
                    <div key={sub.category_id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 12px 8px 28px", borderRadius: 10,
                      marginTop: 2,
                      background: "rgba(32,29,24,0.03)",
                    }}>
                      <div>
                        <span style={{ fontSize: 12, color: C.olive, marginRight: 6 }}>└</span>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{sub.name}</span>
                        <span style={{ fontSize: 11, color: C.olive, marginLeft: 8 }}>/{sub.slug}</span>
                      </div>
                      <button
                        onClick={() => handleDelete(sub.category_id, sub.name)}
                        style={{
                          padding: "4px 10px", borderRadius: 6, border: "none",
                          background: "#FEE2E2", color: C.red,
                          fontSize: 11, fontWeight: 700, cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}