
import { useEffect, useState } from "react";
import { Link, useParams } from 'react-router-dom';
import { apiUrl } from "../../lib/api";
import SiteNavbar from "../components/SiteNavbar";

import { useAuthModal } from "../../App";

export default function Eventdetails() {

  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [isInterested, setIsInterested] = useState(false);
  const { token } = useAuthModal();
  const [error, setError] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState(null);

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

  if (token) {
    fetch(apiUrl(`/events/${id}/interested/check`), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to check interested");
        }
        return res.json();
      })
      .then((data) => {
        setIsInterested(data.isInterested);
      })
      .catch((err) => {
        console.error(err);
      });

          fetch(apiUrl(`/events/${id}/register/check`), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to check registration");
        }
        return res.json();
      })
      .then((data) => {
        setRegistrationStatus(data.registration_status);
      })
      .catch((err) => {
        console.error(err);
      });
  }

}, [id, token]);


const toggleInterested = async () => {
  if (!token) {
    alert("Please login first");
    return;
  }

  try {
    const method = isInterested ? "DELETE" : "POST";

    const res = await fetch(apiUrl(`/events/${id}/interested`), {
      method,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const text = await res.text(); // 🔥 เพิ่ม
    console.log("STATUS:", res.status);
    console.log("RESPONSE:", text);

    if (!res.ok) {
      throw new Error(text);
    }

    setIsInterested(!isInterested);

  } catch (err) {
    console.error(err);
    alert("ERROR: " + err.message); // 🔥 จะเห็น error จริง
  }
};

const toggleRegister = async () => {
  if (!token) {
    alert("Please login first");
    return;
  }

  try {
    const method = registrationStatus === "pending" || registrationStatus === "confirmed"
      ? "DELETE"
      : "POST";

    const res = await fetch(apiUrl(`/events/${id}/register`), {
      method,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Register failed");
    }

    if (method === "POST") {
      setRegistrationStatus("pending");
    } else {
      setRegistrationStatus("cancelled");
    }

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
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
                  ${isInterested
                    ? "bg-red-200 text-red-800"
                    : "bg-gray-200"}
                  `}
              >
                        {isInterested
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
              onClick={toggleRegister}
              className="px-4 py-2 rounded-full border hover:bg-gray-100"
            >
              {registrationStatus === "pending"
                ? "Waiting for payment"
                : registrationStatus === "confirmed"
                ? "Registered"
                : "Register"}
            </button>

              {registrationStatus === "pending" && (
                <p className="text-sm text-yellow-600 mt-2">
                  ⏳ Waiting for payment
                </p>
              )}

              {registrationStatus === "confirmed" && (
                <p className="text-sm text-green-600 mt-2">
                  ✅ Payment completed
                </p>
              )}

              {registrationStatus === "cancelled" && (
                <p className="text-sm text-gray-500 mt-2">
                  Registration cancelled
                </p>
              )}

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

