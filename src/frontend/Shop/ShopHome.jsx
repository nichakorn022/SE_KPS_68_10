import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { apiUrl, assetUrl } from "../../lib/api";
import SiteNavbar from "../components/SiteNavbar";
import FloatingCartButton from "../components/FloatingCartButton";
import usePersistentCart from "../hooks/usePersistentCart";
import { getUserIdFromToken } from "./authClient";

const api = {
  getProducts: () =>
    fetch(apiUrl("/products")).then((response) => {
      if (!response.ok) throw new Error(`Products ${response.status}`);
      return response.json();
    }),
  getShops: () =>
    fetch(apiUrl("/shops")).then((response) => {
      if (!response.ok) throw new Error(`Shops ${response.status}`);
      return response.json();
    }),
  getShopImages: () =>
    fetch(apiUrl("/shop-images")).then((response) => {
      if (!response.ok) throw new Error(`Shop images ${response.status}`);
      return response.json();
    }),
  getProductImages: () =>
    fetch(apiUrl("/product-images")).then((response) => {
      if (!response.ok) throw new Error(`Product images ${response.status}`);
      return response.json();
    }),
};

const HERO_SLIDES = [
  {
    image:
      "https://i.pinimg.com/originals/f7/38/89/f7388986e1bd9f2d4fd063f2dda835f8.jpg",
    eyebrow: "Tea collection",
    title: "ชาแก้วดีสำหรับวันธรรมดาที่อยากให้พิเศษขึ้น",
    description: "คัดเมนูจากร้านชาและคาเฟ่โทนอุ่นที่เน้นกลิ่นชัด วัตถุดิบดี และภาพรวมที่ดูละเมียด",
  },
  {
    image: "https://files.idyllic.app/files/static/4461046",
    eyebrow: "Fresh picks",
    title: "เลือกจากร้านที่มีเอกลักษณ์ ไม่ใช่แค่ลิสต์สินค้าทั่วไป",
    description: "สลับดูร้านและสินค้าได้ในหน้าเดียว พร้อมตัวกรองที่ใช้งานง่ายทั้งบนมือถือและเดสก์ท็อป",
  },
  {
    image:
      "https://cplusdesign.lk/wp-content/uploads/2023/12/Small-Tea-Shop-Design-Ideas-1-450x450.jpg",
    eyebrow: "Curated shops",
    title: "เริ่มจากเมนูที่ใช่ หรือเริ่มจากร้านที่ชอบก็ได้",
    description: "หน้า shop นี้ถูกจัดให้ค้นหา กรอง และหยิบเข้าตะกร้าได้เร็วขึ้นโดยยังคงบรรยากาศร้านชาแบบอบอุ่น",
  },
];

const TABS = ["ทั้งหมด", "เมนูใหม่", "ยอดฮิต", "แนะนำ"];
const CATEGORIES = ["Green Tea", "Black Tea", "Oolong Tea", "White Tea", "Herbal Tea"];

function toAssetUrl(imagePath) {
  return imagePath ? assetUrl(imagePath) : null;
}

function formatPrice(price) {
  return `฿${Number(price ?? 0).toLocaleString("th-TH")}`;
}

function formatCompactSalesCount(value) {
  const count = Number(value ?? 0);
  if (count >= 1000000) return `${(count / 1000000).toFixed(count >= 10000000 ? 0 : 1)}M+`;
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}K+`;
  return `${count}`;
}

function getLocation(shop) {
  return [shop?.subdistrict, shop?.district, shop?.province].filter(Boolean).join(", ");
}

function normalizeShop(shop) {
  return {
    ...shop,
    id: shop.shop_id,
    ownerUserId: Number(shop.user_id),
    name: shop.shop_name,
    location: getLocation(shop),
    isVerified: Number(shop.verified_status) === 1,
    img: null,
  };
}

function buildProductSignals(product) {
  const stock = Number(product.stock ?? 0);
  const price = Number(product.price ?? 0);
  const weeklySales = Number(product.sales_7d ?? 0);
  const avgRating = Number(product.avg_rating ?? 0);
  const reviewCount = Number(product.review_count ?? 0);

  return {
    stock,
    price,
    weeklySales,
    avgRating,
    reviewCount,
    soldOut: stock <= 0,
    lowStock: stock > 0 && stock <= 3,
    popular: weeklySales > 0,
    featured: price >= 90,
    freshPick: stock > 3 && stock <= 8,
  };
}

function scoreRecommendedProduct(product) {
  const rating = Number(product.avgRating ?? 0);
  const reviewCount = Number(product.reviewCount ?? 0);
  const weeklySales = Number(product.weeklySales ?? 0);
  const stock = Number(product.stock ?? 0);
  const productId = Number(product.id ?? 0);

  return (
    rating * 1000 +
    Math.min(reviewCount, 50) * 25 +
    Math.min(weeklySales, 200) * 5 +
    Math.min(stock, 20) +
    productId / 1000
  );
}

function getTabFilteredProducts(products, activeTab) {
  if (activeTab === "เมนูใหม่") {
    return [...products]
      .filter((product) => !product.soldOut)
      .sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0))
      .slice(0, 8);
  }

  if (activeTab === "ยอดฮิต") {
    return [...products].sort((a, b) => {
      const salesDiff = Number(b.weeklySales ?? 0) - Number(a.weeklySales ?? 0);
      if (salesDiff !== 0) return salesDiff;
      return Number(b.id ?? 0) - Number(a.id ?? 0);
    });
  }

  if (activeTab === "แนะนำ") {
    return [...products]
      .filter((product) => !product.soldOut)
      .sort((a, b) => {
        const scoreDiff = scoreRecommendedProduct(b) - scoreRecommendedProduct(a);
        if (scoreDiff !== 0) return scoreDiff;
        return Number(b.id ?? 0) - Number(a.id ?? 0);
      })
      .slice(0, 8);
  }

  return products;
}

function normalizeProduct(product, shopsById, productImageMap) {
  const shop = shopsById.get(product.shop_id);
  const signals = buildProductSignals(product);

  return {
    ...product,
    id: product.product_id,
    name: product.tea_name,
    tag: product.tea_type,
    shop: shop?.name || `Shop #${product.shop_id}`,
    ownerUserId: shop?.ownerUserId ?? null,
    shopVerified: shop?.isVerified ?? false,
    img: productImageMap.get(product.product_id) || null,
    ...signals,
  };
}

function filterProducts(products, { search, activeTab, activeCategory }) {
  const query = search.trim().toLowerCase();

  const filtered = products.filter((product) => {
    const matchesSearch =
      !query ||
      product.name?.toLowerCase().includes(query) ||
      product.shop?.toLowerCase().includes(query) ||
      product.tag?.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query);

    const matchesCategory = !activeCategory || product.tag === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return getTabFilteredProducts(filtered, activeTab);
}

function getSectionTitle(search, activeTab, activeCategory) {
  if (search.trim()) return `ผลการค้นหา “${search.trim()}”`;
  if (activeCategory) return activeCategory;
  if (activeTab !== "ทั้งหมด") return activeTab;
  return "เมนูชาที่น่าลองวันนี้";
}

function getSectionDescription(search, activeTab, activeCategory) {
  if (search.trim()) {
    return "คัดผลลัพธ์ที่ตรงกับคำค้นจากชื่อเมนู ร้าน และประเภทชา";
  }
  if (activeCategory) {
    return "แสดงสินค้าในหมวดที่เลือกพร้อมสถานะสต็อกและร้านที่เกี่ยวข้อง";
  }
  if (activeTab === "เมนูใหม่") return "เมนูที่สต็อกยังสดและเหมาะกับการสำรวจร้านใหม่ๆ";
  if (activeTab === "ยอดฮิต") return "จัดอันดับจากจำนวนชิ้นที่ขายได้จริงในช่วง 7 วันล่าสุด แล้วเรียงจากมากไปน้อย";
  if (activeTab === "แนะนำ") return "เครื่องดื่มที่ราคาสูงขึ้นนิด แต่ภาพรวมดูพรีเมียมและเหมาะเป็นตัวเด่น";
  return "หน้าเดียวสำหรับค้นหาเมนู ดูร้าน และหยิบสินค้าลงตะกร้าแบบไม่รู้สึกโล่งหรือแข็งเกินไป";
}

function SearchBar({ value, onChange }) {
  return (
    <label className="group relative block w-full">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6E7D61] transition-transform duration-300 group-focus-within:scale-110">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
          <circle cx="11" cy="11" r="6.5" />
          <path strokeLinecap="round" d="m16 16 4.5 4.5" />
        </svg>
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="ค้นหาเมนูชา ร้าน หรือประเภทที่อยากลอง"
        className="w-full rounded-[1.75rem] border border-[#D9E2CF] bg-white/92 px-12 py-4 text-[15px] text-[#30412D] shadow-[0_20px_60px_rgba(91,117,72,0.08)] outline-none transition-all duration-300 placeholder:text-[#90A085] focus:border-[#738A5E] focus:shadow-[0_24px_80px_rgba(72,91,59,0.16)]"
      />
    </label>
  );
}

function ViewToggle({ activeView, onChange }) {
  return (
    <div className="inline-flex rounded-full border border-[#D4DEC8] bg-[#F8FBF4] p-1 shadow-[0_12px_30px_rgba(85,108,68,0.08)]">
      {[
        { id: "products", label: "สินค้า" },
        { id: "shops", label: "ร้านค้า" },
      ].map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
            activeView === item.id
              ? "bg-[#485B3B] text-white shadow-[0_12px_24px_rgba(72,91,59,0.24)]"
              : "text-[#536348] hover:text-[#314228]"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function TabBar({ tabs, active, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onSelect(tab)}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
            active === tab
              ? "bg-[#485B3B] text-white shadow-[0_12px_24px_rgba(72,91,59,0.2)]"
              : "bg-white/88 text-[#566452] ring-1 ring-[#D8E0CF] hover:-translate-y-0.5 hover:bg-white hover:text-[#314228]"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function CategoryBar({ categories, active, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
          !active
            ? "bg-[#AFC19A] text-white shadow-[0_10px_20px_rgba(123,146,102,0.24)]"
            : "bg-[#F8FBF4] text-[#5B6950] ring-1 ring-[#D8E0CF] hover:bg-white"
        }`}
      >
        ทุกหมวด
      </button>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onSelect(category === active ? null : category)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
            active === category
              ? "bg-[#485B3B] text-white shadow-[0_10px_22px_rgba(72,91,59,0.2)]"
              : "bg-[#F8FBF4] text-[#5B6950] ring-1 ring-[#D8E0CF] hover:bg-white"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

function ProductCard({ product, onAddToCart }) {
  const metaLabel = `ขายได้ ${formatCompactSalesCount(product.weeklySales)} ชิ้น`;
  const hasReviews = Number(product.reviewCount ?? 0) > 0;
  const ratingLabel = hasReviews
    ? `${Number(product.avgRating ?? 0).toFixed(1)} (${Number(product.reviewCount ?? 0)})`
    : "";

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-[#DEE5D5] bg-white/92 shadow-[0_18px_50px_rgba(72,91,59,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_70px_rgba(72,91,59,0.14)]">
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-[6/5] overflow-hidden bg-[#EBF0E1]">
          {product.img ? (
            <img
              src={product.img}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(174,188,159,0.45),_rgba(245,243,233,0.95))] text-4xl text-[#607252]">
              ☕
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#172115]/45 via-transparent to-transparent opacity-70" />

          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {product.soldOut ? (
              <span className="rounded-full bg-[#3A4335] px-3 py-1 text-[11px] font-semibold text-white">
                หมดชั่วคราว
              </span>
            ) : product.lowStock ? (
              <span className="rounded-full bg-[#FFF1D8] px-3 py-1 text-[11px] font-semibold text-[#8A5B13]">
                เหลือ {product.stock} ชิ้น
              </span>
            ) : (
              <span className="rounded-full bg-white/92 px-3 py-1 text-[11px] font-semibold text-[#405336]">
                พร้อมสั่ง
              </span>
            )}

            {product.shopVerified && (
              <span className="rounded-full bg-[#D7E5CA]/90 px-3 py-1 text-[11px] font-semibold text-[#36502E]">
                ร้านยืนยันแล้ว
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-5 pb-4 pt-4">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-[12px] font-medium uppercase tracking-[0.18em] text-[#8A9B7B]">
              {product.shop}
            </p>
            {product.tag && (
              <span className="rounded-full border border-[#D7E1CC] bg-[#F8FBF4] px-2.5 py-1 text-[10px] font-semibold text-[#55654C]">
                {product.tag}
              </span>
            )}
          </div>

          <Link to={`/product/${product.id}`} className="block">
            <h3 className="min-h-[3.1rem] line-clamp-2 text-[18px] font-semibold leading-snug text-[#23311F] transition-colors duration-300 group-hover:text-[#485B3B]">
              {product.name}
            </h3>
          </Link>

          <p className="min-h-[3.5rem] line-clamp-2 text-sm leading-6.5 text-[#627059]">
            {product.description || "เมนูชาที่คัดจากร้านบรรยากาศอบอุ่น พร้อมรายละเอียดที่เหมาะกับการตัดสินใจเร็วขึ้น"}
          </p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 pt-4">
          <div className="min-w-0 space-y-1.5">
            <p className="text-[13px] text-[#859479]">เริ่มต้น</p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-[20px] font-semibold text-[#253621]">{formatPrice(product.price)}</p>
              <div className="flex min-w-0 items-center gap-1.5 overflow-hidden text-[11px] text-[#3C4636]">
                {hasReviews ? (
                  <>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-[#F0C65A] bg-[#FFF7D9] px-1.5 py-[2px] font-semibold leading-none text-[#2D2A24]">
                      <span className="text-[10px] text-[#E0AA20]">★</span>
                      <span>{ratingLabel}</span>
                    </span>
                    <span className="h-3.5 w-px shrink-0 bg-[#D8DDD2]" />
                  </>
                ) : null}
                <span className="truncate font-medium text-[#3D4337]">{metaLabel}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={product.soldOut || product.isOwnProduct}
            onClick={() => onAddToCart(product)}
            className={`min-w-[140px] rounded-full px-4 py-2.5 text-center text-sm font-semibold leading-tight transition-all duration-300 ${
              product.soldOut || product.isOwnProduct
                ? "cursor-not-allowed bg-[#E6E9E0] text-[#93A08C]"
                : "bg-[#485B3B] text-white shadow-[0_14px_28px_rgba(72,91,59,0.22)] hover:-translate-y-0.5 hover:bg-[#394A31] active:scale-[0.98]"
            }`}
          >
            {product.isOwnProduct ? "สินค้าร้านคุณ" : product.soldOut ? "ของหมด" : "เพิ่มลงตะกร้า"}
          </button>
        </div>
      </div>
    </article>
  );
}

function ShopCard({ shop }) {
  return (
    <article className="group overflow-hidden rounded-[2rem] border border-[#DCE4D4] bg-white/92 p-5 shadow-[0_18px_50px_rgba(72,91,59,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_64px_rgba(72,91,59,0.14)]">
      <div className="flex items-start gap-4">
        <div className="h-20 w-20 overflow-hidden rounded-[1.5rem] bg-[#EDF2E5] ring-1 ring-[#D6E0CB]">
          {shop.img ? (
            <img src={shop.img} alt={shop.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl text-[#5A6F49]">🏬</div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[18px] font-semibold text-[#273723]">{shop.name}</h3>
            {shop.isVerified && (
              <span className="rounded-full bg-[#DCE9D1] px-2.5 py-1 text-[11px] font-semibold text-[#39502E]">
                Verified
              </span>
            )}
          </div>

          <p className="line-clamp-2 text-sm leading-6 text-[#627059]">
            {shop.description || "ร้านชาที่เน้นภาพรวมอบอุ่น เรียบดี และเลือกเมนูได้ง่ายจากหน้าเดียว"}
          </p>

          <div className="flex flex-wrap gap-3 text-xs text-[#7C8E70]">
            <span>{shop.location || "ร้านชาออนไลน์"}</span>
            {shop.phone && <span>{shop.phone}</span>}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#EBF0E5] pt-4">
        <p className="text-sm text-[#7A8A6F]">กดเข้าไปเพื่อดูสินค้า รายละเอียด และเมนูของร้านนี้</p>
        <Link
          to={`/shop/${shop.id}`}
          className="rounded-full border border-[#485B3B] px-4 py-2 text-sm font-semibold text-[#485B3B] transition-all duration-300 hover:bg-[#485B3B] hover:text-white"
        >
          ดูร้าน
        </Link>
      </div>
    </article>
  );
}

function EmptyProductsState({ search, onClearSearch, onClearFilters }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-[#CAD7BE] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(244,248,238,0.9))] px-6 py-14 text-center shadow-[0_20px_60px_rgba(88,110,70,0.08)]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E3ECD7] text-3xl text-[#516548]">
        🍵
      </div>
      <h3 className="mt-5 text-[24px] font-semibold text-[#283824]">ยังไม่เจอเมนูที่ตรงกับตอนนี้</h3>
      <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-7 text-[#66755D]">
        {search.trim()
          ? `คำค้น “${search.trim()}” อาจยังไม่ตรงกับชื่อเมนูหรือร้าน ลองใช้คำที่สั้นลง หรือสลับหมวดเพื่อดูเมนูที่ใกล้เคียง`
          : "ตัวกรองตอนนี้ค่อนข้างแคบ ลองล้างหมวดหรือแท็บที่เลือกไว้เพื่อกลับไปดูสินค้าทั้งหมด"}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {search.trim() && (
          <button
            type="button"
            onClick={onClearSearch}
            className="rounded-full bg-[#485B3B] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(72,91,59,0.2)] transition-all duration-300 hover:bg-[#394A31]"
          >
            ล้างคำค้น
          </button>
        )}
        <button
          type="button"
          onClick={onClearFilters}
          className="rounded-full border border-[#485B3B] px-5 py-2.5 text-sm font-semibold text-[#485B3B] transition-all duration-300 hover:bg-[#485B3B] hover:text-white"
        >
          ดูสินค้าทั้งหมด
        </button>
      </div>
    </div>
  );
}

function EmptyShopsState() {
  return (
    <div className="rounded-[2rem] border border-dashed border-[#CAD7BE] bg-white/82 px-6 py-14 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E3ECD7] text-3xl text-[#516548]">
        🏪
      </div>
      <h3 className="mt-5 text-[24px] font-semibold text-[#283824]">ยังไม่มีร้านค้าที่ตรงกับคำค้น</h3>
      <p className="mt-3 text-[15px] leading-7 text-[#66755D]">
        ลองค้นหาด้วยชื่อร้านแบบสั้นลง หรือกลับไปดูรายการร้านทั้งหมดก่อน
      </p>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-[2rem] border border-[#E8D5CF] bg-[linear-gradient(180deg,rgba(255,250,248,0.96),rgba(255,244,239,0.92))] px-6 py-12 text-center shadow-[0_16px_40px_rgba(111,74,62,0.08)]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FDE4DB] text-3xl text-[#9A5B44]">
        !
      </div>
      <h3 className="mt-5 text-[24px] font-semibold text-[#4D2D20]">โหลดข้อมูลร้านค้าไม่สำเร็จ</h3>
      <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-7 text-[#7A574C]">
        ระบบยังดึงรายการสินค้าและร้านค้าไม่ได้ในรอบนี้ คุณสามารถลองใหม่อีกครั้งได้ทันที
        {message ? ` (${message})` : ""}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 rounded-full bg-[#6A4A3C] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#553A2F]"
      >
        ลองใหม่
      </button>
    </div>
  );
}

function CartDrawer({ cart, onClose, onUpdateQty, onCheckout }) {
  const total = cart.reduce((sum, item) => sum + Number(item.price ?? 0) * item.qty, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Close cart overlay"
        onClick={onClose}
        className="flex-1 bg-[#1A2118]/35 backdrop-blur-[2px]"
      />

      <aside className="flex h-full w-full max-w-md flex-col border-l border-[#DCE4D1] bg-[#F6F8F0] shadow-[0_28px_80px_rgba(22,33,21,0.22)]">
        <div className="border-b border-[#D9E2CF] bg-white/78 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#8BA07A]">Cart drawer</p>
              <h2 className="mt-1 text-[24px] font-semibold text-[#24321F]">ตะกร้าสินค้า</h2>
              <p className="mt-1 text-sm text-[#6A785F]">{itemCount} รายการที่พร้อมไปต่อยังขั้นตอนชำระเงิน</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#D7E0CD] bg-white p-2 text-[#48603C] transition-all duration-300 hover:bg-[#EDF2E5]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                <path strokeLinecap="round" d="M6 6 18 18M18 6 6 18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {cart.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-[#D3DDC8] bg-white px-6 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E3ECD7] text-3xl text-[#516548]">
                🛒
              </div>
              <h3 className="mt-5 text-[22px] font-semibold text-[#2A3826]">ตะกร้ายังว่าง</h3>
              <p className="mt-3 text-sm leading-7 text-[#6A785F]">
                ลองเริ่มจากเมนูที่สะดุดตาหรือกดหมวดที่สนใจ แล้วระบบจะเก็บไว้ให้ตรงนี้ทันที
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="rounded-[1.75rem] border border-[#E3EADF] bg-white px-4 py-4 shadow-[0_14px_32px_rgba(72,91,59,0.08)]"
              >
                <div className="flex gap-3">
                  <div className="h-16 w-16 overflow-hidden rounded-[1.25rem] bg-[#EDF2E5]">
                    {item.img ? (
                      <img src={item.img} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl text-[#54684B]">☕</div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="truncate text-[15px] font-semibold text-[#23311F]">{item.name}</p>
                        <p className="mt-1 text-xs text-[#86957A]">{item.tag || "Tea selection"}</p>
                      </div>
                      <p className="text-sm font-semibold text-[#405336]">{formatPrice(item.price)}</p>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="inline-flex items-center gap-2 rounded-full bg-[#F4F7EE] px-2 py-1">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.id, item.qty - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#526449] shadow-sm transition-colors duration-300 hover:bg-[#E8EEE0]"
                        >
                          -
                        </button>
                        <span className="min-w-6 text-center text-sm font-semibold text-[#2C3C28]">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.id, item.qty + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#AFC19A] text-white transition-colors duration-300 hover:bg-[#9AB383]"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.id, 0)}
                        className="text-sm font-medium text-[#8A675A] transition-colors duration-300 hover:text-[#6A4A3C]"
                      >
                        ลบออก
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-[#D9E2CF] bg-white/86 px-6 py-5">
          <div className="mb-4 flex items-center justify-between text-sm text-[#6C7B61]">
            <span>รวมรายการ</span>
            <span>{itemCount} ชิ้น</span>
          </div>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-sm text-[#7A8A6F]">ยอดรวมโดยประมาณ</p>
              <p className="text-[28px] font-semibold text-[#23311F]">{formatPrice(total)}</p>
            </div>
            <p className="max-w-[10rem] text-right text-xs leading-5 text-[#7A8A6F]">ยังไม่รวมค่าจัดส่งหรือค่าธรรมเนียมที่อาจเกิดขึ้น</p>
          </div>

          <button
            type="button"
            disabled={cart.length === 0}
            onClick={onCheckout}
            className={`w-full rounded-full py-3 text-sm font-semibold transition-all duration-300 ${
              cart.length === 0
                ? "cursor-not-allowed bg-[#E6E9E0] text-[#93A08C]"
                : "bg-[#485B3B] text-white shadow-[0_16px_36px_rgba(72,91,59,0.22)] hover:bg-[#394A31]"
            }`}
          >
            ไปหน้าชำระเงิน
          </button>
        </div>
      </aside>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[...Array(8)].map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[2rem] border border-[#E2E8D8] bg-white/80 shadow-[0_18px_42px_rgba(72,91,59,0.08)]"
        >
          <div className="aspect-[4/3] animate-pulse bg-[#DCE5D1]" />
          <div className="space-y-3 px-5 py-5">
            <div className="h-3 w-24 animate-pulse rounded-full bg-[#E7EDE1]" />
            <div className="h-5 w-3/4 animate-pulse rounded-full bg-[#E7EDE1]" />
            <div className="h-4 w-full animate-pulse rounded-full bg-[#EEF3E8]" />
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-[#EEF3E8]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ShopHome() {
  const navigate = useNavigate();
  const currentUserId = getUserIdFromToken();
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [cart, setCart] = usePersistentCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [activeView, setActiveView] = useState("products");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([api.getProducts(), api.getShops(), api.getShopImages(), api.getProductImages()])
      .then(([productRows, shopRows, shopImages, productImages]) => {
        const shopImageMap = new Map();
        shopImages.forEach((image) => {
          if (!shopImageMap.has(image.shop_id) && image.image_path) {
            shopImageMap.set(image.shop_id, toAssetUrl(image.image_path));
          }
        });

        const productImageMap = new Map();
        productImages.forEach((image) => {
          if (!productImageMap.has(image.product_id) && image.image_path) {
            productImageMap.set(image.product_id, toAssetUrl(image.image_path));
          }
        });

        const normalizedShops = shopRows.map((shop) => ({
          ...normalizeShop(shop),
          img: shopImageMap.get(shop.shop_id) || null,
        }));

        const shopsById = new Map(normalizedShops.map((shop) => [shop.id, shop]));
        const normalizedProducts = productRows.map((product) => {
          const normalizedProduct = normalizeProduct(product, shopsById, productImageMap);

          return {
            ...normalizedProduct,
            isOwnProduct:
              currentUserId != null &&
              normalizedProduct.ownerUserId != null &&
              Number(currentUserId) === Number(normalizedProduct.ownerUserId),
          };
        });

        setProducts(normalizedProducts);
        setShops(normalizedShops);
        setLoading(false);
      })
      .catch((fetchError) => {
        setError(fetchError.message);
        setLoading(false);
      });
  }, [currentUserId, refreshKey]);

  const filteredProducts = useMemo(
    () => filterProducts(products, { search, activeTab, activeCategory }),
    [products, search, activeTab, activeCategory]
  );

  const filteredShops = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return shops;
    return shops.filter((shop) => {
      return (
        shop.name?.toLowerCase().includes(query) ||
        shop.location?.toLowerCase().includes(query) ||
        shop.description?.toLowerCase().includes(query)
      );
    });
  }, [shops, search]);

  const addToCart = useCallback(
    (product) => {
      setCart((previous) => {
        const existing = previous.find((item) => item.id === product.id);
        if (existing) {
          return previous.map((item) =>
            item.id === product.id ? { ...item, qty: item.qty + 1 } : item
          );
        }

        return [...previous, { ...product, qty: 1 }];
      });
    },
    [setCart]
  );

  const updateQty = useCallback(
    (id, qty) => {
      if (qty <= 0) {
        setCart((previous) => previous.filter((item) => item.id !== id));
        return;
      }

      setCart((previous) =>
        previous.map((item) => (item.id === id ? { ...item, qty } : item))
      );
    },
    [setCart]
  );

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const clearFilters = () => {
    setSearch("");
    setActiveCategory(null);
    setActiveTab(TABS[0]);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F7F5ED_0%,#F4F6EF_40%,#F6F2E8_100%)] text-[#253622]">
      <SiteNavbar active="shop" showCart={false} />

      <main className="relative overflow-hidden px-4 pb-16 pt-6 sm:px-6 xl:px-8 2xl:px-10">
        <div className="pointer-events-none absolute left-[-10rem] top-[8rem] h-[20rem] w-[20rem] rounded-full bg-[#DCE8CF]/60 blur-3xl" />
        <div className="pointer-events-none absolute right-[-6rem] top-[22rem] h-[18rem] w-[18rem] rounded-full bg-[#F0E4D1]/65 blur-3xl" />

        <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-8">
          <section>
            {false && (
              <div className="overflow-hidden rounded-[2.25rem] border border-[#DEE5D4] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(245,248,239,0.88))] p-6 shadow-[0_30px_80px_rgba(72,91,59,0.12)] sm:p-8">
              <p className="text-xs uppercase tracking-[0.24em] text-[#7E9270]">ATC Tea Market</p>
              <div className="mt-5 max-w-3xl space-y-5">
                <h1 className="max-w-2xl text-[2.2rem] font-semibold leading-[1.05] text-[#22321D] sm:text-[3.5rem]">
                  หน้า shop ที่ค้นหาเมนูชาได้ไวขึ้น แต่ยังคงบรรยากาศอบอุ่นแบบร้านจริง
                </h1>
                <p className="max-w-xl text-[15px] leading-7 text-[#627059] sm:text-[16px]">
                  เหมาะกับคนที่อยากเริ่มจากสินค้า หรือเริ่มจากร้านก็ได้ในหน้าเดียว พร้อมตะกร้าที่พร้อมใช้งานต่อทันที
                </p>
              </div>

              <div className="mt-8 max-w-2xl">
                <SearchBar value={search} onChange={setSearch} />
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {["ชาเขียว", "ชาไทย", "ร้านแนะนำ", "พร้อมส่งวันนี้"].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-[#D8E0CF] bg-white/78 px-3.5 py-1.5 text-sm text-[#5A684F]"
                  >
                    {label}
                  </span>
                ))}
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  { label: "เมนูทั้งหมด", value: `${products.length || "--"} รายการ` },
                  { label: "ร้านค้าที่เข้าร่วม", value: `${shops.length || "--"} ร้าน` },
                  { label: "ในตะกร้าตอนนี้", value: `${cartCount} ชิ้น` },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.6rem] border border-[#E2E8D8] bg-white/72 px-4 py-4"
                  >
                    <p className="text-sm text-[#7C8C70]">{item.label}</p>
                    <p className="mt-1 text-[1.25rem] font-semibold text-[#263621]">{item.value}</p>
                  </div>
                ))}
              </div>
              </div>
            )}

            <div className="overflow-hidden rounded-[2.25rem] border border-[#DEE5D4] bg-white/86 shadow-[0_30px_80px_rgba(72,91,59,0.12)]">
              <Swiper
                modules={[Pagination, Autoplay]}
                slidesPerView={1}
                loop
                autoplay={{ delay: 4200, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                className="h-full"
              >
                {HERO_SLIDES.map((slide) => (
                  <SwiperSlide key={slide.title}>
                    <div className="relative h-full min-h-[72vh] max-h-[860px]">
                      <img src={slide.image} alt={slide.title} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(19,29,16,0.06)_0%,rgba(19,29,16,0.68)_100%)]" />
                      <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8 lg:p-12">
                        <p className="text-xs uppercase tracking-[0.24em] text-white/75">{slide.eyebrow}</p>
                        <h2 className="mt-3 max-w-2xl text-[1.9rem] font-semibold leading-tight sm:text-[2.4rem] lg:text-[3rem]">{slide.title}</h2>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/78 sm:text-[15px] lg:text-base">{slide.description}</p>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#DFE6D6] bg-white/72 p-5 shadow-[0_18px_48px_rgba(72,91,59,0.08)] backdrop-blur-sm sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#879A78]">Browse modes</p>
                <h2 className="mt-2 text-[1.55rem] font-semibold text-[#253621]">สลับดูสินค้าและร้านได้โดยไม่เปลี่ยนหน้า</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-[#66755D]">
                  ใช้ตัวกรองเพื่อไล่จากกว้างไปแคบ และยังคงเห็นภาพรวมของร้านชาในโทนเดียวกัน
                </p>
              </div>
              <ViewToggle activeView={activeView} onChange={setActiveView} />
            </div>

            <div className="mt-5">
              <SearchBar value={search} onChange={setSearch} />
            </div>

            {activeView === "products" && (
              <div className="mt-5 space-y-4">
                <TabBar tabs={TABS} active={activeTab} onSelect={setActiveTab} />
                <CategoryBar categories={CATEGORIES} active={activeCategory} onSelect={setActiveCategory} />
              </div>
            )}
          </section>

          <section className="space-y-6">
            {error ? (
              <ErrorState message={error} onRetry={() => setRefreshKey((value) => value + 1)} />
            ) : activeView === "products" ? (
              <>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#879A78]">Product listing</p>
                    <h2 className="mt-2 text-[1.9rem] font-semibold text-[#253621]">
                      {getSectionTitle(search, activeTab, activeCategory)}
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-[#66755D]">
                      {getSectionDescription(search, activeTab, activeCategory)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {!loading && (
                      <span className="rounded-full bg-white/78 px-4 py-2 text-sm text-[#5F6D55] ring-1 ring-[#D9E2CF]">
                        {filteredProducts.length} รายการ
                      </span>
                    )}
                    {(search || activeCategory || activeTab !== TABS[0]) && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="rounded-full border border-[#485B3B] px-4 py-2 text-sm font-semibold text-[#485B3B] transition-all duration-300 hover:bg-[#485B3B] hover:text-white"
                      >
                        ล้างตัวกรอง
                      </button>
                    )}
                  </div>
                </div>

                {loading ? (
                  <LoadingState />
                ) : filteredProducts.length === 0 ? (
                  <EmptyProductsState
                    search={search}
                    onClearSearch={() => setSearch("")}
                    onClearFilters={clearFilters}
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#879A78]">Shops</p>
                    <h2 className="mt-2 text-[1.9rem] font-semibold text-[#253621]">
                      {search.trim() ? `ร้านค้าที่ตรงกับ “${search.trim()}”` : "ร้านชาทั้งหมด"}
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-[#66755D]">
                      เลือกดูร้านก่อนแล้วค่อยเจาะไปยังเมนูที่เหมาะกับสไตล์ของแต่ละร้าน
                    </p>
                  </div>

                  {!loading && (
                    <span className="rounded-full bg-white/78 px-4 py-2 text-sm text-[#5F6D55] ring-1 ring-[#D9E2CF]">
                      {filteredShops.length} ร้าน
                    </span>
                  )}
                </div>

                {loading ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {[...Array(4)].map((_, index) => (
                      <div
                        key={index}
                        className="h-44 animate-pulse rounded-[2rem] border border-[#E2E8D8] bg-white/80"
                      />
                    ))}
                  </div>
                ) : filteredShops.length === 0 ? (
                  <EmptyShopsState />
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] gap-5">
                    {filteredShops.map((shop) => (
                      <ShopCard key={shop.id} shop={shop} />
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          <section className="overflow-hidden rounded-[2.25rem] border border-[#DCE4D3] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(240,244,233,0.86))] px-6 py-8 shadow-[0_24px_70px_rgba(72,91,59,0.1)] sm:px-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#829473]">Open your own shop</p>
                <h2 className="mt-3 text-[2rem] font-semibold leading-tight text-[#253621]">
                  ถ้ามีร้านชาอยู่แล้ว ส่วนนี้ควรชวนให้เข้าระบบต่อได้อย่างมั่นใจ
                </h2>
                <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#66755D]">
                  เราเก็บ section นี้ไว้ แต่จัดให้น้ำหนักเบาลงกว่าเดิม เพื่อไม่แย่งความสนใจจากสินค้าและร้านที่ผู้ใช้กำลังดูอยู่
                </p>
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                <button
                  type="button"
                  className="rounded-full bg-[#485B3B] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(72,91,59,0.2)] transition-all duration-300 hover:bg-[#394A31]"
                >
                  เปิดร้านเลย
                </button>
                <button
                  type="button"
                  className="rounded-full border border-[#485B3B] px-6 py-3 text-sm font-semibold text-[#485B3B] transition-all duration-300 hover:bg-[#485B3B] hover:text-white"
                >
                  เรียนรู้เพิ่มเติม
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {cartOpen && (
        <CartDrawer
          cart={cart}
          onClose={() => setCartOpen(false)}
          onUpdateQty={updateQty}
          onCheckout={() => {
            setCartOpen(false);
            navigate("/checkout");
          }}
        />
      )}
      <FloatingCartButton cartCount={cartCount} onClick={() => setCartOpen(true)} />
    </div>
  );
}
