// =======================================================
// FILE: src/features/auth/pages/RegisterPage.jsx
// =======================================================
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = {
  bg: "#FDFDF9",
  soft: "#FBEF9C",
  primary: "#FEE32B",
  olive: "#877928",
  ink: "#201D18",
};

function Card({ children, style }) {
  return (
    <div
      style={{
        background: COLORS.bg,
        border: `1px solid rgba(32,29,24,0.12)`,
        borderRadius: 18,
        boxShadow: "0 14px 34px rgba(32,29,24,0.08)",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Button({ children, variant = "primary", style, ...props }) {
  const primary = variant === "primary";
  return (
    <button
      {...props}
      style={{
        cursor: "pointer",
        width: "100%",
        borderRadius: 14,
        padding: "10px 12px",
        fontWeight: 1100,
        border: `1px solid ${COLORS.ink}`,
        background: primary ? COLORS.primary : COLORS.bg,
        color: COLORS.ink,
        boxShadow: primary ? "0 10px 24px rgba(32,29,24,0.12)" : "none",
        opacity: props.disabled ? 0.7 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        borderRadius: 14,
        padding: "10px 12px",
        border: `1px solid rgba(32,29,24,0.18)`,
        outline: "none",
        background: COLORS.bg,
        color: COLORS.ink,
        fontWeight: 900,
      }}
    />
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 1000, color: "rgba(32,29,24,0.72)", marginBottom: 6 }}>{children}</div>;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState("user"); // customer
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Name: 2–50 characters
    if (!name.trim() || name.trim().length < 2) {
      setError("Name must be at least 2 characters."); return;
    }
    if (name.trim().length > 50) {
      setError("Name must be 50 characters or less."); return;
    }

    // Email: valid format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError("Please enter a valid email address."); return;
    }

    // Phone: valid Bangladeshi number if provided
    if (phone.trim()) {
      const bdPhone = /^(?:\+8801|8801|01)[3-9]\d{8}$/;
      if (!bdPhone.test(phone.trim().replace(/\s|-/g, ""))) {
        setError("Enter a valid Bangladeshi phone number (e.g. 01XXXXXXXXX)."); return;
      }
    }

    // Password: minimum 6 characters
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters."); return;
    }

    setSubmitting(true);
    try {
      const data = await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        password,
        role, // "user" or "seller"
      });

      const r = data?.user?.role;
      if (r === "seller") navigate("/seller/dashboard", { replace: true });
      else navigate("/", { replace: true }); // role user
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: COLORS.bg, color: COLORS.ink }}>
      <Card>
        <div style={{ padding: 16, background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.soft} 55%, ${COLORS.bg} 100%)` }}>
          <div style={{ fontSize: 12, fontWeight: 1100, color: COLORS.olive, letterSpacing: 1 }}>POSHRA</div>
          <h1 style={{ margin: "6px 0 0", fontSize: 20, fontWeight: 1200 }}>Create your account</h1>
          <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, color: "rgba(32,29,24,0.75)" }}>
            Join thousands of shoppers and sellers
          </div>
        </div>

        <div style={{ padding: 16 }}>
          <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
            {error && (
              <div style={{ padding: 12, borderRadius: 14, border: `1px solid rgba(32,29,24,0.12)`, background: "#fff", fontSize: 12, fontWeight: 900 }}>
                 {error}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div>
                <Label>Role</Label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: "100%",
                    borderRadius: 14,
                    padding: "10px 12px",
                    border: `1px solid rgba(32,29,24,0.18)`,
                    outline: "none",
                    background: COLORS.bg,
                    color: COLORS.ink,
                    fontWeight: 900,
                  }}
                >
                  <option value="user">Customer</option>
                  <option value="seller">Seller</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>

            <div>
              <Label>Phone (optional)</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
            </div>

            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>

            <Button type="submit" disabled={submitting || loading}>
              {submitting || loading ? "Creating..." : "Create account"}
            </Button>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <Link to="/auth/login" style={{ color: COLORS.olive, fontWeight: 1000, textDecoration: "none" }}>
                Already have an account?
              </Link>
              <Link to="/" style={{ color: COLORS.ink, fontWeight: 1000, textDecoration: "none" }}>
                Back to shop
              </Link>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}