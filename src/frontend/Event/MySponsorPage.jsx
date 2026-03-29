import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiUrl, assetUrl } from "../../lib/api";
import { useAuthModal } from "../../App";
import SiteNavbar from "../components/SiteNavbar";

function getStatusTextClass(status) {
  if (status === "approved") return "text-green-600";
  if (status === "rejected") return "text-red-500";
  if (status === "cancelled") return "text-gray-500";
  return "text-yellow-500";
}

function getSourceLabel(requestBy) {
  return String(requestBy || "").toLowerCase() === "organizer"
    ? "Organizer sent request to your shop"
    : "Your shop sent sponsor request";
}

function formatPrice(value) {
  if (value === null || value === undefined || value === "") return "-";
  const amount = Number(value);
  if (Number.isNaN(amount)) return "-";
  return `THB ${amount.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function MySponsorPage() {
  const { token } = useAuthModal();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!token) return;

    fetch(apiUrl("/sponsors/my"), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setEvents(Array.isArray(data) ? data : []);
      })
      .catch(console.error);
  }, [token]);

  return (
    <div className="bg-[#e7e3d8] min-h-screen">
      <SiteNavbar />

      <div
        className="relative bg-cover bg-center py-24 text-center"
        style={{ backgroundImage: "url('/Pictrue/Activity.png')" }}
      >
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative text-white">
          <h1 className="text-3xl font-serif font-bold md:text-4xl">My Sponsor Events</h1>
          <p>Events that your shop is involved in as a sponsor</p>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-[1100px] px-5 pb-12">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 rounded bg-gray-300 px-4 py-2 hover:bg-gray-400"
        >
          Back
        </button>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.length === 0 ? (
            <p className="col-span-full text-center text-gray-500">No sponsor events</p>
          ) : (
            events.map((event) => {
              const imageSrc = event.event_image_path
                ? assetUrl(event.event_image_path)
                : "/Pictrue/Activity.png";

              return (
                <Link
                  key={event.sponsor_id}
                  to={`/events/${event.event_id}`}
                  className="overflow-hidden rounded-xl bg-white shadow-md transition hover:shadow-lg"
                >
                  <img
                    src={imageSrc}
                    alt={event.event_title}
                    className="h-[170px] w-full object-cover"
                  />

                  <div className="p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#8d9577]">Sponsor Event</p>

                    <h3 className="mt-2 text-lg font-semibold">{event.event_title}</h3>

                    <p className="mt-2 text-sm text-[#5f5a52]">{getSourceLabel(event.request_by)}</p>

                    <p className="mt-3 text-sm text-[#5f5a52] line-clamp-2">
                      {event.event_description || "No description"}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-sm">
                      {event.event_price !== null &&
                        event.event_price !== undefined &&
                        event.event_price !== "" && (
                          <span className="rounded-full bg-[#f3efe6] px-3 py-1 text-[#4f4a43]">
                            {formatPrice(event.event_price)}
                          </span>
                        )}

                      {event.event_capacity !== null &&
                        event.event_capacity !== undefined &&
                        event.event_capacity !== "" && (
                          <span className="rounded-full bg-[#f3efe6] px-3 py-1 text-[#4f4a43]">
                            {event.event_capacity} people
                          </span>
                        )}
                    </div>

                    <p className="mt-4 text-sm">
                      Status:
                      <span className={`ml-2 font-semibold capitalize ${getStatusTextClass(event.status)}`}>
                        {event.status}
                      </span>
                    </p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
