import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import AppLayout from "../layouts/AppLayout.jsx";
import AuthLayout from "../layouts/AuthLayout.jsx";
import AccountLayout from "../layouts/AccountLayout.jsx";
import SellerLayout from "../layouts/SellerLayout.jsx";
import AdminLayout from "../layouts/AdminLayout.jsx";

import { RequireAuth, RequireRole } from "./guards.jsx";

// Public pages
import HomePage from "../../features/home/pages/HomePage.jsx";
import SearchResultsPage from "../../features/catalog/pages/SearchResultsPage.jsx";
import CategoryPage from "../../features/catalog/pages/CategoryPage.jsx";
import StorePage from "../../features/catalog/pages/StorePage.jsx";
import ProductDetailsPage from "../../features/catalog/pages/ProductDetailsPage.jsx";

// Auth pages
import LoginPage from "../../features/auth/pages/LoginPage.jsx";
import RegisterPage from "../../features/auth/pages/RegisterPage.jsx";
import ForgotPasswordPage from "../../features/auth/pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "../../features/auth/pages/ResetPasswordPage.jsx";

// Customer flow
import CartPage from "../../features/cart/pages/CartPage.jsx";
import CheckoutPage from "../../features/cart/pages/CheckoutPage.jsx";

import OrdersListPage from "../../features/orders/pages/OrdersListPage.jsx";
import OrderDetailsPage from "../../features/orders/pages/OrderDetailsPage.jsx";
import TrackOrderPage from "../../features/orders/pages/TrackOrderPage.jsx";
import ReturnRequestPage from "../../features/orders/pages/ReturnRequestPage.jsx";

// Account
import ProfilePage from "../../features/account/pages/ProfilePage.jsx";
import AddressesPage from "../../features/account/pages/AddressesPage.jsx";
import WishlistsPage from "../../features/account/pages/WishlistsPage.jsx";
import NotificationsPage from "../../features/account/pages/NotificationsPage.jsx";
import ConversationsPage from "../../features/account/pages/ConversationsPage.jsx";
import ConversationThreadPage from "../../features/account/pages/ConversationThreadPage.jsx";

// Seller
import SellerDashboardPage from "../../features/seller/pages/SellerDashboardPage.jsx";
import SellerStoreSettingsPage from "../../features/seller/pages/SellerStoreSettingsPage.jsx";
import SellerProductsPage from "../../features/seller/pages/SellerProductsPage.jsx";
import SellerProductCreatePage from "../../features/seller/pages/SellerProductCreatePage.jsx";
import SellerProductEditPage from "../../features/seller/pages/SellerProductEditPage.jsx";
import SellerInventoryPage from "../../features/seller/pages/SellerInventoryPage.jsx";
import SellerOrdersPage from "../../features/seller/pages/SellerOrdersPage.jsx";
import SellerOrderDetailsPage from "../../features/seller/pages/SellerOrderDetailsPage.jsx";
import SellerShipmentsPage from "../../features/seller/pages/SellerShipmentsPage.jsx";
import SellerPayoutsPage from "../../features/seller/pages/SellerPayoutsPage.jsx";
import SellerQnAPage from "../../features/seller/pages/SellerQnAPage.jsx";
import SellerViolationsPage from "../../features/seller/pages/SellerViolationsPage.jsx";

// Admin
import AdminDashboardPage from "../../features/admin/pages/AdminDashboardPage.jsx";
import AdminUsersPage from "../../features/admin/pages/AdminUsersPage.jsx";
import AdminReportsPage from "../../features/admin/pages/AdminReportsPage.jsx";
import AdminCampaignsPage from "../../features/admin/pages/AdminCampaignsPage.jsx";
import AdminCommissionsPage from "../../features/admin/pages/AdminCommissionsPage.jsx";
import AdminAuditLogsPage from "../../features/admin/pages/AdminAuditLogsPage.jsx";
import AdminDashboardBuilderPage from "../../features/admin/pages/AdminDashboardBuilderPage.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      // Public
      { index: true, element: <HomePage /> },
      { path: "search", element: <SearchResultsPage /> },
      { path: "c/:slug", element: <CategoryPage /> },
      { path: "s/:store_slug", element: <StorePage /> },
      { path: "p/:product_id", element: <ProductDetailsPage /> },

      // Auth required (customer)
      {
        element: <RequireAuth />,
        children: [
          { path: "cart", element: <CartPage /> },
          { path: "checkout", element: <CheckoutPage /> },

          { path: "orders", element: <OrdersListPage /> },
          { path: "orders/:order_id", element: <OrderDetailsPage /> },
          { path: "orders/:order_id/track", element: <TrackOrderPage /> },
          { path: "returns/:order_item_id", element: <ReturnRequestPage /> },

          {
            path: "account",
            element: <AccountLayout />,
            children: [
              { index: true, element: <Navigate to="profile" replace /> },
              { path: "profile", element: <ProfilePage /> },
              { path: "addresses", element: <AddressesPage /> },
              { path: "wishlists", element: <WishlistsPage /> },
              { path: "notifications", element: <NotificationsPage /> },
              { path: "conversations", element: <ConversationsPage /> },
              {
                path: "conversations/:conversation_id",
                element: <ConversationThreadPage />,
              },
            ],
          },
        ],
      },
    ],
  },

  // Auth screens
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      { index: true, element: <Navigate to="login" replace /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },
    ],
  },

  // Seller (sellerOnly)
  {
    path: "/seller",
    element: (
      <RequireAuth>
        <RequireRole allowed={["seller"]}>
          <SellerLayout />
        </RequireRole>
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <SellerDashboardPage /> },
      { path: "store", element: <SellerStoreSettingsPage /> },
      { path: "products", element: <SellerProductsPage /> },
      { path: "products/new", element: <SellerProductCreatePage /> },
      { path: "products/:product_id", element: <SellerProductEditPage /> },
      { path: "inventory", element: <SellerInventoryPage /> },
      { path: "orders", element: <SellerOrdersPage /> },
      { path: "orders/:seller_order_id", element: <SellerOrderDetailsPage /> },
      { path: "shipments", element: <SellerShipmentsPage /> },
      { path: "payouts", element: <SellerPayoutsPage /> },
      { path: "qna", element: <SellerQnAPage /> },
      { path: "violations", element: <SellerViolationsPage /> },
    ],
  },

  // Admin (adminOnly)
  {
    path: "/admin",
    element: (
      <RequireAuth>
        <RequireRole allowed={["admin"]}>
          <AdminLayout />
        </RequireRole>
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <AdminDashboardPage /> },
      { path: "users", element: <AdminUsersPage /> },
      { path: "reports", element: <AdminReportsPage /> },
      { path: "campaigns", element: <AdminCampaignsPage /> },
      { path: "commissions", element: <AdminCommissionsPage /> },
      { path: "audit-logs", element: <AdminAuditLogsPage /> },
      { path: "dashboard-builder", element: <AdminDashboardBuilderPage /> },
    ],
  },

  // Fallback
  { path: "*", element: <Navigate to="/" replace /> },
]);

export default router;
