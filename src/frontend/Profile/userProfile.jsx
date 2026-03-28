import { useEffect, useState } from "react";
import SiteNavbar from "../components/SiteNavbar";
import { apiUrl, assetUrl } from "../../lib/api";
import { getUserIdFromToken, getTokenPayload, getAuthHeaders } from "../Shop/authClient";

function formatPrice(price) {
  return `฿${Number(price ?? 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function ProductCard({ p }) {
  return (
    <article className="group overflow-hidden rounded-[18px] border border-[#e7e0d5] bg-white shadow-sm">
      <div className="aspect-[1/1] overflow-hidden bg-[#f4f1ea]">
        {p.img ? (
          <img src={p.img} alt={p.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#bfb4a2]">No image</div>
        )}
      </div>
      <div className="px-4 py-3">
        <h3 className="line-clamp-1 font-serif text-lg text-[#24321F]">{p.name}</h3>
        <p className="mt-2 text-sm text-[#6f7b70] line-clamp-2">{p.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-lg font-semibold text-[#6B8A5B]">{formatPrice(p.price)}</div>
          <button className="rounded-full border border-[#d8e1ce] bg-[#fbfdf7] px-3 py-1 text-sm font-semibold text-[#4e6841]">เพิ่ม</button>
        </div>
      </div>
    </article>
  );
}

export default function UserProfile() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  const tokenPayload = getTokenPayload();
  const userId = getUserIdFromToken();

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      try {
        const headers = getAuthHeaders();

        const [userRes, productRes, ordersRes, regsRes] = await Promise.all([
          userId ? fetch(apiUrl(`/users/${userId}`), { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null) : Promise.resolve(null),
          fetch(apiUrl(`/products`)).then((r) => (r.ok ? r.json() : [])).catch(() => []),
          userId ? fetch(apiUrl(`/orders/user/${userId}`), { headers }).then((r) => (r.ok ? r.json() : [])).catch(() => []) : Promise.resolve([]),
          userId ? fetch(apiUrl(`/registrations/user/${userId}`), { headers }).then((r) => (r.ok ? r.json() : [])).catch(() => []) : Promise.resolve([]),
        ]);

        if (ignore) return;

        const u = userRes || tokenPayload || { name: "User", bio: "ยังไม่มีข้อมูล" };
        const userProducts = (Array.isArray(productRes) ? productRes : []).filter((p) => String(p.user_id) === String(userId) || String(p.shop_id) === String(userId));

        setUser(u);
        setProducts(userProducts.map((p) => ({ id: p.product_id || p.id, name: p.tea_name || p.name || "Unnamed", description: p.description || "", price: Number(p.price ?? 0), img: p.image_path ? assetUrl(p.image_path) : null })));
        setOrders(Array.isArray(ordersRes) ? ordersRes : []);
        setRegistrations(Array.isArray(regsRes) ? regsRes : []);
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [userId]);

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

  function OrderRow({ o }) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-lg bg-white p-4 shadow-sm">
        <div>
          <div className="text-sm text-[#6f7b70]">Order #{o.order_id} • {new Date(o.order_date).toLocaleString('th-TH')}</div>
          <div className="mt-1 font-medium">{o.items?.map(it => it.name).slice(0,2).join(', ') || 'Products'}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-[#6f7b70]">{o.total ? `฿${Number(o.total).toLocaleString('th-TH')}` : ''}</div>
          <div className="mt-2 inline-block rounded-full px-3 py-1 text-sm font-semibold text-white" style={{background: o.status === 'delivered' ? '#6B8A5B' : '#87a179'}}>{o.status}</div>
        </div>
      </div>
    );
  }

  function RegistrationRow({ r }) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-lg bg-white p-4 shadow-sm">
        <div>
          <div className="text-sm text-[#6f7b70]">Registration #{r.registration_id} • {new Date(r.created_at || r.registered_at || r.registration_date || Date.now()).toLocaleDateString('th-TH')}</div>
          <div className="mt-1 font-medium">{r.event_title || r.title || `Event ${r.event_id || ''}`}</div>
        </div>
        <div className="text-right">
          <div className="mt-2 inline-block rounded-full px-3 py-1 text-sm font-semibold text-white" style={{background: r.registration_status === 'registered' ? '#6B8A5B' : '#c0392b'}}>{r.registration_status}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F2]">
      <SiteNavbar active="" />

      <div className="mx-auto max-w-[1200px] px-6 pb-16">
        <div className="relative -mt-6 mb-6 h-44 rounded-lg bg-white/90">
          <img src={user?.cover || "/Pictrue/cover-default.jpg"} alt="cover" className="h-44 w-full rounded-lg object-cover" />
        </div>

        <div className="-mt-24 flex items-end gap-6">
          <div className="h-40 w-40 rounded-full overflow-hidden border-4 border-white bg-white shadow-sm">
            <img src={user?.avatar || tokenPayload?.avatar || "/Pictrue/default-avatar.png"} alt="avatar" className="h-full w-full object-cover" />
          </div>

          <div>
            <h1 className="font-serif text-3xl text-[#24321F]">{user?.name || tokenPayload?.name || "User"}</h1>
            <p className="mt-2 text-[#6f7b70]">{user?.bio || tokenPayload?.bio || "ยังไม่มีคำอธิบายเพิ่มเติม"}</p>
          </div>
        </div>

        <div className="mt-8 rounded-[14px] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-6">
            <button onClick={() => setActiveTab('overview')} className={`rounded-full px-4 py-2 ${activeTab==='overview' ? 'text-[#485B3B] font-semibold border-b-2 border-[#485B3B]' : 'text-[#4a4a4a]'}`}>Overview</button>
            <button onClick={() => setActiveTab('purchases')} className={`rounded-full px-4 py-2 ${activeTab==='purchases' ? 'text-[#485B3B] font-semibold border-b-2 border-[#485B3B]' : 'text-[#4a4a4a]'}`}>Purchases</button>
            <button onClick={() => setActiveTab('events')} className={`rounded-full px-4 py-2 ${activeTab==='events' ? 'text-[#485B3B] font-semibold border-b-2 border-[#485B3B]' : 'text-[#4a4a4a]'}`}>Events</button>
            <button onClick={() => setActiveTab('about')} className={`rounded-full px-4 py-2 ${activeTab==='about' ? 'text-[#485B3B] font-semibold border-b-2 border-[#485B3B]' : 'text-[#4a4a4a]'}`}>About</button>
          </div>
        </div>

        <div className="mt-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Recent orders</h2>
              {orders.length === 0 ? <div className="rounded-lg bg-white p-6 text-[#6f7b70]">ยังไม่มีคำสั่งซื้อ</div> : <div className="space-y-4">{orders.slice().reverse().map(o => <OrderRow key={o.order_id} o={o} />)}</div>}

              <h2 className="mt-6 text-xl font-semibold">Registered events</h2>
              {registrations.length === 0 ? <div className="rounded-lg bg-white p-6 text-[#6f7b70]">ยังไม่มีการลงทะเบียน</div> : <div className="space-y-4">{registrations.slice().reverse().map(r => <RegistrationRow key={r.registration_id} r={r} />)}</div>}
            </div>
          )}

          {activeTab === 'purchases' && (
            <div className="space-y-4">
              {orders.length === 0 ? <div className="rounded-lg bg-white p-6 text-[#6f7b70]">ยังไม่มีคำสั่งซื้อ</div> : orders.slice().reverse().map(o => <OrderRow key={o.order_id} o={o} />)}
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-4">
              {registrations.length === 0 ? <div className="rounded-lg bg-white p-6 text-[#6f7b70]">ยังไม่มีการลงทะเบียน</div> : registrations.slice().reverse().map(r => <RegistrationRow key={r.registration_id} r={r} />)}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="rounded-lg bg-white p-6">
              <h3 className="font-semibold">About</h3>
              <p className="mt-3 text-[#6f7b70]">{user?.about || user?.bio || tokenPayload?.bio || 'ยังไม่มีข้อมูลเพิ่มเติม'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
