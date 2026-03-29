import { useEffect, useState } from "react";
import { Link, useParams } from 'react-router-dom';
import QRCode from "qrcode";
import generatePromptPayPayload from "promptpay-qr";
import { apiUrl } from "../../lib/api";
import SiteNavbar from "../components/SiteNavbar";
import { useAuthModal } from "../../App";

// ── Circular icon badge (matches the social-icon ring style) ──────────────
const IconBadge = ({ children, size = "md" }) => {
  const s = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  return (
    <span
      className={`${s} rounded-full border border-[#253621]/25 bg-[#F5F3E9] flex items-center justify-center flex-shrink-0`}
    >
      {children}
    </span>
  );
};

// ── SVG icons ────────────────────────────────────────────────────────────
const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#485B3B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconPin = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#485B3B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#485B3B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconHeart = ({ filled }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? "#ef4444" : "none"} stroke={filled ? "#ef4444" : "#485B3B"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const IconTag = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#485B3B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);

const IconStar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#485B3B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

function formatPrice(price) {
  return `฿${Number(price ?? 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function MockQrImage({ payload, amount }) {
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    let active = true;

    QRCode.toDataURL(payload, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 280,
      color: {
        dark: "#24321F",
        light: "#FFFFFF",
      },
    })
      .then((dataUrl) => {
        if (active) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (active) setQrDataUrl("");
      });

    return () => {
      active = false;
    };
  }, [payload]);

  if (!qrDataUrl) {
    return <div className="h-48 w-48 animate-pulse rounded-[16px] bg-[#eef2e8]" />;
  }

  return (
    <div className="relative">
      <img src={qrDataUrl} alt={`PromptPay QR ${amount}`} className="h-48 w-48 rounded-[16px] bg-white object-contain" />
      <div className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-[#0d5bd1] text-[9px] font-bold tracking-[0.12em] text-white shadow-[0_8px_20px_rgba(13,91,209,0.28)]">
        PP
      </div>
    </div>
  );
}

function EventPromptPayModal({ open, orderId, title, amount, processing, onClose, onConfirm }) {
  if (!open) return null;

  const promptPayNumber = "0812345678";
  const qrPayload = generatePromptPayPayload(promptPayNumber, { amount });
  const reference = `EV-${String(orderId).padStart(6, "0")}`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(28,24,19,0.46)] px-4 backdrop-blur-sm">
      <div className="w-full max-w-[30rem] rounded-[28px] border border-[#e7dfd2] bg-white p-5 shadow-[0_30px_80px_rgba(37,31,24,0.28)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8b9a79]">Mock QR Payment</p>
            <h3 className="mt-2 text-[1.65rem] font-semibold text-[#22321f]">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f6f2ea] text-lg text-[#6f665b]"
          >
            ×
          </button>
        </div>

        <div className="mt-4 rounded-[22px] border border-[#dfe8d5] bg-[linear-gradient(180deg,#fbfdf7_0%,#f5f8ef_100%)] p-4">
          <div className="rounded-[22px] bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            <div className="rounded-[20px] border border-[#ece5d8] bg-[linear-gradient(180deg,#ffffff_0%,#fbf8f1_100%)] px-4 py-4">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b9a79]">
                <span>PromptPay QR</span>
                <span>Mock</span>
              </div>
              <div className="mt-3 flex justify-center">
                <MockQrImage payload={qrPayload} amount={amount} />
              </div>
              <div className="mt-4 rounded-[18px] bg-[#f7f3eb] px-4 py-3 text-left">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b9a79]">Event</p>
                    <p className="mt-1 text-sm font-semibold text-[#22321f]">{title}</p>
                    <p className="mt-1 text-xs text-[#8a8072]">PromptPay {promptPayNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b9a79]">Amount</p>
                    <p className="mt-1 text-lg font-semibold text-[#5D7A4B]">{formatPrice(amount)}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-[#8b8176]">Order #{orderId}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#9b927f]">Ref {reference}</p>
              <p className="mt-2 text-[13px] leading-6 text-[#6f665b]">Scan this QR to simulate payment for event registration</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onConfirm}
            disabled={processing}
            className="flex-1 rounded-[18px] bg-[#7B9A67] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {processing ? "Confirming..." : "Simulate Scan Success"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="rounded-[18px] border border-[#e2d9cb] bg-[#fffdf9] px-5 py-3 text-sm font-semibold text-[#6f665b] disabled:opacity-60"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Eventdetails() {

  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [isInterested, setIsInterested] = useState(false);
  const { token } = useAuthModal();
  const [error, setError] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [showPromptPay, setShowPromptPay] = useState(false);
  const [confirmingPromptPay, setConfirmingPromptPay] = useState(false);

  const [user, setUser] = useState(null);
  const role = user?.role;

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [sponsorStatus, setSponsorStatus] = useState(null);
  const attendeeCount = registrationStatus === "confirmed" ? 1 : 0;

  // ---------------- PROFILE ----------------
  useEffect(() => {
    if (!token) return;
    fetch(apiUrl("/auth/profile"), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUser(data.user))
      .catch(console.error);
  }, [token]);

  // ---------------- LOAD PRODUCTS ----------------
  useEffect(() => {
    if (!token || role !== "shop") return;
    fetch(apiUrl("/products/mine"), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(console.error);
  }, [token, role]);

  // ---------------- LOAD EVENT ----------------
  useEffect(() => {
    fetch(apiUrl(`/events/${id}`))
      .then(res => {
        if (!res.ok) throw new Error(`Event ${id} ${res.status}`);
        return res.json();
      })
      .then(data => { setEvent(data); setError(null); })
      .catch(err => { setEvent(null); setError(err.message); });

    if (token) {
      fetch(apiUrl(`/events/${id}/interested/check`), {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setIsInterested(data.isInterested));

      fetch(apiUrl(`/events/${id}/register/check`), {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setRegistrationStatus(data.registration_status));

      fetch(apiUrl(`/events/${id}/sponsor/check`), {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => { if (data.exists) setSponsorStatus(data.status); })
        .catch(console.error);
    }
  }, [id, token]);

  // ---------------- INTEREST ----------------
  const toggleInterested = async () => {
    if (!token) { alert("Please login first"); return; }
    try {
      const method = isInterested ? "DELETE" : "POST";
      const res = await fetch(apiUrl(`/events/${id}/interested`), {
        method, headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(await res.text());
      setIsInterested(!isInterested);
    } catch (err) { alert(err.message); }
  };

  // ---------------- REGISTER ----------------
  const toggleRegister = async () => {
    if (!token) { alert("Please login first"); return; }
    try {
      const method =
        registrationStatus === "pending" || registrationStatus === "confirmed"
          ? "DELETE" : "POST";
      const res = await fetch(apiUrl(`/events/${id}/register`), {
        method, headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setRegistrationStatus(method === "POST" ? "pending" : "cancelled");
    } catch (err) { alert(err.message); }
  };

  // ---------------- SPONSOR ----------------
  const sendSponsor = async () => {
    if (!selectedProduct) { alert("Please select product"); return; }
    try {
      const res = await fetch(apiUrl(`/events/${id}/sponsor`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: selectedProduct, quantity })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert("Sponsor request sent!");
    } catch (err) { alert(err.message); }
  };

  const handleRegisterClick = async () => {
    if (!token) {
      alert("Please login first");
      return;
    }

    if (registrationStatus === "confirmed") {
      await toggleRegister();
      return;
    }

    if (registrationStatus !== "pending") {
      await toggleRegister();
    }

    setShowPromptPay(true);
  };

  const handleConfirmPromptPay = () => {
    setConfirmingPromptPay(true);
    setTimeout(() => {
      setRegistrationStatus("confirmed");
      setConfirmingPromptPay(false);
      setShowPromptPay(false);
    }, 700);
  };

  if (error) return (
    <div className="min-h-screen bg-[#F5F3E9]">
      <SiteNavbar active="events" />
      <div className="max-w-[700px] mx-auto mt-16 px-6">
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-center text-red-600">{error}</div>
      </div>
    </div>
  );

  if (!event) return (
    <div className="min-h-screen bg-[#F5F3E9] flex items-center justify-center">
      <div className="text-[#879A78] text-sm animate-pulse">Loading event…</div>
    </div>
  );

  const sponsorBtnConfig = {
    pending:  { label: "Pending",      cls: "bg-amber-400 text-white cursor-not-allowed" },
    approved: { label: "Approved",     cls: "bg-green-500 text-white cursor-not-allowed" },
    rejected: { label: "Rejected — Resend", cls: "bg-red-400 text-white" },
    default:  { label: "Send Sponsor", cls: "bg-[#485B3B] text-white hover:bg-[#394A31]" },
  };
  const sBtn = sponsorBtnConfig[sponsorStatus ?? "default"] || sponsorBtnConfig.default;

  return (
    <div className="min-h-screen bg-[#F5F3E9] font-sans">
      <SiteNavbar active="events" />

      <main className="max-w-[1100px] mx-auto px-5 py-12">

        {/* ── BREADCRUMB ────────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-xs text-[#879A78] mb-8">
          <Link to="/events" className="hover:text-[#485B3B] transition">Events</Link>
          <span>›</span>
          <span className="text-[#253621] font-medium truncate max-w-[260px]">{event.title}</span>
        </div>

        {/* ── MAIN CARD ─────────────────────────────────────────── */}
        <div className="rounded-[2rem] border border-[#DFE6D6] bg-white shadow-[0_24px_64px_rgba(72,91,59,0.10)] overflow-hidden grid grid-cols-1 lg:grid-cols-2">

          {/* LEFT — info */}
          <div className="p-8 lg:p-10 flex flex-col gap-7">

            {/* Title block */}
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#879A78] mb-2">
                Organizer #{event.organizer_id}
              </p>
              <h1 className="text-2xl lg:text-3xl font-semibold text-[#253621] leading-snug">
                {event.title}
              </h1>
            </div>

            {/* ── META INFO with circular icon badges ─────────── */}
            <div className="flex flex-col gap-3">

              {/* Date */}
              <div className="flex items-center gap-3">
                <IconBadge>
                  <IconClock />
                </IconBadge>
                <span className="text-sm text-[#66755D]">
                  {new Date(event.event_date).toLocaleDateString("th-TH", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric"
                  })}
                </span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-3">
                <IconBadge>
                  <IconPin />
                </IconBadge>
                <span className="text-sm text-[#66755D]">{event.location}</span>
              </div>

              {/* Capacity */}
              <div className="flex items-center gap-3">
                <IconBadge>
                  <IconUsers />
                </IconBadge>
                <span className="text-sm text-[#66755D]">
                  {attendeeCount} / {event.max_participant} attending
                </span>
              </div>

            </div>

            {/* ── QUICK ACTIONS row (interested + review) ──────── */}
            <div className="flex items-center gap-3">

              {/* Interested — circular icon badge button */}
              <button
                onClick={toggleInterested}
                title={isInterested ? "Remove interest" : "Mark as interested"}
                className="w-10 h-10 rounded-full border border-[#253621]/25 bg-[#F5F3E9] flex items-center justify-center hover:border-red-300 hover:bg-red-50 transition"
              >
                <IconHeart filled={isInterested} />
              </button>

              {/* Review — circular icon badge button */}
              <Link
                to={`/review/${event.event_id}`}
                title="Write a review"
                className="w-10 h-10 rounded-full border border-[#253621]/25 bg-[#F5F3E9] flex items-center justify-center hover:border-[#485B3B] hover:bg-[#EEF3E9] transition"
              >
                <IconStar />
              </Link>

              <span className="text-xs text-[#879A78] ml-1">
                {isInterested ? "You're interested in this event" : "Interested? Let us know"}
              </span>
            </div>

            {/* ── SPONSOR PRODUCT PICKER (shop only) ───────────── */}
            {role === "shop" && (
              <div className="p-5 rounded-[1.25rem] border border-[#DFE6D6] bg-[#F5F3E9]">
                <div className="flex items-center gap-2 mb-3">
                  <IconBadge size="sm">
                    <IconTag />
                  </IconBadge>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#879A78]">
                    Sponsor this event
                  </p>
                </div>
                <div className="flex gap-3">
                  <select
                    value={selectedProduct}
                    onChange={e => setSelectedProduct(e.target.value)}
                    className="flex-1 border border-[#DFE6D6] rounded-xl px-3 py-2 text-sm text-[#253621] bg-white focus:outline-none focus:ring-2 focus:ring-[#6f8b5d]/30"
                  >
                    <option value="">Select product</option>
                    {products.map(p => (
                      <option key={p.product_id} value={p.product_id}>{p.tea_name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    min="1"
                    className="w-20 border border-[#DFE6D6] rounded-xl px-3 py-2 text-sm text-[#253621] bg-white focus:outline-none focus:ring-2 focus:ring-[#6f8b5d]/30"
                  />
                </div>
              </div>
            )}

            {/* ── PRIMARY CTA ──────────────────────────────────── */}
            <div className="flex flex-wrap gap-3 mt-auto">
              {role === "shop" ? (
                <button
                  onClick={sendSponsor}
                  disabled={sponsorStatus === "pending" || sponsorStatus === "approved"}
                  className={`rounded-full px-6 py-2.5 text-sm font-semibold shadow-[0_8px_20px_rgba(72,91,59,0.18)] transition-all duration-300 ${sBtn.cls}`}
                >
                  {sBtn.label}
                </button>
              ) : (
                <button
                  onClick={handleRegisterClick}
                  className={`rounded-full px-6 py-2.5 text-sm font-semibold shadow-[0_8px_20px_rgba(72,91,59,0.15)] transition-all duration-300 ${
                    registrationStatus === "confirmed"
                      ? "bg-green-500 text-white"
                      : registrationStatus === "pending"
                      ? "bg-amber-400 text-white"
                      : "bg-[#485B3B] text-white hover:bg-[#394A31]"
                  }`}
                >
                  {registrationStatus === "pending"
                    ? "Waiting for payment"
                    : registrationStatus === "confirmed"
                    ? "✓ Registered"
                    : "Register for event"}
                </button>
              )}

              {registrationStatus === "cancelled" && (
                <p className="self-center text-xs text-[#879A78]">Registration cancelled</p>
              )}
            </div>

          </div>

          {/* RIGHT — image */}
          <div className="relative min-h-[260px] lg:min-h-0">
            <img
              src="/Pictrue/Activity.png"
              alt="event"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(19,29,16,0.05),rgba(19,29,16,0.18))]" />
          </div>

        </div>
      </main>

      <EventPromptPayModal
        open={showPromptPay}
        orderId={event?.event_id}
        title={event?.title}
        amount={Number(event?.price ?? 0)}
        processing={confirmingPromptPay}
        onConfirm={handleConfirmPromptPay}
        onClose={() => setShowPromptPay(false)}
      />
    </div>
  );
}
