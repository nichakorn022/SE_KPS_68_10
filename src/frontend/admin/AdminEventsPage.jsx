import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi } from "./adminApi";
import { assetUrl } from "../../lib/api";
import AdminPagination, { paginate } from "./components/AdminPagination";
import AdminConfirmActionModal from "./components/AdminConfirmActionModal";

const initialForm = {
  organizer_id: "",
  title: "",
  description: "",
  event_date: "",
  location: "",
  max_participant: "",
  price: "",
  status: "draft",
};

const eventStatusStyles = {
  draft: "bg-[#f0ede7] text-[#6f685c]",
  open: "bg-[#eef6ea] text-[#386132]",
  closed: "bg-[#eef2ff] text-[#3d4f93]",
  cancelled: "bg-[#fff0ed] text-[#b33a24]",
};

function formatMoney(value) {
  return Number(value || 0).toFixed(2);
}

export default function AdminEventsPage() {
  const { adminToken } = useOutletContext();
  const [events, setEvents] = useState([]);
  const [eventImages, setEventImages] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [organizerFilter, setOrganizerFilter] = useState("");
  const [page, setPage] = useState(1);
  const [eventImagesPage, setEventImagesPage] = useState(1);
  const [sponsorsPage, setSponsorsPage] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(true);
  const [imageStatus, setImageStatus] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [sponsorNotes, setSponsorNotes] = useState({});

  async function loadEvents() {
    setLoading(true);
    try {
      const [eventRows, sponsorRows] = await Promise.all([adminApi.getEvents(adminToken), adminApi.getSponsors(adminToken)]);
      let imageRows = [];

      try {
        imageRows = await adminApi.getEventImages(adminToken);
        setImageStatus("");
      } catch {
        imageRows = [];
        setImageStatus("Event image library is unavailable right now. Event data can still be managed.");
      }

      setEvents(eventRows);
      setEventImages(imageRows);
      setSponsors(sponsorRows);
      setStatus({ type: "", message: "" });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, [adminToken]);

  const summaryCards = useMemo(
    () => [
      { label: "Total Events", value: events.length },
      { label: "Open", value: events.filter((eventItem) => eventItem.status === "open").length, tone: "open" },
      { label: "Draft", value: events.filter((eventItem) => eventItem.status === "draft").length, tone: "draft" },
      { label: "Cancelled", value: events.filter((eventItem) => eventItem.status === "cancelled").length, tone: "cancelled" },
    ],
    [events]
  );

  const filteredEvents = useMemo(() => {
    const now = Date.now();

    return events.filter((eventItem) => {
      if (statusFilter !== "all" && eventItem.status !== statusFilter) return false;

      if (dateFilter !== "all") {
        const eventTime = eventItem.event_date ? new Date(eventItem.event_date).getTime() : 0;
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        if (dateFilter === "upcoming" && eventTime < startOfToday.getTime()) return false;
        if (dateFilter === "past" && eventTime >= startOfToday.getTime()) return false;
        if (dateFilter === "30d" && (!eventTime || eventTime < now || eventTime > now + 30 * 24 * 60 * 60 * 1000)) {
          return false;
        }
      }

      if (organizerFilter.trim() && String(eventItem.organizer_id) !== organizerFilter.trim()) return false;

      if (!searchTerm.trim()) return true;

      const keyword = searchTerm.trim().toLowerCase();
      const haystack = [
        eventItem.title,
        eventItem.location,
        eventItem.description,
        eventItem.status,
        `organizer ${eventItem.organizer_id}`,
        `event ${eventItem.event_id}`,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [dateFilter, events, organizerFilter, searchTerm, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, dateFilter, organizerFilter]);

  useEffect(() => {
    setEventImagesPage(1);
  }, [editingId, eventImages]);

  useEffect(() => {
    setSponsorsPage(1);
  }, [editingId, sponsors]);

  useEffect(() => {
    if (!editingId) {
      setSponsorNotes({});
      return;
    }

    const nextNotes = {};
    sponsors.forEach((sponsor) => {
      if (String(sponsor.event_id) === String(editingId)) {
        nextNotes[sponsor.sponsor_id] = sponsor.admin_note || "";
      }
    });
    setSponsorNotes(nextNotes);
  }, [editingId, sponsors]);

  const paginatedEvents = useMemo(() => paginate(filteredEvents, page), [filteredEvents, page]);
  const hasActiveFilters =
    Boolean(searchTerm.trim()) || statusFilter !== "all" || dateFilter !== "all" || Boolean(organizerFilter.trim());

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
    setIsModalOpen(false);
  };

  const handleEdit = (eventItem) => {
    setEditingId(eventItem.event_id);
    setForm({
      organizer_id: String(eventItem.organizer_id ?? ""),
      title: eventItem.title ?? "",
      description: eventItem.description ?? "",
      event_date: String(eventItem.event_date ?? "").slice(0, 10),
      location: eventItem.location ?? "",
      max_participant: String(eventItem.max_participant ?? ""),
      price: String(eventItem.price ?? ""),
      status: eventItem.status ?? "draft",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      organizer_id: Number(form.organizer_id),
      title: form.title.trim(),
      description: form.description.trim() || null,
      event_date: form.event_date,
      location: form.location.trim() || null,
      max_participant: Number(form.max_participant),
      price: Number(form.price || 0),
      status: form.status,
    };

    try {
      if (editingId) {
        await adminApi.updateEvent(adminToken, editingId, payload);
        setStatus({ type: "success", message: "Event updated" });
      } else {
        await adminApi.createEvent(adminToken, payload);
        setStatus({ type: "success", message: "Event created" });
      }

      resetForm();
      await loadEvents();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const handleDelete = async (eventId) => {
    try {
      await adminApi.deleteEvent(adminToken, eventId);
      if (editingId === eventId) {
        resetForm();
      }
      setIsModalOpen(false);
      setStatus({ type: "success", message: "Event deleted" });
      await loadEvents();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const selectedEventImages = eventImages.filter((image) => String(image.event_id) === String(editingId));
  const paginatedEventImages = useMemo(() => paginate(selectedEventImages, eventImagesPage), [selectedEventImages, eventImagesPage]);
  const selectedEventSponsors = useMemo(
    () =>
      sponsors.filter((sponsor) => {
        if (!editingId) return false;
        return String(sponsor.event_id) === String(editingId);
      }),
    [editingId, sponsors]
  );
  const paginatedEventSponsors = useMemo(() => paginate(selectedEventSponsors, sponsorsPage), [selectedEventSponsors, sponsorsPage]);

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !editingId) return;

    try {
      await adminApi.uploadEventImage(adminToken, editingId, file);
      setStatus({ type: "success", message: "Event image uploaded" });
      loadEvents();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      event.target.value = "";
    }
  };

  const handleImageDelete = async (imageId) => {
    try {
      await adminApi.deleteEventImage(adminToken, imageId);
      resetForm();
      setStatus({ type: "success", message: "Event image deleted" });
      await loadEvents();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const handleSponsorStatusChange = async (sponsorId, nextStatus) => {
    try {
      await adminApi.updateSponsorStatus(adminToken, sponsorId, nextStatus, sponsorNotes[sponsorId] || null);
      setStatus({ type: "success", message: "Sponsor request updated" });
      await loadEvents();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const handleSponsorDelete = async (sponsorId) => {
    try {
      await adminApi.deleteSponsor(adminToken, sponsorId);
      setStatus({ type: "success", message: "Sponsor request deleted" });
      await loadEvents();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFilter("all");
    setOrganizerFilter("");
  };

  return (
    <section className="space-y-6">
      <DataPanel title="Event List" loading={loading}>
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-[24px] bg-[#f8f4eb] px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#8d9577]">{card.label}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-2xl font-semibold text-[#2f3529]">{card.value}</p>
                {card.tone ? (
                  <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${eventStatusStyles[card.tone]}`}>
                    {card.tone}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-[#2f3529]">Events</p>
            <p className="mt-1 text-sm text-[#657056]">Open an event to review details, images, and sponsor support.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm(initialForm);
              setIsModalOpen(true);
            }}
            className="rounded-full bg-[#485b3b] px-5 py-3 text-sm font-medium text-white"
          >
            Add Event
          </button>
        </div>

        {imageStatus && <div className="mb-5 rounded-2xl bg-[#fff4e2] px-4 py-3 text-sm text-[#a46317]">{imageStatus}</div>}

        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by title, location, organizer id, event id, or status..."
          className="admin-input mb-6"
        />

        <div className="mb-6 grid gap-3 md:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#8d9577]">Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="admin-input">
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#8d9577]">Date</span>
            <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="admin-input">
              <option value="all">All dates</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
              <option value="30d">Next 30 days</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#8d9577]">Organizer ID</span>
            <input
              value={organizerFilter}
              onChange={(event) => setOrganizerFilter(event.target.value)}
              placeholder="Filter by organizer id..."
              className="admin-input"
            />
          </label>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-[#fcfbf7] px-4 py-4 ring-1 ring-[#efe8d8]">
          <div>
            <p className="text-sm font-medium text-[#2f3529]">
              Showing {filteredEvents.length} event{filteredEvents.length === 1 ? "" : "s"}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8d9577]">
              {hasActiveFilters ? "Filtered event records" : "All event records"}
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

        {filteredEvents.length === 0 ? (
          <div className="rounded-2xl bg-[#f8f4eb] px-4 py-10 text-sm text-[#7a8368]">
            No matching events found. Try changing the search or filters.
          </div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="text-[#8d9577]">
              <tr>
                <th className="pb-3">Title</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Location</th>
                <th className="pb-3">Price</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEvents.items.map((eventItem) => (
                <tr
                  key={eventItem.event_id}
                  onClick={() => handleEdit(eventItem)}
                  className={`cursor-pointer border-t border-[#efe8d8] transition hover:bg-[#fcfbf7] ${
                    editingId === eventItem.event_id && isModalOpen ? "bg-[#f8f4eb]" : ""
                  }`}
                >
                  <td className="py-4">
                    <p className="font-semibold text-[#2f3529]">{eventItem.title}</p>
                    <p className="mt-1 text-xs text-[#7a8368]">Organizer</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8d9577]">Open details</p>
                  </td>
                  <td className="py-4">{String(eventItem.event_date).slice(0, 10)}</td>
                  <td className="py-4">{eventItem.location || "-"}</td>
                  <td className="py-4">{formatMoney(eventItem.price)}</td>
                  <td className="py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${eventStatusStyles[eventItem.status || "draft"] || eventStatusStyles.draft}`}>
                      {eventItem.status || "draft"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <AdminPagination currentPage={paginatedEvents.page} totalPages={paginatedEvents.totalPages} onPageChange={setPage} />
      </DataPanel>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6" onClick={resetForm}>
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[32px] bg-white p-7 shadow-2xl ring-1 ring-[#e6ddc9]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">
                  {editingId ? "Edit Event" : "New Event"}
                </p>
                <h3 className="mt-3 text-3xl font-semibold text-[#2f3529]">Event Form</h3>
                {editingId ? (
                  <span className={`mt-4 inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${eventStatusStyles[form.status] || eventStatusStyles.draft}`}>
                    {form.status}
                  </span>
                ) : null}
              </div>
              <button type="button" onClick={resetForm} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efe8d8] text-lg font-medium text-[#485b3b]">
                X
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                setConfirmAction({
                  title: editingId ? "Update Event" : "Create Event",
                  message: editingId ? `Save changes for event #${editingId}?` : "Create this event?",
                  confirmLabel: editingId ? "Update Event" : "Create Event",
                  tone: "primary",
                  onConfirm: handleSubmit,
                });
              }}
              className="mt-6 space-y-4"
            >
              <Field label="Organizer ID">
                <input name="organizer_id" type="number" value={form.organizer_id} onChange={handleChange} className="admin-input" required />
              </Field>
              <Field label="Title">
                <input name="title" value={form.title} onChange={handleChange} className="admin-input" required />
              </Field>
              <Field label="Event date">
                <input name="event_date" type="date" value={form.event_date} onChange={handleChange} className="admin-input" required />
              </Field>
              <Field label="Location">
                <input name="location" value={form.location} onChange={handleChange} className="admin-input" />
              </Field>
              <Field label="Max participant">
                <input name="max_participant" type="number" value={form.max_participant} onChange={handleChange} className="admin-input" required />
              </Field>
              <Field label="Price">
                <input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} className="admin-input" required />
              </Field>
              <Field label="Status">
                <select name="status" value={form.status} onChange={handleChange} className="admin-input" required>
                  <option value="draft">draft</option>
                  <option value="open">open</option>
                  <option value="closed">closed</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </Field>
              <Field label="Description">
                <textarea name="description" value={form.description} onChange={handleChange} className="admin-input min-h-28" />
              </Field>

              {editingId && (
                <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
                  <div className="space-y-4 rounded-[24px] bg-[#f8f4eb] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Event Images</p>
                        <p className="mt-2 text-sm text-[#4b5541]">Upload or remove event images.</p>
                      </div>
                      <label className="rounded-full bg-[#485b3b] px-4 py-2 text-xs font-medium text-white">
                        Upload
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    </div>

                    {selectedEventImages.length === 0 ? (
                      <div className="rounded-2xl bg-white px-4 py-6 text-sm text-[#7a8368]">No images yet.</div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          {paginatedEventImages.items.map((image) => (
                            <div key={image.image_id} className="overflow-hidden rounded-[24px] bg-white ring-1 ring-[#e6ddc9]">
                              <img src={assetUrl(image.image_path)} alt="" className="h-40 w-full object-cover" />
                              <div className="flex items-center justify-between gap-3 px-4 py-3">
                                <p className="text-xs text-[#7a8368]">Image #{image.image_id}</p>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmAction({
                                      title: "Delete Event Image",
                                      message: `Delete image #${image.image_id}?`,
                                      confirmLabel: "Delete Image",
                                      tone: "danger",
                                      onConfirm: () => handleImageDelete(image.image_id),
                                    })
                                  }
                                  className="rounded-full bg-[#fff0ed] px-3 py-2 text-xs font-medium text-[#b33a24]"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <AdminPagination
                          currentPage={paginatedEventImages.page}
                          totalPages={paginatedEventImages.totalPages}
                          onPageChange={setEventImagesPage}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 rounded-[24px] bg-[#fcfbf7] p-5 ring-1 ring-[#efe8d8]">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Sponsor Support</p>
                      <p className="mt-2 text-sm text-[#4b5541]">Shops sponsoring this event and the request details.</p>
                    </div>

                    {selectedEventSponsors.length === 0 ? (
                      <div className="rounded-2xl bg-white px-4 py-6 text-sm text-[#7a8368]">No sponsor requests linked to this event yet.</div>
                    ) : (
                      <div className="space-y-3">
                        {paginatedEventSponsors.items.map((sponsor) => (
                          <div key={sponsor.sponsor_id} className="rounded-[24px] bg-white p-4 ring-1 ring-[#e6ddc9]">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-[#2f3529]">{sponsor.shop_name || `Shop ${sponsor.shop_id}`}</p>
                                <p className="mt-1 text-xs text-[#7a8368]">Sponsor #{sponsor.sponsor_id}</p>
                              </div>
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                                  sponsor.status === "approved"
                                    ? "bg-[#eef6ea] text-[#386132]"
                                    : sponsor.status === "rejected"
                                      ? "bg-[#fff0ed] text-[#b33a24]"
                                      : "bg-[#fff4e2] text-[#a46317]"
                                }`}
                              >
                                {sponsor.status || "pending"}
                              </span>
                            </div>

                            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                              <SponsorMeta label="Product" value={sponsor.product_name || `Product #${sponsor.product_id}`} />
                              <SponsorMeta label="Quantity" value={sponsor.quantity || "-"} />
                              <SponsorMeta label="Requested By" value={sponsor.request_by || "-"} />
                              <SponsorMeta
                                label="Requested At"
                                value={sponsor.created_at ? new Date(sponsor.created_at).toLocaleString() : "-"}
                              />
                            </dl>

                            <label className="mt-4 block">
                              <span className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-[#8d9577]">Admin Note</span>
                              <textarea
                                value={sponsorNotes[sponsor.sponsor_id] || ""}
                                onChange={(event) =>
                                  setSponsorNotes((current) => ({
                                    ...current,
                                    [sponsor.sponsor_id]: event.target.value,
                                  }))
                                }
                                placeholder="Add review note or decision reason..."
                                className="admin-input min-h-24"
                              />
                            </label>

                            <div className="mt-4 grid gap-2 sm:grid-cols-3">
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmAction({
                                    title: "Approve Sponsor",
                                    message: `Approve sponsor request #${sponsor.sponsor_id}?`,
                                    confirmLabel: "Approve Sponsor",
                                    tone: "primary",
                                    onConfirm: () => handleSponsorStatusChange(sponsor.sponsor_id, "approved"),
                                  })
                                }
                                className="rounded-full bg-[#485b3b] px-4 py-2 text-xs font-medium text-white"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmAction({
                                    title: "Reject Sponsor",
                                    message: `Reject sponsor request #${sponsor.sponsor_id}?`,
                                    confirmLabel: "Reject Sponsor",
                                    tone: "danger",
                                    onConfirm: () => handleSponsorStatusChange(sponsor.sponsor_id, "rejected"),
                                  })
                                }
                                className="rounded-full bg-[#fff0ed] px-4 py-2 text-xs font-medium text-[#b33a24]"
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmAction({
                                    title: "Delete Sponsor",
                                    message: `Delete sponsor request #${sponsor.sponsor_id}?`,
                                    confirmLabel: "Delete Sponsor",
                                    tone: "danger",
                                    onConfirm: () => handleSponsorDelete(sponsor.sponsor_id),
                                  })
                                }
                                className="rounded-full bg-[#fff0ed] px-4 py-2 text-xs font-medium text-[#b33a24]"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}

                        <AdminPagination
                          currentPage={paginatedEventSponsors.page}
                          totalPages={paginatedEventSponsors.totalPages}
                          onPageChange={setSponsorsPage}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-center pt-2">
                <div className="flex flex-wrap justify-center gap-3">
                  <button type="submit" className="rounded-full bg-[#485b3b] px-5 py-3 text-sm font-medium text-white">
                    {editingId ? "Update Event" : "Create Event"}
                  </button>
                  {editingId ? (
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmAction({
                          title: "Delete Event",
                          message: `Delete event #${editingId}?`,
                          confirmLabel: "Delete Event",
                          tone: "danger",
                          onConfirm: () => handleDelete(editingId),
                        })
                      }
                      className="rounded-full bg-[#fff0ed] px-5 py-3 text-sm font-medium text-[#b33a24]"
                    >
                      Delete Event
                    </button>
                  ) : null}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {status.message && (
        <div className={`rounded-2xl px-4 py-3 text-sm ${status.type === "error" ? "bg-[#fff0ed] text-[#b33a24]" : "bg-[#eef6ea] text-[#386132]"}`}>
          {status.message}
        </div>
      )}
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

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#4b5541]">{label}</span>
      {children}
    </label>
  );
}

function SponsorMeta({ label, value, fullWidth = false }) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <dt className="text-[11px] uppercase tracking-[0.2em] text-[#8d9577]">{label}</dt>
      <dd className="mt-2 text-sm text-[#2f3529]">{value || "-"}</dd>
    </div>
  );
}

function DataPanel({ title, loading, children }) {
  return (
    <div className="rounded-[32px] bg-white p-7 shadow-sm ring-1 ring-[#e6ddc9]">
      <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">{title}</p>
      <div className="mt-6 overflow-x-auto">
        {loading ? <div className="py-8 text-sm text-[#7a8368]">Loading...</div> : children}
      </div>
    </div>
  );
}

