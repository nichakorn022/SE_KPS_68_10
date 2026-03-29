import { useEffect, useState } from "react";
import { useAuthModal } from "../../App";
import { apiUrl } from "../../lib/api";
import SiteNavbar from "../components/SiteNavbar";

export default function SponsorRequestsPage() {

  const { token } = useAuthModal();
  const [requests, setRequests] = useState([]);

  // 🔥 โหลด request
  useEffect(() => {
    if (!token) return;

    fetch(apiUrl("/sponsors/my-requests"), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => setRequests(data))
      .catch(console.error);

  }, [token]);

  // ✅ accept
  const handleApprove = async (id) => {
    await fetch(apiUrl(`/sponsors/${id}/approve`), {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` }
    });

    setRequests(prev =>
      prev.map(r =>
        r.sponsor_id === id ? { ...r, status: "approved" } : r
      )
    );
  };

  // ❌ reject
  const handleReject = async (id) => {
    await fetch(apiUrl(`/sponsors/${id}/reject`), {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` }
    });

    setRequests(prev =>
      prev.map(r =>
        r.sponsor_id === id ? { ...r, status: "rejected" } : r
      )
    );
  };

  return (
    <div className="bg-[#e7e3d8] min-h-screen">

      <SiteNavbar />

      <div className="max-w-[1100px] mx-auto mt-10 px-5">

        <h1 className="text-2xl mb-6 text-center">
          Sponsorship Requests
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {requests.map(req => (
            <div key={req.sponsor_id}
              className="bg-white p-4 rounded-xl shadow">

              <h3 className="font-bold">{req.event_title}</h3>
              <p>{req.description}</p>

              {/* STATUS */}
              <p className={`
                mt-2 font-semibold
                ${req.status === "pending" && "text-yellow-500"}
                ${req.status === "approved" && "text-green-600"}
                ${req.status === "rejected" && "text-red-500"}
              `}>
                {req.status}
              </p>

              {/* BUTTON */}
              {req.status === "pending" && (
                <div className="flex gap-2 mt-3">

                  <button
                    onClick={() => handleApprove(req.sponsor_id)}
                    className="bg-green-500 text-white px-3 py-1 rounded"
                  >
                    Accept
                  </button>

                  <button
                    onClick={() => handleReject(req.sponsor_id)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Reject
                  </button>

                </div>
              )}

            </div>
          ))}

        </div>

      </div>

    </div>
  );
}