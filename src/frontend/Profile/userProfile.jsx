import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import SiteNavbar from "../components/SiteNavbar";
import { apiUrl } from "../../lib/api";
import {
  getAvatarStorageKey,
  getStoredAvatar,
  getUserIdFromToken,
  getTokenPayload,
  getAuthHeaders,
} from "../Shop/authClient";

function extractDominantColor(imgSrc) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 64;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 16) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
      resolve({ r, g, b });
    };
    img.onerror = () => resolve(null);
    img.src = imgSrc;
  });
}

function formatPrice(price) {
  return `THB ${Number(price ?? 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const EMPTY_STATE = {
  name: "User",
  bio: "No additional profile details yet.",
};

export default function UserProfile() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [purchaseFilter, setPurchaseFilter] = useState("all");
  const [purchaseSearch, setPurchaseSearch] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const [coverColor, setCoverColor] = useState(null);
  const ORDERS_PER_PAGE = 10;

  const tokenPayload = getTokenPayload();
  const userId = getUserIdFromToken();

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      setLoading(true);

      try {
        const headers = getAuthHeaders();
        const [userRes, ordersRes, registrationsRes] = await Promise.all([
          userId
            ? fetch(apiUrl(`/users/${userId}`), { headers })
                .then((response) => (response.ok ? response.json() : null))
                .catch(() => null)
            : Promise.resolve(null),
          userId
            ? fetch(apiUrl(`/orders/user/${userId}`), { headers })
                .then((response) => (response.ok ? response.json() : []))
                .catch(() => [])
            : Promise.resolve([]),
          userId
            ? fetch(apiUrl(`/registrations/user/${userId}`), { headers })
                .then((response) => (response.ok ? response.json() : []))
                .catch(() => [])
            : Promise.resolve([]),
        ]);

        if (ignore) return;

        setUser(userRes || tokenPayload || EMPTY_STATE);
        setOrders(Array.isArray(ordersRes) ? ordersRes : []);
        setRegistrations(Array.isArray(registrationsRes) ? registrationsRes : []);
      } catch (error) {
        console.error(error);
        if (!ignore) {
          setUser(tokenPayload || EMPTY_STATE);
          setOrders([]);
          setRegistrations([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      ignore = true;
    };
  }, [userId]);

  async function openOrder(order) {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(apiUrl(`/orders/${order.order_id}`), { headers });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Failed to load order");
      }

      const payload = await response.json();
      setSelectedOrder(payload);
      setShowOrderModal(true);
    } catch (error) {
      console.error(error);
      alert("Unable to load order details.");
    }
  }

  async function uploadAvatar() {
    if (!selectedFile || !userId) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("avatar", selectedFile);

      const headers = getAuthHeaders();
      const response = await fetch(apiUrl(`/users/${userId}/avatar`), {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const payload = await response.json();
      if (payload?.avatar) {
        const avatarKey = getAvatarStorageKey(userId);
        if (avatarKey) localStorage.setItem(avatarKey, payload.avatar);
        localStorage.removeItem("avatar");
      }

      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Avatar upload failed.");
    } finally {
      setUploading(false);
    }
  }

  const displayName =
    user?.username || user?.name || tokenPayload?.username || tokenPayload?.name || "User";
  const displayBio = user?.bio || tokenPayload?.bio || EMPTY_STATE.bio;

  const avatarSrc = previewUrl || user?.avatar || getStoredAvatar() || tokenPayload?.avatar || "/Pictrue/default-avatar.png";

  useEffect(() => {
    if (!avatarSrc) return;
    extractDominantColor(avatarSrc).then((color) => {
      if (color) setCoverColor(color);
    });
  }, [avatarSrc]);

  const coverGradient = coverColor
    ? `linear-gradient(135deg, rgb(${coverColor.r}, ${coverColor.g}, ${coverColor.b}) 0%, rgb(${Math.min(255, coverColor.r + 40)}, ${Math.min(255, coverColor.g + 35)}, ${Math.min(255, coverColor.b + 30)}) 50%, rgb(${Math.min(255, coverColor.r + 70)}, ${Math.min(255, coverColor.g + 60)}, ${Math.min(255, coverColor.b + 50)}) 100%)`
    : "linear-gradient(135deg, #b89463 0%, #d2ae7b 48%, #7d5e39 100%)";

  function TabButton({ id, label }) {
    const active = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`rounded-full px-4 py-2 ${
          active ? "border-b-2 border-[#485B3B] font-semibold text-[#485B3B]" : "text-[#4a4a4a]"
        }`}
      >
        {label}
      </button>
    );
  }

  function OrderRow({ order }) {
    return (
      <div
        onClick={() => openOrder(order)}
        className="flex cursor-pointer items-center justify-between gap-4 rounded-lg bg-white p-4 shadow-sm"
      >
        <div>
          <div className="text-sm text-[#6f7b70]">
            Order #{order.order_id} | {new Date(order.order_date).toLocaleString("th-TH")}
          </div>
          <div className="mt-1 font-medium">
            {order.items?.map((item) => item.name || item.tea_name).filter(Boolean).slice(0, 2).join(", ") ||
              "Products"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-[#6f7b70]">{formatPrice(order.total || order.total_amount)}</div>
          <div
            className="mt-2 inline-block rounded-full px-3 py-1 text-sm font-semibold text-white"
            style={{ background: order.status === "delivered" ? "#6B8A5B" : "#87a179" }}
          >
            {order.status || "pending"}
          </div>
        </div>
      </div>
    );
  }

  const navigate = useNavigate();

  function RegistrationRow({ registration }) {
    const registrationDate =
      registration.created_at ||
      registration.registered_at ||
      registration.registration_date ||
      Date.now();

    return (
      <div
        onClick={() => registration.event_id && navigate(`/events/${registration.event_id}`)}
        className="flex cursor-pointer items-center justify-between gap-4 rounded-lg bg-white p-4 shadow-sm transition-colors hover:bg-[#fafdf7]"
      >
        <div>
          <div className="text-sm text-[#6f7b70]">
            Registration #{registration.registration_id} | {new Date(registrationDate).toLocaleDateString("th-TH")}
          </div>
          <div className="mt-1 font-medium text-[#24321F]">
            {registration.event_title || registration.title || `Event ${registration.event_id || ""}`}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="inline-block rounded-full px-3 py-1 text-sm font-semibold text-white"
            style={{
              background:
                registration.registration_status === "registered" ? "#6B8A5B" : "#c0392b",
            }}
          >
            {registration.registration_status || "registered"}
          </div>
          <svg className="h-4 w-4 text-[#b0a99a]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F2]">
        <SiteNavbar />
        <div className="mx-auto max-w-[1200px] px-6 py-12">
          <div className="h-44 rounded-lg bg-[#e7e0d5]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F2]">
      <SiteNavbar active="" />

      {/* ── Hero cover (gradient from avatar color) ── */}
      <section className="relative overflow-hidden">
        <div
          className="h-[24rem] w-full sm:h-[28rem] lg:h-[32rem] transition-all duration-700"
          style={{ background: coverGradient }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(28,23,17,0.05)_0%,rgba(250,248,242,0.10)_50%,#FAF8F2_90%)]" />

        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto flex max-w-[1280px] px-6 pb-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
              {/* Avatar */}
              <div className="h-36 w-36 overflow-hidden rounded-full border-[6px] border-white bg-white shadow-[0_20px_50px_rgba(61,47,31,0.20)] sm:h-44 sm:w-44">
                <img
                  src={avatarSrc}
                  alt="avatar"
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Name + bio + buttons */}
              <div className="pb-2">
                <h1 className="font-serif text-[clamp(2.1rem,4vw,4.2rem)] tracking-[-0.04em] text-[#24321F]">
                  {displayName}
                </h1>
                <p className="mt-3 text-[1.1rem] text-[#68786a] sm:text-[1.35rem]">{displayBio}</p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <label className="cursor-pointer rounded-full border border-[#D4DDC9] bg-white/90 px-5 py-2.5 text-sm font-semibold text-[#51684A] shadow-[0_10px_24px_rgba(195,170,128,0.12)]">
                    Choose image
                    <input
                      type="file"
                      name="avatar"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          setSelectedFile(file);
                          setPreviewUrl(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>

                  <button
                    disabled={!selectedFile || uploading}
                    onClick={uploadAvatar}
                    className="rounded-full bg-[#485B3B] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(195,170,128,0.12)] disabled:opacity-60"
                  >
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main content ── */}
      <main className="mx-auto max-w-[1280px] px-6 pb-20">
        <div className="mt-8 rounded-[14px] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-6">
            <TabButton id="overview" label="Overview" />
            <TabButton id="purchases" label="Purchases" />
            <TabButton id="events" label="Events" />
            <TabButton id="about" label="About" />
          </div>
        </div>

        <div className="mt-6">
          {activeTab === "overview" ? (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Recent orders</h2>
              {orders.length === 0 ? (
                <div className="rounded-lg bg-white p-6 text-[#6f7b70]">No orders yet.</div>
              ) : (
                <div className="max-h-[500px] space-y-4 overflow-y-auto rounded-xl border border-[#e6e3da] bg-[#faf8f2] p-4">
                  {orders
                    .slice()
                    .reverse()
                    .map((order) => (
                      <OrderRow key={order.order_id} order={order} />
                    ))}
                </div>
              )}

              <h2 className="mt-6 text-xl font-semibold">Registered events</h2>
              {registrations.length === 0 ? (
                <div className="rounded-lg bg-white p-6 text-[#6f7b70]">No registrations yet.</div>
              ) : (
                <div className="space-y-4">
                  {registrations
                    .slice()
                    .reverse()
                    .map((registration) => (
                      <RegistrationRow
                        key={registration.registration_id}
                        registration={registration}
                      />
                    ))}
                </div>
              )}
            </div>
          ) : null}

          {activeTab === "purchases" ? (
            <PurchasesTab
              orders={orders}
              filter={purchaseFilter}
              onFilterChange={setPurchaseFilter}
              search={purchaseSearch}
              onSearchChange={setPurchaseSearch}
              onViewOrder={openOrder}
            />
          ) : null}

          {activeTab === "events" ? (
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="flex-1 space-y-4">
                {registrations.length === 0 ? (
                  <div className="rounded-lg bg-white p-6 text-[#6f7b70]">No registrations yet.</div>
                ) : (
                  registrations
                    .slice()
                    .reverse()
                    .map((registration) => (
                      <RegistrationRow
                        key={registration.registration_id}
                        registration={registration}
                      />
                    ))
                )}
              </div>
              <div className="w-full lg:w-[370px]">
                <EventCalendar registrations={registrations} />
              </div>
            </div>
          ) : null}

          {activeTab === "about" ? (
            <div className="rounded-lg bg-white p-6">
              <h3 className="font-semibold">About</h3>
              <p className="mt-3 text-[#6f7b70]">
                {user?.about || user?.bio || tokenPayload?.bio || EMPTY_STATE.bio}
              </p>
            </div>
          ) : null}
        </div>
      </main>

      {showOrderModal && selectedOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowOrderModal(false)} />
          <div className="relative mx-4 max-h-[80vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold">Order #{selectedOrder.order_id}</h3>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-sm text-gray-600"
              >
                Close
              </button>
            </div>

            <div className="mt-2 text-sm text-[#6f7b70]">
              Status: <span className="font-medium">{selectedOrder.status}</span>
            </div>
            <div className="mt-1 text-sm text-[#6f7b70]">
              Payment: <span className="font-medium">{selectedOrder.payment_status || "unknown"}</span>
            </div>

            <div className="mt-4 space-y-3">
              {selectedOrder.items && selectedOrder.items.length > 0 ? (
                selectedOrder.items.map((item) => (
                  <div
                    key={item.order_detail_id || item.product_id}
                    className="flex items-center justify-between border-b pb-2"
                  >
                    <div>
                      <div className="font-medium">
                        {item.tea_name || item.name || `Product ${item.product_id || ""}`}
                      </div>
                      <div className="text-sm text-[#6f7b70]">
                        x{item.quantity} | {formatPrice(item.unit_price)}
                      </div>
                    </div>
                    <div className="font-medium">{formatPrice(item.subtotal)}</div>
                  </div>
                ))
              ) : (
                <div className="text-[#6f7b70]">No items found.</div>
              )}
            </div>

            <div className="mt-4 text-right font-semibold">
              Total: {formatPrice(selectedOrder.total || selectedOrder.total_amount)}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const STATUS_CONFIG = {
  paid: { label: "Paid", color: "#6B8A5B", bg: "#6B8A5B18" },
  pending: { label: "Preparing", color: "#D4A017", bg: "#D4A01718" },
  preparing: { label: "Preparing", color: "#D4A017", bg: "#D4A01718" },
  completed: { label: "Completed", color: "#6B8A5B", bg: "#6B8A5B18" },
  delivered: { label: "Completed", color: "#6B8A5B", bg: "#6B8A5B18" },
  cancelled: { label: "Cancelled", color: "#c0392b", bg: "#c0392b18" },
};

function getStatusConfig(status) {
  return STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.pending;
}

function PurchasesTab({ orders, filter, onFilterChange, search, onSearchChange, onViewOrder }) {
  const filtered = useMemo(() => {
    let list = orders.slice().reverse();
    if (filter !== "all") {
      list = list.filter((o) => {
        const s = (o.status || "pending").toLowerCase();
        if (filter === "preparing") return s === "pending" || s === "preparing";
        if (filter === "completed") return s === "completed" || s === "delivered" || s === "paid";
        if (filter === "cancelled") return s === "cancelled";
        return true;
      });
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (o) =>
          String(o.order_id).includes(q) ||
          o.items?.some((i) => (i.name || i.tea_name || "").toLowerCase().includes(q))
      );
    }
    return list;
  }, [orders, filter, search]);

  const tabs = [
    { id: "all", label: "All" },
    { id: "preparing", label: "Preparing" },
    { id: "completed", label: "Completed" },
    { id: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-[#24321F]">My Orders</h2>
      <p className="mt-1 text-[#6f7b70]">Track and manage your tea orders</p>

      <div className="mt-5 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onFilterChange(t.id)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              filter === t.id
                ? "bg-[#485B3B] text-white shadow"
                : "bg-[#f5f3ed] text-[#6f7b70] hover:bg-[#ebe8e0]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="relative mt-4">
        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b0a99a]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
        <input
          type="text"
          placeholder="Search by order number or product name..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-xl border border-[#e6e3da] bg-[#faf8f2] py-2.5 pl-10 pr-4 text-sm text-[#24321F] placeholder:text-[#b0a99a] focus:border-[#485B3B] focus:outline-none"
        />
      </div>

      <div className="mt-6 max-h-[520px] overflow-y-auto rounded-xl border border-[#e6e3da] bg-[#faf8f2] p-4">
        {filtered.length === 0 ? (
          <div className="rounded-xl bg-[#faf8f2] py-12 text-center text-[#6f7b70]">
            No orders found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filtered.map((order) => (
              <OrderCard key={order.order_id} order={order} onViewOrder={onViewOrder} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, onViewOrder }) {
  const status = getStatusConfig(order.status);
  const paymentStatus = getStatusConfig(order.payment_status || order.status);
  const itemNames = order.items
    ?.map((i) => i.name || i.tea_name)
    .filter(Boolean)
    .join(", ") || "Products";

  return (
    <div className="rounded-xl border border-[#f0ede6] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f5f3ed] text-[#485B3B]">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m16.5 0h-16.5m16.5 0l-1.5-3h-13.5l-1.5 3" /></svg>
          </div>
          <div>
            <div className="text-xs text-[#6f7b70]">Order</div>
            <div className="text-lg font-bold text-[#24321F]">#ORD-{order.order_id}</div>
          </div>
        </div>
        <span
          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
          style={{ background: status.bg, color: status.color }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: status.color }} />
          {status.label}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3 text-sm text-[#6f7b70]">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
        <span>
          {new Date(order.order_date).toLocaleString("en-US", {
            month: "short", day: "numeric", year: "numeric",
            hour: "2-digit", minute: "2-digit",
          })}
        </span>
        <span className="mx-1">·</span>
        <span className="font-medium" style={{ color: paymentStatus.color }}>
          {paymentStatus.label}
        </span>
      </div>

      <div className="mt-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#b0a99a]">Items</div>
        <div className="mt-2 text-sm text-[#6f7b70]">{itemNames}</div>
      </div>

      <div className="mt-4 flex items-end justify-between border-t border-[#f0ede6] pt-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#b0a99a]">Total Amount</div>
          <div className="text-xl font-bold text-[#24321F]">
            {formatPrice(order.total || order.total_amount)}
          </div>
        </div>
        <button
          onClick={() => onViewOrder(order)}
          className="rounded-lg border border-[#e6e3da] px-5 py-2 text-sm font-medium text-[#485B3B] transition-colors hover:bg-[#f5f3ed]"
        >
          View Details
        </button>
      </div>
    </div>
  );
}

function EventCalendar({ registrations }) {
  const [viewDate, setViewDate] = useState(() => new Date());

  const eventDates = useMemo(() => {
    const map = {};
    for (const r of registrations) {
      const d = r.event_date;
      if (!d) continue;
      const key = new Date(d).toISOString().slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(r);
    }
    return map;
  }, [registrations]);

  const [selectedDate, setSelectedDate] = useState(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const DAY_LABELS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
  const MONTH_NAMES = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];

  const todayKey = new Date().toISOString().slice(0, 10);

  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: prevMonthDays - firstDay + 1 + i, outside: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, outside: false, key, events: eventDates[key] || [] });
  }
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      cells.push({ day: i, outside: true });
    }
  }

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const selectedEvents = selectedDate ? (eventDates[selectedDate] || []) : [];

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="rounded-lg p-1.5 text-[#6f7b70] hover:bg-[#f5f3ed]">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-sm font-semibold text-[#24321F]">
          {MONTH_NAMES[month]} {year + 543}
        </span>
        <button onClick={nextMonth} className="rounded-lg p-1.5 text-[#6f7b70] hover:bg-[#f5f3ed]">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 text-center text-xs font-medium text-[#6f7b70]">
        {DAY_LABELS.map((label) => (
          <div key={label} className="py-1">{label}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-[2px]">
        {cells.map((cell, idx) => {
          const isToday = !cell.outside && cell.key === todayKey;
          const hasEvents = !cell.outside && cell.events && cell.events.length > 0;
          const isSelected = !cell.outside && cell.key === selectedDate;

          return (
            <button
              key={idx}
              disabled={cell.outside}
              onClick={() => {
                if (!cell.outside) setSelectedDate(cell.key === selectedDate ? null : cell.key);
              }}
              className={`relative flex h-10 w-full items-center justify-center rounded-lg text-sm transition-colors
                ${cell.outside ? "text-[#d1cdc4] cursor-default" : "hover:bg-[#f5f3ed] cursor-pointer"}
                ${isToday ? "font-bold ring-1 ring-[#485B3B]" : ""}
                ${isSelected ? "bg-[#485B3B] text-white hover:bg-[#3a4c2e]" : ""}
                ${hasEvents && !isSelected ? "font-semibold text-[#485B3B]" : ""}
              `}
            >
              {cell.day}
              {hasEvents && (
                <span className={`absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${isSelected ? "bg-white" : "bg-[#485B3B]"}`} />
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-4 border-t border-[#f0ede6] pt-3">
          <h4 className="text-xs font-semibold text-[#6f7b70]">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
          </h4>
          {selectedEvents.length === 0 ? (
            <p className="mt-2 text-sm text-[#b0a99a]">ไม่มีกิจกรรมในวันนี้</p>
          ) : (
            <div className="mt-2 space-y-2">
              {selectedEvents.map((ev) => (
                <div key={ev.registration_id} className="flex items-center gap-2 rounded-lg bg-[#fafdf7] px-3 py-2">
                  <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#485B3B]" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-[#24321F]">
                      {ev.event_title || ev.title || `Event #${ev.event_id}`}
                    </div>
                    {ev.location && (
                      <div className="truncate text-xs text-[#6f7b70]">{ev.location}</div>
                    )}
                  </div>
                  <span
                    className="ml-auto flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                    style={{ background: ev.registration_status === "REGISTERED" ? "#6B8A5B" : "#c0392b" }}
                  >
                    {ev.registration_status || "registered"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {registrations.length > 0 && (
        <div className="mt-4 border-t border-[#f0ede6] pt-3">
          <h4 className="text-xs font-semibold text-[#6f7b70]">กิจกรรมที่กำลังจะมาถึง</h4>
          <div className="mt-2 space-y-1.5">
            {registrations
              .filter((r) => r.event_date && new Date(r.event_date) >= new Date(todayKey))
              .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
              .slice(0, 5)
              .map((ev) => (
                <div key={ev.registration_id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-[#24321F]">{ev.event_title || ev.title || `Event #${ev.event_id}`}</span>
                  <span className="flex-shrink-0 text-xs text-[#6f7b70]">
                    {new Date(ev.event_date).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            {registrations.filter((r) => r.event_date && new Date(r.event_date) >= new Date(todayKey)).length === 0 && (
              <p className="text-sm text-[#b0a99a]">ไม่มีกิจกรรมที่กำลังจะมาถึง</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
