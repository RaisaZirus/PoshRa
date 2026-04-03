import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../../components/layout/Navbar.jsx";
import Footer from "../../components/layout/Footer.jsx";

export default function AppLayout() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <Navbar />
      <main style={{ flex: 1, padding: 20, maxWidth: 1240, margin: "0 auto", width: "100%" }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}


