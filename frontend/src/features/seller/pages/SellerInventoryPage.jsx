import React from "react";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = { bg: "#FDFDF9", soft: "#FBEF9C", primary: "#FEE32B", olive: "#877928", ink: "#201D18" };

function Card({ children, style }) {
  return <div style={{ background: COLORS.bg, border: `1px solid rgba(32,29,24,0.12)`, borderRadius: 16, padding: 20, boxShadow: "0 4px 16px rgba(32,29,24,0.06)", ...style }}>{children}</div>;
}

export default function SellerInventoryPage() {
  const { fetchWithAuth } = useAuth();
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState(null);
  const [editForm, setEditForm] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    fetchWithAuth("/api/seller/inventory")
      .then((d) => setItems(d.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const startEdit = (item) => {
    setEditing(item.variant_id);
    setEditForm({ stock: item.stock, price: item.price, discount_price: item.discount_price || "" });
  };

  const saveEdit = async (variantId) => {
    setSaving(true);
    try {
      await fetchWithAuth(`/api/seller/inventory/${variantId}`, {
        method: "PATCH",
        body: JSON.stringify({
          stock: Number(editForm.stock),
          price: parseFloat(editForm.price),
          discount_price: editForm.discount_price ? parseFloat(editForm.discount_price) : null,
        }),
      });
      setItems((prev) => prev.map((i) => i.variant_id === variantId
        ? { ...i, stock: Number(editForm.stock), price: editForm.price, discount_price: editForm.discount_price || null }
        : i
      ));
      setEditing(null);
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const filtered = items.filter((i) =>
    i.product_name.toLowerCase().includes(search.toLowerCase()) ||
    i.sku.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = items.filter((i) => Number(i.stock) <= 5).length;

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: COLORS.ink, margin: "0 0 8px" }}>Inventory</h1>
      <p style={{ fontSize: 13, color: COLORS.olive, margin: "0 0 20px" }}>
        {items.length} variants · {lowStock > 0 && <span style={{ color: "#dc2626", fontWeight: 800 }}>{lowStock} low stock</span>}
      </p>

      <div style={{ marginBottom: 16 }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by product or SKU..."
          style={{ padding: "10px 14px", borderRadius: 10, border: `1.5px solid rgba(32,29,24,0.2)`, fontSize: 14, width: "100%", maxWidth: 360, boxSizing: "border-box" }} />
      </div>

      {loading ? <p style={{ color: COLORS.olive, fontWeight: 700 }}>Loading...</p> : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: COLORS.soft }}>
                {["Product", "SKU", "Price", "Discount", "Stock", ""].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 900, color: COLORS.olive, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.variant_id} style={{ borderTop: `1px solid rgba(32,29,24,0.08)` }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <img src={item.image_url || "https://via.placeholder.com/36?text=?"} alt=""
                        style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                      <div>
                        <p style={{ fontWeight: 800, fontSize: 13, color: COLORS.ink, margin: 0 }}>{item.product_name}</p>
                        <p style={{ fontSize: 11, color: COLORS.olive, margin: 0 }}>{item.store_name}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, fontFamily: "monospace", color: COLORS.olive }}>{item.sku}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {editing === item.variant_id ? (
                      <input type="number" value={editForm.price} onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                        style={{ width: 80, padding: "6px 8px", borderRadius: 8, border: `1px solid rgba(32,29,24,0.2)`, fontSize: 13 }} />
                    ) : (
                      <span style={{ fontWeight: 700, fontSize: 13 }}>₹{Number(item.price).toLocaleString("en-IN")}</span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {editing === item.variant_id ? (
                      <input type="number" value={editForm.discount_price} onChange={(e) => setEditForm((f) => ({ ...f, discount_price: e.target.value }))}
                        placeholder="—" style={{ width: 80, padding: "6px 8px", borderRadius: 8, border: `1px solid rgba(32,29,24,0.2)`, fontSize: 13 }} />
                    ) : (
                      <span style={{ fontSize: 13, color: item.discount_price ? "#16a34a" : COLORS.olive }}>
                        {item.discount_price ? `₹${Number(item.discount_price).toLocaleString("en-IN")}` : "—"}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {editing === item.variant_id ? (
                      <input type="number" value={editForm.stock} onChange={(e) => setEditForm((f) => ({ ...f, stock: e.target.value }))}
                        style={{ width: 70, padding: "6px 8px", borderRadius: 8, border: `1px solid rgba(32,29,24,0.2)`, fontSize: 13 }} />
                    ) : (
                      <span style={{
                        fontWeight: 800, fontSize: 13,
                        color: Number(item.stock) <= 0 ? "#dc2626" : Number(item.stock) <= 5 ? "#d97706" : "#166534",
                      }}>
                        {item.stock}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {editing === item.variant_id ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => saveEdit(item.variant_id)} disabled={saving}
                          style={{ padding: "6px 12px", background: COLORS.primary, color: COLORS.ink, fontWeight: 800, fontSize: 12, borderRadius: 8, border: "none", cursor: "pointer" }}>
                          Save
                        </button>
                        <button onClick={() => setEditing(null)}
                          style={{ padding: "6px 10px", background: "transparent", border: `1px solid ${COLORS.olive}`, color: COLORS.olive, fontWeight: 700, fontSize: 12, borderRadius: 8, cursor: "pointer" }}>
                          ×
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(item)}
                        style={{ padding: "6px 12px", background: COLORS.soft, color: COLORS.ink, fontWeight: 700, fontSize: 12, borderRadius: 8, border: "none", cursor: "pointer" }}>
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: COLORS.olive }}>No items found.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}