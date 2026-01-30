import React from "react";

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid #eee", padding: 12, textAlign: "center" }}>
      <small>© {new Date().getFullYear()} Shop</small>
    </footer>
  );
}
