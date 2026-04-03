// =======================================================
// FILE: src/features/auth/pages/ForgotPasswordPage.jsx
// =======================================================
import React from "react";
import { Link } from "react-router-dom";

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

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    // Wire: POST /auth/forgot-password -> password_reset_tokens (token_hash, expires_at)
    setSent(true);
    alert("Mock: reset link requested. Wire to POST /auth/forgot-password");
  };

  return (
    <div style={{ background: COLORS.bg, color: COLORS.ink }}>
      <Card>
        <div style={{ padding: 16, background: `linear-gradient(135deg, ${COLORS.soft} 0%, ${COLORS.bg} 70%)` }}>
          <div style={{ fontSize: 12, fontWeight: 1100, color: COLORS.olive, letterSpacing: 1 }}>PASSWORD</div>
          <h1 style={{ margin: "6px 0 0", fontSize: 20, fontWeight: 1200 }}>Reset request</h1>
          <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, color: "rgba(32,29,24,0.75)" }}>
            Creates a record in <b>password_reset_tokens</b>.
          </div>
        </div>

        <div style={{ padding: 16 }}>
          {!sent ? (
            <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
              <div>
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>

              <Button type="submit">Send reset link</Button>

              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <Link to="/auth/login" style={{ color: COLORS.olive, fontWeight: 1000, textDecoration: "none" }}>
                  Back to login
                </Link>
                <Link to="/" style={{ color: COLORS.ink, fontWeight: 1000, textDecoration: "none" }}>
                  Back to shop
                </Link>
              </div>
            </form>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ fontWeight: 1200 }}>Check your email</div>
              <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(32,29,24,0.75)", lineHeight: 1.6 }}>
                If an account exists, we sent a reset link. (In real app you’d redirect to your email provider.)
              </div>

              <Link to="/auth/reset-password" style={{ textDecoration: "none" }}>
                <Button>Go to reset page</Button>
              </Link>

              <Link to="/auth/login" style={{ color: COLORS.olive, fontWeight: 1000, textDecoration: "none" }}>
                Back to login
              </Link>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}


