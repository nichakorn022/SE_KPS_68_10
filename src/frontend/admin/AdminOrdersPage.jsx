import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi } from "./adminApi";

const orderStatuses = ["pending", "paid", "cancelled"];

const statusStyles = {
  pending: "bg-[#fff4e2] text-[#a46317]",
  paid: "bg-[#eef6ea] text-[#386132]",
  cancelled: "bg-[#fff0ed] text-[#b33a24]",
};

export default function AdminOrdersPage() {
  const { adminToken } = useOutletContext();
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });

  async function loadOrders() {
    setLoading(true);
    try {
      const rows = await adminApi.getOrders(adminToken);
      setOrders(rows);
      setStatus({ type: "", message: "" });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [adminToken]);

  const summaryCards = useMemo(
    () => [
      { label: "Total Orders", value: orders.length },
      { label: "Pending", value: orders.filter((order) => order.status === "pending").length },
      { label: "Paid", value: orders.filter((order) => order.status === "paid").length },
      { label: "Cancelled", value: orders.filter((order) => order.status === "cancelled").length },
    ],
    [orders]
  );

  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;

    const keyword = searchTerm.trim().toLowerCase();
    return orders.filter((order) => {
      const haystack = [
        `order ${order.order_id}`,
        `user ${order.user_id}`,
        order.status,
        order.order_date,
        String(order.total_amount),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [orders, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const paginatedOrders = useMemo(() => paginate(filteredOrders, page), [filteredOrders, page]);

  const handleStatusChange = async (orderId, nextStatus) => {
    try {
      await adminApi.updateOrderStatus(adminToken, orderId, nextStatus);
      setStatus({ type: "success", message: `Order #${orderId} updated` });
      loadOrders();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const handleOpenOrder = async (orderId) => {
    setDetailLoading(true);
    try {
      const detail = await adminApi.getOrderDetail(adminToken, orderId);
      setSelectedOrder(detail);
      setStatus({ type: "", message: "" });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] bg-white p-7 shadow-sm ring-1 ring-[#e6ddc9]">
        <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">Orders Management</p>
        <h3 className="mt-3 text-3xl font-semibold text-[#2f3529]">Orders</h3>

        {status.message && (
          <div className={`mt-5 rounded-2xl px-4 py-3 text-sm ${status.type === "error" ? "bg-[#fff0ed] text-[#b33a24]" : "bg-[#eef6ea] text-[#386132]"}`}>
            {status.message}
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-4">
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
          placeholder="Search by order id, user id, status, date, or total..."
          className="admin-input mt-6"
        />

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <div className="py-8 text-sm text-[#7a8368]">Loading...</div>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="text-[#8d9577]">
                <tr>
                  <th className="pb-3">Order</th>
                  <th className="pb-3">User</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.items.map((order) => (
                  <tr
                    key={order.order_id}
                    onClick={() => handleOpenOrder(order.order_id)}
                    className={`cursor-pointer border-t border-[#efe8d8] transition hover:bg-[#fcfbf7] ${
                      selectedOrder?.order_id === order.order_id ? "bg-[#f8f4eb]" : ""
                    }`}
                  >
                    <td className="py-4 font-semibold text-[#2f3529]">
                      <div>
                        <p>#{order.order_id}</p>
                        <p className="mt-1 text-xs font-normal uppercase tracking-[0.18em] text-[#8d9577]">Click to review</p>
                      </div>
                    </td>
                    <td className="py-4">{order.user_id}</td>
                    <td className="py-4">{new Date(order.order_date).toLocaleString()}</td>
                    <td className="py-4">{Number(order.total_amount).toFixed(2)}</td>
                    <td className="py-4">
                      <div className="flex flex-col gap-2">
                        <span className={`inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${statusStyles[order.status] || "bg-[#f0ede7] text-[#6f685c]"}`}>
                          {order.status}
                        </span>
                        <select
                          value={order.status}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => handleStatusChange(order.order_id, event.target.value)}
                          className="admin-input max-w-40"
                        >
                          {orderStatuses.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenOrder(order.order_id);
                        }}
                        className="rounded-full bg-[#efe8d8] px-4 py-2 text-xs font-medium text-[#485b3b]"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination currentPage={paginatedOrders.page} totalPages={paginatedOrders.totalPages} onPageChange={setPage} />
      </div>

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[32px] bg-white p-7 shadow-2xl ring-1 ring-[#e6ddc9]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">Order Detail</p>
                <h3 className="mt-3 text-3xl font-semibold text-[#2f3529]">Order #{selectedOrder.order_id}</h3>
                <span className={`mt-4 inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${statusStyles[selectedOrder.status] || "bg-[#f0ede7] text-[#6f685c]"}`}>
                  {selectedOrder.status}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efe8d8] text-lg font-medium text-[#485b3b]"
              >
                X
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <MetaCard label="User ID" value={selectedOrder.user_id} />
              <MetaCard label="Order Date" value={selectedOrder.order_date ? new Date(selectedOrder.order_date).toLocaleString() : "-"} />
              <MetaCard label="Status" value={selectedOrder.status} />
              <MetaCard label="Total" value={Number(selectedOrder.total_amount || 0).toFixed(2)} />
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-[#8d9577]">
                  <tr>
                    <th className="pb-3">Product</th>
                    <th className="pb-3">Qty</th>
                    <th className="pb-3">Unit Price</th>
                    <th className="pb-3">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedOrder.items || []).map((item) => (
                    <tr key={item.order_detail_id} className="border-t border-[#efe8d8]">
                      <td className="py-4">
                        <p className="font-semibold text-[#2f3529]">{item.tea_name}</p>
                        <p className="text-xs text-[#7a8368]">Product #{item.product_id}</p>
                      </td>
                      <td className="py-4">{item.quantity}</td>
                      <td className="py-4">{Number(item.unit_price || 0).toFixed(2)}</td>
                      <td className="py-4">{Number(item.subtotal || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {detailLoading && (
        <div className="rounded-2xl bg-[#f8f4eb] px-4 py-3 text-sm text-[#7a8368]">Loading order detail...</div>
      )}
    </section>
  );
}

function MetaCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#f8f4eb] px-4 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">{label}</p>
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
