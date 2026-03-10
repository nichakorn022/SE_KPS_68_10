
import { useEffect, useState } from "react";
import { Link, useParams } from 'react-router-dom';
import { apiUrl } from "../../lib/api";
import SiteNavbar from "../components/SiteNavbar";

export default function Eventdetails() {

  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [interested, setInterested] = useState([]);
  const [error, setError] = useState(null);

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

    const saved = JSON.parse(localStorage.getItem("interestedEvents")) || [];
    setInterested(saved);

  }, [id]);


  const toggleInterested = () => {

    let updated;

    if (interested.includes(event.event_id)) {
      updated = interested.filter(e => e !== event.event_id);
    } else {
      updated = [...interested, event.event_id];
    }

    setInterested(updated);
    localStorage.setItem("interestedEvents", JSON.stringify(updated));
  };


  if (error) return <div className="p-10 text-red-600">ไม่สามารถโหลดข้อมูลกิจกรรมได้: {error}</div>;
  if (!event) return <div className="p-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#F5F3E9] font-sans text-gray-800 flex flex-col items-center">
      <div className="w-full max-w-auto bg-[#F5F3E9] shadow-sm overflow-hidden min-h-screen">

      {/* HEADER */}
      <SiteNavbar active="events" />

      {/* PAGE CONTENT */}
      <div className="p-8">

        {/* MAIN EVENT CARD */}
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden grid grid-cols-2">

          {/* LEFT */}
          <div className="p-8">

            <h1 className="text-2xl font-bold mb-3">
              {event.title}
            </h1>

            <p className="text-gray-500 mb-4">
              Organizer #{event.organizer_id}
            </p>

            <p className="flex items-center gap-2 text-gray-600">
              🕒 {new Date(event.event_date).toLocaleDateString()}
            </p>

            <p className="flex items-center gap-2 text-gray-600 mt-2">
              📍 {event.location}
            </p>

            <div className="mt-4 flex gap-3">

              <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm">
                0/{event.max_participant} Will go
              </span>

              {/* ⭐ ปุ่ม Interested */}
              <button
                onClick={toggleInterested}
                className={`px-3 py-1 rounded-full text-sm
                ${interested.includes(event.event_id)
                  ? "bg-red-200 text-red-800"
                  : "bg-gray-200"}
                `}
              >
                {interested.includes(event.event_id)
                  ? "❤️ Interested"
                  : "🤍 Interested"}
              </button>

            </div>

            {/* DESCRIPTION */}
            <div className="mt-6">
              <h2 className="font-semibold mb-2">Description</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                {event.description}
              </p>
            </div>

            {/* BUTTONS */}
            <div className="mt-6 flex gap-4">

              <button
                className="bg-[#9fb08f] px-6 py-3 rounded-full text-white font-medium hover:opacity-90"
              >
                Chat
              </button>

              <button
                className="px-4 py-2 rounded-full border hover:bg-gray-100"
              >
                Register
              </button>

              <Link
                to={`/review/${event.event_id}`}
                className="px-4 py-2 rounded-full bg-[#6f8b5d] text-white hover:opacity-90"
              >
                Review
              </Link>

            </div>

          </div>

          {/* RIGHT IMAGE */}
          <div className="h-full">
            <img
              src="/Pictrue/Activity.png"
              alt="event"
              className="w-full h-full object-cover"
            />
          </div>

        </div>

      </div>

    </div>
    </div>
  );
}

