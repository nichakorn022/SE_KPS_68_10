import { useEffect, useState } from "react";
import { apiUrl } from "../../lib/api";
import { useAuthModal } from "../../App";
import { Link, useNavigate } from "react-router-dom";
import SiteNavbar from "../components/SiteNavbar";

export default function MySponsorPage() {

  const { token } = useAuthModal();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!token) return;

    fetch(apiUrl("/sponsors/my"), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        console.log("SPONSOR DATA:", data);
        setEvents(Array.isArray(data) ? data : []);
      })
      .catch(console.error);

  }, [token]);

  return (
    <div className="bg-[#e7e3d8] min-h-screen">

      <SiteNavbar />

      {/* HERO */}
      <div
        className="relative py-24 text-center bg-cover bg-center"
        style={{ backgroundImage: "url('/Pictrue/Activity.png')" }}
      >
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="relative text-white">
          <h1 className="text-3xl md:text-4xl font-serif font-bold">
            My Sponsor Events
          </h1>
          <p>กิจกรรมที่คุณกำลังสนับสนุน</p>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto mt-10 px-5">

        {/* 🔥 BACK BUTTON */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          ← Back
        </button>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {events.length === 0 ? (
            <p className="text-center col-span-full text-gray-500">
              No sponsor events
            </p>
          ) : (
            events.map((e) => (

              <Link
                key={e.sponsor_id}
                to={`/events/${e.event_id}`}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
              >

                <img
                  src="/Pictrue/Activity.png"
                  alt="event"
                  className="w-full h-[170px] object-cover"
                />

                <div className="p-4">

                  <h3 className="font-semibold text-lg">
                    {e.event_title}
                  </h3>

                  {/* STATUS */}
                  <p className="mt-2">
                    Status:
                    <span className={`ml-2 font-semibold
                      ${e.status === "pending" && "text-yellow-500"}
                      ${e.status === "approved" && "text-green-500"}
                      ${e.status === "rejected" && "text-red-500"}
                    `}>
                      {e.status}
                    </span>
                  </p>

                </div>

              </Link>

            ))
          )}

        </div>

      </div>

    </div>
  );
}