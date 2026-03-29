import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiUrl } from "../../lib/api";
import SiteNavbar from "../components/SiteNavbar";

const StarRating = ({ label, rating, setRating }) => (
  <div className="flex items-center justify-between py-3 border-b border-[#EEF0E9] last:border-0">
    <span className="text-sm font-medium text-[#253621]">{label}</span>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          className={`text-2xl transition-transform hover:scale-110 ${
            star <= rating ? "text-amber-400" : "text-[#DFE6D6]"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  </div>
);

export default function ReviewPage() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState(null);

  const [overall, setOverall] = useState(0);
  const [location, setLocation] = useState(0);
  const [atmosphere, setAtmosphere] = useState(0);
  const [value, setValue] = useState(0);

  useEffect(() => {
    fetch(apiUrl(`/events/${id}`))
      .then(res => {
        if (!res.ok) throw new Error(`Event ${id} ${res.status}`);
        return res.json();
      })
      .then(data => { setEvent(data); setError(null); })
      .catch(err => { console.error(err); setEvent(null); setError(err.message); });
  }, [id]);

  if (error) return (
    <div className="min-h-screen bg-[#F5F3E9]">
      <SiteNavbar active="events" />
      <div className="max-w-[700px] mx-auto mt-16 px-6">
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-center text-red-600">
          ไม่สามารถโหลดข้อมูลกิจกรรมได้: {error}
        </div>
      </div>
    </div>
  );

  if (!event) return (
    <div className="min-h-screen bg-[#F5F3E9] flex items-center justify-center">
      <div className="text-[#879A78] text-sm animate-pulse">Loading…</div>
    </div>
  );

  const isEventFinished = new Date(event.event_date) < new Date();
  const avgRating = [overall, location, atmosphere, value].filter(Boolean);
  const ratingFilled = avgRating.length > 0;

  return (
    <div className="min-h-screen bg-[#F5F3E9] font-sans">
      <SiteNavbar active="events" />

      <main className="max-w-[820px] mx-auto px-5 py-12 space-y-6">

        {/* ── BREADCRUMB ───────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-xs text-[#879A78]">
          <Link to="/events" className="hover:text-[#485B3B] transition">Events</Link>
          <span>›</span>
          <Link to={`/events/${event.event_id}`} className="hover:text-[#485B3B] transition truncate max-w-[200px]">
            {event.title}
          </Link>
          <span>›</span>
          <span className="text-[#253621] font-medium">Review</span>
        </div>

        {/* ── EVENT SUMMARY CARD ────────────────────────────────── */}
        <div className="rounded-[2rem] border border-[#DFE6D6] bg-white shadow-[0_18px_48px_rgba(72,91,59,0.08)] overflow-hidden grid grid-cols-1 sm:grid-cols-2">
          <div className="p-7">
            <p className="text-xs uppercase tracking-[0.2em] text-[#879A78] mb-2">
              Organizer #{event.organizer_id}
            </p>
            <h1 className="text-xl font-semibold text-[#253621] leading-snug">{event.title}</h1>
            <div className="mt-4 space-y-1.5">
              <p className="text-sm text-[#66755D]">
                🕒 {new Date(event.event_date).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <p className="text-sm text-[#66755D]">📍 {event.location}</p>
            </div>
            <p className="text-sm text-[#66755D] mt-4 leading-relaxed line-clamp-3">
              {event.description}
            </p>

            {/* Status badge */}
            <div className="mt-4">
              {isEventFinished ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-semibold text-green-700">
                  ✓ Event completed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700">
                  ⏳ Upcoming event
                </span>
              )}
            </div>
          </div>

          <div className="relative min-h-[180px] sm:min-h-0">
            <img
              src="/Pictrue/Activity.png"
              alt="event"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>

        {/* ── REVIEW FORM ──────────────────────────────────────── */}
        <div className="rounded-[2rem] border border-[#DFE6D6] bg-white shadow-[0_18px_48px_rgba(72,91,59,0.08)] p-7 lg:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#879A78] mb-1">Share your experience</p>
          <h2 className="text-[1.25rem] font-semibold text-[#253621] mb-6">
            Your opinion matters!
          </h2>

          {/* Comment */}
          <textarea
            placeholder="Write your review here…"
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={4}
            className="w-full border border-[#DFE6D6] rounded-[1rem] p-4 text-sm text-[#253621] placeholder:text-[#aab89e] focus:outline-none focus:ring-2 focus:ring-[#6f8b5d]/30 resize-none mb-6"
          />

          {/* Star ratings */}
          <div className="rounded-[1.25rem] border border-[#DFE6D6] bg-[#F5F3E9] px-5 py-2 mb-6">
            <StarRating label="Overall"         rating={overall}    setRating={setOverall} />
            <StarRating label="Location"        rating={location}   setRating={setLocation} />
            <StarRating label="Atmosphere"      rating={atmosphere} setRating={setAtmosphere} />
            <StarRating label="Value for money" rating={value}      setRating={setValue} />
          </div>

          {/* Average preview */}
          {ratingFilled && (
            <div className="mb-4 flex items-center gap-2 text-sm text-[#66755D]">
              <span className="text-amber-400 text-lg">★</span>
              <span className="font-semibold text-[#253621]">
                {(avgRating.reduce((a, b) => a + b, 0) / avgRating.length).toFixed(1)}
              </span>
              <span>average rating</span>
            </div>
          )}

          {/* Submit */}
          <button
            disabled={!isEventFinished}
            className={`w-full py-3 rounded-full text-sm font-semibold transition-all duration-300 ${
              isEventFinished
                ? "bg-[#485B3B] text-white shadow-[0_10px_28px_rgba(72,91,59,0.25)] hover:bg-[#394A31]"
                : "bg-[#DFE6D6] text-[#879A78] cursor-not-allowed"
            }`}
          >
            {isEventFinished ? "Post Review" : "Event has not finished yet"}
          </button>
        </div>

      </main>
    </div>
  );
}