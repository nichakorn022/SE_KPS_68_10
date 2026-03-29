import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiUrl, assetUrl } from "../../lib/api";
import SiteNavbar from "../components/SiteNavbar";
import FloatingCartButton from "../components/FloatingCartButton";
import ShopCartDrawer from "../components/ShopCartDrawer";
import usePersistentCart from "../hooks/usePersistentCart";
import ShopHome from "./ShopHome";
import ProductReview from "./ProductReview";
import { getUserIdFromToken } from "./authClient";

const api = {
  getProduct: (id) =>
    fetch(apiUrl(`/products/${id}`)).then((r) => {
      if (!r.ok) throw new Error(`Product ${id} ${r.status}`);
      return r.json();
    }),
  getProductImages: (id) =>
    fetch(apiUrl(`/product-images?product_id=${id}`)).then((r) => {
      if (!r.ok) throw new Error(`Images ${r.status}`);
      return r.json();
    }),
  getAllProductImages: () =>
    fetch(apiUrl(`/product-images`)).then((r) => {
      if (!r.ok) throw new Error(`All images ${r.status}`);
      return r.json();
    }),
  getShop: (shopId) =>
    fetch(apiUrl(`/shops/${shopId}`)).then((r) => {
      if (!r.ok) throw new Error(`Shop ${shopId} ${r.status}`);
      return r.json();
    }),
  getShopImages: (shopId) =>
    fetch(apiUrl(`/shop-images?shop_id=${shopId}`)).then((r) => {
      if (!r.ok) throw new Error(`ShopImages ${r.status}`);
      return r.json();
    }),
  getRelatedProducts: (shopId) =>
    fetch(apiUrl(`/products?shop_id=${shopId}`)).then((r) => {
      if (!r.ok) throw new Error(`Related ${r.status}`);
      return r.json();
    }),
};

function toAssetUrl(path) {
  return path ? assetUrl(path) : null;
}

// ── Navbar (same as ShopHome) ───────────────────────────────────────────────
function Navbar({ cartCount, onCartClick, openLogin, openRegister }) {
  return (
    <nav className="flex items-center justify-between px-8 py-2 bg-[#AEBC9F] w-full sticky top-0 z-50 shadow-sm">
      <div className="flex items-center justify-start h-16 w-32 md:w-40">
        <img
          src="/Pictrue/Logo.png"
          alt="ATC Logo"
          className="h-full w-auto object-contain drop-shadow-sm"
        />
      </div>
      <div className="flex items-center gap-6 md:gap-12 text-[17px] font-medium text-[#4a4a4a] pr-4">
        <Link
          to="/"
          className="rounded-full px-4 py-2 transition-all hover:bg-[#485B3B]/12 hover:text-[#485B3B]"
        >
          Home
        </Link>
        <Link
          to="/shop"
          className="rounded-full px-4 py-2 transition-all bg-[#485B3B]/12 text-[#485B3B] font-bold"
        >
          Shop
        </Link>
        <Link
          to="/events"
          className="rounded-full px-4 py-2 transition-all hover:bg-[#485B3B]/12 hover:text-[#485B3B]"
        >
          Event
        </Link>
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

// ── Star Rating ─────────────────────────────────────────────────────────────
function StarRating({ rating = 4.5, count = 0 }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {stars.map((s) => (
          <svg
            key={s}
            className={`w-4 h-4 ${
              s <= Math.floor(rating) ? "text-amber-400" : s - 0.5 <= rating ? "text-amber-300" : "text-gray-200"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-[13px] font-semibold text-amber-500">{rating.toFixed(1)}</span>
      {count > 0 && (
        <span className="text-[12px] text-gray-400 border-l border-gray-200 pl-1.5">
          {count} รีวิว
        </span>
      )}
    </div>
  );
}

// ── Image Gallery ───────────────────────────────────────────────────────────
function ImageGallery({ images, productName }) {
  const mainImg = images[0] ?? null;

  return (
    <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#F0EDE3] border border-[#AEBC9F]/20 shadow-sm">
      {mainImg ? (
        <img
          src={mainImg}
          alt={productName}
          className="w-full h-full object-cover object-center"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-[#AEBC9F]">
          <span className="text-7xl mb-2">🍵</span>
          <span className="text-sm">ไม่มีรูปภาพ</span>
        </div>
      )}
    </div>
  );
}

// ── Shop Info Panel ─────────────────────────────────────────────────────────
function ShopPanel({ shop, shopImg }) {
  if (!shop) return null;

  const location = [shop.subdistrict, shop.district, shop.province]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 mt-6">
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#F5F3E9] flex-shrink-0 border border-[#AEBC9F]/30">
        {shopImg ? (
          <img src={shopImg} alt={shop.shop_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">🏪</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-gray-800 text-[15px] truncate">{shop.shop_name}</h4>
          {shop.verified_status === 1 && (
            <span className="text-[10px] bg-[#AEBC9F]/20 text-[#485B3B] font-bold px-2 py-0.5 rounded-full border border-[#AEBC9F]/40">
              ✓ Verified
            </span>
          )}
        </div>
        {location && (
          <p className="text-[12px] text-gray-400 truncate mt-0.5">📍 {location}</p>
        )}
      </div>
      <Link
        to={`/shop/${shop.shop_id}`}
        className="flex-shrink-0 border border-[#485B3B] text-[#485B3B] text-[12px] font-bold px-4 py-1.5 rounded-full hover:bg-[#485B3B] hover:text-white transition-all"
      >
        ดูร้าน
      </Link>
    </div>
  );
}

// ── Cart Drawer ─────────────────────────────────────────────────────────────
function CartDrawer({ cart, onClose, onRemove, onUpdateQty }) {
  const total = cart.reduce((sum, item) => sum + (item.price ?? 0) * item.qty, 0);

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
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#F5F3E9] flex-shrink-0">
                  {item.img ? (
                    <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">🍵</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[13px] text-gray-800 truncate">{item.name}</p>
                  <p className="text-[#485B3B] font-medium text-[13px]">
                    ฿{item.price?.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateQty(item.id, item.qty - 1)}
                    className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 flex items-center justify-center"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-[14px] font-bold">{item.qty}</span>
                  <button
                    onClick={() => onUpdateQty(item.id, item.qty + 1)}
                    className="w-7 h-7 rounded-full bg-[#AEBC9F] text-white font-bold hover:brightness-95 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
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

// ── Related Products ────────────────────────────────────────────────────────
function RelatedCard({ product, onClick }) {
  return (
    <button
      onClick={() => onClick(product.product_id)}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 text-left"
    >
      <div className="aspect-square overflow-hidden bg-[#F5F3E9]">
        {product.img ? (
          <img
            src={product.img}
            alt={product.tea_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">🍵</div>
        )}
      </div>
      <div className="p-3">
        <p className="text-[13px] font-semibold text-gray-800 line-clamp-2 leading-snug">
          {product.tea_name}
        </p>
        {product.price != null && (
          <p className="text-[#485B3B] font-bold text-[14px] mt-1">
            ฿{Number(product.price).toLocaleString()}
          </p>
        )}
      </div>
    </button>
  );
}

// ── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function ProductDetail({ cart: cartProp, onAddToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [shop, setShop] = useState(null);
  const [shopImg, setShopImg] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [qty, setQty] = useState(1);
  const [qtyInput, setQtyInput] = useState("1");
  const [addedFeedback, setAddedFeedback] = useState(false);

  // Internal cart state (fallback if no prop)
  const [internalCart, setInternalCart] = usePersistentCart();
  const [cartOpen, setCartOpen] = useState(false);

  const cart = cartProp ?? internalCart;
  const clampCartQty = useCallback((item, desiredQty) => {
    const stockLimit = Math.max(0, Number(item?.stock ?? 0));
    return Math.max(0, Math.min(desiredQty, stockLimit));
  }, []);

  const addToCart = useCallback(
    (prod, quantity = 1) => {
      if (onAddToCart) {
        onAddToCart(prod, Math.max(1, clampCartQty(prod, quantity)));
      } else {
        setInternalCart((prev) => {
          const existing = prev.find((i) => i.id === prod.id);
          const nextQty = clampCartQty(existing || prod, (existing?.qty || 0) + quantity);
          if (nextQty <= 0) return prev;
          if (existing)
            return prev.map((i) =>
              i.id === prod.id ? { ...i, qty: nextQty } : i
            );
          return [...prev, { ...prod, qty: nextQty }];
        });
      }
      setAddedFeedback(true);
      setTimeout(() => setAddedFeedback(false), 1500);
    },
    [clampCartQty, onAddToCart]
  );

  const updateQty = useCallback((itemId, q) => {
    setInternalCart((prev) =>
      prev.flatMap((i) => {
        if (i.id !== itemId) return [i];
        const nextQty = clampCartQty(i, q);
        return nextQty > 0 ? [{ ...i, qty: nextQty }] : [];
      })
    );
  }, [clampCartQty]);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState({ avg: 0, count: 0 });

  // ── Fetch data ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    api
      .getProduct(id)
      .then(async (prod) => {
        setProduct(prod);

        // Fetch images (all at once), shop in parallel — same pattern as ShopHome
        const [allProductImgs, shopData] = await Promise.all([
          api.getAllProductImages().catch(() => []),
          prod.shop_id ? api.getShop(prod.shop_id).catch(() => null) : Promise.resolve(null),
        ]);

        // Build Map: product_id → first image URL (same as ShopHome)
        const productImageMap = new Map();
        allProductImgs.forEach((img) => {
          if (!productImageMap.has(img.product_id) && img.image_path) {
            productImageMap.set(img.product_id, toAssetUrl(img.image_path));
          }
        });

        // Main product image
        const mainImg = productImageMap.get(Number(id)) ?? productImageMap.get(String(id)) ?? null;
        setImages(mainImg ? [mainImg] : []);
        setShop(shopData);

        if (shopData) {
          const [shopImgs, relatedProds] = await Promise.all([
            api.getShopImages(shopData.shop_id).catch(() => []),
            api.getRelatedProducts(shopData.shop_id).catch(() => []),
          ]);

          if (shopImgs.length > 0 && shopImgs[0].image_path) {
            setShopImg(toAssetUrl(shopImgs[0].image_path));
          }

          // Only products from this shop, exclude current, limit to 4
          // Use productImageMap already built — no extra API calls needed
          const relatedWithImgs = relatedProds
            .filter(
              (p) =>
                String(p.product_id) !== String(prod.product_id) &&
                String(p.shop_id) === String(shopData.shop_id)
            )
            .slice(0, 4)
            .map((p) => ({
              ...p,
              img: productImageMap.get(p.product_id) ?? null,
            }));

          setRelated(relatedWithImgs);
        }

        setLoading(false);

        // Fetch reviews and calculate rating
        try {
          const reviewsData = await fetch(apiUrl(`/reviews/${id}`)).then(r => r.json());
          setReviews(reviewsData);
          const total = reviewsData.length;
          const avg = total > 0 ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / total : 0;
          setRating({ avg, count: total });
        } catch (reviewErr) {
          console.warn("Could not fetch reviews:", reviewErr);
          setRating({ avg: 0, count: 0 });
        }
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const price = Number(product?.price ?? 0);
  const stock = Number(product?.stock ?? 0);
  const inStock = stock > 0;
  const normalizeQtyInput = (rawValue) => {
    const parsed = Number(rawValue);
    if (Number.isNaN(parsed)) return 1;
    return Math.max(1, Math.min(stock || 1, parsed));
  };
  const currentUserId = getUserIdFromToken();
  const cartQty = cart.find((item) => item.id === product?.product_id)?.qty || 0;
  const isOwnProduct =
    currentUserId != null &&
    shop?.user_id != null &&
    Number(currentUserId) === Number(shop.user_id);
  const cartFull = inStock && cartQty >= stock;

  useEffect(() => {
    if (!product) return;

    const normalizedQty = Math.max(1, Math.min(stock || 1, qty));
    if (normalizedQty !== qty) {
      setQty(normalizedQty);
      setQtyInput(String(normalizedQty));
      return;
    }

    setQtyInput(String(normalizedQty));
  }, [product, qty, stock]);

  // ── Loading skeleton ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F3E9]">
        <SiteNavbar active="shop" />
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="grid md:grid-cols-2 gap-8 animate-pulse">
            <div className="aspect-square rounded-2xl bg-[#AEBC9F]/20" />
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded-full w-3/4" />
              <div className="h-4 bg-gray-100 rounded-full w-1/3" />
              <div className="h-10 bg-gray-200 rounded-full w-1/2 mt-4" />
              <div className="h-4 bg-gray-100 rounded-full w-full" />
              <div className="h-4 bg-gray-100 rounded-full w-5/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────
  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#F5F3E9]">
        <SiteNavbar active="shop" />
        <div className="flex flex-col items-center justify-center py-32 text-gray-400">
          <p className="text-5xl mb-4">🍵</p>
          <p className="text-lg font-medium text-gray-500">ไม่พบสินค้า</p>
          <p className="text-sm text-red-400 mt-1">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 bg-[#485B3B] text-white px-8 py-2.5 rounded-full font-bold hover:bg-[#3a4a2f] transition-all"
          >
            ← กลับ
          </button>
        </div>
      </div>
    );
  }

  const currentProduct = {
    id: product.product_id,
    name: product.tea_name,
    price,
    stock,
    tag: product.tea_type,
    img: images[0] || null,
    shop: shop?.shop_name || `Shop #${product.shop_id}`,
  };

  const handleBuyNow = () => {
    if (!inStock || isOwnProduct) return;

    addToCart(currentProduct, qty);
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-[#F5F3E9] font-sans text-gray-800">
      <SiteNavbar active="shop" />


      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 pb-12 pt-8">
        <div className="relative rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Back to previous page"
            className="absolute left-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#D7E1CC] bg-[#FBFDF8] text-[#668257] shadow-[0_6px_14px_rgba(72,91,59,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#F4F8EE] md:left-2 md:top-2"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 6 9 12l6 6" />
            </svg>
          </button>
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* ── Left: Image Gallery ── */}
            <ImageGallery images={images} productName={product.tea_name} />

            {/* ── Right: Product Info ── */}
            <div className="flex flex-col">
              {/* Tea type badge */}
              {product.tea_type && (
                <span className="self-start text-[11px] font-bold px-3 py-1 rounded-full bg-[#AEBC9F]/20 text-[#485B3B] border border-[#AEBC9F]/40 mb-3">
                  {product.tea_type}
                </span>
              )}

              {/* Title */}
              <h1 className="text-[20px] md:text-[22px] font-bold text-gray-800 leading-snug mb-3">
                {product.tea_name}
              </h1>

              {/* Rating placeholder */}
              <div className="flex items-center gap-3 mb-4">
                <StarRating rating={rating.avg} count={rating.count} />
                <span className="text-[12px] text-gray-300">|</span>
                <span className={`text-[12px] font-semibold ${inStock ? "text-green-600" : "text-red-400"}`}>
                  {inStock ? `มีสินค้า (${stock})` : "สินค้าหมด"}
                </span>
              </div>

              {/* Price block */}
              <div className="bg-[#F5F3E9] rounded-2xl px-5 py-4 mb-5">
                <div className="flex items-baseline gap-3">
                  <span className="text-[30px] font-extrabold text-[#485B3B]">
                    ฿{price.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-5">
                  <p className="text-[13px] font-semibold text-gray-500 mb-1.5">รายละเอียด</p>
                  <p className="text-[14px] text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-gray-100 my-4" />

              {/* Quantity */}
              <div className="flex items-center gap-4 mb-5">
                <span className="text-[14px] font-semibold text-gray-600 w-16">จำนวน</span>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() =>
                      setQty((q) => {
                        const nextQty = Math.max(1, q - 1);
                        setQtyInput(String(nextQty));
                        return nextQty;
                      })
                    }
                    disabled={qty <= 1}
                    className="w-10 h-10 flex items-center justify-center text-[#485B3B] hover:bg-[#F5F3E9] disabled:opacity-30 transition-colors font-bold text-lg"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={stock || 1}
                    value={qtyInput}
                    onChange={(event) => {
                      const rawValue = event.target.value;
                      if (rawValue === "") {
                        setQtyInput("");
                        return;
                      }

                      setQtyInput(rawValue);
                    }}
                    onBlur={() => {
                      const nextQty = normalizeQtyInput(qtyInput);
                      setQty(nextQty);
                      setQtyInput(String(nextQty));
                    }}
                    className="w-12 h-10 border-x border-gray-200 bg-white text-center text-[15px] font-bold text-gray-800 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() =>
                      setQty((q) => {
                        const nextQty = Math.min(stock || 99, q + 1);
                        setQtyInput(String(nextQty));
                        return nextQty;
                      })
                    }
                    disabled={!inStock || qty >= stock}
                    className="w-10 h-10 flex items-center justify-center text-[#485B3B] hover:bg-[#F5F3E9] disabled:opacity-30 transition-colors font-bold text-lg"
                  >
                    +
                  </button>
                </div>
                {stock > 0 && (
                  <span className="text-[12px] text-gray-400">มีอยู่ {stock} ชิ้น</span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => addToCart(currentProduct, qty)}
                  disabled={!inStock || isOwnProduct || cartFull}
                  className={`flex-1 flex items-center justify-center gap-2 border-2 border-[#485B3B] text-[#485B3B] font-bold py-3 rounded-2xl transition-all active:scale-95 disabled:opacity-40 ${
                    addedFeedback
                      ? "bg-[#485B3B] text-white"
                      : "hover:bg-[#485B3B]/10"
                  }`}
                >
                  🛒
                  {isOwnProduct ? "สินค้าร้านคุณ" : cartFull ? "ครบจำนวนแล้ว" : addedFeedback ? "เพิ่มแล้ว ✓" : "เพิ่มไปยังตะกร้า"}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={!inStock || isOwnProduct}
                  className="flex-1 bg-[#485B3B] text-white font-bold py-3 rounded-2xl hover:bg-[#3a4a2f] transition-all shadow-lg active:scale-95 disabled:opacity-40"
                >
                  {isOwnProduct ? "สินค้าร้านคุณ" : "ซื้อสินค้า"}
                </button>
              </div>

              {cartFull ? (
                <p className="mt-3 text-[13px] font-medium text-[#B26B44]">
                  มีสินค้านี้ในตะกร้าครบจำนวนที่มีแล้ว
                </p>
              ) : null}

              {/* Shop info */}
              <ShopPanel shop={shop} shopImg={shopImg} />
            </div>
          </div>
        </div>

        {/* ── Product Reviews ── */}
        <ProductReview productId={id} />

        {/* ── Related Products ── */}
        {related.length > 0 && (
          <div className="mt-8">
            <h2 className="text-[18px] font-bold text-[#485B3B] mb-4">
              สินค้าอื่นจากร้านนี้
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {related.map((p) => (
                <RelatedCard
                  key={p.product_id}
                  product={p}
                  onClick={(pid) => navigate(`/product/${pid}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Back button ── */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate("/shop")}
            className="flex items-center gap-2 text-[#485B3B] font-semibold text-[14px] hover:underline underline-offset-2 transition-colors"
          >
            ← กลับไปหน้า Shop
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#AEBC9F] pt-10 pb-16 px-10">
        <div className="max-w-[850px] mx-auto opacity-30 space-y-4">
          <div className="h-4 bg-white w-48 rounded" />
          <div className="h-4 bg-white w-32 rounded" />
        </div>
      </footer>

      {/* Cart Drawer */}
      {cartOpen && (
        <ShopCartDrawer
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
