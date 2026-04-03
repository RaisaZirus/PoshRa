import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [term, setTerm] = useState("");
  const navigate = useNavigate();

  const submitSearch = (e) => {
    e.preventDefault();
    const q = term.trim();
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setTerm("");
  };

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(243,244,246,0.82))",
      borderBottom: "1px solid rgba(148,163,184,0.3)",
      boxShadow: "0 8px 14px rgba(15,23,42,0.08)",
    }}>
      <div style={{
        maxWidth: 1300,
        width: "100%",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 20px",
        gap: 12,
      }}>
        <Link to="/" style={{
          textDecoration: "none",
          fontSize: 20,
          fontWeight: 900,
          letterSpacing: 1,
          color: "#1f2937",
          marginLeft: 8,
        }}>
          Shop
        </Link>

        <form onSubmit={submitSearch} style={{
          flex: 1,
          minWidth: 280,
          maxWidth: 520,
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "#ffffff",
          borderRadius: 999,
          padding: "6px 8px",
          border: "1px solid rgba(148,163,184,0.35)",
          boxShadow: "inset 0 1px 2px rgba(15,23,42,0.06)",
        }}>
          <input
            type="text"
            placeholder="Search for products, stores, categories..."
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 14,
              padding: "10px 10px",
              borderRadius: "999px",
              color: "#1f2937",
              background: "transparent",
            }}
          />
          <button type="submit" style={{
            border: "none",
            background: "#fdd835",
            color: "#1f2937",
            fontWeight: 700,
            padding: "9px 14px",
            borderRadius: 999,
            cursor: "pointer",
            transition: "all .2s ease",
            boxShadow: "0 4px 10px rgba(253,216,53,0.35)",
          }}>
            Search
          </button>
        </form>

        <nav style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Link to="/cart" style={{ color: "#0f172a", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>Cart</Link>
          {!user ? (
            <>
              <Link to="/auth/login" style={{ color: "#374151", fontWeight: 600, fontSize: 14 }}>Login</Link>
              <Link to="/auth/register" style={{
                background: "#22c55e",
                color: "#fff",
                padding: "7px 14px",
                borderRadius: 999,
                fontWeight: 700,
                textDecoration: "none",
                fontSize: 14,
              }}>Register</Link>
            </>
          ) : (
            <>
              <Link to="/account/profile" style={{ color: "#374151", fontWeight: 600, fontSize: 14 }}>Profile</Link>
              <Link to="/orders" style={{ color: "#374151", fontWeight: 600, fontSize: 14 }}>Orders</Link>
              {user.role === "seller" && <Link to="/seller" style={{ color: "#374151", fontWeight: 600, fontSize: 14 }}>Seller</Link>}
              {user.role === "admin" && <Link to="/admin" style={{ color: "#374151", fontWeight: 600, fontSize: 14 }}>Admin</Link>}
              <button onClick={logout} style={{
                background: "transparent",
                border: "1px solid rgba(148,163,184,0.5)",
                borderRadius: 999,
                padding: "7px 14px",
                color: "#0f172a",
                fontWeight: 600,
                cursor: "pointer",
              }}>Logout</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

