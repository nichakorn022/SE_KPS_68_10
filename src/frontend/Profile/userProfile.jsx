import { useEffect, useState } from "react";
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
  }, [userId, tokenPayload]);

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
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="rounded-lg bg-white p-6 text-[#6f7b70]">No orders yet.</div>
              ) : (
                orders
                  .slice()
                  .reverse()
                  .map((order) => <OrderRow key={order.order_id} order={order} />)
              )}
            </div>
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
