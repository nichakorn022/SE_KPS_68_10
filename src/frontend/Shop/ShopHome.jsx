import {useState, useEffect, useCallback} from "react";
import { Link } from 'react-router-dom';
import { apiUrl, assetUrl } from '../../lib/api';
import SiteNavbar from '../components/SiteNavbar';
import FloatingCartButton from '../components/FloatingCartButton';
import usePersistentCart from '../hooks/usePersistentCart';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';


const api = {
    getProducts: () => fetch(apiUrl("/products")).then(r => {
        if (!r.ok) {
            throw new Error(`Products ${r.status}`);
        }
        return r.json();
    }),
    getShops: () => fetch(apiUrl("/shops")).then(r => {
        if (!r.ok) {
            throw new Error(`Shops ${r.status}`);
        }
        return r.json();
    }),
    getShopImages: () => fetch(apiUrl("/shop-images")).then(r => {
        if (!r.ok) {
            throw new Error(`Shop images ${r.status}`);
        }
        return r.json();
    }),
    getProductImages: () => fetch(apiUrl("/product-images")).then(r => {
        if (!r.ok) {
            throw new Error(`Product images ${r.status}`);
        }
        return r.json();
    }),
    getProduct: (id) => fetch(apiUrl(`/products/${id}`)).then(r => {
        if (!r.ok) {
            throw new Error(`Product ${id} ${r.status}`);
        }
        return r.json();
    })
};

const TAB = ["All", "New Arrivals", "Best Sellers", "On Sale"];
const CATEGORY = ["Green Tea", "Black Tea", "Oolong Tea", "White Tea", "Herbal Tea"];

function normalizeShop(shop) {
    return {
        ...shop,
        id: shop.shop_id,
        name: shop.shop_name,
        location: [shop.subdistrict, shop.district, shop.province].filter(Boolean).join(", "),
        rating: shop.verified_status ? "Verified" : null,
        img: null
    };
}

function toAssetUrl(imagePath) {
     return assetUrl(imagePath);
}

function normalizeProduct(product, shopsById, productImageMap) {
    const shop = shopsById.get(product.shop_id);

    return {
        ...product,
        id: product.product_id,
        name: product.tea_name,
        tag: product.tea_type,
        shop: shop?.name || `Shop #${product.shop_id}`,
        img: productImageMap.get(product.product_id) || null,
        isNew: false,
        isBestSeller: false,
        isOnSale: false,
        discount: 0
    };
}

function filterProducts(products, {search, activeTab, activeCategory}) {
    const q = search.toLowerCase();
    return products.filter(p => {
        const matchSearch   = !q || p.name?.toLowerCase().includes(q) || p.shop?.toLowerCase().includes(q);
        const matchCategory = !activeCategory || p.tag === activeCategory;
        const matchTab = 
            activeTab === "All" ||
            (activeTab === "New Arrivals" && p.isNew) ||
            (activeTab === "Best Sellers" && p.isBestSeller) ||
            (activeTab === "On Sale" && p.isOnSale);
        return matchSearch && matchCategory && matchTab;
    });
}

function Navbar({ cartCount, onCartClick, openLogin, openRegister }) {
  return (
    <nav className="flex items-center justify-between px-8 py-2 bg-[#AEBC9F] w-full sticky top-0 z-50 shadow-sm">
      
      <div className="flex items-center justify-start h-16 w-32 md:w-40">
        <img src="/Pictrue/Logo.png" alt="ATC Logo" className="h-full w-auto object-contain drop-shadow-sm" />
      </div>
      <div className="flex items-center gap-6 md:gap-12 text-[17px] font-medium text-[#4a4a4a] pr-4">
        
        <Link to="/" className="rounded-full px-4 py-2 transition-all hover:bg-[#485B3B]/12 hover:text-[#485B3B]">
          Home
        </Link>

        <Link to="/shop" className="rounded-full px-4 py-2 transition-all bg-[#485B3B]/12 text-[#485B3B] font-bold">
          Shop
        </Link>

        <Link to="/events" className="rounded-full px-4 py-2 transition-all hover:bg-[#485B3B]/12 hover:text-[#485B3B]">
          Event
        </Link>

        <div className="h-8 w-px bg-black/20" />

        {/* Cart */}
        <button
          onClick={onCartClick}
          className="relative rounded-full px-4 py-2 transition-all hover:bg-[#485B3B]/12 hover:text-[#485B3B]">
          🛒
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#485B3B] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>

        {/* Login */}
        <button
          onClick={openLogin}
          className="rounded-full px-4 py-2 transition-all hover:bg-[#485B3B]/12 hover:text-[#485B3B] bg-transparent border-none cursor-pointer font-medium text-[17px] text-[#4a4a4a]">
          Login
        </button>
        <button
          onClick={openRegister}
          className="rounded-full px-4 py-2 transition-all hover:bg-[#485B3B]/12 hover:text-[#485B3B] bg-transparent border-none cursor-pointer font-medium text-[17px] text-[#4a4a4a]">
          Register
        </button>
      </div>
    </nav>
  );
}

function SearchBar({ value, onChange }) {
  return (
    <div className="relative max-w-md w-full">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
      <input
        type="text"
        placeholder="ค้นหาสินค้า หรือร้านค้า..."
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full pl-11 pr-4 py-3 rounded-full border border-[#AEBC9F] bg-white text-[15px] focus:outline-none focus:ring-2 focus:ring-[#485B3B]/30 shadow-sm"
      />
    </div>
  );
}

function TabBar({ tabs, active, onSelect }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onSelect(tab)}
          className={`px-6 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${
            active === tab
              ? "bg-[#485B3B] text-white shadow-md"
              : "bg-white text-[#485B3B] border border-[#485B3B]/30 hover:bg-[#485B3B]/10"
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
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => onSelect(null)}
        className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
          !active
            ? "bg-[#AEBC9F] text-white"
            : "bg-white text-gray-500 border border-gray-200 hover:border-[#AEBC9F]"
        }`}
      >
        ทั้งหมด
      </button>
      {categories.map(cat => (
        <button
          key={cat}
          onClick={() => onSelect(cat === active ? null : cat)}
          className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
            active === cat
              ? "bg-[#AEBC9F] text-white"
              : "bg-white text-gray-500 border border-gray-200 hover:border-[#AEBC9F]"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

function ProductCard({ product }) {
  return (
    <Link to={`/product/${product.id}`} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 group">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#F5F3E9]">
        {product.img ? (
          <img
            src={product.img}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🍵</div>
        )}
        {product.badge && (
          <span className="absolute top-3 left-3 bg-[#485B3B] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow">
            {product.badge}
          </span>
        )}
        {product.isNew && (
          <span className="absolute top-3 right-3 bg-[#AEBC9F] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow">
            ใหม่
          </span>
        )}
        {product.discount > 0 && (
          <span className="absolute bottom-3 right-3 bg-red-400 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow">
            -{product.discount}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col px-3.5 pb-3 pt-3">
        <p className="mb-0.5 truncate text-[12px] font-medium text-[#AEBC9F]">{product.shop || "ATC Shop"}</p>
        <div className="mb-1 flex items-start justify-between gap-1.5">
          <h3 className="min-w-0 flex-1 text-[15px] font-bold text-gray-800 leading-snug line-clamp-2">{product.name}</h3>
          {product.tag && (
            <span className="inline-flex w-fit max-w-[45%] flex-shrink-0 self-start whitespace-nowrap rounded-full border border-[#AEBC9F]/70 px-2 py-0.5 text-[10px] text-[#485B3B]">
              {product.tag}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function ShopCard({ shop }) {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all">
      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#F5F3E9] flex-shrink-0">
        {shop.img ? (
          <img src={shop.img} alt={shop.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">🏪</div>
        )}
      </div>
      <div className="min-w-0">
        <h4 className="font-bold text-gray-800 text-[15px] truncate">{shop.name}</h4>
        <p className="text-[12px] text-gray-400 truncate">{shop.location || "ร้านชาออนไลน์"}</p>
        {shop.rating && (
          <p className="text-[12px] text-[#AEBC9F] font-medium">⭐ {shop.rating}</p>
        )}
      </div>
      <Link
        to={`/shop/${shop.id}`}
        className="ml-auto flex-shrink-0 border border-[#485B3B] text-[#485B3B] text-[12px] font-bold px-4 py-1.5 rounded-full hover:bg-[#485B3B] hover:text-white transition-all"
      >
        ดูร้าน
      </Link>
    </div>
  );
}

function CartDrawer({ cart, onClose, onRemove, onUpdateQty }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

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
          ) : cart.map(item => (
            <div key={item.id} className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#F5F3E9] flex-shrink-0">
                {item.img ? <img src={item.img} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">🍵</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[13px] text-gray-800 truncate">{item.name}</p>
                <p className="text-[#485B3B] font-medium text-[13px]">฿{item.price?.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => onUpdateQty(item.id, item.qty - 1)} className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 flex items-center justify-center">−</button>
                <span className="w-6 text-center text-[14px] font-bold">{item.qty}</span>
                <button onClick={() => onUpdateQty(item.id, item.qty + 1)} className="w-7 h-7 rounded-full bg-[#AEBC9F] text-white font-bold hover:brightness-95 flex items-center justify-center">+</button>
              </div>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-[#AEBC9F]/30">
            <div className="flex justify-between mb-4">
              <span className="font-medium text-gray-600">รวมทั้งหมด</span>
              <span className="font-bold text-[20px] text-[#485B3B]">฿{total.toLocaleString()}</span>
            </div>
            <button className="w-full bg-[#485B3B] text-white py-3 rounded-full font-bold hover:bg-[#3a4a2f] transition-all shadow-lg active:scale-95">
              ชำระเงิน
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm animate-pulse">
          <div className="aspect-[4/3] bg-[#AEBC9F]/20" />
          <div className="p-4 space-y-2">
            <div className="h-3 bg-gray-100 rounded-full w-1/2" />
            <div className="h-4 bg-gray-100 rounded-full w-3/4" />
            <div className="h-4 bg-gray-100 rounded-full w-1/3 mt-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
//  MAIN COMPONENT
// ============================================================
export default function ShopHome() {
  const [products, setProducts]           = useState([]);
  const [shops, setShops]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [search, setSearch]               = useState("");
  const [activeTab, setActiveTab]         = useState(TAB[0]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [cart, setCart]                   = usePersistentCart();
  const [cartOpen, setCartOpen]           = useState(false);
  const [activeView, setActiveView]       = useState("products"); 

  // ── Fetch ──────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([api.getProducts(), api.getShops(), api.getShopImages(), api.getProductImages()])
      .then(([prods, shps, shopImages, productImages]) => {
        const shopImageMap = new Map();
        shopImages.forEach(image => {
          if (!shopImageMap.has(image.shop_id) && image.image_path) {
            shopImageMap.set(image.shop_id, toAssetUrl(image.image_path));
          }
        });

        const productImageMap = new Map();
        productImages.forEach(image => {
          if (!productImageMap.has(image.product_id) && image.image_path) {
            productImageMap.set(image.product_id, toAssetUrl(image.image_path));
          }
        });

        const normalizedShops = shps.map(shop => ({
          ...normalizeShop(shop),
          img: shopImageMap.get(shop.shop_id) || null
        }));
        const shopsById = new Map(normalizedShops.map(shop => [shop.id, shop]));
        const normalizedProducts = prods.map(product =>
          normalizeProduct(product, shopsById, productImageMap)
        );

        setProducts(normalizedProducts);
        setShops(normalizedShops);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // ── Filtering ──────────────────────────────────────────────
  const filtered = filterProducts(products, { search, activeTab, activeCategory });

  // ── Cart ───────────────────────────────────────────────────
  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  }, []);

  const updateQty = useCallback((id, qty) => {
    if (qty <= 0) setCart(prev => prev.filter(i => i.id !== id));
    else setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  }, []);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F3E9] font-sans text-gray-800 flex flex-col items-center">
      <div className="w-full max-w-auto bg-[#F5F3E9] shadow-sm overflow-hidden">

        {/* Navbar */}
        <SiteNavbar active="shop" />

        {/* Hero Banner */}
        <section className="w-full px-4 md:px-6 pt-8">
          <div className="group relative w-full max-w-[1400px] h-[400px] mx-auto overflow-hidden rounded-[28px] shadow-sm">
          <Swiper modules={[Pagination, Navigation, Autoplay]} spaceBetween={20} slidesPerView={1} loop={true} autoplay={{ delay: 4000 }} navigation={{ nextEl: '.s1-next', prevEl: '.s1-prev' }} pagination={{ clickable: true, el: '.s1-pagination' }} className="h-full w-full">
          {["https://i.pinimg.com/originals/f7/38/89/f7388986e1bd9f2d4fd063f2dda835f8.jpg", "https://files.idyllic.app/files/static/4461046", "https://cplusdesign.lk/wp-content/uploads/2023/12/Small-Tea-Shop-Design-Ideas-1-450x450.jpg"].map((src,i)=>(
            <SwiperSlide key={i}>
            <div className="h-full w-full overflow-hidden rounded-3xl shadow-lg">
              <img src={src} className="w-full h-full object-cover" />
            </div>
          </SwiperSlide>))}
          </Swiper>
          <div className="s1-prev absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer text-[#485B3B] hover:bg-[#485B3B] hover:text-white transition-all opacity-0 group-hover:opacity-100 hidden md:flex">❮</div>
          <div className="s1-next absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer text-[#485B3B] hover:bg-[#485B3B] hover:text-white transition-all opacity-0 group-hover:opacity-100 hidden md:flex">❯</div>
          <div className="s1-pagination flex justify-center gap-2 mt-[-30px]"></div>
          </div>
        </section>

        {/* Controls */}
        <section className="px-6 py-6 space-y-4 border-b border-[#AEBC9F]/20">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <SearchBar value={search} onChange={setSearch} />
            {/* Products / Shops toggle */}
            <div className="flex rounded-full overflow-hidden border border-[#AEBC9F]/50 bg-white shadow-sm">
              <button
                onClick={() => setActiveView("products")}
                className={`px-5 py-2 text-sm font-bold transition-all ${activeView === "products" ? "bg-[#485B3B] text-white" : "text-[#485B3B]"}`}
              >
                สินค้า
              </button>
              <button
                onClick={() => setActiveView("shops")}
                className={`px-5 py-2 text-sm font-bold transition-all ${activeView === "shops" ? "bg-[#485B3B] text-white" : "text-[#485B3B]"}`}
              >
                ร้านค้า
              </button>
            </div>
          </div>

          {activeView === "products" && (
            <>
              <TabBar tabs={TAB} active={activeTab} onSelect={setActiveTab} />
              <CategoryBar categories={CATEGORY} active={activeCategory} onSelect={setActiveCategory} />
            </>
          )}
        </section>

        {/* Content */}
        <section className="px-6 py-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 mb-6 text-sm">
              ⚠️ ไม่สามารถโหลดข้อมูลได้: {error}
            </div>
          )}

          {activeView === "products" ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[20px] font-bold text-[#485B3B]">
                  {activeTab}
                  {activeCategory && <span className="text-[#AEBC9F] font-medium"> · {activeCategory}</span>}
                </h2>
                {!loading && (
                  <span className="text-sm text-gray-400">{filtered.length} รายการ</span>
                )}
              </div>

              {loading ? (
                <LoadingState />
              ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <p className="text-4xl mb-3">🍵</p>
                  <p>ไม่พบสินค้าที่ค้นหา</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {filtered.map((product, i) => (
                    <ProductCard key={product.id ?? i} product={product} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="text-[20px] font-bold text-[#485B3B] mb-6">ร้านค้าทั้งหมด</h2>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-3xl p-5 h-20 animate-pulse" />
                  ))}
                </div>
              ) : shops.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <p className="text-4xl mb-3">🏪</p>
                  <p>ยังไม่มีร้านค้า</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shops.map((shop, i) => (
                    <ShopCard key={shop.id ?? i} shop={shop} />
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {/* CTA Section — same style as Home */}
        <section className="py-12 px-6 max-w-[850px] mx-auto text-center">
          <div className="bg-white/50 rounded-3xl p-8 border border-white/40 shadow-sm">
            <h2 className="text-[22px] font-bold text-gray-800 mb-2">มีร้านชาของคุณเองไหม?</h2>
            <p className="text-gray-500 text-[15px] mb-6">เปิดร้านบน ATC แล้วเข้าถึงชุมชนคนรักชากว่าพันคน</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <button className="bg-[#485B3B] text-white px-10 py-3 rounded-full font-bold shadow-lg hover:bg-[#3a4a2f] transition-all active:scale-95">เปิดร้านเลย</button>
              <button className="bg-white text-[#485B3B] border-2 border-[#485B3B] px-10 py-3 rounded-full font-bold hover:bg-[#485B3B] hover:text-white transition-all">เรียนรู้เพิ่มเติม</button>
            </div>
          </div>
        </section>

      </div>

      {/* Cart Drawer */}
      {cartOpen && (
        <CartDrawer
          cart={cart}
          onClose={() => setCartOpen(false)}
          onRemove={(id) => updateQty(id, 0)}
          onUpdateQty={updateQty}
        />
      )}
      <FloatingCartButton cartCount={cartCount} onClick={() => setCartOpen(true)} />
    </div>
  );
}
