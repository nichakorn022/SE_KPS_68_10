import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { useAuthModal } from "../../App";
import { apiUrl, assetUrl } from "../../lib/api";
import SiteNavbar from "../components/SiteNavbar";

// ── Hero slides (event-themed, same structure as ShopHome) ───────────────
const HERO_SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=1600&q=80",
    eyebrow: "Tea Workshops",
    title: "Learn the art of tea from masters who live it every day",
    description:
      "Hands-on workshops with certified tea specialists — from brewing techniques to tea pairing, every session is an experience worth attending",
  },
  {
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&q=80",
    eyebrow: "Community Gathering",
    title: "Find your people at events made for tea lovers like you",
    description:
      "Connect with growers, shop owners, and fellow enthusiasts at curated events across Thailand — from intimate tastings to large-scale tea festivals",
  },
  {
    image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1600&q=80",
    eyebrow: "ATC Tea Festival",
    title: "The biggest annual celebration of Thai tea culture",
    description:
      "Explore dozens of tea varieties, meet local and international vendors, and join activities that make every sip feel like a discovery",
  },
];

// ── SVG Icons (same as EventDetails) ─────────────────────────────────────
const IconBadge = ({ children }) => (
  <span className="w-8 h-8 rounded-full border border-[#253621]/20 bg-[#F5F3E9] flex items-center justify-center flex-shrink-0">
    {children}
  </span>
);

const IconCalendar = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#485B3B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconPin = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#485B3B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconUsers = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#485B3B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconHeart = ({ filled }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? "#ef4444" : "none"} stroke={filled ? "#ef4444" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const IconGrid = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);

const IconList = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

// ── SearchBar (matches ShopHome SearchBar) ────────────────────────────────
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
        placeholder="Search for events, locations, or descriptions you want to attend"
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

// ── TabBar (same style as ShopHome) ──────────────────────────────────────
const SORT_TABS = ["All", "Newest", "Popular", "Interested"];

function TabBar({ active, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {SORT_TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onSelect(tab)}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
            active === tab
              ? "bg-[#485B3B] text-white shadow-[0_12px_24px_rgba(72,91,59,0.2)]"
              : "bg-white/88 text-[#566452] ring-1 ring-[#D8E0CF] hover:-translate-y-0.5 hover:bg-white hover:text-[#314228]"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

// ── ViewToggle (same as ShopHome) ─────────────────────────────────────────
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

// ── Skeleton ──────────────────────────────────────────────────────────────
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

// ── Event Card (Grid) ─────────────────────────────────────────────────────
function EventCardGrid({ event, imageSrc, isInterested }) {
  const attending = Number(event.registration_count || 0);
  const max = Number(event.max_participant || 0);
  const fillPct = max > 0 ? Math.min(100, Math.round((attending / max) * 100)) : 0;
  const isFull = fillPct === 100;
  const isAlmostFull = fillPct >= 80 && !isFull;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-[#DEE5D5] bg-white/92 shadow-[0_18px_50px_rgba(72,91,59,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_70px_rgba(72,91,59,0.14)]">
      <Link to={`/events/${event.event_id}`} className="block">
        <div className="relative aspect-[6/5] overflow-hidden bg-[#EBF0E1]">
          <img
            src={imageSrc}
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

          {/* Heart */}
          <div className={`absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-sm transition ${isInterested ? "border-red-200 bg-white/90 text-red-400" : "border-white/30 bg-[#253621]/30 text-white"}`}>
            <IconHeart filled={isInterested} />
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-4 gap-3">
        <div className="space-y-1">
          <Link to={`/events/${event.event_id}`}>
            <h3 className="line-clamp-2 min-h-[2.6rem] text-[17px] font-semibold leading-snug text-[#23311F] transition-colors duration-300 group-hover:text-[#485B3B]">
              {event.title}
            </h3>
          </Link>
          <p className="line-clamp-2 min-h-[3rem] text-sm leading-relaxed text-[#627059]">
            {event.description || "An event curated for tea lovers — good atmosphere, good people, and great tea."}
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <IconBadge><IconCalendar /></IconBadge>
            <span className="text-xs text-[#66755D]">
              {new Date(event.event_date).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <IconBadge><IconPin /></IconBadge>
            <span className="text-xs text-[#66755D] line-clamp-1">{event.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <IconBadge><IconUsers /></IconBadge>
            <span className="text-xs text-[#66755D]">{attending} / {max} attending</span>
          </div>
        </div>

        <div className="mt-auto">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E8E4DA]">
            <div className="h-full rounded-full bg-[#485B3B] transition-all" style={{ width: `${fillPct}%` }} />
          </div>
          <p className="mt-1 text-right text-[10px] text-[#9aaa8e]">{fillPct}% filled</p>
        </div>
      </div>
    </article>
  );
}

// ── Event Card (List) ─────────────────────────────────────────────────────
function EventCardList({ event, imageSrc, isInterested }) {
  const attending = Number(event.registration_count || 0);
  const max = Number(event.max_participant || 0);
  const fillPct = max > 0 ? Math.min(100, Math.round((attending / max) * 100)) : 0;

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-[#DCE4D4] bg-white/92 shadow-[0_18px_50px_rgba(72,91,59,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_64px_rgba(72,91,59,0.14)]">
      <Link to={`/events/${event.event_id}`} className="flex">
        <div className="relative h-auto w-[220px] flex-shrink-0 overflow-hidden bg-[#EBF0E1]">
          <img src={imageSrc} alt={event.title || "event"} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-[17px] font-semibold text-[#23311F] transition-colors duration-300 group-hover:text-[#485B3B]">{event.title}</h3>
              <p className="line-clamp-2 text-sm leading-relaxed text-[#627059]">{event.description}</p>
            </div>
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border transition ${isInterested ? "border-red-200 bg-red-50 text-red-400" : "border-[#253621]/20 bg-[#F5F3E9] text-[#485B3B]"}`}>
              <IconHeart filled={isInterested} />
            </div>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            <div className="flex items-center gap-1.5"><IconBadge><IconCalendar /></IconBadge>
              <span className="text-xs text-[#66755D]">{new Date(event.event_date).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })}</span>
            </div>
            <div className="flex items-center gap-1.5"><IconBadge><IconPin /></IconBadge>
              <span className="text-xs text-[#66755D]">{event.location}</span>
            </div>
            <div className="flex items-center gap-1.5"><IconBadge><IconUsers /></IconBadge>
              <span className="text-xs text-[#66755D]">{attending} / {max}</span>
            </div>
          </div>
          <div className="mt-auto flex items-center gap-3">
            <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-[#E8E4DA]">
              <div className="h-full rounded-full bg-[#485B3B]" style={{ width: `${fillPct}%` }} />
            </div>
            <span className="text-[10px] text-[#9aaa8e] whitespace-nowrap">{fillPct}% filled</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────
function EmptyState({ search, onClear }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-[#CAD7BE] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(244,248,238,0.9))] px-6 py-14 text-center shadow-[0_20px_60px_rgba(88,110,70,0.08)]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E3ECD7] text-3xl">🍵</div>
      <h3 className="mt-5 text-[24px] font-semibold text-[#283824]">No events found</h3>
      <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-7 text-[#66755D]">
        {search.trim()
          ? `No events matching "${search.trim()}" — try a different keyword or clear the search`
          : "No events match the current filter. Try switching to All to see everything upcoming"}
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-6 rounded-full bg-[#485B3B] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(72,91,59,0.2)] transition-all duration-300 hover:bg-[#394A31]"
      >
        Clear filters
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
function EventPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [viewMode, setViewMode] = useState("grid");
  const [interestedIds, setInterestedIds] = useState([]);
  const [organizerStatus, setOrganizerStatus] = useState(null);
  const [eventImageMap, setEventImageMap] = useState({});
  const [user, setUser] = useState(null);

  const { token } = useAuthModal();
  const role = user?.role;

  useEffect(() => {
    let url = role === "shop" ? "/events/shop/available" : "/events";
    setLoading(true);
    fetch(apiUrl(url), { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.json())
      .then((d) => { setEvents(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [role, token]);

  useEffect(() => {
    fetch(apiUrl("/event-images"))
      .then((r) => r.json())
      .then((d) => {
        if (!Array.isArray(d)) return;
        const map = {};
        d.forEach((img) => { if (!map[img.event_id] && img.image_path) map[img.event_id] = assetUrl(img.image_path); });
        setEventImageMap(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch(apiUrl("/organizers/me"), { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then((d) => setOrganizerStatus(d.exists ? d.verified_status : null)).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetch(apiUrl("/auth/profile"), { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then((d) => setUser(d.user)).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetch(apiUrl("/events/interested/me"), { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then((d) => setInterestedIds(Array.isArray(d) ? d.map((i) => i.event_id) : [])).catch(() => {});
  }, [token]);

  const isUpcoming = (date) => { const p = new Date(date); return Number.isNaN(p.getTime()) || p.getTime() >= Date.now(); };

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events
      .filter((e) => {
        if (!isUpcoming(e.event_date)) return false;
        if (q && !String(e.title || "").toLowerCase().includes(q) && !String(e.description || "").toLowerCase().includes(q)) return false;
        if (activeTab === "Interested") return interestedIds.includes(e.event_id);
        return true;
      })
      .sort((a, b) => {
        if (activeTab === "Popular") return Number(b.registration_count || 0) - Number(a.registration_count || 0) || Number(b.max_participant || 0) - Number(a.max_participant || 0);
        if (activeTab === "Newest") return Number(b.event_id || 0) - Number(a.event_id || 0);
        return 0;
      });
  }, [events, search, activeTab, interestedIds]);

  const sectionTitle = search.trim() ? `Search results for "${search.trim()}"` : activeTab === "Popular" ? "Most attended events" : activeTab === "Newest" ? "Freshly added events" : activeTab === "Interested" ? "Events you're interested in" : "Events worth attending today";

  const sectionDesc = search.trim() ? "Filtered results that match the search from event names and descriptions" : activeTab === "Popular" ? "Ranked by the actual number of registered attendees, sorted from high to low" : activeTab === "Newest" ? "Recently created events — be the first to register and get a spot" : activeTab === "Interested" ? "Events you've marked as interested — sorted by soonest date" : "Upcoming events open for registration across all categories";

  const clearFilters = () => { setSearch(""); setActiveTab("All"); };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F7F5ED_0%,#F4F6EF_40%,#F6F2E8_100%)] text-[#253622]">
      <SiteNavbar active="events" />

      <main className="relative overflow-hidden px-4 pb-16 pt-6 sm:px-6 xl:px-8 2xl:px-10">
        {/* Decorative blobs (same as ShopHome) */}
        <div className="pointer-events-none absolute left-[-10rem] top-[8rem] h-[20rem] w-[20rem] rounded-full bg-[#DCE8CF]/60 blur-3xl" />
        <div className="pointer-events-none absolute right-[-6rem] top-[22rem] h-[18rem] w-[18rem] rounded-full bg-[#F0E4D1]/65 blur-3xl" />

        <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-8">

          {/* ── Hero Swiper (same structure as ShopHome) ── */}
          <section>
            <div className="overflow-hidden rounded-[2.25rem] border border-[#DEE5D4] bg-white/86 shadow-[0_30px_80px_rgba(72,91,59,0.12)]">
              <Swiper
                modules={[Pagination, Autoplay]}
                slidesPerView={1}
                loop
                autoplay={{ delay: 4200, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                className="h-full"
              >
                {HERO_SLIDES.map((slide) => (
                  <SwiperSlide key={slide.title}>
                    <div className="relative h-full min-h-[72vh] max-h-[860px]">
                      <img src={slide.image} alt={slide.title} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(19,29,16,0.06)_0%,rgba(19,29,16,0.68)_100%)]" />
                      <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8 lg:p-12">
                        <p className="text-xs uppercase tracking-[0.24em] text-white/75">{slide.eyebrow}</p>
                        <h2 className="mt-3 max-w-2xl text-[1.9rem] font-semibold leading-tight sm:text-[2.4rem] lg:text-[3rem]">{slide.title}</h2>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/78 sm:text-[15px] lg:text-base">{slide.description}</p>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </section>

          {/* ── Browse Modes card (matches ShopHome) ── */}
          <section className="rounded-[2rem] border border-[#DFE6D6] bg-white/72 p-5 shadow-[0_18px_48px_rgba(72,91,59,0.08)] backdrop-blur-sm sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#879A78]">Browse Modes</p>
                <h2 className="mt-2 text-[1.55rem] font-semibold text-[#253621]">
                  Find and filter events without changing pages
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-[#66755D]">
                  Use filters to go from broad to narrow, and still see the overall view of upcoming events in the same tone
                </p>
              </div>
            </div>

            <div className="mt-5">
              <SearchBar value={search} onChange={setSearch} />
            </div>

            <div className="mt-5">
              <TabBar active={activeTab} onSelect={setActiveTab} />
            </div>
          </section>

          {/* ── Role-based actions ── */}
          {(role === "shop" || role === "user" || role === "organizer") && (
            <div className="flex flex-wrap justify-center gap-3">
              {role === "shop" && (
                <>
                  <Link to="/my-sponsor"><button className="rounded-full bg-[#485B3B] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(72,91,59,0.22)] hover:bg-[#394A31] transition-all">My Sponsor</button></Link>
                  <Link to="/sponsor-requests"><button className="rounded-full border border-[#485B3B]/40 px-6 py-2.5 text-sm font-semibold text-[#485B3B] hover:bg-[#485B3B] hover:text-white transition-all">Requests</button></Link>
                </>
              )}
              {organizerStatus === null && role === "user" && (
                <Link to="/become-organizer"><button className="rounded-full bg-[#485B3B] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(72,91,59,0.22)] hover:bg-[#394A31] transition-all">Become Organizer</button></Link>
              )}
              {organizerStatus === 0 && (
                <button disabled className="cursor-not-allowed rounded-full border border-amber-300 bg-amber-50 px-6 py-2.5 text-sm font-semibold text-amber-700">Pending Approval</button>
              )}
              {organizerStatus === 1 && (
                <>
                  <Link to="/my-events"><button className="rounded-full bg-[#485B3B] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(72,91,59,0.22)] hover:bg-[#394A31] transition-all">Manage My Events</button></Link>
                  <Link to="/organizer-sponsor-requests"><button className="rounded-full border border-[#485B3B]/40 px-6 py-2.5 text-sm font-semibold text-[#485B3B] hover:bg-[#485B3B] hover:text-white transition-all">Shop Requests</button></Link>
                </>
              )}
            </div>
          )}

          {/* ── Event Listing section ── */}
          <section className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#879A78]">Event Listing</p>
                <h2 className="mt-2 text-[1.9rem] font-semibold text-[#253621]">{sectionTitle}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-[#66755D]">{sectionDesc}</p>
              </div>
              <div className="flex items-center gap-3">
                {!loading && (
                  <span className="rounded-full bg-white/78 px-4 py-2 text-sm text-[#5F6D55] ring-1 ring-[#D9E2CF]">
                    {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
                  </span>
                )}
                {(search || activeTab !== "All") && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-full border border-[#485B3B] px-4 py-2 text-sm font-semibold text-[#485B3B] transition-all duration-300 hover:bg-[#485B3B] hover:text-white"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className={viewMode === "list" ? "flex flex-col gap-5" : "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"}>
                {Array.from({ length: viewMode === "list" ? 4 : 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filteredEvents.length === 0 ? (
              <EmptyState search={search} onClear={clearFilters} />
            ) : viewMode === "list" ? (
              <div className="flex flex-col gap-5">
                {filteredEvents.map((event) => (
                  <EventCardList
                    key={event.event_id}
                    event={event}
                    imageSrc={eventImageMap[event.event_id] || "/Pictrue/Activity.png"}
                    isInterested={interestedIds.includes(event.event_id)}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {filteredEvents.map((event) => (
                  <EventCardGrid
                    key={event.event_id}
                    event={event}
                    imageSrc={eventImageMap[event.event_id] || "/Pictrue/Activity.png"}
                    isInterested={interestedIds.includes(event.event_id)}
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

export default EventPage;