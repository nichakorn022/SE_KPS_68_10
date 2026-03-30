import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuthModal } from "../../App";
import { apiUrl } from "../../lib/api";
import SiteNavbar from "../components/SiteNavbar";

const StarRating = ({ label, rating, setRating, disabled = false }) => (
  <div className="flex items-center justify-between border-b border-[#EEF0E9] py-3 last:border-0">
    <span className="text-sm font-medium text-[#253621]">{label}</span>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !disabled && setRating(star)}
          disabled={disabled}
          className={`text-2xl transition-transform ${
            disabled ? "cursor-not-allowed opacity-70" : "hover:scale-110"
          } ${star <= rating ? "text-amber-400" : "text-[#DFE6D6]"}`}
        >
          {"\u2605"}
        </button>
      ))}
    </div>
  </div>
);

export default function EventReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthModal();

  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState("");
  const [overall, setOverall] = useState(0);
  const [location, setLocation] = useState(0);
  const [atmosphere, setAtmosphere] = useState(0);
  const [value, setValue] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(apiUrl(`/events/${id}`))
      .then((res) => {
        if (!res.ok) throw new Error(`Event ${id} ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setEvent(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setEvent(null);
        setError(err.message);
      });
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F3E9]">
        <SiteNavbar active="events" />
        <div className="mx-auto mt-16 max-w-[700px] px-6">
          <div className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-center text-red-600">
            Failed to load event: {error}
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F3E9]">
        <div className="text-sm text-[#879A78]">Loading...</div>
      </div>
    );
  }

  const isEventFinished = new Date(event.event_date) < new Date();
  const avgRating = [overall, location, atmosphere, value].filter(Boolean);
  const ratingFilled = avgRating.length > 0;
  const isFormLocked = submitted || submitting;

  const handleSubmitReview = async () => {
    setSubmitError("");
    setSubmitMessage("");

    if (!token) {
      setSubmitError("Please login before submitting a review.");
      return;
    }

    if (!isEventFinished) {
      setSubmitError("You can review this event only after it finishes.");
      return;
    }

    if (![overall, location, atmosphere, value].every((score) => Number(score) >= 1 && Number(score) <= 5)) {
      setSubmitError("Please rate all categories before posting your review.");
      return;
    }

    if (!comment.trim()) {
      setSubmitError("Please write your review before posting.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(apiUrl(`/reviews/events/${id}`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          overall_rating: overall,
          location_rating: location,
          atmosphere_rating: atmosphere,
          value_rating: value,
          comment: comment.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSubmitError(data.message || "Failed to submit review.");
        return;
      }

      setSubmitted(true);
      setSubmitMessage(data.message || "Event review submitted successfully.");
    } catch (submitErr) {
      console.error("Submit review error:", submitErr);
      setSubmitError("Unable to submit review right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3E9] font-sans">
      <SiteNavbar active="events" />

      <main className="mx-auto max-w-[820px] space-y-6 px-5 py-12">
        <div className="flex items-center gap-2 text-xs text-[#879A78]">
          <Link to="/events" className="transition hover:text-[#485B3B]">
            Events
          </Link>
          <span>{">"}</span>
          <Link
            to={`/events/${event.event_id}`}
            className="max-w-[200px] truncate transition hover:text-[#485B3B]"
          >
            {event.title}
          </Link>
          <span>{">"}</span>
          <span className="font-medium text-[#253621]">Review</span>
        </div>

        <div className="grid grid-cols-1 overflow-hidden rounded-[2rem] border border-[#DFE6D6] bg-white shadow-[0_18px_48px_rgba(72,91,59,0.08)] sm:grid-cols-2">
          <div className="p-7">
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[#879A78]">
              ORGANIZER : {event.organizer_first_name || `#${event.organizer_id}`}
            </p>
            <h1 className="text-xl font-semibold leading-snug text-[#253621]">{event.title}</h1>

            <div className="mt-4 space-y-1.5">
              <p className="text-sm text-[#66755D]">
                Date:{" "}
                {new Date(event.event_date).toLocaleDateString("th-TH", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="text-sm text-[#66755D]">Location: {event.location}</p>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-[#66755D]">{event.description}</p>

            <div className="mt-4">
              {isEventFinished ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  Event completed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  Upcoming event
                </span>
              )}
            </div>
          </div>

          <div className="relative min-h-[180px] sm:min-h-0">
            <img
              src="/Pictrue/Activity.png"
              alt="event"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#DFE6D6] bg-white p-7 shadow-[0_18px_48px_rgba(72,91,59,0.08)] lg:p-8">
          <p className="mb-1 text-xs uppercase tracking-[0.2em] text-[#879A78]">Share your experience</p>
          <h2 className="mb-6 text-[1.25rem] font-semibold text-[#253621]">Your opinion matters!</h2>

          {submitError && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {submitError}
            </div>
          )}

          {submitMessage && (
            <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {submitMessage}
            </div>
          )}

          <textarea
            placeholder="Write your review here..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            disabled={isFormLocked}
            className="mb-6 w-full resize-none rounded-[1rem] border border-[#DFE6D6] p-4 text-sm text-[#253621] placeholder:text-[#aab89e] focus:outline-none focus:ring-2 focus:ring-[#6f8b5d]/30"
          />

          <div className="mb-6 rounded-[1.25rem] border border-[#DFE6D6] bg-[#F5F3E9] px-5 py-2">
            <StarRating label="Overall" rating={overall} setRating={setOverall} disabled={isFormLocked} />
            <StarRating label="Location" rating={location} setRating={setLocation} disabled={isFormLocked} />
            <StarRating
              label="Atmosphere"
              rating={atmosphere}
              setRating={setAtmosphere}
              disabled={isFormLocked}
            />
            <StarRating label="Value for money" rating={value} setRating={setValue} disabled={isFormLocked} />
          </div>

          {ratingFilled && (
            <div className="mb-4 flex items-center gap-2 text-sm text-[#66755D]">
              <span className="text-lg text-amber-400">{"\u2605"}</span>
              <span className="font-semibold text-[#253621]">
                {(avgRating.reduce((a, b) => a + b, 0) / avgRating.length).toFixed(1)}
              </span>
              <span>average rating</span>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSubmitReview}
              disabled={!isEventFinished || isFormLocked}
              className={`flex-1 rounded-full py-3 text-sm font-semibold transition-all duration-300 ${
                isEventFinished && !isFormLocked
                  ? "bg-[#485B3B] text-white shadow-[0_10px_28px_rgba(72,91,59,0.25)] hover:bg-[#394A31]"
                  : "cursor-not-allowed bg-[#DFE6D6] text-[#879A78]"
              }`}
            >
              {submitted
                ? "Review Submitted"
                : submitting
                ? "Posting..."
                : isEventFinished
                ? "Post Review"
                : "Event has not finished yet"}
            </button>

            {submitted && (
              <button
                type="button"
                onClick={() => navigate(`/events/${event.event_id}`)}
                className="rounded-full border border-[#d9d2c6] px-6 py-3 text-sm font-semibold text-[#5f5a52] hover:bg-[#f7f3eb]"
              >
                Back to Event
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
