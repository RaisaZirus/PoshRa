// src/features/home/pages/HomePage.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

/**
 * PoshRa Home Page (Multivendor E-commerce)
 * ERD-driven sections:
 * - campaigns + campaign_products
 * - categories (parent/child)
 * - stores (top stores)
 * - products + product_images + product_variants (featured/new)
 * - view_logs (recently viewed, optional if you wire it)
 *
 * Color palette (from image):
 *  #FDFDF9 (off-white)
 *  #FBEF9C (soft yellow)
 *  #FEE32B (primary yellow)
 *  #877928 (olive)
 *  #201D18 (near-black)
 */

const COLORS = {
  bg: "#FDFDF9",
  soft: "#FBEF9C",
  primary: "#FEE32B",
  olive: "#877928",
  ink: "#201D18",
};

// ---- helpers ----
async function safeFetchJSON(url, fallback) {
  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return fallback;
  }
}

function money(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return "৳0.00";
  return `৳${num.toFixed(2)}`;
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ---- mock fallback data (so HomePage works even before backend endpoints exist) ----
const MOCK = {
  campaigns: [
    {
      campaign_id: 1,
      name: "New Year Mega Sale",
      start_time: new Date(Date.now() - 86400000).toISOString(),
      end_time: new Date(Date.now() + 6 * 86400000).toISOString(),
      highlights: [
        { variant_id: 1, product_id: 1, name: "Red Shirt", discount_price: 799 },
        { variant_id: 2, product_id: 2, name: "Blue Jeans", discount_price: 1299 },
        { variant_id: 3, product_id: 3, name: "Black Shoes", discount_price: 1699 },
      ],
    },
  ],
  categories: [
    { category_id: 1, parent_id: null, name: "Electronics", slug: "electronics" },
    { category_id: 2, parent_id: null, name: "Fashion", slug: "fashion" },
    { category_id: 3, parent_id: null, name: "Home & Living", slug: "home-living" },
    { category_id: 4, parent_id: 1, name: "Audio", slug: "audio" },
    { category_id: 5, parent_id: 1, name: "Wearables", slug: "wearables" },
    { category_id: 6, parent_id: 2, name: "Men", slug: "men" },
    { category_id: 7, parent_id: 2, name: "Women", slug: "women" },
  ],
  stores: [
    { store_id: 201, store_name: "TechTown", store_slug: "techtown", store_rating: 4.6, store_status: "active" },
    { store_id: 202, store_name: "Urban Threads", store_slug: "urban-threads", store_rating: 4.4, store_status: "active" },
    { store_id: 203, store_name: "HomeNest", store_slug: "homenest", store_rating: 4.5, store_status: "active" },
  ],
  products: [
    {
      product_id: 1,
      store_id: 1,
      name: "Red Shirt",
      brand: "PoshWear",
      image_url: "https://picsum.photos/seed/poshra-shirt/640/480",
      min_price: 999,
      discount_price: 799,
      stock: 20,
    },
    {
      product_id: 2,
      store_id: 1,
      name: "Blue Jeans",
      brand: "PoshWear",
      image_url: "https://picsum.photos/seed/poshra-jeans/640/480",
      min_price: 1499,
      discount_price: null,
      stock: 15,
    },
    {
      product_id: 3,
      store_id: 1,
      name: "Black Shoes",
      brand: "PoshStep",
      image_url: "https://picsum.photos/seed/poshra-shoes/640/480",
      min_price: 1999,
      discount_price: 1699,
      stock: 8,
    },
    {
      product_id: 4,
      store_id: 1,
      name: "White T-Shirt",
      brand: "PoshWear",
      image_url: "https://picsum.photos/seed/poshra-tshirt/640/480",
      min_price: 599,
      discount_price: null,
      stock: 50,
    },
  ],
};

// ---- UI components (kept in-file for a single-copy-paste working HomePage.jsx) ----
function Pill({ children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 999,
        background: COLORS.soft,
        color: COLORS.ink,
        border: `1px solid rgba(32,29,24,0.12)`,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.2,
      }}
    >
      {children}
    </span>
  );
}

function Section({ title, subtitle, action, children }) {
  return (
    <section style={{ marginTop: 22 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: COLORS.ink, fontSize: 18, letterSpacing: 0.2 }}>{title}</h2>
          {subtitle ? (
            <p style={{ margin: "4px 0 0", color: "rgba(32,29,24,0.78)", fontSize: 13 }}>{subtitle}</p>
          ) : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: COLORS.bg,
        border: `1px solid rgba(32,29,24,0.12)`,
        borderRadius: 16,
        boxShadow: "0 10px 26px rgba(32,29,24,0.08)",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function ProductCard({ p, onAddToCart }) {
  const hasDiscount = p.discount_price != null && Number(p.discount_price) < Number(p.min_price);

  return (
    <Card style={{ display: "flex", flexDirection: "column" }}>
      <Link to={`/p/${p.product_id}`} style={{ textDecoration: "none", color: "inherit" }}>
        <div style={{ position: "relative" }}>
          <img
            src={p.image_url}
            alt={p.name}
            loading="lazy"
            style={{ width: "100%", height: 170, objectFit: "cover", background: COLORS.soft }}
          />
          <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
            {hasDiscount && <Pill>Sale</Pill>}
            {Number(p.stock) > 0 && Number(p.stock) <= 5 && <Pill>Only {p.stock} left</Pill>}
            {Number(p.total_sold) >= 50 && <span style={{ display:"inline-flex",alignItems:"center",padding:"4px 8px",borderRadius:999,background:"#ede9fe",color:"#7c3aed",fontSize:11,fontWeight:800 }}>Bestseller</span>}
          </div>
        </div>
        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.ink, lineHeight: 1.2 }}>
                {p.name}
              </div>
              <div style={{ marginTop: 4, fontSize: 12, color: "rgba(32,29,24,0.72)" }}>{p.brand || "—"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: COLORS.ink }}>
                {money(hasDiscount ? p.discount_price : p.min_price)}
              </div>
              {hasDiscount ? (
                <div style={{ fontSize: 12, color: "rgba(32,29,24,0.55)", textDecoration: "line-through" }}>
                  {money(p.min_price)}
                </div>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onAddToCart(p.product_id);
            }}
            style={{
              cursor: "pointer",
              border: `1px solid ${COLORS.ink}`,
              background: COLORS.primary,
              color: COLORS.ink,
              fontWeight: 900,
              borderRadius: 12,
              padding: "10px 12px",
            }}
          >
            Add to cart
          </button>
        </div>
      </Link>
    </Card>
  );
}

function CategoryGrid({ categories }) {
  // Build parent -> children structure from categories(parent_id)
  const byId = new Map(categories.map((c) => [c.category_id, c]));
  const parents = categories.filter((c) => c.parent_id == null);

  const childrenOf = (parentId) => categories.filter((c) => c.parent_id === parentId);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 12 }}>
      {parents.slice(0, 6).map((parent) => {
        const kids = childrenOf(parent.category_id);
        const slug = parent.slug || slugify(parent.name);

        return (
          <Card
            key={parent.category_id}
            style={{
              gridColumn: "span 4",
              padding: 14,
              background: `linear-gradient(135deg, ${COLORS.soft} 0%, ${COLORS.bg} 70%)`,
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: COLORS.ink }}>{parent.name}</div>
              <Link
                to={`/c/${slug}`}
                style={{
                  color: COLORS.olive,
                  fontWeight: 900,
                  textDecoration: "none",
                  borderBottom: `2px solid ${COLORS.primary}`,
                }}
              >
                Browse
              </Link>
            </div>

            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {kids.slice(0, 6).map((k) => (
                <Link
                  key={k.category_id}
                  to={`/c/${k.slug || slugify(k.name)}`}
                  style={{
                    textDecoration: "none",
                    color: COLORS.ink,
                    background: COLORS.bg,
                    border: `1px solid rgba(32,29,24,0.12)`,
                    padding: "6px 10px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {k.name}
                </Link>
              ))}
              {kids.length === 0 ? (
                <span style={{ fontSize: 12, color: "rgba(32,29,24,0.7)" }}>No subcategories yet</span>
              ) : null}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function StoreRow({ stores }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 12 }}>
      {stores.slice(0, 6).map((s) => (
        <Card key={s.store_id} style={{ gridColumn: "span 4", padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: COLORS.ink }}>{s.store_name}</div>
              <div style={{ marginTop: 4, display: "flex", gap: 8, alignItems: "center" }}>
                <Pill>⭐ {Number(s.store_rating || 0).toFixed(1)}</Pill>
                <span style={{ fontSize: 12, color: "rgba(32,29,24,0.7)" }}>{s.store_status}</span>
              </div>
            </div>

            <Link
              to={`/s/${s.store_slug || slugify(s.store_name)}`}
              style={{
                textDecoration: "none",
                fontWeight: 900,
                color: COLORS.ink,
                background: COLORS.primary,
                border: `1px solid ${COLORS.ink}`,
                padding: "8px 12px",
                borderRadius: 12,
              }}
            >
              Visit
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}

function CampaignHero({ campaign }) {
  if (!campaign) return null;

  const start = new Date(campaign.start_time);
  const end = new Date(campaign.end_time);

  return (
    <Card
      style={{
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.soft} 60%, ${COLORS.bg} 100%)`,
        border: `1px solid rgba(32,29,24,0.18)`,
      }}
    >
      <div style={{ padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, color: COLORS.olive, letterSpacing: 1 }}>
              POSHRA CAMPAIGN
            </div>
            <h1 style={{ margin: "6px 0 0", fontSize: 28, color: COLORS.ink, letterSpacing: 0.4 }}>
              {campaign.name}
            </h1>
            <p style={{ margin: "6px 0 0", color: "rgba(32,29,24,0.8)", fontWeight: 700 }}>
              From {start.toLocaleDateString()} to {end.toLocaleDateString()}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Link
              to="/search?q=&sort=discount"
              style={{
                textDecoration: "none",
                fontWeight: 900,
                color: COLORS.ink,
                background: COLORS.bg,
                border: `2px solid ${COLORS.ink}`,
                padding: "10px 14px",
                borderRadius: 14,
              }}
            >
              Explore deals
            </Link>
            <Link
              to="/search?q="
              style={{
                textDecoration: "none",
                fontWeight: 900,
                color: COLORS.bg,
                background: COLORS.ink,
                border: `2px solid ${COLORS.ink}`,
                padding: "10px 14px",
                borderRadius: 14,
              }}
            >
              Shop now
            </Link>
          </div>
        </div>

        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 12 }}>
          {(campaign.highlights || []).slice(0, 3).map((h) => (
            <Card
              key={h.variant_id}
              style={{
                gridColumn: "span 4",
                background: COLORS.bg,
                padding: 12,
                border: `1px solid rgba(32,29,24,0.14)`,
              }}
            >
              <div style={{ fontSize: 12, color: "rgba(32,29,24,0.7)", fontWeight: 800 }}>Highlighted deal</div>
              <div style={{ marginTop: 6, fontSize: 14, fontWeight: 900, color: COLORS.ink }}>{h.name}</div>
              <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: COLORS.ink }}>{money(h.discount_price)}</div>
                <Link
                  to={`/p/${h.product_id}`}
                  style={{
                    textDecoration: "none",
                    fontWeight: 900,
                    color: COLORS.ink,
                    background: COLORS.primary,
                    border: `1px solid ${COLORS.ink}`,
                    padding: "8px 10px",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                >
                  View
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ---- main page ----
function SellerLink() {
  const { user } = useAuth();
  if (user?.role === "seller") {
    return (
      <a href="/seller/dashboard" style={{ textDecoration: "none", fontWeight: 900, color: COLORS.ink, background: COLORS.primary, border: `2px solid ${COLORS.ink}`, padding: "10px 14px", borderRadius: 14 }}>
        My dashboard
      </a>
    );
  }
  return (
    <a href="/auth/register" style={{ textDecoration: "none", fontWeight: 900, color: COLORS.ink, background: COLORS.primary, border: `2px solid ${COLORS.ink}`, padding: "10px 14px", borderRadius: 14 }}>
      Sell on PoshRa
    </a>
  );
}

export default function HomePage() {
  const [loading, setLoading] = React.useState(true);
  const { fetchWithAuth, user } = useAuth();
  const navigate = useNavigate();

  const handleAddToCart = async (productId) => {
    if (!user) { navigate("/auth/login"); return; }
    try {
      // We need a variant_id — fetch the first variant for this product
      const res = await fetch(`/api/products/${productId}`);
      const data = await res.json();
      const variant = data?.data?.variants?.[0];
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

  const [campaigns, setCampaigns] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [stores, setStores] = React.useState([]);
  const [products, setProducts] = React.useState([]);

  // These endpoints are "expected" for your ERD.
  // If your backend uses different routes, just change the strings below.
  React.useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);

      const [camps, cats, sts, prods] = await Promise.all([
        safeFetchJSON("/api/campaigns/active", MOCK.campaigns),
        safeFetchJSON("/api/categories", MOCK.categories),
        safeFetchJSON("/api/stores", MOCK.stores),
        // ideally returns products with image + min price + discount info
        safeFetchJSON("/api/products/featured", MOCK.products).then(r => Array.isArray(r) ? r : (r?.data ?? MOCK.products)),
      ]);

      if (!alive) return;
      setCampaigns(Array.isArray(camps) ? camps : MOCK.campaigns);
      setCategories((Array.isArray(cats) && cats.length > 0) ? cats : MOCK.categories);
      setStores((Array.isArray(sts) && sts.length > 0) ? sts : MOCK.stores);
      setProducts(Array.isArray(prods) ? prods : MOCK.products);

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const activeCampaign = campaigns?.[0];

  return (
    <div
      style={{
        background: COLORS.bg,
        color: COLORS.ink,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      }}
    >
      {/* top brand strip */}
      <div
        style={{
          border: `1px solid rgba(32,29,24,0.12)`,
          borderRadius: 18,
          padding: 14,
          background: `linear-gradient(180deg, ${COLORS.bg} 0%, ${COLORS.soft} 120%)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: COLORS.primary,
                border: `2px solid ${COLORS.ink}`,
                display: "grid",
                placeItems: "center",
                fontWeight: 1000,
                letterSpacing: 0.5,
              }}
            >
              PR
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 1000, letterSpacing: 0.4 }}>PoshRa</div>
              <div style={{ fontSize: 12, color: "rgba(32,29,24,0.75)", fontWeight: 700 }}>
                Multivendor marketplace — shop from trusted stores
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              to="/search?q="
              style={{
                textDecoration: "none",
                fontWeight: 900,
                color: COLORS.bg,
                background: COLORS.ink,
                border: `2px solid ${COLORS.ink}`,
                padding: "10px 14px",
                borderRadius: 14,
              }}
            >
              Start shopping
            </Link>
            <SellerLink />
          </div>
        </div>
      </div>

      {/* campaign hero */}
      <div style={{ marginTop: 14 }}>
        <CampaignHero campaign={activeCampaign} />
      </div>

      {loading ? (
        <div style={{ marginTop: 16, padding: 14 }}>
          <Card style={{ padding: 14, background: COLORS.soft }}>
            <div style={{ fontWeight: 900 }}>Loading PoshRa…</div>
            <div style={{ fontSize: 12, color: "rgba(32,29,24,0.75)", marginTop: 6 }}>
              Fetching campaigns, categories, stores, and featured products.
            </div>
          </Card>
        </div>
      ) : null}

      {/* categories */}
      <Section
        title="Shop by category"
        subtitle="Browse our collections"
        action={
          <Link
            to="/search?q="
            style={{
              textDecoration: "none",
              fontWeight: 900,
              color: COLORS.ink,
              background: COLORS.primary,
              border: `1px solid ${COLORS.ink}`,
              padding: "8px 12px",
              borderRadius: 12,
            }}
          >
            View all
          </Link>
        }
      >
        <CategoryGrid categories={categories} />
      </Section>

      {/* featured products */}
      <Section
        title="Featured products"
        subtitle="Hand-picked for you"
        action={
          <Link
            to="/search?q=&sort=new"
            style={{
              textDecoration: "none",
              fontWeight: 900,
              color: COLORS.olive,
              borderBottom: `2px solid ${COLORS.primary}`,
            }}
          >
            See more
          </Link>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 12 }}>
          {products.slice(0, 8).map((p) => (
            <div key={p.product_id} style={{ gridColumn: "span 3" }}>
              <ProductCard p={p} onAddToCart={handleAddToCart} />
            </div>
          ))}
        </div>
      </Section>

      {/* top stores */}
      <Section
        title="Top stores"
        subtitle="Shop from trusted sellers"
        action={
          <Link
            to="/search?q=&sort=rating"
            style={{
              textDecoration: "none",
              fontWeight: 900,
              color: COLORS.olive,
              borderBottom: `2px solid ${COLORS.primary}`,
            }}
          >
            Discover stores
          </Link>
        }
      >
        <StoreRow stores={stores} />
      </Section>

      {/* trust / policies block */}
      <Section title="Why PoshRa?" subtitle="Built for trust, speed, and seller growth">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 12 }}>
          {[
            { title: "Multi-vendor", text: "Shop products from many stores in one checkout." },
            { title: "Campaign deals", text: "Exclusive deals and seasonal discounts every week." },
            { title: "Secure payments", text: "Every transaction is safe, traceable and refundable." },
            { title: "Fast delivery", text: "Real-time shipment tracking from seller to your door." },
          ].map((x) => (
            <Card key={x.title} style={{ gridColumn: "span 3", padding: 14, background: COLORS.bg }}>
              <div style={{ fontSize: 14, fontWeight: 1000, color: COLORS.ink }}>{x.title}</div>
              <div style={{ marginTop: 8, fontSize: 12, color: "rgba(32,29,24,0.78)", lineHeight: 1.5 }}>
                {x.text}
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <div style={{ height: 18 }} />
    </div>
  );
}