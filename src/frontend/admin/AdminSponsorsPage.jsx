import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi } from "./adminApi";

const sponsorStatuses = ["pending", "approved", "rejected", "cancelled"];

export default function AdminSponsorsPage() {
  const { adminToken } = useOutletContext();
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [filter, setFilter] = useState("all");

  async function loadSponsors() {
    setLoading(true);
    try {
      const rows = await adminApi.getSponsors(adminToken);
      setSponsors(rows);
      setStatus({ type: "", message: "" });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSponsors();
  }, [adminToken]);

  const filteredSponsors = useMemo(() => {
    if (filter === "all") return sponsors;
    return sponsors.filter((item) => String(item.status).toLowerCase() === filter);
  }, [filter, sponsors]);

  const summary = useMemo(
    () => ({
      pending: sponsors.filter((item) => String(item.status).toLowerCase() === "pending").length,
      approved: sponsors.filter((item) => String(item.status).toLowerCase() === "approved").length,
      rejected: sponsors.filter((item) => String(item.status).toLowerCase() === "rejected").length,
    }),
    [sponsors]
  );

  const handleStatusChange = async (sponsorId, nextStatus) => {
    try {
      await adminApi.updateSponsorStatus(adminToken, sponsorId, nextStatus);
      setStatus({ type: "success", message: `Sponsor request #${sponsorId} updated` });
      loadSponsors();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  return (
    <section className="space-y-6">
      <div className="grid gap-5 md:grid-cols-3">
        <SummaryCard label="Pending Requests" value={summary.pending} />
        <SummaryCard label="Approved Requests" value={summary.approved} />
        <SummaryCard label="Rejected Requests" value={summary.rejected} />
      </div>

      <div className="rounded-[32px] bg-white p-7 shadow-sm ring-1 ring-[#e6ddc9]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">Sponsor Requests</p>
            <h3 className="mt-3 text-3xl font-semibold text-[#2f3529]">Sponsors Management</h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5d6550]">
              Review sponsorship requests linking shops, products, and events. Update the request status
              when the admin team accepts, rejects, or cancels the sponsorship.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {["all", ...sponsorStatuses].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                  filter === option
                    ? "bg-[#485b3b] text-white"
                    : "bg-[#f3ede0] text-[#5f684f] hover:bg-[#e6ddc9]"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {status.message && (
          <div className={`mt-5 rounded-2xl px-4 py-3 text-sm ${status.type === "error" ? "bg-[#fff0ed] text-[#b33a24]" : "bg-[#eef6ea] text-[#386132]"}`}>
            {status.message}
          </div>
        )}

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <div className="py-8 text-sm text-[#7a8368]">Loading...</div>
          ) : filteredSponsors.length === 0 ? (
            <div className="py-8 text-sm text-[#7a8368]">No sponsor requests found.</div>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="text-[#8d9577]">
                <tr>
                  <th className="pb-3">Request</th>
                  <th className="pb-3">Event</th>
                  <th className="pb-3">Shop</th>
                  <th className="pb-3">Product</th>
                  <th className="pb-3">Qty</th>
                  <th className="pb-3">Requested By</th>
                  <th className="pb-3">Created</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSponsors.map((item) => (
                  <tr key={item.sponsor_id} className="border-t border-[#efe8d8] align-top">
                    <td className="py-4 font-semibold text-[#2f3529]">#{item.sponsor_id}</td>
                    <td className="py-4">
                      <p className="font-medium text-[#2f3529]">{item.event_title || `Event #${item.event_id}`}</p>
                      <p className="text-xs text-[#7a8368]">Event ID: {item.event_id}</p>
                    </td>
                    <td className="py-4">
                      <p className="font-medium text-[#2f3529]">{item.shop_name || `Shop #${item.shop_id}`}</p>
                      <p className="text-xs text-[#7a8368]">Shop ID: {item.shop_id}</p>
                    </td>
                    <td className="py-4">
                      <p className="font-medium text-[#2f3529]">{item.product_name || `Product #${item.product_id}`}</p>
                      <p className="text-xs text-[#7a8368]">Product ID: {item.product_id}</p>
                    </td>
                    <td className="py-4">{item.quantity}</td>
                    <td className="py-4">{item.request_by || "-"}</td>
                    <td className="py-4">{item.created_at ? new Date(item.created_at).toLocaleString() : "-"}</td>
                    <td className="py-4">
                      <select
                        value={String(item.status || "pending").toLowerCase()}
                        onChange={(event) => handleStatusChange(item.sponsor_id, event.target.value)}
                        className="admin-input max-w-44"
                      >
                        {sponsorStatuses.map((option) => (
                          <option key={option} value={option}>
                            {option}
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

function SummaryCard({ label, value }) {
  return (
    <article className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-[#e6ddc9]">
      <p className="text-sm uppercase tracking-[0.3em] text-[#8d9577]">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-[#2f3529]">{value}</p>
    </article>
  );
}
