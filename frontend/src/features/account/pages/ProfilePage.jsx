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

function SectionTitle({ children }) {
  return <h2 style={{ fontSize: 15, fontWeight: 900, color: COLORS.ink, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>{children}</h2>;
}

export default function ProfilePage() {
  const { fetchWithAuth, user: authUser, login } = useAuth();

  const [profile, setProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  // Profile edit form
  const [form, setForm] = React.useState({ name: "", phone: "" });
  const [saving, setSaving] = React.useState(false);
  const [saveMsg, setSaveMsg] = React.useState("");
  const [saveErr, setSaveErr] = React.useState("");

  // Password form
  const [pwForm, setPwForm] = React.useState({ current_password: "", new_password: "", confirm_password: "" });
  const [pwSaving, setPwSaving] = React.useState(false);
  const [pwMsg, setPwMsg] = React.useState("");
  const [pwErr, setPwErr] = React.useState("");

  React.useEffect(() => {
    fetchWithAuth("/api/auth/me")
      .then((d) => {
        setProfile(d.data);
        setForm({ name: d.data.name || "", phone: d.data.phone || "" });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true); setSaveMsg(""); setSaveErr("");
    try {
      const data = await fetchWithAuth("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ name: form.name, phone: form.phone }),
      });
      setProfile(data.data);
      setSaveMsg("Profile updated successfully");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) { setSaveErr(err.message); }
    finally { setSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwErr(""); setPwMsg("");
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwErr("New passwords do not match"); return;
    }
    if (pwForm.new_password.length < 6) {
      setPwErr("Password must be at least 6 characters"); return;
    }
    setPwSaving(true);
    try {
      await fetchWithAuth("/api/auth/change-password", {
        method: "PATCH",
        body: JSON.stringify({ current_password: pwForm.current_password, new_password: pwForm.new_password }),
      });
      setPwMsg("Password changed successfully");
      setPwForm({ current_password: "", new_password: "", confirm_password: "" });
      setTimeout(() => setPwMsg(""), 3000);
    } catch (err) { setPwErr(err.message); }
    finally { setPwSaving(false); }
  };

  if (loading) return <div style={{ color: COLORS.olive, fontWeight: 700 }}>Loading profile...</div>;
  if (!profile) return <div style={{ color: "#dc2626", fontWeight: 700 }}>Failed to load profile.</div>;

  const initials = profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const memberSince = new Date(profile.created_at).toLocaleDateString("en-BD", { month: "long", year: "numeric" });

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Avatar + summary */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: COLORS.primary, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 22, fontWeight: 900, color: COLORS.ink,
          flexShrink: 0,
        }}>
          {initials}
        </div>
        <div>
          <p style={{ fontSize: 20, fontWeight: 900, color: COLORS.ink, margin: "0 0 4px" }}>{profile.name}</p>
          <p style={{ fontSize: 13, color: COLORS.olive, margin: "0 0 4px" }}>{profile.email}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 6,
              background: COLORS.soft, color: COLORS.olive, textTransform: "capitalize",
            }}>
              {profile.role === "user" ? "Customer" : profile.role}
            </span>
            <span style={{ fontSize: 11, color: COLORS.olive }}>Member since {memberSince}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Edit profile */}
        <Card>
          <SectionTitle>Personal info</SectionTitle>
          <form onSubmit={saveProfile} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <Label>Full name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Your name" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={profile.email} disabled style={{ background: COLORS.soft, color: COLORS.olive, cursor: "not-allowed" }} />
              <p style={{ fontSize: 11, color: COLORS.olive, margin: "4px 0 0" }}>Email cannot be changed.</p>
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="01XXXXXXXXX" />
            </div>

            {saveMsg && <p style={{ fontSize: 13, color: "#166534", fontWeight: 700, margin: 0 }}>✓ {saveMsg}</p>}
            {saveErr && <p style={{ fontSize: 13, color: "#dc2626", fontWeight: 700, margin: 0 }}>{saveErr}</p>}

            <button type="submit" disabled={saving}
              style={{ padding: "11px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, fontSize: 14, borderRadius: 10, border: "none", cursor: saving ? "not-allowed" : "pointer", alignSelf: "flex-start", minWidth: 140 }}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        </Card>

        {/* Change password */}
        <Card>
          <SectionTitle>Change password</SectionTitle>
          <form onSubmit={changePassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <Label>Current password</Label>
              <Input type="password" value={pwForm.current_password}
                onChange={(e) => setPwForm((f) => ({ ...f, current_password: e.target.value }))}
                placeholder="••••••••" />
            </div>
            <div>
              <Label>New password</Label>
              <Input type="password" value={pwForm.new_password}
                onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))}
                placeholder="••••••••" />
            </div>
            <div>
              <Label>Confirm new password</Label>
              <Input type="password" value={pwForm.confirm_password}
                onChange={(e) => setPwForm((f) => ({ ...f, confirm_password: e.target.value }))}
                placeholder="••••••••" />
            </div>

            {pwMsg && <p style={{ fontSize: 13, color: "#166534", fontWeight: 700, margin: 0 }}>✓ {pwMsg}</p>}
            {pwErr && <p style={{ fontSize: 13, color: "#dc2626", fontWeight: 700, margin: 0 }}>{pwErr}</p>}

            <button type="submit" disabled={pwSaving}
              style={{ padding: "11px", background: COLORS.ink, color: COLORS.primary, fontWeight: 900, fontSize: 14, borderRadius: 10, border: "none", cursor: pwSaving ? "not-allowed" : "pointer", alignSelf: "flex-start", minWidth: 160 }}>
              {pwSaving ? "Updating..." : "Change password"}
            </button>
          </form>
        </Card>

        {/* Account info */}
        <Card>
          <SectionTitle>Account details</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Account status", value: profile.is_active ? "Active" : "Disabled", color: profile.is_active ? "#166534" : "#dc2626" },
              { label: "Role", value: profile.role === "user" ? "Customer" : profile.role.charAt(0).toUpperCase() + profile.role.slice(1) },
              { label: "Member since", value: memberSince },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 0", borderBottom: `1px solid rgba(32,29,24,0.08)` }}>
                <span style={{ color: COLORS.olive }}>{item.label}</span>
                <span style={{ fontWeight: 700, color: item.color || COLORS.ink }}>{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

