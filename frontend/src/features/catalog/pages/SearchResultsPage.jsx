import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useProductStore } from "../../../store/useProductStore";
import ProductCard from "../../../components/ProductCard";

const COLORS = {
  bg: "#FDFDF9",
  soft: "#FBEF9C",
  primary: "#FEE32B",
  olive: "#877928",
  ink: "#201D18",
};

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get("q") || "";
  const { products, loading, error, searchProducts, fetchSearchSuggestions, searchHistory, fetchAutocomplete, autocompleteResults } = useProductStore();
  const [input, setInput] = useState(q);
  const [filters, setFilters] = useState({ minPrice: "", maxPrice: "", inStock: "", sort: "" });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    searchProducts(q);
    setInput(q);
  }, [q]);

  useEffect(() => {
    // when filters change and there's an active query, re-run search
    if (q !== null) {
      const cleaned = {};
      if (filters.minPrice) cleaned.minPrice = filters.minPrice;
      if (filters.maxPrice) cleaned.maxPrice = filters.maxPrice;
      if (filters.inStock !== "") cleaned.inStock = filters.inStock;
      if (filters.sort) cleaned.sort = filters.sort;
      searchProducts(q, cleaned);
    }
  }, [filters]);

  useEffect(() => {
    fetchSearchSuggestions();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (input.trim()) {
        fetchAutocomplete(input);
      } else {
        fetchAutocomplete("");
      }
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [input]);

  const onSubmit = (e) => {
    e.preventDefault();
    const target = input || "";
    navigate(`/search?q=${encodeURIComponent(target)}`);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (query) => {
    setInput(query);
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setShowSuggestions(false);
  };

  const handleAutocompleteClick = (name) => {
    setInput(name);
    navigate(`/search?q=${encodeURIComponent(name)}`);
    setShowSuggestions(false);
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: COLORS.ink, fontSize: 28, fontWeight: 900, letterSpacing: 0.4 }}>Search</h1>
        {q && <p style={{ margin: "8px 0 0", color: "rgba(32,29,24,0.7)", fontSize: 14 }}>Results for "{q}"</p>}
      </div>

      <form onSubmit={onSubmit} style={{ marginBottom: 20, position: "relative" }}>
        <input
          className="input input-bordered"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Search products..."
          style={{
            width: "100%",
            maxWidth: 500,
            padding: "12px 14px",
            fontSize: 14,
            border: `1px solid rgba(32,29,24,0.2)`,
            borderRadius: 12,
            background: COLORS.bg,
            color: COLORS.ink,
          }}
        />
        
        {/* Autocomplete and search suggestions dropdown */}
        {showSuggestions && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              width: "100%",
              maxWidth: 500,
              background: COLORS.bg,
              border: `1px solid rgba(32,29,24,0.15)`,
              borderRadius: 12,
              marginTop: 4,
              maxHeight: 320,
              overflowY: "auto",
              boxShadow: "0 10px 26px rgba(32,29,24,0.1)",
              zIndex: 10,
            }}
          >
            <div style={{ padding: 10 }}>
              {/* Autocomplete results */}
              {autocompleteResults && autocompleteResults.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 900, color: COLORS.olive, padding: "8px 6px 4px", letterSpacing: 0.5, textTransform: "uppercase" }}>
                    Products
                  </div>
                  {autocompleteResults.map((item, idx) => (
                    <button
                      key={`autocomplete-${idx}`}
                      type="button"
                      onClick={() => handleAutocompleteClick(item.name)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 10px",
                        background: "transparent",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 13,
                        color: COLORS.ink,
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                      onMouseEnter={(e) => (e.target.style.background = COLORS.soft)}
                      onMouseLeave={(e) => (e.target.style.background = "transparent")}
                    >
                      {item.name}
                    </button>
                  ))}
                  {searchHistory && searchHistory.length > 0 && (
                    <div style={{ borderTop: `1px solid rgba(32,29,24,0.1)`, margin: "4px 0" }}></div>
                  )}
                </>
              )}

              {/* Search history suggestions */}
              {searchHistory && searchHistory.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 900, color: COLORS.olive, padding: "8px 6px 4px", letterSpacing: 0.5, textTransform: "uppercase" }}>
                    Popular Searches
                  </div>
                  {searchHistory.map((item, idx) => (
                    <button
                      key={`history-${idx}`}
                      type="button"
                      onClick={() => handleSuggestionClick(item.query)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 10px",
                        background: "transparent",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 13,
                        color: COLORS.ink,
                        cursor: "pointer",
                        fontWeight: 500,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                      onMouseEnter={(e) => (e.target.style.background = COLORS.soft)}
                      onMouseLeave={(e) => (e.target.style.background = "transparent")}
                    >
                      <span>{item.query}</span>
                      <span style={{ fontSize: 11, color: "rgba(32,29,24,0.5)", fontWeight: 400 }}>
                        ({item.count})
                      </span>
                    </button>
                  ))}
                </>
              )}

              {!autocompleteResults?.length && !searchHistory?.length && (
                <div style={{ fontSize: 13, color: "rgba(32,29,24,0.5)", padding: 10 }}>No suggestions</div>
              )}
            </div>
          </div>
        )}
      </form>

      {/* Filter controls */}
      <div style={{ marginBottom: 20, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="number"
          placeholder="Min price"
          value={filters.minPrice}
          onChange={(e) => setFilters((s) => ({ ...s, minPrice: e.target.value }))}
          style={{ padding: 8, borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", width: 120 }}
        />
        <input
          type="number"
          placeholder="Max price"
          value={filters.maxPrice}
          onChange={(e) => setFilters((s) => ({ ...s, maxPrice: e.target.value }))}
          style={{ padding: 8, borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", width: 120 }}
        />
        <select
          value={filters.inStock}
          onChange={(e) => setFilters((s) => ({ ...s, inStock: e.target.value }))}
          style={{ padding: 8, borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)" }}
        >
          <option value="">Any stock</option>
          <option value="true">In stock</option>
          <option value="false">Out of stock</option>
        </select>
        <select
          value={filters.sort}
          onChange={(e) => setFilters((s) => ({ ...s, sort: e.target.value }))}
          style={{ padding: 8, borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)" }}
        >
          <option value="">Sort</option>
          <option value="price_asc">Price: Low to high</option>
          <option value="price_desc">Price: High to low</option>
          <option value="newest">Newest</option>
        </select>
        <button
          type="button"
          onClick={() => {
            // apply filters explicitly (also triggered automatically by effect)
            const cleaned = {};
            if (filters.minPrice) cleaned.minPrice = filters.minPrice;
            if (filters.maxPrice) cleaned.maxPrice = filters.maxPrice;
            if (filters.inStock !== "") cleaned.inStock = filters.inStock;
            if (filters.sort) cleaned.sort = filters.sort;
            searchProducts(q, cleaned);
          }}
          className="btn"
          style={{ padding: "8px 12px", borderRadius: 8 }}
        >
          Apply
        </button>
        <button
          type="button"
          onClick={() => {
            setFilters({ minPrice: "", maxPrice: "", inStock: "", sort: "" });
            searchProducts(q, {});
          }}
          className="btn btn-ghost"
          style={{ padding: "8px 12px", borderRadius: 8 }}
        >
          Clear
        </button>
      </div>

      {loading && (
        <div style={{ padding: 20, textAlign: "center", color: "rgba(32,29,24,0.7)" }}>
          Loading...
        </div>
      )}

      {error && (
        <div
          style={{
            padding: 16,
            background: "#FFE5E5",
            border: "1px solid #FF9999",
            borderRadius: 12,
            color: "#C00000",
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      {!loading && products && products.length === 0 && (
        <div
          style={{
            padding: 24,
            textAlign: "center",
            color: "rgba(32,29,24,0.6)",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          No products found.
        </div>
      )}

      {!loading && products && products.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {products.map((p) => (
            <ProductCard key={p.id || p.product_id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
