import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi } from "./adminApi";
import { assetUrl } from "../../lib/api";
import AdminPagination, { paginate } from "./components/AdminPagination";
import AdminConfirmActionModal from "./components/AdminConfirmActionModal";
import { UserDetailModal } from "./components/AdminUserDetails";
import AdminFilterSummary from "./components/AdminFilterSummary";

function getVerificationStatusLabel(value) {
  return Number(value) === 1 ? "Approved" : Number(value) === 2 ? "Rejected" : "Pending";
}

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
      setStatus({ type: "success", message: "User updated" });
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
      setStatus({ type: "success", message: "User deleted" });
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

        <AdminFilterSummary
          count={filteredUsers.length}
          noun="profile"
          filteredLabel="Filtered result set"
          defaultLabel="All available profiles"
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
        />

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
                          <p className="mt-1 text-xs text-[#7a8368]">{user.email || user.role || "User account"}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8d9577]">Open details</p>
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
        <AdminPagination currentPage={paginatedUsers.page} totalPages={paginatedUsers.totalPages} onPageChange={setPage} />
      </div>

      {selectedUser ? (
        <UserDetailModal
          selectedUser={selectedUser}
          onClose={() => setSelectedUser(null)}
          accountDeleting={accountDeleting}
          accountSaving={accountSaving}
          setConfirmAction={setConfirmAction}
          handleDeleteUser={handleDeleteUser}
          accountForm={accountForm}
          handleAccountFieldChange={handleAccountFieldChange}
          handleUpdateUser={handleUpdateUser}
          selectedView={selectedView}
          setSelectedView={setSelectedView}
          setActiveOrder={setActiveOrder}
          setActiveRegistration={setActiveRegistration}
          detailLoading={detailLoading}
          organizedEvents={organizedEvents}
          userOrders={userOrders}
          activeOrder={activeOrder}
          handleOpenOrder={handleOpenOrder}
          handleCloseOrder={handleCloseOrder}
          handleUpdateOrder={handleUpdateOrder}
          handleDeleteOrder={handleDeleteOrder}
          userRegistrations={userRegistrations}
          activeRegistration={activeRegistration}
          handleOpenRegistration={handleOpenRegistration}
          handleCloseRegistration={handleCloseRegistration}
          handleUpdateRegistration={handleUpdateRegistration}
          handleDeleteRegistration={handleDeleteRegistration}
          getVerificationStatusLabel={getVerificationStatusLabel}
        />
      ) : null}
      {confirmAction ? (
        <AdminConfirmActionModal
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

function InfoRow({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#f8f4eb] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8d9577]">{label}</p>
      <p className="mt-2 text-sm text-[#2f3529]">{value || "-"}</p>
    </div>
  );
}

