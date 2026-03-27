import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiUrl } from "../../lib/api";
import { getAuthHeaders, getStoredToken, getUserIdFromToken } from "./authClient";
import usePersistentCart from "../hooks/usePersistentCart";

function formatPrice(price) {
  return `฿${Number(price ?? 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function PageCard({ children, className = "" }) {
  return (
    <section className={`rounded-[28px] border border-[#ece7dd] bg-white shadow-[0_18px_55px_rgba(195,170,128,0.12)] ${className}`}>
      {children}
    </section>
  );
}

function SectionHeader({ title, action, icon }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        {icon ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EEF3E7] text-[#617A50]">
            {icon}
          </div>
        ) : null}
        <h2 className="text-[1.05rem] font-semibold text-[#1f1b16] sm:text-[1.25rem]">{title}</h2>
      </div>
      {action ? <div className="text-sm font-medium text-[#8e8577]">{action}</div> : null}
    </div>
  );
}

function DeliveryOption({ selected, title, subtitle, meta, priceText, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full rounded-[22px] border px-4 py-4 text-left transition-all duration-300 ${
        selected
          ? "border-[#86A16E] bg-[#FBFDF7] shadow-[0_12px_32px_rgba(122,148,102,0.12)]"
          : "border-[#ece4d7] bg-[#fffdf9] hover:border-[#d8cdbb]"
      }`}
    >
      {selected ? (
        <div className="absolute left-0 top-0 h-12 w-12 overflow-hidden">
          <div className="absolute left-[-18px] top-[8px] rotate-[-45deg] bg-[#7B9A67] px-5 py-0.5 text-[10px] font-semibold text-white">
            OK
          </div>
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border ${
              selected ? "border-[#48603C] bg-[#48603C]" : "border-[#D7DED0] bg-white"
            }`}
          >
            <div className="h-2 w-2 rounded-full bg-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[1rem] font-semibold text-[#201c17]">{title}</p>
            <p className="mt-1 text-sm leading-6 text-[#7b7267]">{subtitle}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-[#1f1b16]">{meta}</p>
          <p className="mt-1 text-sm text-[#6B825B]">{priceText}</p>
        </div>
      </div>
    </button>
  );
}

function PaymentOption({ selected, title, description, badge, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-4 rounded-[20px] border px-4 py-4 text-left transition-all duration-300 ${
        selected
          ? "border-[#86A16E] bg-[#FBFDF7] shadow-[0_12px_32px_rgba(122,148,102,0.12)]"
          : "border-[#ece4d7] bg-[#fffdf9] hover:border-[#ddcfbd]"
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[1rem] font-semibold text-[#201c17]">{title}</p>
          {badge ? (
            <span className="rounded-full bg-[#E6EEDC] px-2.5 py-1 text-[11px] font-semibold text-[#577049]">
              {badge}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-[#7b7267]">{description}</p>
      </div>
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full border ${
          selected ? "border-[#7B9A67] bg-[#7B9A67] text-white" : "border-[#D7DED0] text-transparent"
        }`}
      >
        ✓
      </div>
    </button>
  );
}

function OrderItem({ item, onUpdateQty }) {
  const subtotal = Number(item.price ?? 0) * item.qty;

  return (
    <div className="flex gap-3 px-5 py-4 sm:px-6">
      <div className="h-24 w-24 overflow-hidden rounded-[18px] bg-[#f4efe7]">
        {item.img ? (
          <img src={item.img} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl text-[#b8a38a]">□</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="line-clamp-2 text-[1rem] font-semibold text-[#201c17]">{item.name}</p>
            <p className="mt-1 text-sm text-[#8a7f73]">{item.tag || "Tea powder"}</p>
          </div>
          <span className="whitespace-nowrap text-sm text-[#7f766a]">x{item.qty}</span>
        </div>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[1.1rem] font-semibold text-[#5D7A4B]">{formatPrice(subtotal)}</p>
            <p className="text-xs text-[#a19689]">{formatPrice(item.price)} ต่อชิ้น</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#faf6f0] px-2 py-1">
            <button
              type="button"
              onClick={() => onUpdateQty(item.id, item.qty - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#6f665b] shadow-sm"
            >
              -
            </button>
            <span className="min-w-6 text-center text-sm font-semibold text-[#221d17]">{item.qty}</span>
            <button
              type="button"
              onClick={() => onUpdateQty(item.id, item.qty + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#AFC19A] text-white"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddressSummary({ address, loading }) {
  if (loading) {
    return <p className="text-sm text-[#8b8176]">กำลังโหลดที่อยู่...</p>;
  }

  if (!address) {
    return <p className="text-sm text-[#577049]">โปรดเลือกที่อยู่</p>;
  }

  const fullAddress = [
    address.address_line,
    address.subdistrict,
    address.district,
    address.province,
    address.postal_code,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <p className="text-[1.05rem] font-semibold text-[#1d1914]">
        {address.recipient_name} <span className="font-normal text-[#8b8176]">{address.phone}</span>
      </p>
      <p className="mt-2 text-sm leading-7 text-[#70665a]">{fullAddress}</p>
    </>
  );
}

async function getErrorMessage(response, fallbackMessage) {
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) return "กรุณาเข้าสู่ระบบก่อนสั่งสินค้า";
  return data.error || data.message || fallbackMessage;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [cart, setCart] = usePersistentCart();
  const [deliveryMethod, setDeliveryMethod] = useState("delivery");
  const [paymentMethod, setPaymentMethod] = useState("promptpay");
  const [promoCode, setPromoCode] = useState("");
  const [address, setAddress] = useState(null);
  const [addressLoading, setAddressLoading] = useState(true);
  const [submitError, setSubmitError] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setAddress(null);
      setAddressLoading(false);
      return;
    }

    fetch(apiUrl("/user-addresses/default"), { headers: getAuthHeaders() })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((data) => setAddress(data || null))
      .catch(() => setAddress(null))
      .finally(() => setAddressLoading(false));
  }, []);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price ?? 0) * item.qty, 0),
    [cart]
  );
  const discount = promoCode.trim().toUpperCase() === "ATC20" ? subtotal * 0.2 : 0;
  const deliveryFee = deliveryMethod === "pickup" || subtotal >= 200 ? 0 : 30;
  const total = subtotal - discount + deliveryFee;
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const updateQty = (id, qty) => {
    if (qty <= 0) {
      setCart((previous) => previous.filter((item) => item.id !== id));
      return;
    }

    setCart((previous) => previous.map((item) => (item.id === id ? { ...item, qty } : item)));
  };

  const handlePlaceOrder = async () => {
    const userId = getUserIdFromToken();

    if (!userId) {
      setSubmitError("กรุณาเข้าสู่ระบบก่อนสั่งสินค้า");
      return;
    }

    if (!address) {
      setSubmitError("กรุณาเลือกที่อยู่จัดส่งก่อนสั่งสินค้า");
      return;
    }

    try {
      setSubmittingOrder(true);
      setSubmitError("");

      const response = await fetch(apiUrl("/orders"), {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          address_id: address.address_id,
          recipient_name: address.recipient_name,
          phone: address.phone,
          shipping_address: address.address_line,
          subdistrict: address.subdistrict,
          district: address.district,
          province: address.province,
          postal_code: address.postal_code,
          address_note: address.note || null,
          delivery_method: deliveryMethod,
          payment_method: paymentMethod,
          items: cart.map((item) => ({
            product_id: Number(item.id),
            quantity: Number(item.qty),
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "สั่งสินค้าไม่สำเร็จ"));
      }

      const result = await response.json();
      setCart([]);
      navigate(`/checkout/success/${result.order_id}`);
    } catch (error) {
      setSubmitError(error.message || "สั่งสินค้าไม่สำเร็จ");
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F6EF] px-4 py-12 text-[#24321F]">
        <div className="mx-auto max-w-2xl rounded-[32px] border border-dashed border-[#dfd5c7] bg-white px-6 py-14 text-center shadow-[0_20px_60px_rgba(195,170,128,0.12)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E6EEDC] text-3xl text-[#577049]">
            🛒
          </div>
          <h1 className="mt-5 text-[2rem] font-semibold">ยังไม่มีสินค้าในตะกร้า</h1>
          <p className="mx-auto mt-3 max-w-lg text-[15px] leading-7 text-[#7a7064]">
            เพิ่มผงชาที่ต้องการก่อน แล้วค่อยกลับมายืนยันการสั่งซื้อในหน้านี้
          </p>
          <button
            type="button"
            onClick={() => navigate("/shop")}
            className="mt-7 rounded-full bg-[#485B3B] px-6 py-3.5 text-sm font-semibold text-white"
          >
            กลับไปเลือกสินค้า
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F8F6EF_0%,#F4F7F0_35%,#F7F3E9_100%)] pb-36 text-[#24321F]">
      <header className="sticky top-0 z-30 border-b border-[#efe7db] bg-[rgba(251,247,241,0.92)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/shop")}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl text-[#577049] shadow-[0_8px_24px_rgba(123,154,103,0.14)]"
          >
            ←
          </button>
          <div className="text-center">
            <p className="text-[1.5rem] font-semibold sm:text-[2rem]">ทำการสั่งซื้อ</p>
            <p className="mt-1 text-sm text-[#8f8478]">ผงชาและอุปกรณ์สำหรับร้านของคุณ</p>
          </div>
          <Link
            to="/shop"
            className="hidden rounded-full border border-[#eadfce] bg-white px-4 py-2 text-sm font-medium text-[#7a7064] sm:inline-flex"
          >
            กลับไปเลือกสินค้า
          </Link>
        </div>
      </header>

      <main className="px-4 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1280px] gap-6 xl:grid-cols-[minmax(0,1.15fr)_380px]">
          <div className="space-y-5">
            <PageCard>
              <SectionHeader
                title="ที่อยู่สำหรับจัดส่ง"
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z" />
                    <circle cx="12" cy="10" r="2.2" />
                  </svg>
                }
              />
              <div className="border-t border-[#f1ebe1] px-5 py-5 sm:px-6">
                <Link
                  to="/checkout/address"
                  className="block rounded-[22px] bg-[#F8FBF4] px-4 py-4 transition-all duration-300 hover:bg-white hover:shadow-[0_12px_30px_rgba(122,148,102,0.10)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <AddressSummary address={address} loading={addressLoading} />
                    </div>
                    <span className="text-xl text-[#b0a698]">›</span>
                  </div>
                </Link>
              </div>
            </PageCard>

            <PageCard>
              <SectionHeader
                title="ตัวเลือกการจัดส่ง"
                action="ดูทั้งหมด"
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v7H3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h3l3 3v1h-6z" />
                    <circle cx="7.5" cy="18" r="1.5" />
                    <circle cx="17.5" cy="18" r="1.5" />
                  </svg>
                }
              />
              <div className="space-y-3 border-t border-[#f1ebe1] px-5 py-5 sm:px-6">
                <DeliveryOption
                  selected={deliveryMethod === "delivery"}
                  onClick={() => setDeliveryMethod("delivery")}
                  title="จัดส่งถึงบ้าน"
                  subtitle="บริการจัดส่งมาตรฐานสำหรับผงชาและสินค้าในตะกร้า"
                  meta="1-2 วัน"
                  priceText={deliveryFee === 0 ? "ส่งฟรี" : formatPrice(deliveryFee)}
                />
                <p className="text-sm text-[#7f766a]">รับโค้ดส่วนลด ฿30 หากได้รับสินค้าล่าช้า</p>
                <DeliveryOption
                  selected={deliveryMethod === "pickup"}
                  onClick={() => setDeliveryMethod("pickup")}
                  title="รับที่ร้าน"
                  subtitle="มารับเองที่หน้าร้าน Tea Artisan"
                  meta="พร้อมใน 15 นาที"
                  priceText="ไม่มีค่าส่ง"
                />
              </div>
            </PageCard>

            <PageCard>
              <SectionHeader
                title="โค้ดส่วนลดร้านค้า"
                action="กดใช้โค้ด"
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 10 10-5 5L4 10V5h5Z" />
                    <circle cx="7.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                }
              />
              <div className="border-t border-[#f1ebe1] px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={promoCode}
                    onChange={(event) => setPromoCode(event.target.value)}
                    placeholder="ใส่โค้ดส่วนลด"
                    className="w-full rounded-[18px] border border-[#D8E1CE] bg-[#FCFDF9] px-4 py-3.5 text-[15px] text-[#24321F] outline-none placeholder:text-[#9AA791] focus:border-[#7A9466] focus:shadow-[0_0_0_4px_rgba(122,148,102,0.10)]"
                  />
                  <button type="button" className="rounded-[18px] bg-[#7B9A67] px-5 py-3.5 text-sm font-semibold text-white">
                    ใช้โค้ด
                  </button>
                </div>
              </div>
            </PageCard>

            <PageCard>
              <SectionHeader
                title="ช่องทางการชำระเงิน"
                action="ดูทั้งหมด"
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                    <rect x="3" y="6" width="18" height="12" rx="2.5" />
                    <path strokeLinecap="round" d="M3 10h18" />
                  </svg>
                }
              />
              <div className="space-y-3 border-t border-[#f1ebe1] px-5 py-5 sm:px-6">
                <PaymentOption
                  selected={paymentMethod === "promptpay"}
                  onClick={() => setPaymentMethod("promptpay")}
                  title="QR พร้อมเพย์"
                  description="ชำระผ่าน QR Code ของร้าน"
                  badge="แนะนำ"
                />
                <PaymentOption
                  selected={paymentMethod === "bank"}
                  onClick={() => setPaymentMethod("bank")}
                  title="โอนผ่านธนาคาร"
                  description="แนบสลิปหลังชำระเงิน"
                />
                <PaymentOption
                  selected={paymentMethod === "cod"}
                  onClick={() => setPaymentMethod("cod")}
                  title="เก็บเงินปลายทาง"
                  description="ชำระเมื่อได้รับสินค้า"
                />
              </div>
            </PageCard>
          </div>

          <aside className="order-first xl:order-none">
            <div className="space-y-5 xl:sticky xl:top-28">
              <PageCard className="overflow-hidden">
                <SectionHeader
                  title={`รายการสินค้า ${itemCount} ชิ้น`}
                  action="ดูทั้งหมด"
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                      <path strokeLinecap="round" d="M6 7h12" />
                      <path strokeLinecap="round" d="M6 12h12" />
                      <path strokeLinecap="round" d="M6 17h8" />
                    </svg>
                  }
                />
                <div className="divide-y divide-[#f1ebe1]">
                  {cart.map((item) => (
                    <OrderItem key={item.id} item={item} onUpdateQty={updateQty} />
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-[#f1ebe1] px-5 py-4 text-[1.05rem] sm:px-6">
                  <span className="font-semibold text-[#312922]">สินค้ารวม {itemCount} ชิ้น</span>
                  <span className="text-[1.35rem] font-semibold text-[#1e1915]">{formatPrice(subtotal)}</span>
                </div>
              </PageCard>

              <PageCard className="overflow-hidden">
                <div className="border-b border-[#f1ebe1] px-6 py-5">
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#a39380]">Order Summary</p>
                  <h2 className="mt-2 text-[1.9rem] font-semibold text-[#1e1915]">สรุปคำสั่งซื้อ</h2>
                </div>
                <div className="space-y-3 border-t border-[#f1ebe1] px-6 py-5 text-[15px]">
                  <div className="flex items-center justify-between text-[#71685c]">
                    <span>ราคาสินค้า</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#71685c]">
                    <span>ค่าจัดส่ง</span>
                    <span>{deliveryFee === 0 ? "ส่งฟรี" : formatPrice(deliveryFee)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#769069]">
                    <span>ส่วนลด</span>
                    <span>{discount > 0 ? `-${formatPrice(discount)}` : formatPrice(0)}</span>
                  </div>
                  <div className="border-t border-[#f1ebe1] pt-4">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-sm text-[#8b8176]">รวมยอดสั่งซื้อ</p>
                        <p className="mt-1 text-[2.3rem] font-semibold leading-none text-[#5D7A4B]">
                          {formatPrice(total)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-[#8b8176]">ประหยัดไป</p>
                        <p className="mt-1 text-xl font-semibold text-[#769069]">
                          {formatPrice(discount + (deliveryFee === 0 ? 30 : 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </PageCard>
            </div>
          </aside>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#eee3d3] bg-[rgba(255,252,247,0.96)] px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-[#877d72]">รวมยอดสั่งซื้อ</p>
            <p className="text-[1.8rem] font-semibold leading-none text-[#5D7A4B]">{formatPrice(total)}</p>
            <p className="mt-1 text-sm text-[#769069]">
              ประหยัดไป {formatPrice(discount + (deliveryFee === 0 ? 30 : 0))}
            </p>
            {submitError ? <p className="mt-2 text-sm font-medium text-[#577049]">{submitError}</p> : null}
          </div>
          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={submittingOrder}
            className="min-w-[180px] rounded-[20px] bg-[#7B9A67] px-6 py-4 text-[1.05rem] font-semibold text-white shadow-[0_18px_36px_rgba(123,154,103,0.22)] transition-transform duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submittingOrder ? "กำลังสั่งสินค้า..." : "สั่งสินค้า"}
          </button>
        </div>
      </div>
    </div>
  );
}
