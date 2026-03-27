import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiUrl, assetUrl } from "../../lib/api";

function formatPrice(price) {
  return `฿${Number(price ?? 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatOrderCode(orderId) {
  return `TEA-${String(new Date().getFullYear())}-${String(orderId).padStart(6, "0")}`;
}

function formatDeliveryDate(dateString) {
  const baseDate = new Date(dateString || Date.now());
  baseDate.setDate(baseDate.getDate() + 1);
  return baseDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function buildAddress(order) {
  return [order.shipping_address, order.subdistrict, order.district, order.province, order.postal_code]
    .filter(Boolean)
    .join(", ");
}

function buildImageMap(images) {
  const map = new Map();

  for (const image of Array.isArray(images) ? images : []) {
    const productId = Number(image.product_id);
    if (!map.has(productId) && image.image_path) {
      map.set(productId, assetUrl(image.image_path));
    }
  }

  return map;
}

function ProductImage({ src, alt, className = "" }) {
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center rounded-[24px] bg-[linear-gradient(180deg,#f6f2ea_0%,#efebe3_100%)] text-[#c4baaa] ${className}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-10 w-10">
          <rect x="4" y="5" width="16" height="14" rx="3" />
          <circle cx="9" cy="10" r="1.4" />
          <path d="m7 16 3.2-3.2a1.4 1.4 0 0 1 2 0L17 17" />
        </svg>
      </div>
    );
  }

  return <img src={src} alt={alt} className={`rounded-[24px] object-cover ${className}`} />;
}

function RecommendationCard({ product }) {
  return (
    <Link
      to={`/product/${product.product_id}`}
      className="group overflow-hidden rounded-[28px] border border-[#e8e1d6] bg-white shadow-[0_18px_40px_rgba(195,170,128,0.10)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_55px_rgba(123,154,103,0.14)]"
    >
      <div className="aspect-[1.05/1] overflow-hidden bg-[#f5f2eb]">
        <ProductImage
          src={product.img}
          alt={product.tea_name}
          className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </div>
      <div className="space-y-1.5 px-5 py-4">
        <p className="line-clamp-2 text-[1.02rem] leading-7 text-[#30412d]">{product.tea_name}</p>
        {product.tea_type ? <p className="text-sm text-[#8a8378]">{product.tea_type}</p> : null}
        <p className="pt-1 text-[1.05rem] font-semibold text-[#6b8a5b]">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}

function SummaryRow({ label, value, emphasized = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={emphasized ? "text-[1.3rem] font-semibold text-[#2b352f]" : "text-[#70756d]"}>{label}</span>
      <span className={emphasized ? "text-[1.6rem] font-semibold text-[#7B9A67]" : "text-[#2e3d35]"}>{value}</span>
    </div>
  );
}

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [imageMap, setImageMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    Promise.all([
      fetch(apiUrl(`/orders/${orderId}`)).then(async (response) => {
        if (!response.ok) throw new Error("โหลดคำสั่งซื้อไม่สำเร็จ");
        return response.json();
      }),
      fetch(apiUrl("/products")).then(async (response) => {
        if (!response.ok) return [];
        return response.json();
      }),
      fetch(apiUrl("/product-images")).then(async (response) => {
        if (!response.ok) return [];
        return response.json();
      }),
    ])
      .then(([orderData, products, images]) => {
        if (ignore) return;

        const nextImageMap = buildImageMap(images);
        const orderedProductIds = new Set((orderData.items || []).map((item) => Number(item.product_id)));
        const normalizedProducts = (Array.isArray(products) ? products : []).map((product) => ({
          ...product,
          img: nextImageMap.get(Number(product.product_id)) || null,
        }));

        setOrder(orderData);
        setImageMap(nextImageMap);
        setRecommendations(
          normalizedProducts.filter((product) => !orderedProductIds.has(Number(product.product_id))).slice(0, 4)
        );
      })
      .catch((fetchError) => {
        if (!ignore) {
          setError(fetchError.message || "โหลดคำสั่งซื้อไม่สำเร็จ");
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [orderId]);

  const summary = useMemo(() => {
    if (!order) {
      return { subtotal: 0, shipping: 0, total: 0 };
    }

    const subtotal = Number(order.total_amount ?? 0);
    return {
      subtotal,
      shipping: 0,
      total: subtotal,
    };
  }, [order]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#F8F6EF_0%,#F4F7F0_35%,#F7F3E9_100%)] px-4 py-20 text-[#24321F]">
        <div className="mx-auto max-w-[1180px] animate-pulse space-y-8">
          <div className="h-20 rounded-[30px] bg-white/80" />
          <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
            <div className="h-[430px] rounded-[34px] bg-white/80" />
            <div className="h-[430px] rounded-[34px] bg-white/80" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#F8F6EF_0%,#F4F7F0_35%,#F7F3E9_100%)] px-4 py-20 text-[#24321F]">
        <div className="mx-auto max-w-2xl rounded-[34px] border border-[#e8e1d6] bg-white px-8 py-14 text-center shadow-[0_18px_55px_rgba(195,170,128,0.12)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#eef3e7] text-4xl text-[#577049]">
            !
          </div>
          <h1 className="mt-6 text-[2rem] font-semibold text-[#24321F]">ไม่พบคำสั่งซื้อ</h1>
          <p className="mt-3 text-[15px] leading-7 text-[#746d61]">{error || "ไม่สามารถโหลดรายละเอียดคำสั่งซื้อได้"}</p>
          <button
            type="button"
            onClick={() => navigate("/shop")}
            className="mt-8 rounded-full bg-[#7B9A67] px-6 py-3 text-sm font-semibold text-white"
          >
            กลับไปหน้า Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#F8F6EF_0%,#F4F7F0_35%,#F7F3E9_100%)] px-4 py-12 text-[#24321F] sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute left-[8%] top-[14rem] h-64 w-64 rounded-full bg-[#dce8cf]/45 blur-3xl" />
      <div className="pointer-events-none absolute right-[6%] top-[8rem] h-56 w-56 rounded-full bg-[#f0e4d1]/55 blur-3xl" />

      <div className="relative mx-auto max-w-[1180px]">
        <section className="pb-12 pt-6 text-center">
          <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full border-[10px] border-[#8eb39b] bg-white shadow-[0_18px_48px_rgba(123,154,103,0.24)]">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-[8px] border-[#7b9a67] text-4xl font-semibold text-[#7b9a67]">
              ✓
            </div>
          </div>
          <h1 className="mt-10 text-[3.1rem] font-semibold tracking-[-0.03em] text-[#86a99a]">Order Confirmed</h1>
          <p className="mx-auto mt-4 max-w-3xl text-[1.15rem] leading-9 text-[#7b817a]">
            Thank you for your order. Your tea selection is now in our system and we&apos;re preparing it for delivery.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <div className="rounded-[34px] border border-[#e6dfd5] bg-white px-6 py-7 shadow-[0_18px_55px_rgba(195,170,128,0.12)] sm:px-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[1.05rem] text-[#8d8a84]">Order Number</p>
                <p className="mt-2 text-[2rem] font-semibold tracking-[0.02em] text-[#22321f]">
                  {formatOrderCode(order.order_id)}
                </p>
              </div>
              <span className="rounded-full bg-[#7B9A67] px-5 py-2 text-sm font-semibold text-white">
                {order.status === "paid" ? "Paid" : "Confirmed"}
              </span>
            </div>

            <div className="mt-7 border-t border-[#ece7dd]" />

            <div className="mt-6 space-y-5">
              {(order.items || []).map((item) => (
                <div key={item.order_detail_id} className="grid grid-cols-[84px_minmax(0,1fr)_auto] items-start gap-4">
                  <ProductImage
                    src={imageMap.get(Number(item.product_id)) || null}
                    alt={item.tea_name}
                    className="h-[84px] w-[84px]"
                  />
                  <div className="min-w-0 pt-1">
                    <p className="text-[1.14rem] font-medium text-[#2e3d35]">{item.tea_name}</p>
                    <p className="mt-1 text-[0.98rem] text-[#9a978f]">{item.quantity} ชิ้น</p>
                  </div>
                  <div className="pt-1 text-right">
                    <p className="text-[1.2rem] font-medium text-[#2e3d35]">{formatPrice(item.unit_price)}</p>
                    <p className="mt-1 text-[0.98rem] text-[#9a978f]">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-7 border-t border-[#ece7dd] pt-6">
              <div className="space-y-4">
                <SummaryRow label="Subtotal" value={formatPrice(summary.subtotal)} />
                <SummaryRow label="Shipping" value={summary.shipping === 0 ? "Free" : formatPrice(summary.shipping)} />
              </div>

              <div className="mt-5 border-t border-[#ece7dd] pt-5">
                <SummaryRow label="Total" value={formatPrice(summary.total)} emphasized />
              </div>
            </div>
          </div>

          <div className="rounded-[34px] border border-[#e6dfd5] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,246,239,0.96))] px-6 py-7 shadow-[0_18px_55px_rgba(195,170,128,0.12)] sm:px-8">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#7B9A67] shadow-[0_12px_24px_rgba(195,170,128,0.12)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
                  <path d="M7 7h10v10H7z" />
                  <path d="M7 12h10" />
                  <path d="M12 7v10" />
                </svg>
              </div>
              <div>
                <h2 className="text-[2rem] font-semibold text-[#22321f]">Delivery Details</h2>
                <p className="mt-1 text-[1.02rem] leading-8 text-[#8b8f88]">
                  Your order will be carefully packaged and delivered to the selected address.
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-5">
              <div className="rounded-[26px] bg-white px-5 py-5 shadow-[0_14px_34px_rgba(195,170,128,0.10)]">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eef3e7] text-[#7B9A67]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
                      <circle cx="12" cy="12" r="8" />
                      <path d="M12 7v5l3 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[1.05rem] text-[#9a978f]">Estimated Delivery</p>
                    <p className="text-[1.45rem] font-semibold text-[#22321f]">{formatDeliveryDate(order.order_date)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] bg-white px-5 py-5 shadow-[0_14px_34px_rgba(195,170,128,0.10)]">
                <p className="text-[1.05rem] text-[#9a978f]">Delivery Address</p>
                <p className="mt-3 text-[1.2rem] leading-8 text-[#2b352f]">{buildAddress(order) || "รับที่ร้าน"}</p>
                {order.recipient_name || order.phone ? (
                  <p className="mt-3 text-sm text-[#7d7569]">
                    {[order.recipient_name, order.phone].filter(Boolean).join(" | ")}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-wrap justify-center gap-4 pb-16 pt-10">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-[#7B9A67] px-8 py-4 text-lg font-semibold text-white shadow-[0_18px_36px_rgba(123,154,103,0.20)]"
          >
            ↗
            Track Order
          </button>
          <button
            type="button"
            onClick={() => navigate("/shop")}
            className="inline-flex items-center gap-2 rounded-full border-2 border-[#7B9A67] bg-white px-8 py-4 text-lg font-semibold text-[#7B9A67]"
          >
            ←
            Back to Shop
          </button>
          <button
            type="button"
            onClick={() => navigate("/shop")}
            className="inline-flex items-center gap-2 rounded-full border border-[#e0dbd0] bg-white px-8 py-4 text-lg font-medium text-[#485B3B]"
          >
            ↺
            Order Again
          </button>
        </section>

        {recommendations.length > 0 ? (
          <section className="pb-16">
            <div className="mb-8 flex items-center justify-between gap-4">
              <h2 className="text-[2.1rem] font-semibold text-[#253621]">You May Also Like</h2>
              <button type="button" onClick={() => navigate("/shop")} className="text-lg font-medium text-[#7B9A67]">
                View All →
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {recommendations.map((product) => (
                <RecommendationCard key={product.product_id} product={product} />
              ))}
            </div>

            <p className="mt-14 text-center text-[1.05rem] text-[#8b8f88]">
              Questions about your order? Contact us at{" "}
              <a href="mailto:support@teatime.com" className="text-[#7B9A67]">
                support@teatime.com
              </a>
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
