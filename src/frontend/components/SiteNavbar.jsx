import { useEffect, useRef, useState } from "react";
import InboxPopup from "./InboxPopup";
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

function ProfileDropdown({ navbarAvatar, profileLink, messages, onLogout }) {
  const [open, setOpen] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setShowInbox(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setOpen((v) => !v); setShowInbox(false); }}
        className="flex items-center rounded-full p-1 transition-all hover:ring-2 hover:ring-[#485B3B]/30 focus:outline-none"
      >
        <img
          src={navbarAvatar}
          alt="avatar"
          className="h-9 w-9 rounded-full object-cover"
        />
      </button>

      {open && !showInbox && (
        <div className="absolute right-0 z-50 mt-2 min-w-[200px] rounded-xl bg-white py-2 shadow-xl border border-[#e6e3da]">
          <button
            onClick={() => { setOpen(false); navigate(profileLink); }}
            className="flex w-full items-center gap-3 px-5 py-3 text-left text-[#485B3B] hover:bg-[#485B3B]/10 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            Profile
          </button>
          <button
            onClick={() => setShowInbox(true)}
            className="flex w-full items-center gap-3 px-5 py-3 text-left text-[#485B3B] hover:bg-[#485B3B]/10 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
            กล่องข้อความ
          </button>
          <div className="my-1 border-t border-[#e6e3da]" />
          <button
            onClick={() => { setOpen(false); onLogout(); }}
            className="flex w-full items-center gap-3 px-5 py-3 text-left text-[#c0392b] hover:bg-[#c0392b]/10 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
            Logout
          </button>
        </div>
      )}

      {open && showInbox && (
        <InboxPopup messages={messages} onClose={() => { setShowInbox(false); setOpen(false); }} />
      )}
    </div>
  );
}

export default function SiteNavbar({ active, showCart = false, cartCount = 0, onCartClick }) {
  const { openLogin, openRegister, token, handleLogout } = useAuthModal();
  const navigate = useNavigate();
  const userRole = token ? getUserRoleFromToken() : null;
  const userId = token ? getUserIdFromToken() : null;
  const [toast, setToast] = useState(null);
  const [ownedShopId, setOwnedShopId] = useState(null);
  const [shopAvatar, setShopAvatar] = useState("");
  const [messages, setMessages] = useState([]);

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
            <ProfileDropdown
              navbarAvatar={navbarAvatar}
              profileLink={profileLink}
              messages={messages}
              onLogout={onLogout}
            />
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
