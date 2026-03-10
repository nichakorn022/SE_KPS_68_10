
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function EventPage() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/api/events")
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="bg-[#e7e3d8] min-h-screen">

      {/* NAVBAR (เหมือนหน้า Home / Shop) */}
      <nav className="flex items-center justify-between px-8 py-2 bg-[#AEBC9F] w-full sticky top-0 z-50 shadow-sm">
        
        <div className="flex items-center justify-start h-16 w-32 md:w-40">
          <img
            src="./Pictrue/Logo.png"
            alt="ATC Logo"
            className="h-full w-auto object-contain drop-shadow-sm"
          />
        </div>

        <div className="flex items-center gap-6 md:gap-12 text-[17px] font-medium text-[#4a4a4a] pr-4">
          <Link to="/" className="hover:text-black transition-colors underline-offset-4 hover:underline">
            Home
          </Link>

          <Link to="/shop" className="hover:text-black transition-colors underline-offset-4 hover:underline">
            Shop
          </Link>

          <Link to="/events" className="hover:text-black transition-colors underline-offset-4 hover:underline">
            Event
          </Link>

          <Link
            to="/login"
            className="hover:text-black transition-colors underline-offset-4 hover:underline border-l border-black/20 pl-6"
          >
            Login
          </Link>
        </div>

      </nav>

      {/* HERO */}
      <div
  className="relative py-24 text-center bg-cover bg-center"
  style={{
    backgroundImage: "url('/Pictrue/Activity.png')"
  }}
>
  <div className="absolute inset-0 bg-black/40"></div>

  <div className="relative text-white">
     <h1 className="text-3xl md:text-4xl font-serif text-white font-bold drop-shadow-lg mb-2">ATC Tea Shop</h1>
    <p className="text-lg">กิจกรรมชา และเวิร์คช็อปสำหรับคนรักชา</p>
  </div>
</div>

      {/* EVENTS */}
      <div className="max-w-[1000px] mx-auto mt-10 px-5">
        <h2 className="text-center text-2xl mb-8">Events</h2>


{events.map((event) => (
  <div
    key={event.event_id}
    className="bg-white rounded-xl p-6 mb-6 flex justify-between items-center shadow-md"
  >
    {/* LEFT CONTENT */}
    <div className="flex-1">
      <h3 className="text-lg font-semibold mb-1">{event.title}</h3>

      <p className="text-gray-600 mb-2">{event.description}</p>

      <p>📅 {new Date(event.event_date).toLocaleDateString()}</p>
      <p>📍 {event.location}</p>

      {/* JOINED COUNT */}
      <p className="text-sm text-gray-500 mt-2">
  0/{event.max_participant} Joined
      </p>

      {/* BUTTON */}
      <Link
  to={`/events/${event.event_id}`}
  className="mt-3 inline-block bg-[#6f8b5d] text-white px-4 py-2 rounded-lg hover:opacity-90"
>
  View More
</Link>
    </div>

    {/* IMAGE */}
    <img
      src="https://images.unsplash.com/photo-1509042239860-f550ce710b93"
      alt="event"
      className="w-[200px] h-[130px] object-cover rounded-lg ml-5"
    />
  </div>
))}
      </div>

    </div>
  );
}

export default EventPage;

