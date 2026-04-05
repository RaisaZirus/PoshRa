import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = {
  page: "#f7f6ef",
  surface: "#fffdf7",
  soft: "#fff6bf",
  primary: "#fee32b",
  primaryDeep: "#e4c91d",
  olive: "#877928",
  ink: "#201d18",
  muted: "rgba(32,29,24,0.65)",
  line: "rgba(32,29,24,0.12)",
  lineStrong: "rgba(32,29,24,0.18)",
  white: "#ffffff",
};

function GlobalStyles() {
  return (
    <style>{`
      :root {
        --cat-bg: ${COLORS.page};
        --cat-surface: ${COLORS.surface};
        --cat-soft: ${COLORS.soft};
        --cat-primary: ${COLORS.primary};
        --cat-primary-deep: ${COLORS.primaryDeep};
        --cat-olive: ${COLORS.olive};
        --cat-ink: ${COLORS.ink};
        --cat-muted: ${COLORS.muted};
        --cat-line: ${COLORS.line};
        --cat-line-strong: ${COLORS.lineStrong};
        --cat-white: ${COLORS.white};
      }

      * { box-sizing: border-box; }

      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(24px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .category-page {
        min-height: 100vh;
        background: radial-gradient(circle at top left, rgba(254, 227, 43, 0.14), transparent 28%),
                    radial-gradient(circle at top right, rgba(135, 121, 40, 0.10), transparent 24%),
                    linear-gradient(180deg, #fbfaf3 0%, #f7f6ef 100%);
        color: var(--cat-ink);
        font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      }

      .category-shell {
        width: min(1280px, calc(100% - 32px));
        margin: 0 auto;
      }

      .fade-up { opacity: 0; animation: fadeUp 0.8s cubic-bezier(.2,.75,.25,1) forwards; }
      .fade-in { opacity: 0; animation: fadeIn 0.7s ease forwards; }
      .hover-lift { transition: transform 0.35s cubic-bezier(.2,.75,.25,1), box-shadow 0.35s cubic-bezier(.2,.75,.25,1), border-color 0.35s ease, background 0.35s ease; }
      .hover-lift:hover { transform: translateY(-6px); box-shadow: 0 18px 40px rgba(32, 29, 24, 0.12); border-color: rgba(32,29,24,0.18); }

      .category-header {
        position: relative;
        overflow: hidden;
        background: radial-gradient(circle at 15% 20%, rgba(254, 227, 43, 0.18), transparent 20%),
                    radial-gradient(circle at 90% 10%, rgba(254, 227, 43, 0.10), transparent 22%),
                    linear-gradient(135deg, #181510 0%, #201D18 55%, #2A251C 100%);
        color: white;
        padding: 34px 0 30px;
      }

      .header-blob {
        position: absolute;
        border-radius: 999px;
        filter: blur(10px);
        pointer-events: none;
      }

      .header-blob.one {
        width: 220px; height: 220px; top: -90px; right: -40px;
        background: rgba(254, 227, 43, 0.09);
      }

      .header-blob.two {
        width: 170px; height: 170px; bottom: -70px; left: -30px;
        background: rgba(255, 255, 255, 0.05);
      }

      .top-link {
        display: inline-flex; align-items: center; gap: 8px;
        text-decoration: none; color: rgba(255,255,255,0.62);
        font-weight: 800; font-size: 12px; letter-spacing: 0.02em;
        transition: color 0.25s ease, transform 0.25s ease;
      }

      .top-link:hover { color: rgba(255,255,255,0.92); transform: translateX(-2px); }

      .hero-panel { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 20px; align-items: end; margin-top: 18px; }
      .hero-main { position: relative; z-index: 1; }
      .hero-side { display: grid; gap: 12px; }

      .glass-card { position: relative; overflow: hidden; border: 1px solid rgba(255,255,255,0.12); background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04)); backdrop-filter: blur(12px); border-radius: 22px; box-shadow: 0 18px 42px rgba(0,0,0,0.18); }
      .glass-card::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent); transform: translateX(-120%); animation: sweep 6s linear infinite; pointer-events: none; }

      @keyframes sweep { 0% { transform: translateX(-120%); } 100% { transform: translateX(120%); } }

      .hero-title { margin: 0; font-size: clamp(30px, 5vw, 46px); line-height: 1.02; font-weight: 950; letter-spacing: -0.03em; }
      .hero-subtitle { margin: 12px 0 0; color: rgba(255,255,255,0.70); font-size: 14px; line-height: 1.6; max-width: 700px; }

      .meta-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-top: 14px; }
      .meta-pill { display: inline-flex; align-items: center; gap: 8px; border-radius: 999px; padding: 9px 12px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10); color: rgba(255,255,255,0.86); font-size: 12px; font-weight: 800; }
      .verified-pill { background: #DCFCE7; color: #166534; border: 1px solid rgba(22,101,52,0.10); }

      .section-head { display: flex; align-items: end; justify-content: space-between; gap: 16px; margin: 4px 0 18px; }
      .section-title { margin: 0; color: var(--cat-ink); font-size: 26px; line-height: 1.05; font-weight: 900; letter-spacing: -0.03em; }
      .section-text { margin: 8px 0 0; color: var(--cat-muted); font-size: 14px; line-height: 1.65; }

      .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 18px; }
      .product-card { height: 100%; display: flex; flex-direction: column; border-radius: 22px; background: var(--cat-white); border: 1px solid rgba(32,29,24,0.16); box-shadow: 0 18px 40px rgba(32, 29, 24, 0.08); overflow: hidden; }
      .product-link { display: flex; flex-direction: column; flex: 1; text-decoration: none; color: inherit; }
      .product-media { position: relative; overflow: hidden; aspect-ratio: 1 / 0.86; background: radial-gradient(circle at top left, rgba(254,227,43,0.22), transparent 38%), linear-gradient(180deg, #fffdf7 0%, #fff8e3 100%); }
      .product-image { width: 100%; height: 100%; object-fit: cover; transition: transform 0.65s cubic-bezier(.2,.75,.25,1), filter 0.35s ease; }
      .product-card:hover .product-image { transform: scale(1.08); filter: saturate(1.05) contrast(1.02); }
      .product-media-overlay { position: absolute; inset: auto 0 0 0; height: 72px; background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.12) 100%); pointer-events: none; }
      .badge-row { position: absolute; top: 10px; left: 10px; right: 10px; display: flex; gap: 6px; flex-wrap: wrap; z-index: 2; }
      .badge { display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; padding: 5px 9px; font-size: 11px; font-weight: 900; letter-spacing: 0.01em; box-shadow: 0 6px 18px rgba(0,0,0,0.08); }
      .badge-primary { background: var(--cat-primary); color: var(--cat-ink); }
      .badge-warning { background: #FEF3C7; color: #92400E; }
      .badge-violet { background: #EDE9FE; color: #7C3AED; }
      .badge-danger { background: #FEE2E2; color: #991B1B; }
      .product-body { display: flex; flex-direction: column; gap: 8px; padding: 16px 16px 0; }
      .product-name { margin: 0; font-size: 15px; line-height: 1.42; font-weight: 900; color: var(--cat-ink); min-height: 42px; }
      .product-brand { margin: -2px 0 0; font-size: 12px; color: var(--cat-olive); font-weight: 700; }
      .price-row { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
      .price-now { font-size: 21px; line-height: 1; font-weight: 950; color: var(--cat-ink); letter-spacing: -0.03em; }
      .price-old { font-size: 13px; color: rgba(32,29,24,0.42); text-decoration: line-through; font-weight: 700; }
      .product-footer { padding: 16px; margin-top: auto; }
      .primary-btn { width: 100%; border-radius: 14px; padding: 12px 14px; font-size: 13px; font-weight: 950; letter-spacing: 0.01em; background: linear-gradient(135deg, var(--cat-primary) 0%, #fff176 100%); color: var(--cat-ink); box-shadow: 0 10px 22px rgba(254, 227, 43, 0.18); border: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
      .primary-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 16px 28px rgba(254, 227, 43, 0.26); }
      .primary-btn:disabled { background: rgba(32,29,24,0.08); color: var(--cat-olive); cursor: not-allowed; box-shadow: none; }
      .empty-state, .error-state { border-radius: 24px; padding: 50px 24px; text-align: center; background: linear-gradient(180deg, #fffef9 0%, #fffdf7 100%); border: 1px solid var(--cat-line); box-shadow: 0 16px 36px rgba(32,29,24,0.07); }
      .state-emoji { font-size: 54px; margin-bottom: 14px; }
      .state-title { margin: 0 0 8px; color: var(--cat-ink); font-size: 22px; font-weight: 900; letter-spacing: -0.03em; }
      .state-text { margin: 0 auto 18px; max-width: 520px; color: var(--cat-muted); font-size: 14px; line-height: 1.7; }
      .loading-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: radial-gradient(circle at top left, rgba(254,227,43,0.12), transparent 30%), linear-gradient(180deg, #fbfaf3 0%, #f7f6ef 100%); }
      .loading-card { width: min(540px, 100%); background: rgba(255,255,255,0.86); border: 1px solid var(--cat-line); border-radius: 28px; padding: 26px; box-shadow: 0 18px 44px rgba(32,29,24,0.08); }
      .skeleton { background: linear-gradient(90deg, rgba(32,29,24,0.06) 25%, rgba(32,29,24,0.12) 50%, rgba(32,29,24,0.06) 75%); background-size: 200% 100%; animation: shimmer 1.45s linear infinite; border-radius: 16px; }
      @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      @media (max-width: 980px) { .hero-panel { grid-template-columns: 1fr; } .hero-side { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (max-width: 768px) { .category-shell { width: min(100% - 20px, 1280px); } .category-header { padding: 24px 0 24px; } .section-title { font-size: 22px; } .product-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; } }
    `}</style>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: COLORS.surface,
      border: `1px solid ${COLORS.line}`,
      borderRadius: 22,
      boxShadow: "0 18px 40px rgba(32,29,24,0.08)",
      overflow: "hidden",
      ...style,
    }}>
      {children}
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
    <article className="product-card hover-lift fade-up" style={{ animationDelay: `${index * 55}ms` }}>
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
            {outOfStock && (
              <span className="badge badge-danger">Out of stock</span>
            )}
          </div>
          <div className="product-media-overlay" />
        </div>
        <div className="product-body">
          <h3 className="product-name">{p.name}</h3>
          {(p.brand || p.store_name) && (
            <p className="product-brand">{p.brand || p.store_name}</p>
          )}
          <div className="price-row">
            <span className="price-now">৳{Number(price).toLocaleString("en-BD")}</span>
            {hasDiscount && (
              <span className="price-old">৳{Number(p.min_price).toLocaleString("en-BD")}</span>
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
          {!outOfStock && <span>→</span>}
        </button>
      </div>
    </article>
  );
}

export default function CategoryPage() {
  const { slug } = useParams();
  const { fetchWithAuth, user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    const fetchCategory = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/categories/${slug}/products?page=${page}&limit=20`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load category");
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCategory();
  }, [slug, page]);

  const handleAddToCart = async (productId) => {
    if (!user) { navigate("/auth/login"); return; }
    try {
      const res = await fetch(`/api/products/${productId}`);
      const json = await res.json();
      const variant = json?.data?.variants?.[0];
      if (!variant) { alert("No variant available"); return; }
      await fetchWithAuth("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({ variant_id: variant.variant_id, quantity: 1 }),
      });
      navigate("/cart");
    } catch (err) {
      alert(err.message || "Failed to add to cart");
    }
  };

  if (loading) return (
    <div className="category-page">
      <GlobalStyles />
      <div className="category-shell" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="loading-card fade-in">
          <div className="skeleton" style={{ width: 86, height: 86, borderRadius: 24, marginBottom: 20 }} />
          <div className="skeleton" style={{ width: "55%", height: 28, marginBottom: 14 }} />
          <div className="skeleton" style={{ width: "78%", height: 14, marginBottom: 10 }} />
          <div className="skeleton" style={{ width: "62%", height: 14, marginBottom: 22 }} />
          <div className="skeleton" style={{ width: "100%", height: 58, borderRadius: 18, marginBottom: 14 }} />
          <div className="skeleton" style={{ width: "100%", height: 220, borderRadius: 22 }} />
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="category-page">
      <GlobalStyles />
      <div className="category-shell" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div className="error-state fade-up">
          <div className="state-emoji">⚠️</div>
          <h2 className="state-title">{error}</h2>
          <p className="state-text">There was a problem loading this category. Please try again later.</p>
          <Link
            to="/"
            className="primary-btn"
            style={{ display: "inline-flex", width: "auto", minWidth: 170, justifyContent: "center", textDecoration: "none" }}
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );

  const { category, products, meta } = data;
  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="category-page">
      <GlobalStyles />
      <header className="category-header">
        <div className="header-blob one" />
        <div className="header-blob two" />
        <div className="category-shell">
          <Link to="/" className="top-link fade-up" style={{ animationDelay: "0.02s" }}>
            <span style={{ fontSize: 14 }}>←</span>
            <span>Back to home</span>
          </Link>

          <div className="hero-panel">
            <div className="glass-card hero-main fade-up" style={{ animationDelay: "0.10s", padding: "22px 22px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <h1 className="hero-title">{category.name}</h1>
                  <p className="hero-subtitle">
                    Browse this category with a store-style product card layout that keeps the content clean, polished and easy to scan.
                  </p>
                  <div className="meta-row" style={{ marginTop: 18 }}>
                    <span className="meta-pill">{meta.total} product{meta.total !== 1 ? "s" : ""}</span>
                    <span className="meta-pill">Category</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, minWidth: 140 }}>
                  <span style={{ color: "rgba(255,255,255,0.48)", fontSize: 12, fontWeight: 700 }}>Browse by category</span>
                  <span style={{ color: "rgba(255,255,255,0.60)", fontSize: 13, lineHeight: 1.5 }}>
                    A more refined experience for category discovery and product selection.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main style={{ paddingBottom: 60 }}>
        <div className="category-shell">
          <div className="section-head fade-up" style={{ animationDelay: "0.24s" }}>
            <div>
              <h2 className="section-title">Products</h2>
              <p className="section-text">
                Clean product cards, refined hierarchy, and smoother interactions that match the store page experience.
              </p>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="empty-state fade-up" style={{ animationDelay: "0.28s" }}>
              <div className="state-emoji">📦</div>
              <h3 className="state-title">No products in this category yet</h3>
              <p className="state-text">
                Products will appear here once the seller adds them to this category.
              </p>
              <Link
                to="/"
                className="primary-btn"
                style={{ width: "auto", minWidth: 160, textDecoration: "none" }}
              >
                Browse all products
              </Link>
            </div>
          ) : (
            <>
              <div className="product-grid fade-up" style={{ animationDelay: "0.30s" }}>
                {products.map((p, index) => (
                  <ProductCard key={p.product_id} p={p} onAddToCart={handleAddToCart} index={index} />
                ))}
              </div>

              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 28 }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{ padding: "8px 16px", borderRadius: 10, border: `1.5px solid ${COLORS.olive}`, background: "transparent", color: COLORS.olive, fontWeight: 700, cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.5 : 1 }}
                  >
                    ← Prev
                  </button>
                  <span style={{ padding: "8px 16px", fontWeight: 700, color: COLORS.ink }}>
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{ padding: "8px 16px", borderRadius: 10, border: `1.5px solid ${COLORS.olive}`, background: "transparent", color: COLORS.olive, fontWeight: 700, cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.5 : 1 }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

