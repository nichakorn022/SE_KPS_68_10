import { useEffect, useMemo, useState } from "react";
import AdminMetaCard from "./AdminMetaCard";
import AdminEmptyState from "./AdminEmptyState";
import AdminPagination, { paginate } from "./AdminPagination";
import AdminConfirmActionModal from "./AdminConfirmActionModal";

function SectionHeader({ title, count }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm uppercase tracking-[0.28em] text-[#8d9577]">User Activity</p>
        <h4 className="mt-2 text-xl font-semibold text-[#2f3529]">{title}</h4>
      </div>
      <span className="rounded-full bg-[#efe8d8] px-3 py-1 text-xs font-medium text-[#485b3b]">{count}</span>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#f8f4eb] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8d9577]">{label}</p>
      <p className="mt-2 text-sm text-[#2f3529]">{value || "-"}</p>
    </div>
  );
}

function DetailModalShell({ badge, title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-[32px] bg-white p-7 shadow-2xl ring-1 ring-[#e6ddc9]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">{badge}</p>
            <h3 className="mt-3 text-3xl font-semibold text-[#2f3529]">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efe8d8] text-lg font-medium text-[#485b3b]">X</button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function OrderDetailModal({ order, onClose, onUpdateOrder, onDeleteOrder }) {
  const [confirmAction, setConfirmAction] = useState(null);
  return (
    <>
      <DetailModalShell title={`Order #${order.order_id}`} badge="Order Detail" onClose={onClose}>
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-3 md:grid-cols-3">
            <InfoRow label="Status" value={order.status || "-"} />
            <InfoRow label="Payment" value={order.payment_status || "-"} />
            <InfoRow label="Total" value={Number(order.total_amount || 0).toFixed(2)} />
          </div>
          <button type="button" onClick={() => setConfirmAction({ title: "Delete Order", message: `Delete order #${order.order_id}?`, confirmLabel: "Delete Order", tone: "danger", onConfirm: () => onDeleteOrder(order.order_id) })} className="rounded-full bg-[#fff0ed] px-4 py-2 text-xs font-medium text-[#b33a24]">Delete Order</button>
        </div>
        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-medium text-[#4b5541]">Update Status</span>
          <select value={order.status || "pending"} onChange={(event) => setConfirmAction({ title: "Update Order", message: `Change order #${order.order_id} status to ${event.target.value}?`, confirmLabel: "Update Order", tone: "primary", onConfirm: () => onUpdateOrder(order.order_id, event.target.value) })} className="admin-input">
            {["pending", "paid", "cancelled"].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[#8d9577]"><tr><th className="pb-3">Product</th><th className="pb-3">Qty</th><th className="pb-3">Unit</th><th className="pb-3">Subtotal</th></tr></thead>
            <tbody>{(order.items || []).map((item) => <tr key={item.order_detail_id} className="border-t border-[#efe8d8]"><td className="py-4"><p className="font-semibold text-[#2f3529]">{item.tea_name || `Product #${item.product_id}`}</p></td><td className="py-4">{item.quantity}</td><td className="py-4">{Number(item.unit_price || 0).toFixed(2)}</td><td className="py-4">{Number(item.subtotal || 0).toFixed(2)}</td></tr>)}</tbody>
          </table>
        </div>
      </DetailModalShell>
      {confirmAction ? <AdminConfirmActionModal {...confirmAction} onClose={() => setConfirmAction(null)} onConfirm={async () => { await confirmAction.onConfirm(); setConfirmAction(null); }} /> : null}
    </>
  );
}

function RegistrationDetailModal({ registration, onClose, onUpdateRegistration, onDeleteRegistration }) {
  const [confirmAction, setConfirmAction] = useState(null);
  return (
    <>
      <DetailModalShell title={registration.title || `Registration #${registration.registration_id}`} badge="Registration Detail" onClose={onClose}>
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-3 md:grid-cols-3">
            <InfoRow label="Registration ID" value={`#${registration.registration_id}`} />
            <InfoRow label="Event ID" value={`#${registration.event_id}`} />
            <InfoRow label="Date" value={registration.event_date ? new Date(registration.event_date).toLocaleDateString() : "-"} />
          </div>
          <button type="button" onClick={() => setConfirmAction({ title: "Delete Registration", message: `Delete registration #${registration.registration_id}?`, confirmLabel: "Delete Registration", tone: "danger", onConfirm: () => onDeleteRegistration(registration.registration_id) })} className="rounded-full bg-[#fff0ed] px-4 py-2 text-xs font-medium text-[#b33a24]">Delete Registration</button>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <InfoRow label="Status" value={registration.registration_status || "-"} />
          <InfoRow label="Location" value={registration.location || "-"} />
        </div>
        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-medium text-[#4b5541]">Update Status</span>
          <select value={registration.registration_status || "REGISTERED"} onChange={(event) => setConfirmAction({ title: "Update Registration", message: `Change registration #${registration.registration_id} status to ${event.target.value}?`, confirmLabel: "Update Registration", tone: "primary", onConfirm: () => onUpdateRegistration(registration.registration_id, event.target.value) })} className="admin-input">
            {["REGISTERED", "CANCELLED"].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
      </DetailModalShell>
      {confirmAction ? <AdminConfirmActionModal {...confirmAction} onClose={() => setConfirmAction(null)} onConfirm={async () => { await confirmAction.onConfirm(); setConfirmAction(null); }} /> : null}
    </>
  );
}

function OrdersSection({ orders, activeOrder, onOpenOrder, onCloseOrder, onUpdateOrder, onDeleteOrder }) {
  const [page, setPage] = useState(1);
  const paginatedOrders = useMemo(() => paginate(orders, page), [orders, page]);
  useEffect(() => setPage(1), [orders]);
  return (
    <>
      <SectionHeader title="Orders" count={orders.length} />
      {!orders.length ? <AdminEmptyState label="No orders found." /> : <div className="mt-5 space-y-3">{paginatedOrders.items.map((order) => <button key={order.order_id} type="button" onClick={() => onOpenOrder(order.order_id)} className="block w-full rounded-2xl border border-[#efe8d8] bg-white px-4 py-4 text-left transition hover:border-[#d7ceb8] hover:bg-[#fcfbf7]"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-[#2f3529]">Order #{order.order_id}</p><p className="mt-1 text-xs text-[#7a8368]">{order.order_date ? new Date(order.order_date).toLocaleString() : "-"}</p></div><span className="rounded-full bg-[#f8f4eb] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#485b3b]">{order.status || "pending"}</span></div><div className="mt-3 grid gap-3 md:grid-cols-2"><InfoRow label="Total" value={Number(order.total_amount || 0).toFixed(2)} /><InfoRow label="Payment" value={order.payment_status || "-"} /></div></button>)}<AdminPagination currentPage={paginatedOrders.page} totalPages={paginatedOrders.totalPages} onPageChange={setPage} /></div>}
      {activeOrder ? <OrderDetailModal order={activeOrder} onClose={onCloseOrder} onUpdateOrder={onUpdateOrder} onDeleteOrder={onDeleteOrder} /> : null}
    </>
  );
}

function RegistrationsSection({ registrations, activeRegistration, onOpenRegistration, onCloseRegistration, onUpdateRegistration, onDeleteRegistration }) {
  const [page, setPage] = useState(1);
  const paginatedRegistrations = useMemo(() => paginate(registrations, page), [registrations, page]);
  useEffect(() => setPage(1), [registrations]);
  return (
    <>
      <SectionHeader title="Event Registrations" count={registrations.length} />
      {!registrations.length ? <AdminEmptyState label="No event registrations found." /> : <div className="mt-5 space-y-3">{paginatedRegistrations.items.map((registration) => <button key={registration.registration_id} type="button" onClick={() => onOpenRegistration(registration)} className="block w-full rounded-2xl border border-[#efe8d8] bg-white px-4 py-4 text-left transition hover:border-[#d7ceb8] hover:bg-[#fcfbf7]"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-[#2f3529]">{registration.title || `Registration #${registration.registration_id}`}</p><p className="mt-1 text-xs text-[#7a8368]">{registration.event_date ? new Date(registration.event_date).toLocaleDateString() : "-"}</p></div><span className="rounded-full bg-[#f8f4eb] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#485b3b]">{registration.registration_status || "-"}</span></div><div className="mt-3"><InfoRow label="Registration ID" value={`#${registration.registration_id}`} /></div></button>)}<AdminPagination currentPage={paginatedRegistrations.page} totalPages={paginatedRegistrations.totalPages} onPageChange={setPage} /></div>}
      {activeRegistration ? <RegistrationDetailModal registration={activeRegistration} onClose={onCloseRegistration} onUpdateRegistration={onUpdateRegistration} onDeleteRegistration={onDeleteRegistration} /> : null}
    </>
  );
}

function OrganizerEventsSection({ events }) {
  const [page, setPage] = useState(1);
  const paginatedEvents = useMemo(() => paginate(events, page), [events, page]);
  useEffect(() => setPage(1), [events]);
  return (
    <>
      <SectionHeader title="Organized Events" count={events.length} />
      {!events.length ? <AdminEmptyState label="No organized events found." /> : <div className="mt-5 space-y-3">{paginatedEvents.items.map((event) => <div key={event.event_id} className="rounded-2xl bg-white px-4 py-4 ring-1 ring-[#efe8d8]"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-[#2f3529]">{event.title || `Event #${event.event_id}`}</p><p className="mt-1 text-xs text-[#7a8368]">{event.event_date ? new Date(event.event_date).toLocaleDateString() : "-"}</p></div><span className="rounded-full bg-[#f8f4eb] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#485b3b]">{event.status || "draft"}</span></div><div className="mt-3 grid gap-3 md:grid-cols-3"><InfoRow label="Event ID" value={`#${event.event_id}`} /><InfoRow label="Location" value={event.location || "-"} /><InfoRow label="Price" value={Number(event.price || 0).toFixed(2)} /></div></div>)}<AdminPagination currentPage={paginatedEvents.page} totalPages={paginatedEvents.totalPages} onPageChange={setPage} /></div>}
    </>
  );
}

export function UserDetailModal({
  selectedUser, onClose, accountDeleting, accountSaving, setConfirmAction, handleDeleteUser, accountForm, handleAccountFieldChange, handleUpdateUser,
  selectedView, setSelectedView, setActiveOrder, setActiveRegistration, detailLoading, organizedEvents, userOrders, activeOrder, handleOpenOrder, handleCloseOrder, handleUpdateOrder, handleDeleteOrder, userRegistrations, activeRegistration, handleOpenRegistration, handleCloseRegistration, handleUpdateRegistration, handleDeleteRegistration, getVerificationStatusLabel,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[32px] bg-white p-7 shadow-2xl ring-1 ring-[#e6ddc9]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4"><div><p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">User Detail</p><h3 className="mt-3 text-3xl font-semibold text-[#2f3529]">{selectedUser.username || "-"}</h3></div><button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efe8d8] text-lg font-medium text-[#485b3b]">X</button></div>
        <div className="mt-6 grid gap-4 md:grid-cols-4"><AdminMetaCard label="User ID" value={`#${selectedUser.user_id}`} />{selectedUser.organizer_id ? <AdminMetaCard label="Organizer ID" value={`#${selectedUser.organizer_id}`} /> : null}<AdminMetaCard label="Email" value={selectedUser.email || "-"} /><AdminMetaCard label="Role" value={selectedUser.display_role || "user"} /><AdminMetaCard label="Created" value={selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : "-"} /></div>
        {selectedUser.display_role === "organizer" ? <div className="mt-6 grid gap-4 md:grid-cols-3"><AdminMetaCard label="Organization" value={selectedUser.organization_name || "-"} /><AdminMetaCard label="Phone" value={selectedUser.phone || "-"} /><AdminMetaCard label="Verified" value={getVerificationStatusLabel(selectedUser.verified_status)} /></div> : null}
        <section className="mt-6 rounded-[28px] bg-[#f8f4eb] p-5 ring-1 ring-[#e6ddc9]"><div className="flex items-start justify-between gap-4"><div><p className="text-sm uppercase tracking-[0.28em] text-[#8d9577]">Account Management</p><h4 className="mt-2 text-xl font-semibold text-[#2f3529]">Manage User</h4></div><button type="button" onClick={() => setConfirmAction({ title: "Delete User", message: `Delete user #${selectedUser.user_id}?`, confirmLabel: "Delete User", tone: "danger", onConfirm: handleDeleteUser })} disabled={accountDeleting} className="rounded-full bg-[#fff0ed] px-4 py-2 text-xs font-medium text-[#b33a24] disabled:cursor-not-allowed disabled:opacity-60">{accountDeleting ? "Deleting..." : "Delete User"}</button></div><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="block"><span className="mb-2 block text-sm font-medium text-[#4b5541]">Username</span><input value={accountForm.username} onChange={(event) => handleAccountFieldChange("username", event.target.value)} className="admin-input" /></label><label className="block"><span className="mb-2 block text-sm font-medium text-[#4b5541]">Email</span><input type="email" value={accountForm.email} onChange={(event) => handleAccountFieldChange("email", event.target.value)} className="admin-input" /></label></div><div className="mt-4 flex justify-end"><button type="button" onClick={() => setConfirmAction({ title: "Save User", message: `Save changes for user #${selectedUser.user_id}?`, confirmLabel: "Save User", tone: "primary", onConfirm: handleUpdateUser })} disabled={accountSaving} className="rounded-full bg-[#485b3b] px-4 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">{accountSaving ? "Saving..." : "Save User"}</button></div></section>
        <div className="mt-6 flex flex-wrap gap-2">{(selectedUser.display_role === "organizer" ? [{ key: "events", label: "Organized Events" }] : [{ key: "orders", label: "Orders" }, { key: "registrations", label: "Event Registrations" }]).map((item) => <button key={item.key} type="button" onClick={() => { setSelectedView(item.key); setActiveOrder(null); setActiveRegistration(null); }} className={`rounded-full px-4 py-2 text-xs font-medium transition ${selectedView === item.key ? "bg-[#485b3b] text-white" : "bg-[#f3ede0] text-[#5f684f] hover:bg-[#e6ddc9]"}`}>{item.label}</button>)}</div>
        {detailLoading ? <div className="mt-6 rounded-2xl bg-[#f8f4eb] px-4 py-6 text-sm text-[#657056]">Loading detail...</div> : <section className="mt-6 rounded-[28px] bg-[#fcfbf7] p-5 ring-1 ring-[#e6ddc9]">{selectedUser.display_role === "organizer" ? <OrganizerEventsSection events={organizedEvents} /> : selectedView === "orders" ? <OrdersSection orders={userOrders} activeOrder={activeOrder} onOpenOrder={handleOpenOrder} onCloseOrder={handleCloseOrder} onUpdateOrder={handleUpdateOrder} onDeleteOrder={handleDeleteOrder} /> : <RegistrationsSection registrations={userRegistrations} activeRegistration={activeRegistration} onOpenRegistration={handleOpenRegistration} onCloseRegistration={handleCloseRegistration} onUpdateRegistration={handleUpdateRegistration} onDeleteRegistration={handleDeleteRegistration} />}</section>}
      </div>
    </div>
  );
}
