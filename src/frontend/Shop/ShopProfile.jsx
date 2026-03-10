import { useState } from "react";
import { Link } from "react-router-dom";
const SHOP = {
  name: "Crafted Leaf & Co.",
  location: "เชียงใหม่, ประเทศไทย",
  cover: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=80",
  avatar: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=200&q=80",
  desc: "สัมผัสประสบการณ์ชาคุณภาพจากแหล่งสูงต้นเดี่ยว ทั้งชาเดี่ยว (Single-origin) และเมนูเครื่องดื่มริงสรรค์ด้วยความใส่ใจ ในบรรยากาศกลมสนิท อบอุ่น และเป็นกันเอง เราบ่มเพาะความสัมพันธ์ที่ยอดเยี่ยมกันในทุกถ้วย",
  followers: 1240,
  products: 38,
  rating: 4.9,
};

const PRODUCTS = [
  { id: 1, name: "Jasmine Tea", tag: "Green Tea", price: 320, img: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&q=80", desc: "ชาเขียวหอมดอกมะลิ ชงสดใหม่ทุกวัน ให้ความรู้สึกผ่อนคลายและสดชื่น", isNew: true },
  { id: 2, name: "Jasmine Tea", tag: "Green Tea", price: 320, img: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80", desc: "ชาเขียวหอมดอกมะลิ ชงสดใหม่ทุกวัน ให้ความรู้สึกผ่อนคลายและสดชื่น" },
  { id: 3, name: "Jasmine Tea", tag: "Oolong Tea", price: 290, img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80", desc: "ชาเขียวหอมดอกมะลิ ชงสดใหม่ทุกวัน ให้ความรู้สึกผ่อนคลายและสดชื่น", isBestSeller: true },
  { id: 4, name: "Jasmine Tea", tag: "Black Tea", price: 350, img: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80", desc: "ชาเขียวหอมดอกมะลิ ชงสดใหม่ทุกวัน ให้ความรู้สึกผ่อนคลายและสดชื่น" },
  { id: 5, name: "Jasmine Tea", tag: "White Tea", price: 410, img: "https://images.unsplash.com/photo-1543657774-3f9570fba823?w=400&q=80", desc: "ชาเขียวหอมดอกมะลิ ชงสดใหม่ทุกวัน ให้ความรู้สึกผ่อนคลายและสดชื่น" },
  { id: 6, name: "Jasmine Tea", tag: "Green Tea", price: 280, img: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&q=80", desc: "ชาเขียวหอมดอกมะลิ ชงสดใหม่ทุกวัน ให้ความรู้สึกผ่อนคลายและสดชื่น", isNew: true },
];

const EVENTS = [
  { id: 1, title: "Tea Tasting Workshop", date: "15 มี.ค. 2026", time: "14:00 – 17:00", location: "ร้าน Crafted Leaf & Co.", img: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&q=80", spots: 12 },
  { id: 2, title: "Single-Origin Tea Talk", date: "22 มี.ค. 2026", time: "10:00 – 12:00", location: "ออนไลน์ (Zoom)", img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80", spots: 30 },
];

const TABS = ["Overview", "Product", "Events", "About"];

// ── Navbar (from ShopHome.jsx) ──────────────────────────────────
function Navbar({ cartCount, onCartClick }) {
  return (
    <nav className="flex items-center justify-between px-8 py-2 bg-[#AEBC9F] w-full sticky top-0 z-50 shadow-sm">
      <div className="flex items-center justify-start h-16 w-32 md:w-40">
        <span className="text-white font-bold text-2xl tracking-widest">ATC</span>
      </div>
      <div className="flex items-center gap-6 md:gap-12 text-[17px] font-medium text-[#4a4a4a] pr-4">
        <Link to="/" className="hover:text-black transition-colors underline-offset-4 hover:underline">Home</Link>
        <Link to="/shop" className="hover:text-black transition-colors underline-offset-4 hover:underline">Shop</Link>
        <Link to="/event" className="hover:text-black transition-colors underline-offset-4 hover:underline">Event</Link>
        <button
          onClick={onCartClick}
          className="relative hover:text-black transition-colors underline-offset-4 hover:underline border-l border-black/20 pl-6"
        >
          🛒
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#485B3B] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}

// ── Product Card ───────────────────────────────────────────────
function ProductCard({ product, onAddToCart }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 group">
      <div className="relative h-36 overflow-hidden bg-[#F5F3E9]">
        <img
          src={product.img}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
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
          <span className="text-[15px] font-bold text-[#485B3B]">฿{product.price}</span>
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

// ── Cart Drawer ────────────────────────────────────────────────
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
          ) : cart.map(item => (
            <div key={item.id} className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <img src={item.img} alt={item.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[13px] text-gray-800 truncate">{item.name}</p>
                <p className="text-[#485B3B] font-medium text-[13px]">฿{item.price}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => onUpdateQty(item.id, item.qty - 1)} className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 flex items-center justify-center">−</button>
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
              <span className="font-bold text-[20px] text-[#485B3B]">฿{total.toLocaleString()}</span>
            </div>
            <button className="w-full bg-[#485B3B] text-white py-3 rounded-full font-bold hover:bg-[#3a4a2f] transition-all shadow-lg">ชำระเงิน</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function ShopProfile() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [following, setFollowing] = useState(false);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, qty) => {
    if (qty <= 0) setCart(prev => prev.filter(i => i.id !== id));
    else setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="min-h-screen bg-[#F5F3E9] font-sans text-gray-800">
      {/* Navbar */}
      <Navbar cartCount={cartCount} onCartClick={() => setCartOpen(true)} />

      {/* Cover + Avatar */}
      <div className="relative">
        <div className="w-full h-44 overflow-hidden">
          <img src={SHOP.cover} alt="cover" className="w-full h-full object-cover" />
        </div>
        <div className="absolute bottom-0 translate-y-1/2 left-5">
          <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden shadow-md">
            <img src={SHOP.avatar} alt="avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Shop Info */}
      <div className="px-5 pt-14 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 leading-tight">{SHOP.name}</h1>
            <p className="text-[13px] text-gray-500 mt-0.5 flex items-center gap-1">
              <span>📍</span>{SHOP.location}
            </p>
          </div>
          <button
            onClick={() => setFollowing(f => !f)}
            className={`mt-1 px-5 py-2 rounded-full text-[13px] font-bold transition-all border ${
              following
                ? "bg-white text-[#485B3B] border-[#485B3B]"
                : "bg-[#485B3B] text-white border-[#485B3B]"
            }`}
          >
            {following ? "กำลังติดตาม" : "ติดตาม"}
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-5 mt-3">
          <div className="text-center">
            <p className="text-[15px] font-bold text-[#485B3B]">{SHOP.products}</p>
            <p className="text-[11px] text-gray-400">สินค้า</p>
          </div>
          <div className="text-center">
            <p className="text-[15px] font-bold text-[#485B3B]">{SHOP.followers.toLocaleString()}</p>
            <p className="text-[11px] text-gray-400">ผู้ติดตาม</p>
          </div>
          <div className="text-center">
            <p className="text-[15px] font-bold text-[#485B3B]">⭐ {SHOP.rating}</p>
            <p className="text-[11px] text-gray-400">คะแนน</p>
          </div>
        </div>

        <p className="text-[13px] text-gray-600 leading-relaxed mt-3">{SHOP.desc}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-5 mt-1">
        <div className="flex gap-0">
          {TABS.map(tab => (
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

      {/* Tab Content */}
      <div className="px-4 py-4">

        {/* Overview */}
        {activeTab === "Overview" && (
          <div className="grid grid-cols-3 gap-3">
            {PRODUCTS.map(product => (
              <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
            ))}
          </div>
        )}

        {/* Product */}
        {activeTab === "Product" && (
          <div>
            <p className="text-[13px] text-gray-400 mb-3">{PRODUCTS.length} รายการ</p>
            <div className="grid grid-cols-3 gap-3">
              {PRODUCTS.map(product => (
                <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
              ))}
            </div>
          </div>
        )}

        {/* Events */}
        {activeTab === "Events" && (
          <div className="space-y-4">
            {EVENTS.map(ev => (
              <div key={ev.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex gap-4 p-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={ev.img} alt={ev.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[15px] text-gray-800">{ev.title}</h4>
                  <p className="text-[12px] text-gray-400 mt-1">📅 {ev.date} · {ev.time}</p>
                  <p className="text-[12px] text-gray-400">📍 {ev.location}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-[#AEBC9F] font-medium">🎟 {ev.spots} ที่นั่ง</span>
                    <button className="bg-[#485B3B] text-white text-[11px] font-bold px-3 py-1.5 rounded-full">สมัคร</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* About */}
        {activeTab === "About" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-[15px] text-gray-800 mb-2">เกี่ยวกับร้าน</h3>
              <p className="text-[13px] text-gray-600 leading-relaxed">{SHOP.desc}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
              <h3 className="font-bold text-[15px] text-gray-800">ข้อมูลการติดต่อ</h3>
              {[
                { icon: "📍", label: SHOP.location },
                { icon: "🕐", label: "เปิดทุกวัน 09:00 – 20:00" },
                { icon: "📞", label: "062-xxx-xxxx" },
                { icon: "🌐", label: "craftedleaf.co.th" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-[13px] text-gray-600">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      {cartOpen && (
        <CartDrawer
          cart={cart}
          onClose={() => setCartOpen(false)}
          onUpdateQty={updateQty}
        />
      )}
    </div>
  );
}