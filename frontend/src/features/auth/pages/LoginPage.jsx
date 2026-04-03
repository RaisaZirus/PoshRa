// =======================================================
// FILE: src/features/auth/pages/LoginPage.jsx
// =======================================================
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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

function TopBrand() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          background: COLORS.primary,
          border: `2px solid ${COLORS.ink}`,
          display: "grid",
          placeItems: "center",
          fontWeight: 1200,
        }}
      >
        PR
      </div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 1200, color: COLORS.ink }}>PoshRa</div>
        <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(32,29,24,0.7)" }}>Sign in to continue</div>
      </div>
    </div>
  );
}

function roleHome(role) {
  if (role === "admin") return "/admin/dashboard";
  if (role === "seller") return "/seller/dashboard";
  return "/"; // role "user"
}

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  // where user wanted to go before login
  const from = location.state?.from?.pathname || null;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = await login({ email, password });
      const role = data?.user?.role;

      // If they were trying to access some protected route, send them there,
      // otherwise send to role home.
      const target = from && !from.startsWith("/auth") ? from : roleHome(role);
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <div style={{ background: COLORS.bg, color: COLORS.ink }}>
      <Card>
        <div style={{ padding: 16, background: `linear-gradient(135deg, ${COLORS.soft} 0%, ${COLORS.bg} 70%)` }}>
          <TopBrand />
        </div>

        <div style={{ padding: 16 }}>
          <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
            {error && (
              <div style={{ padding: 12, borderRadius: 14, border: `1px solid rgba(32,29,24,0.12)`, background: "#fff", fontSize: 12, fontWeight: 900 }}>
                ❌ {error}
              </div>
            )}

            <div>
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>

            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <Link to="/auth/forgot-password" style={{ color: COLORS.olive, fontWeight: 1000, textDecoration: "none" }}>
                Forgot password?
              </Link>
              <Link to="/auth/register" style={{ color: COLORS.ink, fontWeight: 1000, textDecoration: "none" }}>
                Create account
              </Link>
            </div>

            <div style={{ marginTop: 6, padding: 12, borderRadius: 14, border: `1px solid rgba(32,29,24,0.12)`, background: COLORS.bg }}>
              <div style={{ fontSize: 12, fontWeight: 1000 }}>Demo tips</div>
              <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, color: "rgba(32,29,24,0.75)", lineHeight: 1.5 }}>
                (Now real login) Use a real registered account. Admin accounts should be created manually in DB.
              </div>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

