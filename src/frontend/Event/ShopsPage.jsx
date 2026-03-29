import { useEffect, useState } from "react";
import { apiUrl } from "../../lib/api";
import SiteNavbar from "../components/SiteNavbar";
import { useAuthModal } from "../../App";

export default function ShopsPage() {
  const [shops, setShops] = useState([]);
  const { token } = useAuthModal();
  const [statusMap, setStatusMap] = useState({});

  const [myEvents, setMyEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");

  useEffect(() => {
    fetch(apiUrl("/shops"))
      .then((res) => res.json())
      .then(setShops)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!token) return;

    fetch(apiUrl("/events/my-events"), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then(setMyEvents)
      .catch(console.error);
  }, [token]);

  useEffect(() => {
  if (!selectedEvent) return;

  shops.forEach(async (shop) => {
    try {
      const res = await fetch(
        apiUrl(`/sponsors/check?shop_id=${shop.shop_id}&event_id=${selectedEvent}`),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();

      if (data.exists) {
        setStatusMap(prev => ({
          ...prev,
          [shop.shop_id]: data.status
        }));
      }

    } catch (err) {
      console.error(err);
    }
  });

}, [selectedEvent, shops]);

const requestSponsor = async (shopId) => {
  if (!selectedEvent) {
    alert("Please select event first");
    return;
  }

  try {
    const res = await fetch(apiUrl("/sponsors/request"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        shop_id: shopId,
        event_id: selectedEvent,
        request_by: "organizer"
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Request failed");
    }

    // 🔥 ใส่ตรงนี้เลย !!!
    setStatusMap(prev => ({
      ...prev,
      [shopId]: "pending"
    }));

    alert("Request sent!");

  } catch (err) {
    alert(err.message);
  }
};

  return (
    <div className="bg-[#e7e3d8] min-h-screen">
      <SiteNavbar />

      <div className="max-w-[1100px] mx-auto mt-10 px-5">
        <h1 className="text-2xl text-center mb-6">
          Browse Shops
        </h1>

        <div className="flex justify-center mb-6">
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="w-full max-w-[420px] px-4 py-2 border rounded-full"
          >
            <option value="">Select your event</option>

            {myEvents.map((event) => (
              <option key={event.event_id} value={event.event_id}>
                {event.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <div key={shop.shop_id} className="bg-white p-4 rounded-xl shadow">
              <h3 className="font-bold">{shop.shop_name}</h3>
              <p>{shop.description}</p>

           {!statusMap[shop.shop_id] && (
                <button
                    onClick={() => requestSponsor(shop.shop_id)}
                    className="mt-3 bg-[#6f8b5d] text-white px-4 py-2 rounded-full"
                >
                    Request Sponsor
                </button>
                )}

                {statusMap[shop.shop_id] === "pending" && (
                <p className="mt-3 text-yellow-500 font-semibold">Pending</p>
                )}

                {statusMap[shop.shop_id] === "approved" && (
                <p className="mt-3 text-green-600 font-semibold">Approved</p>
                )}

                {statusMap[shop.shop_id] === "rejected" && (
                <p className="mt-3 text-red-500 font-semibold">Rejected</p>
                )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}