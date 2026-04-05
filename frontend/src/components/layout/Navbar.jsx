import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [term, setTerm] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    const onResize = () => {
      if (window.innerWidth > 992) {
        setMobileOpen(false);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    const q = term.trim();
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setTerm("");
    setMobileOpen(false);
  };

  const handleNavClick = () => {
    setMobileOpen(false);
  };

  const userInitial = useMemo(() => {
    if (!user) return "";
    return (user?.name?.trim?.()?.charAt(0) || user?.email?.charAt?.(0) || "U").toUpperCase();
  }, [user]);

  return (
    <>
      <style>{`
        .nav-shell {
          --nav-text: #0f172a;
          --muted: #64748b;
          --border: rgba(148, 163, 184, 0.22);
          --panel: rgba(255, 255, 255, 0.72);
          --panel-strong: rgba(255, 255, 255, 0.9);
          --shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
          --shadow-soft: 0 10px 25px rgba(15, 23, 42, 0.07);
          --yellow: #facc15;
          --yellow-deep: #eab308;
          --green: #22c55e;
          --green-deep: #16a34a;
          --ring: rgba(250, 204, 21, 0.22);
          --hover-bg: rgba(255, 255, 255, 0.7);
          --card: rgba(255, 255, 255, 0.82);
        }

        .nav-root {
          position: sticky;
          top: 0;
          z-index: 999;
          padding: 12px 16px;
          transition: padding 0.35s ease;
        }

        .nav-root.scrolled {
          padding-top: 8px;
          padding-bottom: 8px;
        }

        .nav-wrap {
          position: relative;
          max-width: 1320px;
          margin: 0 auto;
          border: 1px solid var(--border);
          border-radius: 24px;
          background:
            linear-gradient(135deg, rgba(255,255,255,0.78), rgba(248,250,252,0.72)),
            radial-gradient(circle at top right, rgba(250,204,21,0.16), transparent 35%),
            radial-gradient(circle at bottom left, rgba(34,197,94,0.10), transparent 28%);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: var(--shadow);
          overflow: hidden;
          transition: all 0.35s ease;
        }

        .nav-root.scrolled .nav-wrap {
          border-radius: 20px;
          box-shadow: 0 18px 36px rgba(15, 23, 42, 0.1);
        }

        .nav-glow {
          pointer-events: none;
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .nav-glow::before,
        .nav-glow::after {
          content: "";
          position: absolute;
          border-radius: 999px;
          filter: blur(50px);
          opacity: 0.45;
          animation: floatGlow 8s ease-in-out infinite;
        }

        .nav-glow::before {
          width: 180px;
          height: 180px;
          right: -40px;
          top: -60px;
          background: rgba(250, 204, 21, 0.25);
        }

        .nav-glow::after {
          width: 170px;
          height: 170px;
          left: -50px;
          bottom: -70px;
          background: rgba(34, 197, 94, 0.16);
          animation-delay: 1.2s;
        }

        .nav-main {
          position: relative;
          display: flex;
          align-items: center;
          gap: 18px;
          justify-content: space-between;
          padding: 14px 18px;
        }

        /* Left cluster: brand + user badge */
        .nav-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
          min-width: fit-content;
        }

        .brand {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: var(--nav-text);
        }

        .brand-mark {
          position: relative;
          height: 46px;
          padding: 0 16px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background:
            linear-gradient(135deg, rgba(250,204,21,0.95), rgba(255,255,255,0.95));
          border: 1px solid rgba(255,255,255,0.75);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.7),
            0 14px 24px rgba(250, 204, 21, 0.22);
          overflow: hidden;
          white-space: nowrap;
        }

        .brand-mark::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.55) 50%, transparent 80%);
          transform: translateX(-140%);
          animation: shine 4.8s ease-in-out infinite;
        }

        .brand-mark span {
          position: relative;
          font-size: 16px;
          font-weight: 900;
          letter-spacing: 0.06em;
          color: #111827;
        }

        .brand-copy {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .brand-title {
          font-size: 1.02rem;
          font-weight: 900;
          letter-spacing: 0.04em;
          line-height: 1;
        }

        .brand-subtitle {
          font-size: 0.75rem;
          color: var(--muted);
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* Divider between brand and user badge */
        .nav-left-divider {
          width: 1px;
          height: 32px;
          background: rgba(148, 163, 184, 0.28);
          border-radius: 999px;
          flex-shrink: 0;
        }

        .search-form {
          position: relative;
          flex: 1;
          min-width: 260px;
          max-width: 560px;
        }

        .search-inner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.24);
          background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(248,250,252,0.82));
          box-shadow:
            inset 0 1px 2px rgba(15, 23, 42, 0.05),
            0 10px 24px rgba(15, 23, 42, 0.05);
          transition: all 0.3s ease;
        }

        .search-form:focus-within .search-inner {
          transform: translateY(-1px);
          border-color: rgba(250, 204, 21, 0.55);
          box-shadow:
            inset 0 1px 2px rgba(15, 23, 42, 0.05),
            0 0 0 6px var(--ring),
            0 16px 30px rgba(15, 23, 42, 0.07);
        }

        .search-icon {
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: rgba(248, 250, 252, 0.96);
          border: 1px solid rgba(148, 163, 184, 0.18);
          color: #334155;
        }

        .search-input {
          flex: 1;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          color: #0f172a;
          font-size: 0.95rem;
          font-weight: 500;
          padding: 0 4px;
        }

        .search-input::placeholder {
          color: #94a3b8;
        }

        .search-btn {
          position: relative;
          border: none;
          outline: none;
          cursor: pointer;
          padding: 11px 18px;
          border-radius: 999px;
          font-weight: 800;
          color: #111827;
          background: linear-gradient(135deg, var(--yellow), #fde047);
          box-shadow: 0 10px 18px rgba(250, 204, 21, 0.26);
          transition: transform 0.28s ease, box-shadow 0.28s ease, background 0.28s ease;
          overflow: hidden;
          white-space: nowrap;
        }

        .search-btn::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(115deg, transparent 25%, rgba(255,255,255,0.45) 50%, transparent 75%);
          transform: translateX(-130%);
          transition: transform 0.55s ease;
        }

        .search-btn:hover {
          transform: translateY(-1px);
          background: linear-gradient(135deg, #fde047, var(--yellow-deep));
          box-shadow: 0 14px 22px rgba(250, 204, 21, 0.34);
        }

        .search-btn:hover::before {
          transform: translateX(120%);
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .nav-link,
        .logout-btn {
          position: relative;
          text-decoration: none;
          border: 1px solid transparent;
          color: #334155;
          background: transparent;
          border-radius: 999px;
          padding: 10px 14px;
          font-size: 0.92rem;
          font-weight: 700;
          transition: all 0.28s ease;
          cursor: pointer;
        }

        .nav-link::after {
          content: "";
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: 8px;
          height: 2px;
          border-radius: 999px;
          transform: scaleX(0);
          transform-origin: center;
          background: linear-gradient(90deg, var(--yellow), var(--green));
          transition: transform 0.28s ease;
        }

        .nav-link:hover,
        .logout-btn:hover {
          color: #0f172a;
          background: var(--hover-bg);
          border-color: rgba(148, 163, 184, 0.2);
          transform: translateY(-1px);
        }

        .nav-link:hover::after {
          transform: scaleX(1);
        }

        .nav-link.primary {
          color: #fff;
          background: linear-gradient(135deg, var(--green), var(--green-deep));
          box-shadow: 0 12px 22px rgba(34, 197, 94, 0.22);
        }

        .nav-link.primary::after {
          display: none;
        }

        .nav-link.primary:hover {
          color: #fff;
          box-shadow: 0 16px 30px rgba(34, 197, 94, 0.28);
        }

        .logout-btn {
          border: 1px solid rgba(148, 163, 184, 0.28);
          background: rgba(255,255,255,0.75);
        }

        .user-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 7px 10px 7px 7px;
          border-radius: 999px;
          background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(248,250,252,0.84));
          border: 1px solid rgba(148,163,184,0.2);
          box-shadow: var(--shadow-soft);
          cursor: pointer;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }

        .user-badge:hover {
          transform: translateY(-1px);
          border-color: rgba(250, 204, 21, 0.45);
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.1), 0 0 0 4px rgba(250,204,21,0.12);
        }

        .user-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #111827, #334155);
          color: #fff;
          font-size: 0.84rem;
          font-weight: 800;
          letter-spacing: 0.03em;
        }

        .user-role {
          font-size: 0.72rem;
          line-height: 1;
          color: var(--muted);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .user-name {
          font-size: 0.86rem;
          line-height: 1.1;
          color: #0f172a;
          font-weight: 800;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mobile-toggle {
          display: none;
          width: 46px;
          height: 46px;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: rgba(255,255,255,0.82);
          cursor: pointer;
          align-items: center;
          justify-content: center;
          transition: all 0.28s ease;
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.06);
        }

        .mobile-toggle:hover {
          transform: translateY(-1px);
          background: rgba(255,255,255,0.96);
        }

        .mobile-toggle span {
          position: relative;
          width: 20px;
          height: 2px;
          background: #0f172a;
          border-radius: 999px;
          transition: all 0.28s ease;
        }

        .mobile-toggle span::before,
        .mobile-toggle span::after {
          content: "";
          position: absolute;
          left: 0;
          width: 20px;
          height: 2px;
          border-radius: 999px;
          background: #0f172a;
          transition: all 0.28s ease;
        }

        .mobile-toggle span::before { top: -6px; }
        .mobile-toggle span::after { top: 6px; }

        .mobile-toggle.active span {
          background: transparent;
        }

        .mobile-toggle.active span::before {
          top: 0;
          transform: rotate(45deg);
        }

        .mobile-toggle.active span::after {
          top: 0;
          transform: rotate(-45deg);
        }

        .mobile-panel {
          display: none;
          border-top: 1px solid rgba(148, 163, 184, 0.16);
          padding: 0 16px 16px;
          animation: panelIn 0.35s ease;
        }

        .mobile-panel-inner {
          padding: 14px;
          border-radius: 20px;
          background: linear-gradient(180deg, rgba(255,255,255,0.72), rgba(248,250,252,0.88));
          border: 1px solid rgba(148, 163, 184, 0.16);
          box-shadow: var(--shadow-soft);
        }

        .mobile-search {
          margin-bottom: 14px;
        }

        .mobile-links {
          display: grid;
          gap: 10px;
        }

        .mobile-link,
        .mobile-logout {
          text-decoration: none;
          color: #0f172a;
          font-weight: 700;
          padding: 12px 14px;
          border-radius: 14px;
          background: rgba(255,255,255,0.78);
          border: 1px solid rgba(148, 163, 184, 0.18);
          transition: all 0.25s ease;
          cursor: pointer;
        }

        .mobile-link:hover,
        .mobile-logout:hover {
          transform: translateY(-1px);
          background: #fff;
        }

        .mobile-link.primary {
          background: linear-gradient(135deg, var(--green), var(--green-deep));
          color: #fff;
          border-color: transparent;
        }

        .mobile-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 0 14px;
          margin-bottom: 14px;
          border-bottom: 1px dashed rgba(148, 163, 184, 0.28);
        }

        @media (max-width: 1100px) {
          .search-form {
            max-width: 420px;
          }

          .nav-link,
          .logout-btn {
            padding: 9px 12px;
          }
        }

        @media (max-width: 992px) {
          .nav-main {
            gap: 12px;
          }

          .search-form.desktop-search,
          .nav-links.desktop-links,
          .user-badge.desktop-user,
          .nav-left-divider.desktop-divider {
            display: none;
          }

          .mobile-toggle,
          .mobile-panel {
            display: flex;
          }

          .mobile-panel {
            flex-direction: column;
          }
        }

        @media (max-width: 640px) {
          .nav-root {
            padding-left: 10px;
            padding-right: 10px;
          }

          .nav-main {
            padding: 12px;
          }

          .nav-wrap {
            border-radius: 20px;
          }

          .brand-mark {
            height: 42px;
            padding: 0 14px;
            border-radius: 14px;
          }

          .brand-title {
            font-size: 0.96rem;
          }

          .brand-subtitle {
            font-size: 0.68rem;
          }

          .search-btn {
            padding: 10px 14px;
          }

          .search-icon {
            width: 38px;
            height: 38px;
          }
        }

        @keyframes shine {
          0% { transform: translateX(-140%); }
          25%, 100% { transform: translateX(150%); }
        }

        @keyframes floatGlow {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(10px) scale(1.04); }
        }

        @keyframes panelIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <header className={`nav-shell nav-root ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-wrap">
          <div className="nav-glow" />

          <div className="nav-main">
            {/* Left: Brand + User Badge */}
            <div className="nav-left">
              <Link to="/" className="brand" onClick={handleNavClick}>
                <div className="brand-mark">
                  <span>PoshRa</span>
                </div>
              </Link>

              {user && (
                <>
                  <div className="nav-left-divider desktop-divider" />
                  <Link
                    to={
                      user.role === "admin"
                        ? "/admin"
                        : user.role === "seller"
                        ? "/seller"
                        : "/account/profile"
                    }
                    className="user-badge desktop-user"
                    onClick={handleNavClick}
                    style={{ textDecoration: "none" }}
                  >
                    <div className="user-avatar">{userInitial}</div>
                    <div>
                      <div className="user-role">{user?.role || "user"}</div>
                      <div className="user-name">{user?.name || user?.email || "Account"}</div>
                    </div>
                  </Link>
                </>
              )}
            </div>

            {/* Center: Search */}
            <form onSubmit={submitSearch} className="search-form desktop-search">
              <div className="search-inner">
                <div className="search-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 21L16.65 16.65M10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5C18 14.6421 14.6421 18 10.5 18Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <input
                  type="text"
                  className="search-input"
                  placeholder="Search for products, stores, categories..."
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                />

                <button type="submit" className="search-btn">
                  Search
                </button>
              </div>
            </form>

            {/* Right: Nav links + Mobile toggle */}
            <div className="nav-actions">
              <nav className="nav-links desktop-links">
                <Link to="/cart" className="nav-link">
                  Cart
                </Link>

                {!user ? (
                  <>
                    <Link to="/auth/login" className="nav-link">
                      Login
                    </Link>
                    <Link to="/auth/register" className="nav-link primary">
                      Register
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/account/profile" className="nav-link">
                      Profile
                    </Link>
                    <Link to="/orders" className="nav-link">
                      Orders
                    </Link>
                    <button onClick={logout} className="logout-btn" type="button">
                      Logout
                    </button>
                  </>
                )}
              </nav>

              <button
                type="button"
                className={`mobile-toggle ${mobileOpen ? "active" : ""}`}
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label="Toggle navigation"
                aria-expanded={mobileOpen}
              >
                <span />
              </button>
            </div>
          </div>

          {mobileOpen && (
            <div className="mobile-panel">
              <div className="mobile-panel-inner">
                {user && (
                  <Link
                    to={
                      user.role === "admin"
                        ? "/admin"
                        : user.role === "seller"
                        ? "/seller"
                        : "/account/profile"
                    }
                    className="mobile-user"
                    onClick={handleNavClick}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div className="user-avatar">{userInitial}</div>
                    <div>
                      <div className="user-role">{user?.role || "user"}</div>
                      <div className="user-name">{user?.name || user?.email || "Account"}</div>
                    </div>
                  </Link>
                )}

                <form onSubmit={submitSearch} className="search-form mobile-search">
                  <div className="search-inner">
                    <div className="search-icon" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M21 21L16.65 16.65M10.5 18C6.35786 18 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5C18 14.6421 14.6421 18 10.5 18Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search for products, stores, categories..."
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                    />

                    <button type="submit" className="search-btn">
                      Search
                    </button>
                  </div>
                </form>

                <div className="mobile-links">
                  <Link to="/cart" className="mobile-link" onClick={handleNavClick}>
                    Cart
                  </Link>

                  {!user ? (
                    <>
                      <Link to="/auth/login" className="mobile-link" onClick={handleNavClick}>
                        Login
                      </Link>
                      <Link to="/auth/register" className="mobile-link primary" onClick={handleNavClick}>
                        Register
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to="/account/profile" className="mobile-link" onClick={handleNavClick}>
                        Profile
                      </Link>
                      <Link to="/orders" className="mobile-link" onClick={handleNavClick}>
                        Orders
                      </Link>

                      <button
                        type="button"
                        className="mobile-logout"
                        onClick={() => {
                          logout();
                          setMobileOpen(false);
                        }}
                      >
                        Logout
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}