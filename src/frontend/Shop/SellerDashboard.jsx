import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SiteNavbar from "../components/SiteNavbar";
import { apiUrl, assetUrl } from "../../lib/api";
import { getStoredToken, getUserIdFromToken, getUserRoleFromToken } from "./authClient";

const api = {
  getShops: () =>
    fetch(apiUrl("/shops")).then((response) => {
      if (!response.ok) throw new Error(`Shops ${response.status}`);
      return response.json();
    }),
  getProducts: () =>
    fetch(apiUrl("/products")).then((response) => {
      if (!response.ok) throw new Error(`Products ${response.status}`);
      return response.json();
    }),
  getProductImages: () =>
    fetch(apiUrl("/product-images")).then((response) => {
      if (!response.ok) throw new Error(`Product images ${response.status}`);
      return response.json();
    }),
  getShopImages: () =>
    fetch(apiUrl("/shop-images")).then((response) => {
      if (!response.ok) throw new Error(`Shop images ${response.status}`);
      return response.json();
    }),
};

function getLocation(shop) {
  return [shop?.subdistrict, shop?.district, shop?.province].filter(Boolean).join(", ");
}

function formatStock(value) {
  return `${Number(value || 0).toLocaleString("th-TH")} units`;
}

function createProductImageMap(rows) {
  const map = new Map();

  for (const image of Array.isArray(rows) ? rows : []) {
    const productId = Number(image.product_id);
    if (!map.has(productId) && image.image_path) {
      map.set(productId, assetUrl(image.image_path));
    }
  }

  return map;
}

function StatCard({ label, value, tone = "olive", hint }) {
  const tones = {
    olive: "from-[#F4F7EF] to-[#E9F0E1] text-[#284026]",
    cream: "from-[#FBF5EA] to-[#F3E8D3] text-[#4A3A24]",
    white: "from-white to-[#F7F8F3] text-[#2B3428]",
  };

  return (
    <div className={`rounded-[28px] border border-white/70 bg-gradient-to-br ${tones[tone]} p-5 shadow-[0_18px_50px_rgba(74,91,59,0.08)]`}>
      <p className="text-xs uppercase tracking-[0.2em] text-[#7D8D74]">{label}</p>
      <p className="mt-3 text-[2rem] font-semibold tracking-[-0.04em]">{value}</p>
      {hint ? <p className="mt-2 text-sm text-[#6A7864]">{hint}</p> : null}
    </div>
  );
}

function WorkspaceAction({ title, text, to, tone = "olive" }) {
  const styles = {
    olive: "bg-[#EEF5E6] text-[#2E4328] border-[#D5E2C6]",
    cream: "bg-[#FBF2E3] text-[#5A4427] border-[#E8D6B8]",
  };

  return (
    <Link
      to={to}
      className={`rounded-[26px] border p-5 transition-all hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(72,91,59,0.12)] ${styles[tone]}`}
    >
      <p className="text-[1.15rem] font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-7 opacity-80">{text}</p>
    </Link>
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
        <p className="mt-1 text-sm text-[#75816F]">{product.type || "Tea"}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-[#4E6B3E]">฿{Number(product.price || 0).toLocaleString("th-TH")}</p>
        <p className={`mt-1 text-sm ${product.stock <= 5 ? "text-[#B25B44]" : "text-[#6C7768]"}`}>{formatStock(product.stock)}</p>
      </div>
    </div>
  );
}

export default function SellerDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);

  const userId = getUserIdFromToken();
  const role = getUserRoleFromToken();

  useEffect(() => {
    let ignore = false;

    if (!getStoredToken()) {
      setError("Please log in before opening Seller Hub");
      setLoading(false);
      return () => {
        ignore = true;
      };
    }

    if (role !== "shop") {
      setError("This workspace is available only for shop accounts");
      setLoading(false);
      return () => {
        ignore = true;
      };
    }

    Promise.all([api.getShops(), api.getProducts(), api.getProductImages().catch(() => []), api.getShopImages().catch(() => [])])
      .then(([shopRows, productRows, productImageRows, imageRows]) => {
        if (ignore) return;

        const productImageMap = createProductImageMap(productImageRows);

        const ownedShop = (Array.isArray(shopRows) ? shopRows : []).find(
          (item) => Number(item.user_id) === Number(userId)
        );

        if (!ownedShop) {
          setError("No shop profile found for this account");
          setLoading(false);
          return;
        }

        const coverImage =
          (Array.isArray(imageRows) ? imageRows : []).find((item) => Number(item.shop_id) === Number(ownedShop.shop_id))
            ?.image_path || null;

        const ownProducts = (Array.isArray(productRows) ? productRows : [])
          .filter((item) => Number(item.shop_id) === Number(ownedShop.shop_id))
          .map((item) => ({
            id: item.product_id,
            name: item.tea_name,
            type: item.tea_type,
            price: Number(item.price || 0),
            stock: Number(item.stock || 0),
            img: productImageMap.get(Number(item.product_id)) || null,
          }));

        setShop({
          id: ownedShop.shop_id,
          name: ownedShop.shop_name,
          description: ownedShop.description || "",
          phone: ownedShop.phone || "-",
          contactInfo: ownedShop.contact_info || "",
          location: getLocation(ownedShop),
          address: ownedShop.address || "-",
          verified: Number(ownedShop.verified_status) === 1,
          image: coverImage ? assetUrl(coverImage) : null,
        });
        setProducts(ownProducts);
      })
      .catch((fetchError) => {
        if (!ignore) setError(fetchError.message || "Failed to load seller workspace");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [role, userId]);

  const lowStockCount = useMemo(() => products.filter((item) => item.stock <= 5).length, [products]);
  const totalStock = useMemo(() => products.reduce((sum, item) => sum + item.stock, 0), [products]);

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
            <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="p-7 sm:p-9 lg:p-11">
                <p className="text-xs uppercase tracking-[0.24em] text-[#839678]">Shop Workspace</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <h1 className="font-serif text-[2.5rem] leading-none tracking-[-0.05em] text-[#253622] sm:text-[3.4rem]">{shop.name}</h1>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${shop.verified ? "bg-[#E6F1DA] text-[#4A6B34]" : "bg-[#F6E7D9] text-[#A15E3C]"}`}>
                    {shop.verified ? "Verified shop" : "Pending review"}
                  </span>
                </div>
                <p className="mt-4 max-w-2xl text-[1rem] leading-8 text-[#61705C]">
                  {shop.description || `${shop.name} is ready for a calmer seller workflow with clear priorities, product overview, and quick access to customer-facing pages.`}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/seller/products" className="rounded-full bg-[#485B3B] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(72,91,59,0.2)]">
                    Manage products
                  </Link>
                  <Link to={`/shop/${shop.id}`} className="rounded-full bg-[#556A46] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(72,91,59,0.18)]">
                    View public shop
                  </Link>
                  <Link to={`/shop/${shop.id}/chat`} className="rounded-full border border-[#D4DDC9] bg-white/88 px-5 py-3 text-sm font-semibold text-[#51684A]">
                    Open shop chat
                  </Link>
                </div>

                <div className="mt-9 grid gap-4 sm:grid-cols-3">
                  <StatCard label="Products" value={products.length} hint="Active catalog items" />
                  <StatCard label="Total Stock" value={totalStock} tone="cream" hint="Across all products" />
                  <StatCard label="Low Stock" value={lowStockCount} tone="white" hint="Items at 5 units or lower" />
                </div>
              </div>

              <div className="relative min-h-[320px] bg-[#E8EFE0]">
                {shop.image ? (
                  <img src={shop.image} alt={shop.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-end bg-[radial-gradient(circle_at_top,#f5f8f0_0%,#deead0_55%,#d1debf_100%)] p-8">
                    <div className="w-full rounded-[30px] border border-white/70 bg-white/70 p-6 backdrop-blur">
                      <p className="text-xs uppercase tracking-[0.24em] text-[#829473]">At a glance</p>
                      <div className="mt-4 space-y-3 text-sm leading-7 text-[#5D6958]">
                        <p>{shop.location || "Location can be added later in shop settings"}</p>
                        <p>{shop.phone}</p>
                        <p>{shop.contactInfo || "Add Line, Facebook, or direct contact for faster customer reach"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[32px] border border-[#DFE5D6] bg-white/84 p-6 shadow-[0_18px_48px_rgba(72,91,59,0.08)]">
              <p className="text-xs uppercase tracking-[0.22em] text-[#839678]">Quick Actions</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <WorkspaceAction title="Refresh shop profile" text="Tighten your storefront copy, contact info, and trust signals before new traffic arrives." to={`/shop/${shop.id}`} />
                <WorkspaceAction title="Review incoming chats" text="Stay close to buyer intent and answer product questions from one place." to={`/shop/${shop.id}/chat`} tone="cream" />
                <WorkspaceAction title="Manage product catalog" text="Add new tea listings, adjust pricing, and keep your storefront inventory current." to="/seller/products" />
                <WorkspaceAction title="Check buyer view" text="Open your public storefront and review what customers actually see." to={`/shop/${shop.id}`} tone="cream" />
              </div>
            </div>

            <div className="rounded-[32px] border border-[#DFE5D6] bg-[linear-gradient(135deg,rgba(247,250,243,0.94),rgba(255,255,255,0.84))] p-6 shadow-[0_18px_48px_rgba(72,91,59,0.08)]">
              <p className="text-xs uppercase tracking-[0.22em] text-[#839678]">Shop Snapshot</p>
              <div className="mt-5 space-y-4">
                <div className="rounded-[26px] border border-[#E3E9D9] bg-white/82 p-5">
                  <p className="text-sm font-semibold text-[#2C3D28]">Profile completeness</p>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#E7EDDE]">
                    <div className="h-full rounded-full bg-[linear-gradient(90deg,#6E8A58_0%,#8EAA74_100%)]" style={{ width: shop.description || shop.contactInfo || shop.location ? "78%" : "46%" }} />
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[#677361]">
                    {shop.description || shop.contactInfo || shop.location
                      ? "Your shop already has enough basics to feel credible. A tighter story and richer product mix would strengthen conversion."
                      : "Add location, description, and contact touchpoints to make the shop feel more complete for first-time visitors."}
                  </p>
                </div>

                <div className="rounded-[26px] border border-[#E3E9D9] bg-white/82 p-5">
                  <p className="text-sm font-semibold text-[#2C3D28]">Immediate focus</p>
                  <ul className="mt-3 space-y-3 text-sm leading-7 text-[#677361]">
                    <li>{lowStockCount > 0 ? `${lowStockCount} item(s) are approaching low stock and need attention.` : "Inventory levels look healthy right now."}</li>
                    <li>{shop.verified ? "Verification is already in place, so the next gains come from product quality and response speed." : "Verification is still pending, so trust indicators should stay visible in your storefront copy."}</li>
                    <li>{products.length > 0 ? "Your current catalog is ready for refinement and merchandising." : "Start by adding at least one product to make the storefront usable."}</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-[#DFE5D6] bg-white/84 p-6 shadow-[0_18px_48px_rgba(72,91,59,0.08)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#839678]">Inventory Snapshot</p>
                <h2 className="mt-2 text-[1.8rem] font-semibold tracking-[-0.04em] text-[#253621]">Products that define your storefront</h2>
              </div>
              <span className="rounded-full bg-[#F2F6EC] px-4 py-2 text-sm text-[#5D6D56]">{products.length} item(s)</span>
            </div>

            {products.length === 0 ? (
              <div className="mt-6 rounded-[26px] border border-dashed border-[#D8E0CE] bg-[#F8FBF4] p-8 text-center text-[#687564]">
                No products found yet. Create a first listing to turn this workspace into an active seller hub.
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {products.slice(0, 5).map((product) => (
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
