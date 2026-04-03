import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = { bg: "#FDFDF9", soft: "#FBEF9C", primary: "#FEE32B", olive: "#877928", ink: "#201D18" };

export default function SellerProductsPage() {
  const { fetchWithAuth } = useAuth();
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [campaigns, setCampaigns] = React.useState([]);
  const [campaignMemberships, setCampaignMemberships] = React.useState({});
  const [campaignForm, setCampaignForm] = React.useState(null);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [pRes, cRes, cpRes] = await Promise.all([
          fetchWithAuth("/api/seller/products"),
          fetchWithAuth("/api/seller/campaigns/active"),
          fetchWithAuth("/api/seller/campaigns/products"),
        ]);

        setProducts(pRes.data || []);
        setCampaigns(cRes.data || []);

        const memberships = {};
        (cpRes.data || []).forEach((row) => {
          const pid = row.product_id;
          if (!memberships[pid]) memberships[pid] = [];
          memberships[pid].push(row);
        });
        setCampaignMemberships(memberships);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openCampaignForm = (product) => {
    if (!campaigns.length) {
      alert("No active campaigns available.");
      return;
    }

    setCampaignForm({
      product_id: product.product_id,
      campaign_id: String(campaigns[0]?.campaign_id || ""),
      discount: "",
    });
  };

  const closeCampaignForm = () => setCampaignForm(null);

  const submitCampaignForm = async () => {
    if (!campaignForm) return;

    const selected = campaigns.find((c) => String(c.campaign_id) === String(campaignForm.campaign_id));
    if (!selected) {
      alert("Please choose a valid campaign.");
      return;
    }

    try {
      const detailRes = await fetchWithAuth(`/api/seller/products/${campaignForm.product_id}`);
      const variants = detailRes.data?.variants || [];
      if (!variants.length) {
        alert("Product has no variants");
        return;
      }
      const variantId = variants[0].variant_id;
      const body = { variant_id: variantId };
      if (campaignForm.discount.trim()) {
        body.discount_price = Number(campaignForm.discount);
      }

      await fetchWithAuth(`/api/seller/campaigns/${selected.campaign_id}/products`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      alert("Product added to campaign.");
      closeCampaignForm();

      const cpRes = await fetchWithAuth("/api/seller/campaigns/products");
      const memberships = {};
      (cpRes.data || []).forEach((row) => {
        const pid = row.product_id;
        if (!memberships[pid]) memberships[pid] = [];
        memberships[pid].push(row);
      });
      setCampaignMemberships(memberships);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to add product to campaign");
    }
  };

  const removeFromCampaign = async (product) => {
    const productCampaigns = campaignMemberships[product.product_id] || [];

    if (!productCampaigns.length) {
      alert("This product is not in any active campaign.");
      return;
    }

    let selected = productCampaigns[0];
    if (productCampaigns.length > 1) {
      const choices = productCampaigns
        .map((row) => `${row.campaign_id}: ${row.campaign_name}`)
        .join("\n");
      const campaignId = window.prompt(`Select campaign to remove from:\n${choices}`);
      if (!campaignId) return;
      selected = productCampaigns.find((row) => String(row.campaign_id) === String(campaignId));
      if (!selected) {
        alert("Invalid campaign ID");
        return;
      }
    }

    try {
      await fetchWithAuth(`/api/seller/campaigns/${selected.campaign_id}/products/${selected.variant_id}`, {
        method: "DELETE",
      });
      alert("Product removed from campaign.");

      const updated = { ...campaignMemberships };
      updated[product.product_id] = updated[product.product_id].filter(
        (row) => !(row.campaign_id === selected.campaign_id && row.variant_id === selected.variant_id)
      );
      if (!updated[product.product_id].length) delete updated[product.product_id];
      setCampaignMemberships(updated);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to remove product from campaign");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: COLORS.ink, margin: 0 }}>Products</h1>
        <Link to="/seller/products/new"
          style={{ padding: "10px 20px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, fontSize: 13, borderRadius: 10, textDecoration: "none" }}>
          + Add product
        </Link>
      </div>

      {loading ? (
        <p style={{ color: COLORS.olive, fontWeight: 700 }}>Loading...</p>
      ) : products.length === 0 ? (
        <div style={{ background: COLORS.bg, borderRadius: 16, padding: 48, textAlign: "center", border: `1px solid rgba(32,29,24,0.1)` }}>
          <p style={{ fontWeight: 700, color: COLORS.ink, marginBottom: 16 }}>No products yet</p>
          <Link to="/seller/products/new"
            style={{ padding: "10px 20px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, fontSize: 13, borderRadius: 10, textDecoration: "none" }}>
            Add your first product
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {products.map((p) => (
            <div key={p.product_id} style={{ background: COLORS.bg, border: `1px solid rgba(32,29,24,0.1)`, borderRadius: 14, padding: "14px 18px", display: "flex", gap: 14, alignItems: "center" }}>
              <img src={p.image_url || "https://via.placeholder.com/56?text=?"} alt={p.name}
                style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0, background: COLORS.soft }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 900, fontSize: 14, color: COLORS.ink, margin: "0 0 3px" }}>{p.name}</p>
                <p style={{ fontSize: 12, color: COLORS.olive, margin: 0 }}>
                  {p.brand && `${p.brand} · `}{p.variant_count} variant{p.variant_count !== 1 ? "s" : ""} · {p.total_stock} in stock
                </p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontWeight: 900, fontSize: 14, color: COLORS.ink, margin: "0 0 4px" }}>
                  from ৳{Number(p.min_price).toLocaleString("en-BD")}
                </p>
                <span style={{
                  fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 6,
                  background: p.status === "active" ? "#DCFCE7" : "#FEE2E2",
                  color: p.status === "active" ? "#166534" : "#991B1B",
                }}>
                  {p.status}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
                <button onClick={() => openCampaignForm(p)} style={{
                  padding: "8px 14px", background: "#fef08a", color: "#525252", fontWeight: 700, fontSize: 12,
                  borderRadius: 8, border: "1px solid rgba(32,29,24,0.15)", cursor: "pointer"
                }}>
                  Add to campaign
                </button>
                {Array.isArray(campaignMemberships[p.product_id]) && campaignMemberships[p.product_id].length > 0 && (
                  <button onClick={() => removeFromCampaign(p)} style={{
                    padding: "8px 14px", background: "#fee2e2", color: "#991b1b", fontWeight: 700, fontSize: 12,
                    borderRadius: 8, border: "1px solid rgba(32,29,24,0.15)", cursor: "pointer"
                  }}>
                    Remove from campaign
                  </button>
                )}
                <Link to={`/seller/products/${p.product_id}`} 
                  style={{ padding: "8px 14px", background: COLORS.soft, color: COLORS.ink, fontWeight: 700, fontSize: 12, borderRadius: 8, textDecoration: "none" }}>
                  Edit
                </Link>
              </div>
              {campaignForm?.product_id === p.product_id && (
                <div style={{ marginTop: 12, padding: 14, background: "#fff9db", borderRadius: 12, border: "1px solid rgba(32,29,24,0.08)", width: "100%" }}>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <label style={{ display: "flex", flexDirection: "column", fontSize: 12, color: COLORS.ink, fontWeight: 700 }}>
                      Campaign
                      <select
                        value={campaignForm.campaign_id}
                        onChange={(event) => setCampaignForm({ ...campaignForm, campaign_id: event.target.value })}
                        style={{ marginTop: 6, padding: 8, borderRadius: 8, border: "1px solid rgba(32,29,24,0.15)", minWidth: 220 }}
                      >
                        {campaigns.map((campaign) => (
                          <option key={campaign.campaign_id} value={campaign.campaign_id}>
                            {campaign.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", fontSize: 12, color: COLORS.ink, fontWeight: 700 }}>
                      Campaign discount price
                      <input
                        type="number"
                        min="0"
                        placeholder="Leave blank to keep price"
                        value={campaignForm.discount}
                        onChange={(event) => setCampaignForm({ ...campaignForm, discount: event.target.value })}
                        style={{ marginTop: 6, padding: 8, borderRadius: 8, border: "1px solid rgba(32,29,24,0.15)", minWidth: 220 }}
                      />
                    </label>

                    <button onClick={submitCampaignForm} style={{ padding: "10px 16px", background: "#22c55e", color: "white", fontWeight: 700, borderRadius: 10, border: "none", cursor: "pointer" }}>
                      Confirm add
                    </button>
                    <button onClick={closeCampaignForm} style={{ padding: "10px 16px", background: "#f3f4f6", color: COLORS.ink, fontWeight: 700, borderRadius: 10, border: "1px solid rgba(32,29,24,0.15)", cursor: "pointer" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

