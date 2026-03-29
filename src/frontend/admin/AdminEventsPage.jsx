import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi } from "./adminApi";
import { assetUrl } from "../../lib/api";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [organizerFilter, setOrganizerFilter] = useState("");
  const [page, setPage] = useState(1);
  const [eventImagesPage, setEventImagesPage] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(true);
  const [imageStatus, setImageStatus] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  async function loadEvents() {
    setLoading(true);
    try {
      const eventRows = await adminApi.getEvents(adminToken);
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
            <p className="mt-1 text-sm text-[#657056]">Select an event to open its details in a popup.</p>
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
              {hasActiveFilters ? "Filtered event queue" : "All event records"}
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
                <th className="pb-3 text-right">Actions</th>
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
                    <p className="mt-1 text-xs text-[#7a8368]">Organizer #{eventItem.organizer_id}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8d9577]">Click to review</p>
                  </td>
                  <td className="py-4">{String(eventItem.event_date).slice(0, 10)}</td>
                  <td className="py-4">{eventItem.location || "-"}</td>
                  <td className="py-4">{formatMoney(eventItem.price)}</td>
                  <td className="py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${eventStatusStyles[eventItem.status || "draft"] || eventStatusStyles.draft}`}>
                      {eventItem.status || "draft"}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleEdit(eventItem);
                        }}
                        className="rounded-full bg-[#efe8d8] px-4 py-2 text-xs font-medium text-[#485b3b]"
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setConfirmAction({
                            title: "Delete Event",
                            message: `Delete event #${eventItem.event_id}?`,
                            confirmLabel: "Delete Event",
                            tone: "danger",
                            onConfirm: () => handleDelete(eventItem.event_id),
                          });
                        }}
                        className="rounded-full bg-[#fff0ed] px-4 py-2 text-xs font-medium text-[#b33a24]"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination currentPage={paginatedEvents.page} totalPages={paginatedEvents.totalPages} onPageChange={setPage} />
      </DataPanel>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6" onClick={resetForm}>
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[32px] bg-white p-7 shadow-2xl ring-1 ring-[#e6ddc9]" onClick={(event) => event.stopPropagation()}>
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
                      <Pagination
                        currentPage={paginatedEventImages.page}
                        totalPages={paginatedEventImages.totalPages}
                        onPageChange={setEventImagesPage}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-center pt-2">
                <button type="submit" className="rounded-full bg-[#485b3b] px-5 py-3 text-sm font-medium text-white">
                  {editingId ? "Update Event" : "Create Event"}
                </button>
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
          <button type="button" onClick={onClose} className="rounded-full bg-[#efe8d8] px-4 py-2 text-xs font-medium text-[#485b3b]">
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

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#4b5541]">{label}</span>
      {children}
    </label>
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
