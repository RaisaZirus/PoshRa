import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../../auth/useAuth.jsx";

// HomePage color palette
const COLORS = {
  bg: "#FDFDF9",
  soft: "#FBEF9C",
  primary: "#FEE32B",
  olive: "#877928",
  ink: "#201D18",
};

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

export default function ProductDetailsPage() {
  const { product_id } = useParams();
  const { fetchWithAuth, user } = useAuth();
    const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [primaryImage, setPrimaryImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [questions, setQuestions] = React.useState([]);
  const [qnaLoading, setQnaLoading] = React.useState(false);
  const [qnaLoaded, setQnaLoaded] = React.useState(false);
  const [newQuestion, setNewQuestion] = React.useState("");
  const [postingQ, setPostingQ] = React.useState(false);
  const [reviews, setReviews] = React.useState([]);
  const [breakdown, setBreakdown] = React.useState({});
  const [reviewsLoaded, setReviewsLoaded] = React.useState(false);
  const [reviewsLoading, setReviewsLoading] = React.useState(false);
  const [newRating, setNewRating] = React.useState(0);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [newComment, setNewComment] = React.useState("");
  const [postingReview, setPostingReview] = React.useState(false);
  const [reviewError, setReviewError] = React.useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/products/${product_id}`);
        
        if (response.data.success) {
          const productData = response.data.data;
          setProduct(productData);
          
          // Set primary image
          const primary = productData.images?.find(img => img.is_primary);
          setPrimaryImage(primary || productData.images?.[0]);
          
          // Set first variant as selected
          if (productData.variants && productData.variants.length > 0) {
            setSelectedVariant(productData.variants[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError(err.response?.data?.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    if (product_id) {
      fetchProduct();
    }
  }, [product_id]);

  if (loading) {
    // product_id is used for fetching, so show loader if request pending
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner border-4 border-primary border-t-transparent rounded-full w-12 h-12 animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-semibold">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-error">
          <h2 className="text-2xl font-bold mb-4">Oops!</h2>
          <p className="text-lg mb-6">{error || "Product not found"}</p>
          <a href="/products" className="btn btn-primary">
            Back to Products
          </a>
        </div>
      </div>
    );
  }

  const discount = selectedVariant?.discount_price 
    ? Math.round(((selectedVariant.price - selectedVariant.discount_price) / selectedVariant.price) * 100)
    : 0;

  const displayPrice = selectedVariant?.discount_price || selectedVariant?.price || 0;

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    if (!user) {
      navigate("/auth/login", { state: { from: `/p/${product_id}` } });
      return;
    }
    try {
      const data = await fetchWithAuth("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({ variant_id: selectedVariant.variant_id, quantity }),
      });
      if (data.success) navigate("/cart");
      else alert(data.message || "Failed to add to cart");
    } catch (err) {
      console.error("Add to cart failed:", err);
      alert(err.message || "Add to cart failed");
    }
  };

  return (
    <div style={{ background: COLORS.soft, color: COLORS.ink, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" }}>
      <div className="container mx-auto px-4 py-8">
        {/* breadcrumb navigation */}
        <nav className="text-sm mb-6" style={{ color: COLORS.olive }}>
          <ul className="inline-flex items-center space-x-2">
            <li><Link to="/" style={{ textDecoration: "none", color: COLORS.ink }} className="hover:underline">Home</Link></li>
            <li>/</li>
            <li><span style={{ color: COLORS.olive }}>{product.brand || "Brand"}</span></li>
            <li>/</li>
            <li style={{ fontWeight: 800 }}>{product.name}</li>
          </ul>
        </nav>

        {/* main grid: 2 cols for images + 1 col for details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Images Column (spans 2 on desktop) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Primary Image */}
            <Card
              style={{
                padding: 0,
                background: COLORS.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                aspectRatio: "1 / 1",
                overflow: "hidden",
                maxWidth: 400,
              }}
            >
              {primaryImage ? (
                <img
                  src={primaryImage.image_url}
                  alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/500?text=Product+Image";
                  }}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.soft }}
                >
                  <span style={{ color: COLORS.olive }}>No image available</span>
                </div>
              )}
            </Card>

            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto" style={{ maxWidth: 400 }}>
                {product.images.map((img) => (
                  <div
                    key={img.image_id}
                    onClick={() => setPrimaryImage(img)}
                    style={{
                      width: 80,
                      height: 80,
                      flexShrink: 0,
                      borderRadius: 12,
                      overflow: "hidden",
                      cursor: "pointer",
                      border: `2px solid ${
                        primaryImage?.image_id === img.image_id ? COLORS.primary : "rgba(32,29,24,0.12)"
                      }`,
                      transition: "all 0.2s",
                      background: COLORS.bg,
                    }}
                  >
                    <img
                      src={img.image_url}
                      alt="Product"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/80?text=Image";
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details Column (sticky on desktop) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }} className="lg:sticky lg:top-8">
            <Card style={{ padding: 20 }}>
              {/* Product Header */}
              <div style={{ marginBottom: 20 }}>
                <Pill>{product.brand || "Brand"}</Pill>
                <h1 style={{ fontSize: 28, fontWeight: 900, marginTop: 12, color: COLORS.ink, letterSpacing: 0.2 }}
                >
                  {product.name}
                </h1>

                {/* Rating */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
                    {product.reviews_count > 0 ? (
                      <>
                        <div style={{ display: "flex", gap: 2 }}>
                          {[...Array(5)].map((_, i) => (
                            <span key={i} style={{ fontSize: 16, color: i < Math.round(product.avg_rating) ? "#FEE32B" : "#D3D1C7" }}>★</span>
                          ))}
                        </div>
                        <span style={{ fontSize: 13, color: COLORS.olive }}>{product.avg_rating} ({product.reviews_count} review{product.reviews_count !== 1 ? "s" : ""})</span>
                      </>
                    ) : (
                      <span style={{ fontSize: 13, color: COLORS.olive }}>No reviews yet</span>
                    )}
                  </div>

                {/* Seller */}
                  {product.store_name && (
                    <p style={{ fontSize: 13, marginTop: 8, color: COLORS.olive }}>
                      Sold by <Link to={`/s/${product.store_slug}`} style={{ textDecoration: "underline", color: COLORS.olive, fontWeight: 700 }}>{product.store_name}</Link>
                    </p>
                  )}
              </div>

              {/* Price Section */}
              <div style={{ padding: "16px 0", borderTop: `1px solid rgba(32,29,24,0.12)`, borderBottom: `1px solid rgba(32,29,24,0.12)` }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                  <div style={{ fontSize: 36, fontWeight: 900, color: COLORS.primary }}>
                    ₹{displayPrice?.toFixed(0) || "0"}
                  </div>
                  {selectedVariant?.discount_price && (
                    <>
                      <div style={{ fontSize: 18, color: "rgba(32,29,24,0.5)", textDecoration: "line-through" }}>
                        ₹{selectedVariant.price?.toFixed(0) || "0"}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#dc2626", background: COLORS.soft, padding: "4px 8px", borderRadius: 6 }}
                      >
                        {discount}% OFF
                      </div>
                    </>
                  )}
                </div>
                {selectedVariant?.discount_price && (
                  <p style={{ fontSize: 13, color: "#16a34a", fontWeight: 700, marginTop: 8 }}
                  >
                    Save ₹{(selectedVariant.price - selectedVariant.discount_price).toLocaleString('en-IN')}
                  </p>
                )}
              </div>

              {/* Stock & sold status */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
                {selectedVariant?.stock <= 0 && (
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#dc2626", background: "#fee2e2", padding: "4px 10px", borderRadius: 8 }}>
                    Out of stock
                  </span>
                )}
                {selectedVariant?.stock > 0 && selectedVariant?.stock <= 5 && (
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#d97706", background: "#fef9c3", padding: "4px 10px", borderRadius: 8 }}>
                    Only {selectedVariant.stock} left
                  </span>
                )}
                {selectedVariant?.stock > 5 && (
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#16a34a", background: "#dcfce7", padding: "4px 10px", borderRadius: 8 }}>
                    In stock
                  </span>
                )}
                {product.total_sold >= 50 && (
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#7c3aed", background: "#ede9fe", padding: "4px 10px", borderRadius: 8 }}>
                    Bestseller
                  </span>
                )}
                {product.total_sold >= 10 && product.total_sold < 50 && (
                  <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.olive, background: COLORS.soft, padding: "4px 10px", borderRadius: 8 }}>
                    Popular
                  </span>
                )}
              </div>

              {/* Variants */}
              {product.variants && product.variants.length > 1 && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, marginBottom: 10, color: COLORS.ink }}>CHOOSE VARIANT</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {product.variants.map((variant) => (
                      <button
                        key={variant.variant_id}
                        onClick={() => {
                          setSelectedVariant(variant);
                          setQuantity(1);
                        }}
                        style={{
                          padding: "12px 14px",
                          borderRadius: 12,
                          border: `2px solid ${
                            selectedVariant?.variant_id === variant.variant_id ? COLORS.primary : "rgba(32,29,24,0.12)"
                          }`,
                          background:
                            selectedVariant?.variant_id === variant.variant_id ? COLORS.primary : COLORS.bg,
                          color:
                            selectedVariant?.variant_id === variant.variant_id ? COLORS.ink : COLORS.ink,
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: "pointer",
                          transition: "all 0.2s",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span>{variant.sku}</span>
                        <span>₹{variant.discount_price || variant.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 800, marginBottom: 10, color: COLORS.ink }}>QUANTITY</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={selectedVariant?.stock === 0}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      border: `1px solid rgba(32,29,24,0.2)`,
                      background: COLORS.bg,
                      color: COLORS.ink,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={selectedVariant?.stock || 1}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.min(selectedVariant?.stock || 1, Math.max(1, Number(e.target.value))))
                    }
                    disabled={selectedVariant?.stock === 0}
                    style={{
                      width: 50,
                      height: 36,
                      textAlign: "center",
                      border: `1px solid rgba(32,29,24,0.2)`,
                      borderRadius: 8,
                      fontWeight: 700,
                    }}
                  />
                  <button
                    onClick={() =>
                      setQuantity(Math.min(selectedVariant?.stock || 1, quantity + 1))
                    }
                    disabled={quantity >= (selectedVariant?.stock || 1)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      border: `1px solid rgba(32,29,24,0.2)`,
                      background: COLORS.bg,
                      color: COLORS.ink,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* CTA Buttons */}
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button
                  onClick={handleAddToCart}
                  disabled={selectedVariant?.stock === 0}
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "none",
                    background: COLORS.primary,
                    color: COLORS.ink,
                    fontWeight: 900,
                    fontSize: 14,
                    cursor: "pointer",
                    letterSpacing: 0.2,
                  }}
                >
                  ADD TO CART
                </button>
                <button
                  onClick={async () => {
                    if (!user) { navigate("/auth/login"); return; }
                    if (!selectedVariant) return;
                    try {
                      if (wishlisted) {
                        await fetchWithAuth(`/api/wishlist/items/${selectedVariant.variant_id}`, { method: "DELETE" });
                        setWishlisted(false);
                      } else {
                        await fetchWithAuth("/api/wishlist/items", {
                          method: "POST",
                          body: JSON.stringify({ variant_id: selectedVariant.variant_id }),
                        });
                        setWishlisted(true);
                      }
                    } catch (err) { alert(err.message); }
                  }}
                  style={{
                    width: 44, height: 44, borderRadius: 12,
                    border: `2px solid ${wishlisted ? "#dc2626" : COLORS.olive}`,
                    background: wishlisted ? "#fee2e2" : COLORS.bg,
                    color: wishlisted ? "#dc2626" : COLORS.olive,
                    fontSize: 18, cursor: "pointer", transition: "all 0.2s",
                  }}
                >
                  {wishlisted ? "♥" : "♡"}
                </button>
              </div>

              {/* Share */}
              <div style={{ display: "flex", gap: 12, marginTop: 16, paddingTop: 16, borderTop: `1px solid rgba(32,29,24,0.12)` }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.olive }}>SHARE:</span>
                <button style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 14 }}>f</button>
                <button style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 14 }}>𝕏</button>
              </div>
            </Card>
          </div>
        </div>

        {/* Tabs Section */}
        <div style={{ marginTop: 40 }}>
          <Card style={{ padding: 0 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                borderBottom: `1px solid rgba(32,29,24,0.12)`,
              }}
            >
              {["description", "specs", "reviews", "questions"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    if (tab === "questions" && !qnaLoaded) {
                      setQnaLoading(true);
                      fetch(`/api/products/${product_id}/questions`)
                        .then((r) => r.json())
                        .then((d) => { setQuestions(d.data || []); setQnaLoaded(true); })
                        .catch(console.error)
                        .finally(() => setQnaLoading(false));
                    }
                    if (tab === "reviews" && !reviewsLoaded) {
                      setReviewsLoading(true);
                      fetch(`/api/products/${product_id}/reviews`)
                        .then((r) => r.json())
                        .then((d) => { setReviews(d.data || []); setBreakdown(d.breakdown || {}); setReviewsLoaded(true); })
                        .catch(console.error)
                        .finally(() => setReviewsLoading(false));
                    }
                    if (tab === "reviews" && !reviewsLoaded) {
                      setReviewsLoading(true);
                      fetch(`/api/products/${product_id}/reviews`)
                        .then((r) => r.json())
                        .then((d) => { setReviews(d.data || []); setReviewBreakdown(d.breakdown || {}); setReviewsLoaded(true); })
                        .catch(console.error)
                        .finally(() => setReviewsLoading(false));
                    }
                  }}
                  style={{
                    padding: "16px 14px",
                    border: "none",
                    background: activeTab === tab ? COLORS.primary : COLORS.bg,
                    color: COLORS.ink,
                    fontWeight: activeTab === tab ? 900 : 800,
                    fontSize: 13,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: 0.2,
                    transition: "all 0.2s",
                  }}
                >
                  {tab === "description" && "Description"}
                  {tab === "specs" && "Specifications"}
                  {tab === "reviews" && "Reviews"}
                  {tab === "questions" && "Q&A"}
                </button>
              ))}
            </div>

            <div style={{ padding: 24 }}>
              {activeTab === "description" && (
                <p style={{ lineHeight: 1.6, color: COLORS.ink }}
                >
                  {product.description || "No description available."}
                </p>
              )}
              {activeTab === "specs" &&
                (product.attributes && product.attributes.length > 0 ? (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      {product.attributes.map((attr) => (
                        <tr
                          key={attr.attribute_id}
                          style={{ borderBottom: `1px solid rgba(32,29,24,0.08)` }}
                        >
                          <td style={{ padding: "12px 0", fontWeight: 800, width: "30%", color: COLORS.olive }}
                          >
                            {attr.name}
                          </td>
                          <td style={{ padding: "12px 0", color: COLORS.ink }}>{attr.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: COLORS.olive }}>No specifications available.</p>
                )
              )}
              {activeTab === "reviews" && (
                <div>
                  {/* Rating breakdown */}
                  {reviews.length > 0 && (
                    <div style={{ display: "flex", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
                      <div style={{ textAlign: "center" }}>
                        <p style={{ fontSize: 48, fontWeight: 900, color: COLORS.ink, margin: 0, lineHeight: 1 }}>{product.avg_rating}</p>
                        <div style={{ display: "flex", gap: 2, justifyContent: "center", margin: "6px 0" }}>
                          {[...Array(5)].map((_, i) => (
                            <span key={i} style={{ fontSize: 16, color: i < Math.round(product.avg_rating) ? COLORS.primary : "#D3D1C7" }}>★</span>
                          ))}
                        </div>
                        <p style={{ fontSize: 12, color: COLORS.olive, margin: 0 }}>{product.reviews_count} review{product.reviews_count !== 1 ? "s" : ""}</p>
                      </div>
                      <div style={{ flex: 1, minWidth: 180 }}>
                        {[5,4,3,2,1].map((star) => {
                          const count = breakdown[star] || 0;
                          const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                          return (
                            <div key={star} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                              <span style={{ fontSize: 12, color: COLORS.olive, width: 8 }}>{star}</span>
                              <span style={{ fontSize: 13, color: COLORS.primary }}>★</span>
                              <div style={{ flex: 1, height: 6, background: "rgba(32,29,24,0.1)", borderRadius: 3, overflow: "hidden" }}>
                                <div style={{ width: `${pct}%`, height: "100%", background: COLORS.primary, borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: 11, color: COLORS.olive, width: 24, textAlign: "right" }}>{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Write a review */}
                  {user && (
                    <div style={{ background: COLORS.soft, borderRadius: 12, padding: 16, marginBottom: 20 }}>
                      <p style={{ fontWeight: 800, fontSize: 13, color: COLORS.ink, margin: "0 0 10px" }}>Write a review</p>
                      {/* Star picker */}
                      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                        {[1,2,3,4,5].map((s) => (
                          <span key={s}
                            onMouseEnter={() => setHoverRating(s)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setNewRating(s)}
                            style={{ fontSize: 28, cursor: "pointer", color: s <= (hoverRating || newRating) ? COLORS.primary : "#D3D1C7", transition: "color 0.1s" }}>
                            ★
                          </span>
                        ))}
                        {newRating > 0 && (
                          <span style={{ fontSize: 13, color: COLORS.olive, alignSelf: "center", marginLeft: 6 }}>
                            {["","Terrible","Poor","Okay","Good","Excellent"][newRating]}
                          </span>
                        )}
                      </div>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Share your experience (optional)..."
                        rows={3}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid rgba(32,29,24,0.2)`, fontSize: 13, resize: "vertical", fontFamily: "system-ui", boxSizing: "border-box" }}
                      />
                      {reviewError && <p style={{ fontSize: 12, color: "#dc2626", fontWeight: 700, margin: "6px 0 0" }}>{reviewError}</p>}
                      <button
                        disabled={postingReview || !newRating}
                        onClick={async () => {
                          if (!newRating) { setReviewError("Please select a rating"); return; }
                          setPostingReview(true); setReviewError("");
                          try {
                            const data = await fetchWithAuth(`/api/products/${product_id}/reviews`, {
                              method: "POST",
                              body: JSON.stringify({ rating: newRating, comment: newComment }),
                            });
                            setReviews((prev) => [data.data, ...prev]);
                            setReviewBreakdown((prev) => ({ ...prev, [newRating]: (prev[newRating] || 0) + 1 }));
                            setNewRating(0); setNewComment("");
                          } catch (err) { setReviewError(err.message); }
                          finally { setPostingReview(false); }
                        }}
                        style={{ marginTop: 10, padding: "10px 20px", background: newRating ? COLORS.primary : "rgba(32,29,24,0.1)", color: newRating ? COLORS.ink : COLORS.olive, fontWeight: 900, fontSize: 13, borderRadius: 10, border: "none", cursor: newRating ? "pointer" : "not-allowed" }}
                      >
                        {postingReview ? "Posting..." : "Post review"}
                      </button>
                    </div>
                  )}
                  {!user && (
                    <p style={{ fontSize: 13, color: COLORS.olive, marginBottom: 16 }}>
                      <a href="/auth/login" style={{ color: COLORS.olive, fontWeight: 800 }}>Login</a> to write a review.
                    </p>
                  )}

                  {/* Reviews list */}
                  {reviewsLoading ? (
                    <p style={{ color: COLORS.olive, fontSize: 13 }}>Loading reviews...</p>
                  ) : reviews.length === 0 ? (
                    <p style={{ color: COLORS.olive, fontSize: 13 }}>No reviews yet. Be the first!</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {reviews.map((r) => (
                        <div key={r.review_id} style={{ borderBottom: `1px solid rgba(32,29,24,0.08)`, paddingBottom: 16 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                            <div>
                              <p style={{ fontWeight: 800, fontSize: 13, color: COLORS.ink, margin: "0 0 4px" }}>{r.customer_name}</p>
                              <div style={{ display: "flex", gap: 2 }}>
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} style={{ fontSize: 14, color: i < r.rating ? COLORS.primary : "#D3D1C7" }}>★</span>
                                ))}
                              </div>
                            </div>
                            <p style={{ fontSize: 12, color: COLORS.olive, margin: 0 }}>
                              {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                          {r.comment && <p style={{ fontSize: 13, color: COLORS.ink, margin: 0, lineHeight: 1.6 }}>{r.comment}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {activeTab === "questions" && (
                <div>
                  {/* Ask a question */}
                  {user ? (
                    <div style={{ marginBottom: 20, display: "flex", gap: 8 }}>
                      <input
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        placeholder="Ask a question about this product..."
                        style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1.5px solid rgba(32,29,24,0.2)`, fontSize: 13 }}
                      />
                      <button
                        disabled={postingQ || !newQuestion.trim()}
                        onClick={async () => {
                          if (!newQuestion.trim()) return;
                          setPostingQ(true);
                          try {
                            const data = await fetchWithAuth(`/api/products/${product_id}/questions`, {
                              method: "POST",
                              body: JSON.stringify({ content: newQuestion.trim() }),
                            });
                            setQuestions((prev) => [{ ...data.data, question: data.data.content, customer_name: user.name, answer: null }, ...prev]);
                            setNewQuestion("");
                          } catch (err) { alert(err.message); }
                          finally { setPostingQ(false); }
                        }}
                        style={{ padding: "10px 18px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, fontSize: 13, borderRadius: 10, border: "none", cursor: "pointer" }}
                      >
                        {postingQ ? "..." : "Ask"}
                      </button>
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: COLORS.olive, marginBottom: 16 }}>
                      <a href="/auth/login" style={{ color: COLORS.olive, fontWeight: 800 }}>Login</a> to ask a question.
                    </p>
                  )}

                  {/* Questions list */}
                  {qnaLoading ? (
                    <p style={{ color: COLORS.olive, fontSize: 13 }}>Loading questions...</p>
                  ) : questions.length === 0 ? (
                    <p style={{ color: COLORS.olive, fontSize: 13 }}>No questions yet. Be the first to ask!</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {questions.map((q) => (
                        <div key={q.question_id} style={{ borderLeft: `3px solid ${COLORS.primary}`, paddingLeft: 14 }}>
                          <p style={{ fontWeight: 800, fontSize: 14, color: COLORS.ink, margin: "0 0 4px" }}>{q.question}</p>
                          <p style={{ fontSize: 12, color: COLORS.olive, margin: "0 0 8px" }}>
                            {q.customer_name} · {new Date(q.created_at).toLocaleDateString("en-IN")}
                          </p>
                          {q.answer ? (
                            <div style={{ background: "#FBEF9C", borderRadius: 8, padding: "10px 12px" }}>
                              <p style={{ fontSize: 12, fontWeight: 800, color: COLORS.olive, margin: "0 0 4px" }}>
                                Seller answer · {new Date(q.answered_at).toLocaleDateString("en-IN")}
                              </p>
                              <p style={{ fontSize: 13, color: COLORS.ink, margin: 0 }}>{q.answer}</p>
                            </div>
                          ) : (
                            <p style={{ fontSize: 12, color: COLORS.olive, fontStyle: "italic" }}>Awaiting seller response...</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Info Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ marginTop: 40, marginBottom: 40 }}>
          {[
            { icon: "🚚", title: "Free Shipping", text: "On orders above ₹499" },
            { icon: "🔁", title: "Easy Returns", text: "30-day return policy" },
            { icon: "🔒", title: "Secure Payment", text: "100% secure checkout" },
          ].map((item) => (
            <Card key={item.title} style={{ padding: 20, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>{item.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: COLORS.ink }}>
                {item.title}
              </div>
              <div style={{ fontSize: 12, marginTop: 6, color: COLORS.olive }}>
                {item.text}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}