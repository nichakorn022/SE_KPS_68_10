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

export default function SponsorRequestsPage() {
  const { token } = useAuthModal();
  const [requests, setRequests] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (!token) return;

    fetch(apiUrl("/sponsors/my-requests"), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [token]);

  const updateRequestStatus = async (id, nextStatus) => {
    setUpdatingId(id);

    try {
      const response = await fetch(apiUrl(`/sponsors/${id}/${nextStatus === "approved" ? "approve" : "reject"}`), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

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
      alert("Unable to update sponsor request");
      console.error(error);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusClasses = (status) => {
    if (status === "approved") return "bg-green-50 border-green-200 text-green-600";
    if (status === "rejected") return "bg-red-50 border-red-200 text-red-500";
    return "bg-yellow-50 border-yellow-200 text-yellow-600";
  };

  return (
    <div className="bg-[#e7e3d8] min-h-screen">
      <SiteNavbar />

      <div className="max-w-[1100px] mx-auto mt-10 px-5 pb-12">
        <h1 className="text-2xl mb-2 text-center">Sponsorship Requests</h1>
        <p className="mb-8 text-center text-sm text-[#6f6b63]">
          Event requests from organizers who want your shop to join as a sponsor
        </p>

        {requests.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center text-[#7b776e] shadow">
            No sponsorship requests yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {requests.map((request) => {
              const imageSrc = request.event_image_path
                ? assetUrl(request.event_image_path)
                : "/Pictrue/Activity.png";
              const hasPrice =
                request.event_price !== null &&
                request.event_price !== undefined &&
                request.event_price !== "";
              const hasCapacity =
                request.event_capacity !== null &&
                request.event_capacity !== undefined &&
                request.event_capacity !== "";

              return (
                <div key={request.sponsor_id} className="overflow-hidden rounded-2xl bg-white shadow">
                  <img
                    src={imageSrc}
                    alt={request.event_title}
                    className="h-[220px] w-full object-cover"
                  />

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-[#8d9577]">
                          Event Request
                        </p>
                        <h3 className="mt-2 text-xl font-semibold text-[#24321F]">
                          {request.event_title}
                        </h3>
                      </div>

                      <div
                        className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusClasses(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-[#5f5a52]">
                      {request.event_description || "No description"}
                    </p>

                    {(hasPrice || hasCapacity) && (
                      <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-[#4f4a43] sm:grid-cols-2">
                        {hasPrice && (
                          <div className="rounded-xl bg-[#f7f3eb] px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.12em] text-[#8d9577]">Price</p>
                            <p className="mt-1">{formatPrice(request.event_price)}</p>
                          </div>
                        )}

                        {hasCapacity && (
                          <div className="rounded-xl bg-[#f7f3eb] px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.12em] text-[#8d9577]">Capacity</p>
                            <p className="mt-1">{`${request.event_capacity} people`}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Link
                        to={`/events/${request.event_id}`}
                        className="rounded-full border border-[#d9d2c6] px-4 py-2 text-sm text-[#5f5a52] hover:bg-[#f7f3eb]"
                      >
                        View Event
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
