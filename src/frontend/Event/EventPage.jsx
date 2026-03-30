import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthModal } from "../../App";
import { apiUrl, assetUrl } from "../../lib/api";
import SiteNavbar from "../components/SiteNavbar";

function EventPage() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [interestedIds, setInterestedIds] = useState([]);
  const [organizerStatus, setOrganizerStatus] = useState(null);
  const [eventImageMap, setEventImageMap] = useState({});
  const [user, setUser] = useState(null);

  const { token } = useAuthModal();
  const role = user?.role;

  useEffect(() => {
    let url = "/events";

    if (role === "shop") {
      url = "/events/shop/available";
    }

    fetch(apiUrl(url), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [role, token]);

  useEffect(() => {
    fetch(apiUrl("/event-images"))
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          setEventImageMap({});
          return;
        }

        const nextImageMap = {};
        data.forEach((image) => {
          if (!nextImageMap[image.event_id] && image.image_path) {
            nextImageMap[image.event_id] = assetUrl(image.image_path);
          }
        });

        setEventImageMap(nextImageMap);
      })
      .catch((err) => {
        console.error("Event images error:", err);
        setEventImageMap({});
      });
  }, []);

  useEffect(() => {
    if (!token) return;

    fetch(apiUrl("/organizers/me"), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.exists) {
          setOrganizerStatus(data.verified_status);
        } else {
          setOrganizerStatus(null);
        }
      })
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    if (!token) return;

    fetch(apiUrl("/auth/profile"), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
      })
      .catch((err) => {
        console.error("Profile error:", err);
      });
  }, [token]);

  useEffect(() => {
    if (!token) return;

    fetch(apiUrl("/events/interested/me"), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const ids = Array.isArray(data) ? data.map((item) => item.event_id) : [];
        setInterestedIds(ids);
      })
      .catch((err) => {
        console.error("Interested error:", err);
      });
  }, [token]);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredEvents = events
    .filter((event) => {
      const matchesSearch =
        !normalizedSearch ||
        String(event.title || "").toLowerCase().includes(normalizedSearch) ||
        String(event.description || "").toLowerCase().includes(normalizedSearch);

      if (!matchesSearch) {
        return false;
      }

      if (filter === "interested") {
        return interestedIds.includes(event.event_id);
      }

      return true;
    })
    .sort((a, b) => {
      if (filter === "popular") {
        return (
          Number(b.registration_count || 0) - Number(a.registration_count || 0) ||
          Number(b.max_participant || 0) - Number(a.max_participant || 0) ||
          Number(b.event_id || 0) - Number(a.event_id || 0)
        );
      }

      return 0;
    });

  return (
    <div className="bg-[#e7e3d8] min-h-screen">
      <SiteNavbar active="events" />

      <div
        className="relative bg-cover bg-center py-24 text-center"
        style={{ backgroundImage: "url('/Pictrue/Activity.png')" }}
      >
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative text-white">
          <h1 className="text-3xl font-serif font-bold md:text-4xl">ATC Tea Event</h1>
          <p>กิจกรรมชา และเวิร์คช็อปสำหรับคนรักชา</p>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-[1100px] px-5">
        {role && (
          <p className="mb-3 text-center text-sm text-gray-500">
            Logged in as: {role}
          </p>
        )}

        {role === "shop" && (
          <div className="mb-6 flex justify-center gap-4">
            <Link to="/my-sponsor">
              <button className="rounded-full bg-[#6f8b5d] px-5 py-2 text-white shadow-md hover:bg-[#5f7a4e]">
                My Sponsor
              </button>
            </Link>

            <Link to="/sponsor-requests">
              <button className="rounded-full border border-[#6f8b5d] px-5 py-2 text-[#6f8b5d] hover:bg-[#6f8b5d] hover:text-white">
                Requests
              </button>
            </Link>
          </div>
        )}

        {(role === "user" || role === "organizer") && (
          <div className="mb-6 flex justify-center">
            {organizerStatus === null && role === "user" && (
              <Link to="/become-organizer">
                <button className="rounded-full bg-[#6f8b5d] px-5 py-2 text-white">
                  Become Organizer
                </button>
              </Link>
            )}

            {organizerStatus === 0 && (
              <span className="text-yellow-600">Waiting for admin approval...</span>
            )}

            {organizerStatus === 1 && (
              <div className="flex justify-center gap-4">
                <Link to="/my-events">
                  <button className="rounded-full bg-[#6f8b5d] px-5 py-2 text-white">
                    Manage My Events
                  </button>
                </Link>

                <Link to="/shops">
                  <button className="rounded-full border border-[#6f8b5d] px-5 py-2 text-[#6f8b5d] hover:bg-[#6f8b5d] hover:text-white">
                    Browse Shops
                  </button>
                </Link>

                <Link to="/organizer-sponsor-requests">
                  <button className="rounded-full border border-[#6f8b5d] px-5 py-2 text-[#6f8b5d] hover:bg-[#6f8b5d] hover:text-white">
                    Shop Requests
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}

        <h2 className="mb-8 text-center text-2xl">Events</h2>

        <div className="mb-6 flex justify-center">
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-[500px] rounded-full border px-4 py-2"
          />
        </div>

        <div className="mb-8 flex justify-center gap-4">
          <button
            onClick={() => setFilter("popular")}
            className={`rounded-full px-5 py-2 shadow-sm transition ${
              filter === "popular"
                ? "bg-[#6f8b5d] text-white"
                : "border border-[#6f8b5d] text-[#6f8b5d] hover:bg-[#6f8b5d] hover:text-white"
            }`}
          >
            Popular
          </button>

          <button
            onClick={() => setFilter("interested")}
            className={`rounded-full px-5 py-2 shadow-sm transition ${
              filter === "interested"
                ? "bg-[#6f8b5d] text-white"
                : "border border-[#6f8b5d] text-[#6f8b5d] hover:bg-[#6f8b5d] hover:text-white"
            }`}
          >
            Interested
          </button>

          <button
            onClick={() => setFilter("all")}
            className={`rounded-full px-5 py-2 shadow-sm transition ${
              filter === "all"
                ? "bg-[#6f8b5d] text-white"
                : "border border-[#6f8b5d] text-[#6f8b5d] hover:bg-[#6f8b5d] hover:text-white"
            }`}
          >
            All
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => {
            const imageSrc = eventImageMap[event.event_id] || "/Pictrue/Activity.png";

            return (
              <Link
                key={event.event_id}
                to={`/events/${event.event_id}`}
                className="overflow-hidden rounded-xl bg-white shadow-md transition hover:shadow-lg"
              >
                <img
                  src={imageSrc}
                  alt={event.title || "event"}
                  className="h-[170px] w-full object-cover"
                />

                <div className="p-4">
                  <h3 className="text-lg font-semibold">{event.title}</h3>

                  <p className="line-clamp-2 text-sm text-gray-600">{event.description}</p>

                  <p className="mt-2 text-sm font-medium text-[#5D7A4B]">
                    {Number(event.registration_count || 0)} / {Number(event.max_participant || 0)} attending
                  </p>

                  <p className="text-sm text-gray-500">
                    📅 {new Date(event.event_date).toLocaleDateString()}
                  </p>

                  <p className="text-sm text-gray-500">📍 {event.location}</p>

                  <p className="text-red-500">
                    {interestedIds.includes(event.event_id) ? "❤️" : "🤍"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default EventPage;
