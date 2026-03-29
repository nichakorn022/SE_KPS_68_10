import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiUrl, assetUrl } from "../../lib/api";
import SiteNavbar from "../components/SiteNavbar";
import FloatingCartButton from "../components/FloatingCartButton";
import ShopCartDrawer from "../components/ShopCartDrawer";
import usePersistentCart from "../hooks/usePersistentCart";
import { getAuthHeaders, getUserIdFromToken, getUserRoleFromToken } from "./authClient";

const api = {
  getShop: (id) =>
    fetch(apiUrl(`/shops/${id}`)).then((response) => {
      if (!response.ok) throw new Error(`Shop ${id} ${response.status}`);
      return response.json();
    }),
  getShopImages: (shopId) =>
    fetch(apiUrl(`/shop-images/shop/${shopId}`)).then((response) => {
      if (!response.ok) throw new Error(`Shop images ${shopId} ${response.status}`);
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
  getEvents: () =>
    fetch(apiUrl("/events")).then((response) => {
      if (!response.ok) throw new Error(`Events ${response.status}`);
      return response.json();
    }),
};

function toAssetUrl(path) {
  return path ? assetUrl(path) : null;
}

function formatPrice(price) {
  return `฿${Number(price ?? 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getLocation(shop) {
  return [shop?.subdistrict, shop?.district, shop?.province].filter(Boolean).join(", ");
}

function createImageMap(rows) {
  const map = new Map();

  for (const image of Array.isArray(rows) ? rows : []) {
    const productId = Number(image.product_id);
    if (!map.has(productId) && image.image_path) {
      map.set(productId, toAssetUrl(image.image_path));
    }
  }

  return map;
}

function getDefaultOpeningHours() {
  return {
    weekdays: "9:00 AM - 7:00 PM",
    saturday: "10:00 AM - 8:00 PM",
    sunday: "10:00 AM - 6:00 PM",
  };
}

function parseOpeningHours(value) {
  const defaults = getDefaultOpeningHours();

  if (!value) return defaults;

  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return {
      weekdays: String(parsed?.weekdays || defaults.weekdays),
      saturday: String(parsed?.saturday || defaults.saturday),
      sunday: String(parsed?.sunday || defaults.sunday),
    };
  } catch {
    return defaults;
  }
}

function createShopForm(shop) {
  const openingHours = parseOpeningHours(shop?.opening_hours);

  return {
    shop_name: shop?.shop_name || "",
    description: shop?.description || "",
    contact_info: shop?.contact_info || "",
    phone: shop?.phone || "",
    address: shop?.address || "",
    province: shop?.province || "",
    district: shop?.district || "",
    subdistrict: shop?.subdistrict || "",
    opening_hours: openingHours,
  };
}

function createShopProfile(shop, shopImages, products) {
  const cover = shopImages[0] || null;
  const avatar = shopImages[1] || shopImages[0] || null;
  const gallery = [
    ...shopImages.map((image, index) => ({
      id: `shop-${index}`,
      src: image,
      kind: "shop",
    })),
    ...products
      .filter((product) => product.img)
      .map((product) => ({
        id: `product-${product.product_id}`,
        src: product.img,
        kind: "product",
        productId: product.product_id,
        name: product.name,
      })),
  ];
  const uniqueGallery = Array.from(new Map(gallery.map((item) => [item.src, item])).values()).slice(0, 4);

  return {
    id: shop.shop_id,
    ownerUserId: Number(shop.user_id),
    name: shop.shop_name,
    description: shop.description?.trim() || "ร้านนี้ยังไม่มีคำอธิบายเพิ่มเติม",
    shortTag:
      shop.contact_info?.trim() ||
      (Number(shop.verified_status) === 1 ? "Verified tea shop on ATC marketplace" : "Independent tea shop"),
    location: getLocation(shop),
    address: shop.address?.trim() || "-",
    phone: shop.phone?.trim() || "-",
    email: shop.email?.trim() || "-",
    contactInfo: shop.contact_info?.trim() || "",
    openingHours: parseOpeningHours(shop.opening_hours),
    verified: Number(shop.verified_status) === 1,
    cover,
    avatar,
    gallery: uniqueGallery,
    productCount: products.length,
  };
}

function createStory(profile) {
  if (profile.description && profile.description !== "ร้านนี้ยังไม่มีคำอธิบายเพิ่มเติม") {
    return profile.description;
  }

  const location = profile.location || "พื้นที่คัดสรรวัตถุดิบคุณภาพ";
  return `${profile.name} เป็นร้านชาที่เน้นความเรียบละเมียดและประสบการณ์ที่อบอุ่น โดยคัดเลือกสินค้าจาก ${location} เพื่อให้ลูกค้าเลือกชาได้ง่ายขึ้นในบรรยากาศที่น่าเชื่อถือและเป็นกันเอง`;
}

function createAbout(profile) {
  return [
    profile.address !== "-" ? { type: "address", value: profile.address } : null,
    profile.location ? { type: "location", value: profile.location } : null,
    profile.phone !== "-" ? { type: "phone", value: profile.phone } : null,
    profile.email !== "-" ? { type: "email", value: profile.email } : null,
  ].filter(Boolean);
}

function AboutIcon({ type }) {
  const className = "h-5 w-5 text-[#7B9A67]";

  switch (type) {
    case "address":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="M3.75 9.75 12 3l8.25 6.75V20.25a.75.75 0 0 1-.75.75H4.5a.75.75 0 0 1-.75-.75V9.75Z" />
          <path d="M9 21v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6" />
        </svg>
      );
    case "location":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="M12 21s6-4.35 6-10a6 6 0 1 0-12 0c0 5.65 6 10 6 10Z" />
          <circle cx="12" cy="11" r="2.4" />
        </svg>
      );
    case "phone":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="M5.5 4.75h3l1.5 4-2 1.75a14 14 0 0 0 5 5l1.75-2 4 1.5v3a1 1 0 0 1-1.1 1A15.75 15.75 0 0 1 4.5 5.85a1 1 0 0 1 1-1.1Z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <rect x="3" y="5.25" width="18" height="13.5" rx="2" />
          <path d="M4 6.75 12 13l8-6.25" />
        </svg>
      );
  }
}

function createSpecialItems(profile, products) {
  return [
    {
      title: "Curated Selection",
      text: `คัดสินค้าภายในร้าน ${products.length || 0} รายการในโทนที่สอดคล้องกัน`,
      icon: "heart",
    },
    {
      title: "Verified Store",
      text: profile.verified ? "ร้านผ่านสถานะยืนยันตัวตนแล้ว" : "ร้านกำลังอยู่ระหว่างตรวจสอบข้อมูล",
      icon: "leaf",
    },
    {
      title: "Local Presence",
      text: profile.location || "แสดงข้อมูลพื้นที่ร้านจากฐานข้อมูลจริง",
      icon: "pin",
    },
    {
      title: "Direct Contact",
      text: profile.contactInfo || profile.phone || "ติดต่อร้านได้ผ่านข้อมูลที่ระบุในโปรไฟล์",
      icon: "spark",
    },
  ];
}

function formatEventDate(dateString) {
  if (!dateString) return "-";
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return "-";

  return parsed.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatEventTime(dateString) {
  if (!dateString) return "-";
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return "-";

  return parsed.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SectionTitle({ children, centered = false }) {
  return (
    <h2
      className={`font-serif text-[clamp(2rem,2.5vw,3.25rem)] tracking-[-0.03em] text-[#24321F] ${
        centered ? "text-center" : ""
      }`}
    >
      {children}
    </h2>
  );
}

function ProductCard({ product, onAddToCart, canEdit = false, cartQty = 0 }) {
  const cartFull = Number(product.stock ?? 0) > 0 && cartQty >= Number(product.stock ?? 0);

  return (
    <article className="group overflow-hidden rounded-[28px] border border-[#e7e0d5] bg-white shadow-[0_18px_45px_rgba(195,170,128,0.10)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_rgba(123,154,103,0.16)]">
      <div className="aspect-[1/1] overflow-hidden bg-[#f4f1ea]">
        {product.img ? (
          <img src={product.img} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#bfb4a2]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-14 w-14">
              <rect x="4" y="5" width="16" height="14" rx="3" />
              <circle cx="9" cy="10" r="1.4" />
              <path d="m7 16 3.2-3.2a1.4 1.4 0 0 1 2 0L17 17" />
            </svg>
          </div>
        )}
      </div>
      <div className="space-y-3 px-5 py-5">
        <div>
          <h3 className="line-clamp-1 font-serif text-[1.2rem] text-[#24321F]">{product.name}</h3>
          <p className="mt-2 line-clamp-2 text-[0.98rem] leading-7 text-[#6f7b70]">
            {product.description || "สินค้าร้านนี้ยังไม่ได้เพิ่มรายละเอียดเพิ่มเติม"}
          </p>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-[#6B8A5B]">{formatPrice(product.price)}</p>
            {product.tag ? <p className="text-sm text-[#8a857a]">{product.tag}</p> : null}
          </div>
          {canEdit ? (
            <Link
              to={`/seller/products?edit=${product.product_id}`}
              className="rounded-full border border-[#d8e1ce] bg-[#fbfdf7] px-4 py-2 text-sm font-semibold text-[#4e6841] transition-all hover:border-[#7B9A67] hover:bg-white"
            >
              Edit product
            </Link>
          ) : (
            <button
              type="button"
              disabled={cartFull}
              onClick={() => onAddToCart(product)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                cartFull
                  ? "cursor-not-allowed border-[#E1E6DA] bg-[#EEF1EA] text-[#98A38F]"
                  : "border-[#d8e1ce] bg-[#fbfdf7] text-[#4e6841] hover:border-[#7B9A67] hover:bg-white"
              }`}
            >
              {cartFull ? "ครบจำนวนแล้ว" : "เพิ่มลงตะกร้า"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function EventCard({ event }) {
  return (
    <article className="rounded-[28px] border border-[#e7e0d5] bg-white p-6 shadow-[0_18px_45px_rgba(195,170,128,0.10)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[#87a179]">Store Event</p>
          <h3 className="mt-3 font-serif text-[1.7rem] tracking-[-0.03em] text-[#24321F]">{event.title}</h3>
        </div>
        <span className="rounded-full bg-[#EEF4EC] px-3 py-1 text-xs font-semibold text-[#5b7350]">
          {event.status || "active"}
        </span>
      </div>

      <p className="mt-4 line-clamp-3 text-[1rem] leading-8 text-[#5d6b5f]">
        {event.description || "กิจกรรมนี้ยังไม่ได้เพิ่มคำอธิบายเพิ่มเติม"}
      </p>

      <div className="mt-6 grid gap-4 text-[0.98rem] text-[#5d6b5f] sm:grid-cols-2">
        <div className="rounded-[20px] bg-[#F7FAF4] px-4 py-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[#8ca084]">Date</p>
          <p className="mt-2 font-medium text-[#24321F]">{formatEventDate(event.event_date)}</p>
          <p className="mt-1">{formatEventTime(event.event_date)} น.</p>
        </div>
        <div className="rounded-[20px] bg-[#F7FAF4] px-4 py-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[#8ca084]">Location</p>
          <p className="mt-2 font-medium text-[#24321F]">{event.location || "ยังไม่ได้ระบุสถานที่"}</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between text-[0.98rem] text-[#5d6b5f]">
        <span>จำนวนที่รับ: {Number(event.max_participant ?? 0)} คน</span>
        <span className="font-semibold text-[#6B8A5B]">{formatPrice(event.price ?? 0)}</span>
      </div>
    </article>
  );
}

function SpecialIcon({ type }) {
  const className = "h-7 w-7";

  switch (type) {
    case "heart":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="M12 20s-6.5-4.35-6.5-10A4 4 0 0 1 12 7a4 4 0 0 1 6.5 3c0 5.65-6.5 10-6.5 10Z" />
        </svg>
      );
    case "leaf":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="M19 5c-8 0-12 4-12 10 0 2.5 1.5 4 4 4 6 0 10-4 10-12 0-.7 0-1.3-2-2Z" />
          <path d="M8 16c2-2 4.5-3.5 8-4" />
        </svg>
      );
    case "pin":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="M12 21s6-4.35 6-10a6 6 0 1 0-12 0c0 5.65 6 10 6 10Z" />
          <circle cx="12" cy="11" r="2.4" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
          <path d="m18 15 .8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15Z" />
        </svg>
      );
  }
}

function ContactLine({ icon, children }) {
  return (
    <div className="flex items-center gap-3 text-[1.02rem] text-[#566355]">
      <span className="text-[#7B9A67]">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-[#FAF8F2]">
      <SiteNavbar active="shop" />
      <div className="animate-pulse">
        <div className="h-[34rem] bg-[#d8d2c6]" />
        <div className="mx-auto max-w-[1280px] px-6 pb-16">
          <div className="-mt-24 h-48 rounded-[36px] bg-white/90" />
          <div className="mt-10 h-72 rounded-[36px] bg-[#eef3e7]" />
          <div className="mt-10 grid gap-6 lg:grid-cols-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-80 rounded-[28px] bg-white" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function clampCartQty(item, desiredQty) {
  const stockLimit = Math.max(0, Number(item?.stock ?? 0));
  return Math.max(0, Math.min(desiredQty, stockLimit));
}

export default function ShopProfile() {
  const { id } = useParams();
  const [cart, setCart] = usePersistentCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [shopForm, setShopForm] = useState(createShopForm());
  const [savingShop, setSavingShop] = useState(false);
  const [shopNotice, setShopNotice] = useState({ type: "", message: "" });
  const [shopImages, setShopImages] = useState([]);
  const [selectedShopImage, setSelectedShopImage] = useState(null);
  const [uploadingShopImage, setUploadingShopImage] = useState(false);
  const [ownerPreviewMode, setOwnerPreviewMode] = useState(false);
  const [products, setProducts] = useState([]);
  const [events, setEvents] = useState([]);
  const currentUserId = getUserIdFromToken();
  const currentUserRole = getUserRoleFromToken();

  useEffect(() => {
    let ignore = false;

    Promise.all([
      api.getShop(id),
      api.getShopImages(id).catch(() => []),
      api.getProducts(),
      api.getProductImages().catch(() => []),
      api.getEvents().catch(() => []),
    ])
      .then(([shopRow, shopImageRows, productRows, productImageRows, eventRows]) => {
        if (ignore) return;

        const imageMap = createImageMap(productImageRows);
        const storeProducts = (Array.isArray(productRows) ? productRows : [])
          .filter((product) => String(product.shop_id) === String(shopRow.shop_id))
          .map((product) => ({
            id: product.product_id,
            product_id: product.product_id,
            name: product.tea_name,
            tag: product.tea_type,
            description: product.description || "",
            price: Number(product.price ?? 0),
            img: imageMap.get(Number(product.product_id)) || null,
          }));

        const storeImages = (Array.isArray(shopImageRows) ? shopImageRows : [])
          .map((image) => toAssetUrl(image.image_path))
          .filter(Boolean);

        const storeEvents = (Array.isArray(eventRows) ? eventRows : []).filter(
          (event) =>
            String(event.organizer_id) === String(shopRow.user_id) ||
            String(event.organizer_id) === String(shopRow.shop_id)
        );

        setProducts(storeProducts);
        setEvents(storeEvents);
        setShopImages(Array.isArray(shopImageRows) ? shopImageRows : []);
        setProfile(createShopProfile(shopRow, storeImages, storeProducts));
        setShopForm(createShopForm(shopRow));
        setShopNotice({ type: "", message: "" });
        setError("");
      })
      .catch((fetchError) => {
        if (!ignore) setError(fetchError.message || "โหลดข้อมูลร้านไม่สำเร็จ");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart]);

  const featuredProducts = useMemo(() => products.slice(0, 4), [products]);
  const storyText = profile ? createStory(profile) : "";
  const aboutItems = profile ? createAbout(profile) : [];
  const specialItems = profile ? createSpecialItems(profile, products) : [];
  const canManageShop = currentUserRole === "shop" && profile && Number(profile.ownerUserId) === Number(currentUserId);
  const isOwner = canManageShop && !ownerPreviewMode;
  const addToCart = (product) => {
    setCart((previous) => {
      const existing = previous.find((item) => item.id === product.id);
      const nextQty = clampCartQty(existing || product, (existing?.qty || 0) + 1);

      if (nextQty <= 0) {
        return previous;
      }

      if (existing) {
        return previous.map((item) => (item.id === product.id ? { ...item, qty: nextQty } : item));
      }

      return [...previous, { ...product, qty: nextQty }];
    });
  };

  const updateQty = (productId, qty) => {
    setCart((previous) =>
      previous.flatMap((item) => {
        if (item.id !== productId) return [item];

        const nextQty = clampCartQty(item, qty);
        return nextQty > 0 ? [{ ...item, qty: nextQty }] : [];
      })
    );
  };

  const saveShopProfile = async ({ submitForVerification = false } = {}) => {
    if (!profile?.id) return;

    try {
      setSavingShop(true);
      setShopNotice({ type: "", message: "" });

      const response = await fetch(apiUrl(`/shops/${profile.id}`), {
        method: "PATCH",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(shopForm),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Failed to update shop");
      }

      setProfile((current) => ({
        ...current,
        name: data.shop_name,
        description: data.description?.trim() || current.description,
        shortTag:
          data.contact_info?.trim() ||
          (Number(data.verified_status) === 1 ? "Verified tea shop on ATC marketplace" : "Independent tea shop"),
        location: getLocation(data),
        address: data.address?.trim() || "-",
        phone: data.phone?.trim() || "-",
        email: data.email?.trim() || "-",
        contactInfo: data.contact_info?.trim() || "",
        openingHours: parseOpeningHours(data.opening_hours),
        verified: Number(data.verified_status) === 1,
      }));
      setShopForm(createShopForm(data));
      setShopNotice({
        type: "success",
        message: submitForVerification
          ? "Saved. Your shop is ready for admin review in the approvals inbox."
          : "Shop details updated.",
      });
    } catch (saveError) {
      setShopNotice({ type: "error", message: saveError.message || "Failed to update shop" });
    } finally {
      setSavingShop(false);
    }
  };

  const uploadShopImage = async (file = selectedShopImage) => {
    if (!profile?.id || !file) return;

    try {
      setUploadingShopImage(true);
      setShopNotice({ type: "", message: "" });

      const formData = new FormData();
      formData.append("shop_id", String(profile.id));
      formData.append("image", file);

      const response = await fetch(apiUrl("/shop-images"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Failed to upload shop image");
      }

      setSelectedShopImage(null);
      window.location.reload();
    } catch (uploadError) {
      setShopNotice({ type: "error", message: uploadError.message || "Failed to upload shop image" });
    } finally {
      setUploadingShopImage(false);
    }
  };

  const deleteShopImage = async (imageId) => {
    if (!imageId) return;

    try {
      setShopNotice({ type: "", message: "" });

      const response = await fetch(apiUrl(`/shop-images/${imageId}`), {
        method: "DELETE",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete shop image");
      }

      window.location.reload();
    } catch (deleteError) {
      setShopNotice({ type: "error", message: deleteError.message || "Failed to delete shop image" });
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#FAF8F2]">
        <SiteNavbar active="shop" />
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="rounded-[32px] border border-[#eadfd0] bg-white px-8 py-12 text-center shadow-[0_18px_55px_rgba(195,170,128,0.12)]">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#EEF3E7] text-4xl text-[#577049]">!</div>
            <h1 className="mt-6 text-3xl font-semibold text-[#24321F]">ไม่สามารถโหลดโปรไฟล์ร้านได้</h1>
            <p className="mt-3 text-[15px] leading-7 text-[#746d61]">{error || "ไม่พบข้อมูลร้านที่ต้องการ"}</p>
            <Link
              to="/shop"
              className="mt-8 inline-flex rounded-full bg-[#7B9A67] px-6 py-3 text-sm font-semibold text-white"
            >
              กลับไปหน้า Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F2] text-[#24321F]">
      <SiteNavbar active="shop" />

      <section className="relative overflow-hidden">
        <div className="h-[30rem] w-full bg-[#b89463] sm:h-[34rem] lg:h-[40rem]">
          {profile.cover ? (
            <img src={profile.cover} alt={profile.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-[linear-gradient(135deg,#a27f53_0%,#d2ae7b_48%,#7d5e39_100%)]" />
          )}
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(28,23,17,0.08)_0%,rgba(250,248,242,0.12)_58%,#FAF8F2_92%)]" />

        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto flex max-w-[1280px] px-6 pb-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
              <div className="h-36 w-36 overflow-hidden rounded-full border-[6px] border-white bg-white shadow-[0_20px_50px_rgba(61,47,31,0.20)] sm:h-44 sm:w-44">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={`${profile.name} avatar`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#bba88f]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-16 w-16">
                      <circle cx="12" cy="8" r="3.5" />
                      <path d="M5 20c1.5-4 4.5-6 7-6s5.5 2 7 6" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="pb-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-serif text-[clamp(2.1rem,4vw,4.2rem)] tracking-[-0.04em] text-[#24321F]">
                    {profile.name}
                  </h1>
                  {profile.verified ? (
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#79A86F] text-white">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                        <path d="m7 12 3 3 7-7" />
                      </svg>
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-[1.1rem] text-[#68786a] sm:text-[1.35rem]">{profile.shortTag}</p>

                {canManageShop ? (
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setOwnerPreviewMode((current) => !current)}
                      className="rounded-full border border-[#D4DDC9] bg-white/90 px-5 py-2 text-sm font-semibold text-[#51684A] shadow-[0_10px_24px_rgba(195,170,128,0.12)]"
                    >
                      {ownerPreviewMode ? "Back to edit mode" : "View public profile"}
                    </button>
                    {isOwner ? (
                      <label className="cursor-pointer rounded-full bg-[#485B3B] px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(195,170,128,0.12)]">
                        {uploadingShopImage ? "Uploading..." : "Upload image"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0] || null;
                            setSelectedShopImage(file);
                            if (file) uploadShopImage(file);
                          }}
                        />
                      </label>
                    ) : null}
                  </div>
                ) : null}

                {isOwner && selectedShopImage ? (
                  <p className="mt-3 text-sm text-[#5f6d5c]">{selectedShopImage.name}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1280px] px-6 pb-20">
        {isOwner ? (
          <section className="mb-10 rounded-[34px] border border-[#DFE5D6] bg-white/92 px-8 py-8 shadow-[0_18px_50px_rgba(195,170,128,0.10)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#829473]">Shop Owner</p>
                <h2 className="mt-3 font-serif text-[2rem] tracking-[-0.03em] text-[#24321F]">Edit Shop Profile</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#61705C]">
                  Update the storefront your customers see here. Unverified shops already appear in the admin approval inbox.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setOwnerPreviewMode(true)}
                  className="rounded-full border border-[#D4DDC9] bg-white px-4 py-2 text-sm font-semibold text-[#51684A]"
                >
                  View public profile
                </button>
                <span className={`rounded-full px-4 py-2 text-sm font-semibold ${profile.verified ? "bg-[#E6F1DA] text-[#4A6B34]" : "bg-[#F6E7D9] text-[#A15E3C]"}`}>
                  {profile.verified ? "Verified by admin" : "Pending admin verification"}
                </span>
              </div>
            </div>

            {shopNotice.message ? (
              <div className={`mt-6 rounded-2xl px-4 py-3 text-sm ${shopNotice.type === "error" ? "bg-[#fff0ed] text-[#b33a24]" : "bg-[#eef6ea] text-[#386132]"}`}>
                {shopNotice.message}
              </div>
            ) : null}

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <label className="text-sm text-[#55604f]">
                <span className="mb-1 block font-medium">Shop Name</span>
                <input value={shopForm.shop_name} onChange={(event) => setShopForm((current) => ({ ...current, shop_name: event.target.value }))} className="w-full rounded-lg border border-[#d9ddcf] px-4 py-3 outline-none focus:border-[#748b61]" />
              </label>
              <label className="text-sm text-[#55604f]">
                <span className="mb-1 block font-medium">Phone</span>
                <input value={shopForm.phone} onChange={(event) => setShopForm((current) => ({ ...current, phone: event.target.value }))} className="w-full rounded-lg border border-[#d9ddcf] px-4 py-3 outline-none focus:border-[#748b61]" />
              </label>
              <label className="text-sm text-[#55604f] md:col-span-2">
                <span className="mb-1 block font-medium">Description</span>
                <textarea value={shopForm.description} onChange={(event) => setShopForm((current) => ({ ...current, description: event.target.value }))} rows={4} className="w-full rounded-lg border border-[#d9ddcf] px-4 py-3 outline-none focus:border-[#748b61]" />
              </label>
              <label className="text-sm text-[#55604f] md:col-span-2">
                <span className="mb-1 block font-medium">Contact Info</span>
                <input value={shopForm.contact_info} onChange={(event) => setShopForm((current) => ({ ...current, contact_info: event.target.value }))} className="w-full rounded-lg border border-[#d9ddcf] px-4 py-3 outline-none focus:border-[#748b61]" />
              </label>
              <label className="text-sm text-[#55604f] md:col-span-2">
                <span className="mb-1 block font-medium">Address</span>
                <textarea value={shopForm.address} onChange={(event) => setShopForm((current) => ({ ...current, address: event.target.value }))} rows={3} className="w-full rounded-lg border border-[#d9ddcf] px-4 py-3 outline-none focus:border-[#748b61]" />
              </label>
              <label className="text-sm text-[#55604f]">
                <span className="mb-1 block font-medium">Province</span>
                <input value={shopForm.province} onChange={(event) => setShopForm((current) => ({ ...current, province: event.target.value }))} className="w-full rounded-lg border border-[#d9ddcf] px-4 py-3 outline-none focus:border-[#748b61]" />
              </label>
              <label className="text-sm text-[#55604f]">
                <span className="mb-1 block font-medium">District</span>
                <input value={shopForm.district} onChange={(event) => setShopForm((current) => ({ ...current, district: event.target.value }))} className="w-full rounded-lg border border-[#d9ddcf] px-4 py-3 outline-none focus:border-[#748b61]" />
              </label>
              <label className="text-sm text-[#55604f] md:col-span-2">
                <span className="mb-1 block font-medium">Subdistrict</span>
                <input value={shopForm.subdistrict} onChange={(event) => setShopForm((current) => ({ ...current, subdistrict: event.target.value }))} className="w-full rounded-lg border border-[#d9ddcf] px-4 py-3 outline-none focus:border-[#748b61]" />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => saveShopProfile()} disabled={savingShop || !shopForm.shop_name.trim()} className="rounded-full bg-[#485B3B] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
                {savingShop ? "Saving..." : "Save changes"}
              </button>
              {!profile.verified ? (
                <button type="button" onClick={() => saveShopProfile({ submitForVerification: true })} disabled={savingShop || !shopForm.shop_name.trim()} className="rounded-full border border-[#D4DDC9] bg-white px-5 py-3 text-sm font-semibold text-[#51684A] disabled:opacity-60">
                  {savingShop ? "Saving..." : "Save and send to admin"}
                </button>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="rounded-[34px] bg-[#EEF4EC] px-8 py-10 shadow-[0_18px_50px_rgba(195,170,128,0.10)] sm:px-14 sm:py-14">
          <SectionTitle centered>Our Story</SectionTitle>
          {isOwner ? (
            <div className="mx-auto mt-8 max-w-4xl">
              <textarea
                value={shopForm.description}
                onChange={(event) =>
                  setShopForm((current) => ({ ...current, description: event.target.value }))
                }
                rows={5}
                placeholder="Tell customers about your shop story..."
                className="w-full rounded-[24px] border border-[#D5DDCB] bg-white/88 px-6 py-5 text-center text-[1.08rem] leading-[2] text-[#516356] outline-none focus:border-[#748b61]"
              />
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => saveShopProfile()}
                  disabled={savingShop || !shopForm.shop_name.trim()}
                  className="rounded-full bg-[#485B3B] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {savingShop ? "Saving..." : "Save story"}
                </button>
              </div>
            </div>
          ) : (
            <p className="mx-auto mt-8 max-w-4xl text-center text-[1.2rem] leading-[2.15] text-[#516356]">
              {storyText}
            </p>
          )}
        </section>

        <section className="py-16">
          <SectionTitle>About Us</SectionTitle>
          <div className="mt-8 flex max-w-6xl flex-wrap gap-x-8 gap-y-3 text-[1.14rem] leading-8 text-[#516356]">
            {aboutItems.length > 0 ? (
              aboutItems.map((item) => (
                <div key={`${item.type}-${item.value}`} className="flex items-center gap-3 whitespace-nowrap">
                  <AboutIcon type={item.type} />
                  <p>{item.value}</p>
                </div>
              ))
            ) : (
              <p>ร้านนี้ยังไม่ได้เพิ่มรายละเอียดการติดต่อเพิ่มเติม</p>
            )}
          </div>
        </section>

        <section className="rounded-[34px] bg-[#EEF4EC] px-8 py-12 shadow-[0_18px_50px_rgba(195,170,128,0.10)] sm:px-12 sm:py-16">
          <SectionTitle centered>What Makes Us Special</SectionTitle>
          <div className="mt-12 grid gap-10 md:grid-cols-2 xl:grid-cols-4">
            {specialItems.map((item) => (
              <article key={item.title} className="text-center">
                <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-full bg-white text-[#7B9A67] shadow-[0_12px_24px_rgba(123,154,103,0.10)]">
                  <SpecialIcon type={item.icon} />
                </div>
                <h3 className="mt-6 font-serif text-[1.7rem] tracking-[-0.03em] text-[#24321F]">{item.title}</h3>
                <p className="mt-4 text-[1.05rem] leading-8 text-[#516356]">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="py-16">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <SectionTitle centered>Featured Products</SectionTitle>
            {isOwner ? (
              <Link
                to="/seller/products"
                className="inline-flex items-center rounded-full border border-[#D7E1CC] bg-white px-5 py-2 text-sm font-semibold text-[#4E6841] transition hover:border-[#7B9A67] hover:bg-[#fbfdf7]"
              >
                Add product
              </Link>
            ) : null}
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
                canEdit={isOwner}
                cartQty={cart.find((item) => item.id === product.id)?.qty || 0}
              />
            ))}
          </div>
        </section>

        {events.length > 0 ? (
          <section className="py-6">
            <SectionTitle centered>Store Events</SectionTitle>
            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {events.slice(0, 4).map((event) => (
                <EventCard key={event.event_id} event={event} />
              ))}
            </div>
          </section>
        ) : null}

        {profile.gallery.length > 0 ? (
          <section className="py-6">
            <SectionTitle centered>Gallery</SectionTitle>
            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {profile.gallery.map((item, index) => (
                <div key={item.id} className="group relative aspect-[1/1] overflow-hidden rounded-[28px] bg-[#f1ece3]">
                  <img src={item.src} alt={item.name || `${profile.name} gallery ${index + 1}`} className="h-full w-full object-cover" />
                  {isOwner && item.kind === "product" ? (
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-[rgba(20,18,15,0.78)] via-[rgba(20,18,15,0.38)] to-transparent px-4 py-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <span className="text-sm font-medium text-white/90">Product image</span>
                      <Link
                        to={`/seller/products?edit=${item.productId}`}
                        className="rounded-full bg-white/92 px-4 py-2 text-sm font-semibold text-[#33422D] transition hover:bg-white"
                      >
                        Edit product
                      </Link>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="py-16">
          <div className="grid items-start gap-8 lg:grid-cols-2">
            <div className="rounded-[30px] border border-[#e9e2d7] bg-[#fdfbf6] px-8 py-8 shadow-[0_18px_45px_rgba(195,170,128,0.08)] sm:px-10">
              <div className="flex items-center gap-3">
                <span className="text-[#7B9A67]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
                    <circle cx="12" cy="12" r="8" />
                    <path d="M12 8v5l3 2" />
                  </svg>
                </span>
                <h3 className="font-serif text-[2rem] tracking-[-0.03em] text-[#24321F]">Opening Hours</h3>
              </div>

              <div className="mt-6 space-y-4 text-[1.18rem] text-[#516356]">
                {isOwner ? (
                  <div className="space-y-4 rounded-[26px] border border-[#e3dccf] bg-white px-5 py-5 shadow-[0_18px_45px_rgba(195,170,128,0.10)]">
                    <label className="block text-sm font-medium text-[#485847]">
                      <span className="mb-2 block">Monday - Friday</span>
                      <input
                        value={shopForm.opening_hours.weekdays}
                        onChange={(event) =>
                          setShopForm((current) => ({
                            ...current,
                            opening_hours: { ...current.opening_hours, weekdays: event.target.value },
                          }))
                        }
                        className="w-full rounded-lg border border-[#d9ddcf] px-4 py-3 outline-none focus:border-[#748b61]"
                      />
                    </label>
                    <label className="block text-sm font-medium text-[#485847]">
                      <span className="mb-2 block">Saturday</span>
                      <input
                        value={shopForm.opening_hours.saturday}
                        onChange={(event) =>
                          setShopForm((current) => ({
                            ...current,
                            opening_hours: { ...current.opening_hours, saturday: event.target.value },
                          }))
                        }
                        className="w-full rounded-lg border border-[#d9ddcf] px-4 py-3 outline-none focus:border-[#748b61]"
                      />
                    </label>
                    <label className="block text-sm font-medium text-[#485847]">
                      <span className="mb-2 block">Sunday</span>
                      <input
                        value={shopForm.opening_hours.sunday}
                        onChange={(event) =>
                          setShopForm((current) => ({
                            ...current,
                            opening_hours: { ...current.opening_hours, sunday: event.target.value },
                          }))
                        }
                        className="w-full rounded-lg border border-[#d9ddcf] px-4 py-3 outline-none focus:border-[#748b61]"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => saveShopProfile()}
                      disabled={savingShop || !shopForm.shop_name.trim()}
                      className="rounded-full bg-[#485B3B] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {savingShop ? "Saving..." : "Save hours"}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-4">
                      <span>Monday - Friday</span>
                      <span>{profile.openingHours.weekdays}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Saturday</span>
                      <span>{profile.openingHours.saturday}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Sunday</span>
                      <span>{profile.openingHours.sunday}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-[30px] border border-[#e9e2d7] bg-[#fdfbf6] px-8 py-8 shadow-[0_18px_45px_rgba(195,170,128,0.08)] sm:px-10">
              <h3 className="font-serif text-[2rem] tracking-[-0.03em] text-[#24321F]">Contact</h3>
              <div className="mt-6 space-y-5">
                {isOwner ? (
                  <div className="space-y-4 rounded-[26px] border border-[#e3dccf] bg-white px-5 py-5 shadow-[0_18px_45px_rgba(195,170,128,0.10)]">
                    <label className="block text-sm font-medium text-[#485847]">
                      <span className="mb-2 block">Phone</span>
                      <input
                        value={shopForm.phone}
                        onChange={(event) => setShopForm((current) => ({ ...current, phone: event.target.value }))}
                        className="w-full rounded-lg border border-[#d9ddcf] px-4 py-3 outline-none focus:border-[#748b61]"
                      />
                    </label>
                    <label className="block text-sm font-medium text-[#485847]">
                      <span className="mb-2 block">Contact info</span>
                      <input
                        value={shopForm.contact_info}
                        onChange={(event) => setShopForm((current) => ({ ...current, contact_info: event.target.value }))}
                        className="w-full rounded-lg border border-[#d9ddcf] px-4 py-3 outline-none focus:border-[#748b61]"
                      />
                    </label>
                    <label className="block text-sm font-medium text-[#485847]">
                      <span className="mb-2 block">Account email</span>
                      <input value={profile.email} disabled className="w-full rounded-lg border border-[#d9ddcf] bg-[#f6f3ec] px-4 py-3 text-[#7d8777]" />
                    </label>
                    <button
                      type="button"
                      onClick={() => saveShopProfile()}
                      disabled={savingShop || !shopForm.shop_name.trim()}
                      className="rounded-full bg-[#485B3B] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {savingShop ? "Saving..." : "Save contact"}
                    </button>
                  </div>
                ) : (
                  <>
                    <ContactLine
                      icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
                          <path d="M5.5 4.75h3l1.5 4-2 1.75a14 14 0 0 0 5 5l1.75-2 4 1.5v3a1 1.1 0 0 1-1.1 1A15.75 15.75 0 0 1 4.5 5.85a1 1 0 0 1 1-1.1Z" />
                        </svg>
                      }
                    >
                      {profile.phone}
                    </ContactLine>
                    <ContactLine
                      icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
                          <rect x="3" y="5.25" width="18" height="13.5" rx="2" />
                          <path d="M4 6.75 12 13l8-6.25" />
                        </svg>
                      }
                    >
                      {profile.email}
                    </ContactLine>
                    {profile.contactInfo ? (
                      <ContactLine
                        icon={
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
                            <circle cx="12" cy="12" r="9" />
                            <path d="M3 12h18M12 3c2.5 2.7 4 5.9 4 9s-1.5 6.3-4 9c-2.5-2.7-4-5.9-4-9s1.5-6.3 4-9Z" />
                          </svg>
                        }
                      >
                        {profile.contactInfo}
                      </ContactLine>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>


        <footer className="py-14 text-center text-[1.12rem] text-[#62705e]">
          © 2026 {profile.name}. All rights reserved.
        </footer>
      </main>

      {cartOpen ? (
        <ShopCartDrawer
          cart={cart}
          onClose={() => setCartOpen(false)}
          onUpdateQty={updateQty}
        />
      ) : null}

      <FloatingCartButton cartCount={cartCount} onClick={() => setCartOpen(true)} />
    </div>
  );
}

