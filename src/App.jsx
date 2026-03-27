import { useEffect, useState, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./frontend/components/Layout";
import Home from "./frontend/Home.jsx";
import Shop from "./frontend/Shop/ShopHome.jsx";
import Events from "./frontend/Event/EventPage.jsx";
import Login from "./frontend/Login.jsx";
import Register from "./frontend/Regist.jsx";
import EventDetails from "./frontend/Event/Eventdetails.jsx";
import EventReview from "./frontend/Event/EventReview.jsx";
import ShopProfile from "./frontend/Shop/ShopProfile.jsx";
import ShopChatPage from "./frontend/Shop/ShopChatPage.jsx";
import ProductDetail from "./frontend/Shop/ProductDetail.jsx";
import CheckoutPage from "./frontend/Shop/CheckoutPage.jsx";
import CheckoutAddressPage from "./frontend/Shop/CheckoutAddressPage.jsx";
import CheckoutAddressFormPage from "./frontend/Shop/CheckoutAddressFormPage.jsx";
import OrderSuccessPage from "./frontend/Shop/OrderSuccessPage.jsx";
import AdminRoute from "./frontend/admin/AdminRoute.jsx";
import AdminDashboard from "./frontend/admin/AdminDashboard.jsx";
import AdminInboxPage from "./frontend/admin/AdminInboxPage.jsx";
import AdminProductsPage from "./frontend/admin/AdminProductsPage.jsx";
import AdminEventsPage from "./frontend/admin/AdminEventsPage.jsx";
import AdminOrdersPage from "./frontend/admin/AdminOrdersPage.jsx";

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
    localStorage.setItem("token", newToken);
    setToken(newToken);
    closeAll();
  };

  const handleLogout = () => {
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
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/:id" element={<ShopProfile />} />
            <Route path="/shop/:id/chat" element={<ShopChatPage />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetails />} />
            <Route path="/review/:id" element={<EventReview />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/checkout/address" element={<CheckoutAddressPage />} />
            <Route path="/checkout/address/new" element={<CheckoutAddressFormPage />} />
            <Route path="/checkout/success/:orderId" element={<OrderSuccessPage />} />
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
            <Route path="inbox" element={<AdminInboxPage />} />
            <Route path="approvals" element={<Navigate to="/admin/inbox" replace />} />
            <Route path="reports" element={<Navigate to="/admin/inbox" replace />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="events" element={<AdminEventsPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

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

export default App;
