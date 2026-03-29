import { useAuthModal } from "../../App";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiUrl } from "../../lib/api";
import SiteNavbar from "../components/SiteNavbar";

function EventPage() {
  
  // ----------------------------
  // 🔹 STATE
  // ----------------------------
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
 const [interestedIds, setInterestedIds] = useState([]);
  const [error, setError] = useState(null);
  const [organizerStatus, setOrganizerStatus] = useState(null);

  const { token } = useAuthModal();
  const [user, setUser] = useState(null);
  
  const role = user?.role;



  // ----------------------------
  // 🔥 โหลด events + search จาก DB
  // ----------------------------
useEffect(() => {
  let url = "/events";

  // 🔥 ถ้าเป็น shop → ใช้ API ใหม่
  if (role === "shop") {
    url = "/events/shop/available";
  }

  if (search) {
    url = `/events/search?q=${search}`;
  }

  fetch(apiUrl(url), {
  headers: token
    ? { Authorization: `Bearer ${token}` }
    : {}
})
    .then(res => res.json())
    .then(data => setEvents(Array.isArray(data) ? data : []))
    .catch(console.error);

}, [search, role]);


useEffect(() => {
  if (!token) return;

  fetch(apiUrl("/organizers/me"), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(data => {
      if (data.exists) {
        setOrganizerStatus(data.verified_status);
      } else {
        setOrganizerStatus(null);
      }
    })
    .catch(console.error);

}, [token]);

  // ----------------------------
  // 🔥 โหลด user (เช็ค role)
  // ----------------------------
  useEffect(() => {
    if (!token) return;

    fetch(apiUrl("/auth/profile"), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
      })
      .catch(err => {
        console.error("Profile error:", err);
      });

  }, [token]);


  useEffect(() => {
  if (!token) return;

  fetch(apiUrl("/events/interested/me"), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(data => {
      const ids = data.map(item => item.event_id);
      setInterestedIds(ids);
    })
    .catch(err => {
      console.error("Interested error:", err);
    });

}, [token]);

  // ----------------------------
  // 🔥 FILTER
  // ----------------------------
  const filteredEvents = events
    .filter((event) => {

      if (filter === "interested") {
        return interestedIds.includes(event.event_id);
      }

      return true;

    })
    .sort((a, b) => {

      if (filter === "popular") {
        return b.max_participant - a.max_participant;
      }

      return 0;

    });

  // ----------------------------
  // 🔥 UI
  // ----------------------------
  return (
    <div className="bg-[#e7e3d8] min-h-screen">

      <SiteNavbar active="events" />

      {/* HERO */}
      <div
        className="relative py-24 text-center bg-cover bg-center"
        style={{ backgroundImage: "url('/Pictrue/Activity.png')" }}
      >
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="relative text-white">
          <h1 className="text-3xl md:text-4xl font-serif font-bold">
            ATC Tea Event
          </h1>
          <p>กิจกรรมชา และเวิร์คช็อปสำหรับคนรักชา</p>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto mt-10 px-5">

        {/* 🔥 ROLE DISPLAY */}
        {role && (
          <p className="text-center text-sm text-gray-500 mb-3">
            Logged in as: {role}
          </p>
        )}
        {/* 🔥 SHOP BUTTON */}
{role === "shop" && (
  <div className="flex justify-center mb-6 gap-4">

    {/* 🟢 My Sponsor */}
    <Link to="/my-sponsor">
      <button className="
        bg-[#6f8b5d] 
        text-white 
        px-5 py-2 
        rounded-full 
        shadow-md 
        hover:bg-[#5f7a4e]
      ">
        My Sponsor
      </button>
    </Link>

    {/* 🔥 Requests */}
    <Link to="/sponsor-requests">
      <button className="
        border border-[#6f8b5d] 
        text-[#6f8b5d] 
        px-5 py-2 
        rounded-full 
        hover:bg-[#6f8b5d] 
        hover:text-white
      ">
        Requests
      </button>
    </Link>

  </div>
)}



              {(role === "user" || role === "organizer") && (
  <div className="flex justify-center mb-6">

    {/* ยังไม่สมัคร */}
    {organizerStatus === null && role === "user" && (
      <Link to="/become-organizer">
        <button className="bg-[#6f8b5d] text-white px-5 py-2 rounded-full">
          Become Organizer
        </button>
      </Link>
    )}

    {/* รอ approve */}
    {organizerStatus === 0 && (
      <span className="text-yellow-600">
        Waiting for admin approval...
      </span>
    )}

    {/* ผ่านแล้ว */}
{organizerStatus === 1 && (
  <div className="flex gap-4 justify-center">

    {/* 🎯 Manage Event */}
    <Link to="/my-events">
      <button className="bg-[#6f8b5d] text-white px-5 py-2 rounded-full">
        Manage My Events
      </button>
    </Link>

    {/* 🔥 Browse Shops */}
    <Link to="/shops">
      <button className="border border-[#6f8b5d] text-[#6f8b5d] px-5 py-2 rounded-full hover:bg-[#6f8b5d] hover:text-white">
        Browse Shops
      </button>
    </Link>

  </div>
)}

  </div>
)}

        <h2 className="text-center text-2xl mb-8">
          Events
        </h2>

        {/* SEARCH */}
        <div className="flex justify-center mb-6">
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-[500px] px-4 py-2 rounded-full border"
          />
        </div>

        {/* FILTER */}
              <div className="flex justify-center gap-4 mb-8">

                {/* Popular */}
                <button
                  onClick={() => setFilter("popular")}
                  className={`
                    px-5 py-2 rounded-full transition shadow-sm
                    ${filter === "popular"
                      ? "bg-[#6f8b5d] text-white"
                      : "border border-[#6f8b5d] text-[#6f8b5d] hover:bg-[#6f8b5d] hover:text-white"}
                  `}
                >
                  Popular
                </button>

                {/* Interested */}
                <button
                  onClick={() => setFilter("interested")}
                  className={`
                    px-5 py-2 rounded-full transition shadow-sm
                    ${filter === "interested"
                      ? "bg-[#6f8b5d] text-white"
                      : "border border-[#6f8b5d] text-[#6f8b5d] hover:bg-[#6f8b5d] hover:text-white"}
                  `}
                >
                  Interested
                </button>

                {/* All */}
                <button
                  onClick={() => setFilter("all")}
                  className={`
                    px-5 py-2 rounded-full transition shadow-sm
                    ${filter === "all"
                      ? "bg-[#6f8b5d] text-white"
                      : "border border-[#6f8b5d] text-[#6f8b5d] hover:bg-[#6f8b5d] hover:text-white"}
                  `}
                >
                  All
                </button>

              </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {filteredEvents.map((event) => (

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

                <h3 className="font-semibold text-lg">
                  {event.title}
                </h3>

                <p className="text-sm text-gray-600 line-clamp-2">
                  {event.description}
                </p>

                <p className="text-sm text-gray-500">
                  📅 {new Date(event.event_date).toLocaleDateString()}
                </p>

                <p className="text-sm text-gray-500">
                  📍 {event.location}
                </p>

                {/* ❤️ HEART */}
                <p className="text-red-500">
                  {interestedIds.includes(event.event_id) ? "❤️" : "🤍"}
                </p>

              </div>

            </Link>

          ))}

        </div>

      </div>

    </div>
  );
}

export default EventPage;