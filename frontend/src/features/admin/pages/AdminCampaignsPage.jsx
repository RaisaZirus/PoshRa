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
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1.5px solid rgba(32,29,24,0.2)",
    fontSize: 13, fontWeight: 700, color: C.ink,
    background: C.bg, outline: "none", boxSizing: "border-box",
    ...extra,
  };
}

const EMPTY = { name: "", start_time: "", end_time: "" };

function CampaignStatus({ start, end }) {
  const now = new Date();
  const s = new Date(start);
  const e = new Date(end);
  if (now < s) return <span style={{ background: "#DBEAFE", color: "#1E40AF", fontWeight: 800, fontSize: 11, padding: "3px 9px", borderRadius: 999 }}>Upcoming</span>;
  if (now > e) return <span style={{ background: "#F1F5F9", color: "#475569", fontWeight: 800, fontSize: 11, padding: "3px 9px", borderRadius: 999 }}>Ended</span>;
  return <span style={{ background: "#DCFCE7", color: "#166534", fontWeight: 800, fontSize: 11, padding: "3px 9px", borderRadius: 999 }}>Live</span>;
}

export default function AdminCampaignsPage() {
  const { fetchWithAuth } = useAuth();
  const [campaigns, setCampaigns] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState(null); // campaign object or null
  const [form, setForm] = React.useState(EMPTY);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(null);
  const [error, setError] = React.useState("");

  const loadCampaigns = React.useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchWithAuth("/api/admin/campaigns");
      setCampaigns(d.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  React.useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.name,
      start_time: c.start_time?.slice(0, 16) || "",
      end_time: c.end_time?.slice(0, 16) || "",
    });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.start_time || !form.end_time) {
      setError("All fields are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await fetchWithAuth(`/api/admin/campaigns/${editing.campaign_id}`, {
          method: "PATCH",
          body: JSON.stringify(form),
        });
      } else {
        await fetchWithAuth("/api/admin/campaigns", {
          method: "POST",
          body: JSON.stringify(form),
        });
      }
      setShowForm(false);
      loadCampaigns();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this campaign?")) return;
    setDeleting(id);
    try {
      await fetchWithAuth(`/api/admin/campaigns/${id}`, { method: "DELETE" });
      setCampaigns((prev) => prev.filter((c) => c.campaign_id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const fmtDt = (dt) => dt ? new Date(dt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: C.ink, margin: 0 }}>Campaigns</h1>
        <button
          onClick={openCreate}
          style={{
            padding: "10px 20px", background: C.primary, color: C.ink,
            fontWeight: 900, fontSize: 13, borderRadius: 10, border: "none", cursor: "pointer",
          }}
        >
          + New Campaign
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <Card style={{ marginBottom: 20, borderLeft: `4px solid ${C.primary}` }}>
          <h2 style={{ fontSize: 16, fontWeight: 900, color: C.ink, margin: "0 0 16px" }}>
            {editing ? "Edit Campaign" : "Create Campaign"}
          </h2>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 900, color: C.olive, display: "block", marginBottom: 5, textTransform: "uppercase" }}>
                Campaign Name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Eid Mega Sale"
                style={inputStyle()}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 900, color: C.olive, display: "block", marginBottom: 5, textTransform: "uppercase" }}>
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  style={inputStyle()}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 900, color: C.olive, display: "block", marginBottom: 5, textTransform: "uppercase" }}>
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  style={inputStyle()}
                />
              </div>
            </div>
            {error && <p style={{ fontSize: 13, color: "#dc2626", fontWeight: 700, margin: 0 }}>{error}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={saving} style={{
                padding: "10px 24px", background: C.primary, color: C.ink,
                fontWeight: 900, fontSize: 13, borderRadius: 10, border: "none", cursor: saving ? "not-allowed" : "pointer",
              }}>
                {saving ? "Saving..." : editing ? "Save Changes" : "Create"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{
                padding: "10px 20px", background: "transparent", color: C.olive,
                fontWeight: 900, fontSize: 13, borderRadius: 10, border: `1.5px solid rgba(32,29,24,0.2)`, cursor: "pointer",
              }}>
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* List */}
      {loading ? (
        <p style={{ color: C.olive, fontWeight: 700 }}>Loading campaigns...</p>
      ) : campaigns.length === 0 ? (
        <Card>
          <p style={{ color: C.olive, fontWeight: 700, textAlign: "center" }}>No campaigns yet. Create your first one!</p>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {campaigns.map((c) => (
            <Card key={c.campaign_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <p style={{ fontSize: 15, fontWeight: 900, color: C.ink, margin: 0 }}>{c.name}</p>
                  <CampaignStatus start={c.start_time} end={c.end_time} />
                </div>
                <p style={{ fontSize: 12, color: C.olive, margin: 0, fontWeight: 700 }}>
                  {fmtDt(c.start_time)} → {fmtDt(c.end_time)}
                  &nbsp;·&nbsp;
                  <span style={{ color: C.ink }}>{c.product_count} product{c.product_count !== 1 ? "s" : ""}</span>
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => openEdit(c)}
                  style={{
                    padding: "7px 16px", borderRadius: 8,
                    background: C.soft, color: C.ink,
                    fontWeight: 800, fontSize: 12, border: "none", cursor: "pointer",
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(c.campaign_id)}
                  disabled={deleting === c.campaign_id}
                  style={{
                    padding: "7px 16px", borderRadius: 8,
                    background: "#FEE2E2", color: "#991B1B",
                    fontWeight: 800, fontSize: 12, border: "none", cursor: "pointer",
                  }}
                >
                  {deleting === c.campaign_id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
