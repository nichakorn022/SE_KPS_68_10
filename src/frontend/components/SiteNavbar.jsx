import { Link, useNavigate } from "react-router-dom";
import { useAuthModal } from "../../App";

function itemClass(isActive) {
  if (isActive) return "rounded-full px-4 py-2 transition-all bg-[#485B3B]/12 text-[#485B3B] font-bold";
  return "rounded-full px-4 py-2 transition-all hover:bg-[#485B3B]/12 hover:text-[#485B3B]";
}

export default function SiteNavbar({ active, showCart = false, cartCount = 0, onCartClick }) {
  const { openLogin, openRegister, token, handleLogout } = useAuthModal(); // ✅ เพิ่ม token, handleLogout
  const navigate = useNavigate();

  const onLogout = () => {
    handleLogout();
    navigate("/");
  };

  return (
    <>
      <nav className="fixed top-0 z-50 flex w-full items-center justify-between bg-[#AEBC9F] px-8 py-2 shadow-sm">
        <div className="flex h-16 w-32 items-center justify-start md:w-40">
          <img src="/Pictrue/Logo.png" alt="ATC Logo" className="h-full w-auto object-contain drop-shadow-sm" />
        </div>

        <div className="flex items-center gap-6 pr-4 text-[17px] font-medium text-[#4a4a4a] md:gap-12">
          <Link to="/" className={itemClass(active === "home")}>Home</Link>
          <Link to="/shop" className={itemClass(active === "shop")}>Shop</Link>
          <Link to="/events" className={itemClass(active === "events")}>Event</Link>

          <div className="h-8 w-px bg-black/20" />

          {showCart && (
            <button onClick={onCartClick} className="relative rounded-full px-4 py-2 transition-all hover:bg-[#485B3B]/12 hover:text-[#485B3B]">
              🛒
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#485B3B] text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* ✅ เช็ค token แสดง Logout หรือ Login/Register */}
          {token ? (
            <button
              onClick={onLogout}
              className="rounded-full border-none bg-transparent px-4 py-2 text-[17px] font-medium text-[#4a4a4a] transition-all hover:bg-[#485B3B]/12 hover:text-[#485B3B]"
            >
              Logout
            </button>
          ) : (
            <>
              <button
                onClick={openLogin}
                className="rounded-full border-none bg-transparent px-4 py-2 text-[17px] font-medium text-[#4a4a4a] transition-all hover:bg-[#485B3B]/12 hover:text-[#485B3B]"
              >
                Login
              </button>
              <button
                onClick={openRegister}
                className="rounded-full border-none bg-transparent px-4 py-2 text-[17px] font-medium text-[#4a4a4a] transition-all hover:bg-[#485B3B]/12 hover:text-[#485B3B]"
              >
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