import React from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = {
  bg: "#fffdf7",
  surface: "rgba(255,255,255,0.76)",
  surfaceStrong: "#ffffff",
  soft: "#fff4b8",
  primary: "#fee32b",
  primaryDeep: "#f2c400",
  accent: "#8b7a23",
  ink: "#1e1b16",
  muted: "#6f6655",
  line: "rgba(30,27,22,0.10)",
  lineStrong: "rgba(30,27,22,0.16)",
  success: "#16a34a",
  danger: "#dc2626",
  shadow: "0 18px 50px rgba(32,29,24,0.10)",
  shadowHover: "0 28px 70px rgba(32,29,24,0.16)",
};

const STATUS_COLORS = {
  pending: { bg: "#FEF3C7", text: "#92400E" },
  processing: { bg: "#DBEAFE", text: "#1D4ED8" },
  shipped: { bg: "#E0F2FE", text: "#0369A1" },
  delivered: { bg: "#DCFCE7", text: "#166534" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B" },
  returned: { bg: "#F3F4F6", text: "#374151" },
  paid: { bg: "#DCFCE7", text: "#166534" },
  failed: { bg: "#FEE2E2", text: "#991B1B" },
  refunded: { bg: "#F3F4F6", text: "#374151" },
};

const PAGE_CSS = `
  * { box-sizing: border-box; }

  .od-page {
    min-height: 100vh;
    color: ${COLORS.ink};
    background:
      radial-gradient(circle at top left, rgba(254,227,43,0.28), transparent 26%),
      radial-gradient(circle at top right, rgba(251,239,156,0.32), transparent 24%),
      linear-gradient(180deg, #fffdf7 0%, #fff9dd 42%, #fffdf7 100%);
    position: relative;
    overflow: hidden;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .od-page::before,
  .od-page::after {
    content: "";
    position: absolute;
    border-radius: 999px;
    filter: blur(30px);
    pointer-events: none;
    opacity: 0.65;
    animation: odFloat 10s ease-in-out infinite;
  }

  .od-page::before {
    width: 320px;
    height: 320px;
    background: rgba(254,227,43,0.18);
    top: -100px;
    left: -80px;
  }

  .od-page::after {
    width: 360px;
    height: 360px;
    background: rgba(139,122,35,0.10);
    bottom: -120px;
    right: -80px;
    animation-delay: -4s;
  }

  .od-shell {
    width: min(1320px, calc(100% - 32px));
    margin: 0 auto;
    padding: 32px 0 64px;
    position: relative;
    z-index: 1;
  }

  .od-successBanner,
  .od-card,
  .od-hero {
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
  }

  .od-hero {
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.55);
    border-radius: 28px;
    padding: 28px;
    margin-bottom: 28px;
    background:
      linear-gradient(135deg, rgba(255,255,255,0.80) 0%, rgba(255,255,255,0.60) 100%),
      linear-gradient(135deg, rgba(254,227,43,0.18), rgba(255,255,255,0));
    box-shadow: ${COLORS.shadow};
    animation: odFadeUp .7s ease both;
  }

  .od-hero::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(120deg, transparent 10%, rgba(255,255,255,0.55) 28%, transparent 45%);
    transform: translateX(-120%);
    animation: odSweep 5.6s ease-in-out infinite;
    pointer-events: none;
  }

  .od-heroTop {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
    flex-wrap: wrap;
  }

  .od-breadcrumb {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: ${COLORS.accent};
    text-decoration: none;
    font-size: 13px;
    font-weight: 800;
    margin-bottom: 12px;
    transition: transform .18s ease, color .18s ease;
  }

  .od-breadcrumb:hover {
    color: ${COLORS.ink};
    transform: translateX(-2px);
  }

  .od-orderTitle {
    margin: 0;
    font-size: clamp(28px, 4vw, 40px);
    line-height: 1.05;
    font-weight: 950;
    letter-spacing: -0.03em;
  }

  .od-orderMeta {
    margin: 10px 0 0;
    color: ${COLORS.muted};
    font-size: 14px;
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
  }

  .od-metaPill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 999px;
    background: rgba(255,255,255,0.65);
    border: 1px solid ${COLORS.line};
    font-weight: 700;
    color: ${COLORS.ink};
  }

  .od-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    flex-wrap: wrap;
  }

  .od-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border-radius: 999px;
    background: var(--badge-bg);
    color: var(--badge-text);
    font-size: 12px;
    font-weight: 900;
    text-transform: capitalize;
    letter-spacing: 0.02em;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.45);
  }

  .od-badgeDot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: currentColor;
    box-shadow: 0 0 0 6px rgba(255,255,255,0.20);
  }

  .od-btn,
  .od-linkBtn {
    position: relative;
    overflow: hidden;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 0 18px;
    border-radius: 14px;
    font-size: 13px;
    font-weight: 900;
    text-decoration: none;
    cursor: pointer;
    transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease, color .18s ease, opacity .18s ease;
    border: 1.5px solid transparent;
  }

  .od-btn:hover,
  .od-linkBtn:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 34px rgba(32,29,24,0.14);
  }

  .od-btn:disabled {
    cursor: not-allowed;
    opacity: .6;
    transform: none;
    box-shadow: none;
  }

  .od-btnPrimary,
  .od-linkBtnPrimary {
    background: linear-gradient(180deg, ${COLORS.primary} 0%, ${COLORS.primaryDeep} 100%);
    color: ${COLORS.ink};
    border-color: rgba(32,29,24,0.12);
  }

  .od-btnGhost,
  .od-linkBtnGhost {
    background: rgba(255,255,255,0.70);
    color: ${COLORS.accent};
    border-color: rgba(139,122,35,0.22);
  }

  .od-btnDanger,
  .od-linkBtnDanger {
    background: rgba(255,255,255,0.72);
    color: ${COLORS.danger};
    border-color: rgba(220,38,38,0.22);
  }

  .od-btn::before,
  .od-linkBtn::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.55) 40%, transparent 60%);
    transform: translateX(-120%);
    transition: transform .55s ease;
  }

  .od-btn:hover::before,
  .od-linkBtn:hover::before {
    transform: translateX(120%);
  }

  .od-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.9fr) minmax(320px, 0.95fr);
    gap: 24px;
    align-items: start;
  }

  .od-main,
  .od-side {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .od-card {
    position: relative;
    overflow: hidden;
    border-radius: 24px;
    background: ${COLORS.surface};
    border: 1px solid rgba(255,255,255,0.55);
    box-shadow: ${COLORS.shadow};
    transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
    animation: odFadeUp .7s ease both;
  }

  .od-card:hover {
    transform: translateY(-4px);
    box-shadow: ${COLORS.shadowHover};
    border-color: rgba(255,255,255,0.80);
  }

  .od-cardInner {
    padding: 22px;
  }

  .od-cardGlow {
    position: absolute;
    inset: auto -30px -45px auto;
    width: 180px;
    height: 180px;
    background: radial-gradient(circle, rgba(254,227,43,0.20), transparent 62%);
    pointer-events: none;
  }

  .od-sectionTitleWrap {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 18px;
  }

  .od-sectionTitle {
    margin: 0;
    font-size: 12px;
    font-weight: 950;
    color: ${COLORS.ink};
    text-transform: uppercase;
    letter-spacing: .16em;
  }

  .od-sectionHint {
    color: ${COLORS.muted};
    font-size: 12px;
    font-weight: 700;
  }

  .od-sellerHeader {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    padding-bottom: 16px;
    margin-bottom: 18px;
    border-bottom: 1px solid ${COLORS.line};
  }

  .od-sellerName {
    margin: 0 0 5px;
    font-size: 18px;
    font-weight: 900;
    letter-spacing: -0.02em;
  }

  .od-sellerSub {
    margin: 0;
    color: ${COLORS.muted};
    font-size: 13px;
    font-weight: 700;
  }

  .od-subOrderMeta {
    display: inline-flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 10px;
  }

  .od-miniPill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 34px;
    padding: 0 12px;
    border-radius: 999px;
    background: rgba(255,255,255,0.70);
    border: 1px solid ${COLORS.line};
    color: ${COLORS.ink};
    font-size: 12px;
    font-weight: 800;
  }

  .od-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .od-itemRow {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 16px;
    align-items: center;
    padding: 16px;
    border-radius: 18px;
    border: 1px solid ${COLORS.line};
    background:
      linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.52) 100%);
    transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
  }

  .od-itemRow:hover {
    transform: translateY(-2px);
    border-color: rgba(32,29,24,0.16);
    box-shadow: 0 14px 28px rgba(32,29,24,0.08);
  }

  .od-itemLeft {
    min-width: 0;
  }

  .od-itemTitle {
    margin: 0 0 7px;
    font-size: 15px;
    font-weight: 850;
    color: ${COLORS.ink};
  }

  .od-itemMeta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .od-itemMetaText {
    color: ${COLORS.muted};
    font-size: 12px;
    font-weight: 700;
  }

  .od-itemPriceWrap {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .od-price {
    font-size: 16px;
    font-weight: 950;
    color: ${COLORS.ink};
    letter-spacing: -0.02em;
  }

  .od-campaignText {
    font-size: 11px;
    color: ${COLORS.success};
    font-weight: 800;
  }

  .od-divider {
    height: 1px;
    background: ${COLORS.line};
    margin: 18px 0 14px;
  }

  .od-totalRow {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    font-size: 13px;
  }

  .od-totalLabel {
    color: ${COLORS.muted};
    font-weight: 700;
  }

  .od-totalValue {
    color: ${COLORS.ink};
    font-weight: 950;
    font-size: 16px;
  }

  .od-shipment {
    margin-top: 16px;
    padding: 16px;
    border-radius: 20px;
    background:
      linear-gradient(180deg, rgba(255,255,255,0.66) 0%, rgba(255,255,255,0.48) 100%);
    border: 1px solid ${COLORS.line};
  }

  .od-shipmentTop {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    flex-wrap: wrap;
    margin-bottom: 14px;
  }

  .od-shipmentTitle {
    margin: 0;
    font-size: 12px;
    font-weight: 950;
    letter-spacing: .16em;
    text-transform: uppercase;
    color: ${COLORS.accent};
  }

  .od-shipmentMeta {
    display: grid;
    grid-template-columns: repeat(2, minmax(0,1fr));
    gap: 10px 12px;
    margin-top: 14px;
  }

  .od-shipBox {
    padding: 12px 14px;
    border-radius: 16px;
    background: rgba(255,255,255,0.72);
    border: 1px solid ${COLORS.line};
  }

  .od-shipLabel {
    margin: 0 0 4px;
    color: ${COLORS.muted};
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .08em;
  }

  .od-shipValue {
    margin: 0;
    color: ${COLORS.ink};
    font-size: 13px;
    font-weight: 900;
    word-break: break-word;
  }

  .od-track {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .od-trackStep {
    position: relative;
    padding-top: 2px;
  }

  .od-trackStep:not(:last-child)::after {
    content: "";
    position: absolute;
    top: 13px;
    left: calc(50% + 12px);
    width: calc(100% - 24px);
    height: 2px;
    background: rgba(30,27,22,0.08);
  }

  .od-trackStep.isDone:not(:last-child)::after {
    background: linear-gradient(90deg, ${COLORS.success}, #4ade80);
  }

  .od-trackCircle {
    width: 26px;
    height: 26px;
    border-radius: 999px;
    margin: 0 auto 8px;
    border: 2px solid rgba(30,27,22,0.12);
    background: rgba(255,255,255,0.90);
    transition: all .22s ease;
  }

  .od-trackStep.isDone .od-trackCircle,
  .od-trackStep.isCurrent .od-trackCircle {
    background: linear-gradient(180deg, ${COLORS.primary}, ${COLORS.primaryDeep});
    border-color: rgba(30,27,22,0.12);
    box-shadow: 0 0 0 7px rgba(254,227,43,0.16);
  }

  .od-trackStep.isDone .od-trackCircle {
    background: linear-gradient(180deg, #4ade80, ${COLORS.success});
  }

  .od-trackText {
    text-align: center;
  }

  .od-trackLabel {
    display: block;
    font-size: 12px;
    font-weight: 850;
    color: ${COLORS.ink};
  }

  .od-trackSub {
    display: block;
    margin-top: 2px;
    font-size: 11px;
    font-weight: 700;
    color: ${COLORS.muted};
  }

  .od-infoStack {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .od-infoRow {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
  }

  .od-infoLabel {
    color: ${COLORS.muted};
    font-size: 13px;
    font-weight: 700;
  }

  .od-infoValue {
    color: ${COLORS.ink};
    font-size: 13px;
    font-weight: 850;
    text-align: right;
  }

  .od-summarySplit {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid ${COLORS.line};
  }

  .od-moneyRow {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 10px;
    font-size: 13px;
  }

  .od-moneyRow:last-child {
    margin-bottom: 0;
  }

  .od-moneyLabel {
    color: ${COLORS.muted};
    font-weight: 700;
  }

  .od-moneyValue {
    color: ${COLORS.ink};
    font-weight: 900;
    text-align: right;
  }

  .od-moneyValue.isGreen {
    color: ${COLORS.success};
  }

  .od-grandTotal {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px dashed rgba(30,27,22,0.12);
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: center;
  }

  .od-grandTotalLabel {
    font-size: 14px;
    font-weight: 900;
    color: ${COLORS.ink};
  }

  .od-grandTotalValue {
    font-size: 22px;
    font-weight: 950;
    color: ${COLORS.ink};
    letter-spacing: -0.03em;
  }

  .od-couponBox {
    margin-top: 14px;
    padding: 12px 14px;
    border-radius: 16px;
    background: rgba(22,163,74,0.08);
    border: 1px solid rgba(22,163,74,0.12);
    color: ${COLORS.success};
    font-size: 12px;
    font-weight: 800;
  }

  .od-addressTitle {
    margin: 0 0 6px;
    font-size: 18px;
    font-weight: 900;
    letter-spacing: -0.02em;
  }

  .od-addressText {
    margin: 0;
    font-size: 13px;
    line-height: 1.7;
    color: ${COLORS.muted};
    font-weight: 600;
  }

  .od-sticky {
    position: sticky;
    top: 24px;
  }

  .od-successBanner {
    position: relative;
    overflow: hidden;
    margin-bottom: 22px;
    border-radius: 22px;
    border: 1px solid rgba(22,163,74,0.20);
    background: linear-gradient(135deg, rgba(220,252,231,0.94), rgba(240,253,244,0.86));
    box-shadow: 0 16px 36px rgba(22,163,74,0.12);
    animation: odSlideDown .6s ease both;
  }

  .od-successBannerInner {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px 20px;
  }

  .od-successIcon {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    background: linear-gradient(180deg, #34d399, #16a34a);
    color: white;
    font-size: 22px;
    box-shadow: 0 12px 24px rgba(22,163,74,0.22);
    animation: odPulse 2.4s ease-in-out infinite;
  }

  .od-successTitle {
    margin: 0;
    font-size: 15px;
    font-weight: 950;
    color: #166534;
  }

  .od-successText {
    margin: 5px 0 0;
    font-size: 13px;
    font-weight: 700;
    color: #166534;
  }

  .od-errorText {
    margin-top: 10px;
    color: ${COLORS.danger};
    font-size: 13px;
    font-weight: 800;
  }

  .od-stateWrap {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 24px;
    background:
      radial-gradient(circle at top left, rgba(254,227,43,0.22), transparent 26%),
      linear-gradient(180deg, #fffdf7 0%, #fff9dd 100%);
  }

  .od-stateCard {
    width: min(460px, 100%);
    text-align: center;
  }

  .od-stateEmoji {
    font-size: 54px;
    line-height: 1;
    margin-bottom: 12px;
  }

  .od-stateTitle {
    margin: 0 0 10px;
    font-size: 22px;
    font-weight: 950;
    letter-spacing: -0.03em;
  }

  .od-stateText {
    margin: 0 0 20px;
    font-size: 14px;
    color: ${COLORS.muted};
    font-weight: 700;
    line-height: 1.6;
  }

  .od-loadingGrid {
    width: min(1080px, calc(100% - 32px));
    display: grid;
    grid-template-columns: 1.6fr .9fr;
    gap: 24px;
  }

  .od-skeletonCard {
    border-radius: 24px;
    overflow: hidden;
    background: rgba(255,255,255,0.72);
    border: 1px solid rgba(255,255,255,0.65);
    box-shadow: ${COLORS.shadow};
    padding: 22px;
  }

  .od-skeletonLine {
    position: relative;
    overflow: hidden;
    border-radius: 999px;
    height: 12px;
    background: rgba(30,27,22,0.06);
    margin-bottom: 12px;
  }

  .od-skeletonLine::after {
    content: "";
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent);
    animation: odShimmer 1.3s infinite;
  }

  .od-skeletonLine:last-child {
    margin-bottom: 0;
  }

  .od-skeletonLine.w40 { width: 40%; }
  .od-skeletonLine.w50 { width: 50%; }
  .od-skeletonLine.w60 { width: 60%; }
  .od-skeletonLine.w80 { width: 80%; }
  .od-skeletonLine.w100 { width: 100%; }
  .od-skeletonSpacer { height: 22px; }

  @keyframes odFadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes odSlideDown {
    from { opacity: 0; transform: translateY(-12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes odFloat {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(20px); }
  }

  @keyframes odSweep {
    0%, 20% { transform: translateX(-120%); }
    50%, 100% { transform: translateX(120%); }
  }

  @keyframes odPulse {
    0%, 100% { transform: scale(1); box-shadow: 0 12px 24px rgba(22,163,74,0.22); }
    50% { transform: scale(1.04); box-shadow: 0 14px 28px rgba(22,163,74,0.30); }
  }

  @keyframes odShimmer {
    100% { transform: translateX(100%); }
  }

  @media (max-width: 1100px) {
    .od-grid,
    .od-loadingGrid {
      grid-template-columns: 1fr;
    }
    .od-sticky {
      position: static;
      top: unset;
    }
  }

  @media (max-width: 768px) {
    .od-shell {
      width: min(100% - 18px, 100%);
      padding-top: 18px;
      padding-bottom: 40px;
    }

    .od-hero,
    .od-cardInner {
      padding: 18px;
    }

    .od-successBannerInner {
      padding: 16px;
    }

    .od-track {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .od-trackStep:not(:last-child)::after {
      display: none;
    }

    .od-shipmentMeta {
      grid-template-columns: 1fr;
    }

    .od-itemRow {
      grid-template-columns: 1fr;
      align-items: flex-start;
    }

    .od-itemPriceWrap {
      justify-content: flex-start;
    }

    .od-sellerHeader,
    .od-heroTop,
    .od-infoRow,
    .od-totalRow,
    .od-moneyRow,
    .od-grandTotal {
      flex-direction: column;
      align-items: flex-start;
    }

    .od-infoValue {
      text-align: left;
    }

    .od-actions {
      justify-content: flex-start;
    }
  }
`;

function Card({ children, style, className = "" }) {
  return (
    <div className={`od-card ${className}`} style={style}>
      <div className="od-cardGlow" />
      {children}
    </div>
  );
}

function SectionTitle({ children, hint }) {
  return (
    <div className="od-sectionTitleWrap">
      <h2 className="od-sectionTitle">{children}</h2>
      {hint ? <span className="od-sectionHint">{hint}</span> : null}
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || "unknown").toLowerCase();
  const style = STATUS_COLORS[normalized] || { bg: COLORS.soft, text: COLORS.accent };

  return (
    <span
      className="od-badge"
      style={{
        "--badge-bg": style.bg,
        "--badge-text": style.text,
      }}
    >
      <span className="od-badgeDot" />
      {normalized.replace(/_/g, " ")}
    </span>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="od-infoRow">
      <span className="od-infoLabel">{label}</span>
      <div className="od-infoValue">{value}</div>
    </div>
  );
}

const formatMoney = (value) => `৳${Number(value || 0).toLocaleString("en-BD")}`;

const formatDate = (value, options = {}) =>
  new Date(value).toLocaleDateString("en-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  });

const getShipmentProgress = (status) => {
  const current = String(status || "").toLowerCase();
  if (current === "delivered") return 3;
  if (current === "shipped") return 2;
  if (current === "processing" || current === "pending") return 1;
  return 0;
};

const shipmentSteps = [
  { key: "processing", label: "Processing", sub: "Order prepared" },
  { key: "shipped", label: "Shipped", sub: "On the way" },
  { key: "delivered", label: "Delivered", sub: "Completed" },
];

function ShipmentTimeline({ shipment }) {
  const progress = getShipmentProgress(shipment?.status);

  return (
    <div className="od-track">
      {shipmentSteps.map((step, index) => {
        const isDone = progress > index + 1;
        const isCurrent = progress === index + 1;

        return (
          <div
            key={step.key}
            className={`od-trackStep ${isDone ? "isDone" : ""} ${isCurrent ? "isCurrent" : ""}`}
          >
            <div className="od-trackCircle" />
            <div className="od-trackText">
              <span className="od-trackLabel">{step.label}</span>
              <span className="od-trackSub">{step.sub}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function OrderDetailsPage() {
  const { order_id } = useParams();
  const { fetchWithAuth, user } = useAuth();
  const location = useLocation();

  const [order, setOrder] = React.useState(null);
  const [sellerOrders, setSellerOrders] = React.useState([]);
  const [shipments, setShipments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [cancelling, setCancelling] = React.useState(false);

  const justPlaced = location.state?.justPlaced;

  React.useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await fetchWithAuth(`/api/orders/${order_id}`);
        setOrder(data.data.order);
        setSellerOrders(data.data.seller_orders || []);
        setShipments(data.data.shipments || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user && order_id) fetchOrder();
  }, [user, order_id]);

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    setCancelling(true);
    try {
      await fetchWithAuth(`/api/orders/${order_id}/cancel`, { method: "PATCH" });
      setOrder((prev) => ({ ...prev, order_status: "cancelled" }));
      setSellerOrders((prev) => prev.map((so) => ({ ...so, status: "cancelled" })));
    } catch (err) {
      alert(err.message);
    } finally {
      setCancelling(false);
    }
  };

  const shipmentForSeller = (sellerOrderId) =>
    shipments.find((s) => s.seller_order_id === sellerOrderId);

  const computedTotal = sellerOrders.reduce((sum, so) => {
    return (
      sum +
      (so.items || []).reduce((itemSum, item) => {
        return itemSum + Number(item.price) * Number(item.quantity);
      }, 0)
    );
  }, 0);

  const campaignAdjusted = Number(computedTotal) !== Number(order?.total_amount);

  if (loading) {
    return (
      <>
        <style>{PAGE_CSS}</style>
        <div className="od-stateWrap">
          <div className="od-loadingGrid">
            <div className="od-skeletonCard">
              <div className="od-skeletonLine w40" />
              <div className="od-skeletonLine w80" />
              <div className="od-skeletonSpacer" />
              <div className="od-skeletonLine w100" />
              <div className="od-skeletonLine w100" />
              <div className="od-skeletonLine w60" />
              <div className="od-skeletonSpacer" />
              <div className="od-skeletonLine w100" />
              <div className="od-skeletonLine w80" />
            </div>

            <div className="od-skeletonCard">
              <div className="od-skeletonLine w50" />
              <div className="od-skeletonLine w100" />
              <div className="od-skeletonLine w100" />
              <div className="od-skeletonLine w60" />
              <div className="od-skeletonSpacer" />
              <div className="od-skeletonLine w100" />
              <div className="od-skeletonLine w80" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <style>{PAGE_CSS}</style>
        <div className="od-stateWrap">
          <Card className="od-stateCard">
            <div className="od-cardInner">
              <div className="od-stateEmoji">⚠️</div>
              <h1 className="od-stateTitle">{error || "Order not found"}</h1>
              <p className="od-stateText">
                We could not load the order details right now. Please go back to your orders and try again.
              </p>
              <Link to="/orders" className="od-linkBtn od-linkBtnPrimary">
                My orders
              </Link>
            </div>
          </Card>
        </div>
      </>
    );
  }

  const deliveredItem = sellerOrders.find((so) => so.status === "delivered")?.items?.[0];

  return (
    <>
      <style>{PAGE_CSS}</style>

      <div className="od-page">
        <div className="od-shell">
          {justPlaced && (
            <div className="od-successBanner">
              <div className="od-successBannerInner">
                <div className="od-successIcon">✓</div>
                <div>
                  <p className="od-successTitle">Order placed successfully!</p>
                  <p className="od-successText">
                    We’ve received your order. You’ll be notified as soon as shipment updates are available.
                  </p>
                </div>
              </div>
            </div>
          )}

          <section className="od-hero">
            <div className="od-heroTop">
              <div>
                <Link to="/orders" className="od-breadcrumb">
                  <span>←</span>
                  <span>My orders</span>
                </Link>

                <h1 className="od-orderTitle">Order #{order.order_id}</h1>

                <div className="od-orderMeta">
                  <span className="od-metaPill">Placed on {formatDate(order.created_at)}</span>
                  <span className="od-metaPill">{sellerOrders.length} seller order(s)</span>
                  <span className="od-metaPill">Total {formatMoney(order.total_amount)}</span>
                </div>
              </div>

              <div className="od-actions">
                <StatusBadge status={order.order_status} />
                <StatusBadge status={order.payment_status} />

                {order.order_status === "pending" && (
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="od-btn od-btnDanger"
                  >
                    {cancelling ? "Cancelling..." : "Cancel order"}
                  </button>
                )}

                {sellerOrders.some((so) => so.status === "delivered") && deliveredItem?.order_item_id && (
                  <Link
                    to={`/returns/${deliveredItem.order_item_id}`}
                    className="od-linkBtn od-linkBtnDanger"
                  >
                    Return items
                  </Link>
                )}
              </div>
            </div>
          </section>

          <div className="od-grid">
            <div className="od-main">
              {sellerOrders.map((so, index) => {
                const shipment = shipmentForSeller(so.seller_order_id);

                return (
                  <Card
                    key={so.seller_order_id}
                    style={{ animationDelay: `${index * 90}ms` }}
                  >
                    <div className="od-cardInner">
                      <div className="od-sellerHeader">
                        <div>
                          <p className="od-sellerName">
                            {so.business_name || `Seller #${so.seller_id}`}
                          </p>
                          <p className="od-sellerSub">Sub-order #{so.seller_order_id}</p>

                          <div className="od-subOrderMeta">
                            <span className="od-miniPill">
                              {(so.items || []).length} item(s)
                            </span>
                            <span className="od-miniPill">
                              Subtotal {formatMoney(so.subtotal)}
                            </span>
                          </div>
                        </div>

                        <StatusBadge status={so.status} />
                      </div>

                      <div className="od-items">
                        {(so.items || []).map((item) => (
                          <div key={item.order_item_id} className="od-itemRow">
                            <div className="od-itemLeft">
                              <p className="od-itemTitle">Variant #{item.variant_id}</p>

                              <div className="od-itemMeta">
                                <span className="od-miniPill">Qty {item.quantity}</span>
                                <span className="od-miniPill">
                                  Unit {formatMoney(item.price)}
                                </span>
                                <span className="od-itemMetaText">
                                  {(Number(item.price) * Number(item.quantity)).toLocaleString("en-BD")} total
                                </span>
                              </div>
                            </div>

                            <div className="od-itemPriceWrap">
                              <span className="od-price">
                                {formatMoney(Number(item.price) * Number(item.quantity))}
                              </span>

                              {item.original_price &&
                              Number(item.original_price) !== Number(item.price) ? (
                                <span className="od-campaignText">
                                  Campaign price {formatMoney(item.price)}
                                </span>
                              ) : null}

                              {so.status === "delivered" && (
                                <Link
                                  to={`/returns/${item.order_item_id}`}
                                  className="od-linkBtn od-linkBtnDanger"
                                  style={{ minHeight: 36, padding: "0 14px", fontSize: 12 }}
                                >
                                  Return
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="od-divider" />

                      <div className="od-totalRow">
                        <span className="od-totalLabel">Subtotal</span>
                        <span className="od-totalValue">{formatMoney(so.subtotal)}</span>
                      </div>

                      {shipment && (
                        <div className="od-shipment">
                          <div className="od-shipmentTop">
                            <div>
                              <p className="od-shipmentTitle">Shipment tracking</p>
                            </div>
                            <StatusBadge status={shipment.status} />
                          </div>

                          <ShipmentTimeline shipment={shipment} />

                          <div className="od-shipmentMeta">
                            <div className="od-shipBox">
                              <p className="od-shipLabel">Courier</p>
                              <p className="od-shipValue">{shipment.courier_name || "Courier"}</p>
                            </div>

                            {shipment.tracking_number ? (
                              <div className="od-shipBox">
                                <p className="od-shipLabel">Tracking number</p>
                                <p className="od-shipValue">{shipment.tracking_number}</p>
                              </div>
                            ) : null}

                            {shipment.courier_contact ? (
                              <div className="od-shipBox">
                                <p className="od-shipLabel">Contact</p>
                                <p className="od-shipValue">{shipment.courier_contact}</p>
                              </div>
                            ) : null}

                            {shipment.shipped_at ? (
                              <div className="od-shipBox">
                                <p className="od-shipLabel">Shipped on</p>
                                <p className="od-shipValue">
                                  {formatDate(shipment.shipped_at, {
                                    month: "short",
                                  })}
                                </p>
                              </div>
                            ) : null}

                            {shipment.delivered_at ? (
                              <div className="od-shipBox">
                                <p className="od-shipLabel">Delivered on</p>
                                <p className="od-shipValue">
                                  {formatDate(shipment.delivered_at, {
                                    month: "short",
                                  })}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="od-side">
              <div className="od-sticky">
                <Card>
                  <div className="od-cardInner">
                    <SectionTitle hint="Live status">Order summary</SectionTitle>

                    <div className="od-infoStack">
                      <InfoRow label="Order ID" value={`#${order.order_id}`} />
                      <InfoRow
                        label="Date"
                        value={formatDate(order.created_at, {
                          month: "short",
                        })}
                      />
                      <InfoRow
                        label="Order status"
                        value={<StatusBadge status={order.order_status} />}
                      />
                      <InfoRow
                        label="Payment status"
                        value={<StatusBadge status={order.payment_status} />}
                      />
                    </div>

                    {order.coupon_code && (
                      <div className="od-couponBox">
                        Coupon applied: {order.coupon_code} (
                        -{formatMoney(order.coupon_amount || 0)})
                      </div>
                    )}

                    <div className="od-summarySplit">
                      <div className="od-moneyRow">
                        <span className="od-moneyLabel">Subtotal</span>
                        <span className="od-moneyValue">
                          {campaignAdjusted
                            ? `${formatMoney(computedTotal)} (campaign price)`
                            : formatMoney(order.total_amount)}
                        </span>
                      </div>

                      <div className="od-moneyRow">
                        <span className="od-moneyLabel">Shipping</span>
                        <span className="od-moneyValue isGreen">
                          {formatMoney(order.shipping_fee || 0)}
                        </span>
                      </div>

                      {order.coupon_code && (
                        <div className="od-moneyRow">
                          <span className="od-moneyLabel">
                            Coupon savings ({order.coupon_code})
                          </span>
                          <span className="od-moneyValue isGreen">
                            -{formatMoney(order.coupon_amount || 0)}
                          </span>
                        </div>
                      )}

                      <div className="od-grandTotal">
                        <span className="od-grandTotalLabel">Final total</span>
                        <span className="od-grandTotalValue">
                          {formatMoney(order.total_amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>

                {(order.city || order.area || order.address_details) && (
                  <Card style={{ marginTop: 20 }}>
                    <div className="od-cardInner">
                      <SectionTitle>Delivery address</SectionTitle>

                      <h3 className="od-addressTitle">
                        {[order.city, order.area].filter(Boolean).join(", ")}
                      </h3>

                      {order.address_details && (
                        <p className="od-addressText">{order.address_details}</p>
                      )}
                    </div>
                  </Card>
                )}

                <Card style={{ marginTop: 20 }}>
                  <div className="od-cardInner">
                    <SectionTitle>Actions</SectionTitle>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <Link to="/orders" className="od-linkBtn od-linkBtnPrimary">
                        My orders
                      </Link>

                      <Link to="/" className="od-linkBtn od-linkBtnGhost">
                        Continue shopping
                      </Link>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}