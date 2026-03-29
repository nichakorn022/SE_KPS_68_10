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

  const [user, setUser] = useState(null);
  const role = user?.role;

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [sponsorStatus, setSponsorStatus] = useState(null);

  // ---------------- PROFILE ----------------
  useEffect(() => {
    if (!token) return;

    fetch(apiUrl("/auth/profile"), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => setUser(data.user))
      .catch(console.error);

  }, [token]);

  // ---------------- LOAD PRODUCTS ----------------
  useEffect(() => {
    if (!token || role !== "shop") return;

    fetch(apiUrl("/products/mine"), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(console.error);

  }, [token, role]);

  // ---------------- LOAD EVENT ----------------
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
        setEvent(null);
        setError(err.message);
      });

    if (token) {
      fetch(apiUrl(`/events/${id}/interested/check`), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => setIsInterested(data.isInterested));

      fetch(apiUrl(`/events/${id}/register/check`), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => setRegistrationStatus(data.registration_status));

    fetch(apiUrl(`/events/${id}/sponsor/check`), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.exists) {
          setSponsorStatus(data.status);
        }
      })
      .catch(console.error);
        }

  }, [id, token]);

  // ---------------- INTEREST ----------------
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

      if (!res.ok) throw new Error(await res.text());

      setIsInterested(!isInterested);

    } catch (err) {
      alert(err.message);
    }
  };

  // ---------------- REGISTER ----------------
  const toggleRegister = async () => {
    if (!token) {
      alert("Please login first");
      return;
    }

    try {
      const method =
        registrationStatus === "pending" ||
        registrationStatus === "confirmed"
          ? "DELETE"
          : "POST";

      const res = await fetch(apiUrl(`/events/${id}/register`), {
        method,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      if (method === "POST") {
        setRegistrationStatus("pending");
      } else {
        setRegistrationStatus("cancelled");
      }

    } catch (err) {
      alert(err.message);
    }
  };

  // ---------------- SPONSOR ----------------
  const sendSponsor = async () => {
    if (!selectedProduct) {
      alert("Please select product");
      return;
    }

    try {
      const res = await fetch(apiUrl(`/events/${id}/sponsor`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          product_id: selectedProduct,
          quantity: quantity
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      alert("Sponsor request sent!");

    } catch (err) {
      alert(err.message);
    }
  };

  if (error) return <div className="p-10 text-red-600">{error}</div>;
  if (!event) return <div className="p-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#F5F3E9] font-sans text-gray-800 flex flex-col items-center">
      <div className="w-full max-w-auto bg-[#F5F3E9] shadow-sm overflow-hidden min-h-screen">

        <SiteNavbar active="events" />

        <div className="p-8">

          <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden grid grid-cols-2">

            {/* LEFT */}
            <div className="p-8">

              <h1 className="text-2xl font-bold mb-3">{event.title}</h1>

              <p className="text-gray-500 mb-4">
                Organizer #{event.organizer_id}
              </p>

              <p>🕒 {new Date(event.event_date).toLocaleDateString()}</p>
              <p className="mt-2">📍 {event.location}</p>

              <div className="mt-4 flex gap-3">
                <span className="bg-green-200 px-3 py-1 rounded-full text-sm">
                  0/{event.max_participant} Will go
                </span>

                <button onClick={toggleInterested}>
                  {isInterested ? "❤️ Interested" : "🤍 Interested"}
                </button>
              </div>

              {/* SELECT PRODUCT */}
              {role === "shop" && (
                <div className="mt-4 flex gap-2">
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="border px-3 py-2 rounded"
                  >
                    <option value="">Select product</option>
                    {products.map(p => (
                      <option key={p.product_id} value={p.product_id}>
                        {p.tea_name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="border px-3 py-2 w-20 rounded"
                    min="1"
                  />
                </div>
              )}

              {/* BUTTON */}
              <div className="mt-6 flex gap-4">

              {role === "shop" ? (
                <button
                  onClick={sendSponsor}
                  disabled={sponsorStatus === "pending" || sponsorStatus === "approved"}
                  className={`px-4 py-2 rounded-full text-white
                    ${sponsorStatus === "pending" && "bg-yellow-500"}
                    ${sponsorStatus === "approved" && "bg-green-500"}
                    ${sponsorStatus === "rejected" && "bg-red-500"}
                    ${!sponsorStatus && "bg-blue-500"}
                  `}
                >
                  {sponsorStatus === "pending"
                    ? "Pending"
                    : sponsorStatus === "approved"
                    ? "Approved"
                    : sponsorStatus === "rejected"
                    ? "Rejected"
                    : "Send Sponsor"}
                </button>
              ) : (
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
                )}

              </div>

              {/* STATUS */}
              {registrationStatus === "pending" && (
                <p className="text-yellow-600 mt-2">⏳ Waiting for payment</p>
              )}

              {registrationStatus === "confirmed" && (
                <p className="text-green-600 mt-2">✅ Payment completed</p>
              )}

              {registrationStatus === "cancelled" && (
                <p className="text-gray-500 mt-2">Cancelled</p>
              )}

              <Link
                to={`/review/${event.event_id}`}
                className="mt-4 inline-block px-4 py-2 bg-[#6f8b5d] text-white rounded"
              >
                Review
              </Link>

            </div>

            {/* RIGHT */}
            <div>
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