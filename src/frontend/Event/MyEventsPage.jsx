import { useEffect, useState } from "react";
import { apiUrl } from "../../lib/api";
import { useAuthModal } from "../../App";
import { Link, useNavigate } from "react-router-dom";
import SiteNavbar from "../components/SiteNavbar";

// ── SVG Icons (matching EventPage) ───────────────────────────────────────
const IconBadge = ({ children }) => (
  <span className="w-8 h-8 rounded-full border border-[#253621]/20 bg-[#F5F3E9] flex items-center justify-center flex-shrink-0">
    {children}
  </span>
);

const IconPin = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#485B3B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconUsers = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#485B3B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const IconEye = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconGrid = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);

const IconList = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

// ── SearchBar (matches EventPage) ─────────────────────────────────────────
function SearchBar({ value, onChange }) {
  return (
    <label className="group relative block w-full">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6E7D61] transition-transform duration-300 group-focus-within:scale-110">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
          <circle cx="11" cy="11" r="6.5" />
          <path strokeLinecap="round" d="m16 16 4.5 4.5" />
        </svg>
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search your events by name or location…"
        className="w-full rounded-[1.75rem] border border-[#D9E2CF] bg-white/92 px-12 py-4 text-[15px] text-[#30412D] shadow-[0_20px_60px_rgba(91,117,72,0.08)] outline-none transition-all duration-300 placeholder:text-[#90A085] focus:border-[#738A5E] focus:shadow-[0_24px_80px_rgba(72,91,59,0.16)]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-xl leading-none text-[#90A085] hover:text-[#485B3B] transition"
        >
          ×
        </button>
      )}
    </label>
  );
}

// ── ViewToggle (matches EventPage) ────────────────────────────────────────
function ViewToggle({ active, onChange }) {
  return (
    <div className="inline-flex rounded-full border border-[#D4DEC8] bg-[#F8FBF4] p-1 shadow-[0_12px_30px_rgba(85,108,68,0.08)]">
      {[{ id: "grid", Icon: IconGrid }, { id: "list", Icon: IconList }].map(({ id, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          title={`${id} view`}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ${
            active === id
              ? "bg-[#485B3B] text-white shadow-[0_12px_24px_rgba(72,91,59,0.24)]"
              : "text-[#536348] hover:text-[#314228]"
          }`}
        >
          <Icon />
        </button>
      ))}
    </div>
  );
}

// ── Skeleton Card ─────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="animate-pulse overflow-hidden rounded-[2rem] border border-[#E2E8D8] bg-white/80">
    <div className="aspect-[6/5] bg-[#D5DFD0]" />
    <div className="space-y-3 p-5">
      <div className="h-4 w-3/4 rounded-full bg-[#D5DFD0]" />
      <div className="h-3 w-full rounded-full bg-[#D5DFD0]" />
      <div className="h-3 w-2/3 rounded-full bg-[#D5DFD0]" />
    </div>
  </div>
);

// ── My Event Card (Grid) ──────────────────────────────────────────────────
function MyEventCardGrid({ event, onEdit, onDelete }) {
  const count = Number(event.registration_count || 0);
  const max = Number(event.max_participant || 0);
  const fillPct = max > 0 ? Math.min(100, Math.round((count / max) * 100)) : 0;
  const isFull = fillPct === 100;
  const isAlmostFull = fillPct >= 80 && !isFull;
  const locked = count > 0;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-[#DEE5D5] bg-white/92 shadow-[0_18px_50px_rgba(72,91,59,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_70px_rgba(72,91,59,0.14)]">
      {/* Image area */}
      <Link to={`/events/${event.event_id}`} className="block">
        <div className="relative aspect-[6/5] overflow-hidden bg-[#EBF0E1]">
          <img
            src={event.image_path || "/Pictrue/Activity.png"}
            alt={event.title || "event"}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#172115]/45 via-transparent to-transparent opacity-70" />

          {/* Status badge */}
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {isFull ? (
              <span className="rounded-full bg-[#3A4335] px-3 py-1 text-[11px] font-semibold text-white">Full</span>
            ) : isAlmostFull ? (
              <span className="rounded-full bg-[#FFF1D8] px-3 py-1 text-[11px] font-semibold text-[#8A5B13]">Almost full</span>
            ) : (
              <span className="rounded-full bg-white/92 px-3 py-1 text-[11px] font-semibold text-[#405336]">Open</span>
            )}
          </div>

          {/* Lock badge if registrations exist */}
          {locked && (
            <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-white/90 text-red-400 text-xs">
              🔒
            </div>
          )}
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col px-5 pb-5 pt-4 gap-3">
        <div className="space-y-1">
          <Link to={`/events/${event.event_id}`}>
            <h3 className="line-clamp-2 min-h-[2.6rem] text-[17px] font-semibold leading-snug text-[#23311F] transition-colors duration-300 group-hover:text-[#485B3B]">
              {event.title}
            </h3>
          </Link>
          <p className="line-clamp-2 min-h-[3rem] text-sm leading-relaxed text-[#627059]">
            {event.description || "Your event — click to view details."}
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <IconBadge><IconPin /></IconBadge>
            <span className="text-xs text-[#66755D] line-clamp-1">{event.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <IconBadge><IconUsers /></IconBadge>
            <span className="text-xs text-[#66755D]">{count} / {max || "∞"} registered</span>
          </div>
        </div>

        {/* Fill bar */}
        {max > 0 && (
          <div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E8E4DA]">
              <div className="h-full rounded-full bg-[#485B3B] transition-all" style={{ width: `${fillPct}%` }} />
            </div>
            <p className="mt-1 text-right text-[10px] text-[#9aaa8e]">{fillPct}% filled</p>
          </div>
        )}

        {/* Lock warning */}
        {locked && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-[11px] text-red-600 leading-relaxed">
            🔒 {count} person{count > 1 ? "s" : ""} registered — editing & deletion disabled
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-1">
          <Link to={`/events/${event.event_id}`} className="flex-1">
            <button className="w-full flex items-center justify-center gap-1.5 rounded-full border border-[#D4DEC8] bg-[#F8FBF4] px-3 py-2 text-xs font-semibold text-[#485B3B] transition-all hover:bg-[#EBF0E1]">
              <IconEye /> View
            </button>
          </Link>
          <button
            onClick={() => onEdit(event.event_id)}
            disabled={locked}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-all ${
              locked
                ? "bg-[#F3F3F1] text-[#B0B8A8] cursor-not-allowed"
                : "bg-[#FFF6D8] text-[#7A5A0A] hover:bg-[#FFEDAA]"
            }`}
          >
            <IconEdit /> Edit
          </button>
          <button
            onClick={() => onDelete(event.event_id)}
            disabled={locked}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-white transition-all ${
              locked
                ? "bg-[#D8D8D5] cursor-not-allowed"
                : "bg-[#C94A4A] hover:bg-[#B03A3A]"
            }`}
          >
            <IconTrash /> Delete
          </button>
        </div>
      </div>
    </article>
  );
}

// ── My Event Card (List) ──────────────────────────────────────────────────
function MyEventCardList({ event, onEdit, onDelete }) {
  const count = Number(event.registration_count || 0);
  const max = Number(event.max_participant || 0);
  const fillPct = max > 0 ? Math.min(100, Math.round((count / max) * 100)) : 0;
  const locked = count > 0;

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-[#DCE4D4] bg-white/92 shadow-[0_18px_50px_rgba(72,91,59,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_64px_rgba(72,91,59,0.14)]">
      <div className="flex">
        {/* Image */}
        <Link to={`/events/${event.event_id}`} className="relative h-auto w-[200px] flex-shrink-0 overflow-hidden bg-[#EBF0E1]">
          <img
            src={event.image_path || "/Pictrue/Activity.png"}
            alt={event.title || "event"}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </Link>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <Link to={`/events/${event.event_id}`}>
                <h3 className="text-[17px] font-semibold text-[#23311F] transition-colors duration-300 group-hover:text-[#485B3B]">{event.title}</h3>
              </Link>
              <p className="line-clamp-2 text-sm leading-relaxed text-[#627059]">{event.description || "Your event — click to view details."}</p>
            </div>
            {locked && (
              <span className="flex-shrink-0 text-sm">🔒</span>
            )}
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            <div className="flex items-center gap-1.5">
              <IconBadge><IconPin /></IconBadge>
              <span className="text-xs text-[#66755D]">{event.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <IconBadge><IconUsers /></IconBadge>
              <span className="text-xs text-[#66755D]">{count} / {max || "∞"} registered</span>
            </div>
          </div>

          {max > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-[#E8E4DA]">
                <div className="h-full rounded-full bg-[#485B3B]" style={{ width: `${fillPct}%` }} />
              </div>
              <span className="text-[10px] text-[#9aaa8e] whitespace-nowrap">{fillPct}% filled</span>
            </div>
          )}

          {locked && (
            <p className="text-[11px] text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-1.5">
              {count} person{count > 1 ? "s" : ""} registered — editing & deletion disabled
            </p>
          )}

          <div className="mt-auto flex gap-2">
            <Link to={`/events/${event.event_id}`}>
              <button className="flex items-center gap-1.5 rounded-full border border-[#D4DEC8] bg-[#F8FBF4] px-4 py-2 text-xs font-semibold text-[#485B3B] transition-all hover:bg-[#EBF0E1]">
                <IconEye /> View
              </button>
            </Link>
            <button
              onClick={() => onEdit(event.event_id)}
              disabled={locked}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                locked
                  ? "bg-[#F3F3F1] text-[#B0B8A8] cursor-not-allowed"
                  : "bg-[#FFF6D8] text-[#7A5A0A] hover:bg-[#FFEDAA]"
              }`}
            >
              <IconEdit /> Edit
            </button>
            <button
              onClick={() => onDelete(event.event_id)}
              disabled={locked}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white transition-all ${
                locked
                  ? "bg-[#D8D8D5] cursor-not-allowed"
                  : "bg-[#C94A4A] hover:bg-[#B03A3A]"
              }`}
            >
              <IconTrash /> Delete
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────
function EmptyState({ search, onClear, onCreate }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-[#CAD7BE] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(244,248,238,0.9))] px-6 py-14 text-center shadow-[0_20px_60px_rgba(88,110,70,0.08)]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E3ECD7] text-3xl">🍵</div>
      <h3 className="mt-5 text-[24px] font-semibold text-[#283824]">
        {search.trim() ? "No matching events" : "No events yet"}
      </h3>
      <p className="mx-auto mt-3 max-w-xl text-[15px] leading-7 text-[#66755D]">
        {search.trim()
          ? `No events matching "${search.trim()}" — try a different keyword or clear the search`
          : "You haven't created any events yet. Start by creating your first one!"}
      </p>
      <div className="mt-6 flex justify-center gap-3 flex-wrap">
        {search.trim() && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border border-[#485B3B] px-5 py-2.5 text-sm font-semibold text-[#485B3B] transition-all duration-300 hover:bg-[#485B3B] hover:text-white"
          >
            Clear search
          </button>
        )}
        {!search.trim() && (
          <button
            type="button"
            onClick={onCreate}
            className="rounded-full bg-[#485B3B] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(72,91,59,0.2)] transition-all duration-300 hover:bg-[#394A31]"
          >
            + Create your first event
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function MyEventsPage() {
  const { token } = useAuthModal();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    if (!token) { setLoading(false); return; }

    setLoading(true);
    fetch(apiUrl("/events/my-events"), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { setEvents(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  // 🔥 DELETE
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      const res = await fetch(apiUrl(`/events/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) { alert(`Cannot delete: ${data.message}`); return; }
      setEvents(prev => prev.filter(e => e.event_id !== id));
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const filteredEvents = events.filter(e => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      String(e.title || "").toLowerCase().includes(q) ||
      String(e.location || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F7F5ED_0%,#F4F6EF_40%,#F6F2E8_100%)] text-[#253622]">
      <SiteNavbar />

      <main className="relative overflow-hidden px-4 pb-16 pt-6 sm:px-6 xl:px-8 2xl:px-10">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute left-[-10rem] top-[8rem] h-[20rem] w-[20rem] rounded-full bg-[#DCE8CF]/60 blur-3xl" />
        <div className="pointer-events-none absolute right-[-6rem] top-[22rem] h-[18rem] w-[18rem] rounded-full bg-[#F0E4D1]/65 blur-3xl" />

        <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-8">

          {/* ── Header banner ── */}
          <section className="overflow-hidden rounded-[2.25rem] border border-[#DEE5D4] bg-white/86 shadow-[0_30px_80px_rgba(72,91,59,0.12)]">
            <div className="relative min-h-[280px] sm:min-h-[320px]">
              <img
                src="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1600&q=80"
                alt="My Events"
                className="h-full w-full object-cover absolute inset-0"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(19,29,16,0.06)_0%,rgba(19,29,16,0.68)_100%)]" />
              <div className="relative h-full flex flex-col justify-end p-6 sm:p-8 lg:p-12 min-h-[280px] sm:min-h-[320px]">
                <p className="text-xs uppercase tracking-[0.24em] text-white/75">Organizer Dashboard</p>
                <h1 className="mt-3 text-[1.9rem] font-semibold leading-tight text-white sm:text-[2.4rem] lg:text-[3rem]">
                  My Events
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/78 sm:text-[15px]">
                  Manage, edit, and track all the events you've created — view registrations and keep everything up to date
                </p>
              </div>
            </div>
          </section>

          {/* ── Controls card ── */}
          <section className="rounded-[2rem] border border-[#DFE6D6] bg-white/72 p-5 shadow-[0_18px_48px_rgba(72,91,59,0.08)] backdrop-blur-sm sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#879A78]">Event Management</p>
                <h2 className="mt-2 text-[1.55rem] font-semibold text-[#253621]">
                  Find and manage your events
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-[#66755D]">
                  Search through your events, check registrations, and make edits — all from one place
                </p>
              </div>
              <button
                onClick={() => navigate("/create-event")}
                className="inline-flex items-center gap-2 rounded-full bg-[#485B3B] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(72,91,59,0.22)] transition-all hover:bg-[#394A31] hover:-translate-y-0.5 flex-shrink-0"
              >
                <IconPlus /> Create Event
              </button>
            </div>

            <div className="mt-5">
              <SearchBar value={search} onChange={setSearch} />
            </div>
          </section>

          {/* ── Listing section ── */}
          <section className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#879A78]">Your Events</p>
                <h2 className="mt-2 text-[1.9rem] font-semibold text-[#253621]">
                  {search.trim() ? `Search results for "${search.trim()}"` : "All your events"}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-[#66755D]">
                  {search.trim()
                    ? "Filtered results matching the search from your event names and locations"
                    : "Every event you've created — sorted by most recent"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {!loading && (
                  <span className="rounded-full bg-white/78 px-4 py-2 text-sm text-[#5F6D55] ring-1 ring-[#D9E2CF]">
                    {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
                  </span>
                )}
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="rounded-full border border-[#485B3B] px-4 py-2 text-sm font-semibold text-[#485B3B] transition-all duration-300 hover:bg-[#485B3B] hover:text-white"
                  >
                    Clear search
                  </button>
                )}
                <ViewToggle active={viewMode} onChange={setViewMode} />
              </div>
            </div>

            {loading ? (
              <div className={viewMode === "list" ? "flex flex-col gap-5" : "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"}>
                {Array.from({ length: viewMode === "list" ? 3 : 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filteredEvents.length === 0 ? (
              <EmptyState search={search} onClear={() => setSearch("")} onCreate={() => navigate("/create-event")} />
            ) : viewMode === "list" ? (
              <div className="flex flex-col gap-5">
                {filteredEvents.map(e => (
                  <MyEventCardList
                    key={e.event_id}
                    event={e}
                    onEdit={(id) => navigate(`/edit-event/${id}`)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredEvents.map(e => (
                  <MyEventCardGrid
                    key={e.event_id}
                    event={e}
                    onEdit={(id) => navigate(`/edit-event/${id}`)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}

          </section>

        </div>
      </main>
    </div>
  );
}