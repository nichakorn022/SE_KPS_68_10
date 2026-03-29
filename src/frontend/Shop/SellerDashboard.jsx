import { useMemo } from "react";
import { Link } from "react-router-dom";
import SiteNavbar from "../components/SiteNavbar";
import useSellerWorkspace from "../hooks/useSellerWorkspace";

function formatCurrency(value) {
  return `THB ${Number(value || 0).toLocaleString("th-TH")}`;
}

function formatCount(value) {
  return Number(value || 0).toLocaleString("th-TH");
}

function getInventoryStatus(product) {
  if (product.stock <= 12) return { label: "Low Stock", tone: "bg-[#B9645F] text-white" };
  if (product.sales7d >= 10) return { label: "Best Seller", tone: "bg-[#87A982] text-white" };
  if (product.stock >= Math.max(60, product.sales7d * 10 || 0)) return { label: "Slow Moving", tone: "bg-[#D3BE96] text-[#5F482B]" };
  if (product.reviewCount === 0 || product.sales7d === 0) return { label: "New", tone: "bg-[#A7AB7E] text-white" };
  return { label: "Active", tone: "bg-[#EEF3E8] text-[#5C7355]" };
}

function IconBadge({ children, tone = "olive" }) {
  const tones = {
    olive: "bg-[#EEF3E8] text-[#7A9A74]",
    red: "bg-[#F7F3F0] text-[#BA5B56]",
  };

  return <div className={`flex h-14 w-14 items-center justify-center rounded-[18px] ${tones[tone]}`}>{children}</div>;
}

function SummaryCard({ icon, label, value, hint, meta, tone = "olive" }) {
  return (
    <div className="rounded-[28px] border border-[#E3E7DC] bg-white px-7 py-7 shadow-[0_14px_34px_rgba(72,91,59,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <IconBadge tone={tone}>{icon}</IconBadge>
        {meta ? <div className="text-[0.92rem] font-medium text-[#7FA17B]">{meta}</div> : null}
      </div>
      <p className="mt-12 text-[2.1rem] font-medium tracking-[-0.04em] text-[#253622]">{value}</p>
      <p className="mt-8 text-[1.02rem] text-[#46553F]">{label}</p>
      <p className="mt-8 text-[0.98rem] text-[#96A18E]">{hint}</p>
    </div>
  );
}

function ActionCard({ icon, title, text, to, badge, tone = "olive" }) {
  const badgeTone = tone === "red" ? "bg-[#B55F5C]" : "bg-[#73936D]";

  return (
    <Link to={to} className="rounded-[28px] border border-[#E3E7DC] bg-white px-7 py-7 shadow-[0_14px_34px_rgba(72,91,59,0.06)] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[2px] hover:shadow-[0_22px_42px_rgba(72,91,59,0.1)]">
      <div className="flex items-start justify-between gap-4">
        <IconBadge>{icon}</IconBadge>
        {badge ? <span className={`rounded-full px-4 py-1 text-[0.95rem] font-medium text-white ${badgeTone}`}>{badge}</span> : null}
      </div>
      <p className="mt-16 text-[1rem] font-medium text-[#253622] sm:text-[1.05rem]">{title}</p>
      <p className="mt-10 text-[0.98rem] leading-8 text-[#6E7967]">{text}</p>
    </Link>
  );
}

function HealthItem({ title, value, tone = "good" }) {
  const tones = { good: "text-[#7AA072]", fair: "text-[#C9A878]", risk: "text-[#B86A5F]" };

  return (
    <div>
      <p className="text-[1rem] text-[#253622]">{title}</p>
      <p className={`mt-2 text-[0.98rem] ${tones[tone]}`}>{value}</p>
    </div>
  );
}

function InventoryRow({ product }) {
  const status = getInventoryStatus(product);
  const lowStock = product.stock <= 12;

  return (
    <tr className="border-t border-[#E7E1D6] align-middle">
      <td className="px-5 py-5 sm:px-7">
        <div className="flex min-w-0 items-center gap-4">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[16px] bg-[#EEF1E7] ring-1 ring-[#E4E8DB]">
            {product.img ? (
              <img src={product.img} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-[#8A9A7F]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6">
                  <rect x="4" y="5" width="16" height="14" rx="3" />
                  <circle cx="9" cy="10" r="1.4" />
                  <path d="m7 16 3.2-3.2a1.4 1.4 0 0 1 2 0L17 17" />
                </svg>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[1.05rem] font-medium text-[#253622]">{product.name}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-5 text-[1rem] text-[#5A6953] sm:px-7">{product.type || "Uncategorized"}</td>
      <td className="px-5 py-5 text-[1rem] text-[#253622] sm:px-7">{formatCurrency(product.price)}</td>
      <td className={`px-5 py-5 text-[1rem] sm:px-7 ${lowStock ? "text-[#C26457]" : "text-[#253622]"}`}>{formatCount(product.stock)} units</td>
      <td className="px-5 py-5 sm:px-7"><span className={`inline-flex rounded-full px-4 py-2 text-[0.94rem] font-medium ${status.tone}`}>{status.label}</span></td>
    </tr>
  );
}

function StorefrontIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 10.2V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8.8" strokeLinecap="round" /><path d="M6 4h12l2 4.8a2.5 2.5 0 0 1-2.33 3.45 2.5 2.5 0 0 1-2.17-1.25 2.5 2.5 0 0 1-4.33 0 2.5 2.5 0 0 1-4.33 0A2.5 2.5 0 0 1 4 8.8L6 4Z" strokeLinejoin="round" /><path d="M9 20v-4.2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V20" strokeLinecap="round" /></svg>;
}
function CubeIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m12 3 7 4v10l-7 4-7-4V7l7-4Z" strokeLinejoin="round" /><path d="m5 7 7 4 7-4M12 11v10" strokeLinejoin="round" /></svg>;
}
function StockIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 5h10M8 5v14a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V5" /><path d="M9 10h6" strokeLinecap="round" /></svg>;
}
function AlertIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 4 20 18a1 1 0 0 1-.87 1.5H4.87A1 1 0 0 1 4 18L12 4Z" strokeLinejoin="round" /><path d="M12 9v4.5" strokeLinecap="round" /><circle cx="12" cy="16.5" r="1" fill="currentColor" stroke="none" /></svg>;
}
function TrendIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5.5 15.5 10 11l3 3 5.5-5.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 8.5h5v5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function StarIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m12 4.8 2.2 4.47 4.93.72-3.56 3.47.84 4.9L12 16.98l-4.4 2.32.84-4.9L4.88 10l4.93-.72L12 4.8Z" strokeLinejoin="round" /></svg>;
}
function ClockIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v5l3.2 2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function SellerDashboard() {
  const { loading, error, shop, products, summary } = useSellerWorkspace();

  const lowStockCount = useMemo(() => products.filter((item) => item.stock <= 5).length, [products]);
  const totalStock = useMemo(() => products.reduce((sum, item) => sum + item.stock, 0), [products]);
  const totalReviews = useMemo(() => products.reduce((sum, item) => sum + item.reviewCount, 0), [products]);
  const inventoryRows = useMemo(() => [...products].sort((a, b) => b.sales7d - a.sales7d || a.stock - b.stock || a.name.localeCompare(b.name)).slice(0, 6), [products]);
  const averageRating = useMemo(() => {
    const weighted = products.reduce((sum, item) => sum + item.avgRating * item.reviewCount, 0);
    return totalReviews > 0 ? weighted / totalReviews : 0;
  }, [products, totalReviews]);

  const inventoryScore = products.length === 0 ? 58 : Math.max(50, Math.round(100 - (lowStockCount / products.length) * 45));
  const fulfillmentScore = summary.pendingOrders === 0 ? 94 : summary.pendingOrders <= 3 ? 82 : summary.pendingOrders <= 6 ? 68 : 54;
  const catalogScore = products.length >= 5 ? 92 : products.length >= 3 ? 78 : products.length >= 1 ? 62 : 45;
  const reviewScore = totalReviews === 0 ? 58 : Math.round((averageRating / 5) * 100);
  const shopHealthScore = Math.round((inventoryScore + fulfillmentScore + catalogScore + reviewScore) / 4);

  const inventoryState = lowStockCount === 0 ? "Good" : lowStockCount <= 2 ? "Watch" : "Risk";
  const inventoryTone = lowStockCount === 0 ? "good" : lowStockCount <= 2 ? "fair" : "risk";
  const fulfillmentState = summary.pendingOrders <= 1 ? "On time" : summary.pendingOrders <= 4 ? "Active queue" : "Backlog";
  const fulfillmentTone = summary.pendingOrders <= 1 ? "good" : summary.pendingOrders <= 4 ? "fair" : "risk";
  const catalogState = products.length >= 4 ? "Good depth" : products.length >= 2 ? "Growing" : "Thin catalog";
  const catalogTone = products.length >= 4 ? "good" : products.length >= 2 ? "fair" : "risk";
  const reviewState = totalReviews === 0 ? "No proof yet" : averageRating >= 4.5 ? "Excellent" : averageRating >= 4 ? "Good" : "Fair";
  const reviewTone = totalReviews === 0 ? "fair" : averageRating >= 4 ? "good" : "fair";

  if (loading) {
    return <div className="min-h-screen bg-[#F7F5EF]"><SiteNavbar active="seller" /><div className="mx-auto max-w-[1700px] px-6 py-10"><div className="h-72 animate-pulse rounded-[34px] bg-[#E8EBDD]" /></div></div>;
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-[#F7F5EF]">
        <SiteNavbar active="seller" />
        <div className="grid min-h-[calc(100vh-5rem)] place-items-center px-6">
          <div className="max-w-xl rounded-[32px] border border-[#DFE5D6] bg-white/88 p-8 text-center shadow-[0_24px_70px_rgba(72,91,59,0.08)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[#829473]">Seller Hub</p>
            <h1 className="mt-3 font-serif text-[2.6rem] text-[#24321F]">Workspace unavailable</h1>
            <p className="mt-4 text-[1rem] leading-8 text-[#697563]">{error || "No shop profile found"}</p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/shop" className="rounded-full bg-[#7B9A67] px-5 py-3 text-sm font-semibold text-white">Back to Shop</Link>
              <Link to="/" className="rounded-full border border-[#CDD8C2] px-5 py-3 text-sm font-semibold text-[#567048]">Go Home</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#253622]">
      <SiteNavbar active="seller" />
      <main className="px-4 pb-16 pt-6 sm:px-6 xl:px-8">
        <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-10">
          <section className="rounded-[34px] border border-[#DFE5D6] bg-white px-10 py-10 shadow-[0_18px_40px_rgba(72,91,59,0.06)]">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
              <div className="flex h-[122px] w-[122px] shrink-0 items-center justify-center overflow-hidden rounded-[24px] bg-[#8DA27D] text-white shadow-[0_16px_28px_rgba(72,91,59,0.18)]">{shop.image ? <img src={shop.image} alt={shop.name} className="h-full w-full object-cover" /> : <StorefrontIcon />}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-4">
                  <h1 className="text-[2.35rem] font-medium tracking-[-0.05em] text-[#253622] sm:text-[2.85rem]">{shop.name}</h1>
                  <span className={`rounded-full px-4 py-2 text-[0.95rem] ${shop.verified ? "bg-[#EEF4EA] text-[#7A9A74]" : "bg-[#F7EEE5] text-[#B87A56]"}`}>{shop.verified ? "Verified Seller" : "Pending Review"}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-[1rem] text-[#5F6D58]"><span className="text-[1.15rem] font-medium text-[#253622]">{totalReviews > 0 ? averageRating.toFixed(1) : "-"} <span className="text-[#D1A264]">/ 5</span></span><span className="text-[#DADFD2]">|</span><span>{formatCount(totalReviews)} reviews</span><span className="text-[#DADFD2]">|</span><span>{formatCount(summary.paidOrders30d)} orders in 30 days</span></div>
                <p className="mt-6 max-w-4xl text-[1rem] leading-9 text-[#66735F]">{shop.description || `${shop.name} is connected to live catalog, review, and order data. Use this hub for daily operations, then jump into analytics when you need deeper product and revenue signals.`}</p>
                <div className="mt-8 flex flex-wrap gap-3"><Link to="/seller/products" className="rounded-[16px] bg-[#7F9A76] px-5 py-3 text-[1rem] font-medium text-white">Manage Products</Link><Link to={`/shop/${shop.id}`} className="rounded-[16px] border border-[#D6DDCD] bg-white px-5 py-3 text-[1rem] font-medium text-[#3F4C39]">View Public Shop</Link></div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[1.95rem] font-medium tracking-[-0.04em] text-[#253622]">Business Overview</h2>
            <div className="mt-7 grid gap-5 xl:grid-cols-3">
              <SummaryCard icon={<CubeIcon />} label="Total Products" value={formatCount(products.length)} hint="Active listings" />
              <SummaryCard icon={<StockIcon />} label="Total Stock Units" value={formatCount(totalStock)} hint="Across all products" />
              <SummaryCard icon={<AlertIcon />} label="Low Stock Items" value={formatCount(lowStockCount)} hint="Need restocking soon" tone="red" />
              <SummaryCard icon={<TrendIcon />} label="Monthly Revenue" value={formatCurrency(summary.revenue30d)} hint="Last 30 days" meta={summary.revenue30d > 0 ? `${formatCount(summary.units30d)} units` : null} />
              <SummaryCard icon={<ClockIcon />} label="Total Orders" value={formatCount(summary.paidOrders30d)} hint="Paid orders in 30 days" meta={summary.pendingOrders > 0 ? `${formatCount(summary.pendingOrders)} pending` : null} />
              <SummaryCard icon={<StarIcon />} label="Average Rating" value={totalReviews > 0 ? averageRating.toFixed(1) : "-"} hint={totalReviews > 0 ? `From ${formatCount(totalReviews)} reviews` : "No reviews yet"} />
            </div>
          </section>

          <section className="rounded-[30px] border border-[#D7E1D1] bg-[linear-gradient(180deg,#FCFDF8_0%,#F8F7F0_100%)] px-8 py-8 shadow-[0_14px_34px_rgba(72,91,59,0.05)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-[1.85rem] font-medium tracking-[-0.04em] text-[#253622]">Shop Health Score</h2><p className="mt-2 text-[1rem] text-[#6A7664]">Overall readiness and performance</p></div><p className="text-[3rem] font-light tracking-[-0.05em] text-[#7C9E7B]">{shopHealthScore}%</p></div>
            <div className="mt-10 h-4 overflow-hidden rounded-full bg-[#EADFC8]"><div className="h-full rounded-full bg-[#73936D]" style={{ width: `${shopHealthScore}%` }} /></div>
            <div className="mt-14 grid gap-8 md:grid-cols-4"><HealthItem title="Inventory" value={inventoryState} tone={inventoryTone} /><HealthItem title="Fulfillment" value={fulfillmentState} tone={fulfillmentTone} /><HealthItem title="Catalog" value={catalogState} tone={catalogTone} /><HealthItem title="Reviews" value={reviewState} tone={reviewTone} /></div>
          </section>

          <section>
            <h2 className="text-[1.95rem] font-medium tracking-[-0.04em] text-[#253622]">Quick Actions</h2>
            <div className="mt-7 grid gap-5 xl:grid-cols-3">
              <ActionCard icon={<CubeIcon />} title="Product Catalog" text="Add, edit, or remove products from your shop" to="/seller/products" badge={products.length > 0 ? formatCount(products.length) : null} />
              <ActionCard icon={<ClockIcon />} title="Pending Orders" text="Review unpaid orders and confirm when money arrives" to="/seller/orders" badge={summary.pendingOrders > 0 ? formatCount(summary.pendingOrders) : null} tone={summary.pendingOrders > 0 ? "red" : "olive"} />
              <ActionCard icon={<TrendIcon />} title="Analytics Dashboard" text="Open seller analytics and review revenue, category, and product movement" to="/seller/dashboard" badge={summary.revenue30d > 0 ? formatCurrency(summary.revenue30d) : null} />
              <ActionCard icon={<StorefrontIcon />} title="Storefront Settings" text="Review public-facing details, location, contact channels, and trust signals" to={`/shop/${shop.id}`} />
              <ActionCard icon={<StarIcon />} title="Customer Feedback" text="View and reply to product reviews from your customers" to="/seller/feedback" badge={totalReviews > 0 ? formatCount(totalReviews) : null} />
            </div>
          </section>

          <section className="rounded-[30px] border border-[#DED8CB] bg-[linear-gradient(180deg,#FCFBF8_0%,#F8F5EE_100%)] px-5 py-6 shadow-[0_14px_34px_rgba(72,91,59,0.05)] sm:px-7 sm:py-7 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-[1.85rem] font-medium tracking-[-0.04em] text-[#253622]">Inventory Snapshot</h2><p className="mt-2 text-[1rem] text-[#6A7664]">Quick overview of your product catalog</p></div><Link to="/seller/products" className="text-[1rem] font-medium text-[#89A17D] transition-colors hover:text-[#6F8A62]">View Full Inventory</Link></div>
            <div className="mt-7 overflow-hidden rounded-[28px] border border-[#E4DDD2] bg-white shadow-[0_10px_28px_rgba(72,91,59,0.04)]">
              {inventoryRows.length > 0 ? (
                <div className="overflow-x-auto"><table className="min-w-full border-collapse"><thead><tr className="text-left text-[1rem] font-medium text-[#5A6250]"><th className="px-5 py-5 sm:px-7">Product</th><th className="px-5 py-5 sm:px-7">Category</th><th className="px-5 py-5 sm:px-7">Price</th><th className="px-5 py-5 sm:px-7">Stock</th><th className="px-5 py-5 sm:px-7">Status</th></tr></thead><tbody>{inventoryRows.map((product) => <InventoryRow key={product.id} product={product} />)}</tbody></table></div>
              ) : (
                <div className="px-6 py-12 text-center sm:px-8"><p className="text-[1.05rem] font-medium text-[#253622]">No products in inventory yet</p><p className="mt-2 text-[0.98rem] text-[#788371]">Add your first product to start tracking stock and catalog status here.</p><Link to="/seller/products" className="mt-5 inline-flex rounded-[16px] bg-[#7F9A76] px-5 py-3 text-[0.98rem] font-medium text-white">Open Product Catalog</Link></div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
