import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiUrl, assetUrl } from "../../lib/api";
import SiteNavbar from "../components/SiteNavbar";
import FloatingCartButton from "../components/FloatingCartButton";
import usePersistentCart from "../hooks/usePersistentCart";

const TABS = ["Overview", "Product", "Events", "About"];

const api = {
  getShop: (id) =>
    fetch(apiUrl(`/shops/${id}`)).then((r) => {
      if (!r.ok) throw new Error(`Shop ${id} ${r.status}`);
      return r.json();
    }),
  getShopImages: (shopId) =>
    fetch(apiUrl(`/shop-images/shop/${shopId}`)).then((r) => {
      if (!r.ok) throw new Error(`Shop images ${shopId} ${r.status}`);
      return r.json();
    }),
  getProducts: () =>
    fetch(apiUrl("/products")).then((r) => {
      if (!r.ok) throw new Error(`Products ${r.status}`);
      return r.json();
    }),
  getProductImages: () =>
    fetch(apiUrl("/product-images")).then((r) => {
      if (!r.ok) throw new Error(`Product images ${r.status}`);
      return r.json();
    }),
  getEvents: () =>
    fetch(apiUrl("/events")).then((r) => {
      if (!r.ok) throw new Error(`Events ${r.status}`);
      return r.json();
    }),
};

function toAssetUrl(path) {
  return path ? assetUrl(path) : null;
}

function getLocation(shop) {
  return [shop?.subdistrict, shop?.district, shop?.province].filter(Boolean).join(", ");
}

function formatPrice(price) {
  return `฿${Number(price ?? 0).toLocaleString()}`;
}

function formatDate(date) {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(date) {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ContactIcon({ type }) {
  const className = "h-4 w-4 text-[#485B3B]";

  switch (type) {
    case "location":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s6-4.35 6-10a6 6 0 1 0-12 0c0 5.65 6 10 6 10Z" />
          <circle cx="12" cy="11" r="2.5" />
        </svg>
      );
    case "address":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75 12 3l8.25 6.75V20.25a.75.75 0 0 1-.75.75H4.5a.75.75 0 0 1-.75-.75V9.75Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 21v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6" />
        </svg>
      );
    case "phone":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 4.75h3l1.5 4-2 1.75a14 14 0 0 0 5 5l1.75-2 4 1.5v3a1 1 0 0 1-1.1 1A15.75 15.75 0 0 1 4.5 5.85a1 1 0 0 1 1-1.1Z" />
        </svg>
      );
    case "website":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M12 3c2.5 2.7 4 5.9 4 9s-1.5 6.3-4 9c-2.5-2.7-4-5.9-4-9s1.5-6.3 4-9Z" />
        </svg>
      );
    case "email":
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <rect x="3" y="5.25" width="18" height="13.5" rx="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6.75 12 13l8-6.25" />
        </svg>
      );
  }
}

function normalizeShop(shop, images, productCount, eventCount) {
  return {
    name: shop.shop_name,
    location: getLocation(shop),
    cover: images[0] || null,
    avatar: images[1] || images[0] || null,
    desc: shop.description || "ร้านนี้ยังไม่มีคำอธิบาย",
    followers: 0,
    products: productCount,
    rating: Number(shop.verified_status) === 1 ? "Verified" : "Pending",
    phone: shop.phone || "-",
    website: shop.contact_info || "-",
    address: shop.address || "-",
    email: shop.email || "-",
    events: eventCount,
  };
}

function normalizeProduct(product, imageMap) {
  return {
    id: product.product_id,
    name: product.tea_name,
    tag: product.tea_type,
    price: Number(product.price ?? 0),
    img: imageMap.get(product.product_id) || null,
    desc: product.description || "ไม่มีรายละเอียดสินค้า",
    isNew: false,
    isBestSeller: false,
  };
}

function normalizeEvent(event) {
  return {
    id: event.event_id,
    title: event.title,
    date: formatDate(event.event_date),
    time: formatTime(event.event_date),
    location: event.location || "-",
    img: null,
    spots: Number(event.max_participant ?? 0),
  };
}

function Navbar({ cartCount, onCartClick, openLogin, openRegister }) {
  return (
    <nav className="flex items-center justify-between px-8 py-2 bg-[#AEBC9F] w-full sticky top-0 z-50 shadow-sm">
      <div className="flex items-center justify-start h-16 w-32 md:w-40">
        <img src="/Pictrue/Logo.png" alt="ATC Logo" className="h-full w-auto object-contain drop-shadow-sm" />
      </div>
      <div className="flex items-center gap-6 md:gap-12 text-[17px] font-medium text-[#4a4a4a] pr-4">
        <Link to="/" className="rounded-full px-4 py-2 transition-all hover:bg-[#485B3B]/12 hover:text-[#485B3B]">Home</Link>
        <Link to="/shop" className="rounded-full px-4 py-2 transition-all bg-[#485B3B]/12 text-[#485B3B] font-bold">Shop</Link>
        <Link to="/events" className="rounded-full px-4 py-2 transition-all hover:bg-[#485B3B]/12 hover:text-[#485B3B]">Event</Link>
        <div className="h-8 w-px bg-black/20" />
        <button
          onClick={onCartClick}
          className="relative rounded-full px-4 py-2 transition-all hover:bg-[#485B3B]/12 hover:text-[#485B3B]"
        >
          🛒
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#485B3B] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
        <button
          onClick={openLogin}
          className="rounded-full px-4 py-2 transition-all hover:bg-[#485B3B]/12 hover:text-[#485B3B] bg-transparent border-none cursor-pointer font-medium text-[17px] text-[#4a4a4a]"
        >
          Login
        </button>
        <button
          onClick={openRegister}
          className="rounded-full px-4 py-2 transition-all hover:bg-[#485B3B]/12 hover:text-[#485B3B] bg-transparent border-none cursor-pointer font-medium text-[17px] text-[#4a4a4a]"
        >
          Register
        </button>
      </div>
    </nav>
  );
}

function ProductCard({ product, onAddToCart }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 group">
      <div className="relative h-36 overflow-hidden bg-[#F5F3E9]">
        {product.img ? (
          <img
            src={product.img}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🍵</div>
        )}
        {product.isNew && (
          <span className="absolute top-2 right-2 bg-[#AEBC9F] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">ใหม่</span>
        )}
        {product.isBestSeller && (
          <span className="absolute top-2 left-2 bg-[#485B3B] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">ขายดี</span>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-[14px] font-bold text-gray-800 leading-snug">{product.name}</h3>
        <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">{product.desc}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-[15px] font-bold text-[#485B3B]">{formatPrice(product.price)}</span>
          <button
            onClick={() => onAddToCart(product)}
            className="bg-[#485B3B] text-white text-[11px] font-bold px-3 py-1.5 rounded-full hover:bg-[#3a4a2f] transition-all active:scale-95"
          >
            + ใส่ตะกร้า
          </button>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({ cart, onClose, onUpdateQty }) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-sm bg-[#F5F3E9] h-full shadow-2xl flex flex-col">
        <div className="p-6 bg-[#AEBC9F] flex items-center justify-between">
          <h2 className="text-[20px] font-bold text-white">ตะกร้าสินค้า 🛒</h2>
          <button onClick={onClose} className="text-white text-2xl hover:opacity-70">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 py-16">
              <p className="text-4xl mb-3">🍵</p>
              <p>ยังไม่มีสินค้าในตะกร้า</p>
            </div>
          ) : cart.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              {item.img ? (
                <img src={item.img} alt={item.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-[#F5F3E9] flex items-center justify-center flex-shrink-0">🍵</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[13px] text-gray-800 truncate">{item.name}</p>
                <p className="text-[#485B3B] font-medium text-[13px]">{formatPrice(item.price)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => onUpdateQty(item.id, item.qty - 1)} className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 flex items-center justify-center">-</button>
                <span className="w-6 text-center text-[14px] font-bold">{item.qty}</span>
                <button onClick={() => onUpdateQty(item.id, item.qty + 1)} className="w-7 h-7 rounded-full bg-[#AEBC9F] text-white font-bold flex items-center justify-center">+</button>
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="p-6 border-t border-[#AEBC9F]/30">
            <div className="flex justify-between mb-4">
              <span className="font-medium text-gray-600">รวมทั้งหมด</span>
              <span className="font-bold text-[20px] text-[#485B3B]">{formatPrice(total)}</span>
            </div>
            <button className="w-full bg-[#485B3B] text-white py-3 rounded-full font-bold hover:bg-[#3a4a2f] transition-all shadow-lg">ชำระเงิน</button>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="px-4 py-4">
      <div className="grid grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl h-60 animate-pulse shadow-sm" />
        ))}
      </div>
    </div>
  );
}

export default function ShopProfile() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("Overview");
  const [cart, setCart] = usePersistentCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      api.getShop(id),
      api.getShopImages(id).catch(() => []),
      api.getProducts(),
      api.getProductImages().catch(() => []),
      api.getEvents().catch(() => []),
    ])
      .then(([shopData, shopImageRows, productRows, productImageRows, eventRows]) => {
        if (!mounted) return;

        const imageMap = new Map();
        productImageRows.forEach((image) => {
          if (!imageMap.has(image.product_id) && image.image_path) {
            imageMap.set(image.product_id, toAssetUrl(image.image_path));
          }
        });

        const shopProducts = productRows
          .filter((product) => String(product.shop_id) === String(shopData.shop_id))
          .map((product) => normalizeProduct(product, imageMap));

        const shopEvents = eventRows
          .filter(
            (event) =>
              String(event.organizer_id) === String(shopData.user_id) ||
              String(event.organizer_id) === String(shopData.shop_id)
          )
          .map(normalizeEvent);

        const shopImages = (Array.isArray(shopImageRows) ? shopImageRows : [])
          .map((image) => toAssetUrl(image.image_path))
          .filter(Boolean);

        setProducts(shopProducts);
        setEvents(shopEvents);
        setShop(normalizeShop(shopData, shopImages, shopProducts.length, shopEvents.length));
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, qty) => {
    if (qty <= 0) setCart((prev) => prev.filter((i) => i.id !== id));
    else setCart((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)));
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="min-h-screen bg-[#F5F3E9] font-sans text-gray-800">
      <SiteNavbar active="shop" />

      {loading ? (
        <>
          <div className="relative">
            <div className="w-full h-44 overflow-hidden bg-[#AEBC9F]/40 animate-pulse" />
            <div className="absolute bottom-0 translate-y-1/2 left-5">
              <div className="w-20 h-20 rounded-full border-4 border-white bg-white animate-pulse shadow-md" />
            </div>
          </div>
          <div className="px-5 pt-14 pb-4">
            <div className="h-6 w-64 bg-white rounded animate-pulse mb-3" />
            <div className="h-4 w-48 bg-white rounded animate-pulse mb-3" />
            <div className="h-16 w-full bg-white rounded animate-pulse" />
          </div>
          <LoadingBlock />
        </>
      ) : error ? (
        <div className="px-5 py-8">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600">
            ไม่สามารถโหลดข้อมูลร้านค้าได้: {error}
          </div>
        </div>
      ) : shop && (
        <>
          <div className="relative">
            <div className="w-full h-44 overflow-hidden">
              {shop.cover ? (
                <img src={shop.cover} alt="cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#485B3B]" />
              )}
            </div>
            <div className="absolute bottom-0 translate-y-1/2 left-5">
              <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden shadow-md bg-white">
                {shop.avatar ? (
                  <img src={shop.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🏪</div>
                )}
              </div>
            </div>
          </div>

          <div className="px-5 pt-14 pb-4">
            <div>
              <h1 className="text-[22px] font-bold text-gray-900 leading-tight">{shop.name}</h1>
              <p className="text-[13px] text-gray-500 mt-0.5">
                {shop.location || "-"}
              </p>
            </div>

            <div className="flex gap-5 mt-3">
              <div className="text-center">
                <p className="text-[15px] font-bold text-[#485B3B]">{shop.products}</p>
                <p className="text-[11px] text-gray-400">สินค้า</p>
              </div>
              <div className="text-center">
                <p className="text-[15px] font-bold text-[#485B3B]">{shop.events}</p>
                <p className="text-[11px] text-gray-400">กิจกรรม</p>
              </div>
              <div className="text-center">
                <p className="text-[15px] font-bold text-[#485B3B]">{shop.rating}</p>
                <p className="text-[11px] text-gray-400">สถานะ</p>
              </div>
            </div>

            <p className="text-[13px] text-gray-600 leading-relaxed mt-3">{shop.desc}</p>
          </div>

          <div className="border-b border-gray-200 px-5 mt-1">
            <div className="flex gap-0">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-[14px] font-semibold transition-all border-b-2 ${
                    activeTab === tab
                      ? "border-[#485B3B] text-[#485B3B]"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-4">
            {activeTab === "Overview" && (
              <div className="grid grid-cols-3 gap-3">
                {products.slice(0, 6).map((product) => (
                  <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
                ))}
              </div>
            )}

            {activeTab === "Product" && (
              <div>
                <p className="text-[13px] text-gray-400 mb-3">{products.length} รายการ</p>
                <div className="grid grid-cols-3 gap-3">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
                  ))}
                </div>
              </div>
            )}

            {activeTab === "Events" && (
              <div className="space-y-4">
                {events.map((ev) => (
                  <div key={ev.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex gap-4 p-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-[#F5F3E9]">
                      {ev.img ? (
                        <img src={ev.img} alt={ev.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">🎟</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[15px] text-gray-800">{ev.title}</h4>
                      <p className="text-[12px] text-gray-400 mt-1">📅 {ev.date} • {ev.time}</p>
                      <p className="text-[12px] text-gray-400">📍 {ev.location}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[11px] text-[#AEBC9F] font-medium">🎟 {ev.spots} ที่นั่ง</span>
                        <button className="bg-[#485B3B] text-white text-[11px] font-bold px-3 py-1.5 rounded-full">สมัคร</button>
                      </div>
                    </div>
                  </div>
                ))}
                {events.length === 0 && (
                  <div className="bg-white rounded-2xl p-5 text-[13px] text-gray-400 shadow-sm">ยังไม่มีกิจกรรมของร้านนี้</div>
                )}
              </div>
            )}

            {activeTab === "About" && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-[15px] text-gray-800 mb-2">เกี่ยวกับร้าน</h3>
                  <p className="text-[13px] text-gray-600 leading-relaxed">{shop.desc}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
                  <h3 className="font-bold text-[15px] text-gray-800">ข้อมูลการติดต่อ</h3>
                  {[
                    { icon: "location", label: shop.location || "-" },
                    { icon: "address", label: shop.address },
                    { icon: "phone", label: shop.phone },
                    { icon: "website", label: shop.website },
                    { icon: "email", label: shop.email },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-[13px] text-gray-600">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#AEBC9F]/20 bg-[#F5F3E9]">
                        <ContactIcon type={item.icon} />
                      </span>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {cartOpen && (
        <CartDrawer
          cart={cart}
          onClose={() => setCartOpen(false)}
          onUpdateQty={updateQty}
        />
      )}
      <FloatingCartButton cartCount={cartCount} onClick={() => setCartOpen(true)} />
    </div>
  );
}
