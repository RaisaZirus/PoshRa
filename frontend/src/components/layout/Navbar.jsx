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
    <header style={{ borderBottom: "1px solid #eee", padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link to="/">Shop</Link>
        <form onSubmit={submitSearch} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input
            type="text"
            placeholder="Search products..."
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            style={{ padding: 4, border: "1px solid #ccc", borderRadius: 4 }}
          />
          <button type="submit" style={{ padding: "4px 8px" }}>
            Go
          </button>
        </form>
        <Link to="/cart">Cart</Link>

        <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
          {!user ? (
            <>
              <Link to="/auth/login">Login</Link>
              <Link to="/auth/register">Register</Link>
            </>
          ) : (
            <>
              <Link to="/account/profile">Account</Link>
              <Link to="/orders">Orders</Link>
              {user.role === "seller" && <Link to="/seller">Seller</Link>}
              {user.role === "admin" && <Link to="/admin">Admin</Link>}
              <button onClick={logout}>Logout</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}