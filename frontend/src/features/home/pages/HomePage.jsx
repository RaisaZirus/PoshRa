import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

/**
 * PoshRa Home Page (Refactored UI)
 * - Modern premium layout
 * - Fully responsive with in-file CSS
 * - Preserves existing API contracts, routing and add-to-cart logic
 */

const COLORS = {
  bg: "#FDFDF9",
  soft: "#FBEF9C",
  primary: "#FEE32B",
  olive: "#877928",
  ink: "#201D18",
  paper: "#FFFFFF",
  line: "rgba(32,29,24,0.10)",
  muted: "rgba(32,29,24,0.68)",
  shadow: "0 18px 48px rgba(32, 29, 24, 0.10)",
};

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

const MOCK = {
  campaigns: [
    {
      campaign_id: 1,
      name: "New Year Mega Sale",
      start_time: new Date(Date.now() - 86400000).toISOString(),
      end_time: new Date(Date.now() + 6 * 86400000).toISOString(),
      highlights: [
        { variant_id: 1, product_id: 1, name: "Red Shirt", discount_price: 799, store_name: "TechTown" },
        { variant_id: 2, product_id: 2, name: "Blue Jeans", discount_price: 1299, store_name: "Urban Threads" },
        { variant_id: 3, product_id: 3, name: "Black Shoes", discount_price: 1699, store_name: "PoshStep" },
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
      total_sold: 78,
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
      total_sold: 16,
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
      total_sold: 61,
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
      total_sold: 9,
    },
  ],
};

function UIStyles() {
  return (
    <style>{`
      :root {
        --bg: ${COLORS.bg};
        --soft: ${COLORS.soft};
        --primary: ${COLORS.primary};
        --olive: ${COLORS.olive};
        --ink: ${COLORS.ink};
        --paper: ${COLORS.paper};
        --line: ${COLORS.line};
        --muted: ${COLORS.muted};
        --shadow: ${COLORS.shadow};
        --radius-lg: 28px;
        --radius-md: 20px;
        --radius-sm: 16px;
      }

      * { box-sizing: border-box; }

      .hp-page {
        position: relative;
        min-height: 100%;
        background:
          radial-gradient(circle at top left, rgba(254,227,43,0.14), transparent 28%),
          radial-gradient(circle at 90% 8%, rgba(135,121,40,0.08), transparent 18%),
          var(--bg);
        color: var(--ink);
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .hp-shell {
        width: min(1240px, calc(100% - 32px));
        margin: 0 auto;
        padding: 24px 0 40px;
      }

      .hp-section {
        margin-top: 28px;
        animation: hp-fade-up 0.6s ease both;
      }

      .hp-card,
      .hp-surface {
        background: rgba(255,255,255,0.74);
        backdrop-filter: blur(12px);
        border: 1px solid var(--line);
        box-shadow: var(--shadow);
      }

      .hp-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 18px 20px;
        border-radius: 24px;
        background: linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(251,239,156,0.58) 100%);
      }

      .hp-brand {
        display: flex;
        align-items: center;
        gap: 14px;
        min-width: 0;
      }

      .hp-brand-mark {
        width: 52px;
        height: 52px;
        flex: 0 0 52px;
        border-radius: 18px;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, var(--primary) 0%, #fff0a6 100%);
        border: 1px solid rgba(32,29,24,0.2);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
        font-size: 18px;
        font-weight: 900;
        letter-spacing: 0.06em;
      }

      .hp-brand-title {
        margin: 0;
        font-size: clamp(1.1rem, 2vw, 1.35rem);
        font-weight: 900;
        line-height: 1.1;
      }

      .hp-brand-subtitle {
        margin: 4px 0 0;
        font-size: 0.92rem;
        color: var(--muted);
      }

      .hp-topbar-actions,
      .hp-hero-actions,
      .hp-inline-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .hp-btn,
      .hp-btn-secondary,
      .hp-link-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 46px;
        border-radius: 14px;
        padding: 0 16px;
        text-decoration: none;
        transition: transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease, border-color 0.22s ease;
        font-weight: 800;
        cursor: pointer;
      }

      .hp-btn {
        color: var(--ink);
        background: linear-gradient(135deg, var(--primary) 0%, #fff2a7 100%);
        border: 1px solid rgba(32,29,24,0.16);
        box-shadow: 0 12px 22px rgba(254,227,43,0.22);
      }

      .hp-btn-secondary {
        color: var(--paper);
        background: linear-gradient(135deg, #242018 0%, #3a342c 100%);
        border: 1px solid rgba(32,29,24,0.18);
        box-shadow: 0 14px 24px rgba(32,29,24,0.16);
      }

      .hp-link-chip {
        min-height: 40px;
        padding: 0 12px;
        border: 1px solid rgba(32,29,24,0.12);
        color: var(--ink);
        background: rgba(255,255,255,0.72);
      }

      .hp-btn:hover,
      .hp-btn-secondary:hover,
      .hp-link-chip:hover,
      .hp-hover:hover {
        transform: translateY(-2px);
      }

      .hp-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 32px;
        border-radius: 999px;
        padding: 0 12px;
        border: 1px solid rgba(32,29,24,0.10);
        background: rgba(255,255,255,0.75);
        color: var(--ink);
        font-size: 0.82rem;
        font-weight: 800;
        white-space: nowrap;
      }

      .hp-pill--soft {
        background: rgba(251,239,156,0.62);
      }

      .hp-hero {
        position: relative;
        overflow: hidden;
        padding: clamp(22px, 3vw, 34px);
        border-radius: 30px;
        background:
          radial-gradient(circle at 0% 0%, rgba(255,255,255,0.70), transparent 30%),
          linear-gradient(135deg, rgba(254,227,43,0.95) 0%, rgba(251,239,156,0.88) 42%, rgba(255,255,255,0.88) 100%);
      }

      .hp-hero::before,
      .hp-hero::after {
        content: "";
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
      }

      .hp-hero::before {
        width: 280px;
        height: 280px;
        right: -90px;
        top: -90px;
        background: rgba(255,255,255,0.28);
        filter: blur(8px);
      }

      .hp-hero::after {
        width: 220px;
        height: 220px;
        left: -80px;
        bottom: -110px;
        background: rgba(135,121,40,0.10);
      }

      .hp-hero-grid {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
        gap: 22px;
        align-items: stretch;
      }

      .hp-eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 14px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        font-size: 0.76rem;
        font-weight: 900;
        color: rgba(32,29,24,0.70);
      }

      .hp-hero-title {
        margin: 0;
        max-width: 12ch;
        font-size: clamp(2rem, 4.4vw, 4.2rem);
        line-height: 0.94;
        letter-spacing: -0.04em;
      }

      .hp-hero-copy {
        margin: 16px 0 0;
        max-width: 58ch;
        font-size: clamp(0.98rem, 1.4vw, 1.08rem);
        line-height: 1.7;
        color: rgba(32,29,24,0.78);
      }

      .hp-hero-meta {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 20px;
      }

      .hp-hero-actions {
        margin-top: 22px;
      }

      .hp-stat-row {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin-top: 22px;
      }

      .hp-stat {
        padding: 16px;
        border-radius: 18px;
        background: rgba(255,255,255,0.68);
        border: 1px solid rgba(32,29,24,0.08);
      }

      .hp-stat-value {
        font-size: clamp(1.15rem, 2vw, 1.55rem);
        font-weight: 900;
      }

      .hp-stat-label {
        margin-top: 4px;
        font-size: 0.84rem;
        color: rgba(32,29,24,0.64);
      }

      .hp-hero-side {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .hp-floating-card {
        position: relative;
        border-radius: 24px;
        padding: 18px;
        background: rgba(255,255,255,0.74);
        border: 1px solid rgba(32,29,24,0.10);
        box-shadow: 0 18px 32px rgba(32,29,24,0.08);
        animation: hp-float 5.5s ease-in-out infinite;
      }

      .hp-side-title {
        margin: 0;
        font-size: 1rem;
        font-weight: 900;
      }

      .hp-side-copy {
        margin: 8px 0 0;
        color: rgba(32,29,24,0.72);
        line-height: 1.6;
        font-size: 0.94rem;
      }

      .hp-highlight-list {
        display: grid;
        gap: 12px;
        margin-top: 14px;
      }

      .hp-highlight-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-radius: 18px;
        text-decoration: none;
        color: var(--ink);
        background: rgba(255,255,255,0.76);
        border: 1px solid rgba(32,29,24,0.08);
      }

      .hp-highlight-thumb {
        width: 64px;
        height: 64px;
        border-radius: 16px;
        object-fit: cover;
        background: rgba(251,239,156,0.50);
        flex: 0 0 64px;
      }

      .hp-highlight-name {
        font-weight: 800;
        line-height: 1.25;
      }

      .hp-highlight-store,
      .hp-highlight-price-sub {
        font-size: 0.82rem;
        color: rgba(32,29,24,0.62);
      }

      .hp-highlight-price {
        font-weight: 900;
        white-space: nowrap;
      }

      .hp-highlight-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .hp-grid {
        display: grid;
        gap: 16px;
      }

      .hp-grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .hp-grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }

      .hp-section-head {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 16px;
      }

      .hp-section-title {
        margin: 0;
        font-size: clamp(1.2rem, 2vw, 1.6rem);
        line-height: 1.1;
        font-weight: 900;
        letter-spacing: -0.03em;
      }

      .hp-section-subtitle {
        margin: 8px 0 0;
        font-size: 0.94rem;
        color: rgba(32,29,24,0.68);
      }

      .hp-category-card,
      .hp-store-card,
      .hp-product-card,
      .hp-trust-card,
      .hp-empty-card,
      .hp-loading-card {
        border-radius: 24px;
        overflow: hidden;
      }

      .hp-category-card {
        position: relative;
        padding: 20px;
        background:
          linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(251,239,156,0.42) 100%),
          var(--paper);
      }

      .hp-category-card::after {
        content: "";
        position: absolute;
        right: -20px;
        bottom: -20px;
        width: 110px;
        height: 110px;
        border-radius: 50%;
        background: rgba(254,227,43,0.15);
      }

      .hp-category-top,
      .hp-store-top,
      .hp-product-meta,
      .hp-trust-top {
        position: relative;
        z-index: 1;
      }

      .hp-category-name {
        margin: 0;
        font-size: 1.06rem;
        font-weight: 900;
        line-height: 1.2;
      }

      .hp-category-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 14px;
      }

      .hp-tag {
        display: inline-flex;
        align-items: center;
        min-height: 34px;
        padding: 0 12px;
        border-radius: 999px;
        text-decoration: none;
        font-size: 0.84rem;
        color: var(--ink);
        background: rgba(255,255,255,0.88);
        border: 1px solid rgba(32,29,24,0.08);
        transition: transform 0.22s ease;
      }

      .hp-tag:hover { transform: translateY(-1px); }

      .hp-product-card {
        display: flex;
        flex-direction: column;
        background: rgba(255,255,255,0.80);
        text-decoration: none;
        color: inherit;
      }

      .hp-product-media {
        position: relative;
        aspect-ratio: 4 / 3.3;
        overflow: hidden;
        background: linear-gradient(180deg, rgba(251,239,156,0.28) 0%, rgba(255,255,255,0.9) 100%);
      }

      .hp-product-media img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.45s ease;
      }

      .hp-product-card:hover .hp-product-media img {
        transform: scale(1.06);
      }

      .hp-product-badges {
        position: absolute;
        left: 14px;
        top: 14px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .hp-product-body {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 12px;
        padding: 16px;
      }

      .hp-product-title {
        margin: 0;
        font-size: 1rem;
        line-height: 1.35;
        font-weight: 800;
      }

      .hp-product-brand {
        margin-top: 5px;
        color: rgba(32,29,24,0.62);
        font-size: 0.86rem;
      }

      .hp-product-price {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 14px;
      }

      .hp-price-current {
        font-size: 1.15rem;
        font-weight: 900;
        line-height: 1;
      }

      .hp-price-old {
        margin-top: 4px;
        color: rgba(32,29,24,0.45);
        font-size: 0.84rem;
        text-decoration: line-through;
      }

      .hp-product-action {
        margin-top: auto;
      }

      .hp-product-action button {
        width: 100%;
        min-height: 46px;
        border-radius: 14px;
        border: 1px solid rgba(32,29,24,0.12);
        background: linear-gradient(135deg, rgba(254,227,43,1) 0%, rgba(255,244,173,1) 100%);
        color: var(--ink);
        font-weight: 900;
        cursor: pointer;
        transition: transform 0.22s ease, box-shadow 0.22s ease;
      }

      .hp-product-action button:hover {
        transform: translateY(-1px);
        box-shadow: 0 14px 24px rgba(254,227,43,0.18);
      }

      .hp-store-card,
      .hp-trust-card,
      .hp-loading-card,
      .hp-empty-card {
        padding: 20px;
        background: rgba(255,255,255,0.80);
      }

      .hp-store-card {
        position: relative;
        overflow: hidden;
      }

      .hp-store-card::before {
        content: "";
        position: absolute;
        inset: auto -24px -24px auto;
        width: 96px;
        height: 96px;
        border-radius: 50%;
        background: rgba(254,227,43,0.18);
      }

      .hp-store-name {
        margin: 0;
        font-size: 1.02rem;
        font-weight: 900;
      }

      .hp-store-meta {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 10px;
      }

      .hp-store-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: 18px;
      }

      .hp-trust-icon {
        width: 46px;
        height: 46px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        font-size: 1.2rem;
        background: rgba(254,227,43,0.22);
      }

      .hp-trust-title {
        margin: 16px 0 0;
        font-size: 1rem;
        font-weight: 900;
      }

      .hp-trust-copy {
        margin: 8px 0 0;
        color: rgba(32,29,24,0.70);
        line-height: 1.65;
        font-size: 0.92rem;
      }

      .hp-loading-card,
      .hp-empty-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .hp-loader {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        border: 4px solid rgba(32,29,24,0.08);
        border-top-color: rgba(32,29,24,0.55);
        animation: hp-spin 0.9s linear infinite;
        flex: 0 0 42px;
      }

      .hp-mini-note {
        margin: 6px 0 0;
        color: rgba(32,29,24,0.68);
        font-size: 0.9rem;
      }

      .hp-footer-space {
        height: 8px;
      }

      @keyframes hp-spin {
        to { transform: rotate(360deg); }
      }

      @keyframes hp-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }

      @keyframes hp-fade-up {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* Search Results Card Styles */
      .sr-card {
        background: linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.80));
        border: 1px solid rgba(23,21,16,0.08);
        border-radius: 24px;
        box-shadow: 0 12px 30px rgba(23,21,16,0.06);
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
        color: #5e5420;
      }
      .sr-cart-arrow {
        display: inline-block;
        transition: transform .22s ease;
      }
      .sr-cart-btn:hover .sr-cart-arrow {
        transform: translateX(3px);
      }
      .sr-enter {
        animation: sr-enter 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
        opacity: 0;
        transform: translateY(20px);
      }
      @keyframes sr-enter {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (max-width: 1080px) {
        .hp-hero-grid { grid-template-columns: 1fr; }
        .hp-grid-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .hp-grid-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }

      @media (max-width: 760px) {
        .hp-shell { width: min(100% - 20px, 1240px); padding-top: 18px; }
        .hp-topbar,
        .hp-section-head,
        .hp-loading-card,
        .hp-empty-card,
        .hp-store-footer { flex-direction: column; align-items: stretch; }
        .hp-stat-row,
        .hp-grid-4,
        .hp-grid-3 { grid-template-columns: 1fr; }
        .hp-hero { border-radius: 24px; }
        .hp-hero-title { max-width: 100%; }
      }

      @media (prefers-reduced-motion: reduce) {
        .hp-btn,
        .hp-btn-secondary,
        .hp-link-chip,
        .hp-product-media img,
        .hp-product-action button,
        .hp-hover,
        .hp-tag,
        .hp-floating-card,
        .hp-section {
          transition: none !important;
          animation: none !important;
        }
      }
    `}</style>
  );
}

function Pill({ children, soft = false }) {
  return <span className={`hp-pill ${soft ? "hp-pill--soft" : ""}`}>{children}</span>;
}

function Surface({ children, className = "", style }) {
  return (
    <div className={`hp-card hp-hover ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

function Section({ title, subtitle, action, children }) {
  return (
    <section className="hp-section">
      <div className="hp-section-head">
        <div>
          <h2 className="hp-section-title">{title}</h2>
          {subtitle ? <p className="hp-section-subtitle">{subtitle}</p> : null}
        </div>
        {action ? <div className="hp-inline-actions">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function getCampaignDateText(campaign) {
  const start = new Date(campaign?.start_time);
  const end = new Date(campaign?.end_time);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "Limited-time event";
  return `${start.toLocaleDateString()} — ${end.toLocaleDateString()}`;
}

function getCampaignDaysLeft(campaign) {
  const end = new Date(campaign?.end_time);
  const diff = end.getTime() - Date.now();
  if (Number.isNaN(diff)) return null;
  const days = Math.max(0, Math.ceil(diff / 86400000));
  return days;
}

function ProductCard({ p, onAddToCart }) {
  const price = p.discount_price || p.min_price || p.price || 0;
  const original = p.min_price || p.price || 0;
  const hasDiscount = p.discount_price && Number(p.discount_price) < Number(original);
  const outOfStock = Number(p.total_stock ?? p.stock ?? 1) <= 0;
  const pct = hasDiscount
    ? Math.round(((Number(original) - Number(p.discount_price)) / Number(original)) * 100)
    : 0;
  const pid = p.product_id || p.id;

  return (
    <article className="sr-card sr-product sr-enter" style={{ animationDelay: "0ms" }}>
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
            <span style={{ fontSize: 12, color: COLORS.muted, fontWeight: 700 }}>
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

function CategoryGrid({ categories }) {
  const navigate = useNavigate();
  const parents = categories.filter((c) => c.parent_id == null);
  const childrenOf = (parentId) => categories.filter((c) => c.parent_id === parentId);

  return (
    <div className="hp-grid hp-grid-3">
      {parents.slice(0, 6).map((parent) => {
        const kids = childrenOf(parent.category_id);
        const slug = parent.slug || slugify(parent.name);

        return (
          <Surface
            key={parent.category_id}
            className="hp-category-card"
            style={{ cursor: "pointer" }}
            onClick={() => navigate(`/c/${slug}`)}
          >
            <div className="hp-category-top">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                <div>
                  <Pill soft>Collections</Pill>
                  <h3 className="hp-category-name" style={{ marginTop: 14 }}>{parent.name}</h3>
                </div>
              </div>

              <div className="hp-category-tags">
                {kids.slice(0, 6).map((k) => (
                  <Link
                    key={k.category_id}
                    to={`/c/${k.slug || slugify(k.name)}`}
                    className="hp-tag"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {k.name}
                  </Link>
                ))}
                {kids.length === 0 ? <span className="hp-mini-note">No subcategories yet</span> : null}
              </div>
            </div>
          </Surface>
        );
      })}
    </div>
  );
}

function StoreRow({ stores }) {
  return (
    <div className="hp-grid hp-grid-3">
      {stores.slice(0, 6).map((s) => (
        <Surface key={s.store_id} className="hp-store-card">
          <div className="hp-store-top">
            <Pill soft>Trusted seller</Pill>
            <h3 className="hp-store-name" style={{ marginTop: 14 }}>{s.store_name}</h3>
            <div className="hp-store-meta">
              <Pill>⭐ {Number(s.store_rating || 0).toFixed(1)}</Pill>
              <Pill>{s.store_status || "active"}</Pill>
            </div>
          </div>

          <div className="hp-store-footer" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="hp-mini-note">Curated products and better service from verified vendors.</span>
            <Link to={`/s/${s.store_slug || slugify(s.store_name)}`} className="hp-btn" style={{ alignSelf: "flex-start" }}>
              Visit store
            </Link>
          </div>
        </Surface>
      ))}
    </div>
  );
}

function CampaignHero({ campaign, campaignIndex, campaignCount, onPrev, onNext, onSelect, categoriesCount, productCount, storeCount }) {
  if (!campaign) return null;

  const dateText = getCampaignDateText(campaign);
  const daysLeft = getCampaignDaysLeft(campaign);
  const highlights = Array.isArray(campaign.highlights) ? campaign.highlights.slice(0, 3) : [];

  return (
    <Surface className="hp-hero">
      <div className="hp-hero-grid">
        <div>
          <div className="hp-eyebrow">
            <span>PoshRa campaign</span>
            <span>•</span>
            <span>{dateText}</span>
          </div>

          <h1 className="hp-hero-title">{campaign.name}</h1>

          <p className="hp-hero-copy">
            Discover a cleaner, faster, and more premium marketplace experience with curated categories, featured products, and trusted sellers — all designed to feel polished and conversion-focused.
          </p>

          <div className="hp-hero-meta">
            <Pill soft>{daysLeft != null ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left` : "Live now"}</Pill>
            <Pill>{productCount}+ featured items</Pill>
            <Pill>{storeCount}+ trusted stores</Pill>
          </div>

          <div className="hp-hero-actions">
            <Link to="/search?q=&sort=discount" className="hp-btn">
              Explore deals
            </Link>
            <Link to="/search?q=" className="hp-btn-secondary">
              Shop now
            </Link>
          </div>

          <div className="hp-stat-row">
            <div className="hp-stat">
              <div className="hp-stat-value">{categoriesCount}+</div>
              <div className="hp-stat-label">Categories to browse</div>
            </div>
            <div className="hp-stat">
              <div className="hp-stat-value">{storeCount}+</div>
              <div className="hp-stat-label">Stores onboarded</div>
            </div>
            <div className="hp-stat">
              <div className="hp-stat-value">{highlights.length || 0}</div>
              <div className="hp-stat-label">Campaign highlights</div>
            </div>
          </div>
        </div>

        <div className="hp-hero-side">
          <div className="hp-floating-card">
            <h3 className="hp-side-title">This week’s spotlight</h3>
            <p className="hp-side-copy">
              Discover unbeatable deals and exclusive offers from our featured campaigns. Shop the latest trends with confidence and style.
            </p>
          </div>

          <div className="hp-floating-card" style={{ animationDelay: "0.3s" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <h3 className="hp-side-title">Highlight products</h3>
              <Pill soft>{highlights.length} picks</Pill>
            </div>

            {highlights.length === 0 ? (
              <p className="hp-side-copy">No campaign products yet. Sellers can add products to campaigns from their dashboard.</p>
            ) : (
              <div className="hp-highlight-list">
                {highlights.map((h) => (
                  <Link key={`${h.variant_id}-${h.product_id}`} to={`/p/${h.product_id}`} className="hp-highlight-item">
                    <img
                      src={h.image_url || "https://via.placeholder.com/80?text=?"}
                      alt={h.name}
                      className="hp-highlight-thumb"
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="hp-highlight-row">
                        <div style={{ minWidth: 0 }}>
                          <div className="hp-highlight-name">{h.name}</div>
                          <div className="hp-highlight-store">{h.store_name || "Seller item"}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div className="hp-highlight-price">{money(h.discount_price || h.price)}</div>
                          <div className="hp-highlight-price-sub">View item</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "20px 20px 18px", borderTop: "1px solid rgba(32,29,24,0.08)", background: "transparent" }}>
        <button type="button" onClick={onPrev} className="hp-btn-secondary" style={{ minWidth: 48, padding: "0 14px", background: "transparent", border: "1px solid rgba(32,29,24,0.12)", boxShadow: "none", color: "rgba(32,29,24,0.85)" }} aria-label="Previous campaign">
          ‹
        </button>

        <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", flex: 1, minWidth: 0, flexWrap: "wrap" }}>
          {Array.from({ length: campaignCount || 1 }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onSelect(index)}
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                border: "none",
                cursor: "pointer",
                background: index === campaignIndex ? "rgba(32,29,24,0.95)" : "rgba(32,29,24,0.18)",
                transition: "background 0.2s ease",
              }}
              aria-label={`Show campaign ${index + 1}`}
            />
          ))}
        </div>

        <button type="button" onClick={onNext} className="hp-btn-secondary" style={{ minWidth: 48, padding: "0 14px", background: "transparent", border: "1px solid rgba(32,29,24,0.12)", boxShadow: "none", color: "rgba(32,29,24,0.85)" }} aria-label="Next campaign">
          ›
        </button>
      </div>
    </Surface>
  );
}

function SellerLink() {
  const { user } = useAuth();

  if (user?.role === "seller") {
    return (
      <a href="/seller/dashboard" className="hp-btn">
        My dashboard
      </a>
    );
  }

  return (
    <a href="/auth/register" className="hp-btn">
      Sell on PoshRa
    </a>
  );
}

function LoadingBlock() {
  return (
    <Surface className="hp-loading-card">
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div className="hp-loader" />
        <div>
          <strong>Loading PoshRa…</strong>
          <p className="hp-mini-note">Fetching campaigns, categories, stores, and featured products.</p>
        </div>
      </div>
      <Pill soft>Just a moment</Pill>
    </Surface>
  );
}

function EmptyCampaignBlock() {
  return (
    <Surface className="hp-empty-card">
      <div>
        <strong>No active campaigns right now</strong>
        <p className="hp-mini-note">Check back soon for seller campaign deals and limited-time offers.</p>
      </div>
      <Link to="/search?q=" className="hp-btn">
        Browse products
      </Link>
    </Surface>
  );
}

export default function HomePage() {
  const [loading, setLoading] = React.useState(true);
  const [campaigns, setCampaigns] = React.useState([]);
  const [activeCampaignIndex, setActiveCampaignIndex] = React.useState(0);
  const [categories, setCategories] = React.useState([]);
  const [stores, setStores] = React.useState([]);
  const [products, setProducts] = React.useState([]);

  const { fetchWithAuth, user } = useAuth();
  const navigate = useNavigate();

  const handleAddToCart = async (productId) => {
    if (!user) {
      navigate("/auth/login");
      return;
    }

    try {
      const res = await fetch(`/api/products/${productId}`);
      const data = await res.json();
      const variant = data?.data?.variants?.[0];

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

  React.useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);

      const [camps, cats, sts, prods] = await Promise.all([
        safeFetchJSON("/api/campaigns/active", MOCK.campaigns).then((r) => (Array.isArray(r) ? r : r?.data ?? MOCK.campaigns)),
        safeFetchJSON("/api/categories", MOCK.categories).then((r) => (Array.isArray(r) ? r : r?.data ?? MOCK.categories)),
        safeFetchJSON("/api/stores", MOCK.stores).then((r) => (Array.isArray(r) ? r : r?.data ?? MOCK.stores)),
        safeFetchJSON("/api/products/featured", MOCK.products).then((r) => (Array.isArray(r) ? r : r?.data ?? MOCK.products)),
      ]);

      if (!alive) return;

      setCampaigns(Array.isArray(camps) ? camps : MOCK.campaigns);
      setActiveCampaignIndex(0);
      setCategories(Array.isArray(cats) && cats.length > 0 ? cats : MOCK.categories);
      setStores(Array.isArray(sts) && sts.length > 0 ? sts : MOCK.stores);
      setProducts(Array.isArray(prods) ? prods : MOCK.products);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    if (!campaigns.length) return;
    const interval = setInterval(() => {
      setActiveCampaignIndex((current) => (current + 1) % campaigns.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [campaigns.length]);

  const activeCampaign = campaigns?.[activeCampaignIndex] || null;

  return (
    <div className="hp-page">
      <UIStyles />

      <div className="hp-shell">
        <Surface className="hp-topbar">
          <div className="hp-brand">
            <div className="hp-brand-mark">PR</div>
            <div>
              <p className="hp-brand-title">PoshRa</p>
              <p className="hp-brand-subtitle">Multivendor marketplace — shop from trusted stores</p>
            </div>
          </div>

          <div className="hp-topbar-actions">
            <Link to="/search?q=" className="hp-btn-secondary">
              Start shopping
            </Link>
            <SellerLink />
          </div>
        </Surface>

        <section className="hp-section">
          {activeCampaign ? (
            <CampaignHero
              campaign={activeCampaign}
              campaignIndex={activeCampaignIndex}
              campaignCount={campaigns.length}
              onPrev={() => setActiveCampaignIndex((current) => (current - 1 + campaigns.length) % campaigns.length)}
              onNext={() => setActiveCampaignIndex((current) => (current + 1) % campaigns.length)}
              onSelect={(index) => setActiveCampaignIndex(index)}
              categoriesCount={categories.length || MOCK.categories.length}
              productCount={products.length || MOCK.products.length}
              storeCount={stores.length || MOCK.stores.length}
            />
          ) : (
            <EmptyCampaignBlock />
          )}
        </section>

        {loading ? (
          <section className="hp-section">
            <LoadingBlock />
          </section>
        ) : null}

        <Section
          title="Shop by category"
          subtitle="Browse curated collections with clearer hierarchy and faster discovery."
          action={
            <Link to="/search?q=" className="hp-link-chip">
              View all
            </Link>
          }
        >
          <CategoryGrid categories={categories} />
        </Section>

        <Section
          title="Featured products"
          subtitle="Hand-picked items presented with stronger visuals and cleaner pricing focus."
          action={
            <Link to="/search?q=&sort=new" className="hp-link-chip">
              See more
            </Link>
          }
        >
          <div className="hp-grid hp-grid-4">
            {products.slice(0, 8).map((p) => (
              <ProductCard key={p.product_id} p={p} onAddToCart={handleAddToCart} />
            ))}
          </div>
        </Section>

        <Section
          title="Top stores"
          subtitle="Give trusted sellers more presence with premium-looking cards and cleaner calls to action."
          action={
            <Link to="/search?q=&sort=rating" className="hp-link-chip">
              Discover stores
            </Link>
          }
        >
          <StoreRow stores={stores} />
        </Section>

        <Section title="Why PoshRa?" subtitle="Built for trust, speed, and seller growth.">
          <div className="hp-grid hp-grid-4">
            {[
              {
                icon: "🛍️",
                title: "Multi-vendor",
                text: "Shop products from multiple stores in one seamless experience with clearer browsing and stronger merchandising.",
              },
              {
                icon: "⚡",
                title: "Campaign deals",
                text: "Prominent promotional spaces make discounts feel premium instead of cluttered, helping offers convert better.",
              },
              {
                icon: "🔒",
                title: "Secure payments",
                text: "The interface emphasizes trust, clarity, and confidence at every touchpoint from product cards to checkout paths.",
              },
              {
                icon: "🚚",
                title: "Fast delivery",
                text: "A cleaner information hierarchy helps customers scan products, stores, and purchase decisions faster.",
              },
            ].map((item) => (
              <Surface key={item.title} className="hp-trust-card">
                <div className="hp-trust-top">
                  <div className="hp-trust-icon">{item.icon}</div>
                  <h3 className="hp-trust-title">{item.title}</h3>
                  <p className="hp-trust-copy">{item.text}</p>
                </div>
              </Surface>
            ))}
          </div>
        </Section>

        <div className="hp-footer-space" />
      </div>
    </div>
  );
}
