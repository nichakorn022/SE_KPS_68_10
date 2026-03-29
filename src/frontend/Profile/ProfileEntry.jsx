import { useEffect, useState, lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import { apiUrl } from "../../lib/api";
import { getStoredToken, getUserIdFromToken, getUserRoleFromToken } from "../Shop/authClient";

const UserProfile = lazy(() => import("./userProfile.jsx"));

function LoadingProfile() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#f6f2e8] text-sm text-[#485b3b]">
      Loading profile...
    </div>
  );
}

export default function ProfileEntry() {
  const token = getStoredToken();
  const userRole = token ? getUserRoleFromToken() : null;
  const userId = token ? getUserIdFromToken() : null;

  const [shopState, setShopState] = useState({
    loading: userRole === "shop",
    shopId: null,
    error: "",
  });

  useEffect(() => {
    let ignore = false;

    if (!token) {
      setShopState({ loading: false, shopId: null, error: "" });
      return () => {
        ignore = true;
      };
    }

    if (userRole !== "shop" || !userId) {
      setShopState({ loading: false, shopId: null, error: "" });
      return () => {
        ignore = true;
      };
    }

    const storageKey = `ownedShopId:${userId}`;
    const cached = window.localStorage.getItem(storageKey);
    if (cached) {
      setShopState({ loading: false, shopId: cached, error: "" });
      return () => {
        ignore = true;
      };
    }

    setShopState((prev) => ({ ...prev, loading: true, error: "" }));

    fetch(apiUrl("/shops"))
      .then((response) => (response.ok ? response.json() : []))
      .then((rows) => {
        if (ignore) return;
        const ownedShop = (Array.isArray(rows) ? rows : []).find(
          (item) => Number(item?.user_id) === Number(userId)
        );
        const shopId = ownedShop?.shop_id ? String(ownedShop.shop_id) : null;
        if (shopId) {
          window.localStorage.setItem(storageKey, shopId);
        }
        setShopState({ loading: false, shopId, error: shopId ? "" : "Shop profile not found" });
      })
      .catch(() => {
        if (ignore) return;
        setShopState({ loading: false, shopId: null, error: "Failed to load shop profile" });
      });

    return () => {
      ignore = true;
    };
  }, [token, userId, userRole]);

  if (!token) return <Navigate to="/" replace />;

  if (userRole === "shop") {
    if (shopState.loading) return <LoadingProfile />;
    if (shopState.shopId) return <Navigate to={`/shop/${shopState.shopId}`} replace />;
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#f6f2e8] text-sm text-[#c0392b]">
        {shopState.error || "Shop profile not found"}
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingProfile />}>
      <UserProfile />
    </Suspense>
  );
}

