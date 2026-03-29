import { useMemo } from "react";
import { Link } from "react-router-dom";
import SiteNavbar from "../components/SiteNavbar";
import useSellerWorkspace from "../hooks/useSellerWorkspace";

function formatStock(value) {
  return `${Number(value || 0).toLocaleString("th-TH")} units`;
}

function formatCurrency(value) {
  return `฿${Number(value || 0).toLocaleString("th-TH")}`;
}

function StatCard({ label, value, tone = "olive", hint }) {
  const tones = {
    olive: "from-[#F4F7EF] to-[#E9F0E1] text-[#284026]",
    cream: "from-[#FBF5EA] to-[#F3E8D3] text-[#4A3A24]",
    white: "from-white to-[#F7F8F3] text-[#2B3428]",
    moss: "from-[#EFF4EA] to-[#E1EBD6] text-[#30412A]",
  };

  return (
    <div className={`rounded-[28px] border border-white/70 bg-gradient-to-br ${tones[tone]} p-5 shadow-[0_18px_50px_rgba(74,91,59,0.08)]`}>
      <p className="text-xs uppercase tracking-[0.2em] text-[#7D8D74]">{label}</p>
      <p className="mt-3 text-[2rem] font-semibold tracking-[-0.04em]">{value}</p>
      {hint ? <p className="mt-2 text-sm text-[#6A7864]">{hint}</p> : null}
    </div>
  );
}

function WorkspaceAction({ eyebrow, title, text, to, tone = "olive" }) {
  const styles = {
    olive: "bg-[#EEF5E6] text-[#2E4328] border-[#D5E2C6]",
    cream: "bg-[#FBF2E3] text-[#5A4427] border-[#E8D6B8]",
    white: "bg-white text-[#2E3A29] border-[#D9E2CF]",
  };

  return (
    <Link
      to={to}
      className={`rounded-[28px] border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(72,91,59,0.12)] ${styles[tone]}`}
    >
      <p className="text-[11px] uppercase tracking-[0.22em] opacity-65">{eyebrow}</p>
      <p className="mt-3 text-[1.15rem] font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-7 opacity-80">{text}</p>
    </Link>
  );
}

function FocusNote({ title, text }) {
  return (
    <div className="rounded-[24px] border border-[#E3E9D9] bg-white/82 p-5">
      <p className="text-sm font-semibold text-[#2C3D28]">{title}</p>
      <p className="mt-3 text-sm leading-7 text-[#677361]">{text}</p>
    </div>
  );
}

function ProductRow({ product }) {
  return (
    <div className="flex items-center gap-4 rounded-[24px] border border-[#E5EADB] bg-white/82 px-4 py-3">
      <div className="h-16 w-16 overflow-hidden rounded-2xl bg-[#F1EFE7]">
        {product.img ? <img src={product.img} alt={product.name} className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[1.02rem] font-semibold text-[#283724]">{product.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#75816F]">
          <span>{product.type || "Tea"}</span>
          <span className="h-1 w-1 rounded-full bg-[#B5C4A7]" />
          <span>{product.sales7d.toLocaleString("th-TH")} sold in 7d</span>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-[#4E6B3E]">{formatCurrency(product.price)}</p>
        <p className={`mt-1 text-sm ${product.stock <= 5 ? "text-[#B25B44]" : "text-[#6C7768]"}`}>{formatStock(product.stock)}</p>
      </div>
    </div>
  );
}

export default function SellerDashboard() {
  const { loading, error, shop, products } = useSellerWorkspace();

  const lowStockCount = useMemo(
    () => products.filter((item) => item.stock <= 5).length,
    [products]
  );
  const totalStock = useMemo(
    () => products.reduce((sum, item) => sum + item.stock, 0),
    [products]
  );
  const weeklyRevenue = useMemo(
    () => products.reduce((sum, item) => sum + item.price * item.sales7d, 0),
    [products]
  );
  const weeklyUnits = useMemo(
    () => products.reduce((sum, item) => sum + item.sales7d, 0),
    [products]
  );
  const topProducts = useMemo(
    () => [...products].sort((a, b) => b.sales7d - a.sales7d || b.stock - a.stock).slice(0, 5),
    [products]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#F5F3EA_0%,#EFF3EB_100%)]">
        <SiteNavbar active="seller" />
        <div className="mx-auto max-w-[1500px] px-6 py-10">
          <div className="h-72 animate-pulse rounded-[34px] bg-[#E8EBDD]" />
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#F5F3EA_0%,#EFF3EB_100%)]">
        <SiteNavbar active="seller" />
        <div className="grid min-h-[calc(100vh-5rem)] place-items-center px-6">
          <div className="max-w-xl rounded-[32px] border border-[#DFE5D6] bg-white/88 p-8 text-center shadow-[0_24px_70px_rgba(72,91,59,0.08)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[#829473]">Seller Hub</p>
            <h1 className="mt-3 font-serif text-[2.6rem] text-[#24321F]">Workspace unavailable</h1>
            <p className="mt-4 text-[1rem] leading-8 text-[#697563]">{error || "No shop profile found"}</p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/shop" className="rounded-full bg-[#7B9A67] px-5 py-3 text-sm font-semibold text-white">
                Back to Shop
              </Link>
              <Link to="/" className="rounded-full border border-[#CDD8C2] px-5 py-3 text-sm font-semibold text-[#567048]">
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F5F3EA_0%,#EFF3EB_45%,#F6F1E6_100%)] text-[#253622]">
      <SiteNavbar active="seller" />

      <main className="relative overflow-hidden px-4 pb-16 pt-6 sm:px-6 xl:px-8 2xl:px-10">
        <div className="pointer-events-none absolute left-[-9rem] top-[8rem] h-[22rem] w-[22rem] rounded-full bg-[#DDE7D1]/70 blur-3xl" />
        <div className="pointer-events-none absolute right-[-7rem] top-[18rem] h-[20rem] w-[20rem] rounded-full bg-[#F2E5D1]/70 blur-3xl" />

        <div className="mx-auto flex w-full max-w-[1540px] flex-col gap-8">
          <section className="overflow-hidden rounded-[36px] border border-[#DFE5D6] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(241,246,234,0.92))] shadow-[0_28px_80px_rgba(72,91,59,0.12)]">
            <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="p-7 sm:p-9 lg:p-11">
                <p className="text-xs uppercase tracking-[0.24em] text-[#839678]">Seller Hub</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <h1 className="font-serif text-[2.5rem] leading-none tracking-[-0.05em] text-[#253622] sm:text-[3.4rem]">
                    {shop.name}
                  </h1>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${shop.verified ? "bg-[#E6F1DA] text-[#4A6B34]" : "bg-[#F6E7D9] text-[#A15E3C]"}`}>
                    {shop.verified ? "Verified shop" : "Pending review"}
                  </span>
                </div>
                <p className="mt-4 max-w-2xl text-[1rem] leading-8 text-[#61705C]">
                  {shop.description || `${shop.name} is set up as a calmer seller workspace: quick actions here, deeper analytics in a dedicated dashboard, and direct paths to the storefront your buyers actually see.`}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/seller/dashboard" className="rounded-full bg-[#485B3B] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(72,91,59,0.2)]">
                    Open dashboard
                  </Link>
                  <Link to="/seller/products" className="rounded-full bg-[#556A46] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(72,91,59,0.18)]">
                    Manage products
                  </Link>
                  <Link to={`/shop/${shop.id}`} className="rounded-full border border-[#D4DDC9] bg-white/88 px-5 py-3 text-sm font-semibold text-[#51684A]">
                    View public shop
                  </Link>
                  <Link to={`/shop/${shop.id}/chat`} className="rounded-full border border-[#D4DDC9] bg-white/88 px-5 py-3 text-sm font-semibold text-[#51684A]">
                    Open shop chat
                  </Link>
                </div>

                <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard label="Products" value={products.length} hint="Active catalog items" />
                  <StatCard label="Revenue 7d" value={formatCurrency(weeklyRevenue)} tone="cream" hint={`${weeklyUnits.toLocaleString("th-TH")} units sold in the last 7 days`} />
                  <StatCard label="Total Stock" value={totalStock.toLocaleString("th-TH")} tone="white" hint="Across all current listings" />
                  <StatCard label="Low Stock" value={lowStockCount.toLocaleString("th-TH")} tone="moss" hint="Items at 5 units or lower" />
                </div>
              </div>

              <div className="relative min-h-[320px] bg-[#E8EFE0]">
                {shop.image ? (
                  <img src={shop.image} alt={shop.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-end bg-[radial-gradient(circle_at_top,#f5f8f0_0%,#deead0_55%,#d1debf_100%)] p-8">
                    <div className="w-full rounded-[30px] border border-white/70 bg-white/70 p-6 backdrop-blur">
                      <p className="text-xs uppercase tracking-[0.24em] text-[#829473]">Storefront readiness</p>
                      <div className="mt-4 space-y-3 text-sm leading-7 text-[#5D6958]">
                        <p>{shop.location || "Location can be added later in shop settings"}</p>
                        <p>{shop.phone}</p>
                        <p>{shop.contactInfo || "Add Line, Facebook, or direct contact for faster buyer reach"}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-5 left-5 right-5 rounded-[28px] border border-white/70 bg-[rgba(249,251,245,0.86)] p-5 backdrop-blur-md shadow-[0_18px_40px_rgba(72,91,59,0.1)]">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[#829473]">Workspace split</p>
                  <p className="mt-3 text-[1.2rem] font-semibold text-[#253622]">Seller Hub for actions, Dashboard for decisions</p>
                  <p className="mt-2 text-sm leading-7 text-[#61705C]">
                    Keep day-to-day tasks here, then jump into the dashboard when you need sales signals, category movement, and product recommendations.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[32px] border border-[#DFE5D6] bg-white/84 p-6 shadow-[0_18px_48px_rgba(72,91,59,0.08)]">
              <p className="text-xs uppercase tracking-[0.22em] text-[#839678]">Quick Actions</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <WorkspaceAction eyebrow="Insights" title="Open sales dashboard" text="See what is selling, what is slowing down, and where the next growth move should come from." to="/seller/dashboard" />
                <WorkspaceAction eyebrow="Catalog" title="Manage product catalog" text="Add new tea listings, adjust pricing, and keep storefront inventory current." to="/seller/products" tone="cream" />
                <WorkspaceAction eyebrow="Storefront" title="Review buyer view" text="Open the public shop and audit how your products, copy, and trust signals appear to customers." to={`/shop/${shop.id}`} tone="white" />
                <WorkspaceAction eyebrow="Inbox" title="Respond in shop chat" text="Stay close to buyer intent and answer product questions while they are still warm." to={`/shop/${shop.id}/chat`} tone="cream" />
              </div>
            </div>

            <div className="rounded-[32px] border border-[#DFE5D6] bg-[linear-gradient(135deg,rgba(247,250,243,0.94),rgba(255,255,255,0.84))] p-6 shadow-[0_18px_48px_rgba(72,91,59,0.08)]">
              <p className="text-xs uppercase tracking-[0.22em] text-[#839678]">Workspace Priorities</p>
              <div className="mt-5 space-y-4">
                <FocusNote
                  title="Store story"
                  text={shop.description ? "Your shop already has a story on the page. Tightening imagery and product mix is now more important than basic setup." : "Add a stronger shop description and contact touchpoints so first-time visitors understand the store faster."}
                />
                <FocusNote
                  title="Inventory pressure"
                  text={lowStockCount > 0 ? `${lowStockCount} product(s) are already in the low-stock zone. Use the dashboard to decide which ones deserve reorder priority.` : "No immediate stock pressure right now. The dashboard can help identify what should be pushed before inventory gets stale."}
                />
                <FocusNote
                  title="Merchandising"
                  text={products.length > 3 ? "You have enough catalog depth to start comparing winners, weak items, and category gaps." : "Your catalog is still compact. Add a few more strategic products before expecting richer sales patterns."}
                />
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-[#DFE5D6] bg-white/84 p-6 shadow-[0_18px_48px_rgba(72,91,59,0.08)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#839678]">Catalog Snapshot</p>
                <h2 className="mt-2 text-[1.8rem] font-semibold tracking-[-0.04em] text-[#253621]">Products carrying the storefront right now</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#F2F6EC] px-4 py-2 text-sm text-[#5D6D56]">{products.length} item(s)</span>
                <Link to="/seller/dashboard" className="rounded-full border border-[#D4DDC9] bg-white px-4 py-2 text-sm font-semibold text-[#4F6646] transition-all hover:bg-[#F3F7ED]">
                  View full dashboard
                </Link>
              </div>
            </div>

            {topProducts.length === 0 ? (
              <div className="mt-6 rounded-[26px] border border-dashed border-[#D8E0CE] bg-[#F8FBF4] p-8 text-center text-[#687564]">
                No products found yet. Create a first listing to turn this workspace into an active seller hub.
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {topProducts.map((product) => (
                  <ProductRow key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

