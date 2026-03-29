import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../../lib/api";
import { useAuthModal } from "../../App";
import SiteNavbar from "../components/SiteNavbar";
import { useEffect } from "react";

export default function CreateEventPage() {
  const navigate = useNavigate();
  const { token } = useAuthModal();

  const [organizerStatus, setOrganizerStatus] = useState(null);
  const [checkingOrganizer, setCheckingOrganizer] = useState(true);

  // Check organizer status
  useEffect(() => {
    if (!token) return;
    
    fetch(apiUrl("/organizers/me"), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setOrganizerStatus(data);
        setCheckingOrganizer(false);
      })
      .catch(err => {
        console.error(err);
        setCheckingOrganizer(false);
      });
  }, [token]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    location: "",
    max_participant: "",
    price: ""
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file || null);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setErrorCode(null);
    setLoading(true);

    // Validation
    if (!formData.title || !formData.event_date || !formData.location || !formData.max_participant || !formData.price) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(apiUrl("/events"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...formData,
          max_participant: parseInt(formData.max_participant),
          price: parseFloat(formData.price)
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to create event");
        setErrorCode(data.code || null);
        return;
      }

      const newEventId = data.event_id;

      if (imageFile) {
        try {
          const imagePayload = new FormData();
          imagePayload.append("event_id", String(newEventId));
          imagePayload.append("image", imageFile);

          const imageRes = await fetch(apiUrl("/event-images"), {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: imagePayload,
          });

          if (!imageRes.ok) {
            const imageData = await imageRes.json();
            console.warn("Event image upload failed", imageData);
            alert("Event created, but image upload failed: " + (imageData.message || "Unknown error"));
          } else {
            setImageFile(null);
            setImagePreview(null);
          }
        } catch (imgErr) {
          console.error("Event image upload failed", imgErr);
          alert("Event created, but image upload failed: " + imgErr.message);
        }
      }

      alert("Event created successfully!");
      navigate("/my-events");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3E9]">
      <SiteNavbar />

      <div className="max-w-[700px] mx-auto px-5 py-12">

        {/* Warning - Not verified organizer */}
        {!checkingOrganizer && (!organizerStatus?.exists || organizerStatus?.verified_status !== 1) && (
          <div className="mb-6 p-4 rounded-[1.5rem] border border-amber-200 bg-amber-50">
            <p className="text-sm font-semibold text-amber-800 mb-2">⚠️ Not a verified organizer</p>
            <p className="text-xs text-amber-700 mb-3">
              You need to be a verified organizer to create events.
            </p>
            <button
              onClick={() => navigate("/become-organizer")}
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline"
            >
              Complete organizer registration →
            </button>
          </div>
        )}

        <div className="bg-white rounded-[2rem] border border-[#DFE6D6] shadow-[0_24px_64px_rgba(72,91,59,0.10)] p-8">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-[#253621]">Create Event</h1>
            <p className="text-sm text-[#879A78] mt-2">Fill in the details to create your event</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-[1rem] border border-red-200 bg-red-50 text-sm text-red-600">
              {error}
              {errorCode === "NOT_VERIFIED_ORGANIZER" && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-xs">
                    Please <a href="/become-organizer" className="underline font-semibold hover:text-red-700">become an organizer</a> first and wait for admin approval.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" style={{opacity: organizerStatus?.verified_status === 1 ? 1 : 0.6, pointerEvents: organizerStatus?.verified_status === 1 ? 'auto' : 'none'}}>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-[#253621] mb-2">
                Event Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter event title"
                className="w-full border border-[#DFE6D6] rounded-[1rem] px-4 py-3 text-sm text-[#253621] bg-white focus:outline-none focus:ring-2 focus:ring-[#6f8b5d]/30"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-[#253621] mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter event description"
                rows="5"
                className="w-full border border-[#DFE6D6] rounded-[1rem] px-4 py-3 text-sm text-[#253621] bg-white focus:outline-none focus:ring-2 focus:ring-[#6f8b5d]/30"
              />
            </div>

            {/* Event Date */}
            <div>
              <label className="block text-sm font-semibold text-[#253621] mb-2">
                Event Date
              </label>
              <input
                type="datetime-local"
                name="event_date"
                value={formData.event_date}
                onChange={handleChange}
                className="w-full border border-[#DFE6D6] rounded-[1rem] px-4 py-3 text-sm text-[#253621] bg-white focus:outline-none focus:ring-2 focus:ring-[#6f8b5d]/30"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-[#253621] mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter event location"
                className="w-full border border-[#DFE6D6] rounded-[1rem] px-4 py-3 text-sm text-[#253621] bg-white focus:outline-none focus:ring-2 focus:ring-[#6f8b5d]/30"
              />
            </div>

            {/* Max Participant */}
            <div>
              <label className="block text-sm font-semibold text-[#253621] mb-2">
                Max Participants
              </label>
              <input
                type="number"
                name="max_participant"
                value={formData.max_participant}
                onChange={handleChange}
                placeholder="Enter maximum number of participants"
                min="1"
                className="w-full border border-[#DFE6D6] rounded-[1rem] px-4 py-3 text-sm text-[#253621] bg-white focus:outline-none focus:ring-2 focus:ring-[#6f8b5d]/30"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-[#253621] mb-2">
                Price (฿)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="Enter event price"
                min="0"
                step="0.01"
                className="w-full border border-[#DFE6D6] rounded-[1rem] px-4 py-3 text-sm text-[#253621] bg-white focus:outline-none focus:ring-2 focus:ring-[#6f8b5d]/30"
              />
            </div>

            {/* Event Image */}
            <div>
              <label className="block text-sm font-semibold text-[#253621] mb-2">
                Event Image (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full border border-[#DFE6D6] rounded-[1rem] px-4 py-2 text-sm text-[#253621] bg-white"
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Event preview"
                  className="mt-3 w-40 h-40 object-cover rounded-lg border border-[#DFE6D6]"
                />
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#485B3B] text-white py-3 rounded-[1rem] font-semibold shadow-[0_8px_20px_rgba(72,91,59,0.15)] hover:bg-[#394A31] transition-all duration-300 disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Event"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/my-events")}
                className="flex-1 border border-[#DFE6D6] bg-white text-[#6f665b] py-3 rounded-[1rem] font-semibold hover:bg-[#F5F3E9] transition-all duration-300"
              >
                Cancel
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}
