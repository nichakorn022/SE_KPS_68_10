import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiUrl } from "../../lib/api";
import SiteNavbar from "../components/SiteNavbar";

function StarRating({ rating, setRating }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          className={`text-xl ${star <= rating ? "text-yellow-500" : "text-gray-400"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ReviewPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [overall, setOverall] = useState(0);
  const [location, setLocation] = useState(0);
  const [atmosphere, setAtmosphere] = useState(0);
  const [value, setValue] = useState(0);

  useEffect(() => {
    fetch(apiUrl(`/events/${id}`))
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Event ${id} ${res.status}`);
        }
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

  const handleSubmitReview = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setStatus("Please login before posting a review.");
      return;
    }

    if (!comment.trim() || !overall || !location || !atmosphere || !value) {
      setStatus("Please complete the comment and all rating fields.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(apiUrl(`/reviews/events/${id}`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          overall_rating: overall,
          location_rating: location,
          atmosphere_rating: atmosphere,
          value_rating: value,
          comment: comment.trim(),
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || "Failed to submit event review");
      }

      setStatus("Event review submitted successfully.");
      setComment("");
      setOverall(0);
      setLocation(0);
      setAtmosphere(0);
      setValue(0);
    } catch (err) {
      setStatus(err.message || "Failed to submit event review");
    } finally {
      setSubmitting(false);
    }
  };

  if (error) return <div className="p-10 text-red-600">Failed to load event: {error}</div>;
  if (!event) return <div className="p-10">Loading...</div>;

  const eventDate = new Date(event.event_date);
  const today = new Date();
  const isEventFinished = eventDate < today;

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#F5F3E9] font-sans text-gray-800">
      <div className="min-h-screen w-full max-w-auto overflow-hidden bg-[#F5F3E9] shadow-sm">
        <SiteNavbar active="events" />

        <div className="p-8">
          <div className="mx-auto grid max-w-4xl grid-cols-2 overflow-hidden rounded-2xl bg-white shadow-lg">
            <div className="p-8">
              <h1 className="mb-3 text-xl font-bold">{event.title}</h1>
              <p className="mb-3 text-gray-500">Organizer</p>
              <p className="text-gray-600">{new Date(event.event_date).toLocaleDateString()}</p>
              <p className="mt-2 text-gray-600">{event.location}</p>
              <p className="mt-4 text-sm leading-relaxed text-gray-600">{event.description}</p>
            </div>

            <div className="h-full">
              <img src="/Pictrue/Activity.png" alt="event" className="h-full w-full object-cover" />
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-4xl rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 font-semibold">Your options are important!</h2>

            {status ? <div className="mb-4 rounded-lg bg-[#f3f0e8] px-4 py-3 text-sm text-[#485B3B]">{status}</div> : null}

            <textarea
              placeholder="Write a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mb-6 w-full rounded-lg border p-3"
            />

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Overall</span>
                <StarRating rating={overall} setRating={setOverall} />
              </div>
              <div className="flex justify-between">
                <span>Location</span>
                <StarRating rating={location} setRating={setLocation} />
              </div>
              <div className="flex justify-between">
                <span>Atmosphere</span>
                <StarRating rating={atmosphere} setRating={setAtmosphere} />
              </div>
              <div className="flex justify-between">
                <span>Value for money</span>
                <StarRating rating={value} setRating={setValue} />
              </div>
            </div>

            <button
              type="button"
              disabled={!isEventFinished || submitting}
              onClick={handleSubmitReview}
              className={`mt-6 w-full rounded-full py-2 text-white ${
                isEventFinished && !submitting ? "bg-[#6f8b5d] hover:opacity-90" : "cursor-not-allowed bg-gray-400"
              }`}
            >
              {isEventFinished ? (submitting ? "Posting..." : "Post Review") : "Event has not finished yet"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
