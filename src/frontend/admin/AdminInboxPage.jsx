import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useOutletContext, useSearchParams } from "react-router-dom";
import { adminApi } from "./adminApi";
import { assetUrl } from "../../lib/api";

function getVerificationStatusLabel(value) {
  return Number(value) === 1 ? "approved" : Number(value) === 2 ? "rejected" : "pending";
}

const reportStatuses = ["pending", "reviewed", "resolved", "dismissed"];
const eventStatuses = ["draft", "open", "closed", "cancelled"];

const typeStyles = {
  shop: "bg-[#eef6ea] text-[#386132]",
  organizer: "bg-[#eef2ff] text-[#3d4f93]",
  sponsor: "bg-[#fff4e2] text-[#a46317]",
  report: "bg-[#fff0ed] text-[#b33a24]",
};

const statusStyles = {
  pending: "bg-[#fff4e2] text-[#a46317]",
  approved: "bg-[#eef6ea] text-[#386132]",
  reviewed: "bg-[#eef2ff] text-[#3d4f93]",
  resolved: "bg-[#eef6ea] text-[#386132]",
  dismissed: "bg-[#f0ede7] text-[#6f685c]",
  rejected: "bg-[#fff0ed] text-[#b33a24]",
};

function getItemTimestamp(item) {
  return item.createdAt ? new Date(item.createdAt).getTime() : 0;
}

function isOpenModerationItem(item) {
  if (item.type === "report") {
    return ["pending", "reviewed"].includes(String(item.status).toLowerCase());
  }

  return String(item.status).toLowerCase() === "pending";
}

function formatDateTime(value) {
  if (!value) return "No timestamp";
  return new Date(value).toLocaleString();
}

function getTypeContext(type) {
  switch (type) {
    case "shop":
      return {
        label: "Shop requests",
        searchPlaceholder: "Search by shop name, owner email, phone, or shop id...",
        resultLabel: "shop request",
        queueLabel: "Filtered shop requests",
        emptyLabel: "No matching shop requests.",
      };
    case "organizer":
      return {
        label: "Organizer requests",
        searchPlaceholder: "Search by organizer name, organization, email, or organizer id...",
        resultLabel: "organizer request",
        queueLabel: "Filtered organizer requests",
        emptyLabel: "No matching organizer requests.",
      };
    case "sponsor":
      return {
        label: "Sponsor requests",
        searchPlaceholder: "Search by event, shop, product, or sponsor request details...",
        resultLabel: "sponsor request",
        queueLabel: "Filtered sponsor requests",
        emptyLabel: "No matching sponsor requests.",
      };
    case "report":
      return {
        label: "Event reports",
        searchPlaceholder: "Search by event title, report type, reporter, or report details...",
        resultLabel: "report",
        queueLabel: "Filtered reports",
        emptyLabel: "No matching reports.",
      };
    default:
      return {
        label: "All moderation items",
        searchPlaceholder: "Search by shop, organizer, event, product, email...",
        resultLabel: "moderation item",
        queueLabel: "Filtered records",
        emptyLabel: "No matching items.",
      };
  }
}

export default function AdminInboxPage() {
  const { adminToken } = useOutletContext();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [shops, setShops] = useState([]);
  const [shopImages, setShopImages] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [reports, setReports] = useState([]);
  const [events, setEvents] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [selectedId, setSelectedId] = useState("");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [notesById, setNotesById] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createdFilter, setCreatedFilter] = useState("all");
  const [eventStatusFilter, setEventStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const isRequestsReportsPage = location.pathname.includes("/requests-reports");
  const initialFilter = isRequestsReportsPage ? "all" : "all";
  const [filter, setFilter] = useState(initialFilter);

  async function loadData() {
    setLoading(true);

    try {
      const [shopRows, shopImageRows, organizerRows, reportRows, eventRows, sponsorRows] = await Promise.all([
        adminApi.getShops(adminToken),
        adminApi.getShopImages(adminToken),
        adminApi.getOrganizers(adminToken),
        adminApi.getReports(adminToken),
        adminApi.getEvents(adminToken),
        adminApi.getSponsors(adminToken),
      ]);
      setShops(shopRows);
      setShopImages(shopImageRows);
      setOrganizers(organizerRows);
      setReports(reportRows);
      setEvents(eventRows);
      setSponsors(sponsorRows);
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

  useEffect(() => {
    const queryFilter = searchParams.get("view");
    const queryType = searchParams.get("type");
    const queryStatus = searchParams.get("status");
    const queryCreated = searchParams.get("created");
    const queryEventStatus = searchParams.get("eventStatus");

    if (["all", "pending", "approvals", "reports"].includes(queryFilter || "")) {
      setFilter(queryFilter);
    } else {
      setFilter(initialFilter);
    }

    if (["all", "shop", "organizer", "sponsor", "report"].includes(queryType || "")) {
      setTypeFilter(queryType);
    } else {
      setTypeFilter("all");
    }

    if (["all", "pending", "approved", "reviewed", "resolved", "dismissed", "rejected"].includes(queryStatus || "")) {
      setStatusFilter(queryStatus);
    } else {
      setStatusFilter("all");
    }

    if (["all", "7d", "30d", "older"].includes(queryCreated || "")) {
      setCreatedFilter(queryCreated);
    } else {
      setCreatedFilter("all");
    }

    if (["all", "draft", "open", "closed", "cancelled"].includes(queryEventStatus || "")) {
      setEventStatusFilter(queryEventStatus);
    } else {
      setEventStatusFilter("all");
    }
  }, [initialFilter, searchParams]);

  const items = useMemo(() => {
    const shopItems = shops.map((shop) => ({
      id: `shop-${shop.shop_id}`,
      type: "shop",
      status: getVerificationStatusLabel(shop.verified_status),
      title: shop.shop_name || `Shop #${shop.shop_id}`,
      subtitle: shop.email || `User #${shop.user_id}`,
      createdAt: shop.created_at || null,
      raw: shop,
    }));

    const organizerItems = organizers.map((organizer) => ({
      id: `organizer-${organizer.organizer_id}`,
      type: "organizer",
      status: getVerificationStatusLabel(organizer.verified_status),
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

    const sponsorItems = sponsors.map((sponsor) => ({
      id: `sponsor-${sponsor.sponsor_id}`,
      type: "sponsor",
      status: sponsor.status || "pending",
      title: sponsor.event_title || `Event #${sponsor.event_id}`,
      subtitle: sponsor.shop_name || `Shop #${sponsor.shop_id}`,
      createdAt: sponsor.created_at || null,
      raw: sponsor,
    }));

    const merged = [...shopItems, ...organizerItems, ...reportItems, ...sponsorItems];

    const filtered = merged.filter((item) => {
      const now = Date.now();

      if (filter === "reports" && item.type !== "report") return false;
      if (filter === "approvals" && !["shop", "organizer", "sponsor"].includes(item.type)) return false;
      if (filter === "pending" && item.status !== "pending") return false;
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (statusFilter === "all") {
        if (!isOpenModerationItem(item)) return false;
      } else if (String(item.status).toLowerCase() !== statusFilter) {
        return false;
      }

      if (createdFilter !== "all") {
        const createdAt = item.createdAt ? new Date(item.createdAt).getTime() : 0;
        if (createdFilter === "7d" && (!createdAt || now - createdAt > 7 * 24 * 60 * 60 * 1000)) return false;
        if (createdFilter === "30d" && (!createdAt || now - createdAt > 30 * 24 * 60 * 60 * 1000)) return false;
        if (createdFilter === "older" && (!createdAt || now - createdAt <= 30 * 24 * 60 * 60 * 1000)) return false;
      }

      if (eventStatusFilter !== "all") {
        const relatedEventStatus =
          item.type === "report"
            ? String(item.raw?.event_status || "draft").toLowerCase()
            : item.type === "sponsor"
              ? String(events.find((eventItem) => String(eventItem.event_id) === String(item.raw?.event_id))?.status || "")
                  .toLowerCase()
              : "all";

        if (!relatedEventStatus || relatedEventStatus !== eventStatusFilter) return false;
      }

      if (!searchTerm.trim()) return true;

      const haystack = [
        item.title,
        item.subtitle,
        item.type,
        item.status,
        item.raw?.email,
        item.raw?.username,
        item.raw?.organization_name,
        item.raw?.shop_name,
        item.raw?.event_title,
        item.raw?.product_name,
        item.raw?.report_type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(searchTerm.trim().toLowerCase());
    });
    return filtered.sort((left, right) => {
      if (sortBy === "oldest") {
        return getItemTimestamp(left) - getItemTimestamp(right);
      }

      if (sortBy === "pending") {
        const leftPending = String(left.status).toLowerCase() === "pending" ? 0 : 1;
        const rightPending = String(right.status).toLowerCase() === "pending" ? 0 : 1;
        if (leftPending !== rightPending) return leftPending - rightPending;
      }

      return getItemTimestamp(right) - getItemTimestamp(left);
    });
  }, [createdFilter, eventStatusFilter, events, filter, organizers, reports, searchTerm, shops, sortBy, sponsors, statusFilter, typeFilter]);

  useEffect(() => {
    setPage(1);
  }, [filter, searchTerm, statusFilter, typeFilter, createdFilter, eventStatusFilter, sortBy]);

  useEffect(() => {
    if (!items.length) {
      setSelectedId("");
      setIsDetailModalOpen(false);
      return;
    }

    if (!items.some((item) => item.id === selectedId)) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  useEffect(() => {
    setSelectedIds((current) => current.filter((itemId) => items.some((item) => item.id === itemId)));
  }, [items]);

  const selectedItem = items.find((item) => item.id === selectedId) || null;
  const summaryCards = useMemo(
    () => [
      {
        label: "Pending Shops",
        value: shops.filter((shop) => getVerificationStatusLabel(shop.verified_status) === "pending").length,
        tone: "shop",
      },
      {
        label: "Pending Organizers",
        value: organizers.filter((organizer) => getVerificationStatusLabel(organizer.verified_status) === "pending").length,
        tone: "organizer",
      },
      {
        label: "Pending Sponsors",
        value: sponsors.filter((sponsor) => String(sponsor.status).toLowerCase() === "pending").length,
        tone: "sponsor",
      },
      {
        label: "Pending Reports",
        value: reports.filter((report) => String(report.status).toLowerCase() === "pending").length,
        tone: "report",
      },
    ],
    [organizers, reports, shops, sponsors]
  );
  const paginatedItems = useMemo(() => paginate(items, page), [items, page]);
  const hasActiveFilters =
    filter !== "all" ||
    Boolean(searchTerm.trim()) ||
    typeFilter !== "all" ||
    statusFilter !== "all" ||
    createdFilter !== "all" ||
    eventStatusFilter !== "all";
  const statusOptions = useMemo(() => {
    if (typeFilter === "shop" || typeFilter === "organizer") {
      return [
        { value: "all", label: "All statuses" },
        { value: "pending", label: "Pending" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
      ];
    }

    if (typeFilter === "sponsor") {
      return [
        { value: "all", label: "All statuses" },
        { value: "pending", label: "Pending" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
      ];
    }

    if (typeFilter === "report") {
      return [
        { value: "all", label: "All statuses" },
        { value: "pending", label: "Pending" },
        { value: "reviewed", label: "Reviewed" },
        { value: "resolved", label: "Resolved" },
        { value: "dismissed", label: "Dismissed" },
      ];
    }

    return [
      { value: "all", label: "All statuses" },
      { value: "pending", label: "Pending" },
      { value: "approved", label: "Approved" },
      { value: "reviewed", label: "Reviewed" },
      { value: "resolved", label: "Resolved" },
      { value: "dismissed", label: "Dismissed" },
      { value: "rejected", label: "Rejected" },
    ];
  }, [typeFilter]);
  const showEventStatusFilter = typeFilter === "all" || typeFilter === "report" || typeFilter === "sponsor";
  const typeContext = useMemo(() => getTypeContext(typeFilter), [typeFilter]);
  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(item.id)),
    [items, selectedIds]
  );
  const allPageSelected =
    paginatedItems.items.length > 0 && paginatedItems.items.every((item) => selectedIds.includes(item.id));
  const selectableBulkType = typeFilter === "all" ? null : typeFilter;
  const bulkActions = useMemo(() => {
    if (selectableBulkType === "shop" || selectableBulkType === "organizer") {
      return [
        { key: "approve", label: "Approve selected" },
        { key: "reject", label: "Reject selected" },
      ];
    }

    if (selectableBulkType === "sponsor") {
      return [
        { key: "approve", label: "Approve selected" },
        { key: "reject", label: "Reject selected" },
        { key: "pending", label: "Keep pending" },
      ];
    }

    if (selectableBulkType === "report") {
      return [
        { key: "reviewed", label: "Mark reviewed" },
        { key: "resolved", label: "Mark resolved" },
        { key: "dismissed", label: "Dismiss selected" },
      ];
    }

    return [];
  }, [selectableBulkType]);

  useEffect(() => {
    const allowedStatuses = new Set(statusOptions.map((option) => option.value));
    if (!allowedStatuses.has(statusFilter)) {
      setStatusFilter("all");
    }
  }, [statusFilter, statusOptions]);

  useEffect(() => {
    if (!showEventStatusFilter && eventStatusFilter !== "all") {
      setEventStatusFilter("all");
    }
  }, [eventStatusFilter, showEventStatusFilter]);

  const openDetail = (itemId) => {
    setSelectedId(itemId);
    setIsDetailModalOpen(true);
  };

  const closeDetail = () => {
    setIsDetailModalOpen(false);
  };

  const requestConfirmation = ({ title, message, confirmLabel, tone = "neutral", action }) => {
    setConfirmAction({ title, message, confirmLabel, tone, action });
  };

  const closeConfirmation = () => {
    setConfirmAction(null);
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction?.action) return;

    try {
      await confirmAction.action();
      closeConfirmation();
    } catch {
      // action handlers already set status message
    }
  };

  const handleShopVerification = async (shopId, nextValue) => {
    try {
      await adminApi.updateShopVerification(
        adminToken,
        shopId,
        nextValue,
        notesById[`shop-${shopId}`] || null
      );
      setStatus({ type: "success", message: `Shop #${shopId} updated` });
      loadData();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const handleOrganizerVerification = async (organizerId, nextValue) => {
    try {
      await adminApi.updateOrganizerVerification(
        adminToken,
        organizerId,
        nextValue,
        notesById[`organizer-${organizerId}`] || null
      );
      setStatus({ type: "success", message: `Organizer #${organizerId} updated` });
      loadData();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const handleReportStatusChange = async (reportId, nextStatus) => {
    try {
      await adminApi.updateReportStatus(adminToken, reportId, nextStatus, notesById[`report-${reportId}`] || null);
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

  const handleSponsorStatusChange = async (sponsorId, nextStatus) => {
    try {
      await adminApi.updateSponsorStatus(adminToken, sponsorId, nextStatus, notesById[`sponsor-${sponsorId}`] || null);
      setStatus({ type: "success", message: `Sponsor #${sponsorId} updated` });
      loadData();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const handleNoteChange = (itemId, value) => {
    setNotesById((current) => ({ ...current, [itemId]: value }));
  };

  const handleShopImageUpload = async (shopId, file) => {
    try {
      await adminApi.uploadShopImage(adminToken, shopId, file);
      setStatus({ type: "success", message: `Shop #${shopId} image uploaded` });
      loadData();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const handleShopImageDelete = async (imageId) => {
    try {
      await adminApi.deleteShopImage(adminToken, imageId);
      setStatus({ type: "success", message: `Shop image #${imageId} deleted` });
      loadData();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const toggleSelected = (itemId) => {
    setSelectedIds((current) =>
      current.includes(itemId) ? current.filter((value) => value !== itemId) : [...current, itemId]
    );
  };

  const toggleSelectAllOnPage = () => {
    const pageIds = paginatedItems.items.map((item) => item.id);
    setSelectedIds((current) => {
      if (pageIds.every((itemId) => current.includes(itemId))) {
        return current.filter((itemId) => !pageIds.includes(itemId));
      }

      return Array.from(new Set([...current, ...pageIds]));
    });
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const runBulkAction = async (actionKey) => {
    if (!selectedItems.length || !selectableBulkType) return;

    try {
      setBulkRunning(true);

      if (selectableBulkType === "shop") {
        await Promise.all(
          selectedItems.map((item) =>
            adminApi.updateShopVerification(
              adminToken,
              item.raw.shop_id,
              actionKey === "approve" ? 1 : 2,
              notesById[item.id] || null
            )
          )
        );
      } else if (selectableBulkType === "organizer") {
        await Promise.all(
          selectedItems.map((item) =>
            adminApi.updateOrganizerVerification(
              adminToken,
              item.raw.organizer_id,
              actionKey === "approve" ? 1 : 2,
              notesById[item.id] || null
            )
          )
        );
      } else if (selectableBulkType === "sponsor") {
        const nextStatus =
          actionKey === "approve" ? "approved" : actionKey === "reject" ? "rejected" : "pending";
        await Promise.all(
          selectedItems.map((item) =>
            adminApi.updateSponsorStatus(adminToken, item.raw.sponsor_id, nextStatus, notesById[item.id] || null)
          )
        );
      } else if (selectableBulkType === "report") {
        await Promise.all(
          selectedItems.map((item) =>
            adminApi.updateReportStatus(adminToken, item.raw.report_id, actionKey, notesById[item.id] || null)
          )
        );
      }

      setStatus({ type: "success", message: `${selectedItems.length} ${typeContext.resultLabel}${selectedItems.length === 1 ? "" : "s"} updated` });
      setSelectedIds([]);
      await loadData();
      closeConfirmation();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setBulkRunning(false);
    }
  };

  const clearFilters = () => {
    setFilter("all");
    setSearchTerm("");
    setTypeFilter("all");
    setStatusFilter("all");
    setCreatedFilter("all");
    setEventStatusFilter("all");
    setSortBy("newest");
  };

  return (
    <section className="space-y-6">
      {status.message && (
        <div className={`rounded-2xl px-4 py-3 text-sm ${status.type === "error" ? "bg-[#fff0ed] text-[#b33a24]" : "bg-[#eef6ea] text-[#386132]"}`}>
          {status.message}
        </div>
      )}

      <div className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-[#e6ddc9]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">Moderation</p>
              <h3 className="mt-3 text-3xl font-semibold text-[#2f3529]">Requests & Reports</h3>
            </div>
            <span className="rounded-full bg-[#f8f4eb] px-4 py-2 text-xs font-medium text-[#6d7759]">
              {items.length} item{items.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-6 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <div key={card.label} className="rounded-[24px] bg-[#f8f4eb] px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#8d9577]">{card.label}</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-2xl font-semibold text-[#2f3529]">{card.value}</p>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${typeStyles[card.tone]}`}>
                      {card.tone}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={typeContext.searchPlaceholder}
              className="admin-input"
            />

            <div className={`grid gap-3 md:grid-cols-2 ${showEventStatusFilter ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#8d9577]">Type</span>
                <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="admin-input">
                  <option value="all">All types</option>
                  <option value="shop">Shop</option>
                  <option value="organizer">Organizer</option>
                  <option value="sponsor">Sponsor</option>
                  <option value="report">Report</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#8d9577]">Status</span>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="admin-input">
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#8d9577]">Created</span>
                <select value={createdFilter} onChange={(event) => setCreatedFilter(event.target.value)} className="admin-input">
                  <option value="all">All time</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="older">Older than 30 days</option>
                </select>
              </label>

              {showEventStatusFilter ? (
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#8d9577]">Related Event</span>
                  <select value={eventStatusFilter} onChange={(event) => setEventStatusFilter(event.target.value)} className="admin-input">
                    <option value="all">All event statuses</option>
                    <option value="draft">Draft</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </label>
              ) : null}
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#8d9577]">Sort</span>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="admin-input">
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="pending">Pending first</option>
                </select>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-[#fcfbf7] px-4 py-4 ring-1 ring-[#efe8d8]">
              <div>
                <p className="text-sm font-medium text-[#2f3529]">
                  Showing {items.length} open {typeContext.resultLabel}
                  {items.length === 1 ? "" : "s"}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8d9577]">
                  {hasActiveFilters ? typeContext.queueLabel : "Open items awaiting action"}
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

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-[#f8f4eb] px-4 py-4 ring-1 ring-[#efe8d8]">
              <div>
                <p className="text-sm font-medium text-[#2f3529]">
                  {selectedIds.length} selected
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8d9577]">
                  {selectableBulkType
                    ? `Bulk actions for ${typeContext.label.toLowerCase()}`
                    : "Choose a specific type to enable bulk actions"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={toggleSelectAllOnPage}
                  disabled={!paginatedItems.items.length}
                  className="rounded-full bg-[#efe8d8] px-4 py-2 text-xs font-medium text-[#485b3b] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {allPageSelected ? "Unselect page" : "Select page"}
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={!selectedIds.length}
                  className="rounded-full bg-[#efe8d8] px-4 py-2 text-xs font-medium text-[#485b3b] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear selection
                </button>
                {bulkActions.map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    onClick={() =>
                      requestConfirmation({
                        title: action.label,
                        message: `Apply this action to ${selectedIds.length} selected item${selectedIds.length === 1 ? "" : "s"}?`,
                        confirmLabel: action.label,
                        tone: action.key === "approve" || action.key === "resolved" || action.key === "reviewed" ? "positive" : "danger",
                        action: () => runBulkAction(action.key),
                      })
                    }
                    disabled={!selectedIds.length || bulkRunning}
                    className="rounded-full bg-[#485b3b] px-4 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {loading ? (
              <div className="rounded-2xl bg-[#f8f4eb] px-4 py-10 text-sm text-[#7a8368]">Loading requests...</div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl bg-[#f8f4eb] px-4 py-10 text-sm text-[#7a8368]">{typeContext.emptyLabel}</div>
            ) : (
              <div className="space-y-4">
                {paginatedItems.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openDetail(item.id)}
                    className={`block w-full rounded-[24px] border px-5 py-5 text-left transition ${
                      item.id === selectedId && isDetailModalOpen
                        ? "border-[#485b3b] bg-[#eef4e8]"
                        : "border-[#efe8d8] bg-[#fcfbf7] hover:border-[#d7ceb8]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <label
                          className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#485b3b]"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelected(item.id)}
                            className="h-3.5 w-3.5 rounded border-[#cbbf9d]"
                          />
                          Select
                        </label>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${typeStyles[item.type] || "bg-white text-[#8d9577]"}`}>
                          {item.type}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${statusStyles[String(item.status).toLowerCase()] || "bg-[#f0ede7] text-[#6f685c]"}`}>
                          {item.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#8d9577]">{formatDateTime(item.createdAt)}</span>
                    </div>
                    <p className="mt-4 font-semibold text-[#2f3529]">{item.title}</p>
                    <p className="mt-1 text-sm text-[#657056]">{item.subtitle}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[#8d9577]">Open details</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Pagination currentPage={paginatedItems.page} totalPages={paginatedItems.totalPages} onPageChange={setPage} />
      </div>

      {isDetailModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6" onClick={closeDetail}>
          <div
            className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[32px] bg-white p-7 shadow-2xl ring-1 ring-[#e6ddc9]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">Review Detail</p>
                <h3 className="mt-3 text-3xl font-semibold text-[#2f3529]">{selectedItem.title}</h3>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efe8d8] text-lg font-medium text-[#485b3b]"
              >
                X
              </button>
            </div>

            {selectedItem.type === "shop" ? (
              <ShopDetail
                item={selectedItem.raw}
                images={shopImages.filter((image) => String(image.shop_id) === String(selectedItem.raw.shop_id))}
                note={notesById[selectedItem.id] ?? selectedItem.raw.admin_note ?? ""}
                onNoteChange={(value) => handleNoteChange(selectedItem.id, value)}
                onUploadImage={handleShopImageUpload}
                onDeleteImage={(imageId) =>
                  requestConfirmation({
                    title: "Delete shop image",
                    message: `Delete image #${imageId}?`,
                    confirmLabel: "Delete image",
                    tone: "danger",
                    action: async () => {
                      await handleShopImageDelete(imageId);
                      closeDetail();
                    },
                  })
                }
                onAction={(shopId, nextValue) =>
                  requestConfirmation({
                    title: Number(nextValue) === 1 ? "Approve shop" : "Reject shop",
                    message: `Confirm this action for shop #${shopId}?`,
                    confirmLabel: Number(nextValue) === 1 ? "Approve shop" : "Reject shop",
                    tone: Number(nextValue) === 1 ? "positive" : "danger",
                    action: async () => {
                      await handleShopVerification(shopId, nextValue);
                      closeDetail();
                    },
                  })
                }
              />
            ) : selectedItem.type === "organizer" ? (
              <OrganizerDetail
                item={selectedItem.raw}
                note={notesById[selectedItem.id] ?? selectedItem.raw.admin_note ?? ""}
                onNoteChange={(value) => handleNoteChange(selectedItem.id, value)}
                onAction={(organizerId, nextValue) =>
                  requestConfirmation({
                    title: Number(nextValue) === 1 ? "Approve organizer" : "Reject organizer",
                    message: `Confirm this action for organizer #${organizerId}?`,
                    confirmLabel: Number(nextValue) === 1 ? "Approve organizer" : "Reject organizer",
                    tone: Number(nextValue) === 1 ? "positive" : "danger",
                    action: async () => {
                      await handleOrganizerVerification(organizerId, nextValue);
                      closeDetail();
                    },
                  })
                }
              />
            ) : selectedItem.type === "sponsor" ? (
              <SponsorDetail
                item={selectedItem.raw}
                note={notesById[selectedItem.id] ?? selectedItem.raw.admin_note ?? ""}
                onNoteChange={(value) => handleNoteChange(selectedItem.id, value)}
                onStatusChange={(sponsorId, nextStatus) =>
                  requestConfirmation({
                    title: `Update sponsor to ${nextStatus}`,
                    message: `Confirm this sponsor status change for request #${sponsorId}?`,
                    confirmLabel: "Confirm status",
                    tone: nextStatus === "approved" ? "positive" : "danger",
                    action: async () => {
                      await handleSponsorStatusChange(sponsorId, nextStatus);
                      closeDetail();
                    },
                  })
                }
              />
            ) : (
              <ReportDetail
                item={selectedItem.raw}
                note={notesById[selectedItem.id] ?? selectedItem.raw.admin_note ?? ""}
                onNoteChange={(value) => handleNoteChange(selectedItem.id, value)}
                onReportStatusChange={(reportId, nextStatus) =>
                  requestConfirmation({
                    title: `Update report to ${nextStatus}`,
                    message: `Confirm this report status change for report #${reportId}?`,
                    confirmLabel: "Confirm status",
                    tone: nextStatus === "resolved" || nextStatus === "reviewed" ? "positive" : "danger",
                    action: async () => {
                      await handleReportStatusChange(reportId, nextStatus);
                      closeDetail();
                    },
                  })
                }
                onEventStatusChange={(eventId, nextStatus) =>
                  requestConfirmation({
                    title: `Update event to ${nextStatus}`,
                    message: `Confirm this event moderation change for event #${eventId}?`,
                    confirmLabel: "Confirm event status",
                    tone: nextStatus === "open" ? "positive" : "danger",
                    action: async () => {
                      await handleEventStatusChange(eventId, nextStatus);
                      closeDetail();
                    },
                  })
                }
              />
            )}
          </div>
        </div>
      )}

      {confirmAction ? (
        <ConfirmationModal
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel={confirmAction.confirmLabel}
          tone={confirmAction.tone}
          busy={bulkRunning}
          onCancel={closeConfirmation}
          onConfirm={executeConfirmedAction}
        />
      ) : null}
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

function ShopDetail({ item, images, note, onNoteChange, onUploadImage, onDeleteImage, onAction }) {
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
          { label: "Status", value: getVerificationStatusLabel(item.verified_status) },
        ]}
      />
      <div className="rounded-[24px] bg-[#fcfbf7] p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Description</p>
        <p className="mt-3 text-sm leading-7 text-[#4b5541]">{item.description || "No description provided."}</p>
      </div>
      <div className="space-y-4 rounded-[24px] bg-[#f8f4eb] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Shop Images</p>
            <p className="mt-2 text-sm text-[#4b5541]">Review store images before approval.</p>
          </div>
          <label className="rounded-full bg-[#485b3b] px-4 py-2 text-xs font-medium text-white">
            Upload
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUploadImage(item.shop_id, file);
                event.target.value = "";
              }}
            />
          </label>
        </div>
        {!images.length ? (
          <div className="rounded-2xl bg-white px-4 py-6 text-sm text-[#7a8368]">No shop images yet.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {images.map((image) => (
              <div key={image.image_id} className="overflow-hidden rounded-[24px] bg-white ring-1 ring-[#e6ddc9]">
                <img src={assetUrl(image.image_path)} alt="" className="h-40 w-full object-cover" />
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <p className="text-xs text-[#7a8368]">Image #{image.image_id}</p>
                  <button
                    type="button"
                    onClick={() => onDeleteImage(image.image_id)}
                    className="rounded-full bg-[#fff0ed] px-3 py-2 text-xs font-medium text-[#b33a24]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <NoteField value={note} onChange={onNoteChange} placeholder="Add approval note or rejection reason..." />
      <div className="flex gap-3">
        <ActionButton tone="positive" onClick={() => onAction(item.shop_id, 1)}>Approve Shop</ActionButton>
        <ActionButton tone="danger" onClick={() => onAction(item.shop_id, 2)}>Reject Shop</ActionButton>
      </div>
    </DetailShell>
  );
}

function ConfirmationModal({ title, message, confirmLabel, tone = "neutral", busy = false, onCancel, onConfirm }) {
  const confirmClass =
    tone === "positive"
      ? "bg-[#386132] text-white"
      : tone === "danger"
        ? "bg-[#b33a24] text-white"
        : "bg-[#485b3b] text-white";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4 py-6" onClick={onCancel}>
      <div
        className="w-full max-w-md rounded-[32px] bg-white p-7 shadow-2xl ring-1 ring-[#e6ddc9]"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">Confirm Action</p>
        <h3 className="mt-3 text-2xl font-semibold text-[#2f3529]">{title}</h3>
        <p className="mt-4 text-sm leading-7 text-[#5d6550]">{message}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-full bg-[#efe8d8] px-4 py-2 text-xs font-medium text-[#485b3b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`rounded-full px-4 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 ${confirmClass}`}
          >
            {busy ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function OrganizerDetail({ item, note, onNoteChange, onAction }) {
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
          { label: "Status", value: getVerificationStatusLabel(item.verified_status) },
        ]}
      />
      <div className="rounded-[24px] bg-[#fcfbf7] p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Description</p>
        <p className="mt-3 text-sm leading-7 text-[#4b5541]">{item.description || "No description provided."}</p>
      </div>
      <NoteField value={note} onChange={onNoteChange} placeholder="Add approval note or rejection reason..." />
      <div className="flex gap-3">
        <ActionButton tone="positive" onClick={() => onAction(item.organizer_id, 1)}>Approve Organizer</ActionButton>
        <ActionButton tone="danger" onClick={() => onAction(item.organizer_id, 2)}>Reject Organizer</ActionButton>
      </div>
    </DetailShell>
  );
}

function ReportDetail({ item, note, onNoteChange, onReportStatusChange, onEventStatusChange }) {
  return (
    <DetailShell
      badge="Event Report"
      title={item.event_title || `Event #${item.event_id}`}
      subtitle="Inspect the report details, update report handling status, and moderate the related event if needed."
    >
      <MetaGrid
        rows={[
          { label: "Report ID", value: `#${item.report_id}` },
          { label: "Event ID", value: `#${item.event_id}` },
          { label: "Reporter", value: item.email || `User #${item.user_id}` },
          { label: "Username", value: item.username || "-" },
          { label: "Type", value: item.report_type || "-" },
          { label: "Created", value: item.created_at ? new Date(item.created_at).toLocaleString() : "-" },
          { label: "Current Event Status", value: item.event_status || "draft" },
        ]}
      />
      <div className="rounded-[24px] bg-[#f8f4eb] p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Event Moderation</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Suggested Action</p>
            <p className="mt-2 text-sm text-[#2f3529]">
              {String(item.status || "").toLowerCase() === "pending" ? "Review and update the event status if needed." : "Report is already being handled."}
            </p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Report Status</p>
            <p className="mt-2 text-sm text-[#2f3529]">{item.status || "pending"}</p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Event Status</p>
            <p className="mt-2 text-sm text-[#2f3529]">{item.event_status || "draft"}</p>
          </div>
        </div>
      </div>
      <div className="rounded-[24px] bg-[#fcfbf7] p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Report Detail</p>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#4b5541]">{item.report_detail}</p>
      </div>
      <NoteField value={note} onChange={onNoteChange} placeholder="Add review note or resolution reason..." />
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

function SponsorDetail({ item, note, onNoteChange, onStatusChange }) {
  return (
    <DetailShell
      badge="Sponsor Request"
      title={item.event_title || `Event #${item.event_id}`}
      subtitle="Review sponsor requests from shops and update the request status after verification."
    >
      <MetaGrid
        rows={[
          { label: "Sponsor ID", value: `#${item.sponsor_id}` },
          { label: "Shop", value: item.shop_name || `Shop #${item.shop_id}` },
          { label: "Product", value: item.product_name || `Product #${item.product_id}` },
          { label: "Quantity", value: item.quantity || "-" },
          { label: "Requested By", value: item.request_by || "-" },
          { label: "Status", value: item.status || "pending" },
        ]}
      />
      <NoteField value={note} onChange={onNoteChange} placeholder="Add sponsor review note or rejection reason..." />
      <div className="grid gap-4 md:grid-cols-3">
        <ActionButton tone="positive" onClick={() => onStatusChange(item.sponsor_id, "approved")}>
          Approve Sponsor
        </ActionButton>
        <ActionButton onClick={() => onStatusChange(item.sponsor_id, "pending")}>
          Keep Pending
        </ActionButton>
        <ActionButton tone="danger" onClick={() => onStatusChange(item.sponsor_id, "rejected")}>
          Reject Sponsor
        </ActionButton>
      </div>
    </DetailShell>
  );
}

function NoteField({ value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#4b5541]">Admin Note</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="admin-input min-h-28"
      />
    </label>
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
