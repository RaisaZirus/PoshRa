import React from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = {
  bg: "#FDFDF9", soft: "#FBEF9C",
  primary: "#FEE32B", olive: "#877928", ink: "#201D18",
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  card: {
    background: COLORS.bg, border: `1px solid rgba(32,29,24,0.12)`,
    borderRadius: 16, boxShadow: "0 10px 26px rgba(32,29,24,0.08)", overflow: "hidden",
  },
  input: {
    padding: "10px 14px", fontSize: 13, borderRadius: 10,
    border: `1px solid rgba(32,29,24,0.2)`, background: COLORS.bg,
    color: COLORS.ink, outline: "none", width: "100%",
  },
  btn: (primary) => ({
    padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 900,
    cursor: "pointer", border: "none",
    background: primary ? COLORS.ink : "transparent",
    color: primary ? COLORS.primary : COLORS.olive,
    ...(primary ? {} : { border: `1px solid ${COLORS.olive}` }),
  }),
  badge: (status) => {
    const map = {
      pending: { bg: "#FEF9C3", text: "#854D0E" },
      processing: { bg: "#DBEAFE", text: "#1E40AF" },
      delivered: { bg: "#DCFCE7", text: "#166534" },
    };
    const c = map[status] || { bg: COLORS.soft, text: COLORS.olive };
    return { background: c.bg, color: c.text, fontSize: 11, fontWeight: 900, padding: "2px 8px", borderRadius: 999 };
  },
};

// ── Product card ──────────────────────────────────────────────────────────────
function ProductCard({ p, onAddToCart }) {
  const price = p.discount_price || p.min_price || p.price || 0;
  const original = p.min_price || p.price || 0;
  const hasDiscount = p.discount_price && Number(p.discount_price) < Number(original);
  const outOfStock = Number(p.total_stock ?? p.stock ?? 1) <= 0;
  const pct = hasDiscount ? Math.round(((Number(original) - Number(p.discount_price)) / Number(original)) * 100) : 0;
  const pid = p.product_id || p.id;

  return (
    <div style={{ ...s.card, display: "flex", flexDirection: "column" }}>
      <Link to={`/p/${pid}`} style={{ textDecoration: "none", color: "inherit" }}>
        <div style={{ position: "relative" }}>
          <img
            src={p.image_url || p.image || "https://via.placeholder.com/300?text=?"}
            alt={p.name}
            style={{ width: "100%", height: 160, objectFit: "cover", background: COLORS.soft, display: "block" }}
          />
          {hasDiscount && (
            <span style={{
              position: "absolute", top: 8, left: 8, background: COLORS.primary,
              color: COLORS.ink, fontSize: 11, fontWeight: 900, padding: "2px 8px", borderRadius: 6,
            }}>{pct}% OFF</span>
          )}
          {outOfStock && (
            <div style={{
              position: "absolute", inset: 0, background: "rgba(255,255,255,0.75)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontWeight: 900, fontSize: 12, color: "#dc2626" }}>Out of stock</span>
            </div>
          )}
        </div>
        <div style={{ padding: "10px 12px 6px" }}>
          <p style={{ fontWeight: 800, fontSize: 13, color: COLORS.ink, margin: "0 0 2px", lineHeight: 1.3 }}>{p.name}</p>
          <p style={{ fontSize: 11, color: COLORS.olive, margin: "0 0 6px" }}>{p.brand || "—"}</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontWeight: 900, fontSize: 15, color: COLORS.ink }}>
              ₹{Number(price).toLocaleString("en-IN")}
            </span>
            {hasDiscount && (
              <span style={{ fontSize: 11, color: "rgba(32,29,24,0.4)", textDecoration: "line-through" }}>
                ₹{Number(original).toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </div>
      </Link>
      <div style={{ padding: "6px 12px 12px" }}>
        <button
          onClick={() => !outOfStock && onAddToCart(pid)}
          style={{
            width: "100%", padding: "9px 0", borderRadius: 10, border: "none",
            background: outOfStock ? "rgba(32,29,24,0.08)" : COLORS.primary,
            color: outOfStock ? COLORS.olive : COLORS.ink,
            fontWeight: 900, fontSize: 12,
            cursor: outOfStock ? "not-allowed" : "pointer",
          }}
        >
          {outOfStock ? "Out of stock" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const LIMIT = 20;

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchWithAuth, user } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [inputValue, setInputValue] = React.useState(searchParams.get("q") || "");
  const [suggestions, setSuggestions] = React.useState([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  const [minPrice, setMinPrice] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [inStock, setInStock] = React.useState("");
  const [sort, setSort] = React.useState("");

  const [products, setProducts] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [searched, setSearched] = React.useState(false);

  const debounceRef = React.useRef(null);
  const currentQ = searchParams.get("q") || "";

  // ── Fetch search results ───────────────────────────────────────────────────
  const runSearch = React.useCallback(async (q, filters, pg) => {
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

      const res = await fetch(`/api/products/search?${params}`);
      const data = await res.json();
      setProducts(data.data || []);
      setTotal(data.meta?.total || 0);
      setPage(pg);
    } catch (err) {
      console.error("search error:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Run search when URL query changes ──────────────────────────────────────
  React.useEffect(() => {
    setInputValue(currentQ);
    runSearch(currentQ, { minPrice, maxPrice, inStock, sort }, 1);
  }, [currentQ]); // only fires when URL changes

  // ── Autocomplete ───────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!inputValue.trim()) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/search/autocomplete?q=${encodeURIComponent(inputValue)}`);
        const data = await res.json();
        setSuggestions(data.data || []);
      } catch { setSuggestions([]); }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [inputValue]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    e?.preventDefault();
    setShowSuggestions(false);
    setSearchParams({ q: inputValue.trim() });
    // URL change will trigger the useEffect above
  };

  const handleApplyFilters = () => {
    runSearch(currentQ, { minPrice, maxPrice, inStock, sort }, 1);
  };

  const handleClearFilters = () => {
    setMinPrice(""); setMaxPrice(""); setInStock(""); setSort("");
    runSearch(currentQ, { minPrice: "", maxPrice: "", inStock: "", sort: "" }, 1);
  };

  const handlePageChange = (newPage) => {
    runSearch(currentQ, { minPrice, maxPrice, inStock, sort }, newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  const totalPages = Math.ceil(total / LIMIT);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: COLORS.soft, minHeight: "100vh", paddingBottom: 60, fontFamily: "system-ui, sans-serif" }}>
      <div className="container mx-auto px-4 py-8">

        {/* Search bar */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: COLORS.ink, margin: "0 0 14px" }}>
            {currentQ ? `Results for "${currentQ}"` : "Search products"}
          </h1>

          <form onSubmit={handleSearch} style={{ position: "relative", maxWidth: 540, display: "flex", gap: 8 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                value={inputValue}
                onChange={(e) => { setInputValue(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
                placeholder="Search products, brands..."
                style={s.input}
              />
              {/* Autocomplete */}
              {showSuggestions && suggestions.length > 0 && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                  background: COLORS.bg, border: `1px solid rgba(32,29,24,0.15)`,
                  borderRadius: 12, zIndex: 30, overflow: "hidden",
                  boxShadow: "0 8px 24px rgba(32,29,24,0.1)",
                }}>
                  {suggestions.map((s, i) => (
                    <button
                      key={i} type="button"
                      onMouseDown={() => {
                        setInputValue(s.name);
                        setShowSuggestions(false);
                        setSearchParams({ q: s.name });
                      }}
                      style={{
                        width: "100%", textAlign: "left", padding: "10px 14px",
                        background: "none", border: "none", fontSize: 13,
                        color: COLORS.ink, cursor: "pointer", display: "block",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = COLORS.soft}
                      onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                    >
                      🔍 {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" style={s.btn(true)}>Search</button>
          </form>
        </div>

        {/* Filters */}
        <div style={{
          background: COLORS.bg, border: `1px solid rgba(32,29,24,0.1)`,
          borderRadius: 14, padding: "14px 16px", marginBottom: 24,
          display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end",
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.olive, margin: "0 0 4px" }}>MIN PRICE</p>
            <input
              type="number" placeholder="₹ 0" value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              style={{ ...s.input, width: 90 }}
            />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.olive, margin: "0 0 4px" }}>MAX PRICE</p>
            <input
              type="number" placeholder="₹ any" value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              style={{ ...s.input, width: 90 }}
            />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.olive, margin: "0 0 4px" }}>AVAILABILITY</p>
            <select
              value={inStock}
              onChange={(e) => setInStock(e.target.value)}
              style={{ ...s.input, width: 130 }}
            >
              <option value="">Any</option>
              <option value="true">In stock</option>
              <option value="false">Out of stock</option>
            </select>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.olive, margin: "0 0 4px" }}>SORT BY</p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{ ...s.input, width: 160 }}
            >
              <option value="">Newest first</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="newest">Newest</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={handleApplyFilters} style={s.btn(true)}>Apply</button>
            <button onClick={handleClearFilters} style={s.btn(false)}>Clear</button>
          </div>
          {searched && (
            <span style={{ fontSize: 13, color: COLORS.olive, marginLeft: 4, alignSelf: "center" }}>
              {loading ? "Searching..." : `${total} result${total !== 1 ? "s" : ""}`}
            </span>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            <p style={{ fontWeight: 700, color: COLORS.olive }}>Searching...</p>
          </div>
        ) : !searched ? (
          <div style={{ textAlign: "center", padding: 60, color: COLORS.olive }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🛍️</div>
            <p style={{ fontWeight: 700 }}>Type something to search</p>
          </div>
        ) : products.length === 0 ? (
          <div style={{ ...s.card, padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>😔</div>
            <p style={{ fontWeight: 800, fontSize: 16, color: COLORS.ink, marginBottom: 8 }}>
              No results for "{currentQ}"
            </p>
            <p style={{ fontSize: 13, color: COLORS.olive, marginBottom: 20 }}>
              Try different keywords or remove some filters.
            </p>
            <button onClick={handleClearFilters} style={{ ...s.btn(true), padding: "10px 24px" }}>
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 16, marginBottom: 32,
            }}>
              {products.map((p) => (
                <ProductCard key={p.product_id || p.id} p={p} onAddToCart={handleAddToCart} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  style={{ ...s.btn(false), opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? "not-allowed" : "pointer" }}
                >← Prev</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pg = page <= 3 ? i + 1 : page - 2 + i;
                  if (pg < 1 || pg > totalPages) return null;
                  return (
                    <button
                      key={pg}
                      onClick={() => handlePageChange(pg)}
                      style={{
                        width: 36, height: 36, borderRadius: 8, border: "none",
                        background: pg === page ? COLORS.primary : "transparent",
                        color: COLORS.ink, fontWeight: pg === page ? 900 : 400,
                        cursor: "pointer", fontSize: 13,
                      }}
                    >{pg}</button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  style={{ ...s.btn(false), opacity: page === totalPages ? 0.4 : 1, cursor: page === totalPages ? "not-allowed" : "pointer" }}
                >Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}