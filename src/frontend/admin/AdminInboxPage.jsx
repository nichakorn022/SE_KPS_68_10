import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useOutletContext } from "react-router-dom";
import { adminApi } from "./adminApi";

const reportStatuses = ["pending", "reviewed", "resolved", "dismissed"];
const eventStatuses = ["draft", "open", "closed", "cancelled"];

function getItemTimestamp(item) {
  return item.createdAt ? new Date(item.createdAt).getTime() : 0;
}

export default function AdminInboxPage() {
  const { adminToken } = useOutletContext();
  const location = useLocation();
  const [shops, setShops] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [reports, setReports] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [selectedId, setSelectedId] = useState("");

  const initialFilter = location.pathname.includes("/reports") ? "reports" : "all";
  const [filter, setFilter] = useState(initialFilter);

  async function loadData() {
    setLoading(true);

    try {
      const [shopRows, organizerRows, reportRows, eventRows] = await Promise.all([
        adminApi.getShops(adminToken),
        adminApi.getOrganizers(adminToken),
        adminApi.getReports(adminToken),
        adminApi.getEvents(adminToken),
      ]);
      setShops(shopRows);
      setOrganizers(organizerRows);
      setReports(reportRows);
      setEvents(eventRows);
      setStatus({ type: "", message: "" });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [adminToken]);

  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  const items = useMemo(() => {
    const shopItems = shops.map((shop) => ({
      id: `shop-${shop.shop_id}`,
      type: "shop",
      status: Number(shop.verified_status) ? "approved" : "pending",
      title: shop.shop_name || `Shop #${shop.shop_id}`,
      subtitle: shop.email || `User #${shop.user_id}`,
      createdAt: shop.created_at || null,
      raw: shop,
    }));

    const organizerItems = organizers.map((organizer) => ({
      id: `organizer-${organizer.organizer_id}`,
      type: "organizer",
      status: Number(organizer.verified_status) ? "approved" : "pending",
      title:
        [organizer.first_name, organizer.last_name].filter(Boolean).join(" ") ||
        organizer.organization_name ||
        organizer.username ||
        `Organizer #${organizer.organizer_id}`,
      subtitle: organizer.email || `User #${organizer.user_id}`,
      createdAt: organizer.created_at || null,
      raw: organizer,
    }));

    const reportItems = reports.map((report) => ({
      id: `report-${report.report_id}`,
      type: "report",
      status: report.status || "pending",
      title: report.event_title || `Event #${report.event_id}`,
      subtitle: report.report_type,
      createdAt: report.created_at || null,
      raw: report,
    }));

    const merged = [...shopItems, ...organizerItems, ...reportItems].sort(
      (a, b) => getItemTimestamp(b) - getItemTimestamp(a)
    );

    return merged.filter((item) => {
      if (filter === "reports") return item.type === "report";
      if (filter === "approvals") return item.type === "shop" || item.type === "organizer";
      if (filter === "pending") return item.status === "pending";
      return true;
    });
  }, [filter, organizers, reports, shops]);

  useEffect(() => {
    if (!items.length) {
      setSelectedId("");
      return;
    }

    if (!items.some((item) => item.id === selectedId)) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  const selectedItem = items.find((item) => item.id === selectedId) || null;

  const handleShopVerification = async (shopId, nextValue) => {
    try {
      await adminApi.updateShopVerification(adminToken, shopId, nextValue);
      setStatus({ type: "success", message: `Shop #${shopId} updated` });
      loadData();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const handleOrganizerVerification = async (organizerId, nextValue) => {
    try {
      await adminApi.updateOrganizerVerification(adminToken, organizerId, nextValue);
      setStatus({ type: "success", message: `Organizer #${organizerId} updated` });
      loadData();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const handleReportStatusChange = async (reportId, nextStatus) => {
    try {
      await adminApi.updateReportStatus(adminToken, reportId, nextStatus);
      setStatus({ type: "success", message: `Report #${reportId} updated` });
      loadData();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const handleEventStatusChange = async (eventId, nextStatus) => {
    const current = events.find((eventItem) => String(eventItem.event_id) === String(eventId));
    if (!current) return;

    try {
      await adminApi.updateEvent(adminToken, eventId, {
        organizer_id: Number(current.organizer_id),
        title: current.title,
        description: current.description || "",
        event_date: String(current.event_date).slice(0, 10),
        location: current.location || "",
        max_participant: Number(current.max_participant),
        price: Number(current.price || 0),
        status: nextStatus,
      });
      setStatus({ type: "success", message: `Event #${eventId} updated` });
      loadData();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  return (
    <section className="space-y-6">
      {status.message && (
        <div className={`rounded-2xl px-4 py-3 text-sm ${status.type === "error" ? "bg-[#fff0ed] text-[#b33a24]" : "bg-[#eef6ea] text-[#386132]"}`}>
          {status.message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <div className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-[#e6ddc9]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">Inbox</p>
              <h3 className="mt-3 text-3xl font-semibold text-[#2f3529]">Approvals & Reports</h3>
            </div>
            <span className="rounded-full bg-[#f8f4eb] px-4 py-2 text-xs font-medium text-[#6d7759]">
              {items.length} item{items.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { value: "all", label: "All" },
              { value: "pending", label: "Pending" },
              { value: "approvals", label: "Approvals" },
              { value: "reports", label: "Reports" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                  filter === option.value
                    ? "bg-[#485b3b] text-white"
                    : "bg-[#f3ede0] text-[#5f684f] hover:bg-[#e6ddc9]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            {loading ? (
              <div className="rounded-2xl bg-[#f8f4eb] px-4 py-10 text-sm text-[#7a8368]">Loading inbox...</div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl bg-[#f8f4eb] px-4 py-10 text-sm text-[#7a8368]">No matching items.</div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`block w-full rounded-[24px] border px-4 py-4 text-left transition ${
                    item.id === selectedId
                      ? "border-[#485b3b] bg-[#eef4e8]"
                      : "border-[#efe8d8] bg-[#fcfbf7] hover:border-[#d7ceb8]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8d9577]">
                      {item.type}
                    </span>
                    <span className="text-[11px] text-[#8d9577]">{item.status}</span>
                  </div>
                  <p className="mt-3 font-semibold text-[#2f3529]">{item.title}</p>
                  <p className="mt-1 text-sm text-[#657056]">{item.subtitle}</p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[32px] bg-white p-7 shadow-sm ring-1 ring-[#e6ddc9]">
          {!selectedItem ? (
            <div className="flex min-h-[420px] items-center justify-center rounded-[24px] bg-[#f8f4eb] text-sm text-[#7a8368]">
              Select an item from the inbox.
            </div>
          ) : selectedItem.type === "shop" ? (
            <ShopDetail item={selectedItem.raw} onAction={handleShopVerification} />
          ) : selectedItem.type === "organizer" ? (
            <OrganizerDetail item={selectedItem.raw} onAction={handleOrganizerVerification} />
          ) : (
            <ReportDetail
              item={selectedItem.raw}
              onReportStatusChange={handleReportStatusChange}
              onEventStatusChange={handleEventStatusChange}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function DetailShell({ badge, title, subtitle, children }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">{badge}</p>
        <h3 className="mt-3 text-3xl font-semibold text-[#2f3529]">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-[#5d6550]">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function MetaGrid({ rows }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="rounded-2xl bg-[#f8f4eb] px-4 py-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">{row.label}</p>
          <p className="mt-2 text-sm text-[#2f3529]">{row.value}</p>
        </div>
      ))}
    </div>
  );
}

function ActionButton({ onClick, tone = "neutral", children }) {
  const className =
    tone === "positive"
      ? "bg-[#eef6ea] text-[#386132]"
      : tone === "danger"
        ? "bg-[#fff0ed] text-[#b33a24]"
        : "bg-[#efe8d8] text-[#485b3b]";

  return (
    <button type="button" onClick={onClick} className={`rounded-full px-5 py-3 text-sm font-medium ${className}`}>
      {children}
    </button>
  );
}

function ShopDetail({ item, onAction }) {
  return (
    <DetailShell
      badge="Shop Approval"
      title={item.shop_name || `Shop #${item.shop_id}`}
      subtitle="Review shop ownership and verify whether this account should be allowed to operate as a tea shop."
    >
      <MetaGrid
        rows={[
          { label: "Shop ID", value: `#${item.shop_id}` },
          { label: "Owner", value: item.email || `User #${item.user_id}` },
          { label: "Phone", value: item.phone || "-" },
          { label: "Contact", value: item.contact_info || "-" },
          { label: "National ID", value: item.national_id || "-" },
          { label: "Status", value: Number(item.verified_status) ? "Approved" : "Pending" },
        ]}
      />
      <div className="rounded-[24px] bg-[#fcfbf7] p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Description</p>
        <p className="mt-3 text-sm leading-7 text-[#4b5541]">{item.description || "No description provided."}</p>
      </div>
      <div className="flex gap-3">
        <ActionButton tone="positive" onClick={() => onAction(item.shop_id, 1)}>Approve Shop</ActionButton>
        <ActionButton tone="danger" onClick={() => onAction(item.shop_id, 0)}>Hold Request</ActionButton>
      </div>
    </DetailShell>
  );
}

function OrganizerDetail({ item, onAction }) {
  return (
    <DetailShell
      badge="Organizer Approval"
      title={[item.first_name, item.last_name].filter(Boolean).join(" ") || item.organization_name || `Organizer #${item.organizer_id}`}
      subtitle="Review organizer identity, organization context, and approval status before allowing event management access."
    >
      <MetaGrid
        rows={[
          { label: "Organizer ID", value: `#${item.organizer_id}` },
          { label: "User", value: item.email || `User #${item.user_id}` },
          { label: "Organization", value: item.organization_name || "-" },
          { label: "Phone", value: item.phone || "-" },
          { label: "Status", value: Number(item.verified_status) ? "Approved" : "Pending" },
        ]}
      />
      <div className="rounded-[24px] bg-[#fcfbf7] p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Description</p>
        <p className="mt-3 text-sm leading-7 text-[#4b5541]">{item.description || "No description provided."}</p>
      </div>
      <div className="flex gap-3">
        <ActionButton tone="positive" onClick={() => onAction(item.organizer_id, 1)}>Approve Organizer</ActionButton>
        <ActionButton tone="danger" onClick={() => onAction(item.organizer_id, 0)}>Hold Request</ActionButton>
      </div>
    </DetailShell>
  );
}

function ReportDetail({ item, onReportStatusChange, onEventStatusChange }) {
  return (
    <DetailShell
      badge="Event Report"
      title={item.event_title || `Event #${item.event_id}`}
      subtitle="Inspect the report details, update report handling status, and moderate the related event if needed."
    >
      <MetaGrid
        rows={[
          { label: "Report ID", value: `#${item.report_id}` },
          { label: "Reporter", value: item.email || `User #${item.user_id}` },
          { label: "Username", value: item.username || "-" },
          { label: "Type", value: item.report_type || "-" },
          { label: "Created", value: item.created_at ? new Date(item.created_at).toLocaleString() : "-" },
          { label: "Current Event Status", value: item.event_status || "draft" },
        ]}
      />
      <div className="rounded-[24px] bg-[#fcfbf7] p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Report Detail</p>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#4b5541]">{item.report_detail}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#4b5541]">Report Status</span>
          <select
            value={item.status}
            onChange={(event) => onReportStatusChange(item.report_id, event.target.value)}
            className="admin-input"
          >
            {reportStatuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#4b5541]">Event Status</span>
          <select
            value={item.event_status || "draft"}
            onChange={(event) => onEventStatusChange(item.event_id, event.target.value)}
            className="admin-input"
          >
            {eventStatuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>
      </div>
      <Link to="/admin/events" className="inline-flex rounded-full bg-[#efe8d8] px-5 py-3 text-sm font-medium text-[#485b3b]">
        Open Event Management
      </Link>
    </DetailShell>
  );
}
