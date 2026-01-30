import React from "react";
import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h2>Auth</h2>
      <Outlet />
    </div>
  );
}
