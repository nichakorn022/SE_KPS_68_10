
import { useAuthModal } from "../../App";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function EventPage() {
  const [events, setEvents] = useState([]);
  const { openLogin } = useAuthModal();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [interested, setInterested] = useState([]);

  useEffect(() => {

    fetch("http://localhost:3001/api/events")
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error(err));

    const saved = JSON.parse(localStorage.getItem("interestedEvents")) || [];
    setInterested(saved);

  }, []);

  const filteredEvents = events
    .filter((event) => {

      if (filter === "interested") {
        return interested.includes(event.event_id);
      }

      if (search) {
        return event.title.toLowerCase().includes(search.toLowerCase());
      }

      return true;

    })
    .sort((a, b) => {

      if (filter === "popular") {
        return b.max_participant - a.max_participant;
      }

      return 0;

    });

  return (
    <div className="bg-[#e7e3d8] min-h-screen">

      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-8 py-2 bg-[#AEBC9F] w-full sticky top-0 z-50 shadow-sm">

        <div className="flex items-center justify-start h-16 w-32 md:w-40">
          <img
            src="./Pictrue/Logo.png"
            alt="ATC Logo"
            className="h-full w-auto object-contain drop-shadow-sm"
          />
        </div>

        <div className="flex items-center gap-6 md:gap-12 text-[17px] font-medium text-[#4a4a4a] pr-4">

          <Link to="/" className="hover:text-black transition-colors underline-offset-4 hover:underline">
            Home
          </Link>

          <Link to="/shop" className="hover:text-black transition-colors underline-offset-4 hover:underline">
            Shop
          </Link>

          <Link to="/events" className="hover:text-black transition-colors underline-offset-4 hover:underline">
            Event
          </Link>

          <button
            onClick={openLogin}
            className="hover:text-black transition-colors underline-offset-4 hover:underline border-l border-black/20 pl-6"
          >
            Login
          </button>

        </div>

      </nav>

      {/* HERO */}
      <div
        className="relative py-24 text-center bg-cover bg-center"
        style={{
          backgroundImage: "url('/Pictrue/Activity.png')"
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="relative text-white">
          <h1 className="text-3xl md:text-4xl font-serif font-bold drop-shadow-lg mb-2">
            ATC Tea Event
          </h1>
          <p className="text-lg">
            กิจกรรมชา และเวิร์คช็อปสำหรับคนรักชา
          </p>
        </div>
      </div>

      {/* EVENTS */}
      <div className="max-w-[1100px] mx-auto mt-10 px-5">

        <h2 className="text-center text-2xl mb-8">
          Events
        </h2>

        {/* SEARCH */}
        <div className="flex flex-col items-center gap-5 mb-8">

          <div className="relative w-full max-w-[500px]">

            <span className="absolute left-4 top-2.5 text-gray-400">
              🔍
            </span>

            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6f8b5d]"
            />

          </div>

          {/* FILTER BUTTONS */}
          <div className="flex gap-4 justify-center">

            <button
              onClick={() => setFilter("popular")}
              className={`px-6 py-2 rounded-full font-medium shadow-sm transition hover:scale-105
              ${filter === "popular"
                ? "bg-[#6f8b5d] text-white"
                : "bg-[#AEBC9F] text-black"}
              `}
            >
              Popular
            </button>

            <button
              onClick={() => setFilter("interested")}
              className={`px-6 py-2 rounded-full font-medium shadow-sm transition hover:scale-105
              ${filter === "interested"
                ? "bg-[#6f8b5d] text-white"
                : "bg-[#AEBC9F] text-black"}
              `}
            >
              Interested
            </button>

            <button
              onClick={() => setFilter("all")}
              className={`px-6 py-2 rounded-full font-medium shadow-sm transition hover:scale-105
              ${filter === "all"
                ? "bg-[#6f8b5d] text-white"
                : "border border-black/40 bg-white"}
              `}
            >
              All
            </button>

          </div>

        </div>

        {/* EVENT GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {filteredEvents.map((event) => {

            const interestedCount = interested.filter(
              (id) => id === event.event_id
            ).length;

            return (

              <Link
                key={event.event_id}
                to={`/events/${event.event_id}`}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
              >

                <img
                  src="/Pictrue/Activity.png"
                  alt="event"
                  className="w-full h-[170px] object-cover"
                />

                <div className="p-4">

                  <h3 className="font-semibold text-lg mb-1">
                    {event.title}
                  </h3>

                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {event.description}
                  </p>

                  <p className="text-sm text-gray-500">
                    📅 {new Date(event.event_date).toLocaleDateString()}
                  </p>

                  <p className="text-sm text-gray-500">
                    📍 {event.location}
                  </p>

                  <p className="text-xs text-gray-400 mt-2">
                    0/{event.max_participant} Joined
                  </p>

                  {/* ⭐ จำนวนคนสนใจ */}
                  <p className="text-xs text-red-500">
                    ❤️ {interestedCount} Interested
                  </p>

                  <div className="mt-3">

                    <span className="bg-[#6f8b5d] text-white px-3 py-1 rounded-lg text-sm">
                      View Event
                    </span>

                  </div>

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

