import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi } from "./adminApi";
import { assetUrl } from "../../lib/api";

const orderStatuses = ["pending", "paid", "cancelled"];
const registrationStatuses = ["REGISTERED", "CANCELLED"];

export default function AdminUsersPage() {
  const { adminToken } = useOutletContext();
  const [users, setUsers] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [createdFilter, setCreatedFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedView, setSelectedView] = useState("orders");
  const [detailLoading, setDetailLoading] = useState(false);
  const [userOrders, setUserOrders] = useState([]);
  const [userRegistrations, setUserRegistrations] = useState([]);
  const [organizedEvents, setOrganizedEvents] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [activeRegistration, setActiveRegistration] = useState(null);
  const [accountForm, setAccountForm] = useState({ username: "", email: "" });
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountDeleting, setAccountDeleting] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    setLoading(true);
    try {
      const [userRows, organizerRows, eventRows] = await Promise.all([
        adminApi.getUsers(adminToken),
        adminApi.getOrganizers(adminToken),
        adminApi.getEvents(adminToken),
      ]);
      setUsers(userRows);
      setOrganizers(organizerRows);
      setEvents(eventRows);
      setStatus({ type: "", message: "" });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [adminToken]);

  const displayUsers = useMemo(() => {
    const organizerUserIds = new Set(organizers.map((item) => String(item.user_id)));

    const memberRows = users
      .filter((user) => String(user.role).toLowerCase() === "user" && !organizerUserIds.has(String(user.user_id)))
      .map((user) => ({
        ...user,
        account_username: user.username,
        display_role: "user",
      }));

    const organizerRows = organizers.map((organizer) => ({
      user_id: organizer.user_id,
      organizer_id: organizer.organizer_id,
      username:
        [organizer.first_name, organizer.last_name].filter(Boolean).join(" ") ||
        organizer.organization_name ||
        organizer.username ||
        "-",
      email: organizer.email,
      avatar: null,
      account_username: organizer.username || "",
      display_role: "organizer",
      created_at: organizer.created_at || null,
      phone: organizer.phone || null,
      organization_name: organizer.organization_name || null,
      description: organizer.description || null,
      verified_status: organizer.verified_status,
    }));

    return [...organizerRows, ...memberRows];
  }, [organizers, users]);

  const summaryCards = useMemo(
    () => [
      { label: "Total Profiles", value: displayUsers.length },
      { label: "Organizers", value: displayUsers.filter((user) => user.display_role === "organizer").length },
      { label: "Members", value: displayUsers.filter((user) => user.display_role === "user").length },
    ],
    [displayUsers]
  );

  const filteredUsers = useMemo(() => {
    const now = Date.now();

    return displayUsers.filter((user) => {
      if (roleFilter !== "all" && user.display_role !== roleFilter) return false;

      if (createdFilter !== "all") {
        const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
        if (createdFilter === "30d" && (!createdAt || now - createdAt > 30 * 24 * 60 * 60 * 1000)) return false;
        if (createdFilter === "90d" && (!createdAt || now - createdAt > 90 * 24 * 60 * 60 * 1000)) return false;
        if (createdFilter === "older" && (!createdAt || now - createdAt <= 90 * 24 * 60 * 60 * 1000)) return false;
      }

      if (!searchTerm.trim()) return true;

      const keyword = searchTerm.trim().toLowerCase();
      return [
        user.username,
        user.email,
        user.display_role,
        user.organization_name,
        `user ${user.user_id}`,
        user.organizer_id ? `organizer ${user.organizer_id}` : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [createdFilter, displayUsers, roleFilter, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, roleFilter, createdFilter]);

  useEffect(() => {
    setAccountForm({
      username: selectedUser?.account_username || selectedUser?.username || "",
      email: selectedUser?.email || "",
    });
  }, [selectedUser]);

  const paginatedUsers = useMemo(() => paginate(filteredUsers, page), [filteredUsers, page]);
  const hasActiveFilters = Boolean(searchTerm.trim()) || roleFilter !== "all" || createdFilter !== "all";

  async function loadUserDetail(user) {
    setSelectedUser(user);
    setActiveOrder(null);
    setActiveRegistration(null);
    setUserOrders([]);
    setUserRegistrations([]);
    setOrganizedEvents([]);
    setSelectedView(String(user.display_role).toLowerCase() === "organizer" ? "events" : "orders");
    setDetailLoading(true);

    try {
      if (String(user.display_role).toLowerCase() === "organizer") {
        setOrganizedEvents(events.filter((event) => String(event.organizer_id) === String(user.organizer_id)));
      } else {
        const [orders, registrations] = await Promise.all([
          adminApi.getUserOrders(adminToken, user.user_id),
          adminApi.getUserRegistrations(adminToken, user.user_id),
        ]);
        setUserOrders(orders);
        setUserRegistrations(registrations);
      }
      setStatus({ type: "", message: "" });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setDetailLoading(false);
    }
  }

  const handleOpenOrder = async (orderId) => {
    try {
      const detail = await adminApi.getOrderDetail(adminToken, orderId);
      setActiveOrder(detail);
      setActiveRegistration(null);
      setStatus({ type: "", message: "" });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const handleUpdateOrder = async (orderId, nextStatus) => {
    try {
      await adminApi.updateOrderStatus(adminToken, orderId, nextStatus);
      setActiveOrder(null);
      setSelectedUser(null);
      setStatus({ type: "success", message: `Order #${orderId} updated` });
      await loadUsers();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await adminApi.deleteOrder(adminToken, orderId);
      setActiveOrder(null);
      setSelectedUser(null);
      setStatus({ type: "success", message: `Order #${orderId} deleted` });
      await loadUsers();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const handleOpenRegistration = (registration) => {
    setActiveRegistration(registration);
    setActiveOrder(null);
  };

  const handleCloseOrder = () => {
    setActiveOrder(null);
  };

  const handleCloseRegistration = () => {
    setActiveRegistration(null);
  };

  const handleUpdateRegistration = async (registrationId, nextStatus) => {
    try {
      await adminApi.updateRegistrationStatus(adminToken, registrationId, nextStatus);
      setActiveRegistration(null);
      setSelectedUser(null);
      setStatus({ type: "success", message: `Registration #${registrationId} updated` });
      await loadUsers();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const handleDeleteRegistration = async (registrationId) => {
    try {
      await adminApi.deleteRegistration(adminToken, registrationId);
      setActiveRegistration(null);
      setSelectedUser(null);
      setStatus({ type: "success", message: `Registration #${registrationId} deleted` });
      await loadUsers();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const handleAccountFieldChange = (key, value) => {
    setAccountForm((current) => ({ ...current, [key]: value }));
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      setAccountSaving(true);
      const updatedUser = await adminApi.updateUser(adminToken, selectedUser.user_id, accountForm);
      await loadUsers();
      setSelectedUser((current) =>
        current
          ? {
              ...current,
              account_username: updatedUser.username,
              email: updatedUser.email,
              ...(current.display_role === "user" ? { username: updatedUser.username } : {}),
            }
          : current
      );
      setSelectedUser(null);
      setStatus({ type: "success", message: `User #${selectedUser.user_id} updated` });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setAccountSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setAccountDeleting(true);
      await adminApi.deleteUser(adminToken, selectedUser.user_id);
      await loadUsers();
      setSelectedUser(null);
      setStatus({ type: "success", message: `User #${selectedUser.user_id} deleted` });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setAccountDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setCreatedFilter("all");
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] bg-white p-7 shadow-sm ring-1 ring-[#e6ddc9]">
        <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">User Management</p>
        <h3 className="mt-3 text-3xl font-semibold text-[#2f3529]">Users</h3>

        {status.message && (
          <div className={`mt-5 rounded-2xl px-4 py-3 text-sm ${status.type === "error" ? "bg-[#fff0ed] text-[#b33a24]" : "bg-[#eef6ea] text-[#386132]"}`}>
            {status.message}
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-[24px] bg-[#f8f4eb] px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#8d9577]">{card.label}</p>
              <p className="mt-3 text-2xl font-semibold text-[#2f3529]">{card.value}</p>
            </div>
          ))}
        </div>

        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by username, email, role, or id..."
          className="admin-input mt-6"
        />

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#8d9577]">Role</span>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="admin-input">
              <option value="all">All roles</option>
              <option value="user">User</option>
              <option value="organizer">Organizer</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#8d9577]">Created</span>
            <select value={createdFilter} onChange={(event) => setCreatedFilter(event.target.value)} className="admin-input">
              <option value="all">All time</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="older">Older than 90 days</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-[#fcfbf7] px-4 py-4 ring-1 ring-[#efe8d8]">
          <div>
            <p className="text-sm font-medium text-[#2f3529]">
              Showing {filteredUsers.length} profile{filteredUsers.length === 1 ? "" : "s"}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8d9577]">
              {hasActiveFilters ? "Filtered result set" : "All available profiles"}
            </p>
          </div>
          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="rounded-full bg-[#efe8d8] px-4 py-2 text-xs font-medium text-[#485b3b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear filters
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <div className="py-8 text-sm text-[#7a8368]">Loading...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-2xl bg-[#f8f4eb] px-4 py-10 text-sm text-[#7a8368]">
              No matching users found. Try changing the search or filters.
            </div>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="text-[#8d9577]">
                <tr>
                  <th className="pb-3">User</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.items.map((user) => (
                  <tr
                    key={`${user.display_role}-${user.user_id}`}
                    onClick={() => loadUserDetail(user)}
                    className="cursor-pointer border-t border-[#efe8d8] transition hover:bg-[#fcfbf7]"
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img src={assetUrl(user.avatar)} alt="" className="h-10 w-10 rounded-full object-cover ring-1 ring-[#e6ddc9]" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efe8d8] text-xs font-semibold text-[#485b3b]">
                            {(user.username || "U").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-[#2f3529]">{user.username || "-"}</p>
                          <p className="mt-1 text-xs text-[#7a8368]">User #{user.user_id}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8d9577]">Click to review</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">{user.email || "-"}</td>
                    <td className="py-4">
                      <span className="inline-flex rounded-full bg-[#f8f4eb] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#485b3b]">
                        {user.display_role}
                      </span>
                    </td>
                    <td className="py-4">{user.created_at ? new Date(user.created_at).toLocaleString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination currentPage={paginatedUsers.page} totalPages={paginatedUsers.totalPages} onPageChange={setPage} />
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6" onClick={() => setSelectedUser(null)}>
          <div
            className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[32px] bg-white p-7 shadow-2xl ring-1 ring-[#e6ddc9]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">User Detail</p>
                <h3 className="mt-3 text-3xl font-semibold text-[#2f3529]">{selectedUser.username || "-"}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efe8d8] text-lg font-medium text-[#485b3b]"
              >
                X
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <MetaCard label="User ID" value={`#${selectedUser.user_id}`} />
              {selectedUser.organizer_id ? <MetaCard label="Organizer ID" value={`#${selectedUser.organizer_id}`} /> : null}
              <MetaCard label="Email" value={selectedUser.email || "-"} />
              <MetaCard label="Role" value={selectedUser.display_role || "user"} />
              <MetaCard label="Created" value={selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : "-"} />
            </div>

            {selectedUser.display_role === "organizer" ? (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <MetaCard label="Organization" value={selectedUser.organization_name || "-"} />
                <MetaCard label="Phone" value={selectedUser.phone || "-"} />
                <MetaCard label="Verified" value={Number(selectedUser.verified_status) ? "Approved" : "Pending"} />
              </div>
            ) : null}

            <section className="mt-6 rounded-[28px] bg-[#f8f4eb] p-5 ring-1 ring-[#e6ddc9]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-[#8d9577]">Account Management</p>
                  <h4 className="mt-2 text-xl font-semibold text-[#2f3529]">Manage User</h4>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setConfirmAction({
                      title: "Delete User",
                      message: `Delete user #${selectedUser.user_id}?`,
                      confirmLabel: "Delete User",
                      tone: "danger",
                      onConfirm: handleDeleteUser,
                    })
                  }
                  disabled={accountDeleting}
                  className="rounded-full bg-[#fff0ed] px-4 py-2 text-xs font-medium text-[#b33a24] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {accountDeleting ? "Deleting..." : "Delete User"}
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#4b5541]">Username</span>
                  <input
                    value={accountForm.username}
                    onChange={(event) => handleAccountFieldChange("username", event.target.value)}
                    className="admin-input"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#4b5541]">Email</span>
                  <input
                    type="email"
                    value={accountForm.email}
                    onChange={(event) => handleAccountFieldChange("email", event.target.value)}
                    className="admin-input"
                  />
                </label>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setConfirmAction({
                      title: "Save User",
                      message: `Save changes for user #${selectedUser.user_id}?`,
                      confirmLabel: "Save User",
                      tone: "primary",
                      onConfirm: handleUpdateUser,
                    })
                  }
                  disabled={accountSaving}
                  className="rounded-full bg-[#485b3b] px-4 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {accountSaving ? "Saving..." : "Save User"}
                </button>
              </div>
            </section>

            <div className="mt-6 flex flex-wrap gap-2">
              {(selectedUser.display_role === "organizer"
                ? [{ key: "events", label: "Organized Events" }]
                : [
                    { key: "orders", label: "Orders" },
                    { key: "registrations", label: "Event Registrations" },
                  ]
              ).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setSelectedView(item.key);
                    setActiveOrder(null);
                    setActiveRegistration(null);
                  }}
                  className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                    selectedView === item.key
                      ? "bg-[#485b3b] text-white"
                      : "bg-[#f3ede0] text-[#5f684f] hover:bg-[#e6ddc9]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {detailLoading ? (
              <div className="mt-6 rounded-2xl bg-[#f8f4eb] px-4 py-6 text-sm text-[#657056]">
                Loading detail...
              </div>
            ) : (
              <section className="mt-6 rounded-[28px] bg-[#fcfbf7] p-5 ring-1 ring-[#e6ddc9]">
                {selectedUser.display_role === "organizer" ? (
                  <OrganizerEventsSection events={organizedEvents} />
                ) : selectedView === "orders" ? (
                  <OrdersSection
                    orders={userOrders}
                    activeOrder={activeOrder}
                    onOpenOrder={handleOpenOrder}
                    onCloseOrder={handleCloseOrder}
                    onUpdateOrder={handleUpdateOrder}
                    onDeleteOrder={handleDeleteOrder}
                  />
                ) : (
                  <RegistrationsSection
                    registrations={userRegistrations}
                    activeRegistration={activeRegistration}
                    onOpenRegistration={handleOpenRegistration}
                    onCloseRegistration={handleCloseRegistration}
                    onUpdateRegistration={handleUpdateRegistration}
                    onDeleteRegistration={handleDeleteRegistration}
                  />
                )}
              </section>
            )}
          </div>
        </div>
      )}
      {confirmAction ? (
        <ConfirmActionModal
          {...confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={async () => {
            await confirmAction.onConfirm();
            setConfirmAction(null);
          }}
        />
      ) : null}
    </section>
  );
}

function OrdersSection({ orders, activeOrder, onOpenOrder, onCloseOrder, onUpdateOrder, onDeleteOrder }) {
  return (
    <>
      <SectionHeader title="Orders" count={orders.length} />
      {!orders.length ? (
        <EmptyState label="No orders found." />
      ) : (
        <div className="mt-5 space-y-3">
          {orders.map((order) => (
            <button
              key={order.order_id}
              type="button"
              onClick={() => onOpenOrder(order.order_id)}
              className="block w-full rounded-2xl border border-[#efe8d8] bg-white px-4 py-4 text-left transition hover:border-[#d7ceb8] hover:bg-[#fcfbf7]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#2f3529]">Order #{order.order_id}</p>
                  <p className="mt-1 text-xs text-[#7a8368]">{order.order_date ? new Date(order.order_date).toLocaleString() : "-"}</p>
                </div>
                <span className="rounded-full bg-[#f8f4eb] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#485b3b]">
                  {order.status || "pending"}
                </span>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <InfoRow label="Total" value={Number(order.total_amount || 0).toFixed(2)} />
                <InfoRow label="Payment" value={order.payment_status || "-"} />
              </div>
            </button>
          ))}
        </div>
      )}
      {activeOrder ? (
        <OrderDetailModal
          order={activeOrder}
          onClose={onCloseOrder}
          onUpdateOrder={onUpdateOrder}
          onDeleteOrder={onDeleteOrder}
        />
      ) : null}
    </>
  );
}

function RegistrationsSection({
  registrations,
  activeRegistration,
  onOpenRegistration,
  onCloseRegistration,
  onUpdateRegistration,
  onDeleteRegistration,
}) {
  return (
    <>
      <SectionHeader title="Event Registrations" count={registrations.length} />
      {!registrations.length ? (
        <EmptyState label="No event registrations found." />
      ) : (
        <div className="mt-5 space-y-3">
          {registrations.map((registration) => (
            <button
              key={registration.registration_id}
              type="button"
              onClick={() => onOpenRegistration(registration)}
              className="block w-full rounded-2xl border border-[#efe8d8] bg-white px-4 py-4 text-left transition hover:border-[#d7ceb8] hover:bg-[#fcfbf7]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#2f3529]">{registration.title || `Registration #${registration.registration_id}`}</p>
                  <p className="mt-1 text-xs text-[#7a8368]">{registration.event_date ? new Date(registration.event_date).toLocaleDateString() : "-"}</p>
                </div>
                <span className="rounded-full bg-[#f8f4eb] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#485b3b]">
                  {registration.registration_status || "-"}
                </span>
              </div>
              <div className="mt-3">
                <InfoRow label="Registration ID" value={`#${registration.registration_id}`} />
              </div>
            </button>
          ))}
        </div>
      )}
      {activeRegistration ? (
        <RegistrationDetailModal
          registration={activeRegistration}
          onClose={onCloseRegistration}
          onUpdateRegistration={onUpdateRegistration}
          onDeleteRegistration={onDeleteRegistration}
        />
      ) : null}
    </>
  );
}

function OrganizerEventsSection({ events }) {
  return (
    <>
      <SectionHeader title="Organized Events" count={events.length} />
      {!events.length ? (
        <EmptyState label="No organized events found." />
      ) : (
        <div className="mt-5 space-y-3">
          {events.map((event) => (
            <div key={event.event_id} className="rounded-2xl bg-white px-4 py-4 ring-1 ring-[#efe8d8]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#2f3529]">{event.title || `Event #${event.event_id}`}</p>
                  <p className="mt-1 text-xs text-[#7a8368]">{event.event_date ? new Date(event.event_date).toLocaleDateString() : "-"}</p>
                </div>
                <span className="rounded-full bg-[#f8f4eb] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#485b3b]">
                  {event.status || "draft"}
                </span>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <InfoRow label="Event ID" value={`#${event.event_id}`} />
                <InfoRow label="Location" value={event.location || "-"} />
                <InfoRow label="Price" value={Number(event.price || 0).toFixed(2)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
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
        <button
          type="button"
          onClick={() =>
            setConfirmAction({
              title: "Delete Order",
              message: `Delete order #${order.order_id}?`,
              confirmLabel: "Delete Order",
              tone: "danger",
              onConfirm: () => onDeleteOrder(order.order_id),
            })
          }
          className="rounded-full bg-[#fff0ed] px-4 py-2 text-xs font-medium text-[#b33a24]"
        >
          Delete Order
        </button>
      </div>

      <label className="mt-5 block">
        <span className="mb-2 block text-sm font-medium text-[#4b5541]">Update Status</span>
        <select
          value={order.status || "pending"}
          onChange={(event) =>
            setConfirmAction({
              title: "Update Order",
              message: `Change order #${order.order_id} status to ${event.target.value}?`,
              confirmLabel: "Update Order",
              tone: "primary",
              onConfirm: () => onUpdateOrder(order.order_id, event.target.value),
            })
          }
          className="admin-input"
        >
          {orderStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-[#8d9577]">
            <tr>
              <th className="pb-3">Product</th>
              <th className="pb-3">Qty</th>
              <th className="pb-3">Unit</th>
              <th className="pb-3">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map((item) => (
              <tr key={item.order_detail_id} className="border-t border-[#efe8d8]">
                <td className="py-4">
                  <p className="font-semibold text-[#2f3529]">{item.tea_name || `Product #${item.product_id}`}</p>
                </td>
                <td className="py-4">{item.quantity}</td>
                <td className="py-4">{Number(item.unit_price || 0).toFixed(2)}</td>
                <td className="py-4">{Number(item.subtotal || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DetailModalShell>
    {confirmAction ? (
      <ConfirmActionModal
        {...confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={async () => {
          await confirmAction.onConfirm();
          setConfirmAction(null);
        }}
      />
    ) : null}
    </>
  );
}

function RegistrationDetailModal({ registration, onClose, onUpdateRegistration, onDeleteRegistration }) {
  const [confirmAction, setConfirmAction] = useState(null);

  return (
    <>
    <DetailModalShell
      title={registration.title || `Registration #${registration.registration_id}`}
      badge="Registration Detail"
      onClose={onClose}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-3 md:grid-cols-3">
          <InfoRow label="Registration ID" value={`#${registration.registration_id}`} />
          <InfoRow label="Event ID" value={`#${registration.event_id}`} />
          <InfoRow label="Date" value={registration.event_date ? new Date(registration.event_date).toLocaleDateString() : "-"} />
        </div>
        <button
          type="button"
          onClick={() =>
            setConfirmAction({
              title: "Delete Registration",
              message: `Delete registration #${registration.registration_id}?`,
              confirmLabel: "Delete Registration",
              tone: "danger",
              onConfirm: () => onDeleteRegistration(registration.registration_id),
            })
          }
          className="rounded-full bg-[#fff0ed] px-4 py-2 text-xs font-medium text-[#b33a24]"
        >
          Delete Registration
        </button>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <InfoRow label="Status" value={registration.registration_status || "-"} />
        <InfoRow label="Location" value={registration.location || "-"} />
      </div>

      <label className="mt-5 block">
        <span className="mb-2 block text-sm font-medium text-[#4b5541]">Update Status</span>
        <select
          value={registration.registration_status || "REGISTERED"}
          onChange={(event) =>
            setConfirmAction({
              title: "Update Registration",
              message: `Change registration #${registration.registration_id} status to ${event.target.value}?`,
              confirmLabel: "Update Registration",
              tone: "primary",
              onConfirm: () => onUpdateRegistration(registration.registration_id, event.target.value),
            })
          }
          className="admin-input"
        >
          {registrationStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
    </DetailModalShell>
    {confirmAction ? (
      <ConfirmActionModal
        {...confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={async () => {
          await confirmAction.onConfirm();
          setConfirmAction(null);
        }}
      />
    ) : null}
    </>
  );
}

function DetailModalShell({ badge, title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6" onClick={onClose}>
      <div
        className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-[32px] bg-white p-7 shadow-2xl ring-1 ring-[#e6ddc9]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">{badge}</p>
            <h3 className="mt-3 text-3xl font-semibold text-[#2f3529]">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efe8d8] text-lg font-medium text-[#485b3b]"
          >
            X
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function ConfirmActionModal({ title, message, confirmLabel, tone = "primary", onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4 py-6" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl ring-1 ring-[#e6ddc9]"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-sm uppercase tracking-[0.3em] text-[#8d9577]">Confirm Action</p>
        <h4 className="mt-3 text-2xl font-semibold text-[#2f3529]">{title}</h4>
        <p className="mt-3 text-sm leading-6 text-[#4b5541]">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#efe8d8] px-4 py-2 text-xs font-medium text-[#485b3b]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-full px-4 py-2 text-xs font-medium text-white ${tone === "danger" ? "bg-[#b33a24]" : "bg-[#485b3b]"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

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

function EmptyState({ label }) {
  return <div className="rounded-2xl bg-white px-4 py-5 text-sm text-[#7a8368]">{label}</div>;
}

function MetaCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#f8f4eb] px-4 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">{label}</p>
      <p className="mt-2 text-sm text-[#2f3529]">{value || "-"}</p>
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

function paginate(items, page, pageSize = 10) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    totalPages,
  };
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="rounded-full bg-[#efe8d8] px-4 py-2 text-xs font-medium text-[#485b3b] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Prev
      </button>
      <span className="text-sm text-[#657056]">Page {currentPage} / {totalPages}</span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="rounded-full bg-[#efe8d8] px-4 py-2 text-xs font-medium text-[#485b3b] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
