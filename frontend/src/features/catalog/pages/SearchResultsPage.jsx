import React from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = {
  page: "#f7f7f2",
  card: "rgba(255,255,255,0.82)",
  cardSolid: "#ffffff",
  soft: "#fff7be",
  primary: "#fee32b",
  primaryDeep: "#f6d90a",
  olive: "#8b7e35",
  oliveDark: "#5e5420",
  ink: "#171510",
  subtext: "rgba(23,21,16,0.68)",
  border: "rgba(23,21,16,0.10)",
  borderStrong: "rgba(23,21,16,0.16)",
  shadow: "0 20px 50px rgba(23,21,16,0.08)",
  shadowSoft: "0 12px 30px rgba(23,21,16,0.06)",
};

const LIMIT = 20;

const s = {
  input: {
    width: "100%",
    height: 52,
    borderRadius: 16,
    border: `1px solid ${COLORS.borderStrong}`,
    background: "rgba(255,255,255,0.9)",
    color: COLORS.ink,
    padding: "0 16px",
    fontSize: 14,
    outline: "none",
    transition: "all .25s ease",
    boxSizing: "border-box",
  },
  smallInput: {
    width: "100%",
    height: 46,
    borderRadius: 14,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.cardSolid,
    color: COLORS.ink,
    padding: "0 14px",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.8,
    color: COLORS.olive,
    margin: "0 0 7px",
  },
  btn: ({ primary = false, ghost = false } = {}) => ({
    height: 48,
    padding: ghost ? "0 16px" : "0 20px",
    borderRadius: 14,
    border: primary ? "none" : `1px solid ${COLORS.borderStrong}`,
    background: primary
      ? `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDeep} 100%)`
      : ghost
        ? "rgba(255,255,255,0.82)"
        : "transparent",
    color: COLORS.ink,
    fontWeight: 900,
    fontSize: 13,
    cursor: "pointer",
    transition: "all .25s ease",
    boxShadow: primary ? "0 12px 24px rgba(254,227,43,.28)" : "none",
    whiteSpace: "nowrap",
  }),
};

function SearchSkeletonCard({ index = 0 }) {
  return (
    <div
      className="sr-card sr-enter"
      style={{
        animationDelay: `${index * 60}ms`,
        overflow: "hidden",
        padding: 12,
      }}
    >
      <div className="sr-skeleton shimmer" style={{ height: 190, borderRadius: 18, marginBottom: 12 }} />
      <div className="sr-skeleton shimmer" style={{ height: 14, width: "78%", borderRadius: 999, marginBottom: 10 }} />
      <div className="sr-skeleton shimmer" style={{ height: 12, width: "42%", borderRadius: 999, marginBottom: 14 }} />
      <div className="sr-skeleton shimmer" style={{ height: 18, width: "36%", borderRadius: 999, marginBottom: 16 }} />
      <div className="sr-skeleton shimmer" style={{ height: 42, borderRadius: 14 }} />
    </div>
  );
}

function ProductCard({ p, onAddToCart, index = 0 }) {
  const price = p.discount_price || p.min_price || p.price || 0;
  const original = p.min_price || p.price || 0;
  const hasDiscount = p.discount_price && Number(p.discount_price) < Number(original);
  const outOfStock = Number(p.total_stock ?? p.stock ?? 1) <= 0;
  const pct = hasDiscount
    ? Math.round(((Number(original) - Number(p.discount_price)) / Number(original)) * 100)
    : 0;
  const pid = p.product_id || p.id;

  return (
    <article className="sr-card sr-product sr-enter" style={{ animationDelay: `${index * 55}ms` }}>
      <Link to={`/p/${pid}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
        <div className="sr-media-wrap">
          <img
            src={p.image_url || p.image || "https://via.placeholder.com/300?text=?"}
            alt={p.name}
            className="sr-media"
          />

          <div className="sr-media-glow" />

          {hasDiscount && <span className="sr-badge sr-badge-sale">{pct}% OFF</span>}
          {p.brand && <span className="sr-badge sr-badge-brand">{p.brand}</span>}

          {outOfStock && (
            <div className="sr-stock-overlay">
              <span>Out of stock</span>
            </div>
          )}
        </div>

        <div style={{ padding: "16px 16px 12px" }}>
          <h3
            style={{
              fontSize: 15,
              lineHeight: 1.42,
              fontWeight: 800,
              color: COLORS.ink,
              margin: "0 0 8px",
              minHeight: 42,
            }}
          >
            {p.name}
          </h3>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: outOfStock ? "#ef4444" : "#22c55e",
                boxShadow: outOfStock ? "0 0 0 5px rgba(239,68,68,.08)" : "0 0 0 5px rgba(34,197,94,.08)",
              }}
            />
            <span style={{ fontSize: 12, color: COLORS.subtext, fontWeight: 700 }}>
              {outOfStock ? "Currently unavailable" : "Ready to ship"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 900, fontSize: 20, color: COLORS.ink }}>
              ৳{Number(price).toLocaleString("en-IN")}
            </span>
            {hasDiscount && (
              <span
                style={{
                  fontSize: 12,
                  color: "rgba(23,21,16,0.4)",
                  textDecoration: "line-through",
                  fontWeight: 700,
                }}
              >
                ৳{Number(original).toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div style={{ padding: "0 16px 16px" }}>
        <button
          onClick={() => !outOfStock && onAddToCart(pid)}
          className={`sr-cart-btn ${outOfStock ? "is-disabled" : ""}`}
          type="button"
          aria-label={outOfStock ? `${p.name} is out of stock` : `Add ${p.name} to cart`}
        >
          <span>{outOfStock ? "Out of stock" : "Add to cart"}</span>
          {!outOfStock && <span className="sr-cart-arrow">→</span>}
        </button>
      </div>
    </article>
  );
}

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchWithAuth, user } = useAuth();

  const [inputValue, setInputValue] = React.useState(searchParams.get("q") || "");
  const [suggestions, setSuggestions] = React.useState([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  const [minPrice, setMinPrice] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [inStock, setInStock] = React.useState("");
  const [sort, setSort] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [categories, setCategories] = React.useState([]);

  const [products, setProducts] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [searched, setSearched] = React.useState(false);

  const debounceRef = React.useRef(null);
  const currentQ = searchParams.get("q") || "";

  React.useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.data || d || []))
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    const uid = user?.user_id ?? null;
    const url = uid
      ? `/api/products/search/suggestions?user_id=${uid}&limit=8`
      : `/api/products/search/suggestions?limit=8`;

    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setSuggestions((prev) => {
          if (!inputValue.trim()) return (d.data || []).map((s) => ({ ...s, isHistory: true }));
          return prev;
        });
      })
      .catch(() => {});
  }, [user?.user_id]);

  const runSearch = React.useCallback(
    async (q, filters, pg) => {
      setLoading(true);
      setSearched(true);

      try {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        params.set("page", pg);
        params.set("limit", LIMIT);
        if (filters.minPrice) params.set("min_price", filters.minPrice);
        if (filters.maxPrice) params.set("max_price", filters.maxPrice);
        if (filters.inStock) params.set("in_stock", filters.inStock);
        if (filters.sort) params.set("sort", filters.sort);
        if (filters.categoryId) params.set("category_id", filters.categoryId);
        if (user?.user_id) params.set("user_id", user.user_id);

        const res = await fetch(`/api/products/search?${params}`);
        const data = await res.json();
        setProducts(data.data || []);
        setTotal(data.meta?.total || 0);
        setPage(pg);
      } catch (err) {
        console.error("search error:", err);
        setProducts([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [user?.user_id]
  );

  React.useEffect(() => {
    setInputValue(currentQ);
    runSearch(currentQ, { minPrice, maxPrice, inStock, sort, categoryId }, 1);
  }, [currentQ]);

  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!inputValue.trim()) {
      const uid = user?.user_id ?? null;
      const url = uid
        ? `/api/products/search/suggestions?user_id=${uid}&limit=8`
        : `/api/products/search/suggestions?limit=8`;

      fetch(url)
        .then((r) => r.json())
        .then((d) => setSuggestions((d.data || []).map((s) => ({ ...s, isHistory: true }))))
        .catch(() => setSuggestions([]));
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const [autoRes, histRes] = await Promise.all([
          fetch(`/api/products/search/autocomplete?q=${encodeURIComponent(inputValue)}`),
          fetch(`/api/products/search/suggestions?user_id=${user?.user_id ?? ""}&limit=5`),
        ]);

        const autoData = await autoRes.json();
        const histData = await histRes.json();

        const autoItems = (autoData.data || []).map((s) => ({ query: s.name, isHistory: false }));
        const histItems = (histData.data || [])
          .filter((s) => s.query?.toLowerCase().startsWith(inputValue.toLowerCase()))
          .map((s) => ({ ...s, isHistory: true }));

        const seen = new Set();
        const merged = [...histItems, ...autoItems].filter((item) => {
          if (seen.has(item.query)) return false;
          seen.add(item.query);
          return true;
        });

        setSuggestions(merged.slice(0, 8));
      } catch {
        setSuggestions([]);
      }
    }, 280);

    return () => clearTimeout(debounceRef.current);
  }, [inputValue, user?.user_id]);

  const handleSearch = (e) => {
    e?.preventDefault();
    setShowSuggestions(false);
    setSearchParams({ q: inputValue.trim() });
  };

  const handleApplyFilters = () => {
    runSearch(currentQ, { minPrice, maxPrice, inStock, sort, categoryId }, 1);
  };

  const handleClearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setInStock("");
    setSort("");
    setCategoryId("");
    runSearch(currentQ, { minPrice: "", maxPrice: "", inStock: "", sort: "", categoryId: "" }, 1);
  };

  const handlePageChange = (newPage) => {
    runSearch(currentQ, { minPrice, maxPrice, inStock, sort, categoryId }, newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
        body: JSON.stringify({ variant_id: variant.variant_id, quantity: 1 }),
      });
      navigate("/cart");
    } catch (err) {
      alert(err.message || "Failed to add to cart");
    }
  };

  const totalPages = Math.ceil(total / LIMIT);
  const activeFilterCount = [minPrice, maxPrice, inStock, sort, categoryId].filter(Boolean).length;

  return (
    <>
      <style>{`
        .sr-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 15% 20%, rgba(254,227,43,0.20), transparent 30%),
            radial-gradient(circle at 85% 15%, rgba(139,126,53,0.10), transparent 26%),
            linear-gradient(180deg, #fffdf4 0%, #f7f7f2 45%, #f4f4ef 100%);
          position: relative;
          overflow: hidden;
        }
        .sr-shell {
          position: relative;
          z-index: 2;
          max-width: 1320px;
          margin: 0 auto;
          padding: 40px 18px 64px;
          box-sizing: border-box;
        }
        .sr-blob,
        .sr-blob::before {
          position: absolute;
          border-radius: 999px;
          filter: blur(10px);
          pointer-events: none;
        }
        .sr-blob.one {
          width: 320px;
          height: 320px;
          right: -120px;
          top: 80px;
          background: rgba(254,227,43,0.18);
          animation: srFloat 12s ease-in-out infinite;
        }
        .sr-blob.two {
          width: 240px;
          height: 240px;
          left: -70px;
          top: 420px;
          background: rgba(139,126,53,0.10);
          animation: srFloat 15s ease-in-out infinite reverse;
        }
        .sr-hero {
          position: relative;
          background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.75));
          border: 1px solid rgba(23,21,16,0.08);
          box-shadow: 0 24px 60px rgba(23,21,16,0.08);
          backdrop-filter: blur(12px);
          border-radius: 28px;
          padding: 28px;
          overflow: hidden;
          margin-bottom: 20px;
        }
        .sr-hero::after {
          content: "";
          position: absolute;
          inset: auto -20% -65% auto;
          width: 340px;
          height: 340px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(254,227,43,.30), transparent 60%);
          pointer-events: none;
        }
        .sr-enter {
          opacity: 0;
          transform: translateY(24px);
          animation: srReveal .7s cubic-bezier(.2,.7,.2,1) forwards;
        }
        .sr-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(254,227,43,0.16);
          color: ${COLORS.oliveDark};
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .4px;
          margin-bottom: 14px;
        }
        .sr-heading {
          font-size: clamp(28px, 4.2vw, 46px);
          line-height: 1.08;
          letter-spacing: -0.03em;
          color: ${COLORS.ink};
          font-weight: 900;
          margin: 0 0 10px;
          max-width: 840px;
        }
        .sr-subtitle {
          color: ${COLORS.subtext};
          font-size: 15px;
          line-height: 1.7;
          max-width: 720px;
          margin: 0;
        }
        .sr-form-wrap {
          margin-top: 24px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
          align-items: start;
        }
        .sr-search-box {
          position: relative;
        }
        .sr-search-shell {
          position: relative;
          padding: 6px;
          border-radius: 22px;
          background: linear-gradient(135deg, rgba(254,227,43,.24), rgba(255,255,255,.96));
          box-shadow: 0 18px 36px rgba(23,21,16,0.08);
        }
        .sr-search-shell::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(110deg, transparent 20%, rgba(255,255,255,.55) 40%, transparent 60%);
          transform: translateX(-120%);
          animation: srSweep 4.8s linear infinite;
          pointer-events: none;
        }
        .sr-search-inner {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.92);
          border-radius: 18px;
          padding: 0 16px;
        }
        .sr-search-icon {
          flex: 0 0 auto;
          color: ${COLORS.olive};
          font-size: 18px;
        }
        .sr-search-input {
          border: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
        }
        .sr-suggestions {
          position: absolute;
          top: calc(100% + 10px);
          left: 0;
          right: 0;
          border-radius: 18px;
          border: 1px solid rgba(23,21,16,0.08);
          background: rgba(255,255,255,.95);
          backdrop-filter: blur(14px);
          box-shadow: 0 20px 44px rgba(23,21,16,0.12);
          overflow: hidden;
          z-index: 40;
          transform-origin: top center;
          animation: srDropdown .2s ease;
        }
        .sr-suggestion-btn {
          width: 100%;
          text-align: left;
          padding: 12px 14px;
          border: 0;
          background: transparent;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-size: 13px;
          color: ${COLORS.ink};
          transition: background .18s ease, transform .18s ease;
        }
        .sr-suggestion-btn:hover {
          background: rgba(254,227,43,.14);
        }
        .sr-filter-bar {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 12px;
          background: rgba(255,255,255,0.78);
          border: 1px solid rgba(23,21,16,0.08);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          padding: 18px;
          box-shadow: ${COLORS.shadowSoft};
          margin-bottom: 22px;
        }
        .sr-filter-actions {
          display: flex;
          gap: 8px;
          align-items: end;
          flex-wrap: wrap;
        }
        .sr-results-top {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
          margin: 0 0 20px;
          flex-wrap: wrap;
        }
        .sr-chip-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .sr-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,.84);
          border: 1px solid rgba(23,21,16,.08);
          color: ${COLORS.ink};
          font-size: 12px;
          font-weight: 800;
          box-shadow: 0 8px 16px rgba(23,21,16,0.04);
        }
        .sr-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(245px, 1fr));
          gap: 18px;
          margin-bottom: 34px;
        }
        .sr-card {
          background: linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.80));
          border: 1px solid rgba(23,21,16,0.08);
          border-radius: 24px;
          box-shadow: ${COLORS.shadowSoft};
          backdrop-filter: blur(10px);
        }
        .sr-product {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: transform .35s cubic-bezier(.2,.7,.2,1), box-shadow .35s ease, border-color .35s ease;
          position: relative;
          isolation: isolate;
        }
        .sr-product::before {
          content: "";
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(140deg, rgba(254,227,43,.42), rgba(255,255,255,0), rgba(139,126,53,.18));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity .28s ease;
          pointer-events: none;
        }
        .sr-product:hover {
          transform: translateY(-8px);
          box-shadow: 0 26px 50px rgba(23,21,16,0.12);
          border-color: rgba(254,227,43,.30);
        }
        .sr-product:hover::before {
          opacity: 1;
        }
        .sr-media-wrap {
          position: relative;
          height: 230px;
          overflow: hidden;
          margin: 12px 12px 0;
          border-radius: 18px;
          background: linear-gradient(180deg, #fff6bb, #f5f0d2);
        }
        .sr-media {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform .7s cubic-bezier(.2,.7,.2,1), filter .35s ease;
        }
        .sr-product:hover .sr-media {
          transform: scale(1.06);
          filter: saturate(1.03) contrast(1.02);
        }
        .sr-media-glow {
          position: absolute;
          inset: auto -14% -30% auto;
          width: 160px;
          height: 160px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(254,227,43,.26), transparent 70%);
          pointer-events: none;
        }
        .sr-badge {
          position: absolute;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
          border-radius: 999px;
          font-size: 11px;
          font-weight: 900;
          padding: 7px 10px;
          letter-spacing: .3px;
        }
        .sr-badge-sale {
          top: 12px;
          left: 12px;
          background: ${COLORS.primary};
          color: ${COLORS.ink};
          box-shadow: 0 10px 18px rgba(254,227,43,.28);
        }
        .sr-badge-brand {
          right: 12px;
          bottom: 12px;
          max-width: calc(100% - 24px);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          background: rgba(23,21,16,.78);
          color: #fff;
        }
        .sr-stock-overlay {
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,.72);
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
        }
        .sr-stock-overlay span {
          font-size: 12px;
          font-weight: 900;
          color: #b91c1c;
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(255,255,255,.85);
          border: 1px solid rgba(185,28,28,.10);
        }
        .sr-cart-btn {
          width: 100%;
          height: 48px;
          border: 0;
          border-radius: 14px;
          background: linear-gradient(135deg, ${COLORS.ink} 0%, #2c271c 100%);
          color: white;
          font-weight: 900;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: transform .25s ease, box-shadow .25s ease, opacity .25s ease;
          box-shadow: 0 14px 26px rgba(23,21,16,0.16);
        }
        .sr-cart-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 32px rgba(23,21,16,0.20);
        }
        .sr-cart-btn.is-disabled {
          cursor: not-allowed;
          opacity: .58;
          box-shadow: none;
          background: rgba(23,21,16,.12);
          color: ${COLORS.oliveDark};
        }
        .sr-cart-arrow {
          display: inline-block;
          transition: transform .22s ease;
        }
        .sr-cart-btn:hover .sr-cart-arrow {
          transform: translateX(3px);
        }
        .sr-empty,
        .sr-loading,
        .sr-no-query {
          padding: 52px 22px;
          text-align: center;
        }
        .sr-empty-emoji {
          font-size: 54px;
          display: inline-block;
          animation: srFloat 3.2s ease-in-out infinite;
          margin-bottom: 12px;
        }
        .sr-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .sr-page-btn {
          min-width: 42px;
          height: 42px;
          border-radius: 12px;
          border: 1px solid rgba(23,21,16,.10);
          background: rgba(255,255,255,.84);
          color: ${COLORS.ink};
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: all .22s ease;
        }
        .sr-page-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(23,21,16,0.08);
        }
        .sr-page-btn.is-active {
          background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDeep} 100%);
          border-color: transparent;
          box-shadow: 0 12px 22px rgba(254,227,43,.24);
        }
        .sr-page-btn:disabled {
          opacity: .4;
          cursor: not-allowed;
        }
        .sr-skeleton {
          background: linear-gradient(90deg, rgba(23,21,16,.06) 20%, rgba(23,21,16,.09) 45%, rgba(23,21,16,.06) 70%);
          background-size: 200% 100%;
        }
        .shimmer {
          animation: shimmer 1.3s linear infinite;
        }
        @keyframes srReveal {
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes srDropdown {
          from { opacity: 0; transform: translateY(8px) scale(.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes srSweep {
          0% { transform: translateX(-130%); }
          100% { transform: translateX(130%); }
        }
        @keyframes srFloat {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @media (max-width: 1100px) {
          .sr-filter-bar { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 768px) {
          .sr-shell { padding: 24px 14px 48px; }
          .sr-hero { padding: 20px; border-radius: 22px; }
          .sr-form-wrap { grid-template-columns: 1fr; }
          .sr-filter-bar { grid-template-columns: repeat(2, minmax(0, 1fr)); border-radius: 20px; }
          .sr-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; }
          .sr-media-wrap { height: 180px; }
          .sr-cart-btn { height: 44px; }
        }
        @media (max-width: 520px) {
          .sr-filter-bar { grid-template-columns: 1fr; }
          .sr-grid { grid-template-columns: 1fr 1fr; }
          .sr-heading { font-size: 30px; }
          .sr-chip-row { width: 100%; }
        }
      `}</style>

      <div className="sr-page">
        <div className="sr-blob one" />
        <div className="sr-blob two" />

        <div className="sr-shell">
          <section className="sr-hero sr-enter">
            <div className="sr-eyebrow">✦ Premium product discovery</div>
            <h1 className="sr-heading">
              {currentQ ? `Results for “${currentQ}”` : "Search Products"}
            </h1>
            <p className="sr-subtitle">
              Discover products with refined filters, smoother interactions, elegant spacing, and a more premium browsing flow.
            </p>

            <form onSubmit={handleSearch} className="sr-form-wrap">
              <div className="sr-search-box">
                <div className="sr-search-shell">
                  <div className="sr-search-inner">
                    <span className="sr-search-icon">⌕</span>
                    <input
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
                      placeholder="Search products, brands..."
                      style={{ ...s.input }}
                      className="sr-search-input"
                    />
                  </div>
                </div>

                {showSuggestions && suggestions.length > 0 && (
                  <div className="sr-suggestions">
                    {!inputValue.trim() && (
                      <p
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: COLORS.olive,
                          letterSpacing: 1,
                          textTransform: "uppercase",
                          padding: "12px 14px 6px",
                          margin: 0,
                        }}
                      >
                        {user ? "Your recent searches" : "Popular searches"}
                      </p>
                    )}

                    {suggestions.map((item, i) => (
                      <button
                        key={`${item.query}-${i}`}
                        type="button"
                        className="sr-suggestion-btn"
                        onMouseDown={() => {
                          setInputValue(item.query);
                          setShowSuggestions(false);
                          setSearchParams({ q: item.query });
                        }}
                      >
                        <span style={{ fontSize: 14, opacity: 0.7 }}>{item.isHistory ? "🕐" : "🔍"}</span>
                        <span style={{ flex: 1 }}>{item.query}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" style={s.btn({ primary: true })}>
                Search now
              </button>
            </form>
          </section>

          <section className="sr-filter-bar sr-enter" style={{ animationDelay: "90ms" }}>
            <div>
              <p style={s.filterLabel}>MIN PRICE</p>
              <input
                type="number"
                placeholder="৳ 0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                style={s.smallInput}
              />
            </div>

            <div>
              <p style={s.filterLabel}>MAX PRICE</p>
              <input
                type="number"
                placeholder="৳ any"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                style={s.smallInput}
              />
            </div>

            <div>
              <p style={s.filterLabel}>AVAILABILITY</p>
              <select value={inStock} onChange={(e) => setInStock(e.target.value)} style={s.smallInput}>
                <option value="">Any</option>
                <option value="true">In stock</option>
                <option value="false">Out of stock</option>
              </select>
            </div>

            <div>
              <p style={s.filterLabel}>CATEGORY</p>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={s.smallInput}>
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p style={s.filterLabel}>SORT BY</p>
              <select value={sort} onChange={(e) => setSort(e.target.value)} style={s.smallInput}>
                <option value="">Newest first</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="newest">Newest</option>
                <option value="most_viewed">Most viewed</option>
              </select>
            </div>

            <div className="sr-filter-actions">
              <button type="button" onClick={handleApplyFilters} style={s.btn({ primary: true })}>
                Apply filters
              </button>
              <button type="button" onClick={handleClearFilters} style={s.btn({ ghost: true })}>
                Clear
              </button>
            </div>
          </section>

          <div className="sr-results-top sr-enter" style={{ animationDelay: "140ms" }}>
            <div className="sr-chip-row">
              <span className="sr-chip">{loading ? "Searching..." : `${total} result${total !== 1 ? "s" : ""}`}</span>
              {activeFilterCount > 0 && <span className="sr-chip">{activeFilterCount} active filter{activeFilterCount > 1 ? "s" : ""}</span>}
              {currentQ && <span className="sr-chip">Query: {currentQ}</span>}
            </div>
          </div>

          {loading ? (
            <div className="sr-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <SearchSkeletonCard key={i} index={i} />
              ))}
            </div>
          ) : !searched ? (
            <div className="sr-card sr-no-query sr-enter">
              <div className="sr-empty-emoji">🛍️</div>
              <p style={{ fontWeight: 900, color: COLORS.ink, fontSize: 18, margin: "0 0 8px" }}>Type something to search</p>
              <p style={{ color: COLORS.subtext, fontSize: 14, margin: 0 }}>Start with a product name, brand, or category.</p>
            </div>
          ) : products.length === 0 ? (
            <div className="sr-card sr-empty sr-enter">
              <div className="sr-empty-emoji">😔</div>
              <p style={{ fontWeight: 900, fontSize: 18, color: COLORS.ink, margin: "0 0 8px" }}>
                No results for “{currentQ}”
              </p>
              <p style={{ fontSize: 14, color: COLORS.subtext, margin: "0 0 18px" }}>
                Try different keywords or remove some filters to widen the search.
              </p>
              <button type="button" onClick={handleClearFilters} style={s.btn({ primary: true })}>
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="sr-grid">
                {products.map((p, i) => (
                  <ProductCard key={p.product_id || p.id} p={p} onAddToCart={handleAddToCart} index={i} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="sr-pagination sr-enter" style={{ animationDelay: "120ms" }}>
                  <button
                    type="button"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="sr-page-btn"
                  >
                    ← Prev
                  </button>

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pg = page <= 3 ? i + 1 : page - 2 + i;
                    if (pg < 1 || pg > totalPages) return null;
                    return (
                      <button
                        key={pg}
                        type="button"
                        onClick={() => handlePageChange(pg)}
                        className={`sr-page-btn ${pg === page ? "is-active" : ""}`}
                      >
                        {pg}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="sr-page-btn"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
