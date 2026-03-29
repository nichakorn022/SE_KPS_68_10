import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiUrl } from "../../lib/api";
import SiteNavbar from "../components/SiteNavbar";
import useSellerWorkspace from "../hooks/useSellerWorkspace";
import { getAuthHeaders } from "./authClient";

function formatCurrency(value) {
  return `THB ${Number(value || 0).toLocaleString("th-TH")}`;
}

function formatCount(value) {
  return Number(value || 0).toLocaleString("th-TH");
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
}

function getPaymentBadge(paymentStatus) {
  return String(paymentStatus || "unpaid").toLowerCase() === "paid"
    ? "bg-[#EEF6EA] text-[#386132]"
    : "bg-[#FFF4E2] text-[#A46317]";
}

function getOrderBadge(status) {
  const normalized = String(status || "pending").toLowerCase();
  if (normalized === "paid") return "bg-[#EEF6EA] text-[#386132]";
  if (normalized === "cancelled") return "bg-[#FFF0ED] text-[#B33A24]";
  return "bg-[#F7F3F0] text-[#BA5B56]";
}

function SellerOrderRow({ order, processing, onConfirm }) {
  const canConfirm = String(order.payment_status || "").toLowerCase() !== "paid" && Number(order.is_single_shop_order) === 1;

  return (
    <tr className="border-t border-[#E7E1D6] align-middle">
      <td className="px-5 py-5 sm:px-7">
        <div>
          <p className="font-medium text-[#253622]">#{order.order_id}</p>
          <p className="mt-1 text-sm text-[#7A8474]">{formatDateTime(order.order_date)}</p>
        </div>
      </td>
      <td className="px-5 py-5 sm:px-7">
        <div>
          <p className="text-[1rem] text-[#253622]">{order.username || `User #${order.user_id}`}</p>
          <p className="mt-1 text-sm text-[#7A8474]">{formatCount(order.seller_line_items)} items, {formatCount(order.seller_quantity)} units</p>
        </div>
      </td>
      <td className="px-5 py-5 sm:px-7">{formatCurrency(order.seller_subtotal)}</td>
      <td className="px-5 py-5 sm:px-7">
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex rounded-full px-3 py-1 text-[0.75rem] font-semibold uppercase tracking-[0.18em] ${getPaymentBadge(order.payment_status)}`}>{order.payment_status || "unpaid"}</span>
          <span className={`inline-flex rounded-full px-3 py-1 text-[0.75rem] font-semibold uppercase tracking-[0.18em] ${getOrderBadge(order.status)}`}>{order.status || "pending"}</span>
        </div>
        {Number(order.is_single_shop_order) !== 1 ? <p className="mt-2 text-sm text-[#B86A5F]">Contains products from multiple shops</p> : null}
      </td>
      <td className="px-5 py-5 text-right sm:px-7">
        {canConfirm ? (
          <button type="button" onClick={() => onConfirm(order.order_id)} disabled={processing} className="rounded-full bg-[#7B9A67] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
            {processing ? "Confirming..." : "Confirm Paid"}
          </button>
        ) : (
          <span className="inline-flex rounded-full border border-[#E4DDD2] px-4 py-2 text-sm text-[#6E7967]">
            {String(order.payment_status || "").toLowerCase() === "paid" ? "Already Paid" : "Admin Review"}
          </span>
        )}
      </td>
    </tr>
  );
}

export default function SellerPendingOrdersPage() {
  const { loading, error, shop, summary, refreshWorkspace } = useSellerWorkspace();
  const [sellerOrders, setSellerOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersStatus, setOrdersStatus] = useState({ type: "", message: "" });
  const [processingOrderId, setProcessingOrderId] = useState(null);

  const unpaidOrders = useMemo(
    () => sellerOrders.filter((order) => String(order.payment_status || "").toLowerCase() !== "paid"),
    [sellerOrders]
  );

  async function loadSellerOrders() {
    setOrdersLoading(true);
    try {
      const response = await fetch(apiUrl("/orders/seller?status=pending"), { headers: getAuthHeaders() });
      const data = await response.json().catch(() => []);
      if (!response.ok) throw new Error(data?.message || `Seller orders ${response.status}`);
      setSellerOrders(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setOrdersStatus({ type: "error", message: fetchError.message || "Failed to load seller orders" });
    } finally {
      setOrdersLoading(false);
    }
  }

  useEffect(() => {
    if (!shop || error) return;
    loadSellerOrders();
  }, [shop, error]);

  const handleConfirmPaid = async (orderId) => {
    try {
      setProcessingOrderId(orderId);
      setOrdersStatus({ type: "", message: "" });
      const response = await fetch(apiUrl(`/orders/seller/${orderId}/confirm-paid`), {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || `Confirm payment ${response.status}`);
      setOrdersStatus({ type: "success", message: `Order #${orderId} marked as paid` });
      await loadSellerOrders();
      refreshWorkspace();
    } catch (actionError) {
      setOrdersStatus({ type: "error", message: actionError.message || "Failed to confirm payment" });
    } finally {
      setProcessingOrderId(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#F7F5EF]"><SiteNavbar active="seller" /><div className="mx-auto max-w-[1700px] px-6 py-10"><div className="h-72 animate-pulse rounded-[34px] bg-[#E8EBDD]" /></div></div>;
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-[#F7F5EF]">
        <SiteNavbar active="seller" />
        <div className="grid min-h-[calc(100vh-5rem)] place-items-center px-6">
          <div className="max-w-xl rounded-[32px] border border-[#DFE5D6] bg-white/88 p-8 text-center shadow-[0_24px_70px_rgba(72,91,59,0.08)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[#829473]">Seller Hub</p>
            <h1 className="mt-3 font-serif text-[2.6rem] text-[#24321F]">Workspace unavailable</h1>
            <p className="mt-4 text-[1rem] leading-8 text-[#697563]">{error || "No shop profile found"}</p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/seller" className="rounded-full bg-[#7B9A67] px-5 py-3 text-sm font-semibold text-white">Back to Seller Hub</Link>
              <Link to="/" className="rounded-full border border-[#CDD8C2] px-5 py-3 text-sm font-semibold text-[#567048]">Go Home</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#253622]">
      <SiteNavbar active="seller" />
      <main className="px-4 pb-16 pt-6 sm:px-6 xl:px-8">
        <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-8">
          <section className="rounded-[34px] border border-[#DFE5D6] bg-white px-8 py-8 shadow-[0_18px_40px_rgba(72,91,59,0.06)] sm:px-10 sm:py-10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#829473]">Seller Orders</p>
                <h1 className="mt-3 text-[2.2rem] font-medium tracking-[-0.04em] text-[#253622] sm:text-[2.8rem]">Payment Confirmation Queue</h1>
                <p className="mt-3 max-w-3xl text-[1rem] leading-8 text-[#66735F]">Review recent orders from your shop and confirm when payment has arrived.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/seller" className="rounded-full border border-[#D6DDCD] bg-white px-5 py-3 text-sm font-semibold text-[#567048]">Back to Seller Hub</Link>
                <button type="button" onClick={loadSellerOrders} disabled={ordersLoading} className="rounded-full bg-[#7B9A67] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{ordersLoading ? "Refreshing..." : "Refresh Orders"}</button>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-[#E3E7DC] bg-[#FCFDF8] px-5 py-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8A9483]">Pending Payment</p>
                <p className="mt-3 text-[2rem] font-medium text-[#253622]">{formatCount(unpaidOrders.length)}</p>
                <p className="mt-2 text-sm text-[#6E7967]">Orders waiting for your confirmation</p>
              </div>
              <div className="rounded-[24px] border border-[#E3E7DC] bg-[#FCFDF8] px-5 py-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8A9483]">Paid Orders 30d</p>
                <p className="mt-3 text-[2rem] font-medium text-[#253622]">{formatCount(summary.paidOrders30d)}</p>
                <p className="mt-2 text-sm text-[#6E7967]">Completed payments in the last month</p>
              </div>
              <div className="rounded-[24px] border border-[#E3E7DC] bg-[#FCFDF8] px-5 py-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8A9483]">Revenue 30d</p>
                <p className="mt-3 text-[2rem] font-medium text-[#253622]">{formatCurrency(summary.revenue30d)}</p>
                <p className="mt-2 text-sm text-[#6E7967]">Revenue attributed to paid orders</p>
              </div>
            </div>
          </section>

          {ordersStatus.message ? <div className={`rounded-2xl px-4 py-3 text-sm ${ordersStatus.type === "error" ? "bg-[#FFF0ED] text-[#B33A24]" : "bg-[#EEF6EA] text-[#386132]"}`}>{ordersStatus.message}</div> : null}

          <section className="rounded-[30px] border border-[#DED8CB] bg-[linear-gradient(180deg,#FCFBF8_0%,#F8F5EE_100%)] px-5 py-6 shadow-[0_14px_34px_rgba(72,91,59,0.05)] sm:px-7 sm:py-7 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-[1.8rem] font-medium tracking-[-0.04em] text-[#253622]">Pending Orders</h2>
                <p className="mt-2 text-[1rem] text-[#6A7664]">Orders with unpaid status are listed first so the shop can confirm payment quickly.</p>
              </div>
              {!ordersLoading && unpaidOrders.length > 0 ? <p className="text-sm text-[#8A8174]">{formatCount(unpaidOrders.length)} order(s) still waiting for payment confirmation.</p> : null}
            </div>

            <div className="mt-7 overflow-hidden rounded-[28px] border border-[#E4DDD2] bg-white shadow-[0_10px_28px_rgba(72,91,59,0.04)]">
              {ordersLoading ? (
                <div className="px-6 py-12 text-center text-[#788371]">Loading seller orders...</div>
              ) : sellerOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="text-left text-[1rem] font-medium text-[#5A6250]">
                        <th className="px-5 py-5 sm:px-7">Order</th>
                        <th className="px-5 py-5 sm:px-7">Customer</th>
                        <th className="px-5 py-5 sm:px-7">Your Sales</th>
                        <th className="px-5 py-5 sm:px-7">Payment</th>
                        <th className="px-5 py-5 text-right sm:px-7">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellerOrders.map((order) => (
                        <SellerOrderRow
                          key={order.order_id}
                          order={order}
                          processing={processingOrderId === order.order_id}
                          onConfirm={handleConfirmPaid}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-12 text-center sm:px-8">
                  <p className="text-[1.05rem] font-medium text-[#253622]">No orders for this shop yet</p>
                  <p className="mt-2 text-[0.98rem] text-[#788371]">When customers place orders, payment confirmations will appear here.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
