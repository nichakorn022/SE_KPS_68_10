import { useEffect, useState } from "react";
import { apiUrl } from "../../lib/api";
import { useAuthModal } from "../../App";
import { Link, useNavigate } from "react-router-dom";
import SiteNavbar from "../components/SiteNavbar";

export default function MyEventsPage() {

  const { token } = useAuthModal();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!token) return;

    fetch(apiUrl("/events/my-events"), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => setEvents(Array.isArray(data) ? data : []))
      .catch(console.error);

  }, [token]);

  // 🔥 DELETE
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event?")) return;

    try {
      const res = await fetch(apiUrl(`/events/${id}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Delete failed");

      setEvents(prev => prev.filter(e => e.event_id !== id));

    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="bg-[#e7e3d8] min-h-screen">

      <SiteNavbar />

      {/* HERO */}
      <div className="relative py-24 text-center bg-cover bg-center"
        style={{ backgroundImage: "url('/Pictrue/Activity.png')" }}>
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="relative text-white">
          <h1 className="text-3xl font-bold">My Events</h1>
          <p>Manage your events</p>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto mt-10 px-5">

        {/* CREATE */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => navigate("/create-event")}
            className="bg-[#6f8b5d] text-white px-5 py-2 rounded-full"
          >
            + Create Event
          </button>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {events.length === 0 ? (
            <p>No events</p>
          ) : (
            events.map(e => (
              <div key={e.event_id}
                className="bg-white rounded-xl shadow p-4">

                <h3 className="font-bold">{e.title}</h3>
                <p>{e.location}</p>

                <div className="flex gap-2 mt-3">

                  <Link to={`/events/${e.event_id}`}>
                    <button className="px-3 py-1 bg-gray-200 rounded">
                      View
                    </button>
                  </Link>

                  <button
                    onClick={() => navigate(`/edit-event/${e.event_id}`)}
                    className="px-3 py-1 bg-yellow-400 rounded"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(e.event_id)}
                    className="px-3 py-1 bg-red-500 text-white rounded"
                  >
                    Delete
                  </button>

                </div>

              </div>
            ))
          )}

        </div>

      </div>

    </div>
  );
}