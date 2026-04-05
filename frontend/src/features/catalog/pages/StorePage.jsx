import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = {
  page: "#F7F6EF",
  surface: "#FFFDF7",
  soft: "#FFF6BF",
  soft2: "#FBEF9C",
  primary: "#FEE32B",
  primaryDeep: "#E4C91D",
  olive: "#877928",
  oliveDark: "#5F5620",
  ink: "#201D18",
  muted: "rgba(32,29,24,0.65)",
  line: "rgba(32,29,24,0.12)",
  lineStrong: "rgba(32,29,24,0.18)",
  white: "#FFFFFF",
  successBg: "#DCFCE7",
  successText: "#166534",
  dangerBg: "#FEE2E2",
  dangerText: "#991B1B",
  warnBg: "#FEF3C7",
  warnText: "#92400E",
  violetBg: "#EDE9FE",
  violetText: "#7C3AED",
};

function GlobalStyles() {
  return (
    <style>{`
      :root {
        --store-bg: ${COLORS.page};
        --store-surface: ${COLORS.surface};
        --store-soft: ${COLORS.soft};
        --store-soft2: ${COLORS.soft2};
        --store-primary: ${COLORS.primary};
        --store-primary-deep: ${COLORS.primaryDeep};
        --store-olive: ${COLORS.olive};
        --store-olive-dark: ${COLORS.oliveDark};
        --store-ink: ${COLORS.ink};
        --store-muted: ${COLORS.muted};
        --store-line: ${COLORS.line};
        --store-line-strong: ${COLORS.lineStrong};
        --store-white: ${COLORS.white};
      }

      * {
        box-sizing: border-box;
      }

      @keyframes fadeUp {
        from {
          opacity: 0;
          transform: translateY(24px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes floatBlob {
        0%   { transform: translate3d(0, 0, 0) scale(1); }
        50%  { transform: translate3d(0, -16px, 0) scale(1.04); }
        100% { transform: translate3d(0, 0, 0) scale(1); }
      }

      @keyframes pulseGlow {
        0%, 100% { box-shadow: 0 0 0 0 rgba(254, 227, 43, 0.18); }
        50% { box-shadow: 0 0 0 14px rgba(254, 227, 43, 0); }
      }

      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      @keyframes sweep {
        0% { transform: translateX(-120%); }
        100% { transform: translateX(120%); }
      }

      .store-page {
        min-height: 100vh;
        background:
          radial-gradient(circle at top left, rgba(254, 227, 43, 0.14), transparent 28%),
          radial-gradient(circle at top right, rgba(135, 121, 40, 0.10), transparent 24%),
          linear-gradient(180deg, #fbfaf3 0%, #f7f6ef 100%);
        color: var(--store-ink);
        font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        overflow-x: hidden;
      }

      .store-shell {
        width: min(1280px, calc(100% - 32px));
        margin: 0 auto;
      }

      .fade-up {
        opacity: 0;
        animation: fadeUp 0.8s cubic-bezier(.2,.75,.25,1) forwards;
      }

      .fade-in {
        opacity: 0;
        animation: fadeIn 0.7s ease forwards;
      }

      .hover-lift {
        transition:
          transform 0.35s cubic-bezier(.2,.75,.25,1),
          box-shadow 0.35s cubic-bezier(.2,.75,.25,1),
          border-color 0.35s ease,
          background 0.35s ease;
      }

      .hover-lift:hover {
        transform: translateY(-6px);
        box-shadow: 0 18px 40px rgba(32, 29, 24, 0.12);
        border-color: rgba(32,29,24,0.18);
      }

      .store-header {
        position: relative;
        overflow: hidden;
        background:
          radial-gradient(circle at 15% 20%, rgba(254, 227, 43, 0.18), transparent 20%),
          radial-gradient(circle at 90% 10%, rgba(254, 227, 43, 0.10), transparent 22%),
          linear-gradient(135deg, #181510 0%, #201D18 55%, #2A251C 100%);
        color: white;
        padding: 34px 0 30px;
        isolation: isolate;
      }

      .header-blob {
        position: absolute;
        border-radius: 999px;
        filter: blur(10px);
        animation: floatBlob 6s ease-in-out infinite;
        pointer-events: none;
      }

      .header-blob.one {
        width: 220px;
        height: 220px;
        top: -90px;
        right: -40px;
        background: rgba(254, 227, 43, 0.09);
      }

      .header-blob.two {
        width: 170px;
        height: 170px;
        bottom: -70px;
        left: -30px;
        background: rgba(255, 255, 255, 0.05);
        animation-delay: 1.2s;
      }

      .top-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        text-decoration: none;
        color: rgba(255,255,255,0.62);
        font-weight: 800;
        font-size: 12px;
        letter-spacing: 0.02em;
        transition: color 0.25s ease, transform 0.25s ease;
      }

      .top-link:hover {
        color: rgba(255,255,255,0.92);
        transform: translateX(-2px);
      }

      .hero-panel {
        position: relative;
        display: grid;
        grid-template-columns: 1.2fr 0.8fr;
        gap: 20px;
        align-items: end;
        margin-top: 18px;
      }

      .hero-main {
        position: relative;
        z-index: 1;
      }

      .hero-side {
        display: grid;
        gap: 12px;
      }

      .glass-card {
        position: relative;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,0.12);
        background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-radius: 22px;
        box-shadow: 0 18px 42px rgba(0,0,0,0.18);
      }

      .glass-card::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
        transform: translateX(-120%);
        animation: sweep 6s linear infinite;
        pointer-events: none;
      }

      .store-avatar {
        width: 78px;
        height: 78px;
        border-radius: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        background:
          linear-gradient(135deg, var(--store-primary) 0%, #FFF176 100%);
        color: var(--store-ink);
        font-size: 30px;
        font-weight: 900;
        box-shadow:
          0 10px 26px rgba(254, 227, 43, 0.18),
          inset 0 1px 0 rgba(255,255,255,0.4);
        animation: pulseGlow 3s ease-in-out infinite;
      }

      .hero-title {
        margin: 0;
        font-size: clamp(30px, 5vw, 46px);
        line-height: 1.02;
        font-weight: 950;
        letter-spacing: -0.03em;
      }

      .hero-subtitle {
        margin: 12px 0 0;
        color: rgba(255,255,255,0.70);
        font-size: 14px;
        line-height: 1.6;
        max-width: 700px;
      }

      .meta-row {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        margin-top: 14px;
      }

      .meta-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        padding: 9px 12px;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.10);
        color: rgba(255,255,255,0.86);
        font-size: 12px;
        font-weight: 800;
      }

      .verified-pill {
        background: #DCFCE7;
        color: #166534;
        border: 1px solid rgba(22,101,52,0.10);
      }

      .hero-stat-card {
        padding: 18px 18px 16px;
      }

      .hero-stat-label {
        color: rgba(255,255,255,0.58);
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .hero-stat-value {
        margin-top: 6px;
        color: white;
        font-size: 24px;
        font-weight: 900;
        letter-spacing: -0.03em;
      }

      .toolbar-wrap {
        position: sticky;
        top: 14px;
        z-index: 20;
        margin-top: -22px;
        margin-bottom: 22px;
      }

      .toolbar {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        align-items: center;
        padding: 14px;
        border: 1px solid var(--store-line);
        border-radius: 18px;
        background: rgba(255,255,255,0.82);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        box-shadow: 0 14px 34px rgba(32, 29, 24, 0.08);
      }

      .search-box,
      .sort-box {
        border: 1.5px solid rgba(32,29,24,0.12);
        background: rgba(255,255,255,0.92);
        color: var(--store-ink);
        outline: none;
        transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
      }

      .search-box:focus,
      .sort-box:focus {
        border-color: rgba(254,227,43,0.95);
        box-shadow: 0 0 0 5px rgba(254,227,43,0.18);
      }

      .search-box {
        flex: 1;
        min-width: 240px;
        border-radius: 14px;
        padding: 13px 16px;
        font-size: 14px;
        font-weight: 600;
      }

      .sort-box {
        min-width: 200px;
        border-radius: 14px;
        padding: 13px 14px;
        font-size: 13px;
        font-weight: 700;
      }

      .toolbar-count {
        margin-left: auto;
        color: var(--store-olive);
        font-size: 13px;
        font-weight: 800;
        white-space: nowrap;
      }

      .section-head {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 16px;
        margin: 4px 0 18px;
      }

      .section-title {
        margin: 0;
        color: var(--store-ink);
        font-size: 26px;
        line-height: 1.05;
        font-weight: 900;
        letter-spacing: -0.03em;
      }

      .section-text {
        margin: 8px 0 0;
        color: var(--store-muted);
        font-size: 14px;
        line-height: 1.65;
      }

      .product-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
        gap: 18px;
      }

      .product-card {
        height: 100%;
        display: flex;
        flex-direction: column;
        border-radius: 22px;
        background: var(--store-white);
        border: 1px solid rgba(32,29,24,0.16);
        box-shadow: 0 18px 40px rgba(32, 29, 24, 0.08);
        overflow: hidden;
      }

      .product-link {
        display: flex;
        flex-direction: column;
        flex: 1;
        text-decoration: none;
        color: inherit;
      }

      .product-media {
        position: relative;
        overflow: hidden;
        aspect-ratio: 1 / 0.86;
        background:
          radial-gradient(circle at top left, rgba(254,227,43,0.22), transparent 38%),
          linear-gradient(180deg, #fffdf7 0%, #fff8e3 100%);
      }

      .product-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.65s cubic-bezier(.2,.75,.25,1), filter 0.35s ease;
      }

      .product-card:hover .product-image {
        transform: scale(1.08);
        filter: saturate(1.05) contrast(1.02);
      }

      .product-media-overlay {
        position: absolute;
        inset: auto 0 0 0;
        height: 72px;
        background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.12) 100%);
        pointer-events: none;
      }

      .badge-row {
        position: absolute;
        top: 10px;
        left: 10px;
        right: 10px;
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        z-index: 2;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-radius: 999px;
        padding: 5px 9px;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 0.01em;
        box-shadow: 0 6px 18px rgba(0,0,0,0.08);
      }

      .badge-primary {
        background: var(--store-primary);
        color: var(--store-ink);
      }

      .badge-warning {
        background: ${COLORS.warnBg};
        color: ${COLORS.warnText};
      }

      .badge-violet {
        background: ${COLORS.violetBg};
        color: ${COLORS.violetText};
      }

      .badge-danger {
        background: ${COLORS.dangerBg};
        color: ${COLORS.dangerText};
      }

      .product-body {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 16px 16px 0;
      }

      .product-name {
        margin: 0;
        font-size: 15px;
        line-height: 1.42;
        font-weight: 900;
        color: var(--store-ink);
        min-height: 42px;
      }

      .product-brand {
        margin: -2px 0 0;
        font-size: 12px;
        color: var(--store-olive);
        font-weight: 700;
      }

      .price-row {
        display: flex;
        align-items: baseline;
        gap: 8px;
        flex-wrap: wrap;
      }

      .price-now {
        font-size: 21px;
        line-height: 1;
        font-weight: 950;
        color: var(--store-ink);
        letter-spacing: -0.03em;
      }

      .price-old {
        font-size: 13px;
        color: rgba(32,29,24,0.42);
        text-decoration: line-through;
        font-weight: 700;
      }

      .product-footer {
        padding: 16px;
        margin-top: auto;
      }

      .primary-btn,
      .ghost-btn {
        appearance: none;
        border: none;
        cursor: pointer;
        transition:
          transform 0.22s ease,
          box-shadow 0.22s ease,
          background 0.22s ease,
          color 0.22s ease,
          border-color 0.22s ease;
      }

      .primary-btn {
        width: 100%;
        border-radius: 14px;
        padding: 12px 14px;
        font-size: 13px;
        font-weight: 950;
        letter-spacing: 0.01em;
        background: linear-gradient(135deg, var(--store-primary) 0%, #fff176 100%);
        color: var(--store-ink);
        box-shadow: 0 10px 22px rgba(254, 227, 43, 0.18);
      }

      .primary-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 16px 28px rgba(254, 227, 43, 0.26);
      }

      .primary-btn:disabled {
        background: rgba(32,29,24,0.08);
        color: var(--store-olive);
        cursor: not-allowed;
        box-shadow: none;
      }

      .ghost-btn {
        border-radius: 12px;
        padding: 10px 14px;
        font-size: 12px;
        font-weight: 900;
        color: rgba(255,255,255,0.70);
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.14);
      }

      .ghost-btn:hover {
        color: white;
        border-color: rgba(255,255,255,0.22);
        background: rgba(255,255,255,0.07);
        transform: translateY(-1px);
      }

      .empty-state,
      .error-state {
        border-radius: 24px;
        padding: 50px 24px;
        text-align: center;
        background: linear-gradient(180deg, #fffef9 0%, #fffdf7 100%);
        border: 1px solid var(--store-line);
        box-shadow: 0 16px 36px rgba(32,29,24,0.07);
      }

      .state-emoji {
        font-size: 54px;
        margin-bottom: 14px;
      }

      .state-title {
        margin: 0 0 8px;
        color: var(--store-ink);
        font-size: 22px;
        font-weight: 900;
        letter-spacing: -0.03em;
      }

      .state-text {
        margin: 0 auto 18px;
        max-width: 520px;
        color: var(--store-muted);
        font-size: 14px;
        line-height: 1.7;
      }

      .loading-screen {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background:
          radial-gradient(circle at top left, rgba(254,227,43,0.12), transparent 30%),
          linear-gradient(180deg, #fbfaf3 0%, #f7f6ef 100%);
      }

      .loading-card {
        width: min(540px, 100%);
        background: rgba(255,255,255,0.86);
        border: 1px solid var(--store-line);
        border-radius: 28px;
        padding: 26px;
        box-shadow: 0 18px 44px rgba(32,29,24,0.08);
      }

      .skeleton {
        background: linear-gradient(90deg, rgba(32,29,24,0.06) 25%, rgba(32,29,24,0.12) 50%, rgba(32,29,24,0.06) 75%);
        background-size: 200% 100%;
        animation: shimmer 1.45s linear infinite;
        border-radius: 16px;
      }

      @media (max-width: 980px) {
        .hero-panel {
          grid-template-columns: 1fr;
        }

        .hero-side {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 768px) {
        .store-shell {
          width: min(100% - 20px, 1280px);
        }

        .store-header {
          padding: 24px 0 24px;
        }

        .toolbar-wrap {
          position: static;
          margin-top: -18px;
        }

        .toolbar {
          padding: 12px;
        }

        .search-box,
        .sort-box {
          width: 100%;
        }

        .toolbar-count {
          width: 100%;
          margin-left: 0;
        }

        .hero-side {
          grid-template-columns: 1fr;
        }

        .product-grid {
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 14px;
        }

        .hero-title {
          font-size: 30px;
        }

        .section-title {
          font-size: 22px;
        }

        .store-avatar {
          width: 66px;
          height: 66px;
          border-radius: 20px;
          font-size: 26px;
        }
      }
    `}</style>
  );
}

function formatPrice(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD")}`;
}

function Card({ children, style, className = "" }) {
  return (
    <div
      className={`hover-lift ${className}`}
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 22,
        boxShadow: "0 12px 28px rgba(32,29,24,0.07)",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Stars({ rating = 0, count = 0, dark = false }) {
  const active = Math.round(Number(rating || 0));

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          style={{
            fontSize: 13,
            color: i < active ? COLORS.primary : dark ? "rgba(255,255,255,0.24)" : "#D3D1C7",
            textShadow: i < active ? "0 0 10px rgba(254,227,43,0.22)" : "none",
          }}
        >
          ★
        </span>
      ))}
      {count > 0 && (
        <span
          style={{
            fontSize: 12,
            color: dark ? "rgba(255,255,255,0.72)" : COLORS.olive,
            marginLeft: 4,
            fontWeight: 800,
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
}

function ProductCard({ p, onAddToCart, index }) {
  const price = p.discount_price || p.min_price;
  const hasDiscount = p.discount_price && Number(p.discount_price) < Number(p.min_price);
  const outOfStock = Number(p.stock) <= 0;
  const discountPercent = hasDiscount
    ? Math.round(((Number(p.min_price) - Number(p.discount_price)) / Number(p.min_price)) * 100)
    : 0;

  return (
    <Card
      className="product-card fade-up"
      style={{
        animationDelay: `${0.06 * (index % 12)}s`,
      }}
    >
      <Link to={`/p/${p.product_id}`} className="product-link">
        <div className="product-media">
          <img
            src={p.image_url || "https://via.placeholder.com/600x500?text=Product"}
            alt={p.name}
            className="product-image"
          />
          <div className="badge-row">
            {hasDiscount && (
              <span className="badge badge-primary">{discountPercent}% OFF</span>
            )}

            {Number(p.stock) > 0 && Number(p.stock) <= 5 && (
              <span className="badge badge-warning">Only {p.stock} left</span>
            )}

            {Number(p.total_sold) >= 50 && (
              <span className="badge badge-violet">Bestseller</span>
            )}

            {outOfStock && (
              <span className="badge badge-danger">Out of stock</span>
            )}
          </div>

          <div className="product-media-overlay" />
        </div>

        <div className="product-body">
          <h3 className="product-name">{p.name}</h3>

          {p.brand && <p className="product-brand">{p.brand}</p>}

          {Number(p.reviews_count) > 0 && (
            <div>
              <Stars rating={p.avg_rating} count={p.reviews_count} />
            </div>
          )}

          <div className="price-row">
            <span className="price-now">{formatPrice(price)}</span>
            {hasDiscount && (
              <span className="price-old">{formatPrice(p.min_price)}</span>
            )}
          </div>
        </div>
      </Link>

      <div className="product-footer">
        <button
          onClick={() => onAddToCart(p.product_id)}
          disabled={outOfStock}
          className="primary-btn"
          type="button"
        >
          <span>{outOfStock ? "Out of stock" : "Add to cart"}</span>
          {!outOfStock && <span style={{ marginLeft: 8 }}>→</span>}
        </button>
      </div>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="loading-screen">
      <GlobalStyles />
      <div className="loading-card fade-in">
        <div
          className="skeleton"
          style={{ width: 86, height: 86, borderRadius: 24, marginBottom: 20 }}
        />
        <div
          className="skeleton"
          style={{ width: "55%", height: 28, marginBottom: 14 }}
        />
        <div
          className="skeleton"
          style={{ width: "78%", height: 14, marginBottom: 10 }}
        />
        <div
          className="skeleton"
          style={{ width: "62%", height: 14, marginBottom: 22 }}
        />
        <div
          className="skeleton"
          style={{ width: "100%", height: 58, borderRadius: 18, marginBottom: 14 }}
        />
        <div
          className="skeleton"
          style={{ width: "100%", height: 220, borderRadius: 22 }}
        />
      </div>
    </div>
  );
}

export default function StorePage() {
  const { store_slug } = useParams();
  const { fetchWithAuth, user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState("newest");

  React.useEffect(() => {
    setLoading(true);
    setError("");

    fetch(`/api/stores/${store_slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) throw new Error(d.message || "Store not found");
        setData(d.data);
      })
      .catch((e) => setError(e.message || "Something went wrong"))
      .finally(() => setLoading(false));
  }, [store_slug]);

  const handleAddToCart = async (productId) => {
    if (!user) {
      navigate("/auth/login");
      return;
    }

    try {
      const res = await fetch(`/api/products/${productId}`);
      const json = await res.json();
      const variant = json?.data?.variants?.[0];

      if (!variant) {
        alert("No variant available");
        return;
      }

      await fetchWithAuth("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({
          variant_id: variant.variant_id,
          quantity: 1,
        }),
      });

      navigate("/cart");
    } catch (err) {
      alert(err.message || "Failed to add to cart");
    }
  };

  const filtered = React.useMemo(() => {
    if (!data?.products) return [];

    return [...data.products]
      .filter((p) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;

        return (
          p.name?.toLowerCase().includes(q) ||
          (p.brand || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sort === "price_asc") return Number(a.min_price) - Number(b.min_price);
        if (sort === "price_desc") return Number(b.min_price) - Number(a.min_price);
        if (sort === "rating") return Number(b.avg_rating || 0) - Number(a.avg_rating || 0);
        if (sort === "popular") return Number(b.total_sold || 0) - Number(a.total_sold || 0);
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }, [data, search, sort]);

  if (loading) return <LoadingState />;

  if (error || !data) {
    return (
      <div className="store-page">
        <GlobalStyles />
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div className="store-shell">
            <div className="error-state fade-up">
              <div className="state-emoji">🏪</div>
              <h2 className="state-title">{error || "Store not found"}</h2>
              <p className="state-text">
                We couldn’t load this store right now. Please check the link and try again.
              </p>
              <Link
                to="/"
                className="primary-btn"
                style={{
                  display: "inline-flex",
                  width: "auto",
                  minWidth: 170,
                  justifyContent: "center",
                  textDecoration: "none",
                }}
              >
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { store, products } = data;
  const storeYear = store?.created_at ? new Date(store.created_at).getFullYear() : "";
  const averageRating = Number(store?.store_rating || 0).toFixed(1);

  return (
    <div className="store-page">
      <GlobalStyles />

      <header className="store-header">
        <div className="header-blob one" />
        <div className="header-blob two" />

        <div className="store-shell">
          <Link to="/" className="top-link fade-up" style={{ animationDelay: "0.02s" }}>
            <span style={{ fontSize: 14 }}>←</span>
            <span>Back to home</span>
          </Link>

          <div className="hero-panel">
            <div
              className="glass-card hero-main fade-up"
              style={{ animationDelay: "0.10s", padding: "22px 22px 20px" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 18,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div className="store-avatar">
                    {store.store_name?.charAt(0)?.toUpperCase() || "S"}
                  </div>

                  <div style={{ marginTop: 18 }}>
                    <h1 className="hero-title">{store.store_name}</h1>

                    {store.business_name && (
                      <p
                        style={{
                          margin: "10px 0 0",
                          color: "rgba(255,255,255,0.58)",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {store.business_name}
                      </p>
                    )}

                    <p className="hero-subtitle">
                      Discover curated products from this seller with a cleaner browsing experience,
                      quicker scanning, and a more polished storefront layout.
                    </p>
                  </div>

                  <div className="meta-row">
                    <span className="meta-pill">
                      <Stars rating={store.store_rating} dark />
                      <span>{averageRating}</span>
                    </span>

                    <span className="meta-pill">
                      <span>📦</span>
                      <span>
                        {store.product_count} product{store.product_count !== 1 ? "s" : ""}
                      </span>
                    </span>

                    {store.kyc_status === "verified" && (
                      <span className="meta-pill verified-pill">✓ Verified seller</span>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 10,
                    minWidth: 140,
                  }}
                >
                  <span
                    style={{
                      color: "rgba(255,255,255,0.48)",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Member since {storeYear}
                  </span>

                </div>
              </div>
            </div>

            <div className="hero-side fade-up" style={{ animationDelay: "0.18s" }}>
              <div className="glass-card hero-stat-card">
                <div className="hero-stat-label">Store rating</div>
                <div className="hero-stat-value">{averageRating}</div>
                <div style={{ marginTop: 8 }}>
                  <Stars rating={store.store_rating} dark />
                </div>
              </div>

              <div className="glass-card hero-stat-card">
                <div className="hero-stat-label">Catalog size</div>
                <div className="hero-stat-value">{products.length}</div>
                <div
                  style={{
                    marginTop: 8,
                    color: "rgba(255,255,255,0.60)",
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  Browse all available products in this store.
                </div>
              </div>
            </div>
          </div>

        </div>
      </header>

      <main style={{ paddingBottom: 60 }}>
        <div className="store-shell">
          <div className="toolbar-wrap fade-up" style={{ animationDelay: "0.24s" }}>
            <div className="toolbar">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search this store by product or brand..."
                className="search-box"
              />

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="sort-box"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to high</option>
                <option value="price_desc">Price: High to low</option>
                <option value="rating">Top rated</option>
                <option value="popular">Most popular</option>
              </select>

              <div className="toolbar-count">
                {filtered.length} product{filtered.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          <section>
            <div className="section-head fade-up" style={{ animationDelay: "0.28s" }}>
              <div>
                <h2 className="section-title">Products</h2>
                <p className="section-text">
                  Clean product cards, refined hierarchy, and smoother interactions for a more premium
                  storefront feel.
                </p>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state fade-up" style={{ animationDelay: "0.34s" }}>
                <div className="state-emoji">📦</div>
                <h3 className="state-title">
                  {search ? `No products match "${search}"` : "No products in this store yet"}
                </h3>
                <p className="state-text">
                  {search
                    ? "Try a different keyword or clear the current search to browse the full catalog."
                    : "Products added by the seller will appear here once they become available."}
                </p>

                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="primary-btn"
                    style={{ width: "auto", minWidth: 160 }}
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="product-grid">
                {filtered.map((p, index) => (
                  <ProductCard
                    key={p.product_id}
                    p={p}
                    onAddToCart={handleAddToCart}
                    index={index}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}