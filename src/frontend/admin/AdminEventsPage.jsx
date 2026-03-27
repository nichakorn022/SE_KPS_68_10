import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi } from "./adminApi";

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

export default function AdminEventsPage() {
  const { adminToken } = useOutletContext();
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(true);

  async function loadEvents() {
    setLoading(true);
    try {
      const rows = await adminApi.getEvents(adminToken);
      setEvents(rows);
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
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
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

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
      loadEvents();
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
      setStatus({ type: "success", message: "Event deleted" });
      loadEvents();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form onSubmit={handleSubmit} className="rounded-[32px] bg-white p-7 shadow-sm ring-1 ring-[#e6ddc9]">
          <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">
            {editingId ? "Edit Event" : "New Event"}
          </p>
          <h3 className="mt-3 text-3xl font-semibold text-[#2f3529]">Events Management</h3>

          <div className="mt-6 space-y-4">
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
          </div>

          {status.message && (
            <div className={`mt-4 rounded-2xl px-4 py-3 text-sm ${status.type === "error" ? "bg-[#fff0ed] text-[#b33a24]" : "bg-[#eef6ea] text-[#386132]"}`}>
              {status.message}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button type="submit" className="rounded-full bg-[#485b3b] px-5 py-3 text-sm font-medium text-white">
              {editingId ? "Update Event" : "Create Event"}
            </button>
            <button type="button" onClick={resetForm} className="rounded-full bg-[#efe8d8] px-5 py-3 text-sm font-medium text-[#485b3b]">
              Reset
            </button>
          </div>
        </form>

        <DataPanel title="Event List" loading={loading}>
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
              {events.map((eventItem) => (
                <tr key={eventItem.event_id} className="border-t border-[#efe8d8]">
                  <td className="py-4">
                    <p className="font-semibold text-[#2f3529]">{eventItem.title}</p>
                    <p className="text-xs text-[#7a8368]">Organizer #{eventItem.organizer_id}</p>
                  </td>
                  <td className="py-4">{String(eventItem.event_date).slice(0, 10)}</td>
                  <td className="py-4">{eventItem.location || "-"}</td>
                  <td className="py-4">{Number(eventItem.price).toFixed(2)}</td>
                  <td className="py-4">{eventItem.status || "draft"}</td>
                  <td className="py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(eventItem)} className="rounded-full bg-[#efe8d8] px-4 py-2 text-xs font-medium text-[#485b3b]">Edit</button>
                      <button onClick={() => handleDelete(eventItem.event_id)} className="rounded-full bg-[#fff0ed] px-4 py-2 text-xs font-medium text-[#b33a24]">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataPanel>
      </div>
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
