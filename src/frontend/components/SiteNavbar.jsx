import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthModal } from "../../App";
import { apiUrl, assetUrl } from "../../lib/api";
import {
  getStoredAvatar,
  getTokenPayload,
  getUserIdFromToken,
  getUserRoleFromToken,
} from "../Shop/authClient";

function Toast({ message, type = "success", onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        top: 28,
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? 0 : -20}px)`,
        opacity: visible ? 1 : 0,
        transition: "all 0.3s ease",
        background: type === "success" ? "#485B3B" : "#c0392b",
        color: "#fff",
        padding: "14px 28px",
        borderRadius: 50,
        fontSize: 14,
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 500,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 10,
        whiteSpace: "nowrap",
      }}
    >
      <span>{type === "success" ? "OK" : "X"}</span>
      {message}
    </div>
  );
}

function itemClass(isActive) {
  if (isActive) return "rounded-full px-4 py-2 transition-all bg-[#485B3B]/12 text-[#485B3B] font-bold";
  return "rounded-full px-4 py-2 transition-all hover:bg-[#485B3B]/12 hover:text-[#485B3B]";
}

export default function SiteNavbar({ active, showCart = false, cartCount = 0, onCartClick }) {
  const { openLogin, openRegister, token, handleLogout } = useAuthModal();
  const navigate = useNavigate();
  const userRole = token ? getUserRoleFromToken() : null;
  const userId = token ? getUserIdFromToken() : null;
  const [toast, setToast] = useState(null);
  const [ownedShopId, setOwnedShopId] = useState(null);
  const [shopAvatar, setShopAvatar] = useState("");

  useEffect(() => {
    let ignore = false;

    if (userRole !== "shop" || !userId) {
      setOwnedShopId(null);
      setShopAvatar("");
      return () => {
        ignore = true;
      };
    }

    fetch(apiUrl("/shops"))
      .then((response) => (response.ok ? response.json() : []))
      .then((rows) => {
        if (ignore) return;
        const ownedShop = (Array.isArray(rows) ? rows : []).find((item) => Number(item.user_id) === Number(userId));
        setOwnedShopId(ownedShop?.shop_id || null);
      })
      .catch(() => {
        if (!ignore) setOwnedShopId(null);
      });

    return () => {
      ignore = true;
    };
  }, [userId, userRole]);

  useEffect(() => {
    let ignore = false;

    if (userRole !== "shop" || !ownedShopId) {
      setShopAvatar("");
      return () => {
        ignore = true;
      };
    }

    fetch(apiUrl(`/shop-images/shop/${ownedShopId}`))
      .then((response) => (response.ok ? response.json() : []))
      .then((rows) => {
        if (ignore) return;
        const firstImage = (Array.isArray(rows) ? rows : []).find((item) => item?.image_path);
        setShopAvatar(firstImage?.image_path ? assetUrl(firstImage.image_path) : "");
      })
      .catch(() => {
        if (!ignore) setShopAvatar("");
      });

    return () => {
      ignore = true;
    };
  }, [ownedShopId, userRole]);

  const onLogout = () => {
    handleLogout();
    setToast({ message: "Logged out successfully", type: "success" });
    setTimeout(() => navigate("/"), 1200);
  };

  const profileLink = userRole === "shop" && ownedShopId ? `/shop/${ownedShopId}` : "/profile";
  const navbarAvatar =
    userRole === "shop"
      ? shopAvatar || "/Pictrue/default-avatar.png"
      : getStoredAvatar() || getTokenPayload()?.avatar || "/Pictrue/default-avatar.png";

  return (
    <>
      {toast ? <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} /> : null}

      <nav className="fixed top-0 z-50 flex w-full items-center justify-between bg-[#AEBC9F] px-8 py-2 shadow-sm">
        <div className="flex h-16 w-32 items-center justify-start md:w-40">
          <img src="/Pictrue/Logo.png" alt="ATC Logo" className="h-full w-auto object-contain drop-shadow-sm" />
        </div>

        <div className="flex items-center gap-6 pr-4 text-[17px] font-medium text-[#4a4a4a] md:gap-12">
          <Link to="/" className={itemClass(active === "home")}>Home</Link>
          <Link to="/shop" className={itemClass(active === "shop")}>Shop</Link>
          <Link to="/events" className={itemClass(active === "events")}>Event</Link>
          {userRole === "shop" ? <Link to="/seller" className={itemClass(active === "seller")}>Seller Hub</Link> : null}

          <div className="h-8 w-px bg-black/20" />

          {showCart ? (
            <button onClick={onCartClick} className="relative rounded-full px-4 py-2 transition-all hover:bg-[#485B3B]/12 hover:text-[#485B3B]">
              Cart
              {cartCount > 0 ? (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#485B3B] text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              ) : null}
            </button>
          ) : null}

          {token ? (
            <>
              <Link to={profileLink} className="flex items-center gap-3 rounded-full px-4 py-2 transition-all hover:bg-[#485B3B]/12 hover:text-[#485B3B]">
                <img
                  src={navbarAvatar}
                  alt="avatar"
                  className="h-8 w-8 rounded-full object-cover"
                />
                <span className="hidden text-[17px] font-medium text-[#4a4a4a] md:inline">
                  {getTokenPayload()?.name || getTokenPayload()?.username || "Profile"}
                </span>
              </Link>

              <button
                onClick={onLogout}
                className="rounded-full border-none bg-transparent px-4 py-2 text-[17px] font-medium text-[#4a4a4a] transition-all hover:bg-[#485B3B]/12 hover:text-[#485B3B]"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={openLogin} className="rounded-full border-none bg-transparent px-4 py-2 text-[17px] font-medium text-[#4a4a4a] transition-all hover:bg-[#485B3B]/12 hover:text-[#485B3B]">
                Login
              </button>
              <button onClick={openRegister} className="rounded-full border-none bg-transparent px-4 py-2 text-[17px] font-medium text-[#4a4a4a] transition-all hover:bg-[#485B3B]/12 hover:text-[#485B3B]">
                Register
              </button>
            </>
          )}
        </div>
      </nav>
      <div className="h-20" />
    </>
  );
}
