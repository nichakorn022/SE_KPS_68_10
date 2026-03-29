import { useEffect, useMemo, useState } from "react";
import SiteNavbar from "../components/SiteNavbar";
import { apiUrl } from "../../lib/api";
import {
  getAvatarStorageKey,
  getStoredAvatar,
  getUserIdFromToken,
  getTokenPayload,
  getAuthHeaders,
} from "../Shop/authClient";

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

  function RegistrationRow({ registration }) {
    const registrationDate =
      registration.created_at ||
      registration.registered_at ||
      registration.registration_date ||
      Date.now();

    return (
      <div className="flex items-center justify-between gap-4 rounded-lg bg-white p-4 shadow-sm">
        <div>
          <div className="text-sm text-[#6f7b70]">
            Registration #{registration.registration_id} | {new Date(registrationDate).toLocaleDateString("th-TH")}
          </div>
          <div className="mt-1 font-medium">
            {registration.event_title || registration.title || `Event ${registration.event_id || ""}`}
          </div>
        </div>
        <div
          className="inline-block rounded-full px-3 py-1 text-sm font-semibold text-white"
          style={{
            background:
              registration.registration_status === "registered" ? "#6B8A5B" : "#c0392b",
          }}
        >
          {registration.registration_status || "registered"}
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

      <div className="mx-auto max-w-[1200px] px-6 pb-16">
        <div className="relative -mt-6 mb-6 h-44 rounded-lg bg-white/90">
          <img
            src={user?.cover || "/Pictrue/cover-default.jpg"}
            alt="cover"
            className="h-44 w-full rounded-lg object-cover"
          />
        </div>

        <div className="-mt-24 flex items-end gap-6">
          <div className="h-40 w-40 overflow-hidden rounded-full border-4 border-white bg-white shadow-sm">
            <img
              src={
                previewUrl ||
                user?.avatar ||
                getStoredAvatar() ||
                tokenPayload?.avatar ||
                "/Pictrue/default-avatar.png"
              }
              alt="avatar"
              className="h-full w-full object-cover"
            />
          </div>

          <div>
            <h1 className="font-serif text-3xl text-[#24321F]">{displayName}</h1>
            <p className="mt-2 text-[#6f7b70]">{displayBio}</p>

            <div className="mt-4 flex items-center gap-3">
              <label className="cursor-pointer rounded-md border border-[#e6e3da] bg-white px-3 py-2 text-sm hover:bg-[#fbfdf7]">
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
                className="rounded-md bg-[#485B3B] px-4 py-2 text-sm text-white disabled:opacity-60"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>

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
                <div className="space-y-4">
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
            <div className="space-y-4">
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
      </div>

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

      <div className="mt-6 space-y-5">
        {filtered.length === 0 ? (
          <div className="rounded-xl bg-[#faf8f2] py-12 text-center text-[#6f7b70]">
            No orders found.
          </div>
        ) : (
          filtered.map((order) => (
            <OrderCard key={order.order_id} order={order} onViewOrder={onViewOrder} />
          ))
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
        <div className="mt-2 flex gap-2">
          {order.items?.slice(0, 3).map((item, idx) => (
            <div key={idx} className="relative h-11 w-11 rounded-lg bg-[#f0ede6] flex items-center justify-center overflow-hidden">
              {item.image_path ? (
                <img src={item.image_path} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-[#485B3B]">
                  {(item.name || item.tea_name || "?")[0]}
                </span>
              )}
              {item.quantity > 1 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#485B3B] text-[9px] font-bold text-white">
                  {item.quantity}
                </span>
              )}
            </div>
          ))}
        </div>
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
