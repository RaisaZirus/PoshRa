import React from "react";
import { Link } from "react-router-dom";
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

function SectionTitle({ children, style }) {
  return <h2 style={{ fontSize: 15, fontWeight: 900, color: COLORS.ink, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5, ...style }}>{children}</h2>;
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
  const [editingProfile, setEditingProfile] = React.useState(false);

  // Password form
  const [pwForm, setPwForm] = React.useState({ current_password: "", new_password: "", confirm_password: "" });
  const [pwSaving, setPwSaving] = React.useState(false);
  const [pwMsg, setPwMsg] = React.useState("");
  const [pwErr, setPwErr] = React.useState("");
  const [showPwForm, setShowPwForm] = React.useState(false);

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
      setEditingProfile(false);
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) { setSaveErr(err.message); }
    finally { setSaving(false); }
  };

  const cancelProfileEdit = () => {
    setEditingProfile(false);
    setForm({ name: profile.name || "", phone: profile.phone || "" });
    setSaveMsg("");
    setSaveErr("");
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
      setShowPwForm(false);
      setTimeout(() => setPwMsg(""), 3000);
    } catch (err) { setPwErr(err.message); }
    finally { setPwSaving(false); }
  };

  const cancelPasswordChange = () => {
    setShowPwForm(false);
    setPwForm({ current_password: "", new_password: "", confirm_password: "" });
    setPwMsg("");
    setPwErr("");
  };

  if (loading) return <div style={{ color: COLORS.olive, fontWeight: 700 }}>Loading profile...</div>;
  if (!profile) return <div style={{ color: "#dc2626", fontWeight: 700 }}>Failed to load profile.</div>;

  const initials = profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const memberSince = new Date(profile.created_at).toLocaleDateString("en-BD", { month: "long", year: "numeric" });

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: "#FEF5D8", minHeight: "100vh", padding: 24 }}>
      <style>{`
        .profile-hero-title {
          position: relative;
          display: inline-flex;
          z-index: 0;
          padding: 0 0.08em;
        }

        .profile-hero-title::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, rgba(254,227,43,0.28), rgba(255,255,255,0.32), rgba(220,38,38,0.16));
          transform: skewX(-8deg);
          border-radius: 18px;
          z-index: -1;
          background-size: 200% 200%;
          animation: profileTextGlow 7s ease-in-out infinite;
        }

        @keyframes profileTextGlow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 20, alignItems: "flex-start", padding: 24, borderRadius: 24, background: "#FFF9E6", boxShadow: "0 18px 40px rgba(32,29,24,0.08)", border: "1px solid rgba(32,29,24,0.08)" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.2, color: COLORS.olive }}>Account control</p>
            <h1 className="profile-hero-title" style={{ margin: "10px 0 8px", fontSize: 32, lineHeight: 1.05, fontWeight: 900, color: COLORS.ink }}>Customer profile</h1>
            <p style={{ margin: 0, color: "rgba(32,29,24,0.72)", maxWidth: 620, fontSize: 15 }}>A modern customer dashboard with a clean admin-style presentation for quick access to your profile settings and account information.</p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 32, minHeight: 32, borderRadius: 999, background: COLORS.primary, color: COLORS.ink, fontWeight: 900 }}>C</span>
            <span style={{ fontSize: 14, fontWeight: 900, color: COLORS.olive, background: COLORS.soft, padding: "10px 16px", borderRadius: 14 }}>Customer</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card style={{ background: "#FFFFFF", border: "1px solid rgba(32,29,24,0.12)", padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: COLORS.primary, display: "grid", placeItems: "center", color: COLORS.ink, fontSize: 28, fontWeight: 900 }}>{initials}</div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: COLORS.ink }}>{profile.name}</p>
                  <p style={{ margin: "6px 0 0", fontSize: 14, color: "rgba(32,29,24,0.72)" }}>{profile.email}</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
                {[
                  { label: "Role", value: profile.role === "user" ? "Customer" : profile.role },
                  { label: "Status", value: profile.is_active ? "Active" : "Disabled" },
                  { label: "Joined", value: memberSince },
                ].map((item) => (
                  <div key={item.label} style={{ padding: 16, borderRadius: 18, background: "#FEF9E6", border: "1px solid rgba(32,29,24,0.08)" }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: COLORS.olive, textTransform: "uppercase", letterSpacing: 0.4 }}>{item.label}</p>
                    <p style={{ margin: "8px 0 0", fontSize: 16, fontWeight: 900, color: COLORS.ink }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card style={{ background: "#FFFFFF", border: "1px solid rgba(32,29,24,0.12)", padding: 24 }}>
              <SectionTitle style={{ marginBottom: 18, color: COLORS.ink }}>Personal info</SectionTitle>
              {!editingProfile ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <Label>Full name</Label>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: COLORS.ink, padding: "10px 14px", background: COLORS.soft, borderRadius: 10 }}>
                      {profile.name || "Not set"}
                    </p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: COLORS.ink, padding: "10px 14px", background: COLORS.soft, borderRadius: 10 }}>
                      {profile.email}
                    </p>
                    <p style={{ fontSize: 11, color: COLORS.olive, margin: "6px 0 0" }}>Email cannot be changed.</p>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: COLORS.ink, padding: "10px 14px", background: COLORS.soft, borderRadius: 10 }}>
                      {profile.phone || "Not set"}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingProfile(true)}
                    style={{ padding: "12px 18px", minWidth: 160, background: COLORS.primary, color: COLORS.ink, fontWeight: 900, fontSize: 14, borderRadius: 14, border: "none", cursor: "pointer", display: "inline-flex", justifyContent: "center", whiteSpace: "nowrap" }}
                  >
                    Make Changes
                  </button>
                </div>
              ) : (
                <form onSubmit={saveProfile} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div>
                    <Label>Full name</Label>
                    <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Your name" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={profile.email} disabled style={{ background: COLORS.soft, color: COLORS.olive, cursor: "not-allowed" }} />
                    <p style={{ fontSize: 11, color: COLORS.olive, margin: "6px 0 0" }}>Email cannot be changed.</p>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="01XXXXXXXXX" />
                  </div>

                  {saveMsg && <p style={{ fontSize: 13, color: "#166534", fontWeight: 700, margin: 0 }}>✓ {saveMsg}</p>}
                  {saveErr && <p style={{ fontSize: 13, color: "#dc2626", fontWeight: 700, margin: 0 }}>{saveErr}</p>}

                  <div style={{ display: "flex", gap: 12 }}>
                    <button type="submit" disabled={saving}
                      style={{ padding: "12px 18px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, fontSize: 14, borderRadius: 14, border: "none", cursor: saving ? "not-allowed" : "pointer" }}>
                      {saving ? "Saving..." : "Save changes"}
                    </button>
                    <button type="button" onClick={cancelProfileEdit}
                      style={{ padding: "12px 18px", background: "transparent", color: COLORS.olive, fontWeight: 700, fontSize: 14, borderRadius: 14, border: `1px solid ${COLORS.olive}`, cursor: "pointer" }}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </Card>

            <Card style={{ background: "#FFFFFF", border: "1px solid rgba(32,29,24,0.12)", padding: 24 }}>
              <SectionTitle style={{ marginBottom: 18, color: COLORS.ink }}>Security</SectionTitle>
              {!showPwForm ? (
                <button
                  onClick={() => setShowPwForm(true)}
                  style={{ padding: "12px 18px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, fontSize: 14, borderRadius: 14, border: "none", cursor: "pointer" }}
                >
                  Change Password
                </button>
              ) : (
                <form onSubmit={changePassword} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
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

                  <div style={{ display: "flex", gap: 12 }}>
                    <button type="submit" disabled={pwSaving}
                      style={{ padding: "12px 18px", background: COLORS.ink, color: COLORS.primary, fontWeight: 900, fontSize: 14, borderRadius: 14, border: "none", cursor: pwSaving ? "not-allowed" : "pointer" }}>
                      {pwSaving ? "Updating..." : "Change password"}
                    </button>
                    <button type="button" onClick={cancelPasswordChange}
                      style={{ padding: "12px 18px", background: "transparent", color: COLORS.olive, fontWeight: 700, fontSize: 14, borderRadius: 14, border: `1px solid ${COLORS.olive}`, cursor: "pointer" }}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </Card>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card style={{ background: "#FFF8E1", border: "1px solid rgba(32,29,24,0.12)", padding: 22 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4, color: COLORS.olive }}>Account snapshot</p>
              <h2 style={{ margin: "12px 0 8px", fontSize: 22, fontWeight: 900, color: COLORS.ink }}>Your details</h2>
              <p style={{ margin: 0, color: "rgba(32,29,24,0.72)", lineHeight: 1.65 }}>Everything you need to manage your Profile, settings, and security in one place. This layout now matches the admin/seller styling more closely.</p>
            </Card>

            <Card style={{ background: "#FFFFFF", border: "1px solid rgba(32,29,24,0.12)", padding: 24 }}>
              <SectionTitle style={{ marginBottom: 20, color: COLORS.ink }}>Account details</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Account status", value: profile.is_active ? "Active" : "Disabled", color: profile.is_active ? "#166534" : "#dc2626" },
                  { label: "Role", value: profile.role === "user" ? "Customer" : profile.role.charAt(0).toUpperCase() + profile.role.slice(1) },
                  { label: "Member since", value: memberSince },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid rgba(32,29,24,0.08)" }}>
                    <span style={{ color: "rgba(32,29,24,0.72)", fontSize: 13 }}>{item.label}</span>
                    <span style={{ fontWeight: 800, color: item.color || COLORS.ink }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}

