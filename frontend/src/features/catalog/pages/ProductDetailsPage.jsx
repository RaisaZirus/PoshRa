import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = {
  bg: "#fffef8",
  surface: "rgba(255,255,255,0.84)",
  soft: "#fff6bf",
  soft2: "#fffbe2",
  primary: "#fee32b",
  primaryDeep: "#f5cc00",
  olive: "#877928",
  ink: "#1f1b16",
  muted: "#6d6657",
  line: "rgba(31,27,22,0.11)",
  danger: "#dc2626",
  success: "#15803d",
  warning: "#d97706",
  purple: "#7c3aed",
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Card({ children, className = "", style = {} }) {
  return (
    <div className={cn("pd-card", className)} style={style}>
      {children}
    </div>
  );
}

function Pill({ children, tone = "default" }) {
  return <span className={cn("pd-pill", tone !== "default" && `pd-pill-${tone}`)}>{children}</span>;
}

function IconBadge({ icon, title, text }) {
  return (
    <Card className="pd-info-card">
      <div className="pd-info-icon">{icon}</div>
      <div className="pd-info-title">{title}</div>
      <div className="pd-info-text">{text}</div>
    </Card>
  );
}

function Stars({ value = 0, size = 16 }) {
  return (
    <div className="pd-stars" aria-label={`${value} out of 5 stars`}>
      {[...Array(5)].map((_, i) => (
        <span key={i} style={{ fontSize: size, color: i < Math.round(value) ? COLORS.primaryDeep : "#d8d3c4" }}>
          ★
        </span>
      ))}
    </div>
  );
}

function RatingPicker({ value, hoverValue, setValue, setHoverValue }) {
  return (
    <div className="pd-rating-picker">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          className="pd-star-btn"
          onMouseEnter={() => setHoverValue(s)}
          onMouseLeave={() => setHoverValue(0)}
          onClick={() => setValue(s)}
          aria-label={`Rate ${s} star${s > 1 ? "s" : ""}`}
        >
          <span style={{ color: s <= (hoverValue || value) ? COLORS.primaryDeep : "#d8d3c4" }}>★</span>
        </button>
      ))}
      {value > 0 && <span className="pd-rating-label">{["", "Terrible", "Poor", "Okay", "Good", "Excellent"][value]}</span>}
    </div>
  );
}

function ProductDetailsSkeleton() {
  return (
    <div className="pd-page">
      <style>{styles}</style>
      <div className="pd-shell">
        <div className="pd-orb pd-orb-1" />
        <div className="pd-orb pd-orb-2" />
        <div className="pd-container pd-loader-wrap">
          <div className="pd-loader-grid">
            <div className="pd-skeleton pd-skeleton-image" />
            <div className="pd-skeleton-panel">
              <div className="pd-skeleton pd-skeleton-line lg" />
              <div className="pd-skeleton pd-skeleton-line md" />
              <div className="pd-skeleton pd-skeleton-line xl" />
              <div className="pd-skeleton pd-skeleton-line sm" />
              <div className="pd-skeleton pd-skeleton-btn" />
            </div>
          </div>
        </div>
      </div>
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

  const [questions, setQuestions] = useState([]);
  const [qnaLoading, setQnaLoading] = useState(false);
  const [qnaLoaded, setQnaLoaded] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [postingQ, setPostingQ] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [breakdown, setBreakdown] = useState({});
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [postingReview, setPostingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    if (!product_id) return;
    const start = Date.now();

    return () => {
      const duration = Math.round((Date.now() - start) / 1000);
      fetch(`/api/products/${product_id}/view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.userId ?? null,
          duration_seconds: duration,
        }),
      }).catch(() => {});
    };
  }, [product_id, user?.userId]);

  useEffect(() => {
    let mounted = true;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`/api/products/${product_id}`);

        if (!mounted) return;

        if (response.data?.success) {
          const productData = response.data.data;
          const images = productData.images || [];
          const variants = productData.variants || [];
          const primary = images.find((img) => img.is_primary) || images[0] || null;
          const initialVariant = variants[0] || null;

          setProduct(productData);
          setPrimaryImage(primary);
          setSelectedVariant(initialVariant);
          setQuantity(1);
          setWishlisted(Boolean(productData.is_wishlisted || initialVariant?.is_wishlisted));
          setActiveTab("description");
          setQuestions([]);
          setQnaLoaded(false);
          setReviews([]);
          setBreakdown({});
          setReviewsLoaded(false);
        } else {
          setError("Failed to load product");
        }
      } catch (err) {
        if (!mounted) return;
        console.error("Error fetching product:", err);
        setError(err.response?.data?.message || "Failed to load product");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (product_id) fetchProduct();

    return () => {
      mounted = false;
    };
  }, [product_id]);

  const discount = useMemo(() => {
    if (!selectedVariant?.discount_price || !selectedVariant?.price) return 0;
    return Math.round(((selectedVariant.price - selectedVariant.discount_price) / selectedVariant.price) * 100);
  }, [selectedVariant]);

  const displayPrice = useMemo(() => {
    return selectedVariant?.discount_price || selectedVariant?.price || 0;
  }, [selectedVariant]);

  const reviewCount = reviewsLoaded ? reviews.length : product?.reviews_count || 0;

  const displayRating = useMemo(() => {
    if (!reviewsLoaded || reviews.length === 0) return Number(product?.avg_rating || 0);
    const sum = reviews.reduce((acc, item) => acc + Number(item.rating || 0), 0);
    return Number((sum / reviews.length).toFixed(1));
  }, [reviewsLoaded, reviews, product?.avg_rating]);

  const totalSaved = selectedVariant?.discount_price
    ? selectedVariant.price - selectedVariant.discount_price
    : 0;

  const selectedVariantLabel = useMemo(() => {
    if (!selectedVariant) return "";
    return selectedVariant.name || selectedVariant.title || selectedVariant.sku || "Selected variant";
  }, [selectedVariant]);

  const stockTone = useMemo(() => {
    if (!selectedVariant) return null;
    if (selectedVariant.stock <= 0) {
      return { text: "Out of stock", tone: "danger" };
    }
    if (selectedVariant.stock <= 5) {
      return { text: `Only ${selectedVariant.stock} left`, tone: "warning" };
    }
    return { text: "In stock", tone: "success" };
  }, [selectedVariant]);

  const fetchQuestions = async () => {
    if (qnaLoading || qnaLoaded) return;
    try {
      setQnaLoading(true);
      const response = await fetch(`/api/products/${product_id}/questions`);
      const data = await response.json();
      setQuestions(data.data || []);
      setQnaLoaded(true);
    } catch (err) {
      console.error("Failed to load questions:", err);
    } finally {
      setQnaLoading(false);
    }
  };

  const fetchReviews = async () => {
    if (reviewsLoading || reviewsLoaded) return;
    try {
      setReviewsLoading(true);
      const response = await fetch(`/api/products/${product_id}/reviews`);
      const data = await response.json();
      setReviews(data.data || []);
      setBreakdown(data.breakdown || {});
      setReviewsLoaded(true);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "questions") fetchQuestions();
    if (tab === "reviews") fetchReviews();
  };

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

  const handleWishlistToggle = async () => {
    if (!user) {
      navigate("/auth/login", { state: { from: `/p/${product_id}` } });
      return;
    }

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
    } catch (err) {
      alert(err.message || "Wishlist update failed");
    }
  };

  const handleQuestionSubmit = async () => {
    if (!newQuestion.trim()) return;
    setPostingQ(true);

    try {
      const data = await fetchWithAuth(`/api/products/${product_id}/questions`, {
        method: "POST",
        body: JSON.stringify({ content: newQuestion.trim() }),
      });

      const created = {
        ...data.data,
        question: data.data?.question || data.data?.content || newQuestion.trim(),
        customer_name: data.data?.customer_name || user?.name || "You",
        answer: data.data?.answer || null,
      };

      setQuestions((prev) => [created, ...prev]);
      setQnaLoaded(true);
      setNewQuestion("");
    } catch (err) {
      alert(err.message || "Question submission failed");
    } finally {
      setPostingQ(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!newRating) {
      setReviewError("Please select a rating");
      return;
    }

    setPostingReview(true);
    setReviewError("");

    try {
      const data = await fetchWithAuth(`/api/products/${product_id}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating: newRating, comment: newComment }),
      });

      const createdReview = {
        ...data.data,
        customer_name: data.data?.customer_name || user?.name || "You",
        rating: data.data?.rating || newRating,
        comment: data.data?.comment ?? newComment,
        created_at: data.data?.created_at || new Date().toISOString(),
      };

      setReviews((prev) => [createdReview, ...prev]);
      setBreakdown((prev) => ({
        ...prev,
        [newRating]: (prev[newRating] || 0) + 1,
      }));
      setReviewsLoaded(true);
      setProduct((prev) => {
        if (!prev) return prev;
        const nextCount = Number(prev.reviews_count || 0) + 1;
        const prevTotal = Number(prev.avg_rating || 0) * Number(prev.reviews_count || 0);
        const nextAvg = (prevTotal + Number(newRating)) / nextCount;
        return {
          ...prev,
          reviews_count: nextCount,
          avg_rating: Number(nextAvg.toFixed(1)),
        };
      });
      setNewRating(0);
      setHoverRating(0);
      setNewComment("");
    } catch (err) {
      setReviewError(err.message || "Review submission failed");
    } finally {
      setPostingReview(false);
    }
  };

  const shareCurrentPage = async (platform) => {
    const pageUrl = window.location.href;
    const title = `${product?.name || "Product"}`;

    try {
      if (platform === "copy") {
        await navigator.clipboard.writeText(pageUrl);
        alert("Link copied to clipboard");
        return;
      }

      if (platform === "facebook") {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`, "_blank", "noopener,noreferrer");
      }

      if (platform === "x") {
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(title)}`, "_blank", "noopener,noreferrer");
      }
    } catch {
      alert("Unable to share right now");
    }
  };

  if (loading) return <ProductDetailsSkeleton />;

  if (error || !product) {
    return (
      <div className="pd-page">
        <style>{styles}</style>
        <div className="pd-shell">
          <div className="pd-container">
            <Card className="pd-empty-state">
              <div className="pd-empty-icon">!</div>
              <h2>Oops!</h2>
              <p>{error || "Product not found"}</p>
              <Link to="/products" className="pd-primary-btn">
                Back to Products
              </Link>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pd-page">
      <style>{styles}</style>

      <div className="pd-shell">
        <div className="pd-orb pd-orb-1" />
        <div className="pd-orb pd-orb-2" />
        <div className="pd-orb pd-orb-3" />

        <div className="pd-container">
          <nav className="pd-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <span>{product.brand || "Brand"}</span>
            <span>/</span>
            <strong>{product.name}</strong>
          </nav>

          <div className="pd-main-grid">
            <div className="pd-gallery-wrap">
              <Card className="pd-gallery-card pd-animate-up">
                <div className="pd-gallery-topbar">
                  <div className="pd-gallery-badges">
                    <Pill>{product.brand || "Brand"}</Pill>
                    {discount > 0 && <Pill tone="sale">{discount}% OFF</Pill>}
                    {product.total_sold >= 50 && <Pill tone="purple">Bestseller</Pill>}
                  </div>
                </div>

                <div className="pd-main-image-wrap">
                  {primaryImage ? (
                    <img
                      src={primaryImage.image_url}
                      alt={product.name}
                      className="pd-main-image"
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/900x900?text=Product+Image";
                      }}
                    />
                  ) : (
                    <div className="pd-image-fallback">No image available</div>
                  )}
                </div>
              </Card>

              {product.images?.length > 1 && (
                <div className="pd-thumbs-row pd-animate-up delay-1">
                  {product.images.map((img) => (
                    <button
                      key={img.image_id}
                      type="button"
                      onClick={() => setPrimaryImage(img)}
                      className={cn(
                        "pd-thumb-btn",
                        primaryImage?.image_id === img.image_id && "active"
                      )}
                      aria-label="Select product image"
                    >
                      <img
                        src={img.image_url}
                        alt={`${product.name} thumbnail`}
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/200x200?text=Image";
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pd-sidebar pd-animate-up delay-2">
              <Card className="pd-sidebar-card">
                <div className="pd-product-head">
                  <div>
                    <div className="pd-meta-row">
                      <Pill>{product.category_name || product.brand || "Featured product"}</Pill>
                      {stockTone && <Pill tone={stockTone.tone}>{stockTone.text}</Pill>}
                    </div>
                    <h1 className="pd-title">{product.name}</h1>
                  </div>

                  <button
                    type="button"
                    className={cn("pd-wishlist-btn", wishlisted && "active")}
                    onClick={handleWishlistToggle}
                    aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    {wishlisted ? "♥" : "♡"}
                  </button>
                </div>

                <div className="pd-rating-line">
                  {reviewCount > 0 ? (
                    <>
                      <Stars value={displayRating} />
                      <span className="pd-rating-text">
                        {displayRating} · {reviewCount} review{reviewCount !== 1 ? "s" : ""}
                      </span>
                    </>
                  ) : (
                    <span className="pd-rating-text">No reviews yet</span>
                  )}
                </div>

                {product.store_name && (
                  <p className="pd-seller-line">
                    Sold by <Link to={`/s/${product.store_slug}`}>{product.store_name}</Link>
                  </p>
                )}

                <div className="pd-price-box">
                  <div className="pd-price-row">
                    <div className="pd-price">৳{Number(displayPrice || 0).toFixed(0)}</div>
                    {selectedVariant?.discount_price ? (
                      <>
                        <div className="pd-old-price">৳{Number(selectedVariant.price || 0).toFixed(0)}</div>
                        <div className="pd-discount-chip">-{discount}%</div>
                      </>
                    ) : null}
                  </div>
                  {totalSaved > 0 && <p className="pd-save-line">Save ৳{Number(totalSaved).toLocaleString("en-BD")}</p>}
                </div>

                <div className="pd-highlight-grid">
                  <div className="pd-highlight-item">
                    <span className="pd-highlight-label">Variant</span>
                    <strong>{selectedVariantLabel || "Default"}</strong>
                  </div>
                  <div className="pd-highlight-item">
                    <span className="pd-highlight-label">Available</span>
                    <strong>{selectedVariant?.stock ?? 0} pcs</strong>
                  </div>
                  <div className="pd-highlight-item">
                    <span className="pd-highlight-label">Sold</span>
                    <strong>{product.total_sold || 0}+</strong>
                  </div>
                  <div className="pd-highlight-item">
                    <span className="pd-highlight-label">SKU</span>
                    <strong>{selectedVariant?.sku || "N/A"}</strong>
                  </div>
                </div>

                {product.variants?.length > 1 && (
                  <div className="pd-section-block">
                    <div className="pd-label-row">
                      <span className="pd-section-label">Choose Variant</span>
                    </div>
                    <div className="pd-variant-grid">
                      {product.variants.map((variant) => {
                        const variantActive = selectedVariant?.variant_id === variant.variant_id;
                        return (
                          <button
                            key={variant.variant_id}
                            type="button"
                            className={cn("pd-variant-btn", variantActive && "active")}
                            onClick={() => {
                              setSelectedVariant(variant);
                              setQuantity(1);
                              if (variant.is_wishlisted !== undefined) {
                                setWishlisted(Boolean(variant.is_wishlisted));
                              }
                            }}
                          >
                            <div>
                              <div className="pd-variant-name">{variant.name || variant.sku}</div>
                              <div className="pd-variant-sub">Stock: {variant.stock ?? 0}</div>
                            </div>
                            <div className="pd-variant-price">৳{variant.discount_price || variant.price}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pd-section-block">
                  <div className="pd-label-row">
                    <span className="pd-section-label">Quantity</span>
                  </div>
                  <div className="pd-qty-row">
                    <button
                      type="button"
                      className="pd-qty-btn"
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      disabled={selectedVariant?.stock === 0}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={selectedVariant?.stock || 1}
                      value={quantity}
                      onChange={(e) => {
                        const nextValue = Number(e.target.value);
                        setQuantity(Math.min(selectedVariant?.stock || 1, Math.max(1, nextValue || 1)));
                      }}
                      disabled={selectedVariant?.stock === 0}
                      className="pd-qty-input"
                    />
                    <button
                      type="button"
                      className="pd-qty-btn"
                      onClick={() => setQuantity((prev) => Math.min(selectedVariant?.stock || 1, prev + 1))}
                      disabled={quantity >= (selectedVariant?.stock || 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="pd-cta-row">
                  <button
                    type="button"
                    className="pd-primary-btn pd-primary-btn-lg"
                    onClick={handleAddToCart}
                    disabled={selectedVariant?.stock === 0}
                  >
                    Add to Cart
                  </button>
                  <button
                    type="button"
                    className="pd-secondary-btn"
                    onClick={() => shareCurrentPage("copy")}
                  >
                    Copy Link
                  </button>
                </div>

                <div className="pd-share-row">
                  <span>Share</span>
                  <button type="button" onClick={() => shareCurrentPage("facebook")}>Facebook</button>
                  <button type="button" onClick={() => shareCurrentPage("x")}>X</button>
                </div>
              </Card>
            </div>
          </div>

          <div className="pd-tabs-wrap">
            <Card className="pd-tabs-card pd-animate-up delay-2">
              <div className="pd-tabs-nav">
                {[
                  { key: "description", label: "Description" },
                  { key: "specs", label: "Specifications" },
                  { key: "reviews", label: "Reviews" },
                  { key: "questions", label: "Q&A" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleTabChange(tab.key)}
                    className={cn("pd-tab-btn", activeTab === tab.key && "active")}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="pd-tab-panel">
                {activeTab === "description" && (
                  <div className="pd-content-fade">
                    <p className="pd-prose">{product.description || "No description available."}</p>
                  </div>
                )}

                {activeTab === "specs" && (
                  <div className="pd-content-fade">
                    {product.attributes?.length > 0 ? (
                      <div className="pd-specs-table">
                        {product.attributes.map((attr) => (
                          <div className="pd-spec-row" key={attr.attribute_id}>
                            <div className="pd-spec-key">{attr.name}</div>
                            <div className="pd-spec-value">{attr.value}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="pd-muted">No specifications available.</p>
                    )}
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div className="pd-content-fade">
                    {reviewCount > 0 && (
                      <div className="pd-review-summary">
                        <div className="pd-review-score">
                          <div className="pd-review-score-number">{displayRating}</div>
                          <Stars value={displayRating} />
                          <p>{reviewCount} review{reviewCount !== 1 ? "s" : ""}</p>
                        </div>

                        <div className="pd-review-bars">
                          {[5, 4, 3, 2, 1].map((star) => {
                            const count = breakdown[star] || 0;
                            const pct = reviewCount ? Math.round((count / reviewCount) * 100) : 0;
                            return (
                              <div className="pd-review-bar-row" key={star}>
                                <span>{star}</span>
                                <span className="pd-review-star">★</span>
                                <div className="pd-review-track">
                                  <div className="pd-review-fill" style={{ width: `${pct}%` }} />
                                </div>
                                <span>{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {user ? (
                      <div className="pd-form-card">
                        <div className="pd-form-title">Write a review</div>
                        <RatingPicker
                          value={newRating}
                          hoverValue={hoverRating}
                          setValue={setNewRating}
                          setHoverValue={setHoverRating}
                        />
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Share your experience (optional)..."
                          rows={4}
                          className="pd-textarea"
                        />
                        {reviewError && <p className="pd-error-text">{reviewError}</p>}
                        <button
                          type="button"
                          className="pd-primary-btn"
                          disabled={postingReview || !newRating}
                          onClick={handleReviewSubmit}
                        >
                          {postingReview ? "Posting..." : "Post Review"}
                        </button>
                      </div>
                    ) : (
                      <p className="pd-muted">
                        <a href="/auth/login">Login</a> to write a review.
                      </p>
                    )}

                    {reviewsLoading ? (
                      <p className="pd-muted">Loading reviews...</p>
                    ) : reviews.length === 0 ? (
                      <p className="pd-muted">No reviews yet. Be the first!</p>
                    ) : (
                      <div className="pd-review-list">
                        {reviews.map((r) => (
                          <div className="pd-review-item" key={r.review_id || `${r.customer_name}-${r.created_at}`}>
                            <div className="pd-review-item-head">
                              <div>
                                <div className="pd-review-name">{r.customer_name}</div>
                                <Stars value={Number(r.rating || 0)} size={14} />
                              </div>
                              <div className="pd-review-date">
                                {new Date(r.created_at).toLocaleDateString("en-BD", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                            </div>
                            {r.comment && <p className="pd-prose small">{r.comment}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "questions" && (
                  <div className="pd-content-fade">
                    {user ? (
                      <div className="pd-form-inline">
                        <input
                          value={newQuestion}
                          onChange={(e) => setNewQuestion(e.target.value)}
                          placeholder="Ask a question about this product..."
                          className="pd-input"
                        />
                        <button
                          type="button"
                          className="pd-primary-btn"
                          disabled={postingQ || !newQuestion.trim()}
                          onClick={handleQuestionSubmit}
                        >
                          {postingQ ? "Posting..." : "Ask"}
                        </button>
                      </div>
                    ) : (
                      <p className="pd-muted">
                        <a href="/auth/login">Login</a> to ask a question.
                      </p>
                    )}

                    {qnaLoading ? (
                      <p className="pd-muted">Loading questions...</p>
                    ) : questions.length === 0 ? (
                      <p className="pd-muted">No questions yet. Be the first to ask!</p>
                    ) : (
                      <div className="pd-question-list">
                        {questions.map((q) => (
                          <div className="pd-question-item" key={q.question_id || `${q.customer_name}-${q.created_at}`}>
                            <div className="pd-question-q">{q.question || q.content}</div>
                            <div className="pd-question-meta">
                              {q.customer_name} · {new Date(q.created_at).toLocaleDateString("en-BD")}
                            </div>
                            {q.answer ? (
                              <div className="pd-answer-box">
                                <div className="pd-answer-meta">
                                  Seller answer · {q.answered_at ? new Date(q.answered_at).toLocaleDateString("en-BD") : "Recently"}
                                </div>
                                <div>{q.answer}</div>
                              </div>
                            ) : (
                              <div className="pd-awaiting">Awaiting seller response...</div>
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

          <div className="pd-bottom-grid">
            <IconBadge icon="🚚" title="Fast Delivery" text="Smooth delivery flow with trusted shipping coverage." />
            <IconBadge icon="↩" title="Easy Returns" text="Clear return process with a convenient support path." />
            <IconBadge icon="🔒" title="Secure Payment" text="Protected checkout experience with confidence-focused UI." />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = `
  * { box-sizing: border-box; }

  .pd-page {
    min-height: 100vh;
    background:
      radial-gradient(circle at top left, rgba(254, 227, 43, 0.12), transparent 28%),
      radial-gradient(circle at right 15%, rgba(135, 121, 40, 0.10), transparent 22%),
      linear-gradient(180deg, #fffef8 0%, #fff9dc 100%);
    color: ${COLORS.ink};
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .pd-shell {
    position: relative;
    overflow: hidden;
    isolation: isolate;
  }

  .pd-container {
    position: relative;
    z-index: 2;
    width: min(1280px, calc(100% - 32px));
    margin: 0 auto;
    padding: 28px 0 54px;
  }

  .pd-orb {
    position: absolute;
    border-radius: 999px;
    filter: blur(24px);
    opacity: 0.42;
    pointer-events: none;
    animation: pdFloat 9s ease-in-out infinite;
    z-index: 1;
  }

  .pd-orb-1 {
    width: 240px;
    height: 240px;
    background: rgba(254, 227, 43, 0.40);
    top: 80px;
    left: -40px;
  }

  .pd-orb-2 {
    width: 220px;
    height: 220px;
    background: rgba(135, 121, 40, 0.14);
    top: 440px;
    right: -60px;
    animation-delay: -2s;
  }

  .pd-orb-3 {
    width: 180px;
    height: 180px;
    background: rgba(254, 227, 43, 0.22);
    bottom: 120px;
    left: 16%;
    animation-delay: -4s;
  }

  .pd-breadcrumb {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    color: ${COLORS.muted};
    font-size: 13px;
    margin-bottom: 24px;
  }

  .pd-breadcrumb a {
    color: ${COLORS.ink};
    text-decoration: none;
    transition: opacity 0.25s ease;
  }

  .pd-breadcrumb a:hover { opacity: 0.68; }

  .pd-main-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(340px, 420px);
    gap: 28px;
    align-items: start;
  }

  .pd-gallery-wrap { min-width: 0; }

  .pd-sidebar {
    position: sticky;
    top: 20px;
  }

  .pd-card {
    background: ${COLORS.surface};
    border: 1px solid ${COLORS.line};
    border-radius: 28px;
    box-shadow:
      0 18px 50px rgba(31, 27, 22, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
  }

  .pd-gallery-card {
    padding: 18px;
    overflow: hidden;
  }

  .pd-gallery-topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }

  .pd-gallery-badges,
  .pd-meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .pd-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
    line-height: 1;
    background: rgba(255, 245, 178, 0.92);
    color: ${COLORS.ink};
    border: 1px solid rgba(31, 27, 22, 0.08);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
  }

  .pd-pill-sale { background: rgba(220, 38, 38, 0.10); color: ${COLORS.danger}; }
  .pd-pill-success { background: rgba(21, 128, 61, 0.10); color: ${COLORS.success}; }
  .pd-pill-warning { background: rgba(217, 119, 6, 0.12); color: ${COLORS.warning}; }
  .pd-pill-danger { background: rgba(220, 38, 38, 0.10); color: ${COLORS.danger}; }
  .pd-pill-purple { background: rgba(124, 58, 237, 0.12); color: ${COLORS.purple}; }

  .pd-main-image-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: 24px;
    overflow: hidden;
    background:
      linear-gradient(180deg, rgba(255,255,255,0.8), rgba(255,244,188,0.55)),
      ${COLORS.soft2};
    border: 1px solid rgba(31, 27, 22, 0.08);
  }

  .pd-main-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transform: scale(1.01);
    transition: transform 0.8s cubic-bezier(.19,1,.22,1), filter 0.5s ease;
    will-change: transform;
  }

  .pd-main-image-wrap:hover .pd-main-image {
    transform: scale(1.08);
    filter: saturate(1.04) contrast(1.02);
  }

  .pd-image-fallback {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    color: ${COLORS.muted};
    font-weight: 700;
  }

  .pd-thumbs-row {
    margin-top: 16px;
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 6px;
  }

  .pd-thumb-btn {
    width: 88px;
    height: 88px;
    flex: 0 0 auto;
    border-radius: 20px;
    overflow: hidden;
    border: 1px solid rgba(31, 27, 22, 0.10);
    background: rgba(255,255,255,0.82);
    cursor: pointer;
    transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
    box-shadow: 0 8px 22px rgba(31, 27, 22, 0.07);
  }

  .pd-thumb-btn img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .pd-thumb-btn:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 28px rgba(31, 27, 22, 0.11);
  }

  .pd-thumb-btn.active {
    border-color: rgba(245, 204, 0, 0.65);
    box-shadow: 0 18px 30px rgba(245, 204, 0, 0.24);
    transform: translateY(-2px) scale(1.02);
  }

  .pd-sidebar-card {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .pd-product-head {
    display: flex;
    gap: 14px;
    justify-content: space-between;
    align-items: flex-start;
  }

  .pd-title {
    margin: 12px 0 0;
    font-size: clamp(20px, 3vw, 32px);
    line-height: 1.02;
    letter-spacing: -0.03em;
    font-weight: 900;
  }

  .pd-wishlist-btn {
    width: 52px;
    height: 52px;
    flex: 0 0 auto;
    border-radius: 18px;
    border: 1px solid rgba(31, 27, 22, 0.12);
    background: rgba(255,255,255,0.7);
    color: ${COLORS.olive};
    font-size: 24px;
    cursor: pointer;
    transition: transform 0.28s ease, box-shadow 0.28s ease, background 0.28s ease, color 0.28s ease;
  }

  .pd-wishlist-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(31,27,22,0.10);
  }

  .pd-wishlist-btn.active {
    background: rgba(220,38,38,0.10);
    color: ${COLORS.danger};
    border-color: rgba(220,38,38,0.18);
  }

  .pd-stars,
  .pd-rating-line {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .pd-rating-text,
  .pd-seller-line,
  .pd-save-line,
  .pd-muted,
  .pd-review-date,
  .pd-question-meta,
  .pd-answer-meta,
  .pd-awaiting {
    color: ${COLORS.muted};
    font-size: 13px;
  }

  .pd-seller-line {
    margin: -4px 0 0;
  }

  .pd-seller-line a,
  .pd-muted a {
    color: ${COLORS.olive};
    font-weight: 800;
    text-decoration: none;
  }

  .pd-price-box {
    padding: 18px 18px 16px;
    border-radius: 22px;
    background:
      linear-gradient(135deg, rgba(255,255,255,0.75), rgba(255,246,191,0.88));
    border: 1px solid rgba(31, 27, 22, 0.08);
  }

  .pd-price-row {
    display: flex;
    align-items: baseline;
    gap: 12px;
    flex-wrap: wrap;
  }

  .pd-price {
    font-size: clamp(34px, 5vw, 48px);
    line-height: 1;
    font-weight: 900;
    letter-spacing: -0.04em;
    color: ${COLORS.ink};
  }

  .pd-old-price {
    text-decoration: line-through;
    color: rgba(31, 27, 22, 0.45);
    font-weight: 700;
    font-size: 18px;
  }

  .pd-discount-chip {
    padding: 7px 12px;
    border-radius: 999px;
    background: rgba(220, 38, 38, 0.10);
    color: ${COLORS.danger};
    font-size: 12px;
    font-weight: 900;
  }

  .pd-save-line {
    margin: 8px 0 0;
    color: ${COLORS.success};
    font-weight: 800;
  }

  .pd-highlight-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .pd-highlight-item {
    padding: 14px 14px 13px;
    border-radius: 18px;
    background: rgba(255,255,255,0.64);
    border: 1px solid rgba(31, 27, 22, 0.08);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
  }

  .pd-highlight-label,
  .pd-section-label,
  .pd-form-title,
  .pd-spec-key,
  .pd-review-name,
  .pd-question-q,
  .pd-answer-meta {
    font-weight: 800;
  }

  .pd-highlight-label {
    display: block;
    color: ${COLORS.muted};
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 6px;
  }

  .pd-section-block {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-top: 2px;
  }

  .pd-label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .pd-section-label {
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${COLORS.muted};
  }

  .pd-variant-grid {
    display: grid;
    gap: 10px;
  }

  .pd-variant-btn {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    width: 100%;
    padding: 14px 16px;
    text-align: left;
    border-radius: 18px;
    border: 1px solid rgba(31, 27, 22, 0.10);
    background: rgba(255,255,255,0.72);
    cursor: pointer;
    transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease, background 0.28s ease;
  }

  .pd-variant-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 28px rgba(31,27,22,0.08);
  }

  .pd-variant-btn.active {
    background: linear-gradient(180deg, rgba(255, 246, 191, 1), rgba(254, 227, 43, 0.82));
    border-color: rgba(245, 204, 0, 0.60);
    box-shadow: 0 18px 32px rgba(245, 204, 0, 0.24);
  }

  .pd-variant-name { font-weight: 800; font-size: 14px; }
  .pd-variant-sub { color: ${COLORS.muted}; font-size: 12px; margin-top: 3px; }
  .pd-variant-price { font-weight: 900; font-size: 14px; white-space: nowrap; }

  .pd-qty-row {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border-radius: 20px;
    background: rgba(255,255,255,0.62);
    border: 1px solid rgba(31,27,22,0.08);
    width: fit-content;
  }

  .pd-qty-btn,
  .pd-qty-input,
  .pd-input,
  .pd-textarea,
  .pd-primary-btn,
  .pd-secondary-btn,
  .pd-tab-btn,
  .pd-share-row button,
  .pd-star-btn {
    font-family: inherit;
  }

  .pd-qty-btn {
    width: 40px;
    height: 40px;
    border-radius: 14px;
    border: 1px solid rgba(31,27,22,0.10);
    background: rgba(255,255,255,0.9);
    color: ${COLORS.ink};
    font-size: 24px;
    cursor: pointer;
    transition: transform 0.24s ease, box-shadow 0.24s ease;
  }

  .pd-qty-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 18px rgba(31,27,22,0.08);
  }

  .pd-qty-btn:disabled,
  .pd-primary-btn:disabled,
  .pd-secondary-btn:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .pd-qty-input {
    width: 64px;
    height: 40px;
    border-radius: 14px;
    border: 1px solid rgba(31,27,22,0.10);
    background: rgba(255,255,255,0.85);
    text-align: center;
    font-weight: 800;
    color: ${COLORS.ink};
    outline: none;
  }

  .pd-cta-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
  }

  .pd-primary-btn,
  .pd-secondary-btn,
  .pd-tab-btn,
  .pd-share-row button {
    position: relative;
    border: none;
    cursor: pointer;
    transition: transform 0.28s ease, box-shadow 0.28s ease, background 0.28s ease;
  }

  .pd-primary-btn {
    overflow: hidden;
    padding: 13px 18px;
    border-radius: 16px;
    background: linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDeep});
    color: ${COLORS.ink};
    font-weight: 900;
    box-shadow: 0 14px 28px rgba(245, 204, 0, 0.28);
  }

  .pd-primary-btn::after {
    content: "";
    position: absolute;
    inset: 0;
    transform: translateX(-120%);
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
    transition: transform 0.7s ease;
  }

  .pd-primary-btn:hover::after { transform: translateX(120%); }
  .pd-primary-btn:hover:not(:disabled),
  .pd-secondary-btn:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .pd-primary-btn-lg {
    min-height: 52px;
    font-size: 15px;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .pd-secondary-btn {
    padding: 13px 16px;
    border-radius: 16px;
    background: rgba(255,255,255,0.72);
    color: ${COLORS.ink};
    border: 1px solid rgba(31,27,22,0.10);
    font-weight: 800;
    box-shadow: 0 10px 20px rgba(31,27,22,0.06);
  }

  .pd-share-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    padding-top: 6px;
    color: ${COLORS.muted};
    font-size: 13px;
    border-top: 1px solid rgba(31,27,22,0.08);
  }

  .pd-share-row button {
    padding: 9px 12px;
    border-radius: 12px;
    background: rgba(255,255,255,0.78);
    color: ${COLORS.ink};
    border: 1px solid rgba(31,27,22,0.08);
    font-size: 12px;
    font-weight: 800;
  }

  .pd-tabs-wrap { margin-top: 30px; }

  .pd-tabs-card {
    overflow: hidden;
  }

  .pd-tabs-nav {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0;
    padding: 10px;
    border-bottom: 1px solid rgba(31,27,22,0.08);
    background: linear-gradient(180deg, rgba(255,255,255,0.76), rgba(255,250,230,0.88));
  }

  .pd-tab-btn {
    padding: 14px 12px;
    border-radius: 16px;
    background: transparent;
    color: ${COLORS.muted};
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .pd-tab-btn.active {
    color: ${COLORS.ink};
    background: linear-gradient(135deg, rgba(255, 246, 191, 1), rgba(254, 227, 43, 0.76));
    box-shadow: 0 10px 20px rgba(245, 204, 0, 0.18);
  }

  .pd-tab-panel {
    padding: 26px;
  }

  .pd-content-fade {
    animation: pdFadeIn 0.38s ease;
  }

  .pd-prose {
    margin: 0;
    line-height: 1.75;
    color: ${COLORS.ink};
    font-size: 15px;
  }

  .pd-prose.small { font-size: 14px; }

  .pd-specs-table {
    display: grid;
    gap: 10px;
  }

  .pd-spec-row {
    display: grid;
    grid-template-columns: minmax(180px, 240px) minmax(0, 1fr);
    gap: 18px;
    align-items: start;
    padding: 14px 0;
    border-bottom: 1px solid rgba(31,27,22,0.08);
  }

  .pd-spec-key {
    color: ${COLORS.olive};
  }

  .pd-review-summary {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 20px;
    align-items: center;
    padding: 20px;
    border-radius: 24px;
    background: rgba(255,255,255,0.58);
    border: 1px solid rgba(31,27,22,0.08);
    margin-bottom: 22px;
  }

  .pd-review-score {
    text-align: center;
  }

  .pd-review-score-number {
    font-size: 54px;
    font-weight: 900;
    line-height: 1;
    margin-bottom: 10px;
  }

  .pd-review-score p { margin: 8px 0 0; color: ${COLORS.muted}; font-size: 13px; }

  .pd-review-bars {
    display: grid;
    gap: 8px;
  }

  .pd-review-bar-row {
    display: grid;
    grid-template-columns: 18px 14px minmax(0, 1fr) 28px;
    gap: 10px;
    align-items: center;
    font-size: 12px;
    color: ${COLORS.muted};
  }

  .pd-review-star { color: ${COLORS.primaryDeep}; }

  .pd-review-track {
    height: 8px;
    border-radius: 999px;
    background: rgba(31,27,22,0.08);
    overflow: hidden;
  }

  .pd-review-fill {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, ${COLORS.primaryDeep}, ${COLORS.primary});
  }

  .pd-form-card {
    margin-bottom: 20px;
    padding: 18px;
    border-radius: 22px;
    background: linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,246,191,0.60));
    border: 1px solid rgba(31,27,22,0.08);
  }

  .pd-form-title {
    margin-bottom: 10px;
    color: ${COLORS.ink};
    font-size: 14px;
  }

  .pd-rating-picker {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  .pd-star-btn {
    border: none;
    background: transparent;
    padding: 0;
    font-size: 30px;
    line-height: 1;
    cursor: pointer;
  }

  .pd-rating-label {
    margin-left: 6px;
    color: ${COLORS.muted};
    font-size: 13px;
    font-weight: 700;
  }

  .pd-input,
  .pd-textarea {
    width: 100%;
    border-radius: 16px;
    border: 1px solid rgba(31,27,22,0.12);
    background: rgba(255,255,255,0.86);
    padding: 13px 14px;
    outline: none;
    color: ${COLORS.ink};
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.55);
    transition: box-shadow 0.24s ease, border-color 0.24s ease, background 0.24s ease;
  }

  .pd-input:focus,
  .pd-textarea:focus,
  .pd-qty-input:focus {
    border-color: rgba(245, 204, 0, 0.58);
    box-shadow: 0 0 0 4px rgba(245, 204, 0, 0.15);
    background: rgba(255,255,255,0.95);
  }

  .pd-textarea {
    resize: vertical;
    min-height: 108px;
    margin-bottom: 12px;
  }

  .pd-error-text {
    margin: 0 0 10px;
    color: ${COLORS.danger};
    font-size: 12px;
    font-weight: 700;
  }

  .pd-review-list,
  .pd-question-list {
    display: grid;
    gap: 14px;
  }

  .pd-review-item,
  .pd-question-item {
    padding: 18px;
    border-radius: 20px;
    background: rgba(255,255,255,0.64);
    border: 1px solid rgba(31,27,22,0.08);
  }

  .pd-review-item-head {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: flex-start;
    margin-bottom: 8px;
  }

  .pd-review-name {
    font-size: 14px;
    margin-bottom: 4px;
  }

  .pd-form-inline {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    margin-bottom: 18px;
  }

  .pd-question-q {
    font-size: 15px;
    margin-bottom: 6px;
  }

  .pd-answer-box {
    margin-top: 10px;
    padding: 12px 14px;
    border-radius: 16px;
    background: rgba(255,245,178,0.55);
    border: 1px solid rgba(31,27,22,0.06);
  }

  .pd-answer-meta {
    margin-bottom: 4px;
    color: ${COLORS.olive};
    font-size: 12px;
  }

  .pd-awaiting {
    margin-top: 8px;
    font-style: italic;
  }

  .pd-bottom-grid {
    margin-top: 30px;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .pd-info-card {
    padding: 22px;
    text-align: center;
    transition: transform 0.28s ease, box-shadow 0.28s ease;
  }

  .pd-info-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 22px 42px rgba(31,27,22,0.10);
  }

  .pd-info-icon {
    width: 58px;
    height: 58px;
    margin: 0 auto 14px;
    border-radius: 18px;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, rgba(255, 246, 191, 1), rgba(254, 227, 43, 0.78));
    font-size: 28px;
    box-shadow: 0 14px 24px rgba(245, 204, 0, 0.18);
  }

  .pd-info-title {
    font-size: 15px;
    font-weight: 900;
    margin-bottom: 6px;
  }

  .pd-info-text {
    color: ${COLORS.muted};
    font-size: 13px;
    line-height: 1.6;
  }

  .pd-empty-state {
    max-width: 560px;
    margin: 80px auto;
    padding: 32px;
    text-align: center;
  }

  .pd-empty-state h2 {
    margin: 0 0 8px;
    font-size: 32px;
    font-weight: 900;
  }

  .pd-empty-state p {
    color: ${COLORS.muted};
    margin: 0 0 18px;
    line-height: 1.65;
  }

  .pd-empty-icon {
    width: 60px;
    height: 60px;
    display: grid;
    place-items: center;
    margin: 0 auto 16px;
    border-radius: 18px;
    background: rgba(220,38,38,0.10);
    color: ${COLORS.danger};
    font-size: 28px;
    font-weight: 900;
  }

  .pd-loader-wrap {
    padding-top: 18px;
    padding-bottom: 48px;
  }

  .pd-loader-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(340px, 420px);
    gap: 28px;
    align-items: start;
  }

  .pd-skeleton-panel {
    display: grid;
    gap: 14px;
  }

  .pd-skeleton {
    border-radius: 24px;
    background: linear-gradient(90deg, rgba(255,255,255,0.35), rgba(255,255,255,0.82), rgba(255,255,255,0.35));
    background-size: 300% 100%;
    animation: pdShimmer 1.6s linear infinite;
    border: 1px solid rgba(31,27,22,0.05);
  }

  .pd-skeleton-image { aspect-ratio: 1 / 1; }
  .pd-skeleton-line { height: 18px; }
  .pd-skeleton-line.sm { width: 34%; }
  .pd-skeleton-line.md { width: 56%; }
  .pd-skeleton-line.lg { width: 72%; height: 28px; }
  .pd-skeleton-line.xl { width: 90%; height: 56px; border-radius: 20px; }
  .pd-skeleton-btn { width: 100%; height: 52px; border-radius: 18px; }

  .pd-animate-up {
    opacity: 0;
    transform: translateY(22px);
    animation: pdUp 0.7s cubic-bezier(.2,.8,.2,1) forwards;
  }

  .pd-animate-up.delay-1 { animation-delay: 0.1s; }
  .pd-animate-up.delay-2 { animation-delay: 0.18s; }

  @keyframes pdUp {
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes pdFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes pdShimmer {
    0% { background-position: 100% 50%; }
    100% { background-position: -100% 50%; }
  }

  @keyframes pdFloat {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(-18px) scale(1.05); }
  }

  @media (max-width: 1100px) {
    .pd-main-grid,
    .pd-loader-grid {
      grid-template-columns: 1fr;
    }

    .pd-sidebar {
      position: static;
    }
  }

  @media (max-width: 860px) {
    .pd-tabs-nav {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .pd-review-summary,
    .pd-bottom-grid {
      grid-template-columns: 1fr;
    }

    .pd-form-inline,
    .pd-cta-row {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 680px) {
    .pd-container {
      width: min(100% - 20px, 1280px);
      padding-top: 18px;
      padding-bottom: 36px;
    }

    .pd-gallery-card,
    .pd-sidebar-card,
    .pd-tab-panel,
    .pd-info-card,
    .pd-review-item,
    .pd-question-item,
    .pd-form-card {
      padding-left: 16px;
      padding-right: 16px;
    }

    .pd-title {
      font-size: 28px;
    }

    .pd-highlight-grid {
      grid-template-columns: 1fr;
    }

    .pd-spec-row {
      grid-template-columns: 1fr;
      gap: 6px;
    }

    .pd-review-item-head,
    .pd-product-head {
      flex-direction: column;
    }

    .pd-thumb-btn {
      width: 76px;
      height: 76px;
      border-radius: 18px;
    }
  }
`;
