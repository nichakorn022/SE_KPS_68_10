import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi } from "./adminApi";

const orderStatuses = ["pending", "paid", "cancelled"];

export default function AdminOrdersPage() {
  const { adminToken } = useOutletContext();
  const [orders, setOrders] = useState([]);
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

  const handleStatusChange = async (orderId, nextStatus) => {
    try {
      await adminApi.updateOrderStatus(adminToken, orderId, nextStatus);
      setStatus({ type: "success", message: `Order #${orderId} updated` });
      loadOrders();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
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
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.order_id} className="border-t border-[#efe8d8]">
                    <td className="py-4 font-semibold text-[#2f3529]">#{order.order_id}</td>
                    <td className="py-4">{order.user_id}</td>
                    <td className="py-4">{new Date(order.order_date).toLocaleString()}</td>
                    <td className="py-4">{Number(order.total_amount).toFixed(2)}</td>
                    <td className="py-4">
                      <select
                        value={order.status}
                        onChange={(event) => handleStatusChange(order.order_id, event.target.value)}
                        className="admin-input max-w-40"
                      >
                        {orderStatuses.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
