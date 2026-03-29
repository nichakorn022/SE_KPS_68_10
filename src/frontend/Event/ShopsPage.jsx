import { useEffect, useState } from "react";
import { apiUrl, assetUrl } from "../../lib/api";
import SiteNavbar from "../components/SiteNavbar";
import { useAuthModal } from "../../App";

export default function ShopsPage() {
  const [shops, setShops] = useState([]);
  const [shopImageMap, setShopImageMap] = useState({});
  const [statusMap, setStatusMap] = useState({});
  const [myEvents, setMyEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const { token } = useAuthModal();

  useEffect(() => {
    Promise.all([
      fetch(apiUrl("/shops")).then((res) => res.json()),
      fetch(apiUrl("/shop-images")).then((res) => res.json()).catch(() => []),
    ])
      .then(([shopRows, imageRows]) => {
        setShops(Array.isArray(shopRows) ? shopRows : []);

        const nextImageMap = {};
        (Array.isArray(imageRows) ? imageRows : []).forEach((image) => {
          if (!nextImageMap[image.shop_id] && image.image_path) {
            nextImageMap[image.shop_id] = assetUrl(image.image_path);
          }
        });
        setShopImageMap(nextImageMap);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!token) return;

    fetch(apiUrl("/events/my-events"), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((rows) => setMyEvents(Array.isArray(rows) ? rows : []))
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    if (!selectedEvent || !token || shops.length === 0) {
      setStatusMap({});
      return;
    }

    Promise.all(
      shops.map(async (shop) => {
        try {
          const response = await fetch(
            apiUrl(`/sponsors/check?shop_id=${shop.shop_id}&event_id=${selectedEvent}`),
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const data = await response.json();
          return {
            shopId: shop.shop_id,
            sponsorId: data?.sponsor_id || null,
            status: data?.exists ? data.status : null,
          };
        } catch (error) {
          console.error(error);
          return {
            shopId: shop.shop_id,
            sponsorId: null,
            status: null,
          };
        }
      })
    ).then((rows) => {
      const nextMap = {};
      rows.forEach((row) => {
        if (row.status) {
          nextMap[row.shopId] = {
            sponsorId: row.sponsorId,
            status: row.status,
          };
        }
      });
      setStatusMap(nextMap);
    });
  }, [selectedEvent, shops, token]);

  const requestSponsor = async (shopId) => {
    if (!selectedEvent) {
      alert("Please select event first");
      return;
    }

    try {
      const response = await fetch(apiUrl("/sponsors/request"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shop_id: shopId,
          event_id: selectedEvent,
          request_by: "organizer",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Request failed");
      }

      setStatusMap((current) => ({
        ...current,
        [shopId]: {
          sponsorId: data.sponsor_id,
          status: "pending",
        },
      }));

      alert("Request sent!");
    } catch (error) {
      alert(error.message);
    }
  };

  const getStatusTone = (status) => {
    if (status === "approved") return "text-green-600 bg-green-50 border-green-200";
    if (status === "pending") return "text-yellow-700 bg-yellow-50 border-yellow-200";
    if (status === "rejected") return "text-red-600 bg-red-50 border-red-200";
    if (status === "cancelled") return "text-gray-600 bg-gray-50 border-gray-200";
    return "text-[#6f8b5d] bg-[#eef4e7] border-[#d9e4cf]";
  };

  return (
    <div className="bg-[#e7e3d8] min-h-screen">
      <SiteNavbar />

      <div className="max-w-[1100px] mx-auto mt-10 px-5">
        <h1 className="text-2xl text-center mb-6">Browse Shops</h1>

        <div className="flex justify-center mb-8">
          <select
            value={selectedEvent}
            onChange={(event) => setSelectedEvent(event.target.value)}
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
          {shops.map((shop) => {
            const sponsorInfo = statusMap[shop.shop_id];
            const status = sponsorInfo?.status || null;
            const canRequest = !status || status === "cancelled" || status === "rejected";
            const shopImage = shopImageMap[shop.shop_id] || "/Pictrue/Activity.png";

            return (
              <div key={shop.shop_id} className="overflow-hidden rounded-xl bg-white shadow">
                <img
                  src={shopImage}
                  alt={shop.shop_name}
                  className="h-[180px] w-full object-cover"
                />

                <div className="p-4">
                  <h3 className="font-bold text-lg text-[#24321F]">{shop.shop_name}</h3>
                  <p className="mt-2 text-sm text-gray-600 min-h-[48px]">
                    {shop.description || "No description"}
                  </p>

                  {status && (
                    <div className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusTone(status)}`}>
                      {status}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {canRequest && (
                      <button
                        onClick={() => requestSponsor(shop.shop_id)}
                        disabled={!selectedEvent}
                        className="rounded-full bg-[#6f8b5d] px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {status === "rejected" || status === "cancelled" ? "Send Again" : "Request Sponsor"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
