import React from "react";

export default function Footer() {
  return (
    <footer style={{ background: "var(--surface-alt)", borderTop: "1px solid #e2e8f0", padding: 20, textAlign: "center", color: "var(--muted)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <small>© {new Date().getFullYear()} Shop. All rights reserved.</small>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/privacy" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>Privacy</a>
          <a href="/terms" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>Terms</a>
          <a href="/support" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>Support</a>
        </div>
      </div>
    </footer>
  );
}


