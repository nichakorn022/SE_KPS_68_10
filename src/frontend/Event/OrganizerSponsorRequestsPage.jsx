import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthModal } from "../../App";
import { apiUrl, assetUrl } from "../../lib/api";
import SiteNavbar from "../components/SiteNavbar";

function formatPrice(value) {
  if (value === null || value === undefined || value === "") return "-";
  const amount = Number(value);
  if (Number.isNaN(amount)) return "-";
  return `THB ${amount.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getStatusClasses(status) {
  if (status === "approved") return "bg-green-50 border-green-200 text-green-600";
  if (status === "rejected") return "bg-red-50 border-red-200 text-red-500";
  if (status === "cancelled") return "bg-gray-50 border-gray-200 text-gray-500";
  return "bg-yellow-50 border-yellow-200 text-yellow-600";
}

export default function OrganizerSponsorRequestsPage() {
  const { token } = useAuthModal();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (!token) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    fetch(apiUrl("/sponsors/organizer-requests"), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setRequests(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error(error);
        setRequests([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const updateRequestStatus = async (id, nextStatus) => {
    setUpdatingId(id);

    try {
      const response = await fetch(
        apiUrl(`/sponsors/${id}/${nextStatus === "approved" ? "organizer-approve" : "organizer-reject"}`),
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || `${nextStatus} failed`);
        return;
      }

      setRequests((current) =>
        current.map((item) =>
          item.sponsor_id === id ? { ...item, status: nextStatus } : item
        )
      );
    } catch (error) {
      console.error(error);
      alert("Unable to update sponsor request");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#e7e3d8]">
      <SiteNavbar active="events" />

      <div className="mx-auto max-w-[1180px] px-5 py-10 pb-14">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-[#8d9577]">Organizer</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#24321F]">Shop Sponsor Requests</h1>
          <p className="mt-3 text-sm text-[#6f6b63]">
            Review sponsor offers sent from shops for your events
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center text-[#7b776e] shadow">
            Loading sponsor requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center text-[#7b776e] shadow">
            No sponsor requests from shops yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {requests.map((request) => {
              const eventImage = request.event_image_path
                ? assetUrl(request.event_image_path)
                : "/Pictrue/Activity.png";
              const shopImage = request.shop_image_path
                ? assetUrl(request.shop_image_path)
                : "/Pictrue/Activity.png";
              const productImage = request.product_image_path
                ? assetUrl(request.product_image_path)
                : shopImage;

              return (
                <div key={request.sponsor_id} className="overflow-hidden rounded-[26px] bg-white shadow">
                  <img
                    src={eventImage}
                    alt={request.event_title || "event"}
                    className="h-[220px] w-full object-cover"
                  />

                  <div className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-[#8d9577]">
                          Event #{request.event_id}
                        </p>
                        <h2 className="mt-2 text-xl font-semibold text-[#24321F]">
                          {request.event_title}
                        </h2>
                      </div>

                      <div
                        className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusClasses(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </div>
                    </div>

                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#5f5a52]">
                      {request.event_description || "No description"}
                    </p>

                    <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-[#4f4a43] sm:grid-cols-3">
                      <div className="rounded-xl bg-[#f7f3eb] px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.12em] text-[#8d9577]">Date</p>
                        <p className="mt-1">{formatDate(request.event_date)}</p>
                      </div>

                      <div className="rounded-xl bg-[#f7f3eb] px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.12em] text-[#8d9577]">Price</p>
                        <p className="mt-1">{formatPrice(request.event_price)}</p>
                      </div>

                      <div className="rounded-xl bg-[#f7f3eb] px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.12em] text-[#8d9577]">Capacity</p>
                        <p className="mt-1">
                          {request.event_capacity ? `${request.event_capacity} people` : "-"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-[#ede7db] bg-[#fcfbf8] p-4">
                        <div className="flex items-start gap-3">
                          <img
                            src={shopImage}
                            alt={request.shop_name || "shop"}
                            className="h-16 w-16 rounded-2xl object-cover"
                          />
                          <div className="min-w-0">
                            <p className="text-xs uppercase tracking-[0.14em] text-[#8d9577]">Shop</p>
                            <p className="mt-1 text-base font-semibold text-[#24321F]">
                              {request.shop_name || `Shop ${request.shop_id}`}
                            </p>
                            <p className="mt-2 line-clamp-3 text-sm text-[#5f5a52]">
                              {request.shop_description || "No shop description"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#ede7db] bg-[#fcfbf8] p-4">
                        <div className="flex items-start gap-3">
                          <img
                            src={productImage}
                            alt={request.product_name || "product"}
                            className="h-16 w-16 rounded-2xl object-cover"
                          />
                          <div className="min-w-0">
                            <p className="text-xs uppercase tracking-[0.14em] text-[#8d9577]">
                              Sponsor Product
                            </p>
                            <p className="mt-1 text-base font-semibold text-[#24321F]">
                              {request.product_name || `Product ${request.product_id || ""}`}
                            </p>
                            <p className="mt-2 text-sm text-[#5f5a52]">
                              Quantity: {request.quantity || "-"}
                            </p>
                            <p className="mt-1 text-sm text-[#5f5a52]">
                              Product Price: {formatPrice(request.product_price)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {request.event_location && (
                      <div className="mt-4 rounded-xl bg-[#f7f3eb] px-4 py-3 text-sm text-[#4f4a43]">
                        <p className="text-xs uppercase tracking-[0.12em] text-[#8d9577]">Location</p>
                        <p className="mt-1">{request.event_location}</p>
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Link
                        to={`/events/${request.event_id}`}
                        className="rounded-full border border-[#d9d2c6] px-4 py-2 text-sm text-[#5f5a52] hover:bg-[#f7f3eb]"
                      >
                        View Event
                      </Link>

                      <Link
                        to={`/shop/${request.shop_id}`}
                        className="rounded-full border border-[#d9d2c6] px-4 py-2 text-sm text-[#5f5a52] hover:bg-[#f7f3eb]"
                      >
                        View Shop
                      </Link>

                      {request.status === "pending" && (
                        <>
                          <button
                            onClick={() => updateRequestStatus(request.sponsor_id, "approved")}
                            disabled={updatingId === request.sponsor_id}
                            className="rounded-full bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {updatingId === request.sponsor_id ? "Updating..." : "Accept"}
                          </button>

                          <button
                            onClick={() => updateRequestStatus(request.sponsor_id, "rejected")}
                            disabled={updatingId === request.sponsor_id}
                            className="rounded-full bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {updatingId === request.sponsor_id ? "Updating..." : "Reject"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
