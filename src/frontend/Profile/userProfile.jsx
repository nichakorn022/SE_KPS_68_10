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
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  const tokenPayload = getTokenPayload();
  const userId = getUserIdFromToken();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

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

        console.log('loaded profile data', { userRes, ordersRes, regsRes });
        const u = userRes || tokenPayload || { name: "User", bio: "ยังไม่มีข้อมูล" };
        const userProducts = (Array.isArray(productRes) ? productRes : []).filter((p) => String(p.user_id) === String(userId) || String(p.shop_id) === String(userId));

        setUser(u);
        setProducts(userProducts.map((p) => ({ id: p.product_id || p.id, name: p.tea_name || p.name || "Unnamed", description: p.description || "", price: Number(p.price ?? 0), img: p.image_path ? assetUrl(p.image_path) : null })));
        setOrders(Array.isArray(ordersRes) ? ordersRes : []);
        setRegistrations(Array.isArray(regsRes) ? regsRes : []);
        console.log('orders count', (ordersRes || []).length, 'registrations count', (regsRes || []).length);
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

  function OrderRow({ o, onClick }) {
    return (
      <div onClick={onClick} className="flex items-center justify-between gap-4 rounded-lg bg-white p-4 shadow-sm cursor-pointer">
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

  async function openOrder(o) {
    try {
      setOrderLoading(true);
      const headers = getAuthHeaders();
      const res = await fetch(apiUrl(`/orders/${o.order_id}`), { headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to load order');
      }
      const data = await res.json();
      setSelectedOrder(data);
      setShowOrderModal(true);
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถโหลดรายละเอียดคำสั่งซื้อได้');
    } finally {
      setOrderLoading(false);
    }
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

  function Calendar({ registrations }) {
    const [monthOffset, setMonthOffset] = useState(0);
    const [selectedDate, setSelectedDate] = useState(null);

    function toKey(d) {
      const y = d.getFullYear();
      const m = `${d.getMonth() + 1}`.padStart(2, '0');
      const day = `${d.getDate()}`.padStart(2, '0');
      return `${y}-${m}-${day}`;
    }

    const marks = new Set((registrations || []).map(r => {
      const raw = r.created_at || r.registered_at || r.registration_date;
      if (!raw) return null;
      const d = new Date(raw);
      return toKey(d);
    }).filter(Boolean));

    const base = new Date();
    base.setDate(1);
    base.setMonth(base.getMonth() + monthOffset);
    const year = base.getFullYear();
    const month = base.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

    const selectedKey = selectedDate ? toKey(selectedDate) : null;

    const eventsOnSelected = (registrations || []).filter(r => {
      const raw = r.created_at || r.registered_at || r.registration_date;
      if (!raw) return false;
      const k = toKey(new Date(raw));
      return k === selectedKey;
    });

    return (
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setMonthOffset(m => m - 1)} className="px-2">◀</button>
            <div className="font-medium">{base.toLocaleString('th-TH', { month: 'long', year: 'numeric' })}</div>
            <button onClick={() => setMonthOffset(m => m + 1)} className="px-2">▶</button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-xs text-center text-[#6f7b70]">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="py-1">{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1 mt-2">
            {cells.map((c, i) => {
              if (!c) return <div key={i} className="h-10" />;
              const key = toKey(c);
              const marked = marks.has(key);
              const isSelected = selectedKey === key;
              return (
                <button key={key} onClick={() => setSelectedDate(c)} className={`h-10 flex items-center justify-center rounded ${marked ? 'bg-green-100' : 'bg-white'} ${isSelected ? 'ring-2 ring-green-400' : ''}`}>
                  <span className="text-sm">{c.getDate()}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 text-sm">
            <div className="font-medium">Selected</div>
            <div className="text-[#6f7b70]">{selectedDate ? selectedDate.toLocaleDateString('th-TH') : '—'}</div>
            {eventsOnSelected.length > 0 && (
              <div className="mt-2 space-y-2">
                {eventsOnSelected.map(r => (
                  <div key={r.registration_id} className="rounded p-2 bg-gray-50">
                    <div className="font-medium">{r.event_title || r.title || `Event ${r.event_id || ''}`}</div>
                    <div className="text-xs text-[#6f7b70]">{new Date(r.created_at || r.registered_at || r.registration_date).toLocaleTimeString('th-TH')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
            <img src={previewUrl || user?.avatar || tokenPayload?.avatar || "/Pictrue/default-avatar.png"} alt="avatar" className="h-full w-full object-cover" />
          </div>

          <div>
            <h1 className="font-serif text-3xl text-[#24321F]">{user?.name || tokenPayload?.name || "User"}</h1>
            <p className="mt-2 text-[#6f7b70]">{user?.bio || tokenPayload?.bio || "ยังไม่มีคำอธิบายเพิ่มเติม"}</p>

            <div className="mt-4 flex items-center gap-3">
              <label className="cursor-pointer rounded-md bg-white px-3 py-2 text-sm border border-[#e6e3da] hover:bg-[#fbfdf7]">
                เลือกรูป
                <input
                  type="file"
                  name="avatar"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setSelectedFile(f);
                      setPreviewUrl(URL.createObjectURL(f));
                    }
                  }}
                />
              </label>

              <button
                disabled={!selectedFile || uploading}
                onClick={async () => {
                  if (!selectedFile) return;
                  setUploading(true);
                  try {
                    const fd = new FormData();
                    fd.append('avatar', selectedFile);

                    const headers = getAuthHeaders();
                    const res = await fetch(apiUrl(`/users/${userId}/avatar`), {
                      method: 'POST',
                      headers,
                      body: fd,
                    });

                    if (!res.ok) throw new Error('Upload failed');
                    const data = await res.json();
                    // store avatar path locally so navbar shows new image immediately
                    if (data && data.avatar) {
                      try { localStorage.setItem('avatar', data.avatar); } catch {}
                    }
                    window.location.reload();
                  } catch (err) {
                    console.error(err);
                    alert('อัปโหลดไม่สำเร็จ');
                  } finally {
                    setUploading(false);
                  }
                }}
                className="rounded-md bg-[#485B3B] text-white px-4 py-2 text-sm disabled:opacity-60"
              >{uploading ? 'Uploading...' : 'อัปโหลด'}</button>
            </div>
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
              {orders.length === 0 ? <div className="rounded-lg bg-white p-6 text-[#6f7b70]">ยังไม่มีคำสั่งซื้อ</div> : <div className="space-y-4">{orders.slice().reverse().map(o => <OrderRow key={o.order_id} o={o} onClick={() => openOrder(o)} />)}</div>}

              <h2 className="mt-6 text-xl font-semibold">Registered events</h2>
              {registrations.length === 0 ? <div className="rounded-lg bg-white p-6 text-[#6f7b70]">ยังไม่มีการลงทะเบียน</div> : <div className="space-y-4">{registrations.slice().reverse().map(r => <RegistrationRow key={r.registration_id} r={r} />)}</div>}
            </div>
          )}

          {activeTab === 'purchases' && (
            <div className="space-y-4">
              {orders.length === 0 ? <div className="rounded-lg bg-white p-6 text-[#6f7b70]">ยังไม่มีคำสั่งซื้อ</div> : orders.slice().reverse().map(o => <OrderRow key={o.order_id} o={o} onClick={() => openOrder(o)} />)}
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="flex gap-6">
                <div className="flex-1 space-y-4">
                  {registrations.length === 0 ? (
                    <div className="rounded-lg bg-white p-6 text-[#6f7b70]">ยังไม่มีการลงทะเบียน</div>
                  ) : (
                    registrations.slice().reverse().map(r => <RegistrationRow key={r.registration_id} r={r} />)
                  )}
                </div>
                <Calendar registrations={registrations} />
              </div>
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

      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowOrderModal(false)} />
          <div className="relative max-w-2xl w-full mx-4 bg-white rounded-lg shadow-lg overflow-auto max-h-[80vh] p-6">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold">Order #{selectedOrder.order_id}</h3>
              <button onClick={() => setShowOrderModal(false)} className="text-sm text-gray-600">ปิด</button>
            </div>
            <div className="mt-2 text-sm text-[#6f7b70]">Status: <span className="font-medium">{selectedOrder.status}</span></div>

            <div className="mt-4 space-y-3">
              {selectedOrder.items && selectedOrder.items.length > 0 ? selectedOrder.items.map(it => (
                <div key={it.order_detail_id || it.product_id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <div className="font-medium">{it.tea_name || it.name || `Product ${it.product_id || ''}`}</div>
                    <div className="text-sm text-[#6f7b70]">x{it.quantity} • {formatPrice(it.unit_price)}</div>
                  </div>
                  <div className="font-medium">{formatPrice(it.subtotal)}</div>
                </div>
              )) : <div className="text-[#6f7b70]">ไม่มีสินค้า</div>}
            </div>

            <div className="mt-4 text-right font-semibold">Total: {formatPrice(selectedOrder.total || selectedOrder.total_amount)}</div>
          </div>
        </div>
      )}

    </div>
  );
}
