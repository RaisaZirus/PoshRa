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
    <header style={{ position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(10px)", background: "rgba(255,255,255,0.82)", boxShadow: "0 2px 20px rgba(15,23,42,0.08)", borderBottom: "1px solid #e2e8f0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px" }}>
        <Link to="/" className="btn btn-secondary" style={{ padding: "6px 14px", textTransform: "uppercase", fontWeight: 800 }}>Shop</Link>

        <form onSubmit={submitSearch} style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 240, background: "#fff", borderRadius: 999, padding: "6px", border: "1px solid #cbd5e1", boxShadow: "inset 0 1px 2px rgba(15,23,42,0.08)" }}>
          <input
            className="input"
            type="text"
            placeholder="Search products..."
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            style={{ border: "none", boxShadow: "none", padding: "8px 10px", borderRadius: "999px" }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: "8px 16px", borderRadius: 999 }}>Go</button>
        </form>

        <Link to="/cart" className="btn btn-secondary">Cart</Link>

        <div style={{ display: "flex", gap: 8 }}>
          {!user ? (
            <>
              <Link to="/auth/login" className="btn btn-secondary">Login</Link>
              <Link to="/auth/register" className="btn btn-primary">Register</Link>
            </>
          ) : (
            <>
              <Link to="/account/profile" className="btn btn-secondary">Account</Link>
              <Link to="/orders" className="btn btn-secondary">Orders</Link>
              {user.role === "seller" && <Link to="/seller" className="btn btn-secondary">Seller</Link>}
              {user.role === "admin" && <Link to="/admin" className="btn btn-secondary">Admin</Link>}
              <button onClick={logout} className="btn btn-secondary">Logout</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}