import { Suspense, lazy, useEffect, useState, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./frontend/Login.jsx";
import Register from "./frontend/Regist.jsx";

const Layout = lazy(() => import("./frontend/components/Layout"));
const Home = lazy(() => import("./frontend/Home.jsx"));
const Shop = lazy(() => import("./frontend/Shop/ShopHome.jsx"));
const Events = lazy(() => import("./frontend/Event/EventPage.jsx"));
const EventDetails = lazy(() => import("./frontend/Event/Eventdetails.jsx"));
const EventReview = lazy(() => import("./frontend/Event/EventReview.jsx"));
const MySponsorPage = lazy(() => import("./frontend/Event/MySponsorPage.jsx"));
const BecomeOrganizer = lazy(() => import("./frontend/Event/BecomeOrganizer.jsx"));
const MyEventsPage = lazy(() => import("./frontend/Event/MyEventsPage.jsx"));
const CreateEventPage = lazy(() => import("./frontend/Event/CreateEventPage.jsx"));
const EditEventPage = lazy(() => import("./frontend/Event/EditEventPage.jsx"));
const SponsorRequestsPage = lazy(() => import("./frontend/Event/SponsorRequestsPage.jsx"));
const OrganizerSponsorRequestsPage = lazy(() =>
  import("./frontend/Event/OrganizerSponsorRequestsPage.jsx")
);
const ShopsPage = lazy(() => import("./frontend/Event/ShopsPage.jsx"));
const ShopProfile = lazy(() => import("./frontend/Shop/ShopProfile.jsx"));
const ShopChatPage = lazy(() => import("./frontend/Shop/ShopChatPage.jsx"));
const SellerDashboard = lazy(() => import("./frontend/Shop/SellerDashboard.jsx"));
const SellerPendingOrdersPage = lazy(() => import("./frontend/Shop/SellerPendingOrdersPage.jsx"));
const SellerAnalyticsDashboard = lazy(() => import("./frontend/Shop/SellerAnalyticsDashboard.jsx"));
const SellerProductsPage = lazy(() => import("./frontend/Shop/SellerProductsPage.jsx"));
const SellerFeedbackPage = lazy(() => import("./frontend/Shop/SellerFeedbackPage.jsx"));
const ProductDetail = lazy(() => import("./frontend/Shop/ProductDetail.jsx"));
const CheckoutPage = lazy(() => import("./frontend/Shop/CheckoutPage.jsx"));
const CheckoutAddressPage = lazy(() => import("./frontend/Shop/CheckoutAddressPage.jsx"));
const CheckoutAddressFormPage = lazy(() => import("./frontend/Shop/CheckoutAddressFormPage.jsx"));
const OrderSuccessPage = lazy(() => import("./frontend/Shop/OrderSuccessPage.jsx"));
const UserProfile = lazy(() => import("./frontend/Profile/userProfile.jsx"));
const AdminRoute = lazy(() => import("./frontend/admin/AdminRoute.jsx"));
const AdminDashboard = lazy(() => import("./frontend/admin/pages/AdminDashboard.jsx"));
const AdminInboxPage = lazy(() => import("./frontend/admin/pages/AdminInboxPage.jsx"));
const AdminShopsPage = lazy(() => import("./frontend/admin/pages/AdminShopsPage.jsx"));
const AdminEventsPage = lazy(() => import("./frontend/admin/pages/AdminEventsPage.jsx"));
const AdminOrdersPage = lazy(() => import("./frontend/admin/pages/AdminOrdersPage.jsx"));
const AdminUsersPage = lazy(() => import("./frontend/admin/pages/AdminUsersPage.jsx"));
const AdminCommentsPage = lazy(() => import("./frontend/admin/pages/AdminCommentsPage.jsx"));

export const AuthModalContext = createContext(null);
export const useAuthModal = () => useContext(AuthModalContext);

function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [adminToken, setAdminToken] = useState(localStorage.getItem("admin_token"));

  const openLogin = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  const openRegister = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  const closeAll = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(false);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("adminLogin") === "1" && !adminToken) {
      openLogin();
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [adminToken]);

  const handleLoginSuccess = (newToken) => {
    localStorage.removeItem("avatar");
    localStorage.setItem("token", newToken);
    setToken(newToken);
    closeAll();
  };

  const handleLogout = () => {
    localStorage.removeItem("avatar");
    localStorage.removeItem("token");
    setToken(null);
  };

  const handleAdminLoginSuccess = (newToken) => {
    localStorage.setItem("admin_token", newToken);
    setAdminToken(newToken);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("admin_token");
    setAdminToken(null);
  };

  return (
    <AuthModalContext.Provider
      value={{
        openLogin,
        openRegister,
        token,
        handleLogout,
        adminToken,
        handleAdminLoginSuccess,
        handleAdminLogout,
      }}
    >
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/shop/:id" element={<ShopProfile />} />
              <Route path="/shop/:id/chat" element={<ShopChatPage />} />
              <Route path="/seller" element={<SellerDashboard />} />
              <Route path="/seller/orders" element={<SellerPendingOrdersPage />} />
              <Route path="/seller/dashboard" element={<SellerAnalyticsDashboard />} />
              <Route path="/seller/products" element={<SellerProductsPage />} />
              <Route path="/seller/feedback" element={<SellerFeedbackPage />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetails />} />
              <Route path="/review/:id" element={<EventReview />} />
              <Route path="/my-sponsor" element={<MySponsorPage />} />
              <Route path="/become-organizer" element={<BecomeOrganizer />} />
              <Route path="/my-events" element={<MyEventsPage />} />
              <Route path="/create-event" element={<CreateEventPage />} />
              <Route path="/edit-event/:id" element={<EditEventPage />} />
              <Route path="/sponsor-requests" element={<SponsorRequestsPage />} />
              <Route path="/organizer-sponsor-requests" element={<OrganizerSponsorRequestsPage />} />
              <Route path="/shops" element={<ShopsPage />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/checkout/address" element={<CheckoutAddressPage />} />
              <Route path="/checkout/address/new" element={<CheckoutAddressFormPage />} />
              <Route path="/checkout/success/:orderId" element={<OrderSuccessPage />} />
              <Route path="/profile" element={<UserProfile />} />
            </Route>

            <Route
              path="/admin/login"
              element={
                adminToken ? <Navigate to="/admin" replace /> : <Navigate to="/?adminLogin=1" replace />
              }
            />

            <Route
              path="/admin"
              element={<AdminRoute adminToken={adminToken} onLogout={handleAdminLogout} openLogin={openLogin} />}
            >
              <Route index element={<AdminDashboard />} />
              <Route path="approvals" element={<AdminInboxPage />} />
              <Route path="requests-reports" element={<AdminInboxPage />} />
              <Route path="shops" element={<AdminShopsPage />} />
              <Route path="events" element={<AdminEventsPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="comments" element={<AdminCommentsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>

        <Login
          isOpen={isLoginOpen}
          onClose={closeAll}
          onLoginSuccess={handleLoginSuccess}
          onAdminLoginSuccess={handleAdminLoginSuccess}
        />
        <Register isOpen={isRegisterOpen} onClose={closeAll} />
      </BrowserRouter>
    </AuthModalContext.Provider>
  );
}

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f2e8] text-sm text-[#485b3b]">
      Loading...
    </div>
  );
}

export default App;
