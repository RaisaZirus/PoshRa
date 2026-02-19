// =======================================================
// FILE: src/features/auth/pages/ResetPasswordPage.jsx
// =======================================================
import React from "react";
import { Link, useSearchParams } from "react-router-dom";

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

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [done, setDone] = React.useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    if (password.length < 6) return alert("Password should be at least 6 characters.");
    if (password !== confirm) return alert("Passwords do not match.");

    // Wire: POST /auth/reset-password with token -> validate password_reset_tokens.token_hash, set used_at, update users.password_hash
    setDone(true);
    alert("Mock: password reset complete. Wire to POST /auth/reset-password");
  };

  return (
    <div style={{ background: COLORS.bg, color: COLORS.ink }}>
      <Card>
        <div style={{ padding: 16, background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.soft} 55%, ${COLORS.bg} 100%)` }}>
          <div style={{ fontSize: 12, fontWeight: 1100, color: COLORS.olive, letterSpacing: 1 }}>PASSWORD</div>
          <h1 style={{ margin: "6px 0 0", fontSize: 20, fontWeight: 1200 }}>Set a new password</h1>
          <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, color: "rgba(32,29,24,0.75)" }}>
            Uses <b>password_reset_tokens</b> (expires_at, used_at).
          </div>
        </div>

        <div style={{ padding: 16 }}>
          {!done ? (
            <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
              <div style={{ padding: 12, borderRadius: 14, border: `1px solid rgba(32,29,24,0.12)`, background: COLORS.bg }}>
                <div style={{ fontSize: 12, fontWeight: 1000 }}>Token</div>
                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, color: "rgba(32,29,24,0.7)", wordBreak: "break-all" }}>
                  {token ? token : "(No token in URL. Example: /auth/reset-password?token=abc123)"}
                </div>
              </div>

              <div>
                <Label>New password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>

              <div>
                <Label>Confirm password</Label>
                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
              </div>

              <Button type="submit">Reset password</Button>

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
              <div style={{ fontWeight: 1200 }}>Password updated</div>
              <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(32,29,24,0.75)", lineHeight: 1.6 }}>
                You can now sign in with your new password.
              </div>

              <Link to="/auth/login" style={{ textDecoration: "none" }}>
                <Button>Go to login</Button>
              </Link>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
