import { NavLink, useNavigate } from "react-router-dom";

export default function AdminLayout({ adminUser, onLogout, children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout?.();
    navigate("/?adminLogin=1");
  };

  const navItems = [
    { label: "Dashboard", href: "/admin" },
    { label: "Inbox", href: "/admin/inbox" },
    { label: "Products", href: "/admin/products" },
    { label: "Events", href: "/admin/events" },
    { label: "Orders", href: "/admin/orders" },
  ];

  return (
    <div className="min-h-screen bg-[#f8f4eb] text-[#2f3529]">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-[#d7ceb8] bg-[#e6ddc9] px-6 py-8">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.35em] text-[#6d7759]">Admin Panel</p>
            <h1 className="mt-3 text-3xl font-semibold text-[#35412a]">ATC Backoffice</h1>
          </div>

          <nav className="space-y-3">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === "/admin"}
                className={({ isActive }) =>
                  `block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-[#35412a] text-white"
                      : "text-[#35412a] hover:bg-[#d7ceb8]"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="px-6 py-8 md:px-10">
          <style>{`.admin-input{width:100%;border-radius:1rem;border:1px solid #d7ceb8;background:#faf8f2;padding:.8rem 1rem;outline:none;transition:border-color .2s,background .2s}.admin-input:focus{border-color:#485b3b;background:#fff}`}</style>
          <header className="mb-8 flex flex-col gap-4 rounded-[28px] bg-white/80 px-6 py-5 shadow-sm ring-1 ring-[#e6ddc9] md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[#8d9577]">Administrator</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#2f3529]">
                {adminUser?.username || adminUser?.email || "Admin"}
              </h2>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-full bg-[#485b3b] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#39492f]"
            >
              Logout
            </button>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
