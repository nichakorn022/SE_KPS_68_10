import { Link, useNavigate } from "react-router-dom";
import { useAuthModal } from "../../App";

export default function Navbar() {
  const { openLogin, token, handleLogout } = useAuthModal(); // ✅ ดึงจาก Context
  const navigate = useNavigate();

  const onLogout = () => {
    handleLogout();
    navigate("/");
  };

  return (
    <nav className="flex items-center justify-between px-8 py-2 bg-[#AEBC9F] w-full sticky top-0 z-50 shadow-sm">
      <div className="flex items-center h-16 w-32 md:w-40">
        <img src="./Pictrue/Logo.png" alt="ATC Logo" className="h-full object-contain" />
      </div>

      <div className="flex items-center gap-6 md:gap-12 text-[17px] font-medium text-[#4a4a4a]">
        <Link to="/">Home</Link>
        <Link to="/shop">Shop</Link>
        <Link to="/events">Event</Link>

        {token ? (
          <button onClick={onLogout} className="border-l border-black/20 pl-6 hover:underline">
            Logout
          </button>
        ) : (
          <>
            <button onClick={openLogin} className="border-l border-black/20 pl-6 hover:underline">
              Login
            </button>
            <Link to="/register" className="hover:underline">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}